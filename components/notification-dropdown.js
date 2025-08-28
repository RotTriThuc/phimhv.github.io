/**
 * 📋 Notification Dropdown Component
 * Dropdown/Modal hiển thị danh sách thông báo với filtering và actions
 */

import { notificationDataManager } from '../utils/notification-data-manager.js';
import { errorHandler } from '../utils/error-handler.js';

export class NotificationDropdown {
  constructor(options = {}) {
    this.options = {
      maxHeight: 500,
      itemsPerPage: 20,
      enableFiltering: true,
      enableSearch: true,
      enableActions: true,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      position: 'bottom-right',
      ...options
    };
    
    this.isVisible = false;
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.currentPage = 1;
    this.notifications = [];
    this.filteredNotifications = [];
    this.element = null;
    this.refreshTimer = null;
    
    this.init();
  }

  /**
   * Khởi tạo dropdown
   */
  init() {
    try {
      this.createElement();
      this.bindEvents();
      this.loadNotifications();
      
      if (this.options.autoRefresh) {
        this.startAutoRefresh();
      }
      
      console.log('📋 Notification Dropdown initialized');
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-dropdown-init' }, 'Lỗi khởi tạo notification dropdown');
    }
  }

  /**
   * Tạo HTML element
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'notification-dropdown';
    this.element.style.display = 'none';
    
    this.element.innerHTML = `
      <div class="notification-dropdown__container">
        <!-- Header -->
        <div class="notification-dropdown__header">
          <div class="notification-dropdown__title">
            <h3>Thông báo</h3>
            <span class="notification-count" id="notificationCount">0</span>
          </div>
          <div class="notification-dropdown__header-actions">
            <button class="notification-header-btn" data-action="settings" title="Cài đặt thông báo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="m12,1l2.09,2.09l2.91,0l0,2.91l2.09,2.09l0,2.82l-2.09,2.09l0,2.91l-2.91,0l-2.09,2.09l-2.82,0l-2.09,-2.09l-2.91,0l0,-2.91l-2.09,-2.09l0,-2.82l2.09,-2.09l0,-2.91l2.91,0l2.09,-2.09l2.82,0z"></path>
              </svg>
            </button>
            <button class="notification-header-btn" data-action="refresh" title="Làm mới">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23,4 23,10 17,10"></polyline>
                <polyline points="1,20 1,14 7,14"></polyline>
                <path d="m20.49,9a9,9 0 1,1 -2.12,-5.36l2.63,2.36"></path>
                <path d="m3.51,15a9,9 0 1,0 2.12,5.36l-2.63,-2.36"></path>
              </svg>
            </button>
            <button class="notification-header-btn" data-action="mark-all-read" title="Đánh dấu tất cả đã đọc">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </button>
            <button class="notification-header-btn" data-action="clear-all" title="Xóa tất cả">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </button>
            <button class="notification-header-btn" data-action="close" title="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Filters & Search -->
        ${this.options.enableFiltering || this.options.enableSearch ? `
        <div class="notification-dropdown__filters">
          ${this.options.enableSearch ? `
          <div class="notification-search">
            <input type="text" id="notificationSearch" placeholder="Tìm kiếm thông báo..." class="notification-search__input">
            <svg class="notification-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21,21l-4.35,-4.35"></path>
            </svg>
          </div>
          ` : ''}
          
          ${this.options.enableFiltering ? `
          <div class="notification-filter-tabs">
            <button class="notification-filter-tab active" data-filter="all">Tất cả</button>
            <button class="notification-filter-tab" data-filter="unread">Chưa đọc</button>
            <button class="notification-filter-tab" data-filter="system">Hệ thống</button>
            <button class="notification-filter-tab" data-filter="movie">Phim</button>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Content -->
        <div class="notification-dropdown__content" id="notificationContent">
          <div class="notification-list" id="notificationList">
            <!-- Notifications will be rendered here -->
          </div>
          
          <!-- Loading -->
          <div class="notification-loading" id="notificationLoading" style="display: none;">
            <div class="notification-loading__spinner"></div>
            <span>Đang tải...</span>
          </div>
          
          <!-- Empty state -->
          <div class="notification-empty" id="notificationEmpty" style="display: none;">
            <div class="notification-empty__icon">🔔</div>
            <h4>Chưa có thông báo</h4>
            <p>Bạn sẽ nhận được thông báo về cập nhật hệ thống và nội dung mới tại đây.</p>
          </div>
          
          <!-- Error state -->
          <div class="notification-error" id="notificationError" style="display: none;">
            <div class="notification-error__icon">⚠️</div>
            <h4>Không thể tải thông báo</h4>
            <p>Đã xảy ra lỗi khi tải danh sách thông báo.</p>
            <button class="notification-retry-btn" data-action="retry">Thử lại</button>
          </div>
        </div>

        <!-- Footer -->
        <div class="notification-dropdown__footer">
          <div class="notification-pagination" id="notificationPagination" style="display: none;">
            <button class="notification-page-btn" data-action="prev-page" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            <span class="notification-page-info" id="pageInfo">1 / 1</span>
            <button class="notification-page-btn" data-action="next-page" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>
          
          <div class="notification-stats" id="notificationStats">
            <span class="notification-stat">
              <span class="notification-stat__value" id="totalCount">0</span>
              <span class="notification-stat__label">tổng</span>
            </span>
            <span class="notification-stat">
              <span class="notification-stat__value" id="unreadCount">0</span>
              <span class="notification-stat__label">chưa đọc</span>
            </span>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.element);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Header actions
    this.element.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        this.handleAction(action, e);
      }
    });

    // Filter tabs
    if (this.options.enableFiltering) {
      this.element.addEventListener('click', (e) => {
        const filterTab = e.target.closest('.notification-filter-tab');
        if (filterTab) {
          const filter = filterTab.getAttribute('data-filter');
          this.setFilter(filter);
        }
      });
    }

    // Search input
    if (this.options.enableSearch) {
      const searchInput = this.element.querySelector('#notificationSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.setSearchQuery(e.target.value);
        });
        
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            this.setSearchQuery('');
            searchInput.blur();
          }
        });
      }
    }

    // Notification item clicks
    this.element.addEventListener('click', (e) => {
      const notificationItem = e.target.closest('.notification-item');
      if (notificationItem && !e.target.closest('.notification-item__controls')) {
        const id = notificationItem.getAttribute('data-id');
        this.handleNotificationClick(id);
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.element.contains(e.target)) {
        this.hide();
      }
    });

    // Keyboard navigation
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    // Data manager subscription
    notificationDataManager.subscribe((event, data) => {
      this.handleDataChange(event, data);
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.isVisible) {
        this.updatePosition();
      }
    });
  }

  /**
   * Load notifications
   */
  async loadNotifications() {
    try {
      this.showLoading(true);
      
      // Get notifications from data manager
      this.notifications = notificationDataManager.getAllNotifications();
      
      this.applyFilters();
      this.renderNotifications();
      this.updateStats();
      
      this.showLoading(false);
      
    } catch (error) {
      this.showError(true);
      this.showLoading(false);
      errorHandler.handle(error, { type: 'notification-dropdown-load' }, 'Lỗi tải danh sách thông báo');
    }
  }

