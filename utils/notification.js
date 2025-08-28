/**
 * 🔔 Notification Utility
 * Unified notification system cho toàn bộ ứng dụng
 */

import { UI_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

export class NotificationManager {
  constructor(options = {}) {
    this.container = null;
    this.notifications = new Map();
    this.maxNotifications = options.maxNotifications || 5;
    this.defaultDuration = options.defaultDuration || UI_CONFIG.NOTIFICATION_DURATION;
    this.animationDuration = options.animationDuration || UI_CONFIG.ANIMATION_DURATION;
    
    this.init();
  }

  /**
   * Initialize notification system
   */
  init() {
    if (typeof document === 'undefined') return; // Node.js environment
    
    // Create notification container
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    document.body.appendChild(this.container);
    
    // Add CSS animations
    this.addStyles();
    
    console.log('🔔 Notification Manager initialized');
  }

  /**
   * Add CSS styles for notifications
   */
  addStyles() {
    if (document.querySelector('#notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      .notification {
        pointer-events: auto;
        margin-bottom: 12px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        max-width: 400px;
        word-wrap: break-word;
        animation: slideInRight 0.3s ease-out;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .notification:hover {
        transform: translateY(-2px);
      }
      
      .notification.success {
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        border-left: 4px solid #2e7d32;
      }
      
      .notification.error {
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
        border-left: 4px solid #c62828;
      }
      
      .notification.warning {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
        border-left: 4px solid #ef6c00;
      }
      
      .notification.info {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
        border-left: 4px solid #1565c0;
      }
      
      .notification.closing {
        animation: slideOutRight 0.3s ease-in;
      }
      
      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255,255,255,0.3);
        border-radius: 0 0 8px 8px;
        transition: width linear;
      }
      
      .notification-close {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      }
      
      .notification-close:hover {
        opacity: 1;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  show(message, type = 'info', options = {}) {
    // HOÀN TOÀN TẮT legacy notification system
    console.log('🔕 Legacy notification system completely disabled:', { message, type, options });
    return null; // KHÔNG hiển thị popup

    // Code below is disabled to prevent any popup notifications
    /*
    if (typeof document === 'undefined') {
      // Console fallback for Node.js
      const icon = this.getIcon(type);
      console.log(`${icon} ${message}`);
      return null;
    }

    const id = this.generateId();
    const duration = options.duration || this.defaultDuration;
    const persistent = options.persistent || false;
    const showProgress = options.showProgress !== false;

    // Create notification element
    const notification = this.createElement(id, message, type, options);

    // Add to container
    this.container.appendChild(notification);
    this.notifications.set(id, {
      element: notification,
      type,
      message,
      createdAt: Date.now(),
      duration,
      persistent
    });

    // Auto-remove if not persistent
    if (!persistent && duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    // Limit number of notifications
    this.limitNotifications();

    return id;
    */
  }

  /**
   * Create notification element
   * @param {string} id - Notification ID
   * @param {string} message - Message text
   * @param {string} type - Notification type
   * @param {Object} options - Options
   * @returns {HTMLElement} Notification element
   */
  createElement(id, message, type, options) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.dataset.id = id;
    
    const icon = this.getIcon(type);
    const showClose = options.showClose !== false;
    const showProgress = options.showProgress !== false && !options.persistent;
    
    notification.innerHTML = `
      ${showClose ? '<button class="notification-close" onclick="notificationManager.hide(\'' + id + '\')">&times;</button>' : ''}
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
        <div style="flex: 1; min-width: 0;">
          ${message}
          ${options.subtitle ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${options.subtitle}</div>` : ''}
        </div>
      </div>
      ${showProgress ? '<div class="notification-progress"></div>' : ''}
    `;
    
    // Add click handler
    notification.addEventListener('click', () => {
      if (options.onClick) {
        options.onClick(id);
      } else if (!options.persistent) {
        this.hide(id);
      }
    });
    
    // Add progress animation
    if (showProgress && options.duration) {
      const progressBar = notification.querySelector('.notification-progress');
      if (progressBar) {
        progressBar.style.width = '100%';
        setTimeout(() => {
          progressBar.style.width = '0%';
          progressBar.style.transition = `width ${options.duration}ms linear`;
        }, 50);
      }
    }
    
    return notification;
  }

  /**
   * Hide notification
   * @param {string} id - Notification ID
   * @returns {boolean} Success status
   */
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const element = notification.element;
    element.classList.add('closing');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.notifications.delete(id);
    }, this.animationDuration);
    
    return true;
  }

  /**
   * Clear all notifications
   * @returns {number} Number of notifications cleared
   */
  clear() {
    const count = this.notifications.size;
    
    this.notifications.forEach((_, id) => {
      this.hide(id);
    });
    
    return count;
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Icon emoji
   */
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Generate unique notification ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Limit number of notifications
   */
  limitNotifications() {
    if (this.notifications.size <= this.maxNotifications) return;
    
    // Remove oldest notifications
    const sortedNotifications = Array.from(this.notifications.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt);
    
    const toRemove = sortedNotifications.slice(0, this.notifications.size - this.maxNotifications);
    toRemove.forEach(([id]) => this.hide(id));
  }

  /**
   * Convenience methods - HOÀN TOÀN TẮT popup notifications
   */
  success(message, options = {}) {
    console.log('🔕 Legacy success notification disabled:', message);
    return null; // KHÔNG hiển thị popup
  }

  error(message, options = {}) {
    console.log('🔕 Legacy error notification disabled:', message);
    return null; // KHÔNG hiển thị popup
  }

  warning(message, options = {}) {
    console.log('🔕 Legacy warning notification disabled:', message);
    return null; // KHÔNG hiển thị popup
  }

  info(message, options = {}) {
    console.log('🔕 Legacy info notification disabled:', message);
    return null; // KHÔNG hiển thị popup
  }

  /**
   * Get notification statistics
   * @returns {Object} Stats
   */
  getStats() {
    const types = {};
    this.notifications.forEach(notification => {
      types[notification.type] = (types[notification.type] || 0) + 1;
    });

    return {
      total: this.notifications.size,
      types,
      maxNotifications: this.maxNotifications
    };
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Make it globally available for onclick handlers
if (typeof window !== 'undefined') {
  window.notificationManager = notificationManager;
}

export default NotificationManager;
