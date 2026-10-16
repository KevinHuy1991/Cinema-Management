#include "CinemaSystemManager.h"
#include "ComboBapNuoc.h"
#include "SuatChieuFactory.h"
#include "TimeUtils.h"
#include "VeXemPhim.h"
#include <cstring>
#include <iomanip>


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

  // Tạo sẵn suất chiếu mẫu nếu hệ thống chưa có suất nào
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

  // Nạp trạng thái ghế từ file nhị phân
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
      throw ScheduleConflictException(
          "Loi: Trung lich chieu tai phong " +
          s->getPhongChieu()->getTenPhong() + " trong khoang thoi gian " +
          s->getThoiGianBatDau().toString() + " den " +
          s->getThoiGianKetThuc().toString());
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
    throw CinemaException("Khong tim thay suat chieu: " + maSuat);
  sc->giuCho(hang, cot);
}

shared_ptr<VeXemPhim>
CinemaSystemManager::thanhToanVe(const string &maSuat, int hang, int cot,
                                 const vector<pair<string, double>> &combos) {

  auto sc = timSuatChieu(maSuat);
  if (!sc)
    throw CinemaException("Khong tim thay suat chieu: " + maSuat);

  auto ghe = sc->getGhe(hang, cot);
  if (!ghe)
    throw CinemaException("Toa do ghe khong hop le!");

  // Xác nhận đã bán ghế
  sc->xacNhanThanhToanGhe(hang, cot);

  // 1. Tạo vé cơ bản (ConcreteComponent)
  string maVe = "VE_" + maSuat + "_" + to_string(hang) + "_" + to_string(cot);
  shared_ptr<VeXemPhim> ve = make_shared<VeCoBan>(maVe, sc, ghe);

  // 2. Trang trí thêm combo bắp nước (Decorator Pattern)
  for (const auto &cb : combos) {
    ve = make_shared<ComboBapNuoc>(ve, cb.first, cb.second, 1);
  }

  // 3. Đóng gói lưu vào struct phẳng nhị phân
  VeBinaryRecord rec;
  memset(&rec, 0, sizeof(rec));
  strncpy(rec.maVe, ve->getMaVe().c_str(), sizeof(rec.maVe) - 1);
  strncpy(rec.maSuatChieu, maSuat.c_str(), sizeof(rec.maSuatChieu) - 1);
  if (sc->getPhim()) {
    strncpy(rec.maPhim, sc->getPhim()->getMaPhim().c_str(),
            sizeof(rec.maPhim) - 1);
  }
  if (sc->getPhongChieu()) {
    strncpy(rec.maPhong, sc->getPhongChieu()->getMaPhong().c_str(),
            sizeof(rec.maPhong) - 1);
  }
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
// === KHU VUC CODE THONG KE DOANH THU CUA BAO (Bao se viet phan duoi nay) ===
// =========================================================================

ThongKe CinemaSystemManager::thongKeDoanhThu(TieuChiThongKe tc) const {
  ThongKe kq;
  (void)tc;
  // Stub: Bao se duyet danhSachVeDaBan de tinh doanh thu tai day
  return kq;
}

void CinemaSystemManager::hienThiBaoCaoDoanhThu(TieuChiThongKe tc) const {
  (void)tc;
  // Stub: Bao se in ra bang bao cao doanh thu formatted tai day
}