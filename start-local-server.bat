@echo off
echo 🚀 Starting Local Server for Admin Panel Testing...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python found, starting HTTP server on port 8000...
    echo 📱 Admin Panel: http://localhost:8000/admin-panel.html
    echo 🏠 Main Site: http://localhost:8000/index.html
    echo 🧪 Test Page: http://localhost:8000/test-notification-admin.html
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node.js found, checking for http-server...
    npx http-server --version >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ http-server available, starting on port 8000...
        echo 📱 Admin Panel: http://localhost:8000/admin-panel.html
        echo 🏠 Main Site: http://localhost:8000/index.html
        echo 🧪 Test Page: http://localhost:8000/test-notification-admin.html
        echo.
        echo Press Ctrl+C to stop the server
        echo.
        npx http-server -p 8000 -c-1
        goto :end
    ) else (
        echo ⚠️ http-server not found, installing...
        npm install -g http-server
        if %errorlevel% == 0 (
            echo ✅ http-server installed, starting server...
            echo 📱 Admin Panel: http://localhost:8000/admin-panel.html
            echo 🏠 Main Site: http://localhost:8000/index.html
            echo 🧪 Test Page: http://localhost:8000/test-notification-admin.html
            echo.
            echo Press Ctrl+C to stop the server
            echo.
            npx http-server -p 8000 -c-1
            goto :end
        )
    )
)

REM If neither Python nor Node.js is available
echo ❌ Neither Python nor Node.js found!
echo.
echo Please install one of the following:
echo 1. Python 3.x: https://www.python.org/downloads/
echo 2. Node.js: https://nodejs.org/
echo.
echo Then run this script again.
echo.
echo Alternative: Use VS Code Live Server extension or any other local server.
echo.

:end
pause
