/**
 * Cinema Management System - Admin Portal Logic
 * Quản trị hệ thống: Xác thực mật khẩu, Thống kê doanh thu đa chiều, Lên lịch chiếu chống trùng, Giám sát ghế
 */

const AdminState = {
  currentTab: "dashboard",
  statsCriteria: "movie", // 'movie' | 'room' | 'showtime'
  selectedMonitorShowtimeId: null,
  monitorRefreshInterval: null,
  ticketFilter: "all",
  ticketSearchQuery: ""
};

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  initAdminTabs();

  // Tự động làm mới bảng quản trị khi backend data/ đồng bộ
  window.addEventListener("cinema:data-synced", () => {
    if (CinemaStorage.isAdminAuthenticated()) {
      loadTabContent(AdminState.currentTab);
    }
  });
});

// ==========================================
// 1. ADMIN AUTHENTICATION (BẢO MẬT ĐĂNG NHẬP)
// ==========================================
function checkAdminAuth() {
  const loginWrapper = document.getElementById("adminLoginWrapper");
  const adminLayout = document.getElementById("adminMainLayout");

  if (CinemaStorage.isAdminAuthenticated()) {
    if (loginWrapper) loginWrapper.style.display = "none";
    if (adminLayout) adminLayout.style.display = "flex";
    loadTabContent(AdminState.currentTab);
  } else {
    if (loginWrapper) loginWrapper.style.display = "flex";
    if (adminLayout) adminLayout.style.display = "none";
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const passInput = document.getElementById("adminPasswordInput");
  const password = passInput.value.trim();

  try {
    const isOk = await CinemaStorage.verifyAdminPassword(password);
    if (isOk) {
      passInput.value = "";
      checkAdminAuth();
      showAdminToast("Đăng nhập quyền Quản trị viên thành công!", "success");
    } else {
      showAdminToast("Mật khẩu quản trị viên không chính xác!", "error");
      passInput.select();
    }
  } catch (err) {
    showAdminToast("Lỗi xác thực đăng nhập: " + err.message, "error");
  }
}

function handleAdminLogout() {
  CinemaStorage.adminLogout();
  checkAdminAuth();
  showAdminToast("Đã đăng xuất phiên làm việc Quản trị viên.", "info");
}

// ==========================================
// 2. TAB NAVIGATION
// ==========================================
function initAdminTabs() {
  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      switchAdminTab(tab);
    });
  });
}

function switchAdminTab(tab) {
  AdminState.currentTab = tab;

  // Cập nhật class active ở sidebar
  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-tab") === tab) {
      btn.classList.add("active");
    }
  });

  // Ẩn hiện các pane
  document.querySelectorAll(".admin-tab-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  const activePane = document.getElementById(`tab-${tab}`);
  if (activePane) activePane.classList.add("active");

  loadTabContent(tab);
}

function loadTabContent(tab) {
  if (tab === "dashboard") {
    renderDashboardView();
  } else if (tab === "schedule") {
    renderScheduleManagerView();
  } else if (tab === "seats") {
    renderSeatMonitorView();
  } else if (tab === "movies") {
    renderMovieManagerView();
  } else if (tab === "cinemas") {
    renderCinemasManagerView();
  } else if (tab === "tickets") {
    renderTicketsManagerView();
  } else if (tab === "combos") {
    renderComboManagerView();
  }
}

// ==========================================
// 3. DASHBOARD: THỐNG KÊ DOANH THU ĐA CHIỀU (BẢO'S MODULE)
// 3 tiêu chí: THEO_PHIM, THEO_PHONG_CHIEU, THEO_SUAT_CHIEU
// ==========================================
function renderDashboardView() {
  const stats = CinemaStorage.getRevenueStatistics(AdminState.statsCriteria);
  const tickets = CinemaStorage.getSoldTickets();
  const movies = CinemaStorage.getMovies();
  const showtimes = CinemaStorage.getShowtimes();

  // 1. Cập nhật KPI Cards
  const kpiRev = document.getElementById("kpiTotalRevenue");
  const kpiTic = document.getElementById("kpiTotalTickets");
  const kpiAvg = document.getElementById("kpiAvgTicketPrice");
  const kpiTop = document.getElementById("kpiTopPerformer");

  if (kpiRev) kpiRev.innerText = `${stats.totalRevenue.toLocaleString()}đ`;
  if (kpiTic) kpiTic.innerText = `${stats.totalTickets} vé`;
  if (kpiAvg) kpiAvg.innerText = `${stats.avgPerTicket.toLocaleString()}đ`;
  if (kpiTop) kpiTop.innerText = stats.topItem ? `${stats.topItem.name}` : "Chưa có";

  // 2. Render bảng thống kê chi tiết
  const tableBody = document.getElementById("statsTableBody");
  if (!tableBody) return;

  if (stats.items.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có giao dịch bán vé nào trong hệ thống.</td></tr>`;
    return;
  }

  tableBody.innerHTML = stats.items.map(item => `
    <tr>
      <td style="font-weight: 700; color: #fff;">
        ${item.name}
      </td>
      <td style="font-weight: 600;">
        ${item.ticketsSold} vé
      </td>
      <td style="color: var(--admin-red); font-weight: 800; font-size: 0.95rem;">
        ${item.revenue.toLocaleString()} VNĐ
      </td>
      <td>
        <div class="progress-bar-cell">
          <div class="progress-track">
            <div class="progress-fill" style="width: ${item.percentage}%;"></div>
          </div>
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--accent-gold);">${item.percentage}%</span>
        </div>
      </td>
      <td style="color: var(--text-secondary);">
        ${item.avgPrice.toLocaleString()}đ / vé
      </td>
    </tr>
  `).join("");
}

function setStatsCriteria(criteria, btn) {
  AdminState.statsCriteria = criteria;
  document.querySelectorAll(".stats-criteria-tabs .criteria-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderDashboardView();
}

function downloadRevenueReportFile() {
  const textContent = CinemaStorage.exportRevenueReportText(AdminState.statsCriteria);
  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `report_doanh_thu_${AdminState.statsCriteria}_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showAdminToast("Đã tải về tệp báo cáo doanh thu thành công!", "success");
}

