# 🎬 Hướng dẫn ArtPlayer Firebase Integration

Module tích hợp ArtPlayer 5.3.0 với Firebase để lưu tiến độ xem và tập phim hiện tại.

## ✨ Tính năng

- ✅ **Auto-save tiến độ xem** mỗi 5 giây
- ✅ **Lưu tập phim đang xem** vào Firebase
- ✅ **Hiển thị badge "Tập X"** trên movie cards
- ✅ **Tự động nhớ tập cuối xem** khi quay lại phim
- ✅ **Tiếp tục xem từ vị trí cũ** khi quay lại
- ✅ **Sync cross-device** - Xem trên máy này, tiếp tục trên máy khác
- ✅ **Auto-reset** khi xem xong 90% video
- ✅ **Custom controls** - Nút tập trước/sau
- ✅ **Continue watching layer** - Dialog hỏi tiếp tục xem

## 📦 Cài đặt

Module đã có sẵn tại `modules/artplayer-firebase.js`

### Import vào project

```javascript
import { createArtPlayerFirebase, getAllWatchProgress } from './modules/artplayer-firebase.js';
```

## 🚀 Cách sử dụng

### 1. Khởi tạo Player cơ bản

```javascript
// Khởi tạo player
const artPlayer = createArtPlayerFirebase();

// Init với video container
await artPlayer.init(
  document.querySelector('#video-container'), // Container element
  'https://video-url.m3u8', // Video URL
  {
    slug: 'phim-hay-2024', // Movie slug (để lưu vào Firebase)
    name: 'Phim Hay 2024', // Movie name
    poster_url: 'https://poster.jpg', // Poster image
    episodeSlug: 'tap-1', // Episode slug
    episodeName: 'Tập 1' // Episode name
  }
);
```

### 2. Setup với Episode Navigation

```javascript
const artPlayer = createArtPlayerFirebase();

await artPlayer.init(
  document.querySelector('#video-container'),
  videoUrl,
  movieData
);

// Set callbacks cho nút tập trước/sau
artPlayer.setNavigationCallbacks(
  () => playNextEpisode(), // Next episode callback
  () => playPrevEpisode()  // Previous episode callback
);
```

### 3. Switch Episode (Đổi tập)

```javascript
// Khi user chọn tập khác
artPlayer.updateEpisode(
  'tap-2',           // Episode slug mới
  'Tập 2',           // Episode name mới
  'https://...'      // Video URL mới
);
```

### 4. Hiển thị badge "Tập đang xem" trên movie cards

```javascript
import { initEpisodeBadges } from './modules/current-episode-helper.js';

// Khởi tạo badges cho trang danh sách phim
initEpisodeBadges('.movie-list', true); // auto-refresh mỗi 30s

// Hoặc thủ công update
import { updateAllMovieCardsWithEpisodes } from './modules/current-episode-helper.js';
await updateAllMovieCardsWithEpisodes('.movie-list');
```

### 5. Lấy danh sách "Continue Watching"

```javascript
// Lấy tất cả phim đang xem dở
const continueWatching = await getAllWatchProgress();

console.log(continueWatching);
// [
//   {
//     movieSlug: 'phim-hay-2024',
//     episodeSlug: 'tap-1',
//     episodeName: 'Tập 1',
//     currentTime: 450, // seconds
//     duration: 1200,
//     progress: 0.375, // 37.5%
//     lastWatched: 1672531200000 // timestamp
//   }
// ]
```

### 6. Cleanup khi destroy

```javascript
// Khi rời khỏi trang hoặc destroy player
artPlayer.destroy();
```

## 📋 Ví dụ hoàn chỉnh

### Watch Page Implementation

```javascript
import { createArtPlayerFirebase } from './modules/artplayer-firebase.js';

class WatchPage {
  constructor() {
    this.artPlayer = null;
    this.currentMovie = null;
    this.episodes = [];
    this.currentEpisodeIndex = 0;
  }
  
  async loadMovie(movieSlug) {
    // Fetch movie data from API
    const movieData = await API.getMovieDetail(movieSlug);
    this.currentMovie = movieData.movie;
    this.episodes = movieData.episodes[0].server_data; // Episode list
    
    // Load first episode (or last watched)
    await this.loadEpisode(0);
  }
  
  async loadEpisode(episodeIndex) {
    this.currentEpisodeIndex = episodeIndex;
    const episode = this.episodes[episodeIndex];
    
    // Destroy old player if exists
    if (this.artPlayer) {
      this.artPlayer.destroy();
    }
    
    // Create new player
    this.artPlayer = createArtPlayerFirebase();
    
    await this.artPlayer.init(
      document.querySelector('#video-player'),
      episode.link_m3u8 || episode.link_embed,
      {
        slug: this.currentMovie.slug,
        name: this.currentMovie.name,
        poster_url: this.currentMovie.poster_url,
        episodeSlug: episode.slug,
        episodeName: episode.name
      }
    );
    
    // Setup navigation
    this.artPlayer.setNavigationCallbacks(
      () => this.playNext(),
      () => this.playPrev()
    );
  }
  
  playNext() {
    if (this.currentEpisodeIndex < this.episodes.length - 1) {
      this.loadEpisode(this.currentEpisodeIndex + 1);
    }
  }
  
  playPrev() {
    if (this.currentEpisodeIndex > 0) {
      this.loadEpisode(this.currentEpisodeIndex - 1);
    }
  }
  
  destroy() {
    if (this.artPlayer) {
      this.artPlayer.destroy();
    }
  }
}

// Usage
const watchPage = new WatchPage();
await watchPage.loadMovie('phim-hay-2024');
```

