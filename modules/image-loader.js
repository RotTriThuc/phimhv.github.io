/* Progressive Image Loading System */

import { Logger } from './logger.js';

// Performance monitoring for image loading
class ImagePerformanceMonitor {
  constructor() {
    this.loadTimes = [];
    this.successRate = 0;
    this.totalLoads = 0;
    this.successfulLoads = 0;
  }
  
  startTimer() {
    return performance.now();
  }
  
  recordLoad(startTime, success = true) {
    const loadTime = performance.now() - startTime;
    this.loadTimes.push(loadTime);
    this.totalLoads++;
    
    if (success) {
      this.successfulLoads++;
    }
    
    this.successRate = (this.successfulLoads / this.totalLoads) * 100;
    
    // Keep only last 100 measurements
    if (this.loadTimes.length > 100) {
      this.loadTimes.shift();
    }
  }
  
  getAverageLoadTime() {
    if (this.loadTimes.length === 0) return 0;
    return this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length;
  }
  
  getStats() {
    return {
      averageLoadTime: Math.round(this.getAverageLoadTime()),
      successRate: Math.round(this.successRate),
      totalLoads: this.totalLoads
    };
  }
}

// Global performance monitor
const performanceMonitor = new ImagePerformanceMonitor();

// Progressive Image Loader with advanced optimization
export class ProgressiveImageLoader {
  constructor() {
    this.cache = new Map();
    this.observer = null;
    this.cdnPerformance = new Map(); // Track CDN performance
    this.networkSpeed = 'fast'; // fast, medium, slow
    this.defaultQuality = 75;
    this.preloadLinks = new Set(); // Track preload links
    
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
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          this.networkSpeed = 'slow';
          this.defaultQuality = 50;
          break;
        case '3g':
          this.networkSpeed = 'medium';
          this.defaultQuality = 65;
          break;
        case '4g':
        default:
          this.networkSpeed = 'fast';
          this.defaultQuality = 75;
          break;
      }
      
      Logger.debug('Network speed detected:', this.networkSpeed, 'Quality:', this.defaultQuality);
    }
  }
  
  // Get optimized image URLs with multiple CDN fallbacks
  getOptimizedUrl(originalUrl, options = {}) {
    const { width = 300, quality = this.defaultQuality } = options;
    
    // Multiple CDN endpoints for redundancy
    const cdnEndpoints = [
      `https://img.phimapi.com/${width}x0/${quality}/${encodeURIComponent(originalUrl)}`,
      `https://cdn.phimapi.com/resize/${width}/${quality}/${encodeURIComponent(originalUrl)}`,
      originalUrl // Fallback to original
    ];
    
    // Sort by performance (fastest first)
    return cdnEndpoints.sort((a, b) => {
      const perfA = this.cdnPerformance.get(this.getCdnDomain(a)) || 1000;
      const perfB = this.cdnPerformance.get(this.getCdnDomain(b)) || 1000;
      return perfA - perfB;
    });
  }
  
  getCdnDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }
  
  recordCDNPerformance(url, loadTime) {
    const domain = this.getCdnDomain(url);
    const currentPerf = this.cdnPerformance.get(domain) || loadTime;
    // Weighted average: 70% current, 30% new measurement
    const newPerf = currentPerf * 0.7 + loadTime * 0.3;
    this.cdnPerformance.set(domain, newPerf);
  }
  
  // Set blurred preview while loading
  setBlurredPreview(imgElement) {
    if (!imgElement.dataset.src) return;
    
    // Create tiny blurred version (10px width)
    const tinyUrl = this.getOptimizedUrl(imgElement.dataset.src, { width: 10, quality: 20 })[0];
    
    // Set as background with blur
    imgElement.style.backgroundImage = `url(${tinyUrl})`;
    imgElement.style.backgroundSize = 'cover';
    imgElement.style.backgroundPosition = 'center';
    imgElement.style.filter = 'blur(5px)';
    imgElement.style.transition = 'filter 0.3s ease';
  }
  
  // Set final image source
  setImageSrc(imgElement, src) {
    imgElement.src = src;
    imgElement.style.filter = 'none'; // Remove blur
    imgElement.style.backgroundImage = 'none'; // Remove preview
    imgElement.classList.add('loaded');
  }
  
  // Main image loading function with advanced optimization
  async loadImage(imgElement) {
    if (!imgElement || imgElement.dataset.loaded === 'true') return;
    
    const originalSrc = imgElement.dataset.src;
    if (!originalSrc) return;
    
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
      Logger.warn('All CDNs failed for:', originalSrc, error);
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
        // Stagger requests by 50ms to avoid overwhelming
        setTimeout(() => {
          const img = new Image();
          const imgStartTime = performance.now();
          
          img.onload = () => {
            const loadTime = performance.now() - imgStartTime;
            this.recordCDNPerformance(url, loadTime);
            
            if (!hasResolved) {
              hasResolved = true;
              resolve(url);
            }
          };
          
          img.onerror = () => {
            const loadTime = performance.now() - imgStartTime;
            // Penalty for failed CDNs
            this.recordCDNPerformance(url, loadTime * 3);
            
            completed++;
            if (completed === urls.length && !hasResolved) {
              reject(new Error('All image URLs failed to load'));
            }
          };
          
          img.src = url;
        }, index * 50);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error('Image loading timeout'));
        }
      }, 10000);
    });
  }
  
  // Observe element for lazy loading
  observe(imgElement) {
    if (this.observer && imgElement) {
      this.observer.observe(imgElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(imgElement);
    }
  }
  
  // Batch load all visible images
  batchLoadVisible() {
    const images = document.querySelectorAll('img[data-src]:not([data-loaded="true"])');
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) { // 200px buffer
        this.loadImage(img);
      }
    });
  }
  
  // Preload critical images
  preloadCritical(urls) {
    urls.slice(0, 5).forEach(url => { // Limit to 5 critical images
      if (!this.preloadLinks.has(url)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        this.preloadLinks.add(url);
      }
    });
  }
  
  // Clean up preload links
  cleanupPreloadLinks() {
    document.querySelectorAll('link[rel="preload"][as="image"]').forEach(link => {
      if (this.preloadLinks.has(link.href)) {
        link.remove();
        this.preloadLinks.delete(link.href);
      }
    });
  }
  
  // Get performance stats
  getStats() {
    return {
      ...performanceMonitor.getStats(),
      cacheSize: this.cache.size,
      networkSpeed: this.networkSpeed,
      defaultQuality: this.defaultQuality,
      cdnPerformance: Object.fromEntries(this.cdnPerformance)
    };
  }
}

// Global instance with fallback
let imageLoader;
try {
  imageLoader = new ProgressiveImageLoader();
} catch (error) {
  Logger.error('Failed to initialize image loader:', error);
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

export { imageLoader };
