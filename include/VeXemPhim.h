#pragma once

#include <memory>
#include <string>

#include "SuatChieu.h"
#include "Ghe.h"

using namespace std;

// Component goc (abstract) trong Decorator Pattern.
class VeXemPhim {
public:
    virtual ~VeXemPhim() = default;
    virtual double tinhTien() const = 0;
    virtual string xuatThongTin() const = 0;
    virtual string getMaVe() const = 0;
    virtual string getMaSuatChieu() const = 0;
    virtual string getMaPhim() const = 0;
    virtual string getMaPhong() const = 0;
    virtual string getMaGhe() const = 0;
};

// ConcreteComponent: gia ve = gia phim + phu thu phong + phu thu ghe.
class VeCoBan : public VeXemPhim {
private:
    string maVe;
    shared_ptr<SuatChieu> suatChieu;
    shared_ptr<Ghe> gheNgoi;

public:
    VeCoBan(const string& ma, shared_ptr<SuatChieu> sc, shared_ptr<Ghe> ghe);
    double tinhTien() const override;
    string xuatThongTin() const override;
    string getMaVe() const override;
    string getMaSuatChieu() const override;
    string getMaPhim() const override;
    string getMaPhong() const override;
    string getMaGhe() const override;
};
