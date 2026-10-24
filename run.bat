@echo off
chcp 65001 >nul
title Game Studio - Khởi Động Ứng Dụng

echo ==========================================================
echo               GAME STUDIO - KHỞI ĐỘNG
echo ==========================================================
echo.

:: 1. Kiểm tra Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Máy tính chưa cài đặt Node.js!
    echo Dự án cần có Node.js để hoạt động.
    echo.
    echo Nhấn phím bất kỳ để mở trang tải Node.js (khuyên dùng bản LTS)...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

:: 2. Di chuyển vào thư mục của file script
cd /d "%~dp0"

:: 3. Kiểm tra và cài đặt dependencies nếu chưa có
if not exist "node_modules\" (
    echo [THÔNG BÁO] Chưa tìm thấy thư viện (node_modules).
    echo Đang tự động cài đặt các thư viện cần thiết, vui lòng chờ trong giây lát...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [LỖI] Cài đặt thư viện thất bại! Vui lòng kiểm tra kết nối mạng.
        pause
        exit /b 1
    )
    echo.
    echo [THÀNH CÔNG] Đã cài đặt xong thư viện!
    echo.
)

:: 4. Khởi động ứng dụng và tự động mở trình duyệt
echo Đang khởi chạy ứng dụng Game Studio...
echo Trình duyệt web sẽ tự động mở sau vài giây.
echo.
echo (Để tắt ứng dụng, bạn chỉ cần đóng cửa sổ đen này lại)
echo ==========================================================
echo.

call npm run dev -- --open

pause