// ==========================================
// 4. LÊN LỊCH SUẤT CHIẾU & KIỂM TRA TRÙNG LỊCH (SCHEDULE MANAGER)
// Tương đương ScheduleConflictException
// ==========================================

const ScheduleFilterState = {
  keyword: "",
  movieId: "",
  cinemaId: "",
  date: ""
};

function handleScheduleFilterChange() {
  const kwEl = document.getElementById("schFilterKeyword");
  const mvEl = document.getElementById("schFilterMovie");
  const cnEl = document.getElementById("schFilterCinema");
  const dtEl = document.getElementById("schFilterDate");

  ScheduleFilterState.keyword = kwEl ? kwEl.value.trim().toLowerCase() : "";
  ScheduleFilterState.movieId = mvEl ? mvEl.value : "";
  ScheduleFilterState.cinemaId = cnEl ? cnEl.value : "";
  ScheduleFilterState.date = dtEl ? dtEl.value : "";

  renderShowtimesTable();
}

function resetScheduleFilters() {
  ScheduleFilterState.keyword = "";
  ScheduleFilterState.movieId = "";
  ScheduleFilterState.cinemaId = "";
  ScheduleFilterState.date = "";

  const kwEl = document.getElementById("schFilterKeyword");
  const mvEl = document.getElementById("schFilterMovie");
  const cnEl = document.getElementById("schFilterCinema");
  const dtEl = document.getElementById("schFilterDate");

  if (kwEl) kwEl.value = "";
  if (mvEl) mvEl.value = "";
  if (cnEl) cnEl.value = "";
  if (dtEl) dtEl.value = "";

  renderShowtimesTable();
}

function renderScheduleManagerView() {
  const movieSelect = document.getElementById("schMovieSelect");
  const cinemaSelect = document.getElementById("schCinemaSelect");
  const roomSelect = document.getElementById("schRoomSelect");
  const dateInput = document.getElementById("schDateInput");
  const timeInput = document.getElementById("schTimeInput");

  if (!movieSelect) return;

  const movies = CinemaStorage.getMovies().filter(m => m.status !== "stopped");
  const cinemas = CinemaStorage.getCinemas();

  movieSelect.innerHTML = `<option value="">-- Chọn Phim --</option>` +
    movies.map(m => `<option value="${m.id}">${m.title} (${m.duration} phút)</option>`).join("");

  cinemaSelect.innerHTML = `<option value="">-- Chọn Cụm Rạp --</option>` +
    cinemas.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

  cinemaSelect.onchange = () => {
    const cid = cinemaSelect.value;
    const cinema = CinemaStorage.getCinemaById(cid);
    if (!cinema) {
      roomSelect.innerHTML = `<option value="">-- Chọn Phòng --</option>`;
      checkLiveConflict();
      return;
    }
    roomSelect.innerHTML = `<option value="">-- Chọn Phòng Chiếu --</option>` +
      cinema.rooms.map(r => `<option value="${r.id}">${r.name} (${r.type})</option>`).join("");
    checkLiveConflict();
  };

  if (!dateInput.value) {
    dateInput.value = getTodayDateString(0);
  }

  // Khởi tạo các thanh lọc tra cứu suất chiếu
  const fMovie = document.getElementById("schFilterMovie");
  const fCinema = document.getElementById("schFilterCinema");
  const fDate = document.getElementById("schFilterDate");

  if (fMovie) {
    fMovie.innerHTML = `<option value="">-- Tất Cả Phim --</option>` +
      movies.map(m => `<option value="${m.id}" ${ScheduleFilterState.movieId === m.id ? "selected" : ""}>${m.title}</option>`).join("");
  }
  if (fCinema) {
    fCinema.innerHTML = `<option value="">-- Tất Cả Cụm Rạp --</option>` +
      cinemas.map(c => `<option value="${c.id}" ${ScheduleFilterState.cinemaId === c.id ? "selected" : ""}>${c.name}</option>`).join("");
  }
  if (fDate) {
    const allShowtimes = CinemaStorage.getShowtimes();
    const uniqueDates = [...new Set(allShowtimes.map(s => s.date))].sort();
    fDate.innerHTML = `<option value="">-- Tất Cả Các Ngày --</option>` +
      uniqueDates.map(d => `<option value="${d}" ${ScheduleFilterState.date === d ? "selected" : ""}>${d}</option>`).join("");
  }

  // Tự động kiểm tra xung đột thời gian chiếu khi thay đổi giờ hoặc phòng
  const checkLiveConflict = () => {
    const movieId = movieSelect.value;
    const cinemaId = cinemaSelect.value;
    const roomId = roomSelect.value;
    const date = dateInput.value;
    const startTime = timeInput.value;
    const alertBox = document.getElementById("conflictLiveAlert");

    if (!movieId || !roomId || !date || !startTime) {
      if (alertBox) alertBox.style.display = "none";
      return;
    }

    const movie = CinemaStorage.getMovieById(movieId);
    if (!movie) return;

    let conflict;
    try {
      conflict = CinemaStorage.checkScheduleConflict({
        cinemaId, roomId, date, startTime, durationMinutes: movie.duration
      });
    } catch (error) {
      if (alertBox) alertBox.style.display = "none";
      return;
    }

    if (conflict.conflict) {
      if (alertBox) {
        alertBox.style.display = "flex";
        alertBox.innerHTML = `
          <div class="conflict-icon">⚠️</div>
          <div>
            <strong>CẢNH BÁO XUNG ĐỘT LỊCH CHIẾU (ScheduleConflictException):</strong><br>
            ${conflict.roomName} đã có suất chiếu <em>"${conflict.movieTitle}"</em> từ <strong>${conflict.timeRange}</strong> (đã tính 15 phút dọn phòng)!
          </div>
        `;
      }
    } else {
      if (alertBox) alertBox.style.display = "none";
    }
  };

  movieSelect.onchange = checkLiveConflict;
  roomSelect.onchange = checkLiveConflict;
  dateInput.onchange = checkLiveConflict;
  timeInput.oninput = checkLiveConflict;

  renderShowtimesTable();
}

