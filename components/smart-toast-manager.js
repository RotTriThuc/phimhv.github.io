/**
 * 🍞 Smart Toast Manager
 * Less intrusive toast notifications với user preferences
 */

import { notificationPreferences } from './notification-preferences.js';
import { errorHandler } from '../utils/error-handler.js';

export class SmartToastManager {
  constructor(options = {}) {
    this.options = {
      maxToasts: 3,
      defaultDuration: 4000,
      groupingDelay: 2000,
      animationDuration: 300,
      ...options
    };
    
    this.toasts = new Map();
    this.container = null;
    this.groupingTimer = null;
    this.pendingToasts = [];
    
    this.init();
  }

  /**
   * Khởi tạo toast manager
   */
  init() {
    try {
      this.createContainer();
      this.bindEvents();
      
      console.log('🍞 Smart Toast Manager initialized');
    } catch (error) {
      errorHandler.handle(error, { type: 'toast-manager-init' }, 'Lỗi khởi tạo toast manager');
    }
  }

  /**
   * Tạo container cho toasts
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'smart-toast-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-label', 'Thông báo');
    
    // Default position - sẽ được update theo preferences
    this.updateContainerPosition();
    
    document.body.appendChild(this.container);
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Listen for preference changes
    window.addEventListener('notification-preferences-changed', (e) => {
      this.updateContainerPosition();
    });

    // Handle container clicks
    this.container.addEventListener('click', (e) => {
      const toast = e.target.closest('.smart-toast');
      if (toast && !e.target.closest('.smart-toast__close')) {
        const id = toast.getAttribute('data-id');
        this.handleToastClick(id);
      }
    });

    // Handle swipe gestures on mobile
    this.container.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    });

    this.container.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    });

    this.container.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    });
  }

  /**
   * Update container position based on preferences
   */
  updateContainerPosition() {
    const preferences = notificationPreferences.getPreferences();
    const position = preferences.toastPosition || 'bottom-right';
    
    this.container.className = `smart-toast-container smart-toast-container--${position}`;
  }

  /**
   * Show toast notification - HOÀN TOÀN TẮT
   */
  async showToast(notification) {
    try {
      // LUÔN RETURN NULL - KHÔNG BAO GIỜ HIỂN THỊ TOAST
      console.log('🔕 Toast notifications are completely disabled');
      return null;

      // Code below is disabled to prevent any toast notifications
      /*
      const preferences = notificationPreferences.getPreferences();

      // Check if toast should be shown
      if (!preferences.enableToastNotifications) {
        return null;
      }

      if (!notificationPreferences.shouldShowToast(notification)) {
        return null;
      }

      if (!notificationPreferences.shouldShowNotification(notification)) {
        return null;
      }

      // Handle grouping
      if (preferences.enableGrouping) {
        return this.handleGroupedToast(notification);
      }

      return this.createToast(notification);
      */

    } catch (error) {
      errorHandler.handle(error, { type: 'show-toast' }, 'Lỗi hiển thị toast');
      return null;
    }
  }

