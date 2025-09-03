// 🔔 Notification System Module
// Hệ thống thông báo hoàn chỉnh với Firebase Firestore
// Hỗ trợ thông báo admin và auto-notification cho phim mới

import { Logger } from './logger.js';

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  NEW_MOVIE: 'new_movie',
  SYSTEM: 'system',
  UPDATE: 'update'
};

/**
 * Notification Status
 */
export const NOTIFICATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SCHEDULED: 'scheduled'
};

/**
 * Notification Database Schema
 * Collection: 'notifications'
 * Document Structure:
 * {
 *   id: string (auto-generated),
 *   title: string,
 *   content: string,
 *   type: NOTIFICATION_TYPES,
 *   status: NOTIFICATION_STATUS,
 *   createdAt: timestamp,
 *   scheduledAt: timestamp (optional),
 *   expiresAt: timestamp (optional),
 *   readBy: array of userIds,
 *   metadata: {
 *     movieSlug?: string,
 *     movieName?: string,
 *     adminId?: string,
 *     priority?: 'low' | 'normal' | 'high'
 *   },
 *   stats: {
 *     totalReads: number,
 *     totalViews: number
 *   }
 * }
 */

class NotificationSystem {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.cache = new Map();
    this.listeners = new Set();

    // Bind methods
    this.init = this.init.bind(this);
    this.createNotification = this.createNotification.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
  }

  /**
   * Khởi tạo notification system
   */
  async init() {
    try {
      Logger.info('🔔 Initializing Notification System...');

      // Đợi Firebase khởi tạo
      if (window.movieComments && window.movieComments.db) {
        this.db = window.movieComments.db;
      } else {
        throw new Error(
          'Firebase not initialized. Please init movieComments first.'
        );
      }

      // Tạo indexes nếu cần
      await this.ensureIndexes();

      this.initialized = true;
      Logger.info('✅ Notification System ready!');
      return true;
    } catch (error) {
      Logger.error('❌ Notification System init failed:', error);
      return false;
    }
  }

  /**
   * Đảm bảo có indexes cần thiết (chỉ log warning nếu không tạo được)
   */
  async ensureIndexes() {
    try {
      // Firebase tự động tạo indexes khi query
      // Chỉ log để admin biết cần tạo composite indexes
      Logger.info(
        '📊 Notification indexes will be auto-created on first queries'
      );
    } catch (error) {
      Logger.warn('⚠️ Could not ensure indexes:', error);
    }
  }

  /**
   * Tạo notification mới
   */
  async createNotification({
    title,
    content,
    type = NOTIFICATION_TYPES.ADMIN_ANNOUNCEMENT,
    scheduledAt = null,
    expiresAt = null,
    metadata = {},
    priority = 'normal'
  }) {
    if (!this.initialized) await this.init();

    try {
      const now = firebase.firestore.FieldValue.serverTimestamp();

      const notification = {
        title: title.trim(),
        content: content.trim(),
        type,
        status: scheduledAt
          ? NOTIFICATION_STATUS.SCHEDULED
          : NOTIFICATION_STATUS.ACTIVE,
        createdAt: now,
        scheduledAt: scheduledAt
          ? firebase.firestore.Timestamp.fromDate(new Date(scheduledAt))
          : null,
        expiresAt: expiresAt
          ? firebase.firestore.Timestamp.fromDate(new Date(expiresAt))
          : null,
        readBy: [],
        metadata: {
          ...metadata,
          priority,
          adminId: this.getCurrentUserId()
        },
        stats: {
          totalReads: 0,
          totalViews: 0
        }
      };

      const docRef = await this.db
        .collection('notifications')
        .add(notification);

      Logger.info(`✅ Created notification: ${docRef.id}`);

      // Clear cache
      this.cache.clear();

      // Notify listeners
      this.notifyListeners('created', { id: docRef.id, ...notification });

      return { id: docRef.id, ...notification };
    } catch (error) {
      Logger.error('❌ Create notification failed:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách notifications
   */
  async getNotifications({
    type = null,
    status = NOTIFICATION_STATUS.ACTIVE,
    limit = 50,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    includeExpired = false
  } = {}) {
    if (!this.initialized) await this.init();

    try {
      const cacheKey = `notifications_${type}_${status}_${limit}_${orderBy}_${orderDirection}_${includeExpired}`;

      // Check cache
      if (this.cache.has(cacheKey)) {
        Logger.debug('📦 Returning cached notifications');
        return this.cache.get(cacheKey);
      }

      let query = this.db.collection('notifications');

      // Filter by type
      if (type) {
        query = query.where('type', '==', type);
      }

      // Filter by status
      if (status) {
        query = query.where('status', '==', status);
      }

      // Filter expired
      if (!includeExpired) {
        const now = firebase.firestore.Timestamp.now();
        query = query.where('expiresAt', '>', now);
      }

      // Order and limit
      query = query.orderBy(orderBy, orderDirection).limit(limit);

      const snapshot = await query.get();
      const notifications = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          scheduledAt: data.scheduledAt?.toDate(),
          expiresAt: data.expiresAt?.toDate()
        });
      });

      // Cache for 5 minutes
      this.cache.set(cacheKey, notifications);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      Logger.debug(`📋 Retrieved ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      Logger.error('❌ Get notifications failed:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu notification đã đọc
   */
  async markAsRead(notificationId, userId = null) {
    if (!this.initialized) await this.init();

    try {
      const currentUserId = userId || this.getCurrentUserId();

      const notificationRef = this.db
        .collection('notifications')
        .doc(notificationId);

      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(notificationRef);

        if (!doc.exists) {
          throw new Error('Notification not found');
        }

        const data = doc.data();
        const readBy = data.readBy || [];

        // Nếu chưa đọc thì thêm vào
        if (!readBy.includes(currentUserId)) {
          readBy.push(currentUserId);

          transaction.update(notificationRef, {
            readBy,
            'stats.totalReads': firebase.firestore.FieldValue.increment(1)
          });
        }
      });

      Logger.debug(`✅ Marked notification ${notificationId} as read`);

      // Clear cache
      this.cache.clear();

      // Notify listeners
      this.notifyListeners('read', {
        id: notificationId,
        userId: currentUserId
      });

      return true;
    } catch (error) {
      Logger.error('❌ Mark as read failed:', error);
      throw error;
    }
  }

  /**
   * Xóa notification
   */
  async deleteNotification(notificationId) {
    if (!this.initialized) await this.init();

    try {
      await this.db.collection('notifications').doc(notificationId).delete();

      Logger.info(`🗑️ Deleted notification: ${notificationId}`);

      // Clear cache
      this.cache.clear();

      // Notify listeners
      this.notifyListeners('deleted', { id: notificationId });

      return true;
    } catch (error) {
      Logger.error('❌ Delete notification failed:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng notifications chưa đọc
   */
  async getUnreadCount(userId = null) {
    if (!this.initialized) await this.init();

    try {
      const currentUserId = userId || this.getCurrentUserId();

      const snapshot = await this.db
        .collection('notifications')
        .where('status', '==', NOTIFICATION_STATUS.ACTIVE)
        .get();

      let unreadCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const readBy = data.readBy || [];

        if (!readBy.includes(currentUserId)) {
          unreadCount++;
        }
      });

      Logger.debug(`📊 Unread count: ${unreadCount}`);
      return unreadCount;
    } catch (error) {
      Logger.error('❌ Get unread count failed:', error);
      return 0;
    }
  }

  /**
   * Tạo auto-notification cho phim mới
   */
  async createMovieNotification(movies) {
    if (!Array.isArray(movies) || movies.length === 0) return;

    try {
      const movieCount = movies.length;
      const firstMovie = movies[0];

      const title =
        movieCount === 1
          ? `🎬 Phim mới: ${firstMovie.name}`
          : `🎬 ${movieCount} phim mới được cập nhật`;

      const content =
        movieCount === 1
          ? `Phim "${firstMovie.name}" vừa được thêm vào hệ thống. Xem ngay!`
          : `${movieCount} phim mới vừa được cập nhật. Khám phá ngay những bộ phim hot nhất!`;

      await this.createNotification({
        title,
        content,
        type: NOTIFICATION_TYPES.NEW_MOVIE,
        metadata: {
          movieCount,
          movies: movies
            .slice(0, 5)
            .map((m) => ({ slug: m.slug, name: m.name })),
          priority: 'high'
        }
      });

      Logger.info(`🎬 Created movie notification for ${movieCount} movies`);
    } catch (error) {
      Logger.error('❌ Create movie notification failed:', error);
    }
  }

  /**
   * Utility methods
   */
  getCurrentUserId() {
    // Sử dụng user ID từ movieComments system hoặc tạo anonymous ID
    if (window.movieComments && window.movieComments.getUserId) {
      return window.movieComments.getUserId();
    }

    // Fallback: tạo hoặc lấy anonymous user ID
    let userId = localStorage.getItem('anonymous_user_id');
    if (!userId) {
      userId =
        'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymous_user_id', userId);
    }
    return userId;
  }

  /**
   * Event listeners
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        Logger.error('Listener error:', error);
      }
    });
  }
}

// Global instance
export const notificationSystem = new NotificationSystem();

// Auto-init when module loads
if (typeof window !== 'undefined') {
  window.notificationSystem = notificationSystem;
}

export default notificationSystem;
