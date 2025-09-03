// 🔄 Migration Tool - Migrate Existing Users to Enhanced System
// Hỗ trợ chuyển đổi users hiện tại sang hệ thống Firebase enhanced

class MigrationTool {
  constructor() {
    this.migrationVersion = '2.0';
    this.migrationKey = 'firebase_migration_v2';
    this.backupKey = 'pre_migration_backup';
    this.migrationResults = {
      usersProcessed: 0,
      dataPreserved: 0,
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  // 🔍 Check if Migration is Needed
  async checkMigrationNeeded() {
    try {
      // Check if already migrated
      const migrationStatus = localStorage.getItem(this.migrationKey);
      if (migrationStatus === this.migrationVersion) {
        console.log('✅ Already migrated to version', this.migrationVersion);
        return false;
      }

      // Check for old user data
      const hasOldData = this._hasLegacyData();
      
      if (hasOldData) {
        console.log('🔄 Migration needed - found legacy data');
        return true;
      }

      // Check for users with old user ID format
      const hasOldUserId = await this._hasOldUserIdFormat();
      
      if (hasOldUserId) {
        console.log('🔄 Migration needed - old user ID format detected');
        return true;
      }

      console.log('✅ No migration needed');
      return false;

    } catch (error) {
      console.error('❌ Migration check failed:', error);
      return false;
    }
  }

  _hasLegacyData() {
    // Check for old localStorage data
    const legacyKeys = [
      'savedMovies',
      'watchProgress', 
      'movie_commenter_id',
      'movie_commenter_name'
    ];

    return legacyKeys.some(key => localStorage.getItem(key) !== null);
  }

  async _hasOldUserIdFormat() {
    try {
      const userId = localStorage.getItem('movie_commenter_id');
      
      if (!userId) return false;
      
      // Check if it's old format (contains timestamp or random without 'det' prefix)
      return !userId.includes('user_det_') && 
             (userId.includes('user_') || userId.length < 20);
             
    } catch (error) {
      return false;
    }
  }

  // 🚀 Start Migration Process
  async startMigration() {
    console.log('🚀 Starting migration to enhanced Firebase system...');
    
    this.migrationResults.startTime = Date.now();
    
    try {
      // Step 1: Create backup
      await this._createBackup();
      
      // Step 2: Migrate user identity
      await this._migrateUserIdentity();
      
      // Step 3: Migrate saved movies
      await this._migrateSavedMovies();
      
      // Step 4: Migrate watch progress
      await this._migrateWatchProgress();
      
      // Step 5: Update user preferences
      await this._migrateUserPreferences();
      
      // Step 6: Cleanup old data
      await this._cleanupLegacyData();
      
      // Step 7: Mark migration complete
      this._markMigrationComplete();
      
      this.migrationResults.endTime = Date.now();
      
      console.log('✅ Migration completed successfully:', this.migrationResults);
      
      return {
        success: true,
        results: this.migrationResults
      };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      // Attempt rollback
      await this._rollbackMigration();
      
      return {
        success: false,
        error: error.message,
        results: this.migrationResults
      };
    }
  }

  // 💾 Create Backup
  async _createBackup() {
    console.log('💾 Creating backup of existing data...');
    
    try {
      const backup = {
        timestamp: Date.now(),
        localStorage: {},
        sessionStorage: {},
        cookies: document.cookie
      };

      // Backup localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backup.localStorage[key] = localStorage.getItem(key);
      }

      // Backup sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        backup.sessionStorage[key] = sessionStorage.getItem(key);
      }

      // Save backup to IndexedDB
      await this._saveBackupToIndexedDB(backup);
      
      // Also save to localStorage as fallback
      localStorage.setItem(this.backupKey, JSON.stringify(backup));
      
      console.log('✅ Backup created successfully');

    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw new Error('Failed to create backup: ' + error.message);
    }
  }

