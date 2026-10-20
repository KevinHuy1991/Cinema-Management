#include "CinemaSystemManager.h"
#include "ComboBapNuoc.h"
#include "Ghe.h"
#include "Phim.h"
#include "PhongChieu.h"
#include "RapChieu.h"
#include "SuatChieu.h"
#include "SuatChieuFactory.h"
#include "TimeUtils.h"
#include "VeXemPhim.h"
#include <cstring>
#include <fstream>
#include <iomanip>
#include <sstream>

using namespace std;

CinemaSystemManager &CinemaSystemManager::getInstance() {
  static CinemaSystemManager instance;
  return instance;
}

void CinemaSystemManager::khoiTaoDuLieuTuFile() {
  danhSachPhim = FileHandler::docDanhSachPhimCSV("data/ds_phim.csv");
  danhSachRap = FileHandler::docDanhSachRapCSV("data/ds_rap.csv");
  danhSachCombo = FileHandler::docBangGiaComboCSV("data/bang_gia.csv");
  danhSachVeDaBan = FileHandler::docDuLieuVeNhiPhan("data/ve_da_ban.dat");

  if (danhSachSuatChieu.empty() && !danhSachPhim.empty() &&
      !danhSachRap.empty()) {
    auto rap = danhSachRap[0];
    if (!rap->getDanhSachPhong().empty()) {
      auto p1 = danhSachPhim[0];
      auto phong1 = rap->getDanhSachPhong()[0];
      auto sc1 = SuatChieuFactory::taoSuatChieu("SC01", p1, phong1,
                                                DateTime(16, 10, 2026, 18, 30));
      danhSachSuatChieu.push_back(sc1);
    }
  }

  FileHandler::napTrangThaiGheNhiPhan(danhSachSuatChieu,
                                      "data/trang_thai_ghe.dat");
}

void CinemaSystemManager::luuDuLieuHeThong() {
  FileHandler::luuDuLieuVeNhiPhan(danhSachVeDaBan, "data/ve_da_ban.dat");
  FileHandler::luuTrangThaiGheNhiPhan(danhSachSuatChieu,
                                      "data/trang_thai_ghe.dat");
}

bool CinemaSystemManager::themPhim(shared_ptr<Phim> p) {
  if (!p)
    return false;
  danhSachPhim.push_back(p);
  return true;
}

bool CinemaSystemManager::themRap(shared_ptr<RapChieu> r) {
  if (!r)
    return false;
  danhSachRap.push_back(r);
  return true;
}

bool CinemaSystemManager::lenLichChieu(shared_ptr<SuatChieu> s) {
  if (!s)
    return false;
  for (const auto &existing : danhSachSuatChieu) {
    if (existing && existing->kiemTraTrungLich(*s)) {
      throw ScheduleConflictException("Loi: Trung lich chieu!");
    }
  }
  danhSachSuatChieu.push_back(s);
  return true;
}

shared_ptr<SuatChieu>
CinemaSystemManager::timSuatChieu(const string &maSuat) const {
  for (const auto &sc : danhSachSuatChieu) {
    if (sc && sc->getMaSuatChieu() == maSuat)
      return sc;
  }
  return nullptr;
}

void CinemaSystemManager::giuChoGhe(const string &maSuat, int hang, int cot) {
  auto sc = timSuatChieu(maSuat);
  if (!sc)
    throw CinemaException("Khong tim thay suat chieu!");
  sc->giuCho(hang, cot);
}

shared_ptr<VeXemPhim>
CinemaSystemManager::thanhToanVe(const string &maSuat, int hang, int cot,
                                 const vector<pair<string, double>> &combos) {

  auto sc = timSuatChieu(maSuat);
  if (!sc)
    throw CinemaException("Khong tim thay suat chieu!");

  auto ghe = sc->getGhe(hang, cot);
  if (!ghe)
    throw CinemaException("Toa do ghe khong hop le!");

  sc->xacNhanThanhToanGhe(hang, cot);

  string maVe = "VE_" + maSuat + "_" + to_string(hang) + "_" + to_string(cot);
  shared_ptr<VeXemPhim> ve = make_shared<VeCoBan>(maVe, sc, ghe);

  for (const auto &cb : combos) {
    ve = make_shared<ComboBapNuoc>(ve, cb.first, cb.second, 1);
  }

  VeBinaryRecord rec;
  memset(&rec, 0, sizeof(rec));
  strncpy(rec.maVe, ve->getMaVe().c_str(), sizeof(rec.maVe) - 1);
  strncpy(rec.maSuatChieu, maSuat.c_str(), sizeof(rec.maSuatChieu) - 1);
  if (sc->getPhim())
    strncpy(rec.maPhim, sc->getPhim()->getMaPhim().c_str(),
            sizeof(rec.maPhim) - 1);
  if (sc->getPhongChieu())
    strncpy(rec.maPhong, sc->getPhongChieu()->getMaPhong().c_str(),
            sizeof(rec.maPhong) - 1);
  strncpy(rec.maGhe, ghe->getMaGhe().c_str(), sizeof(rec.maGhe) - 1);
  rec.tongTien = ve->tinhTien();
  strncpy(rec.chiTietHoaDon, ve->xuatThongTin().c_str(),
          sizeof(rec.chiTietHoaDon) - 1);

  danhSachVeDaBan.push_back(rec);
  return ve;
}

