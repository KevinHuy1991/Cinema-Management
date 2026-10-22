
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

using namespace std;

// ==================================================
// CAC HAM NHAP DU LIEU
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

        cout << "Du lieu khong hop le. Vui long nhap lai!\n";
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

        cout << "Khong duoc de trong. Vui long nhap lai!\n";
    }
}

// ==================================================
// HIEN THI MENU
// ==================================================

void hienThiMenuChinh()
{
    cout << "\n";
    cout << "====================================================\n";
    cout << "       HE THONG QUAN LY CUM RAP CHIEU PHIM\n";
    cout << "====================================================\n";
    cout << "  1. Xem danh sach phim va lich chieu\n";
    cout << "  2. Xem so do ghe cua suat chieu\n";
    cout << "  3. Giu cho ghe ngoi trong 5 phut\n";
    cout << "  4. Thanh toan ve va chon combo bap nuoc\n";
    cout << "  5. [Admin] Len lich suat chieu moi\n";
    cout << "  6. [Admin] Thong ke doanh thu\n";
    cout << "  0. Luu du lieu va thoat\n";
    cout << "====================================================\n";
}

// ==================================================
// HAM TIM SUAT CHIEU
// ==================================================

shared_ptr<SuatChieu> chonSuatChieu(
    CinemaSystemManager& manager)
{
    string maSuat = nhapChuoi("Nhap ma suat chieu: ");

    shared_ptr<SuatChieu> sc =
        manager.timSuatChieu(maSuat);

    if (!sc)
    {
        cout << "Khong tim thay suat chieu!\n";
    }

    return sc;
}

// ==================================================
// CHUC NANG 1: DANH SACH PHIM VA LICH CHIEU
// ==================================================

void xemDanhSachPhim(CinemaSystemManager& manager)
{
    const auto& dsPhim = manager.getDanhSachPhim();
    const auto& dsSuat = manager.getDanhSachSuatChieu();

    cout << "\n========== DANH SACH PHIM ==========\n";

    if (dsPhim.empty())
    {
        cout << "Chua co du lieu phim.\n";
    }
    else
    {
        for (const auto& phim : dsPhim)
        {
            if (!phim)
            {
                continue;
            }

            cout << "Ma phim: " << phim->getMaPhim() << '\n';
            cout << "Ten phim: " << phim->getTenPhim() << '\n';
            cout << "The loai: " << phim->getTheLoai() << '\n';
            cout << "Thoi luong: "
                 << phim->getThoiLuongPhut() << " phut\n";
            cout << "Gia ve co ban: "
                 << fixed << setprecision(0)
                 << phim->getGiaVeCoBan() << " VND\n";
            cout << "------------------------------------\n";
        }
    }

    cout << "\n========== DANH SACH SUAT CHIEU ==========\n";

    if (dsSuat.empty())
    {
        cout << "Chua co suat chieu nao.\n";
    }
    else
    {
        for (const auto& sc : dsSuat)
        {
            if (!sc)
            {
                continue;
            }

            cout << "Ma suat: " << sc->getMaSuatChieu() << '\n';

            if (sc->getPhim())
            {
                cout << "Phim: "
                     << sc->getPhim()->getTenPhim() << '\n';
            }

            if (sc->getPhongChieu())
            {
                cout << "Phong: "
                     << sc->getPhongChieu()->getMaPhong()
                     << " - "
                     << sc->getPhongChieu()->getTenLoaiPhong()
                     << '\n';
            }

            cout << "Bat dau: "
                 << sc->getThoiGianBatDau().toString() << '\n';

            cout << "Ket thuc: "
                 << sc->getThoiGianKetThuc().toString() << '\n';

            cout << "-----------------------------------------\n";
        }
    }
}

// ==================================================
// CHUC NANG 2: XEM SO DO GHE
// ==================================================

