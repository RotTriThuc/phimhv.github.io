/**
 * 🔗 Auto-Update Integration Bridge
 * Kết nối auto-update system với notification modules
 * 
 * Features:
 * - Monitor Firebase trigger files từ auto-update
 * - Process notifications và push lên Firebase
 * - Sync với notification managers
 * - Real-time integration
 */

import { FirebaseLogger } from '../firebase-config.js';

export class AutoUpdateIntegration {
  constructor() {
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.checkInterval = 10 * 1000; // 10 giây
    this.lastProcessedTimestamp = null;
  }

  /**
   * Khởi tạo integration
   */
  async init() {
    try {
      // Đảm bảo Firebase đã sẵn sàng
      if (!window.movieComments || !window.movieComments.initialized) {
        await window.movieComments?.init();
      }

      // Load last processed timestamp
      this.lastProcessedTimestamp = localStorage.getItem('lastProcessedAutoUpdate') || 0;

      // Start monitoring
      this.startMonitoring();

      FirebaseLogger.info('🔗 Auto-Update Integration initialized');
      return true;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize Auto-Update Integration:', error);
      return false;
    }
  }

  /**
   * Bắt đầu monitor Firebase trigger files
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorInterval = setInterval(async () => {
      await this.checkForAutoUpdateTriggers();
    }, this.checkInterval);

    FirebaseLogger.info('🔍 Started monitoring auto-update triggers');
  }

  /**
   * Dừng monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    FirebaseLogger.info('⏹️ Stopped monitoring auto-update triggers');
  }

  /**
   * Kiểm tra auto-update triggers
   */
  async checkForAutoUpdateTriggers() {
    try {
      // Kiểm tra Firebase trigger file từ auto-update system
      const triggerData = await this.loadFirebaseTrigger();
      
      if (!triggerData || triggerData.processed) {
        return; // Không có trigger mới hoặc đã xử lý
      }

      // Kiểm tra timestamp để tránh xử lý trùng
      if (triggerData.timestamp <= this.lastProcessedTimestamp) {
        return;
      }

      FirebaseLogger.info('🔔 Found new auto-update trigger, processing...');

      // Process notifications
      await this.processAutoUpdateNotifications(triggerData);

      // Update last processed timestamp
      this.lastProcessedTimestamp = triggerData.timestamp;
      localStorage.setItem('lastProcessedAutoUpdate', this.lastProcessedTimestamp.toString());

      // Mark trigger as processed (nếu có thể)
      await this.markTriggerAsProcessed(triggerData);

    } catch (error) {
      FirebaseLogger.error('❌ Check auto-update triggers failed:', error);
    }
  }

  /**
   * Load Firebase trigger file
   */
  async loadFirebaseTrigger() {
    try {
      // Thử load từ data/firebase-notification-trigger.json
      const response = await fetch('./data/firebase-notification-trigger.json?' + Date.now());
      
      if (!response.ok) {
        return null; // File không tồn tại hoặc lỗi
      }

      const data = await response.json();
      return data;

    } catch (error) {
      // File không tồn tại hoặc lỗi parse - bình thường
      return null;
    }
  }

  /**
   * Process notifications từ auto-update
   */
  async processAutoUpdateNotifications(triggerData) {
    try {
      const notifications = triggerData.notifications || [];
      
      if (notifications.length === 0) {
        FirebaseLogger.info('📭 No notifications to process');
        return;
      }

      let processedCount = 0;

      for (const notification of notifications) {
        try {
          // Convert auto-update notification format to Firebase format
          const firebaseNotification = this.convertToFirebaseFormat(notification);
          
          // Create notification in Firebase
          await window.movieComments.createNotification(firebaseNotification);
          
          processedCount++;
          FirebaseLogger.debug(`✅ Processed notification: ${notification.title}`);

        } catch (error) {
          FirebaseLogger.error(`❌ Failed to process notification: ${notification.title}`, error);
        }
      }

      FirebaseLogger.info(`🎉 Processed ${processedCount}/${notifications.length} auto-update notifications`);

      // Sync với notification managers
      await this.syncWithNotificationManagers(triggerData);

    } catch (error) {
      FirebaseLogger.error('❌ Process auto-update notifications failed:', error);
    }
  }

  /**
   * Convert auto-update notification format to Firebase format
   */
  convertToFirebaseFormat(autoUpdateNotification) {
    // Auto-update notification đã có format tương tự Firebase
    // Chỉ cần adjust một số fields
    return {
      title: autoUpdateNotification.title,
      content: autoUpdateNotification.content,
      type: this.mapNotificationType(autoUpdateNotification.type),
      metadata: {
        ...autoUpdateNotification.metadata,
        source: 'auto-update',
        autoUpdateId: autoUpdateNotification.id
      }
    };
  }

