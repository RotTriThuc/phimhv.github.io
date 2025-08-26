/* XemPhim SPA with Secure API Proxy */

// SECURITY: API endpoints are now hidden behind proxy layer
// Real endpoints are protected in api-proxy.js

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
    this.maxSize = 50; // Reduced cache size for better memory usage
    
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
async function fetchWithRetries(url, maxRetries = 3, timeout = 10000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
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
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
      
    } catch (error) {
      lastError = error;
      console.warn(`🔄 Request attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
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
      console.warn('🚨 No image source found for element:', imgElement);
      return;
    }
    
    // Ensure element is in DOM before processing
    if (!imgElement.parentNode || !document.contains(imgElement)) {
      console.warn('🚨 Image element not in DOM, skipping load');
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
    setTimeout(() => {
      this.setBlurredPreview(imgElement);
    }, 10);
    
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
      console.warn('🚨 All CDNs failed for:', originalSrc, error);
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
      console.warn('🚨 Cannot set blur preview: invalid element or no parent');
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
      console.warn('🚨 Failed to add blur preview:', error);
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
      console.warn('🚨 Invalid parameters for setImageSrc:', { imgElement, url });
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
      console.warn('🚨 Failed to set image source:', error);
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
      
      // Load visible images with slight delay to avoid blocking
      visibleImages.forEach((img, index) => {
        setTimeout(() => this.loadImage(img), index * 50);
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
  console.error('🚨 Failed to initialize image loader:', error);
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
  console.warn('🚨 Failed to initialize performance monitor:', error);
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
  console.warn('🚨 Failed to initialize network indicator:', error);
  // Continue without network indicator
}

// System initialization status
console.log('🎉 Image Loading System V2 Initialized Successfully!');
console.log('📊 Components Status:', {
  imageLoader: !!imageLoader,
  performanceMonitor: !!performanceMonitor,
  networkIndicator: !!networkIndicator
});

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
        console.log('📦 Using cached movies:', this._savedMoviesCache.length);
        return this._savedMoviesCache;
      }

      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        console.warn('⚠️ Firebase not ready, waiting for initialization...');

        // Wait a bit for Firebase to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!window.movieComments || !window.movieComments.initialized) {
          console.warn('⚠️ Firebase still not ready, returning empty array');
          return [];
        }
      }

      console.log('🔥 Loading movies from Firebase...');
      const movies = await window.movieComments.getSavedMovies();

      // Update cache
      this._savedMoviesCache = movies;
      this._lastCacheUpdate = Date.now();

      console.log(`✅ Loaded ${movies.length} movies from Firebase`);
      return movies;

    } catch (error) {
      console.error('❌ Get saved movies failed:', error);

      // No localStorage fallback - return empty array
      console.warn('⚠️ Firebase error, returning empty array (no localStorage fallback)');
      return [];
    }
  },

  async saveMovie(movie) {
    try {
      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        console.warn('⚠️ Firebase not ready, cannot save movie');
        throw new Error('Firebase chưa sẵn sàng. Vui lòng thử lại sau.');
      }

      const success = await window.movieComments.saveMovie(movie);

      // Clear cache to force refresh
      this._savedMoviesCache = null;

      console.log(`✅ Movie saved to Firebase: ${movie.name || movie.slug}`);
      return success;
    } catch (error) {
      console.error('❌ Save movie to Firebase failed:', error);
      throw error; // No localStorage fallback
    }
  },

  async removeSavedMovie(slug) {
    try {
      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        console.warn('⚠️ Firebase not ready, cannot remove movie');
        throw new Error('Firebase chưa sẵn sàng. Vui lòng thử lại sau.');
      }

      const success = await window.movieComments.removeSavedMovie(slug);

      // Clear cache to force refresh
      this._savedMoviesCache = null;
      this._lastCacheUpdate = 0;

      console.log(`✅ Movie removed from Firebase: ${slug}`);
      return success;
    } catch (error) {
      console.error('❌ Remove movie from Firebase failed:', error);
      throw error; // No localStorage fallback
    }
  },

  async isMovieSaved(slug) {
    try {
      // ONLY use Firebase - no localStorage fallback
      if (!window.movieComments || !window.movieComments.initialized) {
        console.warn('⚠️ Firebase not ready, cannot check if movie is saved');
        return false;
      }

      // Check cache first for performance
      if (this._savedMoviesCache && Date.now() - this._lastCacheUpdate < this._cacheExpiry) {
        return this._savedMoviesCache.some(m => m.slug === slug);
      }

      return await window.movieComments.isMovieSaved(slug);
    } catch (error) {
      console.error('❌ Check movie saved failed:', error);
      return false; // No localStorage fallback
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
      console.error('❌ Get watch progress failed, using localStorage:', error);
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
      console.error('❌ Set watch progress failed, using localStorage:', error);
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
      console.error('❌ Get movie progress failed, using localStorage:', error);
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
      console.error('❌ Clear watch progress failed, using localStorage:', error);
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
      console.error('❌ Clear all saved movies failed:', error);
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

// Optimized image setup helper
function setupImageElement(imgEl, container) {
  if (!imgEl) return;

  imgEl.referrerPolicy = 'no-referrer';
  imgEl.loading = 'lazy';
  imgEl.style.opacity = '0';

  requestAnimationFrame(() => {
    if (!document.contains(imgEl)) return;

    try {
      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight + 300) {
        imageLoader.loadImage(imgEl);
      } else {
        imageLoader.observe(imgEl);
      }
    } catch (error) {
      imageLoader.observe(imgEl);
    }
  });
}

function movieCard(movie) {
  const poster = movie.poster_url || movie.thumb_url || '';
  const languages = movie.lang || movie.language || '';
  const title = movie.name || movie.origin_name || 'Không tên';
  const year = movie.year || '';
  const slug = movie.slug;

  const card = createEl('article', 'card');
  
  // Check if movie is saved and has progress (async) - optimized
  Promise.allSettled([
    Storage.isMovieSaved(slug),
    Storage.getMovieProgress(slug)
  ]).then(([savedResult, progressResult]) => {
    if (savedResult.status === 'fulfilled' && savedResult.value && !card.querySelector('.card__badge--saved')) {
      const savedBadge = createEl('span', 'card__badge card__badge--saved', '❤️');
      card.appendChild(savedBadge);
    }

    if (progressResult.status === 'fulfilled' && progressResult.value && !card.querySelector('.card__badge--progress')) {
      const prog = progressResult.value;
      const displayName = formatEpisodeName(prog.episodeName, prog.episodeSlug);
      const progressBadge = createEl('span', 'card__badge card__badge--progress', `▶ ${displayName}`);
      card.appendChild(progressBadge);
    }
  }).catch(error => {
    console.warn('⚠️ Error checking movie status:', error);
  });
  
  const badges = [];
  if (languages) badges.push(`<span class="card__badge">${languages}</span>`);

  card.innerHTML = `
    ${badges.join('')}
    <div class="card__img-container">
      <img class="card__img" alt="${title}" data-src="${poster}">
    </div>
    <div class="card__meta">
      <h3 class="card__title">${title}</h3>
      <div class="card__sub">${year || ''}</div>
    </div>
  `;
  
  // Optimized image loading
  const imgEl = card.querySelector('.card__img');
  if (imgEl && poster) {
    setupImageElement(imgEl, card);
  }
  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!slug) {
      console.warn('⚠️ No slug found for movie:', movie);
      return;
    }

    // Immediate navigation without delay for better responsiveness
    navigateTo(`#/phim/${slug}`);

    // Add visual feedback after navigation starts
    card.style.transform = 'scale(0.98)';
    card.style.transition = 'transform 0.1s ease';
    requestAnimationFrame(() => {
      card.style.transform = '';
    });
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
        setTimeout(() => {
          try {
            imageLoader.batchLoadVisible();
          } catch (error) {
            console.warn('🚨 Error in batch loading:', error);
          }
        }, 50);
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
        console.warn('🧠 High memory usage detected:', Math.round(usagePercent) + '%');
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
    
    console.log('🧹 Memory cleanup completed');
  }
}

