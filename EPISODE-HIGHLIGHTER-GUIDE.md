# 🎯 Episode Highlighter - Đánh dấu tập đang xem

Module tự động đánh dấu màu tập phim đang xem trong trang chi tiết phim.

## ✨ Tính năng

- ✅ **Highlight tập đang xem** với màu tím nổi bật
- ✅ **Badge "▶️ 45%"** hiển thị tiến độ xem
- ✅ **Auto-scroll** đến tập đang xem
- ✅ **Progress bar** phía dưới button
- ✅ **Pulse animation** thu hút sự chú ý
- ✅ **Sync real-time** từ Firebase

## 🎬 Demo Visual

```
┌─────────────────────────────────────────┐
│  DANH SÁCH TẬP PHIM                     │
├─────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │Tập 1│  │Tập 2│  │Tập 3│  ← Highlight│
│  └─────┘  └─────┘  └─────┘     + Badge │
│                    ┌──────────┐         │
│                    │▶️ 45%    │ ← Badge │
│                    └──────────┘         │
│                    ═══════════          │
│                    ▓▓▓▓▓░░░░░  ← Progress│
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │Tập 4│  │Tập 5│  │Tập 6│             │
│  └─────┘  └─────┘  └─────┘             │
└─────────────────────────────────────────┘
```

## 🚀 Cách sử dụng

### 1. Cách đơn giản nhất (Recommended)

```javascript
import { initEpisodeHighlighter } from './modules/episode-highlighter.js';

// Trong trang chi tiết phim (movie detail page)
const movieSlug = 'phim-hay-2024'; // Lấy từ URL hoặc API

// Gọi 1 dòng này là xong!
initEpisodeHighlighter(movieSlug);
```

**Kết quả:**
- ✅ Tự động tìm tập đang xem từ Firebase
- ✅ Highlight tập đó với border + background tím
- ✅ Hiện badge "▶️ 45%" với progress
- ✅ Auto-scroll đến tập đó

### 2. Cách chi tiết hơn

```javascript
import { highlightCurrentEpisode } from './modules/episode-highlighter.js';

// Custom selector và options
const result = await highlightCurrentEpisode(
  'phim-hay-2024',           // Movie slug
  '.episode-list',           // Episode container selector
  {
    activeClass: 'episode-watching',  // CSS class name
    scrollToEpisode: true,            // Auto-scroll
    showBadge: true                   // Show progress badge
  }
);

if (result) {
  console.log('Highlighted:', result.episodeName);
  console.log('Progress:', result.progress * 100 + '%');
}
```

### 3. Update highlight khi chuyển tập

```javascript
import { updateEpisodeHighlight } from './modules/episode-highlighter.js';

// Khi user click chuyển sang tập mới
function onEpisodeChange(newEpisodeSlug) {
  // ... load video ...
  
  // Update highlight
  updateEpisodeHighlight(movieSlug, newEpisodeSlug);
}
```

## 📋 Ví dụ tích hợp hoàn chỉnh

### Movie Detail Page (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Phim Chi Tiết</title>
</head>
<body>
  <div class="movie-detail">
    <h1>Tên Phim</h1>
    
    <!-- Episode List -->
    <div class="episode-list">
      <a href="/watch/phim-slug/tap-1" data-slug="tap-1" class="episode-btn">
        Tập 1
      </a>
      <a href="/watch/phim-slug/tap-2" data-slug="tap-2" class="episode-btn">
        Tập 2
      </a>
      <a href="/watch/phim-slug/tap-3" data-slug="tap-3" class="episode-btn">
        Tập 3
      </a>
      <!-- ... more episodes ... -->
    </div>
  </div>

  <script type="module">
    import { initEpisodeHighlighter } from './modules/episode-highlighter.js';
    
    // Get movie slug from URL
    const movieSlug = window.location.pathname.split('/')[2];
    
    // Init highlighter
    initEpisodeHighlighter(movieSlug);
  </script>
