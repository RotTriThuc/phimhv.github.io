/**
 * ⚡ Performance Fix for Movie Operations
 * Optimizes save/remove operations for faster response times
 */

// Cache Firebase readiness status to avoid repeated checks
let firebaseReadyCache = null;
let firebaseCheckTime = 0;
const FIREBASE_CACHE_TTL = 5000; // Cache for 5 seconds

// Fast Firebase readiness check with caching
function fastFirebaseCheck() {
  const now = Date.now();
  
  // Use cached result if still valid
  if (firebaseReadyCache !== null && (now - firebaseCheckTime) < FIREBASE_CACHE_TTL) {
    return Promise.resolve(firebaseReadyCache);
  }
  
  // Quick synchronous check first
  if (window.movieComments && window.movieComments.initialized) {
    firebaseReadyCache = true;
    firebaseCheckTime = now;
    return Promise.resolve(true);
  }
  
  // If not ready, wait briefly (max 500ms instead of 3000ms)
  return new Promise((resolve) => {
    const startTime = Date.now();
    const maxWait = 500; // Much shorter wait time
    
    const checkFirebase = () => {
      if (window.movieComments && window.movieComments.initialized) {
        firebaseReadyCache = true;
        firebaseCheckTime = Date.now();
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > maxWait) {
        firebaseReadyCache = false;
        firebaseCheckTime = Date.now();
        resolve(false);
        return;
      }
      
      setTimeout(checkFirebase, 50); // Check every 50ms instead of 100ms
    };
    
    checkFirebase();
  });
}

// Optimized movie operations with faster response
window.fastMovieOps = {
  // Fast save with immediate localStorage backup
  async saveMovie(movie) {
    // Show immediate feedback
    if (window.notificationManager) {
      window.notificationManager.info('💾 Đang lưu phim...', { duration: 1000 });
    }
    
    try {
      // Save to localStorage immediately for instant feedback
      const localSaveSuccess = this.saveToLocalStorage(movie);
      
      // Try Firebase in background (non-blocking)
      fastFirebaseCheck().then(async (isReady) => {
        if (isReady && window.movieComments) {
          try {
            await window.movieComments.saveMovie(movie);
            console.log('✅ Movie synced to Firebase:', movie.name);
            
            if (window.notificationManager) {
              window.notificationManager.success(`✅ Đã lưu "${movie.name}" (đồng bộ Firebase)`, {
                duration: 2000
              });
            }
          } catch (error) {
            console.warn('⚠️ Firebase sync failed, using localStorage only:', error.message);
          }
        }
      });
      
      return localSaveSuccess;
      
    } catch (error) {
      console.error('❌ Save movie failed:', error);
      
      if (window.notificationManager) {
        window.notificationManager.error('❌ Không thể lưu phim');
      }
      
      return false;
    }
  },

  // Fast remove with immediate localStorage
  async removeSavedMovie(slug) {
    try {
      // Remove from localStorage immediately
      const localRemoveSuccess = this.removeFromLocalStorage(slug);
      
      // Try Firebase in background
      fastFirebaseCheck().then(async (isReady) => {
        if (isReady && window.movieComments) {
          try {
            await window.movieComments.removeSavedMovie(slug);
            console.log('✅ Movie removed from Firebase:', slug);
          } catch (error) {
            console.warn('⚠️ Firebase remove failed:', error.message);
          }
        }
      });
      
      return localRemoveSuccess;
      
    } catch (error) {
      console.error('❌ Remove movie failed:', error);
      return false;
    }
  },

  // Fast check with localStorage priority
  async isMovieSaved(slug) {
    try {
      // Check localStorage first (instant)
      const saved = this.getFromLocalStorage();
      const isInLocalStorage = saved.some(movie => movie.slug === slug);
      
      // Return localStorage result immediately
      return isInLocalStorage;
      
    } catch (error) {
      console.error('❌ Check movie failed:', error);
      return false;
    }
  },

  // Fast get with localStorage priority
  async getSavedMovies() {
    try {
      // Return localStorage data immediately
      const localMovies = this.getFromLocalStorage();
      
      // Try to sync with Firebase in background
      fastFirebaseCheck().then(async (isReady) => {
        if (isReady && window.movieComments) {
          try {
            const firebaseMovies = await window.movieComments.getSavedMovies();
            
            // Merge and update localStorage if needed
            if (firebaseMovies.length > localMovies.length) {
              localStorage.setItem('savedMovies', JSON.stringify(firebaseMovies));
              console.log('🔄 Synced movies from Firebase');
            }
          } catch (error) {
            console.warn('⚠️ Firebase sync failed:', error.message);
          }
        }
      });
      
      return localMovies;
      
    } catch (error) {
      console.error('❌ Get saved movies failed:', error);
      return [];
    }
  },

  // localStorage methods (same as before but optimized)
  saveToLocalStorage(movie) {
    try {
      const saved = this.getFromLocalStorage();
      
      // Check if already exists
      if (saved.some(m => m.slug === movie.slug)) {
        if (window.notificationManager) {
          window.notificationManager.warning('⚠️ Phim đã có trong danh sách');
        }
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
      
      if (window.notificationManager) {
        window.notificationManager.success(`✅ Đã lưu "${movie.name}"`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      return false;
    }
  },

  removeFromLocalStorage(slug) {
    try {
      const saved = this.getFromLocalStorage();
      const movie = saved.find(m => m.slug === slug);
      const filtered = saved.filter(m => m.slug !== slug);
      
      if (filtered.length === saved.length) {
        if (window.notificationManager) {
          window.notificationManager.warning('⚠️ Phim không có trong danh sách');
        }
        return false;
      }
      
      localStorage.setItem('savedMovies', JSON.stringify(filtered));
      
      if (window.notificationManager) {
        window.notificationManager.success(`✅ Đã xóa "${movie?.name || slug}"`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ localStorage remove failed:', error);
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
  }
};

// Override global movie operations with fast versions
window.saveMovie = window.fastMovieOps.saveMovie.bind(window.fastMovieOps);
window.removeSavedMovie = window.fastMovieOps.removeSavedMovie.bind(window.fastMovieOps);
window.isMovieSaved = window.fastMovieOps.isMovieSaved.bind(window.fastMovieOps);
window.getSavedMovies = window.fastMovieOps.getSavedMovies.bind(window.fastMovieOps);

// Clear Firebase cache when Firebase becomes ready
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.movieComments && window.movieComments.initialized) {
      firebaseReadyCache = true;
      firebaseCheckTime = Date.now();
      console.log('⚡ Firebase ready - Performance optimized');
    }
  }, 1000);
});

console.log('⚡ Performance Fix applied - Movie operations optimized for speed');

// Show optimization notification
setTimeout(() => {
  if (window.notificationManager) {
    window.notificationManager.info('⚡ Tối ưu tốc độ lưu phim', {
      duration: 2000
    });
  }
}, 2000);