function handleAddShowtimeSubmit(e) {
  e.preventDefault();
  const movieId = document.getElementById("schMovieSelect").value;
  const cinemaId = document.getElementById("schCinemaSelect").value;
  const roomId = document.getElementById("schRoomSelect").value;
  const date = document.getElementById("schDateInput").value;
  const startTime = document.getElementById("schTimeInput").value;

  if (!movieId || !cinemaId || !roomId || !date || !startTime) {
    showAdminToast("Vui lòng điền đầy đủ các thông tin suất chiếu!", "warning");
    return;
  }

  try {
    const created = CinemaStorage.addShowtime({ movieId, cinemaId, roomId, date, startTime });
    showAdminToast(`Lên lịch suất chiếu mới thành công! Mã: ${created.id}`, "success");
    renderScheduleManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function renderShowtimesTable() {
  const tbody = document.getElementById("showtimesTableBody");
  if (!tbody) return;

  const showtimes = CinemaStorage.getShowtimes();
  if (showtimes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Chưa có suất chiếu nào trong danh sách.</td></tr>`;
    const countBadge = document.getElementById("schCountBadge");
    if (countBadge) countBadge.textContent = "0 suất chiếu";
    return;
  }

  // Áp dụng bộ lọc
  const filtered = showtimes.filter(st => {
    if (ScheduleFilterState.movieId && st.movieId !== ScheduleFilterState.movieId) return false;
    if (ScheduleFilterState.cinemaId && st.cinemaId !== ScheduleFilterState.cinemaId) return false;
    if (ScheduleFilterState.date && st.date !== ScheduleFilterState.date) return false;
    if (ScheduleFilterState.keyword) {
      const kw = ScheduleFilterState.keyword;
      const movie = CinemaStorage.getMovieById(st.movieId);
      const cinema = CinemaStorage.getCinemaById(st.cinemaId);
      const room = CinemaStorage.getRoomById(st.cinemaId, st.roomId);
      const searchTarget = [
        st.id,
        movie ? movie.title : "",
        cinema ? cinema.name : "",
        room ? room.name : "",
        room ? room.type : "",
        st.date,
        st.startTime,
        st.endTime
      ].join(" ").toLowerCase();
      if (!searchTarget.includes(kw)) return false;
    }
    return true;
  });

  const countBadge = document.getElementById("schCountBadge");
  if (countBadge) {
    countBadge.textContent = `Hiển thị ${filtered.length} / ${showtimes.length} suất chiếu`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
      <p style="font-size: 1.1rem; margin-bottom: 8px;">🔍 Không tìm thấy suất chiếu nào phù hợp với bộ lọc hiện tại.</p>
      <button class="btn-secondary" onclick="resetScheduleFilters()" style="padding: 6px 16px; font-size: 0.85rem; margin-top: 8px;">
        🔄 Xóa bộ lọc
      </button>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(st => {
    const movie = CinemaStorage.getMovieById(st.movieId);
    const cinema = CinemaStorage.getCinemaById(st.cinemaId);
    const room = CinemaStorage.getRoomById(st.cinemaId, st.roomId);
    const roomType = room ? (room.type || "2D") : "2D";
    const roomTypeClass = roomType.toLowerCase().replace(/\s+/g, "-");
    const roomName = room ? room.name : st.roomId;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--admin-red); font-family: monospace;">${st.id}</td>
        <td style="font-weight: 700; color: #fff;">${movie ? movie.title : st.movieId}</td>
        <td>${cinema ? cinema.name : st.cinemaId}</td>
        <td>
          <span class="badge-room-type ${roomTypeClass}">${roomType}</span>
          <span class="room-name">${roomName}</span>
        </td>
        <td>${st.date}</td>
        <td style="font-weight: 700; color: var(--accent-gold);">${st.startTime} ~ ${st.endTime}</td>
        <td>
          <button class="btn-sm-danger" onclick="handleDeleteShowtime('${st.id}')">Xóa</button>
        </td>
      </tr>
    `;
  }).join("");
}

function handleDeleteShowtime(id) {
  if (confirm(`Bạn có chắc chắn muốn xóa suất chiếu ${id}?`)) {
    CinemaStorage.deleteShowtime(id);
    showAdminToast(`Đã xóa suất chiếu ${id}.`, "success");
    renderShowtimesTable();
  }
}

// ==========================================
// 5. GIÁM SÁT GHẾ THEO THỜI GIAN THỰC (SEAT MONITOR)
// ==========================================
function renderSeatMonitorView() {
  const sel = document.getElementById("monitorShowtimeSelect");
  if (!sel) return;

  const showtimes = CinemaStorage.getShowtimes();
  sel.innerHTML = `<option value="">-- Chọn Suất Chiếu Để Giám Sát --</option>` +
    showtimes.map(st => {
      const movie = CinemaStorage.getMovieById(st.movieId);
      return `<option value="${st.id}">[${st.id}] ${movie ? movie.title : ""} - ${st.startTime} (${st.date})</option>`;
    }).join("");

  sel.onchange = () => {
    AdminState.selectedMonitorShowtimeId = sel.value;
    updateSeatMonitorGrid();
  };

  if (!AdminState.selectedMonitorShowtimeId && showtimes.length > 0) {
    AdminState.selectedMonitorShowtimeId = showtimes[0].id;
    sel.value = showtimes[0].id;
  }

  updateSeatMonitorGrid();

  // Bật live polling 2s một lần cho giám sát ghế
  if (AdminState.monitorRefreshInterval) clearInterval(AdminState.monitorRefreshInterval);
  AdminState.monitorRefreshInterval = setInterval(() => {
    if (AdminState.currentTab === "seats") {
      updateSeatMonitorGrid(true); // silent update
    }
  }, 2000);
}

function updateSeatMonitorGrid(silent = false) {
  const stId = AdminState.selectedMonitorShowtimeId;
  const container = document.getElementById("monitorGridContainer");
  const statsSpan = document.getElementById("monitorStatsSummary");
  if (!container || !stId) return;

  const st = CinemaStorage.getShowtimeById(stId);
  if (!st || !st.seats) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">Vui lòng chọn suất chiếu hợp lệ.</p>`;
    return;
  }

  let totalAvailable = 0;
  let totalHolding = 0;
  let totalSold = 0;
  let totalSeats = 0;

  let gridHtml = "";
  st.seats.forEach(row => {
    gridHtml += `<div class="seat-row" style="margin-bottom: 6px;">`;
    const rowLetter = row[0] ? String.fromCharCode(65 + row[0].row) : "";
    gridHtml += `<span class="row-label">${rowLetter}</span>`;

    row.forEach(seat => {
      totalSeats++;
      let color = "#252837";
      let statusText = "Trống";

      if (seat.status === SEAT_STATUS.SOLD) {
        totalSold++;
        color = "#12131a";
        statusText = "Đã bán";
      } else if (seat.status === SEAT_STATUS.HOLDING) {
        totalHolding++;
        color = "#d97706";
        statusText = "Đang giữ chỗ";
      } else {
        totalAvailable++;
      }

      gridHtml += `
        <div 
          style="width: ${seat.span === 2 ? 72 : 32}px; height: 30px; border-radius: 4px; background: ${color}; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #fff;"
          title="${seat.pairCode ? `${seat.code}-${seat.pairCode}` : seat.code} (${seat.type}) - Trạng thái: ${statusText}"
        >
          ${seat.pairCode ? `${seat.code}-${seat.pairCode}` : seat.code}
        </div>
      `;
    });
    gridHtml += `<span class="row-label">${rowLetter}</span></div>`;
  });

  container.innerHTML = gridHtml;

  if (statsSpan) {
    statsSpan.innerHTML = `
      Tổng ghế: <strong>${totalSeats}</strong> | 
      <span style="color: var(--accent-green);">Trống: ${totalAvailable}</span> | 
      <span style="color: #fbbf24;">Đang Giữ: ${totalHolding}</span> | 
      <span style="color: var(--text-muted);">Đã Bán: ${totalSold}</span>
    `;
  }
}

