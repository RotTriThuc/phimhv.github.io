/**
 * Advanced Video Player Module - Tối ưu hóa video streaming với HLS.js
 * Tác giả: AI Assistant  
 * Mô tả: Video player với adaptive bitrate, buffer optimization, và advanced error handling
 */

import { Logger } from './logger.js';
import { networkMonitor } from './network-monitor.js';

// Cấu hình video player
const VIDEO_CONFIG = {
  // HLS.js configuration
  hlsConfig: {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 90,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    maxBufferSize: 60 * 1000 * 1000, // 60MB
    maxBufferHole: 0.5,
    
    // Adaptive bitrate settings
    abrEwmaFastLive: 3.0,
    abrEwmaSlowLive: 9.0,
    abrEwmaFastVoD: 3.0,
    abrEwmaSlowVoD: 9.0,
    abrEwmaDefaultEstimate: 500000, // 500 Kbps default
    abrBandWidthFactor: 0.95,
    abrBandWidthUpFactor: 0.7,
    
    // Fragment loading
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 6,
    fragLoadingRetryDelay: 1000,
    fragLoadingMaxRetryTimeout: 64000,
    
    // Manifest loading  
    manifestLoadingTimeOut: 10000,
    manifestLoadingMaxRetry: 6,
    manifestLoadingRetryDelay: 1000,
    manifestLoadingMaxRetryTimeout: 64000,
    
    // Level loading
    levelLoadingTimeOut: 10000,
    levelLoadingMaxRetry: 6,
    levelLoadingRetryDelay: 1000,
    levelLoadingMaxRetryTimeout: 64000
  },
  
  // Quality levels mapping
  qualityLevels: {
    'auto': -1,
    'low': 0,
    'medium': 1, 
    'high': 2,
    'ultra': 3
  },
  
  // Player UI settings
  ui: {
    showQualitySelector: true,
    showSpeedControl: true,
    showVolumeControl: true,
    showFullscreenButton: true,
    showPictureInPicture: true
  }
};

/**
 * Advanced Video Player Class
 * Quản lý video playback với adaptive streaming và advanced features
 */
