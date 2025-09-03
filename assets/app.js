/* XemPhim SPA - Production Optimized */

// Enhanced Production logging system - Hide debug info but keep errors
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
const hideDebugInfo = true; // Hide sensitive debug info in production

// Professional logging system with levels and context
const Logger = {
  // Hide debug/info logs that might contain sensitive data
  debug: (isDev && !hideDebugInfo) ? (...args) => console.log('🐛 [DEBUG]', ...args) : () => {},
  info: (isDev && !hideDebugInfo) ? (...args) => console.log('ℹ️ [INFO]', ...args) : () => {},

  // Always show warnings and errors for debugging issues
  warn: (...args) => console.warn('⚠️ [WARN]', ...args),
  error: (...args) => console.error('❌ [ERROR]', ...args),
  critical: (...args) => console.error('🚨 [CRITICAL]', ...args),

  // Performance tracking (development only)
  perf: isDev ? (label, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⚡ [PERF] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  } : (label, fn) => fn(),

  // User-facing notifications (always enabled)
  user: (message, type = 'info') => {
    if (typeof showNotification === 'function') {
      showNotification({ message, type });
    }
  }
};

// Backward compatibility
const log = {
  info: Logger.info,
  warn: Logger.warn,
  error: Logger.error
};

// Global banner instance - Khai báo sớm để tránh hoisting issues
let movieBanner = null;

// Helper function để khởi tạo banner một cách nhất quán
function createMovieBanner(container, pageName = 'unknown') {
  Logger.debug(`Creating banner for ${pageName} page...`);

  // Sử dụng setTimeout để đảm bảo tất cả code đã được load
  setTimeout(() => {
    // Kiểm tra xem MovieBannerSlider class đã được định nghĩa chưa
    if (typeof MovieBannerSlider === 'undefined') {
      Logger.error('MovieBannerSlider class not available, cannot create banner');
      return;
    }

    // Reset movieBanner nếu đã tồn tại
    if (movieBanner) {
      Logger.debug('Resetting existing banner...');
      try {
        if (typeof movieBanner.destroy === 'function') {
          movieBanner.destroy();
        }
      } catch (error) {
        Logger.warn('Error destroying existing banner:', error);
      }
      movieBanner = null;
    }

    // Tạo banner mới
    try {
      movieBanner = new MovieBannerSlider(container);
      Logger.debug(`Banner slider created successfully for ${pageName} page`);
    } catch (error) {
      Logger.error(`Error creating banner slider for ${pageName} page:`, error);
    }
  }, 0); // Chạy ngay lập tức nhưng sau khi call stack hiện tại hoàn thành

  return movieBanner;
}

function buildUrl(path, params = {}) {
  const base = 'https://phimapi.com';
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

// Advanced LRU Cache with multiple levels
class AdvancedAPICache {
  constructor() {
    this.cache = new Map();
    this.requestsInFlight = new Map(); // Prevent duplicate requests
    this.priorities = new Map(); // Track access frequency
    this.maxSize = 100; // Increased cache size
    
    // Different cache durations for different types
    this.cacheDurations = {
      'movie-detail': 15 * 60 * 1000,   // 15 min for movie details
      'movie-list': 5 * 60 * 1000,      // 5 min for movie lists  
      'categories': 60 * 60 * 1000,     // 1 hour for categories
      'search': 2 * 60 * 1000,          // 2 min for search results
      'default': 5 * 60 * 1000          // 5 min default
    };
  }
  
  getCacheType(url) {
    if (url.includes('/phim/') && !url.includes('danh-sach')) return 'movie-detail';
    if (url.includes('/the-loai') || url.includes('/quoc-gia')) return 'categories';
    if (url.includes('tim-kiem')) return 'search';
    if (url.includes('danh-sach')) return 'movie-list';
    return 'default';
  }
  
  getCacheDuration(url) {
    return this.cacheDurations[this.getCacheType(url)];
  }
  
  get(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;
    
    const duration = this.getCacheDuration(url);
    if (Date.now() - cached.timestamp > duration) {
      this.cache.delete(url);
      this.priorities.delete(url);
      return null;
    }
    
    // Update access frequency for LRU
    this.priorities.set(url, Date.now());
    return cached.data;
  }
  
  set(url, data) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(url, { 
      data, 
      timestamp: Date.now(),
      size: JSON.stringify(data).length // Track memory usage
    });
    this.priorities.set(url, Date.now());
  }
  
  evictLRU() {
    let oldest = Date.now();
    let oldestKey = null;
    
    for (const [key, time] of this.priorities.entries()) {
      if (time < oldest) {
        oldest = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.priorities.delete(oldestKey);
    }
  }
  
  clear() {
    this.cache.clear();
    this.priorities.clear();
    this.requestsInFlight.clear();
  }
  
  getStats() {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + (item.size || 0), 0);
    
    return {
      entries: this.cache.size,
      inFlight: this.requestsInFlight.size,
      memoryUsage: `${Math.round(totalSize / 1024)} KB`,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
}

const apiCache = new AdvancedAPICache();

// Request deduplication and optimization
async function requestJson(url) {
  // Check cache first
  const cached = apiCache.get(url);
  if (cached) {
    return cached;
  }
  
  // Check if request is already in flight
  if (apiCache.requestsInFlight.has(url)) {
    return apiCache.requestsInFlight.get(url);
  }
  
  // Create new request with timeout and retries
  const requestPromise = fetchWithRetries(url, 3);
  apiCache.requestsInFlight.set(url, requestPromise);
  
  try {
    const data = await requestPromise;
    apiCache.set(url, data);
    return data;
  } finally {
    apiCache.requestsInFlight.delete(url);
  }
}

// Enhanced fetch with retries and timeout
async function fetchWithRetries(url, maxRetries = 3, timeout = 15000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let controller;
    let timeoutId;

    try {
      controller = new AbortController();

      // Set timeout with better error message
      timeoutId = setTimeout(() => {
        controller.abort();
        Logger.debug(`Request timeout after ${timeout}ms: ${url}`);
      }, timeout);

      const res = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        signal: controller.signal
      });

      // Clear timeout immediately after successful fetch
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      Logger.debug(`Request completed successfully`);
      return data;

    } catch (error) {
      // Clear timeout in case of error
      if (timeoutId) clearTimeout(timeoutId);

      lastError = error;

      // Better error categorization
      const errorType = error.name === 'AbortError' ? 'timeout' :
                       error.message.includes('HTTP') ? 'http' : 'network';

      Logger.warn(`🔄 Request attempt ${attempt}/${maxRetries} failed (${errorType}):`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`All ${maxRetries} requests failed. Last error: ${lastError.message}`);
}

function normalizeImageUrl(u) {
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('//')) return 'https:' + u;
  const path = u.startsWith('/') ? u : '/' + u;
  return 'https://phimimg.com' + path;
}

// Advanced Image Processing with WebP support
function processImageUrl(originalUrl) {
  if (!originalUrl) return '';
  return normalizeImageUrl(originalUrl);
}

// Progressive Image Loading System
class ProgressiveImageLoader {
  constructor() {
    this.cache = new Map();
    this.observer = null;
    this.init();
  }
  
  init() {
    // Enhanced Intersection Observer for ultra-fast loading
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '100px', // Larger buffer for faster perceived loading
        threshold: 0.1 // Start loading when 10% visible
      });
    }
    
    // Network-based optimization
    this.detectNetworkSpeed();
    
    // Immediate visible area scan on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.batchLoadVisible();
      }, 100);
    }, { passive: true });
  }
  
  // Detect network speed and adjust quality
  detectNetworkSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.networkType = connection.effectiveType;
      
      // Adjust quality based on network speed
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.defaultQuality = 60; // Lower quality for slow networks
      } else if (connection.effectiveType === '3g') {
        this.defaultQuality = 70;
      } else {
        this.defaultQuality = 75; // Default for 4g+
      }
    } else {
      this.defaultQuality = 75;
    }
  }
  
  // WebP support detection
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  // Generate optimized image URL with smart CDN selection
  getOptimizedUrl(originalUrl, options = {}) {
    if (!originalUrl) return '';
    
    const { width = 300, quality = this.getAdaptiveQuality(), format = 'auto' } = options;
    const baseUrl = normalizeImageUrl(originalUrl);
    
    // Use WebP if supported and format is auto
    const useWebP = format === 'auto' && this.supportsWebP();
    const finalFormat = useWebP ? 'webp' : 'jpg';
    
    // Smart CDN selection based on performance history
    const cdnOptions = this.getCDNsByPerformance(baseUrl, width, quality, finalFormat);
    
    return cdnOptions;
  }
  
  // Adaptive quality based on network and device
  getAdaptiveQuality() {
    let quality = 75; // Default
    
    // Adjust based on network speed
    if (this.networkType === 'slow-2g' || this.networkType === '2g') {
      quality = 50;
    } else if (this.networkType === '3g') {
      quality = 60;
    } else if (this.networkType === '4g') {
      quality = 80;
    }
    
    // Adjust based on device pixel ratio
    if (window.devicePixelRatio > 2) {
      quality = Math.min(quality + 10, 90);
    }
    
    // Adjust based on viewport size (mobile vs desktop)
    if (window.innerWidth < 768) {
      quality = Math.max(quality - 10, 40);
    }
    
    return quality;
  }
  
  // Smart CDN ordering based on performance history
  getCDNsByPerformance(baseUrl, width, quality, format) {
    const encodedUrl = encodeURIComponent(baseUrl);
    
    // Track CDN performance (load times)
    if (!this.cdnPerformance) {
      this.cdnPerformance = new Map();
    }
    
    const cdnConfigs = [
      {
        name: 'wsrv',
        url: `https://wsrv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=${format}&af&il`,
        priority: this.cdnPerformance.get('wsrv')?.avgTime || 1000
      },
      {
        name: 'weserv',
        url: `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=${format}&af&il`,
        priority: this.cdnPerformance.get('weserv')?.avgTime || 1200
      },
      {
        name: 'photon',
        url: `https://i0.wp.com/${baseUrl.replace(/^https?:\/\//, '')}?w=${width}&quality=${quality}&strip=all`,
        priority: this.cdnPerformance.get('photon')?.avgTime || 1500
      },
      {
        name: 'direct',
        url: `${baseUrl}?w=${width}&q=${quality}&t=${Date.now()}`,
        priority: this.cdnPerformance.get('direct')?.avgTime || 2000
      },
      {
        name: 'original',
        url: baseUrl,
        priority: 3000
      }
    ];
    
    // Sort by performance (faster CDNs first)
    cdnConfigs.sort((a, b) => a.priority - b.priority);
    
    return cdnConfigs.map(config => config.url);
  }
  
  // Track CDN performance for smart selection
  recordCDNPerformance(url, loadTime) {
    if (!this.cdnPerformance) return;
    
    let cdnName = 'original';
    if (url.includes('wsrv.nl')) cdnName = 'wsrv';
    else if (url.includes('weserv.nl')) cdnName = 'weserv';
    else if (url.includes('i0.wp.com')) cdnName = 'photon';
    else if (url.includes('?w=')) cdnName = 'direct';
    
    const current = this.cdnPerformance.get(cdnName) || { times: [], avgTime: 1000 };
    current.times.push(loadTime);
    
    // Keep only last 10 measurements
    if (current.times.length > 10) {
      current.times = current.times.slice(-10);
    }
    
    // Calculate moving average
    current.avgTime = current.times.reduce((sum, time) => sum + time, 0) / current.times.length;
    
    this.cdnPerformance.set(cdnName, current);
  }
  
  // Create skeleton placeholder
  createSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'image-skeleton';
    return skeleton;
  }
  
  // Ultra-fast concurrent loading with enhanced error handling
  async loadImage(imgElement) {
    if (!imgElement || imgElement.dataset.loaded === 'true') return;
    
    const originalSrc = imgElement.dataset.src || imgElement.src;
    if (!originalSrc) {
      log.warn('🚨 No image source found for element:', imgElement);
      return;
    }
    
    // Ensure element is in DOM before processing
    if (!imgElement.parentNode || !document.contains(imgElement)) {
      log.warn('🚨 Image element not in DOM, skipping load');
      return;
    }
    
    // Start performance timer
    const startTime = performanceMonitor.startTimer();
    
    // Check cache first
    if (this.cache.has(originalSrc)) {
      const cachedUrl = this.cache.get(originalSrc);
      this.setImageSrc(imgElement, cachedUrl);
      performanceMonitor.recordLoad(startTime, true);
      return;
    }
    
    // Show tiny blurred preview first (with delay to ensure DOM is ready)
    requestAnimationFrame(() => {
      this.setBlurredPreview(imgElement);
    });
    
    // Get optimized URLs with adaptive quality
    const urls = this.getOptimizedUrl(originalSrc, {
      width: 300,
      quality: this.defaultQuality || 75 // Network-adaptive quality
    });
    
    // Race all CDNs concurrently (faster than sequential)
    try {
      const winnerUrl = await this.raceLoadImages(urls);
      this.setImageSrc(imgElement, winnerUrl);
      this.cache.set(originalSrc, winnerUrl);
      performanceMonitor.recordLoad(startTime, true);
    } catch (error) {
      log.warn('🚨 All CDNs failed for:', originalSrc, error);
      // Fallback to original if all fail
      this.setImageSrc(imgElement, originalSrc);
      performanceMonitor.recordLoad(startTime, false);
    }
    
    imgElement.dataset.loaded = 'true';
  }
  
  // Race multiple CDNs concurrently with performance tracking
  async raceLoadImages(urls) {
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasResolved = false;
      const startTime = performance.now();
      
      // Try URLs with intelligent staggering
      urls.forEach((url, index) => {
        // Stagger requests to reduce server load and improve success rate
        const delay = index * Math.min(50, 200 / urls.length);
        
        setTimeout(() => {
          if (hasResolved) return; // Don't start if already resolved
          
          const imgStartTime = performance.now();
          
          this.tryLoadImage(url)
            .then(result => {
              if (!hasResolved) {
                hasResolved = true;
                const loadTime = performance.now() - imgStartTime;
                
                // Track CDN performance for future optimization
                this.recordCDNPerformance(url, loadTime);
                
                resolve(result);
              }
            })
            .catch((error) => {
              const loadTime = performance.now() - imgStartTime;
              // Penalty for failed CDNs
              this.recordCDNPerformance(url, loadTime * 3);
              
              completed++;
              if (completed === urls.length && !hasResolved) {
                reject(new Error(`All ${urls.length} CDNs failed`));
              }
            });
        }, delay);
      });
      
      // Global timeout to prevent hanging
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error('Image loading timeout after 12 seconds'));
        }
      }, 12000);
    });
  }
  
  // Set blurred micro-preview instantly with error handling
  setBlurredPreview(imgElement) {
    if (!imgElement || !imgElement.parentNode) {
      log.warn('🚨 Cannot set blur preview: invalid element or no parent');
      return;
    }
    
    const container = imgElement.parentNode;
    
    // Check if container has position relative for absolute positioning
    const containerStyle = window.getComputedStyle(container);
    if (containerStyle.position === 'static') {
      container.style.position = 'relative';
    }
    
    const placeholder = document.createElement('div');
    placeholder.className = 'image-blur-preview';
    placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      opacity: 0.2;
      transition: opacity 0.2s ease;
      pointer-events: none;
      z-index: 1;
    `;
    
    try {
      container.appendChild(placeholder);
      
      // Remove after image loads or timeout
      setTimeout(() => {
        if (placeholder.parentNode) {
          placeholder.remove();
        }
      }, 3000);
    } catch (error) {
      log.warn('🚨 Failed to add blur preview:', error);
    }
  }
  
  // Promise-based image loading
  tryLoadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  }
  
  // Set image source with fade-in effect and error handling
  setImageSrc(imgElement, url) {
    if (!imgElement || !url) {
      log.warn('🚨 Invalid parameters for setImageSrc:', { imgElement, url });
      return;
    }
    
    try {
      imgElement.src = url;
      imgElement.style.transition = 'opacity 0.2s ease';
      imgElement.style.opacity = '1';
      
      // Remove any blur preview
      const container = imgElement.parentNode;
      if (container) {
        const blurPreview = container.querySelector('.image-blur-preview');
        if (blurPreview) {
          blurPreview.style.opacity = '0';
          setTimeout(() => {
            if (blurPreview.parentNode) {
              blurPreview.remove();
            }
          }, 200);
        }
      }
    } catch (error) {
      log.warn('🚨 Failed to set image source:', error);
    }
  }
  
  // Observe element for lazy loading
  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(element);
    }
  }
  
  // Batch load critical images with immediate priority
  preloadCritical(urls) {
    // Only preload first 2 above-fold images to avoid warnings
    const criticalUrls = urls.slice(0, 2);
    
    // Use fastest CDN for critical images (non-blocking)
    criticalUrls.forEach((url, index) => {
      if (url && !this.cache.has(url)) {
        // Non-blocking preload to avoid performance issues
        requestAnimationFrame(async () => {
          try {
            const optimizedUrls = this.getOptimizedUrl(url, { width: 300, quality: 70 });
            // Pre-warm cache with fastest CDN
            await this.tryLoadImage(optimizedUrls[0]);
            this.cache.set(url, optimizedUrls[0]);
          } catch (error) {
            // Silent fail for preload
          }
        });
      }
    });
    
         // Skip link preload - it causes too many browser warnings
     // Instead rely on immediate loading for visible images
     
     // Clean up old preload links periodically
     this.cleanupPreloadLinks();
   }
   
   // Clean up unused preload links to avoid warnings
   cleanupPreloadLinks() {
     const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
     preloadLinks.forEach(link => {
       // Remove preload links older than 10 seconds
       if (!link.dataset.timestamp) {
         link.dataset.timestamp = Date.now();
       } else if (Date.now() - parseInt(link.dataset.timestamp) > 10000) {
         link.remove();
       }
     });
   }
  
  // Batch load visible images concurrently (throttled)
  batchLoadVisible() {
    // Throttle to avoid excessive calls
    if (this.batchLoadTimeout) return;
    
    this.batchLoadTimeout = setTimeout(() => {
      const images = document.querySelectorAll('.card__img[data-src]:not([data-loaded="true"])');
      if (images.length === 0) {
        this.batchLoadTimeout = null;
        return;
      }
      
      const visibleImages = Array.from(images).filter(img => {
        try {
          const rect = img.getBoundingClientRect();
          return rect.top < window.innerHeight + 200; // 200px buffer
        } catch (e) {
          return false; // Skip if element is not in DOM
        }
      });
      
      // Load visible images with requestAnimationFrame for better performance
      visibleImages.forEach((img, index) => {
        if (index < 3) {
          // Load first 3 immediately
          this.loadImage(img);
        } else {
          // Batch load others
          requestAnimationFrame(() => this.loadImage(img));
        }
      });
      
      this.batchLoadTimeout = null;
    }, 150);
  }
}

// Global instance with fallback
let imageLoader;
try {
  imageLoader = new ProgressiveImageLoader();
} catch (error) {
  log.error('🚨 Failed to initialize image loader:', error);
  // Fallback simple image loader
  imageLoader = {
    loadImage: (img) => {
      if (img && img.dataset.src) {
        img.src = img.dataset.src;
        img.style.opacity = '1';
      }
    },
    observe: (img) => {
      if (img && img.dataset.src) {
        img.src = img.dataset.src;
        img.style.opacity = '1';
      }
    },
    preloadCritical: () => {}, // No-op
    batchLoadVisible: () => {}  // No-op
  };
}

// Performance Monitor for Image Loading
class ImagePerformanceMonitor {
  constructor() {
    this.stats = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
      totalLoadTime: 0
    };
    this.loadTimes = [];
  }
  
  startTimer() {
    return performance.now();
  }
  
  recordLoad(startTime, success = true) {
    const loadTime = performance.now() - startTime;
    this.stats.totalImages++;
    this.stats.totalLoadTime += loadTime;
    this.loadTimes.push(loadTime);
    
    if (success) {
      this.stats.loadedImages++;
    } else {
      this.stats.failedImages++;
    }
    
    this.stats.averageLoadTime = this.stats.totalLoadTime / this.stats.totalImages;
    
    // Show notification on significant improvement
    if (this.stats.loadedImages === 10 && this.stats.averageLoadTime < 800) {
      this.showPerformanceNotification();
    }
  }
  
  showPerformanceNotification() {
    const notification = createEl('div', 'perf-notification');
    notification.innerHTML = `
      <div class="perf-notification-content">
        <div class="perf-notification-icon">⚡</div>
        <div class="perf-notification-text">
          <strong>Image Loading Optimized!</strong><br>
          ${Math.round(this.stats.averageLoadTime)}ms average load time
        </div>
        <button class="perf-notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
    
    notification.querySelector('.perf-notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }
  
  getStats() {
    return {
      ...this.stats,
      successRate: (this.stats.loadedImages / this.stats.totalImages * 100).toFixed(1)
    };
  }
}

// Initialize performance monitor with error handling
let performanceMonitor;
try {
  performanceMonitor = new ImagePerformanceMonitor();
} catch (error) {
  log.warn('🚨 Failed to initialize performance monitor:', error);
  // Fallback no-op monitor
  performanceMonitor = {
    startTimer: () => Date.now(),
    recordLoad: () => {},
    getStats: () => ({}),
    showPerformanceNotification: () => {}
  };
}

// Network Speed Indicator
class NetworkSpeedIndicator {
  constructor() {
    this.indicator = null;
    this.init();
  }
  
  init() {
    this.createIndicator();
    this.updateNetworkStatus();
    
    // Update on network change
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.updateNetworkStatus();
      });
    }
  }
  
  createIndicator() {
    this.indicator = createEl('div', 'network-indicator');
    this.indicator.innerHTML = `
      <span class="network-indicator-icon">📡</span>
      <span class="network-indicator-text">Checking...</span>
    `;
    document.body.appendChild(this.indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.indicator && this.indicator.parentNode) {
        this.indicator.style.opacity = '0.7';
        this.indicator.style.transform = 'scale(0.9)';
      }
    }, 5000);
  }
  
  updateNetworkStatus() {
    if (!this.indicator) return;
    
    let speed = 'unknown';
    let icon = '📡';
    let className = 'medium';
    
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === '4g') {
        speed = '4G Fast';
        icon = '🚀';
        className = 'fast';
      } else if (effectiveType === '3g') {
        speed = '3G Medium';
        icon = '📶';
        className = 'medium';
      } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        speed = '2G Slow';
        icon = '🐌';
        className = 'slow';
      } else {
        speed = 'WiFi';
        icon = '📶';
        className = 'fast';
      }
    } else {
      speed = 'Good';
      icon = '✅';
      className = 'fast';
    }
    
    this.indicator.className = `network-indicator ${className}`;
    this.indicator.innerHTML = `
      <span class="network-indicator-icon">${icon}</span>
      <span class="network-indicator-text">${speed}</span>
    `;
  }
}