const vector<shared_ptr<Phim>> &CinemaSystemManager::getDanhSachPhim() const {
  return danhSachPhim;
}
const vector<shared_ptr<RapChieu>> &CinemaSystemManager::getDanhSachRap() const {
  return danhSachRap;
}
const vector<shared_ptr<SuatChieu>> &
CinemaSystemManager::getDanhSachSuatChieu() const {
  return danhSachSuatChieu;
}
const vector<BangGiaCombo> &CinemaSystemManager::getDanhSachCombo() const {
  return danhSachCombo;
}
const vector<VeBinaryRecord> &CinemaSystemManager::getDanhSachVeDaBan() const {
  return danhSachVeDaBan;
}

// =========================================================================
// === KHU VUC CODE THONG KE DOANH THU CUA BAO (Lê Cường Bảo) ===
// =========================================================================

// Ham helper cuc bo dinh dang so tien thanh chuoi co dau phay ngan cach: 1500000 -> 1,500,000 VND
static string dinhDangTien(double soTien) {
  long long tienNguyen = static_cast<long long>(soTien + 0.5);
  bool am = (tienNguyen < 0);
  if (am)
    tienNguyen = -tienNguyen;

  string s = to_string(tienNguyen);
  string res = "";
  int dem = 0;
  for (int i = static_cast<int>(s.length()) - 1; i >= 0; --i) {
    res = s[i] + res;
    dem++;
    if (dem % 3 == 0 && i > 0) {
      res = ',' + res;
    }
  }
  if (am)
    res = '-' + res;
  return res + " VND";
}

// Lay ten hien thi than thien cho ma doi tuong (phim, phong chieu, suat chieu)
string CinemaSystemManager::layTenDoiTuong(const string &key,
                                          TieuChiThongKe tc) const {
  if (tc == TieuChiThongKe::THEO_PHIM) {
    // Doc cache tu data/ds_phim.csv de lay ten phim chinh xac
    static map<string, string> cacheTenPhim;
    static bool daDocCSV = false;

    if (!daDocCSV) {
      ifstream file("data/ds_phim.csv");
      if (file.is_open()) {
        string line;
        while (getline(file, line)) {
          if (line.empty())
            continue;
          stringstream ss(line);
          string ma, ten;
          if (getline(ss, ma, ',') && getline(ss, ten, ',')) {
            cacheTenPhim[ma] = ten;
          }
        }
        file.close();
      }
      daDocCSV = true;
    }

    auto it = cacheTenPhim.find(key);
    if (it != cacheTenPhim.end()) {
      return key + " (" + it->second + ")";
    }
    return key;
  } else if (tc == TieuChiThongKe::THEO_PHONG_CHIEU) {
    if (key == "P2D_01")
      return "P2D_01 (Phong 2D Standard)";
    if (key == "P3D_01")
      return "P3D_01 (Phong 3D RealD)";
    if (key == "PIMAX_01")
      return "PIMAX_01 (Phong IMAX Laser)";
    return key;
  }

  return key;
}

// 1. Thong ke so ve ban ra va tong doanh thu theo tieu chi
ThongKe CinemaSystemManager::thongKeDoanhThu(TieuChiThongKe tc) const {
  ThongKe kq;

  for (const auto &ve : danhSachVeDaBan) {
    string key;
    switch (tc) {
    case TieuChiThongKe::THEO_PHIM:
      key = (ve.maPhim[0] != '\0') ? string(ve.maPhim) : "KHONG_XAC_DINH";
      break;
    case TieuChiThongKe::THEO_PHONG_CHIEU:
      key = (ve.maPhong[0] != '\0') ? string(ve.maPhong) : "KHONG_XAC_DINH";
      break;
    case TieuChiThongKe::THEO_SUAT_CHIEU:
      key = (ve.maSuatChieu[0] != '\0') ? string(ve.maSuatChieu) : "KHONG_XAC_DINH";
      break;
    default:
      key = "KHAC";
      break;
    }

    kq.soVeBanRa[key]++;
    kq.tongDoanhThu[key] += ve.tongTien;
  }

  return kq;
}