const Api = new APIManager();

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
  
  // Section 3: Hoạt hình
  await addSimpleSection(root, 'Hoạt hình', 'hoat-hinh', 6);
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
    console.warn('Không tải được', type, err);
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
          try {
            await loadPage(currentPage);
            loadMoreBtn.remove();
          } catch (error) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Thử lại';
            console.error('Load more failed:', error);
          }
        });
        moviesContainer.appendChild(loadMoreBtn);
      }
    } catch (e) {
      console.error(e);
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
    console.error(e);
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

  // Tên hiển thị cho type_list
  const typeNames = {
    'phim-bo': 'Phim Bộ',
    'phim-le': 'Phim Lẻ', 
    'hoat-hinh': 'Hoạt Hình',
    'tv-shows': 'TV Shows',
    'phim-vietsub': 'Phim Vietsub',
    'phim-thuyet-minh': 'Phim Thuyết Minh',
    'phim-long-tieng': 'Phim Lồng Tiếng'
  };
  
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
    console.error(e);
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

    const posterUrl = movie.poster_url || movie.thumb_url;
    const poster = createEl('img', 'detail__poster');
    poster.referrerPolicy = 'no-referrer';
    poster.alt = movie.name || 'Poster';
    poster.dataset.src = posterUrl;
    poster.style.opacity = '0'; // Start hidden
    
    // Create container for poster if needed
    const posterContainer = createEl('div', 'detail__poster-container');
    posterContainer.style.position = 'relative';
    posterContainer.appendChild(poster);

    const meta = createEl('div', 'detail__meta');
    const title = createEl('h1', 'detail__title', movie.name || 'Không tên');
    const countriesHtml = (movie.country || [])
      .map(c => `<a href="#/quoc-gia/${encodeURIComponent(c.slug || '')}">${c.name}</a>`)
      .join(', ') || '—';
    const categoriesHtml = (movie.category || movie.categories || [])
      .map(c => `<a href="#/the-loai/${encodeURIComponent(c.slug || '')}">${c.name}</a>`)
      .join(', ') || '—';
    const info = createEl('div', '', `
      <div class="detail__line">Năm: <a href="#/nam/${movie.year || ''}"><strong>${movie.year || '—'}</strong></a></div>
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
      console.warn('⚠️ Error getting movie progress:', error);
    });

    // Nút lưu/bỏ lưu phim (async)
    const saveBtn = createEl('button', 'btn btn--save', '❤️ Lưu phim');

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
        console.error('❌ Save/remove movie failed:', error);
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

    // Add movie comments section
    if (window.movieComments) {
      try {
        window.movieComments.renderCommentSection(root, slug);
      } catch (error) {
        console.warn('Could not load movie comments:', error);
      }
    }
  } catch (e) {
    console.error(e);
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
    root.appendChild(eps);
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được dữ liệu phát.', () => renderWatch(root, slug, params)));
  }
}

async function renderCategory(root, slug, params) {
  const page = Number(params.get('page') || '1');
  const year = params.get('year') || '';
  const country = params.get('country') || '';

  root.innerHTML = '';

  const category = Categories.findBySlug(slug);
  const categoryName = category ? category.name : slug;

  // Tạo title với filters
  let title = `Thể loại: ${categoryName}`;
  if (year) title += ` - Năm ${year}`;
  if (country) title += ` - ${country}`;

  root.appendChild(sectionHeader(title));

  const loading = renderLoadingCards(12);
  root.appendChild(loading);

  try {
    const data = await Api.listByCategory({ slug, page, year, country, limit: 24 });
    safeRemove(loading);
    const items = extractItems(data);
    
    if (items.length === 0) {
      const noMovies = createEl('div', '', 'Chưa có phim nào trong thể loại này.');
      noMovies.style.cssText = 'text-align:center;padding:40px;color:var(--muted);';
      root.appendChild(noMovies);
      return;
    }
    
    // Hiển thị số lượng phim
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;
    
    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} phim ${categoryName} - Trang ${currentPage}/${totalPages}`);
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
        params.set('page', String(nextPage));
        navigateTo(`#/the-loai/${slug}?${params.toString()}`);
      });
      root.appendChild(pager);
    }
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách thể loại.', () => renderCategory(root, slug, params)));
  }
}

