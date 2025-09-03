/* Bundle Optimizer - Code splitting and lazy loading implementation */

import { Logger } from './logger.js';

// Dynamic import utility with error handling
export class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
  }

  async loadModule(modulePath, retryCount = 0) {
    // Return cached module if already loaded
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // Create loading promise
    const loadingPromise = this.performModuleLoad(modulePath, retryCount);
    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(modulePath, module);
      this.loadingPromises.delete(modulePath);
      this.retryAttempts.delete(modulePath);

      Logger.debug(`Module loaded successfully: ${modulePath}`);
      return module;
    } catch (error) {
      this.loadingPromises.delete(modulePath);

      if (retryCount < this.maxRetries) {
        Logger.warn(
          `Module load failed, retrying (${retryCount + 1}/${this.maxRetries}): ${modulePath}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
        return this.loadModule(modulePath, retryCount + 1);
      }

      Logger.error(
        `Module load failed after ${this.maxRetries} attempts: ${modulePath}`,
        error
      );
      throw error;
    }
  }

  async performModuleLoad(modulePath) {
    const startTime = performance.now();

    try {
      const module = await import(modulePath);
      const loadTime = performance.now() - startTime;

      Logger.debug(
        `Module load time: ${modulePath} - ${loadTime.toFixed(2)}ms`
      );

      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      Logger.error(
        `Module load failed: ${modulePath} - ${loadTime.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  }

  preloadModule(modulePath) {
    // Preload module without waiting
    this.loadModule(modulePath).catch((error) => {
      Logger.warn(`Module preload failed: ${modulePath}`, error);
    });
  }

  getLoadedModules() {
    return Array.from(this.loadedModules.keys());
  }

  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.retryAttempts.clear();
    Logger.info('Module cache cleared');
  }
}

// Code splitting configuration
export class CodeSplitter {
  constructor() {
    this.chunks = new Map();
    this.dependencies = new Map();
    this.loadOrder = [];
  }

  defineChunk(name, modules, dependencies = []) {
    this.chunks.set(name, {
      name,
      modules,
      dependencies,
      loaded: false,
      loading: false
    });

    this.dependencies.set(name, dependencies);
    Logger.debug(`Chunk defined: ${name} with ${modules.length} modules`);
  }

  async loadChunk(chunkName) {
    const chunk = this.chunks.get(chunkName);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkName}`);
    }

    if (chunk.loaded) {
      Logger.debug(`Chunk already loaded: ${chunkName}`);
      return;
    }

    if (chunk.loading) {
      Logger.debug(`Chunk already loading: ${chunkName}`);
      return;
    }

    chunk.loading = true;

    try {
      // Load dependencies first
      await this.loadDependencies(chunkName);

      // Load chunk modules
      const modulePromises = chunk.modules.map((modulePath) =>
        moduleLoader.loadModule(modulePath)
      );

      await Promise.all(modulePromises);

      chunk.loaded = true;
      chunk.loading = false;
      this.loadOrder.push(chunkName);

      Logger.info(`Chunk loaded successfully: ${chunkName}`);
    } catch (error) {
      chunk.loading = false;
      Logger.error(`Chunk load failed: ${chunkName}`, error);
      throw error;
    }
  }

  async loadDependencies(chunkName) {
    const dependencies = this.dependencies.get(chunkName) || [];

    for (const depName of dependencies) {
      await this.loadChunk(depName);
    }
  }

  preloadChunk(chunkName) {
    this.loadChunk(chunkName).catch((error) => {
      Logger.warn(`Chunk preload failed: ${chunkName}`, error);
    });
  }

  getLoadOrder() {
    return [...this.loadOrder];
  }

  getChunkStats() {
    const stats = {
      total: this.chunks.size,
      loaded: 0,
      loading: 0,
      pending: 0
    };

    for (const chunk of this.chunks.values()) {
      if (chunk.loaded) stats.loaded++;
      else if (chunk.loading) stats.loading++;
      else stats.pending++;
    }

    return stats;
  }
}

// Lazy loading utilities
export class LazyLoader {
  constructor() {
    this.observers = new Map();
    this.loadedElements = new WeakSet();
  }

  // Lazy load components when they enter viewport
  observeComponent(element, loadCallback, options = {}) {
    if (this.loadedElements.has(element)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
            this.loadedElements.add(entry.target);
            observer.unobserve(entry.target);

            try {
              loadCallback(entry.target);
              Logger.debug('Lazy component loaded:', entry.target.className);
            } catch (error) {
              Logger.error('Lazy component load failed:', error);
            }
          }
        });
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  // Lazy load on user interaction
  observeInteraction(element, loadCallback, events = ['click', 'focus']) {
    if (this.loadedElements.has(element)) {
      return;
    }

    const handleInteraction = () => {
      if (!this.loadedElements.has(element)) {
        this.loadedElements.add(element);

        // Remove event listeners
        events.forEach((event) => {
          element.removeEventListener(event, handleInteraction);
        });

        try {
          loadCallback(element);
          Logger.debug(
            'Interaction-triggered component loaded:',
            element.className
          );
        } catch (error) {
          Logger.error('Interaction-triggered component load failed:', error);
        }
      }
    };

    events.forEach((event) => {
      element.addEventListener(event, handleInteraction, { once: true });
    });
  }

  // Lazy load after delay
  observeDelay(element, loadCallback, delay = 2000) {
    if (this.loadedElements.has(element)) {
      return;
    }

    setTimeout(() => {
      if (!this.loadedElements.has(element)) {
        this.loadedElements.add(element);

        try {
          loadCallback(element);
          Logger.debug('Delay-triggered component loaded:', element.className);
        } catch (error) {
          Logger.error('Delay-triggered component load failed:', error);
        }
      }
    }, delay);
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Resource preloading
export class ResourcePreloader {
  constructor() {
    this.preloadedResources = new Set();
    this.preloadQueue = [];
    this.isProcessing = false;
  }

  preloadScript(src, priority = 'low') {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.preloadQueue.push({
        type: 'script',
        src,
        priority,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  preloadStylesheet(href, priority = 'low') {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.preloadQueue.push({
        type: 'stylesheet',
        src: href,
        priority,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  preloadImage(src, priority = 'low') {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.preloadQueue.push({
        type: 'image',
        src,
        priority,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Sort by priority (high -> medium -> low)
    this.preloadQueue.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    while (this.preloadQueue.length > 0) {
      const resource = this.preloadQueue.shift();

      try {
        await this.loadResource(resource);
        this.preloadedResources.add(resource.src);
        resource.resolve();
        Logger.debug(`Resource preloaded: ${resource.src}`);
      } catch (error) {
        Logger.warn(`Resource preload failed: ${resource.src}`, error);
        resource.reject(error);
      }

      // Small delay to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.isProcessing = false;
  }

  loadResource(resource) {
    return new Promise((resolve, reject) => {
      let element;

      switch (resource.type) {
      case 'script':
        element = document.createElement('script');
        element.src = resource.src;
        element.async = true;
        break;

      case 'stylesheet':
        element = document.createElement('link');
        element.rel = 'stylesheet';
        element.href = resource.src;
        break;

      case 'image':
        element = new Image();
        element.src = resource.src;
        break;

      default:
        reject(new Error(`Unknown resource type: ${resource.type}`));
        return;
      }

      element.onload = resolve;
      element.onerror = reject;

      if (resource.type !== 'image') {
        document.head.appendChild(element);
      }
    });
  }

  getPreloadStats() {
    return {
      preloaded: this.preloadedResources.size,
      queued: this.preloadQueue.length,
      processing: this.isProcessing
    };
  }
}

// Bundle analyzer
export class BundleAnalyzer {
  constructor() {
    this.bundleStats = {
      totalSize: 0,
      gzippedSize: 0,
      modules: new Map(),
      chunks: new Map(),
      duplicates: new Map()
    };
  }

  analyzeBundle() {
    // Analyze loaded modules
    this.analyzeModules();

    // Analyze chunks
    this.analyzeChunks();

    // Find duplicates
    this.findDuplicates();

    return this.generateReport();
  }

  analyzeModules() {
    // This would analyze actual module sizes in a real implementation
    // For now, we'll simulate with performance entries
    const resources = performance.getEntriesByType('resource');

    resources.forEach((resource) => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        this.bundleStats.modules.set(resource.name, {
          size: resource.transferSize || 0,
          loadTime: resource.duration,
          type: resource.name.includes('.js') ? 'javascript' : 'stylesheet'
        });

        this.bundleStats.totalSize += resource.transferSize || 0;
      }
    });
  }

  analyzeChunks() {
    // Analyze chunk information from code splitter
    if (codeSplitter) {
      const chunkStats = codeSplitter.getChunkStats();
      this.bundleStats.chunks = chunkStats;
    }
  }

  findDuplicates() {
    // Simple duplicate detection based on similar names
    const moduleNames = Array.from(this.bundleStats.modules.keys());

    moduleNames.forEach((name) => {
      const baseName = name.split('/').pop().split('?')[0];
      const similar = moduleNames.filter(
        (n) => n !== name && n.includes(baseName)
      );

      if (similar.length > 0) {
        this.bundleStats.duplicates.set(baseName, [name, ...similar]);
      }
    });
  }

  generateReport() {
    const report = {
      summary: {
        totalModules: this.bundleStats.modules.size,
        totalSize: this.formatBytes(this.bundleStats.totalSize),
        duplicates: this.bundleStats.duplicates.size
      },
      largestModules: this.getLargestModules(10),
      slowestModules: this.getSlowestModules(10),
      duplicates: Object.fromEntries(this.bundleStats.duplicates),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  getLargestModules(count) {
    return Array.from(this.bundleStats.modules.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, count)
      .map(([name, stats]) => ({
        name,
        size: this.formatBytes(stats.size),
        type: stats.type
      }));
  }

  getSlowestModules(count) {
    return Array.from(this.bundleStats.modules.entries())
      .sort((a, b) => b[1].loadTime - a[1].loadTime)
      .slice(0, count)
      .map(([name, stats]) => ({
        name,
        loadTime: `${stats.loadTime.toFixed(2)}ms`,
        type: stats.type
      }));
  }

  generateRecommendations() {
    const recommendations = [];

    // Large bundle warning
    if (this.bundleStats.totalSize > 1024 * 1024) {
      // 1MB
      recommendations.push({
        type: 'warning',
        message: 'Bundle size is large (>1MB). Consider code splitting.',
        action: 'Implement lazy loading for non-critical modules'
      });
    }

    // Duplicate modules warning
    if (this.bundleStats.duplicates.size > 0) {
      recommendations.push({
        type: 'warning',
        message: `Found ${this.bundleStats.duplicates.size} potential duplicate modules.`,
        action: 'Review and deduplicate similar modules'
      });
    }

    // Performance recommendations
    const slowModules = this.getSlowestModules(5);
    if (slowModules.some((m) => parseFloat(m.loadTime) > 1000)) {
      recommendations.push({
        type: 'info',
        message: 'Some modules are loading slowly (>1s).',
        action: 'Consider preloading or optimizing slow modules'
      });
    }

    return recommendations;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printReport() {
    const report = this.analyzeBundle();

    Logger.info('\n📦 Bundle Analysis Report:');
    Logger.info(`Total Modules: ${report.summary.totalModules}`);
    Logger.info(`Total Size: ${report.summary.totalSize}`);
    Logger.info(`Duplicates: ${report.summary.duplicates}`);

    Logger.info('\n🔍 Largest Modules:');
    report.largestModules.forEach((module) => {
      Logger.info(`  ${module.name}: ${module.size}`);
    });

    Logger.info('\n⏱️ Slowest Modules:');
    report.slowestModules.forEach((module) => {
      Logger.info(`  ${module.name}: ${module.loadTime}`);
    });

    if (report.recommendations.length > 0) {
      Logger.info('\n💡 Recommendations:');
      report.recommendations.forEach((rec) => {
        Logger.info(`  ${rec.type.toUpperCase()}: ${rec.message}`);
        Logger.info(`    Action: ${rec.action}`);
      });
    }
  }
}

// Global instances
export const moduleLoader = new ModuleLoader();
export const codeSplitter = new CodeSplitter();
export const lazyLoader = new LazyLoader();
export const resourcePreloader = new ResourcePreloader();
export const bundleAnalyzer = new BundleAnalyzer();

// Initialize code splitting configuration
codeSplitter.defineChunk(
  'core',
  ['./modules/logger.js', './modules/utils.js', './modules/api.js'],
  []
);

codeSplitter.defineChunk(
  'ui',
  ['./modules/ui-components.js', './modules/image-loader.js'],
  ['core']
);

codeSplitter.defineChunk(
  'pages',
  ['./modules/pages.js', './modules/router.js'],
  ['core', 'ui']
);

codeSplitter.defineChunk(
  'advanced',
  [
    './modules/error-boundaries.js',
    './modules/performance-monitor.js',
    './modules/testing.js'
  ],
  ['core']
);

Logger.info(
  '📦 Bundle optimizer initialized with code splitting configuration'
);
