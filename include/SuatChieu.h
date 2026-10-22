#pragma once

#include <iostream>
#include <condition_variable>
#include <cstdint>
#include <mutex>
#include <thread>
#include <memory>
#include <string>
#include <vector>

#include "Phim.h"
#include "PhongChieu.h"
#include "Ghe.h"
#include "TimeUtils.h"

using namespace std;

// Suat chieu quan ly 1 ma tran ghe rieng (chi so hang/cot bat dau tu 0).
class SuatChieu {
private:
    string maSuatChieu;
    shared_ptr<Phim> phim;
    shared_ptr<PhongChieu> phongChieu;
    DateTime thoiGianBatDau;
    DateTime thoiGianKetThuc;
    vector<vector<shared_ptr<Ghe>>> maTranGhe;

    // Worker chay nen, bao ve nghiep vu ghe tranh tranh chap giua 2 luong.
    mutable mutex mutexGhe;
    condition_variable cvGhe;
    thread luongHuyTuDong;
    bool dungLuong = false;
    uint64_t phienBanTrangThai = 0;

    // Chi duoc goi khi da giu mutexGhe.
    void quetGheQuaHanKhongKhoa();
    void chayBoDemTuDong();

public:
    SuatChieu(const string& maSuat,
              shared_ptr<Phim> p,
              shared_ptr<PhongChieu> phong,
              const DateTime& batDau,
              const vector<vector<shared_ptr<Ghe>>>& soDoGhe);

    ~SuatChieu();

    // mutex/thread khong the copy; doi tuong duoc quan ly bang shared_ptr.
    SuatChieu(const SuatChieu&) = delete;
    SuatChieu& operator=(const SuatChieu&) = delete;

    // Chi doc (khong goi huy qua han), giup giao dien/test doc an toan.
    TrangThaiGhe layTrangThaiGheAnToan(int hang, int cot) const;
    bool kiemTraTrangThaiGhe(int hang, int cot);
    void giuCho(int hang, int cot);
    void xacNhanThanhToanGhe(int hang, int cot);
    void huyGheQuaHan();
    void hienThiSoDoGhe();
    bool kiemTraTrungLich(const SuatChieu& other) const;

    string getMaSuatChieu() const;
    shared_ptr<Phim> getPhim() const;
    shared_ptr<PhongChieu> getPhongChieu() const;
    DateTime getThoiGianBatDau() const;
    DateTime getThoiGianKetThuc() const;
    shared_ptr<Ghe> getGhe(int hang, int cot) const;
    const vector<vector<shared_ptr<Ghe>>>& getMaTranGhe() const;
    double getGiaVeCoBan() const;
};
