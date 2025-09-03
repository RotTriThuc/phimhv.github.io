/* Hard Refresh Manager - Tích hợp tính năng hard refresh cho phím F5 */

/**
 * HardRefreshManager - Quản lý tính năng hard refresh hoàn toàn
 * 
 * Tính năng:
 * - Hard refresh khi nhấn F5 (thay vì soft refresh)
 * - Xóa toàn bộ cache (Cache API, Service Worker, localStorage)
 * - Hỗ trợ mobile browsers với alternative triggers
 * - Fallback cho browsers không hỗ trợ
 * - Visual feedback và error handling
 */
class HardRefreshManager {
  constructor() {
    this.isInitialized = false;
    this.isRefreshing = false;
    this.debounceTimeout = null;
    this.supportedFeatures = this.checkBrowserSupport();
    
    // Configuration
    this.config = {
      debounceDelay: 200, // Giảm từ 500ms xuống 200ms để responsive hơn
      confirmationEnabled: false, // Có hiện confirmation dialog không
      showProgress: true, // Hiện progress indicator
      clearLocalStorage: true, // Có xóa localStorage không
      clearSessionStorage: true, // Có xóa sessionStorage không
      clearIndexedDB: false, // Có xóa IndexedDB không (nguy hiểm)
      enableMobileSupport: true, // Hỗ trợ mobile triggers
      enableVisualFeedback: true, // Visual feedback khi refresh
      fastMode: true, // Fast mode: parallel operations, shorter timeouts
      skipServiceWorker: false, // Skip SW notification để nhanh hơn
      maxCacheTimeout: 3000 // Max time để wait cho cache clearing (3s)
    };

    this.init();
  }

  /**
   * Kiểm tra browser support cho các tính năng cần thiết
   */
  checkBrowserSupport() {
    return {
      cacheAPI: 'caches' in window,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      indexedDB: 'indexedDB' in window,
      fetch: 'fetch' in window,
      promises: 'Promise' in window
    };
  }

  /**
   * Initialize hard refresh manager
   */
  init() {
    if (this.isInitialized) {
      console.warn('🔄 HardRefreshManager already initialized');
      return;
    }

    try {
      this.setupKeyboardListeners();
      
      if (this.config.enableMobileSupport) {
        this.setupMobileSupport();
      }
      
      this.setupServiceWorkerCommunication();
      this.createProgressIndicator();
      
      this.isInitialized = true;
      console.log('✅ HardRefreshManager initialized successfully');
      console.log('🔧 Supported features:', this.supportedFeatures);
      
    } catch (error) {
      console.error('❌ Failed to initialize HardRefreshManager:', error);
    }
  }

  /**
   * Setup keyboard event listeners cho F5 và các phím khác
   */
  setupKeyboardListeners() {
    // F5 key (keyCode 116)
    document.addEventListener('keydown', (event) => {
      // F5 key
      if (event.keyCode === 116 || event.key === 'F5') {
        event.preventDefault();
        event.stopPropagation();
        this.triggerHardRefresh('f5-key');
        return false;
      }
      
      // Ctrl+Shift+R (alternative hard refresh)
      if (event.ctrlKey && event.shiftKey && (event.keyCode === 82 || event.key === 'R')) {
        event.preventDefault();
        event.stopPropagation();
        this.triggerHardRefresh('ctrl-shift-r');
        return false;
      }
      
      // Ctrl+F5 (Windows style hard refresh)
      if (event.ctrlKey && (event.keyCode === 116 || event.key === 'F5')) {
        event.preventDefault();
        event.stopPropagation();
        this.triggerHardRefresh('ctrl-f5');
        return false;
      }
    }, { capture: true, passive: false });

    console.log('⌨️ Keyboard listeners setup: F5, Ctrl+Shift+R, Ctrl+F5');
  }

