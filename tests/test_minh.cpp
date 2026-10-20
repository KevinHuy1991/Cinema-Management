
#include <iostream>
#include <memory>
#include <vector>

#include "Ghe.h"
#include "PhongChieu.h"

using namespace std;

int main()
{
    // ===== Kiem thu da hinh phong chieu =====
    vector<shared_ptr<PhongChieu>> dsPhong;

    dsPhong.push_back(
        make_shared<Phong2D>("P01", "Phong 2D")
    );

    dsPhong.push_back(
        make_shared<Phong3D>("P02", "Phong 3D")
    );

    dsPhong.push_back(
        make_shared<PhongIMAX>("P03", "Phong IMAX")
    );

    cout << "===== DANH SACH PHONG =====\n";

    for (const auto& phong : dsPhong)
    {
        cout << phong->getTenLoaiPhong()
             << " | Ma: " << phong->getMaPhong()
             << " | Kich thuoc: "
             << phong->getSoHangGhe() << "x"
             << phong->getSoCotGhe()
             << " | Phu thu: "
             << phong->tinhPhuThuPhong() << " VND\n";
    }

    // ===== Kiem thu da hinh ghe =====
    vector<shared_ptr<Ghe>> dsGhe;

    dsGhe.push_back(
        make_shared<GheThuong>(0, 0, "A1")
    );

    dsGhe.push_back(
        make_shared<GheVIP>(1, 0, "B1")
    );

    dsGhe.push_back(
        make_shared<GheDoiSweetbox>(2, 0, "C1")
    );

    cout << "\n===== DANH SACH GHE =====\n";

    for (const auto& ghe : dsGhe)
    {
        cout << ghe->getMaGhe()
             << " | Loai: " << ghe->getLoaiGhe()
             << " | Ky hieu: " << ghe->kyHieuHienThi()
             << " | Phu thu: "
             << ghe->tinhPhuThuGhe() << " VND\n";
    }

    // ===== Kiem thu giu cho ghe =====
    try
    {
        dsGhe[0]->giuCho();

        cout << "\nGhe " << dsGhe[0]->getMaGhe()
             << " da duoc giu cho.\n";

        dsGhe[0]->xacNhanMua();

        cout << "Trang thai sau thanh toan: "
             << static_cast<int>(
                    dsGhe[0]->getTrangThai()
                ) << '\n';
    }
    catch (const exception& e)
    {
        cout << "Loi: " << e.what() << '\n';
    }

    return 0;
}
