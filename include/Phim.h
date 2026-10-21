#ifndef PHIM_H
#define PHIM_H

#include <string>
#include "TimeUtils.h"

enum class TrangThaiPhim { SAP_CHIEU, DANG_CHIEU, NGUNG_CHIEU };

std::string chuyenTrangThaiPhim(TrangThaiPhim trangThai);
TrangThaiPhim chuyenTrangThaiPhimTuChuoi(const std::string& chuoi);

class Phim {
private:
    std::string maPhim;
    std::string tenPhim;
    std::string theLoai;
    int thoiLuongPhut;
    std::string ngonNgu;
    std::string quocGia;
    std::string doTuoi;
    ThoiGian ngayKhoiChieu;
    std::string moTa;
    TrangThaiPhim trangThai;

public:
    Phim();
    Phim(const std::string& maPhim, const std::string& tenPhim, const std::string& theLoai,
         int thoiLuongPhut, const std::string& doTuoi);

    std::string getMaPhim() const { return maPhim; }
    std::string getTenPhim() const { return tenPhim; }
    std::string getTheLoai() const { return theLoai; }
    int getThoiLuongPhut() const { return thoiLuongPhut; }
    std::string getNgonNgu() const { return ngonNgu; }
    std::string getQuocGia() const { return quocGia; }
    std::string getDoTuoi() const { return doTuoi; }
    ThoiGian getNgayKhoiChieu() const { return ngayKhoiChieu; }
    std::string getMoTa() const { return moTa; }
    TrangThaiPhim getTrangThai() const { return trangThai; }

    void setMaPhim(const std::string& ma);
    void setTenPhim(const std::string& ten);
    void setTheLoai(const std::string& theLoaiMoi);
    bool setThoiLuongPhut(int phut);
    void setNgonNgu(const std::string& ngonNguMoi);
    void setQuocGia(const std::string& quocGiaMoi);
    bool setDoTuoi(const std::string& doTuoiMoi);
    bool setNgayKhoiChieu(const ThoiGian& ngay);
    void setMoTa(const std::string& moTaMoi);
    void setTrangThai(TrangThaiPhim trangThaiMoi);

    bool dangDuocChieu() const;
    void nhap();
    void hienThi() const;
    std::string toString() const;
};

#endif
