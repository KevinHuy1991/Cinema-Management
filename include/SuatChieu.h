#ifndef SUAT_CHIEU_H
#define SUAT_CHIEU_H

#include <string>
#include <vector>
#include <memory>
#include "Ghe.h"
#include "Phim.h"
#include "PhongChieu.h"
#include "TimeUtils.h"

enum class TrangThaiSuatChieu { SAP_CHIEU, DANG_BAN, HET_VE, DA_KET_THUC };

std::string chuyenTrangThaiSuatChieu(TrangThaiSuatChieu trangThai);

class SuatChieu {
private:
    std::string maSuat;
    std::string maPhong;
    std::shared_ptr<Phim> phim;
    std::shared_ptr<PhongChieu> phongChieu;
    ThoiGian gioChieu;
    long long giaVeCoBan;
    TrangThaiSuatChieu trangThai;
    std::vector<std::vector<std::shared_ptr<Ghe>>> maTranGhe;

public:
    SuatChieu();
    SuatChieu(const std::string& maSuat, const std::string& maPhong,
              const Phim* phim, const ThoiGian& gioChieu, long long giaVeCoBan);
    SuatChieu(const std::string& maSuat,
              std::shared_ptr<Phim> phim,
              std::shared_ptr<PhongChieu> phong,
              const DateTime& thoiGianBatDau,
              std::vector<std::vector<std::shared_ptr<Ghe>>> maTran);

    std::string getMaSuat() const { return maSuat; }
    std::string getMaSuatChieu() const { return maSuat; }
    std::string getMaPhong() const;
    std::shared_ptr<Phim> getPhim() const { return phim; }
    std::shared_ptr<PhongChieu> getPhongChieu() const { return phongChieu; }
    ThoiGian getGioChieu() const { return gioChieu; }
    ThoiGian getThoiGianBatDau() const { return gioChieu; }
    ThoiGian getGioKetThuc() const;
    ThoiGian getThoiGianKetThuc() const { return getGioKetThuc(); }
    long long getGiaVeCoBan() const { return giaVeCoBan; }
    TrangThaiSuatChieu getTrangThai() const { return trangThai; }
    const std::vector<std::vector<std::shared_ptr<Ghe>>>& getMaTranGhe() const { return maTranGhe; }

    std::shared_ptr<Ghe> getGhe(int hang, int cot) const;
    void giuCho(int hang, int cot);
    void xacNhanThanhToanGhe(int hang, int cot);
    void huyGheQuaHan();

    void setMaSuat(const std::string& ma);
    void setMaPhong(const std::string& maPhongMoi);
    bool setPhim(std::shared_ptr<Phim> phimMoi);
    bool setPhim(const Phim* phimMoi);
    bool setPhongChieu(std::shared_ptr<PhongChieu> phongMoi);
    bool setGioChieu(const ThoiGian& gio);
    bool setGiaVeCoBan(long long gia);
    void setTrangThai(TrangThaiSuatChieu trangThaiMoi);
    void setMaTranGhe(std::vector<std::vector<std::shared_ptr<Ghe>>> maTran);

    bool daChieuXong() const;

    // Hai suat chieu trung lich khi cung phong va khoang thoi gian chieu giao nhau
    bool kiemTraTrungLich(const SuatChieu& khac) const;

    void nhap();
    void hienThi() const;
    std::string toString() const;
};

#endif
