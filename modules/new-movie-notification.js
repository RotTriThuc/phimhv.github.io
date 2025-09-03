/**
 * 🎬 New Movie Notification System
 * Tự động phát hiện và tạo thông báo cho phim mới
 * 
 * Features:
 * - Phát hiện phim mới từ API
 * - Tạo thông báo với đầy đủ thông tin
 * - Lọc theo preferences của user
 * - Tích hợp với Firebase notification system
 */

import { FirebaseLogger } from '../firebase-config.js';

export class NewMovieNotificationManager {
  constructor() {
    this.lastCheckTime = null;
    this.knownMovies = new Set();
    this.isInitialized = false;
    this.checkInterval = 5 * 60 * 1000; // 5 phút
    this.batchSize = 50; // Xử lý 50 phim mỗi lần
  }

  /**
   * Khởi tạo hệ thống
   */
  async init() {
    try {
      // Đảm bảo Firebase đã sẵn sàng
      if (!window.movieComments || !window.movieComments.initialized) {
        await window.movieComments?.init();
      }

      // Load danh sách phim đã biết từ localStorage
      await this.loadKnownMovies();
      
      // Load thời gian check cuối cùng
      this.lastCheckTime = localStorage.getItem('lastMovieCheck') 
        ? new Date(localStorage.getItem('lastMovieCheck'))
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h trước

      this.isInitialized = true;
      FirebaseLogger.info('🎬 New Movie Notification Manager initialized');
      
      return true;
    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize New Movie Notification Manager:', error);
      return false;
    }
  }

  /**
   * Load danh sách phim đã biết từ localStorage
   */
  async loadKnownMovies() {
    try {
      const stored = localStorage.getItem('knownMovies');
      if (stored) {
        const movies = JSON.parse(stored);
        this.knownMovies = new Set(movies);
        FirebaseLogger.debug(`📚 Loaded ${this.knownMovies.size} known movies`);
      }
    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to load known movies:', error);
      this.knownMovies = new Set();
    }
  }

  /**
   * Lưu danh sách phim đã biết vào localStorage
   */
  async saveKnownMovies() {
    try {
      const movies = Array.from(this.knownMovies);
      localStorage.setItem('knownMovies', JSON.stringify(movies));
      localStorage.setItem('lastMovieCheck', new Date().toISOString());
    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to save known movies:', error);
    }
  }

