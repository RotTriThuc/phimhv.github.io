@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

set PORT=%1
if "%PORT%"=="" set PORT=5173

echo.
echo Dang khoi dong server tai http://localhost:%PORT%
echo (Uu tien npx serve, neu khong co se dung Python)
echo.

where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Su dung npx serve
  npx --yes serve -l %PORT% .
  goto :eof
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Su dung Python Launcher (py)
  py -3 -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  python --version >nul 2>nul
  if %ERRORLEVEL%==0 (
    echo Su dung Python
    python -m http.server %PORT%
    goto :eof
  )
)

echo Khong tim thay Python hoac npx (Node.js). Vui long cai dat Python 3 hoac Node.js de chay server.
pause 