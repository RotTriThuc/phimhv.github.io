@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

:: ============================================
:: 🎬 PhimHV - React Development Server
:: ============================================
:: Updated for React + Vite + TypeScript
:: ============================================

echo.
echo ================================
echo  PhimHV React Dev Server
echo ================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js khong duoc cai dat!
  echo.
  echo Vui long cai dat Node.js tu: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

:: Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm khong duoc cai dat!
  echo.
  pause
  exit /b 1
)

:: Navigate to react-app directory
if not exist "react-app" (
  echo [ERROR] Thu muc react-app khong ton tai!
  echo.
  pause
  exit /b 1
)

cd react-app

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
  echo.
  echo [INFO] Dang cai dat dependencies...
  echo.
  call npm install
  if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Cai dat dependencies that bai!
    echo.
    cd ..
    pause
    exit /b 1
  )
)

:: Start Vite dev server
echo.
echo ================================
echo  Starting Vite Dev Server...
echo ================================
echo.
echo  URL: http://localhost:5173/
echo  Hot Module Replacement: ON
echo  Press Ctrl+C to stop
echo.
echo ================================
echo.

:: Run dev server
call npm run dev

:: If dev server exits, return to root
cd ..
echo.
echo [INFO] Dev server stopped.
pause 