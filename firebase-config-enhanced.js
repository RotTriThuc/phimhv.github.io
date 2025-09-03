// 🔥 Enhanced Firebase Config with Improved User ID Persistence
// Giải quyết vấn đề mất dữ liệu khi clear cookies/storage

// Import original config
// This should be loaded after firebase-config.js

class EnhancedUserManager {
  constructor() {
    this.storageKeys = {
      userId: 'movie_user_id_v2',
      userName: 'movie_user_name_v2',
      deviceSignature: 'movie_device_sig_v2',
      backup: 'movie_user_backup_v2'
    };
    
    this.initialized = false;
    this.recoveryAttempted = false;
  }

  // 🔧 Enhanced Browser Fingerprinting
  _getEnhancedFingerprint() {
    try {
      const fingerprint = [
        // Hardware info (stable)
        navigator.hardwareConcurrency || 'unknown',
        navigator.maxTouchPoints || 0,
        navigator.deviceMemory || 'unknown',
        
        // Screen info (stable)
        screen.width,
        screen.height,
        screen.colorDepth,
        screen.pixelDepth,
        
        // Platform info (stable)
        navigator.platform,
        navigator.cookieEnabled,
        navigator.doNotTrack || 'unknown',
        
        // Timezone (relatively stable)
        new Date().getTimezoneOffset(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Language (stable)
        navigator.language,
        navigator.languages?.join(',') || '',
        
        // WebGL fingerprint (more stable than canvas)
        this._getWebGLFingerprint(),
        
        // Audio context fingerprint
        this._getAudioFingerprint()
      ].join('|');

      return this._hashString(fingerprint);
    } catch (error) {
      console.warn('Enhanced fingerprinting failed:', error);
      return this._getFallbackFingerprint();
    }
  }

  _getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'no-webgl';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL || gl.VENDOR);
      const renderer = gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER);
      
      return `${vendor}|${renderer}`;
    } catch (error) {
      return 'webgl-error';
    }
  }

  _getAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const fingerprint = [
        audioContext.sampleRate,
        audioContext.baseLatency || 'unknown',
        analyser.fftSize,
        analyser.frequencyBinCount
      ].join('|');
      
      audioContext.close();
      return fingerprint;
    } catch (error) {
      return 'audio-error';
    }
  }

  _getFallbackFingerprint() {
    // Fallback to original method if enhanced fails
    return [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // 🔐 Deterministic User ID Generation
  _generateDeterministicUserId() {
    const fingerprint = this._getEnhancedFingerprint();
    const deviceSignature = this._getDeviceSignature();
    
    // Create deterministic ID based on stable device characteristics
    const deterministicPart = this._hashString(fingerprint + deviceSignature);
    
    return `user_det_${deterministicPart}`;
  }

  _getDeviceSignature() {
    try {
      const signature = [
        navigator.platform,
        navigator.hardwareConcurrency || 'unknown',
        screen.width + 'x' + screen.height,
        navigator.maxTouchPoints || 0,
        navigator.deviceMemory || 'unknown'
      ].join('|');
      
      return this._hashString(signature);
    } catch (error) {
      return 'unknown-device';
    }
  }

  // 💾 Multiple Storage Strategy
  async _saveUserIdToAllStorage(userId) {
    const promises = [];
    
    try {
      // 1. localStorage (primary)
      localStorage.setItem(this.storageKeys.userId, userId);
      
      // 2. sessionStorage (backup)
      sessionStorage.setItem(this.storageKeys.userId, userId);
      
      // 3. IndexedDB (persistent across clear)
      promises.push(this._saveToIndexedDB(this.storageKeys.userId, userId));
      
      // 4. Service Worker cache (if available)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        promises.push(this._saveToServiceWorker(this.storageKeys.userId, userId));
      }
      
      // 5. Cookie with long expiry (1 year)
      const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      document.cookie = `${this.storageKeys.userId}=${userId}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
      
      await Promise.allSettled(promises);
      console.log('✅ User ID saved to all storage methods');
      
    } catch (error) {
      console.warn('⚠️ Some storage methods failed:', error);
    }
  }

  async _tryGetUserIdFromAllStorage() {
    // Try in order of reliability
    const sources = [
      () => localStorage.getItem(this.storageKeys.userId),
      () => sessionStorage.getItem(this.storageKeys.userId),
      () => this._getCookieValue(this.storageKeys.userId),
      () => this._getFromIndexedDB(this.storageKeys.userId),
      () => this._getFromServiceWorker(this.storageKeys.userId)
    ];

    for (const getSource of sources) {
      try {
        const userId = await getSource();
        if (userId) {
          console.log('✅ User ID recovered from storage');
          // Save back to primary storage
          localStorage.setItem(this.storageKeys.userId, userId);
          return userId;
        }
      } catch (error) {
        console.warn('Storage source failed:', error);
      }
    }

    return null;
  }

  _getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  // 🗄️ IndexedDB Operations
  async _saveToIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MovieAppStorage', 2);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings');
        }
      };
      
      request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['userSettings'], 'readwrite');
        const store = transaction.objectStore('userSettings');
        
        const putRequest = store.put(value, key);
        putRequest.onsuccess = () => resolve(value);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
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

  // 🔧 Service Worker Operations
  async _saveToServiceWorker(key, value) {
    if (!navigator.serviceWorker.controller) return;
    
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_USER_DATA',
      key,
      value
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
      
      // Timeout after 2 seconds
      setTimeout(() => resolve(null), 2000);
    });
  }

  // 🔄 Auto-Recovery Mechanism
  async attemptAutoRecovery() {
    if (this.recoveryAttempted) return null;
    this.recoveryAttempted = true;
    
    console.log('🔄 Attempting auto-recovery...');
    
    try {
      // 1. Try to get user ID from any storage
      let userId = await this._tryGetUserIdFromAllStorage();
      
      if (userId) {
        console.log('✅ User ID recovered from storage:', userId);
        return userId;
      }
      
      // 2. Try deterministic generation
      userId = this._generateDeterministicUserId();
      
      // 3. Check if this deterministic ID has data in Firebase
      if (window.movieComments?.initialized) {
        const hasData = await this._checkUserHasData(userId);
        
        if (hasData) {
          console.log('✅ Auto-recovery successful with deterministic ID');
          await this._saveUserIdToAllStorage(userId);
          return userId;
        }
      }
      
      // 4. Try device signature matching
      const matchedUserId = await this._findUserByDeviceSignature();
      
      if (matchedUserId) {
        console.log('✅ Auto-recovery successful with device matching');
        await this._saveUserIdToAllStorage(matchedUserId);
        return matchedUserId;
      }
      
      console.log('❌ Auto-recovery failed, will need manual intervention');
      return null;
      
    } catch (error) {
      console.error('❌ Auto-recovery error:', error);
      return null;
    }
  }

  async _checkUserHasData(userId) {
    try {
      if (!window.movieComments?.db) return false;
      
      const snapshot = await window.movieComments.db
        .collection('savedMovies')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.warn('Check user data failed:', error);
      return false;
    }
  }

  async _findUserByDeviceSignature() {
    try {
      if (!window.movieComments?.db) return null;
      
      const deviceSignature = this._getDeviceSignature();
      
      // This would require adding deviceSignature to user documents
      // For now, return null as this needs Firebase schema update
      return null;
      
    } catch (error) {
      console.warn('Device signature matching failed:', error);
      return null;
    }
  }

  // 🎯 Main Enhanced getUserId Method
  async getEnhancedUserId() {
    if (!this.initialized) {
      await this.init();
    }
    
    // Try to get existing user ID
    let userId = await this._tryGetUserIdFromAllStorage();
    
    if (!userId) {
      // Attempt auto-recovery
      userId = await this.attemptAutoRecovery();
    }
    
    if (!userId) {
      // Generate new deterministic ID
      userId = this._generateDeterministicUserId();
      await this._saveUserIdToAllStorage(userId);
      console.log('🆔 Generated new deterministic User ID:', userId);
    }
    
    return userId;
  }

  async init() {
    this.initialized = true;
    console.log('🔧 Enhanced User Manager initialized');
  }
}

// Global instance
window.enhancedUserManager = new EnhancedUserManager();

// Enhance existing movieComments system
if (window.movieComments) {
  const originalGetUserId = window.movieComments.getUserId.bind(window.movieComments);
  
  window.movieComments.getUserId = async function() {
    try {
      return await window.enhancedUserManager.getEnhancedUserId();
    } catch (error) {
      console.warn('Enhanced getUserId failed, falling back:', error);
      return originalGetUserId();
    }
  };
  
  console.log('✅ Enhanced User ID system activated');
}

console.log('🔥 Enhanced Firebase Config loaded');
