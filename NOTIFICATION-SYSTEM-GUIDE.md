# 🔔 **HỆ THỐNG THÔNG BÁO HOÀN CHỈNH**

## 📋 **Tổng quan**

Hệ thống thông báo hoàn chỉnh cho web xem anime với các tính năng:

- **Frontend**: Toggle button, dropdown/modal, badge counter
- **Backend**: Admin panel quản lý thông báo
- **Auto-notification**: Tự động tạo thông báo khi có phim mới
- **Real-time**: Cập nhật thông báo theo thời gian thực

---

## 🏗️ **Kiến trúc hệ thống**

```
📁 Notification System Architecture
├── 🔥 Firebase Firestore (Database)
│   └── Collection: notifications
├── 🎛️ Admin Panel (admin-panel.html)
│   ├── Tab: Quản lý thông báo
│   ├── Form: Tạo thông báo mới
│   └── List: Danh sách & thống kê
├── 🖥️ Frontend UI (modules/notification-ui.js)
│   ├── Toggle button với badge counter
│   ├── Dropdown/modal hiển thị thông báo
│   └── Mark-as-read functionality
├── 🤖 Auto-notification (scripts/notification-integration.js)
│   ├── Hook vào auto-update system
│   ├── Detect phim mới/tập mới
│   └── Tự động tạo thông báo
└── 🔧 Core Module (modules/notifications.js)
    ├── Database schema
    ├── CRUD operations
    └── Business logic
```

---

## 🚀 **Cài đặt và Khởi động**

### **1. Cấu hình Firebase**

Firebase đã được cấu hình sẵn trong `firebase-config.js`. Hệ thống sẽ tự động:

- Tạo collection `notifications` khi cần
- Khởi tạo indexes cần thiết
- Hỗ trợ offline mode

### **2. Khởi động Admin Panel**

```bash
# Mở admin panel
open admin-panel.html

# Hoặc serve qua HTTP server
python -m http.server 8000
# Truy cập: http://localhost:8000/admin-panel.html
```

### **3. Tích hợp Frontend UI**

Frontend notification UI sẽ tự động khởi tạo khi trang load:

```javascript
// Auto-init trong modules/notification-ui.js
window.notificationUI.init(".header-actions");
```

### **4. Kích hoạt Auto-notification**

```bash
# Chạy auto-update với notification
node scripts/auto-update.js once

# Hoặc daemon mode
node scripts/auto-update.js start
```

---

## 🎛️ **Sử dụng Admin Panel**

### **Truy cập Admin Panel**

1. Mở `admin-panel.html` trong browser
2. Click tab "🔔 Thông báo"
3. Xem thống kê và quản lý thông báo

### **Tạo thông báo mới**

1. **Tiêu đề**: Nhập tiêu đề thông báo (tối đa 100 ký tự)
2. **Nội dung**: Mô tả chi tiết (tối đa 500 ký tự)
3. **Loại thông báo**:
   - 📢 Thông báo từ Admin
   - ⚙️ Thông báo hệ thống
   - 🔄 Cập nhật
4. **Độ ưu tiên**: Thấp/Bình thường/Cao
5. **Hết hạn**: Tùy chọn thời gian hết hạn

### **Quản lý thông báo**

- **Xem danh sách**: Tất cả thông báo với filter theo loại/trạng thái
- **Thống kê**: Tổng số, đang hoạt động, lên lịch, lượt đọc
- **Hành động**: Sửa, xóa, tạm dừng/kích hoạt

---

## 🖥️ **Frontend User Experience**

### **Notification Button**

- **Vị trí**: Header của trang chính
- **Badge**: Hiển thị số thông báo chưa đọc
- **Animation**: Pulse effect cho thông báo mới

### **Dropdown Interface**

- **Trigger**: Click vào notification button
- **Nội dung**: Danh sách thông báo mới nhất (20 items)
- **Actions**:
  - Đánh dấu từng thông báo đã đọc
  - Đánh dấu tất cả đã đọc
  - Auto-refresh mỗi 30 giây

### **Responsive Design**

- **Desktop**: Dropdown 350px width
- **Tablet**: Dropdown 300px width
- **Mobile**: Dropdown 280px width, position adjusted

---

## 🤖 **Auto-notification System**

### **Khi nào tạo thông báo tự động?**

1. **Phim mới**: Khi auto-update detect phim mới
2. **Tập mới**: Khi có tập mới của phim hiện có
3. **Cập nhật**: Khi thông tin phim được cập nhật

### **Quy trình hoạt động**

```
1. Auto-update chạy (mỗi 5 phút)
2. Detect changes (phim mới/tập mới/cập nhật)
3. NotificationIntegration.createMovieNotifications()
4. Tạo notification data
5. Lưu vào files (latest-notification.json, firebase-trigger.json)
6. Frontend đọc và push lên Firebase
7. Real-time update cho users
```

### **File outputs**

- `data/latest-notification.json`: Notification data cho frontend
- `data/firebase-notification-trigger.json`: Trigger file cho Firebase sync

---

## 📊 **Database Schema**

### **Collection: notifications**

