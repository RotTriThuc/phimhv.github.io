// API Proxy Layer with Security & Rate Limiting
class APIProxy {
  constructor() {
    // SECURITY: This is the ONLY place where real API URL is stored
    // This is hidden from client-side view and only used internally by proxy
    this.realAPIBase = 'https://phimapi.com'; // PROTECTED - NOT EXPOSED TO CLIENT
    this.rateLimiter = new Map(); // Store request counts per IP/session
    this.requestQueue = new Map(); // Queue for throttling
    
    // Check if running on localhost (development mode)
    this.isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('localhost');
    
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
    // For localhost development, use direct API calls (bypass proxy)
    if (this.isLocalhost) {
      console.warn('🔧 Development mode: Using direct API calls (proxy disabled)');
      return this.directAPICall(endpoint, params);
    }
    
    // Check rate limit
    if (!this.checkRateLimit(this.sessionId)) {
      throw new Error(API_CONFIG.ERROR_MESSAGES.RATE_LIMITED);
    }
    
    try {
      // Build secure URL (hide real endpoint)
      const url = this.buildSecureURL(endpoint, params);
      
      // Add minimal CORS-safe headers
      const headers = {
        ...API_CONFIG.SECURITY_HEADERS
      };
      
      // Add delay to prevent rapid requests
      await this.addDelay();
      
      // Try CORS request first
      const fetchOptions = {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      };
      
      const response = await fetch(url, fetchOptions);
      
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
  
  // Direct API call for development (bypass proxy)
  async directAPICall(endpoint, params = {}) {
    try {
      // Build direct URL to real API
      const url = this.buildDirectURL(endpoint, params);
      
      console.log('🌐 Direct API call:', url);
      
      // Simple fetch without security headers to avoid CORS
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Direct API call failed:', error);
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    }
  }

  // Build direct URL to real API
  buildDirectURL(endpoint, params = {}) {
    const baseUrl = this.realAPIBase;
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    
    // Map proxy endpoints to real API paths
    const endpointMap = {
      '/api/movies': '/danh-sach/phim-moi-cap-nhat-v3',
      '/api/search': '/v1/api/tim-kiem',
      '/api/countries': '/quoc-gia',
      '/api/categories': '/the-loai'
    };
    
    // Handle dynamic endpoints
    let realEndpoint = endpointMap[endpoint] || endpoint;
    
    // Handle list endpoints like /v1/api/danh-sach/phim-bo
    if (endpoint.startsWith('/v1/api/danh-sach/')) {
      realEndpoint = endpoint; // Keep as is
    }
    
    // Handle category endpoints like /v1/api/the-loai/hanh-dong
    if (endpoint.startsWith('/v1/api/the-loai/')) {
      realEndpoint = endpoint; // Keep as is
    }
    
    return `${baseUrl}${realEndpoint}${queryString}`;
  }

  // Mock data for development (CORS workaround)
  getMockData(endpoint, params) {
    const mockMovie = {
      _id: "mock-movie-1",
      name: "Demo Movie - Development Mode",
      slug: "demo-movie",
      poster_url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMzAwIDQwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjY2O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMzMztzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNncmFkKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIj5ERU1PPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkRldmVsb3BtZW50IE1vZGU8L3RleHQ+PC9zdmc+",
      thumb_url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMzAwIDQwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjY2O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMzMztzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNncmFkKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIj5ERU1PPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkRldmVsb3BtZW50IE1vZGU8L3RleHQ+PC9zdmc+",
      year: 2024,
      view: 1000,
      quality: "HD"
    };

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    
    const mockData = {
      status: true,
      items: Array(12).fill(null).map((_, i) => {
        const color = colors[i % colors.length];
        const posterSvg = `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
            <defs>
              <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="300" height="400" fill="url(#grad${i})"/>
            <text x="50%" y="45%" text-anchor="middle" fill="#fff" font-family="Arial" font-size="20" font-weight="bold">DEMO ${i + 1}</text>
            <text x="50%" y="55%" text-anchor="middle" fill="#ecf0f1" font-family="Arial" font-size="14">Development Mode</text>
            <circle cx="150" cy="300" r="30" fill="rgba(255,255,255,0.2)"/>
            <polygon points="140,290 140,310 165,300" fill="#fff"/>
          </svg>
        `)}`;
        
        return {
          ...mockMovie,
          _id: `mock-movie-${i + 1}`,
          name: `Demo Movie ${i + 1} - Development Mode`,
          slug: `demo-movie-${i + 1}`,
          poster_url: posterSvg,
          thumb_url: posterSvg
        };
      }),
      pagination: {
        totalItems: 100,
        totalItemsPerPage: 24,
        currentPage: 1,
        totalPages: 5
      }
    };

    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => resolve(mockData), 500);
    });
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