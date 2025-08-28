/**
 * 📊 Performance Monitor Utility
 * Track và optimize application performance
 */

export class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.sampleRate = options.sampleRate || 0.1; // 10% sampling
    this.maxEntries = options.maxEntries || 100;
    
    this.metrics = {
      pageLoad: [],
      apiRequests: [],
      userInteractions: [],
      memoryUsage: [],
      renderTimes: []
    };
    
    this.observers = new Map();
    this.timers = new Map();
    
    if (this.enabled) {
      this.init();
    }
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor network requests
    this.monitorNetworkRequests();
    
    console.log('📊 Performance Monitor initialized');
  }

  /**
   * Monitor page load performance
   */
  monitorPageLoad() {
    if (document.readyState === 'complete') {
      this.recordPageLoadMetrics();
    } else {
      window.addEventListener('load', () => this.recordPageLoadMetrics());
    }
  }

  /**
   * Record page load metrics
   */
  recordPageLoadMetrics() {
    if (!performance.getEntriesByType) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return;

    const metrics = {
      timestamp: Date.now(),
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      firstInputDelay: this.getFirstInputDelay()
    };

    this.addMetric('pageLoad', metrics);
    console.log('📊 Page load metrics:', metrics);
  }

  /**
   * Get First Paint time
   */
  getFirstPaint() {
    const entry = performance.getEntriesByName('first-paint')[0];
    return entry ? entry.startTime : 0;
  }

  /**
   * Get First Contentful Paint time
   */
  getFirstContentfulPaint() {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : 0;
  }

  /**
   * Get Largest Contentful Paint time
   */
  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(0);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry ? lastEntry.startTime : 0);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 10000);
    });
  }

  /**
   * Get Cumulative Layout Shift
   */
  getCumulativeLayoutShift() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(0);
        return;
      }

      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Calculate final CLS after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);
    });
  }

  /**
   * Get First Input Delay
   */
  getFirstInputDelay() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(0);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const firstEntry = list.getEntries()[0];
        if (firstEntry) {
          resolve(firstEntry.processingStart - firstEntry.startTime);
          observer.disconnect();
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 30000);
    });
  }

  /**
   * Monitor long tasks
   */
  monitorLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn('⚠️ Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.set('longtask', observer);
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (!performance.memory) return;

    const recordMemory = () => {
      const memory = {
        timestamp: Date.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };

      this.addMetric('memoryUsage', memory);
    };

    // Record memory usage every 30 seconds
    setInterval(recordMemory, 30000);
    recordMemory(); // Initial recording
  }

  /**
   * Monitor user interactions
   */
  monitorUserInteractions() {
    const interactionTypes = ['click', 'keydown', 'scroll'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        if (Math.random() > this.sampleRate) return; // Sampling

        const interaction = {
          timestamp: Date.now(),
          type,
          target: event.target.tagName,
          className: event.target.className
        };

        this.addMetric('userInteractions', interaction);
      }, { passive: true });
    });
  }

  /**
   * Monitor network requests
   */
  monitorNetworkRequests() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          const request = {
            timestamp: Date.now(),
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
          };

          this.addMetric('apiRequests', request);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  /**
   * Start timing an operation
   * @param {string} name - Timer name
   */
  startTimer(name) {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing an operation
   * @param {string} name - Timer name
   * @returns {number} Duration in milliseconds
   */
  endTimer(name) {
    const startTime = this.timers.get(name);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    const renderTime = {
      timestamp: Date.now(),
      name,
      duration
    };

    this.addMetric('renderTimes', renderTime);
    return duration;
  }

  /**
   * Add metric to collection
   * @param {string} type - Metric type
   * @param {Object} data - Metric data
   */
  addMetric(type, data) {
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }

    this.metrics[type].push(data);

    // Limit array size
    if (this.metrics[type].length > this.maxEntries) {
      this.metrics[type] = this.metrics[type].slice(-this.maxEntries);
    }
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getSummary() {
    const summary = {};

    Object.entries(this.metrics).forEach(([type, entries]) => {
      if (entries.length === 0) {
        summary[type] = { count: 0 };
        return;
      }

      const durations = entries
        .map(entry => entry.duration || entry.loadTime || 0)
        .filter(d => d > 0);

      if (durations.length > 0) {
        summary[type] = {
          count: entries.length,
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
          p95: this.percentile(durations, 95)
        };
      } else {
        summary[type] = { count: entries.length };
      }
    });

    return summary;
  }

  /**
   * Calculate percentile
   * @param {Array} values - Array of values
   * @param {number} percentile - Percentile to calculate
   * @returns {number} Percentile value
   */
  percentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get detailed metrics
   * @param {string} type - Metric type
   * @param {number} limit - Number of entries to return
   * @returns {Array} Metric entries
   */
  getMetrics(type, limit = 10) {
    const entries = this.metrics[type] || [];
    return entries.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    Object.keys(this.metrics).forEach(type => {
      this.metrics[type] = [];
    });
    console.log('📊 Performance metrics cleared');
  }

  /**
   * Export metrics for analysis
   * @returns {Object} All metrics data
   */
  exportMetrics() {
    return {
      timestamp: Date.now(),
      summary: this.getSummary(),
      metrics: { ...this.metrics }
    };
  }

  /**
   * Destroy performance monitor
   */
  destroy() {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear timers
    this.timers.clear();
    
    // Clear metrics
    this.clearMetrics();
    
    console.log('📊 Performance Monitor destroyed');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;
