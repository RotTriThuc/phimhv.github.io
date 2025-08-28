@echo off
setlocal enabledelayedexpansion
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

:: Kiểm tra xem có file nào để commit không
echo [STEP 3] Kiểm tra các thay đổi...
git diff --cached --quiet
if errorlevel 1 (
    echo [INFO] Có file mới để commit
    git commit -m "%commit_message%"
    if errorlevel 1 (
        echo [ERROR] Không thể commit các thay đổi!
        pause
        exit /b 1
    )
    echo [SUCCESS] Đã commit thành công ✓
) else (
    echo [INFO] Không có thay đổi mới để commit
    git log --oneline -1 >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Repository trống và không có file nào để commit!
        echo Vui lòng thêm ít nhất một file vào thư mục này.
        pause
        exit /b 1
    )
    echo [INFO] Sử dụng commit hiện có ✓
)

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

:: Kiểm tra và thiết lập branch main
echo [STEP 5] Thiết lập branch main...
git log --oneline -1 >nul 2>&1
if errorlevel 1 (
    echo [INFO] Repository chưa có commit, tạo branch main sau khi commit...
) else (
    for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set current_branch=%%i
    if "!current_branch!"=="master" (
        echo [INFO] Đổi tên branch từ master sang main...
        git branch -M main
        if errorlevel 1 (
            echo [ERROR] Không thể đổi tên branch!
            pause
            exit /b 1
        )
    ) else if "!current_branch!"=="" (
        echo [INFO] Tạo và chuyển sang branch main...
        git checkout -b main
        if errorlevel 1 (
            echo [ERROR] Không thể tạo branch main!
            pause
            exit /b 1
        )
    ) else (
        echo [INFO] Đang ở branch: !current_branch!
        if not "!current_branch!"=="main" (
            echo [INFO] Chuyển sang branch main...
            git checkout -b main 2>nul || git checkout main
        )
    )
)
echo [SUCCESS] Branch main đã sẵn sàng ✓

:: Kiểm tra kết nối với GitHub
echo [STEP 6] Kiểm tra kết nối với GitHub...
git ls-remote origin >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Không thể kết nối với GitHub repository!
    echo.
    echo Vui lòng kiểm tra:
    echo - Đường link repository có đúng không: %repo_url%
    echo - Repository có tồn tại và bạn có quyền truy cập không
    echo - Đã thiết lập authentication chưa (Personal Access Token hoặc SSH)
    echo.
    echo Để thiết lập Personal Access Token:
    echo 1. Vào GitHub Settings ^> Developer settings ^> Personal access tokens
    echo 2. Tạo token mới với quyền 'repo'
    echo 3. Sử dụng token làm mật khẩu khi Git yêu cầu
    echo.
    echo Thông tin Git hiện tại:
    echo User: %USERNAME%
    git config user.name 2>nul || echo [WARNING] Chưa thiết lập user.name
    git config user.email 2>nul || echo [WARNING] Chưa thiết lập user.email
    pause
    exit /b 1
)
echo [SUCCESS] Kết nối GitHub thành công ✓

:: Push lên GitHub
echo [STEP 7] Đang upload lên GitHub...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] Không thể push lên GitHub!
    echo.
    echo Lỗi có thể do:
    echo - Authentication thất bại (cần Personal Access Token)
    echo - Repository không có quyền write
    echo - Conflict với remote repository
    echo.
    echo Thử chạy lệnh sau để xem chi tiết lỗi:
    echo git push -u origin main
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