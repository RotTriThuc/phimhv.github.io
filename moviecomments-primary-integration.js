// 🎬 MovieComments Primary Integration
// Tích hợp movieComments với Firebase Primary Storage System

class MovieCommentsPrimaryIntegration {
  constructor() {
    this.originalMovieComments = null;
    this.integrated = false;
  }

  // 🔗 Integrate with existing movieComments system
  async integrate() {
    try {
      console.log('🔗 Integrating movieComments with Firebase Primary Storage...');
      
      if (!window.movieComments) {
        throw new Error('Original movieComments system not found');
      }
      
      if (!window.FirebasePrimaryStorage) {
        throw new Error('Firebase Primary Storage not found');
      }
      
      // Store reference to original system
      this.originalMovieComments = window.movieComments;
      
      // Wait for Firebase Primary Storage to be ready
      if (!window.FirebasePrimaryStorage.initialized) {
        await window.FirebasePrimaryStorage.init();
      }
      
      // Override movieComments methods
      this.overrideMovieCommentsMethods();
      
      console.log('✅ MovieComments integrated with Firebase Primary Storage');
      this.integrated = true;
      
      return true;
    } catch (error) {
      console.error('❌ MovieComments integration failed:', error);
      return false;
    }
  }

  // 🔄 Override movieComments methods
  overrideMovieCommentsMethods() {
    const originalSaveMovie = this.originalMovieComments.saveMovie?.bind(this.originalMovieComments);
    const originalRemoveSavedMovie = this.originalMovieComments.removeSavedMovie?.bind(this.originalMovieComments);
    const originalGetUserId = this.originalMovieComments.getUserId?.bind(this.originalMovieComments);
    const originalGetUserName = this.originalMovieComments.getUserName?.bind(this.originalMovieComments);

    // Override saveMovie - Firebase Primary only
    window.movieComments.saveMovie = async (movieData) => {
      try {
        console.log('💾 [PRIMARY] Saving movie:', movieData.slug);
        
        // Validate movie data
        if (!movieData.slug || !movieData.name) {
          throw new Error('Invalid movie data: missing slug or name');
        }
        
        // Save to Firebase Primary Storage only
        const result = await window.FirebasePrimaryStorage.saveMovie(movieData);
        
        if (result) {
          console.log('✅ [PRIMARY] Movie saved successfully');
          
          // Trigger UI update event
          this.triggerMovieListUpdate();
          
          // Show notification if available
          this.showNotification(`Đã lưu phim: ${movieData.name}`, 'success');
        } else {
          throw new Error('Failed to save to Firebase');
        }
        
        return result;
        
      } catch (error) {
        console.error('❌ [PRIMARY] Save movie failed:', error);
        this.showNotification(`Lỗi lưu phim: ${error.message}`, 'error');
        return false;
      }
    };

    // Override removeSavedMovie - Firebase Primary only
    window.movieComments.removeSavedMovie = async (movieSlug) => {
      try {
        console.log('🗑️ [PRIMARY] Removing movie:', movieSlug);
        
        if (!movieSlug) {
          throw new Error('Invalid movie slug');
        }
        
        // Remove from Firebase Primary Storage only
        const result = await window.FirebasePrimaryStorage.removeMovie(movieSlug);
        
        if (result) {
          console.log('✅ [PRIMARY] Movie removed successfully');
          
          // Trigger UI update event
          this.triggerMovieListUpdate();
          
          // Show notification if available
          this.showNotification('Đã xóa phim khỏi danh sách', 'success');
        } else {
          throw new Error('Failed to remove from Firebase');
        }
        
        return result;
        
      } catch (error) {
        console.error('❌ [PRIMARY] Remove movie failed:', error);
        this.showNotification(`Lỗi xóa phim: ${error.message}`, 'error');
        return false;
      }
    };

    // Override getUserId - Use Firebase Primary Storage User ID
    window.movieComments.getUserId = async () => {
      try {
        if (window.FirebasePrimaryStorage.userId) {
          return window.FirebasePrimaryStorage.userId;
        }
        
        // Fallback to original method
        if (originalGetUserId) {
          return await originalGetUserId();
        }
        
        // Last resort - get from localStorage
        return localStorage.getItem('movie_user_id_v2') || 
               localStorage.getItem('movie_commenter_id') || 
               'anonymous_user';
               
      } catch (error) {
        console.error('❌ [PRIMARY] Get User ID failed:', error);
        return 'anonymous_user';
      }
    };

    // Override getUserName - Enhanced version
    window.movieComments.getUserName = () => {
      try {
        // Try to get from localStorage first
        const userName = localStorage.getItem('movie_user_name_v2') || 
                        localStorage.getItem('movie_commenter_name');
        
        if (userName) {
          return userName;
        }
        
        // Fallback to original method
        if (originalGetUserName) {
          return originalGetUserName();
        }
        
        return 'Khách';
        
      } catch (error) {
        console.error('❌ [PRIMARY] Get User Name failed:', error);
        return 'Khách';
      }
    };

    // Add new methods for Firebase Primary Storage
    
    // Check if movie is saved
    window.movieComments.isMovieSaved = async (movieSlug) => {
      try {
        return await window.FirebasePrimaryStorage.isMovieSaved(movieSlug);
      } catch (error) {
        console.error('❌ [PRIMARY] Check movie saved failed:', error);
        return false;
      }
    };

    // Get movie count
    window.movieComments.getMovieCount = async () => {
      try {
        return await window.FirebasePrimaryStorage.getMovieCount();
      } catch (error) {
        console.error('❌ [PRIMARY] Get movie count failed:', error);
        return 0;
      }
    };

    // Force refresh from Firebase
    window.movieComments.forceRefresh = async () => {
      try {
        console.log('🔄 [PRIMARY] Force refreshing movie list...');
        const movies = await window.FirebasePrimaryStorage.forceRefresh();
        this.triggerMovieListUpdate();
        return movies;
      } catch (error) {
        console.error('❌ [PRIMARY] Force refresh failed:', error);
        return [];
      }
    };

    // Enhanced sync code generation
    window.movieComments.generateSyncCode = async () => {
      try {
        console.log('📱 [PRIMARY] Generating sync code...');
        const syncCode = await window.FirebasePrimaryStorage.generateSyncCode();
        
        if (syncCode) {
          this.showNotification(`Mã sync: ${syncCode} (có hiệu lực 24h)`, 'info');
        }
        
        return syncCode;
      } catch (error) {
        console.error('❌ [PRIMARY] Generate sync code failed:', error);
        this.showNotification(`Lỗi tạo mã sync: ${error.message}`, 'error');
        return null;
      }
    };

    // Enhanced sync code usage
    window.movieComments.useSyncCode = async (syncCode) => {
      try {
        console.log('🔄 [PRIMARY] Using sync code:', syncCode);
        const result = await window.FirebasePrimaryStorage.useSyncCode(syncCode);
        
        if (result.success) {
          this.showNotification('Đồng bộ thành công!', 'success');
          
          // Trigger full UI refresh
          setTimeout(() => {
            this.triggerMovieListUpdate();
            window.location.reload(); // Full refresh to update UI
          }, 1000);
        } else {
          throw new Error(result.error);
        }
        
        return result;
      } catch (error) {
        console.error('❌ [PRIMARY] Use sync code failed:', error);
        this.showNotification(`Lỗi đồng bộ: ${error.message}`, 'error');
        return { success: false, error: error.message };
      }
    };

    // Watch progress methods
    window.movieComments.saveWatchProgress = async (movieSlug, progressData) => {
      try {
        return await window.FirebasePrimaryStorage.saveWatchProgress(movieSlug, progressData);
      } catch (error) {
        console.error('❌ [PRIMARY] Save watch progress failed:', error);
        return false;
      }
    };

    window.movieComments.getWatchProgress = async (movieSlug) => {
      try {
        return await window.FirebasePrimaryStorage.getWatchProgress(movieSlug);
      } catch (error) {
        console.error('❌ [PRIMARY] Get watch progress failed:', error);
        return null;
      }
    };

    // Storage info
    window.movieComments.getStorageInfo = async () => {
      try {
        return await window.FirebasePrimaryStorage.getStorageInfo();
      } catch (error) {
        console.error('❌ [PRIMARY] Get storage info failed:', error);
        return { error: error.message };
      }
    };
  }

