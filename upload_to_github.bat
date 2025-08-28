@echo off
chcp 65001 >nul
color 0A

echo ===============================================
echo         UPLOAD FILES TO GITHUB TOOL
echo ===============================================
echo.

:: Kiểm tra xem Git đã được cài đặt hay chưa
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git chưa được cài đặt trên máy của bạn!
    echo Vui lòng tải và cài đặt Git từ: https://git-scm.com/
    pause
    exit /b 1
)

echo [INFO] Đang kiểm tra Git... ✓
echo.

:: Nhập thông tin từ người dùng
set /p repo_url="Nhập đường link GitHub repository (VD: https://github.com/username/repo.git): "
if "%repo_url%"=="" (
    echo [ERROR] Bạn phải nhập đường link repository!
    pause
    exit /b 1
)

set /p commit_message="Nhập commit message (để trống sẽ dùng 'Initial commit'): "
if "%commit_message%"=="" set commit_message=Initial commit

echo.
echo ===============================================
echo Repository: %repo_url%
echo Commit message: %commit_message%
echo Thư mục hiện tại: %CD%
echo ===============================================
echo.

set /p confirm="Bạn có chắc chắn muốn upload tất cả file trong thư mục này? (y/N): "
if /i not "%confirm%"=="y" (
    echo Đã hủy thao tác.
    pause
    exit /b 0
)

echo.
echo [INFO] Bắt đầu quá trình upload...
echo.

:: Khởi tạo Git repository nếu chưa có
if not exist ".git" (
    echo [STEP 1] Khởi tạo Git repository...
    git init
    if errorlevel 1 (
        echo [ERROR] Không thể khởi tạo Git repository!
        pause
        exit /b 1
    )
    echo [SUCCESS] Đã khởi tạo Git repository ✓
) else (
    echo [STEP 1] Git repository đã tồn tại ✓
)

:: Thêm tất cả file vào staging area
echo [STEP 2] Thêm tất cả file vào Git...
git add .
if errorlevel 1 (
    echo [ERROR] Không thể thêm file vào Git!
    pause
    exit /b 1
)
echo [SUCCESS] Đã thêm tất cả file ✓

:: Commit các thay đổi
echo [STEP 3] Commit các thay đổi...
git commit -m "%commit_message%"
if errorlevel 1 (
    echo [WARNING] Không có thay đổi nào để commit hoặc đã commit rồi
)
echo [SUCCESS] Đã commit thành công ✓

:: Kiểm tra và thêm remote origin
git remote | findstr origin >nul
if errorlevel 1 (
    echo [STEP 4] Thêm remote repository...
    git remote add origin "%repo_url%"
    if errorlevel 1 (
        echo [ERROR] Không thể thêm remote repository!
        pause
        exit /b 1
    )
    echo [SUCCESS] Đã thêm remote repository ✓
) else (
    echo [STEP 4] Cập nhật remote repository...
    git remote set-url origin "%repo_url%"
    echo [SUCCESS] Đã cập nhật remote repository ✓
)

:: Kiểm tra branch hiện tại và đổi tên thành main nếu cần
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
if "%current_branch%"=="master" (
    echo [INFO] Đổi tên branch từ master sang main...
    git branch -M main
)
if "%current_branch%"=="" (
    echo [INFO] Tạo branch main...
    git checkout -b main
)

:: Push lên GitHub
echo [STEP 5] Đang upload lên GitHub...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] Không thể push lên GitHub!
    echo Vui lòng kiểm tra:
    echo - Đường link repository có đúng không
    echo - Bạn có quyền truy cập repository không
    echo - Đã đăng nhập Git chưa (git config user.name và user.email)
    echo.
    echo Để thiết lập thông tin Git:
    echo git config --global user.name "Tên của bạn"
    echo git config --global user.email "email@example.com"
    pause
    exit /b 1
)

echo.
echo ===============================================
echo [SUCCESS] UPLOAD THÀNH CÔNG! 🎉
echo.
echo Tất cả file đã được upload lên:
echo %repo_url%
echo.
echo Bạn có thể truy cập repository để xem kết quả.
echo ===============================================
echo.

pause 