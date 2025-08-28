/**
 * ⚙️ Notification Preferences Component
 * Cho phép user control notification behavior để tránh phiền toái
 */

import { errorHandler } from '../utils/error-handler.js';

export class NotificationPreferences {
  constructor(options = {}) {
    this.options = {
      storageKey: 'notification-preferences',
      ...options
    };
    
    // Default preferences - HOÀN TOÀN TẮT popup notifications
    this.defaultPreferences = {
      // Toast notifications (popup ở góc) - HOÀN TOÀN TẮT
      enableToastNotifications: false, // LUÔN TẮT - không bao giờ hiển thị popup
      toastPosition: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
      toastDuration: 3000, // 3 giây
      toastMaxCount: 0, // TẮT hoàn toàn - 0 toast

      // KHÔNG hiển thị toast cho bất kỳ loại nào
      toastForTypes: [], // RỖNG - không toast nào cả
      
      // Badge notifications (trên button)
      enableBadgeNotifications: true, // Luôn bật badge
      
      // Sound notifications
      enableSoundNotifications: false, // Mặc định tắt âm thanh
      
      // Auto-mark as read
      autoMarkAsRead: true,
      
      // Notification grouping
      enableGrouping: true, // Gộp nhiều thông báo thành một
      groupingDelay: 2000, // 2 giây
      
      // Do not disturb mode
      doNotDisturb: false,
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00',
      
      // Specific notification types
      enableSystemNotifications: true,
      enableMovieNotifications: true,
      enableUpdateNotifications: true,
      enableMaintenanceNotifications: true,
      enablePromotionNotifications: false // Mặc định tắt promotion
    };
    
    this.preferences = { ...this.defaultPreferences };
    this.element = null;
    this.isOpen = false;
    
    this.init();
  }

  /**
   * Khởi tạo preferences
   */
  async init() {
    try {
      await this.loadPreferences();
      this.createElement();
      this.bindEvents();
      
      console.log('⚙️ Notification Preferences initialized');
    } catch (error) {
      errorHandler.handle(error, { type: 'notification-preferences-init' }, 'Lỗi khởi tạo notification preferences');
    }
  }

