/**
 * Cinema Management System - User Portal Application Logic
 * Xử lý tương tác giao diện người dùng: Banner, Phim, Đặt vé 4 bước, Giữ ghế 300s, E-Ticket
 */

// ==========================================
// STATE MANAGEMENT (Trạng thái phiên làm việc)
// ==========================================
const AppState = {
  currentHeroIndex: 0,
  activeFilter: "all",
  searchQuery: "",
  ticketFilter: "all",
  ticketSearchQuery: "",
  pendingBooking: null,

  // Booking Flow State
  booking: {
    movie: null,
    cinema: null,
    room: null,
    userId: null,
    date: null,
    showtime: null,
    selectedSeats: [], // Array các ghế người dùng đang chọn
    selectedCombos: {}, // { comboId: quantity }
    currentStep: 1,
    holdTimerInterval: null,
    holdRemainingSeconds: 300,
    paymentMethod: "CASH_COUNTER"
  }
};

// ==========================================
// INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initHeroBanner();
  initQuickBooking();
  renderMovieCatalog();
  initAuthUI();
  initModals();
  initBookingSection();

  // Tự động làm mới giao diện khi dữ liệu backend data/ được đồng bộ
  window.addEventListener("cinema:data-synced", () => {
    updateUserAuthHeader();
    initHeroBanner();
    initQuickBooking();
    renderMovieCatalog();
  });
});

// ==========================================
// 1. NAVBAR & USER AUTH STATUS
// ==========================================
function initNavbar() {
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  updateUserAuthHeader();
}

function updateUserAuthHeader() {
  const container = document.getElementById("navUserArea");
  if (!container) return;

  const user = CinemaStorage.getCurrentUser();
  const historyNavItem = document.getElementById("historyNavItem");
  if (historyNavItem) historyNavItem.style.display = user ? "" : "none";

  if (user) {
    const tierColor = user.membershipTier === "Platinum" ? "#c084fc" : (user.membershipTier === "VIP Gold" ? "var(--gold)" : "#10b981");
    container.innerHTML = `
      <div class="user-profile-badge" onclick="openUserProfileModal()" title="Xem hồ sơ & hạng thẻ VIP" style="cursor: pointer;">
        <div class="user-avatar">${(user.fullName || "U").charAt(0).toUpperCase()}</div>
        <div class="user-meta">
          <span class="user-name">${user.fullName}</span>
          <span class="user-tier" style="color: ${tierColor}; font-weight: 750;">👑 ${user.membershipTier || "Standard"} (${user.points || 0}đ)</span>
        </div>
      </div>
      <button class="btn-secondary" style="padding: 7px 14px; font-size: 0.85rem;" onclick="openMyTicketsModal()">
        🎟 Vé Của Tôi
      </button>
      <button class="btn-secondary" style="padding: 7px 12px; font-size: 0.85rem; border-color: rgba(255,255,255,0.15);" onclick="handleUserLogout()">
        Đăng Xuất
      </button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-secondary" onclick="openAuthModal('login')">Đăng Nhập</button>
      <button class="btn-primary" onclick="openAuthModal('register')">Đăng Ký</button>
    `;
  }
}

function handleUserLogout() {
  CinemaStorage.logoutUser();
  updateUserAuthHeader();
  showToast("Đã đăng xuất thành công.", "info");
}

