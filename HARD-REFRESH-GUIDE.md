# 🔄 Hard Refresh System - Hướng dẫn sử dụng

## Tổng quan

Hệ thống Hard Refresh đã được tích hợp vào ứng dụng web xem anime để cung cấp tính năng làm mới hoàn toàn (hard refresh) khi nhấn phím F5, thay vì soft refresh thông thường. Điều này đặc biệt hữu ích cho trình duyệt di động vì không có tùy chọn hard refresh tích hợp sẵn.

## ✨ Tính năng chính

### 🖥️ Desktop Support
- **F5**: Hard refresh (thay thế behavior mặc định)
- **Ctrl+Shift+R**: Hard refresh (alternative)
- **Ctrl+F5**: Hard refresh (Windows style)

### 📱 Mobile Support
- **Pull-to-refresh**: Kéo xuống từ đầu trang để hard refresh
- **3-finger long press**: Nhấn giữ 3 ngón tay trong 2 giây
- **Programmatic**: Gọi `hardRefreshManager.manualRefresh()`

### 🧹 Cache Clearing
- **Cache API**: Xóa toàn bộ browser cache
- **Service Worker Cache**: Xóa cache của Service Worker
- **localStorage**: Xóa (nhưng giữ lại dữ liệu quan trọng như theme)
- **sessionStorage**: Xóa hoàn toàn
- **IndexedDB**: Tùy chọn (mặc định tắt vì nguy hiểm)

## 🚀 Cách sử dụng

### Cho người dùng cuối

#### Desktop
1. Nhấn **F5** để thực hiện hard refresh
2. Hoặc nhấn **Ctrl+Shift+R** 
3. Hoặc nhấn **Ctrl+F5**

#### Mobile
1. **Pull-to-refresh**: Kéo xuống từ đầu trang khi đang ở top
2. **3-finger gesture**: Đặt 3 ngón tay lên màn hình và giữ 2 giây
3. Sẽ có visual feedback khi gesture được nhận diện

### Cho developers

#### Programmatic Usage
```javascript
// Trigger hard refresh manually
await hardRefreshManager.manualRefresh();

// Check status
const status = hardRefreshManager.getStatus();
console.log(status);

// Configure settings
hardRefreshManager.setConfirmationEnabled(true); // Enable confirmation dialog
hardRefreshManager.setMobileSupport(false); // Disable mobile gestures
```

#### Configuration Options
```javascript
const config = {
  debounceDelay: 500, // ms để tránh multiple rapid calls
  confirmationEnabled: false, // Hiện confirmation dialog
  showProgress: true, // Hiện progress indicator
  clearLocalStorage: true, // Xóa localStorage
  clearSessionStorage: true, // Xóa sessionStorage
  clearIndexedDB: false, // Xóa IndexedDB (nguy hiểm)
  enableMobileSupport: true, // Hỗ trợ mobile triggers
  enableVisualFeedback: true // Visual feedback
};
```

## 🔧 Technical Details

### Architecture
```
┌─────────────────────┐
│   Main Thread       │
│  (HardRefreshManager)│
├─────────────────────┤
│ • Event Listeners   │
│ • Cache Clearing    │
│ • UI Management     │
│ • Error Handling    │
└─────────┬───────────┘
          │ postMessage
          ▼
┌─────────────────────┐
│  Service Worker     │
├─────────────────────┤
│ • Cache Management  │
│ • Background Sync   │
│ • Response Handling │
└─────────────────────┘
```

### Cache Clearing Process
1. **Cache API**: `caches.delete()` cho tất cả cache stores
2. **Service Worker**: Gửi message để clear SW cache
3. **localStorage**: Clear nhưng backup/restore critical data
4. **sessionStorage**: Clear hoàn toàn
5. **Reload**: Với cache-busting parameters

### Fallback Strategy
```javascript
// Modern browsers
location.reload() + cache busting

// Legacy browsers  
location.reload(true) // Deprecated nhưng vẫn fallback

// Last resort
window.location.href = window.location.href + "?_refresh=" + Date.now()
```

## 🎨 Visual Feedback

### Progress Indicator
- Hiện khi đang thực hiện hard refresh
- Spinning icon với backdrop blur
- Auto-hide sau khi hoàn thành

### Pull-to-refresh Indicator (Mobile)
- Hiện khi kéo xuống từ top
- Blue gradient background
- Instruction text

