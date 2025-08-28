/**
 * 🔧 Centralized Configuration Constants
 * Tập trung tất cả constants để tránh code duplication
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

// File Paths Configuration
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

// Firebase Configuration (Browser-compatible)
export const FIREBASE_CONFIG = {
  // Fallback to hardcoded values for browser compatibility
  // In production, these should be loaded from environment variables
  apiKey: (typeof process !== 'undefined' && process.env?.FIREBASE_API_KEY) || "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
  authDomain: (typeof process !== 'undefined' && process.env?.FIREBASE_AUTH_DOMAIN) || "phim-comments.firebaseapp.com",
  projectId: (typeof process !== 'undefined' && process.env?.FIREBASE_PROJECT_ID) || "phim-comments",
  storageBucket: (typeof process !== 'undefined' && process.env?.FIREBASE_STORAGE_BUCKET) || "phim-comments.firebasestorage.app",
  messagingSenderId: (typeof process !== 'undefined' && process.env?.FIREBASE_MESSAGING_SENDER_ID) || "338411994257",
  appId: (typeof process !== 'undefined' && process.env?.FIREBASE_APP_ID) || "1:338411994257:web:870b6a7cd166a50bc75330"
};

// Comment System Configuration
export const COMMENT_CONFIG = {
  MAX_CONTENT_LENGTH: 500,
  MIN_CONTENT_LENGTH: 3,
  MAX_NAME_LENGTH: 30,
  CACHE_TTL: 300000, // 5 minutes
  DEFAULT_LIMIT: 30,
  AUTO_APPROVE: false, // Changed from true to false for security
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
