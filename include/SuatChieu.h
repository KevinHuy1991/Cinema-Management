#ifndef SUAT_CHIEU_H
#define SUAT_CHIEU_H

#include <string>
#include "Phim.h"
#include "TimeUtils.h"

enum class TrangThaiSuatChieu { SAP_CHIEU, DANG_BAN, HET_VE, DA_KET_THUC };

std::string chuyenTrangThaiSuatChieu(TrangThaiSuatChieu trangThai);

class SuatChieu {
private:
    std::string maSuat;
    std::string maPhong;
    const Phim* phim;
    ThoiGian gioChieu;
    long long giaVeCoBan;
    TrangThaiSuatChieu trangThai;

public:
    SuatChieu();
    SuatChieu(const std::string& maSuat, const std::string& maPhong,
              const Phim* phim, const ThoiGian& gioChieu, long long giaVeCoBan);

    std::string getMaSuat() const { return maSuat; }
    std::string getMaPhong() const { return maPhong; }
    const Phim* getPhim() const { return phim; }
    ThoiGian getGioChieu() const { return gioChieu; }
    long long getGiaVeCoBan() const { return giaVeCoBan; }
    TrangThaiSuatChieu getTrangThai() const { return trangThai; }

    void setMaSuat(const std::string& ma);
    void setMaPhong(const std::string& maPhongMoi);
    bool setPhim(const Phim* phimMoi);
    bool setGioChieu(const ThoiGian& gio);
    bool setGiaVeCoBan(long long gia);
    void setTrangThai(TrangThaiSuatChieu trangThaiMoi);

    ThoiGian getGioKetThuc() const;
    bool daChieuXong() const;

    // Hai suat chieu trung lich khi cung phong va khoang thoi gian chieu giao nhau
    bool kiemTraTrungLich(const SuatChieu& khac) const;

    void nhap();
    void hienThi() const;
    std::string toString() const;
};

#endif
