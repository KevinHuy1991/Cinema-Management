#include "ComboBapNuoc.h"

#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <utility>

using namespace std;

ComboBapNuoc::ComboBapNuoc(shared_ptr<VeXemPhim> ve,
                           const string& ten, double gia, int sl)
    : VeDecorator(std::move(ve)), tenCombo(ten), giaCombo(gia), soLuong(sl) {
    if (tenCombo.empty() || giaCombo < 0 || soLuong <= 0) {
        throw invalid_argument("Ten, gia hoac so luong combo khong hop le");
    }
}

double ComboBapNuoc::tinhTien() const {
    // Co the long nhieu decorator: cong don de quy qua veBase.
    return veBase->tinhTien() + giaCombo * soLuong;
}

string ComboBapNuoc::xuatThongTin() const {
    ostringstream out;
    out << veBase->xuatThongTin()
        << fixed << setprecision(0)
        << "Combo: " << tenCombo << " x" << soLuong
        << " - " << giaCombo * soLuong << " VND\n"
        << "Tam tinh: " << tinhTien() << " VND\n";
    return out.str();
}