</body>
</html>
```

### Movie Detail Page (JavaScript)

```javascript
// movie-detail.js
import { initEpisodeHighlighter, getCurrentEpisodeInfo } from './modules/episode-highlighter.js';

class MovieDetailPage {
  constructor(movieSlug) {
    this.movieSlug = movieSlug;
  }
  
  async init() {
    // Load movie data
    await this.loadMovieData();
    
    // Render episodes
    this.renderEpisodes();
    
    // Highlight current episode
    await initEpisodeHighlighter(this.movieSlug);
    
    // Optional: Show current episode info
    const currentEpisode = await getCurrentEpisodeInfo(this.movieSlug);
    if (currentEpisode) {
      this.showContinueWatchingButton(currentEpisode);
    }
  }
  
  renderEpisodes() {
    const container = document.querySelector('.episode-list');
    
    this.episodes.forEach(ep => {
      const btn = document.createElement('a');
      btn.href = `/watch/${this.movieSlug}/${ep.slug}`;
      btn.className = 'episode-btn';
      btn.dataset.slug = ep.slug;  // ← Quan trọng!
      btn.textContent = ep.name;
      
      btn.onclick = (e) => {
        e.preventDefault();
        this.playEpisode(ep);
      };
      
      container.appendChild(btn);
    });
  }
  
  showContinueWatchingButton(episodeInfo) {
    const banner = document.createElement('div');
    banner.className = 'continue-banner';
    banner.innerHTML = `
      <p>Bạn đang xem: <strong>${episodeInfo.episodeName}</strong></p>
      <p>Tiến độ: ${Math.floor(episodeInfo.progress * 100)}%</p>
      <button onclick="scrollToCurrentEpisode()">
        ▶️ Tiếp tục xem
      </button>
    `;
    document.body.prepend(banner);
  }
}

// Usage
const movieSlug = 'phim-hay-2024';
const page = new MovieDetailPage(movieSlug);
page.init();
```

## 🎨 Tùy chỉnh Style

### Thay đổi màu highlight

```css
/* Override màu tím thành màu đỏ */
.episode-watching {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(231, 76, 60, 0.2)) !important;
  border-color: #e74c3c !important;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.3) !important;
}

.watching-badge {
  background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
}
```

### Thay đổi vị trí badge

```css
/* Badge ở góc trái thay vì phải */
.watching-badge {
  left: 5px !important;
  right: auto !important;
}

/* Badge ở dưới thay vì trên */
.watching-badge {
  top: auto !important;
  bottom: 5px !important;
}
```

### Tắt animation

```css
.episode-watching {
  animation: none !important;
}
```

### Custom progress bar

```css
/* Progress bar dày hơn */
.episode-watching::after {
  height: 5px !important;
}

