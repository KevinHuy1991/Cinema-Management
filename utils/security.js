/**
 * Cinema Management System - Cybersecurity & Authentication Infrastructure
 * Triển khai các chuẩn bảo mật:
 * 1. Password Hashing: bcrypt (10 rounds) với salt bảo mật.
 * 2. JWT Authentication: HMAC-SHA256 Token với HttpOnly Cookie.
 * 3. Authorization Guard: Phân quyền & Cô lập dữ liệu Cluster-based (401 / 403).
 * 4. Environment Variables Loader (.env).
 * 5. Security Headers (X-Frame-Options, CSP, nosniff) & CORS Whitelist.
 */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ============================================================================
// 1. TẢI VÀ QUẢN LÝ BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)
// ============================================================================
function loadEnvironmentVariables(envFilePath = ".env") {
  const resolvedPath = path.resolve(envFilePath);
  if (fs.existsSync(resolvedPath)) {
    try {
      const content = fs.readFileSync(resolvedPath, "utf8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmed.slice(0, equalIndex).trim();
          let value = trimmed.slice(equalIndex + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = value;
          }
        }
      }
    } catch (err) {
      console.warn("[SECURITY] Không thể đọc file .env:", err.message);
    }
  }
}

// Tự động load .env khi import module
loadEnvironmentVariables();

// Cấu hình chuẩn bảo mật hệ thống
const isProduction = process.env.NODE_ENV === "production";
const defaultJwtSecret = "cinema_cluster_super_secret_jwt_key_2026_xyz";

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === defaultJwtSecret)) {
  console.error("================================================================================");
  console.error(" [BẢO MẬT] LỖI NGHIÊM TRỌNG: Đang chạy môi trường PRODUCTION (NODE_ENV=production)");
  console.error(" nhưng chưa cấu hình biến môi trường JWT_SECRET hoặc vẫn dùng khóa mặc định!");
  console.error(" Vui lòng thiết lập chuỗi khóa bí mật ngẫu nhiên mạnh (>= 32 ký tự) trong .env / Render!");
  console.error("================================================================================");
  throw new Error("PRODUCTION SECURITY ERROR: JWT_SECRET must be configured with a strong non-default secret.");
}

const SecurityConfig = {
  JWT_SECRET: process.env.JWT_SECRET || defaultJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "4h",
  COOKIE_NAME: "admin_jwt",
  COOKIE_MAX_AGE_MS: 4 * 60 * 60 * 1000, // 4 tiếng
  IS_PRODUCTION: isProduction,
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "http://localhost:8099,http://127.0.0.1:8099")
    .split(",")
    .map(s => s.trim().toLowerCase())
};

// ============================================================================
// 2. BĂM MẬT KHẨU (PASSWORD HASHING) - BCRYPT
// ============================================================================

/**
 * Băm mật khẩu người dùng/quản trị viên với bcrypt salt rounds = 10
 * @param {string} plainPassword 
 * @returns {string} bcrypt hashed password
 */
function hashPassword(plainPassword) {
  if (!plainPassword) throw new Error("Mật khẩu không được để trống!");
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

/**
 * So sánh mật khẩu người dùng nhập vào với mật khẩu đã băm (hoặc plain-text hỗ trợ migration)
 * @param {string} plainPassword 
 * @param {string} hashedPasswordOrPlain 
 * @returns {boolean}
 */
function comparePassword(plainPassword, hashedPasswordOrPlain) {
  if (!plainPassword || !hashedPasswordOrPlain) return false;
  // Kiểm tra xem chuỗi có phải định dạng bcrypt ($2a$, $2b$, $2y$) không
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hashedPasswordOrPlain)) {
    return bcrypt.compareSync(plainPassword, hashedPasswordOrPlain);
  }
  // Fallback tạm thời nếu dữ liệu cũ chưa băm (an toàn cho migration ban đầu)
  return plainPassword === hashedPasswordOrPlain;
}

// ============================================================================
// 2B. RATE LIMITING & BRUTE-FORCE PROTECTION (PHÒNG THỦ TẤN CÔNG ĐĂNG NHẬP)
// ============================================================================

const loginAttemptTracker = new Map(); // ip -> { count: number, firstAttempt: number, blockedUntil: number }

