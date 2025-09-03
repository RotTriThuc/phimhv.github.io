# 📊 Hướng Dẫn Thiết Lập Google Search Console & Analytics

## 🎯 Tổng Quan
Google Search Console và Google Analytics là 2 công cụ quan trọng nhất để:
- **Monitoring SEO performance**: Theo dõi ranking, clicks, impressions
- **Tracking user behavior**: Phân tích hành vi người dùng
- **Identifying issues**: Phát hiện lỗi crawling, indexing
- **Optimizing content**: Tối ưu hóa dựa trên data thực tế

## 🔧 Bước 1: Thiết Lập Google Search Console

### 1.1 Tạo Property
1. Truy cập: https://search.google.com/search-console
2. Click **"Add Property"**
3. Chọn **"URL prefix"**
4. Nhập: `https://phimhv.site`
5. Click **"Continue"**

### 1.2 Verify Ownership (Chọn 1 trong các cách)

#### **Cách 1: HTML Tag (Khuyến nghị)**
```html
<!-- Thêm vào <head> của index.html -->
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE">
```

#### **Cách 2: HTML File Upload**
```html
<!-- Tải file google[code].html và upload lên root directory -->
<!-- File sẽ có URL: https://phimhv.site/google[code].html -->
```

#### **Cách 3: DNS Record (Cho domain owner)**
```
TXT record: google-site-verification=YOUR_VERIFICATION_CODE
```

### 1.3 Submit Sitemap
1. Vào **Sitemaps** trong Search Console
2. Nhập: `sitemap.xml`
3. Click **"Submit"**
4. Kiểm tra status: **"Success"**

### 1.4 Cấu Hình URL Parameters
1. Vào **URL Parameters** (Legacy tools)
2. Thêm parameters không quan trọng:
   - `utm_source` → No URLs
   - `utm_medium` → No URLs  
   - `utm_campaign` → No URLs
   - `fbclid` → No URLs

## 🔧 Bước 2: Thiết Lập Google Analytics 4

### 2.1 Tạo GA4 Property
1. Truy cập: https://analytics.google.com
2. Click **"Create Account"**
3. **Account Name**: PhimHV Analytics
4. **Property Name**: PhimHV Website
5. **Industry**: Entertainment
6. **Business Size**: Small
7. **Country**: Vietnam

### 2.2 Cài Đặt Tracking Code
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    // Enhanced measurement
    enhanced_measurement: true,
    // Page view tracking for SPA
    send_page_view: false
  });
</script>
```

### 2.3 Cấu Hình Enhanced Measurement
Bật các tính năng:
- ✅ **Page views**
- ✅ **Scrolls** (90% scroll depth)
- ✅ **Outbound clicks**
- ✅ **Site search** (parameter: keyword)
- ✅ **Video engagement**
- ✅ **File downloads**

### 2.4 Custom Events cho Anime Website
```javascript
// Track anime view
gtag('event', 'anime_view', {
  anime_name: 'One Piece',
  anime_category: 'Action',
  anime_year: '1999'
});

// Track episode watch
gtag('event', 'episode_watch', {
  anime_name: 'One Piece',
  episode_number: '1000',
  watch_duration: 1200 // seconds
});

// Track search
gtag('event', 'search', {
  search_term: 'naruto'
});

// Track category browse
gtag('event', 'category_browse', {
  category_name: 'Action'
});
```

## 🔧 Bước 3: Liên Kết Search Console với Analytics

### 3.1 Trong Google Analytics
1. Vào **Admin** → **Property Settings**
2. Click **"Search Console Links"**
3. Click **"Link"**
4. Chọn Search Console property
5. Chọn data stream
6. Click **"Submit"**

### 3.2 Trong Search Console
1. Vào **Settings** → **Associations**
2. Click **"Associate"**
3. Chọn Analytics property
4. Confirm association

## 📊 Bước 4: Cấu Hình Goals & Conversions

### 4.1 Key Events (GA4)
```javascript
// Anime completion (watched full episode)
gtag('event', 'anime_complete', {
  value: 1,
  currency: 'USD',
  anime_name: 'One Piece',
  episode_number: '1000'
});

// User engagement (time on site > 3 minutes)
gtag('event', 'engaged_session', {
  engagement_time_msec: 180000
});

