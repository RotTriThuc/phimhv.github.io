/* XemPhim SPA - Modular Architecture */

// Import core modules
import { Logger, isDev } from './modules/logger.js';
import { Api, memoryManager } from './modules/api.js';
import { imageLoader } from './modules/image-loader.js';
import {
  initTheme,
  toggleTheme,
  showNotification,
  debounce,
  getFromStorage,
  setToStorage
} from './modules/utils.js';
import {
  renderLoadingCards,
  createMovieCard,
  listGrid,
  createPagination,
  renderError
} from './modules/ui-components.js';
import { initRouter, registerPageRenderers } from './modules/router.js';

// Import performance optimization modules
import { networkMonitor } from './modules/network-monitor.js';
import { createVideoPlayer } from './modules/video-player.js';
import { videoCacheManager } from './modules/video-cache.js';
import {
  enhancedPerformanceMonitor,
  recordVideoEvent,
  recordApiEvent
} from './modules/performance-monitor-enhanced.js';

// Import page renderers
import {
  renderHome,
  renderSearch,
  renderCombinedFilter,
  renderAllCategories,
  renderSavedMovies
} from './modules/pages.js';

// Import advanced modules
import {
  globalErrorBoundary,
  withErrorBoundary,
  errorBoundaryMonitor
} from './modules/error-boundaries.js';
import {
  performanceMonitor,
  performanceDashboard
} from './modules/performance-monitor.js';
import {
  testFramework,
  performanceTest,
  memoryTest
} from './modules/testing.js';

// Global app state
const AppState = {
  initialized: false,
  currentUser: null,
  theme: 'dark',
  notifications: [],
  cache: new Map()
};

// App initialization
class XemPhimApp {
  constructor() {
    this.initialized = false;
    this.modules = {};
  }

  async init() {
    if (this.initialized) {
      Logger.warn('App already initialized');
      return;
    }

    try {
      Logger.info('🚀 Initializing XemPhim SPA...');

      // Initialize core systems
      await this.initCore();

      // Initialize UI
      await this.initUI();

      // Initialize page renderers
      await this.initPageRenderers();

      // Initialize router
      initRouter();

      // Initialize additional features
      await this.initFeatures();

      this.initialized = true;
      AppState.initialized = true;

      Logger.info('✅ XemPhim SPA initialized successfully');
    } catch (error) {
      Logger.critical('Failed to initialize app:', error);
      this.showFatalError(error);
    }
  }

  async initCore() {
    // Initialize theme
    initTheme();

    // Initialize network monitoring
    try {
      await networkMonitor.init();
      Logger.info('🌐 Network monitoring initialized');

      // Setup network quality change listener
      networkMonitor.addListener((event, data) => {
        if (event === 'qualityChange') {
          showNotification({
            message: `📶 Network quality changed to: ${data.newQuality}`,
            type: 'info',
            duration: 3000
          });
        }
      });
    } catch (error) {
      Logger.warn('⚠️ Network monitoring initialization failed:', error);
    }

    // Initialize video cache manager
    try {
      await videoCacheManager.init();
      Logger.info('💾 Video cache manager initialized');
    } catch (error) {
      Logger.warn('⚠️ Video cache manager initialization failed:', error);
    }

    // Initialize enhanced performance monitoring
    try {
      await enhancedPerformanceMonitor.init();
      Logger.info('📊 Enhanced performance monitoring initialized');

      // Setup performance alerts
      window.addEventListener('performance-alert', (event) => {
        const { category, message, severity } = event.detail;
        showNotification({
          message: `⚠️ Performance Alert: ${message}`,
          type: severity === 'error' ? 'error' : 'warning',
          duration: 5000
        });
      });
    } catch (error) {
      Logger.warn('⚠️ Performance monitoring initialization failed:', error);
    }

    // Initialize memory monitoring
    if (isDev) {
      setInterval(() => {
        memoryManager.checkMemoryUsage();
      }, 30000); // Check every 30 seconds in development
    }

    // Initialize global error handling
    this.initErrorHandling();

    Logger.debug('Core systems initialized');
  }

