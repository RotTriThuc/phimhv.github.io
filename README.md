# 🎬 Web Xem Anime - KKPhim Integration

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://rottriThuc.github.io/web-xem-anime/)
[![API](https://img.shields.io/badge/API-KKPhim.vip-blue)](Serect)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Giới thiệu

Website xem anime/phim trực tuyến được xây dựng với HTML, CSS, JavaScript thuần. Tích hợp API từ KKPhim.vip để cung cấp hơn **23,969 bộ phim** với tính năng tìm kiếm, lọc và xem phim mượt mà.

## ✨ Tính năng chính

### 🎯 **Core Features**
- 🔍 **Tìm kiếm thông minh** - Search movies by name
- 🎭 **Lọc theo thể loại** - Filter by genre, country, year
- 📱 **Responsive design** - Mobile & desktop friendly
- 🌙 **Dark/Light theme** - Theme switching
- 🚀 **Single Page App** - Fast navigation

### 🎬 **Movie Features**
- 📺 **23,969+ phim** từ KKPhim.vip
- 🎪 **Multiple categories** - Phim bộ, phim lẻ, hoạt hình, TV shows
- 🌍 **Multi-country** - Phim Việt, Hàn, Trung, Âu Mỹ, Nhật...
- 📅 **Year range** - From 2000 to 2026
- 🎵 **Multi-language** - Vietsub, Thuyết minh, Lồng tiếng

### 🤖 **Auto-Update System** (Local only)
- ⏰ **Auto-sync** - Updates every 5 minutes
- 🔔 **Smart notifications** - New movies & episodes alerts
- 📊 **Change tracking** - Detect new content automatically
- 📝 **Logging system** - Full activity logs

## 🚀 Demo

### 🌐 **Live Demo**
👉 [**https://rottriThuc.github.io/web-xem-anime/**](https://rottriThuc.github.io/web-xem-anime/)

### 📸 **Screenshots**
```
🏠 Homepage          📱 Mobile View       🔍 Search Results
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 🎬 Featured │     │ 📱 Compact  │     │ 🔍 Results  │
│ Movies      │     │ Layout      │     │ Grid        │
│             │     │             │     │             │
│ 🎭 Categories│     │ 🎭 Touch    │     │ 📄 Pagination│
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🛠️ Cài đặt

### **📋 Requirements**
- Web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for API calls)
- Node.js (optional, for auto-updater)

### **🔧 Local Setup**
```bash
# 1. Clone repository
git clone https://github.com/RotTriThuc/web-xem-anime.git
cd web-xem-anime

# 2. Open in browser
start index.html
# hoặc
python -m http.server 8000
# hoặc
npx serve .
```

### **🤖 Auto-Updater (Optional)**
```bash
# Chạy cập nhật một lần
scripts\auto-update.bat once

# Chạy daemon (tự động mỗi 5 phút)
scripts\auto-update.bat start

# Chạy với UI đẹp
start-auto-updater.bat
```

## 📁 Cấu trúc Project

```
📦 web-xem-anime/
├── 📄 index.html                 # Main HTML file
├── 📂 assets/
│   ├── 🎨 styles.css            # Styling
│   └── ⚙️ app.js                # Core functionality
├── 📂 scripts/ (Local only)
│   ├── 🤖 auto-update.js        # Auto-updater engine
│   ├── 🔧 auto-update.bat       # Control script
│   └── 📋 sync-catalog.*        # Sync utilities
├── 📂 data/ (Auto-generated)
│   ├── 🎬 kho-phim.json         # Movie database
│   └── 📊 updates-log.json      # Update history
├── 🔧 github-pages-config.js    # GitHub Pages config
├── 📖 README.md                 # This file
└── 📋 .gitignore               # Git ignore rules
```

## 🌐 Deployment

### **GitHub Pages (Recommended)**
1. Fork this repository
2. Enable GitHub Pages in Settings
3. Access at `https://[username].github.io/web-xem-anime/`

### **Local Server**
```bash
# Python
python -m http.server 8000

# Node.js
npx serve . -p 8000

# PHP
php -S localhost:8000
```

## 🔧 Configuration

### **GitHub Pages Mode**
Automatically detected when running on `*.github.io`:
- ✅ API-only mode (no local files)
- ✅ localStorage caching (30 min)
- ✅ Progressive loading
- ❌ No auto-updater

### **Local Mode**
Full features when running locally:
- ✅ Auto-updater daemon
- ✅ File-based caching
- ✅ Real-time notifications
- ✅ Full logging

## 📊 API Integration

### **KKPhim.vip Endpoints**
```javascript
// Latest movies
https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3

// By category
https://phimapi.com/danh-sach/phim-bo
https://phimapi.com/danh-sach/hoat-hinh

// Search
https://phimapi.com/tim-kiem?keyword=...

// Movie details
https://phimapi.com/phim/[slug]
```

### **Data Structure**
```json
{
  "items": [
    {
      "name": "Tên phim",
      "slug": "ten-phim",
      "poster_url": "https://...",
      "year": 2025,
      "episode_current": "Tập 1",
      "quality": "FHD",
      "lang": "Vietsub"
    }
  ]
}
```

## 🎨 Customization

### **Theme Colors**
```css
:root {
  --primary: #6c5ce7;
  --secondary: #a29bfe;
  --background: #2d3436;
  --surface: #636e72;
  --text: #ddd;
}
```

### **API Configuration**
```javascript
const CONFIG = {
  API_BASE: 'https://phimapi.com',
  CACHE_DURATION: 30 * 60 * 1000,
  ITEMS_PER_PAGE: 24
};
```

## 📈 Performance

### **Metrics**
- ⚡ **Load time**: <2s (GitHub Pages)
- 📱 **Mobile score**: 95+ (Lighthouse)
- 🔍 **SEO score**: 90+ (Lighthouse)
- ♿ **Accessibility**: 95+ (Lighthouse)

### **Optimizations**
- 🖼️ **Lazy loading** images
- 💾 **Smart caching** (localStorage)
- 🎯 **Code splitting** by features
- 📦 **Minified assets**

## 🐛 Troubleshooting

### **Common Issues**

**CORS Errors:**
```javascript
// Sử dụng proxy nếu cần
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
```

**API Rate Limiting:**
```javascript
// Tăng cache duration
CACHE_DURATION: 60 * 60 * 1000 // 1 hour
```

**Images not loading:**
```javascript
// Fallback to placeholder
img.onerror = () => img.src = 'placeholder.svg';
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**NGUYEN HOAI VU** ([@RotTriThuc](https://github.com/RotTriThuc))
- 🌐 Website: [GitHub Profile](https://github.com/RotTriThuc)
- 📧 Contact: Via GitHub Issues

## 🙏 Acknowledgments

- 🎬 **KKPhim.vip** - Movie data API
- 🌐 **GitHub Pages** - Free hosting
- 🎨 **CSS Grid & Flexbox** - Layout system
- 📱 **Responsive Design** - Mobile-first approach

## 📊 Stats

- 📦 **Size**: ~500KB (without data)
- 🎬 **Movies**: 23,969+ available
- 🌍 **Countries**: 30+ supported
- 🎭 **Genres**: 20+ categories
- 📅 **Years**: 2000-2026

---

⭐ **Star this repo if you find it useful!** ⭐

Made with ❤️ by [RotTriThuc](https://github.com/RotTriThuc) 
