# 🔧 Vite Config Fix - Base Path Issue

## Date: 2025-10-16
## Issue: Development Server Path Conflict

---

## 🔴 **Problem**

```
❌ GET http://localhost:5173/phimhv.github.io/vite.svg net::ERR_CONNECTION_REFUSED
❌ WebSocket connection to 'ws://localhost:5173/phimhv.github.io/?token=...' failed
```

**Root Cause**:
```typescript
// OLD CONFIG - HARD-CODED
base: '/phimhv.github.io/', // ❌ Wrong for localhost!
```

This config is for GitHub Pages deployment, but breaks development server because:
- Dev server runs at: `http://localhost:5173/`
- But Vite tries to load assets from: `http://localhost:5173/phimhv.github.io/`
- Result: 404 errors, WebSocket fails, app won't load properly

---

## ✅ **Solution**

### **Conditional Base Path**

```typescript
// NEW CONFIG - DYNAMIC
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/phimhv.github.io/' : '/',
  // Development:  base = '/'                      ✅
  // Production:   base = '/phimhv.github.io/'     ✅
}))
```

**How it works**:
- **Development** (`npm run dev`): `command = 'serve'` → `base = '/'`
- **Production** (`npm run build`): `command = 'build'` → `base = '/phimhv.github.io/'`

---

## 📝 **Changes Made**

### **Before** ❌
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/phimhv.github.io/', // Hard-coded
  // ...
})
```

### **After** ✅
```typescript
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/phimhv.github.io/' : '/',
  // ...
}))
```

**Note**: Added function wrapper `({ command }) => ({ ... })` to access build command.

---

## 🚀 **How to Apply**

### **Step 1: Stop Current Dev Server**
```powershell
# Press in terminal where dev server is running
Ctrl + C
```

### **Step 2: Restart Dev Server**
```powershell
cd react-app
npm run dev
```

### **Step 3: Verify**
```
✅ Should open: http://localhost:5173/
❌ NOT: http://localhost:5173/phimhv.github.io/

✅ Console should show:
   - No asset loading errors
   - No WebSocket errors
   - Clean HMR connection

✅ Network tab should show:
   - GET http://localhost:5173/vite.svg (200 OK)
   - WebSocket: ws://localhost:5173/?token=... (connected)
```

---

## 🧪 **Testing Both Environments**

### **Development Build** ✅
```powershell
npm run dev

# Expected:
# ✅ Base path: /
# ✅ Assets load from: http://localhost:5173/assets/...
# ✅ WebSocket: ws://localhost:5173/
```

### **Production Build** ✅
```powershell
npm run build
npm run preview

# Expected:
# ✅ Base path: /phimhv.github.io/
# ✅ Assets in dist/ have correct paths
# ✅ GitHub Pages deployment works
```

---

## 📊 **Impact**

| Aspect | Before | After |
|--------|--------|-------|
| Dev Asset URLs | ❌ `/phimhv.github.io/assets/...` | ✅ `/assets/...` |
| Dev WebSocket | ❌ `ws://localhost:5173/phimhv.github.io/` | ✅ `ws://localhost:5173/` |
| Prod Asset URLs | ✅ `/phimhv.github.io/assets/...` | ✅ `/phimhv.github.io/assets/...` |
| GitHub Pages | ✅ Works | ✅ Still works |

---

## 🔍 **Technical Details**

### **Vite defineConfig Function Form**

```typescript
// Object form (static config)
export default defineConfig({
  base: '/path/'
})

// Function form (dynamic config)
export default defineConfig(({ command, mode }) => ({
  base: command === 'build' ? '/production-path/' : '/dev-path/'
}))
```

**Parameters**:
- `command`: `'build'` | `'serve'`
- `mode`: `'development'` | `'production'` | custom

**Reference**: https://vitejs.dev/config/#conditional-config

---

## ⚠️ **Important Notes**

### **1. Router Base Path**
Currently using `BrowserRouter` which automatically uses Vite's `base`:
```typescript
<BrowserRouter> {/* ✅ Auto-uses Vite base */}
  <Routes>...</Routes>
</BrowserRouter>
```

If you need custom basename:
```typescript
<BrowserRouter basename="/custom-path/">
```

### **2. GitHub Pages Deployment**
Still works correctly! Production build uses correct base path.

Verify after build:
```powershell
npm run build
# Check dist/index.html - should have:
# <script type="module" src="/phimhv.github.io/assets/index-[hash].js">
```

### **3. Environment Variables**
Alternative approach using env vars:
```typescript
base: import.meta.env.DEV ? '/' : '/phimhv.github.io/',
```

Both approaches work! We chose `command` for clarity.

---

## 🐛 **Related Issues Fixed**

1. ✅ Asset loading errors in development
2. ✅ WebSocket HMR connection failures
3. ✅ Console spam about failed connections
4. ✅ Vite dev server path conflicts

---

## 📚 **References**

- **Vite Config**: https://vitejs.dev/config/
- **Conditional Config**: https://vitejs.dev/config/#conditional-config
- **Base Option**: https://vitejs.dev/config/shared-options.html#base
- **GitHub Pages**: https://vitejs.dev/guide/static-deploy.html#github-pages

---

## ✅ **Verification Checklist**

After restarting dev server:

```
□ Navigate to http://localhost:5173/
□ Page loads completely
□ No 404 errors in Console
□ No WebSocket errors
□ HMR works (edit file → auto refresh)
□ All images load
□ 3D particles render
□ Firebase initializes
□ Movies load correctly
```

---

## 🎯 **Summary**

**Problem**: Hard-coded GitHub Pages base path broke development server

**Solution**: Conditional base path based on build command

**Impact**: Development works smoothly, production deployment unchanged

**Status**: ✅ **FIXED** - Please restart dev server!

---

## 🚀 **Action Required**

```powershell
# STOP current server (Ctrl+C)
# Then run:
cd react-app
npm run dev
```

**Expected**: App should open at `http://localhost:5173/` and work perfectly! 🎉

