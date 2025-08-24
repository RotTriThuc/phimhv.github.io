@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=once

echo ====================================
echo     KKPhim Auto-Updater v2.0
echo     WITH AUTO-PUSH TO GITHUB
echo ====================================
echo.

:: Kiem tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Khong tim thay Node.js. Vui long cai dat Node.js de chay script.
  echo.
  echo Download tai: https://nodejs.org/
  pause
  goto :eof
)

:: Hien thi thong tin
echo [START] Khoi dong Auto-Updater v2.0...
echo [INFO] Command: %COMMAND%
echo [INFO] Time: %date% %time%
echo [INFO] Auto-Push: ENABLED (will push to GitHub automatically)
echo [INFO] Config: data/auto-update-config.json
echo.

:: Chay script tuong ung voi command
if "%COMMAND%"=="start" (
  echo [DAEMON] Chay daemon mode - Cap nhat tu dong moi 5 phut
  echo [INFO] Nhan Ctrl+C de dung
  echo.
  node "%~dp0auto-update.js" start
) else if "%COMMAND%"=="daemon" (
  echo [DAEMON] Chay daemon mode - Cap nhat tu dong moi 5 phut  
  echo [INFO] Nhan Ctrl+C de dung
  echo.
  node "%~dp0auto-update.js" daemon
) else if "%COMMAND%"=="once" (
  echo [RUN] Chay cap nhat mot lan...
  echo.
  node "%~dp0auto-update.js" once
  echo.
  echo [DONE] Hoan tat. Nhan phim bat ky de dong...
  pause >nul
) else (
  echo [ERROR] Command khong hop le: %COMMAND%
  echo.
  echo [HELP] Cach su dung:
  echo   auto-update.bat once    - Chay cap nhat mot lan
  echo   auto-update.bat start   - Chay daemon tu dong cap nhat
  echo   auto-update.bat daemon  - Chay daemon tu dong cap nhat
  echo.
  pause
)

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Loi xay ra trong qua trinh cap nhat (Exit Code: %ERRORLEVEL%)
  echo [INFO] Kiem tra log o tren de biet chi tiet
  echo.
  pause
) 