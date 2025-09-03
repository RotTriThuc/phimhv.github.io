/* SEO Optimizer - Advanced SEO optimization and meta management */

import { Logger } from './logger.js';

// SEO configuration
const SEO_CONFIG = {
  siteName: 'XemPhim - Xem Phim Online Chất Lượng Cao',
  siteDescription:
    'Xem phim online miễn phí chất lượng cao. Phim mới nhất, phim hay nhất được cập nhật liên tục.',
  siteUrl: 'https://xemphim.com',
  defaultImage: 'https://xemphim.com/images/og-image.jpg',
  twitterHandle: '@xemphim',
  facebookAppId: '123456789',

  // Structured data templates
  structuredData: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'XemPhim',
      url: 'https://xemphim.com',
      logo: 'https://xemphim.com/images/logo.png',
      sameAs: ['https://facebook.com/xemphim', 'https://twitter.com/xemphim']
    },

    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'XemPhim',
      url: 'https://xemphim.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://xemphim.com/tim-kiem?keyword={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  }
};

// SEO Optimizer class
export class SEOOptimizer {
  constructor() {
    this.currentMeta = new Map();
    this.structuredDataElements = new Set();
    this.breadcrumbs = [];

    this.init();
  }

  init() {
    // Initialize base SEO elements
    this.setupBaseSEO();
    this.setupStructuredData();
    this.setupSitemap();

    Logger.debug('🔍 SEO Optimizer initialized');
  }

  // Base SEO setup
  setupBaseSEO() {
    // Viewport meta tag
    this.setMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Charset
    this.setMetaTag('charset', 'UTF-8');

    // Base meta tags
    this.setMetaTag('description', SEO_CONFIG.siteDescription);
    this.setMetaTag('keywords', 'xem phim, phim online, phim hay, phim mới');
    this.setMetaTag('author', 'XemPhim Team');
    this.setMetaTag('robots', 'index, follow');

    // Open Graph base tags
    this.setMetaTag('og:site_name', SEO_CONFIG.siteName);
    this.setMetaTag('og:type', 'website');
    this.setMetaTag('og:locale', 'vi_VN');

    // Twitter Card base tags
    this.setMetaTag('twitter:card', 'summary_large_image');
    this.setMetaTag('twitter:site', SEO_CONFIG.twitterHandle);

    // Facebook App ID
    this.setMetaTag('fb:app_id', SEO_CONFIG.facebookAppId);

    // Canonical URL
    this.setCanonicalUrl(window.location.href);
  }

  // Dynamic meta tag management
  setMetaTag(name, content) {
    if (!content) return;

    // Remove existing tag
    this.removeMetaTag(name);

    // Create new tag
    const meta = document.createElement('meta');

    if (name === 'charset') {
      meta.setAttribute('charset', content);
    } else if (
      name.startsWith('og:') ||
      name.startsWith('twitter:') ||
      name.startsWith('fb:')
    ) {
      meta.setAttribute('property', name);
      meta.setAttribute('content', content);
    } else {
      meta.setAttribute('name', name);
      meta.setAttribute('content', content);
    }

    document.head.appendChild(meta);
    this.currentMeta.set(name, meta);
  }

  removeMetaTag(name) {
    if (this.currentMeta.has(name)) {
      const existingTag = this.currentMeta.get(name);
      if (existingTag.parentNode) {
        existingTag.parentNode.removeChild(existingTag);
      }
      this.currentMeta.delete(name);
    }
  }

  setCanonicalUrl(url) {
    // Remove existing canonical
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) {
      existing.remove();
    }

