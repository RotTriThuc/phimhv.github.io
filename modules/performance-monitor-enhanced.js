/**
 * Enhanced Performance Monitor - Comprehensive performance tracking và analytics
 * Tác giả: AI Assistant
 * Mô tả: Monitor network performance, video streaming metrics, API performance, và user experience
 */

import { Logger } from './logger.js';

// Performance monitoring configuration
const PERF_CONFIG = {
  // Sampling rates
  networkSampleRate: 0.1,      // 10% of requests
  videoSampleRate: 0.2,        // 20% of video events
  apiSampleRate: 0.15,         // 15% of API calls
  
  // Thresholds for alerts
  thresholds: {
    slowNetworkSpeed: 1,       // < 1 Mbps
    highLatency: 2000,         // > 2 seconds
    lowBufferHealth: 5,        // < 5 seconds
    highErrorRate: 0.05,       // > 5% error rate
    slowApiResponse: 3000      // > 3 seconds
  },
  
  // Data retention
  maxMetrics: 1000,
  retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  
  // Reporting intervals
  reportInterval: 60000,       // 1 minute
  alertCheckInterval: 30000    // 30 seconds
};

/**
 * Enhanced Performance Monitor Class
 * Comprehensive tracking của network, video, API, và user experience metrics
 */
export class EnhancedPerformanceMonitor {
  constructor() {
    this.metrics = {
      network: [],
      video: [],
      api: [],
      userExperience: [],
      errors: []
    };
    
    this.alerts = [];
    this.isMonitoring = false;
    this.startTime = Date.now();
    
    // Performance observers
    this.observers = new Map();
    
    // Real-time stats
    this.realTimeStats = {
      currentBandwidth: 0,
      currentLatency: 0,
      activeVideoSessions: 0,
      bufferHealth: 0,
      errorRate: 0,
      apiResponseTime: 0
    };
    
    this.init();
  }
  
  /**
   * Khởi tạo performance monitoring
   */
  async init() {
    try {
      this.setupPerformanceObservers();
      this.setupEventListeners();
      this.startReporting();
      
      this.isMonitoring = true;
      Logger.info('📊 Enhanced Performance Monitor initialized');
      
    } catch (error) {
      Logger.error('❌ Performance Monitor initialization failed:', error);
    }
  }
  
  /**
   * Setup Performance API observers
   */
  setupPerformanceObservers() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;
    
    try {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordNavigationMetric(entry);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
      
      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordResourceMetric(entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
      
      // Long tasks
      if ('longtask' in window.PerformanceObserver.supportedEntryTypes) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLongTask(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      }
      
    } catch (error) {
      Logger.warn('⚠️ Some performance observers not supported:', error);
    }
  }
  