// Initialize network indicator with error handling
let networkIndicator;
try {
  networkIndicator = new NetworkSpeedIndicator();
} catch (error) {
  log.warn('🚨 Failed to initialize network indicator:', error);
  // Continue without network indicator
}

// System initialization status
log.info('🎉 Image Loading System V2 Initialized Successfully!');
log.info('📊 Components Status:', {
  imageLoader: !!imageLoader,
  performanceMonitor: !!performanceMonitor,
  networkIndicator: !!networkIndicator
});

// 🔄 Hard Refresh Manager - Tích hợp tính năng hard refresh cho F5
let hardRefreshManager = null;

// Import và initialize Hard Refresh Manager
async function initializeHardRefreshManager() {
  try {
    // Dynamic import để tránh blocking
    const { HardRefreshManager } = await import('../modules/hard-refresh.js');

    // Initialize với custom config
    hardRefreshManager = new HardRefreshManager();

    // Configure cho ứng dụng anime với performance optimization
    hardRefreshManager.setConfirmationEnabled(false); // Không cần confirmation cho UX tốt hơn
    hardRefreshManager.setMobileSupport(true); // Enable mobile support
    hardRefreshManager.setFastMode(true); // Enable fast mode cho performance tốt hơn
    hardRefreshManager.setSkipServiceWorker(false); // Keep SW notification nhưng với timeout ngắn

    // Make globally accessible
    window.hardRefreshManager = hardRefreshManager;

    Logger.info('✅ Hard Refresh Manager initialized successfully');
    Logger.info('🔧 Hard Refresh Features:', hardRefreshManager.getStatus());

    // Thêm keyboard shortcut info vào console cho developers
    if (isDev) {
      console.log(`
🔄 Hard Refresh Controls:
- F5: Hard refresh (desktop)
- Ctrl+Shift+R: Hard refresh (alternative)
- Ctrl+F5: Hard refresh (Windows style)
- Pull down from top: Hard refresh (mobile)
- 3-finger long press: Hard refresh (mobile)

🔧 Debug Commands:
- hardRefreshManager.manualRefresh(): Manual trigger
- hardRefreshManager.forceRefresh(): Force refresh (bypass checks)
- hardRefreshManager.resetState(): Reset stuck state
- hardRefreshManager.getStatus(): Check current status

⚡ Performance Commands:
- hardRefreshManager.setFastMode(true/false): Toggle fast mode
- hardRefreshManager.setSkipServiceWorker(true/false): Skip SW for speed
- hardRefreshManager.config.maxCacheTimeout = 1000: Set cache timeout (ms)
      `);
    }

  } catch (error) {
    Logger.error('❌ Failed to initialize Hard Refresh Manager:', error);

    // Fallback: Basic F5 override
    document.addEventListener('keydown', (event) => {
      if (event.keyCode === 116 || event.key === 'F5') {
        event.preventDefault();
        Logger.info('🔄 Fallback hard refresh triggered');

        // Simple hard refresh fallback
        try {
          // Clear basic caches
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }

          // Clear storages (preserve critical data)
          const theme = localStorage.getItem('theme');
          localStorage.clear();
          if (theme) localStorage.setItem('theme', theme);

          // Reload with cache busting
          const url = new URL(window.location.href);
          url.searchParams.set('_hardRefresh', Date.now());
          window.location.href = url.toString();

        } catch (fallbackError) {
          Logger.error('❌ Fallback hard refresh failed:', fallbackError);
          window.location.reload();
        }
      }
    }, { capture: true, passive: false });

    Logger.warn('⚠️ Using fallback F5 hard refresh implementation');
  }
}

// Initialize Hard Refresh Manager sau khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHardRefreshManager);
} else {
  // DOM đã ready
  initializeHardRefreshManager();
}

// 🔥 Firebase Storage Management for Saved Movies and Watch Progress
// Thay thế localStorage bằng Firebase để sync across devices
const Storage = {
  // Cache for performance
  _savedMoviesCache: null,
  _watchProgressCache: null,
  _cacheExpiry: 5 * 60 * 1000, // 5 minutes
  _lastCacheUpdate: 0,
  _forceFirebaseMode: false, // Force Firebase after sync

  // Lưu phim yêu thích (Firebase)
  async getSavedMovies() {
    try {
      // Use cache if still valid
      if (this._savedMoviesCache && Date.now() - this._lastCacheUpdate < this._cacheExpiry) {
        log.info('📦 Using cached movies:', this._savedMoviesCache.length);
        return this._savedMoviesCache;
      }

      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        log.warn('⚠️ Firebase not ready, waiting for initialization...');

        // Wait a bit for Firebase to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!window.movieComments || !window.movieComments.initialized) {
          log.warn('⚠️ Firebase still not ready, returning empty array');
          return [];
        }
      }

      log.info('🔥 Loading movies from Firebase Primary Storage...');
      const movies = await window.Storage.getSavedMovies();

      // Update cache
      this._savedMoviesCache = movies;
      this._lastCacheUpdate = Date.now();

      log.info(`✅ Loaded ${movies.length} movies from Firebase`);
      return movies;

    } catch (error) {
      log.error('❌ Get saved movies failed:', error);

      // No localStorage fallback - return empty array
      log.warn('⚠️ Firebase error, returning empty array (no localStorage fallback)');
      return [];
    }
  },

  async saveMovie(movie) {
    try {
      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        log.warn('⚠️ Firebase not ready, cannot save movie');
        throw new Error('Firebase chưa sẵn sàng. Vui lòng thử lại sau.');
      }

      const success = await window.Storage.saveMovie(movie);

      // Clear cache to force refresh
      this._savedMoviesCache = null;

      log.info(`✅ Movie saved to Firebase: ${movie.name || movie.slug}`);
      return success;
    } catch (error) {
      log.error('❌ Save movie to Firebase failed:', error);
      throw error; // No localStorage fallback
    }
  },

  async removeSavedMovie(slug) {
    try {
      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        log.warn('⚠️ Firebase not ready, cannot remove movie');
        throw new Error('Firebase chưa sẵn sàng. Vui lòng thử lại sau.');
      }

      const success = await window.Storage.removeMovie(slug);

      // Clear cache to force refresh
      this._savedMoviesCache = null;
      this._lastCacheUpdate = 0;

      log.info(`✅ Movie removed from Firebase: ${slug}`);
      return success;
    } catch (error) {
      log.error('❌ Remove movie from Firebase failed:', error);
      throw error; // No localStorage fallback
    }
  },

  async isMovieSaved(slug) {
    try {
      // Check cache first for performance
      if (this._savedMoviesCache && Date.now() - this._lastCacheUpdate < this._cacheExpiry) {
        return this._savedMoviesCache.some(m => m.slug === slug);
      }

      // Wait for Firebase initialization with timeout
      if (!window.movieComments || !window.movieComments.initialized) {
        // Wait up to 3 seconds for Firebase to initialize
        for (let i = 0; i < 6; i++) {
          if (window.movieComments && window.movieComments.initialized) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // If still not ready, return false silently
        if (!window.movieComments || !window.movieComments.initialized) {
          return false;
        }
      }

      // Use Firebase Primary Storage directly to avoid circular reference
      if (window.FirebasePrimaryStorage && window.FirebasePrimaryStorage.initialized) {
        return await window.FirebasePrimaryStorage.isMovieSaved(slug);
      }

      // Fallback to movieComments if Firebase Primary Storage not available
      return await window.movieComments.isMovieSaved(slug);
    } catch (error) {
      log.error('❌ Check movie saved failed:', error);
      return false;
    }
  },

  // Theo dõi tiến độ xem (Firebase)
  async getWatchProgress() {
    try {
      if (!window.movieComments || !window.movieComments.initialized) {
        return this._getLocalWatchProgress();
      }

      // Use cache if still valid
      if (this._watchProgressCache && Date.now() - this._lastCacheUpdate < this._cacheExpiry) {
        return this._watchProgressCache;
      }

      const progress = await window.movieComments.getAllWatchProgress();

      // Update cache
      this._watchProgressCache = progress;

      return progress;
    } catch (error) {
      log.error('❌ Get watch progress failed, using localStorage:', error);
      return this._getLocalWatchProgress();
    }
  },

  async setWatchProgress(movieSlug, episodeInfo) {
    try {
      if (!window.movieComments || !window.movieComments.initialized) {
        return this._setLocalWatchProgress(movieSlug, episodeInfo);
      }

      await window.movieComments.setWatchProgress(movieSlug, episodeInfo);

      // Clear cache to force refresh
      this._watchProgressCache = null;

      // Also save to localStorage as backup
      this._setLocalWatchProgress(movieSlug, episodeInfo);
    } catch (error) {
      log.error('❌ Set watch progress failed, using localStorage:', error);
      this._setLocalWatchProgress(movieSlug, episodeInfo);
    }
  },

  async getMovieProgress(movieSlug) {
    try {
      if (!window.movieComments || !window.movieComments.initialized) {
        return this._getLocalMovieProgress(movieSlug);
      }

      return await window.movieComments.getWatchProgress(movieSlug);
    } catch (error) {
      log.error('❌ Get movie progress failed, using localStorage:', error);
      return this._getLocalMovieProgress(movieSlug);
    }
  },

  async clearWatchProgress(movieSlug) {
    try {
      if (!window.movieComments || !window.movieComments.initialized) {
        return this._clearLocalWatchProgress(movieSlug);
      }

      await window.movieComments.clearWatchProgress(movieSlug);

      // Clear cache
      this._watchProgressCache = null;

      // Also clear from localStorage
      this._clearLocalWatchProgress(movieSlug);
    } catch (error) {
      log.error('❌ Clear watch progress failed, using localStorage:', error);
      this._clearLocalWatchProgress(movieSlug);
    }
  },

  // Clear all saved movies
  async clearAllSavedMovies() {
    try {
      if (!window.movieComments || !window.movieComments.initialized) {
        localStorage.removeItem('savedMovies');
        return 0;
      }

      const count = await window.movieComments.clearAllSavedMovies();

      // Clear cache and localStorage
      this._savedMoviesCache = null;
      localStorage.removeItem('savedMovies');

      return count;
    } catch (error) {
      log.error('❌ Clear all saved movies failed:', error);
      localStorage.removeItem('savedMovies');
      return 0;
    }
  },

  // LocalStorage methods removed - Firebase only

  _getLocalWatchProgress() {
    try {
      return JSON.parse(localStorage.getItem('watchProgress') || '{}');
    } catch {
      return {};
    }
  },

  _setLocalWatchProgress(movieSlug, episodeInfo) {
    const progress = this._getLocalWatchProgress();
    progress[movieSlug] = {
      ...episodeInfo,
      updatedAt: Date.now()
    };
    localStorage.setItem('watchProgress', JSON.stringify(progress));
  },

  _getLocalMovieProgress(movieSlug) {
    const progress = this._getLocalWatchProgress();
    return progress[movieSlug] || null;
  },

  _clearLocalWatchProgress(movieSlug) {
    const progress = this._getLocalWatchProgress();
    delete progress[movieSlug];
    localStorage.setItem('watchProgress', JSON.stringify(progress));
  }
};

