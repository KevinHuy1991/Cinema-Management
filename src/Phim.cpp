#include "Phim.h"

#include <iostream>
#include <limits>

std::string chuyenTrangThaiPhim(TrangThaiPhim trangThai) {
    switch (trangThai) {
        case TrangThaiPhim::SAP_CHIEU: return "Sap chieu";
        case TrangThaiPhim::DANG_CHIEU: return "Dang chieu";
        case TrangThaiPhim::NGUNG_CHIEU: return "Ngung chieu";
    }
    return "";
}

TrangThaiPhim chuyenTrangThaiPhimTuChuoi(const std::string& chuoi) {
    if (chuoi == "Dang chieu") return TrangThaiPhim::DANG_CHIEU;
    if (chuoi == "Ngung chieu") return TrangThaiPhim::NGUNG_CHIEU;
    return TrangThaiPhim::SAP_CHIEU;
}

Phim::Phim()
    : thoiLuongPhut(0), trangThai(TrangThaiPhim::SAP_CHIEU) {}

Phim::Phim(const std::string& ma, const std::string& ten, const std::string& loai,
           int phut, const std::string& tuoi)
    : Phim() {
    setMaPhim(ma);
    setTenPhim(ten);
    setTheLoai(loai);
    setThoiLuongPhut(phut);
    setDoTuoi(tuoi);
}

void Phim::setMaPhim(const std::string& ma) { maPhim = ma; }
void Phim::setTenPhim(const std::string& ten) { tenPhim = ten; }
void Phim::setTheLoai(const std::string& theLoaiMoi) { theLoai = theLoaiMoi; }

bool Phim::setThoiLuongPhut(int phut) {
    if (phut <= 0) return false;
    thoiLuongPhut = phut;
    return true;
}

void Phim::setNgonNgu(const std::string& ngonNguMoi) { ngonNgu = ngonNguMoi; }
void Phim::setQuocGia(const std::string& quocGiaMoi) { quocGia = quocGiaMoi; }

bool Phim::setDoTuoi(const std::string& doTuoiMoi) {
    if (doTuoiMoi != "P" && doTuoiMoi != "C13" && doTuoiMoi != "C16" && doTuoiMoi != "C18") {
        return false;
    }
    doTuoi = doTuoiMoi;
    return true;
}

bool Phim::setNgayKhoiChieu(const ThoiGian& ngay) {
    ngayKhoiChieu = ngay;
    return true;
}

void Phim::setMoTa(const std::string& moTaMoi) { moTa = moTaMoi; }
void Phim::setTrangThai(TrangThaiPhim trangThaiMoi) { trangThai = trangThaiMoi; }

bool Phim::dangDuocChieu() const {
    return trangThai == TrangThaiPhim::DANG_CHIEU;
}

void Phim::nhap() {
    std::cout << "Nhap ma phim: ";
    std::getline(std::cin, maPhim);
    std::cout << "Nhap ten phim: ";
    std::getline(std::cin, tenPhim);
    std::cout << "Nhap the loai: ";
    std::getline(std::cin, theLoai);

    int phut;
    std::cout << "Nhap thoi luong (phut): ";
    while (!(std::cin >> phut) || !setThoiLuongPhut(phut)) {
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "Thoi luong khong hop le, nhap lai: ";
    }
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

    std::cout << "Nhap ngon ngu: ";
    std::getline(std::cin, ngonNgu);
    std::cout << "Nhap quoc gia: ";
    std::getline(std::cin, quocGia);

    std::string tuoi;
    std::cout << "Nhap do tuoi (P/C13/C16/C18): ";
    while (std::getline(std::cin, tuoi) && !setDoTuoi(tuoi)) {
        std::cout << "Do tuoi khong hop le, nhap lai: ";
    }

    std::cout << "Nhap mo ta: ";
    std::getline(std::cin, moTa);
}

void Phim::hienThi() const {
    std::cout << "Ma phim: " << maPhim << "\n"
              << "Ten phim: " << tenPhim << "\n"
              << "The loai: " << theLoai << "\n"
              << "Thoi luong: " << thoiLuongPhut << " phut\n"
              << "Ngon ngu: " << ngonNgu << "\n"
              << "Quoc gia: " << quocGia << "\n"
              << "Do tuoi: " << doTuoi << "\n"
              << "Ngay khoi chieu: " << ngayKhoiChieu << "\n"
              << "Trang thai: " << chuyenTrangThaiPhim(trangThai) << "\n"
              << "Mo ta: " << moTa << "\n";
}

std::string Phim::toString() const {
    return maPhim + " | " + tenPhim + " | " + theLoai + " | " +
           std::to_string(thoiLuongPhut) + " phut | " + doTuoi + " | " +
           chuyenTrangThaiPhim(trangThai);
}
