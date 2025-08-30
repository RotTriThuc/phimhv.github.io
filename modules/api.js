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

// Global cache instance
export const apiCache = new AdvancedAPICache();

// Enhanced fetch with retries and timeout
export async function fetchWithRetries(url, maxRetries = 3, timeout = 10000) {
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
          'Accept-Encoding': 'gzip, deflate, br'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
      
    } catch (error) {
      lastError = error;
      Logger.warn(`Request attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

// Request deduplication and optimization
export async function requestJson(url) {
  // Check cache first
  const cached = apiCache.get(url);
  if (cached) {
    return cached;
  }
  
  // Check if request is already in flight
  if (apiCache.requestsInFlight.has(url)) {
    return apiCache.requestsInFlight.get(url);
  }
  
  // Create new request with timeout and retries
  const requestPromise = fetchWithRetries(url, 3);
  apiCache.requestsInFlight.set(url, requestPromise);
  
  try {
    const data = await requestPromise;
    apiCache.set(url, data);
    return data;
  } finally {
    apiCache.requestsInFlight.delete(url);
  }
}

// API Client Class
export class ApiClient {
  constructor() {
    this.prefetchQueue = new Set();
  }
  
  // Intelligent prefetching
  prefetch(url, priority = 'low') {
    if (this.prefetchQueue.has(url)) return;
    this.prefetchQueue.add(url);
    
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 500;
    
    setTimeout(async () => {
      try {
        await requestJson(url);
        Logger.debug('Prefetched:', url);
      } catch (error) {
        Logger.warn('Prefetch failed:', url, error.message);
      } finally {
        this.prefetchQueue.delete(url);
      }
    }, delay);
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
