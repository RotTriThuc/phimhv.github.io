/**
 * Series Update Manager
 * Quản lý việc tự động kiểm tra và cập nhật các phần mới của series
 *
 * Tính năng:
 * - Background checking cho series đang theo dõi
 * - Smart cache invalidation
 * - Notification system cho updates mới
 * - Manual refresh capabilities
 */

// Logger will be available globally or we'll use console
const Logger = window.Logger || {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

/**
 * Configuration cho Series Update Manager
 */
const UPDATE_CONFIG = {
  // Thời gian check định kỳ (30 phút)
  checkInterval: 30 * 60 * 1000,

  // Thời gian cache cho series metadata (1 giờ)
  seriesMetadataCacheDuration: 60 * 60 * 1000,

  // Số lượng series tối đa để track
  maxTrackedSeries: 50,

  // Thời gian timeout cho API calls
  apiTimeout: 10000,

  // Minimum interval giữa các lần check cùng series (15 phút)
  minCheckInterval: 15 * 60 * 1000
};

/**
 * Series Update Manager Class
 */
export class SeriesUpdateManager {
  constructor() {
    this.trackedSeries = new Map(); // seriesId -> metadata
    this.lastCheckTimes = new Map(); // seriesId -> timestamp
    this.updateCallbacks = new Map(); // seriesId -> callback functions
    this.isRunning = false;
    this.checkTimer = null;

    console.log('🔄 Series Update Manager initialized');
  }

  /**
   * Thêm series vào danh sách theo dõi
   * @param {Object} seriesInfo - Thông tin series từ getSeriesBaseInfo
   * @param {Object} currentMovie - Movie hiện tại
   * @param {Function} updateCallback - Callback khi có update
   */
  trackSeries(seriesInfo, currentMovie, updateCallback = null) {
    if (!seriesInfo || !seriesInfo.seriesId) {
      console.warn('Invalid series info for tracking');
      return false;
    }

    const seriesId = seriesInfo.seriesId;
    const now = Date.now();

    // Lưu metadata
    this.trackedSeries.set(seriesId, {
      seriesInfo,
      currentMovie,
      addedAt: now,
      lastKnownSeasons: [], // Sẽ được update sau
      lastUpdateCheck: 0
    });

    // Lưu callback nếu có
    if (updateCallback && typeof updateCallback === 'function') {
      this.updateCallbacks.set(seriesId, updateCallback);
    }

    console.log(`📺 Now tracking series: ${seriesInfo.baseName} (${seriesId})`);

    // Start periodic check nếu chưa chạy
    if (!this.isRunning) {
      this.startPeriodicCheck();
    }

    return true;
  }

  /**
   * Bỏ theo dõi series
   * @param {string} seriesId - ID của series
   */
  untrackSeries(seriesId) {
    this.trackedSeries.delete(seriesId);
    this.lastCheckTimes.delete(seriesId);
    this.updateCallbacks.delete(seriesId);

    console.log(`📺 Stopped tracking series: ${seriesId}`);

    // Stop periodic check nếu không còn series nào
    if (this.trackedSeries.size === 0) {
      this.stopPeriodicCheck();
    }
  }

  /**
   * Bắt đầu periodic checking
   */
  startPeriodicCheck() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.checkTimer = setInterval(async () => {
      await this.checkAllTrackedSeries();
    }, UPDATE_CONFIG.checkInterval);

    console.log('🔄 Started periodic series update checking');
  }

  /**
   * Dừng periodic checking
   */
  stopPeriodicCheck() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    console.log('⏹️ Stopped periodic series update checking');
  }

  /**
   * Check tất cả series đang được track
   */
  async checkAllTrackedSeries() {
    if (this.trackedSeries.size === 0) return;

    console.log(
      `🔍 Checking ${this.trackedSeries.size} tracked series for updates...`
    );

    const promises = Array.from(this.trackedSeries.keys()).map((seriesId) =>
      this.checkSeriesForUpdates(seriesId)
    );

    try {
      await Promise.allSettled(promises);
      console.log('✅ Completed checking all tracked series');
    } catch (error) {
      console.error('❌ Error in batch series checking:', error);
    }
  }

  /**
   * Check một series cụ thể cho updates
   * @param {string} seriesId - ID của series
   * @returns {Promise<boolean>} True nếu có updates
   */
  async checkSeriesForUpdates(seriesId) {
    const metadata = this.trackedSeries.get(seriesId);
    if (!metadata) return false;

    const now = Date.now();
    const lastCheck = this.lastCheckTimes.get(seriesId) || 0;

    // Skip nếu check quá gần đây
    if (now - lastCheck < UPDATE_CONFIG.minCheckInterval) {
      return false;
    }

    try {
      // Update last check time
      this.lastCheckTimes.set(seriesId, now);

      // Import dependencies dynamically
      const { findRelatedSeasons } = await import('./series-navigator.js');

      // Get fresh data from API
      const api = window.Api;
      const extractItems = window.extractItems;

      if (!api || !extractItems) {
        console.warn('API or extractItems not available for series check');
        return false;
      }

      const freshSeasons = await findRelatedSeasons(
        metadata.currentMovie,
        api,
        extractItems
      );

      // So sánh với data cũ
      const hasUpdates = this.compareSeasons(
        metadata.lastKnownSeasons,
        freshSeasons
      );

      if (hasUpdates) {
        console.log(
          `🆕 Found updates for series: ${metadata.seriesInfo.baseName}`
        );

        // Update metadata
        metadata.lastKnownSeasons = freshSeasons;
        metadata.lastUpdateCheck = now;
        this.trackedSeries.set(seriesId, metadata);

        // Trigger callback nếu có
        const callback = this.updateCallbacks.get(seriesId);
        if (callback) {
          try {
            await callback(freshSeasons, metadata);
          } catch (error) {
            console.error('Error in update callback:', error);
          }
        }

        // Trigger global event
        this.triggerUpdateEvent(seriesId, freshSeasons, metadata);

        return true;
      }

      // Update metadata ngay cả khi không có updates
      metadata.lastKnownSeasons = freshSeasons;
      metadata.lastUpdateCheck = now;
      this.trackedSeries.set(seriesId, metadata);

      return false;
    } catch (error) {
      console.error(`❌ Error checking series ${seriesId}:`, error);
      return false;
    }
  }

  /**
   * So sánh hai danh sách seasons để detect changes
   * @param {Array} oldSeasons - Danh sách seasons cũ
   * @param {Array} newSeasons - Danh sách seasons mới
   * @returns {boolean} True nếu có thay đổi
   */
  compareSeasons(oldSeasons, newSeasons) {
    if (!oldSeasons || oldSeasons.length === 0) {
      return newSeasons && newSeasons.length > 0;
    }

    if (!newSeasons || newSeasons.length === 0) {
      return false;
    }

    // Check số lượng seasons
    if (oldSeasons.length !== newSeasons.length) {
      return true;
    }

    // Check từng season
    const oldSlugs = new Set(oldSeasons.map((s) => s.slug));
    const newSlugs = new Set(newSeasons.map((s) => s.slug));

    // Check nếu có season mới
    for (const slug of newSlugs) {
      if (!oldSlugs.has(slug)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Trigger global event khi có update
   * @param {string} seriesId - ID của series
   * @param {Array} newSeasons - Danh sách seasons mới
   * @param {Object} metadata - Metadata của series
   */
  triggerUpdateEvent(seriesId, newSeasons, metadata) {
    const event = new CustomEvent('seriesUpdated', {
      detail: {
        seriesId,
        seriesInfo: metadata.seriesInfo,
        newSeasons,
        timestamp: Date.now()
      }
    });

    window.dispatchEvent(event);
    console.log(
      `📡 Triggered seriesUpdated event for: ${metadata.seriesInfo.baseName}`
    );
  }

  /**
   * Force check một series ngay lập tức
   * @param {string} seriesId - ID của series
   * @returns {Promise<boolean>} True nếu có updates
   */
  async forceCheckSeries(seriesId) {
    // Reset last check time để force check
    this.lastCheckTimes.delete(seriesId);
    return await this.checkSeriesForUpdates(seriesId);
  }

  /**
   * Get thống kê về tracked series
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      trackedSeriesCount: this.trackedSeries.size,
      isRunning: this.isRunning,
      lastCheckTimes: Object.fromEntries(this.lastCheckTimes),
      config: UPDATE_CONFIG
    };
  }

  /**
   * Clear tất cả tracked series
   */
  clearAll() {
    this.stopPeriodicCheck();
    this.trackedSeries.clear();
    this.lastCheckTimes.clear();
    this.updateCallbacks.clear();
    console.log('🧹 Cleared all tracked series');
  }
}

// Global instance
export const seriesUpdateManager = new SeriesUpdateManager();

// Export for global access
if (typeof window !== 'undefined') {
  window.seriesUpdateManager = seriesUpdateManager;
}

console.log('📦 Series Update Manager module loaded');
