# 🎬 Movie Banner Slider Documentation

## Tổng quan
Movie Banner Slider là component hiển thị slide banner phim tích hợp API phimapi.com, được thiết kế để hiển thị **chỉ trên trang chủ** với giao diện responsive và hiệu ứng mượt mà.

> **⚠️ Lưu ý quan trọng**: Banner slider đã được loại bỏ khỏi trang lọc phim để cải thiện trải nghiệm người dùng và giúp họ tập trung vào việc tìm kiếm phim.

## Tính năng chính

### ✨ UI/UX Features
- **Responsive Design**: Tự động điều chỉnh theo kích thước màn hình
- **Auto-play**: Tự động chuyển slide sau 5 giây
- **Navigation Controls**: Nút prev/next và dots indicator
- **Touch/Swipe Support**: Hỗ trợ vuốt trên mobile
- **Keyboard Navigation**: Điều khiển bằng phím mũi tên
- **Hover Pause**: Tạm dừng auto-play khi hover

### 🚀 Performance Features
- **Lazy Loading**: Chỉ tải ảnh khi cần thiết
- **Image Preloading**: Preload 3 ảnh đầu tiên
- **API Caching**: Sử dụng cache system có sẵn
- **Memory Management**: Tự động cleanup khi rời trang
- **Transition Throttling**: Ngăn spam click navigation

### 🎨 Visual Features
- **Gradient Overlay**: Overlay tối để text dễ đọc
- **Smooth Animations**: Transition mượt mà với CSS
- **Theme Support**: Tương thích dark/light theme
- **Accessibility**: ARIA labels và focus indicators

## Cấu trúc Code

### CSS Classes
```css
.movie-banner              /* Container chính */
.banner-slider            /* Slider wrapper */
.banner-slide             /* Mỗi slide */
.banner-slide.active      /* Slide hiện tại */
.banner-content           /* Nội dung text */
.banner-title             /* Tiêu đề phim */
.banner-meta              /* Thông tin phim (năm, chất lượng) */
.banner-description       /* Mô tả phim */
.banner-actions           /* Nút hành động */
.banner-btn               /* Button styling */
.banner-nav               /* Navigation buttons */
.banner-dots              /* Dots indicator */
```

### JavaScript API
```javascript
// Khởi tạo
const banner = new MovieBannerSlider(container);

// Public methods
banner.nextSlide();       // Slide tiếp theo
banner.prevSlide();       // Slide trước
banner.goToSlide(index);  // Đi đến slide cụ thể
banner.pauseAutoPlay();   // Tạm dừng auto-play
banner.resumeAutoPlay();  // Tiếp tục auto-play
banner.destroy();         // Cleanup
banner.refresh();         // Tải lại
```

## Responsive Breakpoints

### Desktop (>768px)
- Height: 400px
- Full navigation controls
- 3-line description
- Horizontal action buttons

### Tablet (768px)
- Height: 300px
- Smaller navigation buttons
- 2-line description
- Vertical action buttons

### Mobile (<480px)
- Height: 250px
- Hidden navigation buttons (chỉ swipe)
- 2-line description
- Compact buttons

## API Integration

### Endpoint sử dụng
- **URL**: `/danh-sach/phim-moi-cap-nhat-v3`
- **Method**: GET
- **Params**: `{ page: 1 }`
- **Limit**: 6 phim đầu tiên

### Data mapping
```javascript
{
  slug: movie.slug,                    // URL slug
  name: movie.name,                    // Tên phim
  poster_url: processImageUrl(...),    // Ảnh poster (đã optimize)
  year: movie.year,                    // Năm sản xuất
  quality: movie.quality,              // Chất lượng (HD, FHD, etc.)
  episode_current: movie.episode_current, // Tập hiện tại
  content: movie.content || fallback   // Mô tả phim
}
```

## Performance Optimizations

### 🖼️ Image Loading
- **CDN Integration**: Sử dụng system image loader có sẵn
- **Progressive Loading**: Hiển thị placeholder trước
- **Preload Strategy**: Preload 3 ảnh đầu + next image
- **Error Handling**: Fallback cho ảnh lỗi

### 🧠 Memory Management
- **Auto Cleanup**: Tự động destroy khi rời trang
- **Event Cleanup**: Remove event listeners
- **Interval Cleanup**: Clear auto-play intervals
- **DOM Cleanup**: Remove HTML elements

