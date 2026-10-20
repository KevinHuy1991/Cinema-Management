#ifndef TIME_UTILS_H
#define TIME_UTILS_H

#include <iostream>
#include <string>
#include <stdexcept>

// Cac lop ngoai le nghiep vu cua he thong rap chieu phim
class CinemaException : public std::runtime_error {
public:
    explicit CinemaException(const std::string& msg) : std::runtime_error(msg) {}
};

class SeatUnavailableException : public CinemaException {
public:
    explicit SeatUnavailableException(const std::string& msg) : CinemaException(msg) {}
};

class ScheduleConflictException : public CinemaException {
public:
    explicit ScheduleConflictException(const std::string& msg) : CinemaException(msg) {}
};

// Lop ThoiGian: bieu dien thoi diem (ngay/thang/nam gio:phut)
// va nap chong toan tu so sanh, cong/tru de phuc vu xep lich chieu phim
class ThoiGian {
private:
    int ngay;
    int thang;
    int nam;
    int gio;
    int phut;

    static bool laNamNhuan(int nam);
    static int soNgayTrongThang(int thang, int nam);

public:
    // Mac dinh: lay thoi diem hien tai cua he thong
    ThoiGian();
    ThoiGian(int ngay, int thang, int nam, int gio, int phut);

    int getNgay() const { return ngay; }
    int getThang() const { return thang; }
    int getNam() const { return nam; }
    int getGio() const { return gio; }
    int getPhut() const { return phut; }

    // Tra ve false neu gia tri khong hop le (khong thay doi du lieu cu)
    bool datThoiGian(int ngay, int thang, int nam, int gio, int phut);

    // Doi sang tong so phut ke tu moc 01/01/0000 de so sanh nhanh
    long long doiRaPhut() const;

    // Nap chong toan tu so sanh thoi gian theo thu tu thoi gian thuc
    friend bool operator==(const ThoiGian& a, const ThoiGian& b);
    friend bool operator!=(const ThoiGian& a, const ThoiGian& b);
    friend bool operator<(const ThoiGian& a, const ThoiGian& b);
    friend bool operator>(const ThoiGian& a, const ThoiGian& b);
    friend bool operator<=(const ThoiGian& a, const ThoiGian& b);
    friend bool operator>=(const ThoiGian& a, const ThoiGian& b);

    // Cong/them mot khoang thoi gian tinh bang phut (ho tro tinh gio ket thuc phim)
    ThoiGian operator+(int soPhut) const;
    ThoiGian& operator+=(int soPhut);

    // Hieu hai thoi diem, tra ve so phut chenh lech (am neu a som hon b)
    long long operator-(const ThoiGian& b) const;

    friend std::ostream& operator<<(std::ostream& os, const ThoiGian& t);
    friend std::istream& operator>>(std::istream& is, ThoiGian& t);

    // Dinh dang "dd/MM/yyyy HH:mm"
    std::string toString() const;
    static ThoiGian tuChuoi(const std::string& chuoi); // "dd/MM/yyyy HH:mm"
};

// Dinh nghia biet danh DateTime dong nhat voi ThoiGian
using DateTime = ThoiGian;

// Cac ham tien ich xu lich chieu phim
namespace TimeUtils {
    // Kiem tra hai suat chieu co bi trung lich khong
    // (hai doan [gioBatDau, gioBatDau + thoiLuongPhut) co diem chung hay khong)
    bool kiemTraTrungLich(const ThoiGian& gioBatDau1, int thoiLuongPhut1,
                          const ThoiGian& gioBatDau2, int thoiLuongPhut2);

    // So giay con lai cua phien giu ghe (<= 0 nghia la het han)
    long long giayConLaiGiuGhe(const ThoiGian& thoiDiemGiu, int thoiHanGiuPhut);

    // Dinh dang dem nguoc "mm:ss" de hien thi cho khach hang giu ghe
    std::string dinhDangDemNguoc(long long giayConLai);
}

#endif
