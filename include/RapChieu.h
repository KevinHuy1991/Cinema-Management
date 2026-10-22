#pragma once
#ifndef RAP_CHIEU_DEFINED
#define RAP_CHIEU_DEFINED

#include <iostream>
#include <memory>
#include <string>
#include <vector>
#include "PhongChieu.h"

using namespace std;

// Lop RapChieu: quan ly cum rap (thong tin chung + danh sach phong chieu)
class RapChieu {
private:
    string maRap;
    string tenRap;
    string diaChi;
    vector<shared_ptr<PhongChieu>> danhSachPhong;

public:
    RapChieu(const string& ma = "", const string& ten = "", const string& dc = "");

    string getMaRap() const { return maRap; }
    string getTenRap() const { return tenRap; }
    string getDiaChi() const { return diaChi; }
    void setTenRap(const string& ten) { tenRap = ten; }
    void setDiaChi(const string& dc) { diaChi = dc; }

    void themPhongChieu(shared_ptr<PhongChieu> phong);
    bool xoaPhongChieu(const string& maPhong);
    shared_ptr<PhongChieu> timPhongChieu(const string& maPhong) const;
    int getSoLuongPhong() const { return static_cast<int>(danhSachPhong.size()); }
    const vector<shared_ptr<PhongChieu>>& getDanhSachPhong() const { return danhSachPhong; }

    void hienThiThongTin() const;
};

#endif