  /**
   * Handle grouped toasts
   */
  handleGroupedToast(notification) {
    // Add to pending toasts
    this.pendingToasts.push(notification);
    
    // Clear existing timer
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer);
    }
    
    // Set new timer
    this.groupingTimer = setTimeout(() => {
      this.processGroupedToasts();
    }, this.options.groupingDelay);
    
    return null;
  }

  /**
   * Process grouped toasts
   */
  processGroupedToasts() {
    if (this.pendingToasts.length === 0) return;
    
    if (this.pendingToasts.length === 1) {
      // Single toast
      this.createToast(this.pendingToasts[0]);
    } else {
      // Multiple toasts - create grouped toast
      this.createGroupedToast(this.pendingToasts);
    }
    
    this.pendingToasts = [];
    this.groupingTimer = null;
  }

  /**
   * Create single toast
   */
  createToast(notification) {
    const preferences = notificationPreferences.getPreferences();
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Limit number of toasts
    this.limitToasts();
    
    const toast = document.createElement('div');
    toast.className = `smart-toast smart-toast--${notification.type}`;
    toast.setAttribute('data-id', id);
    toast.setAttribute('role', 'alert');
    
    const icon = this.getTypeIcon(notification.type);
    const duration = preferences.toastDuration || this.options.defaultDuration;
    
    toast.innerHTML = `
      <div class="smart-toast__icon">${icon}</div>
      <div class="smart-toast__content">
        <div class="smart-toast__title">${this.escapeHtml(notification.title)}</div>
        ${notification.message ? `<div class="smart-toast__message">${this.escapeHtml(notification.message)}</div>` : ''}
      </div>
      <button class="smart-toast__close" aria-label="Đóng thông báo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      ${duration > 0 ? '<div class="smart-toast__progress"></div>' : ''}
    `;

    // Add click handler for close button
    toast.querySelector('.smart-toast__close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToast(id);
    });

    // Store toast data
    this.toasts.set(id, {
      element: toast,
      notification,
      createdAt: Date.now(),
      duration
    });

    // Add to container with animation
    this.container.appendChild(toast);
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('smart-toast--visible');
    });

    // Auto remove if duration is set
    if (duration > 0) {
      this.startProgressAnimation(toast, duration);
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Create grouped toast
   */
  createGroupedToast(notifications) {
    const groupedNotification = {
      title: `${notifications.length} thông báo mới`,
      message: notifications.map(n => n.title).join(', '),
      type: 'info',
      grouped: true,
      notifications
    };
    
    return this.createToast(groupedNotification);
  }

  /**
   * Start progress animation
   */
  startProgressAnimation(toast, duration) {
    const progressBar = toast.querySelector('.smart-toast__progress');
    if (progressBar) {
      progressBar.style.animationDuration = `${duration}ms`;
      progressBar.classList.add('smart-toast__progress--active');
    }
  }

  /**
   * Remove toast
   */
  removeToast(id) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    const toast = toastData.element;
    
    // Exit animation
    toast.classList.add('smart-toast--removing');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, this.options.animationDuration);
  }

  /**
   * Limit number of toasts
   */
  limitToasts() {
    const preferences = notificationPreferences.getPreferences();
    const maxToasts = preferences.toastMaxCount || this.options.maxToasts;
    
    if (this.toasts.size >= maxToasts) {
      // Remove oldest toast
      const oldestId = Array.from(this.toasts.keys())[0];
      this.removeToast(oldestId);
    }
  }

  /**
   * Handle toast click
   */
  handleToastClick(id) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    const notification = toastData.notification;
    
    // Navigate if has action URL
    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl;
    }
    
    // Remove toast
    this.removeToast(id);
    
    // Mark as read if not grouped
    if (!notification.grouped && notification.id) {
      // Dispatch event to mark as read
      window.dispatchEvent(new CustomEvent('notification-mark-read', {
        detail: { id: notification.id }
      }));
    }
  }

  /**
   * Touch handling for swipe to dismiss
   */
  handleTouchStart(e) {
    const toast = e.target.closest('.smart-toast');
    if (!toast) return;

    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchingToast = toast;
  }

  handleTouchMove(e) {
    if (!this.touchingToast) return;

    const deltaX = e.touches[0].clientX - this.touchStartX;
    const deltaY = e.touches[0].clientY - this.touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    
    e.preventDefault();
    
    // Apply transform
    this.touchingToast.style.transform = `translateX(${deltaX}px)`;
    this.touchingToast.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
  }

  handleTouchEnd(e) {
    if (!this.touchingToast) return;

    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    
    // If swiped far enough, remove toast
    if (Math.abs(deltaX) > 100) {
      const id = this.touchingToast.getAttribute('data-id');
      this.removeToast(id);
    } else {
      // Reset position
      this.touchingToast.style.transform = '';
      this.touchingToast.style.opacity = '';
    }
    
    this.touchingToast = null;
  }

  /**
   * Get type icon
   */
  getTypeIcon(type) {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      system: '⚙️',
      update: '🔄',
      movie: '🎬',
      urgent: '🚨'
    };
    return icons[type] || icons.info;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear all toasts
   */
  clearAllToasts() {
    this.toasts.forEach((_, id) => {
      this.removeToast(id);
    });
  }

  /**
   * Get active toasts count
   */
  getActiveToastsCount() {
    return this.toasts.size;
  }

  /**
   * Show success toast (helper) - DISABLED
   */
  showSuccess(title, message, options = {}) {
    console.log('🔕 Success toast disabled:', title, message);
    return null; // KHÔNG hiển thị toast
  }

  /**
   * Show error toast (helper) - DISABLED
   */
  showError(title, message, options = {}) {
    console.log('🔕 Error toast disabled:', title, message);
    return null; // KHÔNG hiển thị toast
  }

  /**
   * Show warning toast (helper) - DISABLED
   */
  showWarning(title, message, options = {}) {
    console.log('🔕 Warning toast disabled:', title, message);
    return null; // KHÔNG hiển thị toast
  }

  /**
   * Show info toast (helper) - DISABLED
   */
  showInfo(title, message, options = {}) {
    console.log('🔕 Info toast disabled:', title, message);
    return null; // KHÔNG hiển thị toast
  }

  /**
   * Destroy toast manager
   */
  destroy() {
    this.clearAllToasts();
    
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer);
    }
    
    if (this.container) {
      this.container.remove();
    }
    
    console.log('🍞 Smart Toast Manager destroyed');
  }
}

// Export singleton instance
export const smartToastManager = new SmartToastManager();
