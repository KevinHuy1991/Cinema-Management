#pragma once

#include <memory>
#include <string>
#include "VeDecorator.h"

using namespace std;

// ConcreteDecorator: them gia combo vao ve da co.
class ComboBapNuoc : public VeDecorator {
private:
    string tenCombo;
    double giaCombo;
    int soLuong;

public:
    ComboBapNuoc(shared_ptr<VeXemPhim> ve,
                 const string& ten, double gia, int sl = 1);
    double tinhTien() const override;
    string xuatThongTin() const override;
};
