# 🔒 HƯỚNG DẪN BẢO MẬT DEBUG LOGS

## 📋 Tổng Quan
Để bảo vệ thông tin API và dữ liệu nhạy cảm, **debug/info logs đã được ẨN** nhưng **error/warn logs vẫn hiển thị** để có thể debug khi có lỗi.

---

## 🚨 VẤN ĐỀ ĐÃ ĐƯỢC KHẮC PHỤC

### ❌ Trước khi sửa:
```javascript
🐛 [DEBUG] Using listByType API with type_list: hoat-hinh, country: , year:
🐛 [DEBUG] Request successful: https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1&limit=24
🐛 [DEBUG] API Response: {data: {...}}
```

### ✅ Sau khi sửa:
```javascript
// Debug/info logs bị ẩn (không lộ thông tin API)
// Nhưng error/warn logs vẫn hiển thị để debug:
⚠️ [WARN] Connection timeout, retrying...
❌ [ERROR] Failed to load movie data: Network error
🚨 [CRITICAL] Database connection lost
```

---

## 🔧 CÁC FILE ĐÃ ĐƯỢC CẬP NHẬT

### 1. `assets/app.js`
```javascript
// Trước
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

// Sau - Hide sensitive debug info but keep errors
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
const hideDebugInfo = true; // Hide sensitive debug info in production

const Logger = {
  debug: (isDev && !hideDebugInfo) ? (...args) => console.log('🐛 [DEBUG]', ...args) : () => {},
  warn: (...args) => console.warn('⚠️ [WARN]', ...args), // Always show
  error: (...args) => console.error('❌ [ERROR]', ...args), // Always show
};
```

### 2. `firebase-config.js`
```javascript
// Trước
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

// Sau - Force disable debug
const isDev = false; // Force disable debug logs for production security
```

### 3. `modules/logger.js`
```javascript
// Trước
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

// Sau - Force disable debug
const isDev = false; // Force disable debug logs for production security
```

### 4. `service-worker.js`
```javascript
// Trước
const isDev = self.location.hostname === 'localhost' || self.location.hostname.includes('127.0.0.1');

// Sau - Force disable debug
const isDev = false; // Force disable debug logs for production security
```

---

## 🛠️ CÁCH BẬT DEBUG CHO DEVELOPMENT

### Option 1: Thay đổi trực tiếp trong code
```javascript
// Trong từng file, thay đổi:
const isDev = false; 

// Thành:
const isDev = true; // CHỈ cho development
```

### Option 2: Sử dụng URL parameter (Khuyến nghị)
```javascript
// Thêm vào đầu mỗi file:
const isDev = new URLSearchParams(window.location.search).has('debug') || false;
```

Sau đó truy cập: `http://localhost:3000?debug=true`

### Option 3: Sử dụng localStorage
```javascript
// Thêm vào console browser:
localStorage.setItem('enableDebug', 'true');

// Trong code:
const isDev = localStorage.getItem('enableDebug') === 'true';
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 🔴 KHÔNG BAO GIỜ:
- Commit code với `isDev = true` lên production
- Để lộ API URLs trong debug logs
- Log dữ liệu user hoặc thông tin nhạy cảm
- Sử dụng console.log trực tiếp thay vì Logger system

### ✅ LUÔN LUÔN:
- Kiểm tra `isDev = false` trước khi deploy
- Sử dụng Logger system thay vì console.log
- Chỉ log thông tin cần thiết cho debugging
- Review code để đảm bảo không có thông tin nhạy cảm

---

## 🎯 LOGGING LEVELS

| Level | Production | Development | Mục đích |
|-------|------------|-------------|----------|
| `debug` | ❌ Ẩn | ✅ Bật (nếu cần) | Chi tiết debug, flow logic |
| `info` | ❌ Ẩn | ✅ Bật (nếu cần) | Thông tin hữu ích |
| `warn` | ✅ **Hiển thị** | ✅ Bật | Cảnh báo cần chú ý |
| `error` | ✅ **Hiển thị** | ✅ Bật | Lỗi cần xử lý |
| `critical` | ✅ **Hiển thị** | ✅ Bật | Lỗi nghiêm trọng |

---

## 🔍 KIỂM TRA TRƯỚC KHI DEPLOY

### Checklist:
- [ ] `isDev = false` trong tất cả files
- [ ] Không có console.log trực tiếp
- [ ] Không có thông tin API trong debug messages
- [ ] Test trên production domain để đảm bảo không có debug logs

### Command kiểm tra:
```bash
# Tìm tất cả isDev = true
grep -r "isDev = true" --include="*.js" .

# Tìm console.log trực tiếp
grep -r "console\.log" --include="*.js" . | grep -v Logger

# Tìm debug messages có thể chứa thông tin nhạy cảm
grep -r "phimapi\|https\|API" --include="*.js" . | grep -i debug
```

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ về logging system hoặc có thắc mắc về bảo mật, vui lòng liên hệ team development.

**Ngày cập nhật:** 31/08/2025  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Đã áp dụng production