    // Add new canonical
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    document.head.appendChild(canonical);
  }

  // Page-specific SEO optimization
  optimizeHomePage() {
    this.setTitle('XemPhim - Xem Phim Online Chất Lượng Cao Miễn Phí');
    this.setMetaTag(
      'description',
      'Xem phim online miễn phí chất lượng cao. Phim mới nhất, phim hay nhất được cập nhật liên tục. Hàng ngàn bộ phim HD, Full HD.'
    );
    this.setMetaTag(
      'keywords',
      'xem phim online, phim hay, phim mới, phim HD, phim miễn phí'
    );

    // Open Graph
    this.setMetaTag('og:title', 'XemPhim - Xem Phim Online Chất Lượng Cao');
    this.setMetaTag(
      'og:description',
      'Xem phim online miễn phí chất lượng cao. Phim mới nhất, phim hay nhất được cập nhật liên tục.'
    );
    this.setMetaTag('og:url', SEO_CONFIG.siteUrl);
    this.setMetaTag('og:image', SEO_CONFIG.defaultImage);

    // Twitter Card
    this.setMetaTag(
      'twitter:title',
      'XemPhim - Xem Phim Online Chất Lượng Cao'
    );
    this.setMetaTag(
      'twitter:description',
      'Xem phim online miễn phí chất lượng cao. Phim mới nhất, phim hay nhất được cập nhật liên tục.'
    );
    this.setMetaTag('twitter:image', SEO_CONFIG.defaultImage);

    // Structured data
    this.addStructuredData('website', SEO_CONFIG.structuredData.website);
    this.addStructuredData(
      'organization',
      SEO_CONFIG.structuredData.organization
    );

    // Breadcrumbs
    this.setBreadcrumbs([{ name: 'Trang chủ', url: '/' }]);
  }

  optimizeMovieDetailPage(movie) {
    const title = `${movie.name} (${movie.year || 'N/A'}) - Xem Phim Online | XemPhim`;
    const description = `Xem phim ${movie.name} ${movie.year ? `(${movie.year})` : ''} online chất lượng cao. ${movie.content ? movie.content.substring(0, 150) + '...' : 'Phim hay không thể bỏ qua.'}`;

    this.setTitle(title);
    this.setMetaTag('description', description);
    this.setMetaTag(
      'keywords',
      `${movie.name}, xem phim ${movie.name}, ${movie.name} online, phim ${movie.year || ''}`
    );

    // Open Graph
    this.setMetaTag('og:title', title);
    this.setMetaTag('og:description', description);
    this.setMetaTag('og:url', `${SEO_CONFIG.siteUrl}/phim/${movie.slug}`);
    this.setMetaTag(
      'og:image',
      movie.poster_url || movie.thumb_url || SEO_CONFIG.defaultImage
    );
    this.setMetaTag('og:type', 'video.movie');

    // Twitter Card
    this.setMetaTag('twitter:title', title);
    this.setMetaTag('twitter:description', description);
    this.setMetaTag(
      'twitter:image',
      movie.poster_url || movie.thumb_url || SEO_CONFIG.defaultImage
    );

    // Movie structured data
    const movieStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: movie.name,
      alternateName: movie.origin_name,
      description: movie.content,
      image: movie.poster_url || movie.thumb_url,
      datePublished: movie.year ? `${movie.year}-01-01` : undefined,
      genre: movie.category?.map((cat) => cat.name) || [],
      actor:
        movie.actor?.map((actor) => ({
          '@type': 'Person',
          name: actor
        })) || [],
      director:
        movie.director?.map((director) => ({
          '@type': 'Person',
          name: director
        })) || [],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '8.5',
        ratingCount: '1000'
      }
    };

    this.addStructuredData('movie', movieStructuredData);

    // Breadcrumbs
    this.setBreadcrumbs([
      { name: 'Trang chủ', url: '/' },
      { name: 'Phim', url: '/phim' },
      { name: movie.name, url: `/phim/${movie.slug}` }
    ]);
  }

  optimizeSearchPage(keyword, results) {
    const title = `Tìm kiếm: "${keyword}" - XemPhim`;
    const description = `Kết quả tìm kiếm cho "${keyword}". Tìm thấy ${results?.length || 0} phim phù hợp với từ khóa của bạn.`;

    this.setTitle(title);
    this.setMetaTag('description', description);
    this.setMetaTag(
      'keywords',
      `tìm kiếm ${keyword}, phim ${keyword}, ${keyword} online`
    );

    // Open Graph
    this.setMetaTag('og:title', title);
    this.setMetaTag('og:description', description);
    this.setMetaTag(
      'og:url',
      `${SEO_CONFIG.siteUrl}/tim-kiem?keyword=${encodeURIComponent(keyword)}`
    );

    // Breadcrumbs
    this.setBreadcrumbs([
      { name: 'Trang chủ', url: '/' },
      { name: 'Tìm kiếm', url: '/tim-kiem' },
      {
        name: `"${keyword}"`,
        url: `/tim-kiem?keyword=${encodeURIComponent(keyword)}`
      }
    ]);
  }

  optimizeCategoryPage(category, movies) {
    const title = `Phim ${category} - Xem Phim ${category} Online | XemPhim`;
    const description = `Xem phim ${category} online chất lượng cao. Tuyển tập những bộ phim ${category} hay nhất, mới nhất được cập nhật liên tục.`;

    this.setTitle(title);
    this.setMetaTag('description', description);
    this.setMetaTag(
      'keywords',
      `phim ${category}, xem phim ${category}, ${category} online, phim ${category} hay`
    );

    // Open Graph
    this.setMetaTag('og:title', title);
    this.setMetaTag('og:description', description);
    this.setMetaTag('og:url', `${SEO_CONFIG.siteUrl}/the-loai/${category}`);

    // Breadcrumbs
    this.setBreadcrumbs([
      { name: 'Trang chủ', url: '/' },
      { name: 'Thể loại', url: '/the-loai' },
      { name: category, url: `/the-loai/${category}` }
    ]);
  }

  // Structured data management
  addStructuredData(type, data) {
    // Remove existing structured data of same type
    this.removeStructuredData(type);

    // Create new structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    script.dataset.seoType = type;

    document.head.appendChild(script);
    this.structuredDataElements.add(script);
  }

  removeStructuredData(type) {
    const existing = document.querySelector(`script[data-seo-type="${type}"]`);
    if (existing) {
      existing.remove();
      this.structuredDataElements.delete(existing);
    }
  }

  // Breadcrumbs management
  setBreadcrumbs(breadcrumbs) {
    this.breadcrumbs = breadcrumbs;

    // Create breadcrumb structured data
    const breadcrumbStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${SEO_CONFIG.siteUrl}${crumb.url}`
      }))
    };

    this.addStructuredData('breadcrumb', breadcrumbStructuredData);
  }

  // Title management
  setTitle(title) {
    document.title = title;
    this.setMetaTag('og:title', title);
    this.setMetaTag('twitter:title', title);
  }

  // Sitemap generation
  setupSitemap() {
    // This would generate sitemap.xml dynamically
    // For now, we'll create a basic sitemap structure
    const sitemapUrls = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/tim-kiem', priority: '0.8', changefreq: 'weekly' },
      { url: '/the-loai', priority: '0.8', changefreq: 'weekly' },
      { url: '/phim-da-luu', priority: '0.6', changefreq: 'monthly' }
    ];

    // Store sitemap data for server-side generation
    if (typeof window !== 'undefined') {
      window.sitemapData = sitemapUrls;
    }
  }

  // Performance optimization for SEO
  optimizePageSpeed() {
    // Preload critical resources
    this.preloadCriticalResources();

    // Optimize images for SEO
    this.optimizeImages();

    // Add performance hints
    this.addPerformanceHints();
  }

  preloadCriticalResources() {
    const criticalResources = [
      { href: '/assets/styles.css', as: 'style' },
      { href: '/app-modular.js', as: 'script' },
      { href: SEO_CONFIG.defaultImage, as: 'image' }
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'script') {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  optimizeImages() {
    // Add loading="lazy" to images below the fold
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (index > 3) {
        // First 3 images load immediately
        img.loading = 'lazy';
      }

      // Add alt text if missing
      if (!img.alt && img.dataset.movieName) {
        img.alt = `Poster phim ${img.dataset.movieName}`;
      }
    });
  }

  addPerformanceHints() {
    // DNS prefetch for external domains
    const domains = ['phimapi.com', 'img.phimapi.com'];
    domains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical domains
    const preconnectDomains = ['phimapi.com'];
    preconnectDomains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Analytics and tracking
  setupAnalytics() {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
      });
    }

    // Google Search Console verification
    this.setMetaTag('google-site-verification', 'your-verification-code');
  }

  // Social media optimization
  optimizeSocialSharing(data) {
    // Facebook sharing optimization
    this.setMetaTag('og:title', data.title);
    this.setMetaTag('og:description', data.description);
    this.setMetaTag('og:image', data.image);
    this.setMetaTag('og:url', data.url);

    // Twitter sharing optimization
    this.setMetaTag('twitter:title', data.title);
    this.setMetaTag('twitter:description', data.description);
    this.setMetaTag('twitter:image', data.image);

    // Additional social meta tags
    this.setMetaTag('og:image:width', '1200');
    this.setMetaTag('og:image:height', '630');
    this.setMetaTag('twitter:image:alt', data.imageAlt || data.title);
  }

  // Clean up on navigation
  cleanup() {
    // Remove dynamic meta tags
    this.currentMeta.forEach((element, name) => {
      if (!['charset', 'viewport'].includes(name)) {
        this.removeMetaTag(name);
      }
    });

    // Remove structured data
    this.structuredDataElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.structuredDataElements.clear();

    // Reset breadcrumbs
    this.breadcrumbs = [];
  }

  // Get current SEO status
  getSEOStatus() {
    return {
      title: document.title,
      description: this.currentMeta.get('description')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      breadcrumbs: this.breadcrumbs,
      structuredDataCount: this.structuredDataElements.size,
      metaTagsCount: this.currentMeta.size
    };
  }
}

// Global SEO optimizer instance
export const seoOptimizer = new SEOOptimizer();

// Auto-optimize based on current page
export function autoOptimizeSEO() {
  const path = window.location.hash.slice(1) || '/';

  if (path === '/') {
    seoOptimizer.optimizeHomePage();
  } else if (path.startsWith('/phim/')) {
    // This would need movie data from the current page
    // seoOptimizer.optimizeMovieDetailPage(movieData);
  } else if (path.startsWith('/tim-kiem')) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const keyword = params.get('keyword');
    if (keyword) {
      seoOptimizer.optimizeSearchPage(keyword, []);
    }
  } else if (path.startsWith('/the-loai/')) {
    const category = path.split('/')[2];
    if (category) {
      seoOptimizer.optimizeCategoryPage(category, []);
    }
  }

  // Always optimize page speed
  seoOptimizer.optimizePageSpeed();
  seoOptimizer.setupAnalytics();
}

// Auto-run SEO optimization on hash change
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', autoOptimizeSEO);
  window.addEventListener('load', autoOptimizeSEO);
}