### ⚡ Performance Monitoring
- **Transition Throttling**: Ngăn spam navigation
- **DOM Check**: Kiểm tra element còn trong DOM
- **Hash Check**: Chỉ init trên trang chủ

## Integration với Codebase

### Tích hợp vào renderHome()
```javascript
// Movie Banner Slider - CHỈ HIỂN THỊ TRÊN TRANG CHỦ
const bannerContainer = createEl('div', 'movie-banner');
root.appendChild(bannerContainer);

// Initialize với performance check
createMovieBanner(bannerContainer, 'home');
```

### ❌ Đã loại bỏ khỏi trang lọc phim
Banner slider đã được loại bỏ khỏi function `renderCombinedFilter()` để:
- **Cải thiện UX**: Người dùng tập trung vào việc lọc phim
- **Tối ưu performance**: Giảm tải tài nguyên không cần thiết
- **Layout sạch sẽ**: Giao diện gọn gàng hơn khi lọc phim

### SPA Navigation Handling
- **hashchange Event**: Cleanup khi rời trang chủ
- **DOMContentLoaded**: Auto-init khi load trang
- **Performance Check**: Chỉ init khi cần thiết

## Accessibility Features

### Keyboard Support
- **Arrow Left/Right**: Navigation
- **Focus Indicators**: Outline khi focus
- **ARIA Labels**: Screen reader support

### Screen Reader
- **aria-label**: Mô tả navigation buttons
- **aria-live**: Thông báo slide changes
- **Semantic HTML**: Proper heading structure

### Reduced Motion
- **prefers-reduced-motion**: Tắt animation nếu user yêu cầu
- **Fallback**: Static display cho accessibility

## Browser Support

### Modern Browsers
- **Chrome 80+**: Full support
- **Firefox 75+**: Full support  
- **Safari 13+**: Full support
- **Edge 80+**: Full support

### Fallbacks
- **No IntersectionObserver**: Immediate loading
- **No Touch Events**: Mouse-only navigation
- **No CSS Grid**: Flexbox fallback

## Troubleshooting

### Common Issues

**Banner không hiển thị**
- Kiểm tra API endpoint hoạt động
- Verify CSS được load
- Check console errors

**Ảnh không load**
- Kiểm tra image loader system
- Verify CDN endpoints
- Check network connectivity

**Auto-play không hoạt động**
- Kiểm tra slides.length > 1
- Verify không bị pause
- Check interval cleanup

**Navigation không responsive**
- Kiểm tra touch events
- Verify CSS media queries
- Check viewport meta tag

## Banner3D Navigation (Updated Nov 2025)

### 🔄 Navigation Implementation
Banner3D component đã được tích hợp navigation functionality:

#### Action Buttons
- **Xem ngay** (Primary Button)
  - Navigate đến `/watch/${slug}`
  - Xem phim trực tiếp
  - Style: Primary với gradient purple
  
- **Chi tiết** (Secondary Button)
  - Navigate đến `/movie/${slug}`
  - Xem thông tin chi tiết phim
  - Style: Secondary với glass-morphism

#### Technical Details
```typescript
// Import
import { useNavigate } from 'react-router-dom';

// Usage in component
const navigate = useNavigate();

// Button onClick handlers
onClick={() => navigate(`/watch/${currentMovie.slug}`)}
onClick={() => navigate(`/movie/${currentMovie.slug}`)}
```

#### Routing Pattern
- Consistent với MovieCard3D component
- Sử dụng React Router v6
- Dynamic slug-based routing
- SPA navigation (no page reload)

### 🎨 Visual Improvements (Nov 2025)
- **Blur Effect**: Removed completely for clarity
- **Brightness**: Increased from 40% to 85%
- **Gradient Overlay**: Reduced from 95% to 50% opacity
- **Mobile Optimization**: Consistent brightness across devices

## Future Enhancements

### Planned Features
- **Video Background**: Support video slides
- **Parallax Effect**: Advanced visual effects
- **Analytics**: Track slide interactions
- **A/B Testing**: Different banner layouts

### Performance Improvements
- **WebP Support**: Better image compression
- **Service Worker**: Offline caching
- **Critical CSS**: Inline critical styles
- **Bundle Splitting**: Lazy load banner code

---

**Tác giả**: AI Assistant Cascade  
**Ngày tạo**: 29/08/2025  
**Cập nhật**: 01/11/2025 - Added Banner3D navigation & visual improvements  
**Version**: 1.1.0  
**Status**: ✅ Production Ready
