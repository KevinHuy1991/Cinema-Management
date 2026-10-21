#include "SuatChieu.h"

#include <iostream>
#include <limits>

std::string chuyenTrangThaiSuatChieu(TrangThaiSuatChieu trangThai) {
    switch (trangThai) {
        case TrangThaiSuatChieu::SAP_CHIEU: return "Sap chieu";
        case TrangThaiSuatChieu::DANG_BAN: return "Dang ban";
        case TrangThaiSuatChieu::HET_VE: return "Het ve";
        case TrangThaiSuatChieu::DA_KET_THUC: return "Da ket thuc";
    }
    return "";
}

SuatChieu::SuatChieu()
    : phim(nullptr), giaVeCoBan(0), trangThai(TrangThaiSuatChieu::SAP_CHIEU) {}

SuatChieu::SuatChieu(const std::string& ma, const std::string& phong,
                     const Phim* p, const ThoiGian& gio, long long gia)
    : SuatChieu() {
    setMaSuat(ma);
    setMaPhong(phong);
    setPhim(p);
    setGioChieu(gio);
    setGiaVeCoBan(gia);
}

void SuatChieu::setMaSuat(const std::string& ma) { maSuat = ma; }
void SuatChieu::setMaPhong(const std::string& maPhongMoi) { maPhong = maPhongMoi; }

bool SuatChieu::setPhim(const Phim* phimMoi) {
    if (phimMoi == nullptr) return false;
    phim = phimMoi;
    return true;
}

bool SuatChieu::setGioChieu(const ThoiGian& gio) {
    gioChieu = gio;
    return true;
}

bool SuatChieu::setGiaVeCoBan(long long gia) {
    if (gia < 0) return false;
    giaVeCoBan = gia;
    return true;
}

void SuatChieu::setTrangThai(TrangThaiSuatChieu trangThaiMoi) { trangThai = trangThaiMoi; }

ThoiGian SuatChieu::getGioKetThuc() const {
    if (phim == nullptr) return gioChieu;
    return gioChieu + phim->getThoiLuongPhut();
}

bool SuatChieu::daChieuXong() const {
    if (trangThai == TrangThaiSuatChieu::DA_KET_THUC) return true;
    ThoiGian bayGio;
    return getGioKetThuc() < bayGio;
}

bool SuatChieu::kiemTraTrungLich(const SuatChieu& khac) const {
    if (maPhong.empty() || maPhong != khac.maPhong) return false;
    if (phim == nullptr || khac.phim == nullptr) return false;
    return TimeUtils::kiemTraTrungLich(gioChieu, phim->getThoiLuongPhut(),
                                       khac.gioChieu, khac.phim->getThoiLuongPhut());
}

void SuatChieu::nhap() {
    std::cout << "Nhap ma suat chieu: ";
    std::getline(std::cin, maSuat);
    std::cout << "Nhap ma phong: ";
    std::getline(std::cin, maPhong);

    std::string gio;
    std::cout << "Nhap gio chieu (dd/MM/yyyy HH:mm): ";
    std::getline(std::cin, gio);
    gioChieu = ThoiGian::tuChuoi(gio);

    long long gia;
    std::cout << "Nhap gia ve co ban: ";
    while (!(std::cin >> gia) || !setGiaVeCoBan(gia)) {
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "Gia ve khong hop le, nhap lai: ";
    }
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

void SuatChieu::hienThi() const {
    std::cout << "Ma suat: " << maSuat << "\n"
              << "Ma phong: " << maPhong << "\n"
              << "Phim: " << (phim ? phim->getTenPhim() : "(chua gan)") << "\n"
              << "Gio chieu: " << gioChieu << "\n"
              << "Gio ket thuc: " << getGioKetThuc() << "\n"
              << "Gia ve co ban: " << giaVeCoBan << " VND\n"
              << "Trang thai: " << chuyenTrangThaiSuatChieu(trangThai) << "\n";
}

std::string SuatChieu::toString() const {
    return maSuat + " | " + maPhong + " | " + gioChieu.toString() + " | " +
           (phim ? phim->getTenPhim() : "(chua gan)") + " | " +
           chuyenTrangThaiSuatChieu(trangThai);
}