  // 🔔 Notification system
  showNotification(message, type = 'info') {
    try {
      // Try to use existing notification system
      if (window.showNotification) {
        window.showNotification(message, type);
        return;
      }
      
      // Fallback to console
      const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
      console.log(`${prefix} ${message}`);
      
      // Try to show browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Web Xem Anime', {
          body: message,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // 🔄 Trigger UI updates
  triggerMovieListUpdate() {
    try {
      // Dispatch custom event for UI components to listen
      const event = new CustomEvent('movieListUpdated', {
        detail: { source: 'firebase_primary' }
      });
      window.dispatchEvent(event);
      
      // Try to update saved movies page if it exists
      if (window.updateSavedMoviesPage) {
        window.updateSavedMoviesPage();
      }
      
      // Try to update movie buttons if function exists
      if (window.updateMovieButtons) {
        window.updateMovieButtons();
      }
      
    } catch (error) {
      console.warn('⚠️ UI update trigger failed:', error);
    }
  }

  // 🔧 Utility methods
  
  // Check integration status
  isIntegrated() {
    return this.integrated && 
           window.FirebasePrimaryStorage?.initialized && 
           window.movieComments;
  }

  // Get integration info
  getIntegrationInfo() {
    return {
      integrated: this.integrated,
      firebasePrimaryReady: window.FirebasePrimaryStorage?.initialized || false,
      movieCommentsAvailable: !!window.movieComments,
      userId: window.FirebasePrimaryStorage?.userId || null
    };
  }

  // Force re-integration
  async reintegrate() {
    console.log('🔄 Re-integrating movieComments...');
    this.integrated = false;
    return await this.integrate();
  }
}

// Global instance
window.MovieCommentsPrimaryIntegration = new MovieCommentsPrimaryIntegration();

// Auto-integrate when both systems are ready
window.addEventListener('load', async () => {
  let attempts = 0;
  const maxAttempts = 30;
  
  const waitForSystems = async () => {
    if (window.movieComments && 
        window.FirebasePrimaryStorage && 
        window.movieComments.initialized) {
      
      console.log('🔗 Both systems ready, starting integration...');
      
      // Wait a bit more for Firebase Primary Storage to initialize
      setTimeout(async () => {
        await window.MovieCommentsPrimaryIntegration.integrate();
      }, 2000);
      
      return;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(waitForSystems, 1000);
    } else {
      console.error('❌ Integration timeout - systems not ready');
    }
  };
  
  setTimeout(waitForSystems, 2000);
});

// Listen for Firebase Primary Storage ready event
window.addEventListener('firebasePrimaryStorageReady', async () => {
  if (!window.MovieCommentsPrimaryIntegration.isIntegrated()) {
    await window.MovieCommentsPrimaryIntegration.integrate();
  }
});

console.log('🎬 MovieComments Primary Integration loaded');