function $(selector, parent = document) { return parent.querySelector(selector); }
function createEl(tag, className, html) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

function clearRootCompletely(root) {
  // Method 1: Remove all children iteratively
  while (root.firstChild) {
    root.removeChild(root.firstChild);
  }
  
  // Method 2: Clear innerHTML as backup
  root.innerHTML = '';
  
  // Method 3: Reset styles and attributes
  root.className = 'container app';
  root.removeAttribute('style');
  
  // Method 4: Clear data attributes except critical ones
  Object.keys(root.dataset).forEach(key => {
    if (!['rendering'].includes(key)) {
      delete root.dataset[key];
    }
  });
  
  // Force reflow
  root.offsetHeight;
}

// Helpers an toàn DOM & dữ liệu
function safeRemove(node) {
  if (node && node.remove) {
    if (node.isConnected) node.remove();
    return;
  }
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

function extractItems(payload) {
  // Chuẩn hóa nhiều dạng schema khác nhau từ API
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.paginate?.items)) return payload.paginate.items;
  return [];
}

function setTheme(theme) {
  const body = document.body;
  body.classList.remove('theme-light', 'theme-dark');
  body.classList.add(theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'theme-dark';
  setTheme(current === 'theme-dark' ? 'theme-light' : 'theme-dark');
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  setTheme(saved || 'theme-dark');
}

function renderLoadingCards(count = 10) {
  const container = createEl('div', 'loading');
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = createEl('div', 'loading__card');
    card.appendChild(createEl('div', 'loading__shimmer'));
    fragment.appendChild(card);
  }
  container.appendChild(fragment);
  return container;
}

function renderError(message, onRetry) {
  const wrap = createEl('div', '', `
    <p>${message}</p>
  `);
  const btn = createEl('button', 'btn btn--ghost', 'Thử lại');
  btn.addEventListener('click', onRetry);
  wrap.appendChild(btn);
  return wrap;
}

function movieCard(movie) {
  const poster = movie.poster_url || movie.thumb_url || '/assets/images/no-poster.svg';
  const languages = movie.lang || movie.language || '';
  const title = movie.name || movie.origin_name || 'Không tên';
  const year = movie.year || '';
  const slug = movie.slug;

  const card = createEl('article', 'card');

  // Check if movie is saved and has progress (async)
  let isSaved = false;
  let progress = null;

  try {
    // These are now async, but we'll handle them in the background
    Storage.isMovieSaved(slug).then(saved => {
      if (saved && !card.querySelector('.card__badge--saved')) {
        const savedBadge = createEl('span', 'card__badge card__badge--saved', '❤️');
        card.appendChild(savedBadge);
      }
    });

    Storage.getMovieProgress(slug).then(prog => {
      if (prog && !card.querySelector('.card__badge--progress')) {
        // Format episode name để hiển thị rõ ràng trên badge
        const displayName = formatEpisodeName(prog.episodeName, prog.episodeSlug);
        const progressBadge = createEl('span', 'card__badge card__badge--progress', `▶ ${displayName}`);
        card.appendChild(progressBadge);
      }
    });
  } catch (error) {
    log.warn('⚠️ Error checking movie status:', error);
  }

  const badges = [];
  if (languages) badges.push(`<span class="card__badge">${languages}</span>`);

  card.innerHTML = `
    ${badges.join('')}
    <div class="card__img-container">
      <img class="card__img" alt="${title}" data-src="${poster}" onerror="this.src='/assets/images/no-poster.svg'">
    </div>
    <div class="card__meta">
      <h3 class="card__title">${title}</h3>
      <div class="card__sub">${year || ''}</div>
    </div>
  `;
  
  const imgEl = card.querySelector('.card__img');
  if (imgEl && poster) {
    imgEl.referrerPolicy = 'no-referrer';
    imgEl.loading = 'lazy'; // Native lazy loading as backup
    imgEl.style.opacity = '0'; // Start hidden
    
    // Ensure DOM is fully ready before image loading
    requestAnimationFrame(() => {
      // Double-check element is still in DOM
      if (!document.contains(imgEl)) {
        log.warn('🚨 Image element removed from DOM before loading');
        return;
      }
      
      // Immediate load if likely to be visible
      try {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight + 300) {
          // Likely visible - load immediately
          imageLoader.loadImage(imgEl);
        } else {
          // Use intersection observer for below-fold images
          imageLoader.observe(imgEl);
        }
      } catch (error) {
        Logger.warn('Error in image loading setup:', error);
        // Fallback to intersection observer
        imageLoader.observe(imgEl);
      }
    });
  }
  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!slug) {
      Logger.warn('No slug found for movie:', movie);
      return;
    }
    
    // Add visual feedback
    card.style.transform = 'scale(0.98)';
    card.style.transition = 'transform 0.1s ease';
    
    // Navigate with slight delay for better UX
    setTimeout(() => {
      card.style.transform = '';
      navigateTo(`#/phim/${slug}`);
    }, 100);
  });
  return card;
}

// High-performance virtual grid with intelligent rendering
class VirtualGrid {
  constructor(container, itemHeight = 260, itemsPerRow = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.itemsPerRow = itemsPerRow;
    this.items = [];
    this.visibleItems = new Map();
    this.renderBuffer = 5; // Extra rows to render above/below viewport
    
    this.setupContainer();
    this.setupScrollListener();
  }
  
  setupContainer() {
    this.container.style.overflowY = 'auto';
    this.container.style.position = 'relative';
    
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'absolute';
    this.viewport.style.top = '0';
    this.viewport.style.left = '0';
    this.viewport.style.right = '0';
    this.container.appendChild(this.viewport);
  }
  
  setupScrollListener() {
    let scrollTimeout;
    this.container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.updateVisibleItems(), 16); // 60fps
    }, { passive: true });
  }
  
  setItems(items) {
    this.items = items;
    this.updateContainerHeight();
    this.updateVisibleItems();
  }
  
  updateContainerHeight() {
    const rows = Math.ceil(this.items.length / this.itemsPerRow);
    const totalHeight = rows * this.itemHeight;
    this.viewport.style.height = `${totalHeight}px`;
  }
  
  updateVisibleItems() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    const startRow = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.renderBuffer);
    const endRow = Math.min(
      Math.ceil(this.items.length / this.itemsPerRow),
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.renderBuffer
    );
    
    const startIndex = startRow * this.itemsPerRow;
    const endIndex = Math.min(this.items.length, endRow * this.itemsPerRow);
    
    // Remove items that are no longer visible
    this.visibleItems.forEach((element, index) => {
      if (index < startIndex || index >= endIndex) {
        element.remove();
        this.visibleItems.delete(index);
      }
    });
    
    // Add newly visible items
    for (let i = startIndex; i < endIndex; i++) {
      if (!this.visibleItems.has(i) && this.items[i]) {
        const element = movieCard(this.items[i]);
        const row = Math.floor(i / this.itemsPerRow);
        const col = i % this.itemsPerRow;
        
        element.style.position = 'absolute';
        element.style.top = `${row * this.itemHeight}px`;
        element.style.left = `${col * (100 / this.itemsPerRow)}%`;
        element.style.width = `${100 / this.itemsPerRow}%`;
        element.style.padding = '6px';
        element.style.boxSizing = 'border-box';
        
        this.viewport.appendChild(element);
        this.visibleItems.set(i, element);
      }
    }
    
    // Trigger image loading for visible items
    requestAnimationFrame(() => {
      imageLoader.batchLoadVisible();
    });
  }
}

// Enhanced grid function with optional virtual scrolling
function listGrid(movies, className = '', enableVirtual = false) {
  const safe = Array.isArray(movies) ? movies : [];
  
  // Use virtual scrolling for large datasets
  if (enableVirtual && safe.length > 50) {
    const container = createEl('div', `grid ${className || ''}`);
    container.style.height = '80vh'; // Fixed height for virtual scrolling
    
    const virtualGrid = new VirtualGrid(container);
    virtualGrid.setItems(safe);
    
    return container;
  }
  
  // Traditional grid for smaller datasets (optimized)
  const grid = createEl('div', 'grid');
  if (className) grid.className = className;
  
  // Smart preloading based on dataset size
  const preloadCount = safe.length > 20 ? 6 : Math.min(safe.length, 4);
  const posterUrls = safe.slice(0, preloadCount).map(m => m.poster_url || m.thumb_url).filter(Boolean);
  
  if (posterUrls.length > 0) {
    imageLoader.preloadCritical(posterUrls);
  }
  
  // Batch DOM updates for better performance
  const batchSize = 10;
  let currentBatch = 0;
  
  function renderBatch() {
    const start = currentBatch * batchSize;
    const end = Math.min(start + batchSize, safe.length);
    
    if (start >= safe.length) return;
    
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      fragment.appendChild(movieCard(safe[i]));
    }
    grid.appendChild(fragment);
    
    currentBatch++;
    
    // Continue rendering in next frame if more items
    if (end < safe.length) {
      requestAnimationFrame(renderBatch);
    } else {
      // All items rendered, trigger image loading
      requestAnimationFrame(() => {
        try {
          imageLoader.batchLoadVisible();
        } catch (error) {
          Logger.error('Image loading failed:', error);
        }
      });
    }
  }
  
  // Start batch rendering
  renderBatch();
  
  return grid;
}

/* Enhanced API Layer with Prefetching */
class APIManager {
  constructor() {
    this.prefetchQueue = new Set();
    this.prefetchInProgress = new Set();
    this.memoryMonitor = new MemoryMonitor();
  }
  
  // Intelligent prefetching
  async prefetch(url, priority = 'low') {
    if (this.prefetchInProgress.has(url) || apiCache.get(url)) {
      return; // Already prefetching or cached
    }
    
    this.prefetchQueue.add({ url, priority, timestamp: Date.now() });
    this.processPrefetchQueue();
  }
  
  async processPrefetchQueue() {
    if (this.prefetchInProgress.size >= 3) return; // Limit concurrent prefetches
    
    const sortedQueue = Array.from(this.prefetchQueue)
      .sort((a, b) => {
        // Priority: high > medium > low, then by timestamp
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority] || a.timestamp - b.timestamp;
      });
    
    const next = sortedQueue[0];
    if (!next) return;
    
    this.prefetchQueue.delete(next);
    this.prefetchInProgress.add(next.url);
    
    try {
      await requestJson(next.url);
    } catch (error) {
      // Prefetch failures are silent
    } finally {
      this.prefetchInProgress.delete(next.url);
      // Continue processing queue
      if (this.prefetchQueue.size > 0) {
        setTimeout(() => this.processPrefetchQueue(), 100);
      }
    }
  }
  
  // Smart next page prefetching
  prefetchNextPage(currentPath, currentPage) {
    const nextPage = currentPage + 1;
    const url = buildUrl(currentPath, { page: nextPage });
    this.prefetch(url, 'medium');
  }
  
  // Related content prefetching
  prefetchRelatedContent(movies) {
    // Prefetch first few movie details
    movies.slice(0, 3).forEach(movie => {
      const url = buildUrl(`/phim/${movie.slug}`);
      this.prefetch(url, 'low');
    });
  }
  
  async getLatest(page = 1) {
    const url = buildUrl('/danh-sach/phim-moi-cap-nhat-v3', { page });
    const result = await requestJson(url);
    
    // Prefetch next page and related content
    this.prefetchNextPage('/danh-sach/phim-moi-cap-nhat-v3', page);
    if (result?.data?.items) {
      this.prefetchRelatedContent(result.data.items);
    }
    
    return result;
  }
  
  async getMovie(slug) {
    const url = buildUrl(`/phim/${slug}`);
    return requestJson(url);
  }
  
  async search({ keyword, page = 1, sort_field, sort_type, sort_lang, category, country, year, limit }) {
    const url = buildUrl('/v1/api/tim-kiem', { keyword, page, sort_field, sort_type, sort_lang, category, country, year, limit });
    const result = await requestJson(url);
    
    // Prefetch next search page
    this.prefetchNextPage('/v1/api/tim-kiem', page);
    
    return result;
  }
  
  async listByType({ type_list, page = 1, sort_field, sort_type, sort_lang, category, country, year, limit = 24 }) {
    const url = buildUrl(`/v1/api/danh-sach/${type_list}`, { page, sort_field, sort_type, sort_lang, category, country, year, limit });
    const result = await requestJson(url);
    
    // Prefetch next page
    this.prefetchNextPage(`/v1/api/danh-sach/${type_list}`, page);
    
    return result;
  }
  
  async getCategories() {
    const url = buildUrl('/the-loai');
    return requestJson(url);
  }
  
  async getCountries() {
    const url = buildUrl('/quoc-gia');
    return requestJson(url);
  }
  
  async listByCategory({ slug, page = 1, sort_field, sort_type, sort_lang, country, year, limit = 24 }) {
    const url = buildUrl(`/v1/api/the-loai/${slug}`, { page, sort_field, sort_type, sort_lang, country, year, limit });
    const result = await requestJson(url);
    
    // Prefetch next page
    this.prefetchNextPage(`/v1/api/the-loai/${slug}`, page);
    
    return result;
  }
  
  async listByCountry({ slug, page = 1, sort_field, sort_type, sort_lang, category, year, limit = 24 }) {
    const url = buildUrl(`/v1/api/quoc-gia/${slug}`, { page, sort_field, sort_type, sort_lang, category, year, limit });
    const result = await requestJson(url);
    
    this.prefetchNextPage(`/v1/api/quoc-gia/${slug}`, page);
    
    return result;
  }
  
  async listByYear({ year, page = 1, sort_field, sort_type, sort_lang, category, country, limit = 24 }) {
    const url = buildUrl(`/v1/api/nam/${year}`, { page, sort_field, sort_type, sort_lang, category, country, limit });
    const result = await requestJson(url);
    
    this.prefetchNextPage(`/v1/api/nam/${year}`, page);
    
    return result;
  }
}

