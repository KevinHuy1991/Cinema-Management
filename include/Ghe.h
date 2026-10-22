
#pragma once

#include <iostream>
#include <string>
#include <chrono>
#include <ctime>

#include "TimeUtils.h"

using namespace std;
using namespace std::chrono;

// ===== Trang thai ghe =====
enum class TrangThaiGhe
{
    TRONG = 0,
    DANG_GIU_CHO = 1,
    DA_BAN = 2
};

// ===== Lop co so truu tuong Ghe =====
class Ghe
{
protected:
    int hang;
    int cot;
    string maGhe;
    TrangThaiGhe trangThai;
    system_clock::time_point mocThoiGianGiu;

public:
    Ghe(int h, int c, const string& ma);
    virtual ~Ghe() = default;

    // Phuong thuc thuan ao
    virtual double tinhPhuThuGhe() const = 0;
    virtual string getLoaiGhe() const = 0;
    virtual string kyHieuHienThi() const = 0;

    // Xu ly trang thai ghe
    bool isAvailable() const;
    bool isPending() const;
    void giuCho();
    void xacNhanMua();
    void giaiPhongGhe();

    // Getter
    int getHang() const;
    int getCot() const;
    string getMaGhe() const;
    TrangThaiGhe getTrangThai() const;
    system_clock::time_point getMocThoiGianGiu() const;

    // Khoi phuc trang thai khi nap du lieu
    void khoiPhucTrangThai(TrangThaiGhe tt, time_t mocGiuEpoch);
};

// ===== Ghe thuong =====
class GheThuong : public Ghe
{
public:
    GheThuong(int h, int c, const string& ma);

    double tinhPhuThuGhe() const override;
    string getLoaiGhe() const override;
    string kyHieuHienThi() const override;
};

// ===== Ghe VIP =====
class GheVIP : public Ghe
{
public:
    GheVIP(int h, int c, const string& ma);

    double tinhPhuThuGhe() const override;
    string getLoaiGhe() const override;
    string kyHieuHienThi() const override;
};

// ===== Ghe doi Sweetbox =====
class GheDoiSweetbox : public Ghe
{
public:
    GheDoiSweetbox(int h, int c, const string& ma);

    double tinhPhuThuGhe() const override;
    string getLoaiGhe() const override;
    string kyHieuHienThi() const override;
};