// 2. Hien thi bao cao doanh thu dang bang format chuan console
void CinemaSystemManager::hienThiBaoCaoDoanhThu(TieuChiThongKe tc) const {
  ThongKe tk = thongKeDoanhThu(tc);

  string tieuDe;
  string cotDoiTuong;
  if (tc == TieuChiThongKe::THEO_PHIM) {
    tieuDe = "BAO CAO DOANH THU THEO PHIM";
    cotDoiTuong = "Phim (Ma / Ten Phim)";
  } else if (tc == TieuChiThongKe::THEO_PHONG_CHIEU) {
    tieuDe = "BAO CAO DOANH THU THEO PHONG CHIEU";
    cotDoiTuong = "Phong Chieu (Ma Phong)";
  } else {
    tieuDe = "BAO CAO DOANH THU THEO SUAT CHIEU";
    cotDoiTuong = "Suat Chieu (Ma Suat)";
  }

  cout << "\n=========================================================================================================\n";
  cout << "                                  " << tieuDe << "\n";
  cout << "=========================================================================================================\n";

  if (tk.soVeBanRa.empty() || danhSachVeDaBan.empty()) {
    cout << " [THONG BAO] Hien chua co du lieu ve da ban trong he thong.\n";
    cout << " Tong so ve: 0 | Tong doanh thu: 0 VND\n";
    cout << "=========================================================================================================\n\n";
    return;
  }

  double tongTatCaDoanhThu = tk.getTongDoanhThu();
  int tongTatCaSoVe = tk.getTongSoVe();

  // Bang thong ke can le ro rang
  cout << left
       << "+-----+--------------------------------------+---------------+----------------------+------------------+\n"
       << "| " << setw(3)  << "STT"
       << " | " << setw(36) << cotDoiTuong
       << " | " << setw(13) << "So Ve Ban Ra"
       << " | " << setw(20) << "Doanh Thu (VND)"
       << " | " << setw(16) << "Ty Le Doanh Thu"
       << " |\n"
       << "+-----+--------------------------------------+---------------+----------------------+------------------+\n";

  int stt = 1;
  for (const auto &item : tk.soVeBanRa) {
    const string &key = item.first;
    int soVe = item.second;
    double doanhThu = 0.0;
    auto itDT = tk.tongDoanhThu.find(key);
    if (itDT != tk.tongDoanhThu.end()) {
      doanhThu = itDT->second;
    }

    double tyLe = (tongTatCaDoanhThu > 0) ? (doanhThu / tongTatCaDoanhThu * 100.0) : 0.0;

    string tenHienThi = layTenDoiTuong(key, tc);
    if (tenHienThi.length() > 36) {
      tenHienThi = tenHienThi.substr(0, 33) + "...";
    }

    stringstream ssTyLe;
    ssTyLe << fixed << setprecision(2) << tyLe << " %";

    cout << "| " << setw(3)  << right << stt++
         << " | " << setw(36) << left  << tenHienThi
         << " | " << setw(13) << right << soVe
         << " | " << setw(20) << right << dinhDangTien(doanhThu)
         << " | " << setw(16) << right << ssTyLe.str()
         << " |\n";
  }

  stringstream ssTyLeTong;
  ssTyLeTong << fixed << setprecision(2) << 100.0 << " %";

  cout << "+-----+--------------------------------------+---------------+----------------------+------------------+\n"
       << "| " << setw(42) << left << "TONG CONG"
       << " | " << setw(13) << right << tongTatCaSoVe
       << " | " << setw(20) << right << dinhDangTien(tongTatCaDoanhThu)
       << " | " << setw(16) << right << ssTyLeTong.str()
       << " |\n"
       << "+--------------------------------------------+---------------+----------------------+------------------+\n";

  // Thong tin tong ket & chi so danh gia
  cout << "\n----------------------------------- TONG KET & PHAN TICH -----------------------------------\n";
  cout << " - Tong so ve da ban       : " << tongTatCaSoVe << " ve\n";
  cout << " - Tong doanh thu he thong : " << dinhDangTien(tongTatCaDoanhThu) << "\n";
  double giaTB = (tongTatCaSoVe > 0) ? (tongTatCaDoanhThu / tongTatCaSoVe) : 0.0;
  cout << " - Doanh thu trung binh/ve : " << dinhDangTien(giaTB) << "\n";

  auto topDT = timDoiTuongDoanhThuCaoNhat(tc);
  cout << " - Dan dau ve doanh thu    : " << layTenDoiTuong(topDT.first, tc)
       << " (" << dinhDangTien(topDT.second) << ")\n";

  if (tc == TieuChiThongKe::THEO_PHIM) {
    auto topVe = timPhimBanChayNhat();
    cout << " - Phim ban chay nhat      : " << layTenDoiTuong(topVe.first, tc)
         << " (" << topVe.second << " ve)\n";
  }
  cout << "--------------------------------------------------------------------------------------------\n\n";
}

