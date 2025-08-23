/* PWA Install Component */
/* Beautiful PWA install button with full functionality */

(function() {
  'use strict';

  class PWAInstaller {
    constructor() {
      this.deferredPrompt = null;
      this.isInstalled = false;
      this.installButton = null;
      this.init();
    }

    init() {
      // Check if already installed
      this.checkInstallationStatus();
      
      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallButton();
      });

      // Listen for appinstalled event
      window.addEventListener('appinstalled', () => {
        console.log('🎉 PWA was installed successfully!');
        this.isInstalled = true;
        this.hideInstallButton();
        this.showInstalledNotification();
      });

      // Create install button
      this.createInstallButton();
      
      // Always show button for testing (even without beforeinstallprompt)
      setTimeout(() => {
        if (this.installButton && this.installButton.style.display === 'none') {
          console.log('🔧 Force showing PWA button (no beforeinstallprompt event)');
          this.forceShowButton();
        }
      }, 3000);
    }

    checkInstallationStatus() {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        this.isInstalled = true;
        return;
      }

      // Check if running as PWA on mobile
      if (window.navigator && window.navigator.standalone) {
        this.isInstalled = true;
        return;
      }

      // Check if installed via related applications
      if ('getInstalledRelatedApps' in navigator) {
        navigator.getInstalledRelatedApps()
          .then(relatedApps => {
            if (relatedApps.length > 0) {
              this.isInstalled = true;
              this.hideInstallButton();
            }
          })
          .catch(err => console.log('Error checking installed apps:', err));
      }
    }

    createInstallButton() {
      // Don't create button if already installed
      if (this.isInstalled) {
        console.log('📱 PWA already installed, button not needed');
        return;
      }

      console.log('🎨 Creating PWA install button...');
      const button = document.createElement('button');
      button.className = 'pwa-install-btn';
      button.innerHTML = `
        <span class="pwa-install-icon">📱</span>
        <span class="pwa-install-text">Cài đặt App</span>
      `;
      
      button.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(45deg, #00b894, #00a085);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 184, 148, 0.3);
        white-space: nowrap;
        z-index: 100;
        position: relative;
        overflow: hidden;
      `;

      // Hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px) scale(1.05)';
        button.style.boxShadow = '0 4px 16px rgba(0, 184, 148, 0.4)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 2px 8px rgba(0, 184, 148, 0.3)';
      });

      // Click handler
      button.addEventListener('click', () => this.installPWA());

      this.installButton = button;

      // Add to header actions
      this.addToHeader();
      
      // Force show after a short delay for testing
      setTimeout(() => {
        this.forceShowButton();
      }, 1000);
    }

    addToHeader() {
      // Wait for header to be ready
      const addToHeaderWhenReady = () => {
        const headerActions = document.querySelector('.header__actions');
        console.log('🔍 Looking for header actions:', headerActions);
        
        if (headerActions && this.installButton) {
          headerActions.insertBefore(this.installButton, headerActions.firstChild);
          console.log('📱 PWA install button added to header');
          
          // Force show button immediately for testing
          this.installButton.style.display = 'flex';
          console.log('👀 PWA button forced visible for testing');
        } else {
          console.log('⏳ Header not ready, retrying...');
          setTimeout(addToHeaderWhenReady, 100);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addToHeaderWhenReady);
      } else {
        addToHeaderWhenReady();
      }
    }

    showInstallButton() {
      if (this.installButton && !this.isInstalled) {
        this.installButton.style.display = 'flex';
        
        // Animate in
        setTimeout(() => {
          this.installButton.style.animation = 'slideInRight 0.5s ease-out';
        }, 100);

        console.log('📱 PWA install button is now visible');
      }
    }
    
    // Force show button for testing
    forceShowButton() {
      if (this.installButton) {
        this.installButton.style.display = 'flex';
        console.log('🔧 PWA button forced to show');
      }
    }

    hideInstallButton() {
      if (this.installButton) {
        this.installButton.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          this.installButton.style.display = 'none';
        }, 300);
      }
    }

    async installPWA() {
      console.log('🚀 PWA install triggered');
      
      if (!this.deferredPrompt) {
        console.log('ℹ️ No install prompt available, showing manual guide');
        this.showManualInstallGuide();
        return;
      }

      try {
        console.log('📋 Showing browser install prompt...');
        
        // Show install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
          console.log('🎉 User accepted the install prompt');
          this.showInstallationProgress();
        } else {
          console.log('😔 User dismissed the install prompt');
          this.showInstallationDeclined();
        }

        // Reset the prompt
        this.deferredPrompt = null;

      } catch (error) {
        console.error('❌ Error during PWA installation:', error);
        this.showInstallationError();
        
        // Fallback: Show manual guide
        setTimeout(() => {
          this.showManualInstallGuide();
        }, 2000);
      }
    }

    showInstallationProgress() {
      const notification = this.createNotification(
        '⏳',
        'Đang cài đặt...',
        'Ứng dụng đang được cài đặt lên thiết bị của bạn',
        3000
      );
    }

    showInstallationDeclined() {
      const notification = this.createNotification(
        '💡',
        'Cài đặt sau',
        'Bạn có thể cài đặt ứng dụng bất cứ lúc nào từ menu trình duyệt',
        4000
      );
    }

    showInstallationError() {
      const notification = this.createNotification(
        '⚠️',
        'Lỗi cài đặt',
        'Không thể cài đặt ứng dụng. Thử lại sau hoặc cài đặt thủ công.',
        5000
      );
    }

    showInstalledNotification() {
      const notification = this.createNotification(
        '🎉',
        'Cài đặt thành công!',
        'Ứng dụng XemPhim đã được cài đặt trên thiết bị của bạn',
        5000
      );
    }

    showManualInstallGuide() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      let message = 'Để cài đặt ứng dụng, vui lòng sử dụng menu "Thêm vào màn hình chính" trong trình duyệt.';
      
      if (isIOS) {
        message = 'Trên iOS: Nhấn nút Chia sẻ (📤) và chọn "Thêm vào Màn hình chính"';
      } else if (isAndroid) {
        message = 'Trên Android: Nhấn menu (⋮) và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính"';
      }

      const notification = this.createNotification(
        '📱',
        'Hướng dẫn cài đặt',
        message,
        8000
      );
    }

    createNotification(icon, title, message, duration = 5000) {
      const notification = document.createElement('div');
      notification.className = 'pwa-notification';
      notification.innerHTML = `
        <div class="pwa-notification-content">
          <div class="pwa-notification-icon">${icon}</div>
          <div class="pwa-notification-text">
            <div class="pwa-notification-title">${title}</div>
            <div class="pwa-notification-message">${message}</div>
          </div>
          <button class="pwa-notification-close">×</button>
        </div>
      `;

      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--card, #1a1b21);
        border: 1px solid var(--border, #2a2c35);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 350px;
        padding: 16px;
        transform: translateX(100%);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      `;

      // Notification content styles
      const style = document.createElement('style');
      style.textContent = `
        .pwa-notification-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .pwa-notification-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        .pwa-notification-text {
          flex: 1;
          min-width: 0;
        }
        .pwa-notification-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text, #e8e8ea);
          margin-bottom: 4px;
        }
        .pwa-notification-message {
          font-size: 13px;
          color: var(--muted, #a0a0a8);
          line-height: 1.4;
        }
        .pwa-notification-close {
          background: none;
          border: none;
          color: var(--muted, #a0a0a8);
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .pwa-notification-close:hover {
          background: var(--bg-elev, #15161a);
          color: var(--text, #e8e8ea);
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
      
      if (!document.getElementById('pwa-notification-styles')) {
        style.id = 'pwa-notification-styles';
        document.head.appendChild(style);
      }

      // Close handler
      notification.querySelector('.pwa-notification-close').addEventListener('click', () => {
        this.hideNotification(notification);
      });

      document.body.appendChild(notification);

      // Show notification
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);

      // Auto-hide after duration
      setTimeout(() => {
        this.hideNotification(notification);
      }, duration);

      return notification;
    }

    hideNotification(notification) {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }

    // Utility methods
    isStandalone() {
      return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    }

    isPWACapable() {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    }
  }

  // Initialize PWA installer when DOM is ready
  let pwaInstaller;
  
  function initPWAInstaller() {
    try {
      if (!pwaInstaller) {
        console.log('🔄 Initializing PWA installer...');
        
        // Check PWA requirements
        if (!('serviceWorker' in navigator)) {
          console.warn('❌ Service Workers not supported');
          return;
        }
        
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          console.warn('❌ PWA requires HTTPS or localhost');
          return;
        }
        
        pwaInstaller = new PWAInstaller();
        console.log('📱 PWA Installer initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize PWA installer:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWAInstaller);
  } else {
    initPWAInstaller();
  }

  // Export for global access
  window.PWAInstaller = PWAInstaller;
  window.pwaInstaller = pwaInstaller;
  
  // Add manual test function
  window.showPWAButton = function() {
    if (window.pwaInstaller) {
      window.pwaInstaller.forceShowButton();
    } else {
      console.log('PWA installer not ready yet');
    }
  };
  
  // Add manual install function
  window.installPWA = function() {
    if (window.pwaInstaller) {
      window.pwaInstaller.installPWA();
    } else {
      console.log('PWA installer not ready yet');
    }
  };
  
  console.log('📱 PWA Manual Commands Available:');
  console.log('- showPWAButton() - Force show install button');
  console.log('- installPWA() - Trigger PWA install');

})(); 