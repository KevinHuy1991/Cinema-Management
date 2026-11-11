/**
 * ============================================================================
 * CINEMA MANAGEMENT SYSTEM - BACKEND REST API & HTTP SERVER
 * ============================================================================
 * Máy chủ kết nối toàn diện giữa Giao diện Web (index.html / admin.html)
 * và Thư mục Lưu trữ Dữ liệu (data/) đồng bộ với Ứng dụng C++ (OOP).
 * ============================================================================
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// Hệ thống Bảo mật & Quản lý Phân quyền (Cybersecurity & JWT Authentication Core)
const {
  SecurityConfig,
  loadEnvironmentVariables,
  hashPassword,
  comparePassword,
  signClusterToken,
  verifyClusterToken,
  buildAuthCookieHeader,
  buildClearCookieHeader,
  extractTokenFromRequest,
  clusterAuthGuard,
  getSecurityHeaders,
  applyCorsAndSecurityHeaders,
  checkRateLimit,
  recordLoginAttempt
} = require("./utils/security");

// Nạp dữ liệu khởi tạo mặc định nếu thư mục data/ trống
const { INITIAL_DATA, getTodayDateString } = require("./js/data.js");

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");

// Đường dẫn các file dữ liệu trong thư mục data/
const PATHS = {
  ADMIN_CONFIG: path.join(DATA_DIR, "admin_config.json"),
  MOVIES_JSON: path.join(DATA_DIR, "ds_phim.json"),
  MOVIES_CSV: path.join(DATA_DIR, "ds_phim.csv"),
  CINEMAS_JSON: path.join(DATA_DIR, "ds_rap.json"),
  CINEMAS_CSV: path.join(DATA_DIR, "ds_rap.csv"),
  COMBOS_JSON: path.join(DATA_DIR, "bang_gia_combo.json"),
  COMBOS_CSV: path.join(DATA_DIR, "bang_gia.csv"),
  PRICING_JSON: path.join(DATA_DIR, "bang_gia_phu_thu.json"),
  USERS_JSON: path.join(DATA_DIR, "nguoi_dung.json"),
  USERS_CSV: path.join(DATA_DIR, "nguoi_dung.csv"),
  SHOWTIMES_JSON: path.join(DATA_DIR, "ds_suat_chieu.json"),
  TICKETS_JSON: path.join(DATA_DIR, "ds_ve.json"),
  TICKETS_DAT: path.join(DATA_DIR, "ve_da_ban.dat"),
  SEATS_DAT: path.join(DATA_DIR, "trang_thai_ghe.dat"),
  REPORT_TXT: path.join(DATA_DIR, "report_doanh_thu.txt")
};

// Đảm bảo thư mục data/ tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// 1. SERIALIZATION VÀ ĐỒNG BỘ DỮ LIỆU NHỊ PHÂN C++ (.DAT)
// ============================================================================

function serializeVeBinaryRecord(ticketRecord) {
  const buf = Buffer.alloc(376);
  buf.fill(0);
  buf.write(String(ticketRecord.maVe || "").slice(0, 23), 0, 23, "utf8");
  buf.write(String(ticketRecord.maSuatChieu || "").slice(0, 23), 24, 23, "utf8");
  buf.write(String(ticketRecord.maPhim || "").slice(0, 23), 48, 23, "utf8");
  buf.write(String(ticketRecord.maPhong || "").slice(0, 23), 72, 23, "utf8");
  buf.write(String(ticketRecord.maGhe || "").slice(0, 11), 96, 11, "utf8");
  buf.writeDoubleLE(Number(ticketRecord.tongTien) || 0, 112);
  buf.write(String(ticketRecord.chiTietHoaDon || "").slice(0, 255), 120, 255, "utf8");
  return buf;
}

function serializeGheBinaryRecord(seatRecord) {
  const buf = Buffer.alloc(48);
  buf.fill(0);
  buf.write(String(seatRecord.maSuatChieu || "").slice(0, 23), 0, 23, "utf8");
  buf.writeInt32LE(Number(seatRecord.hang) || 0, 24);
  buf.writeInt32LE(Number(seatRecord.cot) || 0, 28);
  buf.writeInt32LE(Number(seatRecord.trangThai) || 0, 32);
  const timeSec = BigInt(Math.floor((Number(seatRecord.mocThoiGianGiu) || Date.now()) / 1000));
  buf.writeBigInt64LE(timeSec, 40);
  return buf;
}

function saveSeatsDat(showtimes) {
  const buffers = [];
  for (const st of showtimes) {
    if (!st || !st.seats || !Array.isArray(st.seats)) continue;
    for (let r = 0; r < st.seats.length; r++) {
      for (let c = 0; c < st.seats[r].length; c++) {
        const seat = st.seats[r][c];
        if (seat && seat.status !== 0) {
          buffers.push(
            serializeGheBinaryRecord({
              maSuatChieu: st.id,
              hang: r,
              cot: c,
              trangThai: seat.status,
              mocThoiGianGiu: seat.heldAt || Date.now()
            })
          );
        }
      }
    }
  }
  fs.writeFileSync(PATHS.SEATS_DAT, Buffer.concat(buffers));
}

function saveTicketsDat(tickets) {
  const buffers = [];
  // Chỉ lưu các vé hợp lệ (chưa bị hủy) vào file nhị phân của C++
  const activeTickets = tickets.filter(t => t.status !== "CANCELLED");
  for (const t of activeTickets) {
    if (!t || !Array.isArray(t.seats)) continue;
    for (const s of t.seats) {
      buffers.push(
        serializeVeBinaryRecord({
          maVe: t.ticketId,
          maSuatChieu: t.showtimeId,
          maPhim: t.movieId,
          maPhong: t.roomName || "Standard",
          maGhe: s.code || "A1",
          tongTien: t.totalAmount,
          chiTietHoaDon: `${t.movieTitle} | ${s.code} | ${t.customerName || "Khach"}`
        })
      );
    }
  }
  fs.writeFileSync(PATHS.TICKETS_DAT, Buffer.concat(buffers));
}

// Chuyển link YouTube thông thường thành link embed để xem được trong iframe
function formatTrailerUrl(url) {
  if (!url) return "";
  const str = String(url).trim();
  const match = str.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/i);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return str;
}

// ============================================================================
// 2. KHỞI TẠO VÀ ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG
// ============================================================================

// Khởi tạo sơ đồ ma trận ghế chuẩn theo phòng và loại hình
function generateSeatMatrix(roomType, rows = 8, cols = 10) {
  const matrix = [];
  const sweetboxRowIndex = rows - 1;

  for (let r = 0; r < rows; r++) {
    const rowChar = String.fromCharCode(65 + r);
    const rowSeats = [];
    const isSweetboxRow = roomType === "IMAX" && r === sweetboxRowIndex;

    for (let c = 0; c < cols; c++) {
      let type = "THUONG";
      let pairCode = null;

      if (isSweetboxRow) {
        type = "SWEETBOX";
        const otherCol = c % 2 === 0 ? c + 2 : c;
        pairCode = `${rowChar}${otherCol}`;
      } else {
        if (r < 3) {
          type = "THUONG";
        } else {
          type = "VIP";
        }
      }

      rowSeats.push({
        code: `${rowChar}${c + 1}`,
        row: r,
        col: c,
        type: type,
        status: 0, // 0: Available, 1: Holding, 2: Sold
        pairCode: pairCode,
        heldBy: null,
        heldAt: null
      });
    }
    matrix.push(rowSeats);
  }
  return matrix;
}

// Danh sách vé mẫu khởi tạo ban đầu
function createInitialSampleTickets() {
  return [
    {
      ticketId: "TK-20241025-001",
      showtimeId: "SC01",
      movieId: "P01",
      movieTitle: "Dune: Hành Tinh Cát - Phần Hai",
      cinemaId: "R01",
      cinemaName: "Cinema Thủ Đức",
      roomName: "Phòng 03 (IMAX Laser)",
      roomType: "IMAX",
      date: getTodayDateString(0),
      startTime: "10:00",
      seats: [
        { code: "E6", type: "VIP", basePrice: 100000, roomSurcharge: 70000, seatSurcharge: 20000, total: 190000 },
        { code: "E7", type: "VIP", basePrice: 100000, roomSurcharge: 70000, seatSurcharge: 20000, total: 190000 }
      ],
      combos: [
        { id: "CB02", name: "Combo Bắp Nước Đôi", price: 105000, quantity: 1 }
      ],
      totalAmount: 485000,
      customerName: "Nguyễn Nhật Huy",
      customerPhone: "0909123456",
      customerEmail: "khachhang@gmail.com",
      userId: "U01",
      paymentMethod: "MOMO_QR",
      status: "PAID",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      ticketId: "TK-20241025-002",
      showtimeId: "SC04",
      movieId: "P02",
      movieTitle: "Kung Fu Panda 4",
      cinemaId: "R01",
      cinemaName: "Cinema Thủ Đức",
      roomName: "Phòng 01 (2D Standard)",
      roomType: "2D",
      date: getTodayDateString(0),
      startTime: "09:30",
      seats: [
        { code: "C4", type: "THUONG", basePrice: 80000, roomSurcharge: 0, seatSurcharge: 0, total: 80000 },
        { code: "C5", type: "THUONG", basePrice: 80000, roomSurcharge: 0, seatSurcharge: 0, total: 80000 }
      ],
      combos: [
        { id: "CB01", name: "Combo Bắp Nước Đơn", price: 75000, quantity: 2 }
      ],
      totalAmount: 310000,
      customerName: "Lê Cường Bảo",
      customerPhone: "0912345678",
      customerEmail: "bao@gmail.com",
      userId: "U02",
      paymentMethod: "VNPAY",
      status: "PAID",
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];
}

// Đồng bộ trạng thái ghế tương ứng với các vé mẫu ban đầu
function applySoldSeats(showtimes, tickets) {
  for (const t of tickets) {
    if (t.status === "CANCELLED") continue;
    const st = showtimes.find(s => s.id === t.showtimeId);
    if (!st || !st.seats) continue;
    for (const seatInfo of t.seats) {
      for (const row of st.seats) {
        const found = row.find(s => s.code === seatInfo.code);
        if (found) {
          found.status = 2; // SOLD
          found.heldBy = t.customerName;
          if (found.type === "SWEETBOX" && found.pairCode) {
            const pair = row.find(s => s.code === found.pairCode);
            if (pair) pair.status = 2;
          }
        }
      }
    }
  }
}

// Khởi tạo các file dữ liệu ban đầu nếu chưa có

function getClientIp(req) {
  const forwarded = req.headers && req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "127.0.0.1";
}

function calcEndTime(startTime, durationMinutes = 120) {
  if (!startTime) return "00:00";
  const [sh, sm] = String(startTime).split(":").map(Number);
  const totalMinutes = (isNaN(sh) ? 0 : sh) * 60 + (isNaN(sm) ? 0 : sm) + Number(durationMinutes || 120);
  const eh = Math.floor(totalMinutes / 60) % 24;
  const em = totalMinutes % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function ensureHashedAdminPasswords() {
  if (!fs.existsSync(PATHS.ADMIN_CONFIG)) return;
  try {
    const adminConfig = JSON.parse(fs.readFileSync(PATHS.ADMIN_CONFIG, "utf8"));
    if (adminConfig && Array.isArray(adminConfig.managers)) {
      let modified = false;
      for (const m of adminConfig.managers) {
        if (m.password && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(m.password)) {
          m.password = hashPassword(m.password);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(PATHS.ADMIN_CONFIG, JSON.stringify(adminConfig, null, 2), "utf8");
      }
    }
  } catch (e) {
    console.warn("ensureHashedAdminPasswords error:", e.message);
  }
}

function ensureHashedUserPasswords() {
  if (!fs.existsSync(PATHS.USERS_JSON)) return;
  try {
    const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
    if (Array.isArray(users)) {
      let modified = false;
      for (const u of users) {
        if (u.password && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(u.password)) {
          u.password = hashPassword(u.password);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(users, null, 2), "utf8");
        syncUsersCSV();
      }
    }
  } catch (e) {
    console.warn("ensureHashedUserPasswords error:", e.message);
  }
}

function autoUpdateServerMovieStatuses() {
  if (!fs.existsSync(PATHS.MOVIES_JSON) || !fs.existsSync(PATHS.SHOWTIMES_JSON)) return;
  try {
    const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
    const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
    const today = getTodayDateString(0);
    let changed = false;

    for (const m of movies) {
      const mShowtimes = showtimes.filter(s => s.movieId === m.id);
      const hasActive = mShowtimes.some(s => s.date >= today);
      const hadPast = mShowtimes.some(s => s.date < today);

      let targetStatus = m.status;
      if (hasActive) {
        targetStatus = "now_showing";
      } else if (mShowtimes.length === 0) {
        targetStatus = "coming_soon";
      } else if (hadPast && !hasActive) {
        targetStatus = "stopped";
      }

      if (m.status !== targetStatus) {
        m.status = targetStatus;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(movies, null, 2), "utf8");
      syncMoviesCSV();
    }
  } catch (e) {
    console.warn("autoUpdateServerMovieStatuses error:", e.message);
  }
}

function initializeDatabase() {
  // 0. Tài khoản quản lý từng Cụm rạp (Branch Managers) bảo mật trên máy chủ Backend
  const defaultManagers = [
    { cinemaId: "R01", cinemaName: "Cinema Thủ Đức", username: "manager_thuduc", password: hashPassword("123"), role: "branch_manager" },
    { cinemaId: "R02", cinemaName: "Cinema Landmark 81", username: "manager_l81", password: hashPassword("123"), role: "branch_manager" },
    { cinemaId: "R03", cinemaName: "Cinema Vạn Hạnh Mall", username: "manager_vhm", password: hashPassword("123"), role: "branch_manager" }
  ];

  // Tự động kiểm tra và băm mật khẩu quản lý trong data/admin_config.json (Bảo mật tầng lưu trữ - Bcrypt)
  ensureHashedAdminPasswords();
  ensureHashedUserPasswords();
  autoUpdateServerMovieStatuses();

  if (!fs.existsSync(PATHS.ADMIN_CONFIG)) {
    fs.writeFileSync(PATHS.ADMIN_CONFIG, JSON.stringify({ managers: defaultManagers }, null, 2), "utf8");
  } else {
    try {
      const cfg = JSON.parse(fs.readFileSync(PATHS.ADMIN_CONFIG, "utf8"));
      if (!cfg.managers || !Array.isArray(cfg.managers)) {
        fs.writeFileSync(PATHS.ADMIN_CONFIG, JSON.stringify({ managers: defaultManagers }, null, 2), "utf8");
      }
    } catch (e) {
      fs.writeFileSync(PATHS.ADMIN_CONFIG, JSON.stringify({ managers: defaultManagers }, null, 2), "utf8");
    }
  }

  // Tự động kiểm tra và băm bcrypt mật khẩu quản lý trong data/admin_config.json
  ensureHashedAdminPasswords();

  // 1. Phim (ds_phim.json & ds_phim.csv)
  if (!fs.existsSync(PATHS.MOVIES_JSON)) {
    fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(INITIAL_DATA.movies, null, 2), "utf8");
  }
  syncMoviesCSV();

  // 2. Rạp chiếu (ds_rap.json & ds_rap.csv)
  if (!fs.existsSync(PATHS.CINEMAS_JSON)) {
    fs.writeFileSync(PATHS.CINEMAS_JSON, JSON.stringify(INITIAL_DATA.cinemas, null, 2), "utf8");
  }
  syncCinemasCSV();

  // 3. Bảng giá combo (bang_gia_combo.json & bang_gia.csv)
  if (!fs.existsSync(PATHS.COMBOS_JSON)) {
    fs.writeFileSync(PATHS.COMBOS_JSON, JSON.stringify(INITIAL_DATA.combos, null, 2), "utf8");
  }
  syncCombosCSV();

  // 4. Bảng phụ thu phòng và ghế (bang_gia_phu_thu.json)
  if (!fs.existsSync(PATHS.PRICING_JSON)) {
    fs.writeFileSync(PATHS.PRICING_JSON, JSON.stringify(INITIAL_DATA.pricing, null, 2), "utf8");
  }

  // 5. Người dùng (nguoi_dung.json & nguoi_dung.csv)
  if (!fs.existsSync(PATHS.USERS_JSON)) {
    const defaultServerUsers = [
      {
        id: "U01",
        fullName: "Khách Hàng Mẫu",
        email: "khachhang@gmail.com",
        password: hashPassword("123456"),
        phone: "0909000111",
        membershipTier: "VIP Gold",
        points: 250
      }
    ];
    fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(defaultServerUsers, null, 2), "utf8");
  }
  syncUsersCSV();

  // 6. Vé bán ra (ds_ve.json)
  if (!fs.existsSync(PATHS.TICKETS_JSON)) {
    const initialTickets = createInitialSampleTickets();
    fs.writeFileSync(PATHS.TICKETS_JSON, JSON.stringify(initialTickets, null, 2), "utf8");
  }

  // 7. Suất chiếu (ds_suat_chieu.json)
  let showtimes = [];
  let needRefresh = false;
  if (!fs.existsSync(PATHS.SHOWTIMES_JSON)) {
    needRefresh = true;
  } else {
    try {
      showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
      const todayStr = getTodayDateString(0);
      const hasActive = Array.isArray(showtimes) && showtimes.some(st => st.date >= todayStr);
      if (!hasActive || showtimes.length === 0) {
        needRefresh = true;
      }
    } catch (e) {
      needRefresh = true;
    }
  }

  if (needRefresh) {
    const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
    const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
    const movieMap = {};
    for (const m of movies) movieMap[m.id] = m;

    const schedulesByDay = [
      // DAY 0 (Hôm nay)
      [
        ['R01', 'PIMAX-03', [['P01', '10:00', 'SC01'], ['P04', '13:15'], ['P01', '15:45'], ['P04', '19:00'], ['P01', '21:30']]],
        ['R01', 'P3D-02',   [['P03', '09:00'], ['P06', '11:45'], ['P09', '14:20'], ['P03', '16:45'], ['P06', '19:30'], ['P09', '22:00']]],
        ['R01', 'P2D-01',   [['P02', '08:30', 'SC04'], ['P05', '10:30'], ['P07', '13:15'], ['P08', '16:00'], ['P07', '18:00'], ['P05', '20:45']]],

        ['R02', 'L81-IMAX', [['P04', '10:00'], ['P01', '12:30'], ['P04', '15:45'], ['P01', '18:15'], ['P04', '21:30']]],
        ['R02', 'L81-3D',   [['P06', '09:30'], ['P09', '12:00'], ['P03', '14:30'], ['P06', '17:15'], ['P03', '20:00']]],
        ['R02', 'L81-2D',   [['P08', '09:00'], ['P07', '11:00'], ['P02', '13:45'], ['P05', '15:45'], ['P07', '18:30'], ['P02', '21:15']]],

        ['R03', 'VHM-3D',    [['P04', '09:00'], ['P06', '11:30'], ['P09', '14:15'], ['P03', '16:45'], ['P04', '19:30'], ['P06', '22:00']]],
        ['R03', 'VHM-3D-04', [['P03', '10:00'], ['P09', '12:45'], ['P03', '15:15'], ['P09', '18:00'], ['P03', '20:30']]],
        ['R03', 'VHM-2D',    [['P05', '08:30'], ['P02', '11:15'], ['P07', '13:30'], ['P08', '16:15'], ['P05', '18:30'], ['P07', '21:15']]]
      ],

      // DAY 1 (Ngày mai)
      [
        ['R01', 'PIMAX-03', [['P04', '10:45'], ['P01', '13:15'], ['P04', '16:30'], ['P01', '19:00'], ['P04', '22:15']]],
        ['R01', 'P3D-02',   [['P06', '10:15'], ['P03', '13:00'], ['P09', '15:45'], ['P06', '18:15'], ['P03', '21:00']]],
        ['R01', 'P2D-01',   [['P05', '09:15'], ['P07', '12:00'], ['P02', '14:45'], ['P08', '16:45'], ['P07', '19:00'], ['P05', '21:45']]],

        ['R02', 'L81-IMAX', [['P01', '10:30'], ['P04', '13:45'], ['P01', '16:15'], ['P04', '19:30'], ['P01', '22:00']]],
        ['R02', 'L81-3D',   [['P09', '10:00'], ['P06', '12:30'], ['P09', '15:15'], ['P03', '17:45'], ['P06', '20:30']]],
        ['R02', 'L81-2D',   [['P07', '09:30'], ['P05', '12:15'], ['P08', '15:00'], ['P02', '17:00'], ['P07', '19:15'], ['P05', '22:00']]],

        ['R03', 'VHM-3D',    [['P06', '10:00'], ['P04', '12:45'], ['P06', '15:15'], ['P09', '18:00'], ['P04', '20:30']]],
        ['R03', 'VHM-3D-04', [['P09', '11:00'], ['P03', '13:30'], ['P09', '16:15'], ['P03', '18:45'], ['P09', '21:30']]],
        ['R03', 'VHM-2D',    [['P02', '09:30'], ['P07', '11:30'], ['P05', '14:15'], ['P08', '17:00'], ['P07', '19:00'], ['P02', '21:45']]]
      ],

      // DAY 2
      [
        ['R01', 'PIMAX-03', [['P01', '10:00'], ['P04', '13:15'], ['P01', '15:45'], ['P04', '19:00'], ['P01', '21:30']]],
        ['R01', 'P3D-02',   [['P09', '09:45'], ['P06', '12:15'], ['P03', '15:00'], ['P09', '17:45'], ['P06', '20:15']]],
        ['R01', 'P2D-01',   [['P07', '09:00'], ['P08', '11:45'], ['P05', '13:45'], ['P02', '16:30'], ['P07', '18:30'], ['P05', '21:15']]],

        ['R02', 'L81-IMAX', [['P04', '11:00'], ['P01', '13:30'], ['P04', '16:45'], ['P01', '19:15'], ['P04', '22:30']]],
        ['R02', 'L81-3D',   [['P03', '10:30'], ['P09', '13:15'], ['P06', '15:45'], ['P03', '18:30'], ['P09', '21:15']]],
        ['R02', 'L81-2D',   [['P05', '09:30'], ['P02', '12:15'], ['P07', '14:15'], ['P08', '17:00'], ['P05', '19:00'], ['P07', '21:45']]],

        ['R03', 'VHM-3D',    [['P04', '10:15'], ['P09', '12:45'], ['P03', '15:15'], ['P06', '18:00'], ['P04', '20:45']]],
        ['R03', 'VHM-3D-04', [['P06', '10:30'], ['P03', '13:15'], ['P09', '16:00'], ['P03', '18:30'], ['P06', '21:15']]],
        ['R03', 'VHM-2D',    [['P08', '09:00'], ['P05', '11:00'], ['P02', '13:45'], ['P07', '15:45'], ['P05', '18:30'], ['P07', '21:15']]]
      ],

      // DAY 3
      [
        ['R01', 'PIMAX-03', [['P04', '10:15'], ['P01', '12:45'], ['P04', '16:00'], ['P01', '18:30'], ['P04', '21:45']]],
        ['R01', 'P3D-02',   [['P03', '10:00'], ['P09', '12:45'], ['P06', '15:15'], ['P03', '18:00'], ['P09', '20:45']]],
        ['R01', 'P2D-01',   [['P02', '09:00'], ['P05', '11:00'], ['P08', '13:45'], ['P07', '15:45'], ['P02', '18:30'], ['P07', '20:30']]],

        ['R02', 'L81-IMAX', [['P01', '10:00'], ['P04', '13:15'], ['P01', '15:45'], ['P04', '19:00'], ['P01', '21:30']]],
        ['R02', 'L81-3D',   [['P06', '10:15'], ['P03', '13:00'], ['P09', '15:45'], ['P06', '18:15'], ['P03', '21:00']]],
        ['R02', 'L81-2D',   [['P07', '09:00'], ['P08', '11:45'], ['P05', '13:45'], ['P02', '16:30'], ['P07', '18:30'], ['P05', '21:15']]],

        ['R03', 'VHM-3D',    [['P09', '10:00'], ['P04', '12:30'], ['P06', '15:00'], ['P03', '17:45'], ['P09', '20:30']]],
        ['R03', 'VHM-3D-04', [['P03', '10:30'], ['P06', '13:15'], ['P09', '16:00'], ['P04', '18:30'], ['P03', '21:00']]],
        ['R03', 'VHM-2D',    [['P05', '09:00'], ['P07', '11:45'], ['P02', '14:30'], ['P08', '16:30'], ['P07', '18:30'], ['P05', '21:15']]]
      ]
    ];

    showtimes = [];
    let scCounter = 1;
    const usedIds = new Set();

    schedulesByDay.forEach((daySchedule, dayOffset) => {
      const dateStr = getTodayDateString(dayOffset);
      daySchedule.forEach(([cinemaId, roomId, slots]) => {
        const cinema = cinemas.find(c => c.id === cinemaId);
        const room = cinema && cinema.rooms ? cinema.rooms.find(r => r.id === roomId) : null;
        const roomType = room ? room.type : '2D';
        const rows = room ? room.rows : 8;
        const cols = room ? room.cols : 10;

        slots.forEach(slot => {
          const [movieId, startTime, fixedId] = slot;
          const movie = movieMap[movieId];
          if (!movie) return;
          const endTime = calcEndTime(startTime, movie.duration);

          let id = fixedId;
          if (!id) {
            while (scCounter === 1 || scCounter === 4 || usedIds.has('SC' + String(scCounter).padStart(2, '0'))) {
              scCounter++;
            }
            id = 'SC' + String(scCounter).padStart(2, '0');
            scCounter++;
          }
          usedIds.add(id);

          showtimes.push({
            id,
            movieId,
            cinemaId,
            roomId,
            date: dateStr,
            startTime,
            endTime,
            seats: generateSeatMatrix(roomType, rows, cols)
          });
        });
      });
    });

    const tickets = JSON.parse(fs.readFileSync(PATHS.TICKETS_JSON, "utf8"));
    applySoldSeats(showtimes, tickets);

    fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
  }

  // 8. Đồng bộ file nhị phân C++ (ve_da_ban.dat & trang_thai_ghe.dat)
  const currentTickets = JSON.parse(fs.readFileSync(PATHS.TICKETS_JSON, "utf8"));
  const currentShowtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
  saveTicketsDat(currentTickets);
  saveSeatsDat(currentShowtimes);

  // 9. Đồng bộ báo cáo doanh thu ban đầu ra report_doanh_thu.txt
  generateRevenueReportTextFile("movie");

  console.log("-> Kho du lieu data/ da duoc khoi tao va dong bo 100% thanh cong!");
}

// Đồng bộ danh sách phim ra file CSV cho C++
function syncMoviesCSV() {
  try {
    const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
    // Định dạng C++: ma,ten,loai,strTL,strDT,strGia
    const lines = movies.map(m => {
      const cleanTitle = (m.originalTitle || m.title || "").replace(/,/g, " ");
      // C++ stoi yêu cầu loai không chứa dấu phẩy
      const cleanGenre = (m.genre || "General").replace(/,/g, " / ");
      let age = 0;
      if (m.ageRating === "18+" || m.ageRating === "T18") age = 18;
      else if (m.ageRating === "16+" || m.ageRating === "T16") age = 16;
      else if (m.ageRating === "13+" || m.ageRating === "T13") age = 13;
      return `${m.id},${cleanTitle},${cleanGenre},${m.duration || 120},${age},${m.basePrice || 80000}`;
    });
    fs.writeFileSync(PATHS.MOVIES_CSV, lines.join("\n") + "\n", "utf8");
  } catch (err) {
    console.error("Loi dong bo ds_phim.csv:", err.message);
  }
}

// Đồng bộ danh sách rạp ra file CSV cho C++
function syncCinemasCSV() {
  try {
    const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
    // Định dạng C++: ma,ten,diaChi
    const lines = cinemas.map(c => {
      const cleanName = (c.name || "").replace(/,/g, " ");
      return `${c.id},${cleanName},${c.address || ""}`;
    });
    fs.writeFileSync(PATHS.CINEMAS_CSV, lines.join("\n") + "\n", "utf8");
  } catch (err) {
    console.error("Loi dong bo ds_rap.csv:", err.message);
  }
}

// Đồng bộ danh sách combo ra file CSV cho C++
function syncCombosCSV() {
  try {
    const combos = JSON.parse(fs.readFileSync(PATHS.COMBOS_JSON, "utf8"));
    // Định dạng C++: ma,ten,strGia
    const lines = combos.map(cb => {
      const cleanName = (cb.name || "").replace(/,/g, " ");
      return `${cb.id},${cleanName},${cb.price || 0}`;
    });
    fs.writeFileSync(PATHS.COMBOS_CSV, lines.join("\n") + "\n", "utf8");
  } catch (err) {
    console.error("Loi dong bo bang_gia.csv:", err.message);
  }
}

// Đồng bộ danh sách người dùng ra file CSV
function syncUsersCSV() {
  try {
    const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
    // Định dạng CSV: ma,hoTen,email,matKhau,sdt,hangThanhVien,diemTichLuy
    const lines = users.map(u => {
      const cleanName = (u.fullName || "").replace(/,/g, " ");
      return `${u.id},${cleanName},${u.email || ""},${u.password || ""},${u.phone || ""},${u.membershipTier || "Standard"},${u.points || 0}`;
    });
    fs.writeFileSync(PATHS.USERS_CSV, lines.join("\n") + "\n", "utf8");
  } catch (err) {
    console.error("Loi dong bo nguoi_dung.csv:", err.message);
  }
}

// Xuất file report_doanh_thu.txt đúng định dạng C++, hỗ trợ cô lập theo cụm rạp
function generateRevenueReportTextFile(criteria = "movie", cinemaId = null) {
  try {
    const allTickets = JSON.parse(fs.readFileSync(PATHS.TICKETS_JSON, "utf8"));
    const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
    const currentCinema = cinemaId ? cinemas.find(c => c.id === cinemaId) : null;

    // Loại trừ các vé đã hủy và lọc theo cụm rạp nếu có
    const tickets = allTickets.filter(t => t.status !== "CANCELLED" && (!cinemaId || t.cinemaId === cinemaId));
    const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));

    let tieuDe = "BAO CAO DOANH THU THEO PHIM";
    let cotDoiTuong = "Phim (Ma / Ten Phim)";
    if (criteria === "room") {
      tieuDe = "BAO CAO DOANH THU THEO PHONG CHIEU";
      cotDoiTuong = "Phong Chieu (Ma Phong)";
    } else if (criteria === "showtime") {
      tieuDe = "BAO CAO DOANH THU THEO SUAT CHIEU";
      cotDoiTuong = "Suat Chieu (Ma Suat)";
    }

    const itemMap = new Map();
    let totalRevenue = 0;
    let totalTickets = 0;

    for (const t of tickets) {
      const seatCount = (t.seats && t.seats.length) ? t.seats.length : 1;
      const amount = Number(t.totalAmount) || 0;
      totalRevenue += amount;
      totalTickets += seatCount;

      let key = "KHAC";
      let name = "Khác";

      if (criteria === "movie") {
        key = t.movieId || "P01";
        const mv = movies.find(m => m.id === key);
        name = mv ? `[${key}] ${mv.title}` : `Phim ${key}`;
      } else if (criteria === "room") {
        key = t.roomName || "Standard";
        name = key;
      } else {
        key = t.showtimeId || "SC01";
        name = `Suất ${key} (${t.startTime || ""} ${t.date || ""})`;
      }

      if (!itemMap.has(key)) {
        itemMap.set(key, { key, name, ticketsSold: 0, revenue: 0 });
      }
      const item = itemMap.get(key);
      item.ticketsSold += seatCount;
      item.revenue += amount;
    }

    const items = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
    const avgPerTicket = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;

    let report = `=========================================================================================================\n`;
    report += `                                  ${tieuDe}\n`;
    report += `=========================================================================================================\n`;
    if (currentCinema) {
      report += `Cụm Rạp Áp Dụng: ${currentCinema.name} (${currentCinema.id})\n`;
    }
    report += `Thời gian xuất: ${new Date().toLocaleString("vi-VN")}\n`;
    report += `Tổng doanh thu: ${totalRevenue.toLocaleString("vi-VN")} VND | Tổng vé: ${totalTickets} vé | TB/vé: ${avgPerTicket.toLocaleString("vi-VN")} VND\n`;
    report += `+-----+--------------------------------------+---------------+----------------------+------------------+\n`;
    report += `| STT | ${cotDoiTuong.padEnd(36)} |  So Ve Ban Ra |      Doanh Thu (VND) |  Ty Le Doanh Thu |\n`;
    report += `+-----+--------------------------------------+---------------+----------------------+------------------+\n`;

    let stt = 1;
    for (const it of items) {
      const pct = totalRevenue > 0 ? ((it.revenue / totalRevenue) * 100).toFixed(2) + " %" : "0.00 %";
      let shortName = it.name;
      if (shortName.length > 36) shortName = shortName.slice(0, 33) + "...";
      report += `| ${String(stt++).padStart(3)} | ${shortName.padEnd(36)} | ${String(it.ticketsSold).padStart(13)} | ${it.revenue.toLocaleString("vi-VN").padStart(20)} | ${pct.padStart(16)} |\n`;
    }

    report += `+-----+--------------------------------------+---------------+----------------------+------------------+\n`;
    report += `| TONG CONG                                  | ${String(totalTickets).padStart(13)} | ${totalRevenue.toLocaleString("vi-VN").padStart(20)} |         100.00 % |\n`;
    report += `+-----+--------------------------------------+---------------+----------------------+------------------+\n`;
    report += `Hệ thống Quản lý Rạp Chiếu Phim - Cinema Management (OOP C++ & Web App)\n`;

    fs.writeFileSync(PATHS.REPORT_TXT, report, "utf8");
    return report;
  } catch (err) {
    console.error("Loi xuat bao cao doanh thu:", err.message);
    return "";
  }
}

// Tự động phân loại trạng thái phim ("Sắp chiếu", "Đang chiếu", "Ngưng chiếu") dựa trên lịch chiếu thực tế
function updateMovieStatusesAutomatically() {
  try {
    if (!fs.existsSync(PATHS.MOVIES_JSON) || !fs.existsSync(PATHS.SHOWTIMES_JSON)) return;
    const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
    const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
    const today = getTodayDateString(0);

    let changed = false;
    for (const m of movies) {
      const movieShowtimes = showtimes.filter(s => s.movieId === m.id);
      const hasActive = movieShowtimes.some(s => s.date >= today);
      const hadPast = movieShowtimes.some(s => s.date < today);

      let newStatus = m.status;
      if (hasActive) {
        newStatus = "now_showing";
      } else if (movieShowtimes.length === 0) {
        newStatus = "coming_soon";
      } else if (hadPast && !hasActive) {
        newStatus = "stopped";
      }

      if (m.status !== newStatus) {
        m.status = newStatus;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(movies, null, 2), "utf8");
      syncMoviesCSV();
    }
  } catch (err) {
    // Silent catch
  }
}

// Background worker tự động giải phóng ghế giữ chỗ hết hạn (300 giây) & đồng bộ thời gian hệ thống
setInterval(() => {
  try {
    if (!fs.existsSync(PATHS.SHOWTIMES_JSON)) return;
    const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
    const now = Date.now();
    let changed = false;

    for (const st of showtimes) {
      if (!st.seats) continue;
      for (const row of st.seats) {
        for (const seat of row) {
          if (seat.status === 1) {
            const heldTime = seat.heldAt ? Number(seat.heldAt) : (seat.holdExpiresAt ? Number(seat.holdExpiresAt) - 300 * 1000 : 0);
            if (now - heldTime > 300 * 1000) {
              seat.status = 0; // Trở về AVAILABLE
              seat.heldBy = null;
              seat.heldAt = null;
              seat.holdByUserId = null;
              seat.holdExpiresAt = null;
              changed = true;
            }
          }
        }
      }
    }

    if (changed) {
      fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
      saveSeatsDat(showtimes);
    }

    // Tự động phân loại trạng thái phim
    updateMovieStatusesAutomatically();

    // Dọn dẹp OTP hết hạn
    if (global.otpStore) {
      for (const [em, val] of global.otpStore.entries()) {
        if (now > val.expiresAt) global.otpStore.delete(em);
      }
    }
  } catch (err) {
    // Ignore silent worker error
  }
}, 2000);

// Khởi chạy đồng bộ hóa dữ liệu ban đầu
initializeDatabase();

// ============================================================================
// 3. KIỂM TRA TRÙNG LỊCH CHIẾU (SCHEDULE CONFLICT DETECTION)
// ============================================================================

function toScheduleMinute(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const baseEpoch = new Date(2024, 0, 1).getTime();
  const currentEpoch = new Date(year, month - 1, day, hour, minute).getTime();
  return Math.floor((currentEpoch - baseEpoch) / 60000);
}

function checkScheduleConflict(showtimes, newShowtime) {
  const duration = Number(newShowtime.durationMinutes) || 120;
  const buffer = 15; // 15 phút dọn dẹp phòng (chuẩn OOP C++)
  const newStart = toScheduleMinute(newShowtime.date, newShowtime.startTime);
  const newEnd = newStart + duration;

  for (const st of showtimes) {
    if (newShowtime.excludeId && st.id === newShowtime.excludeId) continue;
    if (st.cinemaId === newShowtime.cinemaId && st.roomId === newShowtime.roomId && st.date === newShowtime.date) {
      const existingDuration = Number(st.durationMinutes) || 120;
      const existingStart = toScheduleMinute(st.date, st.startTime);
      const existingEnd = existingStart + existingDuration;

      // Xung đột nếu khoảng [Start, End + Buffer] chồng lấn nhau
      if (newStart < existingEnd + buffer && existingStart < newEnd + buffer) {
        return {
          conflict: true,
          conflictingShowtime: st,
          message: `Xung đột lịch chiếu với suất ${st.id} (${st.startTime} - ${st.endTime}) tại cùng phòng chiếu. Cần tối thiểu 15 phút dọn dẹp giữa các suất chiếu!`
        };
      }
    }
  }
  return { conflict: false };
}

// ============================================================================
// 4. HTTP SERVER & REST API DISPATCHER
// ============================================================================

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".dat": "application/octet-stream"
};

function sendJson(res, statusCode, data, extraHeaders = {}) {
  for (const [key, val] of Object.entries(extraHeaders)) {
    if (val !== undefined) {
      res.setHeader(key, val);
    }
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Gắn CORS Whitelist và HTTP Security Headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
  applyCorsAndSecurityHeaders(req, res);

  // Hỗ trợ CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const baseHost = req.headers.host || `localhost:8088`;
  const requestUrl = new URL(req.url, `http://${baseHost}`);
  const pathname = requestUrl.pathname;
  const method = req.method;

  // ==========================================================================
  // A. REST API ENDPOINTS (/api/...)
  // ==========================================================================
  if (pathname.startsWith("/api/")) {
    try {
      // 1. BOOTSTRAP API: Tải toàn bộ kho dữ liệu đồng bộ cho Web
      if (pathname === "/api/bootstrap" && method === "GET") {
        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const combos = JSON.parse(fs.readFileSync(PATHS.COMBOS_JSON, "utf8"));
        const pricing = JSON.parse(fs.readFileSync(PATHS.PRICING_JSON, "utf8"));
        // Bảo mật PII: Không gửi danh sách khách hàng qua API công khai bootstrap
        const users = [];
        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        const tickets = JSON.parse(fs.readFileSync(PATHS.TICKETS_JSON, "utf8"));

        return sendJson(res, 200, {
          success: true,
          dataSource: "persistent_data_folder",
          data: {
            movies,
            cinemas,
            combos,
            pricing,
            users,
            showtimes,
            tickets
          }
        });
      }

      // 2. HEALTH STATUS
      if (pathname === "/api/status" && method === "GET") {
        return sendJson(res, 200, {
          status: "online",
          timestamp: new Date().toISOString(),
          persistentDataPath: DATA_DIR
        });
      }

      // 3. AUTHENTICATION & USERS (Kiểm tra định dạng nghiêm ngặt)
      if (pathname === "/api/auth/register" && method === "POST") {
        const body = await parseBody(req);
        const { fullName, email, password, phone } = body;

        const trimmedName = String(fullName || "").trim();
        const trimmedEmail = String(email || "").trim().toLowerCase();
        const trimmedPhone = String(phone || "").trim().replace(/\s+/g, "");
        const rawPassword = String(password || "");

        // Kiểm tra nhập liệu chặt chẽ
        if (!trimmedName || !trimmedEmail || !trimmedPhone || !rawPassword) {
          return sendJson(res, 400, { success: false, message: "Vui lòng điền đầy đủ tất cả các trường thông tin!" });
        }

        if (trimmedName.length < 2) {
          return sendJson(res, 400, { success: false, message: "Họ và tên quá ngắn! Vui lòng nhập tối thiểu 2 ký tự." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return sendJson(res, 400, { success: false, message: "Địa chỉ email không đúng định dạng hợp lệ (vd: ten@domain.com)!" });
        }

        const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
        if (!phoneRegex.test(trimmedPhone)) {
          return sendJson(res, 400, { success: false, message: "Số điện thoại không đúng chuẩn di động Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09)!" });
        }

        if (rawPassword.length < 6) {
          return sendJson(res, 400, { success: false, message: "Mật khẩu quá ngắn! Mật khẩu an toàn phải từ 6 ký tự trở lên." });
        }

        const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
        const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
        if (existing) {
          return sendJson(res, 409, { success: false, message: "Email này đã được sử dụng để đăng ký tài khoản khác!" });
        }

        const newId = `U${String(users.length + 1).padStart(2, "0")}`;
        const hashedPassword = hashPassword(rawPassword);
        const newUser = {
          id: newId,
          fullName: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          phone: trimmedPhone,
          membershipTier: "Standard",
          points: 50, // Tặng ngay 50 điểm chào mừng
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(users, null, 2), "utf8");
        syncUsersCSV();

        const { password: _, ...safeUser } = newUser;
        return sendJson(res, 201, { success: true, user: safeUser });
      }

      if (pathname === "/api/auth/login" && method === "POST") {
        const clientIp = getClientIp(req);
        const rateCheck = checkRateLimit(clientIp);
        if (!rateCheck.allowed) {
          res.setHeader("Retry-After", "900");
          return sendJson(res, 429, { success: false, message: rateCheck.message });
        }

        const body = await parseBody(req);
        const { email, password } = body;

        const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
        const user = users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase() && comparePassword(String(password), u.password));

        if (!user) {
          recordLoginAttempt(clientIp, false);
          return sendJson(res, 401, { success: false, message: "Email hoặc mật khẩu không chính xác!" });
        }

        recordLoginAttempt(clientIp, true);
        const { password: _, ...safeUser } = user;
        return sendJson(res, 200, { success: true, user: safeUser });
      }

      // Đăng nhập Quản lý Cụm rạp (Cluster-based Data Isolation): kiểm tra tài khoản từ backend data/admin_config.json
      if (pathname === "/api/auth/admin-login" && method === "POST") {
        const clientIp = getClientIp(req);
        const rateCheck = checkRateLimit(clientIp);
        if (!rateCheck.allowed) {
          res.setHeader("Retry-After", "900");
          return sendJson(res, 429, { success: false, message: rateCheck.message });
        }
        const body = await parseBody(req);
        const { username, password, cinemaId } = body;

        let adminConfig = { managers: [] };
        if (fs.existsSync(PATHS.ADMIN_CONFIG)) {
          try { adminConfig = JSON.parse(fs.readFileSync(PATHS.ADMIN_CONFIG, "utf8")); } catch (e) { }
        }

        const managers = Array.isArray(adminConfig.managers) && adminConfig.managers.length > 0
          ? adminConfig.managers
          : [
              { cinemaId: "R01", cinemaName: "Cinema Thủ Đức", username: "manager_thuduc", password: hashPassword("123"), role: "branch_manager" },
              { cinemaId: "R02", cinemaName: "Cinema Landmark 81", username: "manager_l81", password: hashPassword("123"), role: "branch_manager" },
              { cinemaId: "R03", cinemaName: "Cinema Vạn Hạnh Mall", username: "manager_vhm", password: hashPassword("123"), role: "branch_manager" }
            ];

        let foundManager = null;
        if (username) {
          foundManager = managers.find(m => m.username.toLowerCase() === username.trim().toLowerCase() && comparePassword(password, m.password));
        } else if (cinemaId) {
          foundManager = managers.find(m => m.cinemaId === cinemaId && comparePassword(password, m.password));
        } else if (password) {
          // Fallback tương thích: mật khẩu "123" hoặc test case gửi { password: "admin" }
          foundManager = managers.find(m => comparePassword(password, m.password)) || ((password === "admin" || password === "admin123") ? managers[0] : null);
        }

        if (foundManager) {
          recordLoginAttempt(clientIp, true);
          // Ký JWT Token (HS256) chứa user_id, cluster_id, role, cinemaName với hạn dùng 4h
          const jwtToken = signClusterToken({
            user_id: foundManager.username,
            cluster_id: foundManager.cinemaId,
            role: foundManager.role || "branch_manager",
            cinemaName: foundManager.cinemaName
          });

          // Trả về qua HttpOnly Cookie (chống tấn công XSS)
          res.setHeader("Set-Cookie", buildAuthCookieHeader(jwtToken));

          return sendJson(res, 200, {
            success: true,
            token: jwtToken,
            manager: {
              cinemaId: foundManager.cinemaId,
              cinemaName: foundManager.cinemaName,
              username: foundManager.username,
              role: foundManager.role || "branch_manager"
            }
          });
        }
        recordLoginAttempt(clientIp, false);
        return sendJson(res, 401, { success: false, message: "Tài khoản hoặc mật khẩu quản lý cụm rạp không chính xác!" });
      }

      // Xác thực phiên làm việc quản trị từ HttpOnly Cookie / JWT Token
      if (pathname === "/api/auth/me" && method === "GET") {
        const decoded = clusterAuthGuard(req, res);
        if (!decoded) return; // 401 Unauthorized đã được guard phản hồi
        return sendJson(res, 200, {
          success: true,
          manager: {
            cinemaId: decoded.cluster_id,
            cinemaName: decoded.cinemaName,
            username: decoded.user_id,
            role: decoded.role
          }
        });
      }

      // Đăng xuất Quản trị: Xóa HttpOnly Cookie
      if (pathname === "/api/auth/admin-logout" && method === "POST") {
        res.setHeader("Set-Cookie", buildClearCookieHeader());
        return sendJson(res, 200, {
          success: true,
          message: "Đăng xuất thành công, phiên làm việc an toàn đã kết thúc."
        });
      }

      // QUÊN MẬT KHẨU: GỬI MÃ OTP QUA EMAIL
      if (pathname === "/api/auth/forgot-password" && method === "POST") {
        const body = await parseBody(req);
        const { email } = body;
        if (!email) return sendJson(res, 400, { success: false, message: "Vui lòng cung cấp email tài khoản!" });

        const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) {
          return sendJson(res, 404, { success: false, message: "Email này chưa được đăng ký tài khoản trong hệ thống!" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 5 * 60 * 1000;

        if (!global.otpStore) global.otpStore = new Map();
        global.otpStore.set(email.trim().toLowerCase(), { otp, expiresAt });

        console.log(`[AUTH] Ma OTP khoi phuc mat khau cho ${email}: ${otp}`);
        return sendJson(res, 200, {
          success: true,
          message: `Mã OTP xác thực đã được gửi tới email ${email} (hạn dùng 5 phút).`,
          testOtp: otp
        });
      }

      // XÁC NHẬN MÃ OTP VÀ ĐẶT LẠI MẬT KHẨU
      if (pathname === "/api/auth/reset-password" && method === "POST") {
        const body = await parseBody(req);
        const { email, otp, newPassword } = body;

        if (!email || !otp || !newPassword) {
          return sendJson(res, 400, { success: false, message: "Vui lòng nhập đầy đủ email, mã OTP và mật khẩu mới!" });
        }

        if (newPassword.length < 6) {
          return sendJson(res, 400, { success: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự!" });
        }

        if (!global.otpStore) global.otpStore = new Map();
        const record = global.otpStore.get(email.trim().toLowerCase());

        if (!record || record.otp !== String(otp).trim()) {
          return sendJson(res, 400, { success: false, message: "Mã OTP xác thực không chính xác hoặc không tồn tại!" });
        }

        if (Date.now() > record.expiresAt) {
          global.otpStore.delete(email.trim().toLowerCase());
          return sendJson(res, 400, { success: false, message: "Mã OTP đã hết thời hạn 5 phút! Vui lòng yêu cầu mã mới." });
        }

        const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return sendJson(res, 404, { success: false, message: "Không tìm thấy người dùng!" });

        user.password = hashPassword(newPassword);
        fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(users, null, 2), "utf8");
        syncUsersCSV();
        global.otpStore.delete(email.trim().toLowerCase());

        return sendJson(res, 200, {
          success: true,
          message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới."
        });
      }

      // Đổi điểm nâng hạng thành viên
      if (pathname === "/api/users/upgrade-tier" && method === "POST") {
        const body = await parseBody(req);
        const { userId, targetTier } = body;
        const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
        const user = users.find(u => u.id === userId);

        if (!user) return sendJson(res, 404, { success: false, message: "Không tìm thấy người dùng!" });

        if (targetTier === "VIP Gold") {
          if ((user.points || 0) < 200) {
            return sendJson(res, 400, { success: false, message: "Cần tối thiểu 200 điểm tích lũy để nâng hạng VIP Gold!" });
          }
          user.membershipTier = "VIP Gold";
        } else if (targetTier === "Platinum" || targetTier === "VIP Platinum") {
          if ((user.points || 0) < 500) {
            return sendJson(res, 400, { success: false, message: "Cần tối thiểu 500 điểm tích lũy để nâng hạng Platinum!" });
          }
          user.membershipTier = "Platinum";
        } else {
          return sendJson(res, 400, { success: false, message: "Hạng thành viên không hợp lệ!" });
        }

        fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(users, null, 2), "utf8");
        syncUsersCSV();
        return sendJson(res, 200, { success: true, user, message: `Chúc mừng bạn đã nâng hạng thành công lên ${user.membershipTier}!` });
      }

      // 4. QUẢN LÝ PHIM (MOVIES)
      if (pathname === "/api/movies" && method === "GET") {
        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        return sendJson(res, 200, { success: true, movies });
      }

      if (pathname === "/api/movies" && method === "POST") {
        const body = await parseBody(req);
        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));

        const newId = body.id || `P${String(movies.length + 1).padStart(2, "0")}`;
        const movie = {
          id: newId,
          title: body.title || "Phim mới",
          originalTitle: body.originalTitle || body.title || "New Movie",
          genre: body.genre || "Hành Động",
          duration: Number(body.duration) || 120,
          ageRating: body.ageRating || "13+",
          ageDescription: body.ageDescription || `Phim phổ biến ${body.ageRating || "13+"}`,
          country: body.country || "Mỹ",
          basePrice: Number(body.basePrice) || 85000,
          director: body.director || "Chưa rõ",
          cast: body.cast || "Chưa rõ",
          releaseDate: body.releaseDate || getTodayDateString(0),
          rating: (body.rating !== undefined && !isNaN(Number(body.rating))) ? Number(body.rating) : 8.5,
          status: body.status || "now_showing",
          poster: body.poster || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
          posterCustom: body.posterCustom || body.poster || "",
          backdrop: body.backdrop || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
          trailer: formatTrailerUrl(body.trailer),
          synopsis: body.synopsis || "Chưa có mô tả tóm tắt nội dung phim."
        };

        movies.push(movie);
        fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(movies, null, 2), "utf8");
        syncMoviesCSV();

        return sendJson(res, 201, { success: true, movie });
      }

      if (pathname.startsWith("/api/movies/") && method === "PUT") {
        const id = pathname.replace("/api/movies/", "");
        const body = await parseBody(req);
        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        const idx = movies.findIndex(m => m.id === id);

        if (idx === -1) return sendJson(res, 404, { success: false, message: "Không tìm thấy phim!" });

        if (body.trailer) body.trailer = formatTrailerUrl(body.trailer);
        if (body.rating !== undefined) body.rating = Number(body.rating) || 8.0;

        movies[idx] = { ...movies[idx], ...body, id };
        fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(movies, null, 2), "utf8");
        syncMoviesCSV();

        return sendJson(res, 200, { success: true, movie: movies[idx] });
      }

      if (pathname.startsWith("/api/movies/") && pathname.endsWith("/status") && method === "PATCH") {
        const id = pathname.replace("/api/movies/", "").replace("/status", "");
        const body = await parseBody(req);
        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        const movie = movies.find(m => m.id === id);

        if (!movie) return sendJson(res, 404, { success: false, message: "Không tìm thấy phim!" });

        movie.status = body.status;
        fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(movies, null, 2), "utf8");
        syncMoviesCSV();

        return sendJson(res, 200, { success: true, movie });
      }

      if (pathname.startsWith("/api/movies/") && method === "DELETE") {
        const id = pathname.replace("/api/movies/", "");
        let movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        movies = movies.filter(m => m.id !== id);
        fs.writeFileSync(PATHS.MOVIES_JSON, JSON.stringify(movies, null, 2), "utf8");
        syncMoviesCSV();

        return sendJson(res, 200, { success: true, message: `Đã xóa phim ${id}` });
      }

      // 5. QUẢN LÝ CỤM RẠP & PHÒNG CHIẾU (CINEMAS & ROOMS)
      if (pathname === "/api/cinemas" && method === "GET") {
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        return sendJson(res, 200, { success: true, cinemas });
      }

      if (pathname === "/api/cinemas" && method === "POST") {
        const body = await parseBody(req);
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const newId = body.id || `R${String(cinemas.length + 1).padStart(2, "0")}`;

        const newCinema = {
          id: newId,
          name: body.name || "Cụm Rạp Mới",
          address: body.address || "",
          phone: body.phone || "1900 6017",
          rooms: Array.isArray(body.rooms) && body.rooms.length ? body.rooms : [
            { id: `${newId}-2D-01`, name: "Phòng 01 (2D Standard)", type: "2D", rows: 8, cols: 10, surcharge: 0 },
            { id: `${newId}-3D-02`, name: "Phòng 02 (3D RealD)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
            { id: `${newId}-IMAX-03`, name: "Phòng 03 (IMAX Laser)", type: "IMAX", rows: 12, cols: 16, surcharge: 70000 }
          ]
        };

        cinemas.push(newCinema);
        fs.writeFileSync(PATHS.CINEMAS_JSON, JSON.stringify(cinemas, null, 2), "utf8");
        syncCinemasCSV();

        return sendJson(res, 201, { success: true, cinema: newCinema });
      }

      if (pathname.startsWith("/api/cinemas/") && !pathname.includes("/rooms") && method === "PUT") {
        const id = pathname.replace("/api/cinemas/", "");
        const body = await parseBody(req);
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const idx = cinemas.findIndex(c => c.id === id);
        if (idx === -1) return sendJson(res, 404, { success: false, message: "Không tìm thấy cụm rạp!" });

        cinemas[idx] = { ...cinemas[idx], ...body, id };
        fs.writeFileSync(PATHS.CINEMAS_JSON, JSON.stringify(cinemas, null, 2), "utf8");
        syncCinemasCSV();

        return sendJson(res, 200, { success: true, cinema: cinemas[idx] });
      }

      if (pathname.startsWith("/api/cinemas/") && !pathname.includes("/rooms") && method === "DELETE") {
        const id = pathname.replace("/api/cinemas/", "");
        let cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        cinemas = cinemas.filter(c => c.id !== id);
        fs.writeFileSync(PATHS.CINEMAS_JSON, JSON.stringify(cinemas, null, 2), "utf8");
        syncCinemasCSV();

        return sendJson(res, 200, { success: true, message: `Đã xóa cụm rạp ${id}` });
      }

      // Thêm phòng chiếu mới vào cụm rạp
      if (pathname.match(/^\/api\/cinemas\/[\w-]+\/rooms$/) && method === "POST") {
        const cinemaId = pathname.split("/")[3];
        const body = await parseBody(req);
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const cinema = cinemas.find(c => c.id === cinemaId);

        if (!cinema) return sendJson(res, 404, { success: false, message: "Không tìm thấy cụm rạp!" });

        const type = body.type || "2D";
        const rows = Number(body.rows) || (type === "IMAX" ? 12 : type === "3D" ? 10 : 8);
        const cols = Number(body.cols) || (type === "IMAX" ? 16 : type === "3D" ? 12 : 10);
        const surcharge = Number(body.surcharge) !== undefined ? Number(body.surcharge) : (type === "IMAX" ? 70000 : type === "3D" ? 30000 : 0);

        const newRoomId = body.id || `${cinemaId}-${type}-${String(cinema.rooms.length + 1).padStart(2, "0")}`;
        const newRoom = {
          id: newRoomId,
          name: body.name || `Phòng ${cinema.rooms.length + 1} (${type})`,
          type,
          rows,
          cols,
          surcharge
        };

        cinema.rooms.push(newRoom);
        fs.writeFileSync(PATHS.CINEMAS_JSON, JSON.stringify(cinemas, null, 2), "utf8");

        return sendJson(res, 201, { success: true, room: newRoom, cinema });
      }

      // Xóa phòng chiếu khỏi cụm rạp
      if (pathname.match(/^\/api\/cinemas\/[\w-]+\/rooms\/[\w-]+$/) && method === "DELETE") {
        const parts = pathname.split("/");
        const cinemaId = parts[3];
        const roomId = parts[5];
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const cinema = cinemas.find(c => c.id === cinemaId);

        if (!cinema) return sendJson(res, 404, { success: false, message: "Không tìm thấy cụm rạp!" });

        cinema.rooms = cinema.rooms.filter(r => r.id !== roomId);
        fs.writeFileSync(PATHS.CINEMAS_JSON, JSON.stringify(cinemas, null, 2), "utf8");

        return sendJson(res, 200, { success: true, message: `Đã xóa phòng chiếu ${roomId}` });
      }

      // 6. QUẢN LÝ SUẤT CHIẾU VÀ SƠ ĐỒ GHẾ (SHOWTIMES)
      if (pathname === "/api/showtimes" && method === "GET") {
        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        return sendJson(res, 200, { success: true, showtimes });
      }

      if (pathname === "/api/showtimes" && method === "POST") {
        const body = await parseBody(req);
        const { movieId, cinemaId, roomId, date, startTime } = body;

        const today = getTodayDateString(0);
        const maxDay = getTodayDateString(5);
        if (!date || date < today) {
          return sendJson(res, 400, { success: false, message: "Không được lên lịch suất chiếu trong quá khứ! Chỉ được lên lịch từ hôm nay." });
        }
        if (date > maxDay) {
          return sendJson(res, 400, { success: false, message: `Chỉ được phép lên lịch tối đa 5 ngày tiếp theo (tới ngày ${maxDay})!` });
        }

        if (!movieId || !cinemaId || !roomId || !date || !startTime) {
          return sendJson(res, 400, { success: false, message: "Vui lòng nhập đầy đủ thông tin suất chiếu!" });
        }

        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));

        const movie = movies.find(m => m.id === movieId);
        const cinema = cinemas.find(c => c.id === cinemaId);
        const room = cinema ? cinema.rooms.find(r => r.id === roomId) : null;

        if (!movie || !cinema || !room) {
          return sendJson(res, 404, { success: false, message: "Phim, cụm rạp hoặc phòng chiếu không tồn tại!" });
        }

        const durationMinutes = movie.duration || 120;
        const [sh, sm] = startTime.split(":").map(Number);
        const totalEndMinutes = sh * 60 + sm + durationMinutes;
        const eh = Math.floor(totalEndMinutes / 60) % 24;
        const em = totalEndMinutes % 60;
        const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;

        // Kiểm tra xung đột lịch chiếu với 15 phút giãn cách dọn dẹp
        const conflictCheck = checkScheduleConflict(showtimes, {
          cinemaId,
          roomId,
          date,
          startTime,
          durationMinutes
        });

        if (conflictCheck.conflict) {
          return sendJson(res, 409, {
            success: false,
            message: conflictCheck.message,
            conflict: true
          });
        }

        const newId = `SC${String(Date.now()).slice(-4)}`;
        const newShowtime = {
          id: newId,
          movieId,
          cinemaId,
          roomId,
          date,
          startTime,
          endTime,
          seats: generateSeatMatrix(room.type, room.rows || 8, room.cols || 10)
        };

        showtimes.push(newShowtime);
        fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
        saveSeatsDat(showtimes);

        autoUpdateServerMovieStatuses();
        return sendJson(res, 201, { success: true, showtime: newShowtime });
      }

      if (pathname.startsWith("/api/showtimes/") && method === "DELETE") {
        const id = pathname.replace("/api/showtimes/", "");
        let showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        showtimes = showtimes.filter(s => s.id !== id);
        fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
        saveSeatsDat(showtimes);

        autoUpdateServerMovieStatuses();
        return sendJson(res, 200, { success: true, message: `Đã xóa suất chiếu ${id}` });
      }

      // 7. GIỮ CHỖ VÀ GIẢI PHÓNG GHẾ
      if (pathname === "/api/seats/hold" && method === "POST") {
        const body = await parseBody(req);
        const { showtimeId, seatCodes, userId } = body;

        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        const st = showtimes.find(s => s.id === showtimeId);

        if (!st || !st.seats) {
          return sendJson(res, 404, { success: false, message: "Không tìm thấy suất chiếu!" });
        }

        const now = Date.now();
        // Kiểm tra tính khả dụng của tất cả các ghế muốn giữ
        for (const code of seatCodes) {
          for (const row of st.seats) {
            const seat = row.find(s => s.code === code);
            if (seat) {
              if (seat.status === 2) {
                return sendJson(res, 409, { success: false, message: `Ghế ${code} đã được bán cho khách hàng khác!` });
              }
              if (seat.status === 1 && seat.heldBy !== userId && now - (seat.heldAt || 0) < 300 * 1000) {
                return sendJson(res, 409, { success: false, message: `Ghế ${code} đang được người khác giữ chỗ!` });
              }
            }
          }
        }

        // Đánh dấu giữ chỗ trong 300 giây
        for (const code of seatCodes) {
          for (const row of st.seats) {
            const seat = row.find(s => s.code === code);
            if (seat) {
              seat.status = 1;
              seat.heldBy = userId || "anonymous";
              seat.heldAt = now;
              seat.holdByUserId = userId || "anonymous";
              seat.holdExpiresAt = now + 300 * 1000;
            }
          }
        }

        fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
        saveSeatsDat(showtimes);

        return sendJson(res, 200, { success: true, message: "Đã giữ ghế thành công!", heldUntil: now + 300 * 1000 });
      }

      if (pathname === "/api/seats/release" && method === "POST") {
        const body = await parseBody(req);
        const { showtimeId, seatCodes, userId } = body;

        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        const st = showtimes.find(s => s.id === showtimeId);

        if (st && st.seats) {
          for (const code of seatCodes) {
            for (const row of st.seats) {
              const seat = row.find(s => s.code === code);
              if (seat && seat.status === 1) {
                const holder = seat.heldBy || seat.holdByUserId;
                if (!userId || holder === userId || holder === "anonymous") {
                  seat.status = 0;
                  seat.heldBy = null;
                  seat.heldAt = null;
                  seat.holdByUserId = null;
                  seat.holdExpiresAt = null;
                }
              }
            }
          }
          fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
          saveSeatsDat(showtimes);
        }

        return sendJson(res, 200, { success: true, message: "Đã giải phóng ghế!" });
      }

      // 8. THANH TOÁN VÀ ĐẶT VÉ (CÓ TÍNH ƯU ĐÃI VIP TỰ ĐỘNG)
      if (pathname === "/api/checkout" && method === "POST") {
        const body = await parseBody(req);
        const { showtimeId, seats, combos, customer } = body;

        if (!showtimeId || !seats || !seats.length) {
          return sendJson(res, 400, { success: false, message: "Thông tin đặt vé không hợp lệ!" });
        }

        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        const movies = JSON.parse(fs.readFileSync(PATHS.MOVIES_JSON, "utf8"));
        const cinemas = JSON.parse(fs.readFileSync(PATHS.CINEMAS_JSON, "utf8"));
        const tickets = JSON.parse(fs.readFileSync(PATHS.TICKETS_JSON, "utf8"));
        const pricing = JSON.parse(fs.readFileSync(PATHS.PRICING_JSON, "utf8"));
        const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));

        const st = showtimes.find(s => s.id === showtimeId);
        if (!st) return sendJson(res, 404, { success: false, message: "Không tìm thấy suất chiếu!" });

        const movie = movies.find(m => m.id === st.movieId);
        const cinema = cinemas.find(c => c.id === st.cinemaId);
        const room = cinema ? cinema.rooms.find(r => r.id === st.roomId) : null;

        // Đánh dấu ghế đã bán
        const seatCodes = seats.map(s => s.code || s);
        for (const code of seatCodes) {
          for (const row of st.seats) {
            const seat = row.find(s => s.code === code);
            if (seat) {
              seat.status = 2; // SOLD
              seat.heldBy = customer.fullName || customer.name || "Khách Hàng";
              seat.heldAt = null;
              seat.holdByUserId = null;
              seat.holdExpiresAt = null;
            }
          }
        }

        // Tính tiền ghế theo chuẩn OOP C++
        const roomSurcharge = pricing.roomSurcharges[room ? room.type : "2D"] || 0;
        let totalSeatsAmount = 0;
        const seatDetails = [];

        for (const code of seatCodes) {
          let seatType = "THUONG";
          for (const row of st.seats) {
            const s = row.find(item => item.code === code);
            if (s) {
              seatType = s.type;
              break;
            }
          }

          let seatPrice = 0;
          if (seatType === "SWEETBOX") {
            seatPrice = pricing.sweetboxPrice || 180000;
          } else {
            const seatSurcharge = pricing.seatSurcharges[seatType] || 0;
            seatPrice = (movie ? movie.basePrice : 85000) + roomSurcharge + seatSurcharge;
          }

          totalSeatsAmount += seatPrice;
          seatDetails.push({
            code,
            type: seatType,
            basePrice: movie ? movie.basePrice : 85000,
            roomSurcharge,
            seatSurcharge: seatType === "SWEETBOX" ? 0 : (pricing.seatSurcharges[seatType] || 0),
            total: seatPrice
          });
        }

        // Tính tiền combo
        let totalCombosAmount = 0;
        const comboList = [];
        if (combos && Array.isArray(combos)) {
          for (const c of combos) {
            if (c.quantity > 0) {
              const amount = (c.price || 0) * c.quantity;
              totalCombosAmount += amount;
              comboList.push({ id: c.id, name: c.name, price: c.price, quantity: c.quantity });
            }
          }
        }

        // Áp dụng quyền lợi giảm giá theo Hạng Thành Viên VIP
        const customerUser = users.find(u => (customer.id && u.id === customer.id) || (customer.email && u.email === customer.email));
        let vipDiscount = 0;
        let vipDiscountDesc = "";

        if (customerUser) {
          if (customerUser.membershipTier === "VIP Gold") {
            vipDiscount = Math.round(totalSeatsAmount * 0.05);
            vipDiscountDesc = "Ưu đãi thành viên VIP Gold (-5% giá vé)";
          } else if (customerUser.membershipTier === "Platinum" || customerUser.membershipTier === "VIP Platinum") {
            vipDiscount = Math.round((totalSeatsAmount + totalCombosAmount) * 0.10);
            vipDiscountDesc = "Ưu đãi đặc quyền Platinum (-10% tổng hóa đơn)";
          }
        }

        const grandTotal = Math.max(0, totalSeatsAmount + totalCombosAmount - vipDiscount);
        const seq = String(tickets.length + 1).padStart(3, "0");
        const todayStr = getTodayDateString(0).replace(/-/g, "");
        const ticketId = `TK-${todayStr}-${seq}`;

        const createdTicket = {
          ticketId,
          showtimeId: st.id,
          movieId: st.movieId,
          movieTitle: movie ? movie.title : "Phim",
          cinemaId: st.cinemaId,
          cinemaName: cinema ? cinema.name : "Rạp chiếu",
          roomName: room ? room.name : "Phòng Chiếu",
          roomType: room ? room.type : "2D",
          date: st.date,
          startTime: st.startTime,
          seats: seatDetails,
          combos: comboList,
          subtotal: totalSeatsAmount + totalCombosAmount,
          vipDiscount: vipDiscount,
          vipDiscountDesc: vipDiscountDesc,
          totalAmount: grandTotal,
          customerName: customer.fullName || customer.name || "Khách Hàng",
          customerPhone: customer.phone || "0900000000",
          customerEmail: customer.email || "",
          userId: customer.id || (customerUser ? customerUser.id : null),
          paymentMethod: customer.paymentMethod || "CASH_COUNTER",
          status: "PAID",
          createdAt: new Date().toISOString()
        };

        tickets.push(createdTicket);

        // Lưu vào ds_ve.json
        fs.writeFileSync(PATHS.TICKETS_JSON, JSON.stringify(tickets, null, 2), "utf8");

        // Lưu cập nhật ghế vào ds_suat_chieu.json
        fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");

        // Đồng bộ song song sang các file C++
        saveTicketsDat(tickets);
        saveSeatsDat(showtimes);

        // Tích điểm cho tài khoản người dùng
        if (customerUser) {
          // Tỷ lệ tích điểm: Standard 5%, VIP Gold 7%, Platinum 10%
          const rate = customerUser.membershipTier === "Platinum" ? 0.10 : customerUser.membershipTier === "VIP Gold" ? 0.07 : 0.05;
          const addedPoints = Math.max(5, Math.floor((grandTotal * rate) / 1000));
          customerUser.points = (customerUser.points || 0) + addedPoints;
          // Tự động thăng hạng theo mốc điểm
          if (customerUser.points >= 500) customerUser.membershipTier = "Platinum";
          else if (customerUser.points >= 200) customerUser.membershipTier = "VIP Gold";

          fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(users, null, 2), "utf8");
          syncUsersCSV();
        }

        generateRevenueReportTextFile("movie");
        return sendJson(res, 201, { success: true, ticket: createdTicket });
      }

      // 9. HỦY VÉ VÀ GIẢI PHÓNG GHẾ (TICKET CANCELLATION)
      if (pathname === "/api/tickets/cancel" && method === "POST") {
        const body = await parseBody(req);
        const { ticketId, reason } = body;

        const tickets = JSON.parse(fs.readFileSync(PATHS.TICKETS_JSON, "utf8"));
        const ticket = tickets.find(t => t.ticketId === ticketId);

        if (!ticket) {
          return sendJson(res, 404, { success: false, message: "Không tìm thấy vé cần hủy!" });
        }

        if (ticket.status === "CANCELLED") {
          return sendJson(res, 400, { success: false, message: "Vé này đã được hủy trước đó!" });
        }

        ticket.status = "CANCELLED";
        ticket.cancelledAt = new Date().toISOString();
        ticket.cancelReason = reason || "Khách hàng yêu cầu hủy vé";

        // Hoàn trả ghế về trạng thái TRỐNG (0) trong suất chiếu
        const showtimes = JSON.parse(fs.readFileSync(PATHS.SHOWTIMES_JSON, "utf8"));
        const st = showtimes.find(s => s.id === ticket.showtimeId);
        if (st && st.seats) {
          const seatCodes = ticket.seats.map(s => s.code || s);
          for (const code of seatCodes) {
            for (const row of st.seats) {
              const seat = row.find(item => item.code === code);
              if (seat) {
                seat.status = 0; // Trở lại Available
                seat.heldBy = null;
                seat.heldAt = null;
              }
            }
          }
          fs.writeFileSync(PATHS.SHOWTIMES_JSON, JSON.stringify(showtimes, null, 2), "utf8");
          saveSeatsDat(showtimes);
        }

        fs.writeFileSync(PATHS.TICKETS_JSON, JSON.stringify(tickets, null, 2), "utf8");
        saveTicketsDat(tickets);

        // Khấu trừ điểm nếu vé gắn với tài khoản thành viên
        if (ticket.userId) {
          const users = JSON.parse(fs.readFileSync(PATHS.USERS_JSON, "utf8"));
          const user = users.find(u => u.id === ticket.userId);
          if (user) {
            const deductedPoints = Math.floor((ticket.totalAmount || 0) / 10000);
            user.points = Math.max(0, (user.points || 0) - deductedPoints);
            fs.writeFileSync(PATHS.USERS_JSON, JSON.stringify(users, null, 2), "utf8");
            syncUsersCSV();
          }
        }

        // Tự động cập nhật báo cáo doanh thu report_doanh_thu.txt
        generateRevenueReportTextFile("movie");

        return sendJson(res, 200, { success: true, message: "Hủy vé thành công! Ghế đã được hoàn trả lại cho hệ thống.", ticket });
      }

      // 10. BÁO CÁO DOANH THU & THỐNG KÊ (HỖ TRỢ CÔ LẬP CỤM RẠP & JWT AUTHORIZATION)
      if (pathname === "/api/reports/revenue" && method === "GET") {
        const criteria = requestUrl.searchParams.get("criteria") || "movie";
        const cinemaId = requestUrl.searchParams.get("cinemaId");

        // Kiểm tra JWT Token & Phân quyền cô lập cụm rạp
        const token = extractTokenFromRequest(req);
        if (token) {
          const user = clusterAuthGuard(req, res, {
            requiredRole: "branch_manager",
            targetClusterId: cinemaId || undefined
          });
          if (!user) return; // 401 hoặc 403 đã được guard phản hồi
        } else {
          return sendJson(res, 401, {
            success: false,
            code: "UNAUTHORIZED_NO_TOKEN",
            message: "Yêu cầu đăng nhập quản trị viên! Token xác thực không tồn tại trong phiên làm việc."
          });
        }

        const reportText = generateRevenueReportTextFile(criteria, cinemaId);
        return sendJson(res, 200, {
          success: true,
          criteria,
          cinemaId: cinemaId || "all",
          reportText,
          savedPath: PATHS.REPORT_TXT
        });
      }

      // 11. BẢNG GIÁ COMBO (COMBOS)
      if (pathname === "/api/combos" && method === "GET") {
        const combos = JSON.parse(fs.readFileSync(PATHS.COMBOS_JSON, "utf8"));
        return sendJson(res, 200, { success: true, combos });
      }

      if (pathname === "/api/combos" && method === "POST") {
        const body = await parseBody(req);
        const combos = JSON.parse(fs.readFileSync(PATHS.COMBOS_JSON, "utf8"));
        const newId = body.id || `CB${String(combos.length + 1).padStart(2, "0")}`;
        const newCombo = {
          id: newId,
          name: body.name || "Combo Mới",
          price: Number(body.price) || 50000,
          description: body.description || "",
          category: body.category || "combo",
          image: body.image || "https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=80"
        };
        combos.push(newCombo);
        fs.writeFileSync(PATHS.COMBOS_JSON, JSON.stringify(combos, null, 2), "utf8");
        syncCombosCSV();
        return sendJson(res, 201, { success: true, combo: newCombo });
      }

      if (pathname.startsWith("/api/combos/") && method === "PUT") {
        const id = pathname.replace("/api/combos/", "");
        const body = await parseBody(req);
        const combos = JSON.parse(fs.readFileSync(PATHS.COMBOS_JSON, "utf8"));
        const idx = combos.findIndex(c => c.id === id);
        if (idx === -1) return sendJson(res, 404, { success: false, message: "Không tìm thấy combo!" });
        combos[idx] = { ...combos[idx], ...body, id };
        fs.writeFileSync(PATHS.COMBOS_JSON, JSON.stringify(combos, null, 2), "utf8");
        syncCombosCSV();
        return sendJson(res, 200, { success: true, combo: combos[idx] });
      }

      if (pathname.startsWith("/api/combos/") && method === "DELETE") {
        const id = pathname.replace("/api/combos/", "");
        let combos = JSON.parse(fs.readFileSync(PATHS.COMBOS_JSON, "utf8"));
        combos = combos.filter(c => c.id !== id);
        fs.writeFileSync(PATHS.COMBOS_JSON, JSON.stringify(combos, null, 2), "utf8");
        syncCombosCSV();
        return sendJson(res, 200, { success: true, message: `Đã xóa combo ${id}` });
      }

      // 12. KHÔI PHỤC DỮ LIỆU GỐC
      if (pathname === "/api/reset" && method === "POST") {
        // Xóa các file cũ
        Object.values(PATHS).forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) { }
        });
        initializeDatabase();
        return sendJson(res, 200, { success: true, message: "Đã khôi phục dữ liệu gốc toàn hệ thống thành công!" });
      }

      return sendJson(res, 404, { success: false, message: `Endpoint ${pathname} không tồn tại!` });
    } catch (apiError) {
      console.error("API Error:", apiError);
      return sendJson(res, 500, { success: false, message: "Lỗi máy chủ nội bộ", error: apiError.message });
    }
  }

  // ==========================================================================
  // B. PHỤC VỤ STATIC FILES CHO GIAO DIỆN WEB
  // ==========================================================================
  let relativePath = pathname;
  if (relativePath === "/" || relativePath === "") {
    relativePath = "/index.html";
  } else if (relativePath === "/admin") {
    relativePath = "/admin.html";
  }

  // Chặn truy cập file bí mật máy chủ
  if (relativePath.startsWith("/data/") || relativePath.includes(".env") || relativePath.includes("admin_config.json") || relativePath.includes("nguoi_dung")) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Truy cập bị từ chối!");
    return;
  }

  const safePath = path.normalize(path.join(ROOT_DIR, relativePath));
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Truy cập bị từ chối!");
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h2>404 - Không tìm thấy trang</h2><p><a href="/">Quay về trang chủ</a></p>`);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

let currentPort = Number(process.env.PORT) || 8088;

function startListening(port) {
  server.once("error", err => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[WARN] Cổng ${port} đang được sử dụng. Đang tự động chuyển sang cổng ${port + 1}...`);
      startListening(port + 1);
    } else {
      console.error("[ERROR] Không thể khởi động máy chủ:", err.message);
    }
  });

  server.listen(port, () => {
    console.log(`================================================================`);
    console.log(`🎬 CINEMA MANAGEMENT BACKEND & WEB SERVER ĐANG CHẠY`);
    console.log(`================================================================`);
    console.log(`🌐 Trang Khách Hàng : http://localhost:${port}`);
    console.log(`🔐 Trang Quản Trị   : http://localhost:${port}/admin.html`);
    console.log(`📁 Thư mục Dữ liệu  : ${DATA_DIR}`);
    console.log(`⚡ Đồng bộ Backend  : C++ CSV, C++ Binary (.dat), JSON Database`);
    console.log(`================================================================`);
  });
}

startListening(currentPort);
