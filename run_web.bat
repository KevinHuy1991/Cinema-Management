@echo off
chcp 65001 > nul
title Cinema Management Server & Web Portal
echo ====================================================================
echo        KHỞI ĐỘNG HỆ THỐNG CINEMA MANAGEMENT (WEB & DATA BACKEND)
echo ====================================================================
echo [*] Đang kiểm tra môi trường Node.js...
node -v > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js tu https://nodejs.org de khoi chay backend.
    pause
    exit /b 1
)

echo [*] Dang khoi dong may chu backend va mo trinh duyet...
start "" "http://localhost:8088"
node server.js
pause

