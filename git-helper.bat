@echo off
title Git Helper - Web Xem Anime
color 0B
chcp 65001 >nul

:MAIN_MENU
cls
echo.
echo ╔══════════════════════════════════════╗
echo ║        🔧 GIT HELPER TOOL 🔧        ║
echo ╠══════════════════════════════════════╣
echo ║  📦 Repository: web-xem-anime       ║
echo ║  👤 Author: RotTriThuc               ║
echo ║  ⏰ Time: %date% %time%     ║
echo ╚══════════════════════════════════════╝
echo.

:: Kiểm tra Git repository
if not exist ".git" (
    echo ❌ Không phát hiện Git repository!
    echo 💡 Hãy chạy: git init
    echo.
    pause
    exit /b 1
)

echo 🎯 Chọn hành động:
echo.
echo [1] 📊 Git Status - Xem thay đổi
echo [2] 🚀 Quick Push - Push nhanh với message tự động
echo [3] ✍️  Custom Push - Push với message tùy chỉnh
echo [4] 📥 Pull - Lấy updates từ GitHub
echo [5] 📝 View Log - Xem commit history
echo [6] 🌐 Open Links - Mở GitHub/Website
echo [7] 🔄 Sync All - Pull + Push (full sync)
echo [0] ❌ Exit
echo.
set /p "choice=👉 Nhập lựa chọn (0-7): "

if "%choice%"=="1" goto STATUS
if "%choice%"=="2" goto QUICK_PUSH  
if "%choice%"=="3" goto CUSTOM_PUSH
if "%choice%"=="4" goto PULL
if "%choice%"=="5" goto LOG
if "%choice%"=="6" goto LINKS
if "%choice%"=="7" goto SYNC
if "%choice%"=="0" goto EXIT
goto MAIN_MENU

:STATUS
cls
echo 📊 GIT STATUS
echo ==========================================
git status
echo.
echo 📝 Detailed changes:
git diff --stat
echo.
pause
goto MAIN_MENU

:QUICK_PUSH
cls
echo 🚀 QUICK PUSH
echo ==========================================
:: Kiểm tra có thay đổi không
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if "%git_changes%"=="" (
    echo ✅ Không có thay đổi nào cần commit
    pause
    goto MAIN_MENU
)

set "quick_message=⚡ Quick update: %date% %time%"
echo 💬 Commit message: %quick_message%
echo.

git add .
git commit -m "%quick_message%"
git push origin main

if %errorlevel% equ 0 (
    echo ✅ Push thành công!
    echo 🌐 Website sẽ update sau 1-2 phút
) else (
    echo ❌ Push thất bại!
)
echo.
pause
goto MAIN_MENU

:CUSTOM_PUSH
cls
echo ✍️ CUSTOM PUSH
echo ==========================================
:: Kiểm tra có thay đổi không
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if "%git_changes%"=="" (
    echo ✅ Không có thay đổi nào cần commit
    pause
    goto MAIN_MENU
)

echo 📝 Các thay đổi hiện tại:
git status --short
echo.

echo 💡 Gợi ý commit messages:
echo   🎨 Improve UI/UX design
echo   🐛 Fix bug in movie search
echo   ✨ Add new feature
echo   📱 Improve mobile responsiveness  
echo   🚀 Performance improvements
echo   📝 Update documentation
echo   🔧 Configuration changes
echo.

set /p "custom_message=💬 Nhập commit message: "
if "%custom_message%"=="" (
    echo ❌ Message không được để trống!
    pause
    goto CUSTOM_PUSH
)

echo.
git add .
git commit -m "%custom_message%"
git push origin main

if %errorlevel% equ 0 (
    echo ✅ Push thành công!
    echo 🌐 Website sẽ update sau 1-2 phút
) else (
    echo ❌ Push thất bại!
)
echo.
pause
goto MAIN_MENU

:PULL
cls
echo 📥 PULL FROM GITHUB
echo ==========================================
git pull origin main
if %errorlevel% equ 0 (
    echo ✅ Pull thành công!
) else (
    echo ❌ Pull thất bại!
)
echo.
pause
goto MAIN_MENU

:LOG
cls
echo 📝 COMMIT HISTORY
echo ==========================================
git log --oneline -10
echo.
echo 📊 Contribution stats:
git shortlog -sn
echo.
pause
goto MAIN_MENU

:LINKS
cls
echo 🌐 OPEN LINKS
echo ==========================================
echo [1] 📦 GitHub Repository
echo [2] 🎬 Live Website  
echo [3] ⚡ GitHub Actions
echo [4] ⚙️ Repository Settings
echo [0] ← Back to main menu
echo.
set /p "link_choice=👉 Chọn link (0-4): "

if "%link_choice%"=="1" start https://github.com/RotTriThuc/web-xem-anime
if "%link_choice%"=="2" start https://rottriThuc.github.io/web-xem-anime/
if "%link_choice%"=="3" start https://github.com/RotTriThuc/web-xem-anime/actions
if "%link_choice%"=="4" start https://github.com/RotTriThuc/web-xem-anime/settings
if "%link_choice%"=="0" goto MAIN_MENU

echo ✅ Link đã được mở!
timeout /t 2 /nobreak >nul
goto MAIN_MENU

:SYNC
cls
echo 🔄 FULL SYNC
echo ==========================================
echo 📥 Step 1: Pulling from GitHub...
git pull origin main

echo.
echo 📊 Step 2: Checking for local changes...
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if not "%git_changes%"=="" (
    echo 📝 Found local changes, pushing...
    set "sync_message=🔄 Sync update: %date% %time%"
    git add .
    git commit -m "%sync_message%"
    git push origin main
    echo ✅ Sync complete!
) else (
    echo ✅ Already up-to-date!
)
echo.
pause
goto MAIN_MENU

:EXIT
echo.
echo 👋 Tạm biệt! Happy coding!
timeout /t 2 /nobreak >nul
exit /b 0 