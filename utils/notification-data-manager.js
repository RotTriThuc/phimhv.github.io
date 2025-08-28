/**
 * 📊 Notification Data Manager
 * Quản lý dữ liệu thông báo với localStorage/sessionStorage và CRUD operations
 */

import { errorHandler } from './error-handler.js';

export class NotificationDataManager {
  constructor(options = {}) {
    this.options = {
      storageKey: 'app-notifications',
      maxNotifications: 100,
      useSessionStorage: false,
      enableSync: true,
      autoCleanup: true,
      cleanupDays: 30,
      ...options
    };
    
    this.storage = this.options.useSessionStorage ? sessionStorage : localStorage;
    this.notifications = new Map();
    this.subscribers = new Set();
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Khởi tạo data manager
   */
  async init() {
    try {
      await this.loadFromStorage();
      
      if (this.options.autoCleanup) {
        this.cleanupOldNotifications();
      }
      
      // Listen for storage changes từ other tabs
      if (this.options.enableSync) {
        window.addEventListener('storage', (e) => {
          if (e.key === this.options.storageKey) {
            this.handleStorageChange(e);
          }
        });
      }
      
      this.isInitialized = true;
      console.log('📊 Notification Data Manager initialized');
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-data-init' }, 'Lỗi khởi tạo notification data manager');
    }
  }

  /**
   * Load notifications từ storage
   */
  async loadFromStorage() {
    try {
      const stored = this.storage.getItem(this.options.storageKey);
      if (!stored) {
        this.notifications = new Map();
        return;
      }

      const data = JSON.parse(stored);
      
      // Validate data structure
      if (!this.validateStorageData(data)) {
        console.warn('Invalid notification data structure, resetting...');
        this.notifications = new Map();
        await this.saveToStorage();
        return;
      }

      // Convert array back to Map
      this.notifications = new Map(data.notifications || []);
      
      console.log(`📊 Loaded ${this.notifications.size} notifications from storage`);
      
    } catch (error) {
      console.warn('Không thể load notifications từ storage:', error);
      this.notifications = new Map();
    }
  }

  /**
   * Save notifications vào storage
   */
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

      this.storage.setItem(this.options.storageKey, JSON.stringify(data));
      
      // Notify subscribers
      this.notifySubscribers('data-saved', { count: this.notifications.size });
      
    } catch (error) {
      console.warn('Không thể save notifications vào storage:', error);
      throw error;
    }
  }

  /**
   * Validate storage data structure
   */
  validateStorageData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.notifications)) return false;
    if (!data.metadata || typeof data.metadata !== 'object') return false;
    
    return true;
  }

  /**
   * Handle storage changes từ other tabs
   */
  handleStorageChange(event) {
    if (event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (this.validateStorageData(data)) {
          this.notifications = new Map(data.notifications);
          this.notifySubscribers('external-update', { 
            source: 'storage-sync',
            count: this.notifications.size 
          });
        }
      } catch (error) {
        console.warn('Lỗi sync storage changes:', error);
      }
    }
  }

  /**
   * Tạo notification mới
   * @param {Object} notificationData - Dữ liệu notification
   * @returns {string} ID của notification
   */
  async createNotification(notificationData) {
    try {
      const id = notificationData.id || this.generateId();
      
      const notification = {
        id,
        title: notificationData.title || 'Thông báo',
        message: notificationData.message || '',
        type: notificationData.type || 'info',
        timestamp: notificationData.timestamp || Date.now(),
        isRead: notificationData.isRead || false,
        persistent: notificationData.persistent || false,
        priority: notificationData.priority || 'normal', // low, normal, high, urgent
        category: notificationData.category || 'general',
        actionUrl: notificationData.actionUrl || null,
        actionText: notificationData.actionText || null,
        metadata: notificationData.metadata || {},
        expiresAt: notificationData.expiresAt || null,
        ...notificationData
      };

      // Validate notification data
      if (!this.validateNotification(notification)) {
        throw new Error('Invalid notification data');
      }

      this.notifications.set(id, notification);
      
      // Limit notifications
      await this.limitNotifications();
      
      await this.saveToStorage();
      
      // Notify subscribers
      this.notifySubscribers('notification-created', { notification });
      
      console.log(`📊 Created notification: ${id}`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-create' }, 'Lỗi tạo notification');
      throw error;
    }
  }

  /**
   * Validate notification data
   */
  validateNotification(notification) {
    if (!notification.id || typeof notification.id !== 'string') return false;
    if (!notification.title || typeof notification.title !== 'string') return false;
    if (typeof notification.timestamp !== 'number') return false;
    if (typeof notification.isRead !== 'boolean') return false;
    
    const validTypes = ['info', 'success', 'warning', 'error', 'system', 'update', 'movie'];
    if (!validTypes.includes(notification.type)) return false;
    
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(notification.priority)) return false;
    
    return true;
  }

  /**
   * Get notification by ID
   */
  getNotification(id) {
    return this.notifications.get(id);
  }

  /**
   * Get all notifications
   */
  getAllNotifications() {
    return Array.from(this.notifications.values());
  }

  /**
   * Get notifications với filtering và sorting
   */
  getNotifications(options = {}) {
    let notifications = Array.from(this.notifications.values());
    
    // Filter by read status
    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    
    // Filter by type
    if (options.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }
    
    // Filter by category
    if (options.category) {
      notifications = notifications.filter(n => n.category === options.category);
    }
    
    // Filter by priority
    if (options.priority) {
      notifications = notifications.filter(n => n.priority === options.priority);
    }
    
    // Filter by date range
    if (options.fromDate) {
      notifications = notifications.filter(n => n.timestamp >= options.fromDate);
    }
    if (options.toDate) {
      notifications = notifications.filter(n => n.timestamp <= options.toDate);
    }
    
    // Sort
    const sortBy = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';
    
    notifications.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        aVal = priorityOrder[aVal] || 0;
        bVal = priorityOrder[bVal] || 0;
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
    
    // Limit results
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }
    
    return notifications;
  }

  /**
   * Update notification
   */
  async updateNotification(id, updates) {
    try {
      const notification = this.notifications.get(id);
      if (!notification) {
        throw new Error(`Notification not found: ${id}`);
      }

      const updatedNotification = {
        ...notification,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: Date.now()
      };

      if (!this.validateNotification(updatedNotification)) {
        throw new Error('Invalid notification update data');
      }

      this.notifications.set(id, updatedNotification);
      await this.saveToStorage();
      
      this.notifySubscribers('notification-updated', { 
        id, 
        notification: updatedNotification,
        changes: updates 
      });
      
      console.log(`📊 Updated notification: ${id}`);
      return updatedNotification;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-update' }, 'Lỗi cập nhật notification');
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    return this.updateNotification(id, { isRead: true });
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(id) {
    return this.updateNotification(id, { isRead: false });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const updates = [];
      this.notifications.forEach((notification, id) => {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.updatedAt = Date.now();
          updates.push(id);
        }
      });

      if (updates.length > 0) {
        await this.saveToStorage();
        this.notifySubscribers('bulk-mark-read', { count: updates.length });
        console.log(`📊 Marked ${updates.length} notifications as read`);
      }

      return updates.length;
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-mark-all-read' }, 'Lỗi đánh dấu tất cả đã đọc');
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id) {
    try {
      const notification = this.notifications.get(id);
      if (!notification) {
        throw new Error(`Notification not found: ${id}`);
      }

      this.notifications.delete(id);
      await this.saveToStorage();
      
      this.notifySubscribers('notification-deleted', { id, notification });
      
      console.log(`📊 Deleted notification: ${id}`);
      return true;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-delete' }, 'Lỗi xóa notification');
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications() {
    try {
      const count = this.notifications.size;
      this.notifications.clear();
      await this.saveToStorage();
      
      this.notifySubscribers('all-notifications-deleted', { count });
      
      console.log(`📊 Deleted all ${count} notifications`);
      return count;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-delete-all' }, 'Lỗi xóa tất cả notifications');
      throw error;
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return Array.from(this.notifications.values()).filter(n => !n.isRead).length;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const notifications = Array.from(this.notifications.values());
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      today: notifications.filter(n => n.timestamp >= oneDayAgo).length,
      thisWeek: notifications.filter(n => n.timestamp >= oneWeekAgo).length,
      byType: this.groupBy(notifications, 'type'),
      byCategory: this.groupBy(notifications, 'category'),
      byPriority: this.groupBy(notifications, 'priority')
    };
  }

  /**
   * Group notifications by field
   */
  groupBy(notifications, field) {
    return notifications.reduce((groups, notification) => {
      const key = notification[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Limit số lượng notifications
   */
  async limitNotifications() {
    if (this.notifications.size <= this.options.maxNotifications) {
      return;
    }

    // Get notifications sorted by timestamp (oldest first)
    const sortedNotifications = Array.from(this.notifications.entries())
      .filter(([_, notification]) => !notification.persistent)
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = sortedNotifications.slice(0, this.notifications.size - this.options.maxNotifications);
    
    toRemove.forEach(([id]) => {
      this.notifications.delete(id);
    });

    if (toRemove.length > 0) {
      console.log(`📊 Removed ${toRemove.length} old notifications`);
    }
  }

  /**
   * Cleanup old notifications
   */
  cleanupOldNotifications() {
    const cutoffTime = Date.now() - (this.options.cleanupDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    this.notifications.forEach((notification, id) => {
      if (!notification.persistent && notification.timestamp < cutoffTime) {
        this.notifications.delete(id);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      this.saveToStorage();
      console.log(`📊 Cleaned up ${removedCount} old notifications`);
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Subscribe to data changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.warn('Error in notification subscriber:', error);
      }
    });
  }

  /**
   * Export notifications data
   */
  exportData() {
    return {
      notifications: Array.from(this.notifications.entries()),
      metadata: {
        exportedAt: Date.now(),
        version: '1.0.0',
        totalCount: this.notifications.size,
        unreadCount: this.getUnreadCount()
      }
    };
  }

  /**
   * Import notifications data
   */
  async importData(data) {
    try {
      if (!this.validateStorageData(data)) {
        throw new Error('Invalid import data structure');
      }

      const importedNotifications = new Map(data.notifications);
      let importedCount = 0;

      importedNotifications.forEach((notification, id) => {
        if (this.validateNotification(notification)) {
          this.notifications.set(id, notification);
          importedCount++;
        }
      });

      await this.limitNotifications();
      await this.saveToStorage();
      
      this.notifySubscribers('data-imported', { count: importedCount });
      
      console.log(`📊 Imported ${importedCount} notifications`);
      return importedCount;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-import' }, 'Lỗi import notifications');
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    try {
      this.notifications.clear();
      this.storage.removeItem(this.options.storageKey);
      
      this.notifySubscribers('data-cleared', {});
      
      console.log('📊 Cleared all notification data');
      
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-clear-data' }, 'Lỗi xóa dữ liệu notifications');
      throw error;
    }
  }

  /**
   * Destroy data manager
   */
  destroy() {
    this.subscribers.clear();
    window.removeEventListener('storage', this.handleStorageChange);
    console.log('📊 Notification Data Manager destroyed');
  }
}

// Export singleton instance
export const notificationDataManager = new NotificationDataManager();
