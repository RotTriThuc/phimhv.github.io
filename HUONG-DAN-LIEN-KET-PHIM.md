# 🎬 Hướng Dẫn Tính Năng Liên Kết Giữa Các Phần Phim

## 📖 Tổng Quan

Tính năng **Series Navigator** cho phép người dùng dễ dàng chuyển đổi giữa các phần khác nhau của cùng một bộ phim (ví dụ: Phần 1, Phần 2, v.v.).

## ✨ Tính Năng Chính

### 1. **Tự Động Nhận Diện Các Phần Phim**
Hệ thống tự động nhận diện phim có nhiều phần dựa trên tên phim:
- ✅ `Huyền Thoại La Tiêu Hoắc (Phần 2)` ← Tự động nhận diện là Phần 2
- ✅ `Huyền Thoại La Tiêu Hoắc (Season 2)` ← Tự động nhận diện là Season 2
- ✅ `Huyền Thoại La Tiêu Hoắc - Phần 2` ← Cũng được nhận diện
- ✅ `The Legend Of Hei (Season 2)` ← Hỗ trợ tên tiếng Anh

### 2. **Hiển Thị Navigator Trên Trang Chi Tiết**
Khi xem chi tiết một phim có nhiều phần, sẽ có một khung hiển thị:

```
🎬 Các phần trong series                    [🔄]
─────────────────────────────────────────────────
Huyền Thoại La Tiêu Hoắc

┌────────────┐  ┌────────────┐  ┌────────────┐
│  Phần 1    │  │  Phần 2    │  │  Phần 3    │
│  Tập 15/15 │  │  Tập 8/8   │  │  Sắp ra    │
│  2019      │  │  2025      │  │  2026      │
│            │  │● Đang xem  │  │            │
└────────────┘  └────────────┘  └────────────┘
```

### 3. **Navigator Nhỏ Gọn Khi Đang Xem Phim**
Khi đang xem phim, có navigator nhỏ gọn ở phía trên:
```
Các phần khác:  [Phần 1]  [Phần 3]  [Phần 4]
```

### 4. **Nút Làm Mới**
- Nhấn nút 🔄 để kiểm tra xem có phần mới không
- Hệ thống sẽ tự động cập nhật danh sách

## 🎯 Cách Sử Dụng

### Đối Với Người Dùng:

1. **Xem trang chi tiết phim**
   - Truy cập bất kỳ phim nào có nhiều phần (ví dụ: Huyền Thoại La Tiêu Hoắc)
   - Cuộn xuống dưới thông tin phim
   - Sẽ thấy khung "🎬 Các phần trong series"

2. **Chuyển đổi giữa các phần**
   - Click vào bất kỳ phần nào trong navigator
   - Trang sẽ chuyển sang trang chi tiết của phần đó
   - Navigator sẽ tự động cập nhật

3. **Kiểm tra phần mới**
   - Click nút 🔄 ở góc phải
   - Hệ thống sẽ tìm kiếm phần mới
   - Nếu có phần mới, navigator sẽ cập nhật và hiển thị thông báo

### Đối Với Quản Trị:

1. **Thêm phim mới vào series**
   - Đặt tên phim theo format: `Tên Series (Phần X)` hoặc `Tên Series (Season X)`
   - Ví dụ: `Huyền Thoại La Tiêu Hoắc (Phần 3)`
   - Hệ thống sẽ tự động liên kết với các phần khác

2. **Format tên phim được hỗ trợ**
   ```
   ✅ Tên Phim (Phần 2)
   ✅ Tên Phim (Season 2)
   ✅ Tên Phim - Phần 2
   ✅ Tên Phim - Season 2
   ✅ Movie Name (Season 2)
   ```

## 🔧 Kỹ Thuật Chi Tiết

### Cấu trúc thư mục:
```
phimhv.github.io-main/
├── modules/
│   ├── series-navigator.js      # Logic chính
│   └── series-update-manager.js # Quản lý cập nhật
├── assets/
│   └── series-navigator.css     # Styles cho UI
└── assets/app.js               # Tích hợp vào app chính
```

### Các function chính:

1. **`getSeriesBaseInfo(movie)`**
   - Phân tích tên phim để extract thông tin series
   - Trả về: `{ seriesId, season, baseName }`