  /**
   * Tạo preferences panel
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'notification-preferences';
    this.element.style.display = 'none';
    
    this.element.innerHTML = `
      <div class="notification-preferences__overlay"></div>
      <div class="notification-preferences__panel">
        <div class="notification-preferences__header">
          <h3>⚙️ Cài đặt Thông báo</h3>
          <button class="notification-preferences__close" aria-label="Đóng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="notification-preferences__content">
          <!-- Toast Notifications Section -->
          <div class="preference-section">
            <h4>🔔 Thông báo Popup (Toast)</h4>
            <p class="preference-description">Thông báo popup xuất hiện ở góc màn hình. Tắt để tránh phiền toái.</p>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enableToastNotifications" ${this.preferences.enableToastNotifications ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Bật thông báo popup</span>
              </label>
            </div>
            
            <div class="preference-item ${!this.preferences.enableToastNotifications ? 'disabled' : ''}">
              <label>Vị trí hiển thị:</label>
              <select id="toastPosition">
                <option value="bottom-right" ${this.preferences.toastPosition === 'bottom-right' ? 'selected' : ''}>Góc dưới phải</option>
                <option value="bottom-left" ${this.preferences.toastPosition === 'bottom-left' ? 'selected' : ''}>Góc dưới trái</option>
                <option value="top-right" ${this.preferences.toastPosition === 'top-right' ? 'selected' : ''}>Góc trên phải</option>
                <option value="top-left" ${this.preferences.toastPosition === 'top-left' ? 'selected' : ''}>Góc trên trái</option>
              </select>
            </div>
            
            <div class="preference-item ${!this.preferences.enableToastNotifications ? 'disabled' : ''}">
              <label>Thời gian hiển thị:</label>
              <select id="toastDuration">
                <option value="2000" ${this.preferences.toastDuration === 2000 ? 'selected' : ''}>2 giây</option>
                <option value="3000" ${this.preferences.toastDuration === 3000 ? 'selected' : ''}>3 giây</option>
                <option value="5000" ${this.preferences.toastDuration === 5000 ? 'selected' : ''}>5 giây</option>
                <option value="0" ${this.preferences.toastDuration === 0 ? 'selected' : ''}>Không tự động ẩn</option>
              </select>
            </div>
            
            <div class="preference-item ${!this.preferences.enableToastNotifications ? 'disabled' : ''}">
              <label>Chỉ hiển thị popup cho:</label>
              <div class="preference-checkboxes">
                <label class="preference-checkbox">
                  <input type="checkbox" value="error" ${this.preferences.toastForTypes.includes('error') ? 'checked' : ''}>
                  <span>Lỗi hệ thống</span>
                </label>
                <label class="preference-checkbox">
                  <input type="checkbox" value="urgent" ${this.preferences.toastForTypes.includes('urgent') ? 'checked' : ''}>
                  <span>Thông báo khẩn cấp</span>
                </label>
                <label class="preference-checkbox">
                  <input type="checkbox" value="update" ${this.preferences.toastForTypes.includes('update') ? 'checked' : ''}>
                  <span>Cập nhật hệ thống</span>
                </label>
                <label class="preference-checkbox">
                  <input type="checkbox" value="movie" ${this.preferences.toastForTypes.includes('movie') ? 'checked' : ''}>
                  <span>Phim mới</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Other Notifications Section -->
          <div class="preference-section">
            <h4>🔕 Các loại Thông báo</h4>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enableSoundNotifications" ${this.preferences.enableSoundNotifications ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Âm thanh thông báo</span>
              </label>
            </div>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enableGrouping" ${this.preferences.enableGrouping ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Gộp thông báo tương tự</span>
              </label>
            </div>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="autoMarkAsRead" ${this.preferences.autoMarkAsRead ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Tự động đánh dấu đã đọc</span>
              </label>
            </div>
          </div>
          
          <!-- Notification Types Section -->
          <div class="preference-section">
            <h4>📋 Loại thông báo nhận</h4>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enableSystemNotifications" ${this.preferences.enableSystemNotifications ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Thông báo hệ thống</span>
              </label>
            </div>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enableMovieNotifications" ${this.preferences.enableMovieNotifications ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Thông báo phim mới</span>
              </label>
            </div>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enableUpdateNotifications" ${this.preferences.enableUpdateNotifications ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Thông báo cập nhật</span>
              </label>
            </div>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="enablePromotionNotifications" ${this.preferences.enablePromotionNotifications ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Thông báo khuyến mãi</span>
              </label>
            </div>
          </div>
          
          <!-- Do Not Disturb Section -->
          <div class="preference-section">
            <h4>🌙 Chế độ Không làm phiền</h4>
            
            <div class="preference-item">
              <label class="preference-toggle">
                <input type="checkbox" id="doNotDisturb" ${this.preferences.doNotDisturb ? 'checked' : ''}>
                <span class="preference-toggle__slider"></span>
                <span class="preference-toggle__label">Bật chế độ không làm phiền</span>
              </label>
            </div>
            
            <div class="preference-item ${!this.preferences.doNotDisturb ? 'disabled' : ''}">
              <label>Từ:</label>
              <input type="time" id="doNotDisturbStart" value="${this.preferences.doNotDisturbStart}">
              <label>Đến:</label>
              <input type="time" id="doNotDisturbEnd" value="${this.preferences.doNotDisturbEnd}">
            </div>
          </div>
        </div>
        
        <div class="notification-preferences__footer">
          <button class="preference-btn preference-btn--secondary" id="resetPreferences">
            Khôi phục mặc định
          </button>
          <button class="preference-btn preference-btn--primary" id="savePreferences">
            Lưu cài đặt
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Close button
    this.element.querySelector('.notification-preferences__close').addEventListener('click', () => {
      this.hide();
    });

    // Overlay click to close
    this.element.querySelector('.notification-preferences__overlay').addEventListener('click', () => {
      this.hide();
    });

    // Toast notifications toggle
    const toastToggle = this.element.querySelector('#enableToastNotifications');
    toastToggle.addEventListener('change', () => {
      this.updateToastDependentItems();
    });

    // Do not disturb toggle
    const dndToggle = this.element.querySelector('#doNotDisturb');
    dndToggle.addEventListener('change', () => {
      this.updateDndDependentItems();
    });

    // Save button
    this.element.querySelector('#savePreferences').addEventListener('click', () => {
      this.savePreferences();
    });

    // Reset button
    this.element.querySelector('#resetPreferences').addEventListener('click', () => {
      this.resetPreferences();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });
  }

  /**
   * Update toast dependent items
   */
  updateToastDependentItems() {
    const isEnabled = this.element.querySelector('#enableToastNotifications').checked;
    const dependentItems = this.element.querySelectorAll('.preference-item.disabled');
    
    dependentItems.forEach(item => {
      if (item.querySelector('#toastPosition, #toastDuration, .preference-checkboxes')) {
        item.classList.toggle('disabled', !isEnabled);
      }
    });
  }

  /**
   * Update do not disturb dependent items
   */
  updateDndDependentItems() {
    const isEnabled = this.element.querySelector('#doNotDisturb').checked;
    const timeInputs = this.element.querySelector('#doNotDisturbStart').parentElement;
    timeInputs.classList.toggle('disabled', !isEnabled);
  }