  async initUI() {
    // Bind header interactions
    this.bindHeader();

    // Initialize notification system
    this.initNotificationSystem();

    // Initialize keyboard shortcuts
    this.initKeyboardShortcuts();

    Logger.debug('UI systems initialized');
  }

  async initPageRenderers() {
    // Wrap page renderers with error boundaries
    const renderers = {
      renderHome: withErrorBoundary(renderHome, {
        onError: (error) => errorBoundaryMonitor.recordError(error, 'HomePage')
      }),
      renderSearch: withErrorBoundary(renderSearch, {
        onError: (error) =>
          errorBoundaryMonitor.recordError(error, 'SearchPage')
      }),
      renderCombinedFilter: withErrorBoundary(renderCombinedFilter, {
        onError: (error) =>
          errorBoundaryMonitor.recordError(error, 'FilterPage')
      }),
      renderAllCategories: withErrorBoundary(renderAllCategories, {
        onError: (error) =>
          errorBoundaryMonitor.recordError(error, 'CategoriesPage')
      }),
      renderSavedMovies: withErrorBoundary(renderSavedMovies, {
        onError: (error) =>
          errorBoundaryMonitor.recordError(error, 'SavedMoviesPage')
      }),
      renderDetail: withErrorBoundary(this.renderDetail.bind(this), {
        onError: (error) =>
          errorBoundaryMonitor.recordError(error, 'DetailPage')
      }),
      renderWatch: withErrorBoundary(this.renderWatch.bind(this), {
        onError: (error) =>
          errorBoundaryMonitor.recordError(error, 'WatchPage')
      })
    };

    registerPageRenderers(renderers);
    Logger.debug('Page renderers registered with error boundaries');
  }

  async initFeatures() {
    // Initialize filters
    await this.populateFilters();

    // Initialize Firebase integration
    if (window.movieComments) {
      try {
        await window.movieComments.init();
        Logger.info('Firebase integration ready');
      } catch (error) {
        Logger.warn('Firebase integration failed:', error);
      }
    }

    // Initialize storage system
    if (window.Storage) {
      Logger.info('Storage system ready');
    }

    // Initialize performance monitoring
    if (isDev) {
      Logger.info('Performance monitoring enabled in development');

      // Run tests after initialization
      setTimeout(() => {
        testFramework.runAllTests();
      }, 3000);

      // Show performance dashboard shortcut hint
      setTimeout(() => {
        showNotification({
          message: '💡 Press Ctrl+Shift+P to open Performance Dashboard',
          type: 'info',
          duration: 5000
        });
      }, 5000);
    }

    Logger.debug('Additional features initialized');
  }

  initErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      Logger.error('Global error:', event.error);
      this.handleGlobalError(event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      Logger.error('Unhandled promise rejection:', event.reason);
      this.handleGlobalError(event.reason);
    });
  }

  handleGlobalError(error) {
    // Don't show error notifications for every error in production
    if (isDev) {
      showNotification({
        message: `Lỗi: ${error.message}`,
        type: 'error',
        duration: 5000
      });
    }
  }

  showFatalError(error) {
    const root = document.getElementById('app');
    if (root) {
      root.innerHTML = `
        <div class="fatal-error">
          <div class="fatal-error__icon">💥</div>
          <div class="fatal-error__title">Ứng dụng gặp lỗi nghiêm trọng</div>
          <div class="fatal-error__message">${error.message}</div>
          <button class="btn btn--primary" onclick="location.reload()">Tải lại trang</button>
        </div>
      `;
    }
  }

  bindHeader() {
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Search form
    const searchForm = document.querySelector('.header__search');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyword = searchForm
          .querySelector('input[name="keyword"]')
          .value.trim();
        if (keyword) {
          window.location.hash = `#/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
        }
      });
    }

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.header__nav');
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('header__nav--open');
      });
    }

    Logger.debug('Header interactions bound');
  }

  initNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.querySelector('.notifications-container')) {
      const container = document.createElement('div');
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }

    // Make showNotification globally available
    window.showNotification = showNotification;

    Logger.debug('Notification system initialized');
  }

  initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + K for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('.header__search input');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // ESC to close modals
      if (event.key === 'Escape') {
        const modal = document.querySelector('.modal');
        if (modal) {
          modal.remove();
        }
      }

      // Ctrl+Shift+P for performance dashboard
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        if (performanceDashboard.isVisible) {
          performanceDashboard.hide();
        } else {
          performanceDashboard.show();
        }
      }

      // Ctrl+Shift+T for test runner (development only)
      if (isDev && event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        testFramework.runAllTests();
      }

      // Ctrl+Shift+E for error boundary report
      if (isDev && event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        errorBoundaryMonitor.printReport();
      }

      // F5 refresh handling for saved movies page
      if (event.key === 'F5' && window.location.hash === '#/phim-da-luu') {
        Logger.debug(
          'F5 pressed on saved movies page - clearing Firebase cache before reload'
        );

        // Clear Firebase cache before page reload
        if (window.Storage) {
          window.Storage._savedMoviesCache = null;
          window.Storage._watchProgressCache = null;
          window.Storage._lastCacheUpdate = 0;
        }
        localStorage.removeItem('savedMovies');
        localStorage.removeItem('watchProgress');
      }
    });

    Logger.debug('Keyboard shortcuts initialized');
  }

  async populateFilters() {
    try {
      // Populate category filter
      const categorySelects = document.querySelectorAll(
        'select[name="category"]'
      );
      if (categorySelects.length > 0) {
        const categories = await Api.getCategories();
        const categoryOptions = categories?.data?.items || [];

        categorySelects.forEach((select) => {
          categoryOptions.forEach((cat) => {
            const option = document.createElement('option');
            option.value = cat.slug;
            option.textContent = cat.name;
            select.appendChild(option);
          });
        });
      }

      // Populate country filter
      const countrySelects = document.querySelectorAll(
        'select[name="country"]'
      );
      if (countrySelects.length > 0) {
        const countries = await Api.getCountries();
        const countryOptions = countries?.data?.items || [];

        countrySelects.forEach((select) => {
          countryOptions.forEach((country) => {
            const option = document.createElement('option');
            option.value = country.slug;
            option.textContent = country.name;
            select.appendChild(option);
          });
        });
      }

      // Populate year filter
      const yearSelects = document.querySelectorAll('select[name="year"]');
      if (yearSelects.length > 0) {
        const currentYear = new Date().getFullYear();
        yearSelects.forEach((select) => {
          for (let year = currentYear; year >= 1990; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
          }
        });
      }

      Logger.debug('Filters populated');
    } catch (error) {
      Logger.warn('Failed to populate filters:', error);
    }
  }

  // Page renderer methods (simplified versions - full implementations would be larger)
  async renderHome(root) {
    root.innerHTML = '<div class="page-loading">Đang tải trang chủ...</div>';

    try {
      // This would contain the full home page rendering logic
      // For now, just a placeholder
      root.innerHTML = `
        <div class="home-page">
          <h1>Trang chủ</h1>
          <p>Đang phát triển...</p>
        </div>
      `;
    } catch (error) {
      Logger.error('Home page render failed:', error);
      root.appendChild(
        renderError('Không thể tải trang chủ', () => this.renderHome(root))
      );
    }
  }

  async renderSearch(root, params) {
    root.innerHTML = '<div class="page-loading">Đang tìm kiếm...</div>';

    try {
      // Search page rendering logic would go here
      root.innerHTML = `
        <div class="search-page">
          <h1>Tìm kiếm</h1>
          <p>Từ khóa: ${params.get('keyword') || 'Không có'}</p>
        </div>
      `;
    } catch (error) {
      Logger.error('Search page render failed:', error);
      root.appendChild(
        renderError('Không thể tải kết quả tìm kiếm', () =>
          this.renderSearch(root, params)
        )
      );
    }
  }

  async renderCombinedFilter(root, params) {
    root.innerHTML = '<div class="page-loading">Đang lọc phim...</div>';

    try {
      // Filter page rendering logic would go here
      root.innerHTML = `
        <div class="filter-page">
          <h1>Lọc phim</h1>
          <p>Đang phát triển...</p>
        </div>
      `;
    } catch (error) {
      Logger.error('Filter page render failed:', error);
      root.appendChild(
        renderError('Không thể tải danh sách lọc', () =>
          this.renderCombinedFilter(root, params)
        )
      );
    }
  }

  async renderAllCategories(root) {
    root.innerHTML = '<div class="page-loading">Đang tải thể loại...</div>';

    try {
      // Categories page rendering logic would go here
      root.innerHTML = `
        <div class="categories-page">
          <h1>Tất cả thể loại</h1>
          <p>Đang phát triển...</p>
        </div>
      `;
    } catch (error) {
      Logger.error('Categories page render failed:', error);
      root.appendChild(
        renderError('Không thể tải danh sách thể loại', () =>
          this.renderAllCategories(root)
        )
      );
    }
  }

  async renderSavedMovies(root) {
    root.innerHTML = '<div class="page-loading">Đang tải phim đã lưu...</div>';

    try {
      // Saved movies page rendering logic would go here
      root.innerHTML = `
        <div class="saved-movies-page">
          <h1>Phim đã lưu</h1>
          <p>Đang phát triển...</p>
        </div>
      `;
    } catch (error) {
      Logger.error('Saved movies page render failed:', error);
      root.appendChild(
        renderError('Không thể tải danh sách phim đã lưu', () =>
          this.renderSavedMovies(root)
        )
      );
    }
  }

  async renderDetail(root, slug) {
    root.innerHTML =
      '<div class="page-loading">Đang tải chi tiết phim...</div>';

    try {
      // Movie detail page rendering logic would go here
      root.innerHTML = `
        <div class="detail-page">
          <h1>Chi tiết phim</h1>
          <p>Slug: ${slug}</p>
        </div>
      `;
    } catch (error) {
      Logger.error('Detail page render failed:', error);
      root.appendChild(
        renderError('Không thể tải chi tiết phim', () =>
          this.renderDetail(root, slug)
        )
      );
    }
  }

  async renderWatch(root, slug, params) {
    const serverIndex = Number(params.get('server') || '0');
    const epSlug = params.get('ep') || '';

    root.innerHTML = '<div class="page-loading">Đang tải trình phát...</div>';

    // Scroll to top for better video focus
    if (window.scrollY > 50) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }

    try {
      // Record video session start
      recordVideoEvent('session_start', {
        movieSlug: slug,
        episodeSlug: epSlug,
        serverIndex: serverIndex
      });

      // Fetch movie data with enhanced API
      const movieData = await Api.getMovie(slug);
      if (!movieData?.data?.item) {
        throw new Error('Movie data not found');
      }

      const movie = movieData.data.item;
      const episodes = movie.episodes || [];

      if (episodes.length === 0) {
        throw new Error('No episodes available');
      }

      // Find current episode and server
      const currentEpisode = episodes.find((ep) =>
        ep.server_data?.some(
          (server) => server.slug === epSlug || server.name === epSlug
        )
      );

      if (!currentEpisode) {
        throw new Error('Episode not found');
      }

      const server =
        currentEpisode.server_data[serverIndex] ||
        currentEpisode.server_data[0];
      if (!server) {
        throw new Error('Server not found');
      }

      // Create enhanced watch page layout
      root.innerHTML = `
        <div class="watch-page">
          <div class="watch-header">
            <h1 class="watch-title">${movie.name}</h1>
            <div class="watch-meta">
              <span class="episode-info">Tập ${server.name}</span>
              <span class="server-info">Server ${serverIndex + 1}</span>
              <div class="network-status" id="network-status">
                <span class="network-indicator">📶</span>
                <span class="network-text">Đang kiểm tra...</span>
              </div>
            </div>
          </div>

          <div class="video-container" id="video-container">
            <div class="video-loading">
              <div class="loading-spinner"></div>
              <p>Đang tải video...</p>
            </div>
          </div>

          <div class="video-controls-panel">
            <div class="quality-selector" id="quality-selector" style="display: none;">
              <label>Chất lượng:</label>
              <select id="quality-select">
                <option value="auto">Tự động</option>
                <option value="high">Cao (720p+)</option>
                <option value="medium">Trung bình (480p)</option>
                <option value="low">Thấp (360p)</option>
              </select>
            </div>

            <div class="performance-info" id="performance-info">
              <div class="perf-item">
                <span class="perf-label">Băng thông:</span>
                <span class="perf-value" id="bandwidth-value">--</span>
              </div>
              <div class="perf-item">
                <span class="perf-label">Buffer:</span>
                <span class="perf-value" id="buffer-value">--</span>
              </div>
              <div class="perf-item">
                <span class="perf-label">Cache:</span>
                <span class="perf-value" id="cache-value">--</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Initialize enhanced video player
      await this.initializeEnhancedVideoPlayer(
        server,
        movie,
        epSlug,
        serverIndex
      );

      // Update network status display
      this.updateNetworkStatusDisplay();

      // Setup performance monitoring for this video session
      this.setupVideoPerformanceMonitoring(slug, epSlug);
    } catch (error) {
      Logger.error('Watch page render failed:', error);
      recordVideoEvent('session_error', {
        movieSlug: slug,
        episodeSlug: epSlug,
        error: error.message
      });

      root.appendChild(
        renderError('Không thể tải trình phát', () =>
          this.renderWatch(root, slug, params)
        )
      );
    }
  }

  async initializeEnhancedVideoPlayer(server, movie, epSlug, serverIndex) {
    const container = document.getElementById('video-container');
    if (!container) return;

    try {
      // Create advanced video player
      const videoPlayer = createVideoPlayer(container, {
        ui: {
          showQualitySelector: true,
          showSpeedControl: true,
          showVolumeControl: true,
          showFullscreenButton: true,
          showPictureInPicture: true
        }
      });

      // Setup video player event listeners
      videoPlayer.on('loadedmetadata', () => {
        recordVideoEvent('video_loaded', {
          movieSlug: movie.slug,
          episodeSlug: epSlug,
          duration: videoPlayer.video?.duration || 0
        });

        // Show quality selector
        const qualitySelector = document.getElementById('quality-selector');
        if (qualitySelector) {
          qualitySelector.style.display = 'block';
        }
      });

      videoPlayer.on('qualityChanged', (data) => {
        recordVideoEvent('quality_changed', {
          movieSlug: movie.slug,
          episodeSlug: epSlug,
          newQuality: data.level,
          reason: 'user_selection'
        });
      });

      videoPlayer.on('error', (error) => {
        recordVideoEvent('playback_error', {
          movieSlug: movie.slug,
          episodeSlug: epSlug,
          error: error.message
        });
      });

      // Load video source
      if (server.link_m3u8) {
        await videoPlayer.loadSource(server.link_m3u8);
      } else if (server.link_embed) {
        // Fallback to iframe embed
        container.innerHTML = `
          <iframe
            src="${server.link_embed}"
            allowfullscreen
            referrerpolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture">
          </iframe>
        `;
      } else {
        throw new Error('No video source available');
      }

      // Setup quality selector
      this.setupQualitySelector(videoPlayer);

      // Start performance monitoring
      this.startVideoPerformanceTracking(videoPlayer);
    } catch (error) {
      Logger.error('Video player initialization failed:', error);
      container.innerHTML = `
        <div class="video-error">
          <h3>Không thể phát video</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" class="retry-btn">Thử lại</button>
        </div>
      `;
    }
  }

  setupQualitySelector(videoPlayer) {
    const qualitySelect = document.getElementById('quality-select');
    if (!qualitySelect) return;

    qualitySelect.addEventListener('change', (e) => {
      const selectedQuality = e.target.value;
      videoPlayer.setQuality(selectedQuality);

      showNotification({
        message: `Đã chuyển chất lượng video: ${selectedQuality}`,
        type: 'success',
        duration: 2000
      });
    });

    // Set initial quality based on network conditions
    const networkInfo = networkMonitor.getNetworkInfo();
    const recommendedQuality = networkInfo.quality || 'auto';
    qualitySelect.value = recommendedQuality;
    videoPlayer.setQuality(recommendedQuality);
  }

  updateNetworkStatusDisplay() {
    const networkStatus = document.getElementById('network-status');
    if (!networkStatus) return;

    const updateStatus = () => {
      const networkInfo = networkMonitor.getNetworkInfo();
      const indicator = networkStatus.querySelector('.network-indicator');
      const text = networkStatus.querySelector('.network-text');

      if (indicator && text) {
        const qualityIcons = {
          ultra: '📶',
          high: '📶',
          medium: '📶',
          low: '📶'
        };

        indicator.textContent = qualityIcons[networkInfo.quality] || '📶';
        text.textContent = `${networkInfo.quality} (${networkInfo.bandwidth.toFixed(1)} Mbps)`;

        // Update performance info
        this.updatePerformanceInfo(networkInfo);
      }
    };

    // Update immediately and then every 5 seconds
    updateStatus();
    setInterval(updateStatus, 5000);
  }

  updatePerformanceInfo(networkInfo) {
    const bandwidthValue = document.getElementById('bandwidth-value');
    const bufferValue = document.getElementById('buffer-value');
    const cacheValue = document.getElementById('cache-value');

    if (bandwidthValue) {
      bandwidthValue.textContent = `${networkInfo.bandwidth.toFixed(1)} Mbps`;
    }

    if (bufferValue) {
      bufferValue.textContent = `${networkInfo.latency.toFixed(0)}ms`;
    }

    if (cacheValue) {
      const cacheStats = videoCacheManager.getStats();
      cacheValue.textContent = cacheStats.cacheUsage;
    }
  }

  setupVideoPerformanceMonitoring(slug, epSlug) {
    // Monitor video performance metrics
    setInterval(() => {
      const performanceData = enhancedPerformanceMonitor.getPerformanceData();

      // Update UI with performance data
      this.updatePerformanceInfo(performanceData.realTimeStats);

      // Record performance metrics
      recordVideoEvent('performance_snapshot', {
        movieSlug: slug,
        episodeSlug: epSlug,
        ...performanceData.realTimeStats
      });
    }, 10000); // Every 10 seconds
  }

  startVideoPerformanceTracking(videoPlayer) {
    setInterval(() => {
      if (videoPlayer && videoPlayer.video) {
        const bufferHealth = videoPlayer.getBufferHealth();
        const stats = videoPlayer.getStats();

        // Record buffer health
        recordVideoEvent('buffer_health', {
          value: bufferHealth,
          ...stats
        });

        // Update buffer display
        const bufferValue = document.getElementById('buffer-value');
        if (bufferValue) {
          bufferValue.textContent = `${bufferHealth.toFixed(1)}s`;
        }
      }
    }, 5000); // Every 5 seconds
  }
}

// Initialize app when DOM is ready
const app = new XemPhimApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Make app globally available for debugging
if (isDev) {
  window.XemPhimApp = app;
  window.AppState = AppState;
  window.Logger = Logger;
  window.performanceMonitor = performanceMonitor;
  window.performanceDashboard = performanceDashboard;
  window.errorBoundaryMonitor = errorBoundaryMonitor;
  window.testFramework = testFramework;
  window.memoryTest = memoryTest;
  window.performanceTest = performanceTest;

  Logger.info('🛠️ Development tools available on window object');
}

// Export for potential module usage
export default app;
