@echo off
title Daily Push - Web Xem Anime
color 0E

:: Quick push script - no interaction needed
echo 🚀 Daily Push Script - %date% %time%
echo.

:: Check for changes
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if "%git_changes%"=="" (
    echo ✅ No changes to commit
    timeout /t 3 /nobreak >nul
    exit /b 0
)

:: Auto commit with date
set "daily_message=📅 Daily update: %date%"
echo 💬 Message: %daily_message%

git add .
git commit -m "%daily_message%"
git push origin main

if %errorlevel% equ 0 (
    echo ✅ Pushed successfully!
    echo 🌐 Website will update in 1-2 minutes
) else (
    echo ❌ Push failed!
)

timeout /t 5 /nobreak >nul 