async function renderCountry(root, slug, params) {
  const page = Number(params.get('page') || '1');
  const year = params.get('year') || '';
  const category = params.get('category') || '';

  root.innerHTML = '';

  // Tạo title với filters
  let title = `Quốc gia: ${slug}`;
  if (year) title += ` - Năm ${year}`;
  if (category) title += ` - ${category}`;

  root.appendChild(sectionHeader(title));
  const loading = renderLoadingCards(12);
  root.appendChild(loading);
  try {
    const data = await Api.listByCountry({ slug, page, year, category });
    safeRemove(loading);
    const items = extractItems(data);

    // Hiển thị số lượng phim
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;

    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} phim từ ${slug} - Trang ${currentPage}/${totalPages}`);
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
        params.set('page', String(nextPage));
        navigateTo(`#/quoc-gia/${slug}?${params.toString()}`);
      });
      root.appendChild(pager);
    }
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách quốc gia.', () => renderCountry(root, slug, params)));
  }
}

async function renderYear(root, year, params) {
  const page = Number(params.get('page') || '1');
  const category = params.get('category') || '';
  const country = params.get('country') || '';

  root.innerHTML = '';

  // Tạo title với filters
  let title = `Năm: ${year}`;
  if (category) title += ` - ${category}`;
  if (country) title += ` - ${country}`;

  root.appendChild(sectionHeader(title));
  const loading = renderLoadingCards(12);
  root.appendChild(loading);
  try {
    const data = await Api.listByYear({ year, page, category, country });
    safeRemove(loading);
    const items = extractItems(data);

    // Hiển thị số lượng phim
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;

    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} phim năm ${year} - Trang ${currentPage}/${totalPages}`);
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
        params.set('page', String(nextPage));
        navigateTo(`#/nam/${year}?${params.toString()}`);
      });
      root.appendChild(pager);
    }
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách theo năm.', () => renderYear(root, year, params)));
  }
}

