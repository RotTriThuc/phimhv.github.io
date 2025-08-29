# 🎬 Movie Banner Slider Documentation

## Tổng quan
Movie Banner Slider là component hiển thị slide banner phim tích hợp API phimapi.com, được thiết kế để hiển thị trên trang chủ với giao diện responsive và hiệu ứng mượt mà.

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
// Movie Banner Slider
const bannerContainer = createEl('div', 'movie-banner');
root.appendChild(bannerContainer);

// Initialize với performance check
setTimeout(() => {
  if (!movieBanner && bannerContainer.isConnected) {
    movieBanner = new MovieBannerSlider(bannerContainer);
  }
}, 100);
```

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
**Version**: 1.0.0  
**Status**: ✅ Production Ready
