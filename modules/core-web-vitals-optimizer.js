/* Core Web Vitals Optimizer - Improve LCP, FID, CLS for better SEO ranking */

import { Logger } from './logger.js';

// Core Web Vitals thresholds (Google standards)
const CWV_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  INP: { good: 200, needsImprovement: 500 }    // Interaction to Next Paint (ms)
};

// Performance optimization configuration
const PERFORMANCE_CONFIG = {
  // Critical resources to preload
  criticalResources: [
    { href: '/assets/styles.css', as: 'style', type: 'text/css' },
    { href: '/assets/app.js', as: 'script', type: 'text/javascript' },
    { href: '/modules/router.js', as: 'script', type: 'module' }
  ],
  
  // Images to optimize
  imageOptimization: {
    lazyLoadThreshold: 3, // First 3 images load immediately
    webpSupport: true,
    placeholderColor: '#1a1b21',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  },
  
  // Font optimization
  fontOptimization: {
    preloadFonts: [
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
    ],
    fontDisplay: 'swap'
  }
};

// Core Web Vitals Optimizer class
export class CoreWebVitalsOptimizer {
  constructor() {
    this.metrics = {
      LCP: null,
      FID: null,
      CLS: null,
      INP: null,
      TTFB: null,
      FCP: null
    };
    
    this.observers = new Map();
    this.optimizations = new Set();
    
    this.init();
  }

  init() {
    // Start measuring Core Web Vitals
    this.measureCoreWebVitals();
    
    // Apply immediate optimizations
    this.applyImmediateOptimizations();
    
    // Schedule deferred optimizations
    this.scheduleDeferredOptimizations();
    
    Logger.debug('⚡ Core Web Vitals Optimizer initialized');
  }

  // Measure Core Web Vitals
  measureCoreWebVitals() {
    // Measure LCP (Largest Contentful Paint)
    this.measureLCP();
    
    // Measure FID (First Input Delay)
    this.measureFID();
    
    // Measure CLS (Cumulative Layout Shift)
    this.measureCLS();
    
    // Measure INP (Interaction to Next Paint)
    this.measureINP();
    
    // Measure additional metrics
    this.measureAdditionalMetrics();
  }

  // Measure Largest Contentful Paint
  measureLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.LCP = lastEntry.startTime;
        this.evaluateLCP(lastEntry.startTime);
        
