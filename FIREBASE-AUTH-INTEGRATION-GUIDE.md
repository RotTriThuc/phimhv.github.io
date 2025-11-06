# 🔐 Firebase Authentication Integration Guide

Hướng dẫn tích hợp hệ thống đăng nhập Firebase vào website phim.

## 📋 Tổng quan

Hệ thống Authentication này cho phép:
- ✅ Đăng nhập/Đăng ký với Email & Password
- ✅ Đăng nhập nhanh với Google OAuth
- ✅ Dữ liệu không bị mất khi clear browser data
- ✅ Đồng bộ phim đã lưu giữa các thiết bị
- ✅ Tự động migrate dữ liệu cũ sang tài khoản mới

---

## 🚀 Bước 1: Thêm files vào project

### Files đã được tạo:

1. **firebase-auth.js** - Module xử lý Authentication
2. **firebase-auth.css** - Styles cho auth UI
3. **firestore-security-rules-auth.rules** - Security rules cho Firestore
4. **auth-demo.html** - Demo page để test

### Cập nhật đã thực hiện:

- ✅ `firebase-primary-storage.js` - Ưu tiên Firebase Auth UID

---

## 🔧 Bước 2: Thêm vào HTML chính

### Option 1: Thêm vào `index.html`

Thêm vào `<head>`:

```html
<!-- Firebase Auth CSS -->
<link rel="stylesheet" href="/firebase-auth.css">
```

Thêm trước tag `</body>` (sau Firebase SDK):

```html
<!-- Firebase Auth System -->
<script src="/firebase-auth.js"></script>
```

### Option 2: Nếu dùng build system

Import vào file JavaScript chính:

```javascript
// Import Firebase Auth
import './firebase-auth.js';
import './firebase-auth.css';
```

---

## 🎨 Bước 3: Thêm nút đăng nhập vào Header

### Tìm phần header trong code

Ví dụ trong file `app.js` hoặc component Header:

```javascript
// Thêm vào header
function renderHeader() {
  return `
    <header class="header">
      <div class="logo">PhimHV</div>
      
      <!-- Navigation -->
      <nav>...</nav>
      
      <!-- User Auth Section - THÊM PHẦN NÀY -->
      <div class="user-info">
        <button class="btn-login" onclick="window.firebaseAuth.showAuthModal()">
          Đăng nhập
        </button>
      </div>
    </header>
  `;
}
```

**Lưu ý:** Phần `.user-info` sẽ tự động cập nhật khi user đăng nhập/đăng xuất.

---

## 🔐 Bước 4: Cấu hình Firebase Console

### 4.1. Bật Authentication

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project của bạn
3. Vào **Authentication** → **Sign-in method**
4. Bật các provider:
   - ✅ **Email/Password** - Enable
   - ✅ **Google** - Enable và cấu hình

### 4.2. Cấu hình Google OAuth

1. Click vào **Google** provider
2. Enable
3. Chọn **Project support email**
4. Lưu lại

### 4.3. Thêm Authorized Domains

Trong **Authentication** → **Settings** → **Authorized domains**:

```
localhost
your-domain.com
your-domain.github.io
```

---

## 🛡️ Bước 5: Cập nhật Firestore Security Rules

### Cách 1: Qua Firebase Console

1. Vào **Firestore Database** → **Rules**
2. Copy toàn bộ nội dung từ file `firestore-security-rules-auth.rules`
3. Paste vào editor
4. Click **Publish**

### Cách 2: Qua Firebase CLI

```bash
# Backup rules hiện tại
firebase firestore:rules get > firestore-rules-backup.txt

# Deploy rules mới
firebase deploy --only firestore:rules
```

**Lưu ý:** File `firebase.json` cần có:

```json
{
  "firestore": {
    "rules": "firestore-security-rules-auth.rules"
  }
}
```

---

## 🧪 Bước 6: Test hệ thống

### Option 1: Test với demo page

1. Mở `auth-demo.html` trong browser
2. Cập nhật Firebase config trong file (dòng 193-200)
3. Test các tính năng:
   - Đăng ký tài khoản mới
   - Đăng nhập với email/password
   - Đăng nhập với Google
   - Đăng xuất

### Option 2: Test trong production

1. Deploy code lên server
2. Mở DevTools Console
3. Kiểm tra logs:

```javascript
// Check auth state
console.log(window.firebaseAuth.isLoggedIn());
console.log(window.firebaseAuth.getCurrentUser());

// Check storage info
window.FirebasePrimaryStorage.getStorageInfo().then(console.log);
```

---

## 📱 Bước 7: Migration dữ liệu cũ

### Tự động migration

Khi user đăng nhập lần đầu, hệ thống sẽ:

