# 🔧 GitHub Pages 404 Error Fix

## 🚨 **Vấn đề hiện tại:**

- Sau mỗi lần auto-update và push lên GitHub
- Domain `phimhv.site` bị lỗi 404 "There isn't a GitHub Pages site here"
- Một số user không thể truy cập website

## 🔍 **Nguyên nhân:**

### 1. **Conflict giữa Custom Domain và GitHub Pages URL**

- CNAME file: `phimhv.site`
- Repository name: `phimhv.github.io` hoặc `web-xem-anime`
- GitHub Pages URL không khớp với CNAME

### 2. **Auto-push script có thể ghi đè GitHub Pages settings**

- Mỗi lần push có thể reset GitHub Pages configuration
- Custom domain settings bị mất

### 3. **DNS Configuration Issues**

- DNS records có thể chưa được cấu hình đúng
- CNAME record chưa point đến đúng GitHub Pages URL

## 🛠️ **Giải pháp:**

### **Bước 1: Kiểm tra Repository Name**

Repository phải có tên:

- `RotTriThuc.github.io` (user pages) HOẶC
- `web-xem-anime` (project pages)

### **Bước 2: Cấu hình DNS (tại nhà cung cấp domain)**

```
Type: CNAME
Name: @
Value: rottriThuc.github.io
```

### **Bước 3: GitHub Pages Settings**

1. Vào GitHub Repository → Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Custom domain: `phimhv.site`
5. ✅ Enforce HTTPS

### **Bước 4: Sửa Auto-Update Script**

Thêm logic preserve GitHub Pages settings sau mỗi lần push.

### **Bước 5: Verify CNAME File**

File CNAME phải chứa chính xác: `phimhv.site`

## 🚀 **Immediate Fix:**

### **Option A: Sử dụng GitHub Pages URL (Recommended)**

Tạm thời disable custom domain và sử dụng:
`https://rottriThuc.github.io/web-xem-anime/`

### **Option B: Fix Custom Domain**

1. Xóa file CNAME
2. Push lên GitHub
3. Vào Settings → Pages → Nhập lại custom domain
4. Đợi DNS propagation (5-10 phút)

## 📋 **Checklist:**

- [ ] Repository name đúng format
- [ ] DNS CNAME record configured
- [ ] GitHub Pages settings correct
- [ ] CNAME file exists và đúng content
- [ ] Auto-update script không ghi đè settings
- [ ] SSL certificate active

## 🔄 **Testing:**

1. `nslookup phimhv.site` - Check DNS
2. `curl -I https://phimhv.site` - Check HTTP response
3. Browser test từ multiple locations
4. Check GitHub Actions deployment logs
