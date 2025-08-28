/**
 * 🔔 Notification Button Component
 * Component button thông báo với bell icon, badge count và dropdown
 */

import { notificationManager } from '../utils/notification.js';
import { errorHandler } from '../utils/error-handler.js';

export class NotificationButton {
  constructor(options = {}) {
    this.options = {
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left
      maxNotifications: 50,
      autoMarkAsRead: true,
      showTimestamp: true,
      enableSound: false,
      ...options
    };
    
    this.isOpen = false;
    this.notifications = new Map();
    this.unreadCount = 0;
    this.element = null;
    this.dropdown = null;
    
    this.init();
  }

  /**
   * Khởi tạo component
   */
  init() {
    try {
      this.createElement();
      this.loadNotifications();
      this.bindEvents();
      this.updateBadge();
      
      console.log('🔔 Notification Button initialized');
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-button-init' }, 'Lỗi khởi tạo notification button');
    }
  }

  /**
   * Tạo HTML element cho button
   */
  createElement() {
    // Tạo button element
    this.element = document.createElement('button');
    this.element.className = 'notification-btn';
    this.element.setAttribute('aria-label', 'Thông báo');
    this.element.setAttribute('aria-expanded', 'false');
    
    this.element.innerHTML = `
      <div class="notification-btn__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <span class="notification-btn__badge" style="display: none;">0</span>
    `;

    // Tạo dropdown element
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'notification-dropdown';
    this.dropdown.style.display = 'none';
    
    this.dropdown.innerHTML = `
      <div class="notification-dropdown__header">
        <h3>Thông báo</h3>
        <div class="notification-dropdown__actions">
          <button class="notification-action-btn" data-action="mark-all-read" title="Đánh dấu tất cả đã đọc">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </button>
          <button class="notification-action-btn" data-action="clear-all" title="Xóa tất cả">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="notification-dropdown__content">
        <div class="notification-list" id="notificationList">
          <div class="notification-empty">
            <div class="notification-empty__icon">🔔</div>
            <p>Chưa có thông báo nào</p>
          </div>
        </div>
      </div>
    `;

    // Append dropdown to body để tránh overflow issues
    document.body.appendChild(this.dropdown);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Click button để toggle dropdown
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Click outside để đóng dropdown
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.close();
      }
    });

    // Keyboard navigation
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    // Dropdown actions
    this.dropdown.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        this.handleAction(action);
      }

      const notificationItem = e.target.closest('.notification-item');
      if (notificationItem) {
        const id = notificationItem.getAttribute('data-id');
        this.handleNotificationClick(id);
      }
    });

    // Resize window để update position
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.updateDropdownPosition();
      }
    });
  }

  /**
   * Load notifications từ localStorage
   */
  loadNotifications() {
    try {
      const stored = localStorage.getItem('app-notifications');
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = new Map(data.notifications || []);
        this.unreadCount = data.unreadCount || 0;
      }
    } catch (error) {
      console.warn('Không thể load notifications từ localStorage:', error);
      this.notifications = new Map();
      this.unreadCount = 0;
    }
  }

  /**
   * Save notifications vào localStorage
   */
  saveNotifications() {
    try {
      const data = {
        notifications: Array.from(this.notifications.entries()),
        unreadCount: this.unreadCount,
        lastUpdated: Date.now()
      };
      localStorage.setItem('app-notifications', JSON.stringify(data));
    } catch (error) {
      console.warn('Không thể save notifications vào localStorage:', error);
    }
  }

  /**
   * Thêm notification mới
   * @param {Object} notification - Notification data
   */
  addNotification(notification) {
    const id = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notificationData = {
      id,
      title: notification.title || 'Thông báo',
      message: notification.message || '',
      type: notification.type || 'info', // info, success, warning, error
      timestamp: notification.timestamp || Date.now(),
      isRead: notification.isRead || false,
      persistent: notification.persistent || false,
      actionUrl: notification.actionUrl || null,
      actionText: notification.actionText || null,
      ...notification
    };

    this.notifications.set(id, notificationData);
    
    if (!notificationData.isRead) {
      this.unreadCount++;
    }

    // Giới hạn số lượng notifications
    this.limitNotifications();
    
    this.updateBadge();
    this.updateDropdownContent();
    this.saveNotifications();

    // Play sound nếu enabled
    if (this.options.enableSound && !notificationData.isRead) {
      this.playNotificationSound();
    }

    return id;
  }

  /**
   * Giới hạn số lượng notifications
   */
  limitNotifications() {
    if (this.notifications.size > this.options.maxNotifications) {
      // Xóa notifications cũ nhất (trừ persistent ones)
      const sortedNotifications = Array.from(this.notifications.entries())
        .filter(([_, notif]) => !notif.persistent)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedNotifications.slice(0, this.notifications.size - this.options.maxNotifications);
      toRemove.forEach(([id, notif]) => {
        this.notifications.delete(id);
        if (!notif.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }
  }

  /**
   * Update badge hiển thị số lượng unread
   */
  updateBadge() {
    const badge = this.element.querySelector('.notification-btn__badge');
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
      badge.style.display = 'block';
      this.element.classList.add('has-notifications');
    } else {
      badge.style.display = 'none';
      this.element.classList.remove('has-notifications');
    }
  }

  /**
   * Toggle dropdown
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Mở dropdown
   */
  open() {
    this.isOpen = true;
    this.dropdown.style.display = 'block';
    this.element.setAttribute('aria-expanded', 'true');
    this.element.classList.add('active');
    
    this.updateDropdownPosition();
    this.updateDropdownContent();
    
    // Focus management
    setTimeout(() => {
      const firstFocusable = this.dropdown.querySelector('button, [tabindex="0"]');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
  }

  /**
   * Đóng dropdown
   */
  close() {
    this.isOpen = false;
    this.dropdown.style.display = 'none';
    this.element.setAttribute('aria-expanded', 'false');
    this.element.classList.remove('active');
  }

  /**
   * Update vị trí dropdown
   */
  updateDropdownPosition() {
    const buttonRect = this.element.getBoundingClientRect();
    const dropdownRect = this.dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = buttonRect.bottom + 8;
    let left = buttonRect.left;

    // Adjust horizontal position
    if (left + dropdownRect.width > viewportWidth - 16) {
      left = buttonRect.right - dropdownRect.width;
    }

    // Adjust vertical position
    if (top + dropdownRect.height > viewportHeight - 16) {
      top = buttonRect.top - dropdownRect.height - 8;
    }

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
  }

  /**
   * Update nội dung dropdown
   */
  updateDropdownContent() {
    const listContainer = this.dropdown.querySelector('#notificationList');
    
    if (this.notifications.size === 0) {
      listContainer.innerHTML = `
        <div class="notification-empty">
          <div class="notification-empty__icon">🔔</div>
          <p>Chưa có thông báo nào</p>
        </div>
      `;
      return;
    }

    // Sort notifications by timestamp (newest first)
    const sortedNotifications = Array.from(this.notifications.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    listContainer.innerHTML = sortedNotifications
      .map(([id, notification]) => this.createNotificationHTML(id, notification))
      .join('');
  }

  /**
   * Tạo HTML cho một notification item
   */
  createNotificationHTML(id, notification) {
    const timeAgo = this.getTimeAgo(notification.timestamp);
    const typeIcon = this.getTypeIcon(notification.type);
    
    return `
      <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" data-id="${id}">
        <div class="notification-item__icon ${notification.type}">
          ${typeIcon}
        </div>
        <div class="notification-item__content">
          <div class="notification-item__header">
            <h4 class="notification-item__title">${notification.title}</h4>
            ${this.options.showTimestamp ? `<span class="notification-item__time">${timeAgo}</span>` : ''}
          </div>
          ${notification.message ? `<p class="notification-item__message">${notification.message}</p>` : ''}
          ${notification.actionUrl ? `
            <div class="notification-item__actions">
              <a href="${notification.actionUrl}" class="notification-action-link">
                ${notification.actionText || 'Xem chi tiết'}
              </a>
            </div>
          ` : ''}
        </div>
        <div class="notification-item__controls">
          ${!notification.isRead ? `
            <button class="notification-control-btn" data-action="mark-read" data-id="${id}" title="Đánh dấu đã đọc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </button>
          ` : ''}
          <button class="notification-control-btn" data-action="remove" data-id="${id}" title="Xóa thông báo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get icon cho notification type
   */
  getTypeIcon(type) {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      system: '⚙️',
      update: '🔄',
      movie: '🎬'
    };
    return icons[type] || icons.info;
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return new Date(timestamp).toLocaleDateString('vi-VN');
  }

  /**
   * Handle các actions
   */
  handleAction(action) {
    switch (action) {
      case 'mark-all-read':
        this.markAllAsRead();
        break;
      case 'clear-all':
        this.clearAll();
        break;
    }
  }

  /**
   * Handle click notification item
   */
  handleNotificationClick(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Mark as read nếu auto mark enabled
    if (this.options.autoMarkAsRead && !notification.isRead) {
      this.markAsRead(id);
    }

    // Navigate to action URL nếu có
    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl;
      this.close();
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(id) {
    const notification = this.notifications.get(id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.updateBadge();
      this.updateDropdownContent();
      this.saveNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach((notification) => {
      if (!notification.isRead) {
        notification.isRead = true;
      }
    });
    this.unreadCount = 0;
    this.updateBadge();
    this.updateDropdownContent();
    this.saveNotifications();
    
    notificationManager.success('Đã đánh dấu tất cả thông báo là đã đọc', { duration: 2000 });
  }

  /**
   * Remove notification
   */
  removeNotification(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      if (!notification.isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifications.delete(id);
      this.updateBadge();
      this.updateDropdownContent();
      this.saveNotifications();
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    if (this.notifications.size === 0) return;
    
    if (confirm('Bạn có chắc muốn xóa tất cả thông báo?')) {
      this.notifications.clear();
      this.unreadCount = 0;
      this.updateBadge();
      this.updateDropdownContent();
      this.saveNotifications();
      
      notificationManager.success('Đã xóa tất cả thông báo', { duration: 2000 });
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      // Tạo simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Không thể phát âm thanh thông báo:', error);
    }
  }

  /**
   * Get element để append vào DOM
   */
  getElement() {
    return this.element;
  }

  /**
   * Destroy component
   */
  destroy() {
    if (this.element) {
      this.element.remove();
    }
    if (this.dropdown) {
      this.dropdown.remove();
    }
    
    // Remove event listeners
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('resize', this.handleWindowResize);
    
    console.log('🔔 Notification Button destroyed');
  }
}

// Export singleton instance
export const notificationButton = new NotificationButton();