// Memory monitoring for performance optimization
class MemoryMonitor {
  constructor() {
    this.startMonitoring();
  }
  
  startMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }
  
  checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      // If memory usage > 80%, trigger cleanup
      if (usagePercent > 80) {
        Logger.warn('High memory usage detected:', Math.round(usagePercent) + '%');
        this.triggerCleanup();
      }
    }
  }
  
  triggerCleanup() {
    // Clear old cache entries more aggressively
    const now = Date.now();
    const entries = Array.from(apiCache.cache.entries());
    
    entries.forEach(([url, data]) => {
      const cacheType = apiCache.getCacheType(url);
      const maxAge = cacheType === 'movie-list' ? 2 * 60 * 1000 : 5 * 60 * 1000; // Shorter for cleanup
      
      if (now - data.timestamp > maxAge) {
        apiCache.cache.delete(url);
        apiCache.priorities.delete(url);
      }
    });
    
    // Clear image cache
    if (imageLoader && imageLoader.cache) {
      imageLoader.cache.clear();
    }
    
    // Force garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }

    Logger.debug('Memory cleanup completed');
  }
}

const Api = new APIManager();

// Expose Api and extractItems to window for series-navigator.js
window.Api = Api;
window.extractItems = extractItems;

/* Routing */
function parseHash() {
  const raw = location.hash || '#/';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.replace('#', '') || '/';
  const params = new URLSearchParams(queryPart || '');
  return { path, params };
}

function navigateTo(hash) {
  if (location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = hash;
  }
  
  // Ensure scroll to top after navigation (fallback)
  requestAnimationFrame(() => {
    if (window.scrollY > 50) {
      try {
        window.scrollTo({ 
          top: 0, 
          left: 0, 
          behavior: window.scrollY > 500 ? 'instant' : 'smooth' 
        });
      } catch (e) {
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }
    }
  });
}

async function renderHome(root) {
  root.innerHTML = '';
  
  // Movie Banner Slider
  const bannerContainer = createEl('div', 'movie-banner');
  root.appendChild(bannerContainer);

  // Initialize banner slider sử dụng helper function
  createMovieBanner(bannerContainer, 'home');
  
  // Section 1: Phim mới cập nhật (chính)
  root.appendChild(sectionHeader('🎬 Phim mới cập nhật'));
  const loading1 = renderLoadingCards(8);
  root.appendChild(loading1);
  
  try {
    const data = await Api.getLatest(1);
    const items = extractItems(data).slice(0, 8);
    safeRemove(loading1);
    root.appendChild(listGrid(items));
    
    // Button "Xem thêm" cho phim mới
    const moreNewBtn = createEl('button', 'btn btn--more', 'Xem thêm phim mới');
    moreNewBtn.addEventListener('click', () => {
      renderMoreMovies(root, 'latest');
    });
    root.appendChild(moreNewBtn);
    
  } catch (e) {
    safeRemove(loading1);
    root.appendChild(createEl('p', 'error-msg', 'Không thể tải phim mới'));
  }
  
  // Section 2: Phim bộ hot
  await addSimpleSection(root, 'Phim bộ hot', 'phim-bo', 6);
  
  // Section 3: Anime
  await addSimpleSection(root, 'Anime', 'hoat-hinh', 6);
}

async function addSimpleSection(root, title, type, limit = 6) {
  const more = createEl('button', 'section__more', 'Xem tất cả');
  more.addEventListener('click', () => navigateTo(`#/loc?type_list=${encodeURIComponent(type)}`));
  
  root.appendChild(sectionHeader(title, more));
  const loading = renderLoadingCards(limit);
  root.appendChild(loading);
  
  try {
    const data = await Api.listByType({ type_list: type, page: 1, limit });
    const items = extractItems(data).slice(0, limit);
    safeRemove(loading);
    root.appendChild(listGrid(items, 'grid--simple'));
  } catch (err) {
    Logger.error('Failed to load', type, err);
    safeRemove(loading);
    root.appendChild(createEl('p', 'error-msg', `Không tải được ${title.toLowerCase()}`));
  }
}

async function renderMoreMovies(root, type) {
  // Clear current content
  root.innerHTML = '';
  
  // Header với nút back
  const header = createEl('div', 'page-header');
  const backBtn = createEl('button', 'btn btn--back', '← Quay lại');
  backBtn.addEventListener('click', () => navigateTo('#/'));
  
  const title = createEl('h2', 'page-title', 'Tất cả phim mới');
  header.appendChild(backBtn);
  header.appendChild(title);
  root.appendChild(header);
  
  // Movies grid với pagination
  let currentPage = 1;
  const moviesContainer = createEl('div', 'movies-container');
  root.appendChild(moviesContainer);
  
  async function loadPage(page) {
    const loading = renderLoadingCards(16);
    moviesContainer.appendChild(loading);
    
    try {
      const data = await Api.getLatest(page);
      const items = extractItems(data);
      safeRemove(loading);
      
      if (items.length > 0) {
        moviesContainer.appendChild(listGrid(items));
        
        // Load more button
        const loadMoreBtn = createEl('button', 'btn btn--load-more', 'Tải thêm');
        loadMoreBtn.addEventListener('click', async () => {
          loadMoreBtn.disabled = true;
          loadMoreBtn.textContent = 'Đang tải...';
          currentPage++;
          await loadPage(currentPage);
          loadMoreBtn.remove();
        });
        moviesContainer.appendChild(loadMoreBtn);
      }
    } catch (e) {
      Logger.error('Failed to load more movies:', e);
      safeRemove(loading);
      moviesContainer.appendChild(createEl('p', 'error-msg', 'Không thể tải thêm phim'));
    }
  }
  
  await loadPage(currentPage);
}

function sectionHeader(title, trailing) {
  const wrap = createEl('div', 'section');
  wrap.appendChild(createEl('h2', 'section__title', title));
  if (trailing) wrap.appendChild(trailing);
  return wrap;
}

async function renderSearch(root, params) {
  const keyword = params.get('keyword') || '';
  const pageParam = Number(params.get('page') || '1');

  root.innerHTML = '';
  root.appendChild(sectionHeader(`Kết quả tìm kiếm: "${keyword}"`));
  const loading = renderLoadingCards(12);
  root.appendChild(loading);

  try {
    const data = await Api.search({ keyword, page: pageParam });
    safeRemove(loading);
    const items = extractItems(data);
    if (!items.length) {
      root.appendChild(createEl('p', '', 'Không tìm thấy kết quả.'));
      return;
    }
    root.appendChild(listGrid(items));

    const totalPages = data?.paginate?.totalPages || data?.totalPages || 1;
    const pager = buildPager(pageParam, totalPages, (nextPage) => {
      params.set('page', String(nextPage));
      navigateTo(`#/tim-kiem?${params.toString()}`);
    });
    root.appendChild(pager);
  } catch (e) {
    Logger.error('Search failed:', e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được kết quả tìm kiếm.', () => renderSearch(root, params)));
  }
}

function buildPager(current, total, onGo) {
  const pager = createEl('div', 'pager');
  const prev = createEl('button', '', 'Trước');
  const next = createEl('button', '', 'Sau');
  prev.disabled = current <= 1;
  next.disabled = current >= total;
  prev.addEventListener('click', () => onGo(Math.max(1, current - 1)));
  next.addEventListener('click', () => onGo(Math.min(total, current + 1)));
  pager.appendChild(prev);
  pager.appendChild(createEl('span', '', `${current}/${total}`));
  pager.appendChild(next);
  return pager;
}

// Nạp script bên ngoài
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Failed to load ' + src));
    (document.head || document.body).appendChild(s);
  });
}

async function ensureHls() {
  if (window.Hls) return true;
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js');
    return !!window.Hls;
  } catch {
    return false;
  }
}

async function renderFilterList(root, params) {
  const type_list = params.get('type_list') || 'phim-bo';
  const page = Number(params.get('page') || '1');
  const sort_field = params.get('sort_field') || '_id';
  const sort_type = params.get('sort_type') || 'desc';
  const sort_lang = params.get('sort_lang') || '';
  const category = params.get('category') || '';
  const country = params.get('country') || '';
  const year = params.get('year') || '';

  // Use global typeNames definition
  const typeName = typeNames[type_list] || type_list;

  root.innerHTML = '';
  const more = createEl('button', 'section__more', 'Đặt lại lọc');
  more.addEventListener('click', () => navigateTo(`#/loc?type_list=${type_list}`));
  root.appendChild(sectionHeader(`Danh sách ${typeName}`, more));

  const loading = renderLoadingCards(24);
  root.appendChild(loading);

  try {
    const data = await Api.listByType({ type_list, page, sort_field, sort_type, sort_lang, category, country, year, limit: 24 });
    safeRemove(loading);
    const items = extractItems(data);
    
    // Hiển thị thông tin số lượng
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;
    
    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} ${typeName.toLowerCase()} - Trang ${currentPage}/${totalPages}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    } else if (items.length > 0) {
      const countInfo = createEl('div', '', `Hiển thị ${items.length} ${typeName.toLowerCase()} - Trang ${currentPage}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    }
    
    if (items.length === 0) {
      const noMovies = createEl('div', '', `Không tìm thấy ${typeName.toLowerCase()} nào.`);
      noMovies.style.cssText = 'text-align:center;padding:40px;color:var(--muted);';
      root.appendChild(noMovies);
      return;
    }
    
    root.appendChild(listGrid(items));

    if (totalPages > 1) {
      const pager = buildPager(page, totalPages, (nextPage) => {
        // Tạo URL mới với tất cả params
        const newParams = new URLSearchParams();
        newParams.set('type_list', type_list);
        newParams.set('page', String(nextPage));
        if (sort_field) newParams.set('sort_field', sort_field);
        if (sort_type) newParams.set('sort_type', sort_type);
        if (sort_lang) newParams.set('sort_lang', sort_lang);
        if (category) newParams.set('category', category);
        if (country) newParams.set('country', country);
        if (year) newParams.set('year', year);
        navigateTo(`#/loc?${newParams.toString()}`);
      });
      root.appendChild(pager);
    }
  } catch (e) {
    Logger.error('Filter list failed:', e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách lọc.', () => renderFilterList(root, params)));
  }
}

