#include "VeXemPhim.h"

#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <utility>

using namespace std;

VeCoBan::VeCoBan(const string& ma, shared_ptr<SuatChieu> sc,
                 shared_ptr<Ghe> ghe)
    : maVe(ma), suatChieu(std::move(sc)), gheNgoi(std::move(ghe)) {
    if (maVe.empty() || !suatChieu || !gheNgoi ||
        !suatChieu->getPhim() || !suatChieu->getPhongChieu()) {
        throw invalid_argument("Thong tin ve co ban khong hop le");
    }
}

double VeCoBan::tinhTien() const {
    return suatChieu->getPhim()->getGiaVeCoBan()
         + suatChieu->getPhongChieu()->tinhPhuThuPhong()
         + gheNgoi->tinhPhuThuGhe();
}

string VeCoBan::xuatThongTin() const {
    ostringstream out;
    out << "===== HOA DON VE XEM PHIM =====\n"
        << "Ma ve: " << getMaVe() << '\n'
        << "Ma suat chieu: " << getMaSuatChieu() << '\n'
        << "Ma phim: " << getMaPhim() << '\n'
        << "Ma phong: " << getMaPhong() << '\n'
        << "Ma ghe: " << getMaGhe() << '\n'
        << fixed << setprecision(0)
        << "Gia ve co ban: " << tinhTien() << " VND\n";
    return out.str();
}

string VeCoBan::getMaVe() const { return maVe; }
string VeCoBan::getMaSuatChieu() const { return suatChieu->getMaSuatChieu(); }
string VeCoBan::getMaPhim() const { return suatChieu->getPhim()->getMaPhim(); }
string VeCoBan::getMaPhong() const {
    return suatChieu->getPhongChieu()->getMaPhong();
}
string VeCoBan::getMaGhe() const { return gheNgoi->getMaGhe(); }