// Newsletter signup
gtag('event', 'newsletter_signup', {
  method: 'email'
});
```

### 4.2 Custom Dimensions
| Dimension | Scope | Description |
|-----------|-------|-------------|
| anime_category | Event | Thể loại anime |
| user_type | User | New/Returning user |
| device_type | Session | Mobile/Desktop |
| anime_year | Event | Năm phát hành |

### 4.3 Custom Metrics
| Metric | Description |
|--------|-------------|
| anime_rating | Đánh giá anime (1-10) |
| watch_completion | % hoàn thành episode |
| search_success | Tỷ lệ tìm kiếm thành công |

## 🔧 Bước 5: Thiết Lập Monitoring & Alerts

### 5.1 Search Console Alerts
1. **Coverage Issues**: Lỗi crawling/indexing
2. **Core Web Vitals**: Performance issues
3. **Security Issues**: Malware/hacking
4. **Manual Actions**: Google penalties

### 5.2 Analytics Alerts
```javascript
// Custom alert conditions
{
  "traffic_drop": "Sessions decreased by 20% week-over-week",
  "bounce_rate_spike": "Bounce rate increased above 70%",
  "conversion_drop": "Goal completions decreased by 30%",
  "page_speed": "Page load time increased above 3 seconds"
}
```

### 5.3 Weekly Reports
- **SEO Performance**: Rankings, clicks, impressions
- **User Behavior**: Sessions, bounce rate, time on site
- **Content Performance**: Top pages, search queries
- **Technical Issues**: Crawl errors, mobile usability

## 📈 Bước 6: Key Metrics để Theo Dõi

### 6.1 SEO Metrics (Search Console)
| Metric | Target | Description |
|--------|--------|-------------|
| Total Clicks | +20% MoM | Clicks từ Google |
| Total Impressions | +30% MoM | Hiển thị trên SERP |
| Average CTR | >3% | Click-through rate |
| Average Position | <10 | Vị trí trung bình |
| Coverage | 100% | Trang được index |

### 6.2 User Metrics (Analytics)
| Metric | Target | Description |
|--------|--------|-------------|
| Sessions | +25% MoM | Phiên truy cập |
| Users | +20% MoM | Người dùng unique |
| Bounce Rate | <60% | Tỷ lệ thoát |
| Session Duration | >3 min | Thời gian trên site |
| Pages/Session | >3 | Trang xem/phiên |

### 6.3 Content Metrics
| Metric | Target | Description |
|--------|--------|-------------|
| Anime Views | +30% MoM | Lượt xem anime |
| Episode Completion | >70% | Hoàn thành episode |
| Search Success Rate | >80% | Tìm kiếm thành công |
| Category Engagement | Balanced | Tương tác thể loại |

## 🔧 Bước 7: Advanced Tracking Setup

### 7.1 Enhanced E-commerce (nếu có premium features)
```javascript
// Purchase event (premium subscription)
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  value: 9.99,
  currency: 'USD',
  items: [{
    item_id: 'premium_monthly',
    item_name: 'Premium Subscription',
    category: 'Subscription',
    quantity: 1,
    price: 9.99
  }]
});
```

### 7.2 User ID Tracking
```javascript
// Set user ID for cross-device tracking
gtag('config', 'GA_MEASUREMENT_ID', {
  user_id: 'USER_ID_FROM_DATABASE'
});
```

### 7.3 Custom Audiences
- **Anime Fans**: Users who watched >5 anime
- **Active Users**: Users with >10 sessions
- **Mobile Users**: Primary mobile traffic
- **Returning Visitors**: Users with >3 visits

## 📊 Bước 8: Reporting & Dashboard

### 8.1 Custom Dashboard Widgets
1. **SEO Overview**: Clicks, impressions, CTR, position
2. **Traffic Sources**: Organic, direct, referral, social
3. **Top Content**: Most viewed anime, categories
4. **User Flow**: Navigation patterns
5. **Real-time**: Current active users

### 8.2 Automated Reports
```javascript
// Weekly SEO report email
{
  "frequency": "weekly",
  "recipients": ["admin@phimhv.site"],
  "metrics": [
    "organic_traffic",
    "keyword_rankings", 
    "crawl_errors",
    "core_web_vitals"
  ]
}
```

### 8.3 Data Studio Integration
1. Connect Search Console data
2. Connect Analytics data  
3. Create comprehensive SEO dashboard
4. Share with stakeholders

## 🔧 Bước 9: Troubleshooting Common Issues

### 9.1 Search Console Issues
| Issue | Solution |
|-------|----------|
| Sitemap not found | Check sitemap.xml accessibility |
| Coverage errors | Fix broken internal links |
| Mobile usability | Improve responsive design |
| Core Web Vitals | Optimize page speed |

### 9.2 Analytics Issues
| Issue | Solution |
|-------|----------|
| No data showing | Check tracking code installation |
| Duplicate pageviews | Implement SPA tracking correctly |
| High bounce rate | Improve page loading speed |
| Low session duration | Enhance content quality |

## 🎯 Bước 10: Optimization Based on Data

### 10.1 SEO Optimizations
- **Low CTR pages**: Improve title/description
- **High impression, low clicks**: Optimize snippets
- **Declining rankings**: Update content, build links
- **Crawl errors**: Fix technical issues

### 10.2 Content Optimizations
- **High bounce rate**: Improve content relevance
- **Low engagement**: Add interactive elements
- **Poor conversion**: Optimize call-to-actions
- **Mobile issues**: Enhance mobile experience

## ✅ Checklist Hoàn Thành

### Search Console Setup
- [ ] Property created and verified
- [ ] Sitemap submitted successfully
- [ ] URL parameters configured
- [ ] Mobile usability checked
- [ ] Core Web Vitals monitored

### Analytics Setup  
- [ ] GA4 property created
- [ ] Tracking code installed
- [ ] Enhanced measurement enabled
- [ ] Custom events configured
- [ ] Goals and conversions set up

### Integration & Monitoring
- [ ] Search Console linked to Analytics
- [ ] Custom dimensions created
- [ ] Alerts configured
- [ ] Dashboard created
- [ ] Regular reporting scheduled

## 🚀 Expected Results

Sau 2-4 tuần thiết lập:
- **Data Collection**: Đầy đủ dữ liệu SEO và user behavior
- **Issue Identification**: Phát hiện vấn đề technical SEO
- **Performance Baseline**: Thiết lập baseline metrics
- **Optimization Opportunities**: Xác định cơ hội cải thiện

Sau 2-3 tháng:
- **Ranking Improvements**: Cải thiện 10-20 vị trí cho key terms
- **Traffic Growth**: Tăng 25-50% organic traffic
- **User Engagement**: Cải thiện bounce rate và session duration
- **Conversion Optimization**: Tăng conversion rate 15-30%
