@echo off
title KKPhim Auto-Updater Service
color 0A

echo.
echo ██╗  ██╗██╗  ██╗██████╗ ██╗  ██╗██╗███╗   ███╗
echo ██║ ██╔╝██║ ██╔╝██╔══██╗██║  ██║██║████╗ ████║
echo █████╔╝ █████╔╝ ██████╔╝███████║██║██╔████╔██║
echo ██╔═██╗ ██╔═██╗ ██╔═══╝ ██╔══██║██║██║╚██╔╝██║
echo ██║  ██╗██║  ██╗██║     ██║  ██║██║██║ ╚═╝ ██║
echo ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝
echo.
echo ========== AUTO-UPDATER SERVICE ==========
echo 🚀 Hệ thống cập nhật tự động phim mới
echo 📊 Nguồn: KKPhim.vip API
echo ⏰ Cập nhật mỗi 5 phút
echo ==========================================
echo.

:: Kiểm tra quyền admin (tùy chọn)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as Administrator
) else (
    echo ⚠️  Running as normal user
)
echo.

:: Tạo thư mục logs nếu chưa có
if not exist "logs" mkdir logs

:: Tạo timestamp cho log file
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set LOG_FILE=logs\auto-updater_%timestamp%.log

echo 📝 Log file: %LOG_FILE%
echo 💡 Nhấn Ctrl+C để dừng service
echo.
echo ⏰ Khởi động service lúc %date% %time%
echo.

:: Chạy auto-updater với log
echo Starting auto-updater daemon... >> %LOG_FILE%
echo Timestamp: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

scripts\auto-update.bat start 2>&1 | tee -a %LOG_FILE%

echo.
echo 🛑 Service đã dừng lúc %date% %time%
echo 📝 Log đã được lưu tại: %LOG_FILE%
echo.
pause 