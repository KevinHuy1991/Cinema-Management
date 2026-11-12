/**
 * Cinema Management System - Storage & Business Logic (Singleton Pattern)
 * Mô phỏng toàn bộ kiến trúc C++: SuatChieuFactory, Ghe, Decorator Pattern, Singleton Manager
 */

const STORAGE_KEYS = {
  MOVIES: "cinema_movies_v1",
  CINEMAS: "cinema_cinemas_v1",
  SHOWTIMES: "cinema_showtimes_v1",
  COMBOS: "cinema_combos_v1",
  PRICING: "cinema_pricing_v1",
  TICKETS: "cinema_tickets_sold_v1",
  USERS: "cinema_users_v1",
  CURRENT_USER: "cinema_current_user_v1",
  ADMIN_AUTH: "cinema_admin_auth_v1"
};

const COMBO_CATALOG_MIGRATION_KEY = "cinema_combo_catalog_migrated_v2";
const SCHEDULE_ROOM_MIGRATION_KEY = "cinema_schedule_room_migrated_v1";
const COMBO_IMAGE_DATABASE = "cinema_combo_images_v1";
const COMBO_IMAGE_STORE = "images";
const COMBO_IMAGE_PREFIX = "local-image:";
const MAX_COMBO_IMAGE_SIZE = 5 * 1024 * 1024;

const SEAT_STATUS = {
  AVAILABLE: 0, // Ghế trống
  HOLDING: 1,   // Đang giữ chỗ (300 giây)
  SOLD: 2       // Đã bán
};

class CinemaStorage {
  static imageDatabasePromise = null;
  static comboImageObjectUrls = new Map();
  static isBackendConnected = false;

