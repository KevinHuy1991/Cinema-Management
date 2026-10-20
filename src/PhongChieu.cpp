
#include "PhongChieu.h"

#include <stdexcept>

// ===== Khoi tao phong chieu =====
PhongChieu::PhongChieu(
    const string& ma,
    const string& ten,
    int soHang,
    int soCot
)
    : maPhong(ma),
      tenPhong(ten),
      soHangGhe(soHang),
      soCotGhe(soCot)
{
    if (ma.empty())
    {
        throw invalid_argument("Ma phong khong duoc rong.");
    }

    if (ten.empty())
    {
        throw invalid_argument("Ten phong khong duoc rong.");
    }

    if (soHang <= 0 || soCot <= 0)
    {
        throw invalid_argument(
            "So hang va so cot ghe phai lon hon 0."
        );
    }
}

// ===== Getter =====
string PhongChieu::getMaPhong() const
{
    return maPhong;
}

string PhongChieu::getTenPhong() const
{
    return tenPhong;
}

int PhongChieu::getSoHangGhe() const
{
    return soHangGhe;
}

int PhongChieu::getSoCotGhe() const
{
    return soCotGhe;
}

// ==================================================
// Phong 2D
// ==================================================
Phong2D::Phong2D(
    const string& ma,
    const string& ten,
    int soHang,
    int soCot
)
    : PhongChieu(ma, ten, soHang, soCot)
{
}

double Phong2D::tinhPhuThuPhong() const
{
    return 0.0;
}

LoaiPhong Phong2D::getLoaiPhong() const
{
    return LoaiPhong::PHONG_2D;
}

string Phong2D::getTenLoaiPhong() const
{
    return "Phong 2D";
}

// ==================================================
// Phong 3D
// ==================================================
Phong3D::Phong3D(
    const string& ma,
    const string& ten,
    int soHang,
    int soCot
)
    : PhongChieu(ma, ten, soHang, soCot)
{
}

double Phong3D::tinhPhuThuPhong() const
{
    return 30000.0;
}

LoaiPhong Phong3D::getLoaiPhong() const
{
    return LoaiPhong::PHONG_3D;
}

string Phong3D::getTenLoaiPhong() const
{
    return "Phong 3D";
}

// ==================================================
// Phong IMAX
// ==================================================
PhongIMAX::PhongIMAX(
    const string& ma,
    const string& ten,
    int soHang,
    int soCot
)
    : PhongChieu(ma, ten, soHang, soCot)
{
}

double PhongIMAX::tinhPhuThuPhong() const
{
    return 70000.0;
}

LoaiPhong PhongIMAX::getLoaiPhong() const
{
    return LoaiPhong::PHONG_IMAX;
}

string PhongIMAX::getTenLoaiPhong() const
{
    return "Phong IMAX";
}
