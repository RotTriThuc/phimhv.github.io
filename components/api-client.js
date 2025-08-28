/**
 * 🌐 API Client Component
 * Centralized API handling với caching và error handling
 */

import { API_CONFIG } from '../config/constants.js';
import { CacheManager } from '../utils/cache-manager.js';
import { errorHandler } from '../utils/error-handler.js';

export class APIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || API_CONFIG.BASE_URL;
    this.timeout = options.timeout || API_CONFIG.TIMEOUT;
    
    // Specialized caches for different data types
    this.movieCache = new CacheManager({
      maxSize: 100,
      ttl: 15 * 60 * 1000 // 15 minutes for movie details
    });
    
    this.listCache = new CacheManager({
      maxSize: 50,
      ttl: 5 * 60 * 1000 // 5 minutes for lists
    });
    
    this.searchCache = new CacheManager({
      maxSize: 30,
      ttl: 2 * 60 * 1000 // 2 minutes for search
    });
    
    // Track in-flight requests to prevent duplicates
    this.requestsInFlight = new Map();
  }

  /**
   * Build URL với parameters
   * @param {string} path - API path
   * @param {Object} params - Query parameters
   * @returns {string} Complete URL
   */
  buildUrl(path, params = {}) {
    const url = new URL(path, this.baseURL);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
    return url.toString();
  }

  /**
   * Get appropriate cache for URL
   * @param {string} url - Request URL
   * @returns {CacheManager} Appropriate cache
   */
  getCache(url) {
    if (url.includes('/phim/') && !url.includes('danh-sach')) {
      return this.movieCache;
    }
    if (url.includes('tim-kiem')) {
      return this.searchCache;
    }
    return this.listCache;
  }

  /**
   * Make HTTP request với caching và deduplication
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(url, options = {}) {
    const cache = this.getCache(url);
    
    // Check cache first
    const cached = cache.get(url);
    if (cached) {
      console.log(`📋 Cache hit: ${url}`);
      return cached;
    }
    
    // Check if request is already in flight
    if (this.requestsInFlight.has(url)) {
      console.log(`⏳ Request in flight, waiting: ${url}`);
      return await this.requestsInFlight.get(url);
    }
    
    // Make new request
    const requestPromise = this.makeRequest(url, options);
    this.requestsInFlight.set(url, requestPromise);
    
    try {
      const data = await requestPromise;
      
      // Cache successful response
      cache.set(url, data);
      
      return data;
    } catch (error) {
      throw errorHandler.handleNetworkError(error, url);
    } finally {
      // Clean up in-flight request
      this.requestsInFlight.delete(url);
    }
  }

  /**
   * Make actual HTTP request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      console.log(`🌐 API Request: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'XemPhim/1.0',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${response.status}`);
      
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get movie details
   * @param {string} slug - Movie slug
   * @returns {Promise<Object>} Movie data
   */
  async getMovie(slug) {
    const url = this.buildUrl(`/phim/${slug}`);
    return await this.request(url);
  }

  /**
   * Get movie list
   * @param {string} type - List type
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Movie list data
   */
  async getMovieList(type, params = {}) {
    const url = this.buildUrl(`/v1/api/danh-sach/${type}`, params);
    return await this.request(url);
  }

  /**
   * Search movies
   * @param {string} keyword - Search keyword
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Search results
   */
  async searchMovies(keyword, params = {}) {
    const url = this.buildUrl('/v1/api/tim-kiem', { keyword, ...params });
    return await this.request(url);
  }

  /**
   * Get categories
   * @param {string} type - Category type (the-loai, quoc-gia)
   * @returns {Promise<Object>} Categories data
   */
  async getCategories(type) {
    const url = this.buildUrl(`/v1/api/${type}`);
    return await this.request(url);
  }

  /**
   * Get filtered movies
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Filtered results
   */
  async getFilteredMovies(filters = {}) {
    const url = this.buildUrl('/v1/api/danh-sach/phim-moi-cap-nhat', filters);
    return await this.request(url);
  }

  /**
   * Clear all caches
   * @returns {Object} Clear statistics
   */
  clearCache() {
    const stats = {
      movieCache: this.movieCache.getStats().size,
      listCache: this.listCache.getStats().size,
      searchCache: this.searchCache.getStats().size
    };
    
    this.movieCache.clear();
    this.listCache.clear();
    this.searchCache.clear();
    this.requestsInFlight.clear();
    
    console.log('🧹 API caches cleared:', stats);
    return stats;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      movieCache: this.movieCache.getStats(),
      listCache: this.listCache.getStats(),
      searchCache: this.searchCache.getStats(),
      requestsInFlight: this.requestsInFlight.size
    };
  }

  /**
   * Preload popular content
   * @returns {Promise<void>}
   */
  async preloadPopularContent() {
    try {
      console.log('🚀 Preloading popular content...');
      
      // Preload popular movie lists
      const preloadPromises = [
        this.getMovieList('phim-moi-cap-nhat', { page: 1 }),
        this.getMovieList('phim-bo', { page: 1 }),
        this.getMovieList('phim-le', { page: 1 })
      ];
      
      await Promise.allSettled(preloadPromises);
      console.log('✅ Popular content preloaded');
    } catch (error) {
      console.warn('⚠️ Preload failed:', error.message);
    }
  }

  /**
   * Health check
   * @returns {Promise<boolean>} API health status
   */
  async healthCheck() {
    try {
      const url = this.buildUrl('/v1/api/danh-sach/phim-moi-cap-nhat', { page: 1, limit: 1 });
      await this.makeRequest(url);
      return true;
    } catch (error) {
      console.error('❌ API health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

export default APIClient;
