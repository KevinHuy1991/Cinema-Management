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
    // Suất chiếu đa dạng 4 ngày, biến thiên và phi xung đột (0 conflict)
  showtimes: (function() {
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

    const movieDurations = {
      P01: 166, P02: 94, P03: 134, P04: 115, P05: 131, P06: 128, P07: 100, P08: 139, P09: 117
    };

    function calcEnd(start, dur) {
      const [h, m] = start.split(':').map(Number);
      const total = h * 60 + m + dur;
      const eh = Math.floor(total / 60) % 24;
      const em = total % 60;
      return String(eh).padStart(2, '0') + ':' + String(em).padStart(2, '0');
    }

    const list = [];
    let scCounter = 1;
    const usedIds = new Set();

    schedulesByDay.forEach((daySchedule, dayOffset) => {
      const dateStr = getTodayDateString(dayOffset);
      daySchedule.forEach(([cinemaId, roomId, slots]) => {
        slots.forEach(slot => {
          const [movieId, startTime, fixedId] = slot;
          const dur = movieDurations[movieId] || 120;
          const endTime = calcEnd(startTime, dur);

          let id = fixedId;
          if (!id) {
            while (scCounter === 1 || scCounter === 4 || usedIds.has('SC' + String(scCounter).padStart(2, '0'))) {
              scCounter++;
            }
            id = 'SC' + String(scCounter).padStart(2, '0');
            scCounter++;
          }
          usedIds.add(id);

          list.push({
            id,
            movieId,
            cinemaId,
            roomId,
            date: dateStr,
            startTime,
            endTime,
            seats: null
          });
        });
      });
    });

    return list;
  })(),

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
function isShowtimePast(stDate, startTime) {
  const todayStr = getTodayDateString(0);
  if (stDate < todayStr) return true;
  if (stDate > todayStr) return false;
  const now = new Date();
  const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  return startTime <= currentHHMM;
}

function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { INITIAL_DATA, getTodayDateString, isShowtimePast };
}

