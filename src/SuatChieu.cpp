#include "SuatChieu.h"

#include <chrono>
#include <limits>
#include <stdexcept>
#include <utility>

using namespace std;

// San pham: 300 giay. Chi doi khi chay test voi macro -D.
#ifndef CINEMA_GIU_GHE_TIMEOUT_SECONDS
#define CINEMA_GIU_GHE_TIMEOUT_SECONDS 300
#endif
static_assert(CINEMA_GIU_GHE_TIMEOUT_SECONDS > 0, "Timeout phai > 0");

namespace {
constexpr auto THOI_GIAN_GIU = chrono::seconds(CINEMA_GIU_GHE_TIMEOUT_SECONDS);
}

SuatChieu::SuatChieu(
    const string& maSuat, shared_ptr<Phim> p,
    shared_ptr<PhongChieu> phong, const DateTime& batDau,
    const vector<vector<shared_ptr<Ghe>>>& soDoGhe)
    : maSuatChieu(maSuat), phim(std::move(p)),
      phongChieu(std::move(phong)), thoiGianBatDau(batDau),
      thoiGianKetThuc(batDau), maTranGhe(soDoGhe) {
    if (maSuatChieu.empty() || !phim || !phongChieu) {
        throw invalid_argument("Ma suat, phim hoac phong khong hop le");
    }
    if (phim->getThoiLuongPhut() <= 0) {
        throw invalid_argument("Thoi luong phim phai lon hon 0");
    }
    thoiGianKetThuc = thoiGianBatDau.addMinutes(phim->getThoiLuongPhut() + 15);

    // Tu dong kiem tra ghe ngay ca khi khong co nguoi su dung.
    luongHuyTuDong = thread(&SuatChieu::chayBoDemTuDong, this);
}

SuatChieu::~SuatChieu() {
    {
        lock_guard<mutex> khoa(mutexGhe);
        dungLuong = true;
    }
    cvGhe.notify_all();
    if (luongHuyTuDong.joinable()) {
        luongHuyTuDong.join();
    }
}

// Goi khi DANG GIU mutexGhe. Khong duoc goi truc tiep tu thread khac.
void SuatChieu::quetGheQuaHanKhongKhoa() {
    const auto hienTai = chrono::system_clock::now();
    for (const auto& hang : maTranGhe) {
        for (const auto& ghe : hang) {
            if (ghe && ghe->isPending() &&
                hienTai >= ghe->getMocThoiGianGiu() + THOI_GIAN_GIU) {
                ghe->giaiPhongGhe();
            }
        }
    }
}

void SuatChieu::chayBoDemTuDong() {
    unique_lock<mutex> khoa(mutexGhe);
    while (!dungLuong) {
        quetGheQuaHanKhongKhoa();

        // Tim ghe dang giu co thoi diem het han SOM NHAT.
        auto hanSomNhat = chrono::system_clock::time_point::max();
        for (const auto& hang : maTranGhe) {
            for (const auto& ghe : hang) {
                if (ghe && ghe->isPending()) {
                    auto han = ghe->getMocThoiGianGiu() + THOI_GIAN_GIU;
                    if (han < hanSomNhat) hanSomNhat = han;
                }
            }
        }
        const uint64_t phienBanDaThay = phienBanTrangThai;

        if (hanSomNhat == chrono::system_clock::time_point::max()) {
            // Kiem tra lai moi 1 giay de xu ly trang thai vua nap tu file.
            cvGhe.wait_for(khoa, chrono::seconds(1), [&] {
                return dungLuong || phienBanTrangThai != phienBanDaThay;
            });
        } else {
            // Thuc day gan dung thoi diem 5 phut; khong can bam gi.
            cvGhe.wait_until(khoa, hanSomNhat, [&] {
                return dungLuong || phienBanTrangThai != phienBanDaThay;
            });
        }
    }
}

