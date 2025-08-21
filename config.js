// Security Configuration for API Protection
const API_CONFIG = {
  // Production mode - hide real endpoints
  PRODUCTION: true,
  
  // Use proxy endpoints instead of direct API calls
  ENDPOINTS: {
    // Proxy endpoints that will forward to real API
    MOVIES: '/api/movies',
    SEARCH: '/api/search', 
    CATEGORIES: '/api/categories',
    COUNTRIES: '/api/countries',
    YEARS: '/api/years',
    DETAIL: '/api/movie'
  },
  
  // Rate limiting configuration
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_SECOND: 2,
    BURST_LIMIT: 10
  },
  
  // Security headers (CORS-safe)
  SECURITY_HEADERS: {
    'Accept': 'application/json'
  },
  
  // Error messages (don't reveal internal info)
  ERROR_MESSAGES: {
    RATE_LIMITED: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    UNAUTHORIZED: 'Không có quyền truy cập.',
    SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.',
    NOT_FOUND: 'Không tìm thấy dữ liệu.'
  }
};

// Environment detection
if (typeof window !== 'undefined') {
  // Browser environment
  window.API_CONFIG = API_CONFIG;
} else {
  // Node.js environment  
  module.exports = API_CONFIG;
} 