  /**
   * Map notification type từ auto-update sang Firebase
   */
  mapNotificationType(autoUpdateType) {
    const typeMap = {
      'new_movie': 'new_movie',
      'new_episode': 'new_episode', 
      'update': 'system'
    };

    return typeMap[autoUpdateType] || 'system';
  }

  /**
   * Sync với notification managers
   */
  async syncWithNotificationManagers(triggerData) {
    try {
      // Sync với New Movie Notification Manager
      if (window.NewMovieNotificationManager) {
        await this.syncWithMovieManager(triggerData);
      }

      // Sync với New Episode Notification Manager
      if (window.NewEpisodeNotificationManager) {
        await this.syncWithEpisodeManager(triggerData);
      }

    } catch (error) {
      FirebaseLogger.error('❌ Sync with notification managers failed:', error);
    }
  }

  /**
   * Sync với Movie Manager
   */
  async syncWithMovieManager(triggerData) {
    try {
      const manager = window.NewMovieNotificationManager;
      
      // Extract new movies từ notifications
      const newMovies = this.extractNewMoviesFromTrigger(triggerData);
      
      if (newMovies.length > 0) {
        // Update known movies list
        newMovies.forEach(movie => {
          manager.knownMovies.add(movie.slug);
        });
        
        await manager.saveKnownMovies();
        FirebaseLogger.debug(`🎬 Synced ${newMovies.length} new movies with Movie Manager`);
      }

    } catch (error) {
      FirebaseLogger.error('❌ Sync with Movie Manager failed:', error);
    }
  }

  /**
   * Sync với Episode Manager
   */
  async syncWithEpisodeManager(triggerData) {
    try {
      const manager = window.NewEpisodeNotificationManager;
      
      // Extract episode updates từ notifications
      const episodeUpdates = this.extractEpisodeUpdatesFromTrigger(triggerData);
      
      if (episodeUpdates.length > 0) {
        // Update tracked movies
        for (const update of episodeUpdates) {
          if (manager.trackedMovies.has(update.slug)) {
            const trackedInfo = manager.trackedMovies.get(update.slug);
            trackedInfo.currentEpisode = update.episode;
            trackedInfo.lastChecked = new Date().toISOString();
            manager.trackedMovies.set(update.slug, trackedInfo);
          }
        }
        
        await manager.saveTrackedMovies();
        FirebaseLogger.debug(`📺 Synced ${episodeUpdates.length} episode updates with Episode Manager`);
      }

    } catch (error) {
      FirebaseLogger.error('❌ Sync with Episode Manager failed:', error);
    }
  }

  /**
   * Extract new movies từ trigger data
   */
  extractNewMoviesFromTrigger(triggerData) {
    const newMovies = [];
    
    triggerData.notifications?.forEach(notification => {
      if (notification.type === 'new_movie' && notification.metadata?.movies) {
        newMovies.push(...notification.metadata.movies);
      }
    });

    return newMovies;
  }

  /**
   * Extract episode updates từ trigger data
   */
  extractEpisodeUpdatesFromTrigger(triggerData) {
    const episodeUpdates = [];
    
    triggerData.notifications?.forEach(notification => {
      if (notification.type === 'new_episode' && notification.metadata?.episodes) {
        episodeUpdates.push(...notification.metadata.episodes);
      }
    });

    return episodeUpdates;
  }

  /**
   * Mark trigger as processed (best effort)
   */
  async markTriggerAsProcessed(triggerData) {
    try {
      // Không thể modify file trực tiếp từ frontend
      // Chỉ log để auto-update system biết
      FirebaseLogger.info(`📝 Auto-update trigger ${triggerData.timestamp} processed successfully`);
      
    } catch (error) {
      FirebaseLogger.warn('⚠️ Could not mark trigger as processed:', error);
    }
  }

  /**
   * Manual trigger check
   */
  async manualCheck() {
    FirebaseLogger.info('🔍 Manual auto-update trigger check');
    await this.checkForAutoUpdateTriggers();
  }

  /**
   * Get integration stats
   */
  getStats() {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.checkInterval,
      lastProcessedTimestamp: this.lastProcessedTimestamp,
      lastProcessedDate: this.lastProcessedTimestamp ? 
        new Date(parseInt(this.lastProcessedTimestamp)).toLocaleString('vi-VN') : 'Chưa có'
    };
  }

  /**
   * Reset integration state
   */
  reset() {
    this.lastProcessedTimestamp = 0;
    localStorage.removeItem('lastProcessedAutoUpdate');
    FirebaseLogger.info('🔄 Auto-update integration state reset');
  }
}

// Khởi tạo global instance
window.AutoUpdateIntegration = new AutoUpdateIntegration();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AutoUpdateIntegration.init();
  });
} else {
  window.AutoUpdateIntegration.init();
}

export default AutoUpdateIntegration;
