// 🔄 Auto-Recovery System for Firebase Data
// Tự động phát hiện và khôi phục dữ liệu khi user mất kết nối

class AutoRecoverySystem {
  constructor() {
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.recoveryResults = {
      userIdRecovered: false,
      dataRecovered: false,
      method: null,
      moviesFound: 0
    };
  }

  // 🔍 Detect Data Loss
  async detectDataLoss() {
    try {
      console.log('🔍 Checking for potential data loss...');
      
      const indicators = {
        newUserId: false,
        noSavedMovies: false,
        noUserName: false,
        emptyStorage: false
      };

      // Check if user ID looks newly generated
      const userId = window.movieComments?.getUserId();
      if (userId && userId.includes(Date.now().toString().substring(0, 8))) {
        indicators.newUserId = true;
      }

      // Check if no saved movies
      if (window.Storage) {
        const movies = await window.Storage.getSavedMovies();
        if (movies.length === 0) {
          indicators.noSavedMovies = true;
        }
      }

      // Check if no user name
      const userName = window.movieComments?.getUserName();
      if (!userName || userName === 'Khách') {
        indicators.noUserName = true;
      }

      // Check if storage is mostly empty
      const storageKeys = Object.keys(localStorage);
      if (storageKeys.length < 3) {
        indicators.emptyStorage = true;
      }

      // Calculate data loss probability
      const lossIndicators = Object.values(indicators).filter(Boolean).length;
      const dataLossProbability = lossIndicators / Object.keys(indicators).length;

      console.log('📊 Data loss indicators:', indicators);
      console.log('📊 Data loss probability:', Math.round(dataLossProbability * 100) + '%');

      return {
        hasDataLoss: dataLossProbability > 0.5,
        probability: dataLossProbability,
        indicators
      };

    } catch (error) {
      console.error('❌ Data loss detection failed:', error);
      return { hasDataLoss: false, probability: 0, indicators: {} };
    }
  }

  // 🔄 Automatic Recovery Process
  async startAutoRecovery() {
    if (this.isRecovering) {
      console.log('🔄 Recovery already in progress...');
      return this.recoveryResults;
    }

    this.isRecovering = true;
    this.recoveryAttempts++;

    console.log(`🔄 Starting auto-recovery attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts}...`);

    try {
      // Step 1: Try enhanced user ID recovery
      const userIdResult = await this._recoverUserId();
      
      // Step 2: Try data recovery
      const dataResult = await this._recoverUserData();
      
      // Step 3: Validate recovery
      const validationResult = await this._validateRecovery();

      this.recoveryResults = {
        userIdRecovered: userIdResult.success,
        dataRecovered: dataResult.success,
        method: userIdResult.method || dataResult.method,
        moviesFound: dataResult.moviesFound || 0,
        validationPassed: validationResult.success
      };

      if (this.recoveryResults.userIdRecovered || this.recoveryResults.dataRecovered) {
        console.log('✅ Auto-recovery successful:', this.recoveryResults);
        this._showRecoverySuccessNotification();
      } else {
        console.log('❌ Auto-recovery failed, showing manual options');
        this._showManualRecoveryOptions();
      }

      return this.recoveryResults;

    } catch (error) {
      console.error('❌ Auto-recovery error:', error);
      this._showRecoveryErrorNotification(error);
      return { success: false, error: error.message };
    } finally {
      this.isRecovering = false;
    }
  }

  // 🆔 User ID Recovery
  async _recoverUserId() {
    console.log('🆔 Attempting user ID recovery...');

    try {
      // Method 1: Enhanced user manager
      if (window.enhancedUserManager) {
        const recoveredId = await window.enhancedUserManager.attemptAutoRecovery();
        if (recoveredId) {
          return { success: true, method: 'enhanced_manager', userId: recoveredId };
        }
      }

      // Method 2: Check backup storage
      const backupId = await this._checkBackupStorage();
      if (backupId) {
        return { success: true, method: 'backup_storage', userId: backupId };
      }

      // Method 3: Device fingerprint matching
      const fingerprintId = await this._matchDeviceFingerprint();
      if (fingerprintId) {
        return { success: true, method: 'fingerprint_match', userId: fingerprintId };
      }

      return { success: false, method: null };

    } catch (error) {
      console.error('❌ User ID recovery failed:', error);
      return { success: false, error: error.message };
    }
  }

