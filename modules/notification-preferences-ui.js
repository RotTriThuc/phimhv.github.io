/**
 * 🎛️ Notification Preferences UI
 * Giao diện quản lý preferences thông báo
 * 
 * Features:
 * - Modal/popup để cấu hình preferences
 * - Toggle switches cho các loại thông báo
 * - Multi-select cho thể loại và quốc gia
 * - Real-time save
 */

import { FirebaseLogger } from '../firebase-config.js';

export class NotificationPreferencesUI {
  constructor() {
    this.isOpen = false;
    this.modal = null;
    this.preferences = null;
  }

  /**
   * Khởi tạo UI
   */
  async init() {
    try {
      // Đảm bảo preferences manager đã sẵn sàng
      if (!window.NotificationPreferencesManager) {
        FirebaseLogger.warn('NotificationPreferencesManager not found');
        return false;
      }

      await window.NotificationPreferencesManager.init();
      this.preferences = window.NotificationPreferencesManager;

      // Thêm CSS styles
      this.addStyles();

      // Thêm button vào notification UI
      this.addPreferencesButton();

      FirebaseLogger.info('🎛️ Notification Preferences UI initialized');
      return true;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize Preferences UI:', error);
      return false;
    }
  }

  /**
   * Thêm CSS styles
   */
  addStyles() {
    if (document.getElementById('notification-preferences-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-preferences-styles';
    styles.textContent = `
      .preferences-button {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 4px 8px;
        color: #ccc;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.3s ease;
        margin-left: 8px;
      }
      
      .preferences-button:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      
      .preferences-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
      }
      
      .preferences-modal.open {
        display: flex;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .preferences-content {
        background: #1e1e1e;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .preferences-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #333;
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        border-radius: 12px 12px 0 0;
      }
      
      .preferences-header h2 {
        margin: 0;
        color: white;
        font-size: 18px;
      }
      
      .preferences-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }
      
      .preferences-close:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .preferences-body {
        padding: 20px;
      }
      
      .preference-section {
        margin-bottom: 25px;
      }
      
      .preference-section h3 {
        color: #fff;
        font-size: 16px;
        margin: 0 0 15px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .preference-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #333;
      }
      
      .preference-toggle:last-child {
        border-bottom: none;
      }
      
      .toggle-label {
        color: #ccc;
        font-size: 14px;
      }
      
      .toggle-switch {
        position: relative;
        width: 50px;
        height: 24px;
        background: #333;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .toggle-switch.active {
        background: #6c5ce7;
      }
      
      .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }
      
      .toggle-switch.active .toggle-slider {
        transform: translateX(26px);
      }
      
      .preference-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      
      .preference-item {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 13px;
        color: #ccc;
        text-align: center;
      }
      
      .preference-item:hover {
        background: #333;
        border-color: #6c5ce7;
      }
      
      .preference-item.selected {
        background: rgba(108, 92, 231, 0.2);
        border-color: #6c5ce7;
        color: #a29bfe;
      }
      
      .preferences-footer {
        padding: 20px;
        border-top: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .btn-reset {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.3s;
      }
      
      .btn-reset:hover {
        background: #c0392b;
      }
      
      .preferences-stats {
        color: #888;
        font-size: 12px;
      }
      
      @media (max-width: 768px) {
        .preferences-content {
          width: 95%;
          margin: 10px;
        }
        
        .preference-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Thêm button preferences vào notification UI
   */
  addPreferencesButton() {
    // Tìm notification actions trong dropdown
    const actionsContainer = document.querySelector('.notification-actions');
    if (!actionsContainer) return;

    const button = document.createElement('button');
    button.className = 'preferences-button';
    button.innerHTML = '⚙️ Cài đặt';
    button.onclick = () => this.open();

    actionsContainer.appendChild(button);
  }

  /**
   * Mở modal preferences
   */
  async open() {
    if (this.isOpen) return;

    this.isOpen = true;
    await this.render();
    
    // Bind events
    this.bindEvents();
  }

  /**
   * Đóng modal
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    if (this.modal) {
      this.modal.classList.remove('open');
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
      }, 300);
    }
  }

  /**
   * Render modal
   */
  async render() {
    if (this.modal) {
      this.modal.parentNode.removeChild(this.modal);
    }

    const currentPrefs = this.preferences.getPreferences();
    const stats = this.preferences.getStats();

    this.modal = document.createElement('div');
    this.modal.className = 'preferences-modal';
    this.modal.innerHTML = `
      <div class="preferences-content">
        <div class="preferences-header">
          <h2>🔔 Cài đặt thông báo</h2>
          <button class="preferences-close" onclick="window.notificationPreferencesUI.close()">✕</button>
        </div>
        
        <div class="preferences-body">
          ${this.renderGeneralSettings(currentPrefs)}
          ${this.renderCategorySettings(currentPrefs)}
          ${this.renderCountrySettings(currentPrefs)}
          ${this.renderLanguageSettings(currentPrefs)}
        </div>
        
        <div class="preferences-footer">
          <button class="btn-reset" onclick="window.notificationPreferencesUI.resetPreferences()">
            🔄 Đặt lại mặc định
          </button>
          <div class="preferences-stats">
            ${stats.categoriesCount} thể loại • ${stats.countriesCount} quốc gia
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    
    // Trigger animation
    setTimeout(() => {
      this.modal.classList.add('open');
    }, 10);
  }

  /**
   * Render general settings
   */
  renderGeneralSettings(prefs) {
    return `
      <div class="preference-section">
        <h3>📢 Loại thông báo</h3>
        
        <div class="preference-toggle">
          <span class="toggle-label">Thông báo phim mới</span>
          <div class="toggle-switch ${prefs.enableNewMovies ? 'active' : ''}" 
               onclick="window.notificationPreferencesUI.toggleGeneral('enableNewMovies')">
            <div class="toggle-slider"></div>
          </div>
        </div>
        
        <div class="preference-toggle">
          <span class="toggle-label">Thông báo tập mới</span>
          <div class="toggle-switch ${prefs.enableNewEpisodes ? 'active' : ''}" 
               onclick="window.notificationPreferencesUI.toggleGeneral('enableNewEpisodes')">
            <div class="toggle-slider"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render category settings
   */
  renderCategorySettings(prefs) {
    const categories = this.preferences.getPopularCategories();
    
    return `
      <div class="preference-section">
        <h3>🎭 Thể loại quan tâm</h3>
        <div class="preference-grid">
          ${categories.map(category => `
            <div class="preference-item ${prefs.categories.includes(category) ? 'selected' : ''}"
                 onclick="window.notificationPreferencesUI.toggleCategory('${category}')">
              ${category}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render country settings
   */
  renderCountrySettings(prefs) {
    const countries = this.preferences.getPopularCountries();
    
    return `
      <div class="preference-section">
        <h3>🌍 Quốc gia quan tâm</h3>
        <div class="preference-grid">
          ${countries.map(country => `
            <div class="preference-item ${prefs.countries.includes(country) ? 'selected' : ''}"
                 onclick="window.notificationPreferencesUI.toggleCountry('${country}')">
              ${country}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render language settings
   */
  renderLanguageSettings(prefs) {
    const languages = ['Vietsub', 'Thuyết minh', 'Lồng tiếng', 'Raw'];
    
    return `
      <div class="preference-section">
        <h3>🗣️ Ngôn ngữ quan tâm</h3>
        <div class="preference-grid">
          ${languages.map(lang => `
            <div class="preference-item ${prefs.languages.includes(lang) ? 'selected' : ''}"
                 onclick="window.notificationPreferencesUI.toggleLanguage('${lang}')">
              ${lang}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Bind events
   */
  bindEvents() {
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  /**
   * Toggle general preference
   */
  async toggleGeneral(key) {
    const currentPrefs = this.preferences.getPreferences();
    const newValue = !currentPrefs[key];
    
    await this.preferences.updateGeneralPreference(key, newValue);
    
    // Update UI
    const toggle = document.querySelector(`[onclick*="${key}"]`);
    if (toggle) {
      toggle.classList.toggle('active', newValue);
    }
  }

  /**
   * Toggle category
   */
  async toggleCategory(category) {
    const currentPrefs = this.preferences.getPreferences();
    const isSelected = currentPrefs.categories.includes(category);
    
    await this.preferences.updateCategoryPreference(category, !isSelected);
    
    // Update UI
    const item = document.querySelector(`[onclick*="toggleCategory('${category}')"]`);
    if (item) {
      item.classList.toggle('selected', !isSelected);
    }
  }

  /**
   * Toggle country
   */
  async toggleCountry(country) {
    const currentPrefs = this.preferences.getPreferences();
    const isSelected = currentPrefs.countries.includes(country);
    
    await this.preferences.updateCountryPreference(country, !isSelected);
    
    // Update UI
    const item = document.querySelector(`[onclick*="toggleCountry('${country}')"]`);
    if (item) {
      item.classList.toggle('selected', !isSelected);
    }
  }

  /**
   * Toggle language
   */
  async toggleLanguage(language) {
    const currentPrefs = this.preferences.getPreferences();
    const isSelected = currentPrefs.languages.includes(language);
    
    let newLanguages;
    if (isSelected) {
      newLanguages = currentPrefs.languages.filter(l => l !== language);
    } else {
      newLanguages = [...currentPrefs.languages, language];
    }
    
    await this.preferences.updateGeneralPreference('languages', newLanguages);
    
    // Update UI
    const item = document.querySelector(`[onclick*="toggleLanguage('${language}')"]`);
    if (item) {
      item.classList.toggle('selected', !isSelected);
    }
  }

  /**
   * Reset preferences
   */
  async resetPreferences() {
    if (confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
      await this.preferences.resetToDefault();
      this.close();
      
      // Show success message
      if (window.notificationUI) {
        window.notificationUI.showNotification?.('🔄 Đã đặt lại cài đặt thông báo');
      }
    }
  }
}

// Khởi tạo global instance
window.notificationPreferencesUI = new NotificationPreferencesUI();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.notificationPreferencesUI.init();
  });
} else {
  window.notificationPreferencesUI.init();
}

export default NotificationPreferencesUI;
