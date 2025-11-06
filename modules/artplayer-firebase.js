/**
 * ArtPlayer Firebase Integration Module
 * Tích hợp ArtPlayer 5.3.0 với Firebase để lưu tiến độ xem và tập phim hiện tại
 * 
 * Features:
 * - Auto-save thời gian xem phim (mỗi 5 giây)
 * - Lưu tập phim đang xem
 * - Tiếp tục xem từ vị trí cũ
 * - Sync cross-device qua Firebase
 */

import { Logger } from './logger.js';

// Cấu hình
const CONFIG = {
  // Thời gian auto-save (milliseconds)
  AUTO_SAVE_INTERVAL: 5000, // 5 giây
  
  // Thời gian tối thiểu phải xem để lưu (giây)
  MIN_WATCH_TIME: 5,
  
  // Tỷ lệ % phim coi như đã xem (để reset về đầu)
  WATCHED_THRESHOLD: 0.9, // 90%
  
  // ArtPlayer CDN
  ARTPLAYER_VERSION: '5.3.0',
  ARTPLAYER_CSS: 'https://cdn.jsdelivr.net/npm/artplayer@5.3.0/dist/artplayer.css',
  ARTPLAYER_JS: 'https://cdn.jsdelivr.net/npm/artplayer@5.3.0/dist/artplayer.js'
};

/**
 * ArtPlayer Firebase Integration Class
 */
export class ArtPlayerFirebase {
  constructor(options = {}) {
    this.options = { ...CONFIG, ...options };
    this.player = null;
    this.movieSlug = null;
    this.episodeSlug = null;
    this.episodeName = null;
    this.autoSaveTimer = null;
    this.lastSavedTime = 0;
    this.isInitialized = false;
    
    // Bind methods
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.handlePause = this.handlePause.bind(this);
  }
  