### Error Notifications
- Red notification ở góc phải
- Auto-dismiss sau 5 giây
- Chi tiết lỗi cho debugging

## 🛡️ Error Handling

### Graceful Degradation
1. **Modern features không support**: Fallback to basic methods
2. **Service Worker fail**: Continue với client-side clearing
3. **Cache API fail**: Fallback to location.reload()
4. **All methods fail**: Show user notification

### Error Recovery
```javascript
try {
  await performHardRefresh();
} catch (error) {
  console.error('Hard refresh failed:', error);
  showErrorNotification(error);
  fallbackRefresh(); // Basic reload
}
```

## 📱 Mobile Optimization

### Touch Gestures
- **Debounced**: Tránh accidental triggers
- **Visual feedback**: Clear indication khi gesture active
- **Threshold-based**: Cần kéo đủ xa và đủ nhanh

### Performance
- **Non-blocking**: Không làm chậm scroll
- **Memory efficient**: Cleanup sau khi sử dụng
- **Battery friendly**: Minimal background processing

## 🔍 Debugging

### Console Commands
```javascript
// Check status
hardRefreshManager.getStatus()

// Manual trigger
hardRefreshManager.manualRefresh()

// Force refresh (bypass checks)
hardRefreshManager.forceRefresh()

// Reset stuck state
hardRefreshManager.resetState()

// View cache info
caches.keys().then(console.log)
```

### Debug Tool
Mở file `debug-hard-refresh.html` trong browser để có giao diện debug đầy đủ với:
- Control panel với các buttons test
- Real-time status display
- Cache information viewer
- Console log capture
- Keyboard shortcut simulator

### Common Issues & Solutions

#### "Hard refresh already in progress, skipping..."
**Nguyên nhân**: State bị stuck do lỗi trong quá trình refresh
**Giải pháp**:
```javascript
// Reset state manually
hardRefreshManager.resetState()

// Or force refresh
hardRefreshManager.forceRefresh()
```

#### Hard refresh không hoạt động
**Kiểm tra**:
1. Browser support: `hardRefreshManager.getStatus().supportedFeatures`
2. Event listeners: Check console for initialization messages
3. Service Worker: Ensure SW is active

**Debug steps**:
```javascript
// 1. Check if manager exists
console.log(window.hardRefreshManager)

// 2. Check status
hardRefreshManager.getStatus()

// 3. Test manual trigger
hardRefreshManager.manualRefresh()
```

#### Mobile gestures không hoạt động
**Nguyên nhân**: Touch events không được setup đúng
**Giải pháp**:
```javascript
// Check mobile support
hardRefreshManager.getStatus().config.enableMobileSupport

// Enable if disabled
hardRefreshManager.setMobileSupport(true)
```

### Debug Information
- Browser support detection
- Cache clearing results
- Performance metrics
- Error details
- State tracking
- Timeout protection

## 🚨 Cảnh báo

### Data Loss
- **localStorage**: Critical data được preserve (theme, preferences)
- **sessionStorage**: Bị xóa hoàn toàn
- **IndexedDB**: Mặc định không xóa (có thể enable)
- **Form data**: Có thể bị mất

### Performance Impact
- **Initial load**: Có thể chậm hơn do clear cache
- **Network usage**: Tăng do re-download resources
- **Battery**: Tăng consumption trên mobile

## 📊 Browser Support

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Cache API | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ |
| Touch Events | ✅ | ✅ | ✅ | ✅ | ✅ |
| F5 Override | ✅ | ✅ | ✅ | ✅ | N/A |

## 🔄 Updates & Maintenance

### Version History
- **v1.0**: Initial implementation
- **v1.1**: Mobile support added
- **v1.2**: Enhanced error handling
- **v1.3**: Performance optimizations

### Future Enhancements
- [ ] Selective cache clearing
- [ ] User preferences for cache types
- [ ] Analytics integration
- [ ] A/B testing support

## 🤝 Contributing

### Adding New Features
1. Update `HardRefreshManager` class
2. Add corresponding tests
3. Update documentation
4. Test across browsers/devices

### Reporting Issues
- Include browser/device info
- Provide console errors
- Describe expected vs actual behavior
- Include steps to reproduce

---

**Lưu ý**: Tính năng này được thiết kế để cải thiện trải nghiệm người dùng, đặc biệt trên mobile devices. Sử dụng cẩn thận trong production và luôn test trên nhiều devices khác nhau.
