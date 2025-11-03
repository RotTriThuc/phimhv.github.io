# 🔍 HOMEPAGE DEBUG GUIDE

## Issue: Trang chủ không hiển thị phim

---

## 🧪 **DEBUG STEPS**

### **Step 1: Check Console Logs**

Sau khi refresh browser, mở Console (F12) và tìm:

```javascript
// Expected logs:
🎬 Fetching movies from API...
📦 API Response: { status: true, data: { items: [...] } }
✅ Loaded 24 movies
🎯 Banner: 5 movies

// If error:
❌ Failed to fetch movies: [error message]
⚠️ API returned no items or invalid response
```

---

### **Step 2: Check Network Tab**

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by: Fetch/XHR
4. Refresh page
5. Look for:

```
GET https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1

Status: Should be 200 OK
Response: Should contain "status": true and "items": [array]
```

**If 404 or 500**: API có vấn đề
**If CORS error**: Need proxy
**If timeout**: Network issue

---

### **Step 3: Test API Directly**

Open new tab and visit:
```
https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1
```

**Expected**: JSON response with movies
**If error**: API server issue

---

### **Step 4: Check React State**

In Console, run:
```javascript
// Check if React DevTools available
window.__REACT_DEVTOOLS_GLOBAL_HOOK__

// Or add breakpoint in fetchMovies()
```

---

## 🔧 **COMMON ISSUES & FIXES**

### **Issue 1: API Returns Empty Items**

**Symptom**:
```
⚠️ API returned no items or invalid response
```

**Fix**: Change API endpoint
```typescript
// Try different endpoint
const response = await movieApi.getMoviesByType('phim-le', { page: 1, limit: 24 });
```

---

### **Issue 2: CORS Error**

**Symptom**:
```
Access to fetch at 'https://phimapi.com/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Fix**: API should have CORS headers. If not, need proxy.

---

### **Issue 3: Network Timeout**

**Symptom**:
```
❌ Failed to fetch movies: Network Error
```

**Possible Causes**:
1. No internet connection
2. Firewall blocking
3. API server down
4. DNS issue

**Fix**:
```powershell
# Test connection
ping phimapi.com
curl https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1
```

---

### **Issue 4: Response Structure Changed**

**Symptom**: API returns data but different structure

**Check**:
```typescript
// Expected structure:
{
  "status": true,
  "data": {
    "items": [
      {
        "name": "...",
        "slug": "...",
        "poster_url": "...",
        ...
      }
    ]
  }
}
```

**Fix**: Update TypeScript interfaces to match API

---

### **Issue 5: Loading State Stuck**

**Symptom**: Infinite loading spinner

**Possible Causes**:
1. setLoading(false) not called
2. API call hangs
3. Error not caught

**Fix**: Already added try-catch with setLoading(false) in finally block

---

## 📊 **CURRENT CODE FLOW**

```
HomePage Component Mount
    ↓
useEffect() triggers
    ↓
fetchMovies() called
    ↓
setLoading(true) → Show spinner
    ↓
movieApi.getNewMovies(1)
    ↓
API Call: GET /danh-sach/phim-moi-cap-nhat?page=1
    ↓
[SUCCESS PATH]              [ERROR PATH]
    ↓                           ↓
response.status = true      catch (err)
response.data.items = [24]      ↓
    ↓                       setError(...)
Optimize images                 ↓
    ↓                       Show error UI
setMovies([24])
setBannerMovies([5])
    ↓
setLoading(false)
    ↓
Show Banner + Grid
```

---

## 🎯 **EXPECTED RESULTS**

### **Success State**:
```
✅ Banner3D visible with 5 slides
✅ Grid shows 24 movie cards
✅ Each card has poster image
✅ Hover effects work
✅ Click card → navigate to detail
```

### **Error State**:
```
❌ No banner
❌ No grid
⚠️ Error message displayed
🔄 "Thử lại" button visible
```

---

## 🧪 **MANUAL TEST SCENARIOS**

### **Test 1: Fresh Load**
```
1. Clear browser cache (Ctrl + Shift + Delete)
2. Navigate to http://localhost:5173/
3. Check Console for logs
4. Verify movies display
```

### **Test 2: Network Throttling**
```
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Refresh page
4. Should show loading spinner then movies
```

### **Test 3: API Failure Simulation**
```
1. Open DevTools → Network tab
2. Right-click on API request
3. Block request URL
4. Refresh page
5. Should show error state
```

---

## 🔍 **DEBUGGING COMMANDS**

### **Browser Console**:
```javascript
// Check movies state (if using React DevTools)
$r.state.movies  // Should show array of 24 movies
$r.state.loading // Should be false
$r.state.error   // Should be null

// Force re-fetch
window.location.reload(true)
```

### **Terminal**:
```powershell
# Test API
curl https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1

# Check if dev server running
netstat -ano | findstr :5173

# Restart dev server
cd react-app
npm run dev
```

---

## 📝 **ENHANCED LOGGING**

New logging added to HomePage.tsx:

```typescript
console.log('🎬 Fetching movies from API...');
console.log('📦 API Response:', response);
console.log(`✅ Loaded ${movieList.length} movies`);
console.log(`🎯 Banner: ${optimizedMovies.slice(0, 5).length} movies`);
console.warn('⚠️ API returned no items...');
console.error('❌ Failed to fetch movies:', err);
```

---

## 🚀 **NEXT STEPS TO DEBUG**

1. **Refresh browser** with DevTools open (F12)
2. **Check Console tab** for logs
3. **Check Network tab** for API calls
4. **Report findings**:
   - What logs appear?
   - What is API status code?
   - What is response data?
   - Any errors?

---

## 📞 **REPORT TEMPLATE**

When reporting issues, provide:

```
Browser Console Output:
[paste console logs here]

Network Tab:
- API URL: 
- Status Code: 
- Response Preview: 
- Time: 

Error Messages:
[paste any errors]

Screenshots:
[attach if helpful]
```

---

**After implementing debug logs, REFRESH BROWSER and check Console!** 🔍