async function renderDetail(root, slug) {
  root.innerHTML = '';
  
  // Ensure scroll to top for detail page (immediate for better UX)
  if (window.scrollY > 50) {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll for detail pages
    });
  }
  
  const loading = renderLoadingCards(6);
  root.appendChild(loading);
  try {
    const data = await Api.getMovie(slug);
    safeRemove(loading);

    const movie = data?.movie || {};
    const episodes = data?.episodes || [];

    const wrap = createEl('div', 'detail');

    const posterUrl = movie.poster_url || movie.thumb_url || '/assets/images/no-poster.svg';
    const poster = createEl('img', 'detail__poster');
    poster.referrerPolicy = 'no-referrer';
    poster.alt = movie.name || 'Poster';
    poster.dataset.src = posterUrl;
    poster.style.opacity = '0'; // Start hidden
    poster.onerror = () => poster.src = '/assets/images/no-poster.svg';
    
    // Create container for poster if needed
    const posterContainer = createEl('div', 'detail__poster-container');
    posterContainer.style.position = 'relative';
    posterContainer.appendChild(poster);

    const meta = createEl('div', 'detail__meta');
    const title = createEl('h1', 'detail__title', movie.name || 'Không tên');
    const countriesHtml = (movie.country || [])
      .map(c => `<a href="#/loc?country=${encodeURIComponent(c.slug || c.name || '')}" title="Xem tất cả phim từ ${c.name}">${c.name}</a>`)
      .join(', ') || '—';
    const categoriesHtml = (movie.category || movie.categories || [])
      .map(c => `<a href="#/loc?category=${encodeURIComponent(c.slug || c.name || '')}" title="Xem tất cả phim thể loại ${c.name}">${c.name}</a>`)
      .join(', ') || '—';
    // Get current page context to preserve filters
    const currentHash = window.location.hash;
    const currentParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const currentCategory = currentParams.get('category') || currentParams.get('the_loai') || '';
    const currentCountry = currentParams.get('country') || currentParams.get('quoc_gia') || '';
    
    // Build year link with preserved context
    let yearUrl = `#/loc?year=${encodeURIComponent(movie.year)}`;
    if (currentHash.includes('/the-loai/')) {
      // Extract category from URL path
      const categorySlug = currentHash.split('/the-loai/')[1]?.split('?')[0];
      if (categorySlug) {
        yearUrl += `&category=${encodeURIComponent(categorySlug)}`;
      }
    } else if (currentCategory) {
      yearUrl += `&category=${encodeURIComponent(currentCategory)}`;
    }
    if (currentCountry) {
      yearUrl += `&country=${encodeURIComponent(currentCountry)}`;
    }
    
    const yearLink = movie.year ? 
      `<a href="${yearUrl}" title="Lọc phim năm ${movie.year} với bộ lọc hiện tại"><strong>${movie.year}</strong></a>` : 
      '<strong>—</strong>';
    
    const info = createEl('div', '', `
      <div class="detail__line">Năm: ${yearLink}</div>
      <div class="detail__line">Trạng thái: <strong>${movie.status || '—'}</strong></div>
      <div class="detail__line">Ngôn ngữ: <strong>${movie.lang || '—'}</strong></div>
      <div class="detail__line">Quốc gia: ${countriesHtml}</div>
      <div class="detail__line">Thể loại: ${categoriesHtml}</div>
    `);

    const actions = createEl('div', 'detail__actions');
    
    // Nút xem ngay
    const firstTarget = findFirstEpisode(episodes);
    if (firstTarget) {
      const watchBtn = createEl('button', 'btn', 'Xem ngay');
      watchBtn.addEventListener('click', () => {
        const q = new URLSearchParams({ server: String(firstTarget.serverIndex), ep: firstTarget.episode.slug || firstTarget.episode.name || '1' });
        navigateTo(`#/xem/${movie.slug}?${q.toString()}`);
      });
      actions.appendChild(watchBtn);
    }

    // Nút tiếp tục xem (nếu có progress) - async để không block UI
    Storage.getMovieProgress(movie.slug).then(progress => {
      if (progress && episodes.length > 0) {
        // Format episode name để hiển thị rõ ràng
        const displayName = formatEpisodeName(progress.episodeName, progress.episodeSlug);
        const continueBtn = createEl('button', 'btn btn--continue', `Đang xem: ${displayName}`);

        continueBtn.addEventListener('click', () => {
          const q = new URLSearchParams({ server: String(progress.serverIndex || 0), ep: progress.episodeSlug || '1' });
          navigateTo(`#/xem/${movie.slug}?${q.toString()}`);
        });

        // Insert continue button after watch button
        const watchBtn = actions.querySelector('.btn:not(.btn--continue):not(.btn--save)');
        if (watchBtn && watchBtn.nextSibling) {
          actions.insertBefore(continueBtn, watchBtn.nextSibling);
        } else {
          actions.appendChild(continueBtn);
        }
      }
    }).catch(error => {
      Logger.error('Error getting movie progress:', error);
    });

    // Nút lưu/bỏ lưu phim (async)
    const saveBtn = createEl('button', 'btn btn--save', 'Lưu phim');

    // Check initial state
    Storage.isMovieSaved(movie.slug).then(isSaved => {
      saveBtn.textContent = isSaved ? '💔 Bỏ lưu' : '❤️ Lưu phim';
      if (isSaved) saveBtn.classList.add('btn--saved');
    });

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Đang xử lý...';

      try {
        const isSaved = await Storage.isMovieSaved(movie.slug);

        if (isSaved) {
          await Storage.removeSavedMovie(movie.slug);
          saveBtn.textContent = '❤️ Lưu phim';
          saveBtn.classList.remove('btn--saved');
          showNotification({
            message: 'Đã xóa khỏi danh sách yêu thích',
            timestamp: new Date().toISOString()
          });
        } else {
          await Storage.saveMovie(movie);
          saveBtn.textContent = '💔 Bỏ lưu';
          saveBtn.classList.add('btn--saved');
          showNotification({
            message: 'Đã lưu vào danh sách yêu thích',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        Logger.error('Save/remove movie failed:', error);
        showNotification({
          message: 'Có lỗi xảy ra. Vui lòng thử lại.',
          timestamp: new Date().toISOString()
        });
      } finally {
        saveBtn.disabled = false;
      }
    });

    actions.appendChild(saveBtn);
    
    const shareBtn = createEl('button', 'btn btn--ghost', 'Sao chép liên kết');
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        shareBtn.textContent = 'Đã sao chép!';
        setTimeout(() => (shareBtn.textContent = 'Sao chép liên kết'), 1200);
      } catch {}
    });
    actions.appendChild(shareBtn);

    const metaWrap = createEl('div');
    metaWrap.appendChild(title);
    metaWrap.appendChild(info);
    metaWrap.appendChild(actions);

    wrap.appendChild(posterContainer);
    wrap.appendChild(metaWrap);
    
    // Load poster after DOM is ready
    requestAnimationFrame(() => {
      if (posterUrl && document.contains(poster)) {
        imageLoader.loadImage(poster);
      }
    });

    const eps = createEl('section', 'episodes');
    const tabs = createEl('div', 'server-tabs');
    const list = createEl('div', 'ep-list');

    let activeServer = 0;
    function renderServerTabs() {
      tabs.innerHTML = '';
      episodes.forEach((s, idx) => {
        const tab = createEl('button', 'server-tab' + (idx === activeServer ? ' active' : ''), s?.server_name || `Server ${idx+1}`);
        tab.addEventListener('click', () => { activeServer = idx; renderEpisodeList(); renderServerTabs(); });
        tabs.appendChild(tab);
      });
    }

    function renderEpisodeList() {
      list.innerHTML = '';
      const dataList = episodes?.[activeServer]?.server_data || [];
      dataList.forEach(ep => {
        const btn = createEl('button', 'ep-item', ep.name || ep.slug || 'Tập');
        btn.addEventListener('click', () => {
          const q = new URLSearchParams({ server: String(activeServer), ep: ep.slug || ep.name || '1' });
          navigateTo(`#/xem/${movie.slug}?${q.toString()}`);
        });
        list.appendChild(btn);
      });
    }

    renderServerTabs();
    renderEpisodeList();
    eps.appendChild(tabs);
    eps.appendChild(list);

    const desc = createEl('section', 'detail__meta');
    desc.appendChild(createEl('h3', '', 'Nội dung'));
    desc.appendChild(createEl('p', '', movie.content || movie.description || 'Chưa có nội dung.'));

    root.appendChild(wrap);
    root.appendChild(eps);
    root.appendChild(desc);

    // Add series navigator
    try {
      const { getCachedRelatedSeasons, createSeriesNavigator } = await import('../modules/series-navigator.js');

      // Initialize Series Update Manager if not already done
      if (!window.seriesUpdateManager) {
        try {
          const { seriesUpdateManager } = await import('../modules/series-update-manager.js');
          window.seriesUpdateManager = seriesUpdateManager;
          console.log('Series Update Manager initialized');
        } catch (error) {
          console.warn('Could not initialize Series Update Manager:', error);
        }
      }

      const relatedSeasons = await getCachedRelatedSeasons(movie, Api, extractItems);
      const seriesNavigator = createSeriesNavigator(movie, relatedSeasons, createEl);

      if (seriesNavigator) {
        root.appendChild(seriesNavigator);
        Logger.debug('Series navigator added to detail page');

        // Setup auto-update event listener cho detail page
        const handleSeriesUpdate = (event) => {
          const { seriesInfo, newSeasons } = event.detail;
          Logger.info('🔄 Series updated on detail page:', seriesInfo.baseName);

          // Re-render series navigator với data mới
          const newNavigator = createSeriesNavigator(movie, newSeasons, createEl);
          if (newNavigator && seriesNavigator.parentNode) {
            seriesNavigator.parentNode.replaceChild(newNavigator, seriesNavigator);

            // Show notification
            if (window.showNotification) {
              window.showNotification({
                message: `🆕 Có phần mới của "${seriesInfo.baseName}"!`,
                timestamp: new Date().toISOString()
              });
            }
          }
        };

        // Add event listener
        window.addEventListener('seriesUpdated', handleSeriesUpdate);

        // Cleanup function (sẽ được gọi khi navigate away)
        const cleanup = () => {
          window.removeEventListener('seriesUpdated', handleSeriesUpdate);
        };

        // Store cleanup function for later use
        if (!window.pageCleanupFunctions) {
          window.pageCleanupFunctions = [];
        }
        window.pageCleanupFunctions.push(cleanup);
      }
    } catch (error) {
      Logger.warn('Could not load series navigator:', error);
    }

    // Add movie comments section
    if (window.movieComments) {
      try {
        window.movieComments.renderCommentSection(root, slug);
      } catch (error) {
        Logger.warn('Could not load movie comments:', error);
      }
    }
  } catch (e) {
    Logger.error('Movie detail failed:', e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được chi tiết phim.', () => renderDetail(root, slug)));
  }
}

function findFirstEpisode(episodes) {
  for (let i = 0; i < (episodes || []).length; i++) {
    const server = episodes[i];
    if (server?.server_data?.length) {
      return { serverIndex: i, episode: server.server_data[0] };
    }
  }
  return null;
}

// Format episode name để hiển thị rõ ràng số tập
function formatEpisodeName(episodeName, episodeSlug) {
  if (!episodeName && !episodeSlug) return 'Tập đang xem';

  const name = episodeName || episodeSlug;

  // Nếu đã có "Tập" trong tên thì giữ nguyên
  if (name.toLowerCase().includes('tập') || name.toLowerCase().includes('episode')) {
    return name;
  }

  // Nếu là số thuần túy thì thêm "Tập"
  if (/^\d+$/.test(name)) {
    return `Tập ${name}`;
  }

  // Nếu có số ở đầu thì thêm "Tập"
  const numberMatch = name.match(/^(\d+)/);
  if (numberMatch) {
    return `Tập ${numberMatch[1]}`;
  }

  // Nếu có pattern như "ep1", "episode1" thì extract số
  const epMatch = name.match(/(?:ep|episode)[\s-]*(\d+)/i);
  if (epMatch) {
    return `Tập ${epMatch[1]}`;
  }

  // Fallback: thêm "Tập" vào đầu nếu chưa có
  return name.startsWith('Tập') ? name : `Tập ${name}`;
}

async function renderWatch(root, slug, params) {
  const serverIndex = Number(params.get('server') || '0');
  const epSlug = params.get('ep') || '';

  root.innerHTML = '';
  
  // Scroll to top for watch page (immediate for better focus on video)
  if (window.scrollY > 50) {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }
  
  const loading = renderLoadingCards(4);
  root.appendChild(loading);

  try {
    const data = await Api.getMovie(slug);
    safeRemove(loading);

    const movie = data?.movie || {};
    const episodes = data?.episodes || [];
    const server = episodes?.[serverIndex];
    const ep = server?.server_data?.find(x => (x.slug || x.name) === epSlug) || server?.server_data?.[0];

    const player = createEl('section', 'player');

    async function renderHls(url, fallbackEmbed) {
      const video = createEl('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';

      const hasNative = video.canPlayType('application/vnd.apple.mpegurl');
      const hasHls = await ensureHls();

      if (hasNative) {
        video.src = url;
        player.appendChild(video);
        return true;
      }
      if (hasHls && window.Hls?.isSupported()) {
        const HlsClass = window.Hls;
        const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(HlsClass.Events.ERROR, (_evt, data) => {
          if (data.fatal && fallbackEmbed) {
            player.innerHTML = '';
            fallbackEmbed();
          }
        });
        player.appendChild(video);
        return true;
      }
      return false;
    }

    function renderEmbed(url) {
      const iframe = createEl('iframe');
      iframe.src = url;
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'no-referrer';
      iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation');
      iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
      player.appendChild(iframe);
    }

    let played = false;
    if (ep?.link_m3u8) {
      played = await renderHls(ep.link_m3u8, () => {
        if (ep?.link_embed) renderEmbed(ep.link_embed);
        else player.appendChild(createEl('p', '', 'Không tìm thấy nguồn phát khả dụng.'));
      });
    }
    if (!played) {
      if (ep?.link_embed) renderEmbed(ep.link_embed);
      else if (ep?.link_m3u8) await renderHls(ep.link_m3u8);
      else player.appendChild(createEl('p', '', 'Không tìm thấy nguồn phát cho tập này.'));
    }

    // Lưu tiến độ xem với tên tập rõ ràng
    const episodeName = ep?.name || epSlug || '';
    const displayEpisodeName = formatEpisodeName(episodeName, epSlug);

    Storage.setWatchProgress(movie.slug, {
      episodeName: displayEpisodeName,
      episodeSlug: epSlug,
      serverIndex: serverIndex,
      serverName: server?.server_name || `Server ${serverIndex+1}`,
      movieName: movie.name
    });

    const h1 = createEl('h1', '', movie.name || 'Đang xem');
    const sub = createEl('div', 'detail__line', `Tập: <strong>${ep?.name || epSlug || ''}</strong> — Server: <strong>${server?.server_name || serverIndex+1}</strong>`);

    const eps = createEl('section', 'episodes');
    const tabs = createEl('div', 'server-tabs');
    const list = createEl('div', 'ep-list');

    let activeServer = serverIndex;
    
    // Tái sử dụng logic tạo server tabs và episode list
    const createServerControls = (episodes, activeServerIndex, movieSlug) => {
      const renderTabs = () => {
        tabs.innerHTML = '';
        episodes.forEach((s, idx) => {
          const tab = createEl('button', 'server-tab' + (idx === activeServerIndex ? ' active' : ''), s?.server_name || `Server ${idx+1}`);
          tab.addEventListener('click', () => { 
            activeServerIndex = idx; 
            renderList(); 
            renderTabs(); 
          });
          tabs.appendChild(tab);
        });
      };
      
      const renderList = () => {
        list.innerHTML = '';
        const dataList = episodes?.[activeServerIndex]?.server_data || [];
        dataList.forEach(one => {
          const btn = createEl('button', 'ep-item', one.name || one.slug || 'Tập');
          btn.addEventListener('click', () => {
            const q = new URLSearchParams({ server: String(activeServerIndex), ep: one.slug || one.name || '1' });
            navigateTo(`#/xem/${movieSlug}?${q.toString()}`);
          });
          list.appendChild(btn);
        });
      };
      
      return { renderTabs, renderList };
    };
    
    const { renderTabs, renderList } = createServerControls(episodes, activeServer, movie.slug);
    renderTabs();
    renderList();
    eps.appendChild(tabs);
    eps.appendChild(list);

    root.appendChild(h1);
    root.appendChild(sub);
    root.appendChild(player);

    // Add series navigator for watch page
    try {
      const { getCachedRelatedSeasons, createWatchSeriesNavigator } = await import('../modules/series-navigator.js');

      // Initialize Series Update Manager if not already done
      if (!window.seriesUpdateManager) {
        try {
          const { seriesUpdateManager } = await import('../modules/series-update-manager.js');
          window.seriesUpdateManager = seriesUpdateManager;
          console.log('Series Update Manager initialized');
        } catch (error) {
          console.warn('Could not initialize Series Update Manager:', error);
        }
      }

      const relatedSeasons = await getCachedRelatedSeasons(movie, Api, extractItems);
      const watchNavigator = createWatchSeriesNavigator(movie, relatedSeasons, createEl);

      if (watchNavigator) {
        root.appendChild(watchNavigator);
        Logger.debug('Watch series navigator added');
      }
    } catch (error) {
      Logger.warn('Could not load watch series navigator:', error);
    }

    root.appendChild(eps);
  } catch (e) {
    Logger.error('Watch data failed:', e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được dữ liệu phát.', () => renderWatch(root, slug, params)));
  }
}




// Mapping categories that are actually type_lists
const CategoryToTypeMapping = {
  'hoat-hinh': 'hoat-hinh',
  // Có thể thêm các mapping khác trong tương lai
};

// Type names for display
const typeNames = {
  'phim-bo': 'Phim Bộ',
  'phim-le': 'Phim Lẻ',
  'hoat-hinh': 'Anime',
  'tv-shows': 'TV Shows',
  'phim-vietsub': 'Phim Vietsub',
  'phim-thuyet-minh': 'Phim Thuyết Minh',
  'phim-long-tieng': 'Phim Lồng Tiếng'
};

// Clear all filters function
function clearAllFilters() {
  Logger.debug('Clearing all filters and returning to home');

  // Reset all dropdown selects to default values
  const categorySelect = document.querySelector('select[name="category"]');
  const countrySelect = document.querySelector('select[name="country"]');
  const yearSelect = document.querySelector('select[name="year"]');

  if (categorySelect) categorySelect.value = '';
  if (countrySelect) countrySelect.value = '';
  if (yearSelect) yearSelect.value = '';

  // Show loading state briefly for better UX - target the correct button
  const clearBtn = document.getElementById('clearFiltersBtn');
  const originalText = clearBtn ? clearBtn.innerHTML : '🗑️';

  if (clearBtn) {
    clearBtn.innerHTML = '↺ Đang xóa...';
    clearBtn.disabled = true;
    clearBtn.style.opacity = '0.6';
  }

  // Navigate to home after short delay for smooth UX
  setTimeout(() => {
    // Reset button state BEFORE navigation
    if (clearBtn) {
      clearBtn.innerHTML = originalText;
      clearBtn.disabled = false;
      clearBtn.style.opacity = '1';
    }

    navigateTo('#/');

    // Show success notification
    if (window.showNotification) {
      showNotification({
        message: '✅ Đã xóa tất cả bộ lọc',
        type: 'success',
        duration: 2000
      });
    }
  }, 300);
}

// Enhanced Combined Filter Function
async function renderCombinedFilter(root, params) {
  const page = Number(params.get('page') || '1');
  let category = params.get('category') || params.get('the_loai') || '';
  const year = params.get('year') || params.get('nam') || '';
  const country = params.get('country') || params.get('quoc_gia') || '';
  let type_list = params.get('type_list') || '';
  const sort_field = params.get('sort_field') || '';
  const sort_type = params.get('sort_type') || '';

  // Special handling: Convert category to type_list if needed
  if (category && CategoryToTypeMapping[category]) {
    Logger.debug(`Converting category "${category}" to type_list "${CategoryToTypeMapping[category]}"`);
    type_list = CategoryToTypeMapping[category];
    category = ''; // Clear category since we're using type_list instead
  }

  root.innerHTML = '';

  // Banner slider removed from filter page to improve user experience
  // Users can focus on filtering without distractions

  // Build dynamic title based on active filters
  const activeFilters = [];
  if (category) activeFilters.push(`Thể loại: ${category}`);
  if (year) activeFilters.push(`Năm: ${year}`);
  if (country) {
    // Special display for Japanese anime filter
    if (country === 'nhat-ban' && type_list === 'hoat-hinh') {
      activeFilters.push(`Quốc gia: Nhật Bản`);
    } else {
      activeFilters.push(`Quốc gia: ${country}`);
    }
  }
  if (type_list) {
    // Special display for converted categories
    const displayName = typeNames[type_list] || type_list;
    activeFilters.push(`Thể loại: ${displayName}`);
  }

  // Add sort info for anime filter
  if (type_list === 'hoat-hinh' && country === 'nhat-ban' && sort_field === 'year' && sort_type === 'desc') {
    activeFilters.push('Sắp xếp: Mới nhất');
  }

  const title = activeFilters.length > 0 ?
    `Lọc phim (${activeFilters.join(', ')})` :
    'Tất cả phim';
  
  root.appendChild(sectionHeader(title));
  
  // Add filter controls
  const filterControls = createEl('div', 'filter-controls');
  filterControls.style.cssText = 'margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;';
  
  // Note: Clear filters button removed from here - using header button instead
  
  root.appendChild(filterControls);
  
  const loading = renderLoadingCards(12);
  root.appendChild(loading);
  
  try {
    let data;
    
    // Choose appropriate API endpoint based on filters
    if (type_list) {
      // Type list has priority - FIXED: Include country, year, and sort parameters
      Logger.debug(`Using listByType API endpoint`);
      data = await Api.listByType({
        type_list,
        page,
        limit: 24,
        country: country || undefined,
        year: year || undefined,
        sort_field: sort_field || undefined,
        sort_type: sort_type || undefined
      });
    } else if (category) {
      // Use category API: /v1/api/the-loai/{slug}?country={country}&year={year}
      Logger.debug(`Using listByCategory API endpoint`);
      data = await Api.listByCategory({
        slug: category,
        page,
        limit: 24,
        country: country || undefined,
        year: year || undefined,
        sort_field: sort_field || undefined,
        sort_type: sort_type || undefined
      });
    } else if (country) {
      // Use country API: /v1/api/quoc-gia/{slug}?category={category}&year={year}
      data = await Api.listByCountry({
        slug: country,
        page,
        limit: 24,
        category: category || undefined,
        year: year || undefined,
        sort_field: sort_field || undefined,
        sort_type: sort_type || undefined
      });
    } else if (year) {
      // Use year API: /v1/api/nam/{year}?category={category}&country={country}
      data = await Api.listByYear({
        year,
        page,
        limit: 24,
        category: category || undefined,
        country: country || undefined,
        sort_field: sort_field || undefined,
        sort_type: sort_type || undefined
      });
    } else {
      // Fallback to search API
      data = await Api.search({
        keyword: '',
        category,
        year,
        country,
        page,
        limit: 24,
        sort_field: sort_field || undefined,
        sort_type: sort_type || undefined
      });
    }
    
    safeRemove(loading);
    const items = extractItems(data);
    
    if (items.length === 0) {
      const noMovies = createEl('div', '', 'Không tìm thấy phim nào với bộ lọc này.');
      noMovies.style.cssText = 'text-align:center;padding:40px;color:var(--muted);';
      root.appendChild(noMovies);
      return;
    }
    
    // Display count info
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;
    
    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} phim - Trang ${currentPage}/${totalPages}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    } else if (items.length > 0) {
      const countInfo = createEl('div', '', `Hiển thị ${items.length} phim - Trang ${currentPage}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    }
    
    root.appendChild(listGrid(items));
    
    if (totalPages > 1) {
      const pager = buildPager(page, totalPages, (nextPage) => {
        const newParams = new URLSearchParams(params);
        newParams.set('page', String(nextPage));
        navigateTo(`#/loc?${newParams.toString()}`);
      });
      root.appendChild(pager);
    }
    
  } catch (e) {
    Logger.error('Combined filter failed:', e);
    safeRemove(loading);
    root.appendChild(renderError('Không tải được danh sách phim.', () => renderCombinedFilter(root, params)));
  }
}

