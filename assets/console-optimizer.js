/**
 * 🔇 Console Optimizer
 * Reduces console spam and optimizes logging for better performance
 */

// Track logged messages to prevent spam
const loggedMessages = new Set();
const logCounts = new Map();

// Original console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Optimized console.log with spam prevention
console.log = function(...args) {
  const message = args.join(' ');
  
  // Suppress repetitive Firebase User ID messages
  if (message.includes('🆔 Found User ID in localStorage')) {
    const key = 'firebase-user-id-found';
    const count = logCounts.get(key) || 0;
    
    if (count === 0) {
      originalLog.apply(console, args);
      logCounts.set(key, 1);
    } else if (count < 3) {
      logCounts.set(key, count + 1);
    }
    // Suppress after 3 times
    return;
  }
  
  // Suppress repetitive Firebase initialization messages
  if (message.includes('🔥 Initializing Movie Comment System') ||
      message.includes('🌐 Environment details') ||
      message.includes('✅ Loaded: firebase-')) {
    const key = message.substring(0, 50);
    if (loggedMessages.has(key)) {
      return; // Suppress duplicate
    }
    loggedMessages.add(key);
  }
  
  // Allow all other messages
  originalLog.apply(console, args);
};

// Optimized console.warn with filtering
console.warn = function(...args) {
  const message = args.join(' ');
  
  // Suppress known Firebase warnings that are not critical
  if (message.includes('Firebase is already defined') ||
      message.includes('Firebase library is only loaded once') ||
      message.includes('Offline support failed: failed-precondition')) {
    return; // Suppress these warnings
  }
  
  originalWarn.apply(console, args);
};

// Keep console.error unchanged for debugging
console.error = originalError;

// Performance optimization: Debounce frequent operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimize Firebase operations
if (window.movieComments) {
  // Debounce user ID retrieval
  const originalGetUserId = window.movieComments.getUserId;
  if (originalGetUserId) {
    window.movieComments.getUserId = debounce(originalGetUserId.bind(window.movieComments), 100);
  }
}

// Clean up old log tracking data periodically
setInterval(() => {
  // Clear logged messages older than 5 minutes
  loggedMessages.clear();
  
  // Reset log counts
  logCounts.clear();
  
  console.log('🧹 Console optimizer: Cleared tracking data');
}, 5 * 60 * 1000);

// Performance monitoring with reduced logging
const performanceObserver = {
  longTaskCount: 0,
  lastReport: Date.now(),
  
  reportLongTask() {
    this.longTaskCount++;
    
    // Only report every 10 long tasks or every 30 seconds
    const now = Date.now();
    if (this.longTaskCount % 10 === 0 || now - this.lastReport > 30000) {
      console.warn(`⚠️ Performance: ${this.longTaskCount} long tasks detected`);
      this.lastReport = now;
    }
  }
};

// Monitor long tasks if supported
if ('PerformanceObserver' in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          performanceObserver.reportLongTask();
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // Silently fail if not supported
  }
}

// Memory usage monitoring (reduced frequency)
if (performance.memory) {
  let lastMemoryReport = 0;
  
  setInterval(() => {
    const now = Date.now();
    if (now - lastMemoryReport > 60000) { // Report every minute
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      
      if (used > 50) { // Only report if using more than 50MB
        console.log(`📊 Memory: ${used}MB / ${total}MB`);
      }
      
      lastMemoryReport = now;
    }
  }, 10000);
}

// Network status monitoring (reduced logging)
let networkStatusLogged = false;

window.addEventListener('online', () => {
  if (!networkStatusLogged) {
    console.log('🌐 Network: Online');
    networkStatusLogged = true;
    setTimeout(() => { networkStatusLogged = false; }, 5000);
  }
});

window.addEventListener('offline', () => {
  if (!networkStatusLogged) {
    console.log('📡 Network: Offline');
    networkStatusLogged = true;
    setTimeout(() => { networkStatusLogged = false; }, 5000);
  }
});

// Optimize notification display
if (window.notificationManager) {
  const originalShow = window.notificationManager.show;
  
  window.notificationManager.show = function(message, type, options) {
    // Prevent duplicate notifications within 2 seconds
    const key = `${type}-${message}`;
    const now = Date.now();
    
    if (!this._lastNotifications) {
      this._lastNotifications = new Map();
    }
    
    const lastTime = this._lastNotifications.get(key);
    if (lastTime && now - lastTime < 2000) {
      return; // Suppress duplicate
    }
    
    this._lastNotifications.set(key, now);
    return originalShow.call(this, message, type, options);
  };
}

// Export optimization status
window.consoleOptimizer = {
  isActive: true,
  suppressedMessages: loggedMessages.size,
  logCounts: Object.fromEntries(logCounts),
  
  getStats() {
    return {
      suppressedMessages: this.suppressedMessages,
      logCounts: this.logCounts,
      longTasks: performanceObserver.longTaskCount
    };
  },
  
  reset() {
    loggedMessages.clear();
    logCounts.clear();
    performanceObserver.longTaskCount = 0;
    console.log('🔄 Console optimizer reset');
  }
};

console.log('🔇 Console Optimizer loaded - Reducing log spam and improving performance');

// Show optimization status after 3 seconds
setTimeout(() => {
  if (window.notificationManager) {
    window.notificationManager.info('🔇 Console optimized', {
      duration: 2000
    });
  }
}, 3000);