/* Optimized header controls with event delegation */
function bindHeader() {
  // Use event delegation for better performance
  document.addEventListener('click', (e) => {
    const target = e.target;

    // Home button
    if (target.id === 'homeBtn' || target.closest('#homeBtn')) {
      e.preventDefault();
      navigateTo('#/');
      return;
    }

    // Quick nav buttons
    if (target.classList.contains('nav__btn') || target.closest('.nav__btn')) {
      e.preventDefault();
      const btn = target.classList.contains('nav__btn') ? target : target.closest('.nav__btn');
      const type = btn.getAttribute('data-quick');
      if (type) {
        navigateTo(`#/loc?type_list=${encodeURIComponent(type)}`);
      }
      return;
    }

    // Theme toggle
    if (target.id === 'themeToggle' || target.closest('#themeToggle')) {
      e.preventDefault();
      toggleTheme();
      return;
    }
  });

  // Search form
  const form = $('#searchForm');
  const input = $('#searchInput');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input?.value || '').trim();
    if (!q) return;
    const params = new URLSearchParams({ keyword: q, page: '1' });
    navigateTo(`#/tim-kiem?${params.toString()}`);
  });
}

// Smart navigation helper để giữ context khi chọn filters
function getSmartNavigationUrl(filterType, filterValue) {
  const { path, params } = parseHash();

  if (path.startsWith('/the-loai/')) {
    // Đang ở trang thể loại - giữ thể loại và thêm filter
    const slug = path.split('/')[2];
    if (filterType === 'year') {
      params.set('year', filterValue);
    } else if (filterType === 'country') {
      params.set('country', filterValue);
    }
    return `#/the-loai/${slug}?${params.toString()}`;
  } else if (path.startsWith('/quoc-gia/')) {
    // Đang ở trang quốc gia - giữ quốc gia và thêm filter
    const slug = path.split('/')[2];
    if (filterType === 'year') {
      params.set('year', filterValue);
    } else if (filterType === 'category') {
      params.set('category', filterValue);
    }
    return `#/quoc-gia/${slug}?${params.toString()}`;
  } else if (path.startsWith('/nam/')) {
    // Đang ở trang năm - giữ năm và thêm filter
    const year = path.split('/')[2];
    if (filterType === 'country') {
      params.set('country', filterValue);
    } else if (filterType === 'category') {
      params.set('category', filterValue);
    }
    return `#/nam/${year}?${params.toString()}`;
  }

  // Default behavior - navigate to specific filter page
  if (filterType === 'year') {
    return `#/nam/${encodeURIComponent(filterValue)}`;
  } else if (filterType === 'country') {
    return `#/quoc-gia/${encodeURIComponent(filterValue)}`;
  }

  return '#/';
}

