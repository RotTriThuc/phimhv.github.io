@echo off
title Test Git Push Script
echo.
echo Testing Git Push Script...
echo.

REM Check if git repository exists
if not exist ".git" (
    echo Error: No Git repository found!
    echo Please run: git init
    pause
    exit /b 1
)

REM Check git status
echo Checking Git status...
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if "%git_changes%"=="" (
    echo No changes to commit
    echo Repository is up-to-date
    pause
    exit /b 0
)

echo.
echo Found changes:
git status --short
echo.

REM Get commit message
set "default_message=Test update"
set /p "commit_msg=Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set "commit_msg=%default_message%"

echo.
echo Starting push process...
echo.

REM Add files
echo Step 1: Adding files...
git add .
if %errorlevel% neq 0 (
    echo Error adding files!
    pause
    exit /b 1
)
echo Files added successfully

REM Commit
echo.
echo Step 2: Committing...
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo Error committing!
    pause
    exit /b 1
)
echo Committed successfully

REM Push
echo.
echo Step 3: Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo Error pushing to GitHub!
    echo Check:
    echo - Internet connection
    echo - GitHub credentials
    echo - Repository URL
    pause
    exit /b 1
)

echo.
echo SUCCESS! Changes pushed to GitHub!
echo Repository: https://github.com/RotTriThuc/web-xem-anime
echo Website: https://rottriThuc.github.io/web-xem-anime/
echo.
echo Done! Press any key to close...
pause >nul 