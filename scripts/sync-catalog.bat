@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

set TYPES=%1
set OUT=%2
if "%TYPES%"=="" set TYPES=all
if "%OUT%"=="" set OUT=data\kho-phim.json

echo Dong bo kho phim tu KKPhim API...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Khong tim thay Node.js. Vui long cai dat Node.js de chay script.
  pause
  goto :eof
)

node scripts\sync-catalog.js --types=%TYPES% --out=%OUT%
if %ERRORLEVEL% EQU 0 (
  echo Hoan tat. File duoc luu tai %OUT%
) else (
  echo Loi xay ra trong qua trinh dong bo.
) 