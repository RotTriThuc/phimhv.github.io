@echo off
echo ================================================
echo    TAI VA PHAN LOAI PHIM THEO THE LOAI
echo ================================================
echo.
echo Dang tai phim tu KKPhim va phan loai theo 22 the loai...
echo Thoi gian du kien: 30-60 phut cho 1000 phim dau
echo.
echo Nhan Ctrl+C de dung lai
echo.

cd /d "%~dp0"
node download-movies.js

echo.
echo ================================================
echo    HOAN THANH!
echo ================================================
echo.
echo Kiem tra thu muc data/ de xem ket qua:
echo - kho-phim.json: Tat ca phim
echo - the-loai-*.json: Phim theo tung the loai  
echo - thong-ke.json: Thong ke chi tiet
echo.
pause 