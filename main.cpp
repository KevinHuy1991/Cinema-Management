#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <limits>
#include <iomanip>
#include <stdexcept>

#include "CinemaSystemManager.h"
#include "SuatChieuFactory.h"
#include "RapChieu.h"
#include "PhongChieu.h"
#include "Phim.h"
#include "Ghe.h"
#include "VeXemPhim.h"

using namespace std;

// ==================================================
// TIỆN ÍCH NHẬP LIỆU BÀN PHÍM AN TOÀN
// ==================================================

int nhapSoNguyen(const string& thongBao, int minValue = 0)
{
    int n;
    while (true)
    {
        cout << thongBao;
        if (cin >> n && n >= minValue)
        {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            return n;
        }
        cout << "[!] Du lieu khong hop le. Vui long nhap so nguyen >= " << minValue << "!\n";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

string nhapChuoi(const string& thongBao)
{
    string s;
    while (true)
    {
        cout << thongBao;
        getline(cin, s);
        if (!s.empty())
        {
            return s;
        }
        cout << "[!] Thong tin khong duoc de trong. Vui long nhap lai!\n";
    }
}

// ==================================================
// HIỂN THỊ MENU CHÍNH HỆ THỐNG
// ==================================================

void hienThiMenuChinh()
{
    cout << "\n";
    cout << "============================================================\n";
    cout << "       HE THONG QUAN LY CUM RAP CHIEU PHIM (CINEMA OS)      \n";
    cout << "============================================================\n";
    cout << "  [A] NGHIEP VU BAN VE & DICH VU KHACH HANG (POS)\n";
    cout << "      1. Tra cuu Phim & Lich chieu (Theo Cum rap / He thong)\n";
    cout << "      2. Xem so do ghe & Tinh trang phong chieu\n";
    cout << "      3. Dat ve xem phim (Ghe ngoi + Bap nuoc + Xuat ve)\n";
    cout << "      4. Tra cuu & Huy ve xem phim (Hoan tra ghe)\n";
    cout << "\n";
    cout << "  [B] NGHIEP VU QUAN TRI CUM RAP (ADMINISTRATION)\n";
    cout << "      5. [Admin] Len lich suat chieu moi (Kiem tra xung dot)\n";
    cout << "      6. [Admin] Xem danh sach Cum rap & Phong chieu\n";
    cout << "      7. [Admin] Bao cao & Thong ke doanh thu da chieu\n";
    cout << "\n";
    cout << "  [C] HE THONG\n";
    cout << "      8. Dong bo / Luu du lieu thu cong (.dat & CSV)\n";
    cout << "      0. Luu du lieu va Thoat chuong trinh\n";
    cout << "============================================================\n";
}

// ==================================================
// HÀM TIỆN ÍCH: CHỌN SUẤT CHIẾU
// ==================================================

shared_ptr<SuatChieu> chonSuatChieu(CinemaSystemManager& manager)
{
    string maSuat = nhapChuoi("Nhap ma suat chieu (vi du SC01, SC02...): ");
    shared_ptr<SuatChieu> sc = manager.timSuatChieu(maSuat);

    if (!sc)
    {
        cout << "[!] Khong tim thay suat chieu '" << maSuat << "' trong he thong!\n";
        cout << "Goi y: Ban co the chon chuc nang 1 de xem lai toan bo danh sach ma suat chieu.\n";
    }

    return sc;
}

// ==================================================
// 1. TRA CỨU PHIM VÀ LỊCH CHIẾU THEO CỤM RẠP
// ==================================================

void traCuuPhimVaLichChieu(CinemaSystemManager& manager)
{
    const auto& dsPhim = manager.getDanhSachPhim();
    const auto& dsRap = manager.getDanhSachRap();
    const auto& dsSuat = manager.getDanhSachSuatChieu();

    cout << "\n=================== DANH SACH PHIM DANG CHIẾU ===================\n";
    if (dsPhim.empty())
    {
        cout << "Chua co du lieu phim nao trong he thong.\n";
    }
    else
    {
        cout << left << setw(8) << "Ma"
             << setw(32) << "Ten phim"
             << setw(16) << "The loai"
             << setw(14) << "Thoi luong"
             << "Gia ve goc\n";
        cout << string(80, '-') << "\n";

        for (const auto& phim : dsPhim)
        {
            if (!phim) continue;
            cout << left << setw(8) << phim->getMaPhim()
                 << setw(32) << phim->getTenPhim()
                 << setw(16) << phim->getTheLoai()
                 << setw(14) << (to_string(phim->getThoiLuongPhut()) + " phut")
                 << fixed << setprecision(0) << phim->getGiaVeCoBan() << " VND\n";
        }
    }

    cout << "\n--- TUY CHON XEM LICH CHIEU ---\n";
    cout << "1. Xem toan bo lich chieu trong he thong\n";
    cout << "2. Loc lich chieu theo Cum rap (Cluster Isolation)\n";
    cout << "0. Quay lai menu chinh\n";

    int chon = nhapSoNguyen("Nhap lua chon (0-2): ", 0);
    if (chon == 0) return;

    string filterMaRap = "";
    if (chon == 2)
    {
        cout << "\nChon Cum rap can xem:\n";
        for (size_t i = 0; i < dsRap.size(); ++i)
        {
            cout << i + 1 << ". " << dsRap[i]->getMaRap() << " - " << dsRap[i]->getTenRap() << "\n";
        }
        int rChon = nhapSoNguyen("Chon cum rap (1-" + to_string(dsRap.size()) + "): ", 1);
        if (rChon >= 1 && rChon <= static_cast<int>(dsRap.size()))
        {
            filterMaRap = dsRap[rChon - 1]->getMaRap();
        }
    }

    cout << "\n====================== LICH CHIEU SUAT PHIM ======================\n";
    cout << left << setw(8) << "Ma SC"
         << setw(26) << "Ten phim"
         << setw(18) << "Phong chieu"
         << setw(18) << "Gio bat dau"
         << "Gio ket thuc\n";
    cout << string(84, '-') << "\n";

    int dem = 0;
    for (const auto& sc : dsSuat)
    {
        if (!sc) continue;

        // Loc theo rap neu co yeu cau
        if (!filterMaRap.empty() && sc->getPhongChieu())
        {
            string maPhong = sc->getPhongChieu()->getMaPhong();
            // Kiem tra phong co thuoc cum rap duoc chon khong
            bool thuocRap = false;
            for (const auto& rap : dsRap)
            {
                if (rap->getMaRap() == filterMaRap)
                {
                    for (const auto& p : rap->getDanhSachPhong())
                    {
                        if (p->getMaPhong() == maPhong) { thuocRap = true; break; }
                    }
                }
            }
            if (!thuocRap) continue;
        }

        string tenPhim = sc->getPhim() ? sc->getPhim()->getTenPhim() : "N/A";
        string phong = sc->getPhongChieu() ? (sc->getPhongChieu()->getMaPhong() + " (" + sc->getPhongChieu()->getTenLoaiPhong() + ")") : "N/A";

        cout << left << setw(8) << sc->getMaSuatChieu()
             << setw(26) << (tenPhim.length() > 24 ? tenPhim.substr(0, 23) + "..." : tenPhim)
             << setw(18) << phong
             << setw(18) << sc->getThoiGianBatDau().toString()
             << sc->getThoiGianKetThuc().toString() << "\n";
        dem++;
    }

    if (dem == 0)
    {
        cout << "Khong co suat chieu nao phu hop voi tieu chi loc.\n";
    }
    cout << string(84, '=') << "\n";
}

// ==================================================
// 2. XEM SƠ ĐỒ GHẾ CỦA SUẤT CHIẾU
// ==================================================

void xemSoDoGhe(CinemaSystemManager& manager)
{
    shared_ptr<SuatChieu> sc = chonSuatChieu(manager);
    if (!sc) return;

    // Tu dong don dep va giai phong ghe da qua han 5 phut
    sc->huyGheQuaHan();

    cout << "\n======================== SO DO GHE NGOI ========================\n";
    cout << "Ma suat chieu : " << sc->getMaSuatChieu() << '\n';
    if (sc->getPhim()) cout << "Phim          : " << sc->getPhim()->getTenPhim() << '\n';
    if (sc->getPhongChieu()) cout << "Phong         : " << sc->getPhongChieu()->getTenPhong() << " (" << sc->getPhongChieu()->getTenLoaiPhong() << ")\n";
    cout << "Gio chieu     : " << sc->getThoiGianBatDau().toString() << " ~ " << sc->getThoiGianKetThuc().toString() << "\n";
    cout << "----------------------------------------------------------------\n";
    cout << "Ky hieu loai ghe : [T] Ghe thuong  | [V] Ghe VIP  | [S] Ghe Sweetbox\n";
    cout << "Ky hieu trang thai: [G] Dang giu cho | [B] Da dat mua\n\n";

    const auto& maTran = sc->getMaTranGhe();
    if (maTran.empty())
    {
        cout << "[!] Suat chieu chua co so do ghe.\n";
        return;
    }

    int tongGhe = 0, daBan = 0, dangGiu = 0, gheTrong = 0;

    cout << "                      M A N   H I N H\n\n";
    for (size_t i = 0; i < maTran.size(); ++i)
    {
        cout << "Hang " << setw(2) << i + 1 << ":  ";
        for (size_t j = 0; j < maTran[i].size(); ++j)
        {
            const auto& ghe = maTran[i][j];
            tongGhe++;

            if (!ghe)
            {
                cout << "[?] ";
                continue;
            }

            if (ghe->getTrangThai() == TrangThaiGhe::DANG_GIU_CHO)
            {
                cout << "[G] ";
                dangGiu++;
            }
            else if (ghe->getTrangThai() == TrangThaiGhe::DA_BAN)
            {
                cout << "[B] ";
                daBan++;
            }
            else
            {
                cout << ghe->kyHieuHienThi() << ' ';
                gheTrong++;
            }
        }
        cout << '\n';
    }

    cout << "\n----------------------------------------------------------------\n";
    cout << "Tong so: " << tongGhe << " ghe | Trong: " << gheTrong
         << " | Dang giu: " << dangGiu << " | Da ban: " << daBan << "\n";
    cout << "================================================================\n";
}

// ==================================================
// 3. ĐẶT VÉ XEM PHIM (FLOW LIỀN MẠCH: CHỌN GHẾ + BẮP NƯỚC + XUẤT VÉ)
// ==================================================

void datVeXemPhim(CinemaSystemManager& manager)
{
    cout << "\n================= DAT VE XEM PHIM TAI QUAY (POS) =================\n";
    shared_ptr<SuatChieu> sc = chonSuatChieu(manager);
    if (!sc) return;

    // Tu dong don dep ghe het han
    sc->huyGheQuaHan();

    const auto& maTran = sc->getMaTranGhe();
    if (maTran.empty() || maTran[0].empty())
    {
        cout << "[!] Suat chieu chua duoc khoi tao so do ghe!\n";
        return;
    }

    int maxHang = static_cast<int>(maTran.size());
    int maxCot = static_cast<int>(maTran[0].size());

    // 1. In nhanh so do ghe de thu ngan / khach quan sat
    cout << "\n--- SO DO GHE HIEN TAI ---\n";
    cout << "[T] Thuong  [V] VIP  [S] Sweetbox  | [G] Dang giu  [B] Da ban\n\n";
    for (size_t i = 0; i < maTran.size(); ++i)
    {
        cout << "Hang " << setw(2) << i + 1 << ":  ";
        for (size_t j = 0; j < maTran[i].size(); ++j)
        {
            const auto& g = maTran[i][j];
            if (!g) cout << "[?] ";
            else if (g->getTrangThai() == TrangThaiGhe::DANG_GIU_CHO) cout << "[G] ";
            else if (g->getTrangThai() == TrangThaiGhe::DA_BAN) cout << "[B] ";
            else cout << g->kyHieuHienThi() << ' ';
        }
        cout << '\n';
    }

    // 2. Chon vi tri ghe
    cout << "\n--- CHON VI TRI GHE ---\n";
    int hang = nhapSoNguyen("Nhap hang ghe (1 - " + to_string(maxHang) + "): ", 1);
    int cot = nhapSoNguyen("Nhap cot ghe (1 - " + to_string(maxCot) + "): ", 1);

    if (hang > maxHang || cot > maxCot)
    {
        cout << "[!] Vi tri ghe vuot qua kich thuoc phong chieu!\n";
        return;
    }

    --hang;
    --cot;

    // 3. Giu cho ghe ngoi
    try
    {
        manager.giuChoGhe(sc->getMaSuatChieu(), hang, cot);
        cout << "[OK] Ghe hang " << hang + 1 << ", cot " << cot + 1
             << " (" << sc->getGhe(hang, cot)->getMaGhe()
             << ") da duoc giu cho thanh cong!\n";
    }
    catch (const exception& e)
    {
        cout << "[!] Khong the dat ghe: " << e.what() << '\n';
        return;
    }

    // 4. Chon Combo Bap Nuoc (Decorator Pattern)
    const auto& dsCombo = manager.getDanhSachCombo();
    vector<pair<string, double>> combos;

    if (!dsCombo.empty())
    {
        cout << "\n--- DICH VU BAP NUOC & COMBO ---\n";
        cout << "Khach co muon mua them Combo Bap Nuoc khong? (1. Co / 0. Khong): ";
        int coCombo = nhapSoNguyen("", 0);

        if (coCombo == 1)
        {
            for (size_t i = 0; i < dsCombo.size(); ++i)
            {
                cout << i + 1 << ". " << dsCombo[i].tenCombo << " - "
                     << fixed << setprecision(0) << dsCombo[i].donGia << " VND\n";
            }
            cout << "0. Hoan tat chon combo\n";

            while (true)
            {
                int cChon = nhapSoNguyen("Chon combo (0 de ket thuc): ", 0);
                if (cChon == 0) break;

                if (cChon > static_cast<int>(dsCombo.size()))
                {
                    cout << "[!] Lua chon combo khong hop le.\n";
                    continue;
                }

                int sl = nhapSoNguyen("So luong combo: ", 1);
                const auto& combo = dsCombo[cChon - 1];

                for (int k = 0; k < sl; ++k)
                {
                    combos.push_back(make_pair(combo.tenCombo, combo.donGia));
                }
                cout << "[OK] Da them " << sl << "x " << combo.tenCombo << " vao don hang.\n";
            }
        }
    }

    // 5. Thanh toan ve & Xuat hoa don
    shared_ptr<VeXemPhim> ve = manager.thanhToanVe(sc->getMaSuatChieu(), hang, cot, combos);
    if (!ve)
    {
        cout << "[!] Thanh toan ve that bai.\n";
        return;
    }

    // Luu ngay vao file nhi phan ve_da_ban.dat va trang_thai_ghe.dat
    manager.luuDuLieuHeThong();

    cout << "\n====================== HOA DON THANH TOAN VE ======================\n";
    cout << ve->xuatThongTin() << '\n';
    cout << string(67, '-') << "\n";
    cout << "TONG TIEN THANH TOAN: " << fixed << setprecision(0) << ve->tinhTien() << " VND\n";
    cout << "Trang thai          : DA THANH TOAN & LUU HE THONG THANH CONG\n";
    cout << "===================================================================\n";
}

// ==================================================
// 4. TRA CỨU & HỦY VÉ XEM PHIM (HOÀN TRẢ GHẾ)
// ==================================================

void traCuuVaHuyVe(CinemaSystemManager& manager)
{
    const auto& dsVe = manager.getDanhSachVeDaBan();

    cout << "\n================= TRA CUU & HUY VE XEM PHIM =================\n";
    if (dsVe.empty())
    {
        cout << "Hien tai he thong chua co ve nao duoc ban ra.\n";
        return;
    }

    cout << "Danh sach " << min(size_t(8), dsVe.size()) << " ve duoc dat gan nhat:\n";
    cout << left << setw(22) << "Ma ve"
         << setw(12) << "Ma suat"
         << setw(10) << "Ghe"
         << setw(16) << "Tong tien"
         << "Chi tiet\n";
    cout << string(70, '-') << "\n";

    size_t batDau = dsVe.size() > 8 ? dsVe.size() - 8 : 0;
    for (size_t i = batDau; i < dsVe.size(); ++i)
    {
        cout << left << setw(22) << dsVe[i].maVe
             << setw(12) << dsVe[i].maSuatChieu
             << setw(10) << dsVe[i].maGhe
             << setw(16) << (to_string(static_cast<long long>(dsVe[i].tongTien)) + " VND")
             << string(dsVe[i].chiTietHoaDon).substr(0, 20) + "..." << "\n";
    }
    cout << string(70, '-') << "\n";

    string maVeHuy = nhapChuoi("Nhap ma ve can huy (hoac nhap '0' de quay lai): ");
    if (maVeHuy == "0") return;

    cout << "Xac nhan: Ban co chac chan muon huy ve '" << maVeHuy
         << "' va giai phong ghe khong? (1. Co / 0. Khong): ";
    int xacNhan = nhapSoNguyen("", 0);

    if (xacNhan != 1)
    {
        cout << "[i] Thao tac huy ve da bi huy bo boi nguoi dung.\n";
        return;
    }

    bool ok = manager.huyVe(maVeHuy);
    if (ok)
    {
        cout << "\n[THANH CONG] Da huy ve '" << maVeHuy << "' thanh cong!\n";
        cout << "-> Ghe tuong ung da duoc hoan tra ve trang thai TRONG (Available) tren toan he thong.\n";
        cout << "-> Du lieu ve va trang thai ghe da duoc dong bo xuong file nhi phan.\n";
    }
    else
    {
        cout << "\n[THAT BAI] Khong tim thay ma ve '" << maVeHuy << "' trong he thong de huy!\n";
    }
}

// ==================================================
// 5. [ADMIN] LÊN LỊCH SUẤT CHIẾU MỚI (KIỂM TRA XUNG ĐỘT)
// ==================================================

void lenLichChieu(CinemaSystemManager& manager)
{
    cout << "\n================= [ADMIN] LEN LICH SUAT CHIEU MOI =================\n";

    const auto& dsPhim = manager.getDanhSachPhim();
    if (dsPhim.empty())
    {
        cout << "[!] Chua co phim nao trong he thong!\n";
        return;
    }

    const auto& dsRap = manager.getDanhSachRap();
    if (dsRap.empty())
    {
        cout << "[!] Chua co cum rap nao trong he thong!\n";
        return;
    }

    // 1. Chon phim
    cout << "\n--- BAP 1: CHON PHIM ---\n";
    for (size_t i = 0; i < dsPhim.size(); ++i)
    {
        cout << i + 1 << ". " << dsPhim[i]->getMaPhim() << " - " << dsPhim[i]->getTenPhim()
             << " (" << dsPhim[i]->getThoiLuongPhut() << " phut)\n";
    }
    int chonPhim = nhapSoNguyen("Chon phim (1-" + to_string(dsPhim.size()) + "): ", 1);
    if (chonPhim > static_cast<int>(dsPhim.size()))
    {
        cout << "[!] Lua chon phim khong hop le.\n";
        return;
    }
    auto phim = dsPhim[chonPhim - 1];

    // 2. Chon cum rap
    cout << "\n--- BAP 2: CHON CUM RAP ---\n";
    for (size_t i = 0; i < dsRap.size(); ++i)
    {
        cout << i + 1 << ". " << dsRap[i]->getMaRap() << " - " << dsRap[i]->getTenRap() << '\n';
    }
    int chonRap = nhapSoNguyen("Chon rap (1-" + to_string(dsRap.size()) + "): ", 1);
    if (chonRap > static_cast<int>(dsRap.size()))
    {
        cout << "[!] Lua chon rap khong hop le.\n";
        return;
    }
    auto rap = dsRap[chonRap - 1];

    // 3. Chon phong chieu
    const auto& dsPhong = rap->getDanhSachPhong();
    if (dsPhong.empty())
    {
        cout << "[!] Cum rap " << rap->getTenRap() << " chua co phong chieu nao!\n";
        return;
    }

    cout << "\n--- BAP 3: CHON PHONG CHIEU ---\n";
    for (size_t i = 0; i < dsPhong.size(); ++i)
    {
        cout << i + 1 << ". " << dsPhong[i]->getMaPhong() << " - " << dsPhong[i]->getTenPhong()
             << " (" << dsPhong[i]->getTenLoaiPhong() << ")\n";
    }
    int chonPhong = nhapSoNguyen("Chon phong (1-" + to_string(dsPhong.size()) + "): ", 1);
    if (chonPhong > static_cast<int>(dsPhong.size()))
    {
        cout << "[!] Lua chon phong khong hop le.\n";
        return;
    }
    auto phong = dsPhong[chonPhong - 1];

    // 4. Ma suat chieu
    string maSuat = nhapChuoi("\nNhap ma suat chieu moi (vi du SC10, SC11...): ");
    if (manager.timSuatChieu(maSuat))
    {
        cout << "[!] Loi: Ma suat chieu '" << maSuat << "' da ton tai trong he thong!\n";
        return;
    }

    // 5. Thoi gian chieu
    cout << "Nhap thoi gian bat dau chieu (dinh dang dd/MM/yyyy HH:mm, vi du: 20/11/2026 19:30):\n";
    string strTime = nhapChuoi("Thoi gian: ");
    DateTime batDau = ThoiGian::tuChuoi(strTime);
    if (batDau.getNam() < 2024 || batDau.getNam() > 2030)
    {
        cout << "[!] Thoi gian khong hop le hoac sai dinh dang dd/MM/yyyy HH:mm!\n";
        return;
    }

    // 6. Khoi tao suat chieu & Kiem tra xung dot
    try
    {
        auto suatMoi = SuatChieuFactory::taoSuatChieu(maSuat, phim, phong, batDau);
        manager.lenLichChieu(suatMoi);

        cout << "\n[THANH CONG] Da len lich suat chieu moi vao he thong!\n";
        cout << "Ma suat  : " << suatMoi->getMaSuatChieu() << '\n';
        cout << "Phim     : " << phim->getTenPhim() << '\n';
        cout << "Phong    : " << phong->getTenPhong() << " (" << phong->getTenLoaiPhong() << ")\n";
        cout << "Bat dau  : " << suatMoi->getThoiGianBatDau().toString() << '\n';
        cout << "Ket thuc : " << suatMoi->getThoiGianKetThuc().toString() << " (da cong 15 phut don dep phong)\n";
    }
    catch (const exception& e)
    {
        cout << "[!] LOI XUNG DOT LICH CHIEU: " << e.what() << '\n';
        cout << "Goi y: Vui long chon gio chieu khac tranh trung lap gio suat chieu dang co cua phong!\n";
    }
}

// ==================================================
// 6. [ADMIN] XEM DANH SÁCH CỤM RẠP & PHÒNG CHIẾU
// ==================================================

void xemDanhSachCumRapVaPhong(CinemaSystemManager& manager)
{
    const auto& dsRap = manager.getDanhSachRap();

    cout << "\n================= DANH SACH CUM RAP & PHONG CHIEU =================\n";
    if (dsRap.empty())
    {
        cout << "Chua co thong tin cum rap trong he thong.\n";
        return;
    }

    for (const auto& rap : dsRap)
    {
        if (!rap) continue;
        cout << "\n🏢 CUM RAP: " << rap->getTenRap() << " (Ma: " << rap->getMaRap() << ")\n";
        cout << "   Dia chi: " << rap->getDiaChi() << "\n";
        cout << "   Danh sach phong chieu:\n";

        const auto& dsPhong = rap->getDanhSachPhong();
        if (dsPhong.empty())
        {
            cout << "      (Chua co phong chieu)\n";
        }
        else
        {
            for (const auto& p : dsPhong)
            {
                if (!p) continue;
                int tongGhe = p->getSoHang() * p->getSoCot();
                cout << "      • [" << p->getMaPhong() << "] " << left << setw(20) << p->getTenPhong()
                     << " | Loai: " << setw(10) << p->getTenLoaiPhong()
                     << " | Ma tran: " << p->getSoHang() << "x" << p->getSoCot()
                     << " (" << tongGhe << " ghe)\n";
            }
        }
    }
    cout << string(67, '=') << "\n";
}

// ==================================================
// 7. [ADMIN] BÁO CÁO & THỐNG KÊ DOANH THU ĐA CHIỀU
// ==================================================

void thongKeDoanhThu(CinemaSystemManager& manager)
{
    cout << "\n================= BAO CAO & THONG KE DOANH THU =================\n";
    cout << "1. Thong ke doanh thu theo Phim\n";
    cout << "2. Thong ke doanh thu theo Phong chieu\n";
    cout << "3. Thong ke doanh thu theo Suat chieu\n";
    cout << "4. Xuat toan bo bao cao doanh thu ra file text (report_doanh_thu.txt)\n";
    cout << "5. Xem tong quan doanh thu toan he thong\n";
    cout << "0. Quay lai menu chinh\n";

    int luaChon = nhapSoNguyen("Nhap lua chon (0-5): ", 0);
    if (luaChon == 0) return;

    if (luaChon == 1)
    {
        manager.hienThiBaoCaoDoanhThu(TieuChiThongKe::THEO_PHIM);
    }
    else if (luaChon == 2)
    {
        manager.hienThiBaoCaoDoanhThu(TieuChiThongKe::THEO_PHONG_CHIEU);
    }
    else if (luaChon == 3)
    {
        manager.hienThiBaoCaoDoanhThu(TieuChiThongKe::THEO_SUAT_CHIEU);
    }
    else if (luaChon == 4)
    {
        string path = "data/report_doanh_thu.txt";
        bool ok = manager.xuatBaoCaoDoanhThuFile(path, TieuChiThongKe::THEO_PHIM);
        if (ok)
        {
            cout << "\n[THANH CONG] Da xuat bao cao doanh thu ra file: " << path << '\n';
        }
        else
        {
            cout << "\n[THAT BAI] Khong the ghi file bao cao.\n";
        }
    }
    else if (luaChon == 5)
    {
        cout << "\n--- TONG QUAN HOAT DONG TOAN HE THONG ---\n";
        cout << "• Tong so ve ban ra             : " << manager.tinhTongSoVeBanRa() << " ve\n";
        cout << "• Tong doanh thu toan he thong   : " << fixed << setprecision(0) << manager.tinhTongDoanhThu() << " VND\n";
        cout << "• Doanh thu trung binh moi ve    : " << fixed << setprecision(0) << manager.tinhDoanhThuTrungBinhMoiVe() << " VND/ve\n";

        auto topPhim = manager.timPhimDoanhThuCaoNhat();
        cout << "• Phim co doanh thu cao nhat    : " << topPhim.first << " (" << fixed << setprecision(0) << topPhim.second << " VND)\n";

        auto topPhong = manager.timPhongDoanhThuCaoNhat();
        cout << "• Phong chieu doanh thu cao nhat: " << topPhong.first << " (" << fixed << setprecision(0) << topPhong.second << " VND)\n";
        cout << string(45, '-') << "\n";
    }
}

// ==================================================
// 8. ĐỒNG BỘ DỮ LIỆU THỦ CÔNG
// ==================================================

void dongBoDuLieu(CinemaSystemManager& manager)
{
    cout << "\nDang dong bo toan bo du lieu xuong file C++ (.dat & CSV)...\n";
    manager.luuDuLieuHeThong();
    cout << "[OK] Dong bo thanh cong vao:\n";
    cout << "     - data/ve_da_ban.dat (Binary Serialization)\n";
    cout << "     - data/trang_thai_ghe.dat (Binary Serialization)\n";
    cout << "     - data/report_doanh_thu.txt (Bao cao doanh thu)\n";
}

// ==================================================
// HÀM MAIN
// ==================================================

int main()
{
    try
    {
        CinemaSystemManager& manager = CinemaSystemManager::getInstance();
        manager.khoiTaoDuLieuTuFile();

        cout << "============================================================\n";
        cout << "  Khoi tao du lieu Core Engine C++ thanh cong!\n";
        cout << "  San sang ket noi va dong bo voi Fullstack Web Portal.\n";
        cout << "============================================================\n";

        int luaChon = -1;

        while (luaChon != 0)
        {
            hienThiMenuChinh();
            luaChon = nhapSoNguyen("Nhap lua chon cua ban (0-8): ", 0);

            try
            {
                switch (luaChon)
                {
                    case 1:
                        traCuuPhimVaLichChieu(manager);
                        break;

                    case 2:
                        xemSoDoGhe(manager);
                        break;

                    case 3:
                        datVeXemPhim(manager);
                        break;

                    case 4:
                        traCuuVaHuyVe(manager);
                        break;

                    case 5:
                        lenLichChieu(manager);
                        break;

                    case 6:
                        xemDanhSachCumRapVaPhong(manager);
                        break;

                    case 7:
                        thongKeDoanhThu(manager);
                        break;

                    case 8:
                        dongBoDuLieu(manager);
                        break;

                    case 0:
                        manager.luuDuLieuHeThong();
                        cout << "\n[OK] Da luu toan bo du lieu he thong vao file. Tam biet!\n";
                        break;

                    default:
                        cout << "[!] Lua chon khong hop le. Vui long chon tu 0 den 8!\n";
                        break;
                }
            }
            catch (const CinemaException& e)
            {
                cout << "\n[LOI NGHIEP VU] " << e.what() << '\n';
            }
            catch (const exception& e)
            {
                cout << "\n[LOI HE THONG] " << e.what() << '\n';
            }
        }
    }
    catch (const exception& e)
    {
        cerr << "[LOI KHOI TAO HE THONG] " << e.what() << '\n';
        return 1;
    }

    return 0;
}
