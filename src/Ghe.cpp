
#include "Ghe.h"

#include <stdexcept>
#include <utility>

// ===== Khoi tao ghe =====
Ghe::Ghe(int h, int c, const string& ma)
    : hang(h),
      cot(c),
      maGhe(ma),
      trangThai(TrangThaiGhe::TRONG),
      mocThoiGianGiu(system_clock::time_point{})
{
    if (h < 0 || c < 0)
    {
        throw invalid_argument("Hang va cot ghe khong duoc am.");
    }

    if (ma.empty())
    {
        throw invalid_argument("Ma ghe khong duoc rong.");
    }
}

// ===== Kiem tra trang thai =====
bool Ghe::isAvailable() const
{
    return trangThai == TrangThaiGhe::TRONG;
}

bool Ghe::isPending() const
{
    return trangThai == TrangThaiGhe::DANG_GIU_CHO;
}

// ===== Giu cho ghe =====
void Ghe::giuCho()
{
    if (!isAvailable())
    {
        throw SeatUnavailableException(
            "Ghe " + maGhe + " khong con trong."
        );
    }

    trangThai = TrangThaiGhe::DANG_GIU_CHO;
    mocThoiGianGiu = system_clock::now();
}

// ===== Xac nhan mua ghe =====
void Ghe::xacNhanMua()
{
    if (!isPending())
    {
        throw SeatUnavailableException(
            "Ghe " + maGhe + " chua duoc giu cho."
        );
    }

    trangThai = TrangThaiGhe::DA_BAN;
    mocThoiGianGiu = system_clock::time_point{};
}

// ===== Giai phong ghe =====
void Ghe::giaiPhongGhe()
{
    trangThai = TrangThaiGhe::TRONG;
    mocThoiGianGiu = system_clock::time_point{};
}

// ===== Getter =====
int Ghe::getHang() const
{
    return hang;
}

int Ghe::getCot() const
{
    return cot;
}

string Ghe::getMaGhe() const
{
    return maGhe;
}

TrangThaiGhe Ghe::getTrangThai() const
{
    return trangThai;
}

system_clock::time_point Ghe::getMocThoiGianGiu() const
{
    return mocThoiGianGiu;
}

// ===== Khoi phuc trang thai tu file =====
void Ghe::khoiPhucTrangThai(TrangThaiGhe tt, time_t mocGiuEpoch)
{
    switch (tt)
    {
        case TrangThaiGhe::TRONG:
        case TrangThaiGhe::DANG_GIU_CHO:
        case TrangThaiGhe::DA_BAN:
            break;

        default:
            throw invalid_argument("Trang thai ghe khong hop le.");
    }

    trangThai = tt;

    if (tt == TrangThaiGhe::DANG_GIU_CHO)
    {
        mocThoiGianGiu =
            system_clock::from_time_t(mocGiuEpoch);
    }
    else
    {
        mocThoiGianGiu = system_clock::time_point{};
    }
}

// ==================================================
// Ghe thuong
// ==================================================
GheThuong::GheThuong(int h, int c, const string& ma)
    : Ghe(h, c, ma)
{
}

double GheThuong::tinhPhuThuGhe() const
{
    return 0.0;
}

string GheThuong::getLoaiGhe() const
{
    return "Ghe Thuong";
}

string GheThuong::kyHieuHienThi() const
{
    return "[T]";
}

// ==================================================
// Ghe VIP
// ==================================================
GheVIP::GheVIP(int h, int c, const string& ma)
    : Ghe(h, c, ma)
{
}

double GheVIP::tinhPhuThuGhe() const
{
    return 20000.0;
}

string GheVIP::getLoaiGhe() const
{
    return "Ghe VIP";
}

string GheVIP::kyHieuHienThi() const
{
    return "[V]";
}

// ==================================================
// Ghe doi Sweetbox
// ==================================================
GheDoiSweetbox::GheDoiSweetbox(
    int h, int c, const string& ma)
    : Ghe(h, c, ma)
{
}

double GheDoiSweetbox::tinhPhuThuGhe() const
{
    return 50000.0;
}

string GheDoiSweetbox::getLoaiGhe() const
{
    return "Ghe Sweetbox";
}

string GheDoiSweetbox::kyHieuHienThi() const
{
    return "[S]";
}
