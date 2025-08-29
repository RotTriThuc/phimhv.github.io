# Hệ Thống Lọc Phim Kết Hợp - Documentation

## Tổng Quan
Hệ thống lọc phim đã được cải tiến để hỗ trợ lọc kết hợp theo nhiều tiêu chí cùng lúc: **Thể loại + Năm + Quốc gia**.

## Vấn Đề Đã Sửa
**Vấn đề gốc:** Khi chọn thể loại "Kinh dị" và năm "2025", hệ thống chỉ hiển thị 1 trang phim vì chỉ lọc theo thể loại mà không kết hợp với năm.

**Nguyên nhân:** 
- Function `renderCategory` chỉ gọi API với tham số `slug` và `page`
- Không truyền các tham số lọc bổ sung như `year`, `country`
- Logic phân trang không bảo toàn các tham số lọc khi chuyển trang

## Giải Pháp Đã Triển Khai

### 1. Cải Tiến API Functions
Các function `renderCategory`, `renderYear`, `renderCountry` đã được cập nhật để:
- Đọc tất cả tham số lọc từ URL params
- Truyền các tham số này vào API calls
- Hiển thị title động dựa trên các bộ lọc đang active

### 2. Function Lọc Kết Hợp Mới
Tạo `renderCombinedFilter()` để xử lý lọc phức tạp:
- Hỗ trợ lọc theo nhiều tiêu chí cùng lúc
- Chọn API endpoint phù hợp dựa trên bộ lọc
- Hiển thị thông tin chi tiết về kết quả lọc

### 3. Cải Tiến UI/UX
- Link thể loại, năm, quốc gia trong chi tiết phim giờ dẫn đến `/loc` với tham số tương ứng
- Thêm nút "Xóa bộ lọc" khi có filter active
- Hiển thị title động với tất cả bộ lọc đang áp dụng

## Cách Sử Dụng

### URL Patterns Mới
```
# Lọc đơn
/loc?category=kinh-di
/loc?year=2025
/loc?country=han-quoc

# Lọc kết hợp
/loc?category=kinh-di&year=2025
/loc?category=hanh-dong&year=2024&country=my
/loc?type_list=phim-bo&year=2023
```

### Các Tham Số Hỗ Trợ
- `category` hoặc `the_loai`: Slug thể loại
- `year` hoặc `nam`: Năm phát hành
- `country` hoặc `quoc_gia`: Slug quốc gia
- `type_list`: Loại phim (phim-bo, phim-le, hoat-hinh, tv-shows)
- `page`: Trang hiện tại

### Logic API Selection
1. **Lọc đơn:** Sử dụng API chuyên biệt (`listByCategory`, `listByYear`, `listByCountry`)
2. **Lọc kết hợp:** Sử dụng API search với các tham số filter
3. **Fallback:** API search với keyword rỗng cho các trường hợp phức tạp

## Cải Tiến Phân Trang
- Sử dụng `URLSearchParams` để bảo toàn tất cả tham số khi chuyển trang
- Hiển thị thông tin chi tiết: "Tìm thấy X phim - Trang Y/Z"
- Xử lý trường hợp không có kết quả với thông báo rõ ràng

## Test Cases

### Case 1: Lọc Thể Loại + Năm
```
URL: /loc?category=kinh-di&year=2025
Kết quả: Tất cả phim kinh dị năm 2025 với phân trang đúng
```

### Case 2: Lọc Ba Tiêu Chí
```
URL: /loc?category=hanh-dong&year=2024&country=my
Kết quả: Phim hành động Mỹ năm 2024
```

### Case 3: Chuyển Trang Với Filter
```
Từ: /loc?category=kinh-di&year=2025&page=1
Đến: /loc?category=kinh-di&year=2025&page=2
Kết quả: Bảo toàn bộ lọc, chỉ thay đổi trang
```

## Backward Compatibility
- Các URL cũ vẫn hoạt động bình thường
- `/the-loai/kinh-di` vẫn redirect đúng
- `/nam/2025` vẫn hiển thị phim năm 2025

## Performance Optimizations
- Sử dụng cache API thông minh
- Prefetch trang tiếp theo
- Lazy loading hình ảnh
- Memory monitoring và cleanup

## Files Modified
- `assets/app.js`: Core logic và API functions
- Router được cập nhật để sử dụng `renderCombinedFilter`
- Link generation trong movie details

## Future Enhancements
- Thêm filter UI dropdown trong header
- Lưu bộ lọc yêu thích
- Filter theo rating, thời lượng
- Advanced search với multiple selections
