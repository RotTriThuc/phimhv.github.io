/**
 * 🔔 Notification Preferences System
 * Quản lý preferences thông báo của user
 * 
 * Features:
 * - Đăng ký/hủy đăng ký thông báo theo thể loại
 * - Quản lý preferences cho phim mới/tập mới
 * - Lọc thông báo theo sở thích user
 * - Sync với Firebase
 */

import { FirebaseLogger } from '../firebase-config.js';

export class NotificationPreferencesManager {
  constructor() {
    this.preferences = {
      enableNewMovies: true,
      enableNewEpisodes: true,
      categories: [], // Thể loại quan tâm
      countries: [], // Quốc gia quan tâm
      languages: ['Vietsub', 'Thuyết minh'], // Ngôn ngữ quan tâm
      qualities: ['HD', 'FHD', '4K'], // Chất lượng quan tâm
      notificationTypes: {
        newMovie: true,
        newEpisode: true,
        adminAnnouncement: true
      }
    };
    this.isInitialized = false;
    this.userId = null;
  }

  /**
   * Khởi tạo hệ thống preferences
   */
  async init() {
    try {
      // Đảm bảo Firebase đã sẵn sàng
      if (!window.movieComments || !window.movieComments.initialized) {
        await window.movieComments?.init();
      }

      this.userId = await window.movieComments?.getUserId();
      
      // Load preferences từ Firebase hoặc localStorage
      await this.loadPreferences();
      
      this.isInitialized = true;
      FirebaseLogger.info('🔔 Notification Preferences Manager initialized');
      
      return true;
    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize Notification Preferences Manager:', error);
      return false;
    }
  }

  /**
   * Load preferences từ Firebase với fallback localStorage
   */
  async loadPreferences() {
    try {
      // Thử load từ Firebase trước
      const firebasePrefs = await this.loadFromFirebase();
      if (firebasePrefs) {
        this.preferences = { ...this.preferences, ...firebasePrefs };
        FirebaseLogger.debug('📥 Loaded preferences from Firebase');
        return;
      }

      // Fallback: load từ localStorage
      const localPrefs = this.loadFromLocalStorage();
      if (localPrefs) {
        this.preferences = { ...this.preferences, ...localPrefs };
        FirebaseLogger.debug('📥 Loaded preferences from localStorage');
      }

    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to load preferences:', error);
    }
  }

  /**
   * Load preferences từ Firebase
   */
  async loadFromFirebase() {
    try {
      if (!window.movieComments?.db || !this.userId) return null;

      const doc = await window.movieComments.db
        .collection('notificationPreferences')
        .doc(this.userId)
        .get();

      if (doc.exists) {
        return doc.data().preferences;
      }
      return null;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to load from Firebase:', error);
      return null;
    }
  }

  /**
   * Load preferences từ localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('notificationPreferences');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Lưu preferences
   */
  async savePreferences() {
    try {
      // Lưu vào Firebase
      await this.saveToFirebase();
      
      // Backup vào localStorage
      this.saveToLocalStorage();
      
      FirebaseLogger.info('💾 Preferences saved successfully');
      
    } catch (error) {
      FirebaseLogger.error('❌ Failed to save preferences:', error);
    }
  }

  /**
   * Lưu vào Firebase
   */
  async saveToFirebase() {
    try {
      if (!window.movieComments?.db || !this.userId) return;

      const data = {
        userId: this.userId,
        preferences: this.preferences,
        updatedAt: new Date(),
        version: '1.0'
      };

      await window.movieComments.db
        .collection('notificationPreferences')
        .doc(this.userId)
        .set(data, { merge: true });

    } catch (error) {
      FirebaseLogger.error('❌ Failed to save to Firebase:', error);
    }
  }

  /**
   * Lưu vào localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to save to localStorage:', error);
    }
  }

  /**
   * Cập nhật preference cho thể loại
   */
  async updateCategoryPreference(category, enabled) {
    if (!this.isInitialized) await this.init();

    try {
      if (enabled) {
        if (!this.preferences.categories.includes(category)) {
          this.preferences.categories.push(category);
        }
      } else {
        this.preferences.categories = this.preferences.categories.filter(c => c !== category);
      }

      await this.savePreferences();
      FirebaseLogger.debug(`📝 Updated category preference: ${category} = ${enabled}`);
      
    } catch (error) {
      FirebaseLogger.error('❌ Failed to update category preference:', error);
    }
  }

  /**
   * Cập nhật preference cho quốc gia
   */
  async updateCountryPreference(country, enabled) {
    if (!this.isInitialized) await this.init();

    try {
      if (enabled) {
        if (!this.preferences.countries.includes(country)) {
          this.preferences.countries.push(country);
        }
      } else {
        this.preferences.countries = this.preferences.countries.filter(c => c !== country);
      }

      await this.savePreferences();
      FirebaseLogger.debug(`📝 Updated country preference: ${country} = ${enabled}`);
      
    } catch (error) {
      FirebaseLogger.error('❌ Failed to update country preference:', error);
    }
  }