function handleReleaseAllHolds() {
  const stId = AdminState.selectedMonitorShowtimeId;
  if (!stId) return;

  const showtimes = CinemaStorage.getShowtimes();
  const st = showtimes.find(s => s.id === stId);
  if (!st) return;

  let releasedCount = 0;
  st.seats.forEach(row => {
    row.forEach(seat => {
      if (seat.status === SEAT_STATUS.HOLDING) {
        seat.status = SEAT_STATUS.AVAILABLE;
        seat.holdExpiresAt = null;
        seat.holdByUserId = null;
        releasedCount++;
      }
    });
  });

  localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
  showAdminToast(`Đã giải phóng thủ công ${releasedCount} ghế đang giữ chỗ!`, "success");
  updateSeatMonitorGrid();
}

// ==========================================
// 6. QUẢN LÝ PHIM (MOVIE MANAGER)
// ==========================================
let adminMovieFilter = "all";

function setAdminMovieFilter(filter, btn) {
  adminMovieFilter = filter;
  document.querySelectorAll(".admin-movie-filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderMovieManagerView();
}

function renderMovieManagerView() {
  const tbody = document.getElementById("moviesTableBody");
  if (!tbody) return;

  let movies = CinemaStorage.getMovies();
  if (adminMovieFilter !== "all") {
    movies = movies.filter(m => m.status === adminMovieFilter);
  }

  if (movies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 24px;">Không có bộ phim nào trong danh mục này.</td></tr>`;
    return;
  }

  tbody.innerHTML = movies.map(m => `
    <tr>
      <td style="font-weight: 700; color: var(--admin-red); font-family: monospace;">${m.id}</td>
      <td>
        <img src="${m.posterCustom || m.poster}" alt="${m.title}" style="width: 44px; height: 62px; object-fit: cover; border-radius: 4px;" onerror="this.src='${m.poster}'">
      </td>
      <td style="font-weight: 700; color: #fff;">
        <div>${m.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">${m.originalTitle || ""}</div>
      </td>
      <td>${m.genre}</td>
      <td>${m.duration} phút</td>
      <td><span class="badge-age ${getAgeBadgeClass(m.ageRating)}">${m.ageRating}</span></td>
      <td>${m.country}</td>
      <td style="color: var(--accent-gold); font-weight: 700;">${m.basePrice.toLocaleString()}đ</td>
      <td>
        <select 
          class="form-input" 
          style="padding: 6px 10px; font-size: 0.8rem; border-radius: 6px; width: 135px; cursor: pointer; font-weight: 600; 
            ${m.status === 'now_showing' ? 'color: #10b981; border-color: rgba(16,185,129,0.4);' : m.status === 'coming_soon' ? 'color: #f59e0b; border-color: rgba(245,158,11,0.4);' : 'color: #ef4444; border-color: rgba(239,68,68,0.4);'}"
          onchange="handleUpdateMovieStatus('${m.id}', this.value)"
        >
          <option value="now_showing" ${m.status === "now_showing" ? "selected" : ""}>🟢 Đang Chiếu</option>
          <option value="coming_soon" ${m.status === "coming_soon" ? "selected" : ""}>🟡 Sắp Chiếu</option>
          <option value="stopped" ${m.status === "stopped" ? "selected" : ""}>🔴 Ngưng Chiếu</option>
        </select>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn-sm-primary" onclick="openEditMovieModal('${m.id}')" title="Chỉnh sửa chi tiết phim, ảnh Thumbnail & Trailer">
            ✏️ Sửa
          </button>
          <button class="btn-sm-danger" onclick="handleDeleteMovie('${m.id}')" title="Xóa phim vĩnh viễn khỏi danh mục">
            ✕
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function handleUpdateMovieStatus(movieId, newStatus) {
  try {
    const movie = CinemaStorage.updateMovieStatus(movieId, newStatus);
    const statusText = newStatus === "now_showing" ? "ĐANG CHIẾU" : newStatus === "coming_soon" ? "SẮP CHIẾU" : "NGƯNG CHIẾU";
    showAdminToast(`Đã chuyển trạng thái phim "${movie.title}" thành: ${statusText}!`, "success");
    renderMovieManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function formatYouTubeEmbed(url) {
  if (!url) return "https://www.youtube.com/embed/Way9Dexny3w";
  if (url.includes("embed/")) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

function handleNewMovieImageUpload(input, type) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      showAdminToast("Dung lượng ảnh vượt quá 10MB!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      if (type === "poster") {
        document.getElementById("newMoviePoster").value = dataUrl;
      } else if (type === "backdrop") {
        document.getElementById("newMovieBackdrop").value = dataUrl;
      }
      showAdminToast("Đã tải ảnh lên thành công!", "success");
    };
    reader.readAsDataURL(file);
  }
}

function handleAddMovieSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("newMovieTitle").value.trim();
  const genre = document.getElementById("newMovieGenre").value.trim();
  const duration = Number(document.getElementById("newMovieDuration").value) || 120;
  const ageRating = document.getElementById("newMovieAge").value;
  const country = document.getElementById("newMovieCountry").value.trim();
  const basePrice = Number(document.getElementById("newMoviePrice").value) || 85000;
  const rating = parseFloat(document.getElementById("newMovieRating")?.value) || 8.5;
  const rawTrailer = (document.getElementById("newMovieTrailer")?.value || "").trim();
  const trailer = formatYouTubeEmbed(rawTrailer);
  const poster = document.getElementById("newMoviePoster").value.trim();
  const backdrop = (document.getElementById("newMovieBackdrop")?.value || "").trim();
  const director = document.getElementById("newMovieDirector").value.trim();
  const cast = document.getElementById("newMovieCast").value.trim();
  const synopsis = document.getElementById("newMovieSynopsis").value.trim();
  const status = document.getElementById("newMovieStatus") ? document.getElementById("newMovieStatus").value : "now_showing";

  try {
    CinemaStorage.addMovie({
      title,
      genre,
      duration,
      ageRating,
      country,
      basePrice,
      rating,
      trailer,
      director,
      cast,
      synopsis,
      status: status || "now_showing",
      poster: poster || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
      posterCustom: poster,
      backdrop: backdrop || poster || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop"
    });

    closeAdminModal("addMovieModal");
    document.getElementById("addMovieForm").reset();
    showAdminToast(`Đã thêm phim mới "${title}" thành công vào hệ thống!`, "success");
    renderMovieManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

// ==========================================
// CHỈNH SỬA PHIM, THUMBNAIL & TRAILER
// ==========================================
function openEditMovieModal(movieId) {
  const movie = CinemaStorage.getMovieById(movieId);
  if (!movie) {
    showAdminToast("Không tìm thấy thông tin phim!", "error");
    return;
  }

  document.getElementById("editMovieId").value = movie.id;
  document.getElementById("editMovieTitle").value = movie.title || "";
  document.getElementById("editMovieOriginalTitle").value = movie.originalTitle || "";
  document.getElementById("editMovieGenre").value = movie.genre || "";
  document.getElementById("editMovieDuration").value = movie.duration || 120;
  document.getElementById("editMovieAge").value = movie.ageRating || "13+";
  document.getElementById("editMovieCountry").value = movie.country || "Mỹ";
  document.getElementById("editMoviePrice").value = movie.basePrice || 85000;
  document.getElementById("editMovieRating").value = (movie.rating !== undefined) ? movie.rating : 8.5;
  document.getElementById("editMovieStatus").value = movie.status || "now_showing";

  const posterVal = movie.posterCustom || movie.poster || "";
  document.getElementById("editMoviePosterUrl").value = posterVal;
  updateEditPosterPreview(posterVal);

  const backdropVal = movie.backdrop || "";
  document.getElementById("editMovieBackdropUrl").value = backdropVal;
  updateEditBackdropPreview(backdropVal || posterVal);

  document.getElementById("editMovieTrailerUrl").value = movie.trailer || "";
  document.getElementById("editMovieDirector").value = movie.director || "";
  document.getElementById("editMovieCast").value = movie.cast || "";
  document.getElementById("editMovieSynopsis").value = movie.synopsis || "";

  openAdminModal("editMovieModal");
}

function updateEditPosterPreview(url) {
  const img = document.getElementById("editMoviePosterPreview");
  if (img) img.src = url || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop";
}

function updateEditBackdropPreview(url) {
  const img = document.getElementById("editMovieBackdropPreview");
  if (img) img.src = url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop";
}

function handleMovieImageUpload(input, type) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      showAdminToast("Dung lượng ảnh vượt quá 10MB!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      if (type === "poster") {
        document.getElementById("editMoviePosterUrl").value = dataUrl;
        updateEditPosterPreview(dataUrl);
      } else if (type === "backdrop") {
        document.getElementById("editMovieBackdropUrl").value = dataUrl;
        updateEditBackdropPreview(dataUrl);
      }
      showAdminToast("Đã tải ảnh lên và áp dụng xem trước thumbnail!", "success");
    };
    reader.readAsDataURL(file);
  }
}

function handleEditMovieSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("editMovieId").value;
  const title = document.getElementById("editMovieTitle").value.trim();
  const originalTitle = document.getElementById("editMovieOriginalTitle").value.trim();
  const genre = document.getElementById("editMovieGenre").value.trim();
  const duration = Number(document.getElementById("editMovieDuration").value) || 120;
  const ageRating = document.getElementById("editMovieAge").value;
  const country = document.getElementById("editMovieCountry").value.trim();
  const basePrice = Number(document.getElementById("editMoviePrice").value) || 85000;
  const rating = parseFloat(document.getElementById("editMovieRating").value) || 8.5;
  const status = document.getElementById("editMovieStatus").value;

  const rawPoster = document.getElementById("editMoviePosterUrl").value.trim();
  const rawBackdrop = document.getElementById("editMovieBackdropUrl").value.trim();
  const rawTrailer = document.getElementById("editMovieTrailerUrl").value.trim();
  const trailer = formatYouTubeEmbed(rawTrailer);

  const director = document.getElementById("editMovieDirector").value.trim();
  const cast = document.getElementById("editMovieCast").value.trim();
  const synopsis = document.getElementById("editMovieSynopsis").value.trim();

  try {
    const updated = CinemaStorage.updateMovie(id, {
      title,
      originalTitle: originalTitle || title,
      genre,
      duration,
      ageRating,
      country,
      basePrice,
      rating,
      status,
      poster: rawPoster || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
      posterCustom: rawPoster,
      backdrop: rawBackdrop || rawPoster || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
      trailer,
      director,
      cast,
      synopsis
    });

    closeAdminModal("editMovieModal");
    showAdminToast(`Đã lưu thay đổi cho phim "${updated.title}" thành công!`, "success");
    renderMovieManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function handleDeleteMovie(id) {
  const movie = CinemaStorage.getMovieById(id);
  const name = movie ? movie.title : id;
  if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn phim "${name}" khỏi hệ thống?\n\n* Lưu ý: Nếu chỉ muốn dừng chiếu, bạn nên chọn trạng thái "Ngưng Chiếu" thay vì xóa để bảo toàn dữ liệu doanh thu.`)) {
    CinemaStorage.deleteMovie(id);
    showAdminToast(`Đã xóa phim ${name}.`, "success");
    renderMovieManagerView();
  }
}

