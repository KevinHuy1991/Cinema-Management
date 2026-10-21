#pragma once

#include <memory>
#include <string>
#include "VeXemPhim.h"

using namespace std;

// Decorator bao mot VeXemPhim va chuyen tiep cac phuong thuc.
class VeDecorator : public VeXemPhim {
protected:
    shared_ptr<VeXemPhim> veBase;

public:
    explicit VeDecorator(shared_ptr<VeXemPhim> ve);
    virtual ~VeDecorator() = default;
    double tinhTien() const override;
    string xuatThongTin() const override;
    string getMaVe() const override;
    string getMaSuatChieu() const override;
    string getMaPhim() const override;
    string getMaPhong() const override;
    string getMaGhe() const override;
};
