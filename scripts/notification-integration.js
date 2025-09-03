// 🔔 Notification Integration for Auto-Update System
// Tích hợp notification system vào auto-update để tự động tạo thông báo khi có phim mới

const path = require('path');
const fs = require('fs').promises;

/**
 * Notification Integration Class
 * Hook vào auto-update system để tạo notifications
 */
class NotificationIntegration {
  constructor() {
    this.DATA_DIR = path.join(__dirname, '..', 'data');
    this.NOTIFICATION_FILE = path.join(
      this.DATA_DIR,
      'latest-notification.json'
    );
    this.FIREBASE_TRIGGER_FILE = path.join(
      this.DATA_DIR,
      'firebase-notification-trigger.json'
    );
  }

  /**
   * Tạo notification cho phim mới
   * Được gọi từ auto-update system
   */
  async createMovieNotifications(changes, totalMovies) {
    try {
      console.log('🔔 Creating notifications for movie updates...');

      const notifications = [];

      // Notification cho phim mới
      if (changes.newMovies && changes.newMovies.length > 0) {
        const newMovieNotification = await this.createNewMovieNotification(
          changes.newMovies
        );
        notifications.push(newMovieNotification);
      }

      // Notification cho tập mới
      if (changes.newEpisodes && changes.newEpisodes.length > 0) {
        const newEpisodeNotification = await this.createNewEpisodeNotification(
          changes.newEpisodes
        );
        notifications.push(newEpisodeNotification);
      }

      // Notification cho phim cập nhật
      if (changes.updatedMovies && changes.updatedMovies.length > 0) {
        const updatedMovieNotification =
          await this.createUpdatedMovieNotification(changes.updatedMovies);
        notifications.push(updatedMovieNotification);
      }

      // Lưu notifications để frontend có thể đọc
      await this.saveNotificationsForFrontend(notifications);

      // Tạo trigger file cho Firebase integration
      await this.createFirebaseTrigger(notifications);

      console.log(`✅ Created ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Create notifications failed:', error);
      return [];
    }
  }

  /**
   * Tạo notification cho phim mới
   */
  async createNewMovieNotification(newMovies) {
    const movieCount = newMovies.length;
    const firstMovie = newMovies[0];

    let title, content;

    if (movieCount === 1) {
      title = `🎬 Phim mới: ${firstMovie.name}`;
      content = `Phim "${firstMovie.name}" (${firstMovie.year || 'N/A'}) vừa được thêm vào hệ thống. Xem ngay!`;
    } else {
      title = `🎬 ${movieCount} phim mới được cập nhật`;
      content = `${movieCount} phim mới vừa được thêm vào hệ thống. Khám phá ngay những bộ phim hot nhất!`;
    }

    return {
      id: `new_movies_${Date.now()}`,
      title,
      content,
      type: 'new_movie',
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: {
        movieCount,
        movies: newMovies.slice(0, 5).map((movie) => ({
          slug: movie.slug,
          name: movie.name,
          year: movie.year,
          poster_url: movie.poster_url || movie.thumb_url
        })),
        priority: 'high'
      },
      stats: {
        totalReads: 0,
        totalViews: 0
      }
    };
  }

  /**
   * Tạo notification cho tập mới
   */
  async createNewEpisodeNotification(newEpisodes) {
    const episodeCount = newEpisodes.length;
    const firstEpisode = newEpisodes[0];

    let title, content;

    if (episodeCount === 1) {
      title = `📺 Tập mới: ${firstEpisode.name}`;
      content = `Tập ${firstEpisode.newEpisode} của "${firstEpisode.name}" đã được cập nhật. Xem ngay!`;
    } else {
      title = `📺 ${episodeCount} tập mới được cập nhật`;
      content = `${episodeCount} tập mới của các bộ phim đã được cập nhật. Theo dõi ngay!`;
    }

    return {
      id: `new_episodes_${Date.now()}`,
      title,
      content,
      type: 'new_movie', // Sử dụng chung type với phim mới
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: {
        episodeCount,
        episodes: newEpisodes.slice(0, 5).map((ep) => ({
          slug: ep.slug,
          name: ep.name,
          episode: ep.newEpisode,
          updatedAt: ep.updatedAt
        })),
        priority: 'normal'
      },
      stats: {
        totalReads: 0,
        totalViews: 0
      }
    };
  }

  /**
   * Tạo notification cho phim cập nhật
   */
  async createUpdatedMovieNotification(updatedMovies) {
    const updateCount = updatedMovies.length;

    const title = `🔄 ${updateCount} phim được cập nhật`;
    const content = `${updateCount} bộ phim đã được cập nhật thông tin mới. Kiểm tra ngay!`;

    return {
      id: `updated_movies_${Date.now()}`,
      title,
      content,
      type: 'update',
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: {
        updateCount,
        movies: updatedMovies.slice(0, 5).map((movie) => ({
          slug: movie.slug,
          name: movie.name,
          changes: movie.changes || []
        })),
        priority: 'low'
      },
      stats: {
        totalReads: 0,
        totalViews: 0
      }
    };
  }

  /**
   * Lưu notifications để frontend có thể đọc
   */
  async saveNotificationsForFrontend(notifications) {
    try {
      const notificationData = {
        lastUpdate: new Date().toISOString(),
        notifications: notifications,
        summary: this.createNotificationSummary(notifications)
      };

      await fs.writeFile(
        this.NOTIFICATION_FILE,
        JSON.stringify(notificationData, null, 2)
      );

      console.log(
        `💾 Saved ${notifications.length} notifications to ${this.NOTIFICATION_FILE}`
      );
    } catch (error) {
      console.error('❌ Save notifications failed:', error);
    }
  }

  /**
   * Tạo Firebase trigger file
   * File này sẽ được frontend đọc để push notifications lên Firebase
   */
  async createFirebaseTrigger(notifications) {
    try {
      const triggerData = {
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        notifications: notifications,
        processed: false, // Frontend sẽ set thành true sau khi xử lý
        source: 'auto-update-system'
      };

      await fs.writeFile(
        this.FIREBASE_TRIGGER_FILE,
        JSON.stringify(triggerData, null, 2)
      );

      console.log(
        `🔥 Created Firebase trigger file: ${this.FIREBASE_TRIGGER_FILE}`
      );
    } catch (error) {
      console.error('❌ Create Firebase trigger failed:', error);
    }
  }

  /**
   * Tạo summary cho notifications
   */
  createNotificationSummary(notifications) {
    const summary = {
      total: notifications.length,
      byType: {},
      byPriority: {},
      totalMovies: 0,
      totalEpisodes: 0,
      totalUpdates: 0
    };

    notifications.forEach((notification) => {
      // Count by type
      summary.byType[notification.type] =
        (summary.byType[notification.type] || 0) + 1;

      // Count by priority
      const priority = notification.metadata?.priority || 'normal';
      summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;

      // Count totals
      if (notification.metadata?.movieCount) {
        summary.totalMovies += notification.metadata.movieCount;
      }
      if (notification.metadata?.episodeCount) {
        summary.totalEpisodes += notification.metadata.episodeCount;
      }
      if (notification.metadata?.updateCount) {
        summary.totalUpdates += notification.metadata.updateCount;
      }
    });

    return summary;
  }

  /**
   * Đọc notifications từ file
   */
  async getNotifications() {
    try {
      const data = await fs.readFile(this.NOTIFICATION_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('📝 No existing notifications file found');
      return { notifications: [], lastUpdate: null };
    }
  }

  /**
   * Kiểm tra Firebase trigger
   */
  async checkFirebaseTrigger() {
    try {
      const data = await fs.readFile(this.FIREBASE_TRIGGER_FILE, 'utf8');
      const trigger = JSON.parse(data);
      return trigger.processed === false ? trigger : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Đánh dấu Firebase trigger đã xử lý
   */
  async markFirebaseTriggerProcessed() {
    try {
      const data = await fs.readFile(this.FIREBASE_TRIGGER_FILE, 'utf8');
      const trigger = JSON.parse(data);
      trigger.processed = true;
      trigger.processedAt = new Date().toISOString();

      await fs.writeFile(
        this.FIREBASE_TRIGGER_FILE,
        JSON.stringify(trigger, null, 2)
      );

      console.log('✅ Marked Firebase trigger as processed');
    } catch (error) {
      console.error('❌ Mark Firebase trigger processed failed:', error);
    }
  }

  /**
   * Tạo notification summary text cho commit message
   */
  createUpdateSummary(changes) {
    const parts = [];

    if (changes.newMovies && changes.newMovies.length > 0) {
      parts.push(`🎬 ${changes.newMovies.length} phim mới`);
    }

    if (changes.newEpisodes && changes.newEpisodes.length > 0) {
      parts.push(`📺 ${changes.newEpisodes.length} tập mới`);
    }

    if (changes.updatedMovies && changes.updatedMovies.length > 0) {
      parts.push(`🔄 ${changes.updatedMovies.length} phim cập nhật`);
    }

    return parts.join(' • ') || '🔄 Cập nhật dữ liệu';
  }
}

module.exports = NotificationIntegration;
