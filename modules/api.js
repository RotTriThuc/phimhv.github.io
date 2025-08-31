/* API Layer - Centralized API calls and caching */

import { Logger } from './logger.js';

// Build URL utility
export function buildUrl(path, params = {}) {
  const base = 'https://phimapi.com';
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

// Advanced LRU Cache with multiple levels
export class AdvancedAPICache {
  constructor() {
    this.cache = new Map();
    this.requestsInFlight = new Map(); // Prevent duplicate requests
    this.priorities = new Map(); // Track access frequency
    this.maxSize = 100; // Increased cache size
    
    // Different cache durations for different types
    this.cacheDurations = {
      'movie-detail': 15 * 60 * 1000,   // 15 min for movie details
      'movie-list': 5 * 60 * 1000,      // 5 min for movie lists  
      'categories': 60 * 60 * 1000,     // 1 hour for categories
      'search': 2 * 60 * 1000,          // 2 min for search results
      'default': 5 * 60 * 1000          // 5 min default
    };
  }
  
  getCacheType(url) {
    if (url.includes('/phim/') && !url.includes('danh-sach')) return 'movie-detail';
    if (url.includes('/the-loai') || url.includes('/quoc-gia')) return 'categories';
    if (url.includes('tim-kiem')) return 'search';
    if (url.includes('danh-sach')) return 'movie-list';
    return 'default';
  }
  
  getCacheDuration(url) {
    return this.cacheDurations[this.getCacheType(url)];
  }
  
  get(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;
    
    const duration = this.getCacheDuration(url);
    if (Date.now() - cached.timestamp > duration) {
      this.cache.delete(url);
      this.priorities.delete(url);
      return null;
    }
    
    // Update access frequency for LRU
    this.priorities.set(url, Date.now());
    return cached.data;
  }
  
  set(url, data) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(url, { 
      data, 
      timestamp: Date.now(),
      size: JSON.stringify(data).length // Track memory usage
    });
    this.priorities.set(url, Date.now());
  }
  
  evictLRU() {
    let oldest = Date.now();
    let oldestKey = null;
    
    for (const [key, time] of this.priorities.entries()) {
      if (time < oldest) {
        oldest = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.priorities.delete(oldestKey);
    }
  }
  
  clear() {
    this.cache.clear();
    this.priorities.clear();
    this.requestsInFlight.clear();
  }
  
  getStats() {
    return {
      cacheSize: this.cache.size,
      requestsInFlight: this.requestsInFlight.size,
      memoryUsage: Array.from(this.cache.values()).reduce((sum, item) => sum + (item.size || 0), 0)
    };
  }
}

// Circuit Breaker Pattern for API resilience
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, monitoringPeriod = 10000) {
    this.threshold = threshold; // Number of failures before opening circuit
    this.timeout = timeout; // Time to wait before trying again
    this.monitoringPeriod = monitoringPeriod; // Time window for failure counting

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0
    };
  }

  async execute(operation) {
    this.stats.totalRequests++;

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.stats.successfulRequests++;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close circuit
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.stats.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.stats.circuitOpenCount++;
      Logger.warn('🔴 Circuit breaker opened due to failures');
    }
  }

  getStats() {
    return {
      ...this.stats,
      state: this.state,
      failureCount: this.failureCount,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// Batch Request Manager
class BatchRequestManager {
  constructor() {
    this.batches = new Map();
    this.batchTimeout = 50; // 50ms batch window
    this.maxBatchSize = 10;
  }

  async batchRequest(url, options = {}) {
    const batchKey = this.getBatchKey(url);

    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        requests: [],
        timeout: null,
        promise: null
      });
    }

    const batch = this.batches.get(batchKey);

    return new Promise((resolve, reject) => {
      batch.requests.push({ url, options, resolve, reject });

      // Clear existing timeout
      if (batch.timeout) {
        clearTimeout(batch.timeout);
      }

      // Execute batch when full or after timeout
      if (batch.requests.length >= this.maxBatchSize) {
        this.executeBatch(batchKey);
      } else {
        batch.timeout = setTimeout(() => {
          this.executeBatch(batchKey);
        }, this.batchTimeout);
      }
    });
  }

  getBatchKey(url) {
    // Group similar API endpoints for batching
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Group by API endpoint type
    if (pathParts.includes('danh-sach')) return 'movie-list';
    if (pathParts.includes('tim-kiem')) return 'search';
    if (pathParts.includes('phim')) return 'movie-detail';

    return 'default';
  }

  async executeBatch(batchKey) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;

    const requests = batch.requests.slice();
    this.batches.delete(batchKey);

    // Execute requests concurrently with limit
    const concurrencyLimit = 3;
    const results = [];

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const chunk = requests.slice(i, i + concurrencyLimit);
      const chunkPromises = chunk.map(async (req) => {
        try {
          const result = await requestJson(req.url);
          req.resolve(result);
          return { success: true, url: req.url };
        } catch (error) {
          req.reject(error);
          return { success: false, url: req.url, error };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      results.push(...chunkResults);
    }

    Logger.debug(`📦 Batch executed: ${requests.length} requests, ${results.filter(r => r.value?.success).length} successful`);
  }
}

