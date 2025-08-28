/**
 * 🗄️ Cache Manager Utility
 * Unified caching system với size limits và TTL để tránh memory leaks
 */

import { CACHE_CONFIG } from '../config/constants.js';

export class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || CACHE_CONFIG.MAX_SIZE;
    this.ttl = options.ttl || CACHE_CONFIG.TTL;
    this.cleanupInterval = options.cleanupInterval || CACHE_CONFIG.CLEANUP_INTERVAL;
    
    // Main cache storage
    this.cache = new Map();
    
    // Access tracking for LRU eviction
    this.accessOrder = new Map();
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      cleanups: 0,
      created: Date.now()
    };
    
    // Start cleanup timer
    this.startCleanupTimer();
    
    console.log(`🗄️ Cache Manager initialized: maxSize=${this.maxSize}, ttl=${this.ttl}ms`);
  }

  /**
   * Set cache entry với TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} customTTL - Custom TTL for this entry
   * @returns {boolean} Success status
   */
  set(key, value, customTTL = null) {
    try {
      const now = Date.now();
      const expiresAt = now + (customTTL || this.ttl);
      
      // Check if we need to evict entries
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evictLRU();
      }
      
      // Store cache entry
      this.cache.set(key, {
        value,
        createdAt: now,
        expiresAt,
        accessCount: 1,
        lastAccessed: now
      });
      
      // Update access order
      this.accessOrder.set(key, now);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Cache set failed for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get cache entry với TTL check
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;
    this.accessOrder.set(key, now);
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Check if key exists and not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if exists and valid
   */
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    return deleted;
  }

  /**
   * Clear all cache entries
   * @returns {void}
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder.clear();
    console.log(`🧹 Cache cleared: ${size} entries removed`);
  }

  /**
   * Evict least recently used entry
   * @returns {boolean} True if evicted
   */
  evictLRU() {
    if (this.accessOrder.size === 0) {
      return false;
    }
    
    // Find least recently used key
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.stats.evictions++;
      console.log(`🗑️ Evicted LRU entry: ${oldestKey}`);
      return true;
    }
    
    return false;
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries cleaned
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.stats.cleanups++;
      console.log(`🧹 Cache cleanup: ${cleanedCount} expired entries removed`);
    }
    
    return cleanedCount;
  }

  /**
   * Start automatic cleanup timer
   * @returns {void}
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   * @returns {void}
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const now = Date.now();
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      uptime: now - this.stats.created,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   * @returns {string} Memory usage estimate
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      totalSize += key.length * 2; // String chars are 2 bytes
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 64; // Overhead for entry object
    }
    
    if (totalSize < 1024) {
      return `${totalSize} bytes`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Get cache entries for debugging
   * @param {number} limit - Max entries to return
   * @returns {Array} Array of cache entries
   */
  getEntries(limit = 10) {
    const entries = [];
    let count = 0;
    
    for (const [key, entry] of this.cache) {
      if (count >= limit) break;
      
      entries.push({
        key,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        accessCount: entry.accessCount,
        lastAccessed: new Date(entry.lastAccessed).toISOString(),
        valueType: typeof entry.value,
        valueSize: JSON.stringify(entry.value).length
      });
      
      count++;
    }
    
    return entries;
  }

  /**
   * Destroy cache manager
   * @returns {void}
   */
  destroy() {
    this.stopCleanupTimer();
    this.clear();
    console.log('🗄️ Cache Manager destroyed');
  }
}

// Export singleton instances for common use cases
export const apiCache = new CacheManager({
  maxSize: 50,
  ttl: 300000 // 5 minutes
});

export const imageCache = new CacheManager({
  maxSize: 200,
  ttl: 3600000 // 1 hour
});

export const userCache = new CacheManager({
  maxSize: 20,
  ttl: 1800000 // 30 minutes
});

export default CacheManager;
