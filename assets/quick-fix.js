/**
 * 🚑 Quick Fix for Immediate Issues
 * Temporary fixes while modules are being integrated
 */

// Enhanced Firebase readiness check
function waitForFirebase(maxWait = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkFirebase = () => {
      if (window.movieComments && window.movieComments.initialized) {
        console.log('✅ Firebase is ready');
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > maxWait) {
        console.warn('⚠️ Firebase timeout, using fallback mode');
        resolve(false);
        return;
      }
      
      setTimeout(checkFirebase, 100);
    };
    
    checkFirebase();
  });
}

// Enhanced movie operations with better error handling
window.enhancedMovieOps = {
  async saveMovie(movie) {
    try {
      const isFirebaseReady = await waitForFirebase(3000);
      
      if (isFirebaseReady && window.movieComments) {
        return await window.movieComments.saveMovie(movie);
      } else {
        // Fallback to localStorage
        return this.saveToLocalStorage(movie);
      }
    } catch (error) {
      console.error('❌ Save movie failed:', error);
      return this.saveToLocalStorage(movie);
    }
  },

  async removeSavedMovie(slug) {
    try {
      const isFirebaseReady = await waitForFirebase(3000);
      
      if (isFirebaseReady && window.movieComments) {
        return await window.movieComments.removeSavedMovie(slug);
      } else {
        return this.removeFromLocalStorage(slug);
      }
    } catch (error) {
      console.error('❌ Remove movie failed:', error);
      return this.removeFromLocalStorage(slug);
    }
  },

  async isMovieSaved(slug) {
    try {
      const isFirebaseReady = await waitForFirebase(1000);
      
      if (isFirebaseReady && window.movieComments) {
        return await window.movieComments.isMovieSaved(slug);
      } else {
        const saved = this.getFromLocalStorage();
        return saved.some(movie => movie.slug === slug);
      }
    } catch (error) {
      console.error('❌ Check movie failed:', error);
      const saved = this.getFromLocalStorage();
      return saved.some(movie => movie.slug === slug);
    }
  },

  async getSavedMovies() {
    try {
      const isFirebaseReady = await waitForFirebase(3000);
      
      if (isFirebaseReady && window.movieComments) {
        return await window.movieComments.getSavedMovies();
      } else {
        return this.getFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ Get saved movies failed:', error);
      return this.getFromLocalStorage();
    }
  },

  // localStorage fallback methods
  saveToLocalStorage(movie) {
    try {
      const saved = this.getFromLocalStorage();
      
      if (saved.some(m => m.slug === movie.slug)) {
        this.showNotification('⚠️ Phim đã có trong danh sách', 'warning');
        return false;
      }
      
      const movieData = {
        slug: movie.slug,
        name: movie.name,
        poster_url: movie.poster_url || movie.thumb_url,
        year: movie.year,
        lang: movie.lang,
        quality: movie.quality,
        episode_current: movie.episode_current,
        savedAt: Date.now()
      };
      
      saved.unshift(movieData);
      localStorage.setItem('savedMovies', JSON.stringify(saved));
      
      this.showNotification(`✅ Đã lưu "${movie.name}" (offline)`, 'success');
      return true;
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      this.showNotification('❌ Không thể lưu phim', 'error');
      return false;
    }
  },

  removeFromLocalStorage(slug) {
    try {
      const saved = this.getFromLocalStorage();
      const movie = saved.find(m => m.slug === slug);
      const filtered = saved.filter(m => m.slug !== slug);
      
      if (filtered.length === saved.length) {
        this.showNotification('⚠️ Phim không có trong danh sách', 'warning');
        return false;
      }
      
      localStorage.setItem('savedMovies', JSON.stringify(filtered));
      this.showNotification(`✅ Đã xóa "${movie?.name || slug}" (offline)`, 'success');
      return true;
    } catch (error) {
      console.error('❌ localStorage remove failed:', error);
      this.showNotification('❌ Không thể xóa phim', 'error');
      return false;
    }
  },

  getFromLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem('savedMovies') || '[]');
    } catch (error) {
      console.error('❌ localStorage get failed:', error);
      return [];
    }
  },

  // Simple notification system
  showNotification(message, type = 'info') {
    // HOÀN TOÀN TẮT quick-fix notification system
    console.log('🔕 Quick-fix notification system disabled:', { message, type });
    return; // KHÔNG hiển thị popup

    // Code below is disabled to prevent any popup notifications
    /*
    // Try to use new notification system if available
    if (window.notificationManager) {
      window.notificationManager.show(message, type);
      return;
    }
    */
    
    // Fallback to simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    const colors = {
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    };
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          notification.parentNode.removeChild(notification);
        }, 300);
      }
    }, 4000);
    
    // Add CSS animations if not exists
    if (!document.querySelector('#quick-fix-styles')) {
      const style = document.createElement('style');
      style.id = 'quick-fix-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// Override global movie operations
window.saveMovie = window.enhancedMovieOps.saveMovie.bind(window.enhancedMovieOps);
window.removeSavedMovie = window.enhancedMovieOps.removeSavedMovie.bind(window.enhancedMovieOps);
window.isMovieSaved = window.enhancedMovieOps.isMovieSaved.bind(window.enhancedMovieOps);
window.getSavedMovies = window.enhancedMovieOps.getSavedMovies.bind(window.enhancedMovieOps);

console.log('🚑 Quick Fix applied - Enhanced movie operations ready');

// Show success notification - POPUP DISABLED
setTimeout(() => {
  // window.enhancedMovieOps.showNotification('🔧 Enhanced features loaded', 'success'); // DISABLED - no popup
  console.log('🔕 Enhanced features loaded notification disabled - no popup');
}, 1000);