void xemSoDoGhe(CinemaSystemManager& manager)
{
    shared_ptr<SuatChieu> sc = chonSuatChieu(manager);

    if (!sc)
    {
        return;
    }

    // Kiem tra va giai phong ghe het han truoc khi hien thi.
    sc->huyGheQuaHan();

    cout << "\n========== SO DO GHE ==========\n";
    cout << "Ma suat: " << sc->getMaSuatChieu() << '\n';
    cout << "[T] Ghe thuong  [V] Ghe VIP  [S] Ghe Sweetbox\n";
    cout << "[G] Ghe dang duoc giu cho    [B] Ghe da ban\n\n";

    const auto& maTran = sc->getMaTranGhe();

    if (maTran.empty())
    {
        cout << "Suat chieu chua co so do ghe.\n";
        return;
    }

    cout << "                    MAN HINH\n\n";

    for (size_t i = 0; i < maTran.size(); ++i)
    {
        cout << "Hang " << setw(2) << i + 1 << ": ";

        for (size_t j = 0; j < maTran[i].size(); ++j)
        {
            const auto& ghe = maTran[i][j];

            if (!ghe)
            {
                cout << "[?] ";
                continue;
            }

            if (ghe->getTrangThai() == TrangThaiGhe::DANG_GIU_CHO)
            {
                cout << "[G] ";
            }
            else if (ghe->getTrangThai() == TrangThaiGhe::DA_BAN)
            {
                cout << "[B] ";
            }
            else
            {
                cout << ghe->kyHieuHienThi() << ' ';
            }
        }

        cout << '\n';
    }

    cout << "\nLuu y: So hang va cot nhap vao bat dau tu 1.\n";
}

// ==================================================
// CHUC NANG 3: GIU CHO GHE
// ==================================================

void giuChoGhe(CinemaSystemManager& manager)
{
    shared_ptr<SuatChieu> sc = chonSuatChieu(manager);

    if (!sc)
    {
        return;
    }

    // Don dep cac ghe da het thoi gian giu.
    sc->huyGheQuaHan();

    const auto& maTran = sc->getMaTranGhe();
    if (maTran.empty() || maTran[0].empty())
    {
        cout << "Suat chieu chua co so do ghe.\n";
        return;
    }

    int maxHang = static_cast<int>(maTran.size());
    int maxCot = static_cast<int>(maTran[0].size());

    int hang = nhapSoNguyen("Nhap hang ghe (1-" + to_string(maxHang) + "): ", 1);
    int cot = nhapSoNguyen("Nhap cot ghe (1-" + to_string(maxCot) + "): ", 1);

    if (hang > maxHang || cot > maxCot)
    {
        cout << "Vi tri ghe nam ngoai so do!\n";
        return;
    }

    // Chuyen vi tri hien thi tu 1-based sang 0-based.
    --hang;
    --cot;

    manager.giuChoGhe(sc->getMaSuatChieu(), hang, cot);

    cout << "Da gui yeu cau giu cho ghe thanh cong.\n";
    cout << "Thoi gian giu cho toi da: 5 phut.\n";
}

// ==================================================
// CHUC NANG 4: THANH TOAN VE VA CHON COMBO
// ==================================================