### Continue Watching Section

```javascript
import { getAllWatchProgress } from './modules/artplayer-firebase.js';

async function renderContinueWatching() {
  const container = document.querySelector('#continue-watching');
  
  // Get all watching progress
  const watchList = await getAllWatchProgress();
  
  if (watchList.length === 0) {
    container.innerHTML = '<p>Chưa có phim đang xem</p>';
    return;
  }
  
  // Render movies
  const html = watchList.map(item => `
    <div class="movie-card" onclick="continueWatch('${item.movieSlug}')">
      <div class="progress-bar">
        <div class="progress" style="width: ${(item.progress * 100).toFixed(0)}%"></div>
      </div>
      <h4>${item.episodeName}</h4>
      <p>Đã xem ${(item.progress * 100).toFixed(0)}%</p>
      <small>${formatTime(item.lastWatched)}</small>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

function continueWatch(movieSlug) {
  window.location.href = `/watch/${movieSlug}`;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

// Load on page ready
renderContinueWatching();
```

## ⚙️ Cấu hình

Bạn có thể tùy chỉnh config khi khởi tạo:

```javascript
const artPlayer = createArtPlayerFirebase({
  AUTO_SAVE_INTERVAL: 10000, // Save mỗi 10 giây (mặc định: 5 giây)
  MIN_WATCH_TIME: 10, // Tối thiểu 10 giây mới lưu (mặc định: 5 giây)
  WATCHED_THRESHOLD: 0.95 // 95% mới coi như xem xong (mặc định: 90%)
});
```

## 🔥 Firebase Setup

Module sử dụng Firebase collections sau:

### Collection: `watchProgress`

```javascript
{
  movieSlug: "phim-hay-2024",
  userId: "user_abc123",
  episodeSlug: "tap-1",
  episodeName: "Tập 1",
  currentTime: 450,
  duration: 1200,
  progress: 0.375,
  isCompleted: false,
  lastWatched: 1672531200000,
  updatedAt: Timestamp
}
```

### Security Rules

Thêm rules sau vào Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /watchProgress/{docId} {
      // User có thể đọc/ghi progress của mình
      allow read, write: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📱 Cross-Device Sync

Tiến độ xem được tự động sync qua Firebase:

1. User xem phim trên máy tính → Lưu vào Firebase
2. User mở điện thoại → Tự động load tiến độ từ Firebase
3. Hiện dialog "Tiếp tục xem từ XX:XX?"

## 🎨 Custom Styling

Bạn có thể tùy chỉnh CSS cho continue watching layer:

```css
.art-continue-watching {
  background: rgba(0, 0, 0, 0.9) !important;
  border: 2px solid #6c5ce7 !important;
  box-shadow: 0 10px 40px rgba(108, 92, 231, 0.3) !important;
}

.art-btn-continue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.art-btn-continue:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(108, 92, 231, 0.5);
}
```

## 🐛 Debug & Logging

Module sử dụng Logger từ `modules/logger.js`:

```javascript
// Bật debug mode
Logger.setLevel('debug');

// Xem logs
Logger.debug('Current progress:', artPlayer.getWatchStats());
```

## 📊 API Reference

### Class: ArtPlayerFirebase

#### Methods

**`init(container, videoUrl, movieData)`**
- Khởi tạo player
- Returns: `Promise<Artplayer>`

**`updateEpisode(episodeSlug, episodeName, videoUrl)`**
- Đổi sang tập khác
- Auto-save progress trước khi đổi

**`setNavigationCallbacks(onNext, onPrev)`**
- Set callbacks cho nút tập trước/sau

**`saveProgress(isCompleted)`**
- Lưu tiến độ xem (tự động được gọi mỗi 5s)

**`getWatchProgress()`**
- Lấy tiến độ xem từ Firebase
- Returns: `Promise<Object>`

**`getWatchStats()`**
- Lấy thông tin xem hiện tại
- Returns: `Object`

**`destroy()`**
- Cleanup và destroy player

### Function: getAllWatchProgress()

Lấy tất cả phim đang xem dở của user
- Returns: `Promise<Array>`

## ❓ FAQ

**Q: Làm sao để không auto-play tập sau?**
```javascript
// Không set callbacks
artPlayer.setNavigationCallbacks(null, null);
```

**Q: Làm sao để xóa progress của một phim?**
```javascript
await window.movieComments.clearWatchProgress(movieSlug);
```

**Q: Có hỗ trợ subtitle không?**
```javascript
// Có, ArtPlayer hỗ trợ đầy đủ subtitle
// Xem docs: https://artplayer.org/
```

## 🔗 Links

- [ArtPlayer Docs](https://artplayer.org/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Module Source Code](./modules/artplayer-firebase.js)

## 📝 Changelog

### v1.0.0 (2024)
- ✅ Initial release
- ✅ Auto-save watch progress
- ✅ Continue watching feature
- ✅ Firebase integration
- ✅ Cross-device sync
