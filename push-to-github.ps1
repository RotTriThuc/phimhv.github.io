# PowerShell Git Push Script
# Web Xem Anime - RotTriThuc

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    GIT PUSH SCRIPT (PowerShell)" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host "Repository: phimhv.github.io" -ForegroundColor Yellow
Write-Host "Author: RotTriThuc" -ForegroundColor Yellow
Write-Host "Time: $(Get-Date)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check Git repository
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: No Git repository found!" -ForegroundColor Red
    Write-Host "Please run: git init" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Git status
Write-Host "Checking Git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Write-Host "No changes to commit" -ForegroundColor Green
    Write-Host "Repository is up-to-date" -ForegroundColor Green
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "Found changes:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Get commit message
$defaultMessage = "Update: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$commitMsg = Read-Host "Enter commit message (or press Enter for default)"
if (-not $commitMsg) {
    $commitMsg = $defaultMessage
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "STARTING PUSH PROCESS..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Step 1: Add files
Write-Host ""
Write-Host "Step 1: Adding all files..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to add files!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Files added successfully" -ForegroundColor Green

# Step 2: Commit
Write-Host ""
Write-Host "Step 2: Committing changes..." -ForegroundColor Cyan
git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to commit!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Committed successfully" -ForegroundColor Green

# Step 3: Check remote branch and push
Write-Host ""
Write-Host "Step 3: Checking remote branch..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin $currentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Trying to push to main branch..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Trying to push to master branch..." -ForegroundColor Yellow
        git push origin master
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to push to GitHub!" -ForegroundColor Red
            Write-Host "Check:" -ForegroundColor Yellow
            Write-Host "- Internet connection" -ForegroundColor Yellow
            Write-Host "- GitHub credentials" -ForegroundColor Yellow
            Write-Host "- Repository URL" -ForegroundColor Yellow
            Write-Host "- Branch name (current: $currentBranch)" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "     SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Changes pushed to GitHub successfully!" -ForegroundColor Green
Write-Host "Repository: https://github.com/RotTriThuc/phimhv.github.io" -ForegroundColor Blue
Write-Host "Website: https://rottriThuc.github.io/phimhv.github.io/" -ForegroundColor Blue
Write-Host "GitHub Pages will auto-deploy the website" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tip: Website will update in 1-2 minutes" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Ask to open links
$openGitHub = Read-Host "Open GitHub repository? (y/n)"
if ($openGitHub -eq "y" -or $openGitHub -eq "Y") {
    Start-Process "https://github.com/RotTriThuc/phimhv.github.io"
}

$openWebsite = Read-Host "Open live website? (y/n)"
if ($openWebsite -eq "y" -or $openWebsite -eq "Y") {
    Start-Process "https://rottriThuc.github.io/phimhv.github.io/"
}

Write-Host ""
Write-Host "Done! Press Enter to close..." -ForegroundColor Green
Read-Host 