void thanhToanVe(CinemaSystemManager& manager)
{
    shared_ptr<SuatChieu> sc = chonSuatChieu(manager);

    if (!sc)
    {
        return;
    }

    // Kiem tra han giu cho truoc khi thanh toan.
    sc->huyGheQuaHan();

    const auto& maTran = sc->getMaTranGhe();
    if (maTran.empty() || maTran[0].empty())
    {
        cout << "Suat chieu chua co so do ghe.\n";
        return;
    }

    int maxHang = static_cast<int>(maTran.size());
    int maxCot = static_cast<int>(maTran[0].size());

    int hang = nhapSoNguyen("Nhap hang ghe (1-" + to_string(maxHang) + "): ", 1);
    int cot = nhapSoNguyen("Nhap cot ghe (1-" + to_string(maxCot) + "): ", 1);

    if (hang > maxHang || cot > maxCot)
    {
        cout << "Vi tri ghe nam ngoai so do!\n";
        return;
    }

    --hang;
    --cot;

    shared_ptr<Ghe> ghe = sc->getGhe(hang, cot);

    if (!ghe)
    {
        cout << "Vi tri ghe khong hop le.\n";
        return;
    }

    if (ghe->getTrangThai() != TrangThaiGhe::DANG_GIU_CHO)
    {
        cout << "Ghe chua duoc giu cho hoac khong con hop le de thanh toan.\n";
        return;
    }

    const auto& dsCombo = manager.getDanhSachCombo();

    vector<pair<string, double>> combos;

    if (dsCombo.empty())
    {
        cout << "Khong co combo nao trong danh sach.\n";
    }
    else
    {
        cout << "\n========== DANH SACH COMBO ==========\n";

        for (size_t i = 0; i < dsCombo.size(); ++i)
        {
            cout << i + 1 << ". "
                 << dsCombo[i].tenCombo
                 << " - "
                 << fixed << setprecision(0)
                 << dsCombo[i].donGia << " VND\n";
        }

        cout << "0. Khong mua combo\n";

        while (true)
        {
            int luaChon = nhapSoNguyen(
                "Chon combo (0 de ket thuc): ", 0);

            if (luaChon == 0)
            {
                break;
            }

            if (luaChon > static_cast<int>(dsCombo.size()))
            {
                cout << "Lua chon combo khong hop le.\n";
                continue;
            }

            int soLuong = nhapSoNguyen("Nhap so luong: ", 1);

            const auto& combo = dsCombo[luaChon - 1];

            // Moi cap ten-gia dai dien cho mot combo.
            for (int i = 0; i < soLuong; ++i)
            {
                combos.push_back(
                    make_pair(combo.tenCombo, combo.donGia)
                );
            }

            cout << "Da them combo vao don hang.\n";
        }
    }

    shared_ptr<VeXemPhim> ve = manager.thanhToanVe(
        sc->getMaSuatChieu(),
        hang,
        cot,
        combos
    );

    if (!ve)
    {
        cout << "Thanh toan khong thanh cong.\n";
        return;
    }

    cout << "\n========== HOA DON THANH TOAN ==========\n";
    cout << ve->xuatThongTin() << '\n';
    cout << "----------------------------------------\n";
    cout << "Tong thanh toan: "
         << fixed << setprecision(0)
         << ve->tinhTien() << " VND\n";
    cout << "========================================\n";
}

// ==================================================
// CHUC NANG 5: LEN LICH CHIEU
// ==================================================

void lenLichChieu(CinemaSystemManager& manager)
{
    cout << "\n========== LEN LICH SUAT CHIEU MOI ==========\n";

    const auto& dsPhim = manager.getDanhSachPhim();
    if (dsPhim.empty())
    {
        cout << "Chua co phim nao trong he thong!\n";
        return;
    }

    const auto& dsRap = manager.getDanhSachRap();
    if (dsRap.empty())
    {
        cout << "Chua co cum rap nao trong he thong!\n";
        return;
    }

    cout << "\n--- CHON PHIM ---\n";
    for (size_t i = 0; i < dsPhim.size(); ++i)
    {
        cout << i + 1 << ". " << dsPhim[i]->getMaPhim() << " - " << dsPhim[i]->getTenPhim()
             << " (" << dsPhim[i]->getThoiLuongPhut() << " phut)\n";
    }
    int chonPhim = nhapSoNguyen("Chon phim (1-" + to_string(dsPhim.size()) + "): ", 1);
    if (chonPhim > static_cast<int>(dsPhim.size()))
    {
        cout << "Lua chon phim khong hop le.\n";
        return;
    }
    auto phim = dsPhim[chonPhim - 1];

    cout << "\n--- CHON RAP CHIEU ---\n";
    for (size_t i = 0; i < dsRap.size(); ++i)
    {
        cout << i + 1 << ". " << dsRap[i]->getMaRap() << " - " << dsRap[i]->getTenRap() << '\n';
    }
    int chonRap = nhapSoNguyen("Chon rap (1-" + to_string(dsRap.size()) + "): ", 1);
    if (chonRap > static_cast<int>(dsRap.size()))
    {
        cout << "Lua chon rap khong hop le.\n";
        return;
    }
    auto rap = dsRap[chonRap - 1];

    const auto& dsPhong = rap->getDanhSachPhong();
    if (dsPhong.empty())
    {
        cout << "Rap " << rap->getTenRap() << " chua co phong chieu nao!\n";
        return;
    }

    cout << "\n--- CHON PHONG CHIEU ---\n";
    for (size_t i = 0; i < dsPhong.size(); ++i)
    {
        cout << i + 1 << ". " << dsPhong[i]->getMaPhong() << " - " << dsPhong[i]->getTenPhong()
             << " (" << dsPhong[i]->getTenLoaiPhong() << ")\n";
    }
    int chonPhong = nhapSoNguyen("Chon phong (1-" + to_string(dsPhong.size()) + "): ", 1);
    if (chonPhong > static_cast<int>(dsPhong.size()))
    {
        cout << "Lua chon phong khong hop le.\n";
        return;
    }
    auto phong = dsPhong[chonPhong - 1];

    string maSuat = nhapChuoi("\nNhap ma suat chieu moi (vi du SC04): ");
    if (manager.timSuatChieu(maSuat))
    {
        cout << "Loi: Ma suat chieu '" << maSuat << "' da ton tai trong he thong!\n";
        return;
    }

    cout << "Nhap thoi gian bat dau chieu (dinh dang dd/MM/yyyy HH:mm, vi du: 25/10/2026 19:30):\n";
    string strTime = nhapChuoi("Thoi gian: ");
    DateTime batDau = ThoiGian::tuChuoi(strTime);
    if (batDau.getNam() < 2000 || batDau.getNam() > 2100)
    {
        cout << "Thoi gian khong hop le hoac sai dinh dang dd/MM/yyyy HH:mm!\n";
        return;
    }

    auto suatMoi = SuatChieuFactory::taoSuatChieu(maSuat, phim, phong, batDau);
    manager.lenLichChieu(suatMoi);

    cout << "\n[THANH CONG] Da len lich suat chieu moi!\n";
    cout << "Ma suat  : " << suatMoi->getMaSuatChieu() << '\n';
    cout << "Phim     : " << phim->getTenPhim() << '\n';
    cout << "Phong    : " << phong->getTenPhong() << " (" << phong->getTenLoaiPhong() << ")\n";
    cout << "Bat dau  : " << suatMoi->getThoiGianBatDau().toString() << '\n';
    cout << "Ket thuc : " << suatMoi->getThoiGianKetThuc().toString() << '\n';
}

