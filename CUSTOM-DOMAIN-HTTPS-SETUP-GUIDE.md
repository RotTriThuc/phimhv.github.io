# 🌐 Hướng Dẫn Cấu Hình Custom Domain và HTTPS cho Website Anime

## 📋 Tổng Quan
Việc sử dụng custom domain và HTTPS mang lại nhiều lợi ích SEO quan trọng:
- **Tăng uy tín**: Google ưu tiên các website có HTTPS
- **Cải thiện ranking**: HTTPS là ranking factor của Google
- **Tăng trust score**: Người dùng tin tưởng hơn với domain riêng
- **Branding tốt hơn**: Domain dễ nhớ, chuyên nghiệp

## 🎯 Hiện Tại Website Của Bạn
- **Domain hiện tại**: `phimhv.site` (đã có CNAME file)
- **Platform**: GitHub Pages
- **Status**: Đã cấu hình cơ bản

## 🔧 Bước 1: Kiểm Tra Cấu Hình DNS Hiện Tại

### Kiểm tra DNS Records cần thiết:
```bash
# Kiểm tra A records
nslookup phimhv.site

# Kiểm tra CNAME cho www
nslookup www.phimhv.site
```

### DNS Records chuẩn cho GitHub Pages:
```
# A Records (apex domain)
@ → 185.199.108.153
@ → 185.199.109.153  
@ → 185.199.110.153
@ → 185.199.111.153

# CNAME Record (subdomain)
www → username.github.io
```

## 🔧 Bước 2: Cấu Hình GitHub Pages

### 2.1 Trong Repository Settings:
1. Vào **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main / master
4. **Custom domain**: `phimhv.site`
5. ✅ **Enforce HTTPS**: Bật tùy chọn này

### 2.2 Kiểm tra CNAME file:
```
# File CNAME trong root directory
phimhv.site
```

## 🔧 Bước 3: Tối Ưu Hóa HTTPS cho SEO

### 3.1 Redirect HTTP → HTTPS
Thêm vào `index.html` hoặc JavaScript:
```javascript
// Force HTTPS redirect
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}
```

### 3.2 HSTS Headers (nếu có server control)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 3.3 Cập nhật tất cả internal links
```html
<!-- Thay vì -->
<a href="http://phimhv.site/page">

<!-- Sử dụng -->
<a href="https://phimhv.site/page">
<!-- Hoặc relative links -->
<a href="/page">
```

## 🔧 Bước 4: Cấu Hình SEO Meta Tags cho Custom Domain

### 4.1 Cập nhật Canonical URLs:
```html
<link rel="canonical" href="https://phimhv.site/">
```

### 4.2 Cập nhật Open Graph URLs:
```html
<meta property="og:url" content="https://phimhv.site/">
```

### 4.3 Cập nhật Structured Data:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://phimhv.site",
  "name": "PhimHV - Xem Anime Online"
}
```

## 🔧 Bước 5: Tối Ưu Hóa Performance với Custom Domain

### 5.1 DNS Prefetch:
```html
<link rel="dns-prefetch" href="//phimhv.site">
<link rel="preconnect" href="https://phimhv.site" crossorigin>
```

### 5.2 Preload Critical Resources:
```html
<link rel="preload" href="https://phimhv.site/assets/styles.css" as="style">
<link rel="preload" href="https://phimhv.site/assets/app.js" as="script">
```

## 🔧 Bước 6: Monitoring và Verification

### 6.1 Google Search Console:
1. Thêm property cho `https://phimhv.site`
2. Verify ownership qua HTML tag hoặc DNS
3. Submit sitemap: `https://phimhv.site/sitemap.xml`

### 6.2 SSL Certificate Check:
```bash
# Kiểm tra SSL certificate
openssl s_client -connect phimhv.site:443 -servername phimhv.site
```

### 6.3 Tools kiểm tra:
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **PageSpeed Insights**: https://pagespeed.web.dev/

## 🚀 Bước 7: Advanced SEO Optimizations

### 7.1 Security Headers:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
```

### 7.2 Robots.txt cho Custom Domain:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://phimhv.site/sitemap.xml
```

### 7.3 Favicon cho Custom Domain:
```html
<link rel="icon" type="image/x-icon" href="https://phimhv.site/favicon.ico">
<link rel="apple-touch-icon" href="https://phimhv.site/apple-touch-icon.png">
```

## ✅ Checklist Hoàn Thành

- [ ] DNS A records đã cấu hình đúng
- [ ] CNAME record cho www đã setup
- [ ] GitHub Pages custom domain đã enable
- [ ] HTTPS enforcement đã bật
- [ ] SSL certificate đã active
- [ ] Canonical URLs đã cập nhật
- [ ] Open Graph URLs đã cập nhật  
- [ ] Structured data đã cập nhật
- [ ] Google Search Console đã verify
- [ ] Sitemap đã submit
- [ ] Security headers đã thêm
- [ ] Performance optimization đã áp dụng

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành:
- **SEO Score**: Tăng 15-25 điểm
- **Trust Score**: Tăng đáng kể với HTTPS
- **Loading Speed**: Cải thiện với DNS optimization
- **Google Ranking**: Có thể tăng 5-10 vị trí
- **User Trust**: Tăng conversion rate 10-15%

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **DNS propagation**: Đợi 24-48h
2. **SSL not working**: Kiểm tra GitHub Pages settings
3. **Mixed content**: Đảm bảo tất cả resources dùng HTTPS
4. **404 errors**: Kiểm tra CNAME file và DNS

### Debug commands:
```bash
# Kiểm tra DNS
dig phimhv.site
dig www.phimhv.site

# Kiểm tra SSL
curl -I https://phimhv.site

# Test HTTPS redirect
curl -I http://phimhv.site
```
