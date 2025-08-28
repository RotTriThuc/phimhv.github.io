/**
 * 🚀 App Modules Loader
 * ES6 modules loader for browser environment
 */

// Import browser-compatible constants
import { CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/browser-constants.js';

// Import all the new modular components (will be loaded conditionally)
// For now, we'll create lightweight versions directly here to avoid import issues

// Simple notification manager for browser
class SimpleNotificationManager {
  constructor() {
    this.notifications = new Map();
    this.maxNotifications = 5;
    this.container = null;
    this.init();
  }

  init() {
    // Create notification container
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    document.body.appendChild(this.container);
    this.addStyles();
  }

  addStyles() {
    if (document.querySelector('#simple-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'simple-notification-styles';
    style.textContent = `
      .simple-notification {
        pointer-events: auto;
        margin-bottom: 12px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        word-wrap: break-word;
        animation: slideInRight 0.3s ease-out;
        cursor: pointer;
      }

      .simple-notification.success {
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
      }

      .simple-notification.error {
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
      }

      .simple-notification.warning {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
      }

      .simple-notification.info {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
      }

      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  show(message, type = 'info', options = {}) {
    // HOÀN TOÀN TẮT simple notification system
    console.log('🔕 Simple notification system disabled:', { message, type, options });
    return null; // KHÔNG hiển thị popup

    // Code below is disabled to prevent any popup notifications
    /*
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.duration || CONFIG.UI.NOTIFICATION_DURATION;

    const notification = document.createElement('div');
    notification.className = `simple-notification ${type}`;
    notification.textContent = message;
    notification.onclick = () => this.hide(id);

    this.container.appendChild(notification);
    this.notifications.set(id, { element: notification, type, message });

    // Auto-remove
    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    // Limit notifications
    this.limitNotifications();

    return id;
    */
  }

  hide(id) {
    const notification = this.notifications.get(id);
    if (notification && notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
      this.notifications.delete(id);
    }
  }

  limitNotifications() {
    if (this.notifications.size <= this.maxNotifications) return;

    const oldest = Array.from(this.notifications.keys())[0];
    this.hide(oldest);
  }

  success(message, options = {}) { return this.show(message, 'success', options); }
  error(message, options = {}) { return this.show(message, 'error', options); }
  warning(message, options = {}) { return this.show(message, 'warning', options); }
  info(message, options = {}) { return this.show(message, 'info', options); }
}

// Create instances
const notificationManager = new SimpleNotificationManager();

// Make available globally
window.notificationManager = notificationManager;
window.CONFIG = CONFIG;

// Enhanced Storage System with Firebase integration
class EnhancedStorage {
  constructor() {
    this.isFirebaseReady = false;
    this.movieComments = null;
    this.initPromise = this.init();
  }

  async init() {
    try {
      // Wait for Firebase to be ready
      if (window.movieComments) {
        await window.movieComments.init();
        this.movieComments = window.movieComments;
        this.isFirebaseReady = true;
        console.log('✅ Enhanced Storage with Firebase ready');
      } else {
        console.warn('⚠️ Firebase not available, using localStorage only');
      }
    } catch (error) {
      console.error('❌ Enhanced Storage init failed:', error);
    }
  }

  async ensureReady() {
    await this.initPromise;
  }

  // Save movie with Firebase fallback to localStorage
  async saveMovie(movie) {
    await this.ensureReady();
    
    if (this.isFirebaseReady && this.movieComments) {
      try {
        return await this.movieComments.saveMovie(movie);
      } catch (error) {
        console.warn('⚠️ Firebase save failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return this.saveToLocalStorage(movie);
  }

  // Remove movie with Firebase fallback
  async removeSavedMovie(slug) {
    await this.ensureReady();
    
    if (this.isFirebaseReady && this.movieComments) {
      try {
        return await this.movieComments.removeSavedMovie(slug);
      } catch (error) {
        console.warn('⚠️ Firebase remove failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return this.removeFromLocalStorage(slug);
  }

  // Get saved movies with Firebase fallback
  async getSavedMovies() {
    await this.ensureReady();
    
    if (this.isFirebaseReady && this.movieComments) {
      try {
        return await this.movieComments.getSavedMovies();
      } catch (error) {
        console.warn('⚠️ Firebase get failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return this.getFromLocalStorage();
  }

  // Check if movie is saved
  async isMovieSaved(slug) {
    await this.ensureReady();
    
    if (this.isFirebaseReady && this.movieComments) {
      try {
        return await this.movieComments.isMovieSaved(slug);
      } catch (error) {
        console.warn('⚠️ Firebase check failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    const saved = this.getFromLocalStorage();
    return saved.some(movie => movie.slug === slug);
  }

  // localStorage methods
  saveToLocalStorage(movie) {
    try {
      const saved = this.getFromLocalStorage();
      
      // Check if already exists
      if (saved.some(m => m.slug === movie.slug)) {
        return false;
      }
      
      const movieData = {
        slug: movie.slug,
        name: movie.name,
        poster_url: movie.poster_url || movie.thumb_url,
        year: movie.year,
        lang: movie.lang,
        quality: movie.quality,
        episode_current: movie.episode_current,
        savedAt: Date.now()
      };
      
      saved.unshift(movieData);
      localStorage.setItem('savedMovies', JSON.stringify(saved));
      
      notificationManager.success(`✅ Đã lưu "${movie.name}" (offline mode)`);
      return true;
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      return false;
    }
  }

  removeFromLocalStorage(slug) {
    try {
      const saved = this.getFromLocalStorage();
      const filtered = saved.filter(m => m.slug !== slug);
      
      if (filtered.length === saved.length) {
        return false; // Not found
      }
      
      localStorage.setItem('savedMovies', JSON.stringify(filtered));
      
      const movie = saved.find(m => m.slug === slug);
      notificationManager.success(`✅ Đã xóa "${movie?.name || slug}" (offline mode)`);
      return true;
    } catch (error) {
      console.error('❌ localStorage remove failed:', error);
      return false;
    }
  }

  getFromLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem('savedMovies') || '[]');
    } catch (error) {
      console.error('❌ localStorage get failed:', error);
      return [];
    }
  }
}

// Create enhanced storage instance
const enhancedStorage = new EnhancedStorage();
window.Storage = enhancedStorage;

// Initialize theme
themeManager.init();

// Simple error handler
class SimpleErrorHandler {
  handle(error, context = {}) {
    console.error('🚨 Error:', error, context);

    // Show user notification if available - POPUP DISABLED
    if (window.notificationManager) {
      const message = error?.message || 'Đã xảy ra lỗi không mong muốn';
      // window.notificationManager.error(message); // DISABLED - no popup
      console.log('🔕 Error notification disabled:', message);
    }
  }
}

// Simple performance monitor
class SimplePerformanceMonitor {
  init() {
    console.log('📊 Simple Performance Monitor initialized');
  }
}

// Create instances
const errorHandler = new SimpleErrorHandler();
const performanceMonitor = new SimplePerformanceMonitor();

// Make globally available
window.errorHandler = errorHandler;
window.performanceMonitor = performanceMonitor;

// Setup global error handling
window.addEventListener('error', (event) => {
  errorHandler.handle(event.error, {
    type: 'global-error',
    filename: event.filename,
    lineno: event.lineno
  });
});

// Setup performance monitoring
performanceMonitor.init();

// Cache clear shortcut
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();

    let clearedCount = 0;

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.includes('cache') || key.includes('Cache'));
      cacheKeys.forEach(key => localStorage.removeItem(key));
      clearedCount += cacheKeys.length;
    } catch (error) {
      console.warn('Could not clear localStorage cache');
    }

    // Clear sessionStorage cache
    try {
      const keys = Object.keys(sessionStorage);
      const cacheKeys = keys.filter(key => key.includes('cache') || key.includes('Cache'));
      cacheKeys.forEach(key => sessionStorage.removeItem(key));
      clearedCount += cacheKeys.length;
    } catch (error) {
      console.warn('Could not clear sessionStorage cache');
    }

    // Clear any global caches
    if (window.apiCache && typeof window.apiCache.clear === 'function') {
      window.apiCache.clear();
      clearedCount++;
    }

    notificationManager.success(`🧹 Cleared ${clearedCount} cache items!`);
    console.log('🧹 Manual cache clear completed');
  }
});

// Enhanced notification for successful module loading - POPUP DISABLED
console.log('🚀 App Modules loaded successfully');
// notificationManager.info('🔧 Enhanced features loaded', { duration: 2000 }); // DISABLED - no popup
console.log('🔕 Enhanced features loaded notification disabled - no popup');

// Export for potential use
export {
  notificationManager,
  enhancedStorage,
  CONFIG
};