  /**
   * Show preferences panel
   */
  show() {
    this.isOpen = true;
    this.element.style.display = 'block';
    
    // Focus first input
    setTimeout(() => {
      const firstInput = this.element.querySelector('input, select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Hide preferences panel
   */
  hide() {
    this.isOpen = false;
    this.element.style.display = 'none';
  }

  /**
   * Save preferences
   */
  async savePreferences() {
    try {
      // Collect all preferences
      const newPreferences = {
        enableToastNotifications: this.element.querySelector('#enableToastNotifications').checked,
        toastPosition: this.element.querySelector('#toastPosition').value,
        toastDuration: parseInt(this.element.querySelector('#toastDuration').value),
        enableSoundNotifications: this.element.querySelector('#enableSoundNotifications').checked,
        enableGrouping: this.element.querySelector('#enableGrouping').checked,
        autoMarkAsRead: this.element.querySelector('#autoMarkAsRead').checked,
        enableSystemNotifications: this.element.querySelector('#enableSystemNotifications').checked,
        enableMovieNotifications: this.element.querySelector('#enableMovieNotifications').checked,
        enableUpdateNotifications: this.element.querySelector('#enableUpdateNotifications').checked,
        enablePromotionNotifications: this.element.querySelector('#enablePromotionNotifications').checked,
        doNotDisturb: this.element.querySelector('#doNotDisturb').checked,
        doNotDisturbStart: this.element.querySelector('#doNotDisturbStart').value,
        doNotDisturbEnd: this.element.querySelector('#doNotDisturbEnd').value,
        
        // Collect toast types
        toastForTypes: Array.from(this.element.querySelectorAll('.preference-checkboxes input:checked'))
          .map(input => input.value)
      };

      this.preferences = { ...this.preferences, ...newPreferences };
      
      // Save to localStorage
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.preferences));
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('notification-preferences-changed', {
        detail: this.preferences
      }));
      
      this.hide();
      
      // Show success message (subtle)
      this.showSuccessMessage('Đã lưu cài đặt thông báo');
      
    } catch (error) {
      errorHandler.handle(error, { type: 'save-preferences' }, 'Lỗi lưu cài đặt');
    }
  }

  /**
   * Reset preferences to default
   */
  resetPreferences() {
    if (confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
      this.preferences = { ...this.defaultPreferences };
      this.updateUI();
      this.savePreferences();
    }
  }

  /**
   * Update UI with current preferences
   */
  updateUI() {
    this.element.querySelector('#enableToastNotifications').checked = this.preferences.enableToastNotifications;
    this.element.querySelector('#toastPosition').value = this.preferences.toastPosition;
    this.element.querySelector('#toastDuration').value = this.preferences.toastDuration;
    this.element.querySelector('#enableSoundNotifications').checked = this.preferences.enableSoundNotifications;
    this.element.querySelector('#enableGrouping').checked = this.preferences.enableGrouping;
    this.element.querySelector('#autoMarkAsRead').checked = this.preferences.autoMarkAsRead;
    this.element.querySelector('#enableSystemNotifications').checked = this.preferences.enableSystemNotifications;
    this.element.querySelector('#enableMovieNotifications').checked = this.preferences.enableMovieNotifications;
    this.element.querySelector('#enableUpdateNotifications').checked = this.preferences.enableUpdateNotifications;
    this.element.querySelector('#enablePromotionNotifications').checked = this.preferences.enablePromotionNotifications;
    this.element.querySelector('#doNotDisturb').checked = this.preferences.doNotDisturb;
    this.element.querySelector('#doNotDisturbStart').value = this.preferences.doNotDisturbStart;
    this.element.querySelector('#doNotDisturbEnd').value = this.preferences.doNotDisturbEnd;
    
    // Update toast types checkboxes
    this.preferences.toastForTypes.forEach(type => {
      const checkbox = this.element.querySelector(`.preference-checkboxes input[value="${type}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
    
    this.updateToastDependentItems();
    this.updateDndDependentItems();
  }

  /**
   * Load preferences from storage
   */
  async loadPreferences() {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...this.defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
      this.preferences = { ...this.defaultPreferences };
    }
  }

  /**
   * Get current preferences
   */
  getPreferences() {
    return { ...this.preferences };
  }

  /**
   * Check if notification should be shown based on preferences
   */
  shouldShowNotification(notification) {
    // Check do not disturb
    if (this.preferences.doNotDisturb && this.isInDoNotDisturbTime()) {
      return false;
    }
    
    // Check notification type preferences
    switch (notification.type) {
      case 'system':
        return this.preferences.enableSystemNotifications;
      case 'movie':
        return this.preferences.enableMovieNotifications;
      case 'update':
        return this.preferences.enableUpdateNotifications;
      case 'promotion':
        return this.preferences.enablePromotionNotifications;
      default:
        return true;
    }
  }

  /**
   * Check if toast should be shown
   */
  shouldShowToast(notification) {
    if (!this.preferences.enableToastNotifications) {
      return false;
    }
    
    return this.preferences.toastForTypes.includes(notification.type) ||
           this.preferences.toastForTypes.includes(notification.priority);
  }

  /**
   * Check if in do not disturb time
   */
  isInDoNotDisturbTime() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.doNotDisturbStart.split(':').map(Number);
    const [endHour, endMin] = this.preferences.doNotDisturbEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Show subtle success message
   */
  showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'preference-success-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      animation: slideUpFade 3s ease forwards;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Get element
   */
  getElement() {
    return this.element;
  }

  /**
   * Destroy preferences
   */
  destroy() {
    if (this.element) {
      this.element.remove();
    }
    console.log('⚙️ Notification Preferences destroyed');
  }
}

// Export singleton instance
export const notificationPreferences = new NotificationPreferences();