2. **`findRelatedSeasons(movie, api, extractItems)`**
   - Tìm kiếm các phần liên quan
   - Sử dụng API search với tên series
   - Lọc và sắp xếp theo số phần

3. **`createSeriesNavigator(movie, relatedSeasons, createEl)`**
   - Tạo UI navigator
   - Hiển thị tất cả các phần
   - Highlight phần đang xem

4. **`getCachedRelatedSeasons(movie, api, extractItems, forceRefresh)`**
   - Lấy danh sách phần với caching (5 phút)
   - Tích hợp auto-update tracking

## 📊 Ví Dụ Thực Tế

### Ví dụ: Huyền Thoại La Tiêu Hoắc

**Phần 1:**
- Tên: `Huyền Thoại La Tiêu Hoắc`
- Tên gốc: `The Legend Of Hei`
- Slug: `huyen-thoai-la-tieu-hoac`
- Năm: 2019
- Tập: Full

**Phần 2:**
- Tên: `Huyền Thoại La Tiêu Hoắc 2 (La Tiêu Hắc...)`
- Tên gốc: `The Legend Of Hei (Season 2)`
- Slug: `huyen-thoai-la-tieu-hoac-2`
- Năm: 2025
- Tập: 15/15 (đang cập nhật)

Khi xem bất kỳ phần nào, navigator sẽ hiển thị cả 2 phần và cho phép chuyển đổi dễ dàng.

## 🎨 Tùy Chỉnh Giao Diện

### Màu sắc:
```css
/* Trong series-navigator.css */
.series-navigator {
  --primary: #6c5ce7;        /* Màu chính */
  --background: #636e72;     /* Màu nền item */
  --surface: #2d3436;        /* Màu nền container */
}
```

### Responsive:
- Desktop: Grid 3-4 cột
- Tablet: Grid 2-3 cột
- Mobile: Grid 1-2 cột

## 🔍 Troubleshooting

### Vấn đề: Navigator không hiển thị
**Giải pháp:**
1. Kiểm tra tên phim có đúng format không
2. Kiểm tra file CSS đã được load chưa
3. Mở Console để xem log debug

### Vấn đề: Không tìm thấy phần khác
**Giải pháp:**
1. Kiểm tra tên series có giống nhau không
2. Thử search thủ công với tên series
3. Kiểm tra API có trả về kết quả không

### Vấn đề: Hiển thị sai số phần
**Giải pháp:**
1. Kiểm tra format tên: phải có "Phần X" hoặc "Season X"
2. Số phần phải là số nguyên dương
3. Xem log trong Console để debug

## 📝 API Reference

### `getSeriesBaseInfo(movie)`
```javascript
// Input
const movie = {
  name: "Huyền Thoại La Tiêu Hoắc (Phần 2)",
  slug: "huyen-thoai-la-tieu-hoac-2"
};

// Output
{
  seriesId: "Huyền Thoại La Tiêu Hoắc_SERIES",
  season: 2,
  baseName: "Huyền Thoại La Tiêu Hoắc",
  method: "manual_pattern_1"
}
```

### `findRelatedSeasons(currentMovie, api, extractItems)`
```javascript
// Returns array of related movies
[
  {
    name: "Huyền Thoại La Tiêu Hoắc",
    seriesInfo: { season: 1, ... }
  },
  {
    name: "Huyền Thoại La Tiêu Hoắc (Phần 2)",
    seriesInfo: { season: 2, ... }
  }
]
```

## 🚀 Performance

### Caching:
- Cache duration: 5 phút
- Sử dụng Map để lưu cache
- Auto-invalidate khi có update

### Tối ưu:
- Lazy load series navigator
- Only fetch when needed
- Debounce refresh button

## 📖 Tài Liệu Thêm

- [SERIES-NAVIGATOR-DOCS.md](./SERIES-NAVIGATOR-DOCS.md) - Documentation chi tiết
- [AUTO-UPDATE-SYSTEM-DOCS.md](./AUTO-UPDATE-SYSTEM-DOCS.md) - Hệ thống auto-update

## 🤝 Đóng Góp

Nếu phát hiện bug hoặc có ý tưởng cải thiện, vui lòng:
1. Mở Issue trên GitHub
2. Mô tả chi tiết vấn đề
3. Đính kèm screenshot nếu có

---

Made with ❤️ by H.Vũ Team
