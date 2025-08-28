/**
 * 🚀 Main App Component
 * Orchestrates all components và manages application lifecycle
 */

import { apiClient } from './api-client.js';
import { router } from './router.js';
import { themeManager } from './theme-manager.js';
import { notificationManager } from '../utils/notification.js';
import { errorHandler } from '../utils/error-handler.js';

export class App {
  constructor(options = {}) {
    this.options = {
      enablePreload: true,
      enableAnalytics: false,
      enableServiceWorker: false,
      ...options
    };
    
    this.isInitialized = false;
    this.components = {
      apiClient,
      router,
      themeManager,
      notificationManager,
      errorHandler
    };
    
    this.state = {
      isOnline: navigator.onlineStatus !== false,
      lastActivity: Date.now(),
      performanceMetrics: {}
    };
  }

  /**
   * Initialize application
   */
  async init() {
    if (this.isInitialized) {
      console.warn('⚠️ App already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing XemPhim App...');
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup activity tracking
      this.setupActivityTracking();
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup UI event handlers
      this.setupUIHandlers();
      
      // Preload content if enabled
      if (this.options.enablePreload) {
        await this.preloadContent();
      }
      
      // Setup service worker if enabled
      if (this.options.enableServiceWorker) {
        await this.setupServiceWorker();
      }
      
      this.isInitialized = true;
      console.log('✅ XemPhim App initialized successfully');
      
      // Show welcome notification - POPUP DISABLED
      // notificationManager.success('🎬 Chào mừng đến với XemPhim!', { duration: 3000, subtitle: 'Khám phá hàng ngàn bộ phim hay' }); // DISABLED - no popup
      console.log('🔕 Welcome notification disabled - no popup');
      
    } catch (error) {
      errorHandler.handle(error, { type: 'app-init' }, 'Lỗi khởi tạo ứng dụng');
      throw error;
    }
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      errorHandler.handle(event.error, {
        type: 'global-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      errorHandler.handle(event.reason, {
        type: 'unhandled-promise'
      });
      event.preventDefault();
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (typeof performance === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          this.state.performanceMetrics = {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
          
          console.log('📊 Performance metrics:', this.state.performanceMetrics);
        }
      }, 0);
    });
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      notificationManager.success('🌐 Kết nối mạng đã được khôi phục');
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      notificationManager.warning('📡 Mất kết nối mạng', {
        persistent: true,
        subtitle: 'Một số tính năng có thể không hoạt động'
      });
    });
  }

  /**
   * Setup activity tracking
   */
  setupActivityTracking() {
    const updateActivity = () => {
      this.state.lastActivity = Date.now();
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // Components are already initialized via imports
    // This method can be used for additional setup if needed
    
    // Check API health
    const isAPIHealthy = await apiClient.healthCheck();
    if (!isAPIHealthy) {
      notificationManager.warning('⚠️ API không khả dụng', {
        subtitle: 'Một số tính năng có thể bị hạn chế'
      });
    }
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // Import route handlers dynamically to avoid circular dependencies
    import('./route-handlers.js').then(({ routeHandlers }) => {
      router.route('/', routeHandlers.home);
      router.route('/tim-kiem', routeHandlers.search);
      router.route('/loc', routeHandlers.filter);
      router.route('/the-loai/:category', routeHandlers.category);
      router.route('/quoc-gia/:country', routeHandlers.country);
      router.route('/nam/:year', routeHandlers.year);
      router.route('/phim/:slug', routeHandlers.movieDetail);
      router.route('/xem/:slug', routeHandlers.watch);
      
      console.log('🧭 Routes configured');
    }).catch(error => {
      errorHandler.handle(error, { type: 'route-setup' });
    });
  }

  /**
   * Setup UI event handlers
   */
  setupUIHandlers() {
    // Search form handler
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          router.navigate('/tim-kiem', { keyword: query });
        }
      });
    }

    // Home button handler
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/');
      });
    }

    // Theme toggle handler
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        themeManager.toggleTheme();
      });
    }

    // Cache clear shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.clearCaches();
      }
    });
  }

  /**
   * Preload popular content
   */
  async preloadContent() {
    try {
      await apiClient.preloadPopularContent();
    } catch (error) {
      console.warn('⚠️ Content preload failed:', error.message);
    }
  }

  /**
   * Setup service worker
   */
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    const stats = apiClient.clearCache();
    notificationManager.success('🧹 Caches cleared!', {
      subtitle: `Cleared ${Object.values(stats).reduce((a, b) => a + b, 0)} items`
    });
  }

  /**
   * Get application state
   * @returns {Object} Current app state
   */
  getState() {
    return {
      ...this.state,
      isInitialized: this.isInitialized,
      currentRoute: router.getCurrentRoute(),
      currentTheme: themeManager.getCurrentTheme(),
      cacheStats: apiClient.getCacheStats()
    };
  }

  /**
   * Destroy application
   */
  destroy() {
    // Cleanup event listeners and resources
    this.components.themeManager?.destroy?.();
    this.components.notificationManager?.destroy?.();
    
    this.isInitialized = false;
    console.log('🗑️ App destroyed');
  }
}

// Export singleton instance
export const app = new App();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.app = app;
}

export default App;
