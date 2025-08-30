/* Production Monitoring - Real-time monitoring and alerting system */

import { Logger } from './logger.js';
import { performanceMonitor } from './performance-monitor.js';

// Production monitoring configuration
const MONITORING_CONFIG = {
  // Performance thresholds
  performance: {
    pageLoadTime: 3000, // 3 seconds
    apiResponseTime: 2000, // 2 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    errorRate: 0.05, // 5%
    cacheHitRate: 0.8 // 80%
  },
  
  // Monitoring intervals
  intervals: {
    performance: 30000, // 30 seconds
    health: 60000, // 1 minute
    metrics: 300000, // 5 minutes
    alerts: 10000 // 10 seconds
  },
  
  // Alert channels
  alerts: {
    email: process.env.ALERT_EMAIL || 'admin@xemphim.com',
    slack: process.env.SLACK_WEBHOOK_URL,
    discord: process.env.DISCORD_WEBHOOK_URL
  }
};

// Real-time monitoring system
export class ProductionMonitor {
  constructor() {
    this.metrics = {
      performance: new Map(),
      errors: new Map(),
      users: new Map(),
      api: new Map(),
      system: new Map()
    };
    
    this.alerts = [];
    this.isMonitoring = false;
    this.intervals = new Map();
    this.thresholds = MONITORING_CONFIG.performance;
    
    this.init();
  }

  init() {
    // Initialize monitoring systems
    this.initPerformanceMonitoring();
    this.initErrorTracking();
    this.initUserAnalytics();
    this.initSystemHealth();
    this.initAlertSystem();
    
    Logger.info('🔍 Production monitoring initialized');
  }

  // Performance monitoring
  initPerformanceMonitoring() {
    const interval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, MONITORING_CONFIG.intervals.performance);
    