  /**
   * Cập nhật preference tổng quát
   */
  async updateGeneralPreference(key, value) {
    if (!this.isInitialized) await this.init();

    try {
      this.preferences[key] = value;
      await this.savePreferences();
      FirebaseLogger.debug(`📝 Updated general preference: ${key} = ${value}`);
      
    } catch (error) {
      FirebaseLogger.error('❌ Failed to update general preference:', error);
    }
  }

  /**
   * Kiểm tra xem user có quan tâm đến phim này không
   */
  isInterestedInMovie(movie) {
    try {
      // Kiểm tra enable new movies
      if (!this.preferences.enableNewMovies) return false;

      // Kiểm tra thể loại
      if (this.preferences.categories.length > 0) {
        const movieCategories = movie.category || [];
        const hasMatchingCategory = movieCategories.some(cat => 
          this.preferences.categories.includes(cat.name || cat)
        );
        if (!hasMatchingCategory) return false;
      }

      // Kiểm tra quốc gia
      if (this.preferences.countries.length > 0) {
        const movieCountries = movie.country || [];
        const hasMatchingCountry = movieCountries.some(country => 
          this.preferences.countries.includes(country.name || country)
        );
        if (!hasMatchingCountry) return false;
      }

      // Kiểm tra ngôn ngữ
      if (this.preferences.languages.length > 0) {
        const movieLang = movie.lang || '';
        if (!this.preferences.languages.includes(movieLang)) return false;
      }

      // Kiểm tra chất lượng
      if (this.preferences.qualities.length > 0) {
        const movieQuality = movie.quality || '';
        if (!this.preferences.qualities.includes(movieQuality)) return false;
      }

      return true;

    } catch (error) {
      FirebaseLogger.error('❌ Error checking movie interest:', error);
      return true; // Default: quan tâm nếu có lỗi
    }
  }

  /**
   * Kiểm tra xem user có quan tâm đến episode này không
   */
  isInterestedInEpisode(movie) {
    try {
      // Kiểm tra enable new episodes
      if (!this.preferences.enableNewEpisodes) return false;

      // Sử dụng logic tương tự như movie
      return this.isInterestedInMovie(movie);

    } catch (error) {
      FirebaseLogger.error('❌ Error checking episode interest:', error);
      return true; // Default: quan tâm nếu có lỗi
    }
  }

  /**
   * Lấy danh sách thể loại phổ biến để user chọn
   */
  getPopularCategories() {
    return [
      'Hành Động', 'Phiêu Lưu', 'Hoạt Hình', 'Hài Hước', 'Tình Cảm',
      'Kinh Dị', 'Khoa Học Viễn Tưởng', 'Thể Thao', 'Âm Nhạc', 'Học Đường',
      'Siêu Nhiên', 'Mecha', 'Isekai', 'Slice of Life', 'Shounen',
      'Shoujo', 'Seinen', 'Josei', 'Ecchi', 'Harem'
    ];
  }

  /**
   * Lấy danh sách quốc gia phổ biến
   */
  getPopularCountries() {
    return [
      'Nhật Bản', 'Hàn Quốc', 'Trung Quốc', 'Thái Lan', 'Mỹ',
      'Anh', 'Pháp', 'Đức', 'Nga', 'Ấn Độ'
    ];
  }

  /**
   * Lấy preferences hiện tại
   */
  getPreferences() {
    return { ...this.preferences };
  }

  /**
   * Reset về mặc định
   */
  async resetToDefault() {
    this.preferences = {
      enableNewMovies: true,
      enableNewEpisodes: true,
      categories: [],
      countries: [],
      languages: ['Vietsub', 'Thuyết minh'],
      qualities: ['HD', 'FHD', '4K'],
      notificationTypes: {
        newMovie: true,
        newEpisode: true,
        adminAnnouncement: true
      }
    };

    await this.savePreferences();
    FirebaseLogger.info('🔄 Preferences reset to default');
  }

  /**
   * Lấy thống kê preferences
   */
  getStats() {
    return {
      categoriesCount: this.preferences.categories.length,
      countriesCount: this.preferences.countries.length,
      languagesCount: this.preferences.languages.length,
      qualitiesCount: this.preferences.qualities.length,
      enabledNotifications: Object.values(this.preferences.notificationTypes).filter(Boolean).length
    };
  }
}

// Khởi tạo global instance
window.NotificationPreferencesManager = new NotificationPreferencesManager();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.NotificationPreferencesManager.init();
  });
} else {
  window.NotificationPreferencesManager.init();
}

export default NotificationPreferencesManager;