  /**
   * Apply filters and search
   */
  applyFilters() {
    let filtered = [...this.notifications];
    
    // Apply filter
    if (this.currentFilter !== 'all') {
      switch (this.currentFilter) {
        case 'unread':
          filtered = filtered.filter(n => !n.isRead);
          break;
        case 'system':
          filtered = filtered.filter(n => n.type === 'system' || n.category === 'system');
          break;
        case 'movie':
          filtered = filtered.filter(n => n.type === 'movie' || n.category === 'movie');
          break;
      }
    }
    
    // Apply search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    this.filteredNotifications = filtered;
    this.currentPage = 1; // Reset to first page
  }

  /**
   * Render notifications
   */
  renderNotifications() {
    const listContainer = this.element.querySelector('#notificationList');
    const emptyContainer = this.element.querySelector('#notificationEmpty');
    
    if (this.filteredNotifications.length === 0) {
      listContainer.style.display = 'none';
      emptyContainer.style.display = 'block';
      this.updatePagination();
      return;
    }
    
    listContainer.style.display = 'block';
    emptyContainer.style.display = 'none';
    
    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
    const endIndex = startIndex + this.options.itemsPerPage;
    const pageNotifications = this.filteredNotifications.slice(startIndex, endIndex);
    
    // Render notifications
    listContainer.innerHTML = pageNotifications
      .map(notification => this.createNotificationHTML(notification))
      .join('');
    
    this.updatePagination();
  }

