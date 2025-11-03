# 🔄 Auto-Update System Documentation

## 📋 Tổng Quan

Hệ thống Auto-Update cho phép tự động phát hiện và cập nhật các phần mới của series anime khi chúng được thêm vào API phimapi, đảm bảo navigation menu luôn hiển thị đầy đủ các phần phim mà không cần can thiệp thủ công.

## ✨ Tính Năng Chính

### 🔍 **Background Monitoring**
- Tự động kiểm tra phần mới mỗi 30 phút
- Chỉ track các series user đang xem/quan tâm
- Intelligent scheduling để tránh overload API

### 🧠 **Smart Cache Management**
- Cache invalidation khi có dữ liệu mới
- Shorter cache duration cho popular series
- LRU eviction cho memory optimization

### 🔔 **Real-time Notifications**
- Toast notifications khi có season mới
- Visual indicators trong navigation menu
- Event-driven updates cho UI components

### 🔄 **Manual Refresh**
- Refresh button trong series navigator
- Force refresh capability
- Immediate feedback cho user actions

## 🏗️ Kiến Trúc Hệ Thống

### **Core Components**

1. **Series Update Manager** (`modules/series-update-manager.js`)
   - Central coordinator cho auto-update system
   - Manages tracked series và scheduling
   - Handles comparison và change detection

2. **Enhanced Series Navigator** (`modules/series-navigator.js`)
   - Tích hợp auto-update capabilities
   - Smart cache với force refresh option
   - UI components với refresh button

3. **Event System**
   - Custom events cho series updates
   - Decoupled communication giữa components
   - Cleanup system để tránh memory leaks

## 🚀 Cách Sử Dụng

### **Automatic Tracking**
```javascript
// Tự động được setup khi user truy cập series
// Không cần code thêm - hoạt động ngầm
```

### **Manual Refresh**
```javascript
// Click refresh button trong series navigator
// Hoặc programmatically:
if (window.seriesUpdateManager) {
  await window.seriesUpdateManager.forceCheckSeries(seriesId);
}
```

### **Event Listening**
```javascript
// Listen for series updates
window.addEventListener('seriesUpdated', (event) => {
  const { seriesId, seriesInfo, newSeasons } = event.detail;
  console.log(`New seasons found for ${seriesInfo.baseName}`);
});
```

## ⚙️ Configuration

### **Update Intervals**
```javascript
const UPDATE_CONFIG = {
  checkInterval: 30 * 60 * 1000,        // 30 phút
  minCheckInterval: 15 * 60 * 1000,     // 15 phút minimum
  seriesMetadataCacheDuration: 60 * 60 * 1000, // 1 giờ
  maxTrackedSeries: 50                   // Tối đa 50 series
};
```

### **Cache Strategy**
```javascript
const CACHE_DURATIONS = {
  'search': 2 * 60 * 1000,      // 2 phút cho search
  'series-navigator': 5 * 60 * 1000, // 5 phút cho navigator
  'movie-detail': 15 * 60 * 1000      // 15 phút cho detail
};
```

## 🔧 Technical Implementation

### **Series Detection Algorithm**
1. Extract series info từ movie name using regex patterns
2. Generate unique seriesId cho tracking
3. Search API với series base name
4. Filter và sort results theo season number
5. Compare với cached data để detect changes

### **Update Detection Logic**
```javascript
// So sánh số lượng seasons
if (oldSeasons.length !== newSeasons.length) return true;

// So sánh từng season slug
const oldSlugs = new Set(oldSeasons.map(s => s.slug));
const newSlugs = new Set(newSeasons.map(s => s.slug));

for (const slug of newSlugs) {
  if (!oldSlugs.has(slug)) return true; // Found new season
}
```

### **Memory Management**
- Automatic cleanup khi navigate away từ page
- LRU eviction cho tracked series
- Event listener cleanup để tránh memory leaks

## 📊 Performance Considerations

### **API Rate Limiting**
- Minimum 15 phút interval giữa các lần check
- Staggered checking để tránh API burst
- Timeout protection (10 giây)

### **Memory Usage**
- Maximum 50 tracked series
- Automatic cleanup của old cache entries
- Efficient data structures (Map, Set)

### **User Experience**
- Non-blocking background operations
- Immediate feedback cho manual actions
- Graceful error handling

## 🐛 Troubleshooting

### **Common Issues**

1. **Auto-update không hoạt động**
   ```javascript
   // Check if manager is initialized
   console.log(window.seriesUpdateManager?.getStats());
   ```

2. **Refresh button không phản hồi**
   ```javascript
   // Check API availability
   console.log(window.Api, window.extractItems);
   ```

3. **Memory leaks**
   ```javascript
   // Check cleanup functions
   console.log(window.pageCleanupFunctions?.length);
   ```

### **Debug Commands**
```javascript
// Get update manager stats
window.seriesUpdateManager?.getStats();

// Force check specific series
window.seriesUpdateManager?.forceCheckSeries('seriesId');

// Clear all tracked series
window.seriesUpdateManager?.clearAll();
```

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Webhook integration cho real-time updates
- [ ] User preferences cho update frequency
- [ ] Batch notifications cho multiple updates
- [ ] Series popularity-based prioritization
- [ ] Offline support với sync khi online

### **Performance Optimizations**
- [ ] Intelligent prefetching cho popular series
- [ ] CDN-aware caching strategy
- [ ] Background service worker integration
- [ ] Delta updates thay vì full refresh

## 📝 Changelog

### **v1.0.0** - Initial Release
- ✅ Background monitoring system
- ✅ Smart cache invalidation
- ✅ Manual refresh capability
- ✅ Real-time notifications
- ✅ Memory management
- ✅ Event-driven architecture

---

## 🤝 Contributing

Khi contribute vào auto-update system:

1. **Test thoroughly** với different series patterns
2. **Monitor performance** impact trên API calls
3. **Ensure cleanup** của event listeners
4. **Document changes** trong file này
5. **Consider edge cases** như network failures

## 📞 Support

Nếu gặp vấn đề với auto-update system:
1. Check browser console cho error messages
2. Verify API connectivity
3. Test với manual refresh trước
4. Report issues với detailed logs
