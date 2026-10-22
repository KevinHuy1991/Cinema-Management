# HỆ THỐNG QUẢN LÝ RẠP CHIẾU PHIM (CINEMA MANAGEMENT SYSTEM)

Dự án Bài tập lớn môn **Lập trình hướng đối tượng (OOP)** xây dựng ứng dụng điều phối, quản lý bán vé, cụm rạp, phòng chiếu và suất chiếu trên nền tảng C++ (chuẩn C++17).

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
Cinema-Management/
├── README.md                      # Tài liệu tổng quan dự án, hướng dẫn build & run
├── .gitignore                     # Cấu hình bỏ qua file build (.exe, .o, build/, .vscode/)
│
├── data/                          # Dữ liệu cục bộ của hệ thống
│   ├── ds_phim.csv                # Master Data: Danh sách phim (Mã, Tên, Thể loại, Thời lượng, Độ tuổi, Giá gốc)
│   ├── ds_rap.csv                 # Master Data: Danh sách cụm rạp và địa chỉ
│   ├── bang_gia.csv               # Master Data: Bảng giá các gói Combo bắp nước
│   ├── ve_da_ban.dat              # File nhị phân: Lưu trữ hồ sơ vé đã thanh toán
│   ├── trang_thai_ghe.dat         # File nhị phân: Lưu trạng thái ghế thời gian thực (đang giữ / đã bán)
│   └── report_doanh_thu.txt       # Báo cáo doanh thu xuất ra file văn bản
│
├── include/                       # Khai báo các lớp header (.h)
│   ├── Phim.h                     # Quản lý thông tin phim (thời lượng, giá cơ bản, trạng thái)
│   ├── PhongChieu.h               # Lớp trừu tượng PhongChieu (Phong2D, Phong3D, PhongIMAX)
│   ├── Ghe.h                      # Lớp trừu tượng Ghe (GheThuong, GheVIP, GheDoiSweetbox)
│   ├── RapChieu.h                 # Quản lý cụm rạp và danh sách phòng chiếu
│   ├── SuatChieu.h                # Quản lý suất chiếu, ma trận ghế và luồng tự động hủy ghế quá hạn
│   ├── SuatChieuFactory.h         # Factory Method: Khởi tạo sơ đồ ghế theo loại phòng
│   ├── VeXemPhim.h                # Component gốc và VeCoBan cho Decorator Pattern
│   ├── VeDecorator.h              # Decorator cơ sở gắn thêm dịch vụ vào vé
│   ├── ComboBapNuoc.h             # Kế thừa VeDecorator: tính phụ thu bắp nước vào hóa đơn vé
│   ├── CinemaSystemManager.h      # Singleton Pattern: Điều phối nghiệp vụ toàn hệ thống
│   ├── TimeUtils.h                # Quản lý thời gian, toán tử so sánh, kiểm tra trùng lịch chiếu
│   └── FileHandler.h              # Đọc/ghi file CSV và Serialize/Deserialize dữ liệu nhị phân (.dat)
│
├── src/                           # Triển khai mã nguồn (.cpp)
│   ├── Phim.cpp
│   ├── PhongChieu.cpp
│   ├── Ghe.cpp
│   ├── RapChieu.cpp
│   ├── SuatChieu.cpp
│   ├── SuatChieuFactory.cpp
│   ├── VeXemPhim.cpp
│   ├── VeDecorator.cpp
│   ├── ComboBapNuoc.cpp
│   ├── CinemaSystemManager.cpp
│   ├── TimeUtils.cpp
│   └── FileHandler.cpp
│
├── tests/                         # Thư mục kiểm thử tự động
│   ├── test_minh.cpp              # Kiểm thử đa hình ghế, phòng chiếu và quy trình giữ chỗ
│   └── test_system.cpp            # Kiểm thử toàn diện 4 module cốt lõi (Patterns, Xung đột, Thống kê)
│
└── main.cpp                       # Điểm khởi chạy ứng dụng (Menu tương tác Console)
```

---

## 🎯 Các chức năng chính của chương trình

Ứng dụng cung cấp menu tương tác console trực quan phục vụ khách hàng và quản trị viên:

1. **Xem danh sách phim và lịch chiếu:**
   - Liệt kê toàn bộ các phim đang chiếu kèm thể loại, thời lượng và giá vé gốc.
   - Hiển thị danh sách các suất chiếu gồm phòng chiếu (2D/3D/IMAX), giờ bắt đầu và giờ kết thúc (tự động cộng thời lượng phim + 15 phút dọn phòng).

2. **Xem sơ đồ ghế trực quan:**
   - Bố cục ma trận ghế rõ ràng theo hàng và cột.
   - Bảng ký hiệu hiển thị thống nhất:
     - `[T]`: Ghế thường (Standard Seat - phụ thu 0đ).
     - `[V]`: Ghế VIP (VIP Seat - phụ thu 20.000đ).
     - `[S]`: Ghế đôi Sweetbox (Sweetbox Seat - phụ thu 50.000đ, ghép 2 ô liền kề).
     - `[G]`: Ghế đang giữ chỗ tạm thời (Pending).
     - `[B]`: Ghế đã bán thành công (Sold).

3. **Giữ chỗ ghế ngồi trong 5 phút:**
   - Cho phép chọn vị trí hàng và cột của ghế cần giữ.
   - Có kiểm tra biên hợp lệ và kiểm tra trạng thái ghế.
   - Tự động kích hoạt cơ chế đếm ngược giữ chỗ tối đa 300 giây (5 phút).

4. **Thanh toán vé và đính kèm Combo ẩm thực:**
   - Xác nhận thanh toán cho ghế đã được giữ chỗ.
   - Tích hợp menu ẩm thực: cho phép thêm linh hoạt các combo bắp nước với số lượng tùy ý.
   - Áp dụng công thức tính tiền tổng:
     $$\text{Tổng tiền} = \text{Giá gốc phim} + \text{Phụ thu phòng} + \text{Phụ thu loại ghế} + \sum \text{Tiền combo}$$
   - In hóa đơn đầy đủ thông tin chi tiết và lưu hồ sơ giao dịch.

5. **[Admin] Lên lịch suất chiếu mới:**
   - Chọn phim từ danh mục và chọn phòng chiếu thuộc cụm rạp.
   - Đặt mã suất chiếu và giờ bắt đầu theo định dạng chuẩn (`dd/MM/yyyy HH:mm`).
   - Tự động kiểm tra xung đột thời gian chiếu trên cùng một phòng; ném ngoại lệ `ScheduleConflictException` nếu có chồng chéo lịch.

6. **[Admin] Báo cáo thống kê doanh thu đa chiều:**
   - Thống kê chi tiết theo 3 tiêu chí: **Theo Phim**, **Theo Phòng chiếu**, hoặc **Theo Suất chiếu**.
   - Hiển thị bảng biểu format đẹp mắt: số vé bán ra, tổng doanh thu, tỷ trọng %, doanh thu trung bình mỗi vé, phim bán chạy nhất, đối tượng dẫn đầu doanh thu.
   - Hỗ trợ xuất dữ liệu báo cáo ra file văn bản (`data/report_doanh_thu.txt`).

0. **Lưu dữ liệu và Thoát an toàn:**
   - Tự động serialize toàn bộ danh sách vé đã bán và trạng thái ghế thời gian thực xuống file nhị phân `.dat`.

---

## 💡 Thiết kế kiến trúc & Design Patterns

Hệ thống áp dụng chặt chẽ các nguyên lý lập trình hướng đối tượng (OOP) và các mẫu thiết kế chuẩn:

### 1. Decorator Pattern
- **Component gốc:** `VeXemPhim` định nghĩa giao diện chung (`tinhTien()`, `xuatThongTin()`, các getter).
- **Concrete Component:** `VeCoBan` chứa thông tin suất chiếu và ghế ngồi, tính tiền theo công thức: Giá phim + Phụ thu phòng + Phụ thu ghế.
- **Base Decorator:** `VeDecorator` bọc lấy một `VeXemPhim` và chuyển tiếp các lời gọi hàm.
- **Concrete Decorator:** `ComboBapNuoc` mở rộng `VeDecorator`, cho phép lồng ghép nhiều gói bắp nước vào vé một cách linh hoạt mà không làm biến đổi cấu trúc cốt lõi của vé.

### 2. Factory Method Pattern
- `SuatChieuFactory` đóng vai trò Creator, cung cấp phương thức ảo `taoMaTranGhe(const PhongChieu& phong)`.
- Các Concrete Creator:
  - `Suat2DFactory`: Tạo phòng 2D 100% ghế thường và hàng cuối ghế đôi Sweetbox.
  - `Suat3DFactory`: Bố trí khu vực ghế VIP ở giữa (từ 40% đến 70% số hàng).
  - `SuatIMAXFactory`: Mở rộng khu vực ghế VIP lên hàng lớn hơn (từ 30% đến 80% số hàng), tối ưu trải nghiệm phòng IMAX.

### 3. Singleton Pattern
- `CinemaSystemManager` quản lý duy nhất toàn bộ luồng nghiệp vụ của hệ thống rạp phim: lưu trữ danh mục dữ liệu, tìm kiếm suất chiếu, điều phối thanh toán, thống kê doanh thu và đảm bảo tính nhất quán dữ liệu xuyên suốt vòng đời ứng dụng.

### 4. Kế thừa & Đa hình (Inheritance & Polymorphism)
- **Hệ thống phòng chiếu:** Lớp cơ sở trừu tượng `PhongChieu` với các lớp con `Phong2D`, `Phong3D`, `PhongIMAX` định nghĩa mức phụ thu và tên định dạng riêng.
- **Hệ thống ghế ngồi:** Lớp cơ sở trừu tượng `Ghe` với các lớp con `GheThuong`, `GheVIP`, `GheDoiSweetbox` định nghĩa mức phụ thu và ký hiệu hiển thị riêng.

### 5. Xử lý đa luồng & Đồng bộ an toàn (Concurrency & Thread Safety)
- Mỗi `SuatChieu` sở hữu một background thread (`std::thread`, `std::mutex`, `std::condition_variable`) tự động thức dậy để giải phóng các ghế giữ chỗ đã hết hạn 5 phút (`THOI_GIAN_GIU = 300s`) mà không chặn luồng chính của người dùng.
- Cơ chế hủy luồng an toàn trong destructor (`~SuatChieu`) với `condition_variable::notify_all()` và `join()`.

### 6. Xử lý ngoại lệ chuẩn mực (Exception Handling)
- Xây dựng hệ thống ngoại lệ nghiệp vụ kế thừa từ `std::runtime_error`:
  - `CinemaException`: Ngoại lệ chung của nghiệp vụ rạp chiếu phim.
  - `SeatUnavailableException`: Ném ra khi ghế đã có người giữ hoặc đã bán.
  - `ScheduleConflictException`: Ném ra khi hai suất chiếu bị trùng thời gian trên cùng một phòng.

### 7. Lưu trữ dữ liệu hai tầng (Dual Storage)
- **Master Data (CSV):** Lưu thông tin cấu hình danh mục phim (`ds_phim.csv`), cụm rạp (`ds_rap.csv`), và bảng giá combo (`bang_gia.csv`).
- **Transactional & Real-time Data (Binary .dat):** Sử dụng các struct phẳng POD (`VeBinaryRecord`, `GheBinaryRecord`) để serialize/deserialize nhị phân với hiệu năng cao và an toàn bộ nhớ.

---

## 🛠️ Hướng dẫn biên dịch và chạy chương trình

### Yêu cầu môi trường
- Trình biên dịch hỗ trợ **C++17** trở lên (g++ / MinGW-w64, Clang, hoặc MSVC).

---

### Cách 1: Sử dụng MinGW / g++ trên Windows

```powershell
# 1. Biên dịch toàn bộ mã nguồn
g++ -std=c++17 -Wall -Wextra -Iinclude main.cpp src/*.cpp -o cinema_app.exe

# 2. Chạy chương trình
.\cinema_app.exe
```

> **Lưu ý trên Windows PowerShell:** Phải gõ `.\cinema_app.exe` (có `.\`), không gõ `/cinema_app.exe`.

---

### Cách 2: Biên dịch và chạy trên Linux / macOS

```bash
# 1. Biên dịch
g++ -std=c++17 -Wall -Wextra -Iinclude main.cpp src/*.cpp -o cinema_app

# 2. Chạy chương trình
./cinema_app
```

---

### Cách 3: Chạy bộ kiểm thử tự động (Unit & Integration Tests)

Hệ thống có sẵn 2 bộ kiểm thử tự động để xác minh tính đúng đắn:

```powershell
# Chạy bộ kiểm thử toàn diện 4 module cốt lõi (test_system.cpp)
g++ -std=c++17 -Wall -Wextra -Iinclude tests/test_system.cpp src/*.cpp -o test_system.exe
.\test_system.exe

# Chạy bộ kiểm thử cơ bản về ghế và phòng chiếu (test_minh.cpp)
g++ -std=c++17 -Wall -Wextra -Iinclude tests/test_minh.cpp src/Ghe.cpp src/PhongChieu.cpp src/TimeUtils.cpp -o test_minh.exe
.\test_minh.exe
```