  /**
   * Setup event listeners cho custom metrics
   */
  setupEventListeners() {
    if (typeof window === 'undefined') return;
    
    // Network quality changes
    if (window.networkMonitor) {
      window.networkMonitor.addListener((event, data) => {
        if (event === 'qualityChange') {
          this.recordNetworkMetric({
            type: 'quality_change',
            bandwidth: data.bandwidth,
            quality: data.newQuality,
            connectionType: data.connectionType,
            timestamp: Date.now()
          });
        }
      });
    }
    
    // Video player events
    document.addEventListener('video-event', (event) => {
      this.recordVideoMetric(event.detail);
    });
    
    // API performance events
    document.addEventListener('api-performance', (event) => {
      this.recordApiMetric(event.detail);
    });
    
    // User interaction events
    ['click', 'scroll', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.recordUserInteraction(eventType);
      }, { passive: true });
    });
  }
  
  /**
   * Record navigation performance
   */
  recordNavigationMetric(entry) {
    const metric = {
      type: 'navigation',
      url: entry.name,
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      firstPaint: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize,
      timestamp: Date.now()
    };
    
    this.addMetric('userExperience', metric);
    Logger.debug('📊 Navigation metric recorded:', metric);
  }
  
  /**
   * Record resource loading performance
   */
  recordResourceMetric(entry) {
    // Sample based on configuration
    if (Math.random() > PERF_CONFIG.apiSampleRate) return;
    
    const metric = {
      type: 'resource',
      url: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      resourceType: this.getResourceType(entry.name),
      timestamp: Date.now()
    };
    
    // Categorize by resource type
    if (metric.resourceType === 'api') {
      this.addMetric('api', metric);
      this.realTimeStats.apiResponseTime = metric.duration;
    } else if (metric.resourceType === 'video') {
      this.addMetric('video', metric);
    } else {
      this.addMetric('network', metric);
    }
  }
  
  /**
   * Record long tasks (performance bottlenecks)
   */
  recordLongTask(entry) {
    const metric = {
      type: 'long_task',
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    };
    
    this.addMetric('userExperience', metric);
    
    // Alert for very long tasks
    if (entry.duration > 100) {
      this.addAlert('performance', `Long task detected: ${entry.duration.toFixed(0)}ms`, 'warning');
    }
  }
  
  /**
   * Record network performance metrics
   */
  recordNetworkMetric(data) {
    if (Math.random() > PERF_CONFIG.networkSampleRate) return;
    
    const metric = {
      ...data,
      timestamp: Date.now()
    };
    
    this.addMetric('network', metric);
    
    // Update real-time stats
    if (data.bandwidth) {
      this.realTimeStats.currentBandwidth = data.bandwidth;
    }
    if (data.latency) {
      this.realTimeStats.currentLatency = data.latency;
    }
    
    // Check thresholds
    this.checkNetworkThresholds(metric);
  }
  
  /**
   * Record video streaming metrics
   */
  recordVideoMetric(data) {
    if (Math.random() > PERF_CONFIG.videoSampleRate) return;
    
    const metric = {
      ...data,
      timestamp: Date.now()
    };
    
    this.addMetric('video', metric);
    
    // Update real-time stats
    if (data.type === 'buffer_health') {
      this.realTimeStats.bufferHealth = data.value;
    }
    if (data.type === 'session_start') {
      this.realTimeStats.activeVideoSessions++;
    }
    if (data.type === 'session_end') {
      this.realTimeStats.activeVideoSessions = Math.max(0, this.realTimeStats.activeVideoSessions - 1);
    }
    
    // Check video thresholds
    this.checkVideoThresholds(metric);
  }
  
  /**
   * Record API performance metrics
   */
  recordApiMetric(data) {
    if (Math.random() > PERF_CONFIG.apiSampleRate) return;
    
    const metric = {
      ...data,
      timestamp: Date.now()
    };
    
    this.addMetric('api', metric);
    
    // Update real-time stats
    if (data.responseTime) {
      this.realTimeStats.apiResponseTime = data.responseTime;
    }
    
    // Check API thresholds
    this.checkApiThresholds(metric);
  }
  
  /**
   * Record user interaction
   */
  recordUserInteraction(type) {
    const metric = {
      type: 'user_interaction',
      interactionType: type,
      timestamp: Date.now()
    };
    
    this.addMetric('userExperience', metric);
  }
  
  /**
   * Add metric to appropriate category
   */
  addMetric(category, metric) {
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }
    
    this.metrics[category].push(metric);
    
    // Maintain size limits
    if (this.metrics[category].length > PERF_CONFIG.maxMetrics) {
      this.metrics[category].shift();
    }
    
    // Clean old metrics
    this.cleanOldMetrics(category);
  }
  
  /**
   * Clean old metrics based on retention period
   */
  cleanOldMetrics(category) {
    const cutoffTime = Date.now() - PERF_CONFIG.retentionPeriod;
    this.metrics[category] = this.metrics[category].filter(
      metric => metric.timestamp > cutoffTime
    );
  }
  
  /**
   * Check network performance thresholds
   */
  checkNetworkThresholds(metric) {
    const { thresholds } = PERF_CONFIG;
    
    if (metric.bandwidth && metric.bandwidth < thresholds.slowNetworkSpeed) {
      this.addAlert('network', `Slow network detected: ${metric.bandwidth.toFixed(2)} Mbps`, 'warning');
    }
    
    if (metric.latency && metric.latency > thresholds.highLatency) {
      this.addAlert('network', `High latency detected: ${metric.latency.toFixed(0)}ms`, 'warning');
    }
  }
  
  /**
   * Check video performance thresholds
   */
  checkVideoThresholds(metric) {
    const { thresholds } = PERF_CONFIG;
    
    if (metric.type === 'buffer_health' && metric.value < thresholds.lowBufferHealth) {
      this.addAlert('video', `Low buffer health: ${metric.value.toFixed(1)}s`, 'warning');
    }
    
    if (metric.type === 'error' && metric.fatal) {
      this.addAlert('video', `Fatal video error: ${metric.message}`, 'error');
    }
  }
  
  /**
   * Check API performance thresholds
   */
  checkApiThresholds(metric) {
    const { thresholds } = PERF_CONFIG;
    
    if (metric.responseTime && metric.responseTime > thresholds.slowApiResponse) {
      this.addAlert('api', `Slow API response: ${metric.responseTime.toFixed(0)}ms for ${metric.url}`, 'warning');
    }
    
    if (metric.type === 'error') {
      this.addAlert('api', `API error: ${metric.message} for ${metric.url}`, 'error');
    }
  }
  
  /**
   * Add performance alert
   */
  addAlert(category, message, severity = 'info') {
    const alert = {
      category,
      message,
      severity,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    
    // Maintain alert history
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    Logger.warn(`🚨 Performance Alert [${category}]:`, message);
    
    // Emit custom event for UI notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-alert', { detail: alert }));
    }
  }
  
  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.includes('phimapi.com') || url.includes('/api/')) return 'api';
    if (url.includes('.m3u8') || url.includes('.ts') || url.includes('.mp4')) return 'video';
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) return 'image';
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'style';
    return 'other';
  }
  
  /**
   * Start periodic reporting
   */
  startReporting() {
    setInterval(() => {
      this.generateReport();
    }, PERF_CONFIG.reportInterval);
    
    setInterval(() => {
      this.checkOverallHealth();
    }, PERF_CONFIG.alertCheckInterval);
  }
  
  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      realTimeStats: { ...this.realTimeStats },
      summary: this.getSummaryStats(),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
    
    Logger.debug('📊 Performance Report:', report);
    
    // Emit report event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-report', { detail: report }));
    }
    
    return report;
  }
  
  /**
   * Check overall system health
   */
  checkOverallHealth() {
    const stats = this.getSummaryStats();
    
    // Calculate error rate
    const totalRequests = stats.api.totalRequests || 1;
    const errorRate = (stats.api.errors || 0) / totalRequests;
    this.realTimeStats.errorRate = errorRate;
    
    if (errorRate > PERF_CONFIG.thresholds.highErrorRate) {
      this.addAlert('system', `High error rate detected: ${(errorRate * 100).toFixed(1)}%`, 'error');
    }
  }
  
  /**
   * Get summary statistics
   */
  getSummaryStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    return {
      network: this.calculateCategoryStats('network', oneHourAgo),
      video: this.calculateCategoryStats('video', oneHourAgo),
      api: this.calculateCategoryStats('api', oneHourAgo),
      userExperience: this.calculateCategoryStats('userExperience', oneHourAgo)
    };
  }
  
  /**
   * Calculate statistics for a category
   */
  calculateCategoryStats(category, since) {
    const metrics = this.metrics[category].filter(m => m.timestamp > since);
    
    if (metrics.length === 0) {
      return { count: 0, averageResponseTime: 0, errors: 0 };
    }
    
    const responseTimes = metrics
      .filter(m => m.duration || m.responseTime)
      .map(m => m.duration || m.responseTime);
    
    const errors = metrics.filter(m => m.type === 'error').length;
    
    return {
      count: metrics.length,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      errors: errors,
      totalRequests: metrics.filter(m => m.type !== 'error').length
    };
  }
  
  /**
   * Get comprehensive performance data
   */
  getPerformanceData() {
    return {
      isMonitoring: this.isMonitoring,
      uptime: Date.now() - this.startTime,
      realTimeStats: { ...this.realTimeStats },
      summary: this.getSummaryStats(),
      recentAlerts: this.alerts.slice(-20),
      metricsCount: {
        network: this.metrics.network.length,
        video: this.metrics.video.length,
        api: this.metrics.api.length,
        userExperience: this.metrics.userExperience.length
      }
    };
  }
  
  /**
   * Export performance data
   */
  exportData(format = 'json') {
    const data = {
      exportTime: new Date().toISOString(),
      performanceData: this.getPerformanceData(),
      rawMetrics: this.metrics
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    
    // Disconnect observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        Logger.warn('⚠️ Error disconnecting observer:', error);
      }
    });
    
    this.observers.clear();
    Logger.info('⏹️ Performance monitoring stopped');
  }
}

// Global instance
export const enhancedPerformanceMonitor = new EnhancedPerformanceMonitor();

// Helper functions for easy integration
export function recordVideoEvent(type, data) {
  enhancedPerformanceMonitor.recordVideoMetric({ type, ...data });
}

export function recordApiEvent(url, responseTime, success = true, error = null) {
  enhancedPerformanceMonitor.recordApiMetric({
    type: success ? 'success' : 'error',
    url,
    responseTime,
    message: error?.message
  });
}

export function recordNetworkEvent(bandwidth, latency, quality) {
  enhancedPerformanceMonitor.recordNetworkMetric({
    type: 'measurement',
    bandwidth,
    latency,
    quality
  });
}
