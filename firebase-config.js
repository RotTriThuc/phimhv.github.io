// 🔥 Firebase Comment System for GitHub Pages
// Hoàn toàn miễn phí, không cần server backend

// FIREBASE CONFIG - Real configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
  authDomain: "phim-comments.firebaseapp.com",
  projectId: "phim-comments",
  storageBucket: "phim-comments.firebasestorage.app",
  messagingSenderId: "338411994257",
  appId: "1:338411994257:web:870b6a7cd166a50bc75330"
};

// 💡 HƯỚNG DẪN LẤY CONFIG:
// 1. https://console.firebase.google.com → [+ Add project]
// 2. Tên project: "phim-comments" → Disable Analytics → Create
// 3. "Firestore Database" → Create → Test mode → asia-southeast1  
// 4. Project Overview → "</>" Web icon → App name → Copy config

class MovieCommentSystem {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.cache = new Map();
  }

  // Khởi tạo Firebase
  async init() {
    try {
      // Enhanced logging for debugging GitHub Pages issues
      console.log('🔥 Initializing Movie Comment System...');
      console.log('🌐 Environment details:', {
        hostname: window.location.hostname,
        origin: window.location.origin,
        isLocalhost: window.location.hostname.includes('localhost'),
        isGitHub: window.location.hostname.includes('github.io'),
        userAgent: navigator.userAgent.substring(0, 100) + '...'
      });

      // Validate config
      if (!this.validateConfig()) {
        throw new Error('Please update Firebase config in firebase-config.js');
      }

      // Load Firebase SDK
      await this.loadFirebase();

      // Initialize Firebase app
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      this.db = firebase.firestore();

      // Enable offline support
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
        console.log('💾 Offline support enabled');
      } catch (err) {
        console.warn('⚠️ Offline support failed:', err.code);
      }

      // Debug User ID generation
      const userId = this.getUserId();
      const userName = this.getUserName();
      console.log('🆔 User identification:', {
        userId: userId.substring(0, 30) + '...',
        userName: userName,
        fingerprint: this._getBrowserFingerprint(),
        storageAvailable: {
          localStorage: !!localStorage.getItem('movie_commenter_id'),
          sessionStorage: !!sessionStorage.getItem('movie_commenter_id')
        }
      });

      // Auto-detect and suggest sync if needed
      this._checkAndSuggestSync();

      this.initialized = true;
      console.log('✅ Comment system ready!');
      return true;
    } catch (error) {
      console.error('❌ Init failed:', error);
      return false;
    }
  }

  // Validate Firebase config
  validateConfig() {
    const required = ['apiKey', 'authDomain', 'projectId'];
    return required.every(field => 
      firebaseConfig[field] && 
      !firebaseConfig[field].includes('your-')
    );
  }

  // Load Firebase SDK - Using v8 compat for easier integration
  async loadFirebase() {
    if (window.firebase) {
      console.log('🔄 Firebase already loaded, skipping...');
      return;
    }
    
    const scripts = [
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
    ];

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          console.log(`✅ Loaded: ${src.split('/').pop()}`);
          resolve();
        };
        script.onerror = () => {
          console.error(`❌ Failed to load: ${src}`);
          reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
      });
    }
  }

  // 🔑 CROSS-BROWSER USER ID SYSTEM
  // Tạo User ID persistent cross-browser với multiple storage methods
  getUserId() {
    // Try multiple storage methods for cross-browser persistence
    let userId = this._tryGetUserIdFromStorage();

    if (!userId) {
      // Try to get User ID from cross-environment sync
      userId = this._tryGetCrossEnvironmentUserId();

      if (userId) {
        console.log('🔄 Found cross-environment User ID, using it:', userId.substring(0, 30) + '...');
        this._saveUserIdToAllStorage(userId);
      } else {
        // Generate new user ID with better entropy
        userId = this._generateUserId();
        this._saveUserIdToAllStorage(userId);
        console.log('🆔 Generated new cross-browser User ID:', userId.substring(0, 30) + '...');

        // Save for cross-environment sync
        this._saveCrossEnvironmentUserId(userId);
      }
    }

    return userId;
  }

  _tryGetUserIdFromStorage() {
    // Try localStorage first
    let userId = localStorage.getItem('movie_commenter_id');
    if (userId) {
      console.log('🆔 Found User ID in localStorage:', userId.substring(0, 20) + '...');
      return userId;
    }

    // Try sessionStorage
    userId = sessionStorage.getItem('movie_commenter_id');
    if (userId) {
      console.log('🆔 Found User ID in sessionStorage, saving to localStorage');
      // Save back to localStorage for persistence
      localStorage.setItem('movie_commenter_id', userId);
      return userId;
    }

    // Try IndexedDB (for cross-browser persistence)
    userId = this._getFromIndexedDB();
    if (userId) {
      console.log('🆔 Found User ID in IndexedDB, saving to localStorage');
      localStorage.setItem('movie_commenter_id', userId);
      return userId;
    }

    console.log('🆔 No existing User ID found, will generate new one');
    return null;
  }

  _generateUserId() {
    // Create more unique ID with browser fingerprint
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const browserFingerprint = this._getBrowserFingerprint();
    const userId = `user_${browserFingerprint}_${random}_${timestamp}`;

    console.log('🆔 Generated new User ID:', {
      fingerprint: browserFingerprint,
      userId: userId.substring(0, 30) + '...',
      domain: window.location.hostname,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });

    return userId;
  }

  _getBrowserFingerprint() {
    // Create semi-persistent browser fingerprint that works across domains
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);

    // Normalize user agent to remove domain-specific differences
    const normalizedUserAgent = navigator.userAgent
      .replace(/localhost:\d+/g, 'localhost')
      .replace(/127\.0\.0\.1:\d+/g, 'localhost')
      .replace(/\.github\.io/g, '.github.io'); // Normalize GitHub Pages domains

    const fingerprint = [
      normalizedUserAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      // Use a more stable canvas fingerprint
      this._getStableCanvasFingerprint()
    ].join('|');

    // Create short hash from fingerprint
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36).substring(0, 8);
  }

  _getStableCanvasFingerprint() {
    // Create a more stable canvas fingerprint
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    // Use consistent rendering that's less likely to vary between environments
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    ctx.fillText('Cross-browser fingerprint 🔑', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18pt Arial';
    ctx.fillText('Stable ID', 4, 45);

    // Return a hash of the canvas data instead of the full data URL
    const imageData = canvas.toDataURL();
    let canvasHash = 0;
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i);
      canvasHash = ((canvasHash << 5) - canvasHash) + char;
      canvasHash = canvasHash & canvasHash;
    }

    return Math.abs(canvasHash).toString(36).substring(0, 12);
  }

  _saveUserIdToAllStorage(userId) {
    try {
      // Save to localStorage
      localStorage.setItem('movie_commenter_id', userId);

      // Save to sessionStorage as backup
      sessionStorage.setItem('movie_commenter_id', userId);

      // Save to IndexedDB for cross-browser persistence
      this._saveToIndexedDB(userId);

      console.log('💾 User ID saved to all storage methods');
    } catch (error) {
      console.warn('⚠️ Failed to save user ID to some storage methods:', error);
    }
  }

  _getFromIndexedDB() {
    // This is synchronous fallback - in real implementation would be async
    // For now, return null and let it generate new ID
    return null;
  }

  // 🔄 CROSS-ENVIRONMENT USER ID SYNC
  // Try to get User ID from cross-environment storage
  _tryGetCrossEnvironmentUserId() {
    try {
      // Try to get from URL hash (temporary sync)
      const urlUserId = this._getUserIdFromURL();
      if (urlUserId) {
        console.log('🔗 Found User ID in URL hash');
        return urlUserId;
      }

      // Try to get from shared storage key (based on browser fingerprint)
      const sharedUserId = this._getUserIdFromSharedStorage();
      if (sharedUserId) {
        console.log('🔗 Found User ID in shared storage');
        return sharedUserId;
      }

      return null;
    } catch (error) {
      console.warn('⚠️ Cross-environment sync failed:', error);
      return null;
    }
  }

  // Save User ID for cross-environment access
  _saveCrossEnvironmentUserId(userId) {
    try {
      // Save with shared key based on browser characteristics
      const sharedKey = this._getSharedStorageKey();
      localStorage.setItem(sharedKey, userId);

      // Also save with timestamp for cleanup
      const timestampKey = `${sharedKey}_timestamp`;
      localStorage.setItem(timestampKey, Date.now().toString());

      console.log('💾 Saved User ID for cross-environment sync');
    } catch (error) {
      console.warn('⚠️ Failed to save cross-environment User ID:', error);
    }
  }

  // Get User ID from URL hash (for temporary sync)
  _getUserIdFromURL() {
    const hash = window.location.hash;
    const match = hash.match(/[?&]userId=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Get User ID from shared storage
  _getUserIdFromSharedStorage() {
    const sharedKey = this._getSharedStorageKey();
    const userId = localStorage.getItem(sharedKey);

    if (userId) {
      // Check if not too old (7 days)
      const timestampKey = `${sharedKey}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const age = Date.now() - parseInt(timestamp || '0');
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (age < maxAge) {
        return userId;
      } else {
        // Clean up old data
        localStorage.removeItem(sharedKey);
        localStorage.removeItem(timestampKey);
      }
    }

    return null;
  }

  // Generate shared storage key based on stable browser characteristics
  _getSharedStorageKey() {
    // Use stable characteristics that don't change between localhost/GitHub
    const stableFingerprint = [
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform || 'unknown'
    ].join('|');

    // Create hash
    let hash = 0;
    for (let i = 0; i < stableFingerprint.length; i++) {
      const char = stableFingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return `movie_shared_user_${Math.abs(hash).toString(36)}`;
  }

  // Get browser info for display and sync tracking
  _getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';

    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
    else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

    return browser;
  }

  // Auto-detect and suggest sync if needed
  async _checkAndSuggestSync() {
    try {
      const isGitHub = window.location.hostname.includes('github.io');
      const isLocalhost = window.location.hostname.includes('localhost');

      if (isGitHub) {
        console.log('🌐 GitHub Pages detected - checking sync options');

        // Priority 1: Auto-sync between browsers on same device (seamless)
        await this._checkSeamlessAutoSync();

        // Priority 2: Manual sync for cross-device (PC ↔ phone) only if no data
        const movies = await this.getSavedMovies();
        const progress = await this.getAllWatchProgress();

        if (movies.length === 0 && progress.length === 0) {
          console.log('🔄 No data found - checking for cross-device sync options');

          // Check environment sync (localhost ↔ GitHub Pages)
          const sharedUserId = this._getUserIdFromSharedStorage();
          if (sharedUserId && sharedUserId !== this.getUserId()) {
            console.log('💡 Found potential User ID from localhost');
            this._showEnvironmentSyncSuggestion(sharedUserId);
          }
        }
      }

      // If on localhost, save User ID for GitHub Pages sync
      if (isLocalhost) {
        this._saveCrossEnvironmentUserId(this.getUserId());
      }

    } catch (error) {
      console.warn('⚠️ Auto-sync check failed:', error);
    }
  }

  // Show environment sync suggestion (localhost ↔ GitHub Pages)
  _showEnvironmentSyncSuggestion(suggestedUserId) {
    // Only show if not already dismissed
    const dismissed = localStorage.getItem('environment_sync_dismissed');
    if (dismissed) return;

    console.log('💡 Showing environment sync suggestion (localhost ↔ GitHub Pages)');

    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      color: white; padding: 15px 20px; border-radius: 8px;
      box-shadow: 0 4px 20px rgba(108, 92, 231, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 350px; font-size: 14px; line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 18px; margin-right: 8px;">🏠</span>
        <strong>Sync dữ liệu từ localhost?</strong>
      </div>
      <div style="margin-bottom: 15px; opacity: 0.9;">
        Phát hiện bạn có dữ liệu phim đã lưu từ localhost. Muốn đồng bộ không?
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="this.parentElement.parentElement.remove(); window.movieComments._autoSyncFromLocalhost('${suggestedUserId}')"
                style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ✅ Đồng bộ
        </button>
        <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('environment_sync_dismissed', Date.now())"
                style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ❌ Bỏ qua
        </button>
      </div>
      <div style="margin-top: 10px; font-size: 11px; opacity: 0.7;">
        💡 Sync giữa trình duyệt sẽ tự động, không cần mã code
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  // Auto-sync from localhost
  async _autoSyncFromLocalhost(localhostUserId) {
    try {
      console.log('🔄 Auto-syncing from localhost User ID');

      // Update current User ID
      this._saveUserIdToAllStorage(localhostUserId);

      // Clear current data to avoid conflicts
      await this.clearAllSavedMovies();

      // Reload the page to use new User ID
      console.log('🔄 Reloading page with synced User ID...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    }
  }

  _saveToIndexedDB(userId) {
    // Simple IndexedDB save (fire and forget)
    try {
      const request = indexedDB.open('MovieApp', 1);
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
        store.put(userId, 'userId');
      };
    } catch (error) {
      console.warn('⚠️ IndexedDB save failed:', error);
    }
  }

  // 👤 CROSS-BROWSER USER MANAGEMENT
  // Lấy tên user
  getUserName() {
    return localStorage.getItem('movie_commenter_name') || 'Khách';
  }

  // Set tên user
  setUserName(name) {
    const sanitized = name.trim().substring(0, 30).replace(/[<>]/g, '');
    localStorage.setItem('movie_commenter_name', sanitized);
    // Also save to sessionStorage for backup
    sessionStorage.setItem('movie_commenter_name', sanitized);
    return sanitized;
  }

  // 🔐 SYNC CODE SYSTEM for Cross-Browser Sync
  // Generate sync code for user
  generateSyncCode() {
    const userId = this.getUserId();
    const userName = this.getUserName();

    // Create 6-digit sync code
    const syncCode = Math.random().toString().substring(2, 8);

    // Save sync mapping to Firebase
    this._saveSyncCode(syncCode, userId, userName);

    return syncCode;
  }

  async _saveSyncCode(syncCode, userId, userName) {
    try {
      await this.db.collection('syncCodes').doc(syncCode).set({
        userId: userId,
        userName: userName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      console.log('🔑 Sync code saved:', syncCode);
    } catch (error) {
      console.error('❌ Failed to save sync code:', error);
    }
  }

  // Use sync code to sync with another device
  async useSyncCode(syncCode) {
    console.log('🔄 Starting sync process with code:', syncCode);

    // Log current user before sync
    const currentUserId = this.getUserId();
    const currentUserName = this.getUserName();
    console.log('📊 Current user before sync:', { currentUserId, currentUserName });

    try {
      const doc = await this.db.collection('syncCodes').doc(syncCode).get();

      if (!doc.exists) {
        throw new Error('Mã sync không tồn tại hoặc đã hết hạn');
      }

      const data = doc.data();
      const now = new Date();
      const expiresAt = data.expiresAt.toDate();

      if (now > expiresAt) {
        throw new Error('Mã sync đã hết hạn');
      }

      // Apply the synced user data
      localStorage.setItem('movie_commenter_id', data.userId);
      localStorage.setItem('movie_commenter_name', data.userName);
      sessionStorage.setItem('movie_commenter_id', data.userId);
      sessionStorage.setItem('movie_commenter_name', data.userName);

      // Clear all caches to force reload with new user data
      if (window.Storage) {
        window.Storage._savedMoviesCache = null;
        window.Storage._watchProgressCache = null;
        window.Storage._lastCacheUpdate = 0; // Reset cache timestamp
        window.Storage._forceFirebaseMode = true; // Force Firebase mode after sync
      }

      // Clear any remaining localStorage data (legacy cleanup)
      localStorage.removeItem('savedMovies');
      localStorage.removeItem('watchProgress');

      console.log('🗑️ Cleared legacy localStorage data (Firebase-only mode)');

      // Delete the sync code after use
      await this.db.collection('syncCodes').doc(syncCode).delete();

      console.log('✅ Synced with user:', data.userName);
      console.log('🔄 Cleared all caches for new user data');

      return {
        userId: data.userId,
        userName: data.userName
      };

    } catch (error) {
      console.error('❌ Sync code failed:', error);
      throw error;
    }
  }

  // Check for seamless auto-sync opportunities from other browsers
  async _checkSeamlessAutoSync() {
    try {
      if (!this.initialized) {
        console.log('⚠️ Firebase not initialized yet, skipping seamless sync check');
        return;
      }

      const deviceId = this._getSeamlessDeviceId();
      const currentBrowser = this._getBrowserInfo();

      console.log('🚀 Checking seamless auto-sync for device:', deviceId);

      // Check Firebase for existing sync data
      const doc = await this.db.collection('seamlessSync').doc(deviceId).get();

      if (doc.exists) {
        const syncData = doc.data();
        const browsers = Object.keys(syncData.browsers || {});

        // Check if there are other browsers with data
        const otherBrowsers = browsers.filter(browser => browser !== currentBrowser);

        if (otherBrowsers.length > 0 && syncData.userId !== this.getUserId()) {
          console.log('🚀 Found seamless sync data from other browsers:', otherBrowsers);

          // Check if current user has no data
          const movies = await this.getSavedMovies();
          const progress = await this.getAllWatchProgress();

          if (movies.length === 0 && progress.length === 0) {
            console.log('💡 Auto-syncing seamlessly from other browsers');
            await this._performSeamlessAutoSync(syncData);
          }
        }
      } else {
        // No existing sync data, create one for future cross-browser sync
        console.log('💾 Creating seamless sync registry for future cross-browser sync');
        await this._registerForSeamlessSync(this.getUserId());
      }

    } catch (error) {
      console.warn('⚠️ Seamless auto-sync check failed:', error);
    }
  }

  // Get seamless device ID (stable across browsers on same device)
  _getSeamlessDeviceId() {
    // Use ultra-stable characteristics that don't change between browsers
    const stableCharacteristics = [
      // Screen characteristics (identical across browsers)
      screen.width,
      screen.height,
      screen.colorDepth,

      // System characteristics (identical across browsers)
      navigator.language,
      new Date().getTimezoneOffset(),

      // Hardware characteristics (when available)
      navigator.hardwareConcurrency || 4,
      navigator.deviceMemory || 4,

      // Additional stable characteristics
      navigator.maxTouchPoints || 0,
      screen.pixelDepth || 24
    ].join('|');

    // Create stable hash
    let hash = 0;
    for (let i = 0; i < stableCharacteristics.length; i++) {
      const char = stableCharacteristics.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return `device_${Math.abs(hash).toString(36)}`;
  }

  // Register User ID for seamless sync across browsers
  async _registerForSeamlessSync(userId) {
    try {
      if (!this.initialized) return;

      const deviceId = this._getSeamlessDeviceId();
      const browserInfo = this._getBrowserInfo();

      console.log('🚀 Registering for seamless sync:', { deviceId, browserInfo });

      // Save to Firebase for cross-browser access
      await this.db.collection('seamlessSync').doc(deviceId).set({
        userId: userId,
        userName: this.getUserName(),
        deviceId: deviceId,
        browsers: {
          [browserInfo]: {
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent.substring(0, 200)
          }
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('✅ Registered for seamless sync successfully');

    } catch (error) {
      console.error('❌ Failed to register for seamless sync:', error);
    }
  }

  // Perform seamless auto-sync without user intervention
  async _performSeamlessAutoSync(syncData) {
    try {
      console.log('🚀 Performing seamless auto-sync...');

      const currentUserId = this.getUserId();
      const syncUserId = syncData.userId;

      if (currentUserId !== syncUserId) {
        // Update User ID silently
        this._saveUserIdToAllStorage(syncUserId);

        // Update user name if available
        if (syncData.userName) {
          this.setUserName(syncData.userName);
        }

        console.log('✅ Seamless auto-sync completed silently');

        // Show subtle notification
        this._showSeamlessSyncNotification(syncData);

        // Refresh data in background
        setTimeout(() => {
          this._refreshDataAfterSeamlessSync();
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Seamless auto-sync failed:', error);
    }
  }

  // Show subtle notification for seamless sync
  _showSeamlessSyncNotification(syncData) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 10000;
      background: linear-gradient(135deg, #00b894, #00cec9);
      color: white; padding: 12px 16px; border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px; max-width: 300px;
      animation: slideInUp 0.3s ease-out;
      opacity: 0.95;
    `;

    const browsers = Object.keys(syncData.browsers || {});
    const otherBrowsers = browsers.filter(b => b !== this._getBrowserInfo());

    notification.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="font-size: 16px; margin-right: 8px;">🚀</span>
        <div>
          <div style="font-weight: 500;">Đã đồng bộ tự động</div>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
            Từ ${otherBrowsers[0] || 'trình duyệt khác'}
          </div>
        </div>
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 0.95; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  // Refresh data after seamless sync
  async _refreshDataAfterSeamlessSync() {
    try {
      // Trigger data refresh events
      const refreshEvent = new CustomEvent('seamlessSync', {
        detail: { type: 'dataRefresh' }
      });
      window.dispatchEvent(refreshEvent);

      console.log('🔄 Data refresh triggered after seamless sync');

    } catch (error) {
      console.warn('⚠️ Failed to refresh data after seamless sync:', error);
    }
  }

  // Show sync UI dialog
  showSyncDialog() {
    const existingDialog = document.querySelector('.sync-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }

    const dialog = document.createElement('div');
    dialog.className = 'sync-dialog';
    dialog.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const currentUserId = this.getUserId();
    const currentUserName = this.getUserName();

    dialog.innerHTML = `
      <div style="background: #1e1e1e; border-radius: 12px; padding: 30px; max-width: 450px; width: 90%; color: #fff;">
        <h3 style="margin: 0 0 20px 0; text-align: center; color: #6c5ce7;">🔄 Đồng bộ dữ liệu</h3>

        <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 14px; color: #888; margin-bottom: 5px;">Thiết bị hiện tại:</div>
          <div style="font-weight: 500;">${currentUserName}</div>
          <div style="font-size: 12px; color: #666; word-break: break-all;">${currentUserId}</div>
          <div style="font-size: 12px; color: #888; margin-top: 5px;">Trình duyệt: ${this._getBrowserInfo()}</div>
        </div>

        <!-- Auto-Sync Info -->
        <div style="background: linear-gradient(135deg, #00b894, #00cec9); padding: 15px; border-radius: 8px; margin-bottom: 20px; color: white;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 18px; margin-right: 8px;">🚀</span>
            <strong>Auto-Sync giữa trình duyệt</strong>
          </div>
          <div style="font-size: 13px; opacity: 0.9;">
            Dữ liệu tự động đồng bộ giữa Edge, Chrome, Opera, Firefox trên cùng thiết bị - không cần mã code!
          </div>
        </div>

        <!-- Manual Sync for Cross-Device -->
        <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6c5ce7;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 16px; margin-right: 8px;">📱</span>
            <strong style="color: #6c5ce7;">Sync PC ↔ Điện thoại</strong>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <button id="generate-sync-code" style="flex: 1; padding: 10px; background: #6c5ce7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              📤 Tạo mã
            </button>
            <button id="use-sync-code" style="flex: 1; padding: 10px; background: #a29bfe; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              📥 Nhập mã
            </button>
          </div>

          <div style="font-size: 11px; color: #888;">
            Dùng mã sync để đồng bộ giữa PC và điện thoại
          </div>
        </div>

        <div id="sync-content" style="min-height: 80px; text-align: center; color: #888; padding: 20px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-size: 16px; margin-bottom: 10px;">💡</div>
          <div><strong>Hướng dẫn sử dụng:</strong></div>
          <div style="font-size: 12px; margin-top: 10px; line-height: 1.4;">
            • <strong>Trình duyệt khác:</strong> Tự động sync, không cần làm gì<br>
            • <strong>PC ↔ Điện thoại:</strong> Dùng mã sync ở trên
          </div>
        </div>

        <button id="close-sync-dialog" style="width: 100%; padding: 10px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px;">
          Đóng
        </button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Event handlers for Cross-Device Sync (PC ↔ Phone)
    document.getElementById('generate-sync-code').onclick = () => {
      const syncCode = this.generateSyncCode();
      document.getElementById('sync-content').innerHTML = `
        <div style="text-align: center;">
          <div style="color: #6c5ce7; font-size: 16px; margin-bottom: 10px;">📱 Cross-Device Sync Code</div>
          <div style="font-size: 24px; font-weight: bold; color: #6c5ce7; margin-bottom: 15px; letter-spacing: 2px;">${syncCode}</div>
          <div style="font-size: 14px; color: #888; margin-bottom: 15px;">
            📱 Nhập mã này trên PC hoặc điện thoại khác
          </div>
          <div style="font-size: 12px; color: #666; background: #333; padding: 10px; border-radius: 6px;">
            ⏰ Mã có hiệu lực trong 24 giờ<br>
            🔒 Dùng để sync giữa PC ↔ điện thoại<br>
            💡 Sync giữa trình duyệt sẽ tự động
          </div>
        </div>
      `;
    };

    document.getElementById('use-sync-code').onclick = () => {
      document.getElementById('sync-content').innerHTML = `
        <div>
          <div style="color: #6c5ce7; font-size: 16px; margin-bottom: 10px; text-align: center;">📱 Nhập Cross-Device Sync Code</div>
          <div style="font-size: 14px; color: #888; margin-bottom: 10px; text-align: center;">
            Nhập mã sync từ PC hoặc điện thoại khác:
          </div>
          <input type="text" id="sync-code-input" placeholder="Nhập mã 6 số" maxlength="6"
                 style="width: 100%; padding: 15px; border: 1px solid #6c5ce7; border-radius: 6px; background: #333; color: #fff; text-align: center; font-size: 20px; margin-bottom: 15px; letter-spacing: 2px;">
          <button id="apply-sync-code" style="width: 100%; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            📱 Sync Cross-Device
          </button>
          <div style="font-size: 12px; color: #666; margin-top: 10px; text-align: center;">
            Sync dữ liệu giữa PC và điện thoại<br>
            <span style="color: #00b894;">💡 Sync giữa trình duyệt sẽ tự động</span>
          </div>
        </div>
      `;

      const input = document.getElementById('sync-code-input');
      input.focus();

      // Auto-format input
      input.oninput = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
      };

      document.getElementById('apply-sync-code').onclick = async () => {
        const syncCode = document.getElementById('sync-code-input').value.trim();
        if (syncCode.length !== 6) {
          alert('❌ Vui lòng nhập mã 6 số');
          return;
        }

        const button = document.getElementById('apply-sync-code');
        button.disabled = true;
        button.textContent = '⏳ Đang đồng bộ...';

        try {
          const userData = await this.useSyncCode(syncCode);

          // Immediate refresh without waiting
          console.log('🚀 Attempting immediate refresh...');
          if (window.immediateRefreshSavedMovies) {
            const refreshSuccess = await window.immediateRefreshSavedMovies();
            console.log(`🎯 Immediate refresh result: ${refreshSuccess}`);
          }

          // Show success message
          document.getElementById('sync-content').innerHTML = `
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
              <div style="font-size: 16px; color: #00b894; margin-bottom: 10px;">
                Đồng bộ thành công!
              </div>
              <div style="font-size: 14px; color: #888; margin-bottom: 15px;">
                Đã sync với: <strong>${userData.userName}</strong>
              </div>
              <div style="font-size: 12px; color: #666;">
                Trang sẽ tự động tải lại trong 2 giây...
              </div>
            </div>
          `;

          // Force refresh saved movies immediately, then reload page
          setTimeout(async () => {
            try {
              console.log('🔄 Starting immediate refresh after sync...');

              // Clear all caches first
              if (window.Storage) {
                window.Storage._savedMoviesCache = null;
                window.Storage._watchProgressCache = null;
                window.Storage._lastCacheUpdate = 0;
              }
              localStorage.removeItem('savedMovies');
              localStorage.removeItem('watchProgress');

              // Force reload movies with new user ID
              if (window.Storage) {
                console.log('🔄 Force reloading saved movies with new user...');
                const newMovies = await window.Storage.getSavedMovies();
                console.log(`📚 Found ${newMovies.length} movies for synced user`);

                // If no movies found, try Firebase directly
                if (newMovies.length === 0 && window.movieComments?.initialized) {
                  console.log('🔄 No movies in cache, trying Firebase directly...');
                  const firebaseMovies = await window.movieComments.getSavedMovies();
                  console.log(`📚 Firebase returned ${firebaseMovies.length} movies`);
                }
              }

              // Call the refresh function to update UI
              if (window.refreshSavedMoviesAfterSync) {
                await window.refreshSavedMoviesAfterSync();
              }

              console.log('✅ Immediate refresh completed, reloading page...');
            } catch (error) {
              console.error('❌ Error in immediate refresh:', error);
            }

            // Reload page to apply all changes
            location.reload();
          }, 2000); // Reduced from 3000 to 2000

        } catch (error) {
          alert(`❌ Lỗi: ${error.message}`);
          button.disabled = false;
          button.textContent = '🔄 Đồng bộ ngay';
        }
      };
    };

    document.getElementById('close-sync-dialog').onclick = () => {
      dialog.remove();
    };

    dialog.onclick = (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    };
  }

  // Thêm comment mới
  async addComment(movieSlug, content) {
    if (!this.initialized) await this.init();
    
    const userId = this.getUserId();
    const userName = this.getUserName();
    
    if (!movieSlug || !content || content.trim().length < 3) {
      throw new Error('Vui lòng nhập nội dung bình luận (tối thiểu 3 ký tự)');
    }

    const comment = {
       movieSlug: movieSlug,
       content: content.trim().substring(0, 500),
       authorId: userId,
       authorName: userName,
       timestamp: firebase.firestore.FieldValue.serverTimestamp(),
       likes: 0,
       likedBy: [],
       status: 'approved', // AUTO-APPROVE for testing (change back to 'pending' for production)
       reports: 0
     };

    try {
      const docRef = await this.db.collection('movieComments').add(comment);
      this.cache.delete(movieSlug); // Clear cache
      // Comment added successfully
      return docRef.id;
    } catch (error) {
      console.error('❌ Add comment failed:', error);
      throw new Error('Không thể gửi bình luận. Vui lòng thử lại.');
    }
  }

  // Lấy comments cho phim
  async getComments(movieSlug, limit = 30) {
    if (!this.initialized) await this.init();
    
    // Check cache
    const cached = this.cache.get(movieSlug);
    if (cached && Date.now() - cached.time < 300000) { // 5 min cache
      return cached.data;
    }

    try {
      const snapshot = await this.db.collection('movieComments')
        .where('movieSlug', '==', movieSlug)
        .where('status', '==', 'approved')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const comments = [];
      snapshot.forEach(doc => {
        comments.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        });
      });

      // Cache results
      this.cache.set(movieSlug, {
        data: comments,
        time: Date.now()
      });

      // Comments loaded successfully
      return comments;
    } catch (error) {
      console.error('❌ Get comments failed:', error);
      return [];
    }
  }

  // Like/unlike comment
  async toggleLike(commentId) {
    const userId = this.getUserId();
    const commentRef = this.db.collection('movieComments').doc(commentId);

    try {
      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(commentRef);
        if (!doc.exists) return;

        const data = doc.data();
        const likedBy = data.likedBy || [];
        const hasLiked = likedBy.includes(userId);

        if (hasLiked) {
          transaction.update(commentRef, {
            likes: Math.max(0, (data.likes || 0) - 1),
            likedBy: likedBy.filter(id => id !== userId)
          });
        } else {
          transaction.update(commentRef, {
            likes: (data.likes || 0) + 1,
            likedBy: [...likedBy, userId]
          });
        }
      });

      // Clear cache
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('❌ Toggle like failed:', error);
      return false;
    }
  }

  // Report comment
  async reportComment(commentId, reason = 'inappropriate') {
    const userId = this.getUserId();
    const commentRef = this.db.collection('movieComments').doc(commentId);

    try {
      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(commentRef);
        if (!doc.exists) return;

        const data = doc.data();
        const reportedBy = data.reportedBy || [];
        
        if (!reportedBy.includes(userId)) {
          transaction.update(commentRef, {
            reports: (data.reports || 0) + 1,
            reportedBy: [...reportedBy, userId],
            lastReportReason: reason
          });
        }
      });

      console.log('🚨 Comment reported');
      return true;
    } catch (error) {
      console.error('❌ Report failed:', error);
      return false;
    }
  }

  // Render comment UI
  renderCommentSection(container, movieSlug) {
    if (!container || !movieSlug) return;

    const section = document.createElement('div');
    section.className = 'movie-comments-section';
    section.innerHTML = `
      <div class="comments-header">
        <h3>💬 Bình luận về phim</h3>
        <div class="comments-count">Đang tải...</div>
      </div>
      
      <div class="comment-form">
        <div class="form-row">
          <input type="text" id="commenter-name" placeholder="Tên của bạn" 
                 value="${this.getUserName()}" maxlength="30">
        </div>
        <div class="form-row">
          <textarea id="comment-content" placeholder="Chia sẻ cảm nghĩ của bạn về bộ phim này..." 
                    maxlength="500" rows="3"></textarea>
        </div>
        <div class="form-row">
          <span class="char-count">0/500</span>
          <button id="submit-comment" class="submit-btn">Gửi bình luận</button>
        </div>
      </div>

      <div class="comments-list">
        <div class="loading">Đang tải bình luận...</div>
      </div>
    `;

    container.appendChild(section);
    
    // Bind events
    this.bindEvents(movieSlug);
    
    // Load comments
    this.loadAndDisplayComments(movieSlug);
  }

  // Bind form events
  bindEvents(movieSlug) {
    const nameInput = document.getElementById('commenter-name');
    const contentTextarea = document.getElementById('comment-content');
    const submitBtn = document.getElementById('submit-comment');
    const charCount = document.querySelector('.char-count');

    // Character count
    contentTextarea?.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCount.textContent = `${length}/500`;
      charCount.style.color = length > 450 ? '#ff5722' : '#666';
    });

    // Save name
    nameInput?.addEventListener('blur', (e) => {
      const name = e.target.value.trim();
      if (name) this.setUserName(name);
    });

    // Submit comment
    submitBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.handleSubmit(movieSlug);
    });

    // Submit on Enter
    contentTextarea?.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.handleSubmit(movieSlug);
      }
    });
  }

  // Handle comment submission
  async handleSubmit(movieSlug) {
    const nameInput = document.getElementById('commenter-name');
    const contentTextarea = document.getElementById('comment-content');
    const submitBtn = document.getElementById('submit-comment');

    const name = nameInput?.value.trim();
    const content = contentTextarea?.value.trim();

    if (!name) {
      alert('Vui lòng nhập tên của bạn');
      nameInput?.focus();
      return;
    }

    if (!content || content.length < 3) {
      alert('Vui lòng nhập bình luận (tối thiểu 3 ký tự)');
      contentTextarea?.focus();
      return;
    }

    this.setUserName(name);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    try {
      await this.addComment(movieSlug, content);
      
      // Reset form
      contentTextarea.value = '';
      document.querySelector('.char-count').textContent = '0/500';
      
      this.showNotification('✅ Bình luận đã được gửi! Đang chờ admin duyệt.');
      
      // Reload comments immediately for better UX  
      this.loadAndDisplayComments(movieSlug);
    } catch (error) {
      this.showNotification('❌ ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi bình luận';
    }
  }

  // Load and display comments
  async loadAndDisplayComments(movieSlug) {
    const commentsList = document.querySelector('.comments-list');
    const commentsCount = document.querySelector('.comments-count');
    
    if (!commentsList) return;

    try {
      const comments = await this.getComments(movieSlug);
      
      commentsCount.textContent = `${comments.length} bình luận`;
      
      if (comments.length === 0) {
        commentsList.innerHTML = `
          <div class="no-comments">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
          </div>
        `;
        return;
      }

      const commentsHtml = comments.map(comment => this.renderComment(comment)).join('');
      commentsList.innerHTML = commentsHtml;
      
      this.bindCommentActions();
    } catch (error) {
      commentsList.innerHTML = `
        <div class="error">
          <p>Không thể tải bình luận. <button onclick="movieComments.loadAndDisplayComments('${movieSlug}')">Thử lại</button></p>
        </div>
      `;
    }
  }

  // Render single comment
  renderComment(comment) {
    const timeAgo = this.getTimeAgo(comment.timestamp);
    const isLiked = comment.likedBy?.includes(this.getUserId());
    
    return `
      <div class="comment" data-comment-id="${comment.id}">
        <div class="comment-avatar">${comment.authorName.charAt(0).toUpperCase()}</div>
        <div class="comment-content">
          <div class="comment-header">
            <strong class="comment-author">${this.escapeHtml(comment.authorName)}</strong>
            <span class="comment-time">${timeAgo}</span>
          </div>
          <div class="comment-text">${this.escapeHtml(comment.content)}</div>
          <div class="comment-actions">
            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-action="like">
              👍 <span>${comment.likes || 0}</span>
            </button>
            <button class="action-btn report-btn" data-action="report">
              🚨 Báo cáo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Bind comment actions
  bindCommentActions() {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const commentId = btn.closest('.comment').dataset.commentId;
        
        if (action === 'like') {
          await this.handleLike(commentId, btn);
        } else if (action === 'report') {
          await this.handleReport(commentId);
        }
      });
    });
  }

  // Handle like action
  async handleLike(commentId, btn) {
    btn.disabled = true;
    
    const success = await this.toggleLike(commentId);
    if (success) {
      const likeCountSpan = btn.querySelector('span');
      const currentCount = parseInt(likeCountSpan.textContent) || 0;
      const isLiked = btn.classList.contains('liked');
      
      if (isLiked) {
        likeCountSpan.textContent = Math.max(0, currentCount - 1);
        btn.classList.remove('liked');
      } else {
        likeCountSpan.textContent = currentCount + 1;
        btn.classList.add('liked');
      }
    }
    
    btn.disabled = false;
  }

  // Handle report action
  async handleReport(commentId) {
    const reason = prompt('Lý do báo cáo (tùy chọn):') || 'inappropriate';
    
    const success = await this.reportComment(commentId, reason);
    if (success) {
      this.showNotification('✅ Đã gửi báo cáo. Cảm ơn bạn!');
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getTimeAgo(date) {
    if (!date) return 'Vừa xong';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  }

  // 📱 LOCALSTORAGE FALLBACK METHODS
  // Save movie to localStorage as backup
  saveToLocalStorage(movie) {
    try {
      const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');

      // Check if already exists
      if (savedMovies.some(m => m.slug === movie.slug)) {
        return false; // Already saved
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

      savedMovies.unshift(movieData);
      localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
      console.log('💾 Movie saved to localStorage:', movie.name);
      return true;
    } catch (error) {
      console.error('❌ Save to localStorage failed:', error);
      return false;
    }
  }

  // Remove movie from localStorage
  removeFromLocalStorage(slug) {
    try {
      const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
      const filteredMovies = savedMovies.filter(m => m.slug !== slug);

      if (filteredMovies.length === savedMovies.length) {
        return false; // Not found
      }

      localStorage.setItem('savedMovies', JSON.stringify(filteredMovies));
      console.log('💾 Movie removed from localStorage:', slug);
      return true;
    } catch (error) {
      console.error('❌ Remove from localStorage failed:', error);
      return false;
    }
  }

  // Get device info for tracking
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData?.platform || 'unknown',
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: Date.now()
    };
  }

  showNotification(message) {
    // Enhanced notification with better styling
    const notification = document.createElement('div');
    notification.className = 'firebase-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: linear-gradient(135deg, #4caf50, #45a049);
      color: white; padding: 12px 20px;
      border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-size: 14px; max-width: 350px; font-weight: 500;
      animation: slideInRight 0.3s ease-out;
      backdrop-filter: blur(10px);
    `;

    // Add animation keyframes if not exists
    if (!document.querySelector('#firebase-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'firebase-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove with slide out animation
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }

  // 🎬 FIREBASE SAVED MOVIES SYSTEM
  // Lưu phim yêu thích vào Firebase thay vì localStorage

  // 🎬 FIREBASE SAVED MOVIES SYSTEM với fallback
  // Lưu phim vào Firebase với user authentication
  async saveMovie(movie) {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();
    const userName = this.getUserName();

    const movieData = {
      slug: movie.slug,
      name: movie.name,
      poster_url: movie.poster_url || movie.thumb_url,
      year: movie.year,
      lang: movie.lang,
      quality: movie.quality,
      episode_current: movie.episode_current,
      savedAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: userId,
      userName: userName,
      deviceInfo: this.getDeviceInfo()
    };

    try {
      // Check if already saved
      const existingDoc = await this.db.collection('savedMovies')
        .where('userId', '==', userId)
        .where('slug', '==', movie.slug)
        .get();

      if (!existingDoc.empty) {
        console.log('⚠️ Movie already saved:', movie.name);
        return false; // Already saved
      }

      await this.db.collection('savedMovies').add(movieData);
      console.log('✅ Movie saved to Firebase:', movie.name);

      // Also save to localStorage as backup
      this.saveToLocalStorage(movie);

      // Show success notification
      this.showNotification(`✅ Đã lưu "${movie.name}" vào danh sách yêu thích`);

      return true;
    } catch (error) {
      // Fallback to localStorage if Firebase fails
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        console.warn('⚠️ Firebase permissions denied, saving to localStorage');
        const success = this.saveToLocalStorage(movie);
        if (success) {
          this.showNotification(`✅ Đã lưu "${movie.name}" (offline mode)`);
          return true;
        }
      }

      console.error('❌ Save movie failed:', error);
      throw new Error('Không thể lưu phim. Vui lòng thử lại.');
    }
  }

  // Xóa phim khỏi Firebase với fallback
  async removeSavedMovie(slug) {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();

    try {
      const snapshot = await this.db.collection('savedMovies')
        .where('userId', '==', userId)
        .where('slug', '==', slug)
        .get();

      if (snapshot.empty) {
        console.log('⚠️ Movie not found in saved list:', slug);
        return false; // Not found
      }

      const batch = this.db.batch();
      let movieName = '';

      snapshot.docs.forEach(doc => {
        movieName = doc.data().name || slug;
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ Movie removed from Firebase:', slug);

      // Also remove from localStorage
      this.removeFromLocalStorage(slug);

      // Show success notification
      this.showNotification(`✅ Đã xóa "${movieName}" khỏi danh sách yêu thích`);

      return true;
    } catch (error) {
      // Fallback to localStorage if Firebase fails
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        console.warn('⚠️ Firebase permissions denied, removing from localStorage');
        const success = this.removeFromLocalStorage(slug);
        if (success) {
          this.showNotification(`✅ Đã xóa phim khỏi danh sách (offline mode)`);
          return true;
        }
      }

      console.error('❌ Remove movie failed:', error);
      throw new Error('Không thể xóa phim. Vui lòng thử lại.');
    }
  }

  // Lấy danh sách phim đã lưu với fallback và index optimization
  async getSavedMovies() {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();

    try {
      // Try with orderBy first (requires composite index)
      let snapshot;
      try {
        snapshot = await this.db.collection('savedMovies')
          .where('userId', '==', userId)
          .orderBy('savedAt', 'desc')
          .get();
      } catch (indexError) {
        // Fallback: Query without orderBy if index doesn't exist
        console.warn('⚠️ Composite index not found, querying without orderBy');
        snapshot = await this.db.collection('savedMovies')
          .where('userId', '==', userId)
          .get();
      }

      const movies = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        movies.push({
          id: doc.id,
          ...data,
          savedAt: data.savedAt?.toDate()?.getTime() || Date.now()
        });
      });

      // Sort manually if we couldn't use orderBy
      movies.sort((a, b) => b.savedAt - a.savedAt);

      console.log(`📚 Loaded ${movies.length} saved movies from Firebase`);
      return movies;
    } catch (error) {
      // No localStorage fallback - Firebase only
      console.error('❌ Get saved movies failed:', error);
      return [];
    }
  }

  // Kiểm tra phim đã được lưu chưa với fallback
  async isMovieSaved(slug) {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();

    try {
      const snapshot = await this.db.collection('savedMovies')
        .where('userId', '==', userId)
        .where('slug', '==', slug)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      // No localStorage fallback - Firebase only
      console.error('❌ Check movie saved failed:', error);
      return false;
    }
  }

  // Xóa tất cả phim đã lưu
  async clearAllSavedMovies() {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();

    try {
      const snapshot = await this.db.collection('savedMovies')
        .where('userId', '==', userId)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Cleared ${snapshot.size} saved movies from Firebase`);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Clear saved movies failed:', error);
      throw new Error('Không thể xóa danh sách phim. Vui lòng thử lại.');
    }
  }

  // 📺 FIREBASE WATCH PROGRESS SYSTEM
  // Lưu tiến độ xem vào Firebase

  // Lưu tiến độ xem
  async setWatchProgress(movieSlug, episodeInfo) {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();
    const progressData = {
      movieSlug: movieSlug,
      userId: userId,
      ...episodeInfo,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      // Use movieSlug + userId as document ID for easy updates
      const docId = `${userId}_${movieSlug}`;
      await this.db.collection('watchProgress').doc(docId).set(progressData, { merge: true });
      console.log('✅ Watch progress saved:', movieSlug, episodeInfo.episodeName);
    } catch (error) {
      console.error('❌ Save watch progress failed:', error);
    }
  }

  // Lấy tiến độ xem với fallback
  async getWatchProgress(movieSlug) {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();
    const docId = `${userId}_${movieSlug}`;

    try {
      const doc = await this.db.collection('watchProgress').doc(docId).get();

      if (doc.exists) {
        const data = doc.data();
        return {
          ...data,
          updatedAt: data.updatedAt?.toDate()?.getTime() || Date.now()
        };
      }

      return null;
    } catch (error) {
      // Fallback to localStorage if Firebase fails
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        console.warn('⚠️ Firebase permissions denied for watch progress, using localStorage');
        const watchProgress = JSON.parse(localStorage.getItem('watchProgress') || '{}');
        return watchProgress[movieSlug] || null;
      }

      console.error('❌ Get watch progress failed:', error);
      return null;
    }
  }

  // Lấy tất cả tiến độ xem
  async getAllWatchProgress() {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();

    try {
      const snapshot = await this.db.collection('watchProgress')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const progress = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        progress[data.movieSlug] = {
          ...data,
          updatedAt: data.updatedAt?.toDate()?.getTime() || Date.now()
        };
      });

      return progress;
    } catch (error) {
      console.error('❌ Get all watch progress failed:', error);
      return {};
    }
  }

  // Xóa tiến độ xem
  async clearWatchProgress(movieSlug) {
    if (!this.initialized) await this.init();

    const userId = this.getUserId();
    const docId = `${userId}_${movieSlug}`;

    try {
      await this.db.collection('watchProgress').doc(docId).delete();
      console.log('✅ Watch progress cleared:', movieSlug);
    } catch (error) {
      console.error('❌ Clear watch progress failed:', error);
    }
  }
}

// Global instance
window.movieComments = new MovieCommentSystem();

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.movieComments.init();
  });
} else {
  window.movieComments.init();
}

console.log('🎬 Movie Comment System loaded! Use movieComments.renderCommentSection(container, movieSlug)'); 