export class AdvancedVideoPlayer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...VIDEO_CONFIG, ...options };
    this.hls = null;
    this.video = null;
    this.isInitialized = false;
    this.currentQuality = 'auto';
    this.playbackStats = {
      startTime: 0,
      bufferEvents: 0,
      qualityChanges: 0,
      errors: 0
    };
    
    // Event listeners
    this.listeners = new Map();
    
    this.init();
  }
  
  /**
   * Khởi tạo video player
   */
  async init() {
    try {
      this.createVideoElement();
      this.setupNetworkListener();
      await this.loadHlsLibrary();
      this.isInitialized = true;
      
      Logger.info('🎬 Advanced Video Player initialized');
      
    } catch (error) {
      Logger.error('❌ Video Player initialization failed:', error);
      this.fallbackToBasicPlayer();
    }
  }
  
  /**
   * Tạo video element với advanced attributes
   */
  createVideoElement() {
    this.video = document.createElement('video');
    this.video.controls = true;
    this.video.playsInline = true;
    this.video.preload = 'metadata';
    this.video.crossOrigin = 'anonymous';
    
    // Advanced video attributes
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('webkit-playsinline', '');
    this.video.setAttribute('x5-video-player-type', 'h5');
    this.video.setAttribute('x5-video-player-fullscreen', 'true');
    
    // Style for responsive design
    this.video.style.width = '100%';
    this.video.style.height = 'auto';
    this.video.style.maxWidth = '100%';
    this.video.style.aspectRatio = '16/9';
    
    this.container.appendChild(this.video);
    this.setupVideoEventListeners();
  }
  
  /**
   * Setup video event listeners
   */
  setupVideoEventListeners() {
    // Playback events
    this.video.addEventListener('loadstart', () => this.emit('loadstart'));
    this.video.addEventListener('loadedmetadata', () => this.emit('loadedmetadata'));
    this.video.addEventListener('canplay', () => this.emit('canplay'));
    this.video.addEventListener('play', () => this.emit('play'));
    this.video.addEventListener('pause', () => this.emit('pause'));
    this.video.addEventListener('ended', () => this.emit('ended'));
    
    // Progress events
    this.video.addEventListener('progress', () => this.emit('progress'));
    this.video.addEventListener('timeupdate', () => this.emit('timeupdate'));
    
    // Error events
    this.video.addEventListener('error', (e) => {
      this.playbackStats.errors++;
      this.emit('error', e);
    });
    
    // Buffer events
    this.video.addEventListener('waiting', () => {
      this.playbackStats.bufferEvents++;
      this.emit('buffering', true);
    });
    
    this.video.addEventListener('canplaythrough', () => {
      this.emit('buffering', false);
    });
  }
  
  /**
   * Setup network quality listener
   */
  setupNetworkListener() {
    networkMonitor.addListener((event, data) => {
      if (event === 'qualityChange' && this.hls) {
        this.adaptToNetworkQuality(data.newQuality);
      }
    });
  }
  
  /**
   * Load HLS.js library dynamically
   */
  async loadHlsLibrary() {
    if (window.Hls) return true;
    
    try {
      await this.loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js');
      return !!window.Hls;
    } catch (error) {
      Logger.error('❌ Failed to load HLS.js:', error);
      return false;
    }
  }
  
  /**
   * Load external script
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Load video source với adaptive streaming
   */
  async loadSource(url, options = {}) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    this.playbackStats.startTime = Date.now();
    
    try {
      // Check if HLS is supported
      if (this.isHlsUrl(url)) {
        await this.loadHlsSource(url, options);
      } else {
        this.loadDirectSource(url);
      }
      
      Logger.info('📺 Video source loaded:', { url, type: this.isHlsUrl(url) ? 'HLS' : 'Direct' });
      
    } catch (error) {
      Logger.error('❌ Failed to load video source:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Kiểm tra URL có phải HLS không
   */
  isHlsUrl(url) {
    return url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl');
  }
  
  /**
   * Load HLS source với advanced configuration
   */
  async loadHlsSource(url, options) {
    if (!window.Hls || !window.Hls.isSupported()) {
      // Fallback to native HLS support
      if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
        this.video.src = url;
        return;
      }
      throw new Error('HLS not supported');
    }
    
    // Destroy existing HLS instance
    if (this.hls) {
      this.hls.destroy();
    }
    
    // Get network-adaptive configuration
    const networkConfig = networkMonitor.getVideoConfig();
    const hlsConfig = {
      ...this.options.hlsConfig,
      maxBufferLength: networkConfig.bufferSize,
      abrEwmaDefaultEstimate: networkConfig.maxBitrate * 0.8
    };
    
    // Create new HLS instance
    this.hls = new window.Hls(hlsConfig);
    
    // Setup HLS event listeners
    this.setupHlsEventListeners();
    
    // Load source
    this.hls.loadSource(url);
    this.hls.attachMedia(this.video);
    
    // Apply initial quality settings
    this.applyQualitySettings();
  }
  
  /**
   * Setup HLS event listeners
   */
  setupHlsEventListeners() {
    const Hls = window.Hls;
    
    // Manifest loaded
    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      Logger.debug('📋 HLS manifest parsed:', data.levels.length + ' quality levels');
      this.emit('manifestLoaded', data);
    });
    
    // Level switched
    this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      this.playbackStats.qualityChanges++;
      Logger.debug('🔄 Quality level switched to:', data.level);
      this.emit('qualityChanged', data);
    });
    
    // Fragment loaded
    this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      this.emit('fragmentLoaded', data);
    });
    
    // Buffer events
    this.hls.on(Hls.Events.BUFFER_APPENDING, () => {
      this.emit('buffering', false);
    });
    
    this.hls.on(Hls.Events.BUFFER_EOS, () => {
      this.emit('bufferEnd');
    });
    
    // Error handling
    this.hls.on(Hls.Events.ERROR, (event, data) => {
      this.handleHlsError(data);
    });
  }
  
  /**
   * Handle HLS errors với recovery mechanisms
   */
  handleHlsError(data) {
    this.playbackStats.errors++;
    
    Logger.warn('⚠️ HLS Error:', data);
    
    if (data.fatal) {
      switch (data.type) {
        case window.Hls.ErrorTypes.NETWORK_ERROR:
          Logger.info('🔄 Attempting to recover from network error');
          this.hls.startLoad();
          break;
          
        case window.Hls.ErrorTypes.MEDIA_ERROR:
          Logger.info('🔄 Attempting to recover from media error');
          this.hls.recoverMediaError();
          break;
          
        default:
          Logger.error('💥 Fatal error, destroying HLS instance');
          this.hls.destroy();
          this.emit('fatalError', data);
          break;
      }
    }
  }
  
  /**
   * Load direct video source
   */
  loadDirectSource(url) {
    this.video.src = url;
  }
  
  /**
   * Adapt to network quality changes
   */
  adaptToNetworkQuality(networkQuality) {
    if (!this.hls) return;
    
    const networkConfig = networkMonitor.getVideoConfig();
    
    // Update buffer settings
    this.hls.config.maxBufferLength = networkConfig.bufferSize;
    
    // Adjust quality if in auto mode
    if (this.currentQuality === 'auto') {
      const qualityLevel = this.getQualityLevelFromNetwork(networkQuality);
      if (qualityLevel !== -1) {
        this.hls.nextLevel = qualityLevel;
      }
    }
    
    Logger.info('🎯 Adapted to network quality:', {
      networkQuality,
      bufferSize: networkConfig.bufferSize,
      maxBitrate: networkConfig.maxBitrate
    });
  }
  
  /**
   * Get quality level from network quality
   */
  getQualityLevelFromNetwork(networkQuality) {
    const mapping = {
      'low': 0,
      'medium': 1,
      'high': 2,
      'ultra': 3
    };
    
    return mapping[networkQuality] || -1;
  }
  
  /**
   * Apply quality settings
   */
  applyQualitySettings() {
    if (!this.hls) return;
    
    const qualityLevel = VIDEO_CONFIG.qualityLevels[this.currentQuality];
    
    if (qualityLevel === -1) {
      // Auto quality
      this.hls.currentLevel = -1;
    } else {
      // Fixed quality
      this.hls.currentLevel = qualityLevel;
    }
  }
  
  /**
   * Set video quality
   */
  setQuality(quality) {
    if (!VIDEO_CONFIG.qualityLevels.hasOwnProperty(quality)) {
      Logger.warn('⚠️ Invalid quality level:', quality);
      return;
    }
    
    this.currentQuality = quality;
    this.applyQualitySettings();
    
    Logger.info('🎬 Quality set to:', quality);
    this.emit('qualitySet', quality);
  }
  
  /**
   * Get available quality levels
   */
  getQualityLevels() {
    if (!this.hls || !this.hls.levels) {
      return [];
    }
    
    return this.hls.levels.map((level, index) => ({
      index,
      height: level.height,
      width: level.width,
      bitrate: level.bitrate,
      name: this.getQualityName(level)
    }));
  }
  
  /**
   * Get quality name from level
   */
  getQualityName(level) {
    if (level.height >= 1080) return 'Ultra (1080p)';
    if (level.height >= 720) return 'High (720p)';
    if (level.height >= 480) return 'Medium (480p)';
    return 'Low (360p)';
  }
  
  /**
   * Play video
   */
  async play() {
    try {
      await this.video.play();
      this.emit('playStarted');
    } catch (error) {
      Logger.error('❌ Play failed:', error);
      this.emit('playError', error);
    }
  }
  
  /**
   * Pause video
   */
  pause() {
    this.video.pause();
    this.emit('paused');
  }
  
  /**
   * Seek to time
   */
  seek(time) {
    this.video.currentTime = time;
    this.emit('seeked', time);
  }
  
  /**
   * Set volume
   */
  setVolume(volume) {
    this.video.volume = Math.max(0, Math.min(1, volume));
    this.emit('volumeChanged', this.video.volume);
  }
  
  /**
   * Toggle mute
   */
  toggleMute() {
    this.video.muted = !this.video.muted;
    this.emit('muteToggled', this.video.muted);
  }
  
  /**
   * Enter fullscreen
   */
  async enterFullscreen() {
    try {
      if (this.video.requestFullscreen) {
        await this.video.requestFullscreen();
      } else if (this.video.webkitRequestFullscreen) {
        await this.video.webkitRequestFullscreen();
      }
      this.emit('fullscreenEntered');
    } catch (error) {
      Logger.error('❌ Fullscreen failed:', error);
    }
  }
  
  /**
   * Get playback statistics
   */
  getStats() {
    const currentTime = Date.now();
    const playbackDuration = currentTime - this.playbackStats.startTime;
    
    return {
      ...this.playbackStats,
      playbackDuration,
      currentQuality: this.currentQuality,
      networkInfo: networkMonitor.getNetworkInfo(),
      bufferHealth: this.getBufferHealth()
    };
  }
  
  /**
   * Get buffer health
   */
  getBufferHealth() {
    if (!this.video) return 0;
    
    const buffered = this.video.buffered;
    const currentTime = this.video.currentTime;
    
    if (buffered.length === 0) return 0;
    
    for (let i = 0; i < buffered.length; i++) {
      if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
        return buffered.end(i) - currentTime;
      }
    }
    
    return 0;
  }
  
  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  
  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
  
  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error('❌ Event callback failed:', error);
        }
      });
    }
  }
  
  /**
   * Fallback to basic player
   */
  fallbackToBasicPlayer() {
    Logger.warn('⚠️ Falling back to basic video player');
    
    if (!this.video) {
      this.createVideoElement();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Destroy player
   */
  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    if (this.video) {
      this.video.remove();
      this.video = null;
    }
    
    this.listeners.clear();
    
    Logger.info('🗑️ Video player destroyed');
  }
}

/**
 * Factory function để tạo video player
 */
export function createVideoPlayer(container, options = {}) {
  return new AdvancedVideoPlayer(container, options);
}