// ==========================================
// 7. QUẢN LÝ COMBO & BẢNG GIÁ
// ==========================================
function renderComboManagerView() {
  const tbody = document.getElementById("combosTableBody");
  if (!tbody) return;

  const combos = CinemaStorage.getCombos();
  tbody.innerHTML = combos.map(c => `
    <tr>
      <td style="font-weight: 700; color: var(--admin-red); font-family: monospace;">${escapeAdminHtml(c.id)}</td>
      <td><input class="form-input combo-table-input" data-field="name" value="${escapeAdminHtml(c.name)}"
        aria-label="Tên ${escapeAdminHtml(c.name)}" maxlength="80"></td>
      <td>
        <select class="form-input combo-table-input" data-field="category" aria-label="Loại ${escapeAdminHtml(c.name)}">
          <option value="combo" ${c.category !== "single" ? "selected" : ""}>Combo</option>
          <option value="single" ${c.category === "single" ? "selected" : ""}>Món lẻ</option>
        </select>
      </td>
      <td>
        <div class="combo-table-image">
          <img data-combo-image="${escapeAdminHtml(c.image)}"
            src="${/^https?:\/\//i.test(c.image) ? escapeAdminHtml(c.image) : ""}"
            alt="${escapeAdminHtml(c.name)}"
            onerror="this.onerror=null;this.alt='Không tải được ảnh';">
          <input type="file" class="form-input" data-image-file
            aria-label="Tải ảnh ${escapeAdminHtml(c.name)} từ máy tính" accept="image/*"
            onchange="previewComboImage(this, 'comboImagePreview-${escapeAdminHtml(c.id)}')">
          <img id="comboImagePreview-${escapeAdminHtml(c.id)}" class="combo-upload-preview"
            alt="Ảnh mới xem trước" hidden>
        </div>
      </td>
      <td><input type="number" class="form-input combo-table-input" data-field="price"
        value="${Number(c.price)}" aria-label="Giá ${escapeAdminHtml(c.name)}" min="0" step="1000"></td>
      <td><textarea class="form-input combo-table-input combo-table-description" data-field="description"
        aria-label="Mô tả ${escapeAdminHtml(c.name)}" maxlength="300">${escapeAdminHtml(c.description)}</textarea></td>
      <td>
        <div class="combo-table-actions">
          <button class="btn-primary" data-action="save" data-combo-id="${escapeAdminHtml(c.id)}">Lưu</button>
          <button class="btn-sm-danger" data-action="delete" data-combo-id="${escapeAdminHtml(c.id)}">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");

  loadAdminComboImages(tbody);
  tbody.querySelectorAll("[data-action='save']").forEach(button => {
    button.addEventListener("click", () => handleUpdateCombo(button.dataset.comboId, button.closest("tr")));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach(button => {
    button.addEventListener("click", () => handleDeleteCombo(button.dataset.comboId));
  });
}

function escapeAdminHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function loadAdminComboImages(container) {
  const images = [...container.querySelectorAll("[data-combo-image]")];
  try {
    await Promise.all(images.map(async image => {
      const imageReference = image.dataset.comboImage;
      const objectUrl = await CinemaStorage.getComboImageObjectUrl(imageReference);
      if (image.isConnected && image.dataset.comboImage === imageReference) image.src = objectUrl;
    }));
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

function previewComboImage(input, previewId) {
  const preview = document.getElementById(previewId);
  const file = input.files && input.files[0];
  if (!preview || !file) return;

  try {
    CinemaStorage.validateComboImageFile(file);
    if (preview.dataset.previewUrl) URL.revokeObjectURL(preview.dataset.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    preview.dataset.previewUrl = previewUrl;
    preview.src = previewUrl;
    preview.hidden = false;
  } catch (error) {
    input.value = "";
    showAdminToast(error.message, "error");
  }
}

async function handleAddComboSubmit(event) {
  event.preventDefault();

  const form = document.getElementById("addComboForm");
  const imageFile = document.getElementById("newComboImage").files[0];
  const comboData = {
    name: document.getElementById("newComboName").value,
    category: document.getElementById("newComboCategory").value,
    price: document.getElementById("newComboPrice").value,
    description: document.getElementById("newComboDescription").value
  };

  let imageReference;
  try {
    if (!imageFile) throw new Error("Vui lòng chọn ảnh từ máy tính.");
    imageReference = await CinemaStorage.saveComboImage(imageFile);
    comboData.image = imageReference;
    const combo = CinemaStorage.addCombo(comboData);
    const preview = document.getElementById("newComboImagePreview");
    if (preview.dataset.previewUrl) URL.revokeObjectURL(preview.dataset.previewUrl);
    preview.removeAttribute("src");
    preview.hidden = true;
    form.reset();
    showAdminToast(`Đã thêm ${combo.name} vào danh mục.`, "success");
    renderComboManagerView();
  } catch (error) {
    if (imageReference) {
      try {
        await CinemaStorage.deleteComboImage(imageReference);
      } catch (cleanupError) {
        showAdminToast(cleanupError.message, "error");
      }
    }
    showAdminToast(error.message, "error");
  }
}

async function handleUpdateCombo(comboId, row) {
  if (!row) {
    showAdminToast("Không tìm thấy thông tin món cần cập nhật.", "error");
    return;
  }

  const combo = CinemaStorage.getCombos().find(item => item.id === comboId);
  if (!combo) {
    showAdminToast("Không tìm thấy món cần cập nhật.", "error");
    return;
  }

  const comboData = Object.fromEntries([...row.querySelectorAll("[data-field]")]
    .map(input => [input.dataset.field, input.value]));
  const imageFile = row.querySelector("[data-image-file]").files[0];
  let newImageReference;
  let comboUpdated = false;

  try {
    if (imageFile) {
      newImageReference = await CinemaStorage.saveComboImage(imageFile);
      comboData.image = newImageReference;
    }
    const updatedCombo = CinemaStorage.updateCombo(comboId, comboData);
    comboUpdated = true;
    if (newImageReference) await CinemaStorage.deleteComboImage(combo.image);
    showAdminToast(`Đã cập nhật ${updatedCombo.name}.`, "success");
    renderComboManagerView();
  } catch (error) {
    if (newImageReference && !comboUpdated) {
      try {
        await CinemaStorage.deleteComboImage(newImageReference);
      } catch (cleanupError) {
        showAdminToast(cleanupError.message, "error");
      }
    }
    showAdminToast(error.message, "error");
  }
}

async function handleDeleteCombo(comboId) {
  const combo = CinemaStorage.getCombos().find(item => item.id === comboId);
  if (!combo) {
    showAdminToast("Không tìm thấy món cần xóa.", "error");
    return;
  }

  if (!confirm(`Xóa "${combo.name}" khỏi danh mục combo và món lẻ?`)) return;

  try {
    await CinemaStorage.deleteCombo(comboId);
    showAdminToast(`Đã xóa ${combo.name}.`, "success");
    renderComboManagerView();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

function handleResetAllData() {
  if (confirm("CẢNH BÁO: Thao tác này sẽ xóa toàn bộ dữ liệu hiện tại và khôi phục về Master Data ban đầu từ file CSV! Bạn có muốn tiếp tục?")) {
    CinemaStorage.resetToDefaultData();
    showAdminToast("Đã khôi phục toàn bộ dữ liệu mặc định thành công!", "success");
    setTimeout(() => location.reload(), 1000);
  }
}

// ==========================================
// 6. QUẢN LÝ CỤM RẠP & PHÒNG CHIẾU (CINEMA MANAGER)
// ==========================================
function renderCinemasManagerView() {
  const container = document.getElementById("cinemasListContainer");
  if (!container) return;

  const cinemas = CinemaStorage.getCinemas();
  if (cinemas.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Chưa có cụm rạp nào trong hệ thống. Hãy thêm cụm rạp đầu tiên!</div>`;
    return;
  }

  container.innerHTML = cinemas.map(cinema => {
    const rooms = cinema.rooms || [];
    const totalSeats = rooms.reduce((acc, r) => acc + (r.totalSeats || (r.rows * r.cols) || 0), 0);

    return `
      <div class="cinema-card-item">
        <div class="cinema-header-bar">
          <div class="cinema-title-area">
            <h3>🏢 ${cinema.name}</h3>
            <p>📍 ${cinema.address} ${cinema.phone ? `• ☎️ ${cinema.phone}` : ''}</p>
            <div style="font-size: 0.8rem; color: var(--accent-gold); margin-top: 4px; font-weight: 700;">
              Tổng số: ${rooms.length} phòng chiếu | Tổng sức chứa: ${totalSeats} ghế
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" style="padding: 8px 14px; font-size: 0.82rem;" onclick="openAddRoomModal('${cinema.id}', '${cinema.name.replace(/'/g, "\\'")}')">
              ➕ Thêm Phòng
            </button>
            <button class="btn-sm-danger" style="padding: 8px 14px; font-size: 0.82rem;" onclick="handleDeleteCinema('${cinema.id}')">
              🗑️ Xóa Cụm Rạp
            </button>
          </div>
        </div>

        <div style="font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 8px;">
          Danh Sách Các Phòng Chiếu:
        </div>
        ${rooms.length === 0 ? `
          <div style="color: var(--text-muted); font-size: 0.82rem; padding: 12px 0;">Chưa có phòng chiếu nào. Vui lòng bấm "Thêm Phòng".</div>
        ` : `
          <div class="cinema-rooms-list">
            ${rooms.map(room => {
              const roomTypeClass = (room.type || 'standard').toLowerCase().replace(/\s+/g, '-');
              const capacity = room.totalSeats || (room.rows * room.cols) || 0;
              return `
                <div class="room-badge-card">
                  <div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span class="badge-room-type ${roomTypeClass}">${room.type || '2D'}</span>
                      <strong style="color: #fff; font-size: 0.9rem;">${room.name}</strong>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                      Sơ đồ: ${room.rows || 6} hàng x ${room.cols || 8} ghế (${capacity} chỗ)
                    </div>
                  </div>
                  <button class="btn-sm-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDeleteRoom('${cinema.id}', '${room.id}')" title="Xóa phòng chiếu">
                    ✕
                  </button>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;
  }).join("");
}

function handleAddCinemaSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("newCinemaName").value.trim();
  const address = document.getElementById("newCinemaAddress").value.trim();
  const phone = document.getElementById("newCinemaPhone")?.value.trim() || "";

  if (!name || !address) {
    showAdminToast("Vui lòng nhập tên và địa chỉ cụm rạp!", "warning");
    return;
  }

  try {
    const newC = CinemaStorage.addCinema({ name, address, phone });
    closeAdminModal("addCinemaModal");
    document.getElementById("addCinemaForm").reset();
    showAdminToast(`Đã thêm cụm rạp "${newC.name}" thành công!`, "success");
    renderCinemasManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function handleDeleteCinema(cinemaId) {
  const cinema = CinemaStorage.getCinemaById(cinemaId);
  const name = cinema ? cinema.name : cinemaId;
  if (!confirm(`Bạn có chắc chắn muốn xóa cụm rạp "${name}"?\nTất cả phòng chiếu của rạp này cũng sẽ bị gỡ bỏ.`)) {
    return;
  }

  try {
    CinemaStorage.deleteCinema(cinemaId);
    showAdminToast(`Đã xóa cụm rạp "${name}".`, "success");
    renderCinemasManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function openAddRoomModal(cinemaId, cinemaName) {
  document.getElementById("roomCinemaId").value = cinemaId;
  document.getElementById("roomCinemaName").value = cinemaName;
  openAdminModal("addRoomModal");
}

function handleAddRoomSubmit(e) {
  e.preventDefault();
  const cinemaId = document.getElementById("roomCinemaId").value;
  const name = document.getElementById("newRoomName").value.trim();
  const type = document.getElementById("newRoomType").value;
  const rows = parseInt(document.getElementById("newRoomRows").value) || 6;
  const cols = parseInt(document.getElementById("newRoomCols").value) || 8;

  if (!name) {
    showAdminToast("Vui lòng nhập tên phòng chiếu!", "warning");
    return;
  }

  try {
    const room = CinemaStorage.addRoomToCinema(cinemaId, { name, type, rows, cols, totalSeats: rows * cols });
    closeAdminModal("addRoomModal");
    document.getElementById("addRoomForm").reset();
    showAdminToast(`Đã thêm phòng chiếu "${room.name}" vào rạp thành công!`, "success");
    renderCinemasManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function handleDeleteRoom(cinemaId, roomId) {
  if (!confirm("Bạn có chắc chắn muốn xóa phòng chiếu này khỏi cụm rạp?")) {
    return;
  }

  try {
    CinemaStorage.deleteRoomFromCinema(cinemaId, roomId);
    showAdminToast("Đã xóa phòng chiếu thành công.", "success");
    renderCinemasManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

// ==========================================
// 7. QUẢN LÝ VÉ ĐÃ BÁN & HỦY VÉ (TICKETS MANAGER)
// ==========================================
function renderTicketsManagerView() {
  const tbody = document.getElementById("adminTicketsTableBody");
  if (!tbody) return;

  let tickets = CinemaStorage.getSoldTickets()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Filter
  if (AdminState.ticketFilter === "PAID") {
    tickets = tickets.filter(t => t.status !== "CANCELLED");
  } else if (AdminState.ticketFilter === "CANCELLED") {
    tickets = tickets.filter(t => t.status === "CANCELLED");
  }

  // Search
  if (AdminState.ticketSearchQuery) {
    const q = AdminState.ticketSearchQuery;
    tickets = tickets.filter(t => {
      return (t.ticketId || "").toLowerCase().includes(q) ||
             (t.movieTitle || "").toLowerCase().includes(q) ||
             (t.customerPhone || "").toLowerCase().includes(q) ||
             (t.customerName || "").toLowerCase().includes(q);
    });
  }

  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px;">Không tìm thấy vé bán nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = tickets.map(t => {
    const isCancelled = t.status === "CANCELLED";
    const seatCodes = (t.seats || []).map(s => s.code || s).join(", ");
    const statusBadge = isCancelled
      ? `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 750;">✕ ĐÃ HỦY</span>`
      : `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 750;">✓ ĐÃ BÁN</span>`;

    return `
      <tr style="opacity: ${isCancelled ? '0.75' : '1'};">
        <td style="font-weight: 750; font-family: monospace; color: var(--admin-red);">${t.ticketId}</td>
        <td style="font-weight: 700; color: #fff;">${t.movieTitle}</td>
        <td>${t.cinemaName} <br><span style="font-size: 0.78rem; color: var(--text-muted);">${t.roomName}</span></td>
        <td style="font-weight: 600; color: var(--accent-gold);">${t.startTime} <br><span style="font-size: 0.75rem; color: var(--text-muted);">${t.date}</span></td>
        <td style="font-weight: 750; color: #fff;">${seatCodes}</td>
        <td>${t.customerName || "Khách lẻ"} <br><span style="font-size: 0.78rem; color: var(--text-muted);">${t.customerPhone || ""}</span></td>
        <td style="font-weight: 800; color: #fff;">${(t.totalAmount || 0).toLocaleString()}đ</td>
        <td>${statusBadge}</td>
        <td>
          ${!isCancelled ? `
            <button class="btn-sm-danger" onclick="handleAdminCancelTicket('${t.ticketId}')" title="Hủy vé và giải phóng ghế lập tức">
              Hủy Vé
            </button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--text-muted);">${t.cancelReason || 'Đã hủy'}</span>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

function handleAdminCancelTicket(ticketId) {
  if (!confirm(`Xác nhận hủy vé [${ticketId}]?\n\nGhế tương ứng sẽ được giải phóng lập tức trong ma trận suất chiếu và cập nhật báo cáo doanh thu.`)) {
    return;
  }

  try {
    CinemaStorage.cancelTicket(ticketId, "Admin hủy vé");
    showAdminToast(`Đã hủy vé [${ticketId}] và giải phóng ghế thành công!`, "success");
    renderTicketsManagerView();
  } catch (err) {
    showAdminToast(err.message, "error");
  }
}

function handleAdminTicketSearch(input) {
  AdminState.ticketSearchQuery = (input.value || "").trim().toLowerCase();
  renderTicketsManagerView();
}

function setAdminTicketFilter(filter, btn) {
  AdminState.ticketFilter = filter;
  document.querySelectorAll("#tab-tickets .criteria-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderTicketsManagerView();
}

// ==========================================
// 8. HELPER MODALS & TOAST
// ==========================================
function openAdminModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("open");
}

function closeAdminModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

function showAdminToast(message, type = "info") {
  const container = document.getElementById("adminToastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastSlideIn 0.3s ease reverse";
    setTimeout(() => toast.remove(), 280);
  }, 4000);
}

function getAgeBadgeClass(rating) {
  if (rating === "18+" || rating === "T18") return "t18";
  if (rating === "16+" || rating === "T16") return "t16";
  if (rating === "13+" || rating === "T13") return "t13";
  return "p";
}
