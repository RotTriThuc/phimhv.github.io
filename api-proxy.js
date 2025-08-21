// API Proxy Layer with Security & Rate Limiting
class APIProxy {
  constructor() {
    this.realAPIBase = 'https://phimapi.com'; // Hidden from client
    this.rateLimiter = new Map(); // Store request counts per IP/session
    this.requestQueue = new Map(); // Queue for throttling
    
    // Initialize security measures
    this.initSecurity();
  }
  
  initSecurity() {
    // Generate session ID for rate limiting
    this.sessionId = this.generateSessionId();
    
    // Initialize rate limit counters
    this.rateLimiter.set(this.sessionId, {
      requests: 0,
      resetTime: Date.now() + 60000, // Reset every minute
      blocked: false
    });
  }
  
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
  
  // Rate limiting check
  checkRateLimit(sessionId) {
    const limit = this.rateLimiter.get(sessionId);
    if (!limit) return true;
    
    const now = Date.now();
    
    // Reset counter if time window expired
    if (now > limit.resetTime) {
      limit.requests = 0;
      limit.resetTime = now + 60000;
      limit.blocked = false;
    }
    
    // Check if blocked
    if (limit.blocked) {
      return false;
    }
    
    // Check rate limit
    if (limit.requests >= API_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE) {
      limit.blocked = true;
      return false;
    }
    
    limit.requests++;
    return true;
  }
  
  // Secure request wrapper
  async secureRequest(endpoint, params = {}) {
    // Check rate limit
    if (!this.checkRateLimit(this.sessionId)) {
      throw new Error(API_CONFIG.ERROR_MESSAGES.RATE_LIMITED);
    }
    
    try {
      // Build secure URL (hide real endpoint)
      const url = this.buildSecureURL(endpoint, params);
      
      // Add security headers
      const headers = {
        ...API_CONFIG.SECURITY_HEADERS,
        'User-Agent': this.generateUserAgent(),
        'Referer': window.location.origin
      };
      
      // Add delay to prevent rapid requests
      await this.addDelay();
      
      const response = await fetch(url, { 
        headers,
        method: 'GET',
        mode: 'cors',
        credentials: 'omit' // Don't send cookies
      });
      
      if (!response.ok) {
        throw new Error(this.getSecureErrorMessage(response.status));
      }
      
      return await response.json();
      
    } catch (error) {
      console.warn('API request failed:', error.message);
      throw new Error(API_CONFIG.ERROR_MESSAGES.SERVER_ERROR);
    }
  }
  
  buildSecureURL(endpoint, params) {
    // Map proxy endpoints to real endpoints
    const endpointMap = {
      '/api/movies': '/danh-sach/phim-moi-cap-nhat-v3',
      '/api/search': '/v1/api/tim-kiem',
      '/api/categories': '/the-loai',
      '/api/countries': '/quoc-gia', 
      '/api/years': '/v1/api/nam',
      '/api/movie': '/phim'
    };
    
    let realEndpoint = endpointMap[endpoint] || endpoint;
    
    // Handle dynamic endpoints
    if (params.type_list) {
      realEndpoint = `/v1/api/danh-sach/${params.type_list}`;
      delete params.type_list;
    }
    if (params.slug && endpoint === '/api/categories') {
      realEndpoint = `/v1/api/the-loai/${params.slug}`;
      delete params.slug;
    }
    if (params.slug && endpoint === '/api/countries') {
      realEndpoint = `/v1/api/quoc-gia/${params.slug}`;
      delete params.slug;
    }
    if (params.year && endpoint === '/api/years') {
      realEndpoint = `/v1/api/nam/${params.year}`;
      delete params.year;
    }
    if (params.slug && endpoint === '/api/movie') {
      realEndpoint = `/phim/${params.slug}`;
      delete params.slug;
    }
    
    const url = new URL(realEndpoint, this.realAPIBase);
    
    // Add parameters securely
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    
    return url.toString();
  }
  
  generateUserAgent() {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
    return browsers[Math.floor(Math.random() * browsers.length)] + 
           ' (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }
  
  async addDelay() {
    // Add random delay between 100-500ms to prevent detection
    const delay = Math.random() * 400 + 100;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  getSecureErrorMessage(status) {
    switch (status) {
      case 429: return API_CONFIG.ERROR_MESSAGES.RATE_LIMITED;
      case 401:
      case 403: return API_CONFIG.ERROR_MESSAGES.UNAUTHORIZED;
      case 404: return API_CONFIG.ERROR_MESSAGES.NOT_FOUND;
      default: return API_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
    }
  }
  
  // Public API methods (these replace direct API calls)
  async getLatestMovies(params = {}) {
    return this.secureRequest('/api/movies', params);
  }
  
  async searchMovies(query, params = {}) {
    return this.secureRequest('/api/search', { keyword: query, ...params });
  }
  
  async getCategories(params = {}) {
    return this.secureRequest('/api/categories', params);
  }
  
  async getMoviesByCategory(slug, params = {}) {
    return this.secureRequest('/api/categories', { slug, ...params });
  }
  
  async getMovieDetail(slug) {
    return this.secureRequest('/api/movie', { slug });
  }
  
  // Analytics & monitoring (for security)
  logSecurityEvent(event, details) {
    const logData = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, send to security monitoring service
    console.warn('[Security Event]', logData);
  }
}

// Initialize secure API proxy
const secureAPI = new APIProxy();

// Export for use in app
if (typeof window !== 'undefined') {
  window.secureAPI = secureAPI;
} 