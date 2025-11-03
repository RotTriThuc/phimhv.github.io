@echo off
title Fix GitHub Pages 404 Error
color 0A

echo ========================================
echo    GITHUB PAGES 404 ERROR FIX
echo ========================================
echo.

echo [STEP 1] Checking current configuration...
if exist "CNAME" (
    echo ✅ CNAME file exists
    type CNAME
) else (
    echo ❌ CNAME file missing
    echo phimhv.site > CNAME
    echo ✅ Created CNAME file with phimhv.site
)

echo.
echo [STEP 2] Creating .nojekyll file...
if not exist ".nojekyll" (
    echo. > .nojekyll
    echo ✅ Created .nojekyll file
) else (
    echo ✅ .nojekyll file already exists
)

echo.
echo [STEP 3] Checking Git status...
git status --porcelain
if errorlevel 1 (
    echo ❌ Not a Git repository
    pause
    exit /b 1
)

echo.
echo [STEP 4] Adding and committing fixes...
git add CNAME .nojekyll
git commit -m "Fix: GitHub Pages 404 error - preserve CNAME and add .nojekyll"
if errorlevel 1 (
    echo ⚠️ Nothing to commit or commit failed
)

echo.
echo [STEP 5] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Push failed
    echo.
    echo Possible solutions:
    echo 1. Check internet connection
    echo 2. Verify Git credentials
    echo 3. Check repository permissions
    pause
    exit /b 1
)

echo.
echo ========================================
echo           SUCCESS!
echo ========================================
echo ✅ GitHub Pages configuration fixed
echo ✅ CNAME file preserved
echo ✅ .nojekyll file added
echo.
echo 🌐 Your website should be available at:
echo    https://phimhv.site
echo.
echo ⏰ Please wait 1-2 minutes for GitHub Pages to update
echo.
echo 💡 If still getting 404 errors:
echo    1. Check DNS settings at your domain provider
echo    2. Verify GitHub Pages settings in repository
echo    3. Wait for DNS propagation (up to 24 hours)
echo ========================================

pause