  /**
   * Setup mobile support với alternative triggers
   */
  setupMobileSupport() {
    // Touch gesture support (pull down từ top)
    let touchStartY = 0;
    let touchStartTime = 0;
    let isAtTop = false;

    document.addEventListener('touchstart', (event) => {
      touchStartY = event.touches[0].clientY;
      touchStartTime = Date.now();
      isAtTop = window.scrollY === 0;
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
      if (!isAtTop) return;
      
      const touchCurrentY = event.touches[0].clientY;
      const touchDelta = touchCurrentY - touchStartY;
      const touchTime = Date.now() - touchStartTime;
      
      // Pull down gesture: > 100px trong < 1s từ top của page
      if (touchDelta > 100 && touchTime < 1000 && window.scrollY === 0) {
        // Thêm visual feedback
        this.showPullToRefreshIndicator();
      }
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (!isAtTop) return;
      
      const touchEndY = event.changedTouches[0].clientY;
      const touchDelta = touchEndY - touchStartY;
      const touchTime = Date.now() - touchStartTime;
      
      // Trigger hard refresh nếu pull down đủ mạnh
      if (touchDelta > 150 && touchTime < 1500 && window.scrollY === 0) {
        this.triggerHardRefresh('pull-to-refresh');
      }
      
      this.hidePullToRefreshIndicator();
    }, { passive: true });

    // Long press support (3 fingers)
    let longPressTimer = null;
    
    document.addEventListener('touchstart', (event) => {
      if (event.touches.length === 3) {
        longPressTimer = setTimeout(() => {
          this.triggerHardRefresh('three-finger-long-press');
        }, 2000); // 2 seconds long press
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });

    console.log('📱 Mobile support enabled: pull-to-refresh, 3-finger long press');
  }

  /**
   * Setup Service Worker communication
   */
  setupServiceWorkerCommunication() {
    if (!this.supportedFeatures.serviceWorker) {
      console.warn('⚠️ Service Worker not supported, cache clearing will be limited');
      return;
    }

    // Listen for messages từ Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'HARD_REFRESH_RESPONSE') {
        console.log('📨 Service Worker response:', event.data);
        
        if (event.data.success) {
          console.log('✅ Service Worker cache cleared successfully');
        } else {
          console.warn('⚠️ Service Worker cache clearing failed:', event.data.error);
        }
      }
    });

    console.log('🔗 Service Worker communication setup complete');
  }

  /**
   * Tạo progress indicator cho visual feedback
   */
  createProgressIndicator() {
    if (!this.config.enableVisualFeedback) return;

    const indicator = document.createElement('div');
    indicator.id = 'hard-refresh-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 16px;
      z-index: 10000;
      display: none;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    `;

    indicator.innerHTML = `
      <div style="margin-bottom: 10px;">🔄</div>
      <div>Đang thực hiện Hard Refresh...</div>
      <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">Vui lòng đợi</div>
    `;

    document.body.appendChild(indicator);
    console.log('🎨 Progress indicator created');
  }

  /**
   * Main trigger method cho hard refresh
   */
  triggerHardRefresh(source = 'unknown') {
    // Immediate check để tránh multiple calls
    if (this.isRefreshing) {
      console.warn(`🔄 Hard refresh already in progress, ignoring trigger from: ${source}`);
      return;
    }

    // Debouncing để tránh multiple rapid calls
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      // Double check trước khi execute
      if (!this.isRefreshing) {
        this.performHardRefresh(source);
      } else {
        console.warn(`🔄 Hard refresh started by another trigger, skipping: ${source}`);
      }
    }, this.config.debounceDelay);
  }

  /**
   * Thực hiện hard refresh chính
   */
  async performHardRefresh(source = 'unknown') {
    if (this.isRefreshing) {
      console.warn('🔄 Hard refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;
    console.log(`🚀 Starting hard refresh (triggered by: ${source})`);

    // Timeout protection để tự động reset nếu bị stuck
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Hard refresh timeout, auto-resetting state...');
      this.isRefreshing = false;
      this.hideProgressIndicator();
    }, 30000); // 30 seconds timeout

    try {
      // Show progress indicator
      this.showProgressIndicator();

      // Confirmation dialog nếu enabled
      if (this.config.confirmationEnabled) {
        const confirmed = await this.showConfirmationDialog();
        if (!confirmed) {
          this.hideProgressIndicator();
          this.isRefreshing = false;
          clearTimeout(timeoutId);
          return;
        }
      }

      // Fast mode: Tối ưu hóa performance
      if (this.config.fastMode) {
        console.log('⚡ Fast mode: Quick cache clearing...');

        // Start operations in parallel với timeout ngắn
        const clearPromises = [
          this.clearAllCaches().catch(err => console.warn('Cache:', err.message)),
          this.clearStorages().catch(err => console.warn('Storage:', err.message))
        ];

        // Chỉ thêm SW notification nếu không skip
        if (!this.config.skipServiceWorker) {
          clearPromises.push(
            this.notifyServiceWorker().catch(err => console.warn('SW:', err.message))
          );
        }

        // Race với timeout để không chờ quá lâu
        try {
          await Promise.race([
            Promise.allSettled(clearPromises),
            new Promise(resolve => setTimeout(resolve, this.config.maxCacheTimeout))
          ]);
          console.log('✅ Fast clearing completed');
        } catch (error) {
          console.warn('⚠️ Fast clearing timeout, proceeding with reload...');
        }
      } else {
        // Standard mode: Đầy đủ nhưng chậm hơn
        console.log('🚀 Standard cache clearing...');

        const clearPromises = [
          this.clearAllCaches().catch(err => console.warn('Cache clearing failed:', err)),
          this.clearStorages().catch(err => console.warn('Storage clearing failed:', err)),
          this.notifyServiceWorker().catch(err => console.warn('SW notification failed:', err))
        ];

        try {
          await Promise.allSettled(clearPromises);
          console.log('✅ All clearing operations completed');
        } catch (error) {
          console.warn('⚠️ Some clearing operations failed, continuing with reload...');
        }
      }

      console.log('🔄 Reloading page...');
      // Clear timeout trước khi reload
      clearTimeout(timeoutId);

      // Reload với cache busting
      this.reloadWithCacheBusting();

    } catch (error) {
      console.error('❌ Hard refresh failed:', error);
      clearTimeout(timeoutId);
      this.hideProgressIndicator();
      this.showErrorNotification(error);
      this.fallbackRefresh();
    } finally {
      // Ensure timeout is cleared và flag is reset
      clearTimeout(timeoutId);
      this.isRefreshing = false;
    }
  }

  /**
   * Clear cache một cách thông minh và nhanh chóng
   */
  async clearAllCaches() {
    if (!this.supportedFeatures.cacheAPI) {
      console.warn('⚠️ Cache API not supported, skipping cache clearing');
      return;
    }

    try {
      console.log('🗑️ Fast cache clearing...');
      const cacheNames = await caches.keys();

      if (cacheNames.length === 0) {
        console.log('📭 No caches to clear');
        return;
      }

      // Clear caches in parallel với timeout cho mỗi cache
      const clearPromises = cacheNames.map(async (cacheName) => {
        return Promise.race([
          caches.delete(cacheName).then(() => {
            console.log(`✅ Cleared: ${cacheName}`);
            return true;
          }),
          // Timeout sau 2 seconds cho mỗi cache
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout clearing ${cacheName}`)), 2000)
          )
        ]).catch(error => {
          console.warn(`⚠️ Failed to clear ${cacheName}:`, error.message);
          return false;
        });
      });

      const results = await Promise.allSettled(clearPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      console.log(`✅ Cleared ${successCount}/${cacheNames.length} caches`);

    } catch (error) {
      console.error('❌ Failed to clear Cache API:', error);
      // Don't throw - continue with other operations
    }
  }

  /**
   * Clear storages nhanh chóng và an toàn
   */
  async clearStorages() {
    try {
      console.log('🗑️ Fast storage clearing...');

      // Parallel storage clearing
      const storagePromises = [];

      // Clear localStorage (nếu enabled)
      if (this.config.clearLocalStorage && this.supportedFeatures.localStorage) {
        storagePromises.push(
          Promise.resolve().then(() => {
            const criticalData = this.backupCriticalData();
            localStorage.clear();
            this.restoreCriticalData(criticalData);
            console.log('✅ localStorage cleared');
          }).catch(error => {
            console.warn('⚠️ localStorage clear failed:', error);
          })
        );
      }

      // Clear sessionStorage (nếu enabled)
      if (this.config.clearSessionStorage && this.supportedFeatures.sessionStorage) {
        storagePromises.push(
          Promise.resolve().then(() => {
            sessionStorage.clear();
            console.log('✅ sessionStorage cleared');
          }).catch(error => {
            console.warn('⚠️ sessionStorage clear failed:', error);
          })
        );
      }

      // Skip IndexedDB clearing by default (too slow and risky)
      if (this.config.clearIndexedDB && this.supportedFeatures.indexedDB) {
        console.log('⚠️ Skipping IndexedDB clearing for performance (enable manually if needed)');
      }

      // Wait for all storage operations (should be very fast)
      await Promise.allSettled(storagePromises);
      console.log('✅ Storage clearing completed');

    } catch (error) {
      console.error('❌ Failed to clear storages:', error);
      // Don't throw - continue with other operations
    }
  }

  /**
   * Backup critical data trước khi clear localStorage
   */
  backupCriticalData() {
    const criticalKeys = ['theme', 'user-preferences', 'auth-token'];
    const backup = {};

    criticalKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          backup[key] = value;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to backup ${key}:`, error);
      }
    });

    return backup;
  }

  /**
   * Restore critical data sau khi clear localStorage
   */
  restoreCriticalData(backup) {
    Object.entries(backup).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn(`⚠️ Failed to restore ${key}:`, error);
      }
    });
  }

  /**
   * Clear IndexedDB (nguy hiểm - chỉ dùng khi thực sự cần)
   */
  async clearIndexedDB() {
    if (!this.supportedFeatures.indexedDB) return;

    try {
      // Lấy danh sách databases
      const databases = await indexedDB.databases();

      const deletePromises = databases.map(db => {
        return new Promise((resolve, reject) => {
          const deleteReq = indexedDB.deleteDatabase(db.name);
          deleteReq.onsuccess = () => resolve(db.name);
          deleteReq.onerror = () => reject(deleteReq.error);
        });
      });

      await Promise.all(deletePromises);
      console.log(`✅ Cleared ${databases.length} IndexedDB databases`);

    } catch (error) {
      console.error('❌ Failed to clear IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Gửi message đến Service Worker với timeout ngắn
   */
  async notifyServiceWorker() {
    if (!this.supportedFeatures.serviceWorker) {
      console.warn('⚠️ Service Worker not supported, skipping SW cache clearing');
      return;
    }

    try {
      // Timeout ngắn để không block quá lâu
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SW ready timeout')), 1000)
        )
      ]);

      if (registration.active) {
        console.log('📨 Fast SW notification...');

        registration.active.postMessage({
          type: 'HARD_REFRESH_REQUEST',
          timestamp: Date.now()
        });

        // Wait for response với timeout ngắn hơn (2s thay vì 5s)
        await this.waitForServiceWorkerResponse(2000);

      } else {
        console.warn('⚠️ No active Service Worker found');
      }

    } catch (error) {
      console.warn('⚠️ SW notification failed (continuing anyway):', error.message);
      // Don't throw - SW clearing is optional
    }
  }

  /**
   * Wait for Service Worker response với timeout
   */
  waitForServiceWorkerResponse(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Service Worker response timeout'));
      }, timeout);

      const messageHandler = (event) => {
        if (event.data && event.data.type === 'HARD_REFRESH_RESPONSE') {
          clearTimeout(timeoutId);
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          resolve(event.data);
        }
      };

      navigator.serviceWorker.addEventListener('message', messageHandler);
    });
  }

  /**
   * Fast reload với cache busting
   */
  reloadWithCacheBusting() {
    try {
      console.log('🚀 Fast reload...');

      // Reset flag trước khi reload để tránh stuck state
      this.isRefreshing = false;

      // Fastest method: Direct location change với cache busting
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 5); // Shorter random string

      // Simple cache busting - chỉ thêm timestamp
      const separator = window.location.href.includes('?') ? '&' : '?';
      const newUrl = `${window.location.href}${separator}_hr=${timestamp}&_cb=${random}`;

      // Immediate redirect - fastest method
      window.location.href = newUrl;

    } catch (error) {
      console.error('❌ Fast reload failed:', error);
      this.isRefreshing = false;

      // Simple fallback
      try {
        window.location.reload();
      } catch (fallbackError) {
        console.error('❌ Fallback reload failed:', fallbackError);
        // Last resort
        window.location = window.location;
      }
    }
  }

  /**
   * Fallback refresh method cho old browsers
   */
  fallbackRefresh() {
    console.log('🔄 Using fallback refresh method...');

    // Reset flag để tránh stuck state
    this.isRefreshing = false;

    try {
      // Method 1: Simple reload với cache busting
      if ('location' in window && 'reload' in window.location) {
        // Thêm timestamp để force reload
        const url = new URL(window.location.href);
        url.searchParams.set('_fallbackRefresh', Date.now());
        window.location.href = url.toString();
      }
      // Method 2: Direct redirect
      else if ('location' in window) {
        const timestamp = Date.now();
        window.location.href = `${window.location.href}?_refresh=${timestamp}`;
      }
      // Method 3: History API
      else if ('history' in window && 'go' in window.history) {
        window.history.go(0);
      }
      // Method 4: Last resort
      else {
        try {
          document.location.reload();
        } catch (docError) {
          // Absolute last resort
          window.location = window.location;
        }
      }

    } catch (error) {
      console.error('❌ All refresh methods failed:', error);
      this.isRefreshing = false; // Ensure flag is reset

      // Show user-friendly error
      this.showErrorNotification(new Error('Không thể refresh trang tự động. Vui lòng nhấn F5 thủ công.'));

      // Try one more time with basic method
      setTimeout(() => {
        try {
          window.location.reload();
        } catch (finalError) {
          console.error('Final reload attempt failed:', finalError);
        }
      }, 1000);
    }
  }

  /**
   * Show progress indicator
   */
  showProgressIndicator() {
    if (!this.config.showProgress) return;

    const indicator = document.getElementById('hard-refresh-indicator');
    if (indicator) {
      indicator.style.display = 'block';

      // Animation effect
      indicator.style.opacity = '0';
      indicator.style.transform = 'translate(-50%, -50%) scale(0.8)';

      requestAnimationFrame(() => {
        indicator.style.transition = 'all 0.3s ease';
        indicator.style.opacity = '1';
        indicator.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    }
  }

  /**
   * Hide progress indicator
   */
  hideProgressIndicator() {
    const indicator = document.getElementById('hard-refresh-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translate(-50%, -50%) scale(0.8)';

      setTimeout(() => {
        indicator.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Show confirmation dialog
   */
  async showConfirmationDialog() {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      dialog.innerHTML = `
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          margin: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        ">
          <div style="font-size: 48px; margin-bottom: 15px;">🔄</div>
          <h3 style="margin: 0 0 15px 0; color: #333;">Hard Refresh</h3>
          <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">
            Bạn có chắc muốn thực hiện hard refresh?<br>
            Điều này sẽ xóa toàn bộ cache và reload trang.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="confirm-yes" style="
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            ">Có, thực hiện</button>
            <button id="confirm-no" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            ">Hủy</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const yesBtn = dialog.querySelector('#confirm-yes');
      const noBtn = dialog.querySelector('#confirm-no');

      const cleanup = () => {
        document.body.removeChild(dialog);
      };

      yesBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      noBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // ESC key để cancel
      const escHandler = (event) => {
        if (event.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }

  /**
   * Show error notification
   */
  showErrorNotification(error) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 10002;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">❌ Hard Refresh Failed</div>
      <div style="font-size: 12px; opacity: 0.9;">${error.message || 'Unknown error'}</div>
    `;

    document.body.appendChild(notification);

    // Auto remove sau 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }
    }, 5000);
  }

  /**
   * Show pull-to-refresh indicator cho mobile
   */
  showPullToRefreshIndicator() {
    let indicator = document.getElementById('pull-to-refresh-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pull-to-refresh-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 123, 255, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        z-index: 9999;
        display: none;
        backdrop-filter: blur(10px);
      `;

      indicator.innerHTML = '⬇️ Kéo xuống để Hard Refresh';
      document.body.appendChild(indicator);
    }

    indicator.style.display = 'block';
    indicator.style.opacity = '1';
  }

  /**
   * Hide pull-to-refresh indicator
   */
  hidePullToRefreshIndicator() {
    const indicator = document.getElementById('pull-to-refresh-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 200);
    }
  }

  /**
   * Public API methods
   */

  // Enable/disable confirmation dialog
  setConfirmationEnabled(enabled) {
    this.config.confirmationEnabled = enabled;
    console.log(`🔧 Confirmation dialog ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Enable/disable mobile support
  setMobileSupport(enabled) {
    this.config.enableMobileSupport = enabled;
    console.log(`📱 Mobile support ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Enable/disable fast mode
  setFastMode(enabled) {
    this.config.fastMode = enabled;
    if (enabled) {
      this.config.debounceDelay = 100; // Faster debounce
      this.config.maxCacheTimeout = 2000; // Shorter timeout
    } else {
      this.config.debounceDelay = 500; // Standard debounce
      this.config.maxCacheTimeout = 5000; // Longer timeout
    }
    console.log(`⚡ Fast mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Skip Service Worker notification (for speed)
  setSkipServiceWorker(skip) {
    this.config.skipServiceWorker = skip;
    console.log(`📨 Service Worker notification ${skip ? 'disabled' : 'enabled'}`);
  }

  // Manual trigger method
  async manualRefresh() {
    console.log('🔄 Manual hard refresh triggered');
    await this.performHardRefresh('manual');
  }

  // Reset state (for debugging)
  resetState() {
    console.log('🔧 Resetting HardRefreshManager state...');
    this.isRefreshing = false;
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.hideProgressIndicator();
    console.log('✅ State reset complete');
  }

  // Force refresh (bypass all checks)
  async forceRefresh() {
    console.log('⚡ Force refresh triggered (bypassing all checks)');
    this.isRefreshing = false; // Reset flag
    await this.performHardRefresh('force');
  }

  // Get current status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRefreshing: this.isRefreshing,
      supportedFeatures: this.supportedFeatures,
      config: { ...this.config },
      debounceActive: !!this.debounceTimeout
    };
  }

  // Destroy instance
  destroy() {
    console.log('🗑️ Destroying HardRefreshManager...');

    // Remove event listeners
    document.removeEventListener('keydown', this.keydownHandler);

    // Remove UI elements
    const indicator = document.getElementById('hard-refresh-indicator');
    if (indicator) indicator.remove();

    const pullIndicator = document.getElementById('pull-to-refresh-indicator');
    if (pullIndicator) pullIndicator.remove();

    // Clear timeouts
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.isInitialized = false;
    console.log('✅ HardRefreshManager destroyed');
  }
}

// Export cho sử dụng
export { HardRefreshManager };

// Global access
window.HardRefreshManager = HardRefreshManager;
