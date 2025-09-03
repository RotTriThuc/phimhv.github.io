# 🔧 **AUTO-UPDATE CONFIGURATION GUIDE**

## 📊 **Cấu hình mặc định**

Script sẽ tự động tạo file `data/auto-update-config.json` với các settings sau:

```json
{
  "updateInterval": 300000, // 5 phút (milliseconds)
  "maxRetries": 3, // Số lần retry khi API fail
  "batchSize": 24, // Kích thước batch
  "enableNotifications": true, // Bật thông báo
  "trackNewEpisodes": true, // Theo dõi tập mới
  "trackNewMovies": true, // Theo dõi phim mới
  "autoPushToGit": true, // 🆕 TỰ ĐỘNG PUSH LẾN GITHUB
  "gitCommitMessage": "Auto-update: {updateSummary}" // Template commit message
}
```

## 🚀 **Auto-Push to GitHub**

### **✅ Khi nào script sẽ tự động push:**

- Có phim mới được phát hiện
- Có tập mới của phim hiện tại
- File data được cập nhật thành công

### **🔧 Cách hoạt động:**

1. **Check Git status** - Kiểm tra có changes không
2. **Git add .** - Add tất cả changes
3. **Git commit** - Commit với message tự động
4. **Git push origin main** - Push lên GitHub

### **📝 Commit Message Template:**

- `Auto-update: 🎬 5 phim mới • 📺 12 tập mới`
- `Auto-update: 🔄 8 phim cập nhật`
- `Auto-update: 🎬 2 phim mới • 🔄 3 phim cập nhật`

## ⚙️ **Tùy chỉnh Config**

### **Tắt Auto-Push:**

```json
{
  "autoPushToGit": false
}
```

### **Thay đổi Commit Message:**

```json
{
  "gitCommitMessage": "📱 Movie DB Update: {updateSummary}"
}
```

### **Thay đổi Update Interval:**

```json
{
  "updateInterval": 600000 // 10 phút
}
```

## 🎯 **Cách sử dụng**

### **1. Chạy một lần (với auto-push):**

```bash
cd scripts
node auto-update.js once
```

### **2. Chạy daemon (tự động mỗi 5 phút):**

```bash
cd scripts
node auto-update.js start
```

### **3. Chạy qua batch file:**

```bash
scripts\auto-update.bat once
scripts\auto-update.bat start
```

## 🚨 **Lưu ý quan trọng**

### **⚠️ Yêu cầu:**

- Git phải được cài đặt và config
- Repository phải có remote origin đã setup
- Có quyền push lên GitHub repository

### **🔑 Authentication:**

- Sử dụng SSH key hoặc Personal Access Token
- Đảm bảo Git credentials đã được setup

### **📁 File Locations:**

- **Config:** `data/auto-update-config.json`
- **Data:** `data/kho-phim.json`
- **Logs:** `data/updates-log.json`
- **Notifications:** `data/latest-notification.json`

## 📊 **Monitoring**

### **Console Output:**

```
🔄 Starting update at 22/01/2025 15:30:45
📊 Loaded 1250 existing movies
📡 Fetched 72 latest movies
💾 Saved 1255 movies to database

🔄 Attempting to push updates to GitHub...
📦 Adding files to Git...
💬 Committing with message: "Auto-update: 🎬 5 phim mới • 📺 12 tập mới"
🚀 Pushing to GitHub...
✅ Successfully pushed to GitHub!
🎉 Auto-push completed successfully!

✅ Update completed in 3.45s
📊 Stats: 5 new movies, 12 new episodes, 8 updates
🔔 🎬 5 phim mới • 📺 12 tập mới • 🔄 8 phim cập nhật
```

## 🐛 **Troubleshooting**

### **Git Push Fails:**

```
❌ Failed to push to GitHub: remote rejected
```

**Solution:** Check repository permissions và conflicts

### **Not a Git Repository:**

```
❌ Failed to push to GitHub: not a git repository
```

**Solution:** Initialize Git trong project root

### **Authentication Required:**

```
❌ Failed to push to GitHub: authentication required
```

**Solution:** Setup SSH key hoặc Personal Access Token

## 🎯 **Best Practices**

1. **Test trước khi enable auto-push**
2. **Monitor console output** để detect issues
3. **Backup data** trước khi chạy auto-updater
4. **Set appropriate update intervals** (không quá thường xuyên)
5. **Check GitHub repository** để confirm pushes thành công