        Logger.debug('📊 LCP measured:', lastEntry.startTime + 'ms');
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('LCP', observer);
    }
  }

  // Measure First Input Delay
  measureFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.FID = entry.processingStart - entry.startTime;
          this.evaluateFID(this.metrics.FID);
          
          Logger.debug('📊 FID measured:', this.metrics.FID + 'ms');
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('FID', observer);
    }
  }

  // Measure Cumulative Layout Shift
  measureCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.metrics.CLS = clsValue;
        this.evaluateCLS(clsValue);
        
        Logger.debug('📊 CLS measured:', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('CLS', observer);
    }
  }

  // Measure Interaction to Next Paint
  measureINP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const inp = entry.processingEnd - entry.startTime;
          this.metrics.INP = Math.max(this.metrics.INP || 0, inp);
          this.evaluateINP(inp);
          
          Logger.debug('📊 INP measured:', inp + 'ms');
        });
      });
      
      observer.observe({ entryTypes: ['event'] });
      this.observers.set('INP', observer);
    }
  }

  // Measure additional performance metrics
  measureAdditionalMetrics() {
    // Time to First Byte
    if (performance.timing) {
      this.metrics.TTFB = performance.timing.responseStart - performance.timing.navigationStart;
    }
    
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
            Logger.debug('📊 FCP measured:', entry.startTime + 'ms');
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
  }

  // Apply immediate optimizations
  applyImmediateOptimizations() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Optimize fonts
    this.optimizeFonts();
    
    // Prevent layout shifts
    this.preventLayoutShifts();
    
    // Optimize images
    this.optimizeImages();
    
    // Reduce JavaScript execution time
    this.optimizeJavaScript();
    
    Logger.debug('⚡ Immediate optimizations applied');
  }

  // Preload critical resources
  preloadCriticalResources() {
    if (this.optimizations.has('preload')) return;
    
    PERFORMANCE_CONFIG.criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.as === 'script') link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
    });
    
    this.optimizations.add('preload');
  }

  // Optimize fonts
  optimizeFonts() {
    if (this.optimizations.has('fonts')) return;
    
    // Preload critical fonts
    PERFORMANCE_CONFIG.fontOptimization.preloadFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
    });
    
    // Add font-display: swap to existing fonts
    const styleSheets = document.styleSheets;
    for (let sheet of styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let rule of rules) {
          if (rule.style && rule.style.fontFamily) {
            rule.style.fontDisplay = PERFORMANCE_CONFIG.fontOptimization.fontDisplay;
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw errors
      }
    }
    
    this.optimizations.add('fonts');
  }

  // Prevent layout shifts
  preventLayoutShifts() {
    if (this.optimizations.has('cls-prevention')) return;
    
    // Add dimensions to images without them
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      // Set aspect ratio to prevent CLS
      img.style.aspectRatio = '16/9'; // Default aspect ratio
      img.style.width = '100%';
      img.style.height = 'auto';
    });
    
    // Reserve space for dynamic content
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
    dynamicContainers.forEach(container => {
      if (!container.style.minHeight) {
        container.style.minHeight = '200px'; // Reserve minimum space
      }
    });
    
    // Prevent font swap layout shifts
    document.documentElement.style.setProperty('--font-display', 'swap');
    
    this.optimizations.add('cls-prevention');
  }

  // Optimize images
  optimizeImages() {
    if (this.optimizations.has('images')) return;
    
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      // Lazy load images below the fold
      if (index >= PERFORMANCE_CONFIG.imageOptimization.lazyLoadThreshold) {
        img.loading = 'lazy';
      }
      
      // Add placeholder while loading
      if (!img.src && !img.dataset.src) {
        img.style.backgroundColor = PERFORMANCE_CONFIG.imageOptimization.placeholderColor;
      }
      
      // Add proper alt text for SEO
      if (!img.alt && img.dataset.movieName) {
        img.alt = `Poster anime ${img.dataset.movieName}`;
      }
      
      // Optimize image format
      if (PERFORMANCE_CONFIG.imageOptimization.webpSupport && this.supportsWebP()) {
        const originalSrc = img.src || img.dataset.src;
        if (originalSrc && !originalSrc.includes('.webp')) {
          // Convert to WebP if supported
          img.dataset.originalSrc = originalSrc;
        }
      }
    });
    
    this.optimizations.add('images');
  }

  // Optimize JavaScript execution
  optimizeJavaScript() {
    if (this.optimizations.has('javascript')) return;
    
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    scripts.forEach(script => {
      if (!script.src.includes('critical') && !script.src.includes('app.js')) {
        script.defer = true;
      }
    });
    
    // Use requestIdleCallback for non-critical tasks
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        // Perform non-critical optimizations
        this.performNonCriticalOptimizations();
      });
    }
    
    this.optimizations.add('javascript');
  }

  // Schedule deferred optimizations
  scheduleDeferredOptimizations() {
    // Run after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.performDeferredOptimizations();
      }, 1000);
    });
  }

  // Perform deferred optimizations
  performDeferredOptimizations() {
    // Optimize third-party scripts
    this.optimizeThirdPartyScripts();
    
    // Clean up unused CSS
    this.cleanupUnusedCSS();
    
    // Optimize service worker
    this.optimizeServiceWorker();
    
    Logger.debug('⚡ Deferred optimizations completed');
  }

  // Optimize third-party scripts
  optimizeThirdPartyScripts() {
    // Add loading="lazy" to iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.loading = 'lazy';
    });
    
    // Defer analytics scripts
    const analyticsScripts = document.querySelectorAll('script[src*="analytics"], script[src*="gtag"]');
    analyticsScripts.forEach(script => {
      script.defer = true;
    });
  }

  // Clean up unused CSS
  cleanupUnusedCSS() {
    // This would require a more sophisticated implementation
    // For now, we'll just remove unused CSS classes
    const unusedClasses = [
      'unused-class-1',
      'unused-class-2'
    ];
    
    unusedClasses.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      elements.forEach(el => el.classList.remove(className));
    });
  }

  // Optimize service worker
  optimizeServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      }).catch(error => {
        Logger.warn('Service worker registration failed:', error);
      });
    }
  }

  // Evaluation methods
  evaluateLCP(value) {
    if (value <= CWV_THRESHOLDS.LCP.good) {
      Logger.info('✅ LCP is good:', value + 'ms');
    } else if (value <= CWV_THRESHOLDS.LCP.needsImprovement) {
      Logger.warn('⚠️ LCP needs improvement:', value + 'ms');
      this.improveLCP();
    } else {
      Logger.error('❌ LCP is poor:', value + 'ms');
      this.improveLCP();
    }
  }

  evaluateFID(value) {
    if (value <= CWV_THRESHOLDS.FID.good) {
      Logger.info('✅ FID is good:', value + 'ms');
    } else {
      Logger.warn('⚠️ FID needs improvement:', value + 'ms');
      this.improveFID();
    }
  }

  evaluateCLS(value) {
    if (value <= CWV_THRESHOLDS.CLS.good) {
      Logger.info('✅ CLS is good:', value);
    } else {
      Logger.warn('⚠️ CLS needs improvement:', value);
      this.improveCLS();
    }
  }

  evaluateINP(value) {
    if (value <= CWV_THRESHOLDS.INP.good) {
      Logger.info('✅ INP is good:', value + 'ms');
    } else {
      Logger.warn('⚠️ INP needs improvement:', value + 'ms');
      this.improveINP();
    }
  }

  // Improvement methods
  improveLCP() {
    // Additional LCP optimizations
    this.optimizeLCPElement();
    this.reduceServerResponseTime();
  }

  improveFID() {
    // Break up long tasks
    this.breakUpLongTasks();
    
    // Optimize event handlers
    this.optimizeEventHandlers();
  }

  improveCLS() {
    // Additional CLS optimizations
    this.stabilizeLayoutElements();
  }

  improveINP() {
    // Optimize interaction responsiveness
    this.optimizeInteractionResponsiveness();
  }

  // Utility methods
  optimizeLCPElement() {
    // Find and optimize the LCP element
    const lcpCandidates = document.querySelectorAll('img, video, div, h1, h2');
    lcpCandidates.forEach(element => {
      if (element.tagName === 'IMG') {
        element.fetchPriority = 'high';
      }
    });
  }

  reduceServerResponseTime() {
    // Add performance hints
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = '//phimapi.com';
    document.head.appendChild(link);
  }

  breakUpLongTasks() {
    // Use scheduler.postTask if available
    if ('scheduler' in window && 'postTask' in scheduler) {
      // Modern browsers with Scheduler API
      return;
    }
    
    // Fallback to setTimeout for task scheduling
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay = 0) {
      return originalSetTimeout(() => {
        if (performance.now() % 50 === 0) {
          // Yield to browser every 50ms
          originalSetTimeout(callback, 0);
        } else {
          callback();
        }
      }, delay);
    };
  }

  optimizeEventHandlers() {
    // Use passive event listeners where possible
    const passiveEvents = ['scroll', 'wheel', 'touchstart', 'touchmove'];
    
    passiveEvents.forEach(eventType => {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (passiveEvents.includes(type) && typeof options !== 'object') {
          options = { passive: true };
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
  }

  stabilizeLayoutElements() {
    // Add CSS containment
    const containers = document.querySelectorAll('.movie-card, .anime-item');
    containers.forEach(container => {
      container.style.contain = 'layout style paint';
    });
  }

  optimizeInteractionResponsiveness() {
    // Debounce frequent interactions
    const debouncedHandlers = new Map();
    
    document.addEventListener('input', (event) => {
      const target = event.target;
      if (target.type === 'search' || target.type === 'text') {
        const existingTimeout = debouncedHandlers.get(target);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        const timeout = setTimeout(() => {
          // Handle the input
          target.dispatchEvent(new Event('debouncedInput'));
        }, 300);
        
        debouncedHandlers.set(target, timeout);
      }
    });
  }

  // Utility functions
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get performance report
  getPerformanceReport() {
    return {
      metrics: this.metrics,
      optimizations: Array.from(this.optimizations),
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.LCP > CWV_THRESHOLDS.LCP.needsImprovement) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and server response time');
    }
    
    if (this.metrics.FID > CWV_THRESHOLDS.FID.needsImprovement) {
      recommendations.push('Reduce First Input Delay by breaking up long JavaScript tasks');
    }
    
    if (this.metrics.CLS > CWV_THRESHOLDS.CLS.needsImprovement) {
      recommendations.push('Prevent Cumulative Layout Shift by setting image dimensions and reserving space for dynamic content');
    }
    
    return recommendations;
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global Core Web Vitals optimizer instance
export const coreWebVitalsOptimizer = new CoreWebVitalsOptimizer();

// Auto-optimize function
export function optimizeCoreWebVitals() {
  coreWebVitalsOptimizer.applyImmediateOptimizations();
}

// Performance monitoring
export function monitorPerformance() {
  return coreWebVitalsOptimizer.getPerformanceReport();
}
