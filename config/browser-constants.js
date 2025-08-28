/**
 * 🔧 Browser-Compatible Configuration Constants
 * Pure browser-compatible configuration without Node.js dependencies
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://phimapi.com',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  BATCH_SIZE: 24,
  DEFAULT_TYPES: [
    'phim-bo',
    'phim-le', 
    'tv-shows',
    'hoat-hinh',
    'phim-vietsub',
    'phim-thuyet-minh',
    'phim-long-tieng',
  ]
};

// File Paths Configuration (for browser context)
export const FILE_PATHS = {
  DATA_DIR: 'data',
  MOVIES_FILE: 'kho-phim.json',
  UPDATES_LOG: 'updates-log.json',
  CONFIG_FILE: 'auto-update-config.json',
  NOTIFICATION_FILE: 'latest-notification.json',
  SUMMARY_FILE: 'movie-updates-summary.json'
};

// Cache Configuration
export const CACHE_CONFIG = {
  MAX_SIZE: 100,
  TTL: 300000, // 5 minutes
  CLEANUP_INTERVAL: 600000 // 10 minutes
};

// Update Configuration
export const UPDATE_CONFIG = {
  INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  BATCH_SIZE: 24,
  ENABLE_NOTIFICATIONS: true,
  TRACK_NEW_EPISODES: true,
  TRACK_NEW_MOVIES: true,
  AUTO_PUSH_TO_GIT: true,
  GIT_COMMIT_MESSAGE_TEMPLATE: 'Auto-update: {updateSummary}'
};

// Firebase Configuration (Browser-safe)
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
  authDomain: "phim-comments.firebaseapp.com",
  projectId: "phim-comments",
  storageBucket: "phim-comments.firebasestorage.app",
  messagingSenderId: "338411994257",
  appId: "1:338411994257:web:870b6a7cd166a50bc75330"
};

// Comment System Configuration
export const COMMENT_CONFIG = {
  MAX_CONTENT_LENGTH: 500,
  MIN_CONTENT_LENGTH: 3,
  MAX_NAME_LENGTH: 30,
  CACHE_TTL: 300000, // 5 minutes
  DEFAULT_LIMIT: 30,
  AUTO_APPROVE: false, // Security: require moderation
  MODERATION_REQUIRED: true
};

// UI Configuration
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 4000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 20,
  GRID_BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 900,
    DESKTOP: 1200
  }
};

// Theme Configuration
export const THEME_CONFIG = {
  DARK: {
    '--bg': '#0a0a0f',
    '--bg-elev': '#12121a', 
    '--card': '#1a1a24',
    '--border': '#2a2a35',
    '--text': '#e8e8ea',
    '--muted': '#a0a0a8',
    '--primary': '#6c5ce7',
    '--primary-700': '#584bd0',
    '--danger': '#ef5350',
    '--accent': '#00d3a7'
  },
  LIGHT: {
    '--bg': '#f7f8fa',
    '--bg-elev': '#ffffff',
    '--card': '#ffffff', 
    '--border': '#e9ecf1',
    '--text': '#15161a',
    '--muted': '#5b6572',
    '--primary': '#5b6dff',
    '--primary-700': '#4656e6',
    '--danger': '#e53935',
    '--accent': '#0bb'
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  FIREBASE_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  PERMISSION_DENIED: 'Không có quyền truy cập.',
  COMMENT_TOO_SHORT: 'Bình luận quá ngắn (tối thiểu 3 ký tự).',
  COMMENT_TOO_LONG: 'Bình luận quá dài (tối đa 500 ký tự).',
  NAME_REQUIRED: 'Vui lòng nhập tên của bạn.',
  SAVE_MOVIE_ERROR: 'Không thể lưu phim. Vui lòng thử lại.',
  REMOVE_MOVIE_ERROR: 'Không thể xóa phim. Vui lòng thử lại.',
  SYNC_CODE_INVALID: 'Mã sync không tồn tại hoặc đã hết hạn.',
  SYNC_CODE_EXPIRED: 'Mã sync đã hết hạn.'
};

// Success Messages  
export const SUCCESS_MESSAGES = {
  COMMENT_ADDED: 'Bình luận đã được gửi! Đang chờ admin duyệt.',
  MOVIE_SAVED: 'Đã lưu phim vào danh sách yêu thích',
  MOVIE_REMOVED: 'Đã xóa phim khỏi danh sách yêu thích',
  SYNC_SUCCESS: 'Đồng bộ thành công!',
  CACHE_CLEARED: 'Caches cleared!'
};

// Validation Rules
export const VALIDATION_RULES = {
  MOVIE_SLUG: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SYNC_CODE: /^\d{6}$/,
  YEAR: /^\d{4}$/,
  EPISODE: /^\d+$/
};

// Default Values
export const DEFAULTS = {
  USER_NAME: 'Khách',
  THEME: 'dark',
  LANGUAGE: 'vi',
  ITEMS_PER_PAGE: 20,
  CACHE_SIZE: 100
};

// Browser-specific utilities
export const BROWSER_UTILS = {
  // Check if running in browser
  isBrowser: typeof window !== 'undefined',
  
  // Check if localStorage is available
  hasLocalStorage: (() => {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  })(),
  
  // Check if service worker is supported
  hasServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  
  // Get user agent info
  getUserAgent: () => {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'Unknown';
  },
  
  // Check if online
  isOnline: () => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine !== false;
    }
    return true;
  }
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  GOOD_LCP: 2500, // Largest Contentful Paint
  GOOD_FID: 100,  // First Input Delay
  GOOD_CLS: 0.1,  // Cumulative Layout Shift
  LONG_TASK: 50   // Long task threshold
};

// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  ENABLE_SERVICE_WORKER: false,
  ENABLE_ANALYTICS: false,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_REPORTING: true,
  ENABLE_CACHE_OPTIMIZATION: true,
  ENABLE_PRELOADING: true
};

// Export all as a single object for convenience
export const CONFIG = {
  API: API_CONFIG,
  FILES: FILE_PATHS,
  CACHE: CACHE_CONFIG,
  UPDATE: UPDATE_CONFIG,
  FIREBASE: FIREBASE_CONFIG,
  COMMENT: COMMENT_CONFIG,
  UI: UI_CONFIG,
  THEME: THEME_CONFIG,
  ERRORS: ERROR_MESSAGES,
  SUCCESS: SUCCESS_MESSAGES,
  VALIDATION: VALIDATION_RULES,
  DEFAULTS,
  BROWSER: BROWSER_UTILS,
  PERFORMANCE: PERFORMANCE_THRESHOLDS,
  FEATURES: FEATURE_FLAGS
};

export default CONFIG;
