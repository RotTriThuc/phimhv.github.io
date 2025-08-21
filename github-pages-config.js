// GitHub Pages Configuration
const GITHUB_PAGES_CONFIG = {
  // Chế độ API-only (không dùng local database)
  USE_LOCAL_DATA: false,
  
  // API endpoints - secured via proxy layer
  API_BASE: '/api', // Proxy endpoints only
  
  // Cache trong localStorage thay vì file
  CACHE_PREFIX: 'kkphim_cache_',
  CACHE_DURATION: 30 * 60 * 1000, // 30 phút
  
  // Disable server features
  ENABLE_AUTO_UPDATER: false,
  ENABLE_FILE_LOGGING: false,
  
  // GitHub Pages specific
  BASE_URL: '/web-xem-anime/', // Thay bằng tên repo của bạn
  
  // Performance optimizations
  LAZY_LOAD_IMAGES: true,
  ENABLE_SERVICE_WORKER: true
};

// Override API functions for GitHub Pages
if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
  console.info('🚀 Running on GitHub Pages mode');
  
  // Disable local file operations
  window.GITHUB_PAGES_MODE = true;
  
  // Use localStorage instead of files
  const localCache = {
    get: (key) => {
      try {
        const item = localStorage.getItem(GITHUB_PAGES_CONFIG.CACHE_PREFIX + key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(GITHUB_PAGES_CONFIG.CACHE_PREFIX + key);
          return null;
        }
        return parsed.data;
      } catch (e) {
        return null;
      }
    },
    
    set: (key, data) => {
      try {
        const item = {
          data: data,
          expiry: Date.now() + GITHUB_PAGES_CONFIG.CACHE_DURATION
        };
        localStorage.setItem(GITHUB_PAGES_CONFIG.CACHE_PREFIX + key, JSON.stringify(item));
      } catch (e) {
        console.warn('Cache storage failed:', e);
      }
    }
  };
  
  // Override notification system
  window.showGitHubPagesNotification = function() {
    const notification = {
      message: '🌐 Chạy trên GitHub Pages - Dữ liệu từ API realtime',
      timestamp: new Date().toISOString(),
      hasUpdates: true
    };
    
    if (typeof showNotification === 'function') {
      showNotification(notification);
    }
  };
  
  // Show initial notification
  setTimeout(() => {
    if (window.showGitHubPagesNotification) {
      window.showGitHubPagesNotification();
    }
  }, 2000);
} 