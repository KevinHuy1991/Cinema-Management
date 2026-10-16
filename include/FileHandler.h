#pragma once
#include <chrono>
#include <cstring>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

// Khai bao truoc (Forward Declaration) de khong phu thuoc thu tu include
class Phim;
class RapChieu;
class SuatChieu;

// Struct phang (POD) ghi/doc file nhi phan .dat an toan 100%
struct VeBinaryRecord {
  char maVe[24];
  char maSuatChieu[24];
  char maPhim[24];
  char maPhong[24];
  char maGhe[12];
  double tongTien;
  char chiTietHoaDon[256];
};

struct GheBinaryRecord {
  char maSuatChieu[24];
  int hang;
  int cot;
  int trangThai; // 0: TRONG, 1: DANG_GIU_CHO, 2: DA_BAN
  time_t mocThoiGianGiu;
};

struct BangGiaCombo {
  string maCombo;
  string tenCombo;
  double donGia;
};

class FileHandler {
public:
  // Doc Master Data tu file CSV
  static vector<shared_ptr<Phim>> docDanhSachPhimCSV(const string &filepath);
  static vector<shared_ptr<RapChieu>> docDanhSachRapCSV(const string &filepath);
  static vector<BangGiaCombo> docBangGiaComboCSV(const string &filepath);

  // Doc & Ghi file nhi phan (.dat)
  static void luuDuLieuVeNhiPhan(const vector<VeBinaryRecord> &dsVe,
                                 const string &filepath);
  static vector<VeBinaryRecord> docDuLieuVeNhiPhan(const string &filepath);

  static void
  luuTrangThaiGheNhiPhan(const vector<shared_ptr<SuatChieu>> &dsSuat,
                         const string &filepath);
  static void napTrangThaiGheNhiPhan(vector<shared_ptr<SuatChieu>> &dsSuat,
                                     const string &filepath);
};