/* Bind header controls */
function bindHeader() {
  const homeBtn = $('#homeBtn');
  homeBtn?.addEventListener('click', () => navigateTo('#/'));

  document.querySelectorAll('.nav__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-quick');

      // Special handling for anime - filter Japanese anime sorted by year (newest first)
      if (type === 'hoat-hinh') {
        navigateTo(`#/loc?type_list=${encodeURIComponent(type)}&country=nhat-ban&sort_field=year&sort_type=desc`);
      } else {
        navigateTo(`#/loc?type_list=${encodeURIComponent(type)}`);
      }
    });
  });

  const form = $('#searchForm');
  const input = $('#searchInput');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input?.value || '').trim();
    if (!q) return;
    const params = new URLSearchParams({ keyword: q, page: '1' });
    navigateTo(`#/tim-kiem?${params.toString()}`);
  });

  $('#themeToggle')?.addEventListener('click', toggleTheme);
}

// Flag to prevent duplicate event listeners
let filtersInitialized = false;

async function populateFilters() {
  const categorySelect = $('#categorySelect');
  const countrySelect = $('#countrySelect');
  const yearSelect = $('#yearSelect');
  const applyFiltersBtn = $('#applyFiltersBtn');

  try {
    // Populate categories
    if (categorySelect && Categories?.list) {
      Categories.list.forEach(c => {
        const opt = createEl('option');
        opt.value = c.slug || '';
        opt.textContent = c.name || '';
        categorySelect.appendChild(opt);
      });
    }

    // Populate countries
    const countries = await Api.getCountries().catch(() => []);
    if (Array.isArray(countries)) {
      countries.forEach(c => {
        const opt = createEl('option');
        opt.value = c.slug || c.id || '';
        opt.textContent = c.name || c.title || '';
        countrySelect?.appendChild(opt);
      });
    }

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      const opt = createEl('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect?.appendChild(opt);
    }

    // Enhanced event listeners for combined filtering - only bind once
    if (!filtersInitialized) {
      const applyFilters = () => {
        const category = categorySelect?.value || '';
        const country = countrySelect?.value || '';
        const year = yearSelect?.value || '';

        Logger.debug('Apply filters clicked:', { category, country, year });

        // If no filters selected, go to home
        if (!category && !country && !year) {
          Logger.debug('No filters selected, going to home');
          navigateTo('#/');
          return;
        }

        // Build combined filter URL
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (country) params.set('country', country);
        if (year) params.set('year', year);

        const url = `#/loc?${params.toString()}`;
        Logger.debug('Navigating to:', url);
        navigateTo(url);
      };

      // Apply filters button - bind only once
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
        Logger.debug('Apply filters button event listener bound');
      }

    // Add clear filters button to main filter controls
    const clearFiltersBtn = $('#clearFiltersBtn');
    if (clearFiltersBtn) {
      // Ensure button is in correct state on page load
      clearFiltersBtn.innerHTML = '🗑️';
      clearFiltersBtn.disabled = false;
      clearFiltersBtn.style.opacity = '1';

      clearFiltersBtn.addEventListener('click', () => {
        clearAllFilters();
      });
    }

    // Individual filter navigation (backward compatibility)
    categorySelect?.addEventListener('change', () => {
      const v = categorySelect.value;
      if (v) navigateTo(`#/the-loai/${encodeURIComponent(v)}`);
    });

    countrySelect?.addEventListener('change', () => {
      const v = countrySelect.value;
      if (v) navigateTo(`#/quoc-gia/${encodeURIComponent(v)}`);
    });

      yearSelect?.addEventListener('change', () => {
        const v = yearSelect.value;
        if (v) navigateTo(`#/nam/${encodeURIComponent(v)}`);
      });

      // Mark as initialized
      filtersInitialized = true;
    }

  } catch (e) {
    Logger.warn('Failed to load filters:', e);
  }
}