  // Đồng bộ toàn diện với máy chủ Backend REST API (thư mục data/)
  static async syncWithBackend() {
    try {
      const res = await fetch("/api/bootstrap");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const payload = await res.json();
      if (payload && payload.success && payload.data) {
        const d = payload.data;
        if (Array.isArray(d.movies) && d.movies.length) localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(d.movies));
        if (Array.isArray(d.cinemas) && d.cinemas.length) localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(d.cinemas));
        if (Array.isArray(d.combos) && d.combos.length) localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(d.combos));
        if (d.pricing) localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(d.pricing));
        // Không lưu danh sách người dùng vào Web Storage của Client
        if (Array.isArray(d.showtimes) && d.showtimes.length) localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(d.showtimes));
        if (Array.isArray(d.tickets)) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(d.tickets));
        CinemaStorage.isBackendConnected = true;
        console.log("-> [Backend] Đã kết nối và đồng bộ thành công với thư mục data/");
        window.dispatchEvent(new CustomEvent("cinema:data-synced", { detail: { source: "backend" } }));
        return true;
      }
    } catch (e) {
      CinemaStorage.isBackendConnected = false;
    }
    return false;
  }

  // Khởi tạo hệ thống và đồng bộ LocalStorage
  static init() {
    // Bảo mật dữ liệu: Dọn sạch triệt để mật khẩu và raw token trong Web Storage
    try {
      sessionStorage.removeItem("cinema_admin_token");
      localStorage.removeItem("cinema_admin_token");

      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) {
        const parsedUsers = JSON.parse(rawUsers);
        if (Array.isArray(parsedUsers)) {
          const cleaned = parsedUsers.map(({ password: _, ...u }) => u);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
        }
      }

      const rawCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (rawCurrentUser) {
        const parsedCur = JSON.parse(rawCurrentUser);
        if (parsedCur && parsedCur.password) {
          delete parsedCur.password;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsedCur));
        }
      }
    } catch (e) {}
    if (!localStorage.getItem(STORAGE_KEYS.MOVIES)) {
      localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(INITIAL_DATA.movies));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CINEMAS)) {
      localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(INITIAL_DATA.cinemas));
    }
    CinemaStorage.syncCinemaRooms();
    if (!localStorage.getItem(STORAGE_KEYS.COMBOS)) {
      localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(INITIAL_DATA.combos));
      localStorage.setItem(COMBO_CATALOG_MIGRATION_KEY, "true");
    } else {
      const savedCombos = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS));
      const defaultCombos = new Map(INITIAL_DATA.combos.map(combo => [combo.id, combo]));
      const syncedCombos = savedCombos.map(combo => {
        const defaultCombo = defaultCombos.get(combo.id);
        if (!defaultCombo) return combo;
        return {
          ...combo,
          image: combo.image && (/^https?:\/\//i.test(combo.image) || /^local-image:[\w-]+$/.test(combo.image))
            ? combo.image
            : defaultCombo.image,
          category: defaultCombo.category || combo.category || "combo"
        };
      });
      const needsComboCatalogMigration = !localStorage.getItem(COMBO_CATALOG_MIGRATION_KEY);
      if (needsComboCatalogMigration) {
        const savedIds = new Set(syncedCombos.map(combo => combo.id));
        INITIAL_DATA.combos.forEach(combo => {
          if (!savedIds.has(combo.id)) syncedCombos.push(combo);
        });
      }
      localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(syncedCombos));
      if (needsComboCatalogMigration) localStorage.setItem(COMBO_CATALOG_MIGRATION_KEY, "true");
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRICING)) {
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(INITIAL_DATA.pricing));
    }
    // Bảo mật Client: Tuyệt đối không lưu danh bạ người dùng vào localStorage của khách truy cập
    localStorage.removeItem(STORAGE_KEYS.USERS);
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      // Khởi tạo một vài vé mẫu để Admin có dữ liệu thống kê ban đầu
      const initialTickets = CinemaStorage.createSampleTickets();
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(initialTickets));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHOWTIMES)) {
      const showtimes = INITIAL_DATA.showtimes.map(st => {
        const room = CinemaStorage.getRoomById(st.cinemaId, st.roomId);
        return {
          ...st,
          seats: CinemaStorage.generateSeatMatrix(room ? room.type : "2D", room ? room.rows : 8, room ? room.cols : 10)
        };
      });
      // Đánh dấu các ghế đã bán tương ứng với initialTickets
      CinemaStorage.syncInitialSoldSeats(showtimes);
      localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
    }
    CinemaStorage.migrateSeedShowtimeRooms();
    CinemaStorage.migrateSweetboxSeats();

    // Luồng nền tự động giải phóng ghế giữ chỗ hết hạn (Giả lập background thread trong C++)
    setInterval(() => {
      CinemaStorage.cleanExpiredSeatHolds();
    }, 2000);

    // Đồng bộ tức thì với Backend Server (data/)
    CinemaStorage.syncWithBackend();

    // Định kỳ 5 giây cập nhật trạng thái suất chiếu & ghế từ server
    setInterval(() => {
      if (CinemaStorage.isBackendConnected) {
        fetch("/api/showtimes")
          .then(r => r.json())
          .then(res => {
            if (res && res.success && Array.isArray(res.showtimes)) {
              // Bảo lưu trạng thái giữ chỗ của phiên làm việc người dùng hiện tại
              const localShowtimes = CinemaStorage.getShowtimes();
              const mergedShowtimes = res.showtimes.map(serverSt => {
                const localSt = localShowtimes.find(l => l.id === serverSt.id);
                if (!localSt || !localSt.seats || !serverSt.seats) return serverSt;

                for (let r = 0; r < serverSt.seats.length; r++) {
                  for (let c = 0; c < serverSt.seats[r].length; c++) {
                    const serverSeat = serverSt.seats[r][c];
                    const localSeat = localSt.seats[r] ? localSt.seats[r][c] : null;
                    if (localSeat && localSeat.status === SEAT_STATUS.HOLDING && serverSeat.status !== SEAT_STATUS.SOLD) {
                      serverSeat.status = SEAT_STATUS.HOLDING;
                      serverSeat.holdByUserId = localSeat.holdByUserId || localSeat.heldBy;
                      serverSeat.holdExpiresAt = localSeat.holdExpiresAt || (Date.now() + 300000);
                      serverSeat.heldBy = localSeat.heldBy || localSeat.holdByUserId;
                      serverSeat.heldAt = localSeat.heldAt || Date.now();
                    }
                  }
                }
                return serverSt;
              });

              localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(mergedShowtimes));
              window.dispatchEvent(new CustomEvent("cinema:showtimes-updated", { detail: mergedShowtimes }));
            }
          })
          .catch(() => { });
      }
    }, 5000);
  }

  // Khởi tạo vé mẫu cho thống kê ban đầu
  static createSampleTickets() {
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
        customerName: "Khách hàng VIP 01",
        customerPhone: "090***1234",
        paymentMethod: "MOMO_QR",
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
        customerName: "Khách hàng 02",
        customerPhone: "091***5678",
        paymentMethod: "VNPAY",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        ticketId: "TK-20241025-003",
        showtimeId: "SC06",
        movieId: "P03",
        movieTitle: "Exhuma: Quật Mộ Trùng Ma",
        cinemaId: "R01",
        cinemaName: "Cinema Thủ Đức",
        roomName: "Phòng 02 (3D RealD)",
        roomType: "3D",
        date: getTodayDateString(0),
        startTime: "17:30",
        seats: [
          { code: "H1", type: "SWEETBOX", basePrice: 180000, roomSurcharge: 0, seatSurcharge: 0, total: 180000, pairCode: "H2" }
        ],
        combos: [
          { id: "CB03", name: "Combo Sweetbox VIP Couple", price: 139000, quantity: 1 }
        ],
        totalAmount: 319000,
        customerName: "Khách hàng 03",
        customerPhone: "098***6655",
        paymentMethod: "BANK_CARD",
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        ticketId: "TK-SAMPLE-R02-001",
        showtimeId: "SC08",
        movieId: "P04",
        movieTitle: "Godzilla x Kong: Đế Chế Mới",
        cinemaId: "R02",
        cinemaName: "Cinema Landmark 81",
        roomName: "Phòng Laser IMAX Grande",
        roomType: "IMAX",
        date: getTodayDateString(0),
        startTime: "10:30",
        seats: [
          { code: "D8", type: "VIP", basePrice: 95000, roomSurcharge: 70000, seatSurcharge: 20000, total: 185000 },
          { code: "D9", type: "VIP", basePrice: 95000, roomSurcharge: 70000, seatSurcharge: 20000, total: 185000 }
        ],
        combos: [],
        totalAmount: 370000,
        customerName: "Khách hàng 04",
        customerPhone: "090***4567",
        paymentMethod: "MOMO_QR",
        createdAt: new Date(Date.now() - 2700000).toISOString()
      },
      {
        ticketId: "TK-SAMPLE-R03-001",
        showtimeId: "SC09",
        movieId: "P05",
        movieTitle: "Mai",
        cinemaId: "R03",
        cinemaName: "Cinema Vạn Hạnh Mall",
        roomName: "Phòng 01 (2D Atmos)",
        roomType: "2D",
        date: getTodayDateString(0),
        startTime: "09:00",
        seats: [
          { code: "B4", type: "THUONG", basePrice: 85000, roomSurcharge: 0, seatSurcharge: 0, total: 85000 },
          { code: "B5", type: "THUONG", basePrice: 85000, roomSurcharge: 0, seatSurcharge: 0, total: 85000 }
        ],
        combos: [],
        totalAmount: 170000,
        customerName: "Khách hàng 05",
        customerPhone: "091***5678",
        paymentMethod: "VNPAY",
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ];
  }

  static syncInitialSoldSeats(showtimes) {
    const sampleTickets = CinemaStorage.createSampleTickets();
    sampleTickets.forEach(ticket => {
      const st = showtimes.find(s => s.id === ticket.showtimeId);
      if (st && st.seats) {
        ticket.seats.forEach(ts => {
          for (let r = 0; r < st.seats.length; r++) {
            for (let c = 0; c < st.seats[r].length; c++) {
              if (st.seats[r][c].code === ts.code) {
                st.seats[r][c].status = SEAT_STATUS.SOLD;
              }
            }
          }
        });
      }
    });
  }

  // ==========================================
  // FACTORY METHOD PATTERN: SuatChieuFactory
  // Sinh ma trận ghế theo quy tắc C++ chuẩn
  // ==========================================
  static generateSeatMatrix(roomType, rows = 8, cols = 10) {
    let vipStartRatio = 0;
    let vipEndRatio = 0;

    if (roomType === "3D") {
      vipStartRatio = 0.4;
      vipEndRatio = 0.7;
    } else if (roomType === "IMAX") {
      vipStartRatio = 0.3;
      vipEndRatio = 0.8;
    }

    const vipFromRow = Math.ceil(rows * vipStartRatio);
    const vipToRow = Math.ceil(rows * vipEndRatio);

    const matrix = [];
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r); // A, B, C...
      const rowSeats = [];
      const isLastRow = (r === rows - 1) && rows > 1;

      for (let c = 0; c < cols; c++) {
        const seatCode = `${rowLetter}${c + 1}`;
        if (isLastRow && c + 1 < cols) {
          const pairCode = `${rowLetter}${c + 2}`;
          const sweetboxId = `SW-${rowLetter}-${c + 1}-${c + 2}`;
          rowSeats.push({
            code: seatCode,
            row: r,
            col: c,
            type: "SWEETBOX",
            status: SEAT_STATUS.AVAILABLE,
            pairCode: pairCode,
            span: 2,
            sweetboxId: sweetboxId,
            holdExpiresAt: null,
            holdByUserId: null
          });
          c++;
        } else if (!isLastRow && r >= vipFromRow && r < vipToRow) {
          rowSeats.push({
            code: seatCode,
            row: r,
            col: c,
            type: "VIP",
            status: SEAT_STATUS.AVAILABLE,
            holdExpiresAt: null,
            holdByUserId: null
          });
        } else {
          rowSeats.push({
            code: seatCode,
            row: r,
            col: c,
            type: "THUONG",
            status: SEAT_STATUS.AVAILABLE,
            holdExpiresAt: null,
            holdByUserId: null
          });
        }
      }
      matrix.push(rowSeats);
    }
    return matrix;
  }

  static migrateSweetboxSeats() {
    const showtimes = CinemaStorage.getShowtimes();
    let changed = false;

    showtimes.forEach(showtime => {
      showtime.seats?.forEach(row => {
        for (let index = 0; index < row.length; index++) {
          const seat = row[index];
          if (seat.type !== "SWEETBOX") continue;

          if (seat.span !== 2) changed = true;
          seat.span = 2;
          if (!seat.pairCode) continue;

          const pairIndex = row.findIndex((candidate, candidateIndex) =>
            candidateIndex !== index && candidate.code === seat.pairCode && candidate.type === "SWEETBOX"
          );
          if (pairIndex === -1) continue;

          const pairSeat = row[pairIndex];
          if (seat.status === SEAT_STATUS.SOLD || pairSeat.status === SEAT_STATUS.SOLD) {
            seat.status = SEAT_STATUS.SOLD;
            seat.holdExpiresAt = null;
            seat.holdByUserId = null;
          } else if (seat.status === SEAT_STATUS.HOLDING || pairSeat.status === SEAT_STATUS.HOLDING) {
            const holdingSeat = seat.status === SEAT_STATUS.HOLDING ? seat : pairSeat;
            seat.status = SEAT_STATUS.HOLDING;
            seat.holdExpiresAt = holdingSeat.holdExpiresAt || null;
            seat.holdByUserId = holdingSeat.holdByUserId || null;
          }
          row.splice(pairIndex, 1);
          if (pairIndex < index) index--;
          changed = true;
        }
      });
    });

    if (changed) localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
  }

  // ==========================================
  // GETTERS DỮ LIỆU
  // ==========================================
  static getMovies() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVIES) || "[]");
  }

  static getMovieById(id) {
    return CinemaStorage.getMovies().find(m => m.id === id);
  }

  static getCinemas() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CINEMAS) || "[]");
  }

  static syncCinemaRooms() {
    const savedCinemas = CinemaStorage.getCinemas();
    const syncedCinemas = INITIAL_DATA.cinemas.map(defaultCinema => {
      const savedCinema = savedCinemas.find(cinema => cinema.id === defaultCinema.id);
      const savedRooms = savedCinema?.rooms || [];
      return {
        ...defaultCinema,
        ...savedCinema,
        rooms: defaultCinema.rooms.map(defaultRoom => ({
          ...defaultRoom,
          ...savedRooms.find(room => room.id === defaultRoom.id)
        }))
      };
    });
    localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(syncedCinemas));
  }

  static migrateSeedShowtimeRooms() {
    if (localStorage.getItem(SCHEDULE_ROOM_MIGRATION_KEY)) return;

    const roomAssignments = {
      SC56: "L81-IMAX-03",
      SC57: "L81-3D-04",
      SC58: "L81-3D-04",
      SC77: "VHM-3D-04",
      SC78: "VHM-3D-04",
      SC87: "VHM-3D-04",
      SC88: "VHM-3D-04"
    };
    const showtimes = CinemaStorage.getShowtimes();
    let changed = false;

    showtimes.forEach(showtime => {
      const newRoomId = roomAssignments[showtime.id];
      if (!newRoomId || !CinemaStorage.getRoomById(showtime.cinemaId, newRoomId)) return;
      showtime.roomId = newRoomId;
      changed = true;
    });

    if (changed) localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
    localStorage.setItem(SCHEDULE_ROOM_MIGRATION_KEY, "true");
  }

  static getCinemaById(id) {
    return CinemaStorage.getCinemas().find(c => c.id === id);
  }

  static getRoomById(cinemaId, roomId) {
    const cinema = CinemaStorage.getCinemaById(cinemaId);
    if (!cinema) return null;
    return cinema.rooms.find(r => r.id === roomId);
  }

  static getShowtimes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOWTIMES) || "[]");
  }

  static getShowtimeById(id) {
    return CinemaStorage.getShowtimes().find(s => s.id === id);
  }

  static getCombos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || "[]");
  }

  static getComboImageDatabase() {
    if (!("indexedDB" in window)) {
      return Promise.reject(new Error("Trình duyệt không hỗ trợ lưu trữ ảnh cục bộ (IndexedDB)."));
    }

    if (!CinemaStorage.imageDatabasePromise) {
      const openPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(COMBO_IMAGE_DATABASE, 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(COMBO_IMAGE_STORE)) {
            database.createObjectStore(COMBO_IMAGE_STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error("Không thể mở kho lưu trữ ảnh của trình duyệt."));
        request.onblocked = () => reject(new Error("Kho ảnh đang được sử dụng ở cửa sổ khác. Hãy tải lại trang rồi thử lại."));
      });
      CinemaStorage.imageDatabasePromise = openPromise.catch(error => {
        CinemaStorage.imageDatabasePromise = null;
        throw error;
      });
    }

    return CinemaStorage.imageDatabasePromise;
  }

  static validateComboImageFile(file) {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      throw new Error("Vui lòng chọn một tệp hình ảnh.");
    }
    if (file.size > MAX_COMBO_IMAGE_SIZE) {
      throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh có dung lượng tối đa 5 MB.");
    }
  }

  static async saveComboImage(file) {
    CinemaStorage.validateComboImageFile(file);
    const database = await CinemaStorage.getComboImageDatabase();
    const imageId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    await new Promise((resolve, reject) => {
      const transaction = database.transaction(COMBO_IMAGE_STORE, "readwrite");
      transaction.objectStore(COMBO_IMAGE_STORE).put(file, imageId);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error("Không thể lưu ảnh vào kho lưu trữ của trình duyệt."));
      transaction.onabort = () => reject(new Error("Đã hủy lưu ảnh."));
    });

    return `${COMBO_IMAGE_PREFIX}${imageId}`;
  }

  static async getComboImageObjectUrl(imageReference) {
    if (!imageReference || !imageReference.startsWith(COMBO_IMAGE_PREFIX)) return imageReference;
    if (CinemaStorage.comboImageObjectUrls.has(imageReference)) {
      return CinemaStorage.comboImageObjectUrls.get(imageReference);
    }

    const database = await CinemaStorage.getComboImageDatabase();
    const imageId = imageReference.slice(COMBO_IMAGE_PREFIX.length);
    const imageBlob = await new Promise((resolve, reject) => {
      const transaction = database.transaction(COMBO_IMAGE_STORE, "readonly");
      const request = transaction.objectStore(COMBO_IMAGE_STORE).get(imageId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error("Không thể đọc ảnh từ kho lưu trữ của trình duyệt."));
    });

    if (!imageBlob) throw new Error("Không tìm thấy ảnh đã tải lên. Vui lòng tải ảnh đó lên lại.");

    const objectUrl = URL.createObjectURL(imageBlob);
    CinemaStorage.comboImageObjectUrls.set(imageReference, objectUrl);
    return objectUrl;
  }

  static addCombo(comboData) {
    const combos = CinemaStorage.getCombos();
    const normalized = CinemaStorage.normalizeComboData(comboData);
    const prefix = normalized.category === "single" ? "SP" : "CB";
    let id;
    do {
      id = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    } while (combos.some(combo => combo.id === id));

    const combo = { id, ...normalized };
    combos.push(combo);
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(combos));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combo)
      }).catch(err => console.warn("Sync addCombo:", err));
    }

    return combo;
  }

  static updateCombo(id, updatedData) {
    const combos = CinemaStorage.getCombos();
    const index = combos.findIndex(combo => combo.id === id);
    if (index === -1) throw new Error("Không tìm thấy món cần cập nhật.");

    combos[index] = {
      ...combos[index],
      ...CinemaStorage.normalizeComboData({ ...combos[index], ...updatedData })
    };
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(combos));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/combos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combos[index])
      }).catch(err => console.warn("Sync updateCombo:", err));
    }

    return combos[index];
  }

  static async deleteCombo(id) {
    const combos = CinemaStorage.getCombos();
    const combo = combos.find(item => item.id === id);
    if (!combo) throw new Error("Không tìm thấy món cần xóa.");
    await CinemaStorage.deleteComboImage(combo.image);
    const remainingCombos = combos.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(remainingCombos));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/combos/${id}`, { method: "DELETE" }).catch(err => console.warn("Sync deleteCombo:", err));
    }
  }

  static async deleteComboImage(imageReference) {
    if (!imageReference || !imageReference.startsWith(COMBO_IMAGE_PREFIX)) return;

    const database = await CinemaStorage.getComboImageDatabase();
    const imageId = imageReference.slice(COMBO_IMAGE_PREFIX.length);
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(COMBO_IMAGE_STORE, "readwrite");
      transaction.objectStore(COMBO_IMAGE_STORE).delete(imageId);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error("Không thể xóa ảnh khỏi kho lưu trữ của trình duyệt."));
      transaction.onabort = () => reject(new Error("Đã hủy xóa ảnh."));
    });

    const objectUrl = CinemaStorage.comboImageObjectUrls.get(imageReference);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    CinemaStorage.comboImageObjectUrls.delete(imageReference);
  }

  static normalizeComboData(comboData) {
    const name = String(comboData.name || "").trim();
    const description = String(comboData.description || "").trim();
    const price = Number(comboData.price);
    const category = comboData.category || "combo";
    const image = String(comboData.image || "").trim();
    let imageUrl;

    if (!name) throw new Error("Vui lòng nhập tên món.");
    if (!description) throw new Error("Vui lòng nhập mô tả món.");
    if (!Number.isFinite(price) || price <= 0) throw new Error("Giá món phải lớn hơn 0.");
    if (!["combo", "single"].includes(category)) throw new Error("Loại món không hợp lệ.");

    if (/^local-image:[\w-]+$/.test(image)) {
      return { name, description, price, category, image };
    }

    try {
      imageUrl = new URL(image);
    } catch {
      throw new Error("Vui lòng nhập đường dẫn hình ảnh hợp lệ.");
    }

    if (!["http:", "https:"].includes(imageUrl.protocol)) {
      throw new Error("Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://.");
    }

    return { name, description, price, category, image: imageUrl.href };
  }

  static getPricing() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRICING) || "{}");
  }

  static getSoldTickets() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) || "[]");
  }

  static getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
  }

  // ==========================================
  // GIỮ GHẾ 5 PHÚT (300 SECONDS TIMEOUT)
  // Giả lập cơ chế background thread mutex C++
  // ==========================================
  static holdSeats(showtimeId, seatCodes, userId = "anonymous") {
    const showtimes = CinemaStorage.getShowtimes();
    const stIndex = showtimes.findIndex(s => s.id === showtimeId);
    if (stIndex === -1) throw new Error("Không tìm thấy suất chiếu.");

    const st = showtimes[stIndex];
    const holdDurationMs = 300 * 1000; // 5 phút = 300 giây
    const expiresAt = Date.now() + holdDurationMs;

    // Kiểm tra xem có ghế nào đã bị giữ hoặc bán không
    seatCodes.forEach(code => {
      const seat = CinemaStorage.findSeatInMatrix(st.seats, code);
      if (!seat) throw new Error(`Ghế ${code} không tồn tại.`);
      if (seat.status === SEAT_STATUS.SOLD) {
        throw new Error(`Ghế ${code} đã được bán cho khách hàng khác.`);
      }
      if (seat.status === SEAT_STATUS.HOLDING && seat.holdByUserId !== userId && seat.holdExpiresAt > Date.now()) {
        throw new Error(`Ghế ${code} đang được khách khác giữ chỗ.`);
      }
    });

    // Cập nhật trạng thái giữ chỗ
    seatCodes.forEach(code => {
      const seat = CinemaStorage.findSeatInMatrix(st.seats, code);
      if (seat) {
        seat.status = SEAT_STATUS.HOLDING;
        seat.holdExpiresAt = expiresAt;
        seat.holdByUserId = userId;
        seat.heldBy = userId;
        seat.heldAt = Date.now();
      }
    });

    showtimes[stIndex] = st;
    localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/seats/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showtimeId, seatCodes, userId })
      }).catch(err => console.warn("Sync holdSeats:", err));
    }

    return { success: true, expiresAt: expiresAt };
  }

  static releaseSeats(showtimeId, seatCodes, userId = null) {
    const showtimes = CinemaStorage.getShowtimes();
    const stIndex = showtimes.findIndex(s => s.id === showtimeId);
    if (stIndex === -1) return;

    const st = showtimes[stIndex];
    seatCodes.forEach(code => {
      const seat = CinemaStorage.findSeatInMatrix(st.seats, code);
      if (seat && seat.status === SEAT_STATUS.HOLDING) {
        const holder = seat.holdByUserId || seat.heldBy;
        if (!userId || holder === userId || holder === "anonymous") {
          seat.status = SEAT_STATUS.AVAILABLE;
          seat.holdExpiresAt = null;
          seat.holdByUserId = null;
          seat.heldBy = null;
          seat.heldAt = null;
        }
      }
    });

    showtimes[stIndex] = st;
    localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/seats/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showtimeId, seatCodes, userId })
      }).catch(err => console.warn("Sync releaseSeats:", err));
    }
  }

  // Tự động thu hồi ghế giữ chỗ đã hết hạn 5 phút
  static cleanExpiredSeatHolds() {
    const showtimes = CinemaStorage.getShowtimes();
    const now = Date.now();
    let changed = false;

    showtimes.forEach(st => {
      if (!st.seats) return;
      for (let r = 0; r < st.seats.length; r++) {
        for (let c = 0; c < st.seats[r].length; c++) {
          const seat = st.seats[r][c];
          if (seat.status === SEAT_STATUS.HOLDING && seat.holdExpiresAt && seat.holdExpiresAt <= now) {
            seat.status = SEAT_STATUS.AVAILABLE;
            seat.holdExpiresAt = null;
            seat.holdByUserId = null;
            changed = true;
          }
        }
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
    }
  }

  static findSeatInMatrix(matrix, code) {
    if (!matrix) return null;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c].code === code) return matrix[r][c];
      }
    }
    return null;
  }

  // ==========================================
  // DECORATOR PATTERN: TÍNH TIỀN VÉ & COMBO
  // ==========================================
  static calculateOrderSummary(movie, room, selectedSeats, selectedCombos = []) {
    const pricing = CinemaStorage.getPricing();
    const roomSurcharge = pricing.roomSurcharges[room.type] || 0;
    const sweetboxPrice = pricing.sweetboxPrice || 180000;

    let ticketsTotal = 0;
    const ticketBreakdown = selectedSeats.map(seat => {
      const seatSurcharge = pricing.seatSurcharges[seat.type] || 0;
      const isSweetbox = seat.type === "SWEETBOX";
      const seatPrice = isSweetbox ? sweetboxPrice : movie.basePrice + roomSurcharge + seatSurcharge;
      ticketsTotal += seatPrice;
      return {
        code: seat.pairCode ? `${seat.code}-${seat.pairCode}` : seat.code,
        type: seat.type,
        basePrice: isSweetbox ? sweetboxPrice : movie.basePrice,
        roomSurcharge: isSweetbox ? 0 : roomSurcharge,
        seatSurcharge: isSweetbox ? 0 : seatSurcharge,
        price: seatPrice
      };
    });

    let combosTotal = 0;
    const comboBreakdown = selectedCombos.filter(c => c.quantity > 0).map(c => {
      const subtotal = c.price * c.quantity;
      combosTotal += subtotal;
      return {
        id: c.id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        subtotal: subtotal
      };
    });

    let vipDiscount = 0;
    let vipDiscountDesc = "";
    const user = CinemaStorage.getCurrentUser();
    if (user) {
      if (user.membershipTier === "VIP Gold") {
        vipDiscount = Math.round(ticketsTotal * 0.05);
        vipDiscountDesc = "Ưu đãi thành viên VIP Gold (-5% giá vé)";
      } else if (user.membershipTier === "Platinum" || user.membershipTier === "VIP Platinum") {
        vipDiscount = Math.round((ticketsTotal + combosTotal) * 0.10);
        vipDiscountDesc = "Ưu đãi đặc quyền Platinum (-10% tổng hóa đơn)";
      }
    }

    const grandTotal = Math.max(0, ticketsTotal + combosTotal - vipDiscount);

    return {
      movieTitle: movie.title,
      roomType: room.type,
      roomName: room.name,
      ticketBreakdown,
      ticketsTotal,
      comboBreakdown,
      combosTotal,
      vipDiscount,
      vipDiscountDesc,
      grandTotal
    };
  }

  // ==========================================
  // THANH TOÁN VÉ (CHECKOUT)
  // ==========================================
  static checkoutOrder({ showtimeId, seats, combos, customer }) {
    const currentUser = CinemaStorage.getCurrentUser();
    if (!currentUser) throw new Error("Vui lòng đăng nhập trước khi đặt vé.");

    const showtimes = CinemaStorage.getShowtimes();
    const stIndex = showtimes.findIndex(s => s.id === showtimeId);
    if (stIndex === -1) throw new Error("Suất chiếu không tồn tại.");

    const st = showtimes[stIndex];
    const movie = CinemaStorage.getMovieById(st.movieId);
    const cinema = CinemaStorage.getCinemaById(st.cinemaId);
    const room = CinemaStorage.getRoomById(st.cinemaId, st.roomId);

    seats.forEach(selectedSeat => {
      const seat = CinemaStorage.findSeatInMatrix(st.seats, selectedSeat.code);
      if (!seat) {
        throw new Error(`Ghế ${selectedSeat.code} không tồn tại.`);
      }
      if (seat.status === SEAT_STATUS.SOLD) {
        throw new Error(`Ghế ${selectedSeat.code} đã được đặt mua bởi người khác.`);
      }
      const holder = seat.holdByUserId || seat.heldBy;
      if (seat.status === SEAT_STATUS.HOLDING && holder &&
          holder !== currentUser.id && holder !== currentUser.email &&
          holder !== currentUser.fullName && holder !== "anonymous" &&
          seat.holdExpiresAt && seat.holdExpiresAt > Date.now()) {
        throw new Error(`Ghế ${selectedSeat.code} đang được người khác giữ chỗ.`);
      }
    });

    // Chuyển ghế sang DA_BAN (SOLD)
    seats.forEach(s => {
      const seat = CinemaStorage.findSeatInMatrix(st.seats, s.code);
      if (seat) {
        seat.status = SEAT_STATUS.SOLD;
        seat.holdExpiresAt = null;
        seat.holdByUserId = null;
        seat.heldBy = currentUser.fullName || currentUser.id;
        seat.heldAt = null;
      }
    });

    showtimes[stIndex] = st;
    localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));

    // Tính tiền
    const orderCalc = CinemaStorage.calculateOrderSummary(movie, room, seats, combos);

    // Tạo mã vé duy nhất
    const ticketId = `TK-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

    const newTicket = {
      ticketId,
      showtimeId: st.id,
      movieId: movie.id,
      movieTitle: movie.title,
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      cinemaAddress: cinema.address,
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      date: st.date,
      startTime: st.startTime,
      endTime: st.endTime,
      seats: orderCalc.ticketBreakdown,
      combos: orderCalc.comboBreakdown,
      subtotal: orderCalc.ticketsTotal + orderCalc.combosTotal,
      vipDiscount: orderCalc.vipDiscount || 0,
      vipDiscountDesc: orderCalc.vipDiscountDesc || "",
      totalAmount: orderCalc.grandTotal,
      customerName: customer.name || currentUser.fullName || "Khách Hàng",
      customerPhone: customer.phone || currentUser.phone || "0900000000",
      customerEmail: customer.email || currentUser.email || "",
      userId: currentUser.id,
      paymentMethod: customer.paymentMethod || "CASH_COUNTER",
      paymentStatus: "PAID",
      status: "PAID",
      createdAt: new Date().toISOString()
    };

    // Tích lũy điểm thưởng và tự động thăng hạng VIP
    const earnRate = currentUser.membershipTier === "Platinum" ? 0.10 : currentUser.membershipTier === "VIP Gold" ? 0.07 : 0.05;
    const earnedPoints = Math.max(5, Math.floor((orderCalc.grandTotal * earnRate) / 1000));
    currentUser.points = (currentUser.points || 0) + earnedPoints;
    if (currentUser.points >= 500) currentUser.membershipTier = "Platinum";
    else if (currentUser.points >= 200) currentUser.membershipTier = "VIP Gold";

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    const allUsers = CinemaStorage.getUsers();
    const uIdx = allUsers.findIndex(u => u.id === currentUser.id);
    if (uIdx !== -1) {
      allUsers[uIdx].points = currentUser.points;
      allUsers[uIdx].membershipTier = currentUser.membershipTier;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
    }

    const tickets = CinemaStorage.getSoldTickets();
    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));

    // Đồng bộ tức thời về Backend REST API
    if (CinemaStorage.isBackendConnected) {
      fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: st.id,
          seats: seats,
          combos: combos,
          customer: {
            id: currentUser.id,
            fullName: customer.name || currentUser.fullName,
            phone: customer.phone || currentUser.phone,
            email: customer.email || currentUser.email,
            paymentMethod: newTicket.paymentMethod
          }
        })
      })
        .then(res => res.json())
        .then(res => {
          if (res && res.success) {
            CinemaStorage.syncWithBackend();
          }
        })
        .catch(err => console.warn("Sync checkoutOrder:", err));
    }

    return newTicket;
  }

  // ==========================================
  // ADMIN: KIỂM TRA TRÙNG LỊCH CHIẾU (SCHEDULE CONFLICT)
  // Tương đương ScheduleConflictException trong C++
  // ==========================================
  static checkScheduleConflict({ cinemaId, roomId, date, startTime, durationMinutes, excludeShowtimeId = null }) {
    const showtimes = CinemaStorage.getShowtimes();
    const newStartMinutes = CinemaStorage.toScheduleMinute(date, startTime);
    const newEndMinutes = newStartMinutes + durationMinutes + 15;

    for (const st of showtimes) {
      if (excludeShowtimeId && st.id === excludeShowtimeId) continue;
      if (st.cinemaId !== cinemaId || st.roomId !== roomId) continue;

      const existingStartMinutes = CinemaStorage.toScheduleMinute(st.date, st.startTime);
      let existingEndTime = st.endTime;
      if (!existingEndTime) {
        const existingMovie = CinemaStorage.getMovieById(st.movieId);
        if (!existingMovie) continue;
        const endMinuteOfDay = (Number(st.startTime.slice(0, 2)) * 60) +
          Number(st.startTime.slice(3, 5)) + existingMovie.duration + 15;
        existingEndTime = `${String(Math.floor(endMinuteOfDay / 60) % 24).padStart(2, "0")}:${String(endMinuteOfDay % 60).padStart(2, "0")}`;
      }

      let existingEndMinutes = CinemaStorage.toScheduleMinute(st.date, existingEndTime);
      if (existingEndMinutes <= existingStartMinutes) existingEndMinutes += 24 * 60;

      if (newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes) {
        const conflictingMovie = CinemaStorage.getMovieById(st.movieId);
        const room = CinemaStorage.getRoomById(st.cinemaId, st.roomId);
        return {
          conflict: true,
          conflictingShowtime: st,
          movieTitle: conflictingMovie ? conflictingMovie.title : "Phim khác",
          roomName: room ? room.name : st.roomId,
          timeRange: `${st.startTime} - ${st.endTime}`
        };
      }
    }

    return { conflict: false };
  }

  static toScheduleMinute(date, time) {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time || "");
    if (!dateMatch || !timeMatch) throw new Error("Ngày hoặc giờ chiếu không hợp lệ.");

    const [, year, month, day] = dateMatch;
    const dateValue = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (dateValue.getUTCFullYear() !== Number(year) ||
      dateValue.getUTCMonth() !== Number(month) - 1 ||
      dateValue.getUTCDate() !== Number(day)) {
      throw new Error("Ngày chiếu không hợp lệ.");
    }

    return Math.floor(dateValue.getTime() / 60000) +
      Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  }

  // Thêm suất chiếu mới (Có kiểm tra xung đột)
  static addShowtime({ movieId, cinemaId, roomId, date, startTime }) {
    const today = getTodayDateString(0);
    const maxDay = getTodayDateString(5);
    if (!date || date < today) {
      throw new Error("Không được lên lịch suất chiếu trong quá khứ! Chỉ được lên lịch từ hôm nay.");
    }
    if (date > maxDay) {
      throw new Error(`Chỉ được phép lên lịch tối đa 5 ngày tiếp theo (tới ngày ${maxDay})!`);
    }
    const movie = CinemaStorage.getMovieById(movieId);
    if (!movie) throw new Error("Phim không tồn tại.");

    const cinema = CinemaStorage.getCinemaById(cinemaId);
    if (!cinema) throw new Error("Cụm rạp không tồn tại.");

    const room = CinemaStorage.getRoomById(cinemaId, roomId);
    if (!room) throw new Error("Phòng chiếu không tồn tại.");
    if (!Number.isFinite(movie.duration) || movie.duration <= 0) {
      throw new Error("Thời lượng phim không hợp lệ, không thể lên lịch.");
    }
    CinemaStorage.toScheduleMinute(date, startTime);

    // Kiểm tra trùng lịch
    const conflictCheck = CinemaStorage.checkScheduleConflict({
      cinemaId, roomId, date, startTime, durationMinutes: movie.duration
    });
    if (conflictCheck.conflict) {
      throw new Error(`XUNG ĐỘT LỊCH CHIẾU: ${conflictCheck.roomName} đã có suất phim "${conflictCheck.movieTitle}" lúc ${conflictCheck.timeRange} (đã tính 15 phút dọn phòng). Vui lòng chọn phòng hoặc giờ khác.`);
    }

    // Tính giờ kết thúc = startTime + duration + 15 phút
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + m + movie.duration + 15;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
    const endM = String(totalMinutes % 60).padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    const showtimes = CinemaStorage.getShowtimes();
    let nextId = showtimes.length + 1;
    while (showtimes.some(showtime => showtime.id === `SC${String(nextId).padStart(2, "0")}`)) {
      nextId++;
    }
    const newId = `SC${String(nextId).padStart(2, "0")}`;
    const newShowtime = {
      id: newId,
      movieId,
      cinemaId,
      roomId,
      date,
      startTime,
      endTime,
      seats: CinemaStorage.generateSeatMatrix(room.type, room.rows, room.cols)
    };

    showtimes.push(newShowtime);
    localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, cinemaId, roomId, date, startTime })
      }).catch(err => console.warn("Sync addShowtime:", err));
    }

    return newShowtime;
  }

  static deleteShowtime(id) {
    const showtimes = CinemaStorage.getShowtimes().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/showtimes/${id}`, { method: "DELETE" }).catch(err => console.warn("Sync deleteShowtime:", err));
    }
  }

  // ==========================================
  // ADMIN: QUẢN LÝ PHIM
  // ==========================================
  static addMovie(movieData) {
    const movies = CinemaStorage.getMovies();
    const newId = `P${String(movies.length + 1).padStart(2, "0")}`;
    const newMovie = {
      ...movieData,
      id: newId,
      basePrice: Number(movieData.basePrice) || 80000,
      duration: Number(movieData.duration) || 120,
      rating: Number(movieData.rating) || 8.0
    };
    movies.push(newMovie);
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovie)
      }).catch(err => console.warn("Sync addMovie:", err));
    }

    return newMovie;
  }

  static updateMovie(id, updatedData) {
    const movies = CinemaStorage.getMovies();
    const index = movies.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Phim không tồn tại");
    movies[index] = { ...movies[index], ...updatedData };
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/movies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movies[index])
      }).catch(err => console.warn("Sync updateMovie:", err));
    }
    window.dispatchEvent(new CustomEvent("cinema:data-synced", { detail: { type: "movies", movie: movies[index] } }));
    return movies[index];
  }

  static updateMovieStatus(id, newStatus) {
    const movies = CinemaStorage.getMovies();
    const movie = movies.find(m => m.id === id);
    if (!movie) throw new Error("Phim không tồn tại");
    movie.status = newStatus; // 'now_showing' | 'coming_soon' | 'stopped'
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/movies/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      }).catch(err => console.warn("Sync updateMovieStatus:", err));
    }

    return movie;
  }


  static deleteMovie(id) {
    const movies = CinemaStorage.getMovies().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/movies/${id}`, { method: "DELETE" }).catch(err => console.warn("Sync deleteMovie:", err));
    }
  }

  // ==========================================
  // ADMIN: THỐNG KÊ DOANH THU ĐA CHIỀU (Bảo's Module)
  // Theo 3 tiêu chí: THEO_PHIM, THEO_PHONG_CHIEU, THEO_SUAT_CHIEU
  // ==========================================
  static getRevenueStatistics(criteria = "movie", cinemaId = null) {
    let tickets = CinemaStorage.getSoldTickets().filter(ticket =>
      ticket.paymentStatus ? ticket.paymentStatus === "PAID" : ticket.paymentMethod !== "CASH_COUNTER"
    );
    if (cinemaId) {
      tickets = tickets.filter(t => t.cinemaId === cinemaId);
    }
    const movies = CinemaStorage.getMovies();
    const showtimes = CinemaStorage.getShowtimes();

    let totalRevenue = 0;
    let totalTickets = 0;

    const statsMap = {};

    tickets.forEach(ticket => {
      totalRevenue += ticket.totalAmount;
      const ticketCount = ticket.seats.length;
      totalTickets += ticketCount;

      let key = "";
      let name = "";

      if (criteria === "movie") {
        key = ticket.movieId;
        name = ticket.movieTitle;
      } else if (criteria === "room") {
        key = ticket.roomType;
        name = `Phòng ${ticket.roomType}`;
      } else if (criteria === "showtime") {
        key = ticket.showtimeId;
        name = `Suất ${ticket.showtimeId} (${ticket.movieTitle} - ${ticket.startTime})`;
      }

      if (!statsMap[key]) {
        statsMap[key] = {
          key,
          name,
          ticketsSold: 0,
          revenue: 0
        };
      }
      statsMap[key].ticketsSold += ticketCount;
      statsMap[key].revenue += ticket.totalAmount;
    });

    const items = Object.values(statsMap).map(item => {
      const percentage = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0;
      const avgPrice = item.ticketsSold > 0 ? Math.round(item.revenue / item.ticketsSold) : 0;
      return {
        ...item,
        percentage: Number(percentage),
        avgPrice
      };
    });

    // Sắp xếp doanh thu giảm dần
    items.sort((a, b) => b.revenue - a.revenue);

    return {
      criteria,
      totalRevenue,
      totalTickets,
      avgPerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      topItem: items[0] || null,
      items
    };
  }

  // Xuất file báo cáo text chuẩn như C++ report_doanh_thu.txt
  static exportRevenueReportText(criteria = "movie", cinemaId = null) {
    const stats = CinemaStorage.getRevenueStatistics(criteria, cinemaId);
    const dateStr = new Date().toLocaleString("vi-VN");

    let report = `========================================================================\n`;
    report += `             BÁO CÁO THỐNG KÊ DOANH THU RẠP CHIẾU PHIM                 \n`;
    report += `========================================================================\n`;
    report += `Thời gian xuất báo cáo: ${dateStr}\n`;
    report += `Tiêu chí thống kê     : ${criteria === "movie" ? "THEO PHIM" : criteria === "room" ? "THEO PHÒNG CHIẾU" : "THEO SUẤT CHIẾU"}\n`;
    report += `Tổng doanh thu toàn rạp: ${stats.totalRevenue.toLocaleString()} VNĐ\n`;
    report += `Tổng số vé bán ra      : ${stats.totalTickets} vé\n`;
    report += `Doanh thu TB mỗi vé    : ${stats.avgPerTicket.toLocaleString()} VNĐ\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `${"Tên Đối Tượng".padEnd(35)} | ${"Vé Bán".padStart(8)} | ${"Doanh Thu (VNĐ)".padStart(16)} | ${"Tỷ Trọng".padStart(8)}\n`;
    report += `------------------------------------------------------------------------\n`;

    stats.items.forEach(item => {
      const name = item.name.length > 33 ? item.name.substring(0, 30) + "..." : item.name;
      report += `${name.padEnd(35)} | ${String(item.ticketsSold).padStart(8)} | ${item.revenue.toLocaleString().padStart(16)} | ${(item.percentage + "%").padStart(8)}\n`;
    });

    report += `========================================================================\n`;
    if (stats.topItem) {
      report += `>> Đối tượng dẫn đầu doanh thu: ${stats.topItem.name} (${stats.topItem.revenue.toLocaleString()} VNĐ - ${stats.topItem.percentage}%)\n`;
    }
    report += `========================================================================\n`;
    report += `Hệ thống Quản lý Rạp Chiếu Phim - Cinema Management (OOP Project)\n`;

    // Đồng bộ xuất file trên server nếu có kết nối backend
    if (CinemaStorage.isBackendConnected) {
      const reportApiUrl = `/api/reports/revenue?criteria=${encodeURIComponent(criteria)}${cinemaId ? `&cinemaId=${encodeURIComponent(cinemaId)}` : ""}`;
      fetch(reportApiUrl).catch(err => console.warn("Sync report:", err));
    }

    return report;
  }

  // ==========================================
  // XÁC THỰC USER & ADMIN
  // ==========================================
  static async loginUser(email, password) {
    if (CinemaStorage.isBackendConnected) {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data && data.success && data.user) {
        const { password: _, ...safeUser } = data.user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
        return safeUser;
      }
      throw new Error(data.message || "Email hoặc mật khẩu không chính xác.");
    }
    throw new Error("Không thể kết nối đến máy chủ xác thực tài khoản.");
  }

  static registerUser({ fullName, email, password, phone }) {
    const users = CinemaStorage.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email này đã được đăng ký tài khoản.");
    }
    const newUser = {
      id: `U${String(users.length + 1).padStart(2, "0")}`,
      fullName,
      email,
      phone,
      membershipTier: "Standard",
      points: 50
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phone })
      }).catch(err => console.warn("Sync registerUser:", err));
    }

    return newUser;
  }

  static getCurrentUser() {
    const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
  }

  // HỦY VÉ VÀ GIẢI PHÓNG GHẾ (RÀNG BUỘC: HỦY TRƯỚC GIỜ CHIẾU ÍT NHẤT 1 TIẾNG)
  static cancelTicket(ticketId, reason = "Khách hàng yêu cầu hủy vé", isCustomer = false) {
    const tickets = CinemaStorage.getSoldTickets();
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) throw new Error("Không tìm thấy thông tin vé cần hủy.");
    if (ticket.status === "CANCELLED") throw new Error("Vé này đã được hủy trước đó.");

    // Kiểm tra ràng buộc hủy vé phía khách hàng: phải trước giờ chiếu tối thiểu 60 phút
    if (isCustomer && ticket.date && ticket.startTime) {
      const showtimeDateTime = new Date(`${ticket.date}T${ticket.startTime}:00`).getTime();
      const now = Date.now();
      const diffMinutes = (showtimeDateTime - now) / (1000 * 60);
      if (diffMinutes < 60) {
        throw new Error("Không thể hủy vé! Quy định chỉ cho phép hủy vé trước giờ bắt đầu suất chiếu ít nhất 60 phút.");
      }
    }

    ticket.status = "CANCELLED";
    ticket.cancelledAt = new Date().toISOString();
    ticket.cancelReason = reason;

    // Giải phóng ghế trong suất chiếu
    const showtimes = CinemaStorage.getShowtimes();
    const st = showtimes.find(s => s.id === ticket.showtimeId);
    if (st && st.seats) {
      const seatCodes = ticket.seats.map(s => s.code || s);
      seatCodes.forEach(code => {
        const seat = CinemaStorage.findSeatInMatrix(st.seats, code);
        if (seat) {
          seat.status = SEAT_STATUS.AVAILABLE;
          seat.holdByUserId = null;
          seat.holdExpiresAt = null;
        }
      });
      localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
    }

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));

    // Khấu trừ điểm tích lũy của khách hàng
    const currentUser = CinemaStorage.getCurrentUser();
    if (currentUser && (ticket.userId === currentUser.id)) {
      const deducted = Math.floor((ticket.totalAmount || 0) / 10000);
      currentUser.points = Math.max(0, (currentUser.points || 0) - deducted);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      const users = CinemaStorage.getUsers();
      const uIdx = users.findIndex(u => u.id === currentUser.id);
      if (uIdx !== -1) {
        users[uIdx].points = currentUser.points;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }

    if (CinemaStorage.isBackendConnected) {
      const cancelPayload = { ticketId, reason };
      if (currentUser && currentUser.id) {
        cancelPayload.userId = currentUser.id;
      }
      if (ticket.customerPhone) {
        cancelPayload.customerPhone = ticket.customerPhone;
      }
      fetch("/api/tickets/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cancelPayload)
      }).catch(err => console.warn("Sync cancelTicket:", err));
    }

    window.dispatchEvent(new CustomEvent("cinema:ticket-cancelled", { detail: { ticketId } }));
    return ticket;
  }

  // NÂNG CẤP HẠNG THÀNH VIÊN
  static upgradeUserTier(userId, targetTier) {
    const users = CinemaStorage.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("Không tìm thấy người dùng.");

    if (targetTier === "VIP Gold") {
      if ((user.points || 0) < 200) throw new Error("Cần tối thiểu 200 điểm tích lũy để nâng hạng VIP Gold!");
      user.membershipTier = "VIP Gold";
    } else if (targetTier === "Platinum" || targetTier === "VIP Platinum") {
      if ((user.points || 0) < 500) throw new Error("Cần tối thiểu 500 điểm tích lũy để nâng hạng Platinum!");
      user.membershipTier = "Platinum";
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const current = CinemaStorage.getCurrentUser();
    if (current && current.id === userId) {
      current.membershipTier = user.membershipTier;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(current));
    }

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/users/upgrade-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetTier })
      }).catch(err => console.warn("Sync upgradeUserTier:", err));
    }

    return user;
  }

  // QUẢN LÝ CỤM RẠP & PHÒNG CHIẾU
  static addCinema(cinemaData) {
    const cinemas = CinemaStorage.getCinemas();
    const newId = `R${String(cinemas.length + 1).padStart(2, "0")}`;
    const newCinema = {
      id: newId,
      name: cinemaData.name || "Cụm Rạp Mới",
      address: cinemaData.address || "",
      phone: cinemaData.phone || "1900 6000",
      rooms: cinemaData.rooms || [
        { id: `${newId}-2D-01`, name: "Phòng 01 (2D Standard)", type: "2D", rows: 8, cols: 10, surcharge: 0 },
        { id: `${newId}-3D-02`, name: "Phòng 02 (3D RealD)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: `${newId}-IMAX-03`, name: "Phòng 03 (IMAX Laser)", type: "IMAX", rows: 12, cols: 16, surcharge: 70000 }
      ]
    };

    cinemas.push(newCinema);
    localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(cinemas));

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/cinemas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCinema)
      }).catch(err => console.warn("Sync addCinema:", err));
    }

    return newCinema;
  }

  static deleteCinema(id) {
    const cinemas = CinemaStorage.getCinemas().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(cinemas));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/cinemas/${id}`, { method: "DELETE" }).catch(err => console.warn("Sync deleteCinema:", err));
    }
  }

  static addRoomToCinema(cinemaId, roomData) {
    const cinemas = CinemaStorage.getCinemas();
    const cinema = cinemas.find(c => c.id === cinemaId);
    if (!cinema) throw new Error("Không tìm thấy cụm rạp.");

    const type = roomData.type || "2D";
    const newRoom = {
      id: `${cinemaId}-${type}-${String(cinema.rooms.length + 1).padStart(2, "0")}`,
      name: roomData.name || `Phòng ${cinema.rooms.length + 1} (${type})`,
      type,
      rows: Number(roomData.rows) || 8,
      cols: Number(roomData.cols) || 10,
      surcharge: Number(roomData.surcharge) !== undefined ? Number(roomData.surcharge) : (type === "IMAX" ? 70000 : type === "3D" ? 30000 : 0)
    };

    cinema.rooms.push(newRoom);
    localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(cinemas));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/cinemas/${cinemaId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom)
      }).catch(err => console.warn("Sync addRoomToCinema:", err));
    }

    return newRoom;
  }

  static deleteRoomFromCinema(cinemaId, roomId) {
    const cinemas = CinemaStorage.getCinemas();
    const cinema = cinemas.find(c => c.id === cinemaId);
    if (!cinema) throw new Error("Không tìm thấy cụm rạp.");

    cinema.rooms = cinema.rooms.filter(r => r.id !== roomId);
    localStorage.setItem(STORAGE_KEYS.CINEMAS, JSON.stringify(cinemas));

    if (CinemaStorage.isBackendConnected) {
      fetch(`/api/cinemas/${cinemaId}/rooms/${roomId}`, { method: "DELETE" })
        .catch(err => console.warn("Sync deleteRoomFromCinema:", err));
    }
  }

  static logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Tự động phân loại trạng thái phim ("Sắp chiếu", "Đang chiếu", "Ngưng chiếu") dựa trên lịch chiếu thực tế
  static autoUpdateMovieStatuses() {
    const movies = CinemaStorage.getMovies();
    const showtimes = CinemaStorage.getShowtimes();
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
      localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
      window.dispatchEvent(new CustomEvent("cinema:movies-status-updated", { detail: { movies } }));
    }
    return movies;
  }

  // Xác thực tài khoản quản lý Cụm rạp (Cluster-based Manager) qua máy chủ Backend
  static async verifyAdminPassword(credentials) {
    if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
      return {
        success: false,
        message: "Không thể xác thực khi mở file trực tiếp (file://). Vui lòng chạy `npm start` và truy cập qua địa chỉ máy chủ Node.js (ví dụ http://localhost:8099/admin.html)!"
      };
    }

    const payload = typeof credentials === "object" ? credentials : { password: credentials };
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return {
          success: false,
          message: "API xác thực không phản hồi JSON (bạn đang mở bằng Live Server?). Vui lòng chạy `npm start` và mở trang Admin từ máy chủ Node.js (http://localhost:8099/admin.html)!"
        };
      }
      const data = await res.json();
      if (data && data.success) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
        // Token được lưu an toàn trong HttpOnly Cookie từ backend, tuyệt đối không lưu vào Web Storage
        if (data.manager) sessionStorage.setItem("cinema_branch_manager", JSON.stringify(data.manager));
        return { success: true, manager: data.manager };
      }
      return { success: false, message: data.message || "Tài khoản hoặc mật khẩu không chính xác!" };
    } catch (err) {
      return {
        success: false,
        message: "Không thể kết nối tới máy chủ Backend! Hãy kiểm tra đã chạy `npm start` (node server.js) chưa và truy cập đúng cổng trong .env."
      };
    }
  }

  // Lấy thông tin Cụm rạp của Quản lý đang đăng nhập
  static getCurrentBranchManager() {
    const saved = sessionStorage.getItem("cinema_branch_manager");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  }

  static isAdminAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";
  }

  static async adminLogout() {
    try {
      await fetch("/api/auth/admin-logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {}
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    sessionStorage.removeItem("cinema_admin_token");
    sessionStorage.removeItem("cinema_branch_manager");
  }

  // Khôi phục dữ liệu gốc
  static resetToDefaultData() {
    localStorage.clear();
    CinemaStorage.init();

    if (CinemaStorage.isBackendConnected) {
      fetch("/api/reset", { method: "POST" })
        .then(() => CinemaStorage.syncWithBackend())
        .catch(err => console.warn("Sync reset:", err));
    }
  }
}

// Khởi chạy hệ thống storage
CinemaStorage.init();
