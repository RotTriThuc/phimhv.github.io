/**
 * Video Cache System - IndexedDB-based video segment caching
 * Tác giả: AI Assistant
 * Mô tả: Hệ thống cache video segments với LRU eviction, prefetching và offline support
 */

import { Logger } from './logger.js';
import { networkMonitor } from './network-monitor.js';

// Cấu hình video cache
const CACHE_CONFIG = {
  // IndexedDB settings
  dbName: 'XemPhimVideoCache',
  dbVersion: 1,
  storeName: 'videoSegments',

  // Cache limits
  maxCacheSize: 500 * 1024 * 1024, // 500MB
  maxSegmentAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxSegmentsPerVideo: 50,

  // Prefetching settings
  prefetchSegments: 3,
  prefetchThreshold: 0.8, // Start prefetching when 80% through current segment

  // LRU settings
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  cleanupThreshold: 0.9, // Clean when 90% full

  // Network conditions
  prefetchOnlyOnWifi: false,
  minBandwidthForPrefetch: 1 // 1 Mbps
};

/**
 * Video Cache Manager Class
 * Quản lý cache video segments với IndexedDB
 */
export class VideoCacheManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.cacheSize = 0;
    this.accessLog = new Map(); // LRU tracking
    this.prefetchQueue = [];
    this.isPrefetching = false;

    // Statistics
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      segmentsCached: 0,
      totalDownloaded: 0,
      prefetchedSegments: 0
    };

    this.init();
  }

  /**
   * Khởi tạo IndexedDB
   */
  async init() {
    try {
      await this.openDatabase();
      await this.calculateCacheSize();
      this.startCleanupTimer();
      this.setupNetworkListener();

      this.isInitialized = true;
      Logger.info('💾 Video Cache Manager initialized', {
        cacheSize: this.formatBytes(this.cacheSize),
        maxSize: this.formatBytes(CACHE_CONFIG.maxCacheSize)
      });
    } catch (error) {
      Logger.error('❌ Video Cache initialization failed:', error);
    }
  }

  /**
   * Mở IndexedDB connection
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        CACHE_CONFIG.dbName,
        CACHE_CONFIG.dbVersion
      );

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for video segments
        if (!db.objectStoreNames.contains(CACHE_CONFIG.storeName)) {
          const store = db.createObjectStore(CACHE_CONFIG.storeName, {
            keyPath: 'id'
          });

          // Create indexes
          store.createIndex('videoId', 'videoId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * Tính toán cache size hiện tại
   */
  async calculateCacheSize() {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readonly'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const segments = request.result;
        this.cacheSize = segments.reduce(
          (total, segment) => total + segment.size,
          0
        );
        this.stats.segmentsCached = segments.length;

        // Update access log
        segments.forEach((segment) => {
          this.accessLog.set(segment.id, segment.lastAccessed);
        });
      };
    } catch (error) {
      Logger.error('❌ Failed to calculate cache size:', error);
    }
  }

  /**
   * Setup network quality listener
   */
  setupNetworkListener() {
    networkMonitor.addListener((event, data) => {
      if (event === 'qualityChange') {
        this.adjustPrefetchingStrategy(data);
      }
    });
  }

  /**
   * Adjust prefetching based on network quality
   */
  adjustPrefetchingStrategy(networkData) {
    const { bandwidth, connectionType } = networkData;

    // Disable prefetching on slow connections
    if (bandwidth < CACHE_CONFIG.minBandwidthForPrefetch) {
      this.isPrefetching = false;
      this.prefetchQueue = [];
      return;
    }

    // Adjust prefetch count based on network quality
    if (connectionType === 'wifi' && bandwidth > 5) {
      CACHE_CONFIG.prefetchSegments = 5;
    } else if (bandwidth > 2) {
      CACHE_CONFIG.prefetchSegments = 3;
    } else {
      CACHE_CONFIG.prefetchSegments = 1;
    }

    Logger.debug('🎯 Prefetch strategy adjusted:', {
      segments: CACHE_CONFIG.prefetchSegments,
      bandwidth: bandwidth.toFixed(2) + ' Mbps'
    });
  }

  /**
   * Cache video segment
   */
  async cacheSegment(segmentId, videoId, segmentData, metadata = {}) {
    if (!this.isInitialized || !segmentData) return false;

    try {
      // Check if already cached
      if (await this.hasSegment(segmentId)) {
        await this.updateAccessTime(segmentId);
        return true;
      }

      // Check cache size limits
      if (this.cacheSize + segmentData.byteLength > CACHE_CONFIG.maxCacheSize) {
        await this.evictOldSegments(segmentData.byteLength);
      }

      // Create segment record
      const segment = {
        id: segmentId,
        videoId: videoId,
        data: segmentData,
        size: segmentData.byteLength,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        metadata: metadata
      };

      // Store in IndexedDB
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      await this.promisifyRequest(store.add(segment));

      // Update cache tracking
      this.cacheSize += segment.size;
      this.accessLog.set(segmentId, segment.lastAccessed);
      this.stats.segmentsCached++;
      this.stats.totalDownloaded += segment.size;

      Logger.debug('💾 Segment cached:', {
        id: segmentId,
        size: this.formatBytes(segment.size),
        totalCache: this.formatBytes(this.cacheSize)
      });

      return true;
    } catch (error) {
      Logger.error('❌ Failed to cache segment:', error);
      return false;
    }
  }

  /**
   * Retrieve cached segment
   */
  async getSegment(segmentId) {
    if (!this.isInitialized) return null;

    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readonly'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      const request = store.get(segmentId);
      const segment = await this.promisifyRequest(request);

      if (segment) {
        // Update access time for LRU
        await this.updateAccessTime(segmentId);
        this.stats.cacheHits++;

        Logger.debug('✅ Cache hit for segment:', segmentId);
        return segment.data;
      } else {
        this.stats.cacheMisses++;
        Logger.debug('❌ Cache miss for segment:', segmentId);
        return null;
      }
    } catch (error) {
      Logger.error('❌ Failed to get segment:', error);
      this.stats.cacheMisses++;
      return null;
    }
  }

  /**
   * Check if segment exists in cache
   */
  async hasSegment(segmentId) {
    if (!this.isInitialized) return false;

    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readonly'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      const request = store.count(segmentId);
      const count = await this.promisifyRequest(request);

      return count > 0;
    } catch (error) {
      Logger.error('❌ Failed to check segment:', error);
      return false;
    }
  }

  /**
   * Update segment access time
   */
  async updateAccessTime(segmentId) {
    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);

      const getRequest = store.get(segmentId);
      const segment = await this.promisifyRequest(getRequest);

      if (segment) {
        segment.lastAccessed = Date.now();
        await this.promisifyRequest(store.put(segment));
        this.accessLog.set(segmentId, segment.lastAccessed);
      }
    } catch (error) {
      Logger.error('❌ Failed to update access time:', error);
    }
  }

  /**
   * Evict old segments using LRU strategy
   */
  async evictOldSegments(requiredSpace) {
    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      const index = store.index('lastAccessed');
      const request = index.openCursor();

      let freedSpace = 0;
      const segmentsToDelete = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor && freedSpace < requiredSpace) {
          const segment = cursor.value;

          // Check if segment is old enough to evict
          const age = Date.now() - segment.lastAccessed;
          if (age > 60000 || freedSpace < requiredSpace) {
            // 1 minute minimum age
            segmentsToDelete.push(segment);
            freedSpace += segment.size;
          }

          cursor.continue();
        } else {
          // Delete collected segments
          this.deleteSegments(segmentsToDelete);
        }
      };
    } catch (error) {
      Logger.error('❌ Failed to evict segments:', error);
    }
  }

  /**
   * Delete segments from cache
   */
  async deleteSegments(segments) {
    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);

      for (const segment of segments) {
        await this.promisifyRequest(store.delete(segment.id));
        this.cacheSize -= segment.size;
        this.accessLog.delete(segment.id);
        this.stats.segmentsCached--;
      }

      Logger.info('🗑️ Evicted segments:', {
        count: segments.length,
        freedSpace: this.formatBytes(
          segments.reduce((sum, s) => sum + s.size, 0)
        )
      });
    } catch (error) {
      Logger.error('❌ Failed to delete segments:', error);
    }
  }

  /**
   * Prefetch next segments
   */
  async prefetchSegments(videoId, currentSegmentIndex, segmentUrls) {
    if (!this.shouldPrefetch()) return;

    const startIndex = currentSegmentIndex + 1;
    const endIndex = Math.min(
      startIndex + CACHE_CONFIG.prefetchSegments,
      segmentUrls.length
    );

    for (let i = startIndex; i < endIndex; i++) {
      const segmentUrl = segmentUrls[i];
      const segmentId = this.generateSegmentId(videoId, i);

      // Skip if already cached or in queue
      if (
        (await this.hasSegment(segmentId)) ||
        this.prefetchQueue.includes(segmentId)
      ) {
        continue;
      }

      this.prefetchQueue.push({
        id: segmentId,
        videoId: videoId,
        url: segmentUrl,
        index: i
      });
    }

    // Start prefetching if not already running
    if (!this.isPrefetching) {
      this.processPrefetchQueue();
    }
  }

  /**
   * Check if should prefetch
   */
  shouldPrefetch() {
    const networkInfo = networkMonitor.getNetworkInfo();

    // Don't prefetch on slow connections
    if (networkInfo.bandwidth < CACHE_CONFIG.minBandwidthForPrefetch) {
      return false;
    }

    // Don't prefetch on cellular if configured
    if (
      CACHE_CONFIG.prefetchOnlyOnWifi &&
      networkInfo.connectionType !== 'wifi'
    ) {
      return false;
    }

    // Don't prefetch if cache is nearly full
    if (this.cacheSize > CACHE_CONFIG.maxCacheSize * 0.9) {
      return false;
    }

    return true;
  }

  /**
   * Process prefetch queue
   */
  async processPrefetchQueue() {
    if (this.isPrefetching || this.prefetchQueue.length === 0) return;

    this.isPrefetching = true;

    while (this.prefetchQueue.length > 0 && this.shouldPrefetch()) {
      const segment = this.prefetchQueue.shift();

      try {
        const response = await fetch(segment.url);
        if (response.ok) {
          const data = await response.arrayBuffer();
          await this.cacheSegment(segment.id, segment.videoId, data, {
            prefetched: true,
            index: segment.index
          });

          this.stats.prefetchedSegments++;
          Logger.debug('⚡ Prefetched segment:', segment.id);
        }
      } catch (error) {
        Logger.warn('⚠️ Prefetch failed for segment:', segment.id, error);
      }

      // Small delay to avoid overwhelming the network
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isPrefetching = false;
  }

  /**
   * Generate segment ID
   */
  generateSegmentId(videoId, segmentIndex) {
    return `${videoId}_segment_${segmentIndex}`;
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredSegments();
    }, CACHE_CONFIG.cleanupInterval);
  }

  /**
   * Clean up expired segments
   */
  async cleanupExpiredSegments() {
    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();

      const expiredSegments = [];
      const cutoffTime = Date.now() - CACHE_CONFIG.maxSegmentAge;

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const segment = cursor.value;
          if (segment.timestamp < cutoffTime) {
            expiredSegments.push(segment);
          }
          cursor.continue();
        } else {
          if (expiredSegments.length > 0) {
            this.deleteSegments(expiredSegments);
            Logger.info(
              '🧹 Cleaned up expired segments:',
              expiredSegments.length
            );
          }
        }
      };
    } catch (error) {
      Logger.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.cacheHits + this.stats.cacheMisses > 0
        ? (
          (this.stats.cacheHits /
              (this.stats.cacheHits + this.stats.cacheMisses)) *
            100
        ).toFixed(1)
        : 0;

    return {
      ...this.stats,
      hitRate: hitRate + '%',
      cacheSize: this.formatBytes(this.cacheSize),
      maxCacheSize: this.formatBytes(CACHE_CONFIG.maxCacheSize),
      cacheUsage:
        ((this.cacheSize / CACHE_CONFIG.maxCacheSize) * 100).toFixed(1) + '%',
      prefetchQueueSize: this.prefetchQueue.length
    };
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      const transaction = this.db.transaction(
        [CACHE_CONFIG.storeName],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      await this.promisifyRequest(store.clear());

      this.cacheSize = 0;
      this.accessLog.clear();
      this.prefetchQueue = [];
      this.stats.segmentsCached = 0;

      Logger.info('🗑️ Cache cleared');
    } catch (error) {
      Logger.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Promisify IndexedDB request
   */
  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global instance
export const videoCacheManager = new VideoCacheManager();
