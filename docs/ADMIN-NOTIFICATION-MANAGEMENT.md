# 🔔 Hướng dẫn Quản lý Thông báo Admin

## 📋 Tổng quan

Hệ thống quản lý thông báo cho phép admin tạo, chỉnh sửa, xóa và lập lịch thông báo hiển thị trên website. Thông báo sẽ được hiển thị thông qua toggle button trên header của trang chính.

## 🚀 Cách truy cập

1. Mở **Admin Panel**: `admin-panel.html`
2. Chọn tab **"🔔 Quản lý thông báo"**

## ✨ Tính năng chính

### 1. Tạo thông báo mới

**Bước 1:** Nhấn nút **"➕ Tạo thông báo mới"**

**Bước 2:** Điền thông tin:
- **Tiêu đề*** (bắt buộc): Tiêu đề ngắn gọn, tối đa 100 ký tự
- **Nội dung*** (bắt buộc): Nội dung chi tiết, tối đa 500 ký tự
- **Loại thông báo**: 
  - 📢 Thông tin (info)
  - ✅ Thành công (success) 
  - ⚠️ Cảnh báo (warning)
  - ❌ Lỗi (error)
  - ⚙️ Hệ thống (system)
  - 🔄 Cập nhật (update)
  - 🎬 Phim mới (movie)
- **Độ ưu tiên**: Thấp, Bình thường, Cao, Khẩn cấp
- **Danh mục**: Chung, Hệ thống, Phim, Khuyến mãi

**Bước 3:** Tùy chọn nâng cao:
- ☑️ **Thông báo quan trọng**: Không tự động ẩn
- **Link hành động**: URL để chuyển hướng khi nhấn
- **Text nút hành động**: Text hiển thị trên nút (tối đa 20 ký tự)
- **Lập lịch hiển thị**: Đặt thời gian hiển thị trong tương lai
- **Thời gian hết hạn**: Thông báo tự động ẩn sau thời gian này

**Bước 4:** Nhấn **"💾 Lưu thông báo"**

### 2. Chỉnh sửa thông báo

1. Trong danh sách thông báo, nhấn **"✏️ Sửa"**
2. Cập nhật thông tin cần thiết
3. Nhấn **"💾 Lưu thông báo"**

### 3. Xóa thông báo

1. Trong danh sách thông báo, nhấn **"🗑️ Xóa"**
2. Xác nhận xóa trong popup

### 4. Bật/Tắt thông báo

- Sử dụng toggle switch bên cạnh mỗi thông báo
- **Bật**: Thông báo hiển thị trên website
- **Tắt**: Thông báo bị ẩn khỏi website

### 5. Lọc và tìm kiếm

- **Lọc theo loại**: Dropdown "Tất cả loại"
- **Lọc theo độ ưu tiên**: Dropdown "Tất cả độ ưu tiên"

### 6. Thống kê

Nhấn **"📊 Thống kê"** để xem:
- Tổng số thông báo
- Số thông báo chưa đọc
- Số thông báo đang hoạt động
- Số thông báo đã lập lịch
- Thống kê theo loại

### 7. Thông báo đã lập lịch

Nhấn **"⏰ Thông báo đã lập lịch"** để xem danh sách thông báo sẽ hiển thị trong tương lai.

## 🎯 Các loại thông báo phổ biến

### Thông báo phim mới
```
Tiêu đề: Phim mới: [Tên phim]
Nội dung: [Tên phim] đã được cập nhật với chất lượng HD. Xem ngay!
Loại: 🎬 Phim mới
Link hành động: #/phim/[slug-phim]
Text nút: Xem ngay
```

### Thông báo bảo trì
```
Tiêu đề: Thông báo bảo trì hệ thống
Nội dung: Website sẽ bảo trì từ [thời gian] đến [thời gian]. Vui lòng thông cảm!
Loại: ⚙️ Hệ thống
Độ ưu tiên: Cao
Thông báo quan trọng: ✅
```

### Thông báo cập nhật
```
Tiêu đề: Cập nhật phiên bản v[x.x.x]
Nội dung: Đã cải thiện hiệu suất và thêm tính năng mới. Khám phá ngay!
Loại: 🔄 Cập nhật
Link hành động: #/tin-tuc
Text nút: Xem chi tiết
```

## ⚠️ Lưu ý quan trọng

### Tương thích GitHub Pages
- Hệ thống sử dụng **localStorage** để lưu trữ
- Không cần backend server
- Hoạt động hoàn toàn trên client-side

### Hiệu suất
- Tối đa **100 thông báo** được lưu trữ
- Thông báo cũ tự động xóa sau **30 ngày**
- Sử dụng lazy loading cho danh sách dài

### Bảo mật
- Chỉ admin có quyền truy cập admin panel
- Dữ liệu được validate trước khi lưu
- Tự động escape HTML để tránh XSS

## 🔧 Troubleshooting

### Thông báo không hiển thị
1. Kiểm tra toggle switch đã bật chưa
2. Kiểm tra thời gian hết hạn
3. Xóa cache trình duyệt
4. Kiểm tra console để xem lỗi

### Lỗi lưu thông báo
1. Kiểm tra kết nối internet
2. Kiểm tra dung lượng localStorage
3. Thử refresh trang và làm lại

### Thông báo lập lịch không hoạt động
1. Kiểm tra thời gian hệ thống
2. Đảm bảo thời gian lập lịch > thời gian hiện tại
3. Kiểm tra tab có đang mở không

## 📱 Responsive Design

Giao diện tự động thích ứng với:
- **Desktop**: Hiển thị đầy đủ tính năng
- **Tablet**: Layout 2 cột
- **Mobile**: Layout 1 cột, menu thu gọn

## 🎨 Customization

### Thay đổi màu sắc
Chỉnh sửa CSS variables trong `admin-panel.html`:
```css
:root {
  --primary-color: #6c5ce7;
  --success-color: #2ecc71;
  --warning-color: #f39c12;
  --error-color: #e74c3c;
}
```

### Thêm loại thông báo mới
1. Cập nhật dropdown trong form
2. Thêm CSS class tương ứng
3. Cập nhật `getTypeEmoji()` function

---

**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: 2025-01-21  
**Tác giả**: Development Team