/**
 * Kiểm tra IP có vượt ngưỡng giới hạn đăng nhập không (Chống Brute-force & Credential Stuffing)
 * @param {string} ip 
 * @param {number} maxAttempts Số lần thử sai tối đa (mặc định 5 lần)
 * @param {number} windowMs Cửa sổ thời gian tính lần thử (15 phút)
 * @returns {{ allowed: boolean, remainingMinutes?: number, message?: string }}
 */
function checkRateLimit(ip, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const cleanIp = String(ip || "127.0.0.1").replace(/^.*:/, "").trim();
  const record = loginAttemptTracker.get(cleanIp);

  if (record) {
    if (record.blockedUntil && record.blockedUntil > now) {
      const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      return {
        allowed: false,
        remainingMinutes,
        message: `Bạn đã thử đăng nhập thất bại quá nhiều lần! Vui lòng thử lại sau ${remainingMinutes} phút.`
      };
    }
    // Hết cửa sổ thời gian -> reset
    if (now - record.firstAttempt > windowMs) {
      loginAttemptTracker.delete(cleanIp);
    }
  }

  return { allowed: true };
}

/**
 * Ghi nhận kết quả đăng nhập của IP để cập nhật cờ giới hạn
 * @param {string} ip 
 * @param {boolean} success 
 * @param {number} maxAttempts 
 * @param {number} blockDurationMs Thời gian khóa khi vi phạm (15 phút)
 */
function recordLoginAttempt(ip, success, maxAttempts = 5, blockDurationMs = 15 * 60 * 1000) {
  const now = Date.now();
  const cleanIp = String(ip || "127.0.0.1").replace(/^.*:/, "").trim();

  if (success) {
    loginAttemptTracker.delete(cleanIp);
    return;
  }

  let record = loginAttemptTracker.get(cleanIp);
  if (!record || (now - record.firstAttempt > blockDurationMs)) {
    record = { count: 1, firstAttempt: now, blockedUntil: 0 };
  } else {
    record.count++;
    if (record.count >= maxAttempts) {
      record.blockedUntil = now + blockDurationMs;
    }
  }
  loginAttemptTracker.set(cleanIp, record);
}

// ============================================================================
// 3. XÁC THỰC PHIÊN ĐĂNG NHẬP (JWT AUTHENTICATION & HTTPONLY COOKIE)
// ============================================================================

/**
 * Tạo JWT token chứa thông tin nhận diện tài khoản quản trị cụm rạp
 * Payload: { user_id, cluster_id, role, cinemaName }
 */
function signClusterToken(payload) {
  return jwt.sign(payload, SecurityConfig.JWT_SECRET, {
    expiresIn: SecurityConfig.JWT_EXPIRES_IN,
    issuer: "CinemaManagementSecurity"
  });
}

/**
 * Giải mã và kiểm tra tính hợp lệ của chữ ký JWT
 */
function verifyClusterToken(token) {
  return jwt.verify(token, SecurityConfig.JWT_SECRET, {
    issuer: "CinemaManagementSecurity"
  });
}

/**
 * Parse Cookie header từ request thành Object key-value
 */
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach(cookie => {
    const parts = cookie.split("=");
    const name = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (name) list[name] = decodeURIComponent(val);
  });
  return list;
}

/**
 * Trích xuất JWT token từ HttpOnly Cookie hoặc Authorization Header (Bearer token)
 */
function extractTokenFromRequest(req) {
  // 1. Ưu tiên HttpOnly Cookie (chống XSS)
  if (req.headers && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies[SecurityConfig.COOKIE_NAME]) {
      return cookies[SecurityConfig.COOKIE_NAME];
    }
  }

  // 2. Fallback: Authorization: Bearer <token> (hỗ trợ Postman / Integration Tests)
  if (req.headers && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7).trim();
    }
  }

  return null;
}

/**
 * Sinh chuỗi header Set-Cookie an toàn (HttpOnly, SameSite, Secure)
 */
function buildAuthCookieHeader(token) {
  const maxAgeSec = Math.floor(SecurityConfig.COOKIE_MAX_AGE_MS / 1000);
  const flags = [
    `${SecurityConfig.COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSec}`
  ];
  if (SecurityConfig.IS_PRODUCTION) {
    flags.push("Secure");
  }
  return flags.join("; ");
}

/**
 * Sinh chuỗi header xóa HttpOnly Cookie khi đăng xuất
 */
