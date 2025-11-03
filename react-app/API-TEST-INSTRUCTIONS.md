# 🧪 API TESTING INSTRUCTIONS

## Test API trực tiếp để verify response structure

---

## 🎯 **MỤC ĐÍCH**

Test 2 endpoints để xác định:
1. **New Movies API** có trả về movies không?
2. **Movie Detail API** có trả về episodes không?

---

## 🔧 **CÁCH 1: Test bằng HTML File**

### **Step 1: Mở file test**

```
File path: react-app/TEST-API-DIRECT.html
```

**Mở bằng browser:**
- Click chuột phải vào file
- "Open with" → Browser
- HOẶC: Drag & drop vào browser

### **Step 2: Click buttons**

```
[Test Movie Detail API]  ← Click này để test detail endpoint
[Test New Movies API]    ← Click này để test list endpoint
```

### **Step 3: Xem kết quả**

**Nếu SUCCESS** ✅:
```
✅ Status: 200
✅ EPISODES FOUND: 24
📺 First Episode: {...}
```

**Nếu ERROR** ❌:
```
❌ NO EPISODES FOUND!
Response keys: name, slug, poster_url, ...
```

---

## 🔧 **CÁCH 2: Test bằng Browser Console**

### **Step 1: Mở Console**
```
F12 → Console tab
```

### **Step 2: Copy/Paste code**

**Test Movie Detail:**
```javascript
fetch('https://phimapi.com/phim/ngoi-truong-xac-song')
  .then(r => r.json())
  .then(data => {
    console.log('📦 Response:', data);
    console.log('✅ Has episodes?', !!data.movie?.episodes);
    console.log('📺 Episodes count:', data.movie?.episodes?.length || 0);
    console.log('🎬 Episodes:', data.movie?.episodes);
  });
```

**Test New Movies:**
```javascript
fetch('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1')
  .then(r => r.json())
  .then(data => {
    console.log('📦 Response:', data);
    console.log('✅ Has items?', !!(data.data?.items || data.items));
    console.log('📽️ Items count:', (data.data?.items || data.items)?.length || 0);
  });
```

---

## 🔧 **CÁCH 3: Test bằng Browser URL**

### **Direct URL Access:**

**Movie Detail:**
```
https://phimapi.com/phim/ngoi-truong-xac-song
```

**New Movies:**
```
https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1
```

Mở trong browser → Xem JSON response

---

## 📊 **KẾT QUẢ MONG ĐỢI**

### **Movie Detail Response:**

```json
{
  "status": true,
  "msg": "success",
  "movie": {
    "_id": "...",
    "name": "Ngôi Trường Xác Sống",
    "slug": "ngoi-truong-xac-song",
    "episodes": [
      {
        "server_name": "Vietsub #1",
        "server_data": [
          {
            "name": "Tập 1",
            "slug": "tap-1",
            "link_embed": "https://...",
            "link_m3u8": "https://..."
          }
        ]
      }
    ]
  }
}
```

**KEY CHECKS:**
- ✅ `data.status` = true
- ✅ `data.movie` exists
- ✅ `data.movie.episodes` exists
- ✅ `data.movie.episodes.length` > 0

---

### **New Movies Response:**

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "name": "Phim 1",
        "slug": "phim-1",
        "poster_url": "...",
        ...
      }
    ]
  }
}
```

**KEY CHECKS:**
- ✅ `data.status` = true
- ✅ `data.data.items` exists
- ✅ `data.data.items.length` > 0

---

## 🎯 **DIAGNOSTIC SCENARIOS**

### **Scenario 1: Movie Detail có episodes** ✅

```javascript
data.movie.episodes = [
  {
    server_name: "Vietsub #1",
    server_data: [
      { name: "Tập 1", ... }
    ]
  }
]
```

**Result**: Code should work! Vấn đề ở chỗ khác.

---

### **Scenario 2: Movie Detail KHÔNG có episodes** ❌

```javascript
data.movie.episodes = undefined
// OR
data.movie.episodes = []
```

**Possible Reasons:**
1. Phim chưa có tập
2. API structure changed
3. Wrong slug
4. API issue

**Fix**: Check `data.movie` keys to see what's available

---

### **Scenario 3: New Movies KHÔNG có items** ❌

```javascript
data.data.items = undefined
// OR
data.items = [...]  // Direct array
```

**Fix**: Adjust HomePage.tsx response handling

---

## 🚨 **TROUBLESHOOTING**

### **Issue 1: CORS Error**

```
Access to fetch has been blocked by CORS policy
```

**Solution**: 
- API should have CORS headers
- Open test HTML file directly in browser (not via file:// protocol if possible)
- Or use browser CORS extension temporarily

---

### **Issue 2: Network Error**

```
Failed to fetch
```

**Check:**
1. Internet connection
2. Firewall/antivirus
3. phimapi.com is accessible

---

### **Issue 3: 404 Not Found**

```
Status: 404
```

**Possible:**
1. Wrong endpoint URL
2. Slug doesn't exist
3. API changed

---

## 📝 **REPORT TEMPLATE**

After testing, report:

```
=== MOVIE DETAIL TEST ===
URL: https://phimapi.com/phim/ngoi-truong-xac-song
Status: 200 / Error
Has movie: Yes / No
Has episodes: Yes / No
Episodes count: 0 / 24 / N/A
Episodes structure: [paste if available]

=== NEW MOVIES TEST ===
URL: https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1
Status: 200 / Error
Has items: Yes / No
Items count: 0 / 24 / N/A
Response structure: data.items / items / other

=== CONCLUSION ===
[What you found]
```

---

## 🎬 **QUICK TEST COMMAND**

**Copy entire block and paste in browser console:**

```javascript
(async function testAPIs() {
  console.log('🧪 Testing PhimAPI endpoints...\n');
  
  // Test 1: Movie Detail
  try {
    const detail = await fetch('https://phimapi.com/phim/ngoi-truong-xac-song').then(r => r.json());
    console.log('✅ Movie Detail Response:', detail);
    console.log(`📺 Episodes: ${detail.movie?.episodes?.length || 0}`);
  } catch (e) {
    console.error('❌ Movie Detail Error:', e);
  }
  
  console.log('\n---\n');
  
  // Test 2: New Movies
  try {
    const list = await fetch('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1').then(r => r.json());
    console.log('✅ New Movies Response:', list);
    console.log(`📽️ Movies: ${list.data?.items?.length || list.items?.length || 0}`);
  } catch (e) {
    console.error('❌ New Movies Error:', e);
  }
})();
```

---

## ✅ **EXPECTED OUTCOME**

After testing, we should know:

1. ✅ API có hoạt động không?
2. ✅ Episodes có trong response không?
3. ✅ Structure như thế nào?
4. ✅ Cần fix gì trong code?

---

**CHOOSE A METHOD AND TEST NOW! 🧪**

**Báo cáo kết quả để tôi biết cách fix tiếp! 📊**

