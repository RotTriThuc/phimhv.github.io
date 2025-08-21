# 🚀 Hệ Thống Cập Nhật Tự Động KKPhim

## 📖 Tổng quan

Hệ thống Auto-Updater tự động cập nhật phim mới và tập phim mới từ KKPhim.vip API, đảm bảo website luôn có nội dung mới nhất.

## ⚡ Tính năng chính

### 🎬 **Tracking Changes**
- **Phim mới hoàn toàn**: Phát hiện phim vừa thêm vào database
- **Tập mới**: Theo dõi episode mới của phim bộ
- **Cập nhật chất lượng**: HD → FHD, thêm Vietsub/Thuyết minh
- **Poster mới**: Cập nhật hình ảnh poster

### 🔔 **Notification System**
- **Real-time alerts**: Thông báo ngay khi có cập nhật
- **Smart deduplication**: Không spam notification trùng lặp
- **Auto-hide**: Tự ẩn sau 10 giây
- **Cross-session**: Lưu trạng thái qua localStorage

### 📊 **Statistics & Logging**
- **Update logs**: Lịch sử 100 lần cập nhật gần nhất
- **Performance stats**: Thời gian xử lý, số lượng phim checked
- **Error tracking**: Log chi tiết khi có lỗi
- **Config management**: Tùy chỉnh interval, retry logic

## 🛠️ Cài đặt & Sử dụng

### **1. Chạy một lần (Manual Update)**
```cmd
scripts\auto-update.bat once
```
- Cập nhật ngay lập tức
- Hiển thị kết quả và thoát
- Phù hợp để test hoặc cập nhật thủ công

### **2. Chạy daemon (Background Service)**
```cmd
scripts\auto-update.bat start
```
- Chạy liên tục mỗi 5 phút
- Nhấn `Ctrl+C` để dừng
- Phù hợp cho production

### **3. Chạy với full logging**
```cmd
start-auto-updater.bat
```
- Giao diện đẹp với ASCII art
- Log chi tiết vào file `logs/`
- Hiển thị stats realtime

## 📁 Cấu trúc Files

```
├── scripts/
│   ├── auto-update.js      # Core updater logic
│   └── auto-update.bat     # Windows wrapper
├── data/
│   ├── kho-phim.json           # Main movie database
│   ├── updates-log.json        # Update history (100 records)
│   ├── latest-notification.json # Current notification
│   └── auto-update-config.json # Settings
├── logs/                       # Update logs
└── start-auto-updater.bat     # Service launcher
```

## ⚙️ Configuration

### **Config file: `data/auto-update-config.json`**
```json
{
  "updateInterval": 300000,     // 5 phút (ms)
  "maxRetries": 3,              // Retry khi API lỗi
  "batchSize": 24,              // Số phim per request
  "enableNotifications": true,   // Bật thông báo
  "trackNewEpisodes": true,     // Theo dõi tập mới
  "trackNewMovies": true        // Theo dõi phim mới
}
```

## 📊 API Endpoints Used

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `/danh-sach/phim-moi-cap-nhat-v3` | Latest movies | Every 5 min |
| `/danh-sach/phim-bo` | Series updates | On demand |
| `/danh-sach/hoat-hinh` | Anime updates | On demand |

## 🔔 Notification Examples

### **Phim mới**
```
🔔 Cập nhật mới!
🎬 3 phim mới • 📺 7 tập mới • 🔄 2 phim cập nhật
21/08/2025 15:30:45
```

### **Chỉ có tập mới**
```
🔔 Cập nhật mới!
📺 5 tập mới
21/08/2025 15:30:45
```

## 📈 Performance

### **Typical Stats**
- **Update time**: 2-5 giây
- **API calls**: 3 requests (3 pages)
- **Data processed**: ~70 movies per update
- **Memory usage**: <50MB
- **CPU impact**: Minimal

### **Optimization Features**
- **Smart caching**: Chỉ update khi có thay đổi
- **Batch processing**: Group API requests
- **Retry logic**: Handle API timeouts
- **Rate limiting**: 500ms delay between requests

## 🐛 Troubleshooting

### **Common Issues**

**1. "Node.js not found"**
```
❌ Khong tim thay Node.js
```
**Solution**: Install Node.js từ https://nodejs.org/

**2. "API timeout"**
```
⚠️ Attempt 3/3 failed for https://phimapi.com/...
```
**Solution**: Check internet connection, API có thể tạm thời down

**3. "Permission denied"**
```
❌ Failed to save updates log: EACCES
```
**Solution**: Run as Administrator hoặc check folder permissions

### **Debug Mode**
Thêm debug logging:
```javascript
// Trong auto-update.js
console.log('DEBUG:', JSON.stringify(movie, null, 2));
```

## 🔧 Advanced Usage

### **Custom Intervals**
Sửa config để cập nhật mỗi 2 phút:
```json
{
  "updateInterval": 120000
}
```

### **Selective Tracking**
Chỉ theo dõi phim mới, không theo dõi tập mới:
```json
{
  "trackNewEpisodes": false,
  "trackNewMovies": true
}
```

### **Batch Size Tuning**
Tăng số lượng phim per request:
```json
{
  "batchSize": 48
}
```

## 🚀 Production Deployment

### **Windows Service**
Để chạy như Windows Service, sử dụng NSSM:
```cmd
nssm install KKPhimUpdater
nssm set KKPhimUpdater Application "C:\path\to\start-auto-updater.bat"
nssm start KKPhimUpdater
```

### **Task Scheduler**
Hoặc dùng Windows Task Scheduler:
- **Trigger**: At startup
- **Action**: Start `start-auto-updater.bat`
- **Settings**: Restart if fails

## 📞 Support

- **Issues**: Check logs trong `logs/` folder
- **Performance**: Monitor `data/updates-log.json`
- **Config**: Modify `data/auto-update-config.json`

---

**Made with ❤️ for KKPhim Auto-Updater v1.0** 