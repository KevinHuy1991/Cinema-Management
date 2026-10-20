
#pragma once

#include <iostream>
#include <string>

using namespace std;

// ===== Loai phong chieu =====
enum class LoaiPhong
{
    PHONG_2D,
    PHONG_3D,
    PHONG_IMAX,
    P2D = PHONG_2D,
    P3D = PHONG_3D,
    IMAX = PHONG_IMAX
};

// ===== Lop co so truu tuong PhongChieu =====
class PhongChieu
{
protected:
    string maPhong;
    string tenPhong;
    int soHangGhe;
    int soCotGhe;

public:
    PhongChieu(
        const string& ma,
        const string& ten,
        int soHang,
        int soCot
    );

    virtual ~PhongChieu() = default;

    // Cac phuong thuc thuan ao
    virtual double tinhPhuThuPhong() const = 0;
    virtual LoaiPhong getLoaiPhong() const = 0;
    virtual string getTenLoaiPhong() const = 0;

    // Getter
    string getMaPhong() const;
    string getTenPhong() const;
    int getSoHangGhe() const;
    int getSoCotGhe() const;

    // Alias tien ich tuong thich nguoc
    LoaiPhong getLoai() const { return getLoaiPhong(); }
    int getSoHang() const { return getSoHangGhe(); }
    int getSoCot() const { return getSoCotGhe(); }
};

// ===== Phong 2D =====
class Phong2D : public PhongChieu
{
public:
    Phong2D(
        const string& ma,
        const string& ten,
        int soHang = 8,
        int soCot = 10
    );

    double tinhPhuThuPhong() const override;
    LoaiPhong getLoaiPhong() const override;
    string getTenLoaiPhong() const override;
};

// ===== Phong 3D =====
class Phong3D : public PhongChieu
{
public:
    Phong3D(
        const string& ma,
        const string& ten,
        int soHang = 10,
        int soCot = 12
    );

    double tinhPhuThuPhong() const override;
    LoaiPhong getLoaiPhong() const override;
    string getTenLoaiPhong() const override;
};

// ===== Phong IMAX =====
class PhongIMAX : public PhongChieu
{
public:
    PhongIMAX(
        const string& ma,
        const string& ten,
        int soHang = 12,
        int soCot = 16
    );

    double tinhPhuThuPhong() const override;
    LoaiPhong getLoaiPhong() const override;
    string getTenLoaiPhong() const override;
};
