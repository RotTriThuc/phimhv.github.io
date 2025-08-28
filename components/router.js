/**
 * 🧭 Router Component
 * Client-side routing với hash-based navigation
 */

import { errorHandler } from '../utils/error-handler.js';
import { notificationManager } from '../utils/notification.js';

export class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.middlewares = [];
    this.currentRoute = null;
    this.isRouting = false;
    this.routingQueue = [];
    this.defaultRoute = options.defaultRoute || '/';
    this.notFoundHandler = options.notFoundHandler || this.defaultNotFoundHandler;
    
    this.init();
  }

  /**
   * Initialize router
   */
  init() {
    // Bind event listeners
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
    
    console.log('🧭 Router initialized');
  }

  /**
   * Register route
   * @param {string} path - Route path pattern
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options
   */
  route(path, handler, options = {}) {
    const routeConfig = {
      handler,
      middleware: options.middleware || [],
      name: options.name || path,
      meta: options.meta || {}
    };
    
    this.routes.set(path, routeConfig);
    console.log(`📍 Route registered: ${path}`);
  }

  /**
   * Register multiple routes
   * @param {Object} routes - Routes object
   */
  routes(routes) {
    Object.entries(routes).forEach(([path, config]) => {
      if (typeof config === 'function') {
        this.route(path, config);
      } else {
        this.route(path, config.handler, config);
      }
    });
  }

  /**
   * Add global middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Navigate to route
   * @param {string} path - Target path
   * @param {Object} params - Route parameters
   * @param {boolean} replace - Replace current history entry
   */
  navigate(path, params = {}, replace = false) {
    const url = this.buildUrl(path, params);
    
    if (replace) {
      window.location.replace(url);
    } else {
      window.location.hash = url;
    }
  }

  /**
   * Build URL with parameters
   * @param {string} path - Base path
   * @param {Object} params - URL parameters
   * @returns {string} Complete URL
   */
  buildUrl(path, params = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return url.pathname + url.search;
  }

  /**
   * Parse current hash
   * @returns {Object} Parsed route info
   */
  parseHash() {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    const [path, search] = hash.split('?');
    const params = new URLSearchParams(search || '');
    
    return {
      path: decodeURIComponent(path),
      params: Object.fromEntries(params.entries()),
      hash,
      search
    };
  }

  /**
   * Handle route change
   */
  async handleRouteChange() {
    if (this.isRouting) {
      this.routingQueue.push(() => this.handleRouteChange());
      return;
    }

    this.isRouting = true;

    try {
      const routeInfo = this.parseHash();
      console.log(`🧭 Navigating to: ${routeInfo.path}`);

      // Find matching route
      const matchedRoute = this.findMatchingRoute(routeInfo.path);
      
      if (!matchedRoute) {
        await this.notFoundHandler(routeInfo);
        return;
      }

      // Execute global middlewares
      for (const middleware of this.middlewares) {
        const result = await this.executeMiddleware(middleware, routeInfo);
        if (result === false) {
          console.log('🚫 Route blocked by global middleware');
          return;
        }
      }

      // Execute route-specific middlewares
      for (const middleware of matchedRoute.config.middleware) {
        const result = await this.executeMiddleware(middleware, routeInfo);
        if (result === false) {
          console.log('🚫 Route blocked by route middleware');
          return;
        }
      }

      // Execute route handler
      this.currentRoute = { ...routeInfo, config: matchedRoute.config };
      await matchedRoute.config.handler(routeInfo);

      console.log(`✅ Route handled: ${routeInfo.path}`);

    } catch (error) {
      errorHandler.handle(error, { 
        type: 'routing', 
        path: this.parseHash().path 
      }, 'Lỗi khi điều hướng trang');
      
      // Fallback to home page
      this.navigate(this.defaultRoute, {}, true);
    } finally {
      this.isRouting = false;
      this.processRoutingQueue();
    }
  }

  /**
   * Find matching route
   * @param {string} path - Request path
   * @returns {Object|null} Matched route
   */
  findMatchingRoute(path) {
    // Exact match first
    if (this.routes.has(path)) {
      return { pattern: path, config: this.routes.get(path) };
    }

    // Pattern matching
    for (const [pattern, config] of this.routes) {
      if (this.matchPattern(pattern, path)) {
        return { pattern, config };
      }
    }

    return null;
  }

  /**
   * Match route pattern
   * @param {string} pattern - Route pattern
   * @param {string} path - Request path
   * @returns {boolean} Match result
   */
  matchPattern(pattern, path) {
    // Simple pattern matching for now
    // Can be extended for more complex patterns
    
    if (pattern.includes('*')) {
      const prefix = pattern.replace('*', '');
      return path.startsWith(prefix);
    }

    if (pattern.includes(':')) {
      const patternParts = pattern.split('/');
      const pathParts = path.split('/');
      
      if (patternParts.length !== pathParts.length) {
        return false;
      }
      
      return patternParts.every((part, index) => {
        return part.startsWith(':') || part === pathParts[index];
      });
    }

    return pattern === path;
  }

  /**
   * Execute middleware
   * @param {Function} middleware - Middleware function
   * @param {Object} routeInfo - Route information
   * @returns {Promise<*>} Middleware result
   */
  async executeMiddleware(middleware, routeInfo) {
    try {
      return await middleware(routeInfo, this);
    } catch (error) {
      errorHandler.handle(error, { 
        type: 'middleware', 
        path: routeInfo.path 
      });
      return false;
    }
  }

  /**
   * Process routing queue
   */
  processRoutingQueue() {
    if (this.routingQueue.length > 0) {
      const nextRoute = this.routingQueue.shift();
      setTimeout(nextRoute, 0);
    }
  }

  /**
   * Default not found handler
   * @param {Object} routeInfo - Route information
   */
  async defaultNotFoundHandler(routeInfo) {
    console.warn(`🚫 Route not found: ${routeInfo.path}`);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--muted);">
          <h2>🚫 Trang không tồn tại</h2>
          <p>Đường dẫn "${routeInfo.path}" không được tìm thấy.</p>
          <button onclick="router.navigate('/')" style="
            background: var(--primary); 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer;
            margin-top: 20px;
          ">
            🏠 Về trang chủ
          </button>
        </div>
      `;
    }
  }

  /**
   * Get current route info
   * @returns {Object|null} Current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Check if currently routing
   * @returns {boolean} Routing status
   */
  isCurrentlyRouting() {
    return this.isRouting;
  }

  /**
   * Get all registered routes
   * @returns {Array} Routes list
   */
  getRoutes() {
    return Array.from(this.routes.entries()).map(([path, config]) => ({
      path,
      name: config.name,
      meta: config.meta
    }));
  }

  /**
   * Clear routing queue
   */
  clearQueue() {
    this.routingQueue = [];
  }
}

// Export singleton instance
export const router = new Router();

// Make it globally available
if (typeof window !== 'undefined') {
  window.router = router;
}

export default Router;
