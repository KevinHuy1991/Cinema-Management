#include "VeDecorator.h"

#include <stdexcept>
#include <utility>

using namespace std;

VeDecorator::VeDecorator(shared_ptr<VeXemPhim> ve)
    : veBase(std::move(ve)) {
    if (!veBase) {
        throw invalid_argument("Khong the trang tri mot ve rong");
    }
}

double VeDecorator::tinhTien() const { return veBase->tinhTien(); }
string VeDecorator::xuatThongTin() const { return veBase->xuatThongTin(); }
string VeDecorator::getMaVe() const { return veBase->getMaVe(); }
string VeDecorator::getMaSuatChieu() const {
    return veBase->getMaSuatChieu();
}
string VeDecorator::getMaPhim() const { return veBase->getMaPhim(); }
string VeDecorator::getMaPhong() const { return veBase->getMaPhong(); }
string VeDecorator::getMaGhe() const { return veBase->getMaGhe(); }