// Categories từ KKPhim
const Categories = {
  list: [
    { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Cổ Trang', slug: 'co-trang' },
    { name: 'Chiến Tranh', slug: 'chien-tranh' },
    { name: 'Viễn Tưởng', slug: 'vien-tuong' },
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Tài Liệu', slug: 'tai-lieu' },
    { name: 'Bí Ẩn', slug: 'bi-an' },
    { name: 'Phim 18+', slug: 'phim-18' },
    { name: 'Tình Cảm', slug: 'tinh-cam' },
    { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Thể Thao', slug: 'the-thao' },
    { name: 'Phiêu Lưu', slug: 'phieu-luu' },
    { name: 'Âm Nhạc', slug: 'am-nhac' },
    { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Học Đường', slug: 'hoc-duong' },
    { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Hình Sự', slug: 'hinh-su' },
    { name: 'Võ Thuật', slug: 'vo-thuat' },
    { name: 'Khoa Học', slug: 'khoa-hoc' },
    { name: 'Anime', slug: 'hoat-hinh' },
    { name: 'Thần Thoại', slug: 'than-thoai' },
    { name: 'Chính Kịch', slug: 'chinh-kich' },
    { name: 'Kinh Điển', slug: 'kinh-dien' }
  ],

  // Tìm thể loại theo slug
  findBySlug(slug) {
    return this.list.find(cat => cat.slug === slug);
  },

  // Lọc phim theo thể loại từ danh sách
  filterMoviesByCategory(movies, categorySlug) {
    if (!categorySlug || !Array.isArray(movies)) return movies;
    
    return movies.filter(movie => {
      const categories = movie.category || [];
      return categories.some(cat => cat.slug === categorySlug);
    });
  },

  // Nhóm phim theo thể loại
  groupMoviesByCategory(movies) {
    const grouped = {};
    
    // Khởi tạo các thể loại
    this.list.forEach(cat => {
      grouped[cat.slug] = {
        name: cat.name,
        slug: cat.slug,
        movies: []
      };
    });

    // Phân loại phim
    if (Array.isArray(movies)) {
      movies.forEach(movie => {
        const categories = movie.category || [];
        categories.forEach(cat => {
          if (grouped[cat.slug]) {
            grouped[cat.slug].movies.push(movie);
          }
        });
      });
    }

    return grouped;
  }
};

// Render trang tất cả thể loại
async function renderAllCategories(root) {
  // Check if already rendering this page to prevent duplicates
  if (root.dataset.rendering === 'categories') {
    return;
  }
  
  // Use utility function for complete DOM cleanup
  clearRootCompletely(root);
  
  // Set rendering flag after cleanup
  root.dataset.rendering = 'categories';
  
  // Force reflow to ensure DOM is fully cleared
  root.offsetHeight;
  
  root.appendChild(sectionHeader('Tất cả thể loại'));
  
  const categoryGrid = createEl('div', 'category-grid');
  categoryGrid.className = 'category-grid';
  categoryGrid.style.cssText = 'display:grid !important;grid-template-columns:repeat(auto-fill,minmax(200px,1fr)) !important;gap:16px !important;margin-top:20px !important;padding:0 !important;';
  
  Categories.list.forEach(category => {
    const categoryCard = createEl('a', 'category-card');
    categoryCard.className = 'category-card';
    categoryCard.href = `#/the-loai/${category.slug}`;
    categoryCard.style.cssText = `
      display:block !important;
      padding:20px !important;
      background:var(--card) !important;
      border:1px solid var(--border) !important;
      border-radius:12px !important;
      text-decoration:none !important;
      color:var(--text) !important;
      transition:all 0.2s ease !important;
      text-align:center !important;
      width:auto !important;
      height:auto !important;
      position:relative !important;
    `;
    
    categoryCard.innerHTML = `
      <div style="font-size:24px;margin-bottom:8px;">🎬</div>
      <div style="font-weight:500;margin-bottom:4px;">${category.name}</div>
      <div style="font-size:12px;color:var(--muted);">Khám phá ngay</div>
    `;
    
    categoryGrid.appendChild(categoryCard);
  });
  
  root.appendChild(categoryGrid);
  
  // Clear the rendering flag
  delete root.dataset.rendering;
}

// 📱 Cross-Device Sync Function (Global scope)
window.showCrossDeviceSync = function() {
  if (window.movieComments && window.movieComments.showSyncDialog) {
    window.movieComments.showSyncDialog();
  } else {
    alert('Tính năng sync chưa sẵn sàng. Vui lòng thử lại sau.');
  }
};

// 🔄 Force refresh saved movies after sync
window.refreshSavedMoviesAfterSync = async function() {
  Logger.debug('Refreshing saved movies after sync...');

  try {
    // Clear all caches thoroughly
    if (window.Storage) {
      window.Storage._savedMoviesCache = null;
      window.Storage._watchProgressCache = null;
      window.Storage._lastCacheUpdate = 0; // Reset timestamp
    }

    // Clear localStorage cache
    localStorage.removeItem('savedMovies');
    localStorage.removeItem('watchProgress');

    // If we're on saved movies page, re-render it
    const currentHash = window.location.hash;
    if (currentHash === '#/phim-da-luu' || currentHash === '#/phim-da-luu/') {
      const appElement = document.getElementById('app');
      if (appElement && window.renderSavedMovies) {
        Logger.debug('Re-rendering saved movies page...');

        // Force clear the app element first
        appElement.innerHTML = '';
        appElement.removeAttribute('data-rendering');

        // Re-render with fresh data
        await window.renderSavedMovies(appElement);
        Logger.debug('Saved movies page re-rendered');
      }
    }

    Logger.debug('Saved movies refresh completed');
  } catch (error) {
    Logger.error('Error refreshing saved movies:', error);
  }
};

// 🚀 Immediate refresh without page reload
window.immediateRefreshSavedMovies = async function() {
  Logger.debug('Immediate refresh of saved movies...');

  try {
    // Clear all caches and enable force Firebase mode
    if (window.Storage) {
      window.Storage._savedMoviesCache = null;
      window.Storage._watchProgressCache = null;
      window.Storage._lastCacheUpdate = 0;
      window.Storage._forceFirebaseMode = true; // Force Firebase after sync
    }
    localStorage.removeItem('savedMovies');
    localStorage.removeItem('watchProgress');

    // Force reload movies from Firebase
    if (window.Storage) {
      const movies = await window.Storage.getSavedMovies();
      Logger.debug(`Immediate refresh found ${movies.length} movies`);
    }

    // If on saved movies page, refresh UI
    const currentHash = window.location.hash;
    if (currentHash === '#/phim-da-luu' || currentHash === '#/phim-da-luu/') {
      const appElement = document.getElementById('app');
      if (appElement) {
        // Clear and re-render
        appElement.innerHTML = '';
        appElement.removeAttribute('data-rendering');

        if (window.renderSavedMovies) {
          await window.renderSavedMovies(appElement);
          Logger.debug('UI refreshed immediately');
        }
      }
    }

    return true;
  } catch (error) {
    Logger.error('Immediate refresh failed:', error);
    return false;
  }
};

// Render trang phim đã lưu với Firebase Primary UI
async function renderSavedMovies(root) {
  if (root.dataset.rendering === 'saved-movies') {
    return;
  }

  clearRootCompletely(root);
  root.dataset.rendering = 'saved-movies';
  root.offsetHeight;

  // Create container for Firebase Primary UI
  const savedMoviesContainer = createEl('div', 'saved-movies-container');
  savedMoviesContainer.id = 'saved-movies-container';
  root.appendChild(savedMoviesContainer);

  // Use Firebase Primary UI to render movies
  if (window.FirebasePrimaryUI) {
    try {
      await window.FirebasePrimaryUI.renderSavedMoviesList('saved-movies-container');
      log.info('✅ Firebase Primary UI rendered saved movies');
    } catch (error) {
      log.error('❌ Firebase Primary UI failed:', error);
      // Fallback to old rendering
      await renderSavedMoviesLegacy(root, savedMoviesContainer);
    }
  } else {
    log.warn('⚠️ Firebase Primary UI not available, using legacy rendering');
    await renderSavedMoviesLegacy(root, savedMoviesContainer);
  }

  delete root.dataset.rendering;
}

// Legacy rendering as fallback
async function renderSavedMoviesLegacy(root, container) {
  // Show loading state
  const loadingHeader = sectionHeader('❤️ Phim đã lưu');
  container.appendChild(loadingHeader);

  const loadingState = createEl('div', 'loading-state');
  loadingState.style.cssText = 'text-align:center;padding:40px 20px;color:var(--muted);';
  loadingState.innerHTML = `
    <div style="font-size:32px;margin-bottom:16px;">⏳</div>
    <p>Đang tải danh sách phim đã lưu...</p>
    <div style="font-size:12px;margin-top:8px;">
      ${window.movieComments?.initialized ? 'Từ Firebase Primary Storage' : 'Từ bộ nhớ local'}
    </div>
  `;
  container.appendChild(loadingState);

  try {
    // Load saved movies (async)
    const savedMovies = await Storage.getSavedMovies();

    // Remove loading state
    safeRemove(loadingState);

    // Update header with count
    loadingHeader.querySelector('.section__title').textContent = `❤️ Phim đã lưu (${savedMovies.length})`;

    if (savedMovies.length === 0) {
      const emptyState = createEl('div', 'empty-state');
      emptyState.style.cssText = 'text-align:center;padding:60px 20px;color:var(--muted);';
      emptyState.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">📺</div>
        <h3 style="margin:0 0 8px 0;color:var(--text);">Chưa có phim nào được lưu</h3>
        <p style="margin:0 0 20px 0;">Lưu những bộ phim yêu thích để xem sau</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn--ghost" onclick="navigateTo('#/')">Khám phá phim</button>
          <button class="btn sync-device-btn-empty" style="background:#6c5ce7;color:white;">📱 Sync thiết bị</button>
        </div>
        <div style="font-size:12px;margin-top:16px;color:var(--muted);">
          💡 Phim được lưu trên Firebase Primary Storage - sync mọi thiết bị
        </div>
      `;
      container.appendChild(emptyState);

      // Add event listener for empty state sync button
      const emptySyncBtn = emptyState.querySelector('.sync-device-btn-empty');
      if (emptySyncBtn) {
        emptySyncBtn.addEventListener('click', () => {
          window.showCrossDeviceSync();
        });
      }

      return;
    }
  
    // Thông tin thống kê
    const stats = createEl('div', 'saved-stats');
    stats.style.cssText = 'margin-bottom:20px;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;';
    stats.innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:14px;color:var(--muted);">
        <div>📊 Tổng cộng: <strong style="color:var(--text);">${savedMovies.length}</strong> phim</div>
        <div>📅 Lưu gần nhất: <strong style="color:var(--text);">${new Date(savedMovies[0]?.savedAt).toLocaleDateString('vi-VN')}</strong></div>
      </div>
    `;
    container.appendChild(stats);

    // Sync status indicator with cross-device sync button
    const syncStatus = createEl('div', 'sync-status');
    syncStatus.style.cssText = 'margin-bottom:20px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:8px;font-size:13px;';

    const isFirebaseReady = window.movieComments?.initialized;
    const currentUser = isFirebaseReady ? window.movieComments.getUserName() : 'Khách';

    // Debug log
    Logger.debug('Sync Button Debug - renderSavedMovies:', {
      isFirebaseReady,
      currentUser,
      hasMovieComments: !!window.movieComments,
      location: window.location.hash
    });

    syncStatus.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">${isFirebaseReady ? '🔄' : '💾'}</span>
          <div>
            <div style="font-weight:500;color:var(--text);">
              Firebase Primary Storage • ${currentUser}
            </div>
            <div style="color:var(--muted);font-size:12px;">
              Phim được lưu trên Firebase - sync mọi thiết bị
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn--ghost refresh-firebase-btn" style="font-size:12px;padding:6px 12px;background:#00b894;color:white;" title="Làm mới Firebase và trang web (F5)">
            🔄 Làm mới
          </button>
          <button class="btn btn--ghost sync-device-btn" style="font-size:12px;padding:6px 12px;background:#6c5ce7;color:white;">
            📱 Sync thiết bị
          </button>
        </div>
      </div>
    `;
    container.appendChild(syncStatus);

  // Add F5 keyboard shortcut for Firebase + page refresh (only on saved movies page)
  const handleKeyPress = (event) => {
    if (event.key === 'F5' && window.location.hash === '#/phim-da-luu') {
      // Don't prevent default - let it reload page, but also clear Firebase cache first
      Logger.debug('F5 pressed on saved movies page - clearing Firebase cache before reload');

      // Clear Firebase cache before page reload
      if (window.Storage) {
        window.Storage._savedMoviesCache = null;
        window.Storage._watchProgressCache = null;
        window.Storage._lastCacheUpdate = 0;
        window.Storage._forceFirebaseMode = true;
      }

      // Clear localStorage
      localStorage.removeItem('savedMovies');
      localStorage.removeItem('watchProgress');

      // Let browser handle the page reload naturally
      // No event.preventDefault() - allow normal F5 behavior
    }
  };

  // Add keyboard listener
  document.addEventListener('keydown', handleKeyPress);

  // Clean up listener when page changes
  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyPress);
  };

  // Store cleanup function for later use
  if (!window.savedMoviesCleanup) {
    window.savedMoviesCleanup = [];
  }
  window.savedMoviesCleanup.push(cleanup);

  // Add event listener for refresh Firebase + page button
  const refreshFirebaseBtn = syncStatus.querySelector('.refresh-firebase-btn');
  if (refreshFirebaseBtn) {
    refreshFirebaseBtn.addEventListener('click', async () => {
      refreshFirebaseBtn.disabled = true;
      refreshFirebaseBtn.textContent = '⏳ Đang tải...';

      try {
        Logger.debug('Starting Firebase + Page refresh...');

        // Step 1: Clear all caches to force fresh data from Firebase
        if (window.Storage) {
          window.Storage._savedMoviesCache = null;
          window.Storage._watchProgressCache = null;
          window.Storage._lastCacheUpdate = 0;
          window.Storage._forceFirebaseMode = true; // Force Firebase mode
        }

        // Step 2: Clear any localStorage remnants
        localStorage.removeItem('savedMovies');
        localStorage.removeItem('watchProgress');

        Logger.debug('Cleared all caches and localStorage');

        // Step 3: Show loading message
        if (window.showNotification) {
          window.showNotification({
            message: '🔄 Đang làm mới Firebase và trang web...',
            timestamp: new Date().toISOString()
          });
        }

        // Step 4: Wait a moment for cache clearing to take effect
        await new Promise(resolve => setTimeout(resolve, 500));

        Logger.debug('Reloading page for complete refresh...');

        // Step 5: Reload the entire page for complete refresh
        window.location.reload();

      } catch (error) {
        Logger.error('Firebase + Page refresh failed:', error);

        // Show error notification
        if (window.showNotification) {
          window.showNotification({
            message: '❌ Lỗi khi làm mới: ' + error.message,
            timestamp: new Date().toISOString()
          });
        }

        // Still reload page even if there's an error
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  }

  // Add event listener for sync device button
  const syncDeviceBtn = syncStatus.querySelector('.sync-device-btn');
  if (syncDeviceBtn) {
    syncDeviceBtn.addEventListener('click', () => {
      window.showCrossDeviceSync();
    });
  }

  // Actions
  const actions = createEl('div', 'saved-actions');
  actions.style.cssText = 'display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;';

    const clearAllBtn = createEl('button', 'btn btn--danger', '🗑️ Xóa tất cả');
    clearAllBtn.addEventListener('click', async () => {
      if (confirm('Bạn có chắc muốn xóa tất cả phim đã lưu?')) {
        clearAllBtn.disabled = true;
        clearAllBtn.textContent = 'Đang xóa...';

        try {
          const count = await Storage.clearAllSavedMovies();
          showNotification({
            message: `Đã xóa ${count} phim khỏi danh sách`,
            timestamp: new Date().toISOString()
          });
          renderSavedMovies(root); // Re-render
        } catch (error) {
          Logger.error('Clear all failed:', error);
          showNotification({
            message: 'Có lỗi xảy ra khi xóa danh sách',
            timestamp: new Date().toISOString()
          });
        } finally {
          clearAllBtn.disabled = false;
          clearAllBtn.textContent = '🗑️ Xóa tất cả';
        }
      }
    });

    const exportBtn = createEl('button', 'btn btn--ghost', '📤 Xuất danh sách');
    exportBtn.addEventListener('click', () => {
      const data = savedMovies.map(m => `${m.name} (${m.year}) - ${window.location.origin}/#/phim/${m.slug}`).join('\n');
      navigator.clipboard.writeText(data).then(() => {
        exportBtn.textContent = '✅ Đã sao chép';
        setTimeout(() => exportBtn.textContent = '📤 Xuất danh sách', 2000);
      });
    });

    // Removed duplicate refresh button - using the one in sync status instead

    actions.appendChild(clearAllBtn);
    actions.appendChild(exportBtn);
    root.appendChild(actions);

    // Danh sách phim
    const moviesGrid = listGrid(savedMovies, 'grid');
    container.appendChild(moviesGrid);

  } catch (error) {
    Logger.error('Load saved movies failed:', error);
    safeRemove(loadingState);

    const errorState = createEl('div', 'error-state');
    errorState.style.cssText = 'text-align:center;padding:60px 20px;color:var(--muted);';
    errorState.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">❌</div>
      <h3 style="margin:0 0 8px 0;color:var(--text);">Không thể tải danh sách phim</h3>
      <p style="margin:0 0 20px 0;">Có lỗi xảy ra khi tải phim đã lưu</p>
      <button class="btn btn--ghost" onclick="renderSavedMovies(document.getElementById('app'))">Thử lại</button>
    `;
    container.appendChild(errorState);
  }
}

/* App bootstrap */
let isRouting = false;
async function router() {
  if (isRouting) {
    return;
  }
  isRouting = true;

  // Cleanup previous page resources
  if (window.pageCleanupFunctions && window.pageCleanupFunctions.length > 0) {
    Logger.debug('Cleaning up previous page resources...');
    window.pageCleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        Logger.warn('Error in page cleanup:', error);
      }
    });
    window.pageCleanupFunctions = [];
  }

  // Smart scroll to top on navigation
  const currentScrollY = window.scrollY;
  if (currentScrollY > 100) {
    // Use smooth scroll for small distances, instant for large distances
    const scrollBehavior = currentScrollY > 800 ? 'instant' : 'smooth';
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: scrollBehavior
    });
  }
  
  // Clean up old preload links on page navigation
  if (imageLoader && imageLoader.cleanupPreloadLinks) {
    imageLoader.cleanupPreloadLinks();
  }
  
  const root = document.getElementById('app');
  const { path, params } = parseHash();

  if (!root) {
    isRouting = false;
    return;
  }
  if (path === '/' || path === '') {
    await renderHome(root);
    isRouting = false;
    return;
  }
  if (path.startsWith('/tim-kiem')) {
    await renderSearch(root, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/loc')) {
    await renderCombinedFilter(root, params);
    isRouting = false;
    return;
  }
  if (path === '/the-loai' || path === '/the-loai/') {
    await renderAllCategories(root);
    isRouting = false;
    return;
  }
  if (path === '/phim-da-luu' || path === '/phim-da-luu/') {
    await renderSavedMovies(root);
    isRouting = false;
    return;
  }
  if (path.startsWith('/the-loai/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    // Always use combined filter - simplified routing
    const newParams = new URLSearchParams(params);
    newParams.set('category', slug);
    await renderCombinedFilter(root, newParams);
    isRouting = false;
    return;
  }
  if (path.startsWith('/quoc-gia/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    // Always use combined filter - simplified routing
    const newParams = new URLSearchParams(params);
    newParams.set('country', slug);
    await renderCombinedFilter(root, newParams);
    isRouting = false;
    return;
  }
  if (path.startsWith('/nam/')) {
    const year = decodeURIComponent(path.split('/')[2] || '');
    // Always use combined filter - simplified routing
    const newParams = new URLSearchParams(params);
    newParams.set('year', year);
    await renderCombinedFilter(root, newParams);
    isRouting = false;
    return;
  }
  if (path.startsWith('/phim/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderDetail(root, slug);
    isRouting = false;
    return;
  }
  if (path.startsWith('/xem/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderWatch(root, slug, params);
    isRouting = false;
    return;
  }
  root.textContent = 'Trang không tồn tại.';
  isRouting = false;
}

(function main() {
  initTheme();
  bindHeader();
  populateFilters();
  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
  router();
  
  // Khởi động notification system
  initNotificationSystem();
  
  // Initialize simple cache clearing shortcut
  initCacheClearShortcut();
})();

// Simple cache clearing shortcut
function initCacheClearShortcut() {
  // Clean up old performance dashboard localStorage items
  localStorage.removeItem('perfDashboardHidden');
  localStorage.removeItem('perfButtonVisible');
  
  // Add keyboard shortcut to clear caches only
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+P: Clear caches
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      apiCache.clear();
      if (imageLoader?.cache) imageLoader.cache.clear();
      
      // Show simple notification
      const notification = createEl('div', '');
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--primary);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10001;
        font-weight: 500;
        font-size: 14px;
        animation: fadeInOut 2s ease forwards;
      `;
      notification.textContent = '🧹 Caches cleared!';
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 2000);
    }
  });
  
  // Add simple CSS animation for notification
  if (!document.getElementById('cache-clear-animation')) {
    const style = document.createElement('style');
    style.id = 'cache-clear-animation';
    style.textContent = `
      @keyframes fadeInOut {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
        20%, 80% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// 🔔 New Notification System
async function initNotificationSystem() {
  try {
    console.log('🔔 Initializing notification system...');

    // Wait for Firebase to be ready
    if (window.movieComments) {
      await window.movieComments.init();
      console.log('✅ Firebase initialized for notifications');
    }

    // Initialize notification UI
    if (window.notificationUI) {
      await window.notificationUI.init('.header__actions');
      console.log('✅ Notification UI initialized');
    } else {
      console.warn('⚠️ Notification UI module not loaded');
      // Fallback to old system
      initLegacyNotificationSystem();
    }
  } catch (error) {
    console.error('❌ Notification system init failed:', error);
    // Fallback to old system
    initLegacyNotificationSystem();
  }
}

// Legacy notification system as fallback
function initLegacyNotificationSystem() {
  createNotificationContainer();
  checkForUpdates();

  // Kiểm tra cập nhật mỗi 2 phút (chỉ local, không chạy trên production)
  if (!window.location.hostname.includes('github.io') && window.location.hostname !== 'localhost') {
    setInterval(checkForUpdates, 2 * 60 * 1000);
  }
}

function createNotificationContainer() {
  if (document.getElementById('notification-container')) return;
  
  const container = createEl('div', 'notification-container');
  container.id = 'notification-container';
  document.body.appendChild(container);
}

async function checkForUpdates() {
  try {
    const response = await fetch('./data/latest-notification.json');
    if (!response.ok) return;
    
    const notification = await response.json();
    
    // Kiểm tra xem đã hiển thị notification này chưa
    const lastShown = localStorage.getItem('last-notification-timestamp');
    if (lastShown === notification.timestamp) return;
    
    if (notification.hasUpdates) {
      showNotification(notification);
      localStorage.setItem('last-notification-timestamp', notification.timestamp);
    }
    
  } catch (error) {
    // Silent fail - file có thể chưa tồn tại
  }
}

function showNotification(notification) {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notificationEl = createEl('div', 'notification notification--success');
  
  notificationEl.innerHTML = `
    <div class="notification__icon">🔔</div>
    <div class="notification__content">
      <div class="notification__title">Cập nhật mới!</div>
      <div class="notification__message">${notification.message}</div>
      <div class="notification__time">${new Date(notification.timestamp).toLocaleString('vi-VN')}</div>
    </div>
    <button class="notification__close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(notificationEl);
  
  // Tự động ẩn sau 10 giây
  setTimeout(() => {
    if (notificationEl.parentNode) {
      notificationEl.classList.add('notification--fade-out');
      setTimeout(() => notificationEl.remove(), 300);
    }
  }, 10000);
  
  // Hiệu ứng slide in
  setTimeout(() => notificationEl.classList.add('notification--show'), 100);
}

// 🎬 MOVIE BANNER SLIDER SYSTEM
class MovieBannerSlider {
  constructor(container) {
    this.container = container;
    this.slides = [];
    this.currentIndex = 0;
    this.isAutoPlaying = true;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 5000; // 5 seconds
    this.isTransitioning = false;
    
    this.init();
  }
  
  async init() {
    try {
      Logger.debug('MovieBannerSlider init started...');
      // Show loading state
      this.showLoading();
      Logger.debug('Loading state shown');

      // Fetch banner movies
      Logger.debug('Fetching banner movies...');
      const movies = await this.fetchBannerMovies();
      Logger.debug('Movies fetched:', movies.length);

      if (movies.length === 0) {
        Logger.error('No movies found for banner');
        this.showError('Không thể tải banner phim');
        return;
      }

      // Setup slider
      this.slides = movies;
      Logger.debug('Rendering banner...');
      this.render();
      Logger.debug('Binding events...');
      this.bindEvents();
      Logger.debug('Starting autoplay...');
      this.startAutoPlay();

      Logger.info(`Banner slider initialized successfully with ${movies.length} movies`);

    } catch (error) {
      Logger.error('Banner slider init failed:', error);
      this.showError('Lỗi tải banner');
    }
  }
  
  async fetchBannerMovies() {
    try {
      // Get latest movies for banner
      const result = await Api.getLatest(1);
      
      // Use extractItems to handle different API response formats
      const items = extractItems(result);
      
      if (!items || items.length === 0) {
        throw new Error('No movies data');
      }
      
      // Get daily rotation of 6 movies based on current date
      const dailyMovies = this.getDailyMovieSelection(items);
      const movies = dailyMovies.map(movie => ({
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        poster_url: processImageUrl(movie.poster_url || movie.thumb_url),
        year: movie.year,
        quality: movie.quality,
        lang: movie.lang,
        episode_current: movie.episode_current,
        content: movie.content || movie.description || 'Bộ phim hấp dẫn đang chờ bạn khám phá...',
        category: movie.category?.map(cat => cat.name).join(', ') || 'Phim hay'
      }));
      
      return movies;
      
    } catch (error) {
      Logger.error('Failed to fetch banner movies:', error);
      return [];
    }
  }

  getDailyMovieSelection(items) {
    // Get current date as seed for daily rotation
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // Create a pseudo-random seed based on date
    const seed = dayOfYear * 7 + today.getFullYear();
    
    // Shuffle array based on daily seed
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return first 6 movies from shuffled array
    return shuffled.slice(0, 6);
  }

  seededRandom(seed) {
    // Simple seeded random function
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  showLoading() {
    this.container.innerHTML = `
      <div class="banner-loading">
        🎬 Đang tải banner phim...
      </div>
    `;
  }
  
  showError(message) {
    this.container.innerHTML = `
      <div class="banner-loading">
        ❌ ${message}
      </div>
    `;
  }
  
  render() {
    if (this.slides.length === 0) return;
    
    const slidesHtml = this.slides.map((movie, index) => `
      <div class="banner-slide ${index === 0 ? 'active' : ''}" 
           data-index="${index}"
           data-slug="${movie.slug}"
           style="background-image: url('${movie.poster_url}')">
        <div class="banner-content">
          <h2 class="banner-title">${this.escapeHtml(movie.name)}</h2>
          <div class="banner-meta">
            ${movie.year ? `<span class="banner-year">${movie.year}</span>` : ''}
            ${movie.quality ? `<span class="banner-quality">${movie.quality}</span>` : ''}
            ${movie.episode_current ? `<span class="banner-episode">${movie.episode_current}</span>` : ''}
          </div>
          <p class="banner-description">${this.escapeHtml(this.truncateText(movie.content, 150))}</p>
          <div class="banner-actions">
            <a href="#/phim/${movie.slug}" class="banner-btn banner-btn--primary" data-movie-slug="${movie.slug}">
              ▶️ Xem ngay
            </a>
            <button class="banner-btn banner-btn--secondary" data-movie-slug="${movie.slug}">
              ❤️ Lưu phim
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
    const thumbnailsHtml = this.slides.map((movie, index) => `
      <div class="banner-thumbnail ${index === 0 ? 'active' : ''}"
           data-index="${index}"
           aria-label="${movie.name}">
        <img src="${movie.poster_url || '/assets/images/no-poster.svg'}" alt="${movie.name}" loading="lazy" onerror="this.src='/assets/images/no-poster.svg'">
      </div>
    `).join('');
    
    this.container.innerHTML = `
      <div class="banner-slider">
        ${slidesHtml}
        
        <div class="banner-thumbnails">
          ${thumbnailsHtml}
        </div>
      </div>
    `;
    
    // Preload next few images
    this.preloadImages();
  }
  
  bindEvents() {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      // Thumbnail navigation
      const thumbnails = this.container.querySelectorAll('.banner-thumbnail');
      thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
          const index = parseInt(thumbnail.dataset.index);
          this.goToSlide(index);
        });
      });
      
      // Save movie buttons with improved error handling
      const saveButtons = this.container.querySelectorAll('.banner-btn--secondary');
      Logger.debug(`Found ${saveButtons.length} save buttons in banner`);

      saveButtons.forEach((btn, index) => {
        Logger.debug(`Binding event to save button ${index + 1}:`, btn.dataset.movieSlug);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const slug = btn.dataset.movieSlug;
          Logger.debug(`Save button clicked for movie: ${slug}`);

          if (slug && typeof window.toggleSaveMovie === 'function') {
            window.toggleSaveMovie(slug);
          } else {
            Logger.error('Missing slug or toggleSaveMovie function:', { slug, toggleSaveMovie: typeof window.toggleSaveMovie });
          }
        });
      });
      
      // Watch movie buttons
      const watchButtons = this.container.querySelectorAll('.banner-btn--primary');
      watchButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const slug = btn.dataset.movieSlug;
          if (slug) {
            window.location.hash = `#/phim/${slug}`;
          }
        });
      });
      
      // Mobile Touch/Swipe Support
      this.addTouchSupport();
      
      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          this.previousSlide();
        } else if (e.key === 'ArrowRight') {
          this.nextSlide();
        }
      });
      
      // Pause on hover (desktop only)
      if (!this.isMobile()) {
        this.container.addEventListener('mouseenter', () => {
          this.pauseAutoPlay();
        });
        
        this.container.addEventListener('mouseleave', () => {
          this.startAutoPlay();
        });
      }
      
    }, 100);
  }

  // Mobile detection
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  }

  // Add touch/swipe support for mobile
  addTouchSupport() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isScrolling = false;
    
    const slider = this.container.querySelector('.banner-slider');
    if (!slider) return;
    
    // Touch start
    slider.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isScrolling = false;
      
      // Pause autoplay during touch
      this.pauseAutoPlay();
    }, { passive: true });
    
    // Touch move - detect if user is scrolling vertically
    slider.addEventListener('touchmove', (e) => {
      if (isScrolling) return;
      
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);
      
      // If vertical scroll is more prominent, don't interfere
      if (deltaY > deltaX && deltaY > 10) {
        isScrolling = true;
        return;
      }
      
      // Prevent default for horizontal swipes
      if (deltaX > 10) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Touch end - handle swipe
    slider.addEventListener('touchend', (e) => {
      if (isScrolling) {
        this.startAutoPlay();
        return;
      }
      
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaTime = endTime - startTime;
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Swipe thresholds
      const minDistance = 50;
      const maxTime = 500;
      const minVelocity = 0.1;
      
      if (Math.abs(deltaX) > minDistance && deltaTime < maxTime && velocity > minVelocity) {
        if (deltaX > 0) {
          // Swipe right - previous slide
          this.previousSlide();
        } else {
          // Swipe left - next slide
          this.nextSlide();
        }
      }
      
      // Resume autoplay after a delay
      setTimeout(() => {
        this.startAutoPlay();
      }, 1000);
    }, { passive: true });
    
    // Handle thumbnail touch scrolling
    const thumbnails = this.container.querySelector('.banner-thumbnails');
    if (thumbnails) {
      thumbnails.addEventListener('touchstart', (e) => {
        this.pauseAutoPlay();
      }, { passive: true });
      
      thumbnails.addEventListener('touchend', () => {
        setTimeout(() => {
          this.startAutoPlay();
        }, 1000);
      }, { passive: true });
    }
  }
  
  previousSlide() {
    if (this.isTransitioning) return;
    
    this.currentIndex = this.currentIndex === 0 ? this.slides.length - 1 : this.currentIndex - 1;
    this.updateSlide();
    this.resetAutoPlay();
  }
  
  nextSlide() {
    if (this.isTransitioning) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.updateSlide();
    this.resetAutoPlay();
  }
  
  goToSlide(index) {
    if (this.isTransitioning || index === this.currentIndex) return;
    
    this.currentIndex = index;
    this.updateSlide();
    this.resetAutoPlay();
  }
  
  updateSlide() {
    this.isTransitioning = true;
    
    const slides = this.container.querySelectorAll('.banner-slide');
    const thumbnails = this.container.querySelectorAll('.banner-thumbnail');
    
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentIndex);
    });
    
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.classList.toggle('active', index === this.currentIndex);
    });
    
    // Reset transition flag after animation
    setTimeout(() => {
      this.isTransitioning = false;
    }, 600);
    
    // Preload next image
    this.preloadNextImage();
  }
  
  preloadImages() {
    // Only preload first image immediately, others on demand
    if (this.slides.length > 0) {
      const img = new Image();
      img.src = this.slides[0].poster_url || '/assets/images/no-poster.svg';
      img.onerror = () => img.src = '/assets/images/no-poster.svg';
    }

    // Preload second image after a delay
    if (this.slides.length > 1) {
      requestAnimationFrame(() => {
        const img = new Image();
        img.src = this.slides[1].poster_url || '/assets/images/no-poster.svg';
        img.onerror = () => img.src = '/assets/images/no-poster.svg';
      });
    }
  }
  
  preloadNextImage() {
    const nextIndex = (this.currentIndex + 1) % this.slides.length;
    const nextMovie = this.slides[nextIndex];

    if (nextMovie) {
      const img = new Image();
      img.src = nextMovie.poster_url || '/assets/images/no-poster.svg';
      img.onerror = () => img.src = '/assets/images/no-poster.svg';
    }
  }
  
  startAutoPlay() {
    if (!this.isAutoPlaying || this.slides.length <= 1) return;
    
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDelay);
  }
  
  pauseAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
  
  resumeAutoPlay() {
    if (this.isAutoPlaying && !this.autoPlayInterval) {
      this.startAutoPlay();
    }
  }
  
  resetAutoPlay() {
    this.pauseAutoPlay();
    this.resumeAutoPlay();
  }
  
  stopAutoPlay() {
    this.isAutoPlaying = false;
    this.pauseAutoPlay();
  }
  
  // Utility methods
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
  
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
  }
  
  // Public API
  destroy() {
    this.stopAutoPlay();
    this.container.innerHTML = '';
  }
  
  refresh() {
    this.destroy();
    this.init();
  }
}

