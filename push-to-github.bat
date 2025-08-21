@echo off
title GitHub Auto Push - Web Xem Anime
color 0A
chcp 65001 >nul

echo.
echo ==========================================
echo     🚀 GITHUB AUTO PUSH SCRIPT 🚀
echo ==========================================
echo 📦 Repository: web-xem-anime
echo 👤 Author: RotTriThuc
echo ⏰ Time: %date% %time%
echo ==========================================
echo.

:: Kiểm tra Git repository
if not exist ".git" (
    echo ❌ Không phát hiện Git repository!
    echo 💡 Hãy chạy: git init
    echo.
    pause
    exit /b 1
)

:: Kiểm tra Git status
echo 📊 Kiểm tra Git status...
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if "%git_changes%"=="" (
    echo ✅ Không có thay đổi nào cần commit
    echo 💡 Repository đã up-to-date
    echo.
    pause
    exit /b 0
)

echo.
echo 📝 Phát hiện các thay đổi:
git status --short
echo.

:: Nhập commit message
set "default_message=🔄 Update: %date% %time%"
set /p "commit_msg=💬 Nhập commit message (Enter để dùng mặc định): "
if "%commit_msg%"=="" set "commit_msg=%default_message%"

echo.
echo ==========================================
echo 🔄 BẮT ĐẦU PUSH PROCESS...
echo ==========================================

:: Step 1: Add all files
echo.
echo 📁 Step 1: Adding all files...
git add .
if %errorlevel% neq 0 (
    echo ❌ Lỗi khi add files!
    pause
    exit /b 1
)
echo ✅ Added all files successfully

:: Step 2: Commit changes  
echo.
echo 💾 Step 2: Committing changes...
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo ❌ Lỗi khi commit!
    pause
    exit /b 1
)
echo ✅ Committed successfully

:: Step 3: Push to GitHub
echo.
echo 🚀 Step 3: Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Lỗi khi push to GitHub!
    echo 💡 Kiểm tra:
    echo    - Internet connection
    echo    - GitHub credentials
    echo    - Remote repository URL
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo     ✅ PUSH THÀNH CÔNG! ✅
echo ==========================================
echo 🎉 Changes đã được push lên GitHub!
echo 🌐 Repository: https://github.com/RotTriThuc/web-xem-anime
echo 📱 GitHub Pages: https://rottriThuc.github.io/web-xem-anime/
echo ⚡ GitHub Actions sẽ tự động deploy website
echo.
echo 💡 Tip: Website sẽ update sau 1-2 phút
echo ==========================================
echo.

:: Hỏi có muốn mở GitHub không
set /p "open_github=🌐 Mở GitHub repository? (y/n): "
if /i "%open_github%"=="y" (
    start https://github.com/RotTriThuc/web-xem-anime
)

set /p "open_website=🎬 Mở website live? (y/n): "
if /i "%open_website%"=="y" (
    start https://rottriThuc.github.io/web-xem-anime/
)

echo.
echo 🎯 Hoàn tất! Nhấn phím bất kỳ để đóng...
pause >nul 