// 🔔 Frontend Notification UI Component
// Notification toggle button, dropdown/modal và badge counter

// Simple logger fallback
const Logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  debug: (msg) => console.log(`[DEBUG] ${msg}`)
};

/**
 * Frontend Notification UI Component
 * Hiển thị notification button với badge counter và dropdown
 */
class NotificationUI {
  constructor() {
    this.isOpen = false;
    this.notifications = [];
    this.unreadCount = 0;
    this.container = null;
    this.dropdown = null;
    this.updateInterval = null;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.render = this.render.bind(this);
    this.toggle = this.toggle.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.loadNotifications = this.loadNotifications.bind(this);
  }

  /**
   * Khởi tạo notification UI
   */
  async init(containerSelector = '.header__actions') {
    try {
      Logger.info('🔔 Initializing Notification UI...');

      // Tìm container để chèn notification button
      const parentContainer = document.querySelector(containerSelector);
      if (!parentContainer) {
        Logger.warn(`Container ${containerSelector} not found, skipping notification UI init`);
        return false;
      } else {
        this.container = parentContainer;
      }

      // Render notification UI
      this.render();

      // Load initial data
      await this.loadNotifications();
      await this.updateUnreadCount();

      // Bind events
      this.bindEvents();

      // Start auto-update
      this.startAutoUpdate();

      Logger.info('✅ Notification UI ready!');
      return true;
    } catch (error) {
      Logger.error('❌ Notification UI init failed:', error);
      return false;
    }
  }



  /**
   * Render notification UI
   */
  render() {
    if (!this.container) return;

    const notificationHTML = `
      <div class="notification-wrapper" id="notification-wrapper">
        <button class="notification-button" id="notification-button" title="Thông báo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
        </button>
        
        <div class="notification-dropdown" id="notification-dropdown">
          <div class="notification-header">
            <h3>🔔 Thông báo</h3>
            <button class="notification-close" id="notification-close">✕</button>
          </div>
          
          <div class="notification-actions">
            <button class="btn-mark-all-read" id="btn-mark-all-read">
              ✅ Đánh dấu tất cả đã đọc
            </button>
          </div>
          
          <div class="notification-list" id="notification-list">
            <div class="notification-loading">Đang tải thông báo...</div>
          </div>
          
          <div class="notification-footer">
            <small>Cập nhật mỗi 30 giây</small>
          </div>
        </div>
      </div>
    `;

    // Thêm CSS styles
    this.addStyles();
    
    // Insert HTML
    this.container.insertAdjacentHTML('beforeend', notificationHTML);
  }