```javascript
{
  id: "auto-generated",
  title: "🎬 Phim mới: Tên Phim",
  content: "Mô tả chi tiết thông báo...",
  type: "new_movie" | "admin_announcement" | "system" | "update",
  status: "active" | "inactive" | "scheduled",
  createdAt: Timestamp,
  scheduledAt: Timestamp | null,
  expiresAt: Timestamp | null,
  readBy: ["userId1", "userId2", ...],
  metadata: {
    priority: "low" | "normal" | "high",
    movieCount?: number,
    movies?: [{ slug, name, year, poster_url }],
    adminId?: string
  },
  stats: {
    totalReads: number,
    totalViews: number
  }
}
```

---

## 🔧 **API Methods**

### **Firebase Config Methods**

```javascript
// Tạo thông báo mới
await window.movieComments.createNotification({
  title: "Tiêu đề",
  content: "Nội dung",
  type: "admin_announcement",
  metadata: { priority: "high" },
});

// Lấy danh sách thông báo
const notifications = await window.movieComments.getNotifications({
  status: "active",
  limit: 20,
});

// Đánh dấu đã đọc
await window.movieComments.markNotificationAsRead(notificationId);

// Lấy số thông báo chưa đọc
const count = await window.movieComments.getUnreadNotificationCount();

// Xóa thông báo
await window.movieComments.deleteNotification(notificationId);

// Lắng nghe real-time
const unsubscribe = window.movieComments.listenToNotifications(
  (notifications) => {
    console.log("New notifications:", notifications);
  },
);
```

### **Frontend UI Methods**

```javascript
// Khởi tạo UI
await window.notificationUI.init(".header-actions");

// Mở/đóng dropdown
window.notificationUI.toggle();

// Đánh dấu đã đọc
await window.notificationUI.markAsRead(notificationId);

// Đánh dấu tất cả đã đọc
await window.notificationUI.markAllAsRead();

// Cleanup
window.notificationUI.destroy();
```

---

## 🧪 **Testing**

### **Test Admin Panel**

1. Mở `admin-panel.html`
2. Chuyển sang tab "🔔 Thông báo"
3. Tạo thông báo test
4. Verify thông báo xuất hiện trong danh sách
5. Test các actions: sửa, xóa, filter

### **Test Frontend UI**

1. Mở trang chính với notification UI
2. Verify notification button hiển thị
3. Click button → dropdown mở
4. Verify thông báo hiển thị đúng
5. Test mark-as-read functionality
6. Verify badge counter cập nhật

### **Test Auto-notification**

1. Chạy `node scripts/auto-update.js once`
2. Check console logs cho notification creation
3. Verify files được tạo:
   - `data/latest-notification.json`
   - `data/firebase-notification-trigger.json`
4. Refresh frontend → verify thông báo mới

### **Test Real-time Updates**

1. Mở 2 browser tabs
2. Tạo thông báo từ admin panel
3. Verify thông báo xuất hiện real-time ở tab kia
4. Mark-as-read ở 1 tab
5. Verify badge counter cập nhật ở tab khác

---

## 🐛 **Troubleshooting**

### **Notification không hiển thị**

- Check Firebase connection trong console
- Verify `firebase-config.js` đã load
- Check collection `notifications` tồn tại

### **Badge counter không cập nhật**

- Check `getUserId()` method hoạt động
- Verify `readBy` array được cập nhật đúng
- Check auto-refresh interval (30s)

### **Auto-notification không tạo**

- Check auto-update script chạy thành công
- Verify `NotificationIntegration` được import
- Check file permissions cho `data/` directory

### **Admin panel lỗi**

- Check Firebase authentication
- Verify admin panel có quyền write
- Check browser console cho errors

---

## 📈 **Performance & Optimization**

### **Caching Strategy**

- Frontend cache notifications 5 phút
- Badge counter cache 1 phút
- Auto-refresh mỗi 30 giây

### **Database Optimization**

- Composite indexes cho queries
- Limit queries (20-50 items)
- Pagination cho large datasets

### **Memory Management**

- Cleanup intervals khi component destroy
- Remove event listeners properly
- Clear caches periodically

---

## 🔮 **Future Enhancements**

### **Planned Features**

- [ ] Push notifications (Web Push API)
- [ ] Email notifications
- [ ] Notification categories/tags
- [ ] Advanced scheduling
- [ ] Notification templates
- [ ] Analytics dashboard
- [ ] User notification preferences
- [ ] Bulk operations

### **Technical Improvements**

- [ ] TypeScript migration
- [ ] Unit tests coverage
- [ ] E2E testing
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Accessibility improvements

---

## 📞 **Support**

Nếu gặp vấn đề với hệ thống notification:

1. Check console logs cho errors
2. Verify Firebase connection
3. Test với browser khác
4. Check file permissions
5. Review configuration files

**Files quan trọng:**

- `firebase-config.js` - Firebase setup
- `admin-panel.html` - Admin interface
- `modules/notification-ui.js` - Frontend UI
- `scripts/notification-integration.js` - Auto-notification
- `modules/notifications.js` - Core logic
