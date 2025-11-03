# 🚀 HOW TO RUN - PhimHV React App

## Quick Start Guide

---

## 🎯 **3 CÁCH ĐỂ CHẠY APP**

### **Method 1: Double-Click .BAT File** ⭐ **EASIEST**

```
1. Tìm file: run_localhost.bat (ở thư mục root)
2. Double-click vào file
3. Đợi dev server khởi động
4. Browser tự động mở: http://localhost:5173/
```

**Features**:
- ✅ Tự động check Node.js/npm
- ✅ Tự động install dependencies (nếu chưa có)
- ✅ Khởi động dev server
- ✅ UI đẹp với progress messages
- ✅ Error handling đầy đủ

---

### **Method 2: PowerShell/CMD** 🖥️

```powershell
# Navigate to project root
cd C:\Users\NaNa\Desktop\PROJECT\CURSOR\phimhv.github.io-main

# Run bat file
run_localhost.bat
```

---

### **Method 3: Manual NPM** 🔧

```powershell
# Navigate to react-app folder
cd react-app

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

---

## 📋 **Requirements**

### **Must Have**:
- ✅ **Node.js** v18+ (check: `node --version`)
- ✅ **npm** v9+ (check: `npm --version`)

### **Download**:
- Node.js: https://nodejs.org/ (LTS version recommended)

---

## 🎬 **What Happens When You Run?**

### **First Time** (with npm install):
```
================================
 PhimHV React Dev Server
================================

[INFO] Dang cai dat dependencies...

added 342 packages in 45s

================================
 Starting Vite Dev Server...
================================

 URL: http://localhost:5173/
 Hot Module Replacement: ON
 Press Ctrl+C to stop

================================

VITE v5.x.x  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### **Subsequent Runs** (faster):
```
================================
 PhimHV React Dev Server
================================

================================
 Starting Vite Dev Server...
================================

 URL: http://localhost:5173/
 ...
```

---

## ✅ **Verification**

After server starts, check:

```
□ Browser opens automatically
□ URL is: http://localhost:5173/
□ Page loads completely
□ Banner 3D particles visible
□ Movies grid displays
□ No console errors (except harmless DevTools warning)
□ Firebase initializes (✅ message in console)
```

---

## 🛑 **How to Stop Server**

### **Method 1: In Terminal**
```
Press: Ctrl + C
Then: Y (confirm)
```

### **Method 2: Close Terminal**
```
Just close the terminal window
Server will auto-stop
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Node.js khong duoc cai dat"**
**Solution**: 
1. Install Node.js from https://nodejs.org/
2. Choose LTS version
3. Restart terminal/CMD after install
4. Run `node --version` to verify

---

### **Issue 2: "npm khong duoc cai dat"**
**Solution**:
npm comes with Node.js, so reinstall Node.js

---

### **Issue 3: Port 5173 already in use**
**Error**: `Port 5173 is already in use`

**Solution**:
```powershell
# Option 1: Kill existing process
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Option 2: Vite will auto-use next port (5174, 5175...)
```

---

### **Issue 4: "Thu muc react-app khong ton tai"**
**Solution**:
Make sure you're in the correct directory:
```
phimhv.github.io-main/
├── react-app/          ← Must exist!
└── run_localhost.bat   ← Run from here
```

---

### **Issue 5: npm install fails**
**Solution**:
```powershell
cd react-app

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

---

### **Issue 6: Browser shows 404**
**Check URL**:
```
✅ CORRECT: http://localhost:5173/
❌ WRONG:   http://localhost:5173/phimhv.github.io/
```

**Solution**: 
Navigate to correct URL or hard refresh (Ctrl + Shift + R)

---

## 📁 **Project Structure**

```
phimhv.github.io-main/
│
├── run_localhost.bat    ← RUN THIS!
│
├── react-app/           ← React source code
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── HOW-TO-RUN.md       ← This file
└── README.md
```

---

## 🎯 **Development Workflow**

### **Daily Development**:
```
1. Run: run_localhost.bat
2. Edit code in react-app/src/
3. Browser auto-refreshes (HMR)
4. Save & test
5. Stop server when done (Ctrl+C)
```

### **Key Features**:
- ✅ **Hot Module Replacement** - Changes reflect instantly
- ✅ **Fast Refresh** - Preserves React state
- ✅ **TypeScript** - Type checking on save
- ✅ **ESLint** - Code linting
- ✅ **3D Animations** - Smooth 60fps

---

## 🚀 **Production Build**

When ready to deploy:

```powershell
cd react-app

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

---

## 📊 **Common Commands**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview prod build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Deploy to GitHub Pages |

---

## 💡 **Pro Tips**

### **1. Bookmark URL**
```
Bookmark: http://localhost:5173/
Name: PhimHV React Dev
```

### **2. VS Code Integration**
```json
// .vscode/tasks.json
{
  "label": "Run Dev Server",
  "type": "shell",
  "command": "npm run dev",
  "options": { "cwd": "${workspaceFolder}/react-app" }
}
```

### **3. Create Desktop Shortcut**
```
Right-click run_localhost.bat
→ Send to → Desktop (create shortcut)
```

---

## 🎉 **Quick Reference**

### **Start Server**:
```
run_localhost.bat
```

### **Access App**:
```
http://localhost:5173/
```

### **Stop Server**:
```
Ctrl + C
```

### **Get Help**:
```
- Check console errors (F12)
- Read BUGFIX-REPORT.md
- Read MIGRATION-SUCCESS-REPORT.md
```

---

## 📞 **Support**

If you encounter issues:

1. Check Console (F12) for errors
2. Read BUGFIX-REPORT.md
3. Check terminal output
4. Verify Node.js installed: `node --version`
5. Clear cache and reinstall: `npm cache clean --force && npm install`

---

## ✅ **Success Checklist**

After running `run_localhost.bat`:

```
✅ Terminal shows: "Starting Vite Dev Server..."
✅ Terminal shows: "Local: http://localhost:5173/"
✅ Browser opens automatically
✅ Page loads with banner and movies
✅ Console shows: "✅ Firebase initialized successfully"
✅ No 404 errors
✅ No WebSocket errors
✅ 3D particles animating
```

---

## 🎊 **YOU'RE READY!**

**Just double-click `run_localhost.bat` and enjoy!** 🎬

**Happy Coding!** 🚀

