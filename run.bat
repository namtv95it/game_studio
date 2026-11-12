@echo off
title Game Studio

echo ==========================================================
echo               GAME STUDIO - KHOI DONG
echo ==========================================================
echo.

REM 1. Kiem tra Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LOI] May tinh chua cai dat Node.js!
    echo Vui long tai va cai dat Node.js tai: https://nodejs.org/
    echo.
    echo Nhan phim bat ky de mo trang tai Node.js...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

REM 2. Di chuyen vao thu muc chua file bat
cd /d "%~dp0"

REM 3. Tu dong pull code moi nhat tu Git ve
where git >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [DANG DONG BO] Dang tai code moi nhat tu Git...
    git pull
    if %ERRORLEVEL% neq 0 (
        echo [CANH BAO] Khong the pull code moi (co the do khong co Internet hoac xung dot).
        echo Dang tiep tuc chay voi phien ban hien tai tren may...
    ) else (
        echo [THANH CONG] Da cap nhat ma nguon moi nhat thanh cong!
    )
    echo.
)

REM 4. Kiem tra va cai dat thu vien neu chua co
if not exist "node_modules\" (
    echo [THONG BAO] Dang cai dat thu vien cho lan dau chay...
    echo Vui long cho trong giay lat...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [LOI] Cai dat that bai! Vui long kiem tra mang Internet.
        pause
        exit /b 1
    )
    echo.
    echo [THANH CONG] Da cai dat xong thu vien!
    echo.
)

REM 5. Khoi chay ung dung va tu dong mo trinh duyet
echo Dang khoi chay Game Studio...
echo Trinh duyet web se tu dong mo sau vai giay.
echo.
echo [Luu y] De tat ung dung, ban chi can dong cua so nay lai.
echo ==========================================================
echo.

call npm run dev -- --open

pause