// 3. Tinh tong doanh thu tat ca ve da ban
double CinemaSystemManager::tinhTongDoanhThu() const {
  double tong = 0.0;
  for (const auto &ve : danhSachVeDaBan) {
    tong += ve.tongTien;
  }
  return tong;
}

// 4. Tinh tong so ve da ban
int CinemaSystemManager::tinhTongSoVeBanRa() const {
  return static_cast<int>(danhSachVeDaBan.size());
}

// 5. Tinh doanh thu trung binh tren moi ve
double CinemaSystemManager::tinhDoanhThuTrungBinhMoiVe() const {
  if (danhSachVeDaBan.empty())
    return 0.0;
  return tinhTongDoanhThu() / danhSachVeDaBan.size();
}

// 6. Tim doi tuong dat doanh thu cao nhat theo tieu chi
pair<string, double>
CinemaSystemManager::timDoiTuongDoanhThuCaoNhat(TieuChiThongKe tc) const {
  ThongKe tk = thongKeDoanhThu(tc);
  string bestKey = "";
  double maxDoanhThu = -1.0;

  for (const auto &item : tk.tongDoanhThu) {
    if (item.second > maxDoanhThu) {
      maxDoanhThu = item.second;
      bestKey = item.first;
    }
  }

  if (bestKey.empty()) {
    return {"Khong co du lieu", 0.0};
  }
  return {bestKey, maxDoanhThu};
}

// 7. Tim phim co doanh thu cao nhat
pair<string, double> CinemaSystemManager::timPhimDoanhThuCaoNhat() const {
  return timDoiTuongDoanhThuCaoNhat(TieuChiThongKe::THEO_PHIM);
}

// 8. Tim phong chieu co doanh thu cao nhat
pair<string, double> CinemaSystemManager::timPhongDoanhThuCaoNhat() const {
  return timDoiTuongDoanhThuCaoNhat(TieuChiThongKe::THEO_PHONG_CHIEU);
}

// 9. Tim phim co so ve ban ra nhieu nhat
pair<string, int> CinemaSystemManager::timPhimBanChayNhat() const {
  ThongKe tk = thongKeDoanhThu(TieuChiThongKe::THEO_PHIM);
  string bestKey = "";
  int maxVe = -1;

  for (const auto &item : tk.soVeBanRa) {
    if (item.second > maxVe) {
      maxVe = item.second;
      bestKey = item.first;
    }
  }

  if (bestKey.empty()) {
    return {"Khong co du lieu", 0};
  }
  return {bestKey, maxVe};
}

// 10. Thong ke doanh thu theo khoang gia ve
ThongKe CinemaSystemManager::thongKeDoanhThuTheoKhoangGia(
    double minGia, double maxGia, TieuChiThongKe tc) const {
  ThongKe kq;

  for (const auto &ve : danhSachVeDaBan) {
    if (ve.tongTien >= minGia && ve.tongTien <= maxGia) {
      string key;
      switch (tc) {
      case TieuChiThongKe::THEO_PHIM:
        key = (ve.maPhim[0] != '\0') ? string(ve.maPhim) : "KHONG_XAC_DINH";
        break;
      case TieuChiThongKe::THEO_PHONG_CHIEU:
        key = (ve.maPhong[0] != '\0') ? string(ve.maPhong) : "KHONG_XAC_DINH";
        break;
      case TieuChiThongKe::THEO_SUAT_CHIEU:
        key = (ve.maSuatChieu[0] != '\0') ? string(ve.maSuatChieu) : "KHONG_XAC_DINH";
        break;
      default:
        key = "KHAC";
        break;
      }

      kq.soVeBanRa[key]++;
      kq.tongDoanhThu[key] += ve.tongTien;
    }
  }

  return kq;
}