// Global instances
export const apiCache = new AdvancedAPICache();
export const circuitBreaker = new CircuitBreaker();
export const batchManager = new BatchRequestManager();

// Enhanced fetch with retries, timeout, and circuit breaker
export async function fetchWithRetries(url, maxRetries = 3, timeout = 10000) {
  return await circuitBreaker.execute(async () => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const res = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // Different handling for different HTTP status codes
          if (res.status >= 500) {
            throw new Error(`Server Error ${res.status}: ${res.statusText}`);
          } else if (res.status === 429) {
            // Rate limiting - wait longer
            const retryAfter = res.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            throw new Error(`Rate Limited ${res.status}: ${res.statusText}`);
          } else if (res.status >= 400) {
            throw new Error(`Client Error ${res.status}: ${res.statusText}`);
          }
        }

        return await res.json();

      } catch (error) {
        lastError = error;
        Logger.warn(`Request attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        }
      }
    }

    throw lastError;
  });
}

// Enhanced request with deduplication, batching, and adaptive caching
export async function requestJson(url, options = {}) {
  const {
    priority = 'normal',
    enableBatching = false,
    maxRetries = 3,
    timeout = 10000,
    bypassCache = false
  } = options;

  // Check cache first (unless bypassed)
  if (!bypassCache) {
    const cached = apiCache.get(url);
    if (cached) {
      Logger.debug('📋 Cache hit for:', url);
      return cached;
    }
  }

  // Check if request is already in flight
  if (apiCache.requestsInFlight.has(url)) {
    Logger.debug('🔄 Request already in flight:', url);
    return apiCache.requestsInFlight.get(url);
  }

  // Use batch processing for eligible requests
  if (enableBatching && priority !== 'high') {
    try {
      return await batchManager.batchRequest(url, options);
    } catch (error) {
      Logger.warn('⚠️ Batch request failed, falling back to individual request:', error.message);
    }
  }

  // Create new request with enhanced retry logic
  const requestPromise = createEnhancedRequest(url, maxRetries, timeout, priority);
  apiCache.requestsInFlight.set(url, requestPromise);

  try {
    const data = await requestPromise;

    // Adaptive caching based on data type and network conditions
    if (!bypassCache) {
      apiCache.set(url, data);
      Logger.debug('💾 Data cached for:', url);
    }

    return data;
  } finally {
    apiCache.requestsInFlight.delete(url);
  }
}

// Create enhanced request with priority handling
async function createEnhancedRequest(url, maxRetries, timeout, priority) {
  // Adjust timeout based on priority
  const adjustedTimeout = priority === 'high' ? timeout * 1.5 :
                         priority === 'low' ? timeout * 0.7 : timeout;

  // Adjust retries based on priority
  const adjustedRetries = priority === 'high' ? maxRetries + 1 :
                         priority === 'low' ? Math.max(1, maxRetries - 1) : maxRetries;

  return await fetchWithRetries(url, adjustedRetries, adjustedTimeout);
}

// Enhanced API Client Class
export class ApiClient {
  constructor() {
    this.prefetchQueue = new Set();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      prefetchHits: 0
    };
  }

  // Enhanced intelligent prefetching with network awareness
  prefetch(url, priority = 'low') {
    if (this.prefetchQueue.has(url)) return;

    // Check network conditions before prefetching
    const networkInfo = this.getNetworkInfo();
    if (networkInfo.bandwidth < 1 && priority === 'low') {
      Logger.debug('⚠️ Skipping low priority prefetch due to slow network');
      return;
    }

    this.prefetchQueue.add(url);

    const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 500;

    setTimeout(async () => {
      try {
        const startTime = performance.now();
        await requestJson(url, { priority: 'low', enableBatching: true });
        const responseTime = performance.now() - startTime;

        this.updateStats('prefetch', true, responseTime);
        Logger.debug('✅ Prefetched:', url, `(${responseTime.toFixed(0)}ms)`);
      } catch (error) {
        this.updateStats('prefetch', false, 0);
        Logger.warn('❌ Prefetch failed:', url, error.message);
      } finally {
        this.prefetchQueue.delete(url);
      }
    }, delay);
  }

  // Priority-based request queue
  async queueRequest(url, options = {}) {
    const { priority = 'normal' } = options;

    return new Promise((resolve, reject) => {
      const request = {
        url,
        options,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Insert based on priority
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const insertIndex = this.requestQueue.findIndex(
        req => priorityOrder[req.priority] < priorityOrder[priority]
      );

      if (insertIndex === -1) {
        this.requestQueue.push(request);
      } else {
        this.requestQueue.splice(insertIndex, 0, request);
      }

      this.processQueue();
    });
  }

  // Process request queue with concurrency control
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    const concurrencyLimit = this.getOptimalConcurrency();

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, concurrencyLimit);

      await Promise.allSettled(
        batch.map(async (request) => {
          try {
            const startTime = performance.now();
            const result = await requestJson(request.url, request.options);
            const responseTime = performance.now() - startTime;

            this.updateStats('request', true, responseTime);
            request.resolve(result);
          } catch (error) {
            this.updateStats('request', false, 0);
            request.reject(error);
          }
        })
      );

      // Small delay between batches to prevent overwhelming
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    this.isProcessingQueue = false;
  }

  // Get optimal concurrency based on network conditions
  getOptimalConcurrency() {
    const networkInfo = this.getNetworkInfo();

    if (networkInfo.bandwidth > 10) return 6;  // High speed
    if (networkInfo.bandwidth > 5) return 4;   // Medium speed
    if (networkInfo.bandwidth > 2) return 3;   // Low speed
    return 2; // Very slow
  }

  // Get network information (fallback if network monitor not available)
  getNetworkInfo() {
    try {
      // Try to get from network monitor if available
      if (typeof window !== 'undefined' && window.networkMonitor) {
        return window.networkMonitor.getNetworkInfo();
      }
    } catch (error) {
      // Fallback to basic detection
    }

    // Basic fallback
    return {
      bandwidth: 5, // Assume medium speed
      connectionType: 'unknown',
      quality: 'medium'
    };
  }

  // Update statistics
  updateStats(type, success, responseTime) {
    this.stats.totalRequests++;

    if (success) {
      this.stats.successfulRequests++;
      if (type === 'prefetch') {
        this.stats.prefetchHits++;
      }

      // Update average response time
      const totalTime = this.stats.averageResponseTime * (this.stats.successfulRequests - 1);
      this.stats.averageResponseTime = (totalTime + responseTime) / this.stats.successfulRequests;
    } else {
      this.stats.failedRequests++;
    }
  }

  // Get comprehensive statistics
  getStats() {
    const successRate = this.stats.totalRequests > 0
      ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      successRate: successRate + '%',
      averageResponseTime: this.stats.averageResponseTime.toFixed(0) + 'ms',
      prefetchQueueSize: this.prefetchQueue.size,
      requestQueueSize: this.requestQueue.length,
      cacheStats: apiCache.getStats(),
      circuitBreakerStats: circuitBreaker.getStats()
    };
  }
  
  // Smart next page prefetching
  prefetchNextPage(currentPath, currentPage) {
    const nextPage = currentPage + 1;
    const url = buildUrl(currentPath, { page: nextPage });
    this.prefetch(url, 'medium');
  }
  
  // Related content prefetching
  prefetchRelatedContent(movies) {
    // Prefetch first few movie details
    movies.slice(0, 3).forEach(movie => {
      const url = buildUrl(`/phim/${movie.slug}`);
      this.prefetch(url, 'low');
    });
  }
  
  async getLatest(page = 1) {
    const url = buildUrl('/danh-sach/phim-moi-cap-nhat-v3', { page });
    const result = await requestJson(url);
    
    // Prefetch next page and related content
    this.prefetchNextPage('/danh-sach/phim-moi-cap-nhat-v3', page);
    if (result?.data?.items) {
      this.prefetchRelatedContent(result.data.items);
    }
    
    return result;
  }
  
  async getMovie(slug) {
    const url = buildUrl(`/phim/${slug}`);
    return requestJson(url);
  }
  
  async search({ keyword, page = 1, sort_field, sort_type, sort_lang, category, country, year, limit }) {
    const url = buildUrl('/v1/api/tim-kiem', { keyword, page, sort_field, sort_type, sort_lang, category, country, year, limit });
    const result = await requestJson(url);
    
    // Prefetch next search page
    this.prefetchNextPage('/v1/api/tim-kiem', page);
    
    return result;
  }
  
  async listByType({ type_list, page = 1, sort_field, sort_type, sort_lang, category, country, year, limit = 24 }) {
    const url = buildUrl(`/v1/api/danh-sach/${type_list}`, { page, sort_field, sort_type, sort_lang, category, country, year, limit });
    const result = await requestJson(url);
    
    // Prefetch next page
    this.prefetchNextPage(`/v1/api/danh-sach/${type_list}`, page);
    
    return result;
  }
  
  async getCategories() {
    const url = buildUrl('/the-loai');
    return requestJson(url);
  }
  
  async getCountries() {
    const url = buildUrl('/quoc-gia');
    return requestJson(url);
  }
}

}

// Global API instance
export const Api = new ApiClient();

// Memory Management for API Cache
export class ApiMemoryManager {
  constructor() {
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return performance.memory.usedJSHeapSize;
    }
    // Fallback estimation
    return apiCache.getStats().memoryUsage;
  }

  checkMemoryUsage() {
    const usage = this.getMemoryUsage();
    const usagePercent = (usage / this.memoryThreshold) * 100;

    // If memory usage > 80%, trigger cleanup
    if (usagePercent > 80) {
      Logger.warn('High memory usage detected:', Math.round(usagePercent) + '%');
      this.triggerCleanup();
    }
  }

  triggerCleanup() {
    // Clear old cache entries more aggressively
    const now = Date.now();
    const entries = Array.from(apiCache.cache.entries());

    entries.forEach(([url, data]) => {
      const cacheType = apiCache.getCacheType(url);
      const maxAge = cacheType === 'movie-list' ? 2 * 60 * 1000 : 5 * 60 * 1000; // Shorter for cleanup

      if (now - data.timestamp > maxAge) {
        apiCache.cache.delete(url);
        apiCache.priorities.delete(url);
      }
    });

    Logger.debug('API cache cleanup completed');
  }
}

// Global memory manager
export const memoryManager = new ApiMemoryManager();