// Sync dropdown values với URL parameters
function syncDropdownsWithURL() {
  const { path, params } = parseHash();
  const countrySelect = $('#countrySelect');
  const yearSelect = $('#yearSelect');

  // Reset dropdowns
  if (countrySelect) countrySelect.value = '';
  if (yearSelect) yearSelect.value = '';

  // Set values based on current URL
  if (path.startsWith('/quoc-gia/')) {
    const slug = path.split('/')[2];
    if (countrySelect) countrySelect.value = slug;
  } else if (params.get('country')) {
    if (countrySelect) countrySelect.value = params.get('country');
  }

  if (path.startsWith('/nam/')) {
    const year = path.split('/')[2];
    if (yearSelect) yearSelect.value = year;
  } else if (params.get('year')) {
    if (yearSelect) yearSelect.value = params.get('year');
  }
}

async function populateFilters() {
  const countrySelect = $('#countrySelect');
  const yearSelect = $('#yearSelect');

  try {
    const countries = await Api.getCountries().catch(() => []);

    if (Array.isArray(countries)) {
      countries.forEach(c => {
        const opt = createEl('option');
        opt.value = c.slug || c.id || '';
        opt.textContent = c.name || c.title || '';
        countrySelect?.appendChild(opt);
      });
    }

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      const opt = createEl('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect?.appendChild(opt);
    }

    countrySelect?.addEventListener('change', () => {
      const v = countrySelect.value;
      if (v) {
        const url = getSmartNavigationUrl('country', v);
        navigateTo(url);
      }
    });
    yearSelect?.addEventListener('change', () => {
      const v = yearSelect.value;
      if (v) {
        const url = getSmartNavigationUrl('year', v);
        navigateTo(url);
      }
    });
  } catch (e) {
    console.warn('Không tải được bộ lọc', e);
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
  console.log('🔄 Refreshing saved movies after sync...');

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
        console.log('🎬 Re-rendering saved movies page...');

        // Force clear the app element first
        appElement.innerHTML = '';
        appElement.removeAttribute('data-rendering');

        // Re-render with fresh data
        await window.renderSavedMovies(appElement);
        console.log('✅ Saved movies page re-rendered');
      }
    }

    console.log('✅ Saved movies refresh completed');
  } catch (error) {
    console.error('❌ Error refreshing saved movies:', error);
  }
};

// 🚀 Immediate refresh without page reload
window.immediateRefreshSavedMovies = async function() {
  console.log('🚀 Immediate refresh of saved movies...');

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
      console.log(`🎬 Immediate refresh found ${movies.length} movies`);
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
          console.log('✅ UI refreshed immediately');
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Immediate refresh failed:', error);
    return false;
  }
};

