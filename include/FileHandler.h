#pragma once
#include "Phim.h"
#include "RapChieu.h"
#include "SuatChieu.h"
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>


using namespace std;

// Struct đơn giản để lưu thông tin Vé xuống file nhị phân (.dat)
struct Ve {
  char maVe[20];
  char maPhim[20];
  char maPhong[20];
  char maGhe[10];
  double tongTien;
};

// Struct đơn giản để lưu trạng thái Ghế xuống file nhị phân (.dat)
struct GheLuu {
  char maSuat[20];
  int hang;
  int cot;
  int trangThai; // 0: Trống, 1: Đang giữ, 2: Đã bán
};

class FileHandler {
public:
  // 1. Đọc/Ghi file nhị phân (.dat) - Chuẩn cú pháp cơ bản
  static void luuDuLieuVeNhiPhan(const vector<Ve> &danhSachVe,
                                 const string &filepath);
  static vector<Ve> docDuLieuVeNhiPhan(const string &filepath);

  static void luuTrangThaiGhe(const vector<GheLuu> &dsGhe,
                              const string &filepath);
  static vector<GheLuu> docTrangThaiGhe(const string &filepath);

  // 2. Đọc file text (.csv) cho Master Data
  static vector<Phim> docPhimCSV(const string &filepath);
  static vector<RapChieu> docRapCSV(const string &filepath);
};