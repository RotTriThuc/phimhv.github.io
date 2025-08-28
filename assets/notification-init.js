/**
 * 🔔 Notification System Initialization
 * Khởi tạo và tích hợp notification system vào ứng dụng
 */

import { notificationButton } from '../components/notification-button.js';
import { notificationDropdown } from '../components/notification-dropdown.js';
import { notificationDataManager } from '../utils/notification-data-manager.js';
import { adminNotificationManager } from '../utils/admin-notification-manager.js';
import { notificationPreferences } from '../components/notification-preferences.js';
import { smartToastManager } from '../components/smart-toast-manager.js';

/**
 * Initialize notification system
 */
export async function initNotificationSystem() {
  try {
    console.log('🔔 Initializing notification system...');
    
    // Wait for data manager to be ready
    if (!notificationDataManager.isInitialized) {
      await new Promise(resolve => {
        const checkReady = () => {
          if (notificationDataManager.isInitialized) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
    
    // Get container for notification button
    const container = document.getElementById('notificationButtonContainer');
    if (!container) {
      console.warn('Notification button container not found');
      return;
    }
    
    // Add notification button to header
    const buttonElement = notificationButton.getElement();
    container.appendChild(buttonElement);
    
    // Connect button with dropdown
    buttonElement.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.toggle();
    });
    
    // Update dropdown position relative to button
    const originalUpdatePosition = notificationDropdown.updatePosition;
    notificationDropdown.updatePosition = function() {
      const buttonRect = buttonElement.getBoundingClientRect();
      const dropdownElement = this.getElement();
      const dropdownRect = dropdownElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = buttonRect.bottom + 8;
      let left = buttonRect.left;

      // Adjust horizontal position
      if (left + 380 > viewportWidth - 16) {
        left = buttonRect.right - 380;
      }

      // Adjust vertical position
      if (top + 500 > viewportHeight - 16) {
        top = buttonRect.top - 500 - 8;
      }

      // Ensure minimum margins
      left = Math.max(16, Math.min(left, viewportWidth - 380 - 16));
      top = Math.max(16, Math.min(top, viewportHeight - 500 - 16));

      dropdownElement.style.position = 'fixed';
      dropdownElement.style.top = `${top}px`;
      dropdownElement.style.left = `${left}px`;
      dropdownElement.style.zIndex = '1000';
    };
    
    // Subscribe to data changes to update button badge and show toasts
    notificationDataManager.subscribe((event, data) => {
      if (event === 'notification-created' ||
          event === 'notification-updated' ||
          event === 'notification-deleted' ||
          event === 'bulk-mark-read' ||
          event === 'all-notifications-deleted') {

        // Update button badge
        const unreadCount = notificationDataManager.getUnreadCount();
        notificationButton.unreadCount = unreadCount;
        notificationButton.updateBadge();

        // ✅ PERFECT: Notifications chỉ hiển thị badge và lưu vào dropdown
        // KHÔNG có popup - chỉ silent notification với badge update
        console.log('� New notification added to system - badge updated, no popup');
      }
    });

    // Listen for mark as read events from toast clicks
    window.addEventListener('notification-mark-read', async (e) => {
      const { id } = e.detail;
      await notificationDataManager.markAsRead(id);
    });
    
    // Initial badge update
    const initialUnreadCount = notificationDataManager.getUnreadCount();
    notificationButton.unreadCount = initialUnreadCount;
    notificationButton.updateBadge();
    
    // Sample notifications removed - admin can now create custom notifications
    // No default notifications will be created automatically
    
    console.log('✅ Notification system initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize notification system:', error);
  }
}

// addSampleNotifications function removed - no longer needed

/**
 * Create system notification
 */
export async function createSystemNotification(title, message, options = {}) {
  try {
    const notification = {
      title,
      message,
      type: 'system',
      category: 'system',
      priority: 'normal',
      ...options
    };
    
    const id = await notificationDataManager.createNotification(notification);
    console.log(`📢 Created system notification: ${title}`);
    return id;
    
  } catch (error) {
    console.error('Failed to create system notification:', error);
    return null;
  }
}

/**
 * Create movie notification
 */
export async function createMovieNotification(title, message, options = {}) {
  try {
    const notification = {
      title,
      message,
      type: 'movie',
      category: 'movie',
      priority: 'normal',
      ...options
    };
    
    const id = await notificationDataManager.createNotification(notification);
    console.log(`🎬 Created movie notification: ${title}`);
    return id;
    
  } catch (error) {
    console.error('Failed to create movie notification:', error);
    return null;
  }
}

/**
 * Create update notification
 */
export async function createUpdateNotification(title, message, options = {}) {
  try {
    const notification = {
      title,
      message,
      type: 'update',
      category: 'system',
      priority: 'high',
      ...options
    };
    
    const id = await notificationDataManager.createNotification(notification);
    console.log(`🔄 Created update notification: ${title}`);
    return id;
    
  } catch (error) {
    console.error('Failed to create update notification:', error);
    return null;
  }
}

/**
 * Show success notification
 */
export async function showSuccessNotification(title, message, options = {}) {
  try {
    const notification = {
      title,
      message,
      type: 'success',
      category: 'general',
      priority: 'normal',
      ...options
    };
    
    const id = await notificationDataManager.createNotification(notification);
    return id;
    
  } catch (error) {
    console.error('Failed to show success notification:', error);
    return null;
  }
}

/**
 * Show error notification
 */
export async function showErrorNotification(title, message, options = {}) {
  try {
    const notification = {
      title,
      message,
      type: 'error',
      category: 'general',
      priority: 'high',
      persistent: true,
      ...options
    };
    
    const id = await notificationDataManager.createNotification(notification);
    return id;
    
  } catch (error) {
    console.error('Failed to show error notification:', error);
    return null;
  }
}

/**
 * Show warning notification
 */
export async function showWarningNotification(title, message, options = {}) {
  try {
    const notification = {
      title,
      message,
      type: 'warning',
      category: 'general',
      priority: 'normal',
      ...options
    };
    
    const id = await notificationDataManager.createNotification(notification);
    return id;
    
  } catch (error) {
    console.error('Failed to show warning notification:', error);
    return null;
  }
}

/**
 * Get notification statistics
 */
export function getNotificationStats() {
  return notificationDataManager.getStatistics();
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  try {
    await notificationDataManager.deleteAllNotifications();
    console.log('🧹 Cleared all notifications');
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}

/**
 * Export notification data
 */
export function exportNotificationData() {
  return notificationDataManager.exportData();
}

/**
 * Import notification data
 */
export async function importNotificationData(data) {
  try {
    const count = await notificationDataManager.importData(data);
    console.log(`📥 Imported ${count} notifications`);
    return count;
  } catch (error) {
    console.error('Failed to import notification data:', error);
    return 0;
  }
}

/**
 * Admin functions - Expose to global scope for admin use
 */
window.AdminNotifications = {
  // System notifications
  createSystemNotification: (title, message, options) =>
    adminNotificationManager.createSystemNotification({ title, message, ...options }),

  createUpdateNotification: (version, changes, options) =>
    adminNotificationManager.createUpdateNotification(version, changes, options),

  createMovieNotification: (movieData, options) =>
    adminNotificationManager.createMovieNotification(movieData, options),

  createMaintenanceNotification: (startTime, endTime, reason, options) =>
    adminNotificationManager.createMaintenanceNotification(startTime, endTime, reason, options),

  createPromotionNotification: (title, description, options) =>
    adminNotificationManager.createPromotionNotification(title, description, options),

  // Scheduling
  scheduleNotification: (notificationData, scheduledTime) =>
    adminNotificationManager.scheduleNotification(notificationData, scheduledTime),

  cancelScheduledNotification: (scheduleId) =>
    adminNotificationManager.cancelScheduledNotification(scheduleId),

  getScheduledNotifications: () =>
    adminNotificationManager.getScheduledNotifications(),

  // Bulk operations
  createBulkNotifications: (notifications) =>
    adminNotificationManager.createBulkNotifications(notifications),

  deleteBulkNotifications: (criteria) =>
    adminNotificationManager.deleteBulkNotifications(criteria),

  // Templates
  createTemplate: (name, template) =>
    adminNotificationManager.createTemplate(name, template),

  createFromTemplate: (templateName, variables) =>
    adminNotificationManager.createFromTemplate(templateName, variables),

  getTemplates: () =>
    adminNotificationManager.getTemplates(),

  // Statistics
  getStatistics: (timeRange) =>
    adminNotificationManager.getNotificationStatistics(timeRange),

  // Data management
  exportData: () => exportNotificationData(),
  importData: (data) => importNotificationData(data),
  clearAll: () => clearAllNotifications(),

  // Quick helpers
  notifyMovieAdded: (movieName, movieSlug) =>
    adminNotificationManager.createMovieNotification(
      { name: movieName, slug: movieSlug },
      { actionUrl: `#/phim/${movieSlug}` }
    ),

  notifySystemUpdate: (version, changes) =>
    adminNotificationManager.createUpdateNotification(version, changes),

  notifyMaintenance: (hours, reason) => {
    const startTime = Date.now();
    const endTime = startTime + (hours * 60 * 60 * 1000);
    return adminNotificationManager.createMaintenanceNotification(startTime, endTime, reason);
  }
};

// Console helpers for admin
console.log(`
🔔 Admin Notification System Ready!

Sử dụng các lệnh sau trong console:

// Tạo thông báo hệ thống
AdminNotifications.createSystemNotification('Tiêu đề', 'Nội dung', { priority: 'high' })

// Thông báo phim mới
AdminNotifications.notifyMovieAdded('Tên phim', 'slug-phim')

// Thông báo cập nhật
AdminNotifications.notifySystemUpdate('v2.1.0', 'Cải thiện hiệu suất và sửa lỗi')

// Thông báo bảo trì (2 giờ)
AdminNotifications.notifyMaintenance(2, 'Cập nhật database')

// Xem thống kê
AdminNotifications.getStatistics('week')

// Xem templates
AdminNotifications.getTemplates()
`);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationSystem);
} else {
  // DOM is already ready
  setTimeout(initNotificationSystem, 100);
}
