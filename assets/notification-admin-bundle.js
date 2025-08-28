/**
 * 🔔 Notification Admin Bundle
 * Standalone bundle for admin panel notification management
 * Avoids CORS issues with ES6 modules on file:// protocol
 */

// Simple Notification Data Manager (Simplified version)
class SimpleNotificationDataManager {
  constructor() {
    this.storageKey = 'app-notifications';
    this.notifications = new Map();
    this.subscribers = new Set();
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadFromStorage();
      this.isInitialized = true;
      console.log('📊 Simple Notification Data Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification data manager:', error);
    }
  }

  async loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.notifications) {
          this.notifications = new Map(parsed.notifications);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load from storage:', error);
    }
  }

  async saveToStorage() {
    try {
      const data = {
        notifications: Array.from(this.notifications.entries()),
        metadata: {
          version: '1.0.0',
          lastUpdated: Date.now(),
          totalCount: this.notifications.size,
          unreadCount: this.getUnreadCount()
        }
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));

      // Notify subscribers
      this.notifySubscribers('data-saved', { count: this.notifications.size });
    } catch (error) {
      console.error('❌ Failed to save to storage:', error);
    }
  }

  getAllNotifications() {
    return Array.from(this.notifications.values());
  }

  getNotification(id) {
    return this.notifications.get(id);
  }

  async createNotification(notificationData) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification = {
      id,
      timestamp: Date.now(),
      isRead: false,
      ...notificationData
    };

    this.notifications.set(id, notification);
    await this.saveToStorage();
    this.notifySubscribers('notification-created', notification);
    return notification;
  }

  async updateNotification(id, updateData) {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated = { ...notification, ...updateData };
    this.notifications.set(id, updated);
    await this.saveToStorage();
    this.notifySubscribers('notification-updated', updated);
    return updated;
  }

  async deleteNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    this.notifications.delete(id);
    await this.saveToStorage();
    this.notifySubscribers('notification-deleted', { id });
    return true;
  }

  async clearAllData() {
    this.notifications.clear();
    localStorage.removeItem(this.storageKey);
    this.notifySubscribers('data-cleared', {});
  }

  subscribe(callback) {
    this.subscribers.add(callback);
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Subscriber callback error:', error);
      }
    });
  }

  getUnreadCount() {
    return Array.from(this.notifications.values()).filter(n => !n.isRead).length;
  }
}

// Simple Admin Notification Manager
class SimpleAdminNotificationManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.scheduledNotifications = new Map();
  }

  async createSystemNotification(data) {
    const notificationData = {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      priority: data.priority || 'normal',
      category: data.category || 'general',
      persistent: data.persistent || false,
      actionUrl: data.actionUrl || null,
      actionText: data.actionText || null,
      expiresAt: data.expiresAt || null,
      metadata: {
        createdBy: 'admin',
        source: 'admin-panel'
      }
    };

    return await this.dataManager.createNotification(notificationData);
  }

  async scheduleNotification(scheduledTime, notificationData) {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.scheduledNotifications.set(scheduleId, {
      id: scheduleId,
      scheduledTime,
      notification: notificationData,
      created: Date.now()
    });

    // Set timeout to create notification at scheduled time
    const delay = scheduledTime - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await this.createSystemNotification(notificationData);
          this.scheduledNotifications.delete(scheduleId);
          console.log(`⏰ Scheduled notification created: ${notificationData.title}`);
        } catch (error) {
          console.error('❌ Failed to create scheduled notification:', error);
        }
      }, delay);
    }

    return scheduleId;
  }

  getNotificationStatistics(timeRange = 'all') {
    const notifications = this.dataManager.getAllNotifications();
    const now = Date.now();
    
    let filteredNotifications = notifications;
    
    if (timeRange === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      filteredNotifications = notifications.filter(n => n.timestamp >= todayStart);
    } else if (timeRange === 'week') {
      const weekStart = now - (7 * 24 * 60 * 60 * 1000);
      filteredNotifications = notifications.filter(n => n.timestamp >= weekStart);
    }

    const stats = {
      total: filteredNotifications.length,
      unread: filteredNotifications.filter(n => !n.isRead).length,
      active: filteredNotifications.filter(n => !n.expiresAt || n.expiresAt > now).length,
      scheduled: this.scheduledNotifications.size,
      byType: {},
      byPriority: {}
    };

    filteredNotifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
    });

    return stats;
  }
}

// Initialize global instances
let simpleNotificationDataManager;
let simpleAdminNotificationManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize managers
  simpleNotificationDataManager = new SimpleNotificationDataManager();
  simpleAdminNotificationManager = new SimpleAdminNotificationManager(simpleNotificationDataManager);

  // Expose to global scope for admin panel
  window.SimpleNotificationSystem = {
    dataManager: simpleNotificationDataManager,
    adminManager: simpleAdminNotificationManager
  };

  // Also expose simplified AdminNotifications API for compatibility
  window.AdminNotifications = {
    createSystemNotification: (title, message, options = {}) => {
      return simpleAdminNotificationManager.createSystemNotification({
        title,
        message,
        ...options
      });
    },
    
    getStatistics: (timeRange) => {
      return simpleAdminNotificationManager.getNotificationStatistics(timeRange);
    },
    
    exportData: () => {
      return {
        notifications: simpleNotificationDataManager.getAllNotifications(),
        metadata: {
          exported: new Date().toISOString(),
          total: simpleNotificationDataManager.notifications.size
        }
      };
    },
    
    clearAll: () => {
      return simpleNotificationDataManager.clearAllData();
    },

    // Movie notification helpers
    notifyMovieAdded: (movieName, movieSlug) => {
      return simpleAdminNotificationManager.createSystemNotification({
        title: `Phim mới: ${movieName}`,
        message: `${movieName} đã được cập nhật với chất lượng HD. Xem ngay!`,
        type: 'movie',
        actionUrl: `#/phim/${movieSlug}`,
        actionText: 'Xem ngay'
      });
    },

    notifySystemUpdate: (version, changes) => {
      return simpleAdminNotificationManager.createSystemNotification({
        title: `Cập nhật phiên bản ${version}`,
        message: changes,
        type: 'update',
        priority: 'high'
      });
    },

    notifyMaintenance: (hours, reason) => {
      const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);
      return simpleAdminNotificationManager.createSystemNotification({
        title: 'Thông báo bảo trì hệ thống',
        message: `Website sẽ bảo trì trong ${hours} giờ. Lý do: ${reason}. Dự kiến hoàn thành: ${endTime.toLocaleString('vi-VN')}`,
        type: 'system',
        priority: 'high',
        persistent: true
      });
    }
  };

  console.log('🔔 Notification Admin Bundle loaded successfully');
});
