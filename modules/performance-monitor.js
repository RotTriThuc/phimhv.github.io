/* Performance Monitoring Dashboard - Real-time performance tracking */

import { Logger } from './logger.js';
import { createEl, formatTime, debounce } from './utils.js';

// Performance metrics collector
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      navigation: [],
      apiCalls: [],
      imageLoading: [],
      memoryUsage: [],
      userInteractions: [],
      errors: []
    };
    
    this.observers = {
      performance: null,
      memory: null,
      navigation: null
    };
    
    this.isMonitoring = false;
    this.startTime = performance.now();
    
    this.init();
  }

  init() {
    // Initialize performance observers
    this.initPerformanceObserver();
    this.initMemoryMonitoring();
    this.initNavigationTiming();
    this.initUserInteractionTracking();
    
    // Start monitoring
    this.startMonitoring();
  }

  initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.observers.performance = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          switch (entry.entryType) {
            case 'navigation':
              this.recordNavigationTiming(entry);
              break;
            case 'resource':
              this.recordResourceTiming(entry);
              break;
            case 'measure':
              this.recordCustomMeasure(entry);
              break;
            case 'paint':
              this.recordPaintTiming(entry);
              break;
          }
        });
      });
      
      try {
        this.observers.performance.observe({ 
          entryTypes: ['navigation', 'resource', 'measure', 'paint'] 
        });
      } catch (error) {
        Logger.warn('Performance observer not fully supported:', error);
      }
    }
  }

  initMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = performance.memory;
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
        
        // Keep only last 100 measurements
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }
      };
      
      // Check memory every 10 seconds
      this.observers.memory = setInterval(checkMemory, 10000);
      checkMemory(); // Initial measurement
    }
  }

  initNavigationTiming() {
    // Record page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.pageLoad = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        };
      }
    });
  }

  initUserInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.recordUserInteraction('click', {
        target: event.target.tagName,
        className: event.target.className,
        timestamp: Date.now()
      });
    });
    
    // Track scroll performance
    const trackScroll = debounce(() => {
      this.recordUserInteraction('scroll', {
        scrollY: window.scrollY,
        timestamp: Date.now()
      });
    }, 100);
    
    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  recordNavigationTiming(entry) {
    this.metrics.navigation.push({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      type: 'navigation',
      timestamp: Date.now()
    });
  }

  recordResourceTiming(entry) {
    // Focus on important resources
    if (entry.name.includes('.js') || entry.name.includes('.css') || entry.name.includes('api')) {
      this.metrics.apiCalls.push({
        url: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        type: this.getResourceType(entry.name),
        timestamp: Date.now()
      });
    }
    
    // Track image loading
    if (entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      this.metrics.imageLoading.push({
        url: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        timestamp: Date.now()
      });
    }
  }

  recordCustomMeasure(entry) {
    Logger.debug(`Custom measure: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
  }

  recordPaintTiming(entry) {
    if (entry.name === 'first-paint') {
      this.metrics.pageLoad.firstPaint = entry.startTime;
    } else if (entry.name === 'first-contentful-paint') {
      this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
    }
  }

  recordUserInteraction(type, data) {
    this.metrics.userInteractions.push({
      type,
      ...data
    });
    
    // Keep only last 50 interactions
    if (this.metrics.userInteractions.length > 50) {
      this.metrics.userInteractions.shift();
    }
  }

  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
    
    // Keep only last 20 errors
    if (this.metrics.errors.length > 20) {
      this.metrics.errors.shift();
    }
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('api') || url.includes('json')) return 'api';
    return 'other';
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  startMonitoring() {
    this.isMonitoring = true;
    Logger.info('📊 Performance monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    // Clean up observers
    if (this.observers.performance) {
      this.observers.performance.disconnect();
    }
    if (this.observers.memory) {
      clearInterval(this.observers.memory);
    }
    
    Logger.info('📊 Performance monitoring stopped');
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime
    };
  }

  getPerformanceScore() {
    const metrics = this.getMetrics();
    let score = 100;
    
    // Deduct points for slow page load
    if (metrics.pageLoad.loadComplete > 3000) score -= 20;
    else if (metrics.pageLoad.loadComplete > 2000) score -= 10;
    
    // Deduct points for slow API calls
    const avgApiTime = this.getAverageApiTime();
    if (avgApiTime > 2000) score -= 15;
    else if (avgApiTime > 1000) score -= 8;
    
    // Deduct points for memory issues
    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory > 100 * 1024 * 1024) score -= 15; // 100MB
    else if (currentMemory > 50 * 1024 * 1024) score -= 8; // 50MB
    
    // Deduct points for errors
    if (metrics.errors.length > 5) score -= 20;
    else if (metrics.errors.length > 2) score -= 10;
    
    return Math.max(0, score);
  }

  getAverageApiTime() {
    const apiCalls = this.metrics.apiCalls.filter(call => call.type === 'api');
    if (apiCalls.length === 0) return 0;
    
    const totalTime = apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return totalTime / apiCalls.length;
  }

  getCurrentMemoryUsage() {
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    return latest ? latest.used : 0;
  }

  generateReport() {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();
    
    return {
      score,
      uptime: metrics.uptime,
      pageLoad: metrics.pageLoad,
      apiPerformance: {
        totalCalls: metrics.apiCalls.length,
        averageTime: this.getAverageApiTime(),
        slowestCall: Math.max(...metrics.apiCalls.map(call => call.duration), 0)
      },
      memoryUsage: {
        current: this.getCurrentMemoryUsage(),
        peak: Math.max(...metrics.memoryUsage.map(m => m.used), 0),
        average: metrics.memoryUsage.reduce((sum, m) => sum + m.used, 0) / metrics.memoryUsage.length || 0
      },
      imageLoading: {
        totalImages: metrics.imageLoading.length,
        averageTime: metrics.imageLoading.reduce((sum, img) => sum + img.duration, 0) / metrics.imageLoading.length || 0
      },
      errors: {
        total: metrics.errors.length,
        recent: metrics.errors.slice(-5)
      },
      userInteractions: {
        total: metrics.userInteractions.length,
        clicksPerMinute: this.getClicksPerMinute()
      }
    };
  }

  getClicksPerMinute() {
    const oneMinuteAgo = Date.now() - 60000;
    const recentClicks = this.metrics.userInteractions.filter(
      interaction => interaction.type === 'click' && interaction.timestamp > oneMinuteAgo
    );
    return recentClicks.length;
  }

  printReport() {
    const report = this.generateReport();
    
    Logger.info('\n📊 Performance Report:');
    Logger.info(`Overall Score: ${report.score}/100`);
    Logger.info(`Uptime: ${formatTime(report.uptime / 1000)}`);
    
    Logger.info('\nPage Load:');
    Logger.info(`  DOM Content Loaded: ${report.pageLoad.domContentLoaded?.toFixed(0) || 'N/A'}ms`);
    Logger.info(`  Load Complete: ${report.pageLoad.loadComplete?.toFixed(0) || 'N/A'}ms`);
    Logger.info(`  First Paint: ${report.pageLoad.firstPaint?.toFixed(0) || 'N/A'}ms`);
    
    Logger.info('\nAPI Performance:');
    Logger.info(`  Total Calls: ${report.apiPerformance.totalCalls}`);
    Logger.info(`  Average Time: ${report.apiPerformance.averageTime.toFixed(0)}ms`);
    Logger.info(`  Slowest Call: ${report.apiPerformance.slowestCall.toFixed(0)}ms`);
    
    Logger.info('\nMemory Usage:');
    Logger.info(`  Current: ${(report.memoryUsage.current / 1024 / 1024).toFixed(1)}MB`);
    Logger.info(`  Peak: ${(report.memoryUsage.peak / 1024 / 1024).toFixed(1)}MB`);
    
    Logger.info('\nErrors:');
    Logger.info(`  Total: ${report.errors.total}`);
    
    Logger.info('\nUser Interactions:');
    Logger.info(`  Clicks per minute: ${report.userInteractions.clicksPerMinute}`);
  }
}

// Performance Dashboard UI
export class PerformanceDashboard {
  constructor(monitor) {
    this.monitor = monitor;
    this.container = null;
    this.isVisible = false;
    this.updateInterval = null;
  }

  create() {
    this.container = createEl('div', 'performance-dashboard');
    this.container.innerHTML = `
      <div class="performance-dashboard__header">
        <h3>Performance Monitor</h3>
        <button class="performance-dashboard__close">×</button>
      </div>
      <div class="performance-dashboard__content">
        <div class="performance-dashboard__score">
          <div class="score-circle">
            <span class="score-value">--</span>
          </div>
          <div class="score-label">Performance Score</div>
        </div>
        <div class="performance-dashboard__metrics">
          <div class="metric">
            <div class="metric__label">Page Load</div>
            <div class="metric__value" data-metric="pageLoad">--ms</div>
          </div>
          <div class="metric">
            <div class="metric__label">API Avg</div>
            <div class="metric__value" data-metric="apiAvg">--ms</div>
          </div>
          <div class="metric">
            <div class="metric__label">Memory</div>
            <div class="metric__value" data-metric="memory">--MB</div>
          </div>
          <div class="metric">
            <div class="metric__label">Errors</div>
            <div class="metric__value" data-metric="errors">--</div>
          </div>
        </div>
        <div class="performance-dashboard__actions">
          <button class="btn btn--small performance-dashboard__report">Full Report</button>
          <button class="btn btn--small performance-dashboard__clear">Clear Data</button>
        </div>
      </div>
    `;
    
    this.bindEvents();
    return this.container;
  }

  bindEvents() {
    // Close button
    const closeBtn = this.container.querySelector('.performance-dashboard__close');
    closeBtn.addEventListener('click', () => this.hide());
    
    // Full report button
    const reportBtn = this.container.querySelector('.performance-dashboard__report');
    reportBtn.addEventListener('click', () => this.monitor.printReport());
    
    // Clear data button
    const clearBtn = this.container.querySelector('.performance-dashboard__clear');
    clearBtn.addEventListener('click', () => this.clearData());
  }

  show() {
    if (!this.container) {
      this.create();
    }
    
    document.body.appendChild(this.container);
    this.isVisible = true;
    
    // Start updating
    this.updateInterval = setInterval(() => this.update(), 2000);
    this.update();
  }

  hide() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.isVisible = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  update() {
    if (!this.isVisible || !this.container) return;
    
    const report = this.monitor.generateReport();
    
    // Update score
    const scoreValue = this.container.querySelector('.score-value');
    scoreValue.textContent = report.score;
    scoreValue.className = `score-value score-${this.getScoreClass(report.score)}`;
    
    // Update metrics
    const pageLoadMetric = this.container.querySelector('[data-metric="pageLoad"]');
    pageLoadMetric.textContent = `${report.pageLoad.loadComplete?.toFixed(0) || '--'}ms`;
    
    const apiAvgMetric = this.container.querySelector('[data-metric="apiAvg"]');
    apiAvgMetric.textContent = `${report.apiPerformance.averageTime.toFixed(0)}ms`;
    
    const memoryMetric = this.container.querySelector('[data-metric="memory"]');
    memoryMetric.textContent = `${(report.memoryUsage.current / 1024 / 1024).toFixed(1)}MB`;
    
    const errorsMetric = this.container.querySelector('[data-metric="errors"]');
    errorsMetric.textContent = report.errors.total;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  clearData() {
    if (confirm('Clear all performance data?')) {
      this.monitor.metrics = {
        pageLoad: {},
        navigation: [],
        apiCalls: [],
        imageLoading: [],
        memoryUsage: [],
        userInteractions: [],
        errors: []
      };
      
      Logger.info('Performance data cleared');
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
export const performanceDashboard = new PerformanceDashboard(performanceMonitor);

// Keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      if (performanceDashboard.isVisible) {
        performanceDashboard.hide();
      } else {
        performanceDashboard.show();
      }
    }
  });
}
