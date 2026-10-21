#include "SuatChieu.h"

#include <chrono>
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
    : phim(nullptr), phongChieu(nullptr), giaVeCoBan(0), trangThai(TrangThaiSuatChieu::SAP_CHIEU) {}

SuatChieu::SuatChieu(const std::string& ma, const std::string& phong,
                     const Phim* p, const ThoiGian& gio, long long gia)
    : SuatChieu() {
    setMaSuat(ma);
    setMaPhong(phong);
    setPhim(p);
    setGioChieu(gio);
    setGiaVeCoBan(gia);
}

SuatChieu::SuatChieu(const std::string& maSuat,
                     std::shared_ptr<Phim> phim,
                     std::shared_ptr<PhongChieu> phong,
                     const DateTime& thoiGianBatDau,
                     std::vector<std::vector<std::shared_ptr<Ghe>>> maTran)
    : maSuat(maSuat),
      phim(phim),
      phongChieu(phong),
      gioChieu(thoiGianBatDau),
      giaVeCoBan(phim ? static_cast<long long>(phim->getGiaVeCoBan()) : 0),
      trangThai(TrangThaiSuatChieu::DANG_BAN),
      maTranGhe(std::move(maTran)) {
    if (phong) {
        maPhong = phong->getMaPhong();
    }
}

std::string SuatChieu::getMaPhong() const {
    if (phongChieu) return phongChieu->getMaPhong();
    return maPhong;
}

std::shared_ptr<Ghe> SuatChieu::getGhe(int hang, int cot) const {
    if (hang < 0 || hang >= static_cast<int>(maTranGhe.size())) return nullptr;
    if (cot < 0 || cot >= static_cast<int>(maTranGhe[hang].size())) return nullptr;
    return maTranGhe[hang][cot];
}

void SuatChieu::giuCho(int hang, int cot) {
    auto ghe = getGhe(hang, cot);
    if (!ghe || !ghe->isAvailable()) {
        throw SeatUnavailableException("Ghe da duoc dat hoac dang duoc giu cho!");
    }
    ghe->giuCho();
}

void SuatChieu::xacNhanThanhToanGhe(int hang, int cot) {
    auto ghe = getGhe(hang, cot);
    if (!ghe) {
        throw CinemaException("Toa do ghe khong hop le!");
    }
    if (ghe->getTrangThai() != TrangThaiGhe::DANG_GIU_CHO) {
        throw CinemaException("Ghe chua duoc giu cho hoac khong hop le de thanh toan!");
    }
    ghe->xacNhanMua();
}

void SuatChieu::huyGheQuaHan() {
    auto bayGio = std::chrono::system_clock::now();
    for (auto& hangGhe : maTranGhe) {
        for (auto& ghe : hangGhe) {
            if (ghe && ghe->getTrangThai() == TrangThaiGhe::DANG_GIU_CHO) {
                auto moc = ghe->getMocThoiGianGiu();
                auto giay = std::chrono::duration_cast<std::chrono::seconds>(bayGio - moc).count();
                if (giay > 300) { // Qua 5 phut (300 giay)
                    ghe->giaiPhongGhe();
                }
            }
        }
    }
}

void SuatChieu::setMaSuat(const std::string& ma) { maSuat = ma; }
void SuatChieu::setMaPhong(const std::string& maPhongMoi) { maPhong = maPhongMoi; }

bool SuatChieu::setPhim(std::shared_ptr<Phim> phimMoi) {
    if (!phimMoi) return false;
    phim = phimMoi;
    return true;
}

bool SuatChieu::setPhim(const Phim* phimMoi) {
    if (phimMoi == nullptr) return false;
    phim = std::make_shared<Phim>(*phimMoi);
    return true;
}

bool SuatChieu::setPhongChieu(std::shared_ptr<PhongChieu> phongMoi) {
    phongChieu = phongMoi;
    if (phongMoi) maPhong = phongMoi->getMaPhong();
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
void SuatChieu::setMaTranGhe(std::vector<std::vector<std::shared_ptr<Ghe>>> maTran) {
    maTranGhe = std::move(maTran);
}

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
    std::string phong1 = getMaPhong();
    std::string phong2 = khac.getMaPhong();
    if (phong1.empty() || phong1 != phong2) return false;
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
              << "Ma phong: " << getMaPhong() << "\n"
              << "Phim: " << (phim ? phim->getTenPhim() : "(chua gan)") << "\n"
              << "Gio chieu: " << gioChieu << "\n"
              << "Gio ket thuc: " << getGioKetThuc() << "\n"
              << "Gia ve co ban: " << giaVeCoBan << " VND\n"
              << "Trang thai: " << chuyenTrangThaiSuatChieu(trangThai) << "\n";
}

std::string SuatChieu::toString() const {
    return maSuat + " | " + getMaPhong() + " | " + gioChieu.toString() + " | " +
           (phim ? phim->getTenPhim() : "(chua gan)") + " | " +
           chuyenTrangThaiSuatChieu(trangThai);
}