// ==================================================
// CHUC NANG 6: THONG KE DOANH THU
// ==================================================

void thongKeDoanhThu(CinemaSystemManager& manager)
{
    cout << "\n========== THONG KE DOANH THU ==========\n";
    cout << "1. Thong ke theo phim\n";
    cout << "2. Thong ke theo phong chieu\n";
    cout << "3. Thong ke theo suat chieu\n";
    cout << "4. Xuat bao cao doanh thu ra file text\n";

    int luaChon = nhapSoNguyen("Lua chon (1-4): ", 1);

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
            cout << "[THANH CONG] Da xuat bao cao doanh thu ra file: " << path << '\n';
        }
        else
        {
            cout << "[THAT BAI] Khong the ghi file bao cao.\n";
        }
    }
    else
    {
        cout << "Lua chon khong hop le.\n";
    }
}

// ==================================================
// HAM MAIN
// ==================================================

int main()
{
    try
    {
        CinemaSystemManager& manager =
            CinemaSystemManager::getInstance();

        manager.khoiTaoDuLieuTuFile();

        cout << "Khoi tao du lieu he thong thanh cong.\n";

        int luaChon = -1;

        while (luaChon != 0)
        {
            hienThiMenuChinh();

            luaChon = nhapSoNguyen("Nhap lua chon: ", 0);

            try
            {
                switch (luaChon)
                {
                    case 1:
                        xemDanhSachPhim(manager);
                        break;

                    case 2:
                        xemSoDoGhe(manager);
                        break;

                    case 3:
                        giuChoGhe(manager);
                        break;

                    case 4:
                        thanhToanVe(manager);
                        break;

                    case 5:
                        lenLichChieu(manager);
                        break;

                    case 6:
                        thongKeDoanhThu(manager);
                        break;

                    case 0:
                        manager.luuDuLieuHeThong();
                        cout << "Da yeu cau luu du lieu. Tam biet!\n";
                        break;

                    default:
                        cout << "Lua chon khong hop le.\n";
                        break;
                }
            }
            catch (const CinemaException& e)
            {
                cout << "[LOI NGHIEP VU] "
                     << e.what() << '\n';
            }
            catch (const exception& e)
            {
                cout << "[LOI HE THONG] "
                     << e.what() << '\n';
            }
        }
    }
    catch (const exception& e)
    {
        cerr << "[LOI KHOI TAO] "
             << e.what() << '\n';

        return 1;
    }

    return 0;
}
