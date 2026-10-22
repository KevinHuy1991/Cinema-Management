// src/SuatChieuFactory.cpp
#include "SuatChieuFactory.h"
#include <stdexcept>

// ---------- Hàm static dùng chung ----------
unique_ptr<SuatChieuFactory> SuatChieuFactory::layFactory(LoaiPhong loai) {
    switch (loai) {
        case LoaiPhong::PHONG_2D:   return make_unique<Suat2DFactory>();
        case LoaiPhong::PHONG_3D:   return make_unique<Suat3DFactory>();
        case LoaiPhong::PHONG_IMAX: return make_unique<SuatIMAXFactory>();
    }
    throw invalid_argument("Loai phong chieu khong hop le");
}

MaTranGhe SuatChieuFactory::khoiTaoMaTranGhe(shared_ptr<PhongChieu> phong) {
    if (!phong) throw invalid_argument("Phong chieu null");
    return layFactory(phong->getLoaiPhong())->taoMaTranGhe(*phong);
}

shared_ptr<SuatChieu> SuatChieuFactory::taoSuatChieu(
    const string& maSuat,
    shared_ptr<Phim> phim,
    shared_ptr<PhongChieu> phong,
    const DateTime& thoiGianBatDau) {
    if (!phim)  throw invalid_argument("Phim null");
    if (!phong) throw invalid_argument("Phong chieu null");
    if (maSuat.empty()) throw invalid_argument("Ma suat chieu rong");

    MaTranGhe maTran = khoiTaoMaTranGhe(phong);
    return make_shared<SuatChieu>(maSuat, phim, phong, thoiGianBatDau, std::move(maTran));
}

string SuatChieuFactory::taoMaGhe(int hang, int cot) {
    return string(1, static_cast<char>('A' + hang)) + to_string(cot + 1);
}

// ---------- Dựng ma trận theo cấu hình ----------
MaTranGhe SuatChieuFactory::dungMaTran(const PhongChieu& phong, const CauHinhSoDo& cfg) {
    const int soHang = phong.getSoHangGhe();
    const int soCot  = phong.getSoCotGhe();
    if (soHang <= 0 || soCot <= 0 || soHang > 26)
        throw invalid_argument("So hang/cot cua phong khong hop le");

    // làm tròn lên bằng số nguyên để tránh sai số số thực
    const int vipTu  = (soHang * cfg.vipTuPT  + 99) / 100;
    const int vipDen = (soHang * cfg.vipDenPT + 99) / 100;

    MaTranGhe mt(soHang, vector<shared_ptr<Ghe>>(soCot));

    for (int h = 0; h < soHang; ++h) {
        for (int c = 0; c < soCot; ++c) {
            const string ma = taoMaGhe(h, c);
            const bool hangCuoi = (h == soHang - 1) && soHang > 1;

            if (hangCuoi && c + 1 < soCot) {
                // ghế đôi: 1 đối tượng, hai ô liền kề cùng trỏ tới
                auto doi = make_shared<GheDoiSweetbox>(h, c, ma);
                mt[h][c] = doi;
                mt[h][c + 1] = doi;
                ++c;
            } else if (!hangCuoi && h >= vipTu && h < vipDen) {
                mt[h][c] = make_shared<GheVIP>(h, c, ma);
            } else {
                mt[h][c] = make_shared<GheThuong>(h, c, ma);
            }
        }
    }
    return mt;
}

// ---------- Concrete Creators ----------
MaTranGhe Suat2DFactory::taoMaTranGhe(const PhongChieu& phong) const {
    return dungMaTran(phong, {0, 0});     // không có VIP
}
MaTranGhe Suat3DFactory::taoMaTranGhe(const PhongChieu& phong) const {
    return dungMaTran(phong, {40, 70});   // VIP ở giữa
}
MaTranGhe SuatIMAXFactory::taoMaTranGhe(const PhongChieu& phong) const {
    return dungMaTran(phong, {30, 80});   // VIP rộng hơn
}