  /**
   * Create HTML for notification item
   */
  createNotificationHTML(notification) {
    const timeAgo = this.getTimeAgo(notification.timestamp);
    const typeIcon = this.getTypeIcon(notification.type);
    
    return `
      <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" data-id="${notification.id}">
        <div class="notification-item__icon ${notification.type}">
          ${typeIcon}
        </div>
        <div class="notification-item__content">
          <div class="notification-item__header">
            <h4 class="notification-item__title">${this.escapeHtml(notification.title)}</h4>
            <span class="notification-item__time">${timeAgo}</span>
          </div>
          ${notification.message ? `<p class="notification-item__message">${this.escapeHtml(notification.message)}</p>` : ''}
          ${notification.actionUrl ? `
            <div class="notification-item__actions">
              <a href="${notification.actionUrl}" class="notification-action-link">
                ${this.escapeHtml(notification.actionText || 'Xem chi tiết')}
              </a>
            </div>
          ` : ''}
        </div>
        <div class="notification-item__controls">
          ${!notification.isRead ? `
            <button class="notification-control-btn" data-action="mark-read" data-id="${notification.id}" title="Đánh dấu đã đọc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </button>
          ` : ''}
          <button class="notification-control-btn" data-action="remove" data-id="${notification.id}" title="Xóa thông báo">
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
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update stats
   */
  updateStats() {
    const totalCount = this.notifications.length;
    const unreadCount = this.notifications.filter(n => !n.isRead).length;
    
    const totalCountEl = this.element.querySelector('#totalCount');
    const unreadCountEl = this.element.querySelector('#unreadCount');
    const notificationCountEl = this.element.querySelector('#notificationCount');
    
    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (unreadCountEl) unreadCountEl.textContent = unreadCount;
    if (notificationCountEl) notificationCountEl.textContent = this.filteredNotifications.length;
  }

  /**
   * Update pagination
   */
  updatePagination() {
    const paginationEl = this.element.querySelector('#notificationPagination');
    const pageInfoEl = this.element.querySelector('#pageInfo');
    const prevBtn = this.element.querySelector('[data-action="prev-page"]');
    const nextBtn = this.element.querySelector('[data-action="next-page"]');
    
    const totalPages = Math.ceil(this.filteredNotifications.length / this.options.itemsPerPage);
    
    if (totalPages <= 1) {
      paginationEl.style.display = 'none';
      return;
    }
    
    paginationEl.style.display = 'flex';
    pageInfoEl.textContent = `${this.currentPage} / ${totalPages}`;
    
    prevBtn.disabled = this.currentPage <= 1;
    nextBtn.disabled = this.currentPage >= totalPages;
  }

  /**
   * Handle actions
   */
  async handleAction(action, event) {
    try {
      switch (action) {
        case 'close':
          this.hide();
          break;

        case 'settings':
          // Import and show preferences
          const { notificationPreferences } = await import('./notification-preferences.js');
          notificationPreferences.show();
          break;

        case 'refresh':
          await this.loadNotifications();
          break;

        case 'mark-all-read':
          await notificationDataManager.markAllAsRead();
          break;

        case 'clear-all':
          if (confirm('Bạn có chắc muốn xóa tất cả thông báo?')) {
            await notificationDataManager.deleteAllNotifications();
          }
          break;
          
        case 'mark-read':
          const markReadId = event.target.closest('[data-id]').getAttribute('data-id');
          await notificationDataManager.markAsRead(markReadId);
          break;
          
        case 'remove':
          const removeId = event.target.closest('[data-id]').getAttribute('data-id');
          await notificationDataManager.deleteNotification(removeId);
          break;
          
        case 'prev-page':
          if (this.currentPage > 1) {
            this.currentPage--;
            this.renderNotifications();
          }
          break;
          
        case 'next-page':
          const totalPages = Math.ceil(this.filteredNotifications.length / this.options.itemsPerPage);
          if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderNotifications();
          }
          break;
          
        case 'retry':
          await this.loadNotifications();
          break;
      }
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-dropdown-action', action }, 'Lỗi thực hiện action');
    }
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(id) {
    const notification = notificationDataManager.getNotification(id);
    if (!notification) return;

    // Mark as read if unread
    if (!notification.isRead) {
      notificationDataManager.markAsRead(id);
    }

    // Navigate if has action URL
    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl;
      this.hide();
    }
  }

  /**
   * Handle data changes
   */
  handleDataChange(event, data) {
    switch (event) {
      case 'notification-created':
      case 'notification-updated':
      case 'notification-deleted':
      case 'bulk-mark-read':
      case 'all-notifications-deleted':
        this.loadNotifications();
        break;
    }
  }

  /**
   * Set filter
   */
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active tab
    this.element.querySelectorAll('.notification-filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-filter') === filter);
    });
    
    this.applyFilters();
    this.renderNotifications();
    this.updateStats();
  }

  /**
   * Set search query
   */
  setSearchQuery(query) {
    this.searchQuery = query;
    
    // Update search input
    const searchInput = this.element.querySelector('#notificationSearch');
    if (searchInput && searchInput.value !== query) {
      searchInput.value = query;
    }
    
    this.applyFilters();
    this.renderNotifications();
    this.updateStats();
  }

  /**
   * Show/hide loading
   */
  showLoading(show) {
    const loadingEl = this.element.querySelector('#notificationLoading');
    const contentEl = this.element.querySelector('#notificationList');
    
    if (loadingEl) loadingEl.style.display = show ? 'flex' : 'none';
    if (contentEl) contentEl.style.display = show ? 'none' : 'block';
  }

  /**
   * Show/hide error
   */
  showError(show) {
    const errorEl = this.element.querySelector('#notificationError');
    const contentEl = this.element.querySelector('#notificationList');
    
    if (errorEl) errorEl.style.display = show ? 'block' : 'none';
    if (contentEl) contentEl.style.display = show ? 'none' : 'block';
  }

  /**
   * Show dropdown
   */
  show() {
    this.isVisible = true;
    this.element.style.display = 'block';
    this.updatePosition();
    this.loadNotifications();
    
    // Focus management
    setTimeout(() => {
      const firstFocusable = this.element.querySelector('button, input, [tabindex="0"]');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
  }

  /**
   * Hide dropdown
   */
  hide() {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  /**
   * Toggle dropdown
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update position
   */
  updatePosition() {
    // This will be implemented based on the trigger element
    // For now, center it on screen
    const rect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    this.element.style.position = 'fixed';
    this.element.style.top = '50%';
    this.element.style.left = '50%';
    this.element.style.transform = 'translate(-50%, -50%)';
    this.element.style.zIndex = '1000';
  }

  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      if (this.isVisible) {
        this.loadNotifications();
      }
    }, this.options.refreshInterval);
  }

  /**
   * Stop auto refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get element
   */
  getElement() {
    return this.element;
  }

  /**
   * Destroy dropdown
   */
  destroy() {
    this.stopAutoRefresh();
    
    if (this.element) {
      this.element.remove();
    }
    
    console.log('📋 Notification Dropdown destroyed');
  }
}

// Export singleton instance
export const notificationDropdown = new NotificationDropdown();
