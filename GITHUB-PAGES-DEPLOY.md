# 🚀 HƯỚNG DẪN DEPLOY LÊN GITHUB PAGES

## ✅ ĐÃ HOÀN THÀNH (Ngày 06/11/2025)

### 1️⃣ **Build Production**
```bash
cd react-app
npm run build
```
✅ **Kết quả:** Folder `dist/` chứa production files

---

### 2️⃣ **Commit & Push lên GitHub**
```bash
git add -A
git commit -m "✨ Add Watch Progress Feature & Optimize Code"
git push origin master
```
✅ **Kết quả:** Code đã được push lên `https://github.com/RotTriThuc/phimhv.github.io`

---

## 🔧 **CẤU HÌNH GITHUB PAGES (BƯỚC TIẾP THEO)**

### **Option 1: Deploy từ folder `dist/` (Recommended)**

#### **Bước 1: Cài đặt gh-pages package**
```bash
npm install --save-dev gh-pages
```

#### **Bước 2: Thêm deploy script vào `package.json`**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

#### **Bước 3: Cấu hình base URL trong `vite.config.ts`**
```typescript
export default defineConfig({
  base: '/phimhv.github.io/',  // Thay bằng tên repo của bạn
  plugins: [react()],
})
```

#### **Bước 4: Deploy**
```bash
npm run deploy
```

---

### **Option 2: Deploy Manual (Hiện tại đang dùng)**

#### **Bước 1: Truy cập GitHub Repository**
`https://github.com/RotTriThuc/phimhv.github.io`

#### **Bước 2: Vào Settings → Pages**
1. Chọn **Source:** Deploy from a branch
2. Chọn **Branch:** `master` (hoặc `main`)
3. Chọn **Folder:** `/` (root) hoặc `/docs` (nếu copy dist vào docs/)

#### **Bước 3: Copy dist files**
```bash
# Copy từ react-app/dist/ lên root
cp -r react-app/dist/* .
git add .
git commit -m "📦 Deploy production build"
git push origin master
```

#### **Bước 4: Chờ GitHub Actions build**
- Vào tab **Actions** để xem quá trình deploy
- URL sẽ là: `https://RotTriThuc.github.io/phimhv.github.io/`

---

## 🎯 **FEATURES ĐÃ DEPLOY**

### ✅ **Watch Progress System:**
- 🎬 Lưu tập đang xem qua Firebase Firestore
- ▶️ Auto-resume từ tập cuối cùng
- 🔄 Nút "Xem từ đầu"
- 📊 Section "Tiếp tục xem" với horizontal carousel (20 phim gần nhất)

### ✅ **UI Improvements:**
- 🏷️ Badge tập đang xem (bottom-left position)
- 🎨 Remove neon glow effects
- 📦 Compact layout cho Continue Watching section

### ✅ **Code Quality:**
- 🧹 Remove unused wheel scroll code
- ✅ Fix lint errors (unused variables, duplicate conditions)
- 📝 Clean TypeScript code

---

## 📋 **CHECKLIST DEPLOY**

- [x] Build production (`npm run build`)
- [x] Commit changes
- [x] Push lên GitHub
- [ ] Cấu hình GitHub Pages Settings
- [ ] Verify URL hoạt động
- [ ] Test Firebase Authentication trên production
- [ ] Test Watch Progress feature live

---

## 🔐 **LƯU Ý FIREBASE**

**QUAN TRỌNG:** Đảm bảo Firebase Config đã được cập nhật với domain production:

### **Authorized Domains (Firebase Console):**
1. Vào Firebase Console → Authentication → Settings
2. Thêm domain: `RotTriThuc.github.io`
3. Thêm domain: `rottrithuc.github.io` (lowercase)

### **CORS Settings (nếu có lỗi):**
Firestore rules đã được config đúng trong commit này:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /watchProgress/{docId} {
      allow read, write: if request.auth != null && 
                           docId.matches(request.auth.uid + '_.*');
    }
  }
}
```

---

## 🆘 **TROUBLESHOOTING**

### **1. Blank page sau khi deploy**
- ✅ Check `base` URL in `vite.config.ts`
- ✅ Check GitHub Pages Settings → Source branch

### **2. Firebase Authentication không hoạt động**
- ✅ Thêm production domain vào Authorized Domains
- ✅ Check Firebase config keys

### **3. 404 khi refresh page**
- ✅ Thêm `404.html` redirect về `index.html`
- ✅ Hoặc dùng hash routing trong React Router

---

## 📞 **CONTACT**

Repo: `https://github.com/RotTriThuc/phimhv.github.io`  
Branch: `master`  
Last Deploy: **06/11/2025**