/* Đổi màu progress bar */
.episode-watching::after {
  background: linear-gradient(90deg, #ff6b6b, #ee5a6f) !important;
}
```

## 🔧 Advanced Usage

### Custom episode detection

Nếu HTML structure của bạn khác, cần thêm data attribute:

```html
<!-- Thêm data-slug hoặc data-episode -->
<button class="ep-btn" data-slug="tap-3" data-episode="tap-3">
  Tập 3
</button>

<!-- Hoặc đảm bảo href có episode slug -->
<a href="/watch/movie-slug/tap-3">Tập 3</a>
```

### Multiple episode lists (nhiều server)

```javascript
// Highlight cho tất cả servers
const servers = ['.server-1', '.server-2', '.server-3'];

for (const selector of servers) {
  await highlightCurrentEpisode(movieSlug, selector);
}
```

### Refresh highlight khi cần

```javascript
// Sau khi load thêm episodes (pagination, infinite scroll)
function onLoadMoreEpisodes() {
  loadEpisodes().then(() => {
    // Re-highlight
    highlightCurrentEpisode(movieSlug);
  });
}
```

## 📊 API Reference

### `initEpisodeHighlighter(movieSlug, options)`

Initialize và auto-highlight khi page load.

**Parameters:**
- `movieSlug` (string) - Slug của phim
- `options` (object) - Optional configuration

**Options:**
```javascript
{
  activeClass: 'episode-watching',  // CSS class
  scrollToEpisode: true,            // Auto scroll
  showBadge: true                   // Show progress badge
}
```

**Returns:** Promise<void>

### `highlightCurrentEpisode(movieSlug, containerSelector, options)`

Highlight tập đang xem.

**Parameters:**
- `movieSlug` (string) - Slug của phim
- `containerSelector` (string) - CSS selector của episode container
- `options` (object) - Configuration options

**Returns:** Promise<Object|null>

**Return value:**
```javascript
{
  episodeSlug: 'tap-3',
  episodeName: 'Tập 3',
  element: HTMLElement,  // Element được highlight
  progress: 0.45         // Progress (0-1)
}
```

### `updateEpisodeHighlight(movieSlug, newEpisodeSlug)`

Update highlight sau khi chuyển tập.

**Parameters:**
- `movieSlug` (string)
- `newEpisodeSlug` (string)

**Returns:** Promise<void>

### `getCurrentEpisodeInfo(movieSlug)`

Lấy thông tin tập đang xem từ Firebase.

**Returns:** Promise<Object|null>

```javascript
{
  episodeSlug: 'tap-3',
  episodeName: 'Tập 3',
  progress: 0.45,
  currentTime: 450,
  duration: 1000
}
```

## 🐛 Troubleshooting

### Không highlight được tập?

**Giải pháp:**

1. **Check Firebase initialized:**
```javascript
console.log('Firebase ready:', !!window.movieComments);
```

2. **Check có watch progress không:**
```javascript
const progress = await window.movieComments.getWatchProgress(movieSlug);
console.log('Progress:', progress);
```

3. **Check episode element có đúng data attribute:**
```javascript
// Element cần có 1 trong các attribute này:
// - data-slug="tap-3"
// - data-episode="tap-3"
// - href="/watch/movie/tap-3"
```

4. **Check selector đúng không:**
```javascript
const container = document.querySelector('.episode-list');
console.log('Container found:', !!container);

const episodes = container.querySelectorAll('.episode-btn');
console.log('Episodes found:', episodes.length);
```

### Badge bị che khuất?

```css
/* Tăng z-index */
.watching-badge {
  z-index: 999 !important;
}
```

### Highlight không đúng màu?

Có thể CSS bị override. Sử dụng `!important`:

```css
.episode-watching {
  background: ... !important;
  border: ... !important;
}
```

## ✅ Checklist Integration

- [ ] Import module vào movie detail page
- [ ] Lấy movieSlug từ URL/API
- [ ] Gọi `initEpisodeHighlighter(movieSlug)`
- [ ] Thêm `data-slug` attribute vào episode buttons
- [ ] Test: Xem phim → Quay lại detail page → Check highlight
- [ ] Test: Refresh page → Highlight vẫn còn
- [ ] Test: Chuyển tập → Highlight update

## 🎯 Best Practices

1. **Luôn set data-slug:**
```html
<a href="/watch/movie/tap-3" data-slug="tap-3">Tập 3</a>
```

2. **Init sau khi render episodes:**
```javascript
renderEpisodes();
await initEpisodeHighlighter(movieSlug);
```

3. **Update highlight sau khi chuyển tập:**
```javascript
function switchEpisode(newEp) {
  loadVideo(newEp);
  updateEpisodeHighlight(movieSlug, newEp.slug);
}
```

## 📱 Mobile Support

Module tự động responsive:
- Badge nhỏ hơn trên mobile (9px vs 10px)
- Border mỏng hơn (1.5px vs 2px)
- Touch-friendly spacing

## 🔗 Related Modules

- `modules/artplayer-firebase.js` - Player với auto-save
- `modules/current-episode-helper.js` - Badge cho movie list
- `firebase-config.js` - Firebase methods

---

**Version:** 1.0.0  
**Last Updated:** 2024
