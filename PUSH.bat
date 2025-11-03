@echo off
title Git Push - phimhv.github.io
echo Starting Git Push Script...

REM Kiểm tra file tồn tại
if not exist "push-to-github.ps1" (
    echo [ERROR] push-to-github.ps1 not found!
    pause
    exit /b 1
)

REM Thực thi với error handling
powershell -ExecutionPolicy Bypass -File "push-to-github.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell script failed with error code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
) else (
    echo [SUCCESS] Git push completed successfully!
)