// Render trang phim đã lưu
async function renderSavedMovies(root) {
  if (root.dataset.rendering === 'saved-movies') {
    return;
  }

  clearRootCompletely(root);
  root.dataset.rendering = 'saved-movies';
  root.offsetHeight;

  // Show loading state
  const loadingHeader = sectionHeader('❤️ Phim đã lưu');
  root.appendChild(loadingHeader);

  const loadingState = createEl('div', 'loading-state');
  loadingState.style.cssText = 'text-align:center;padding:40px 20px;color:var(--muted);';
  loadingState.innerHTML = `
    <div style="font-size:32px;margin-bottom:16px;">⏳</div>
    <p>Đang tải danh sách phim đã lưu...</p>
    <div style="font-size:12px;margin-top:8px;">
      ${window.movieComments?.initialized ? 'Từ Firebase' : 'Từ bộ nhớ local'}
    </div>
  `;
  root.appendChild(loadingState);

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
          💡 Phim được lưu trên ${window.movieComments?.initialized ? 'Firebase - sync mọi thiết bị' : 'thiết bị này'}
        </div>
      `;
      root.appendChild(emptyState);

      // Add event listener for empty state sync button
      const emptySyncBtn = emptyState.querySelector('.sync-device-btn-empty');
      if (emptySyncBtn) {
        emptySyncBtn.addEventListener('click', () => {
          window.showCrossDeviceSync();
        });
      }

      delete root.dataset.rendering;
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
  root.appendChild(stats);
  
  // Sync status indicator with cross-device sync button
  const syncStatus = createEl('div', 'sync-status');
  syncStatus.style.cssText = 'margin-bottom:20px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:8px;font-size:13px;';

  const isFirebaseReady = window.movieComments?.initialized;
  const currentUser = isFirebaseReady ? window.movieComments.getUserName() : 'Khách';

  // Debug log
  console.log('🔍 Sync Button Debug - renderSavedMovies:', {
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
            ${isFirebaseReady ? 'Đồng bộ Firebase' : 'Đang kết nối Firebase'} • ${currentUser}
          </div>
          <div style="color:var(--muted);font-size:12px;">
            ${isFirebaseReady ?
              'Phim được sync trên mọi thiết bị và trình duyệt' :
              'Đang tải dữ liệu từ Firebase...'}
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
  root.appendChild(syncStatus);

  // Add F5 keyboard shortcut for Firebase + page refresh (only on saved movies page)
  const handleKeyPress = (event) => {
    if (event.key === 'F5' && window.location.hash === '#/phim-da-luu') {
      // Don't prevent default - let it reload page, but also clear Firebase cache first
      console.log('⌨️ F5 pressed on saved movies page - clearing Firebase cache before reload');

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
        console.log('🔄 Starting Firebase + Page refresh...');

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

        console.log('🗑️ Cleared all caches and localStorage');

        // Step 3: Show loading message
        if (window.showNotification) {
          window.showNotification({
            message: '🔄 Đang làm mới Firebase và trang web...',
            timestamp: new Date().toISOString()
          });
        }

        // Step 4: Wait a moment for cache clearing to take effect
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🌐 Reloading page for complete refresh...');

        // Step 5: Reload the entire page for complete refresh
        window.location.reload();

      } catch (error) {
        console.error('❌ Firebase + Page refresh failed:', error);

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
          console.error('Clear all failed:', error);
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
    root.appendChild(moviesGrid);

  } catch (error) {
    console.error('❌ Load saved movies failed:', error);
    safeRemove(loadingState);

    const errorState = createEl('div', 'error-state');
    errorState.style.cssText = 'text-align:center;padding:60px 20px;color:var(--muted);';
    errorState.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">❌</div>
      <h3 style="margin:0 0 8px 0;color:var(--text);">Không thể tải danh sách phim</h3>
      <p style="margin:0 0 20px 0;">Có lỗi xảy ra khi tải phim đã lưu</p>
      <button class="btn btn--ghost" onclick="renderSavedMovies(document.getElementById('app'))">Thử lại</button>
    `;
    root.appendChild(errorState);
  }

  delete root.dataset.rendering;
}

/* App bootstrap */
let isRouting = false;
let routingQueue = [];

async function router() {
  // Queue navigation if already routing
  if (isRouting) {
    const { path, params } = parseHash();
    routingQueue.push({ path, params, timestamp: Date.now() });
    return;
  }
  isRouting = true;
  
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

  // Sync dropdown values với URL hiện tại
  syncDropdownsWithURL();
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
    await renderFilterList(root, params);
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
    await renderCategory(root, slug, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/quoc-gia/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderCountry(root, slug, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/nam/')) {
    const year = decodeURIComponent(path.split('/')[2] || '');
    await renderYear(root, year, params);
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

  // Process queued navigation if any
  if (routingQueue.length > 0) {
    const nextRoute = routingQueue.shift();
    // Only process if it's recent (within 2 seconds)
    if (Date.now() - nextRoute.timestamp < 2000) {
      setTimeout(() => router(), 50);
    } else {
      // Clear old queued routes
      routingQueue = [];
    }
  }
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

// Notification System
function initNotificationSystem() {
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