// ==========================================
// 2. HERO CAROUSEL
// ==========================================
function initHeroBanner() {
  const movies = CinemaStorage.getMovies().slice(0, 4);
  const container = document.getElementById("heroCarouselContainer");
  const dotsContainer = document.getElementById("heroCarouselDots");
  if (!container || !dotsContainer) return;

  container.innerHTML = "";
  dotsContainer.innerHTML = "";

  movies.forEach((m, idx) => {
    const slide = document.createElement("div");
    slide.className = `hero-slide ${idx === 0 ? "active" : ""}`;
    const bgImg = m.backdropCustom || m.backdrop || m.posterCustom || m.poster;
    slide.style.backgroundImage = `url('${bgImg}')`;
    slide.innerHTML = `
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-details">
          <div class="hero-badges">
            <span class="badge-age ${getAgeBadgeClass(m.ageRating)}">${m.ageRating}</span>
            <span class="badge-format">IMAX / 3D / 2D</span>
            <span class="badge-rating">★ ${m.rating} / 10</span>
          </div>
          <h1 class="hero-title">${m.title}</h1>
          <div class="hero-meta">
            <span>⏱ ${m.duration} phút</span>
            <span>🌐 ${m.country}</span>
            <span>🎬 ${m.genre}</span>
          </div>
          <p class="hero-desc">${m.synopsis}</p>
          <div class="hero-cta">
            <button class="btn-primary" onclick="startBookingFlow('${m.id}')">
              🎟 Đặt Vé Ngay
            </button>
            <button class="btn-secondary" onclick="openMovieDetailModal('${m.id}')">
              ▶ Xem Chi Tiết & Trailer
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(slide);

    const dot = document.createElement("div");
    dot.className = `carousel-dot ${idx === 0 ? "active" : ""}`;
    dot.onclick = () => switchHeroSlide(idx);
    dotsContainer.appendChild(dot);
  });

  // Tự động chuyển slide sau mỗi 6 giây
  setInterval(() => {
    const nextIndex = (AppState.currentHeroIndex + 1) % movies.length;
    switchHeroSlide(nextIndex);
  }, 6000);
}

function switchHeroSlide(index) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".carousel-dot");
  if (!slides.length) return;

  slides.forEach(s => s.classList.remove("active"));
  dots.forEach(d => d.classList.remove("active"));

  slides[index]?.classList.add("active");
  dots[index]?.classList.add("active");
  AppState.currentHeroIndex = index;
}

function getAgeBadgeClass(rating) {
  if (rating === "18+" || rating === "T18") return "t18";
  if (rating === "16+" || rating === "T16") return "t16";
  if (rating === "13+" || rating === "T13") return "t13";
  return "p";
}

// ==========================================
// 3. QUICK BOOKING BAR
// ==========================================
function initQuickBooking() {
  const selMovie = document.getElementById("qbMovie");
  const selCinema = document.getElementById("qbCinema");
  const selDate = document.getElementById("qbDate");
  const selShowtime = document.getElementById("qbShowtime");
  if (!selMovie) return;

  const movies = CinemaStorage.getMovies().filter(m => m.status === "now_showing");
  const cinemas = CinemaStorage.getCinemas();

  selMovie.innerHTML = `<option value="">-- Chọn Phim --</option>` +
    movies.map(m => `<option value="${m.id}">${m.title}</option>`).join("");

  selCinema.innerHTML = `<option value="">-- Chọn Rạp --</option>` +
    cinemas.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

  // Nạp 4 ngày tới
  const dates = [0, 1, 2, 3].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateVal = getTodayDateString(offset);
    const dateText = offset === 0 ? "Hôm nay" : offset === 1 ? "Ngày mai" : `Ngày ${d.getDate()}/${d.getMonth() + 1}`;
    return { val: dateVal, text: `${dateText} (${d.toLocaleDateString("vi-VN")})` };
  });

  selDate.innerHTML = `<option value="">-- Chọn Ngày --</option>` +
    dates.map(d => `<option value="${d.val}">${d.text}</option>`).join("");

  // Event handlers
  const updateShowtimes = () => {
    const movieId = selMovie.value;
    const cinemaId = selCinema.value;
    const dateVal = selDate.value;

    if (!movieId || !cinemaId || !dateVal) {
      selShowtime.innerHTML = `<option value="">-- Chọn Suất Chiếu --</option>`;
      return;
    }

    const showtimes = CinemaStorage.getShowtimes().filter(
      st => st.movieId === movieId && st.cinemaId === cinemaId && st.date === dateVal
    );

    if (showtimes.length === 0) {
      selShowtime.innerHTML = `<option value="">Không có suất chiếu phù hợp</option>`;
    } else {
      selShowtime.innerHTML = `<option value="">-- Chọn Suất Chiếu --</option>` +
        showtimes.map(st => {
          const room = CinemaStorage.getRoomById(cinemaId, st.roomId);
          const past = (typeof isShowtimePast === "function") && isShowtimePast(st.date, st.startTime);
          return `<option value="${st.id}" ${past ? 'disabled style="color: #666;"' : ''}>${st.startTime} (${room ? room.type : "2D"})${past ? " - Đã chiếu" : ""}</option>`;
        }).join("");
    }
  };

  selMovie.addEventListener("change", updateShowtimes);
  selCinema.addEventListener("change", updateShowtimes);
  selDate.addEventListener("change", updateShowtimes);
}

function handleQuickBookingSubmit() {
  const selMovie = document.getElementById("qbMovie").value;
  const selCinema = document.getElementById("qbCinema").value;
  const selDate = document.getElementById("qbDate").value;
  const selShowtime = document.getElementById("qbShowtime").value;

  if (!selMovie) {
    showToast("Vui lòng chọn phim bạn muốn xem!", "warning");
    return;
  }
  startBookingFlow(selMovie, selCinema, selDate, selShowtime);
}

// ==========================================
// 4. MOVIE CATALOG (LIST & FILTERS)
// ==========================================
function renderMovieCatalog() {
  const grid = document.getElementById("movieGrid");
  if (!grid) return;

  const movies = CinemaStorage.getMovies();
  // Khách hàng chỉ xem phim đang chiếu hoặc sắp chiếu (không hiển thị phim ngưng chiếu)
  let filtered = movies.filter(m => m.status !== "stopped");

  // Lọc theo thể loại / tab
  if (AppState.activeFilter === "now_showing") {
    filtered = filtered.filter(m => m.status === "now_showing");
  } else if (AppState.activeFilter === "coming_soon") {
    filtered = filtered.filter(m => m.status === "coming_soon");
  } else if (AppState.activeFilter !== "all") {
    filtered = filtered.filter(m => m.genre.toLowerCase().includes(AppState.activeFilter.toLowerCase()));
  }

  // Lọc theo tìm kiếm
  if (AppState.searchQuery.trim()) {
    const q = AppState.searchQuery.toLowerCase();
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(q) ||
      m.genre.toLowerCase().includes(q) ||
      m.country.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 8px;">🎬 Không tìm thấy bộ phim nào phù hợp.</p>
        <p style="font-size: 0.9rem;">Vui lòng thử tìm kiếm với từ khóa khác.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(m => `
    <div class="movie-card">
      <div class="poster-wrap">
        <img class="movie-poster" src="${m.posterCustom || m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='${m.poster}'">
        <div class="poster-overlay"></div>
        <div class="poster-tags">
          <span class="badge-age ${getAgeBadgeClass(m.ageRating)}">${m.ageRating}</span>
        </div>
        <div class="poster-rating">★ ${m.rating}</div>
        <button class="quick-trailer-btn" onclick="openMovieDetailModal('${m.id}')" title="Xem Trailer">
          ▶
        </button>
      </div>

      <div class="movie-info">
        <span class="movie-genre">${m.genre.split(",")[0]}</span>
        <h3 class="movie-title">${m.title}</h3>

        <div class="movie-sub-info">
          <span>⏱ ${m.duration} phút</span>
          <span>🌐 ${m.country}</span>
        </div>

        <div class="movie-specs">
          <div><strong>Đạo diễn:</strong> ${m.director}</div>
          <div><strong>Khởi chiếu:</strong> ${m.releaseDate}</div>
          <div><strong>Giá vé từ:</strong> <span style="color: var(--primary-red); font-weight: 700;">${m.basePrice.toLocaleString()}đ</span></div>
        </div>

        <div class="card-actions">
          <button class="btn-card-detail" onclick="openMovieDetailModal('${m.id}')">
            Chi Tiết
          </button>
          <button class="btn-card-book" onclick="startBookingFlow('${m.id}')">
            Đặt Vé
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function setCatalogFilter(filter, btn) {
  AppState.activeFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderMovieCatalog();
}

function handleSearchInput(input) {
  AppState.searchQuery = input.value;
  renderMovieCatalog();
}

// ==========================================
// 5. MOVIE DETAIL MODAL
// ==========================================
function openMovieDetailModal(movieId) {
  const movie = CinemaStorage.getMovieById(movieId);
  if (!movie) return;

  const modal = document.getElementById("movieDetailModal");
  const content = document.getElementById("movieDetailContent");

  content.innerHTML = `
    <div class="detail-modal-grid">
      <div>
        <img class="detail-poster-img" src="${movie.posterCustom || movie.poster}" alt="${movie.title}" onerror="this.src='${movie.poster}'">
        <div style="margin-top: 16px;">
          <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="closeModal('movieDetailModal'); startBookingFlow('${movie.id}')">
            🎟 Mua Vé Phim Này
          </button>
        </div>
      </div>
      <div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
          <span class="badge-age ${getAgeBadgeClass(movie.ageRating)}">${movie.ageRating}</span>
          <span class="badge-rating">★ ${movie.rating} / 10 Đánh giá</span>
        </div>
        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 4px; color: #fff;">${movie.title}</h2>
        <h4 style="font-size: 1rem; font-weight: 400; color: var(--text-muted); margin-bottom: 16px;">${movie.originalTitle || ""}</h4>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #cbd5e1;">
          <div><strong style="color: var(--text-muted);">Thể loại:</strong> ${movie.genre}</div>
          <div><strong style="color: var(--text-muted);">Thời lượng:</strong> ${movie.duration} phút</div>
          <div><strong style="color: var(--text-muted);">Quốc gia:</strong> ${movie.country}</div>
          <div><strong style="color: var(--text-muted);">Đạo diễn:</strong> ${movie.director}</div>
          <div><strong style="color: var(--text-muted);">Diễn viên:</strong> ${movie.cast}</div>
          <div><strong style="color: var(--text-muted);">Độ tuổi khuyến nghị:</strong> ${movie.ageDescription || movie.ageRating}</div>
        </div>

        <p style="font-size: 0.95rem; line-height: 1.6; color: #94a3b8; margin-bottom: 20px;">
          ${movie.synopsis}
        </p>

        ${movie.trailer ? `
        <div class="trailer-iframe-wrap">
          <iframe src="${movie.trailer}" title="Trailer ${movie.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>` : `
        <div style="padding: 14px; background: rgba(255,255,255,0.04); border-radius: 8px; color: var(--text-muted); text-align: center; font-size: 0.88rem; border: 1px dashed rgba(255,255,255,0.1);">
          🎬 Chưa có video trailer chính thức
        </div>`}
      </div>
    </div>
  `;

  modal.classList.add("open");
}

// ==========================================
// 6B. BOOKING SECTION (ĐẶT VÉ & CHỌN RẠP - INLINE PAGE)
// ==========================================
const BookingSectionState = {
  selectedCinemaId: "R01",
  selectedDate: getTodayDateString(0)
};

function initBookingSection() {
  renderBookingDateTabs();
  renderBookingShowtimeGrid();
}

function selectCinemaTab(cinemaId, btn) {
  BookingSectionState.selectedCinemaId = cinemaId;

  // Update tab active state
  document.querySelectorAll('#cinemaTabs .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Update cinema info card
  const cinema = CinemaStorage.getCinemaById(cinemaId);
  if (cinema) {
    const nameEl = document.getElementById('cinemaInfoName');
    const addrEl = document.getElementById('cinemaInfoAddress');
    const detailEl = document.getElementById('cinemaInfoDetails');
    if (nameEl) nameEl.textContent = '📍 ' + cinema.name;
    if (addrEl) addrEl.textContent = cinema.address;
    if (detailEl) {
      const roomTypes = cinema.rooms.map(r => r.type).join(', ');
      detailEl.innerHTML = '🎬 Phòng: ' + cinema.rooms.map(r => r.name).join(', ') + ' | 📞 Hotline: ' + cinema.phone;
    }
  }

  renderBookingShowtimeGrid();
}

function selectBookingSectionDate(dateVal, btn) {
  BookingSectionState.selectedDate = dateVal;

  document.querySelectorAll('#bookingDateTabs .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  renderBookingShowtimeGrid();
}

function renderBookingDateTabs() {
  const container = document.getElementById('bookingDateTabs');
  if (!container) return;

  const dates = [0, 1, 2, 3].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const val = getTodayDateString(offset);
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const label = offset === 0 ? "Hôm nay" : offset === 1 ? "Ngày mai" : `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
    return { val, label, active: val === BookingSectionState.selectedDate };
  });

  container.innerHTML = dates.map(d => `
    <button class="filter-btn ${d.active ? 'active' : ''}"
      onclick="selectBookingSectionDate('${d.val}', this)"
      style="padding: 10px 20px; font-size: 0.9rem;">
      ${d.label}
    </button>
  `).join('');
}

function renderBookingShowtimeGrid() {
  const container = document.getElementById('bookingShowtimeGrid');
  if (!container) return;

  const cinemaId = BookingSectionState.selectedCinemaId;
  const dateVal = BookingSectionState.selectedDate;

  // Get all showtimes for this cinema and date
  const allShowtimes = CinemaStorage.getShowtimes().filter(
    st => st.cinemaId === cinemaId && st.date === dateVal
  );

  if (allShowtimes.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 8px;">🎬 Không có suất chiếu nào vào ngày này tại rạp này.</p>
        <p style="font-size: 0.9rem;">Vui lòng chọn ngày hoặc rạp khác.</p>
      </div>
    `;
    return;
  }

  // Group by movie
  const movieMap = {};
  allShowtimes.forEach(st => {
    if (!movieMap[st.movieId]) movieMap[st.movieId] = [];
    movieMap[st.movieId].push(st);
  });

  let html = '';
  for (const [movieId, showtimes] of Object.entries(movieMap)) {
    const movie = CinemaStorage.getMovieById(movieId);
    if (!movie) continue;

    // Count booked seats for each showtime
    const showtimeDetails = showtimes.map(st => {
      const room = CinemaStorage.getRoomById(cinemaId, st.roomId);
      let totalSeats = 0;
      let bookedSeats = 0;
      if (st.seats) {
        st.seats.forEach(row => {
          row.forEach(seat => {
            totalSeats++;
            if (seat.status === SEAT_STATUS.SOLD || seat.status === SEAT_STATUS.HOLDING) {
              bookedSeats++;
            }
          });
        });
      }
      return { st, room, totalSeats, bookedSeats };
    });

    html += `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden;">
        <div style="display: flex; gap: 20px; padding: 20px; flex-wrap: wrap;">
          <!-- Movie Poster -->
          <div style="flex-shrink: 0; width: 120px;">
            <img src="${movie.posterCustom || movie.poster}" alt="${movie.title}"
              style="width: 100%; border-radius: var(--radius-md); aspect-ratio: 2/3; object-fit: cover;"
              onerror="this.src='${movie.poster}'">
          </div>

          <!-- Movie Info -->
          <div style="flex: 1; min-width: 200px;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <span class="badge-age ${getAgeBadgeClass(movie.ageRating)}" style="font-size: 0.75rem; padding: 2px 8px;">${movie.ageRating}</span>
              <span style="color: var(--accent-gold); font-size: 0.85rem; font-weight: 700;">★ ${movie.rating}</span>
            </div>
            <h3 style="color: #fff; font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">${movie.title}</h3>
            <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
              <span>⏱ ${movie.duration} phút</span>
              <span>🎬 ${movie.genre.split(',')[0]}</span>
              <span>🌐 ${movie.country}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              <span>Giá vé từ: <strong style="color: var(--primary-red);">${movie.basePrice.toLocaleString()}đ</strong></span>
            </div>

            <!-- Showtimes grouped by room type -->
            <div style="margin-top: 16px;">
    `;

    // Group showtimes by room type
    const roomGroups = {};
    showtimeDetails.forEach(({ st, room, totalSeats, bookedSeats }) => {
      const type = room ? room.type : '2D';
      if (!roomGroups[type]) roomGroups[type] = [];
      roomGroups[type].push({ st, room, totalSeats, bookedSeats });
    });

    for (const [type, list] of Object.entries(roomGroups)) {
      html += `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px; font-weight: 600;">
            🎬 ${type} ${type === 'IMAX' ? '(Laser)' : type === '3D' ? '(RealD)' : '(Standard)'}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      `;

      list.forEach(({ st, room, totalSeats, bookedSeats }) => {
        const availableSeats = totalSeats - bookedSeats;
        const fillPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
        const isAlmostFull = fillPercent >= 80;
        const isPast = (typeof isShowtimePast === "function") && isShowtimePast(st.date, st.startTime);
        const isFull = fillPercent >= 100;
        const isDisabled = isFull || isPast;

        html += `
          <div onclick="${isDisabled ? '' : `startBookingFlow('${movie.id}', '${cinemaId}', '${dateVal}', '${st.id}')`}"
            style="background: ${isDisabled ? '#151720' : '#1e2235'}; border: 1px solid ${isPast ? 'rgba(255,255,255,0.08)' : isFull ? '#333' : isAlmostFull ? 'rgba(229,9,20,0.5)' : 'var(--border-subtle)'};
            border-radius: var(--radius-md); padding: 10px 16px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
            text-align: center; min-width: 90px; transition: all 0.2s; opacity: ${isPast ? '0.4' : isFull ? '0.5' : '1'};"
            ${isDisabled ? '' : `onmouseover="this.style.borderColor='var(--primary-red)'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.borderColor='${isAlmostFull ? 'rgba(229,9,20,0.5)' : 'var(--border-subtle)'}'; this.style.transform='translateY(0)'"`}>
            <div style="font-size: 1rem; font-weight: 800; color: ${isDisabled ? '#777' : '#fff'};${isPast ? ' text-decoration: line-through;' : ''}">${st.startTime}</div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">~${st.endTime}</div>
            <div style="font-size: 0.7rem; margin-top: 4px; color: ${isPast ? '#777' : isFull ? '#555' : isAlmostFull ? 'var(--primary-red)' : 'var(--green-success)'};">
              ${isPast ? 'Suất đã qua' : `${bookedSeats}/${totalSeats} ghế đã đặt`}
            </div>
            <div style="font-size: 0.7rem; font-weight: ${isPast ? '600' : 'normal'}; color: ${isPast ? '#888' : isFull ? '#555' : 'var(--green-success)'};">
              ${isPast ? 'Đã chiếu' : isFull ? 'Hết chỗ' : `Còn ${availableSeats} ghế`}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    html += `
            </div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ==========================================
// 7. BOOKING FLOW (4 BƯỚC)
// ==========================================
function startBookingFlow(movieId, preCinemaId = null, preDate = null, preShowtimeId = null) {
  if (!CinemaStorage.getCurrentUser()) {
    AppState.pendingBooking = { movieId, preCinemaId, preDate, preShowtimeId };
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để đặt vé.", "warning");
    return;
  }

  clearHoldCountdownTimer();
  AppState.pendingBooking = null;
  const movie = CinemaStorage.getMovieById(movieId);
  if (!movie) return;
  const selectedShowtime = preShowtimeId ? CinemaStorage.getShowtimeById(preShowtimeId) : null;
  const cinemaId = preCinemaId || (selectedShowtime ? selectedShowtime.cinemaId : null);

  AppState.booking = {
    movie: movie,
    cinema: cinemaId ? CinemaStorage.getCinemaById(cinemaId) : null,
    room: selectedShowtime ? CinemaStorage.getRoomById(cinemaId, selectedShowtime.roomId) : null,
    userId: CinemaStorage.getCurrentUser().id,
    date: preDate || getTodayDateString(0),
    showtime: selectedShowtime,
    selectedSeats: [],
    selectedCombos: {},
    currentStep: 1,
    holdTimerInterval: null,
    holdRemainingSeconds: 300,
    paymentMethod: "CASH_COUNTER"
  };

  const modal = document.getElementById("bookingModal");
  modal.classList.add("open");

  if (AppState.booking.showtime) {
    // Nếu đã chọn suất chiếu sẵn, nhảy thẳng sang bước chọn ghế
    goToBookingStep(2);
  } else {
    goToBookingStep(1);
  }
}

function goToBookingStep(step) {
  if (step >= 2 && !CinemaStorage.getCurrentUser()) {
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để tiếp tục đặt vé.", "warning");
    return;
  }

  AppState.booking.currentStep = step;
  updateStepIndicators(step);

  const container = document.getElementById("bookingBodyContent");

  if (step === 1) {
    renderStep1Showtimes(container);
  } else if (step === 2) {
    renderStep2SeatMap(container);
  } else if (step === 3) {
    renderStep3Checkout(container);
  } else if (step === 4) {
    renderStep4Ticket(container);
  }
}

function updateStepIndicators(step) {
  document.querySelectorAll(".step-indicator").forEach(ind => {
    const s = Number(ind.getAttribute("data-step"));
    ind.classList.remove("active", "completed");
    if (s === step) {
      ind.classList.add("active");
    } else if (s < step) {
      ind.classList.add("completed");
    }
  });
}

// ------------------------------------------
// STEP 1: CHỌN RẠP, NGÀY & SUẤT CHIẾU
// ------------------------------------------
function renderStep1Showtimes(container) {
  const { movie, date } = AppState.booking;
  const cinemas = CinemaStorage.getCinemas();

  // Tạo các nút chọn ngày
  const dates = [0, 1, 2, 3].map(offset => {
    const val = getTodayDateString(offset);
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return {
      val,
      label: `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`,
      active: false
    };
  });

  // Đảm bảo luôn có 1 ngày hợp lệ được kích hoạt (ngăn chặn lỗi không chọn được ngày)
  let activeDateObj = dates.find(d => d.val === date);
  if (!activeDateObj) {
    activeDateObj = dates[0];
    AppState.booking.date = dates[0].val;
  }
  activeDateObj.active = true;
  date = AppState.booking.date;

  let html = `
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <h3 class="step-section-title">
          1. Chọn Ngày & Suất Chiếu: <span style="color: var(--primary-red);">${movie.title}</span>
        </h3>
      </div>

      <!-- Chọn ngày -->
      <div class="booking-date-pills">
        ${dates.map(d => `
          <button class="date-select-pill ${d.active ? "active" : ""}" onclick="selectBookingDate('${d.val}')">
            📅 ${d.label}
          </button>
        `).join("")}
      </div>

      <!-- Danh sách cụm rạp và các suất -->
      <div class="cinema-accordion">
  `;

  cinemas.forEach(cinema => {
    // Lấy các suất chiếu của phim tại rạp này vào ngày được chọn
    const showtimes = CinemaStorage.getShowtimes().filter(
      st => st.movieId === movie.id && st.cinemaId === cinema.id && st.date === date
    );

    html += `
      <div class="cinema-box">
        <div class="cinema-name-tag">📍 ${cinema.name}</div>
        <div class="cinema-addr-tag">${cinema.address} - Hotline: ${cinema.phone}</div>
    `;

    if (showtimes.length === 0) {
      html += `<div style="color: var(--text-dim); font-size: 0.85rem; padding: 10px 0;">Không có suất chiếu vào ngày này tại rạp này.</div>`;
    } else {
      // Nhóm theo loại phòng
      const roomsGrouped = {};
      showtimes.forEach(st => {
        const room = CinemaStorage.getRoomById(cinema.id, st.roomId);
        const type = room ? room.type : "2D";
        if (!roomsGrouped[type]) roomsGrouped[type] = [];
        roomsGrouped[type].push({ st, room });
      });

      for (const [type, list] of Object.entries(roomsGrouped)) {
        html += `
          <div class="hall-showtimes-group">
            <div class="hall-type-label">🎬 Định dạng: Phòng ${type} (${type === "IMAX" ? "Laser âm thanh vòm" : type === "3D" ? "Kính 3D RealD" : "Tiêu chuẩn 2D"})</div>
            <div class="time-chips-grid">
              ${list.map(({ st, room }) => {
                const past = (typeof isShowtimePast === "function") && isShowtimePast(st.date, st.startTime);
                if (past) {
                  return `
                    <div class="time-chip past" title="Suất chiếu này đã diễn ra vào lúc ${st.startTime}">
                      <span>${st.startTime}</span>
                      <span class="end-hint" style="color: #888;">Đã chiếu</span>
                    </div>
                  `;
                }
                return `
                  <div class="time-chip" onclick="selectShowtime('${st.id}')">
                    <span>${st.startTime}</span>
                    <span class="end-hint">~ ${st.endTime}</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }
    }

    html += `</div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

function selectBookingDate(dateVal) {
  AppState.booking.date = dateVal;
  goToBookingStep(1);
}

function selectShowtime(showtimeId) {
  const st = CinemaStorage.getShowtimeById(showtimeId);
  if (!st) return;

  AppState.booking.showtime = st;
  AppState.booking.cinema = CinemaStorage.getCinemaById(st.cinemaId);
  AppState.booking.room = CinemaStorage.getRoomById(st.cinemaId, st.roomId);
  AppState.booking.selectedSeats = [];

  goToBookingStep(2);
}

// ------------------------------------------
// STEP 2: SƠ ĐỒ GHẾ & GIỮ GHẾ 5 PHÚT
// ------------------------------------------
function renderStep2SeatMap(container) {
  const { movie, cinema, room, showtime, selectedSeats } = AppState.booking;

  // Lấy ma trận ghế mới nhất
  const freshShowtime = CinemaStorage.getShowtimeById(showtime.id);
  const matrix = freshShowtime.seats;

  let html = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #fff;">
            ${movie.title}
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
            ${cinema.name} | ${room.name} (${room.type}) | Suất: <strong style="color: var(--primary-red);">${showtime.startTime}</strong> (~${showtime.endTime})
          </p>
        </div>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 6px 14px;" onclick="goToBookingStep(1)">
          ← Chọn Lại Suất
        </button>
      </div>

      <!-- THANH ĐẾM NGƯỢC GIỮ GHẾ 5 PHÚT (300 GIÂY) -->
      <div class="reservation-timer-bar">
        <div class="timer-text">
          ⏳ <strong>Thời gian giữ chỗ ghế ngồi:</strong> Vui lòng hoàn tất thanh toán trước khi hết giờ.
        </div>
        <div class="timer-countdown" id="holdCountdownText">
          05:00
        </div>
      </div>

      <!-- MÀN HÌNH CHIẾU CONG (CINEMA CURVED SCREEN) -->
      <div class="cinema-screen-wrap">
        <div class="cinema-screen"></div>
        <span class="screen-text">MÀN HÌNH CHIẾU (SCREEN)</span>
      </div>

      <!-- MA TRẬN GHẾ TỪ SUATCHIEUFACTORY -->
      <div class="seat-matrix-wrapper">
  `;

  matrix.forEach(row => {
    html += `<div class="seat-row">`;
    const rowLetter = row[0] ? String.fromCharCode(65 + row[0].row) : "";
    html += `<span class="row-label">${rowLetter}</span>`;

    row.forEach(seat => {
      const isSelected = selectedSeats.some(s => s.code === seat.code);
      const isSold = seat.status === SEAT_STATUS.SOLD;
      const isHolding = seat.status === SEAT_STATUS.HOLDING && !isSelected;

      let typeClass = "seat-thuong";
      if (seat.type === "VIP") typeClass = "seat-vip";
      if (seat.type === "SWEETBOX") typeClass = "seat-sweetbox";

      let statusClass = "";
      if (isSold) statusClass = "sold";
      else if (isHolding) statusClass = "holding";
      else if (isSelected) statusClass = "selected";

      const seatLabel = seat.pairCode ? `${seat.code}-${seat.pairCode}` : seat.code;
      const titleAttr = isSold ? "Ghế đã bán" : isHolding ? "Đang có người giữ chỗ" : `${seatLabel} (${seat.type})`;

      html += `
        <button 
          class="seat-btn ${typeClass} ${statusClass}" 
          title="${titleAttr}"
          onclick="handleSeatClick('${seat.code}')"
          ${isSold || isHolding ? "disabled" : ""}
        >
          ${seatLabel}
        </button>
      `;
    });

    html += `<span class="row-label">${rowLetter}</span></div>`;
  });

  html += `
      </div>

      <!-- CHÚ THÍCH GHẾ (LEGEND) -->
      <div class="seat-legend">
        <div class="legend-item">
          <div class="legend-swatch" style="background: #282c3c; border: 1px solid rgba(255,255,255,0.2);"></div>
          <span>Ghế Thường [T] (0đ)</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background: #3a3222; border: 1px solid var(--gold);"></div>
          <span>Ghế VIP [V] (+20.000đ)</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background: #3b1e32; border: 1px solid var(--sweetbox-pink);"></div>
          <span>Ghế Đôi Sweetbox [S] (180.000đ / ghế)</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background: var(--primary-red);"></div>
          <span>Ghế Đang Chọn</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background: #473c18; border: 1px solid #d97706;"></div>
          <span>Đang Giữ Chỗ [G]</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background: #1a1a24; border: 1px solid #333;"></div>
          <span>Đã Bán [B]</span>
        </div>
      </div>

      <div style="margin-top: 24px; padding: 20px; background: #161824; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Ghế đã chọn:</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #fff;">
            ${selectedSeats.length > 0 ? selectedSeats.map(s => s.pairCode ? `${s.code}-${s.pairCode}` : s.code).join(", ") : "Chưa chọn ghế nào"}
          </div>
        </div>
        <button class="btn-secondary" onclick="document.getElementById('bookingFoodSelection').scrollIntoView({ behavior: 'smooth' })">
          ↓ Chọn bắp nước &amp; món ăn
        </button>
      </div>

      <section id="bookingFoodSelection" class="booking-food-section">
        <div class="booking-food-heading">
          <div>
            <h3 class="step-section-title">Bắp nước &amp; món ăn</h3>
            <p>Chọn combo hoặc món lẻ, món đã chọn sẽ được cộng vào hóa đơn.</p>
          </div>
          <span class="optional-label">Không bắt buộc</span>
        </div>
        <div class="combos-grid">
          ${CinemaStorage.getCombos().map(item => {
            const quantity = AppState.booking.selectedCombos[item.id] || 0;
            return `
              <article class="combo-card">
                <img class="combo-image" data-combo-image="${item.image}" alt="${item.name}" loading="lazy"
                  ${/^https?:\/\//i.test(item.image) ? `src="${item.image}"` : ""}
                  onerror="this.onerror=null;this.removeAttribute('src');this.alt='Không tải được ảnh món ăn'">
                <span class="combo-category">${item.category === "single" ? "Món lẻ" : "Combo"}</span>
                <div class="combo-name">${item.name}</div>
                <div class="combo-desc">${item.description}</div>
                <div class="combo-price-row">
                  <div class="combo-price">${item.price.toLocaleString()}đ</div>
                  <div class="qty-control">
                    <button class="qty-btn" aria-label="Bớt ${item.name}" onclick="updateComboQty('${item.id}', -1)">-</button>
                    <span class="qty-val">${quantity}</span>
                    <button class="qty-btn" aria-label="Thêm ${item.name}" onclick="updateComboQty('${item.id}', 1)">+</button>
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>

      <div class="booking-food-actions">
        <button class="btn-primary" onclick="proceedToCheckout()">
          Tiếp tục thanh toán →
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  loadBookingComboImages(container);
  startHoldCountdownTimer();
}

async function loadBookingComboImages(container) {
  const images = [...container.querySelectorAll("[data-combo-image]")];
  try {
    await Promise.all(images.map(async image => {
      const imageReference = image.dataset.comboImage;
      const objectUrl = await CinemaStorage.getComboImageObjectUrl(imageReference);
      if (image.isConnected && image.dataset.comboImage === imageReference) image.src = objectUrl;
    }));
  } catch (error) {
    showToast(error.message, "error");
  }
}

function handleSeatClick(seatCode) {
  const user = CinemaStorage.getCurrentUser();
  if (!user) {
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để chọn ghế và đặt vé.", "warning");
    return;
  }

  const { showtime, selectedSeats } = AppState.booking;
  const seat = CinemaStorage.findSeatInMatrix(showtime.seats, seatCode);
  if (!seat || seat.status === SEAT_STATUS.SOLD) return;

  const index = selectedSeats.findIndex(s => s.code === seatCode);

  if (index >= 0) {
    selectedSeats.splice(index, 1);
    CinemaStorage.releaseSeats(showtime.id, [seatCode], user.id);
    if (selectedSeats.length === 0 && AppState.booking.holdTimerInterval) {
      clearInterval(AppState.booking.holdTimerInterval);
      AppState.booking.holdTimerInterval = null;
      AppState.booking.holdRemainingSeconds = 300;
      AppState.booking.isHoldExpiredNotified = false;
    }
  } else {
    try {
      CinemaStorage.holdSeats(showtime.id, [seatCode], user.id);

      selectedSeats.push(seat);

      // Kích hoạt lại đồng hồ 5 phút nếu là ghế đầu tiên
      if (selectedSeats.length > 0 && !AppState.booking.holdTimerInterval) {
        AppState.booking.holdRemainingSeconds = 300;
      }
    } catch (err) {
      showToast(err.message, "error");
      return;
    }
  }

  // Render lại để cập nhật màu ghế
  renderStep2SeatMap(document.getElementById("bookingBodyContent"));
}


function clearHoldCountdownTimer() {
  if (AppState.booking && AppState.booking.holdTimerInterval) {
    clearInterval(AppState.booking.holdTimerInterval);
    AppState.booking.holdTimerInterval = null;
  }
}

function startHoldCountdownTimer() {
  if (AppState.booking.holdTimerInterval) return;
  if (!AppState.booking.selectedSeats || AppState.booking.selectedSeats.length === 0) return;

  AppState.booking.holdTimerInterval = setInterval(() => {
    AppState.booking.holdRemainingSeconds--;
    const sec = AppState.booking.holdRemainingSeconds;
    const countdownEl = document.getElementById("holdCountdownText");

    if (countdownEl) {
      const safeSec = Math.max(0, sec);
      const m = String(Math.floor(safeSec / 60)).padStart(2, "0");
      const s = String(safeSec % 60).padStart(2, "0");
      countdownEl.innerText = `${m}:${s}`;

      if (safeSec <= 60) {
        countdownEl.classList.add("warning");
      } else {
        countdownEl.classList.remove("warning");
      }
    }

    if (sec <= 0) {
      clearInterval(AppState.booking.holdTimerInterval);
      AppState.booking.holdTimerInterval = null;
      AppState.booking.holdRemainingSeconds = 0;

      // Hết hạn giữ ghế: giải phóng ghế
      if (AppState.booking.showtime && AppState.booking.selectedSeats.length > 0) {
        try {
          CinemaStorage.releaseSeats(
            AppState.booking.showtime.id,
            AppState.booking.selectedSeats.map(s => s.code),
            AppState.booking.userId
          );
        } catch (e) {
          console.warn("Release seats on timeout:", e);
        }
      }
      AppState.booking.selectedSeats = [];

      // Vô hiệu hóa form thanh toán và nút xác nhận ở Step 3
      const confirmBtn = document.getElementById("confirmPaymentButton");
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.cursor = "not-allowed";
        confirmBtn.innerText = "⏳ Đã Hết Hạn Giữ Ghế (5 Phút)";
      }

      // Đảm bảo chỉ trigger thông báo đúng 1 lần duy nhất (Debounce / Flag)
      if (!AppState.booking.isHoldExpiredNotified) {
        AppState.booking.isHoldExpiredNotified = true;
        showToast("Đã hết 5 phút giữ chỗ! Ghế đã được tự động giải phóng.", "error");

        const expModal = document.getElementById("holdExpiredModal");
        if (expModal) {
          expModal.classList.add("open");
        } else {
          goToBookingStep(2);
        }
      }
    }
  }, 1000);
}

function closeHoldExpiredModalAndReturn() {
  const expModal = document.getElementById("holdExpiredModal");
  if (expModal) expModal.classList.remove("open");
  AppState.booking.holdRemainingSeconds = 300;
  AppState.booking.isHoldExpiredNotified = false;
  goToBookingStep(2);
}

function proceedToCheckout() {
  if (!CinemaStorage.getCurrentUser()) {
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để tiếp tục đặt vé.", "warning");
    return;
  }
  if (AppState.booking.selectedSeats.length === 0) {
    showToast("Vui lòng chọn ít nhất một ghế!", "warning");
    return;
  }
  goToBookingStep(3);
}

function updateComboQty(comboId, delta) {
  const current = AppState.booking.selectedCombos[comboId] || 0;
  const next = Math.max(0, current + delta);
  AppState.booking.selectedCombos[comboId] = next;
  const container = document.getElementById("bookingBodyContent");
  const modal = container.closest(".modal-container");
  const scrollTop = modal.scrollTop;
  renderStep2SeatMap(container);
  modal.scrollTop = scrollTop;
}

// ------------------------------------------
// STEP 3: TÓM TẮT HÓA ĐƠN & THANH TOÁN
// ------------------------------------------
function renderStep3Checkout(container) {
  const { movie, cinema, room, showtime, selectedSeats, selectedCombos } = AppState.booking;

  const combosList = CinemaStorage.getCombos().map(c => ({
    ...c,
    quantity: selectedCombos[c.id] || 0
  }));

  const calc = CinemaStorage.calculateOrderSummary(movie, room, selectedSeats, combosList);
  const currentUser = CinemaStorage.getCurrentUser();

  let html = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 class="step-section-title">
          3. Chi Tiết Hóa Đơn & Phương Thức Thanh Toán
        </h3>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 6px 14px;" onclick="goToBookingStep(2)">
          ← Chọn ghế / bắp nước
        </button>
      </div>

      <div class="checkout-grid">
        <!-- BẢNG TÍNH TIỀN THEO ĐÚNG DECORATOR PATTERN C++ -->
        <div class="order-receipt-card">
          <div class="receipt-title">📋 Hóa Đơn Đặt Vé Chi Tiết</div>
          <div class="receipt-row">
            <span>Phim:</span>
            <strong>${movie.title}</strong>
          </div>
          <div class="receipt-row">
            <span>Rạp & Phòng:</span>
            <strong>${cinema.name} - ${room.name} (${room.type})</strong>
          </div>
          <div class="receipt-row">
            <span>Suất Chiếu:</span>
            <strong>${showtime.startTime} - ${showtime.date}</strong>
          </div>
          <div class="receipt-row">
            <span>Vị Trí Ghế:</span>
            <strong style="color: var(--primary-red);">${selectedSeats.map(s => s.code).join(", ")}</strong>
          </div>

          <div style="margin: 16px 0; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">CHI TIẾT VÉ:</div>
            ${calc.ticketBreakdown.map(tb => `
              <div class="receipt-row" style="font-size: 0.82rem;">
                <span>Ghế ${tb.code} (${tb.type}):</span>
                <span>${tb.price.toLocaleString()}đ</span>
              </div>
            `).join("")}
          </div>

          ${calc.comboBreakdown.length > 0 ? `
            <div style="margin: 16px 0; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">BẮP NƯỚC &amp; MÓN ĂN:</div>
              ${calc.comboBreakdown.map(cb => `
                <div class="receipt-row" style="font-size: 0.82rem;">
                  <span>${cb.name} x ${cb.quantity}:</span>
                  <span>${cb.subtotal.toLocaleString()}đ</span>
                </div>
              `).join("")}
            </div>
          ` : ""}

          ${calc.vipDiscount > 0 ? `
            <div style="margin: 14px 0; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 10px;">
              <div class="receipt-row" style="font-size: 0.85rem; color: var(--gold); font-weight: 700;">
                <span>👑 ${calc.vipDiscountDesc || "Ưu đãi thành viên VIP"}:</span>
                <span>-${calc.vipDiscount.toLocaleString()}đ</span>
              </div>
            </div>
          ` : ""}

          <div class="receipt-total">
            <span class="total-label">TỔNG THANH TOÁN:</span>
            <span class="total-amount">${calc.grandTotal.toLocaleString()} VNĐ</span>
          </div>
        </div>

        <!-- PHƯƠNG THỨC THANH TOÁN & THÔNG TIN KHÁCH HÀNG -->
        <div>
          <div style="background: #161826; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px; margin-bottom: 20px;">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 14px; color: #fff;">Thông Tin Khách Hàng:</div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Họ và tên</label>
              <input type="text" id="custName" class="form-input" value="${currentUser ? currentUser.fullName : "Khách Hàng Rạp"}" placeholder="Nhập họ tên...">
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Số điện thoại</label>
              <input type="tel" id="custPhone" class="form-input" value="${currentUser ? currentUser.phone : "0909123456"}" placeholder="Nhập SĐT để nhận vé...">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="custEmail" class="form-input" value="${currentUser ? currentUser.email : "khachhang@gmail.com"}" placeholder="Nhập email...">
            </div>
          </div>

          <div style="background: #161826; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px;">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 14px; color: #fff;">Phương Thức Thanh Toán:</div>
            <div class="payment-methods">
              <label class="pay-method-radio active">
                <span>💵 Thanh Toán Tiền Mặt Tại Quầy Vé</span>
              </label>
            </div>

            <p id="paymentStatusHint" style="font-size: 0.82rem; color: var(--text-muted); margin-top: 12px;">
              Bạn sẽ thanh toán trực tiếp tại quầy. Đơn đặt vé sẽ ở trạng thái chờ thanh toán.
            </p>
            <div style="margin-top: 24px;">
              <button id="confirmPaymentButton" class="btn-primary" style="width: 100%; justify-content: center; font-size: 1.05rem; padding: 14px;" onclick="confirmCheckoutOrder()">
                🎟 Xác Nhận Đặt Vé (${calc.grandTotal.toLocaleString()}đ)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function confirmCheckoutOrder() {
  if (AppState.booking.holdRemainingSeconds <= 0 || !AppState.booking.selectedSeats || AppState.booking.selectedSeats.length === 0) {
    showToast("Thời gian giữ ghế đã hết hoặc chưa chọn ghế! Vui lòng chọn lại ghế.", "error");
    goToBookingStep(2);
    return;
  }
  const currentUser = CinemaStorage.getCurrentUser();
  if (!currentUser) {
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để hoàn tất đặt vé.", "warning");
    return;
  }

  const btn = document.getElementById("confirmPaymentButton");
  if (btn && btn.disabled) return;
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang Xử Lý Đặt Vé...";
  }

  const custName = document.getElementById("custName")?.value || (currentUser ? currentUser.fullName : "Khách Hàng");
  const custPhone = document.getElementById("custPhone")?.value || (currentUser ? currentUser.phone : "0909123456");
  const custEmail = document.getElementById("custEmail")?.value || (currentUser ? currentUser.email : "");

  const combosList = CinemaStorage.getCombos().map(c => ({
    ...c,
    quantity: AppState.booking.selectedCombos[c.id] || 0
  }));

  try {
    const createdTicket = CinemaStorage.checkoutOrder({
      showtimeId: AppState.booking.showtime.id,
      seats: AppState.booking.selectedSeats,
      combos: combosList,
      customer: {
        id: currentUser ? currentUser.id : null,
        name: custName,
        phone: custPhone,
        email: custEmail
      },
      paymentMethod: "CASH_COUNTER"
    });

    // Dừng timer
    if (AppState.booking.holdTimerInterval) {
      clearInterval(AppState.booking.holdTimerInterval);
      AppState.booking.holdTimerInterval = null;
    }

    AppState.lastCreatedTicket = createdTicket;
    showToast(
      createdTicket.paymentStatus === "PENDING_COUNTER"
        ? "Đặt vé thành công. Vui lòng thanh toán tại quầy để hoàn tất."
        : "Thanh toán thành công! Vé đã được xuất.",
      "success"
    );
    goToBookingStep(4);
  } catch (err) {
    showToast(err.message, "error");
    if (err.message.includes("không còn được giữ") || err.message.includes("đã hết") || err.message.includes("người khác") || err.message.includes("không tồn tại")) {
      if (AppState.booking) {
        AppState.booking.selectedSeats = [];
      }
      setTimeout(() => goToBookingStep(2), 1200);
      return;
    }
    if (btn) {
      btn.disabled = false;
      const calc = CinemaStorage.calculateOrderSummary(
        AppState.booking.movie,
        AppState.booking.room,
        AppState.booking.selectedSeats,
        combosList
      );
      btn.innerHTML = `🎟 Xác Nhận Đặt Vé (${calc.grandTotal.toLocaleString()}đ)`;
    }
  }
}

// ------------------------------------------
// STEP 4: XUẤT VÉ ĐIỆN TỬ (E-TICKET)
// ------------------------------------------
function renderStep4Ticket(container) {
  const ticket = AppState.lastCreatedTicket;
  if (!ticket) return;

  const seatsListStr = ticket.seats.map(s => `${s.code} (${s.type})`).join(", ");
  const isCounterPaymentPending = ticket.paymentStatus === "PENDING_COUNTER" ||
    (!ticket.paymentStatus && ticket.paymentMethod === "CASH_COUNTER");
  const paymentStatusText = isCounterPaymentPending ? "CHỜ THANH TOÁN TẠI QUẦY" : "ĐÃ THANH TOÁN";

  let html = `
    <div style="text-align: center;">
      <div style="font-size: 2.2rem; margin-bottom: 8px;">🎉</div>
      <h2 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 6px;">
        ${isCounterPaymentPending ? "ĐẶT VÉ THÀNH CÔNG!" : "ĐẶT VÉ VÀ THANH TOÁN THÀNH CÔNG!"}
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 28px;">
        ${isCounterPaymentPending
          ? "Vui lòng mang mã đặt vé đến quầy thanh toán trước giờ chiếu để hoàn tất đơn."
          : "Quý khách vui lòng lưu lại mã vé hoặc xuất trình mã QR tại quầy soát vé rạp chiếu phim."}
      </p>

      <div class="ticket-wrapper" id="printableTicket">
        <div class="ticket-header">
          <div class="ticket-brand">RED CINEMA ENTERTAINMENT</div>
          <div class="ticket-code-tag">MÃ VÉ: ${ticket.ticketId}</div>
        </div>

        <div class="ticket-body">
          <div class="ticket-movie-title">${ticket.movieTitle}</div>

          <div class="ticket-specs-grid">
            <div style="text-align: left;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Cụm Rạp:</div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${ticket.cinemaName}</div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Phòng Chiếu:</div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${ticket.roomName}</div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Suất Chiếu:</div>
              <div style="font-weight: 700; color: var(--primary-red); font-size: 1.05rem;">${ticket.startTime} (~${ticket.endTime})</div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Ngày Chiếu:</div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${ticket.date}</div>
            </div>
            <div style="text-align: left; grid-column: 1 / -1;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Vị Trí Ghế:</div>
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 1.15rem;">${seatsListStr}</div>
            </div>
            ${ticket.combos.length > 0 ? `
              <div style="text-align: left; grid-column: 1 / -1;">
                <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Bắp Nước &amp; Món Ăn:</div>
                <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">
                  ${ticket.combos.map(c => `${c.name} x${c.quantity}`).join(", ")}
                </div>
              </div>
            ` : ""}
            <div style="text-align: left;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Khách Hàng:</div>
              <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">${ticket.customerName} (${ticket.customerPhone})</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Tổng Tiền:</div>
              <div style="font-weight: 900; color: var(--primary-red); font-size: 1.25rem;">${ticket.totalAmount.toLocaleString()}đ</div>
            </div>
            <div style="text-align: left; grid-column: 1 / -1;">
              <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Trạng Thái Thanh Toán:</div>
              <div style="font-weight: 800; color: ${isCounterPaymentPending ? "var(--gold)" : "var(--green-success)"}; font-size: 0.95rem;">${paymentStatusText}</div>
            </div>
          </div>

          <!-- MÃ QR VERIFICATION -->
          <div class="ticket-qr-area">
            <div class="qr-placeholder">
              <!-- SVG mô phỏng mã QR -->
              <svg width="124" height="124" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2">
                <rect x="2" y="2" width="6" height="6" fill="#111"/>
                <rect x="16" y="2" width="6" height="6" fill="#111"/>
                <rect x="2" y="16" width="6" height="6" fill="#111"/>
                <path d="M10 2h4v4h-4z M2 10h4v4h-4z M10 10h4v4h-4z M16 10h6v2h-6z M10 16h2v6h-2z M14 16h4v2h-4z M18 20h4v2h-4z"/>
              </svg>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-dim); font-family: monospace;">
              ${isCounterPaymentPending ? "MÃ ĐẶT VÉ" : "SCAN-QR-VALID"}: ${ticket.ticketId}
            </span>
          </div>
        </div>
      </div>

      <div style="margin-top: 32px; display: flex; gap: 16px; justify-content: center;">
        <button class="btn-secondary" onclick="window.print()">
          🖨 In Vé / Tải PDF
        </button>
        <button class="btn-primary" onclick="closeModal('bookingModal'); openMyTicketsModal();">
          🎟 Xem Vé Của Tôi
        </button>
        <button class="btn-secondary" onclick="closeModal('bookingModal')">
          Đóng
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ==========================================
// 7. USER AUTH MODALS (LOGIN / REGISTER)
// ==========================================
function initAuthUI() {
  // Đóng modal khi click ra ngoài
  window.addEventListener("click", e => {
    if (e.target.classList.contains("modal-backdrop")) {
      if (e.target.id === "authModal") AppState.pendingBooking = null;
      e.target.classList.remove("open");
    }
  });
}

function openAuthModal(defaultTab = "login") {
  const modal = document.getElementById("authModal");
  switchAuthTab(defaultTab);
  modal.classList.add("open");
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById("tabLoginBtn");
  const regTab = document.getElementById("tabRegisterBtn");
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");

  if (tab === "login") {
    loginTab.classList.add("active");
    regTab.classList.remove("active");
    loginForm.style.display = "flex";
    regForm.style.display = "none";
  } else {
    regTab.classList.add("active");
    loginTab.classList.remove("active");
    loginForm.style.display = "none";
    regForm.style.display = "flex";
  }
}


// ==========================================
// FORGOT PASSWORD FLOW (QUÊN MẬT KHẨU QUA OTP EMAIL)
// ==========================================
function openForgotPasswordFlow() {
  const loginForm = document.getElementById("loginForm");
  const forgotWrapper = document.getElementById("forgotPasswordWrapper");
  const authTabs = document.querySelector("#authModal .auth-tabs");

  if (loginForm) loginForm.style.display = "none";
  if (authTabs) authTabs.style.display = "none";
  if (forgotWrapper) forgotWrapper.style.display = "block";

  const reqForm = document.getElementById("forgotOtpRequestForm");
  const resForm = document.getElementById("forgotResetPasswordForm");
  if (reqForm) reqForm.style.display = "block";
  if (resForm) resForm.style.display = "none";
}

function closeForgotPasswordFlow() {
  const loginForm = document.getElementById("loginForm");
  const forgotWrapper = document.getElementById("forgotPasswordWrapper");
  const authTabs = document.querySelector("#authModal .auth-tabs");

  if (forgotWrapper) forgotWrapper.style.display = "none";
  if (loginForm) loginForm.style.display = "flex";
  if (authTabs) authTabs.style.display = "flex";
}

async function handleRequestPasswordOtp(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmailInput");
  const email = emailInput ? emailInput.value.trim() : "";
  if (!email) return;

  const btn = document.getElementById("btnSendOtp");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang gửi mã OTP...";
  }

  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Mã OTP đã được gửi đến email của bạn!", "success");
      const reqForm = document.getElementById("forgotOtpRequestForm");
      const resForm = document.getElementById("forgotResetPasswordForm");
      if (reqForm) reqForm.style.display = "none";
      if (resForm) {
        resForm.style.display = "block";
        const otpNotice = document.getElementById("forgotOtpSentNotice");
        if (otpNotice) {
          otpNotice.innerHTML = `✅ Mã OTP đã được gửi tới <strong>${email}</strong> (Hạn dùng 5 phút).${data.testOtp ? `<br><small style="color: var(--gold);">[Mã OTP thử nghiệm]: <strong>${data.testOtp}</strong></small>` : ''}`;
        }
      }
    } else {
      showToast(data.message || "Không thể gửi OTP!", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối máy chủ: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "📩 Gửi Mã OTP Xác Thực";
    }
  }
}

async function handleResetPasswordSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmailInput");
  const otpInput = document.getElementById("forgotOtpInput");
  const passInput = document.getElementById("forgotNewPasswordInput");

  const email = emailInput ? emailInput.value.trim() : "";
  const otp = otpInput ? otpInput.value.trim() : "";
  const newPassword = passInput ? passInput.value : "";

  if (!email || !otp || !newPassword) {
    showToast("Vui lòng nhập đầy đủ OTP và mật khẩu mới!", "warning");
    return;
  }

  const btn = document.getElementById("btnSubmitResetPass");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang cập nhật...";
  }

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      showToast("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.", "success");
      closeForgotPasswordFlow();
      const loginPassInput = document.getElementById("loginPassword");
      if (loginPassInput) loginPassInput.value = newPassword;
      const loginEmailInput = document.getElementById("loginEmail");
      if (loginEmailInput) loginEmailInput.value = email;
    } else {
      showToast(data.message || "Đặt lại mật khẩu thất bại!", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối máy chủ: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "🔐 Đặt Lại Mật Khẩu";
    }
  }
}

async function handleUserLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  try {
    const user = await CinemaStorage.loginUser(email, pass);
    finishUserAuthentication(`Chào mừng bạn trở lại, ${user.fullName}!`);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function handleUserRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById("regFullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword")?.value || "";

  // Reset errors
  const nameErr = document.getElementById("regNameError");
  const emailErr = document.getElementById("regEmailError");
  const phoneErr = document.getElementById("regPhoneError");
  const passErr = document.getElementById("regPasswordError");
  [nameErr, emailErr, phoneErr, passErr].forEach(el => {
    if (el) { el.style.display = "none"; el.textContent = ""; }
  });

  let hasError = false;
  if (!fullName || fullName.length < 2) {
    if (nameErr) { nameErr.textContent = "Họ và tên phải có tối thiểu 2 ký tự."; nameErr.style.display = "block"; }
    hasError = true;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    if (emailErr) { emailErr.textContent = "Định dạng email không hợp lệ (ví dụ: customer@gmail.com)."; emailErr.style.display = "block"; }
    hasError = true;
  }

  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!phone || !phoneRegex.test(phone)) {
    if (phoneErr) { phoneErr.textContent = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09)."; phoneErr.style.display = "block"; }
    hasError = true;
  }

  if (!password || password.length < 6) {
    if (passErr) { passErr.textContent = "Mật khẩu bảo mật phải có tối thiểu 6 ký tự."; passErr.style.display = "block"; }
    hasError = true;
  } else if (confirmPassword && password !== confirmPassword) {
    if (passErr) { passErr.textContent = "Mật khẩu xác nhận không khớp. Vui lòng nhập lại!"; passErr.style.display = "block"; }
    hasError = true;
  }

  if (hasError) return;

  try {
    const user = CinemaStorage.registerUser({ fullName, email, phone, password });
    finishUserAuthentication(`Đăng ký tài khoản thành công! Chào mừng ${user.fullName}`);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function finishUserAuthentication(message) {
  const pendingBooking = AppState.pendingBooking;
  AppState.pendingBooking = null;
  closeModal("authModal");
  updateUserAuthHeader();
  showToast(message, "success");

  if (pendingBooking) {
    startBookingFlow(
      pendingBooking.movieId,
      pendingBooking.preCinemaId,
      pendingBooking.preDate,
      pendingBooking.preShowtimeId
    );
  }
}

// ==========================================
// 8. MY TICKETS & BOOKING HISTORY (LỊCH SỬ ĐẶT VÉ & HỦY VÉ)
// ==========================================
function openMyTicketsModal() {
  const user = CinemaStorage.getCurrentUser();
  if (!user) {
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để xem lịch sử mua vé.", "warning");
    return;
  }

  AppState.ticketFilter = "all";
  AppState.ticketSearchQuery = "";
  const searchInput = document.getElementById("myTicketSearchInput");
  if (searchInput) searchInput.value = "";

  renderMyTicketsList();
  const modal = document.getElementById("myTicketsModal");
  if (modal) modal.classList.add("open");
}

function handleTicketSearchInput(input) {
  AppState.ticketSearchQuery = (input.value || "").trim().toLowerCase();
  renderMyTicketsList();
}

function setTicketFilter(filter, btn) {
  AppState.ticketFilter = filter;
  document.querySelectorAll("#myTicketsModal .filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderMyTicketsList();
}

function renderMyTicketsList() {
  const user = CinemaStorage.getCurrentUser();
  const content = document.getElementById("myTicketsContent");
  if (!user || !content) return;

  const allTickets = CinemaStorage.getSoldTickets()
    .filter(t => t.userId === user.id || t.customerEmail === user.email || (user.phone && t.customerPhone === user.phone))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Update Count Badges
  const totalCount = allTickets.length;
  const paidCount = allTickets.filter(t => t.status !== "CANCELLED").length;
  const cancelledCount = allTickets.filter(t => t.status === "CANCELLED").length;

  const elAll = document.getElementById("ticketCountAll");
  const elPaid = document.getElementById("ticketCountPaid");
  const elCan = document.getElementById("ticketCountCancelled");
  if (elAll) elAll.textContent = totalCount;
  if (elPaid) elPaid.textContent = paidCount;
  if (elCan) elCan.textContent = cancelledCount;

  // Apply Filter
  let filtered = allTickets;
  if (AppState.ticketFilter === "PAID") {
    filtered = filtered.filter(t => t.status !== "CANCELLED");
  } else if (AppState.ticketFilter === "CANCELLED") {
    filtered = filtered.filter(t => t.status === "CANCELLED");
  }

  // Apply Search Query
  if (AppState.ticketSearchQuery) {
    const q = AppState.ticketSearchQuery;
    filtered = filtered.filter(t => {
      const matchId = (t.ticketId || "").toLowerCase().includes(q);
      const matchMovie = (t.movieTitle || "").toLowerCase().includes(q);
      const matchCinema = (t.cinemaName || "").toLowerCase().includes(q);
      const matchPhone = (t.customerPhone || "").toLowerCase().includes(q);
      const matchSeats = (t.seats || []).some(s => (s.code || s || "").toLowerCase().includes(q));
      return matchId || matchMovie || matchCinema || matchPhone || matchSeats;
    });
  }

  if (filtered.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🎟️</div>
        <p style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Không tìm thấy vé xem phim nào phù hợp.</p>
        <p style="font-size: 0.85rem;">${AppState.ticketSearchQuery ? "Hãy thử tìm kiếm với từ khóa khác." : "Hãy lựa chọn những bộ phim bom tấn và đặt vé ngay hôm nay!"}</p>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${filtered.map(t => {
        const isCancelled = t.status === "CANCELLED";
        const isPending = t.paymentStatus === "PENDING_COUNTER" || (!t.paymentStatus && t.paymentMethod === "CASH_COUNTER");
        const statusBadge = isCancelled
          ? `<span style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 750;">✕ ĐÃ HỦY VÉ</span>`
          : (isPending
            ? `<span style="background: rgba(245, 197, 24, 0.15); color: var(--gold); border: 1px solid rgba(245, 197, 24, 0.35); padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 750;">⏳ CHỜ THANH TOÁN TẠI QUẦY</span>`
            : `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 750;">✓ ĐÃ THANH TOÁN THÀNH CÔNG</span>`);

        const seatCodes = (t.seats || []).map(s => s.code || s).join(", ");
        const comboSummary = (t.combos && t.combos.length > 0)
          ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">🍿 Combo: ${t.combos.map(c => `${c.quantity}x ${c.name}`).join(", ")}</div>`
          : "";

        return `
          <div style="background: #151724; border: 1px solid ${isCancelled ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; opacity: ${isCancelled ? '0.75' : '1'}; transition: all 0.2s;">
            <div style="flex: 1; min-width: 260px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                <span style="font-size: 0.85rem; color: var(--primary-red); font-weight: 800; font-family: monospace;">MÃ: ${t.ticketId}</span>
                ${statusBadge}
              </div>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin-bottom: 4px;">${t.movieTitle}</h4>
              <p style="font-size: 0.84rem; color: var(--text-muted);">
                🏢 ${t.cinemaName} | 🚪 ${t.roomName} | ⏰ <strong style="color: #fff;">${t.startTime}</strong> - Ngày ${t.date}
              </p>
              <p style="font-size: 0.86rem; color: var(--gold); margin-top: 4px; font-weight: 750;">
                💺 Ghế đã đặt: ${seatCodes}
              </p>
              ${comboSummary}
              ${isCancelled && t.cancelReason ? `<div style="font-size: 0.78rem; color: #f87171; margin-top: 4px;">Lý do hủy: ${t.cancelReason} (${new Date(t.cancelledAt).toLocaleString("vi-VN")})</div>` : ''}
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
              <div style="font-size: 1.3rem; font-weight: 900; color: #fff;">
                ${(t.totalAmount || 0).toLocaleString()} VNĐ
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn-secondary" style="padding: 7px 14px; font-size: 0.82rem;" onclick="openETicketModal('${t.ticketId}')">
                  🔍 Chi Tiết &amp; QR
                </button>
                ${!isCancelled ? (
                  (() => {
                    let canCancel = false;
                    let cancelTooltip = "";
                    if (t.date && t.startTime) {
                      const showtimeTime = new Date(`${t.date}T${t.startTime}:00`).getTime();
                      const now = Date.now();
                      const diffMinutes = (showtimeTime - now) / (1000 * 60);
                      if (diffMinutes >= 60) {
                        canCancel = true;
                      } else if (diffMinutes > 0) {
                        cancelTooltip = "Quy định: Chỉ được hủy trước giờ chiếu tối thiểu 1 tiếng";
                      } else {
                        cancelTooltip = "Suất chiếu đã bắt đầu hoặc kết thúc";
                      }
                    }
                    if (canCancel) {
                      return `<button class="btn-sm-danger" style="padding: 7px 14px; font-size: 0.82rem; border-radius: 6px;" onclick="handleCustomerCancelTicket('${t.ticketId}')">✕ Hủy Vé</button>`;
                    } else {
                      return `<button class="btn-sm-danger" style="padding: 7px 14px; font-size: 0.82rem; border-radius: 6px; opacity: 0.45; cursor: not-allowed;" disabled title="${cancelTooltip}">✕ Hủy Vé <span style="font-size: 0.72rem; display: block; font-weight: normal;">(Trước >= 1h)</span></button>`;
                    }
                  })()
                ) : ''}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function handleCustomerCancelTicket(ticketId) {
  if (!confirm(`XÁC NHẬN HỦY VÉ [${ticketId}]?\n\nRàng buộc & Quy định hủy vé:\n- Vé chỉ được phép hủy trước giờ bắt đầu suất chiếu ít nhất 1 tiếng.\n- Khi xác nhận hủy, trạng thái vé sẽ đổi thành "Đã hủy".\n- Toàn bộ ghế sẽ được tự động giải phóng trên sơ đồ phòng chiếu để người khác có thể đặt.\n- Điểm thưởng tích lũy của giao dịch này sẽ được hoàn tác.\n\nBạn có chắc chắn muốn hủy vé này không?`)) {
    return;
  }

  try {
    CinemaStorage.cancelTicket(ticketId, "Khách hàng tự hủy trên website", true);
    showToast(`Đã hủy vé [${ticketId}] thành công. Ghế đã được giải phóng!`, "success");
    renderMyTicketsList();
    updateUserAuthHeader();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ==========================================
// 9. USER PROFILE & VIP MEMBERSHIP (HỒ SƠ & HẠNG THÀNH VIÊN)
// ==========================================
function openUserProfileModal() {
  const user = CinemaStorage.getCurrentUser();
  if (!user) {
    openAuthModal("login");
    showToast("Vui lòng đăng nhập để xem thông tin tài khoản & hạng VIP.", "warning");
    return;
  }

  const modal = document.getElementById("userProfileModal");
  const content = document.getElementById("userProfileContent");
  if (!content) return;

  const tier = user.membershipTier || "Standard";
  const points = user.points || 0;

  // Tính tiến độ lên hạng kế tiếp
  let nextTierName = "VIP Gold";
  let neededPoints = 200;
  let progressPercent = Math.min(100, Math.round((points / 200) * 100));

  if (tier === "VIP Gold") {
    nextTierName = "Platinum";
    neededPoints = 500;
    progressPercent = Math.min(100, Math.round(((points - 200) / 300) * 100));
  } else if (tier === "Platinum") {
    nextTierName = "Hạng Cao Nhất";
    neededPoints = 500;
    progressPercent = 100;
  }

  const tierColor = tier === "Platinum" ? "#c084fc" : (tier === "VIP Gold" ? "var(--gold)" : "#10b981");

  content.innerHTML = `
    <!-- Thẻ thông tin cá nhân -->
    <div style="background: linear-gradient(135deg, rgba(229, 9, 20, 0.15), rgba(16, 18, 27, 0.8)); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: ${tierColor}; color: #000; font-size: 1.6rem; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${tierColor}40;">
          ${(user.fullName || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 style="font-size: 1.25rem; font-weight: 800; color: #fff;">${user.fullName}</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${user.email} ${user.phone ? `• ${user.phone}` : ''}</p>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Hạng Thẻ Hiện Tại</div>
        <div style="font-size: 1.35rem; font-weight: 900; color: ${tierColor};">👑 ${tier}</div>
        <div style="font-size: 0.95rem; font-weight: 750; color: #fff; margin-top: 2px;">⭐ ${points} Điểm Tích Lũy</div>
      </div>
    </div>

    <!-- Thanh tiến độ thăng hạng -->
    <div style="background: #141622; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
        <span style="color: var(--text-muted);">Tiến độ thăng hạng: <strong style="color: #fff;">${nextTierName}</strong></span>
        <span style="color: var(--gold); font-weight: 750;">${tier === 'Platinum' ? 'Đã đạt cấp tối đa' : `${points} / ${neededPoints} điểm (${progressPercent}%)`}</span>
      </div>
      <div style="height: 10px; background: rgba(255,255,255,0.08); border-radius: 5px; overflow: hidden;">
        <div style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, var(--primary-red), var(--gold)); transition: width 0.4s ease;"></div>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">
        💡 Mỗi lần đặt vé thành công, hệ thống sẽ tự động tích lũy điểm thưởng và nâng hạng tài khoản cho bạn khi đủ điều kiện!
      </div>
    </div>

    <!-- Bảng so sánh quyền lợi giữa các hạng tài khoản -->
    <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 12px;">📊 Bảng Đặc Quyền &amp; Sự Khác Biệt Giữa Các Hạng Thẻ</h4>
    <div style="overflow-x: auto; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
            <th style="padding: 10px;">Quyền Lợi</th>
            <th style="padding: 10px; color: #10b981;">🟢 Standard</th>
            <th style="padding: 10px; color: var(--gold);">⭐ VIP Gold (200đ)</th>
            <th style="padding: 10px; color: #c084fc;">👑 Platinum (500đ)</th>
          </tr>
        </thead>
        <tbody style="color: #d1d5db;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px; font-weight: 700; color: #fff;">Giảm giá vé</td>
            <td style="padding: 10px;">Giá niêm yết (0%)</td>
            <td style="padding: 10px; color: var(--gold); font-weight: 750;">Giảm 5% toàn bộ vé</td>
            <td style="padding: 10px; color: #c084fc; font-weight: 800;">Giảm 10% TOÀN BỘ đơn</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px; font-weight: 700; color: #fff;">Tích lũy điểm</td>
            <td style="padding: 10px;">5% giá trị đơn</td>
            <td style="padding: 10px; font-weight: 750; color: var(--gold);">7% giá trị đơn</td>
            <td style="padding: 10px; font-weight: 800; color: #c084fc;">10% giá trị đơn</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px; font-weight: 700; color: #fff;">Combo bắp nước</td>
            <td style="padding: 10px;">Giá gốc</td>
            <td style="padding: 10px;">Giá gốc</td>
            <td style="padding: 10px; font-weight: 750; color: #c084fc;">Giảm thêm 10%</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px; font-weight: 700; color: #fff;">Dịch vụ phòng chờ</td>
            <td style="padding: 10px;">Khu vực chung</td>
            <td style="padding: 10px;">Ưu tiên quầy riêng</td>
            <td style="padding: 10px; font-weight: 750; color: #c084fc;">Phòng chờ VIP Lounge</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Hành động nâng hạng -->
    <div style="background: rgba(255,255,255,0.04); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="font-weight: 750; color: #fff; font-size: 0.92rem;">Nâng Hạng Tài Khoản Bằng Điểm Thưởng</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Sử dụng điểm tích lũy của bạn để kích hoạt ngay đặc quyền VIP.</div>
      </div>
      <div>
        ${tier === "Standard" ? `
          <button class="btn-primary" style="padding: 10px 18px; font-size: 0.85rem;" ${points < 200 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="handleUpgradeTier('VIP Gold')">
            🌟 Nâng Hạng VIP Gold (200 điểm)
          </button>
        ` : (tier === "VIP Gold" ? `
          <button class="btn-primary" style="padding: 10px 18px; font-size: 0.85rem; background: #c084fc; border-color: #a855f7;" ${points < 500 ? 'disabled style="opacity: 0.5; cursor: not-allowed; background: #555;"' : ''} onclick="handleUpgradeTier('Platinum')">
            👑 Nâng Hạng Platinum (500 điểm)
          </button>
        ` : `
          <span style="color: #c084fc; font-weight: 800; font-size: 0.9rem;">👑 Bạn đang sở hữu đặc quyền Platinum cao nhất!</span>
        `)}
      </div>
    </div>
  `;

  if (modal) modal.classList.add("open");
}

function handleUpgradeTier(targetTier) {
  const user = CinemaStorage.getCurrentUser();
  if (!user) return;

  if (!confirm(`Bạn có chắc chắn muốn nâng hạng tài khoản lên ${targetTier}?`)) {
    return;
  }

  try {
    CinemaStorage.upgradeUserTier(user.id, targetTier);
    showToast(`Chúc mừng! Tài khoản của bạn đã được nâng cấp lên ${targetTier}!`, "success");
    updateUserAuthHeader();
    openUserProfileModal();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ==========================================
// 10. E-TICKET POPUP (XEM VÉ ĐIỆN TỬ VÀ MÃ QR)
// ==========================================
function openETicketModal(ticketId) {
  const tickets = CinemaStorage.getSoldTickets();
  const ticket = tickets.find(t => t.ticketId === ticketId);
  if (!ticket) {
    showToast("Không tìm thấy thông tin vé điện tử.", "error");
    return;
  }

  const modal = document.getElementById("eTicketDetailModal");
  const content = document.getElementById("eTicketDetailContent");
  if (!content) return;

  const isCancelled = ticket.status === "CANCELLED";
  const seatCodes = (ticket.seats || []).map(s => s.code || s).join(", ");
  const comboSummary = (ticket.combos && ticket.combos.length > 0)
    ? ticket.combos.map(c => `${c.quantity}x ${c.name} (${(c.price * c.quantity).toLocaleString()}đ)`).join("<br>")
    : "Không có";

  content.innerHTML = `
    <div style="border: 2px dashed ${isCancelled ? '#ef4444' : 'var(--primary-red)'}; border-radius: var(--radius-md); padding: 24px; background: #12141e; position: relative;">
      ${isCancelled ? `
        <div style="position: absolute; top: 20px; right: 20px; transform: rotate(12deg); border: 3px solid #ef4444; color: #ef4444; font-weight: 900; font-size: 1.2rem; padding: 4px 14px; border-radius: 6px;">
          ĐÃ HỦY VÉ
        </div>
      ` : ''}

      <div style="text-align: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 18px;">
        <span style="font-size: 1.35rem; font-weight: 900; color: var(--primary-red); letter-spacing: 1.5px;">UTC2 RED CINEMA</span>
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">VÉ XEM PHIM ĐIỆN TỬ (E-TICKET)</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Mã vé:</span>
          <span style="font-weight: 800; font-family: monospace; color: var(--gold);">${ticket.ticketId}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Phim:</span>
          <span style="font-weight: 800; color: #fff;">${ticket.movieTitle}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Cụm rạp:</span>
          <span style="font-weight: 700; color: #fff;">${ticket.cinemaName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Phòng chiếu:</span>
          <span style="font-weight: 700; color: #fff;">${ticket.roomName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Suất chiếu:</span>
          <span style="font-weight: 800; color: var(--gold);">${ticket.startTime} - Ngày ${ticket.date}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Ghế ngồi:</span>
          <span style="font-weight: 800; color: #fff;">${seatCodes}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
          <span style="color: var(--text-muted);">Combo Bắp Nước:</span>
          <span style="font-weight: 600; text-align: right; color: #d1d5db;">${comboSummary}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
          <span style="color: var(--text-muted);">Tổng thanh toán:</span>
          <span style="font-size: 1.25rem; font-weight: 900; color: var(--primary-red);">${(ticket.totalAmount || 0).toLocaleString()} VNĐ</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Khách hàng:</span>
          <span style="color: #fff;">${ticket.customerName || "Khách Vãng Lai"} (${ticket.customerPhone || "N/A"})</span>
        </div>
      </div>

      <!-- Mô phỏng mã QR check-in vào rạp -->
      <div style="margin-top: 20px; padding: 16px; background: #fff; border-radius: 8px; text-align: center; color: #000;">
        <div style="font-family: monospace; font-size: 0.95rem; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px;">
          * ${ticket.ticketId} *
        </div>
        <div style="height: 48px; background: repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 6px); margin: 6px 0;"></div>
        <div style="font-size: 0.72rem; color: #4b5563;">Xuất trình mã này tại quầy vé hoặc cổng vào phòng chiếu</div>
      </div>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; gap: 12px;">
        <button class="btn-secondary" style="flex: 1; justify-content: center;" onclick="window.print()">
          🖨️ In Vé
        </button>
        <button class="btn-primary" style="flex: 1; justify-content: center;" onclick="closeModal('eTicketDetailModal')">
          Đóng
        </button>
      </div>
    </div>
  `;

  if (modal) modal.classList.add("open");
}

// ==========================================
// 11. HELPER MODALS & TOAST NOTIFICATION
// ==========================================
function initModals() {
  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.onclick = () => {
      if (btn.closest(".modal-backdrop")?.id === "authModal") AppState.pendingBooking = null;
      btn.closest(".modal-backdrop").classList.remove("open");
    };
  });
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (modalId === "authModal") AppState.pendingBooking = null;
  if (modalId === "bookingModal") {
    clearHoldCountdownTimer();
    if (AppState.booking && AppState.booking.showtime && AppState.booking.selectedSeats?.length > 0) {
      try {
        CinemaStorage.releaseSeats(
          AppState.booking.showtime.id,
          AppState.booking.selectedSeats.map(s => s.code),
          AppState.booking.userId
        );
      } catch (e) {}
    }
    if (AppState.booking) {
      AppState.booking.selectedSeats = [];
    }
  }
  if (m) m.classList.remove("open");
}

const _recentAppToasts = new Map();
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  // Chống toast spam thông báo trùng lặp trong 3s (Debounce)
  const key = `${type}_${message}`;
  const now = Date.now();
  if (_recentAppToasts.has(key) && (now - _recentAppToasts.get(key) < 3000)) {
    return;
  }
  _recentAppToasts.set(key, now);

  // Giới hạn tối đa 3 toast hiển thị cùng lúc để tránh che khuất giao diện
  while (container.children.length >= 3) {
    container.firstElementChild.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
    <span style="flex: 1;">${message}</span>
    <span style="cursor: pointer; opacity: 0.7; margin-left: 8px; font-size: 0.8rem;" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastSlideIn 0.3s ease reverse";
    setTimeout(() => {
      toast.remove();
      _recentAppToasts.delete(key);
    }, 280);
  }, 4000);
}