function buildClearCookieHeader() {
  const flags = [
    `${SecurityConfig.COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0"
  ];
  if (SecurityConfig.IS_PRODUCTION) {
    flags.push("Secure");
  }
  return flags.join("; ");
}

// ============================================================================
// 4. PHÂN QUYỀN VÀ BẢO VỆ ROUTE (AUTHORIZATION GUARD / MIDDLEWARE)
// ============================================================================

/**
 * Authorization Guard kiểm soát quyền truy cập API quản trị
 * @param {object} req 
 * @param {object} res 
 * @param {object} options { requiredRole, targetClusterId }
 * @returns {object|null} Decoded user payload nếu hợp lệ, ngược lại trả về null (đã tự động phản hồi lỗi 401/403)
 */
function clusterAuthGuard(req, res, options = {}) {
  const token = extractTokenFromRequest(req);
  if (!token) {
    res.writeHead(401, {
      "Content-Type": "application/json; charset=utf-8",
      ...getSecurityHeaders()
    });
    res.end(JSON.stringify({
      success: false,
      code: "UNAUTHORIZED_NO_TOKEN",
      message: "Yêu cầu đăng nhập quản trị viên! Token xác thực không tồn tại trong phiên làm việc."
    }));
    return null;
  }

  let decoded;
  try {
    decoded = verifyClusterToken(token);
  } catch (err) {
    res.writeHead(401, {
      "Content-Type": "application/json; charset=utf-8",
      ...getSecurityHeaders()
    });
    res.end(JSON.stringify({
      success: false,
      code: "UNAUTHORIZED_INVALID_TOKEN",
      message: "Phiên làm việc quản trị đã hết hạn hoặc chữ ký token không hợp lệ. Vui lòng đăng nhập lại!",
      error: err.message
    }));
    return null;
  }

  // 1. Kiểm tra vai trò (Role-based check)
  if (options.requiredRole && decoded.role !== options.requiredRole && decoded.role !== "super_admin") {
    res.writeHead(403, {
      "Content-Type": "application/json; charset=utf-8",
      ...getSecurityHeaders()
    });
    res.end(JSON.stringify({
      success: false,
      code: "FORBIDDEN_INSUFFICIENT_ROLE",
      message: `Truy cập bị từ chối! Vai trò [${decoded.role}] không được phép thực hiện thao tác này.`
    }));
    return null;
  }

  // 2. Cô lập dữ liệu theo cụm rạp (Cluster-based Data Isolation Guard)
  if (options.targetClusterId && decoded.role !== "super_admin") {
    const targetCluster = String(options.targetClusterId).trim();
    const userCluster = String(decoded.cluster_id).trim();

    if (targetCluster !== "all" && targetCluster !== userCluster) {
      res.writeHead(403, {
        "Content-Type": "application/json; charset=utf-8",
        ...getSecurityHeaders()
      });
      res.end(JSON.stringify({
        success: false,
        code: "FORBIDDEN_CROSS_CLUSTER_ACCESS",
        message: `Truy cập bị từ chối! Quản lý cụm rạp [${userCluster}] không có thẩm quyền truy xuất hoặc chỉnh sửa dữ liệu của cụm rạp [${targetCluster}].`
      }));
      return null;
    }
  }

  req.user = decoded;
  return decoded;
}

// ============================================================================
// 5. BẢO MẬT WEB BỔ SUNG (SECURITY HEADERS & CORS WHITELIST)
// ============================================================================

/**
 * Trả về tập hợp các HTTP Security Headers chuẩn OWASP
 */
function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;"
  };
}

/**
 * Kiểm tra và gắn các CORS Headers chặt chẽ theo whitelist
 */
function applyCorsAndSecurityHeaders(req, res) {
  const origin = req.headers && req.headers.origin ? req.headers.origin.toLowerCase() : "";
  const allowed = !origin || SecurityConfig.ALLOWED_ORIGINS.includes(origin);

  // Gắn Security Headers
  const secHeaders = getSecurityHeaders();
  for (const [key, val] of Object.entries(secHeaders)) {
    res.setHeader(key, val);
  }

  // Gắn CORS Headers
  if (origin && allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    // Same-origin request
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

module.exports = {
  SecurityConfig,
  loadEnvironmentVariables,
  hashPassword,
  comparePassword,
  signClusterToken,
  verifyClusterToken,
  parseCookies,
  extractTokenFromRequest,
  buildAuthCookieHeader,
  buildClearCookieHeader,
  clusterAuthGuard,
  getSecurityHeaders,
  applyCorsAndSecurityHeaders,
  checkRateLimit,
  recordLoginAttempt
};