  /**
   * Khởi tạo ArtPlayer với Firebase integration
   */
  async init(container, videoUrl, movieData) {
    try {
      // Load ArtPlayer library
      await this.loadArtPlayer();
      
      // Store movie info
      this.movieSlug = movieData.slug;
      this.episodeSlug = movieData.episodeSlug || 'tap-1';
      this.episodeName = movieData.episodeName || 'Tập 1';
      
      // Get watch progress from Firebase
      const watchProgress = await this.getWatchProgress();
      
      // Create ArtPlayer instance
      this.player = new Artplayer({
        container: container,
        url: videoUrl,
        title: `${movieData.name} - ${this.episodeName}`,
        poster: movieData.poster_url,
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: false,
        pip: true,
        autoSize: false,
        autoMini: true,
        screenshot: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: true,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        theme: '#6c5ce7',
        lang: 'vi',
        whitelist: ['*'],
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        
        // Custom controls
        controls: [
          {
            position: 'right',
            html: '⏮ Tập trước',
            tooltip: 'Tập trước',
            style: {
              padding: '0 10px',
            },
            click: () => {
              this.onPrevEpisode && this.onPrevEpisode();
            }
          },
          {
            position: 'right',
            html: 'Tập sau ⏭',
            tooltip: 'Tập sau',
            style: {
              padding: '0 10px',
            },
            click: () => {
              this.onNextEpisode && this.onNextEpisode();
            }
          }
        ],
        
        // Layers - Show continue watching notification
        layers: watchProgress && watchProgress.currentTime > CONFIG.MIN_WATCH_TIME ? [
          {
            html: this.createContinueWatchingLayer(watchProgress),
            style: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }
          }
        ] : []
      });
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start auto-save timer
      this.startAutoSave();
      
      // Resume from saved position if exists
      if (watchProgress && watchProgress.currentTime > CONFIG.MIN_WATCH_TIME) {
        Logger.info('📺 Found saved progress, showing continue option');
      }
      
      this.isInitialized = true;
      Logger.info('🎬 ArtPlayer Firebase initialized successfully');
      
      return this.player;
      
    } catch (error) {
      Logger.error('❌ Failed to initialize ArtPlayer Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Load ArtPlayer library
   */
  async loadArtPlayer() {
    if (window.Artplayer) {
      Logger.info('ArtPlayer already loaded');
      return true;
    }
    
    try {
      // Load CSS
      await this.loadStylesheet(this.options.ARTPLAYER_CSS);
      
      // Load JS
      await this.loadScript(this.options.ARTPLAYER_JS);
      
      Logger.info('✅ ArtPlayer library loaded');
      return true;
      
    } catch (error) {
      Logger.error('❌ Failed to load ArtPlayer:', error);
      throw error;
    }
  }
  
  /**
   * Load external stylesheet
   */
  loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(link);
    });
  }
  
  /**
   * Load external script
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.player) return;
    
    // Time update
    this.player.on('video:timeupdate', this.handleTimeUpdate);
    
    // Video ended
    this.player.on('video:ended', this.handleEnded);
    
    // Pause (to save progress)
    this.player.on('video:pause', this.handlePause);
    
    // Ready
    this.player.on('ready', () => {
      Logger.info('🎬 Player ready');
    });
    
    // Error
    this.player.on('error', (error) => {
      Logger.error('❌ Player error:', error);
    });
  }
  
  /**
   * Handle time update
   */
  handleTimeUpdate() {
    // Save progress periodically is handled by auto-save timer
    // This is just for tracking
  }
  
  /**
   * Handle video ended
   */
  handleEnded() {
    Logger.info('🎬 Video ended');
    
    // Save final progress
    this.saveProgress(true);
    
    // Auto play next episode if available
    if (this.onNextEpisode) {
      setTimeout(() => {
        this.onNextEpisode();
      }, 3000);
    }
  }
  
  /**
   * Handle pause
   */
  handlePause() {
    // Save progress when user pauses
    this.saveProgress();
  }
  
  /**
   * Start auto-save timer
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.saveProgress();
    }, this.options.AUTO_SAVE_INTERVAL);
    
    Logger.info('⏰ Auto-save started');
  }
  
  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      Logger.info('⏰ Auto-save stopped');
    }
  }
  
  /**
   * Save watch progress to Firebase
   */
  async saveProgress(isCompleted = false) {
    if (!this.player || !window.movieComments) return;
    
    try {
      const currentTime = this.player.currentTime;
      const duration = this.player.duration;
      
      // Don't save if too early or invalid
      if (currentTime < this.options.MIN_WATCH_TIME || duration === 0) {
        return;
      }
      
      // Don't save if too close to last save (debounce)
      if (Math.abs(currentTime - this.lastSavedTime) < 3) {
        return;
      }
      
      const progress = currentTime / duration;
      const isWatched = progress >= this.options.WATCHED_THRESHOLD || isCompleted;
      
      // Reset to beginning if watched
      const savedTime = isWatched ? 0 : currentTime;
      
      const progressData = {
        movieSlug: this.movieSlug,
        episodeSlug: this.episodeSlug,
        episodeName: this.episodeName,
        currentTime: savedTime,
        duration: duration,
        progress: progress,
        isCompleted: isWatched,
        lastWatched: Date.now()
      };
      
      // Save to Firebase
      await window.movieComments.setWatchProgress(this.movieSlug, progressData);
      
      // Cập nhật tập đang xem vào savedMovies (nếu phim đã được lưu)
      if (currentTime > this.options.MIN_WATCH_TIME * 2) {
        await window.movieComments.updateCurrentEpisode(
          this.movieSlug,
          this.episodeSlug,
          this.episodeName
        );
      }
      
      this.lastSavedTime = currentTime;
      
      Logger.debug('💾 Progress saved:', {
        episode: this.episodeName,
        time: this.formatTime(savedTime),
        progress: `${(progress * 100).toFixed(1)}%`,
        completed: isWatched
      });
      
    } catch (error) {
      Logger.error('❌ Failed to save progress:', error);
    }
  }
  
  /**
   * Get watch progress from Firebase
   */
  async getWatchProgress() {
    if (!window.movieComments) return null;
    
    try {
      const progress = await window.movieComments.getWatchProgress(this.movieSlug);
      
      if (progress && progress.episodeSlug === this.episodeSlug) {
        Logger.info('📺 Found saved progress:', {
          episode: progress.episodeName,
          time: this.formatTime(progress.currentTime),
          progress: `${(progress.progress * 100).toFixed(1)}%`
        });
        return progress;
      }
      
      return null;
      
    } catch (error) {
      Logger.error('❌ Failed to get progress:', error);
      return null;
    }
  }
  
  /**
   * Create continue watching layer
   */
  createContinueWatchingLayer(watchProgress) {
    const timeStr = this.formatTime(watchProgress.currentTime);
    const progressPercent = (watchProgress.progress * 100).toFixed(0);
    
    return `
      <div class="art-continue-watching" style="
        background: rgba(0, 0, 0, 0.8);
        padding: 20px 30px;
        border-radius: 10px;
        text-align: center;
        backdrop-filter: blur(10px);
      ">
        <div style="font-size: 18px; color: #fff; margin-bottom: 15px;">
          📺 Tiếp tục xem từ ${timeStr}
        </div>
        <div style="color: #aaa; margin-bottom: 20px; font-size: 14px;">
          Đã xem ${progressPercent}%
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button class="art-btn-continue" style="
            background: #6c5ce7;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          ">
            ▶️ Tiếp tục
          </button>
          <button class="art-btn-restart" style="
            background: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          ">
            🔄 Xem lại từ đầu
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Show continue watching dialog after player ready
   */
  showContinueDialog(watchProgress) {
    if (!this.player) return;
    
    // Wait for player to be ready
    this.player.once('ready', () => {
      const timeStr = this.formatTime(watchProgress.currentTime);
      
      this.player.notice.show = `Tiếp tục từ ${timeStr}?`;
      
      // Setup button handlers
      const continueBtn = document.querySelector('.art-btn-continue');
      const restartBtn = document.querySelector('.art-btn-restart');
      
      if (continueBtn) {
        continueBtn.onclick = () => {
          this.player.currentTime = watchProgress.currentTime;
          this.player.play();
          document.querySelector('.art-continue-watching').remove();
        };
      }
      
      if (restartBtn) {
        restartBtn.onclick = () => {
          this.player.currentTime = 0;
          this.player.play();
          document.querySelector('.art-continue-watching').remove();
        };
      }
    });
  }
  
  /**
   * Update episode info (when switching episodes)
   */
  updateEpisode(episodeSlug, episodeName, videoUrl) {
    this.episodeSlug = episodeSlug;
    this.episodeName = episodeName;
    
    if (this.player) {
      // Save current episode progress before switching
      this.saveProgress();
      
      // Update video source
      this.player.switchUrl(videoUrl);
      
      // Update title
      this.player.title = `${this.episodeName}`;
      
      // Check for saved progress on new episode
      this.getWatchProgress().then(progress => {
        if (progress && progress.currentTime > CONFIG.MIN_WATCH_TIME) {
          // Show continue option for new episode
          this.showContinueDialog(progress);
        }
      });
      
      Logger.info('📺 Episode updated:', this.episodeName);
    }
  }
  
  /**
   * Format time (seconds to MM:SS)
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get current watch stats
   */
  getWatchStats() {
    if (!this.player) return null;
    
    return {
      movieSlug: this.movieSlug,
      episodeSlug: this.episodeSlug,
      episodeName: this.episodeName,
      currentTime: this.player.currentTime,
      duration: this.player.duration,
      progress: this.player.currentTime / this.player.duration,
      isPlaying: !this.player.paused
    };
  }
  
  /**
   * Set callbacks for episode navigation
   */
  setNavigationCallbacks(onNext, onPrev) {
    this.onNextEpisode = onNext;
    this.onPrevEpisode = onPrev;
  }
  
  /**
   * Destroy player and cleanup
   */
  destroy() {
    // Save final progress
    if (this.player) {
      this.saveProgress();
    }
    
    // Stop auto-save
    this.stopAutoSave();
    
    // Remove event listeners
    if (this.player) {
      this.player.off('video:timeupdate', this.handleTimeUpdate);
      this.player.off('video:ended', this.handleEnded);
      this.player.off('video:pause', this.handlePause);
      
      // Destroy player
      this.player.destroy(false);
      this.player = null;
    }
    
    this.isInitialized = false;
    Logger.info('🗑️ ArtPlayer Firebase destroyed');
  }
}

/**
 * Factory function
 */
export function createArtPlayerFirebase(options = {}) {
  return new ArtPlayerFirebase(options);
}

/**
 * Get all watch progress for a user (for continue watching section)
 */
export async function getAllWatchProgress() {
  if (!window.movieComments) {
    Logger.warn('Firebase not initialized');
    return [];
  }
  
  try {
    const progressData = await window.movieComments.getAllWatchProgress();
    
    // Convert to array and sort by last watched
    const progressArray = Object.values(progressData)
      .filter(p => p.currentTime > CONFIG.MIN_WATCH_TIME && !p.isCompleted)
      .sort((a, b) => b.lastWatched - a.lastWatched);
    
    Logger.info('📺 Found watch progress:', progressArray.length);
    return progressArray;
    
  } catch (error) {
    Logger.error('❌ Failed to get all watch progress:', error);
    return [];
  }
}

export default {
  ArtPlayerFirebase,
  createArtPlayerFirebase,
  getAllWatchProgress,
  CONFIG
};