1. Kiểm tra localStorage có User ID cũ không
2. Tìm tất cả phim đã lưu với User ID cũ
3. Migrate sang Firebase Auth UID mới
4. Xóa localStorage User ID cũ
5. Hiển thị thông báo số phim đã migrate

### Manual migration (nếu cần)

```javascript
// Force migration
const oldUserId = 'user_primary_abc123';
const newUserId = window.firebaseAuth.getUserId();

await window.firebaseAuth.migrateOldUserData(newUserId);
```

---

## 🎯 Bước 8: Tích hợp với các tính năng hiện có

### 8.1. Save Movie

Code hiện tại sẽ tự động dùng Firebase Auth UID:

```javascript
// Trong app.js
async function saveMovie(movie) {
  // FirebasePrimaryStorage tự động dùng Auth UID
  await window.Storage.saveMovie(movie);
}
```

### 8.2. Check Auth trước khi save

```javascript
async function saveMovie(movie) {
  // Kiểm tra user đã đăng nhập chưa
  if (!window.firebaseAuth.isLoggedIn()) {
    // Hiển thị modal đăng nhập
    window.firebaseAuth.showAuthModal();
    return;
  }
  
  // Lưu phim
  await window.Storage.saveMovie(movie);
}
```

### 8.3. Listen auth state changes

```javascript
// Lắng nghe khi user đăng nhập/đăng xuất
window.addEventListener('authStateChanged', (e) => {
  const user = e.detail.user;
  
  if (user) {
    console.log('User logged in:', user.email);
    // Refresh saved movies
    loadSavedMovies();
  } else {
    console.log('User logged out');
    // Clear UI
  }
});
```

---

## 🔍 Troubleshooting

### Lỗi: "Firebase Auth not initialized"

**Giải pháp:**
- Đảm bảo Firebase SDK được load trước `firebase-auth.js`
- Kiểm tra console có error khi load Firebase SDK

### Lỗi: "Popup blocked"

**Giải pháp:**
- Cho phép popup trong browser settings
- Hoặc dùng `signInWithRedirect` thay vì popup

### Lỗi: Migration không hoạt động

**Giải pháp:**
- Check Firestore Security Rules đã được deploy chưa
- Kiểm tra có data cũ trong Firestore không
- Xem console log để debug

### Phim đã lưu không hiển thị

**Giải pháp:**
```javascript
// Force refresh
await window.FirebasePrimaryStorage.forceRefresh();

// Check storage info
const info = await window.FirebasePrimaryStorage.getStorageInfo();
console.log(info);
```

---

## 📊 Monitoring & Analytics

### Check auth status

```javascript
// User info
const user = window.firebaseAuth.getCurrentUser();
console.log({
  email: user?.email,
  uid: user?.uid,
  emailVerified: user?.emailVerified
});

// Storage info
const storageInfo = await window.FirebasePrimaryStorage.getStorageInfo();
console.log(storageInfo);
```

### Firebase Console

Monitor trong Firebase Console:
- **Authentication** → **Users** - Xem danh sách users
- **Firestore** → **Data** - Xem saved movies của từng user
- **Usage** → **Limits** - Check quota usage

---

## 🎨 Customization

### Thay đổi màu sắc

Edit file `firebase-auth.css`:

```css
/* Primary color */
.btn-primary {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

/* Auth tabs */
.auth-tab.active::after {
  background: linear-gradient(90deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Thay đổi text

Edit file `firebase-auth.js`:

Tìm các dòng có text và thay đổi:
- Line 107: Thông báo đăng ký thành công
- Line 149: Thông báo đăng nhập thành công
- Line 233: Thông báo đăng xuất

---

## 🚀 Production Checklist

Trước khi deploy production:

- [ ] Firebase Config đã được cập nhật đúng
- [ ] Firestore Security Rules đã được deploy
- [ ] Google OAuth đã được cấu hình (nếu dùng)
- [ ] Authorized domains đã được thêm
- [ ] Test đăng ký, đăng nhập, đăng xuất
- [ ] Test migration dữ liệu cũ
- [ ] Test save/remove movies sau khi đăng nhập
- [ ] Kiểm tra performance trên mobile
- [ ] Setup monitoring/analytics

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra console log
2. Xem Firebase Console có error không
3. Review lại các bước trong guide
4. Check Firestore Security Rules

---

## 🎉 Kết quả

Sau khi hoàn thành:

- ✅ User có thể đăng nhập/đăng ký
- ✅ Phim đã lưu không bị mất khi clear data
- ✅ Đồng bộ giữa các thiết bị
- ✅ Bảo mật dữ liệu với Security Rules
- ✅ UX tốt với auto-migration

Enjoy! 🎬
