@echo off
echo Testing simple push script...

if not exist ".git" (
    echo No Git repository found!
    pause
    exit /b 1
)

echo Checking for changes...
git status --porcelain > temp.txt
set /p changes=<temp.txt
del temp.txt

if "%changes%"=="" (
    echo No changes to commit
    pause
    exit /b 0
)

echo Found changes, pushing...
git add .
git commit -m "Auto push: %date% %time%"
git push origin main

if %errorlevel% equ 0 (
    echo Push successful!
) else (
    echo Push failed!
)

pause 