// 🔥 Firebase Primary Storage System
// Firebase làm single source of truth cho movie data
// Chỉ User ID được lưu trong localStorage

class FirebasePrimaryStorage {
  constructor() {
    this.db = null;
    this.userId = null;
    this.initialized = false;
    this.cache = new Map(); // Memory cache only, không persist
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // 🚀 Initialize Firebase Primary Storage
  async init() {
    try {
      console.log('🔥 Initializing Firebase Primary Storage...');

      // Wait for Firebase to be ready with timeout
      await this.waitForFirebase();

      this.db = window.movieComments.db;

      // Get or create persistent User ID
      this.userId = await this.getOrCreateUserId();

      if (!this.userId) {
        throw new Error('Failed to get User ID');
      }

      console.log('✅ Firebase Primary Storage initialized with User ID:', this.userId);
      this.initialized = true;

      return true;
    } catch (error) {
      console.error('❌ Firebase Primary Storage initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  // 🕐 Wait for Firebase to be ready
  async waitForFirebase(maxWaitTime = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Check if Firebase is ready
      if (window.firebase &&
          window.movieComments?.db &&
          window.movieComments?.initialized) {
        console.log('🔥 Firebase is ready for Primary Storage');
        return true;
      }

      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Firebase not ready after ${maxWaitTime}ms timeout`);
  }

  // 🆔 User ID Management - Firebase Auth UID Priority
  async getOrCreateUserId() {
    try {
      // PRIORITY 1: Firebase Auth UID (logged in user)
      if (window.firebaseAuth && window.firebaseAuth.isLoggedIn()) {
        const authUid = window.firebaseAuth.getUserId();
        if (authUid) {
          console.log('✅ Using Firebase Auth UID:', authUid);
          return authUid;
        }
      }

      // PRIORITY 2: Enhanced User Manager
      if (window.enhancedUserManager) {
        const enhancedId = await window.enhancedUserManager.getEnhancedUserId();
        if (enhancedId) {
          console.log('✅ Using enhanced User ID:', enhancedId);
          return enhancedId;
        }
      }
      
      // PRIORITY 3: Existing localStorage ID (fallback for guest users)
      let userId = localStorage.getItem('movie_user_id_v2') || 
                   localStorage.getItem('movie_commenter_id');
      
      if (!userId) {
        // Generate new deterministic User ID for guest
        userId = this.generateDeterministicUserId();
        localStorage.setItem('movie_user_id_v2', userId);
        console.log('🆔 Generated new Guest User ID:', userId);
      }
      
      return userId;
    } catch (error) {
      console.error('❌ User ID generation failed:', error);
      return null;
    }
  }

  generateDeterministicUserId() {
    // Simple deterministic ID based on browser characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `user_primary_${Math.abs(hash).toString(36)}`;
  }

  // 📚 Movie Storage Operations (Firebase Only)
  
  /**
   * Save movie to Firebase (no localStorage)
   */
  async saveMovie(movieData) {
    try {
      // Try to initialize if not ready
      if (!this.initialized) {
        console.log('🔄 Firebase Primary Storage not initialized, attempting init for save...');
        const initResult = await this.init();

        if (!initResult) {
          throw new Error('Firebase Primary Storage initialization failed');
        }
      }

      if (!this.userId || !this.db) {
        throw new Error('Firebase Primary Storage not ready');
      }
      
      console.log('💾 Saving movie to Firebase:', movieData.slug);
      
      // Prepare movie data for Firebase
      const firebaseMovieData = {
        slug: movieData.slug,
        name: movieData.name,
        poster_url: movieData.poster_url || movieData.thumb_url,
        year: movieData.year,
        lang: movieData.lang,
        quality: movieData.quality,
        episode_current: movieData.episode_current,
        category: movieData.category || [],
        country: movieData.country || [],
        
        // Metadata
        userId: this.userId,
        savedAt: new Date(),
        updatedAt: new Date(),
        source: 'primary_storage'
      };
      
      // Use movie slug + userId as document ID for uniqueness
      const docId = `${this.userId}_${movieData.slug}`;
      
      await this.db.collection('savedMovies').doc(docId).set(firebaseMovieData, { merge: true });
      
      // Update memory cache
      this.updateCache('savedMovies', null); // Invalidate cache
      
      console.log('✅ Movie saved to Firebase successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save movie to Firebase:', error);
      return false;
    }
  }

  /**
   * Remove movie from Firebase (no localStorage)
   */
  async removeMovie(movieSlug) {
    try {
      // Try to initialize if not ready
      if (!this.initialized) {
        console.log('🔄 Firebase Primary Storage not initialized, attempting init for remove...');
        const initResult = await this.init();

        if (!initResult) {
          throw new Error('Firebase Primary Storage initialization failed');
        }
      }

      if (!this.userId || !this.db) {
        throw new Error('Firebase Primary Storage not ready');
      }
      
      console.log('🗑️ Removing movie from Firebase:', movieSlug);
      
      const docId = `${this.userId}_${movieSlug}`;
      await this.db.collection('savedMovies').doc(docId).delete();
      
      // Update memory cache
      this.updateCache('savedMovies', null); // Invalidate cache
      
      console.log('✅ Movie removed from Firebase successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to remove movie from Firebase:', error);
      return false;
    }
  }

  /**
   * Get all saved movies from Firebase (no localStorage fallback)
   */
  async getSavedMovies() {
    try {
      // Try to initialize if not ready
      if (!this.initialized) {
        console.log('🔄 Firebase Primary Storage not initialized, attempting init...');
        const initResult = await this.init();

        if (!initResult) {
          console.warn('⚠️ Firebase Primary Storage initialization failed, returning empty array');
          return [];
        }
      }

      if (!this.userId || !this.db) {
        console.warn('⚠️ Firebase Primary Storage not ready, returning empty array');
        return [];
      }
      
      // Check memory cache first
      const cached = this.getFromCache('savedMovies');
      if (cached) {
        console.log('📋 Returning cached movies:', cached.length);
        return cached;
      }
      
      console.log('📚 Loading movies from Firebase for user:', this.userId);
      
      const snapshot = await this.db
        .collection('savedMovies')
        .where('userId', '==', this.userId)
        .orderBy('savedAt', 'desc')
        .get();
      
      const movies = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        movies.push({
          slug: data.slug,
          name: data.name,
          poster_url: data.poster_url,
          year: data.year,
          lang: data.lang,
          quality: data.quality,
          episode_current: data.episode_current,
          category: data.category || [],
          country: data.country || [],
          savedAt: data.savedAt?.toDate?.() || new Date(data.savedAt)
        });
      });
      
      // Cache in memory
      this.updateCache('savedMovies', movies);
      
      console.log(`✅ Loaded ${movies.length} movies from Firebase`);
      return movies;
      
    } catch (error) {
      console.error('❌ Failed to load movies from Firebase:', error);
      return [];
    }
  }

  /**
   * Check if movie is saved (Firebase only)
   */
  async isMovieSaved(movieSlug) {
    try {
      if (!this.initialized) {
        await this.init();
      }
      
      if (!this.userId || !this.db) {
        return false;
      }
      
      const docId = `${this.userId}_${movieSlug}`;
      const doc = await this.db.collection('savedMovies').doc(docId).get();
      
      return doc.exists;
      
    } catch (error) {
      console.error('❌ Failed to check if movie is saved:', error);
      return false;
    }
  }

  /**
   * Get movie count (Firebase only)
   */
  async getMovieCount() {
    try {
      const movies = await this.getSavedMovies();
      return movies.length;
    } catch (error) {
      console.error('❌ Failed to get movie count:', error);
      return 0;
    }
  }

  // 🔄 Watch Progress Operations (Firebase Only)
  
  /**
   * Save watch progress to Firebase
   */
  async saveWatchProgress(movieSlug, progressData) {
    try {
      if (!this.initialized) {
        await this.init();
      }
      
      if (!this.userId || !this.db) {
        throw new Error('Firebase Primary Storage not ready');
      }
      
      const docId = `${this.userId}_${movieSlug}`;
      const progressDoc = {
        userId: this.userId,
        movieSlug: movieSlug,
        currentEpisode: progressData.currentEpisode,
        currentTime: progressData.currentTime,
        totalTime: progressData.totalTime,
        updatedAt: new Date()
      };
      
      await this.db.collection('watchProgress').doc(docId).set(progressDoc, { merge: true });
      
      console.log('✅ Watch progress saved to Firebase');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save watch progress:', error);
      return false;
    }
  }

  /**
   * Get watch progress from Firebase
   */
  async getWatchProgress(movieSlug) {
    try {
      if (!this.initialized) {
        await this.init();
      }
      
      if (!this.userId || !this.db) {
        return null;
      }
      
      const docId = `${this.userId}_${movieSlug}`;
      const doc = await this.db.collection('watchProgress').doc(docId).get();
      
      if (doc.exists) {
        return doc.data();
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Failed to get watch progress:', error);
      return null;
    }
  }

  // 💾 Memory Cache Management (No localStorage)
  
  updateCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Memory cache cleared');
  }

  // 🔄 Sync Operations
  
  /**
   * Force refresh from Firebase (clear cache and reload)
   */
  async forceRefresh() {
    console.log('🔄 Force refreshing from Firebase...');
    this.clearCache();
    return await this.getSavedMovies();
  }

  /**
   * Generate sync code for cross-device sync
   */
  async generateSyncCode() {
    try {
      if (!this.userId || !this.db) {
        throw new Error('Firebase Primary Storage not ready');
      }
      
      const syncCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await this.db.collection('syncCodes').doc(syncCode).set({
        userId: this.userId,
        createdAt: new Date(),
        expiresAt: expiryTime,
        used: false
      });
      
      console.log('✅ Sync code generated:', syncCode);
      return syncCode;
      
    } catch (error) {
      console.error('❌ Failed to generate sync code:', error);
      return null;
    }
  }

  /**
   * Use sync code to sync with another device
   */
  async useSyncCode(syncCode) {
    try {
      if (!this.db) {
        throw new Error('Firebase Primary Storage not ready');
      }
      
      const syncDoc = await this.db.collection('syncCodes').doc(syncCode).get();
      
      if (!syncDoc.exists) {
        throw new Error('Invalid sync code');
      }
      
      const syncData = syncDoc.data();
      
      if (syncData.used || syncData.expiresAt.toDate() < new Date()) {
        throw new Error('Sync code expired or already used');
      }
      
      // Update current user ID
      this.userId = syncData.userId;
      localStorage.setItem('movie_user_id_v2', this.userId);
      
      // Mark sync code as used
      await this.db.collection('syncCodes').doc(syncCode).update({ used: true });
      
      // Clear cache and reload
      this.clearCache();
      
      console.log('✅ Sync successful with User ID:', this.userId);
      return { success: true, userId: this.userId };
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 📊 Statistics and Info
  
  async getStorageInfo() {
    try {
      const movieCount = await this.getMovieCount();
      
      return {
        userId: this.userId,
        movieCount: movieCount,
        storageType: 'Firebase Primary',
        cacheSize: this.cache.size,
        initialized: this.initialized
      };
      
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {
        userId: this.userId,
        movieCount: 0,
        storageType: 'Firebase Primary (Error)',
        cacheSize: 0,
        initialized: false
      };
    }
  }
}

// Global instance
window.FirebasePrimaryStorage = new FirebasePrimaryStorage();

// Replace existing Storage system
window.Storage = {
  async getSavedMovies() {
    return await window.FirebasePrimaryStorage.getSavedMovies();
  },
  
  async saveMovie(movieData) {
    return await window.FirebasePrimaryStorage.saveMovie(movieData);
  },
  
  async removeMovie(movieSlug) {
    return await window.FirebasePrimaryStorage.removeMovie(movieSlug);
  },
  
  async isMovieSaved(movieSlug) {
    return await window.FirebasePrimaryStorage.isMovieSaved(movieSlug);
  },
  
  async getMovieCount() {
    return await window.FirebasePrimaryStorage.getMovieCount();
  },
  
  async forceRefresh() {
    return await window.FirebasePrimaryStorage.forceRefresh();
  },
  
  async getStorageInfo() {
    return await window.FirebasePrimaryStorage.getStorageInfo();
  }
};

// Auto-initialize when Firebase is ready
window.addEventListener('load', async () => {
  // Wait for Firebase to be ready
  let attempts = 0;
  const maxAttempts = 20;
  
  const waitForFirebase = async () => {
    if (window.movieComments?.initialized && window.firebase) {
      console.log('🔥 Firebase ready, initializing Primary Storage...');
      await window.FirebasePrimaryStorage.init();
      return;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(waitForFirebase, 500);
    } else {
      console.error('❌ Firebase initialization timeout');
    }
  };
  
  setTimeout(waitForFirebase, 1000);
});

console.log('🔥 Firebase Primary Storage System loaded');
