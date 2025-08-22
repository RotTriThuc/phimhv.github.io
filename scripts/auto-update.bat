@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=once

echo ====================================
echo     KKPhim Auto-Updater v2.0
echo     🚀 WITH AUTO-PUSH TO GITHUB
echo ====================================
echo.

:: Kiểm tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Khong tim thay Node.js. Vui long cai dat Node.js de chay script.
  echo.
  echo Download tai: https://nodejs.org/
  pause
  goto :eof
)

:: Hiển thị thông tin
echo 🚀 Khoi dong Auto-Updater v2.0...
echo 📊 Command: %COMMAND%
echo 🕐 Time: %date% %time%
echo 🌐 Auto-Push: ENABLED (will push to GitHub automatically)
echo 📝 Config: data/auto-update-config.json
echo.

:: Chạy script tương ứng với command
if "%COMMAND%"=="start" (
  echo ⏰ Chạy daemon mode - Cập nhật tự động mỗi 5 phút
  echo 💡 Nhấn Ctrl+C để dừng
  echo.
  node "%~dp0auto-update.js" start
) else if "%COMMAND%"=="daemon" (
  echo ⏰ Chạy daemon mode - Cập nhật tự động mỗi 5 phút  
  echo 💡 Nhấn Ctrl+C để dừng
  echo.
  node "%~dp0auto-update.js" daemon
) else if "%COMMAND%"=="once" (
  echo 🔄 Chạy cập nhật một lần...
  echo.
  node "%~dp0auto-update.js" once
  echo.
  echo ✅ Hoàn tất. Nhấn phím bất kỳ để đóng...
  pause >nul
) else (
  echo ❌ Command không hợp lệ: %COMMAND%
  echo.
  echo 📖 Cách sử dụng:
  echo   auto-update.bat once    - Chạy cập nhật một lần
  echo   auto-update.bat start   - Chạy daemon tự động cập nhật
  echo   auto-update.bat daemon  - Chạy daemon tự động cập nhật
  echo.
  pause
)

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ❌ Lỗi xảy ra trong quá trình cập nhật (Exit Code: %ERRORLEVEL%)
  echo 📝 Kiểm tra log ở trên để biết chi tiết
  echo.
  pause
) 