  /**
   * Kiểm tra phim mới từ API
   */
  async checkForNewMovies() {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      FirebaseLogger.info('🔍 Checking for new movies...');
      
      // Lấy danh sách phim mới nhất từ API
      const latestMovies = await this.fetchLatestMovies();
      
      if (!latestMovies || latestMovies.length === 0) {
        FirebaseLogger.info('📭 No movies found from API');
        return [];
      }

      // Lọc ra phim thực sự mới
      const newMovies = this.filterNewMovies(latestMovies);
      
      if (newMovies.length === 0) {
        FirebaseLogger.info('📭 No new movies detected');
        return [];
      }

      FirebaseLogger.info(`🎬 Found ${newMovies.length} new movies`);

      // Tạo thông báo cho phim mới
      const notifications = await this.createMovieNotifications(newMovies);
      
      // Cập nhật danh sách phim đã biết
      newMovies.forEach(movie => {
        this.knownMovies.add(movie.slug);
      });
      
      await this.saveKnownMovies();
      
      return notifications;
      
    } catch (error) {
      FirebaseLogger.error('❌ Error checking for new movies:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách phim mới nhất từ API
   */
  async fetchLatestMovies() {
    try {
      // Sử dụng API module hiện có
      if (window.api) {
        const response = await window.api.getLatest(1);
        return response?.data?.items || [];
      }
      
      // Fallback: gọi API trực tiếp
      const response = await fetch('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1');
      const data = await response.json();
      return data?.items || [];
      
    } catch (error) {
      FirebaseLogger.error('❌ Failed to fetch latest movies:', error);
      return [];
    }
  }

  /**
   * Lọc ra phim thực sự mới
   */
  filterNewMovies(movies) {
    return movies.filter(movie => {
      // Kiểm tra slug chưa có trong danh sách đã biết
      if (this.knownMovies.has(movie.slug)) {
        return false;
      }

      // Kiểm tra thời gian tạo (nếu có)
      if (movie.created && this.lastCheckTime) {
        const movieDate = new Date(movie.created);
        if (movieDate <= this.lastCheckTime) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Tạo thông báo cho danh sách phim mới
   */
  async createMovieNotifications(newMovies) {
    const notifications = [];
    
    try {
      // Xử lý theo batch để tránh quá tải
      for (let i = 0; i < newMovies.length; i += this.batchSize) {
        const batch = newMovies.slice(i, i + this.batchSize);
        
        for (const movie of batch) {
          try {
            const notification = await this.createSingleMovieNotification(movie);
            if (notification) {
              notifications.push(notification);
            }
          } catch (error) {
            FirebaseLogger.error(`❌ Failed to create notification for ${movie.name}:`, error);
          }
        }
        
        // Delay giữa các batch
        if (i + this.batchSize < newMovies.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (error) {
      FirebaseLogger.error('❌ Error creating movie notifications:', error);
    }
    
    return notifications;
  }

  /**
   * Tạo thông báo cho một phim
   */
  async createSingleMovieNotification(movie) {
    try {
      // Chuẩn bị dữ liệu thông báo
      const notificationData = {
        title: `🎬 Phim mới: ${movie.name}`,
        content: this.generateMovieNotificationContent(movie),
        type: 'new_movie',
        metadata: {
          priority: 'high',
          movieSlug: movie.slug,
          movieData: {
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url || movie.thumb_url,
            year: movie.year,
            episode_current: movie.episode_current,
            quality: movie.quality,
            lang: movie.lang,
            category: movie.category || [],
            country: movie.country || []
          }
        }
      };

      // Tạo thông báo qua Firebase
      await window.movieComments.createNotification(notificationData);
      
      FirebaseLogger.success(`✅ Created notification for: ${movie.name}`);
      return notificationData;
      
    } catch (error) {
      FirebaseLogger.error(`❌ Failed to create notification for ${movie.name}:`, error);
      return null;
    }
  }

  /**
   * Tạo nội dung thông báo cho phim
   */
  generateMovieNotificationContent(movie) {
    const parts = [];
    
    // Thông tin cơ bản
    parts.push(`Phim "${movie.name}" vừa được thêm vào hệ thống.`);
    
    // Thể loại
    if (movie.category && movie.category.length > 0) {
      parts.push(`Thể loại: ${movie.category.slice(0, 3).join(', ')}`);
    }
    
    // Số tập
    if (movie.episode_current) {
      parts.push(`Tập hiện tại: ${movie.episode_current}`);
    }
    
    // Chất lượng và ngôn ngữ
    const quality = movie.quality || 'HD';
    const lang = movie.lang || 'Vietsub';
    parts.push(`${quality} - ${lang}`);
    
    // Năm sản xuất
    if (movie.year) {
      parts.push(`Năm: ${movie.year}`);
    }
    
    parts.push('Xem ngay!');
    
    return parts.join(' • ');
  }

  /**
   * Bắt đầu auto-check định kỳ
   */
  startAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }
    
    this.autoCheckInterval = setInterval(async () => {
      await this.checkForNewMovies();
    }, this.checkInterval);
    
    FirebaseLogger.info(`🔄 Auto-check started (interval: ${this.checkInterval / 1000}s)`);
  }

  /**
   * Dừng auto-check
   */
  stopAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
      FirebaseLogger.info('⏹️ Auto-check stopped');
    }
  }

  /**
   * Kiểm tra thủ công
   */
  async manualCheck() {
    FirebaseLogger.info('🔍 Manual check triggered');
    return await this.checkForNewMovies();
  }

  /**
   * Reset danh sách phim đã biết (để test)
   */
  async resetKnownMovies() {
    this.knownMovies.clear();
    localStorage.removeItem('knownMovies');
    localStorage.removeItem('lastMovieCheck');
    this.lastCheckTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    FirebaseLogger.info('🔄 Known movies list reset');
  }

  /**
   * Lấy thống kê
   */
  getStats() {
    return {
      knownMoviesCount: this.knownMovies.size,
      lastCheckTime: this.lastCheckTime,
      isAutoCheckRunning: !!this.autoCheckInterval,
      checkInterval: this.checkInterval
    };
  }
}

// Khởi tạo global instance
window.NewMovieNotificationManager = new NewMovieNotificationManager();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.NewMovieNotificationManager.init();
  });
} else {
  window.NewMovieNotificationManager.init();
}

export default NewMovieNotificationManager;
