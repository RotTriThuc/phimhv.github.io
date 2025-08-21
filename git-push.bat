@echo off
title Git Push Script
color 0A

echo.
echo ========================================
echo    GIT PUSH SCRIPT
echo ========================================
echo Repository: web-xem-anime
echo Author: RotTriThuc
echo Time: %date% %time%
echo ========================================
echo.

REM Check Git repository
if not exist ".git" (
    echo ERROR: No Git repository found!
    echo Please run: git init
    echo.
    pause
    exit /b 1
)

REM Check Git status
echo Checking Git status...
git status --porcelain > temp_git_status.txt
set /p git_changes=<temp_git_status.txt
del temp_git_status.txt

if "%git_changes%"=="" (
    echo No changes to commit
    echo Repository is up-to-date
    echo.
    pause
    exit /b 0
)

echo.
echo Found changes:
git status --short
echo.

REM Get commit message
set "default_message=Update: %date% %time%"
set /p "commit_msg=Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set "commit_msg=%default_message%"

echo.
echo ========================================
echo STARTING PUSH PROCESS...
echo ========================================

REM Step 1: Add files
echo.
echo Step 1: Adding all files...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files!
    pause
    exit /b 1
)
echo Files added successfully

REM Step 2: Commit
echo.
echo Step 2: Committing changes...
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to commit!
    pause
    exit /b 1
)
echo Committed successfully

REM Step 3: Push
echo.
echo Step 3: Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push to GitHub!
    echo Check:
    echo - Internet connection
    echo - GitHub credentials
    echo - Repository URL
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo     SUCCESS!
echo ========================================
echo Changes pushed to GitHub successfully!
echo Repository: https://github.com/RotTriThuc/web-xem-anime
echo Website: https://rottriThuc.github.io/web-xem-anime/
echo GitHub Actions will auto-deploy the website
echo.
echo Tip: Website will update in 1-2 minutes
echo ========================================
echo.

REM Ask to open links
set /p "open_github=Open GitHub repository? (y/n): "
if /i "%open_github%"=="y" (
    start https://github.com/RotTriThuc/web-xem-anime
)

set /p "open_website=Open live website? (y/n): "
if /i "%open_website%"=="y" (
    start https://rottriThuc.github.io/web-xem-anime/
)

echo.
echo Done! Press any key to close...
pause >nul 