// 11. Xuat bao cao thong ke doanh thu ra file text / report
bool CinemaSystemManager::xuatBaoCaoDoanhThuFile(const string &filepath,
                                                TieuChiThongKe tc) const {
  ofstream outFile(filepath);
  if (!outFile.is_open()) {
    return false;
  }

  ThongKe tk = thongKeDoanhThu(tc);
  double tongTatCaDoanhThu = tk.getTongDoanhThu();
  int tongTatCaSoVe = tk.getTongSoVe();

  string tieuDe;
  string cotDoiTuong;
  if (tc == TieuChiThongKe::THEO_PHIM) {
    tieuDe = "BAO CAO DOANH THU THEO PHIM";
    cotDoiTuong = "Phim (Ma / Ten Phim)";
  } else if (tc == TieuChiThongKe::THEO_PHONG_CHIEU) {
    tieuDe = "BAO CAO DOANH THU THEO PHONG CHIEU";
    cotDoiTuong = "Phong Chieu (Ma Phong)";
  } else {
    tieuDe = "BAO CAO DOANH THU THEO SUAT CHIEU";
    cotDoiTuong = "Suat Chieu (Ma Suat)";
  }

  outFile << "=========================================================================================================\n";
  outFile << "                                  " << tieuDe << "\n";
  outFile << "=========================================================================================================\n";

  if (tk.soVeBanRa.empty() || danhSachVeDaBan.empty()) {
    outFile << " [THONG BAO] Hien chua co du lieu ve da ban trong he thong.\n";
    outFile << " Tong so ve: 0 | Tong doanh thu: 0 VND\n";
    outFile << "=========================================================================================================\n";
    outFile.close();
    return true;
  }

  outFile << left
          << "+-----+--------------------------------------+---------------+----------------------+------------------+\n"
          << "| " << setw(3)  << "STT"
          << " | " << setw(36) << cotDoiTuong
          << " | " << setw(13) << "So Ve Ban Ra"
          << " | " << setw(20) << "Doanh Thu (VND)"
          << " | " << setw(16) << "Ty Le Doanh Thu"
          << " |\n"
          << "+-----+--------------------------------------+---------------+----------------------+------------------+\n";

  int stt = 1;
  for (const auto &item : tk.soVeBanRa) {
    const string &key = item.first;
    int soVe = item.second;
    double doanhThu = 0.0;
    auto itDT = tk.tongDoanhThu.find(key);
    if (itDT != tk.tongDoanhThu.end()) {
      doanhThu = itDT->second;
    }

    double tyLe = (tongTatCaDoanhThu > 0) ? (doanhThu / tongTatCaDoanhThu * 100.0) : 0.0;

    string tenHienThi = layTenDoiTuong(key, tc);
    if (tenHienThi.length() > 36) {
      tenHienThi = tenHienThi.substr(0, 33) + "...";
    }

    stringstream ssTyLe;
    ssTyLe << fixed << setprecision(2) << tyLe << " %";

    outFile << "| " << setw(3)  << right << stt++
            << " | " << setw(36) << left  << tenHienThi
            << " | " << setw(13) << right << soVe
            << " | " << setw(20) << right << dinhDangTien(doanhThu)
            << " | " << setw(16) << right << ssTyLe.str()
            << " |\n";
  }

  stringstream ssTyLeTong;
  ssTyLeTong << fixed << setprecision(2) << 100.0 << " %";

  outFile << "+-----+--------------------------------------+---------------+----------------------+------------------+\n"
          << "| " << setw(42) << left << "TONG CONG"
          << " | " << setw(13) << right << tongTatCaSoVe
          << " | " << setw(20) << right << dinhDangTien(tongTatCaDoanhThu)
          << " | " << setw(16) << right << ssTyLeTong.str()
          << " |\n"
          << "+--------------------------------------------+---------------+----------------------+------------------+\n";

  outFile << "\n----------------------------------- TONG KET & PHAN TICH -----------------------------------\n";
  outFile << " - Tong so ve da ban       : " << tongTatCaSoVe << " ve\n";
  outFile << " - Tong doanh thu he thong : " << dinhDangTien(tongTatCaDoanhThu) << "\n";
  double giaTB = (tongTatCaSoVe > 0) ? (tongTatCaDoanhThu / tongTatCaSoVe) : 0.0;
  outFile << " - Doanh thu trung binh/ve : " << dinhDangTien(giaTB) << "\n";

  auto topDT = timDoiTuongDoanhThuCaoNhat(tc);
  outFile << " - Dan dau ve doanh thu    : " << layTenDoiTuong(topDT.first, tc)
          << " (" << dinhDangTien(topDT.second) << ")\n";

  if (tc == TieuChiThongKe::THEO_PHIM) {
    auto topVe = timPhimBanChayNhat();
    outFile << " - Phim ban chay nhat      : " << layTenDoiTuong(topVe.first, tc)
            << " (" << topVe.second << " ve)\n";
  }
  outFile << "--------------------------------------------------------------------------------------------\n";

  outFile.close();
  return true;
}