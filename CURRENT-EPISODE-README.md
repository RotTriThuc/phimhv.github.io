# 📺 Tính năng Lưu Tập Đang Xem

Hệ thống tự động nhớ và hiển thị tập phim đang xem.

## ✨ Tính năng

- ✅ **Tự động lưu tập đang xem** mỗi khi xem video
- ✅ **Badge "▶️ Tập X"** hiển thị trên movie cards
- ✅ **Sync cross-device** qua Firebase
- ✅ **Auto-update** khi chuyển tập

## 🎯 Cách hoạt động

### 1. Khi xem phim

```javascript
// ArtPlayer tự động lưu tập đang xem sau 10 giây
const player = createArtPlayerFirebase();
await player.init(container, videoUrl, {
  slug: 'phim-slug',
  name: 'Tên phim',
  episodeSlug: 'tap-5',     // ← Tập đang xem
  episodeName: 'Tập 5'      // ← Tên tập
});

// → Tự động lưu vào Firebase sau 10 giây xem
// → Update vào savedMovies collection
```

### 2. Hiển thị badge trên danh sách phim

```javascript
import { initEpisodeBadges } from './modules/current-episode-helper.js';

// Trong trang danh sách phim yêu thích
initEpisodeBadges('.saved-movies-list');
```

**Kết quả:**
```
┌─────────────────┐
│  [Poster Image] │
│                 │
│  ┌─────────────┐│
│  │▶️ Tập 5     ││  ← Badge xuất hiện ở góc dưới poster
│  └─────────────┘│
└─────────────────┘
  Tên phim
```

## 📦 Firebase Collections

### savedMovies (đã cập nhật)

```javascript
{
  slug: "phim-hay-2024",
  name: "Phim Hay 2024",
  userId: "user_123",
  
  // ← Thêm mới
  currentEpisode: "tap-5",      // Episode slug
  currentEpisodeName: "Tập 5",  // Episode name để hiển thị
  
  savedAt: Timestamp,
  poster_url: "...",
  // ... other fields
}
```

### watchProgress (không đổi)

```javascript
{
  movieSlug: "phim-hay-2024",
  userId: "user_123",
  episodeSlug: "tap-5",
  episodeName: "Tập 5",
  currentTime: 450,
  duration: 1200,
  progress: 0.375
}
```

## 🚀 Sử dụng

### A. Tích hợp với Watch Page

```javascript
// watch-page.js
import { createArtPlayerFirebase } from './modules/artplayer-firebase.js';

async function loadEpisode(episodeData) {
  const player = createArtPlayerFirebase();
  
  await player.init(
    document.querySelector('#player'),
    episodeData.videoUrl,
    {
      slug: movieSlug,
      name: movieName,
      poster_url: posterUrl,
      episodeSlug: episodeData.slug,    // ← Quan trọng
      episodeName: episodeData.name     // ← Quan trọng
    }
  );
  
  // Player sẽ tự động:
  // 1. Lưu tiến độ xem
  // 2. Update tập đang xem vào savedMovies
}
```

### B. Hiển thị badge trong Saved Movies

```javascript
// saved-movies-page.js
import { initEpisodeBadges } from './modules/current-episode-helper.js';

// Load saved movies
const movies = await window.movieComments.getSavedMovies();

// Render movie cards
renderMovieCards(movies);

// Add episode badges
initEpisodeBadges('.saved-movies-container');
```

### C. Hiển thị tập đang xem trong Watch Page

```javascript
// watch-page.js
async function loadMovie(movieSlug) {
  // Get saved movie data
  const savedMovies = await window.movieComments.getSavedMovies();
  const savedMovie = savedMovies.find(m => m.slug === movieSlug);
  
  if (savedMovie && savedMovie.currentEpisode) {
    // Tìm và load episode đã lưu
    const episode = episodes.find(e => e.slug === savedMovie.currentEpisode);
    
    if (episode) {
      console.log(`📺 Tiếp tục từ ${savedMovie.currentEpisodeName}`);
      await loadEpisode(episode);
      return;
    }
  }
  
  // Nếu không có, load tập đầu tiên
  await loadEpisode(episodes[0]);
}
```

## 🎨 Tùy chỉnh Badge Style

```css
/* Custom badge colors */
.current-episode-badge {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f) !important;
}

/* Larger badge */
.current-episode-badge {
  font-size: 14px !important;
  padding: 8px 14px !important;
}

/* Position at top-right instead */
.current-episode-badge {
  bottom: auto !important;
  top: 10px !important;
  left: auto !important;
  right: 10px !important;
}
```

