// include/SuatChieuFactory.h
#pragma once
#include <iostream>
#include <vector>
#include <memory>
#include <string>
#include "SuatChieu.h"
using namespace std;

using MaTranGhe = vector<vector<shared_ptr<Ghe>>>;

// ===== Creator (Factory Method) =====
// Giữ nguyên 2 hàm static của bản header nhóm đã thống nhất để Huy/Minh gọi như cũ.
// Bên trong, việc "tạo ma trận ghế" là factory method ảo (taoMaTranGhe),
// mỗi lớp con (2D/3D/IMAX) tự quyết định bố cục ghế.
class SuatChieuFactory {
public:
    virtual ~SuatChieuFactory() = default;

    // Sinh sơ đồ ma trận ghế động (2D vector) tùy theo loại phòng chiếu
    static MaTranGhe khoiTaoMaTranGhe(shared_ptr<PhongChieu> phong);

    // Tạo đối tượng SuatChieu hoàn chỉnh
    static shared_ptr<SuatChieu> taoSuatChieu(
        const string& maSuat,
        shared_ptr<Phim> phim,
        shared_ptr<PhongChieu> phong,
        const DateTime& thoiGianBatDau);

    // Chọn factory phù hợp với loại phòng
    static unique_ptr<SuatChieuFactory> layFactory(LoaiPhong loai);

protected:
    // Factory Method: lớp con quyết định bố cục ghế
    virtual MaTranGhe taoMaTranGhe(const PhongChieu& phong) const = 0;

    // Bố cục: hàng [vipTuPT%, vipDenPT%) của số hàng là ghế VIP,
    // hàng cuối là ghế đôi (mỗi ghế đôi chiếm 2 ô liền kề), còn lại ghế thường.
    struct CauHinhSoDo {
        int vipTuPT;   // % số hàng bắt đầu VIP
        int vipDenPT;  // % số hàng kết thúc VIP (vipTuPT == vipDenPT: không có VIP)
    };
    static MaTranGhe dungMaTran(const PhongChieu& phong, const CauHinhSoDo& cfg);

    // Mã ghế dạng "A1", "B5"... từ chỉ số hàng/cột (bắt đầu từ 0)
    static string taoMaGhe(int hang, int cot);
};

// ===== Concrete Creators =====
class Suat2DFactory : public SuatChieuFactory {
protected:
    MaTranGhe taoMaTranGhe(const PhongChieu& phong) const override;
};

class Suat3DFactory : public SuatChieuFactory {
protected:
    MaTranGhe taoMaTranGhe(const PhongChieu& phong) const override;
};

class SuatIMAXFactory : public SuatChieuFactory {
protected:
    MaTranGhe taoMaTranGhe(const PhongChieu& phong) const override;
};
