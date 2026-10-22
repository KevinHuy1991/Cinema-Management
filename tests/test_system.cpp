#include <iostream>
#include <cassert>
#include <memory>
#include <vector>
#include <cmath>

#include "CinemaSystemManager.h"
#include "SuatChieuFactory.h"
#include "Phim.h"
#include "PhongChieu.h"
#include "RapChieu.h"
#include "Ghe.h"
#include "SuatChieu.h"
#include "VeXemPhim.h"
#include "VeDecorator.h"
#include "ComboBapNuoc.h"
#include "TimeUtils.h"

using namespace std;

void testDecorator() {
    cout << "[TEST] 1. Kiem thu Decorator Pattern cho VeXemPhim...\n";
    auto phim = make_shared<Phim>("P01", "Dune 2", "Sci-Fi", 160, 16, 100000.0);
    auto phong = make_shared<Phong3D>("P3D_01", "Phong 3D", 10, 12); // Phu thu 30,000 VND
    auto ghe = make_shared<GheVIP>(5, 5, "F6"); // Phu thu 20,000 VND
    
    MaTranGhe mt(10, vector<shared_ptr<Ghe>>(12, ghe));
    auto sc = make_shared<SuatChieu>("SC_TEST", phim, phong, DateTime(20, 10, 2026, 19, 0), mt);
    
    shared_ptr<VeXemPhim> ve = make_shared<VeCoBan>("VE001", sc, ghe);
    // 100k + 30k + 20k = 150k
    assert(abs(ve->tinhTien() - 150000.0) < 1e-3);
    assert(ve->getMaVe() == "VE001");
    assert(ve->getMaPhim() == "P01");
    assert(ve->getMaPhong() == "P3D_01");
    assert(ve->getMaGhe() == "F6");

    // Them Combo Bap Nuoc 1: 75,000 VND x 1
    ve = make_shared<ComboBapNuoc>(ve, "Combo Don", 75000.0, 1);
    assert(abs(ve->tinhTien() - 225000.0) < 1e-3);
    assert(ve->getMaVe() == "VE001");

    // Them Combo Bap Nuoc 2: 105,000 VND x 2 = 210,000 VND
    ve = make_shared<ComboBapNuoc>(ve, "Combo Doi", 105000.0, 2);
    // 225k + 210k = 435k
    assert(abs(ve->tinhTien() - 435000.0) < 1e-3);
    assert(ve->getMaVe() == "VE001");
    cout << "   -> Decorator Pattern hoat dong chinh xac 100%!\n";
}

void testFactoryAndSeats() {
    cout << "[TEST] 2. Kiem thu Factory Method va Bo cuc ghe...\n";
    auto phong2D = make_shared<Phong2D>("P2D", "Phong 2D", 8, 10);
    auto phong3D = make_shared<Phong3D>("P3D", "Phong 3D", 10, 12);
    auto phongIMAX = make_shared<PhongIMAX>("PIMAX", "Phong IMAX", 12, 16);

    auto mt2D = SuatChieuFactory::khoiTaoMaTranGhe(phong2D);
    assert(mt2D.size() == 8 && mt2D[0].size() == 10);

    auto mt3D = SuatChieuFactory::khoiTaoMaTranGhe(phong3D);
    assert(mt3D.size() == 10 && mt3D[0].size() == 12);

    auto mtIMAX = SuatChieuFactory::khoiTaoMaTranGhe(phongIMAX);
    assert(mtIMAX.size() == 12 && mtIMAX[0].size() == 16);

    // Kiem tra hang cuoi cua IMAX la ghe Sweetbox
    int hangCuoi = 11;
    auto gheDoi = mtIMAX[hangCuoi][0];
    assert(gheDoi != nullptr);
    assert(gheDoi->getLoaiGhe() == "Ghe Sweetbox");
    // O ke tiep [hangCuoi][1] tro cung doi tuong GheDoi
    assert(mtIMAX[hangCuoi][0] == mtIMAX[hangCuoi][1]);

    cout << "   -> Factory Method tao so do ghe thanh cong!\n";
}

