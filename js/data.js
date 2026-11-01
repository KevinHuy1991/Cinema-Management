/**
 * Cinema Management System - Initial Master Data
 * Hệ thống Quản lý Rạp Chiếu Phim - Dữ liệu Khởi tạo
 */

const INITIAL_DATA = {
  // Danh mục Phim (Bao gồm dữ liệu từ ds_phim.csv và bổ sung thêm các bom tấn rạp)
  movies: [
      {
          "id": "P01",
          "title": "Dune: Hành Tinh Cát - Phần Hai",
          "originalTitle": "Dune: Part Two",
          "genre": "Khoa Học Viễn Tưởng, Hành Động, Phiêu Lưu",
          "duration": 166,
          "ageRating": "16+",
          "ageDescription": "Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (T16)",
          "country": "Mỹ",
          "basePrice": 100000,
          "director": "Denis Villeneuve",
          "cast": "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Austin Butler",
          "releaseDate": "2024-03-01",
          "rating": 8.9,
          "status": "now_showing",
          "poster": "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
          "posterCustom": "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
          "backdrop": "https://tse1.mm.bing.net/th/id/OIP.GY8zDUnCb3votz8EUIT2WAHaEG?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "trailer": "https://www.youtube.com/embed/Way9Dexny3w",
          "synopsis": "Paul Atreides liên minh cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia tộc mình. Đứng trước sự lựa chọn giữa tình yêu của cuộc đời và số phận của cả vũ trụ, anh phải nỗ lực ngăn chặn một tương lai đen tối mà chỉ mình anh có thể nhìn thấy trước."
      },
      {
          "id": "P02",
          "title": "Kung Fu Panda 4",
          "originalTitle": "Kung Fu Panda 4",
          "genre": "Hoạt Hình, Hành Động, Hài Hước",
          "duration": 94,
          "ageRating": "P",
          "ageDescription": "Phim được phép phổ biến rộng rãi cho mọi lứa tuổi",
          "country": "Mỹ",
          "basePrice": 80000,
          "director": "Mike Mitchell",
          "cast": "Jack Black, Awkwafina, Viola Davis, Dustin Hoffman, Bryan Cranston",
          "releaseDate": "2024-03-08",
          "rating": 7.8,
          "status": "now_showing",
          "poster": "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop",
          "posterCustom": "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
          "backdrop": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop",
          "trailer": "https://www.youtube.com/embed/_inKs4eeHiI",
          "synopsis": "Sau ba cuộc phiêu lưu nguy hiểm sinh tử đánh bại những kẻ phản diện hàng đầu thế giới bằng lòng dũng cảm vô song và kỹ năng võ thuật điêu luyện, Po - Thần Long Đại Hiệp - được định mệnh kêu gọi nghỉ ngơi để trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên."
      },
      {
          "id": "P03",
          "title": "Exhuma: Quật Mộ Trùng Ma",
          "originalTitle": "Exhuma",
          "genre": "Kinh Dị, Huyền Bí, Giật Gân",
          "duration": 134,
          "ageRating": "18+",
          "ageDescription": "Phim cấm phổ biến đến khán giả dưới 18 tuổi (T18)",
          "country": "Hàn Quốc",
          "basePrice": 90000,
          "director": "Jang Jae-hyun",
          "cast": "Choi Min-sik, Kim Go-eun, Yoo Hae-jin, Lee Do-hyun",
          "releaseDate": "2024-03-15",
          "rating": 8.5,
          "status": "now_showing",
          "poster": "https://image.tmdb.org/t/p/w1280/6dasJ58GGFcC62H9KuukAryltUp.jpg",
          "posterCustom": "https://image.tmdb.org/t/p/w1280/6dasJ58GGFcC62H9KuukAryltUp.jpg",
          "backdrop": "https://static2.vieon.vn/vieplay-image/thumbnail_v4/2025/05/23/p25x87gc_1920x1080-quatmotrungma.png",
          "trailer": "https://www.youtube.com/embed/n4d8rN-5cEw",
          "synopsis": "Quá trình khai quật một ngôi mộ bí ẩn chôn cất sai phong thủy đã giải thoát một thực thể tà ác ma quỷ khủng khiếp ngàn năm bên dưới lòng đất, đe dọa sinh mạng của hai pháp sư trẻ tài hoa, một thầy phong thủy kỳ cựu và người quản lý nhà tang lễ."
      },
      {
          "id": "P04",
          "title": "Godzilla x Kong: Đế Chế Mới",
          "originalTitle": "Godzilla x Kong: The New Empire",
          "genre": "Hành Động, Viễn Tưởng, Phiêu Lưu",
          "duration": 115,
          "ageRating": "13+",
          "ageDescription": "Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (T13)",
          "country": "Mỹ",
          "basePrice": 95000,
          "director": "Adam Wingard",
          "cast": "Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle",
          "releaseDate": "2024-03-29",
          "rating": 8.2,
          "status": "now_showing",
          "poster": "https://tse1.explicit.bing.net/th/id/OIP.RTVRivHvrhMlaBX8ZOIPpQHaJQ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "posterCustom": "https://tse1.explicit.bing.net/th/id/OIP.RTVRivHvrhMlaBX8ZOIPpQHaJQ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "backdrop": "https://tse3.mm.bing.net/th/id/OIP.X1douStHqvzCl1AlbUyS7QHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "trailer": "https://www.youtube.com/embed/qqrpMRDuPfc",
          "synopsis": "Trận chiến bùng nổ giữa hai quái thú hùng mạnh nhất lịch sử điện ảnh. Một mối đe dọa khổng lồ chưa từng được biết đến đang ẩn náu sâu bên trong Trái Đất Rỗng, thách thức sự tồn tại của cả chủng loài Titan và loài người."
      },
      {
          "id": "P05",
          "title": "Mai",
          "originalTitle": "Mai",
          "genre": "Tâm Lý, Tình Cảm, Lãng Mạn",
          "duration": 131,
          "ageRating": "18+",
          "ageDescription": "Phim cấm phổ biến đến người xem dưới 18 tuổi (T18)",
          "country": "Việt Nam",
          "basePrice": 85000,
          "director": "Trấn Thành",
          "cast": "Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào, Uyển Ân",
          "releaseDate": "2024-02-10",
          "rating": 8.6,
          "status": "now_showing",
          "poster": "https://tintuc-divineshop.cdn.vccloud.vn/wp-content/uploads/2023/11/mai-phim-tet-2024-cua-tran-thanh-tung-ra-nhung-hinh-anh-dau-tien_65657a5305883.jpeg",
          "posterCustom": "https://tintuc-divineshop.cdn.vccloud.vn/wp-content/uploads/2023/11/mai-phim-tet-2024-cua-tran-thanh-tung-ra-nhung-hinh-anh-dau-tien_65657a5305883.jpeg",
          "backdrop": "https://assets.glxplay.io/web/images/review-phim-mai.original.jpg",
          "trailer": "https://www.youtube.com/embed/t06X7Z_Xb6c",
          "synopsis": "Bộ phim tâm lý tình cảm xoay quanh cuộc đời của Mai - một nhân viên mát-xa trị liệu có số phận cay đắng và nhiều vết thương lòng - cùng mối tình nồng nhiệt nhưng đầy sóng gió định kiến xã hội với chàng nhạc công hào hoa kém tuổi Dương."
      },
      {
          "id": "P06",
          "title": "Deadpool & Wolverine",
          "originalTitle": "Deadpool & Wolverine",
          "genre": "Hành Động, Siêu Anh Hùng, Hài Hước",
          "duration": 128,
          "ageRating": "18+",
          "ageDescription": "Phim hành động bạo lực cấm người dưới 18 tuổi (T18)",
          "country": "Mỹ",
          "basePrice": 105000,
          "director": "Shawn Levy",
          "cast": "Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen",
          "releaseDate": "2024-07-26",
          "rating": 9.1,
          "status": "now_showing",
          "poster": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop",
          "posterCustom": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
          "backdrop": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop",
          "trailer": "https://www.youtube.com/embed/73_1biulkYk",
          "synopsis": "Cơ quan Quản lý Phương sai Thời gian (TVA) lôi kéo gã bựa Wade Wilson vào một nhiệm vụ đa vũ trụ tối mật. Để cứu lấy dòng thời gian của thực tại mình, Deadpool buộc phải tìm kiếm và bắt tay cùng một Wolverine đang chán đời và đầy giận dữ."
      },
      {
          "id": "P07",
          "title": "Lật Mặt 7: Một Điều Ước",
          "originalTitle": "Face Off 7: One Wish",
          "genre": "Gia Đình, Tình Cảm, Tâm Lý",
          "duration": 138,
          "ageRating": "13+",
          "ageDescription": "Phim gia đình dành cho khán giả từ đủ 13 tuổi trở lên (T13)",
          "country": "Việt Nam",
          "basePrice": 85000,
          "director": "Lý Hải",
          "cast": "Thanh Hiền, Trương Minh Cường, Đinh Y Nhung, Quách Ngọc Tuyên, Trâm Anh",
          "releaseDate": "2024-04-26",
          "rating": 8.8,
          "status": "coming_soon",
          "poster": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
          "posterCustom": "https://image.tmdb.org/t/p/w500/t6DDyJm4c0f3rL3hFhG3u5k3P6H.jpg",
          "backdrop": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=1200&auto=format&fit=crop",
          "trailer": "https://www.youtube.com/embed/7V6Vd7L0cKk",
          "synopsis": "Câu chuyện gia đình xúc động lấy đi nước mắt của hàng triệu khán giả về bà Hai 73 tuổi sống tại làng hoa quả Lạc Dương cùng 5 người con đã trưởng thành và lập nghiệp tứ phương. Biến cố xảy ra khi mẹ bị tai nạn và câu hỏi 'Ai sẽ là người chăm sóc mẹ?' đặt ra bài toán trách nhiệm."
      },
      {
          "id": "P08",
          "title": "Kẻ Trộm Mặt Trăng 4",
          "originalTitle": "Despicable Me 4",
          "genre": "Hoạt Hình, Phiêu Lưu, Hài Hước",
          "duration": 95,
          "ageRating": "P",
          "ageDescription": "Phim hoạt hình phù hợp cho mọi lứa tuổi gia đình (P)",
          "country": "Mỹ",
          "basePrice": 80000,
          "director": "Chris Renaud",
          "cast": "Steve Carell, Kristen Wiig, Will Ferrell, Sofia Vergara",
          "releaseDate": "2024-07-03",
          "rating": 7.9,
          "status": "coming_soon",
          "poster": "https://tse4.mm.bing.net/th/id/OIP.k29SEAq55sXDFadFVfnVGwHaLH?r=0&w=736&h=1104&rs=1&pid=ImgDetMain&o=7&rm=3",
          "posterCustom": "https://tse4.mm.bing.net/th/id/OIP.k29SEAq55sXDFadFVfnVGwHaLH?r=0&w=736&h=1104&rs=1&pid=ImgDetMain&o=7&rm=3",
          "backdrop": "https://tse2.mm.bing.net/th/id/OIP.6zhKO77Mut-p3hNYB8PtmQHaFG?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "trailer": "https://www.youtube.com/embed/qQlr9-rF32A",
          "synopsis": "Gia đình Gru chào đón thành viên mới tinh nghịch Gru Jr. Cuộc sống bình yên bị đe dọa khi kẻ thù truyền kiếp Maxime Le Mal vượt ngục cùng bạn gái Valentina báo thù, buộc cả gia đình và các chú Minions siêu năng lực phải lẩn trốn dưới danh phận bí mật."
      },
      {
          "id": "P09",
          "title": "Mắt Biếc",
          "originalTitle": "Mắt Biếc",
          "genre": "Tình cảm",
          "duration": 120,
          "ageRating": "13+",
          "ageDescription": "Phim phổ biến 13+",
          "country": "Việt Nam",
          "basePrice": 90000,
          "director": "Victor Vũ",
          "cast": "Trần Phong, Khánh Vân, Thảo Tâm",
          "releaseDate": "2026-10-31",
          "rating": 8.5,
          "status": "now_showing",
          "poster": "https://tse1.mm.bing.net/th/id/OIP.KhFIkFBQPAPsiOYDaVcXigHaKk?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "posterCustom": "https://tse1.mm.bing.net/th/id/OIP.KhFIkFBQPAPsiOYDaVcXigHaKk?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
          "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
          "trailer": "https://www.youtube.com/embed/Way9Dexny3w",
          "synopsis": "Chuyện tình đầy day dứt và tiếc nuối của 2 đứa trẻ từ thôn quê ,Hà Lan và Ngạn"
      }
  ],

  // Cụm rạp (Bao gồm dữ liệu từ ds_rap.csv và mở rộng thêm các cụm rạp tiêu biểu)
  cinemas: [
    {
      id: "R01",
      name: "Cinema Thủ Đức",
      address: "21 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh",
      phone: "1900 6017",
      rooms: [
        { id: "P2D-01", name: "Phòng 01 (2D Standard)", type: "2D", rows: 8, cols: 10, surcharge: 0 },
        { id: "P3D-02", name: "Phòng 02 (3D RealD)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: "PIMAX-03", name: "Phòng 03 (IMAX Laser)", type: "IMAX", rows: 12, cols: 16, surcharge: 70000 },
        { id: "P2D-04", name: "Phòng 04 (2D Standard)", type: "2D", rows: 8, cols: 10, surcharge: 0 },
        { id: "P3D-05", name: "Phòng 05 (3D RealD)", type: "3D", rows: 10, cols: 12, surcharge: 30000 }
      ]
    },
    {
      id: "R02",
      name: "Cinema Landmark 81",
      address: "Tầng B1, Vincom Center Landmark 81, 720A Điện Biên Phủ, Bình Thạnh, TP. HCM",
      phone: "1900 6018",
      rooms: [
        { id: "L81-IMAX", name: "Phòng Laser IMAX Grande", type: "IMAX", rows: 12, cols: 16, surcharge: 70000 },
        { id: "L81-3D", name: "Phòng 02 (3D Gold Class)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: "L81-IMAX-03", name: "Phòng 03 (IMAX Laser)", type: "IMAX", rows: 12, cols: 16, surcharge: 70000 },
        { id: "L81-3D-04", name: "Phòng 04 (3D Gold Class)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: "L81-2D-05", name: "Phòng 05 (2D Standard)", type: "2D", rows: 8, cols: 10, surcharge: 0 }
      ]
    },
    {
      id: "R03",
      name: "Cinema Vạn Hạnh Mall",
      address: "Tầng 6, Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Phường 12, Quận 10, TP. HCM",
      phone: "1900 6019",
      rooms: [
        { id: "VHM-2D", name: "Phòng 01 (2D Atmos)", type: "2D", rows: 8, cols: 10, surcharge: 0 },
        { id: "VHM-3D", name: "Phòng 02 (3D Digital)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: "VHM-3D-03", name: "Phòng 03 (3D Digital)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: "VHM-3D-04", name: "Phòng 04 (3D Digital)", type: "3D", rows: 10, cols: 12, surcharge: 30000 },
        { id: "VHM-2D-05", name: "Phòng 05 (2D Standard)", type: "2D", rows: 8, cols: 10, surcharge: 0 }
      ]
    }
  ],

  // Bảng giá phụ thu phòng và ghế (Khớp hoàn toàn mô hình OOP C++)
  pricing: {
    roomSurcharges: {
      "2D": 0,
      "3D": 30000,
      "IMAX": 70000
    },
    seatSurcharges: {
      "THUONG": 0,       // Ký hiệu [T]
      "VIP": 20000,      // Ký hiệu [V]
      "SWEETBOX": 0      // Ghế đôi áp dụng giá trọn gói, không cộng phụ thu
    },
    sweetboxPrice: 180000
  },

  // Danh mục Combo Bắp Nước (Khởi tạo từ bang_gia.csv và menu rạp CGV/Cinestar)
  combos: [
    {
      id: "CB01",
      name: "Combo Bắp Nước Đơn",
      price: 75000,
      description: "1 Bắp ngọt 60oz giòn rụm + 1 Nước ngọt có ga 32oz mát lạnh",
      category: "combo",
      image: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "CB02",
      name: "Combo Bắp Nước Đôi",
      price: 105000,
      description: "1 Bắp ngọt 60oz bơ thơm + 2 Nước ngọt có ga 32oz sảng khoái",
      category: "combo",
      image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "CB03",
      name: "Combo Sweetbox VIP Couple",
      price: 139000,
      description: "2 Bắp phô mai/caramel hảo hạng + 2 Nước ngọt lớn + 1 Bánh snack phô mai",
      category: "combo",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "CB04",
      name: "Combo Family Party",
      price: 189000,
      description: "2 Bắp khổng lồ vị tự chọn + 4 Nước ngọt + 2 Xúc xích nướng sốt cay",
      category: "combo",
      image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "SP01",
      name: "Bắp rang bơ",
      price: 45000,
      description: "Bắp rang nóng giòn vị bơ truyền thống, cỡ vừa.",
      category: "single",
      image: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "SP02",
      name: "Nước ngọt",
      price: 30000,
      description: "Nước ngọt có ga mát lạnh, cỡ vừa.",
      category: "single",
      image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "SP03",
      name: "Xúc xích nướng",
      price: 35000,
      description: "Xúc xích nướng nóng ăn kèm tương cà và mù tạt.",
      category: "single",
      image: "https://images.unsplash.com/photo-1612392062631-94dd858cba88?auto=format&fit=crop&w=800&q=80"
    }
  ],

  // Danh sách Suất Chiếu Ban Đầu (Showtimes)
  // Quy ước format ngày: YYYY-MM-DD, giờ HH:mm
  // Bổ sung đầy đủ suất chiếu cho cả 3 cụm rạp
  showtimes: [
    // ============================
    // CỤM RẠP THỦ ĐỨC (R01)
    // ============================
    // Dune 2 - IMAX
    { id: "SC01", movieId: "P01", cinemaId: "R01", roomId: "PIMAX-03", date: getTodayDateString(0), startTime: "10:00", endTime: "13:01", seats: null },
    { id: "SC02", movieId: "P01", cinemaId: "R01", roomId: "PIMAX-03", date: getTodayDateString(0), startTime: "14:00", endTime: "17:01", seats: null },
    { id: "SC03", movieId: "P01", cinemaId: "R01", roomId: "PIMAX-03", date: getTodayDateString(0), startTime: "19:00", endTime: "22:01", seats: null },
    // Kung Fu Panda 4 - 2D
    { id: "SC04", movieId: "P02", cinemaId: "R01", roomId: "P2D-01", date: getTodayDateString(0), startTime: "09:30", endTime: "11:19", seats: null },
    { id: "SC05", movieId: "P02", cinemaId: "R01", roomId: "P2D-01", date: getTodayDateString(0), startTime: "14:30", endTime: "16:19", seats: null },
    { id: "SC40", movieId: "P02", cinemaId: "R01", roomId: "P2D-01", date: getTodayDateString(0), startTime: "18:00", endTime: "19:49", seats: null },
    // Exhuma - 3D
    { id: "SC06", movieId: "P03", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(0), startTime: "10:00", endTime: "12:29", seats: null },
    { id: "SC07", movieId: "P03", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(0), startTime: "17:30", endTime: "20:04", seats: null },
    { id: "SC41", movieId: "P03", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(0), startTime: "20:30", endTime: "23:04", seats: null },
    // Deadpool & Wolverine - 3D
    { id: "SC10", movieId: "P06", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(0), startTime: "13:30", endTime: "15:53", seats: null },
    // Godzilla x Kong - IMAX (ngày mai)
    { id: "SC42", movieId: "P04", cinemaId: "R01", roomId: "PIMAX-03", date: getTodayDateString(1), startTime: "10:00", endTime: "12:10", seats: null },
    { id: "SC43", movieId: "P04", cinemaId: "R01", roomId: "PIMAX-03", date: getTodayDateString(1), startTime: "14:30", endTime: "16:40", seats: null },
    // Dune 2 - IMAX (ngày mai)
    { id: "SC11", movieId: "P01", cinemaId: "R01", roomId: "PIMAX-03", date: getTodayDateString(1), startTime: "18:30", endTime: "21:31", seats: null },
    // Deadpool & Wolverine - 3D (ngày mai)
    { id: "SC12", movieId: "P06", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(1), startTime: "20:00", endTime: "22:23", seats: null },
    // Mai - 2D (ngày mai - R01)
    { id: "SC44", movieId: "P05", cinemaId: "R01", roomId: "P2D-01", date: getTodayDateString(1), startTime: "09:00", endTime: "11:26", seats: null },
    { id: "SC45", movieId: "P05", cinemaId: "R01", roomId: "P2D-01", date: getTodayDateString(1), startTime: "14:00", endTime: "16:26", seats: null },
    // Kung Fu Panda 4 - 2D (ngày mai - R01)
    { id: "SC46", movieId: "P02", cinemaId: "R01", roomId: "P2D-01", date: getTodayDateString(1), startTime: "17:00", endTime: "18:49", seats: null },
    // Exhuma - 3D (ngày mai - R01)
    { id: "SC47", movieId: "P03", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(1), startTime: "10:00", endTime: "12:29", seats: null },
    { id: "SC48", movieId: "P03", cinemaId: "R01", roomId: "P3D-02", date: getTodayDateString(1), startTime: "14:00", endTime: "16:29", seats: null },

    // ============================
    // CỤM RẠP LANDMARK 81 (R02)
    // ============================
    // Godzilla x Kong - IMAX
    { id: "SC08", movieId: "P04", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(0), startTime: "10:30", endTime: "12:40", seats: null },
    { id: "SC50", movieId: "P04", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(0), startTime: "14:00", endTime: "16:10", seats: null },
    { id: "SC51", movieId: "P04", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(0), startTime: "18:00", endTime: "20:10", seats: null },
    { id: "SC52", movieId: "P04", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(0), startTime: "21:00", endTime: "23:10", seats: null },
    // Dune 2 - 3D Gold Class
    { id: "SC53", movieId: "P01", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(0), startTime: "09:30", endTime: "12:31", seats: null },
    { id: "SC54", movieId: "P01", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(0), startTime: "13:30", endTime: "16:31", seats: null },
    { id: "SC55", movieId: "P01", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(0), startTime: "19:00", endTime: "22:01", seats: null },
    // Deadpool & Wolverine - IMAX (ngày mai - R02)
    { id: "SC56", movieId: "P06", cinemaId: "R02", roomId: "L81-IMAX-03", date: getTodayDateString(0), startTime: "16:30", endTime: "18:53", seats: null },
    // Exhuma - 3D Gold Class
    { id: "SC57", movieId: "P03", cinemaId: "R02", roomId: "L81-3D-04", date: getTodayDateString(0), startTime: "17:00", endTime: "19:29", seats: null },
    // Kung Fu Panda 4 - 3D Gold Class
    { id: "SC58", movieId: "P02", cinemaId: "R02", roomId: "L81-3D-04", date: getTodayDateString(0), startTime: "10:00", endTime: "11:49", seats: null },
    // Ngày mai - R02
    { id: "SC59", movieId: "P01", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(1), startTime: "10:00", endTime: "13:01", seats: null },
    { id: "SC60", movieId: "P01", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(1), startTime: "14:30", endTime: "17:31", seats: null },
    { id: "SC61", movieId: "P04", cinemaId: "R02", roomId: "L81-IMAX", date: getTodayDateString(1), startTime: "19:00", endTime: "21:10", seats: null },
    { id: "SC62", movieId: "P06", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(1), startTime: "10:00", endTime: "12:23", seats: null },
    { id: "SC63", movieId: "P06", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(1), startTime: "14:00", endTime: "16:23", seats: null },
    { id: "SC64", movieId: "P03", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(1), startTime: "17:30", endTime: "19:59", seats: null },
    { id: "SC65", movieId: "P05", cinemaId: "R02", roomId: "L81-3D", date: getTodayDateString(1), startTime: "20:30", endTime: "22:56", seats: null },

    // ============================
    // CỤM RẠP VẠN HẠNH MALL (R03)
    // ============================
    // Mai - 2D
    { id: "SC09", movieId: "P05", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(0), startTime: "09:00", endTime: "11:26", seats: null },
    { id: "SC70", movieId: "P05", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(0), startTime: "14:00", endTime: "16:26", seats: null },
    { id: "SC71", movieId: "P05", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(0), startTime: "19:30", endTime: "21:56", seats: null },
    // Kung Fu Panda 4 - 2D
    { id: "SC72", movieId: "P02", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(0), startTime: "11:30", endTime: "13:19", seats: null },
    { id: "SC73", movieId: "P02", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(0), startTime: "16:30", endTime: "18:19", seats: null },
    // Deadpool & Wolverine - 3D
    { id: "SC74", movieId: "P06", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(0), startTime: "10:00", endTime: "12:23", seats: null },
    { id: "SC75", movieId: "P06", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(0), startTime: "14:30", endTime: "16:53", seats: null },
    { id: "SC76", movieId: "P06", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(0), startTime: "19:00", endTime: "21:23", seats: null },
    // Exhuma - 3D
    { id: "SC77", movieId: "P03", cinemaId: "R03", roomId: "VHM-3D-04", date: getTodayDateString(0), startTime: "13:00", endTime: "15:29", seats: null },
    { id: "SC78", movieId: "P03", cinemaId: "R03", roomId: "VHM-3D-04", date: getTodayDateString(0), startTime: "17:00", endTime: "19:29", seats: null },
    // Dune 2 - 2D
    { id: "SC79", movieId: "P01", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(0), startTime: "22:00", endTime: "01:01", seats: null },
    // Godzilla x Kong - 3D
    { id: "SC80", movieId: "P04", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(0), startTime: "21:30", endTime: "23:40", seats: null },
    // Ngày mai - R03
    { id: "SC81", movieId: "P05", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(1), startTime: "09:30", endTime: "11:56", seats: null },
    { id: "SC82", movieId: "P05", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(1), startTime: "14:00", endTime: "16:26", seats: null },
    { id: "SC83", movieId: "P02", cinemaId: "R03", roomId: "VHM-2D", date: getTodayDateString(1), startTime: "12:00", endTime: "13:49", seats: null },
    { id: "SC84", movieId: "P06", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(1), startTime: "10:00", endTime: "12:23", seats: null },
    { id: "SC85", movieId: "P06", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(1), startTime: "15:00", endTime: "17:23", seats: null },
    { id: "SC86", movieId: "P01", cinemaId: "R03", roomId: "VHM-3D", date: getTodayDateString(1), startTime: "19:00", endTime: "22:01", seats: null },
    { id: "SC87", movieId: "P03", cinemaId: "R03", roomId: "VHM-3D-04", date: getTodayDateString(1), startTime: "13:00", endTime: "15:29", seats: null },
    { id: "SC88", movieId: "P04", cinemaId: "R03", roomId: "VHM-3D-04", date: getTodayDateString(1), startTime: "17:30", endTime: "19:40", seats: null }
  ],

  // Tài khoản User mẫu sẵn để tiện kiểm tra
  sampleUsers: [
    {
      id: "U01",
      fullName: "Nguyễn Nhật Huy",
      email: "khachhang@gmail.com",
      password: "123",
      phone: "0909123456",
      membershipTier: "VIP Gold",
      points: 250
    },
    {
      id: "U02",
      fullName: "Lê Cường Bảo",
      email: "cuongbao@gmail.com",
      password: "123",
      phone: "0912345678",
      membershipTier: "Platinum",
      points: 520
    }
  ]
};

// Hàm tiện ích lấy chuỗi ngày định dạng YYYY-MM-DD
function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { INITIAL_DATA, getTodayDateString };
}

