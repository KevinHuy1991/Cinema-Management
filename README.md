# HỆ THỐNG QUẢN LÝ RẠP CHIẾU PHIM (CINEMA MANAGEMENT SYSTEM)

Dự án Bài tập lớn môn **Lập trình hướng đối tượng (OOP)** xây dựng ứng dụng điều phối, quản lý bán vé, cụm rạp, phòng chiếu và suất chiếu trên nền tảng C++.

---

## 👥 Danh sách thành viên nhóm

| STT | Họ và tên | Mã sinh viên |
|:---:|:---|:---:|
| 1 | Nguyễn Nhật Huy | 6651071028 |
| 2 | Lê Cường Bảo | 6651071005 |
| 3 | Nguyễn Phúc Minh | 6651071048 |
| 4 | Lưu Trọng Nguyên | 6651071043 |
| 5 | Nguyễn Đức Trung | 6351071072 |
---

## 📁 Cấu trúc thư mục dự án

```text
BTL_OOP_Cinema/
├── README.md                      # Thông tin dự án, thành viên, hướng dẫn build/run
├── .gitignore                     # Cấu hình bỏ qua file build (.exe, .o, build/, .vscode/)
│
├── data/                          # Dữ liệu cục bộ của hệ thống
│   ├── ds_phim.csv                # Master Data: Danh sách phim (ID, Tên, Thể loại...)
│   ├── ds_rap.csv                 # Master Data: Danh sách cụm rạp, phòng chiếu
│   ├── bang_gia.csv               # Master Data: Bảng giá vé, giá combo ẩm thực
│   ├── ve_da_ban.dat              # File nhị phân: Lưu trữ object vé đã thanh toán
│   └── trang_thai_ghe.dat         # File nhị phân: Lưu ma trận ghế đang pending / đã bán
│
├── include/                       # Khai báo các lớp (.h)
│   ├── Phim.h                     # Quản lý thông tin phim
│   ├── RapChieu.h                 # Quản lý cụm rạp chiếu
│   ├── PhongChieu.h               # Lớp trừu tượng Phòng chiếu (Phong2D, Phong3D, PhongIMAX)
│   ├── Ghe.h                      # Lớp trừu tượng Ghế (GheThuong, GheVIP, GheDoiSweetbox)
│   ├── SuatChieu.h                # Quản lý suất chiếu (thời gian, phim, ma trận ghế)
│   ├── VeXemPhim.h                # Component gốc cho Decorator Pattern của Vé
│   ├── VeDecorator.h              # Decorator cơ sở gắn thêm dịch vụ vào vé
│   ├── ComboBapNuoc.h             # Kế thừa VeDecorator: tính tiền Vé + Bắp Nước
│   ├── SuatChieuFactory.h         # Factory Method: Khởi tạo sơ đồ ghế theo loại phòng
│   ├── CinemaSystemManager.h      # Singleton Pattern: Quản lý điều phối trung tâm
│   ├── TimeUtils.h                # Utils: Nạp chồng toán tử thời gian, countdown giữ ghế
│   └── FileHandler.h              # Utils: Đọc/ghi File CSV và Serialize/Deserialize nhị phân
│
├── src/                           # Triển khai mã nguồn (.cpp)
│   ├── Phim.cpp
│   ├── RapChieu.cpp
│   ├── PhongChieu.cpp
│   ├── Ghe.cpp
│   ├── SuatChieu.cpp
│   ├── VeDecorator.cpp
│   ├── ComboBapNuoc.cpp
│   ├── SuatChieuFactory.cpp
│   ├── CinemaSystemManager.cpp
│   ├── TimeUtils.cpp
│   └── FileHandler.cpp
│
└── main.cpp                       # Điểm chạy chương trình (khởi tạo Manager, Menu Console)
```

---

## 💡 Thiết kế kiến trúc & Design Patterns

1. **Decorator Pattern**:
   - `VeXemPhim` đóng vai trò là Component cơ sở.
   - `VeDecorator` và các lớp mở rộng như `ComboBapNuoc` cho phép đính kèm linh hoạt các dịch vụ (bắp, nước, ưu đãi) vào vé mà không làm thay đổi cấu trúc cốt lõi.

2. **Factory Method Pattern**:
   - `SuatChieuFactory` tạo và bố trí sơ đồ ma trận ghế động tương ứng với từng loại phòng chiếu (`Phong2D`, `Phong3D`, `PhongIMAX`).

3. **Singleton Pattern**:
   - `CinemaSystemManager` quản lý duy nhất toàn bộ luồng nghiệp vụ: tải/lưu dữ liệu, tìm kiếm suất chiếu, xử lý giữ ghế tạm thời, thanh toán và thống kê doanh thu.

4. **Kế thừa & Đa hình (Inheritance & Polymorphism)**:
   - Hệ thống phòng chiếu kế thừa từ `PhongChieu`.
   - Hệ thống ghế kế thừa từ `Ghe` với đơn giá và hệ số phụ thu tương ứng từng loại ghế (`GheThuong`, `GheVIP`, `GheDoiSweetbox`).

5. **Lưu trữ dữ liệu**:
   - Dữ liệu cấu hình, danh mục (Master data) lưu dưới dạng file định dạng `.csv`.
   - Dữ liệu giao dịch, trạng thái đặt chỗ thời gian thực được serialize/deserialize nhị phân qua `.dat`.

---

## 🛠️ Hướng dẫn biên dịch và chạy chương trình

### Cách 1: Sử dụng g++ (MinGW trên Windows / GCC trên Linux)

```bash
# Biên dịch tất cả các file nguồn
g++ -std=c++17 -Iinclude main.cpp src/*.cpp -o cinema_app

# Chạy chương trình trên Windows
.\cinema_app.exe

# Chạy chương trình trên Linux / macOS
./cinema_app
```

### Cách 2: Sử dụng CMake (nếu có cấu hình CMakeLists.txt)

```bash
mkdir build
cd build
cmake ..
cmake --build .
./cinema_app
```