  /**
   * Thêm CSS styles cho notification UI
   */
  addStyles() {
    if (document.getElementById('notification-ui-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-ui-styles';
    styles.textContent = `
      .notification-wrapper {
        position: relative;
        display: inline-block;
      }
      
      .notification-button {
        position: relative;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 8px;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .notification-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #e74c3c;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: bold;
        min-width: 18px;
        text-align: center;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .notification-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 350px;
        max-height: 500px;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 1000;
        display: none;
        overflow: hidden;
      }
      
      .notification-dropdown.open {
        display: block;
        animation: slideDown 0.3s ease;
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #333;
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      }
      
      .notification-header h3 {
        margin: 0;
        color: white;
        font-size: 16px;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .notification-close:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .notification-actions {
        padding: 10px 20px;
        border-bottom: 1px solid #333;
      }
      
      .btn-mark-all-read {
        background: #27ae60;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .btn-mark-all-read:hover {
        background: #2ecc71;
      }
      
      .notification-list {
        max-height: 300px;
        overflow-y: auto;
        padding: 10px 0;
      }
      
      .notification-item {
        padding: 12px 20px;
        border-bottom: 1px solid #333;
        cursor: pointer;
        transition: background 0.3s;
        position: relative;
      }
      
      .notification-item:hover {
        background: rgba(255,255,255,0.05);
      }
      
      .notification-item.unread {
        background: rgba(108, 92, 231, 0.1);
        border-left: 3px solid #6c5ce7;
      }
      
      .notification-item.unread::before {
        content: '';
        position: absolute;
        top: 15px;
        right: 20px;
        width: 8px;
        height: 8px;
        background: #6c5ce7;
        border-radius: 50%;
      }
      
      .notification-title {
        font-weight: 600;
        color: #fff;
        margin: 0 0 5px 0;
        font-size: 14px;
        line-height: 1.3;
      }
      
      .notification-content {
        color: #ccc;
        font-size: 13px;
        line-height: 1.4;
        margin: 0 0 8px 0;
      }
      
      .notification-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #888;
      }
      
      .notification-type {
        background: rgba(108, 92, 231, 0.2);
        color: #a29bfe;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
      }
      
      .notification-loading,
      .notification-empty {
        text-align: center;
        padding: 40px 20px;
        color: #888;
      }
      
      .notification-footer {
        padding: 10px 20px;
        border-top: 1px solid #333;
        text-align: center;
        color: #666;
      }
      
      @media (max-width: 768px) {
        .notification-dropdown {
          width: 300px;
          right: -50px;
        }
      }
      
      @media (max-width: 480px) {
        .notification-dropdown {
          width: 280px;
          right: -100px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Bind events
   */
  bindEvents() {
    const button = document.getElementById('notification-button');
    const closeBtn = document.getElementById('notification-close');
    const markAllBtn = document.getElementById('btn-mark-all-read');
    
    if (button) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => this.markAllAsRead());
    }
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('notification-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        this.close();
      }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
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
   * Open dropdown
   */
  async open() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    
    this.isOpen = true;
    dropdown.classList.add('open');
    
    // Load fresh notifications
    await this.loadNotifications();
  }

  /**
   * Close dropdown
   */
  close() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    
    this.isOpen = false;
    dropdown.classList.remove('open');
  }

  /**
   * Load notifications
   */
  async loadNotifications() {
    try {
      if (!window.movieComments || !window.movieComments.initialized) {
        Logger.warn('Firebase not ready, skipping notification load');
        return;
      }

      this.notifications = await window.movieComments.getNotifications({
        status: 'active',
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });

      this.renderNotificationList();
    } catch (error) {
      Logger.error('Load notifications failed:', error);
      this.renderError();
    }
  }

  /**
   * Render notification list
   */
  renderNotificationList() {
    const container = document.getElementById('notification-list');
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = '<div class="notification-empty">Không có thông báo mới</div>';
      return;
    }

    const currentUserId = this.getCurrentUserId();
    
    container.innerHTML = this.notifications.map(notification => {
      const isRead = notification.readBy && notification.readBy.includes(currentUserId);
      const createdAt = notification.createdAt ? 
        this.formatTime(notification.createdAt) : 'N/A';
      
      const typeLabels = {
        'admin_announcement': '📢 Admin',
        'new_movie': '🎬 Phim mới',
        'system': '⚙️ Hệ thống',
        'update': '🔄 Cập nhật'
      };

      return `
        <div class="notification-item ${!isRead ? 'unread' : ''}" 
             data-id="${notification.id}" 
             onclick="notificationUI.markAsRead('${notification.id}')">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-content">${notification.content}</div>
          <div class="notification-meta">
            <span class="notification-type">${typeLabels[notification.type] || notification.type}</span>
            <span>${createdAt}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render error state
   */
  renderError() {
    const container = document.getElementById('notification-list');
    if (container) {
      container.innerHTML = '<div class="notification-empty">Lỗi tải thông báo</div>';
    }
  }

  /**
   * Update unread count
   */
  async updateUnreadCount() {
    try {
      if (!window.movieComments || !window.movieComments.initialized) return;

      this.unreadCount = await window.movieComments.getUnreadNotificationCount();
      
      const badge = document.getElementById('notification-badge');
      if (badge) {
        if (this.unreadCount > 0) {
          badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (error) {
      Logger.error('Update unread count failed:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await window.movieComments.markNotificationAsRead(notificationId);
      
      // Update UI
      const item = document.querySelector(`[data-id="${notificationId}"]`);
      if (item) {
        item.classList.remove('unread');
      }
      
      // Update count
      await this.updateUnreadCount();
    } catch (error) {
      Logger.error('Mark as read failed:', error);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead() {
    try {
      const unreadNotifications = this.notifications.filter(n => {
        const currentUserId = this.getCurrentUserId();
        return !n.readBy || !n.readBy.includes(currentUserId);
      });

      for (const notification of unreadNotifications) {
        await window.movieComments.markNotificationAsRead(notification.id);
      }

      // Reload notifications
      await this.loadNotifications();
      await this.updateUnreadCount();
    } catch (error) {
      Logger.error('Mark all as read failed:', error);
    }
  }

  /**
   * Start auto-update
   */
  startAutoUpdate() {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateUnreadCount();
      
      // If dropdown is open, refresh notifications
      if (this.isOpen) {
        await this.loadNotifications();
      }
    }, 30000);
  }

  /**
   * Stop auto-update
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Utility methods
   */
  getCurrentUserId() {
    if (window.movieComments && window.movieComments.getUserId) {
      return window.movieComments.getUserId();
    }
    
    let userId = localStorage.getItem('anonymous_user_id');
    if (!userId) {
      userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymous_user_id', userId);
    }
    return userId;
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAutoUpdate();
    
    const wrapper = document.getElementById('notification-wrapper');
    if (wrapper) {
      wrapper.remove();
    }
    
    const styles = document.getElementById('notification-ui-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// Global instance
export const notificationUI = new NotificationUI();

// Auto-init when module loads
if (typeof window !== 'undefined') {
  window.notificationUI = notificationUI;
  
  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      notificationUI.init();
    });
  } else {
    notificationUI.init();
  }
}

export default notificationUI;