  async _saveBackupToIndexedDB(backup) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MovieAppMigration', 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups');
        }
      };
      
      request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        
        const putRequest = store.put(backup, this.backupKey);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 🆔 Migrate User Identity
  async _migrateUserIdentity() {
    console.log('🆔 Migrating user identity...');
    
    try {
      const oldUserId = localStorage.getItem('movie_commenter_id');
      const oldUserName = localStorage.getItem('movie_commenter_name');
      
      if (!oldUserId) {
        console.log('⚠️ No existing user ID found, will generate new one');
        return;
      }

      // Generate new deterministic user ID
      let newUserId;
      if (window.enhancedUserManager) {
        newUserId = await window.enhancedUserManager.getEnhancedUserId();
      } else {
        // Fallback if enhanced manager not available
        newUserId = this._generateFallbackUserId();
      }

      // Create user mapping in Firebase for future reference
      if (window.movieComments?.db) {
        await this._createUserMapping(oldUserId, newUserId, oldUserName);
      }

      // Update local storage with new format
      localStorage.setItem('movie_user_id_v2', newUserId);
      if (oldUserName) {
        localStorage.setItem('movie_user_name_v2', oldUserName);
      }

      console.log(`✅ User identity migrated: ${oldUserId} → ${newUserId}`);
      this.migrationResults.usersProcessed++;

    } catch (error) {
      console.error('❌ User identity migration failed:', error);
      this.migrationResults.errors.push('User identity: ' + error.message);
    }
  }

  async _createUserMapping(oldUserId, newUserId, userName) {
    try {
      const mapping = {
        oldUserId,
        newUserId,
        userName: userName || 'Khách',
        migrationDate: new Date(),
        migrationVersion: this.migrationVersion
      };

      await window.movieComments.db
        .collection('userMigrations')
        .doc(oldUserId)
        .set(mapping);

      console.log('✅ User mapping created in Firebase');

    } catch (error) {
      console.warn('⚠️ Failed to create user mapping:', error);
    }
  }

  _generateFallbackUserId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `user_migrated_${random}_${timestamp}`;
  }

  // 🎬 Migrate Saved Movies
  async _migrateSavedMovies() {
    console.log('🎬 Migrating saved movies...');
    
    try {
      // Get old saved movies from localStorage
      const oldMoviesData = localStorage.getItem('savedMovies');
      if (!oldMoviesData) {
        console.log('ℹ️ No saved movies to migrate');
        return;
      }

      const oldMovies = JSON.parse(oldMoviesData);
      if (!Array.isArray(oldMovies) || oldMovies.length === 0) {
        console.log('ℹ️ No valid saved movies to migrate');
        return;
      }

      const newUserId = localStorage.getItem('movie_user_id_v2') || 
                       localStorage.getItem('movie_commenter_id');
      const userName = localStorage.getItem('movie_user_name_v2') || 
                      localStorage.getItem('movie_commenter_name') || 'Khách';

      if (!window.movieComments?.db) {
        throw new Error('Firebase not available for movie migration');
      }

      // Migrate each movie to Firebase
      const batch = window.movieComments.db.batch();
      let migratedCount = 0;

      for (const movie of oldMovies) {
        try {
          const movieData = {
            slug: movie.slug,
            name: movie.name,
            poster_url: movie.poster_url || movie.thumb_url,
            year: movie.year,
            lang: movie.lang,
            quality: movie.quality,
            episode_current: movie.episode_current,
            savedAt: movie.savedAt ? new Date(movie.savedAt) : new Date(),
            userId: newUserId,
            userName: userName,
            migratedFrom: 'localStorage',
            migrationDate: new Date()
          };

          const docRef = window.movieComments.db.collection('savedMovies').doc();
          batch.set(docRef, movieData);
          migratedCount++;

        } catch (movieError) {
          console.warn('⚠️ Failed to prepare movie for migration:', movie.slug, movieError);
          this.migrationResults.errors.push(`Movie ${movie.slug}: ${movieError.message}`);
        }
      }

      // Commit batch
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${migratedCount} movies to Firebase`);
        this.migrationResults.dataPreserved += migratedCount;
      }

    } catch (error) {
      console.error('❌ Saved movies migration failed:', error);
      this.migrationResults.errors.push('Saved movies: ' + error.message);
    }
  }

  // 📺 Migrate Watch Progress
  async _migrateWatchProgress() {
    console.log('📺 Migrating watch progress...');
    
    try {
      const oldProgressData = localStorage.getItem('watchProgress');
      if (!oldProgressData) {
        console.log('ℹ️ No watch progress to migrate');
        return;
      }

      const oldProgress = JSON.parse(oldProgressData);
      if (typeof oldProgress !== 'object') {
        console.log('ℹ️ No valid watch progress to migrate');
        return;
      }

      const newUserId = localStorage.getItem('movie_user_id_v2') || 
                       localStorage.getItem('movie_commenter_id');

      if (!window.movieComments?.db) {
        throw new Error('Firebase not available for progress migration');
      }

      const batch = window.movieComments.db.batch();
      let migratedCount = 0;

      for (const [movieSlug, progressInfo] of Object.entries(oldProgress)) {
        try {
          const progressData = {
            movieSlug,
            userId: newUserId,
            ...progressInfo,
            migratedFrom: 'localStorage',
            migrationDate: new Date(),
            updatedAt: new Date()
          };

          const docId = `${newUserId}_${movieSlug}`;
          const docRef = window.movieComments.db.collection('watchProgress').doc(docId);
          batch.set(docRef, progressData, { merge: true });
          migratedCount++;

        } catch (progressError) {
          console.warn('⚠️ Failed to prepare progress for migration:', movieSlug, progressError);
          this.migrationResults.errors.push(`Progress ${movieSlug}: ${progressError.message}`);
        }
      }

      // Commit batch
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${migratedCount} watch progress entries to Firebase`);
        this.migrationResults.dataPreserved += migratedCount;
      }

    } catch (error) {
      console.error('❌ Watch progress migration failed:', error);
      this.migrationResults.errors.push('Watch progress: ' + error.message);
    }
  }

  // ⚙️ Migrate User Preferences
  async _migrateUserPreferences() {
    console.log('⚙️ Migrating user preferences...');
    
    try {
      const preferences = {
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language'),
        autoplay: localStorage.getItem('autoplay'),
        quality: localStorage.getItem('preferredQuality')
      };

      // Filter out null values
      const validPreferences = Object.fromEntries(
        Object.entries(preferences).filter(([_, value]) => value !== null)
      );

      if (Object.keys(validPreferences).length > 0) {
        // Save to new format
        localStorage.setItem('user_preferences_v2', JSON.stringify(validPreferences));
        console.log('✅ User preferences migrated');
      }

    } catch (error) {
      console.error('❌ User preferences migration failed:', error);
      this.migrationResults.errors.push('User preferences: ' + error.message);
    }
  }

  // 🧹 Cleanup Legacy Data
  async _cleanupLegacyData() {
    console.log('🧹 Cleaning up legacy data...');
    
    try {
      const legacyKeys = [
        'savedMovies',
        'watchProgress',
        'movie_commenter_id',
        'movie_commenter_name'
      ];

      // Don't remove immediately - keep for a grace period
      const cleanupDate = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      
      legacyKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          // Mark for cleanup instead of immediate removal
          localStorage.setItem(`${key}_cleanup_${cleanupDate}`, value);
          localStorage.removeItem(key);
        }
      });

      console.log('✅ Legacy data marked for cleanup');

    } catch (error) {
      console.error('❌ Legacy data cleanup failed:', error);
      this.migrationResults.errors.push('Cleanup: ' + error.message);
    }
  }

  // ✅ Mark Migration Complete
  _markMigrationComplete() {
    localStorage.setItem(this.migrationKey, this.migrationVersion);
    localStorage.setItem(`${this.migrationKey}_date`, Date.now().toString());
    console.log('✅ Migration marked as complete');
  }

  // 🔄 Rollback Migration
  async _rollbackMigration() {
    console.log('🔄 Attempting migration rollback...');
    
    try {
      // Get backup from IndexedDB
      const backup = await this._getBackupFromIndexedDB();
      
      if (backup) {
        // Restore localStorage
        Object.entries(backup.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        // Restore sessionStorage
        Object.entries(backup.sessionStorage).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });

        console.log('✅ Migration rollback completed');
      } else {
        console.warn('⚠️ No backup found for rollback');
      }

    } catch (error) {
      console.error('❌ Migration rollback failed:', error);
    }
  }

  async _getBackupFromIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('MovieAppMigration', 1);
      
      request.onsuccess = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('backups')) {
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        const getRequest = store.get(this.backupKey);
        
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  // 🎯 Public API
  async autoMigrate() {
    const needsMigration = await this.checkMigrationNeeded();
    
    if (needsMigration) {
      console.log('🚀 Auto-migration starting...');
      return await this.startMigration();
    } else {
      return { success: true, reason: 'no_migration_needed' };
    }
  }

  getMigrationStatus() {
    const migrationStatus = localStorage.getItem(this.migrationKey);
    const migrationDate = localStorage.getItem(`${this.migrationKey}_date`);
    
    return {
      version: migrationStatus,
      date: migrationDate ? new Date(parseInt(migrationDate)) : null,
      isComplete: migrationStatus === this.migrationVersion
    };
  }
}

// Global instance
window.migrationTool = new MigrationTool();

// Auto-run migration check on load
window.addEventListener('load', async () => {
  // Wait for Firebase to initialize
  setTimeout(async () => {
    try {
      await window.migrationTool.autoMigrate();
    } catch (error) {
      console.error('❌ Auto-migration failed:', error);
    }
  }, 3000);
});

console.log('🔄 Migration Tool loaded');
