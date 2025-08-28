/**
 * 👨‍💼 Admin Notification Manager
 * Quản lý thông báo cho admin và hệ thống
 */

import { notificationDataManager } from './notification-data-manager.js';
import { errorHandler } from './error-handler.js';

export class AdminNotificationManager {
  constructor(options = {}) {
    this.options = {
      adminKey: 'admin-notifications-key',
      enableScheduling: true,
      enableBulkOperations: true,
      enableTemplates: true,
      maxScheduledNotifications: 100,
      ...options
    };
    
    this.scheduledNotifications = new Map();
    this.templates = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Khởi tạo admin manager
   */
  async init() {
    try {
      await this.loadScheduledNotifications();
      await this.loadTemplates();
      
      if (this.options.enableScheduling) {
        this.startScheduler();
      }
      
      this.isInitialized = true;
      console.log('👨‍💼 Admin Notification Manager initialized');
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-notification-init' }, 'Lỗi khởi tạo admin notification manager');
    }
  }

  /**
   * Tạo thông báo hệ thống
   */
  async createSystemNotification(data) {
    try {
      const notification = {
        ...data,
        type: 'system',
        category: 'system',
        priority: data.priority || 'normal',
        timestamp: Date.now(),
        metadata: {
          ...data.metadata,
          createdBy: 'system',
          source: 'admin'
        }
      };

      const id = await notificationDataManager.createNotification(notification);
      console.log(`👨‍💼 Created system notification: ${data.title}`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-create-system' }, 'Lỗi tạo thông báo hệ thống');
      throw error;
    }
  }

  /**
   * Tạo thông báo cập nhật
   */
  async createUpdateNotification(version, changes, options = {}) {
    try {
      const notification = {
        title: `Cập nhật phiên bản ${version}`,
        message: `Hệ thống đã được cập nhật lên phiên bản ${version}. ${changes}`,
        type: 'update',
        category: 'system',
        priority: 'high',
        persistent: true,
        actionUrl: options.changelogUrl || '#/',
        actionText: 'Xem chi tiết',
        metadata: {
          version,
          changes,
          updateType: options.updateType || 'minor',
          createdBy: 'system'
        },
        ...options
      };

      const id = await this.createSystemNotification(notification);
      console.log(`🔄 Created update notification for version ${version}`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-create-update' }, 'Lỗi tạo thông báo cập nhật');
      throw error;
    }
  }

  /**
   * Tạo thông báo phim mới
   */
  async createMovieNotification(movieData, options = {}) {
    try {
      const notification = {
        title: options.title || `Phim mới: ${movieData.name || movieData.title}`,
        message: options.message || `Đã thêm phim "${movieData.name || movieData.title}" vào thư viện. Hãy xem ngay!`,
        type: 'movie',
        category: 'movie',
        priority: 'normal',
        actionUrl: options.actionUrl || `#/phim/${movieData.slug}`,
        actionText: 'Xem phim',
        metadata: {
          movieId: movieData.id || movieData._id,
          movieSlug: movieData.slug,
          movieType: movieData.type,
          createdBy: 'system'
        },
        ...options
      };

      const id = await notificationDataManager.createNotification(notification);
      console.log(`🎬 Created movie notification: ${movieData.name || movieData.title}`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-create-movie' }, 'Lỗi tạo thông báo phim');
      throw error;
    }
  }

  /**
   * Tạo thông báo bảo trì
   */
  async createMaintenanceNotification(startTime, endTime, reason, options = {}) {
    try {
      const startDate = new Date(startTime).toLocaleString('vi-VN');
      const endDate = new Date(endTime).toLocaleString('vi-VN');
      
      const notification = {
        title: 'Thông báo bảo trì hệ thống',
        message: `Hệ thống sẽ bảo trì từ ${startDate} đến ${endDate}. Lý do: ${reason}`,
        type: 'warning',
        category: 'system',
        priority: 'high',
        persistent: true,
        metadata: {
          maintenanceStart: startTime,
          maintenanceEnd: endTime,
          reason,
          createdBy: 'admin'
        },
        ...options
      };

      const id = await this.createSystemNotification(notification);
      console.log(`⚠️ Created maintenance notification`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-create-maintenance' }, 'Lỗi tạo thông báo bảo trì');
      throw error;
    }
  }

  /**
   * Tạo thông báo khuyến mãi/sự kiện
   */
  async createPromotionNotification(title, description, options = {}) {
    try {
      const notification = {
        title,
        message: description,
        type: 'info',
        category: 'promotion',
        priority: 'normal',
        actionUrl: options.actionUrl,
        actionText: options.actionText || 'Tham gia ngay',
        expiresAt: options.expiresAt,
        metadata: {
          promotionType: options.promotionType || 'general',
          createdBy: 'admin'
        },
        ...options
      };

      const id = await notificationDataManager.createNotification(notification);
      console.log(`🎉 Created promotion notification: ${title}`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-create-promotion' }, 'Lỗi tạo thông báo khuyến mãi');
      throw error;
    }
  }

  /**
   * Lên lịch thông báo
   */
  async scheduleNotification(notificationData, scheduledTime) {
    try {
      if (!this.options.enableScheduling) {
        throw new Error('Scheduling is disabled');
      }

      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const scheduledNotification = {
        id: scheduleId,
        notificationData,
        scheduledTime,
        status: 'pending',
        createdAt: Date.now(),
        createdBy: 'admin'
      };

      this.scheduledNotifications.set(scheduleId, scheduledNotification);
      await this.saveScheduledNotifications();
      
      console.log(`📅 Scheduled notification for ${new Date(scheduledTime).toLocaleString('vi-VN')}`);
      return scheduleId;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-schedule' }, 'Lỗi lên lịch thông báo');
      throw error;
    }
  }

  /**
   * Hủy thông báo đã lên lịch
   */
  async cancelScheduledNotification(scheduleId) {
    try {
      const scheduled = this.scheduledNotifications.get(scheduleId);
      if (!scheduled) {
        throw new Error('Scheduled notification not found');
      }

      scheduled.status = 'cancelled';
      await this.saveScheduledNotifications();
      
      console.log(`❌ Cancelled scheduled notification: ${scheduleId}`);
      return true;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-cancel-schedule' }, 'Lỗi hủy thông báo đã lên lịch');
      throw error;
    }
  }

  /**
   * Tạo thông báo hàng loạt
   */
  async createBulkNotifications(notifications) {
    try {
      if (!this.options.enableBulkOperations) {
        throw new Error('Bulk operations are disabled');
      }

      const results = [];
      const errors = [];

      for (const notificationData of notifications) {
        try {
          const id = await notificationDataManager.createNotification({
            ...notificationData,
            metadata: {
              ...notificationData.metadata,
              createdBy: 'admin',
              bulkOperation: true
            }
          });
          results.push({ success: true, id, data: notificationData });
        } catch (error) {
          errors.push({ success: false, error: error.message, data: notificationData });
        }
      }

      console.log(`📦 Bulk created ${results.length} notifications, ${errors.length} errors`);
      return { results, errors };
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-bulk-create' }, 'Lỗi tạo thông báo hàng loạt');
      throw error;
    }
  }

  /**
   * Xóa thông báo hàng loạt theo điều kiện
   */
  async deleteBulkNotifications(criteria) {
    try {
      if (!this.options.enableBulkOperations) {
        throw new Error('Bulk operations are disabled');
      }

      const notifications = notificationDataManager.getNotifications(criteria);
      let deletedCount = 0;

      for (const notification of notifications) {
        try {
          await notificationDataManager.deleteNotification(notification.id);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete notification ${notification.id}:`, error);
        }
      }

      console.log(`🗑️ Bulk deleted ${deletedCount} notifications`);
      return deletedCount;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-bulk-delete' }, 'Lỗi xóa thông báo hàng loạt');
      throw error;
    }
  }

  /**
   * Tạo template thông báo
   */
  async createTemplate(name, template) {
    try {
      if (!this.options.enableTemplates) {
        throw new Error('Templates are disabled');
      }

      const templateData = {
        name,
        template: {
          title: template.title || '',
          message: template.message || '',
          type: template.type || 'info',
          category: template.category || 'general',
          priority: template.priority || 'normal',
          ...template
        },
        createdAt: Date.now(),
        createdBy: 'admin'
      };

      this.templates.set(name, templateData);
      await this.saveTemplates();
      
      console.log(`📝 Created notification template: ${name}`);
      return name;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-create-template' }, 'Lỗi tạo template thông báo');
      throw error;
    }
  }

  /**
   * Sử dụng template để tạo thông báo
   */
  async createFromTemplate(templateName, variables = {}) {
    try {
      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // Replace variables in template
      const notificationData = { ...template.template };
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        if (notificationData.title) {
          notificationData.title = notificationData.title.replace(new RegExp(placeholder, 'g'), value);
        }
        if (notificationData.message) {
          notificationData.message = notificationData.message.replace(new RegExp(placeholder, 'g'), value);
        }
      });

      notificationData.metadata = {
        ...notificationData.metadata,
        templateUsed: templateName,
        variables,
        createdBy: 'admin'
      };

      const id = await notificationDataManager.createNotification(notificationData);
      console.log(`📝 Created notification from template: ${templateName}`);
      return id;
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-template-create' }, 'Lỗi tạo thông báo từ template');
      throw error;
    }
  }

  /**
   * Lấy thống kê thông báo
   */
  getNotificationStatistics(timeRange = 'all') {
    try {
      const stats = notificationDataManager.getStatistics();
      const now = Date.now();
      let fromTime = 0;

      switch (timeRange) {
        case 'today':
          fromTime = now - 24 * 60 * 60 * 1000;
          break;
        case 'week':
          fromTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          fromTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
      }

      if (fromTime > 0) {
        const notifications = notificationDataManager.getNotifications({ fromDate: fromTime });
        return {
          ...stats,
          timeRange,
          filtered: {
            total: notifications.length,
            unread: notifications.filter(n => !n.isRead).length,
            byType: this.groupBy(notifications, 'type'),
            byCategory: this.groupBy(notifications, 'category'),
            byPriority: this.groupBy(notifications, 'priority')
          }
        };
      }

      return { ...stats, timeRange };
      
    } catch (error) {
      errorHandler.handle(error, { type: 'admin-stats' }, 'Lỗi lấy thống kê thông báo');
      return null;
    }
  }

  /**
   * Group by field
   */
  groupBy(items, field) {
    return items.reduce((groups, item) => {
      const key = item[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Lấy danh sách thông báo đã lên lịch
   */
  getScheduledNotifications() {
    return Array.from(this.scheduledNotifications.values())
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  /**
   * Lấy danh sách templates
   */
  getTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Load scheduled notifications từ storage
   */
  async loadScheduledNotifications() {
    try {
      const stored = localStorage.getItem('admin-scheduled-notifications');
      if (stored) {
        const data = JSON.parse(stored);
        this.scheduledNotifications = new Map(data.notifications || []);
      }
    } catch (error) {
      console.warn('Failed to load scheduled notifications:', error);
      this.scheduledNotifications = new Map();
    }
  }

  /**
   * Save scheduled notifications vào storage
   */
  async saveScheduledNotifications() {
    try {
      const data = {
        notifications: Array.from(this.scheduledNotifications.entries()),
        lastUpdated: Date.now()
      };
      localStorage.setItem('admin-scheduled-notifications', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save scheduled notifications:', error);
    }
  }

  /**
   * Load templates từ storage
   */
  async loadTemplates() {
    try {
      const stored = localStorage.getItem('admin-notification-templates');
      if (stored) {
        const data = JSON.parse(stored);
        this.templates = new Map(data.templates || []);
      } else {
        // Create default templates
        await this.createDefaultTemplates();
      }
    } catch (error) {
      console.warn('Failed to load templates:', error);
      this.templates = new Map();
    }
  }

  /**
   * Save templates vào storage
   */
  async saveTemplates() {
    try {
      const data = {
        templates: Array.from(this.templates.entries()),
        lastUpdated: Date.now()
      };
      localStorage.setItem('admin-notification-templates', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save templates:', error);
    }
  }

  /**
   * Tạo default templates
   */
  async createDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'system-update',
        template: {
          title: 'Cập nhật hệ thống {{version}}',
          message: 'Hệ thống đã được cập nhật lên phiên bản {{version}}. {{changes}}',
          type: 'update',
          category: 'system',
          priority: 'high'
        }
      },
      {
        name: 'new-movie',
        template: {
          title: 'Phim mới: {{movieName}}',
          message: 'Đã thêm phim "{{movieName}}" vào thư viện. Hãy xem ngay!',
          type: 'movie',
          category: 'movie',
          priority: 'normal'
        }
      },
      {
        name: 'maintenance',
        template: {
          title: 'Thông báo bảo trì hệ thống',
          message: 'Hệ thống sẽ bảo trì từ {{startTime}} đến {{endTime}}. Lý do: {{reason}}',
          type: 'warning',
          category: 'system',
          priority: 'high'
        }
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.name, {
        ...template,
        createdAt: Date.now(),
        createdBy: 'system'
      });
    }

    await this.saveTemplates();
  }

  /**
   * Start scheduler để xử lý thông báo đã lên lịch
   */
  startScheduler() {
    setInterval(() => {
      this.processScheduledNotifications();
    }, 60000); // Check every minute
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    const now = Date.now();
    const toProcess = [];

    this.scheduledNotifications.forEach((scheduled, id) => {
      if (scheduled.status === 'pending' && scheduled.scheduledTime <= now) {
        toProcess.push({ id, scheduled });
      }
    });

    for (const { id, scheduled } of toProcess) {
      try {
        await notificationDataManager.createNotification({
          ...scheduled.notificationData,
          metadata: {
            ...scheduled.notificationData.metadata,
            scheduledId: id,
            originalScheduledTime: scheduled.scheduledTime
          }
        });

        scheduled.status = 'sent';
        scheduled.sentAt = now;
        
        console.log(`📅 Sent scheduled notification: ${id}`);
        
      } catch (error) {
        scheduled.status = 'failed';
        scheduled.error = error.message;
        console.error(`Failed to send scheduled notification ${id}:`, error);
      }
    }

    if (toProcess.length > 0) {
      await this.saveScheduledNotifications();
    }
  }

  /**
   * Destroy admin manager
   */
  destroy() {
    console.log('👨‍💼 Admin Notification Manager destroyed');
  }
}

// Export singleton instance
export const adminNotificationManager = new AdminNotificationManager();
