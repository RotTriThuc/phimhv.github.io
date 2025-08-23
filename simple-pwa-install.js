/* Simple PWA Install - Fallback Version */

(function() {
  'use strict';
  
  let deferredPrompt = null;
  let installButton = null;
  
  function createSimpleInstallButton() {
    console.log('🎨 Creating simple PWA install button...');
    
    const button = document.createElement('button');
    button.innerHTML = '📱 Cài đặt App';
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
      margin-right: 8px;
      transition: all 0.3s ease;
    `;
    
    button.addEventListener('click', handleInstallClick);
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px) scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
    });
    
    return button;
  }
  
  function addButtonToHeader() {
    const headerActions = document.querySelector('.header__actions');
    if (headerActions) {
      installButton = createSimpleInstallButton();
      headerActions.insertBefore(installButton, headerActions.firstChild);
      console.log('✅ Simple PWA button added to header');
      return true;
    }
    return false;
  }
  
  function handleInstallClick() {
    console.log('🚀 Simple PWA install clicked');
    
    if (deferredPrompt) {
      console.log('📋 Using browser install prompt');
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        console.log('User choice:', choiceResult.outcome);
        deferredPrompt = null;
      });
    } else {
      console.log('📱 Showing manual install guide');
      showManualGuide();
    }
  }
  
  function showManualGuide() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    if (isIOS) {
      message = 'Trên iOS:\n1. Nhấn nút Share (📤)\n2. Chọn "Add to Home Screen"\n3. Nhấn "Add"';
    } else if (isAndroid) {
      message = 'Trên Android:\n1. Nhấn menu (⋮) \n2. Chọn "Add to Home screen"\n3. Nhấn "Add"';
    } else {
      message = 'Để cài đặt PWA:\n1. Nhấn menu browser\n2. Chọn "Install..." hoặc "Add to Home Screen"\n3. Xác nhận cài đặt';
    }
    
    alert('📱 Hướng dẫn cài đặt PWA:\n\n' + message);
  }
  
  function showInstallSuccess() {
    alert('🎉 PWA đã được cài đặt thành công!\nBạn có thể tìm thấy app trên desktop/home screen.');
  }
  
  // Listen for install events
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📋 beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;
    
    if (installButton) {
      installButton.style.display = 'flex';
      console.log('👀 PWA button shown (install available)');
    }
  });
  
  window.addEventListener('appinstalled', (e) => {
    console.log('🎉 PWA installed successfully');
    showInstallSuccess();
    
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
  
  // Initialize when DOM ready
  function init() {
    console.log('🔧 Simple PWA installer initializing...');
    
    // Check requirements
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers not supported');
      return;
    }
    
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ PWA requires HTTPS (or localhost for testing)');
    }
    
    // Wait for header to load
    let attempts = 0;
    const tryAddButton = () => {
      attempts++;
      if (addButtonToHeader()) {
        console.log('✅ Simple PWA installer ready');
      } else if (attempts < 20) {
        setTimeout(tryAddButton, 250);
      } else {
        console.warn('❌ Could not find header to add PWA button');
      }
    };
    
    tryAddButton();
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Export for manual testing
  window.simplePWAInstall = handleInstallClick;
  console.log('📱 Simple PWA installer loaded. Use simplePWAInstall() to test.');
  
})(); 