  async _checkBackupStorage() {
    try {
      // Check IndexedDB backup
      const idbBackup = await this._getFromIndexedDB('user_backup');
      if (idbBackup && idbBackup.userId) {
        console.log('✅ Found user backup in IndexedDB');
        return idbBackup.userId;
      }

      // Check service worker backup
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const swBackup = await this._getFromServiceWorker('user_backup');
        if (swBackup && swBackup.userId) {
          console.log('✅ Found user backup in Service Worker');
          return swBackup.userId;
        }
      }

      return null;
    } catch (error) {
      console.warn('Backup storage check failed:', error);
      return null;
    }
  }

  async _matchDeviceFingerprint() {
    try {
      if (!window.movieComments?.db) return null;

      // Get current device signature
      const deviceSignature = this._getDeviceSignature();
      
      // Search for users with similar device signatures
      // Note: This requires Firebase schema to include deviceSignature
      const snapshot = await window.movieComments.db
        .collection('userDevices')
        .where('deviceSignature', '==', deviceSignature)
        .orderBy('lastSeen', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        console.log('✅ Found matching device signature');
        return userData.userId;
      }

      return null;
    } catch (error) {
      console.warn('Device fingerprint matching failed:', error);
      return null;
    }
  }

  // 📚 Data Recovery
  async _recoverUserData() {
    console.log('📚 Attempting data recovery...');

    try {
      // Get current user ID (might be recovered or new)
      const userId = await window.movieComments?.getUserId();
      if (!userId) {
        return { success: false, reason: 'no_user_id' };
      }

      // Try to load saved movies
      const movies = await window.Storage?.getSavedMovies() || [];
      
      if (movies.length > 0) {
        console.log(`✅ Found ${movies.length} saved movies`);
        return { 
          success: true, 
          method: 'firebase_direct',
          moviesFound: movies.length 
        };
      }

      // Try alternative data sources
      const alternativeData = await this._tryAlternativeDataSources(userId);
      if (alternativeData.success) {
        return alternativeData;
      }

      return { success: false, reason: 'no_data_found' };

    } catch (error) {
      console.error('❌ Data recovery failed:', error);
      return { success: false, error: error.message };
    }
  }

  async _tryAlternativeDataSources(userId) {
    try {
      // Try direct Firebase query with different user ID patterns
      const possibleUserIds = [
        userId,
        userId.replace('_det_', '_'),  // Try old format
        userId.replace('user_det_', 'user_'),  // Try without deterministic prefix
      ];

      for (const testUserId of possibleUserIds) {
        const snapshot = await window.movieComments.db
          .collection('savedMovies')
          .where('userId', '==', testUserId)
          .limit(5)
          .get();

        if (!snapshot.empty) {
          console.log(`✅ Found data with alternative user ID: ${testUserId}`);
          
          // Update current user ID to the working one
          localStorage.setItem('movie_commenter_id', testUserId);
          
          return {
            success: true,
            method: 'alternative_user_id',
            moviesFound: snapshot.size,
            recoveredUserId: testUserId
          };
        }
      }

      return { success: false };
    } catch (error) {
      console.warn('Alternative data sources failed:', error);
      return { success: false };
    }
  }

  // ✅ Validate Recovery
  async _validateRecovery() {
    try {
      console.log('✅ Validating recovery...');

      // Check if user ID is valid
      const userId = await window.movieComments?.getUserId();
      if (!userId) {
        return { success: false, reason: 'invalid_user_id' };
      }

      // Check if Firebase is connected
      if (!window.movieComments?.initialized) {
        return { success: false, reason: 'firebase_not_connected' };
      }

      // Check if data is accessible
      const movies = await window.Storage?.getSavedMovies() || [];
      
      // Try to save a test item to verify write access
      try {
        const testMovie = {
          slug: 'recovery-test-' + Date.now(),
          name: 'Recovery Test Movie',
          poster_url: 'test',
          year: 2025
        };
        
        await window.movieComments.saveMovie(testMovie);
        
        // Remove test movie
        await window.movieComments.removeSavedMovie(testMovie.slug);
        
        console.log('✅ Recovery validation passed');
        return { 
          success: true, 
          userId, 
          moviesCount: movies.length,
          writeAccess: true 
        };
        
      } catch (writeError) {
        console.warn('Write access test failed:', writeError);
        return { 
          success: true, 
          userId, 
          moviesCount: movies.length,
          writeAccess: false 
        };
      }

    } catch (error) {
      console.error('❌ Recovery validation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔧 Utility Methods
  _getDeviceSignature() {
    try {
      const signature = [
        navigator.platform,
        navigator.hardwareConcurrency || 'unknown',
        screen.width + 'x' + screen.height,
        navigator.maxTouchPoints || 0
      ].join('|');
      
      return this._hashString(signature);
    } catch (error) {
      return 'unknown-device';
    }
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async _getFromIndexedDB(key) {
    return new Promise((resolve) => {
      const request = indexedDB.open('MovieAppStorage', 2);
      
      request.onsuccess = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('userSettings')) {
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['userSettings'], 'readonly');
        const store = transaction.objectStore('userSettings');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async _getFromServiceWorker(key) {
    if (!navigator.serviceWorker.controller) return null;
    
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        resolve(event.data.value || null);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_USER_DATA',
        key
      }, [channel.port2]);
      
      setTimeout(() => resolve(null), 2000);
    });
  }

  // 📢 Notification Methods
  _showRecoverySuccessNotification() {
    const message = `✅ Đã khôi phục thành công! Tìm thấy ${this.recoveryResults.moviesFound} phim đã lưu.`;
    this._showNotification(message, 'success');
  }

  _showManualRecoveryOptions() {
    // This will be implemented in recovery-ui.js
    if (window.recoveryUI) {
      window.recoveryUI.showManualRecoveryModal();
    }
  }

  _showRecoveryErrorNotification(error) {
    const message = `❌ Khôi phục thất bại: ${error.message}`;
    this._showNotification(message, 'error');
  }

  _showNotification(message, type = 'info') {
    if (window.movieComments && window.movieComments.showNotification) {
      window.movieComments.showNotification(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // 🎯 Public API
  async checkAndRecover() {
    const dataLoss = await this.detectDataLoss();
    
    if (dataLoss.hasDataLoss) {
      console.log('🚨 Data loss detected, starting auto-recovery...');
      return await this.startAutoRecovery();
    } else {
      console.log('✅ No data loss detected');
      return { success: true, reason: 'no_recovery_needed' };
    }
  }
}

// Global instance
window.autoRecovery = new AutoRecoverySystem();

// Auto-run on page load
window.addEventListener('load', async () => {
  // Wait for Firebase to initialize
  setTimeout(async () => {
    if (window.movieComments?.initialized) {
      await window.autoRecovery.checkAndRecover();
    }
  }, 2000);
});

console.log('🔄 Auto-Recovery System loaded');
