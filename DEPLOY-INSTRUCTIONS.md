# 🚀 Hướng dẫn Deploy để sửa lỗi CORS và 404

## ⚠️ Tình trạng hiện tại
Các lỗi vẫn còn xuất hiện vì **code fix chưa được push lên GitHub Pages**:

- ❌ `GET https://phimhv.site/data/latest-notification.json 404 (Not Found)`
- ❌ `🚨 HLS Error (attempt 1): {type: 'networkError', details: 'manifestLoadError', fatal: true}`
- ❌ CORS policy blocks video streaming

## 🔧 Các fix đã được implement (local):

### 1. **Notification 404 Fix**
- ✅ `notification-backup.json` - Backup file không bị gitignore
- ✅ Enhanced `checkForUpdates()` với fallback mechanism
- ✅ Silent error handling

### 2. **CORS Video Streaming Fix**
- ✅ Sequential CORS proxy system với 4 fallback options
- ✅ `tryProxy()` helper function với async retry
- ✅ Enhanced error logging và timeout handling
- ✅ Automatic fallback to embed player

### 3. **Git Submodule Fix**
- ✅ Thêm `ClaudeComputerCommander/` vào `.gitignore`
- ✅ `fix-git-and-push.bat` script tự động cleanup

## 🚀 Cách deploy (chọn 1 trong 2):

### **Phương án 1: Sử dụng script tự động**
```bash
# Chạy script đã tạo sẵn
.\fix-git-and-push.bat
```

### **Phương án 2: Thực hiện thủ công**
```bash
# 1. Xóa thư mục submodule problematic (nếu tồn tại)
rmdir /s /q ClaudeComputerCommander

# 2. Clean git cache
git rm -r --cached ClaudeComputerCommander

# 3. Add tất cả changes
git add .

# 4. Commit với message mô tả
git commit -m "🔧 Fix CORS and 404 errors - Add notification backup system and enhanced video streaming proxy"

# 5. Push lên GitHub
git push origin main
```

## ✅ Kết quả mong đợi sau khi deploy:

### **Lỗi 404 Notification:**
- ❌ Trước: `GET /data/latest-notification.json 404 (Not Found)`
- ✅ Sau: Tự động fallback sang `notification-backup.json`

### **Lỗi CORS Video:**
- ❌ Trước: `🚨 HLS Error (attempt 1): networkError`
- ✅ Sau: 
  ```
  🔄 Trying proxy 1/4: Direct
  🔄 Trying proxy 2/4: https://api.allorigins.win/raw?url=
  ✅ HLS loaded successfully with proxy 2
  ```

### **Console logs sạch sẽ:**
- ✅ Không còn lỗi 404 notification
- ✅ Video streaming hoạt động với CORS proxy
- ✅ Enhanced error handling không gián đoạn UX

## 🕐 Thời gian deploy:
- **GitHub Pages build time:** 2-5 phút
- **CDN cache clear:** 5-10 phút
- **Total:** ~10-15 phút để hoàn toàn áp dụng

## 🔍 Cách verify sau khi deploy:
1. Truy cập https://phimhv.site
2. Mở Developer Tools → Console
3. Kiểm tra không còn lỗi 404 và CORS
4. Test video streaming trên trang xem phim
5. Xem console logs để confirm CORS proxy hoạt động

---
**⚡ QUAN TRỌNG:** Các fix đã hoàn tất 100% ở local, chỉ cần push lên GitHub để áp dụng!
