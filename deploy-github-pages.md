# 🚀 Deploy Website lên GitHub Pages

## 📋 Checklist trước khi deploy

### ✅ **Files cần thiết cho GitHub Pages:**
```
├── index.html              ✅ Main page
├── assets/
│   ├── app.js             ✅ Core functionality  
│   └── styles.css         ✅ Styling
├── github-pages-config.js  ✅ GitHub Pages config
├── .github/
│   └── workflows/
│       └── deploy.yml     ✅ Auto-deploy action
└── README.md              ✅ Documentation
```

### ❌ **Files KHÔNG cần (server-only):**
```
❌ scripts/auto-update.js    # Node.js script
❌ scripts/auto-update.bat   # Windows batch
❌ start-auto-updater.bat    # Service launcher
❌ data/                     # Local database
❌ logs/                     # Log files
❌ package.json              # Node dependencies
```

## 🔧 Cách deploy

### **Step 1: Tạo GitHub Repository**
1. Tạo repo mới: `web-xem-anime`
2. Upload files cần thiết
3. Bỏ qua files server-only

### **Step 2: Enable GitHub Pages**
1. Vào **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **root**
4. Save

### **Step 3: Configure Base URL**
Sửa `github-pages-config.js`:
```javascript
BASE_URL: '/web-xem-anime/', // Thay bằng tên repo
```

### **Step 4: Update HTML**
Thêm vào `<head>` của `index.html`:
```html
<script src="github-pages-config.js"></script>
```

## 🌐 URL sau khi deploy

```
https://[username].github.io/web-xem-anime/
```

## ⚡ GitHub Actions Auto-Deploy

Tạo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Pages
      uses: actions/configure-pages@v3
      
    - name: Build
      run: |
        # Không cần build vì là static files
        echo "Static files ready for deployment"
        
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v2
      with:
        path: '.'
        
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v2
```

## 🎯 Tính năng hoạt động trên GitHub Pages

### ✅ **Fully Functional:**
- **Movie browsing** - Xem, tìm kiếm, lọc phim
- **Real-time API** - Dữ liệu từ KKPhim.vip
- **Responsive design** - Mobile/desktop
- **Theme switching** - Dark/light mode
- **Client-side routing** - SPA navigation
- **Local caching** - localStorage thay vì files

### ⚠️ **Limited Features:**
- **No auto-updater** - Không có background sync
- **No file logging** - Chỉ console logs
- **No server notifications** - Chỉ client-side alerts
- **Cache expiry** - 30 phút (có thể tăng)

## 🔄 Workflow cho GitHub Pages

### **Development:**
```bash
# Local development với full features
npm start  # Chạy với auto-updater

# Test GitHub Pages mode
# Mở index.html với file:// protocol
```

### **Production:**
```bash
git add .
git commit -m "Update website"
git push origin main
# Auto-deploy via GitHub Actions
```

## 🚀 Performance Optimizations

### **Caching Strategy:**
- **API responses**: 30 phút trong localStorage
- **Images**: Browser cache + CDN
- **Static assets**: GitHub CDN

### **Loading Strategy:**
- **Lazy loading**: Images load khi cần
- **Progressive loading**: Show skeleton → real data
- **Error handling**: Fallback khi API fails

## 🐛 Troubleshooting

### **CORS Issues:**
Nếu API bị block CORS:
```javascript
// Sử dụng proxy service
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const apiUrl = proxyUrl + 'https://phimapi.com/...';
```

### **Base URL Issues:**
Nếu CSS/JS không load:
```html
<!-- Sử dụng relative paths -->
<link rel="stylesheet" href="./assets/styles.css">
<script src="./assets/app.js"></script>
```

### **API Rate Limiting:**
Nếu quá nhiều requests:
```javascript
// Tăng cache duration
CACHE_DURATION: 60 * 60 * 1000, // 1 giờ
```

## 📊 So sánh Local vs GitHub Pages

| Feature | Local | GitHub Pages |
|---------|-------|--------------|
| **Auto-updater** | ✅ Every 5 min | ❌ Manual refresh |
| **File database** | ✅ 23K movies | ❌ API only |
| **Real-time sync** | ✅ Background | ❌ On-demand |
| **Notifications** | ✅ Smart alerts | ⚠️ Basic alerts |
| **Performance** | ✅ Instant | ⚠️ API dependent |
| **Offline mode** | ✅ Cached data | ❌ Online only |
| **Deployment** | ❌ Manual | ✅ Auto CI/CD |
| **Hosting cost** | 💰 Server needed | 🆓 Free |
| **Scalability** | ❌ Limited | ✅ Global CDN |

## 💡 Khuyến nghị

### **Cho GitHub Pages:**
- ✅ **Demo/Portfolio** - Showcase project
- ✅ **Low traffic** - Personal use
- ✅ **Simple deployment** - Zero config
- ✅ **Free hosting** - No cost

### **Cho Local/VPS:**
- ✅ **Production** - High traffic
- ✅ **Full features** - Auto-updater, caching
- ✅ **Performance** - Instant loading
- ✅ **Offline support** - Local database

**Kết luận:** GitHub Pages phù hợp để demo và chia sẻ project, nhưng để có trải nghiệm tốt nhất thì nên host trên VPS với full features! 🎬✨ 