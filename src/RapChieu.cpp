#include "RapChieu.h"

RapChieu::RapChieu(const string& ma, const string& ten, const string& dc)
    : maRap(ma), tenRap(ten), diaChi(dc) {}

void RapChieu::themPhongChieu(shared_ptr<PhongChieu> phong) {
    if (phong) danhSachPhong.push_back(phong);
}

bool RapChieu::xoaPhongChieu(const string& maPhong) {
    for (auto it = danhSachPhong.begin(); it != danhSachPhong.end(); ++it) {
        if ((*it) && (*it)->getMaPhong() == maPhong) {
            danhSachPhong.erase(it);
            return true;
        }
    }
    return false;
}

shared_ptr<PhongChieu> RapChieu::timPhongChieu(const string& maPhong) const {
    for (const auto& phong : danhSachPhong) {
        if (phong && phong->getMaPhong() == maPhong) return phong;
    }
    return nullptr;
}

void RapChieu::hienThiThongTin() const {
    cout << "Ma rap: " << maRap << "\n"
         << "Ten rap: " << tenRap << "\n"
         << "Dia chi: " << diaChi << "\n"
         << "So phong chieu: " << getSoLuongPhong() << "\n";
    for (const auto& phong : danhSachPhong) {
        if (phong) {
            cout << "  - " << phong->getMaPhong() << " | " << phong->getTenPhong()
                 << " | " << phong->getTenLoaiPhong()
                 << " | " << phong->getSoHangGhe() << "x" << phong->getSoCotGhe()
                 << " | Phu thu: " << static_cast<long long>(phong->tinhPhuThuPhong()) << " VND\n";
        }
    }
}