shared_ptr<Ghe> SuatChieu::getGhe(int hang, int cot) const {
    if (hang < 0 || hang >= static_cast<int>(maTranGhe.size()) ||
        cot < 0 || cot >= static_cast<int>(maTranGhe[hang].size())) {
        throw out_of_range("Vi tri ghe nam ngoai so do");
    }
    if (!maTranGhe[hang][cot]) {
        throw SeatUnavailableException("Vi tri ghe chua duoc khoi tao");
    }
    return maTranGhe[hang][cot];
}

TrangThaiGhe SuatChieu::layTrangThaiGheAnToan(int hang, int cot) const {
    lock_guard<mutex> khoa(mutexGhe);
    return getGhe(hang, cot)->getTrangThai();
}

void SuatChieu::huyGheQuaHan() {
    lock_guard<mutex> khoa(mutexGhe);
    quetGheQuaHanKhongKhoa();
}

bool SuatChieu::kiemTraTrangThaiGhe(int hang, int cot) {
    lock_guard<mutex> khoa(mutexGhe);
    quetGheQuaHanKhongKhoa();
    return getGhe(hang, cot)->isAvailable();
}

void SuatChieu::giuCho(int hang, int cot) {
    {
        lock_guard<mutex> khoa(mutexGhe);
        quetGheQuaHanKhongKhoa();
        auto ghe = getGhe(hang, cot);
        if (!ghe->isAvailable()) {
            throw SeatUnavailableException("Ghe da duoc giu hoac da ban");
        }
        ghe->giuCho(); // Luu moc thoi gian thuc trong Ghe::giuCho().
        ++phienBanTrangThai;
    }
    cvGhe.notify_one();
}

void SuatChieu::xacNhanThanhToanGhe(int hang, int cot) {
    {
        lock_guard<mutex> khoa(mutexGhe);
        quetGheQuaHanKhongKhoa(); // Het han thi KHONG duoc mua.
        auto ghe = getGhe(hang, cot);
        if (!ghe->isPending()) {
            throw SeatUnavailableException("Ghe khong o trang thai cho thanh toan");
        }
        ghe->xacNhanMua();
        ++phienBanTrangThai;
    }
    cvGhe.notify_one();
}

void SuatChieu::hienThiSoDoGhe() {
    lock_guard<mutex> khoa(mutexGhe);
    quetGheQuaHanKhongKhoa();
    cout << "\nSo do ghe - Suat chieu " << maSuatChieu << "\n";
    cout << "[T]/[V]/[S]: trong | [G]: dang giu | [B]: da ban\n";
    for (size_t h = 0; h < maTranGhe.size(); ++h) {
        cout << "Hang " << (h + 1) << ": ";
        for (const auto& ghe : maTranGhe[h]) {
            if (!ghe) cout << "[?] ";
            else if (ghe->isPending()) cout << "[G] ";
            else if (!ghe->isAvailable()) cout << "[B] ";
            else cout << ghe->kyHieuHienThi() << ' ';
        }
        cout << '\n';
    }
}

bool SuatChieu::kiemTraTrungLich(const SuatChieu& other) const {
    if (phongChieu->getMaPhong() != other.phongChieu->getMaPhong()) return false;
    return TimeUtils::isTimeOverlap(thoiGianBatDau, thoiGianKetThuc,
                                    other.thoiGianBatDau, other.thoiGianKetThuc);
}

string SuatChieu::getMaSuatChieu() const { return maSuatChieu; }
shared_ptr<Phim> SuatChieu::getPhim() const { return phim; }
shared_ptr<PhongChieu> SuatChieu::getPhongChieu() const { return phongChieu; }
DateTime SuatChieu::getThoiGianBatDau() const { return thoiGianBatDau; }
DateTime SuatChieu::getThoiGianKetThuc() const { return thoiGianKetThuc; }
const vector<vector<shared_ptr<Ghe>>>& SuatChieu::getMaTranGhe() const {
    return maTranGhe;
}
double SuatChieu::getGiaVeCoBan() const {
    return phim ? phim->getGiaVeCoBan() : 0.0;
}
