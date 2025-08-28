@echo off
echo 🔧 Fixing Git submodule issues and pushing changes...

REM Remove problematic submodule directory if exists
if exist "ClaudeComputerCommander" (
    echo Removing ClaudeComputerCommander directory...
    rmdir /s /q "ClaudeComputerCommander"
)

REM Clean git cache
echo Cleaning git cache...
git rm -r --cached ClaudeComputerCommander 2>nul

REM Add all changes
echo Adding changes...
git add .

REM Check git status
echo Current git status:
git status

REM Commit changes
echo Committing changes...
git commit -m "🔧 Fix CORS and 404 errors + Remove orphaned submodule ClaudeComputerCommander"

REM Push to origin
echo Pushing to GitHub...
git push origin main

echo ✅ Git operations completed!
pause