## 📊 API Methods

### Firebase Methods

**`updateCurrentEpisode(movieSlug, episodeSlug, episodeName)`**
```javascript
// Update tập đang xem
await window.movieComments.updateCurrentEpisode(
  'phim-hay-2024',
  'tap-5',
  'Tập 5'
);
```

**`saveMovie(movie)` - đã cập nhật**
```javascript
// Lưu phim với thông tin tập
await window.movieComments.saveMovie({
  slug: 'phim-hay-2024',
  name: 'Phim Hay 2024',
  currentEpisode: 'tap-5',      // ← Thêm
  currentEpisodeName: 'Tập 5',  // ← Thêm
  // ... other fields
});
```

### Badge Helper Methods

**`addCurrentEpisodeBadge(movieCard, movieData)`**
```javascript
// Thêm badge cho 1 movie card
import { addCurrentEpisodeBadge } from './modules/current-episode-helper.js';

const card = document.querySelector('.movie-card');
addCurrentEpisodeBadge(card, {
  currentEpisode: 'tap-5',
  currentEpisodeName: 'Tập 5'
});
```

**`updateAllMovieCardsWithEpisodes(containerSelector)`**
```javascript
// Update tất cả movie cards trong container
await updateAllMovieCardsWithEpisodes('.saved-movies');
```

**`initEpisodeBadges(containerSelector, autoRefresh)`**
```javascript
// Init với auto-refresh
initEpisodeBadges('.saved-movies', true);
```

## ⚙️ Configuration

Trong `modules/artplayer-firebase.js`:

```javascript
const player = createArtPlayerFirebase({
  AUTO_SAVE_INTERVAL: 5000,  // Save mỗi 5 giây
  MIN_WATCH_TIME: 10,        // Sau 10 giây mới update episode (default: 5)
});
```

## 🐛 Debugging

```javascript
// Check current episode của một phim
const movies = await window.movieComments.getSavedMovies();
const movie = movies.find(m => m.slug === 'phim-slug');
console.log('Current episode:', movie.currentEpisode, movie.currentEpisodeName);

// Manual update episode
await window.movieComments.updateCurrentEpisode(
  'phim-slug',
  'tap-10',
  'Tập 10'
);
```

## 🔄 Flow Diagram

```
User xem phim Tập 5
    ↓
ArtPlayer auto-save progress (mỗi 5s)
    ↓
Sau 10 giây → Update currentEpisode
    ↓
Firebase savedMovies:
  currentEpisode = "tap-5"
  currentEpisodeName = "Tập 5"
    ↓
User quay lại trang danh sách
    ↓
Badge "▶️ Tập 5" xuất hiện
    ↓
User click vào phim
    ↓
Watch page load episode "tap-5"
```

## ✅ Checklist Integration

- [ ] Import module vào watch page
- [ ] Truyền `episodeSlug` và `episodeName` vào player
- [ ] Import badge helper vào saved movies page
- [ ] Gọi `initEpisodeBadges()` sau khi render movies
- [ ] Test: Xem phim → Quay lại → Check badge
- [ ] Test: Xem trên thiết bị A → Mở thiết bị B → Badge sync

## 📱 Mobile Support

Badge tự động responsive:
- Desktop: Font 12px, padding 6x12px
- Mobile: Font 11px, padding 5x10px
- Max width: 120px (desktop), 100px (mobile)

## 🎯 Best Practices

1. **Luôn truyền đầy đủ episode info:**
   ```javascript
   {
     episodeSlug: 'tap-5',     // ✅ Cần thiết
     episodeName: 'Tập 5'      // ✅ Cần thiết
   }
   ```

2. **Update badge sau mỗi lần render movies:**
   ```javascript
   renderSavedMovies();
   initEpisodeBadges('.saved-movies');
   ```

3. **Sử dụng auto-refresh cho real-time:**
   ```javascript
   initEpisodeBadges('.movies', true); // ← auto-refresh
   ```

## 📚 Related Files

- `modules/artplayer-firebase.js` - Main player module
- `modules/current-episode-helper.js` - Badge helper
- `firebase-config.js` - Firebase methods (updateCurrentEpisode)
- `ARTPLAYER-FIREBASE-GUIDE.md` - Full documentation

## 🆘 Support

Nếu gặp vấn đề:

1. Check console logs
2. Verify Firebase initialized: `window.movieComments`
3. Check movie data has episode info
4. Verify selector matches your HTML structure

---

**Version:** 1.0.0  
**Last Updated:** 2024
