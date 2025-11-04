# 🚀 Cách Chạy Localhost & Test Series Navigator

## 🎯 Vấn Đề

Bạn đang test trên localhost nhưng **KHÔNG THẤY** Series Navigator!

## 🔍 Nguyên Nhân

Project này sử dụng **Webpack + React** nên:
- ❌ **KHÔNG THỂ** chỉ mở file `index.html` trực tiếp
- ❌ **KHÔNG THỂ** dùng simple HTTP server với file gốc
- ✅ **PHẢI** build hoặc run dev server

## ✅ Giải Pháp: 3 Cách

### Cách 1: Test File Demo (NHANH NHẤT) ⚡

Không cần build, chỉ cần mở file HTML:

```bash
# 1. Start simple HTTP server
python -m http.server 8000

# 2. Mở browser:
http://localhost:8000/test-series-navigator.html
```

File này có:
- ✅ Full UI demo của Series Navigator
- ✅ Interactive (click được)
- ✅ Hiển thị đúng như trên production

**→ Cách này để XEM UI, KHÔNG connect API thực**

---

### Cách 2: Build Production (ĐỀ XUẤT) 🏗️

Build project và chạy:

```bash
# 1. Install dependencies (nếu chưa có)
npm install

# 2. Build project
npm run build

# 3. Serve build folder
npm run serve

# 4. Mở browser:
http://localhost:3000
```

Build sẽ tạo folder `dist/` với code đã compiled.

**→ Cách này giống PRODUCTION, có đầy đủ tính năng**

---

### Cách 3: Dev Server (CHO DEVELOPMENT) 🔧

Chạy webpack dev server:

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Mở browser:
http://localhost:8080  # hoặc port khác được hiển thị
```

Dev server có hot reload - code thay đổi tự động update.

**→ Cách này cho DEVELOPMENT, có hot reload**

---

## 🧪 Test Series Navigator Trên Localhost

### Option 1: Test UI Demo

```bash
# Start server
python -m http.server 8000

# Mở browser
http://localhost:8000/test-series-navigator.html
```

Bạn sẽ thấy:
- ✅ Navigator UI đầy đủ
- ✅ 3 phần: Phần 1, 2, 3
- ✅ Styling đúng
- ✅ Interactive

### Option 2: Test Detection Logic

```bash
# Start server
python -m http.server 8000

# Mở browser
http://localhost:8000/test-series-detection.html
```

Test này sẽ:
- ✅ Kiểm tra regex patterns
- ✅ Test với tên "Đấm Phát Chết Luôn"
- ✅ Hiển thị kết quả detection

### Option 3: Test API Search

```bash
# Start server
python -m http.server 8000

# Mở browser
http://localhost:8000/test-one-punch-man-search.html
```

Click "🔍 Test Search" để:
- ✅ Search API thực
- ✅ Kiểm tra tìm được bao nhiêu phần
- ✅ Test detection logic với data thực

### Option 4: Test Full App (Cần Build)

```bash
# Build first
npm run build

# Serve
npm run serve

# Mở trang One Punch Man
http://localhost:3000/#/phim/dam-phat-chet-luon-phan-1
```

Nếu build thành công, bạn sẽ thấy Navigator trên trang thực!

---

## 🐛 Troubleshooting

### Vấn Đề 1: "npm run build" Lỗi

```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try build again
npm run build
```

### Vấn Đề 2: Port Already in Use

```bash
# Tìm process đang dùng port
netstat -ano | findstr :8000

# Kill process (thay PID)
taskkill /PID <PID> /F

# Hoặc dùng port khác
python -m http.server 8001
```

### Vấn Đề 3: CSS Không Load

Kiểm tra trong Console (F12):
```
❌ ERR_FILE_NOT_FOUND: /assets/series-navigator.css
```

**Giải pháp:** Phải build project trước!

### Vấn Đề 4: Module Not Found

```bash
# Install missing dependencies
npm install

# Or install specific package
npm install webpack webpack-cli --save-dev
```

---

## 📊 So Sánh Các Cách

| Cách | Speed | Full Features | API Real | Hot Reload |
|------|-------|---------------|----------|------------|
| Demo HTML | ⚡⚡⚡ | UI only | ❌ | ❌ |
| Build + Serve | ⚡⚡ | ✅ Full | ✅ | ❌ |
| Dev Server | ⚡ | ✅ Full | ✅ | ✅ |

**Khuyến nghị:**
- 🎨 **Xem UI**: Dùng demo HTML
- 🧪 **Test logic**: Dùng test HTML  
- 🏗️ **Test full**: Build + Serve
- 💻 **Development**: Dev Server

---

## 🎯 Quick Start

**Muốn test NHANH nhất:**

```bash
# Terminal 1: Start server
python -m http.server 8000

# Terminal 2: Open browser (paste vào address bar)
start http://localhost:8000/test-series-navigator.html
```

**Muốn test ĐẦY ĐỦ với API thực:**

```bash
# Build & serve
npm install
npm run build
npm run serve

# Open browser
start http://localhost:3000/#/phim/dam-phat-chet-luon-phan-1
```

---

## 📖 Files Test Có Sẵn

```
✅ test-series-navigator.html          # UI demo
✅ test-series-detection.html          # Logic test
✅ test-one-punch-man-search.html      # API search test
```

Tất cả đều có thể chạy với simple HTTP server!

---

## 💡 Lưu Ý Quan Trọng

### ⚠️ File `index.html` Gốc KHÔNG CHẠY ĐƯỢC trực tiếp!

File này là **output của Webpack build**:
```html
<script type="module" src="/assets/index-DQDpEMa7.js"></script>
```

Các file JS này được generate bởi Webpack, không tồn tại trong source code!

### ✅ Phải Build Trước

```bash
npm run build  # → Tạo folder dist/ với file đã compiled
```

### ✅ Hoặc Dùng Test Files

Test files là **standalone HTML** - chạy được ngay!

---

## 🎓 Hiểu Cấu Trúc Project

```
phimhv.github.io-main/
├── src/                    # Source code (nếu có)
├── modules/                # JS modules
│   └── series-navigator.js
├── assets/
│   ├── app.js             # Main app (không dùng webpack)
│   └── series-navigator.css
├── index.html             # Built output (cần webpack)
├── test-*.html            # Standalone test files ✅
└── dist/                  # Built production code
```

**Hai loại code:**
1. **Webpack-based**: `index.html` + modules → Cần build
2. **Standalone**: `assets/app.js` + test files → Chạy thẳng

---

## 🚀 Recommended Workflow

### Cho Testing:
```bash
# 1. Test UI
python -m http.server 8000
# → http://localhost:8000/test-series-navigator.html

# 2. Test logic
# → http://localhost:8000/test-series-detection.html

# 3. Test API
# → http://localhost:8000/test-one-punch-man-search.html
```

### Cho Development:
```bash
npm run dev
# → Code, save, auto-reload
```

### Cho Production:
```bash
npm run build
npm run serve
# → Test như production
```

---

**Made with ❤️**  
*Bây giờ bạn đã biết cách chạy localhost đúng cách!*
