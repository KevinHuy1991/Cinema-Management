#include "FileHandler.h"
#include "Ghe.h"
#include "PhongChieu.h"
#include "SuatChieu.h"
#include <chrono>
#include <cstring>
#include <sstream>


using namespace std;
using namespace std::chrono;

// 1. Đọc danh sách phim từ CSV: Ma,Ten,TheLoai,ThoiLuong,DoTuoi,GiaGoc
vector<shared_ptr<Phim>>
FileHandler::docDanhSachPhimCSV(const string &filepath) {
  vector<shared_ptr<Phim>> ds;
  ifstream file(filepath);
  if (!file.is_open())
    return ds;

  string line;
  while (getline(file, line)) {
    if (line.empty())
      continue;
    stringstream ss(line);
    string ma, ten, loai, strTL, strDT, strGia;

    if (getline(ss, ma, ',') && getline(ss, ten, ',') &&
        getline(ss, loai, ',') && getline(ss, strTL, ',') &&
        getline(ss, strDT, ',') && getline(ss, strGia, ',')) {
      try {
        int tl = stoi(strTL);
        int dt = stoi(strDT);
        double gia = stod(strGia);
        ds.push_back(make_shared<Phim>(ma, ten, loai, tl, dt, gia));
      } catch (...) {
        continue;
      }
    }
  }
  file.close();
  return ds;
}

// 2. Đọc bảng giá Combo bắp nước từ CSV: Ma,Ten,DonGia
vector<BangGiaCombo> FileHandler::docBangGiaComboCSV(const string &filepath) {
  vector<BangGiaCombo> ds;
  ifstream file(filepath);
  if (!file.is_open())
    return ds;

  string line;
  while (getline(file, line)) {
    if (line.empty())
      continue;
    stringstream ss(line);
    string ma, ten, strGia;
    if (getline(ss, ma, ',') && getline(ss, ten, ',') &&
        getline(ss, strGia, ',')) {
      try {
        ds.push_back({ma, ten, stod(strGia)});
      } catch (...) {
        continue;
      }
    }
  }
  file.close();
  return ds;
}

// 3. Đọc danh sách rạp từ CSV và gán các phòng chiếu mặc định
vector<shared_ptr<RapChieu>>
FileHandler::docDanhSachRapCSV(const string &filepath) {
  vector<shared_ptr<RapChieu>> ds;
  ifstream file(filepath);
  if (!file.is_open())
    return ds;

  string line;
  while (getline(file, line)) {
    if (line.empty())
      continue;
    stringstream ss(line);
    string ma, ten, diaChi;
    if (getline(ss, ma, ',') && getline(ss, ten, ',') &&
        getline(ss, diaChi, ',')) {
      auto rap = make_shared<RapChieu>(ma, ten, diaChi);
      rap->themPhongChieu(
          make_shared<Phong2D>("P2D_01", "Phong 2D - Standard"));
      rap->themPhongChieu(make_shared<Phong3D>("P3D_01", "Phong 3D - RealD"));
      rap->themPhongChieu(
          make_shared<PhongIMAX>("PIMAX_01", "Phong IMAX - Laser"));
      ds.push_back(rap);
    }
  }
  file.close();
  return ds;
}

// 4. Lưu danh sách vé đã bán xuống file nhị phân
void FileHandler::luuDuLieuVeNhiPhan(const vector<VeBinaryRecord> &dsVe,
                                     const string &filepath) {
  ofstream file(filepath, ios::binary | ios::trunc);
  if (!file.is_open())
    return;

  size_t count = dsVe.size();
  file.write(reinterpret_cast<const char *>(&count), sizeof(count));
  if (count > 0) {
    file.write(reinterpret_cast<const char *>(dsVe.data()),
               count * sizeof(VeBinaryRecord));
  }
  file.close();
}

// 5. Đọc danh sách vé đã bán từ file nhị phân
vector<VeBinaryRecord> FileHandler::docDuLieuVeNhiPhan(const string &filepath) {
  vector<VeBinaryRecord> ds;
  ifstream file(filepath, ios::binary);
  if (!file.is_open())
    return ds;

  size_t count = 0;
  file.read(reinterpret_cast<char *>(&count), sizeof(count));
  if (count > 0) {
    ds.resize(count);
    file.read(reinterpret_cast<char *>(ds.data()),
              count * sizeof(VeBinaryRecord));
  }
  file.close();
  return ds;
}

// 6. Lưu trạng thái ghế (đang giữ chỗ hoặc đã bán) của từng suất chiếu
void FileHandler::luuTrangThaiGheNhiPhan(
    const vector<shared_ptr<SuatChieu>> &dsSuat, const string &filepath) {
  ofstream file(filepath, ios::binary | ios::trunc);
  if (!file.is_open())
    return;

  vector<GheBinaryRecord> records;
  for (const auto &sc : dsSuat) {
    if (!sc)
      continue;
    string maSC = sc->getMaSuatChieu();
    const auto &matrix = sc->getMaTranGhe();
    for (size_t r = 0; r < matrix.size(); ++r) {
      for (size_t c = 0; c < matrix[r].size(); ++c) {
        const auto &ghe = matrix[r][c];
        if (ghe && ghe->getTrangThai() != TrangThaiGhe::TRONG) {
          GheBinaryRecord rec;
          memset(&rec, 0, sizeof(rec));
          strncpy(rec.maSuatChieu, maSC.c_str(), sizeof(rec.maSuatChieu) - 1);
          rec.hang = static_cast<int>(r);
          rec.cot = static_cast<int>(c);
          rec.trangThai = static_cast<int>(ghe->getTrangThai());
          rec.mocThoiGianGiu =
              system_clock::to_time_t(ghe->getMocThoiGianGiu());
          records.push_back(rec);
        }
      }
    }
  }

  size_t count = records.size();
  file.write(reinterpret_cast<const char *>(&count), sizeof(count));
  if (count > 0) {
    file.write(reinterpret_cast<const char *>(records.data()),
               count * sizeof(GheBinaryRecord));
  }
  file.close();
}

// 7. Nạp lại trạng thái ghế từ file nhị phân
void FileHandler::napTrangThaiGheNhiPhan(vector<shared_ptr<SuatChieu>> &dsSuat,
                                         const string &filepath) {
  ifstream file(filepath, ios::binary);
  if (!file.is_open())
    return;

  size_t count = 0;
  file.read(reinterpret_cast<char *>(&count), sizeof(count));
  if (count == 0)
    return;

  vector<GheBinaryRecord> records(count);
  file.read(reinterpret_cast<char *>(records.data()),
            count * sizeof(GheBinaryRecord));
  file.close();

  for (const auto &rec : records) {
    for (auto &sc : dsSuat) {
      if (sc && sc->getMaSuatChieu() == rec.maSuatChieu) {
        auto ghe = sc->getGhe(rec.hang, rec.cot);
        if (ghe) {
          ghe->khoiPhucTrangThai(static_cast<TrangThaiGhe>(rec.trangThai),
                                 rec.mocThoiGianGiu);
        }
        break;
      }
    }
  }
}