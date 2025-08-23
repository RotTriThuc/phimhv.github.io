/* Image Loading Fix Notification */
(function() {
  'use strict';
  
  // Show fix notification after page loads
  function showImageFixNotification() {
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #00b894, #00a085);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      max-width: 320px;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
    `;
    
         notification.innerHTML = `
       <div style="display: flex; align-items: center; gap: 12px;">
         <div style="font-size: 24px;">🔧</div>
         <div>
                       <div style="font-weight: 600; margin-bottom: 4px;">Pure CDN Strategy!</div>
            <div style="font-size: 12px; opacity: 0.9;">100% CORS-free image loading</div>
         </div>
         <div style="font-size: 20px; opacity: 0.7; margin-left: auto;">×</div>
       </div>
     `;
    
    // Add animation keyframes
    if (!document.getElementById('fix-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'fix-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%) translateY(-10px);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Auto-hide after 8 seconds
    const autoHideTimer = setTimeout(() => {
      hideNotification();
    }, 8000);
    
    // Click to hide
    notification.addEventListener('click', () => {
      clearTimeout(autoHideTimer);
      hideNotification();
    });
    
    function hideNotification() {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
    
    document.body.appendChild(notification);
    
    // Log the fix
    console.log('🔧 Image Loading V3.2: Pure CDN strategy - 100% CORS-free!');
  }
  
  // Show notification when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showImageFixNotification);
  } else {
    // Small delay to ensure other systems are loaded
    setTimeout(showImageFixNotification, 1000);
  }
  
})(); 