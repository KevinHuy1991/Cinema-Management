#pragma once
#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <vector>

// Forward declaration
class Phim;
class RapChieu;
class SuatChieu;
class VeXemPhim;

#include "FileHandler.h"

using namespace std;

enum class TieuChiThongKe { THEO_PHIM, THEO_PHONG_CHIEU };

struct ThongKe {
  map<string, int> soVeBanRa;
  map<string, double> tongDoanhThu;
};

class CinemaSystemManager {
private:
  vector<shared_ptr<Phim>> danhSachPhim;
  vector<shared_ptr<RapChieu>> danhSachRap;
  vector<shared_ptr<SuatChieu>> danhSachSuatChieu;
  vector<BangGiaCombo> danhSachCombo;
  vector<VeBinaryRecord> danhSachVeDaBan;

  CinemaSystemManager() = default;

public:
  CinemaSystemManager(const CinemaSystemManager &) = delete;
  CinemaSystemManager &operator=(const CinemaSystemManager &) = delete;

  // Singleton instance
  static CinemaSystemManager &getInstance();

  void khoiTaoDuLieuTuFile();
  void luuDuLieuHeThong();

  bool themPhim(shared_ptr<Phim> p);
  bool themRap(shared_ptr<RapChieu> r);
  bool lenLichChieu(shared_ptr<SuatChieu> s);

  shared_ptr<SuatChieu> timSuatChieu(const string &maSuat) const;
  void giuChoGhe(const string &maSuat, int hang, int cot);
  shared_ptr<VeXemPhim> thanhToanVe(const string &maSuat, int hang, int cot,
                                    const vector<pair<string, double>> &combos);

  const vector<shared_ptr<Phim>> &getDanhSachPhim() const;
  const vector<shared_ptr<SuatChieu>> &getDanhSachSuatChieu() const;
  const vector<BangGiaCombo> &getDanhSachCombo() const;
  const vector<VeBinaryRecord> &getDanhSachVeDaBan() const;

  // Phan cong cua Bao
  ThongKe thongKeDoanhThu(TieuChiThongKe tc) const;
  void hienThiBaoCaoDoanhThu(TieuChiThongKe tc) const;
};