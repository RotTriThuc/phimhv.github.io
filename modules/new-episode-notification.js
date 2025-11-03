/**
 * 📺 New Episode Notification System
 * Tự động phát hiện và tạo thông báo cho tập phim mới
 * 
 * Features:
 * - Theo dõi episode_current của các phim
 * - Phát hiện khi có tập mới được cập nhật
 * - Tạo thông báo với link trực tiếp đến tập mới
 * - Lọc theo phim yêu thích của user
 */

import { FirebaseLogger } from '../firebase-config.js';

export class NewEpisodeNotificationManager {
  constructor() {
    this.trackedMovies = new Map(); // slug -> episode info
    this.isInitialized = false;
    this.checkInterval = 10 * 60 * 1000; // 10 phút
    this.maxTrackedMovies = 500; // Giới hạn số phim theo dõi
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

      // Load danh sách phim đang theo dõi
      await this.loadTrackedMovies();
      
      this.isInitialized = true;
      FirebaseLogger.info('📺 New Episode Notification Manager initialized');
      
      return true;
    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize New Episode Notification Manager:', error);
      return false;
    }
  }

  /**
   * Load danh sách phim đang theo dõi từ localStorage
   */
  async loadTrackedMovies() {
    try {
      const stored = localStorage.getItem('trackedMovies');
      if (stored) {
        const data = JSON.parse(stored);
        this.trackedMovies = new Map(Object.entries(data));
        FirebaseLogger.debug(`📚 Loaded ${this.trackedMovies.size} tracked movies`);
      }
    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to load tracked movies:', error);
      this.trackedMovies = new Map();
    }
  }

  /**
   * Lưu danh sách phim đang theo dõi
   */
  async saveTrackedMovies() {
    try {
      const data = Object.fromEntries(this.trackedMovies);
      localStorage.setItem('trackedMovies', JSON.stringify(data));
      localStorage.setItem('lastEpisodeCheck', new Date().toISOString());
    } catch (error) {
      FirebaseLogger.warn('⚠️ Failed to save tracked movies:', error);
    }
  }

  /**
   * Thêm phim vào danh sách theo dõi
   */
  async addMovieToTracking(movie) {
    try {
      const episodeInfo = {
        name: movie.name,
        slug: movie.slug,
        currentEpisode: movie.episode_current || 'Tập 1',
        lastChecked: new Date().toISOString(),
        poster_url: movie.poster_url || movie.thumb_url,
        year: movie.year,
        category: movie.category || [],
        quality: movie.quality,
        lang: movie.lang
      };

      this.trackedMovies.set(movie.slug, episodeInfo);
      
      // Giới hạn số lượng phim theo dõi
      if (this.trackedMovies.size > this.maxTrackedMovies) {
        await this.cleanupOldTrackedMovies();
      }
      
      await this.saveTrackedMovies();
      FirebaseLogger.debug(`➕ Added ${movie.name} to tracking`);
      
    } catch (error) {
      FirebaseLogger.error(`❌ Failed to add ${movie.name} to tracking:`, error);
    }
  }

  /**
   * Dọn dẹp phim cũ không còn cập nhật
   */
  async cleanupOldTrackedMovies() {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 ngày
    let removedCount = 0;

    for (const [slug, info] of this.trackedMovies.entries()) {
      const lastChecked = new Date(info.lastChecked);
      if (lastChecked < cutoffDate) {
        this.trackedMovies.delete(slug);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      FirebaseLogger.info(`🧹 Cleaned up ${removedCount} old tracked movies`);
    }
  }

  /**
   * Kiểm tra tập mới cho tất cả phim đang theo dõi
   */
  async checkForNewEpisodes() {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      FirebaseLogger.info('🔍 Checking for new episodes...');
      
      const notifications = [];
      const batchSize = 10; // Xử lý 10 phim mỗi lần
      const movieSlugs = Array.from(this.trackedMovies.keys());
      
      for (let i = 0; i < movieSlugs.length; i += batchSize) {
        const batch = movieSlugs.slice(i, i + batchSize);
        
        for (const slug of batch) {
          try {
            const notification = await this.checkSingleMovieEpisode(slug);
            if (notification) {
              notifications.push(notification);
            }
          } catch (error) {
            FirebaseLogger.error(`❌ Failed to check episode for ${slug}:`, error);
          }
        }
        
        // Delay giữa các batch để tránh rate limit
        if (i + batchSize < movieSlugs.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (notifications.length > 0) {
        FirebaseLogger.info(`📺 Found ${notifications.length} new episodes`);
      } else {
        FirebaseLogger.info('📭 No new episodes detected');
      }
      
      return notifications;
      
    } catch (error) {
      FirebaseLogger.error('❌ Error checking for new episodes:', error);
      return [];
    }
  }

  /**
   * Kiểm tra tập mới cho một phim cụ thể
   */
  async checkSingleMovieEpisode(slug) {
    try {
      const trackedInfo = this.trackedMovies.get(slug);
      if (!trackedInfo) {
        return null;
      }

      // Lấy thông tin phim mới nhất từ API
      const movieData = await this.fetchMovieDetails(slug);
      if (!movieData) {
        return null;
      }

      // So sánh episode hiện tại
      const currentEpisode = movieData.episode_current || 'Tập 1';
      const trackedEpisode = trackedInfo.currentEpisode;

      if (currentEpisode !== trackedEpisode) {
        // Có tập mới!
        FirebaseLogger.info(`📺 New episode detected for ${movieData.name}: ${currentEpisode}`);
        
        // Cập nhật thông tin tracking
        trackedInfo.currentEpisode = currentEpisode;
        trackedInfo.lastChecked = new Date().toISOString();
        this.trackedMovies.set(slug, trackedInfo);
        
        // Tạo thông báo
        const notification = await this.createEpisodeNotification(movieData, currentEpisode);
        
        await this.saveTrackedMovies();
        return notification;
      }

      // Cập nhật thời gian check
      trackedInfo.lastChecked = new Date().toISOString();
      this.trackedMovies.set(slug, trackedInfo);
      
      return null;
      
    } catch (error) {
      FirebaseLogger.error(`❌ Error checking episode for ${slug}:`, error);
      return null;
    }
  }

  /**
   * Lấy chi tiết phim từ API
   */
  async fetchMovieDetails(slug) {
    try {
      // Sử dụng API module hiện có
      if (window.api) {
        const response = await window.api.getMovie(slug);
        return response?.movie || response?.data || null;
      }
      
      // Fallback: gọi API trực tiếp
      const response = await fetch(`https://phimapi.com/phim/${slug}`);
      const data = await response.json();
      return data?.movie || data?.data || null;
      
    } catch (error) {
      FirebaseLogger.error(`❌ Failed to fetch movie details for ${slug}:`, error);
      return null;
    }
  }

  /**
   * Tạo thông báo cho tập mới
   */
  async createEpisodeNotification(movie, newEpisode) {
    try {
      const notificationData = {
        title: `📺 ${movie.name} - ${newEpisode}`,
        content: this.generateEpisodeNotificationContent(movie, newEpisode),
        type: 'new_episode',
        metadata: {
          priority: 'normal',
          movieSlug: movie.slug,
          episodeNumber: this.extractEpisodeNumber(newEpisode),
          movieData: {
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url || movie.thumb_url,
            episode_current: newEpisode,
            quality: movie.quality,
            lang: movie.lang,
            watchUrl: `/xem/${movie.slug}`
          }
        }
      };

      // Tạo thông báo qua Firebase
      await window.movieComments.createNotification(notificationData);
      
      FirebaseLogger.success(`✅ Created episode notification: ${movie.name} - ${newEpisode}`);
      return notificationData;
      
    } catch (error) {
      FirebaseLogger.error(`❌ Failed to create episode notification:`, error);
      return null;
    }
  }

  /**
   * Tạo nội dung thông báo cho tập mới
   */
  generateEpisodeNotificationContent(movie, newEpisode) {
    const parts = [];
    
    parts.push(`${newEpisode} của "${movie.name}" đã có sẵn!`);
    
    // Chất lượng và ngôn ngữ
    if (movie.quality && movie.lang) {
      parts.push(`${movie.quality} - ${movie.lang}`);
    }
    
    parts.push('Xem ngay!');
    
    return parts.join(' • ');
  }

  /**
   * Trích xuất số tập từ chuỗi episode
   */
  extractEpisodeNumber(episodeString) {
    const match = episodeString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Tự động thêm phim yêu thích vào tracking
   */
  async syncWithSavedMovies() {
    try {
      // Lấy danh sách phim đã lưu
      const savedMovies = await window.movieComments?.getSavedMovies() || [];
      
      for (const movie of savedMovies) {
        if (!this.trackedMovies.has(movie.slug)) {
          await this.addMovieToTracking(movie);
        }
      }
      
      FirebaseLogger.info(`🔄 Synced ${savedMovies.length} saved movies to tracking`);
      
    } catch (error) {
      FirebaseLogger.error('❌ Failed to sync with saved movies:', error);
    }
  }

  /**
   * Bắt đầu auto-check định kỳ
   */
  startAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }
    
    this.autoCheckInterval = setInterval(async () => {
      await this.checkForNewEpisodes();
    }, this.checkInterval);
    
    FirebaseLogger.info(`🔄 Episode auto-check started (interval: ${this.checkInterval / 1000}s)`);
  }

  /**
   * Dừng auto-check
   */
  stopAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
      FirebaseLogger.info('⏹️ Episode auto-check stopped');
    }
  }

  /**
   * Kiểm tra thủ công
   */
  async manualCheck() {
    FirebaseLogger.info('🔍 Manual episode check triggered');
    return await this.checkForNewEpisodes();
  }

  /**
   * Xóa phim khỏi tracking
   */
  removeMovieFromTracking(slug) {
    if (this.trackedMovies.has(slug)) {
      this.trackedMovies.delete(slug);
      this.saveTrackedMovies();
      FirebaseLogger.debug(`➖ Removed ${slug} from tracking`);
    }
  }

  /**
   * Lấy thống kê
   */
  getStats() {
    return {
      trackedMoviesCount: this.trackedMovies.size,
      isAutoCheckRunning: !!this.autoCheckInterval,
      checkInterval: this.checkInterval,
      maxTrackedMovies: this.maxTrackedMovies
    };
  }

  /**
   * Lấy danh sách phim đang theo dõi
   */
  getTrackedMovies() {
    return Array.from(this.trackedMovies.entries()).map(([slug, info]) => ({
      slug,
      ...info
    }));
  }
}

// Khởi tạo global instance
window.NewEpisodeNotificationManager = new NewEpisodeNotificationManager();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.NewEpisodeNotificationManager.init();
  });
} else {
  window.NewEpisodeNotificationManager.init();
}

export default NewEpisodeNotificationManager;