    this.intervals.set('performance', interval);
  }

  collectPerformanceMetrics() {
    const metrics = {
      timestamp: Date.now(),
      pageLoad: this.getPageLoadTime(),
      apiResponse: this.getAverageApiTime(),
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: this.getCacheHitRate(),
      activeUsers: this.getActiveUsers(),
      errorRate: this.getErrorRate()
    };

    this.metrics.performance.set(Date.now(), metrics);
    this.checkPerformanceThresholds(metrics);
    
    // Keep only last 100 measurements
    if (this.metrics.performance.size > 100) {
      const oldestKey = Math.min(...this.metrics.performance.keys());
      this.metrics.performance.delete(oldestKey);
    }
  }

  getPageLoadTime() {
    if (performanceMonitor) {
      const report = performanceMonitor.generateReport();
      return report.pageLoad.loadComplete || 0;
    }
    return 0;
  }

  getAverageApiTime() {
    if (performanceMonitor) {
      const report = performanceMonitor.generateReport();
      return report.apiPerformance.averageTime || 0;
    }
    return 0;
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  getCacheHitRate() {
    // Calculate cache hit rate from API cache
    if (window.Api && window.Api.cache) {
      const stats = window.Api.cache.getStats();
      return stats.hitRate || 0;
    }
    return 0;
  }

  getActiveUsers() {
    // Estimate active users based on recent interactions
    const oneMinuteAgo = Date.now() - 60000;
    return this.metrics.users.size || 1;
  }

  getErrorRate() {
    const recentErrors = Array.from(this.metrics.errors.values())
      .filter(error => Date.now() - error.timestamp < 300000); // Last 5 minutes
    
    const totalRequests = this.getTotalRequests();
    return totalRequests > 0 ? recentErrors.length / totalRequests : 0;
  }

  getTotalRequests() {
    // Estimate from performance entries
    const resources = performance.getEntriesByType('resource');
    return resources.filter(r => r.name.includes('api')).length || 1;
  }

  // Error tracking
  initErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
  }

  trackError(error) {
    const errorId = `${error.type}_${Date.now()}`;
    this.metrics.errors.set(errorId, error);
    
    // Check error rate threshold
    const errorRate = this.getErrorRate();
    if (errorRate > this.thresholds.errorRate) {
      this.triggerAlert('high_error_rate', {
        errorRate: (errorRate * 100).toFixed(2) + '%',
        threshold: (this.thresholds.errorRate * 100).toFixed(2) + '%',
        recentError: error
      });
    }
    
    // Keep only last 50 errors
    if (this.metrics.errors.size > 50) {
      const oldestKey = Math.min(...Array.from(this.metrics.errors.keys()));
      this.metrics.errors.delete(oldestKey);
    }
    
    Logger.error('Production error tracked:', error);
  }

  // User analytics
  initUserAnalytics() {
    // Track user sessions
    this.trackUserSession();
    
    // Track page views
    this.trackPageView();
    
    // Track user interactions
    this.trackUserInteractions();
  }

  trackUserSession() {
    const sessionId = this.generateSessionId();
    const userInfo = {
      sessionId,
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    this.metrics.users.set(sessionId, userInfo);
  }

  trackPageView() {
    const pageView = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      referrer: document.referrer
    };
    
    // Send to analytics
    this.sendAnalytics('pageview', pageView);
  }

  trackUserInteractions() {
    let interactionCount = 0;
    
    ['click', 'scroll', 'keypress'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        
        // Update user activity
        const sessionId = this.getCurrentSessionId();
        if (this.metrics.users.has(sessionId)) {
          const user = this.metrics.users.get(sessionId);
          user.lastActivity = Date.now();
          user.interactions = interactionCount;
        }
      }, { passive: true });
    });
  }

  // System health monitoring
  initSystemHealth() {
    const interval = setInterval(() => {
      this.checkSystemHealth();
    }, MONITORING_CONFIG.intervals.health);
    
    this.intervals.set('health', interval);
  }

  async checkSystemHealth() {
    const health = {
      timestamp: Date.now(),
      api: await this.checkApiHealth(),
      database: await this.checkDatabaseHealth(),
      cdn: await this.checkCDNHealth(),
      serviceWorker: this.checkServiceWorkerHealth()
    };
    
    this.metrics.system.set(Date.now(), health);
    
    // Check for system issues
    Object.entries(health).forEach(([service, status]) => {
      if (service !== 'timestamp' && !status.healthy) {
        this.triggerAlert('service_down', {
          service,
          status: status.message,
          responseTime: status.responseTime
        });
      }
    });
  }

  async checkApiHealth() {
    try {
      const start = performance.now();
      const response = await fetch('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1&limit=1');
      const responseTime = performance.now() - start;
      
      return {
        healthy: response.ok,
        responseTime,
        status: response.status,
        message: response.ok ? 'OK' : 'API Error'
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: 0,
        status: 0,
        message: error.message
      };
    }
  }

  async checkDatabaseHealth() {
    // Check Firebase connection
    try {
      if (window.Storage) {
        const start = performance.now();
        await window.Storage.getSavedMovies();
        const responseTime = performance.now() - start;
        
        return {
          healthy: true,
          responseTime,
          message: 'Firebase OK'
        };
      }
      
      return {
        healthy: false,
        responseTime: 0,
        message: 'Firebase not available'
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: 0,
        message: error.message
      };
    }
  }

  async checkCDNHealth() {
    try {
      const start = performance.now();
      const response = await fetch('/assets/styles.css', { method: 'HEAD' });
      const responseTime = performance.now() - start;
      
      return {
        healthy: response.ok,
        responseTime,
        status: response.status,
        message: response.ok ? 'CDN OK' : 'CDN Error'
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: 0,
        message: error.message
      };
    }
  }

  checkServiceWorkerHealth() {
    if ('serviceWorker' in navigator) {
      const registration = navigator.serviceWorker.controller;
      return {
        healthy: !!registration,
        message: registration ? 'Service Worker Active' : 'Service Worker Inactive'
      };
    }
    
    return {
      healthy: false,
      message: 'Service Worker not supported'
    };
  }

  // Alert system
  initAlertSystem() {
    const interval = setInterval(() => {
      this.processAlerts();
    }, MONITORING_CONFIG.intervals.alerts);
    
    this.intervals.set('alerts', interval);
  }

  triggerAlert(type, data) {
    const alert = {
      id: this.generateAlertId(),
      type,
      data,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type),
      sent: false
    };
    
    this.alerts.push(alert);
    Logger.warn('Alert triggered:', alert);
  }

  getAlertSeverity(type) {
    const severityMap = {
      high_error_rate: 'critical',
      service_down: 'critical',
      high_memory_usage: 'warning',
      slow_performance: 'warning',
      low_cache_hit_rate: 'info'
    };
    
    return severityMap[type] || 'info';
  }

  async processAlerts() {
    const unsentAlerts = this.alerts.filter(alert => !alert.sent);
    
    for (const alert of unsentAlerts) {
      try {
        await this.sendAlert(alert);
        alert.sent = true;
      } catch (error) {
        Logger.error('Failed to send alert:', error);
      }
    }
    
    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => 
      Date.now() - alert.timestamp < 24 * 60 * 60 * 1000 // Keep for 24 hours
    );
  }

  async sendAlert(alert) {
    const message = this.formatAlertMessage(alert);
    
    // Send to multiple channels
    const promises = [];
    
    if (MONITORING_CONFIG.alerts.slack) {
      promises.push(this.sendSlackAlert(message));
    }
    
    if (MONITORING_CONFIG.alerts.discord) {
      promises.push(this.sendDiscordAlert(message));
    }
    
    if (MONITORING_CONFIG.alerts.email) {
      promises.push(this.sendEmailAlert(message));
    }
    
    await Promise.allSettled(promises);
  }

  formatAlertMessage(alert) {
    const emoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    return {
      title: `${emoji[alert.severity]} XemPhim Alert - ${alert.type.replace('_', ' ').toUpperCase()}`,
      message: JSON.stringify(alert.data, null, 2),
      timestamp: new Date(alert.timestamp).toISOString(),
      severity: alert.severity
    };
  }

  async sendSlackAlert(message) {
    if (!MONITORING_CONFIG.alerts.slack) return;
    
    const payload = {
      text: message.title,
      attachments: [{
        color: message.severity === 'critical' ? 'danger' : 'warning',
        fields: [{
          title: 'Details',
          value: message.message,
          short: false
        }, {
          title: 'Timestamp',
          value: message.timestamp,
          short: true
        }]
      }]
    };
    
    await fetch(MONITORING_CONFIG.alerts.slack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async sendDiscordAlert(message) {
    if (!MONITORING_CONFIG.alerts.discord) return;
    
    const payload = {
      embeds: [{
        title: message.title,
        description: message.message,
        color: message.severity === 'critical' ? 0xff0000 : 0xffaa00,
        timestamp: message.timestamp
      }]
    };
    
    await fetch(MONITORING_CONFIG.alerts.discord, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async sendEmailAlert(message) {
    // This would integrate with your email service
    Logger.info('Email alert would be sent:', message);
  }

  // Utility methods
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getCurrentSessionId() {
    // Get current session ID from storage or generate new one
    return sessionStorage.getItem('sessionId') || this.generateSessionId();
  }

  generateAlertId() {
    return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sendAnalytics(event, data) {
    // Send to analytics service (Google Analytics, etc.)
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }
  }

  // Performance threshold checking
  checkPerformanceThresholds(metrics) {
    if (metrics.pageLoad > this.thresholds.pageLoadTime) {
      this.triggerAlert('slow_performance', {
        metric: 'pageLoad',
        value: metrics.pageLoad,
        threshold: this.thresholds.pageLoadTime
      });
    }
    
    if (metrics.apiResponse > this.thresholds.apiResponseTime) {
      this.triggerAlert('slow_performance', {
        metric: 'apiResponse',
        value: metrics.apiResponse,
        threshold: this.thresholds.apiResponseTime
      });
    }
    
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      this.triggerAlert('high_memory_usage', {
        value: (metrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB',
        threshold: (this.thresholds.memoryUsage / 1024 / 1024).toFixed(2) + 'MB'
      });
    }
    
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate) {
      this.triggerAlert('low_cache_hit_rate', {
        value: (metrics.cacheHitRate * 100).toFixed(2) + '%',
        threshold: (this.thresholds.cacheHitRate * 100).toFixed(2) + '%'
      });
    }
  }

  // Public API
  getMetrics() {
    return {
      performance: Object.fromEntries(this.metrics.performance),
      errors: Object.fromEntries(this.metrics.errors),
      users: Object.fromEntries(this.metrics.users),
      system: Object.fromEntries(this.metrics.system)
    };
  }

  getDashboardData() {
    const latest = Array.from(this.metrics.performance.values()).pop();
    const errorCount = this.metrics.errors.size;
    const userCount = this.metrics.users.size;
    
    return {
      performance: latest || {},
      errorCount,
      userCount,
      alerts: this.alerts.filter(a => !a.sent).length,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.startTime = Date.now();
    Logger.info('🔍 Production monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    Logger.info('🔍 Production monitoring stopped');
  }
}

// Global monitoring instance
export const productionMonitor = new ProductionMonitor();

// Auto-start in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  productionMonitor.startMonitoring();
}