// Banner instance và helper function đã được di chuyển lên đầu file

// Initialize banner when DOM is ready with performance checks
function initMovieBanner() {
  const bannerContainer = document.querySelector('.movie-banner');
  if (bannerContainer && !movieBanner && bannerContainer.isConnected) {
    // Check if we're on home page to avoid unnecessary initialization
    const currentHash = window.location.hash;
    if (currentHash === '' || currentHash === '#/' || currentHash === '#') {
      movieBanner = new MovieBannerSlider(bannerContainer);
    }
  }
}

// Global function to toggle save movie (for banner buttons)
window.toggleSaveMovie = async function(slug) {
  try {
    Logger.debug(`toggleSaveMovie called for: ${slug}`);

    const isSaved = await Storage.isMovieSaved(slug);
    Logger.debug(`Current saved state: ${isSaved}`);

    if (isSaved) {
      await Storage.removeSavedMovie(slug);
      showNotification('💔 Đã xóa khỏi danh sách yêu thích');
      Logger.debug(`Movie removed: ${slug}`);
    } else {
      // Get movie details first
      Logger.debug(`Fetching movie data`);
      const movieData = await Api.getMovie(slug);
      Logger.debug(`Movie data retrieved successfully`);
      
      // Handle different API response structures
      let movieItem = null;
      if (movieData?.data?.item) {
        movieItem = movieData.data.item;
      } else if (movieData?.movie) {
        movieItem = movieData.movie;
      } else if (movieData?.data) {
        movieItem = movieData.data;
      } else if (movieData && typeof movieData === 'object' && movieData.slug) {
        movieItem = movieData;
      }
      
      if (movieItem) {
        await Storage.saveMovie(movieItem);
        showNotification('❤️ Đã thêm vào danh sách yêu thích');
        Logger.debug(`Movie saved: ${slug}`);
      } else {
        Logger.error('No movie data found for:', slug, 'Response:', movieData);
        
        // Fallback: Create minimal movie object from banner data
        const bannerSlide = document.querySelector(`[data-slug="${slug}"]`);
        if (bannerSlide) {
          const title = bannerSlide.querySelector('.banner-title')?.textContent || slug;
          const posterUrl = bannerSlide.style.backgroundImage?.match(/url\("?([^"]*)"?\)/)?.[1] || '';
          
          const fallbackMovie = {
            slug: slug,
            name: title,
            poster_url: posterUrl,
            origin_name: title,
            year: new Date().getFullYear(),
            quality: 'HD',
            episode_current: 'Tập 1',
            content: 'Phim được lưu từ banner slider'
          };

          Logger.debug(`Using fallback movie data:`, fallbackMovie);
          await Storage.saveMovie(fallbackMovie);
          showNotification('❤️ Đã thêm vào danh sách yêu thích (dữ liệu tạm thời)');
          Logger.debug(`Movie saved with fallback data: ${slug}`);
        } else {
          throw new Error('Không tìm thấy thông tin phim');
        }
      }
    }
    
    // Update all banner buttons for this movie
    const bannerButtons = document.querySelectorAll(`.banner-btn--secondary[data-movie-slug="${slug}"]`);
    bannerButtons.forEach(btn => {
      const newIsSaved = !isSaved; // Toggle state
      btn.textContent = newIsSaved ? '💔 Bỏ lưu' : '❤️ Lưu phim';
    });
    
  } catch (error) {
    Logger.error('Toggle save movie failed:', error);
    showNotification('❌ Có lỗi xảy ra. Vui lòng thử lại.');
    throw error; // Re-throw for button error handling
  }
};

// Auto-initialize banner on page load - DISABLED
// Banner giờ được quản lý bởi renderHome() và renderCombinedFilter()
// document.addEventListener('DOMContentLoaded', () => {
//   Logger.debug('DOMContentLoaded, but banner init is now handled by render functions');
// });

// Re-initialize banner when navigating (for SPA) - DISABLED
// Để tránh xung đột với logic banner trong renderHome() và renderCombinedFilter()
// window.addEventListener('hashchange', () => {
//   Logger.debug('Hash changed, but banner management is now handled by render functions');
// });