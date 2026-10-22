#include "TimeUtils.h"

#include <ctime>
#include <cstdio>
#include <iomanip>
#include <sstream>

// ---------- Ham ho tro tinh toan lich (thuat toan days-from-civil) ----------
static long long soNgayTuMoc(int nam, int thang, int ngay) {
    int y = nam - (thang <= 2 ? 1 : 0);
    long long era = (y >= 0 ? y : y - 399) / 400;
    unsigned yoe = static_cast<unsigned>(y - era * 400);
    unsigned doy = (153 * (thang + (thang > 2 ? -3 : 9)) + 2) / 5 + ngay - 1;
    unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    return era * 146097 + static_cast<long long>(doe) - 719468;
}

bool ThoiGian::laNamNhuan(int nam) {
    return (nam % 4 == 0 && nam % 100 != 0) || (nam % 400 == 0);
}

int ThoiGian::soNgayTrongThang(int thang, int nam) {
    static const int ngayMacDinh[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (thang == 2 && laNamNhuan(nam)) return 29;
    if (thang < 1 || thang > 12) return 0;
    return ngayMacDinh[thang - 1];
}

// ---------- Lop ThoiGian ----------
ThoiGian::ThoiGian() {
    std::time_t bayGio = std::time(nullptr);
    std::tm* lt = std::localtime(&bayGio);
    ngay = lt->tm_mday;
    thang = lt->tm_mon + 1;
    nam = lt->tm_year + 1900;
    gio = lt->tm_hour;
    phut = lt->tm_min;
}

ThoiGian::ThoiGian(int ngay, int thang, int nam, int gio, int phut)
    : ngay(1), thang(1), nam(2000), gio(0), phut(0) {
    datThoiGian(ngay, thang, nam, gio, phut);
}

bool ThoiGian::datThoiGian(int ngayMoi, int thangMoi, int namMoi, int gioMoi, int phutMoi) {
    if (namMoi < 1900 || namMoi > 2100) return false;
    if (thangMoi < 1 || thangMoi > 12) return false;
    if (ngayMoi < 1 || ngayMoi > soNgayTrongThang(thangMoi, namMoi)) return false;
    if (gioMoi < 0 || gioMoi > 23) return false;
    if (phutMoi < 0 || phutMoi > 59) return false;
    ngay = ngayMoi;
    thang = thangMoi;
    nam = namMoi;
    gio = gioMoi;
    phut = phutMoi;
    return true;
}

long long ThoiGian::doiRaPhut() const {
    return soNgayTuMoc(nam, thang, ngay) * 24LL * 60 + gio * 60LL + phut;
}

bool operator==(const ThoiGian& a, const ThoiGian& b) { return a.doiRaPhut() == b.doiRaPhut(); }
bool operator!=(const ThoiGian& a, const ThoiGian& b) { return !(a == b); }
bool operator<(const ThoiGian& a, const ThoiGian& b) { return a.doiRaPhut() < b.doiRaPhut(); }
bool operator>(const ThoiGian& a, const ThoiGian& b) { return b < a; }
bool operator<=(const ThoiGian& a, const ThoiGian& b) { return !(b < a); }
bool operator>=(const ThoiGian& a, const ThoiGian& b) { return !(a < b); }

ThoiGian ThoiGian::operator+(int soPhut) const {
    long long tongPhut = doiRaPhut() + soPhut;
    long long soNgay = tongPhut / (24LL * 60);
    int phutTrongNgay = static_cast<int>(tongPhut % (24LL * 60));
    if (phutTrongNgay < 0) {  // phong truong hop cong so phut am
        phutTrongNgay += 24 * 60;
        soNgay -= 1;
    }
    // Chuyen nguoc lai tu so ngay ke tu moc sang (nam, thang, ngay)
    long long z = soNgay + 719468;
    long long era = (z >= 0 ? z : z - 146096) / 146097;
    unsigned doe = static_cast<unsigned>(z - era * 146097);
    unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    int y = static_cast<int>(yoe) + static_cast<int>(era * 400);
    unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    unsigned mp = (5 * doy + 2) / 153;
    int d = static_cast<int>(doy - (153 * mp + 2) / 5 + 1);
    int m = static_cast<int>(mp + (mp < 10 ? 3 : -9));
    y += (m <= 2 ? 1 : 0);

    ThoiGian ketQua;
    ketQua.datThoiGian(d, m, y, phutTrongNgay / 60, phutTrongNgay % 60);
    return ketQua;
}

ThoiGian& ThoiGian::operator+=(int soPhut) {
    *this = *this + soPhut;
    return *this;
}

long long ThoiGian::operator-(const ThoiGian& b) const {
    return doiRaPhut() - b.doiRaPhut();
}

std::ostream& operator<<(std::ostream& os, const ThoiGian& t) {
    os << std::setfill('0') << std::setw(2) << t.ngay << "/"
       << std::setfill('0') << std::setw(2) << t.thang << "/"
       << t.nam << " "
       << std::setfill('0') << std::setw(2) << t.gio << ":"
       << std::setfill('0') << std::setw(2) << t.phut;
    return os;
}

std::istream& operator>>(std::istream& is, ThoiGian& t) {
    int n, th, na, g, p;
    char c1, c2, c3;
    is >> n >> c1 >> th >> c2 >> na >> g >> c3 >> p;
    if (is && c1 == '/' && c2 == '/' && c3 == ':' && t.datThoiGian(n, th, na, g, p)) {
        return is;
    }
    is.setstate(std::ios::failbit);
    return is;
}

std::string ThoiGian::toString() const {
    std::ostringstream oss;
    oss << *this;
    return oss.str();
}

ThoiGian ThoiGian::tuChuoi(const std::string& chuoi) {
    ThoiGian t;
    int n, th, na, g, p;
    if (std::sscanf(chuoi.c_str(), "%d/%d/%d %d:%d", &n, &th, &na, &g, &p) == 5) {
        t.datThoiGian(n, th, na, g, p);
    }
    return t;
}

// ---------- Ham tien ich TimeUtils ----------
bool TimeUtils::isTimeOverlap(const ThoiGian& bd1, const ThoiGian& kt1,
                              const ThoiGian& bd2, const ThoiGian& kt2) {
    long long b1 = bd1.doiRaPhut();
    long long k1 = kt1.doiRaPhut();
    long long b2 = bd2.doiRaPhut();
    long long k2 = kt2.doiRaPhut();
    // Hai doan [b1, k1) va [b2, k2) trung nhau khi b1 < k2 va b2 < k1
    return b1 < k2 && b2 < k1;
}

bool TimeUtils::kiemTraTrungLich(const ThoiGian& gioBatDau1, int thoiLuongPhut1,
                                 const ThoiGian& gioBatDau2, int thoiLuongPhut2) {
    long long bd1 = gioBatDau1.doiRaPhut();
    long long bd2 = gioBatDau2.doiRaPhut();
    long long kt1 = bd1 + thoiLuongPhut1;
    long long kt2 = bd2 + thoiLuongPhut2;
    // Hai doan [bd1, kt1) va [bd2, kt2) trung nhau khi bd1 < kt2 va bd2 < kt1
    return bd1 < kt2 && bd2 < kt1;
}

long long TimeUtils::giayConLaiGiuGhe(const ThoiGian& thoiDiemGiu, int thoiHanGiuPhut) {
    ThoiGian bayGio;
    long long chenhLechGiay = (bayGio - thoiDiemGiu) * 60;
    long long thoiHanGiay = static_cast<long long>(thoiHanGiuPhut) * 60;
    return thoiHanGiay - chenhLechGiay;
}

std::string TimeUtils::dinhDangDemNguoc(long long giayConLai) {
    if (giayConLai < 0) giayConLai = 0;
    std::ostringstream oss;
    oss << std::setfill('0') << std::setw(2) << giayConLai / 60
        << ":" << std::setfill('0') << std::setw(2) << giayConLai % 60;
    return oss.str();
}
