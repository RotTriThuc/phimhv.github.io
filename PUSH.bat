@echo off
title Git Push - Web Xem Anime
color 0A
echo.
echo ========================================
echo    GIT PUSH SCRIPT (Batch Wrapper)
echo ========================================
echo Repository: phimhv.github.io
echo Time: %date% %time%
echo ========================================
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not a Git repository!
    echo Please run: git init
    echo.
    pause
    exit /b 1
)

REM Check if PowerShell script exists
if not exist "push-to-github.ps1" (
    echo [ERROR] push-to-github.ps1 not found!
    echo Please ensure the PowerShell script is in the same directory.
    echo.
    pause
    exit /b 1
)

REM Check PowerShell execution policy
echo Checking PowerShell execution policy...
powershell -Command "Get-ExecutionPolicy" > temp_policy.txt
set /p POLICY=<temp_policy.txt
del temp_policy.txt

if "%POLICY%"=="Restricted" (
    echo [WARNING] PowerShell execution policy is Restricted
    echo Attempting to bypass for this session...
)

echo.
echo Starting PowerShell script...
echo ----------------------------------------

REM Execute PowerShell script with better error handling
powershell -ExecutionPolicy Bypass -NoProfile -File "push-to-github.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Git push completed successfully!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo [ERROR] PowerShell script failed!
    echo Error code: %ERRORLEVEL%
    echo ========================================
    echo.
    echo Possible solutions:
    echo - Check internet connection
    echo - Verify Git credentials
    echo - Ensure repository exists
    echo - Check branch permissions
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo Press any key to close...
pause >nul