void testScheduleConflict() {
    cout << "[TEST] 3. Kiem thu Logic Trung Lich chieu...\n";
    auto phim1 = make_shared<Phim>("P01", "Dune 2", "Sci-Fi", 120, 16, 100000.0);
    auto phim2 = make_shared<Phim>("P02", "Panda 4", "Cartoon", 90, 0, 80000.0);
    auto phong = make_shared<Phong2D>("P2D_01", "Phong 2D", 8, 10);

    // Suat 1: 18:00 -> 18:00 + 120p + 15p nghi = 20:15
    auto sc1 = SuatChieuFactory::taoSuatChieu("SC01", phim1, phong, DateTime(20, 10, 2026, 18, 0));
    // Suat 2 trung gio: 19:00 -> 20:45 cung phong
    auto sc2 = SuatChieuFactory::taoSuatChieu("SC02", phim2, phong, DateTime(20, 10, 2026, 19, 0));
    // Suat 3 khong trung gio: 20:30 cung phong
    auto sc3 = SuatChieuFactory::taoSuatChieu("SC03", phim2, phong, DateTime(20, 10, 2026, 20, 30));

    assert(sc1->kiemTraTrungLich(*sc2) == true);
    assert(sc1->kiemTraTrungLich(*sc3) == false);
    cout << "   -> Logic kiem tra trung lich chieu hoat dong chuan xac!\n";
}

void testManagerAndReports() {
    cout << "[TEST] 4. Kiem thu CinemaSystemManager & Thong ke...\n";
    auto& manager = CinemaSystemManager::getInstance();
    manager.khoiTaoDuLieuTuFile();

    assert(!manager.getDanhSachPhim().empty());
    assert(!manager.getDanhSachRap().empty());
    assert(!manager.getDanhSachSuatChieu().empty());

    // Thu giu ghe va thanh toan
    string maSuat = manager.getDanhSachSuatChieu()[0]->getMaSuatChieu();
    manager.giuChoGhe(maSuat, 0, 0);

    vector<pair<string, double>> combos = {{"Combo Bap Nuoc Don", 75000.0}};
    auto ve = manager.thanhToanVe(maSuat, 0, 0, combos);
    assert(ve != nullptr);
    assert(ve->tinhTien() > 0);

    // Thong ke theo phim, phong chieu, suat chieu
    auto tkPhim = manager.thongKeDoanhThu(TieuChiThongKe::THEO_PHIM);
    assert(tkPhim.getTongSoVe() >= 1);
    assert(tkPhim.getTongDoanhThu() > 0);

    auto tkPhong = manager.thongKeDoanhThu(TieuChiThongKe::THEO_PHONG_CHIEU);
    assert(tkPhong.getTongSoVe() >= 1);

    auto tkSuat = manager.thongKeDoanhThu(TieuChiThongKe::THEO_SUAT_CHIEU);
    assert(tkSuat.getTongSoVe() >= 1);

    bool okXuat = manager.xuatBaoCaoDoanhThuFile("data/test_report.txt", TieuChiThongKe::THEO_PHIM);
    assert(okXuat == true);

    cout << "   -> CinemaSystemManager va Thong ke hoat dong hoan hao!\n";
}

int main() {
    cout << "====================================================\n";
    cout << "    BAT DAU KIEM THU TOAN DIEN HE THONG CINEMA\n";
    cout << "====================================================\n";
    testDecorator();
    testFactoryAndSeats();
    testScheduleConflict();
    testManagerAndReports();
    cout << "====================================================\n";
    cout << "    TAT CA 4/4 MODULES DA VUOT QUA KIEM THU (PASS)!\n";
    cout << "====================================================\n";
    return 0;
}
