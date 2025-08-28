/**
 * 🚀 Lazy Loader System
 * Lazy load modules, images và components để tối ưu hiệu suất
 */

export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingModules = new Map();
    this.imageObserver = null;
    this.componentObserver = null;
    
    this.initImageLazyLoading();
    this.initComponentLazyLoading();
  }

  /**
   * Lazy load ES6 module
   */
  async loadModule(modulePath, options = {}) {
    const cacheKey = modulePath;
    
    // Return cached module
    if (this.loadedModules.has(cacheKey)) {
      console.log(`📦 Module loaded from cache: ${modulePath}`);
      return this.loadedModules.get(cacheKey);
    }

    // Wait if already loading
    if (this.loadingModules.has(cacheKey)) {
      console.log(`⏳ Module already loading: ${modulePath}`);
      return await this.loadingModules.get(cacheKey);
    }

    // Start loading
    const loadPromise = this.doLoadModule(modulePath, options);
    this.loadingModules.set(cacheKey, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(cacheKey, module);
      this.loadingModules.delete(cacheKey);
      
      console.log(`✅ Module loaded: ${modulePath}`);
      return module;
      
    } catch (error) {
      this.loadingModules.delete(cacheKey);
      console.error(`❌ Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }

  /**
   * Actually load the module
   */
  async doLoadModule(modulePath, options) {
    const startTime = performance.now();
    
    try {
      // Add cache busting if needed
      const url = options.cacheBust ? 
        `${modulePath}?v=${Date.now()}` : 
        modulePath;
      
      const module = await import(url);
      
      const loadTime = performance.now() - startTime;
      console.log(`📊 Module ${modulePath} loaded in ${loadTime.toFixed(2)}ms`);
      
      return module;
      
    } catch (error) {
      console.error(`❌ Import failed for ${modulePath}:`, error);
      throw error;
    }
  }

  /**
   * Lazy load notification system
   */
  async loadNotificationSystem() {
    try {
      console.log('🔔 Loading notification system...');
      
      const [
        { notificationDataManager },
        { adminNotificationManager },
        { notificationButton },
        { notificationDropdown },
        { initNotificationSystem }
      ] = await Promise.all([
        this.loadModule('./utils/notification-data-manager.js'),
        this.loadModule('./utils/admin-notification-manager.js'),
        this.loadModule('./components/notification-button.js'),
        this.loadModule('./components/notification-dropdown.js'),
        this.loadModule('./assets/notification-init.js')
      ]);

      // Initialize the system
      await initNotificationSystem();
      
      console.log('✅ Notification system loaded and initialized');
      
      return {
        notificationDataManager,
        adminNotificationManager,
        notificationButton,
        notificationDropdown
      };
      
    } catch (error) {
      console.error('❌ Failed to load notification system:', error);
      throw error;
    }
  }

  /**
   * Lazy load route component
   */
  async loadRoute(routeName) {
    const routeModules = {
      'home': './pages/home.js',
      'movie-detail': './pages/movie-detail.js',
      'category': './pages/category.js',
      'search': './pages/search.js',
      'favorites': './pages/favorites.js'
    };

    const modulePath = routeModules[routeName];
    if (!modulePath) {
      throw new Error(`Unknown route: ${routeName}`);
    }

    console.log(`🛣️ Loading route: ${routeName}`);
    return await this.loadModule(modulePath);
  }

  /**
   * Initialize image lazy loading
   */
  initImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.imageObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      console.log('🖼️ Image lazy loading initialized');
    } else {
      console.warn('⚠️ IntersectionObserver not supported, falling back to immediate loading');
    }
  }

  /**
   * Initialize component lazy loading
   */
  initComponentLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.componentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadComponent(entry.target);
            this.componentObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.01
      });
      
      console.log('🧩 Component lazy loading initialized');
    }
  }

  /**
   * Load image
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.add('loaded');
      
      img.onload = () => {
        img.classList.add('fade-in');
        console.log(`🖼️ Image loaded: ${src.substring(0, 50)}...`);
      };
      
      img.onerror = () => {
        img.classList.add('error');
        img.alt = 'Failed to load image';
        console.warn(`⚠️ Failed to load image: ${src}`);
      };
    }
  }

  /**
   * Load component
   */
  async loadComponent(element) {
    const componentName = element.dataset.component;
    const componentPath = element.dataset.componentPath;
    
    if (!componentName || !componentPath) {
      console.warn('⚠️ Component missing name or path attributes');
      return;
    }

    try {
      console.log(`🧩 Loading component: ${componentName}`);
      
      const module = await this.loadModule(componentPath);
      const ComponentClass = module[componentName] || module.default;
      
      if (ComponentClass) {
        const component = new ComponentClass(element);
        element.classList.add('component-loaded');
        
        console.log(`✅ Component loaded: ${componentName}`);
      } else {
        throw new Error(`Component ${componentName} not found in module`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to load component ${componentName}:`, error);
      element.classList.add('component-error');
      element.innerHTML = `<div class="error">Failed to load ${componentName}</div>`;
    }
  }

  /**
   * Observe images for lazy loading
   */
  observeImages(container = document) {
    if (!this.imageObserver) return;
    
    const images = container.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.imageObserver.observe(img);
    });
    
    console.log(`👀 Observing ${images.length} images for lazy loading`);
  }

  /**
   * Observe components for lazy loading
   */
  observeComponents(container = document) {
    if (!this.componentObserver) return;
    
    const components = container.querySelectorAll('[data-component]');
    components.forEach(component => {
      this.componentObserver.observe(component);
    });
    
    console.log(`👀 Observing ${components.length} components for lazy loading`);
  }

  /**
   * Preload critical modules
   */
  async preloadCritical() {
    const criticalModules = [
      './utils/data-pagination.js',
      './utils/virtual-scroller.js',
      './components/router.js'
    ];

    console.log('🚀 Preloading critical modules...');
    
    const promises = criticalModules.map(module => 
      this.loadModule(module).catch(error => {
        console.warn(`⚠️ Failed to preload ${module}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('✅ Critical modules preloaded');
  }

  /**
   * Preload route modules
   */
  async preloadRoutes(routes = ['home', 'movie-detail']) {
    console.log(`🛣️ Preloading routes: ${routes.join(', ')}`);
    
    const promises = routes.map(route => 
      this.loadRoute(route).catch(error => {
        console.warn(`⚠️ Failed to preload route ${route}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('✅ Routes preloaded');
  }

  /**
   * Load script dynamically
   */
  async loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;
      
      script.onload = () => {
        console.log(`📜 Script loaded: ${src}`);
        resolve(script);
      };
      
      script.onerror = () => {
        console.error(`❌ Failed to load script: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Load CSS dynamically
   */
  async loadCSS(href, options = {}) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        console.log(`🎨 CSS already loaded: ${href}`);
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      link.onload = () => {
        console.log(`🎨 CSS loaded: ${href}`);
        resolve(link);
      };
      
      link.onerror = () => {
        console.error(`❌ Failed to load CSS: ${href}`);
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      loadedModules: Array.from(this.loadedModules.keys()),
      loadingModules: Array.from(this.loadingModules.keys()),
      totalLoaded: this.loadedModules.size,
      currentlyLoading: this.loadingModules.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.loadedModules.clear();
    console.log('🧹 Module cache cleared');
  }

  /**
   * Destroy lazy loader
   */
  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    
    if (this.componentObserver) {
      this.componentObserver.disconnect();
    }
    
    this.clearCache();
    console.log('🗑️ Lazy loader destroyed');
  }
}

// Export singleton instance
export const lazyLoader = new LazyLoader();

// Global access
if (typeof window !== 'undefined') {
  window.LazyLoader = LazyLoader;
  window.lazyLoader = lazyLoader;
}

// Auto-initialize image lazy loading on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      lazyLoader.observeImages();
      lazyLoader.observeComponents();
    });
  } else {
    lazyLoader.observeImages();
    lazyLoader.observeComponents();
  }
}
