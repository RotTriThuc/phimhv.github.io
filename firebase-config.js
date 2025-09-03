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

// Enhanced Production logging wrapper - Global scope - Hide debug info but keep errors
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
const hideDebugInfo = true; // Hide sensitive debug info in production

// Professional logging system for Firebase operations
const FirebaseLogger = {
  debug: (isDev && !hideDebugInfo) ? (...args) => console.log('🔥 [DEBUG]', ...args) : () => {},
  info: (isDev && !hideDebugInfo) ? (...args) => console.log('🔥 [INFO]', ...args) : () => {},
  success: (isDev && !hideDebugInfo) ? (...args) => console.log('🔥 [SUCCESS]', ...args) : () => {},

  // Always show warnings and errors for debugging issues
  warn: (...args) => console.warn('🔥 [WARN]', ...args),
  error: (...args) => console.error('🔥 [ERROR]', ...args)
};

// Backward compatibility
const log = {
  debug: FirebaseLogger.debug,
  info: FirebaseLogger.info,
  warn: FirebaseLogger.warn,
  error: FirebaseLogger.error
};

class MovieCommentSystem {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.cache = new Map();
  }

  // Khởi tạo Firebase
  async init() {
    try {
      log.info('🔥 Initializing Movie Comment System...');

      // Validate config
      if (!this.validateConfig()) {
        throw new Error('Please update Firebase config in firebase-config.js');
      }

      // Load Firebase SDK
      await this.loadFirebase();

      // Validate Firebase is available
      if (!window.firebase) {
        throw new Error('Firebase SDK not loaded');
      }

      if (typeof window.firebase.firestore !== 'function') {
        throw new Error('Firebase Firestore not available. Make sure firebase-firestore.js is loaded.');
      }

      // Initialize Firebase app
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        log.info('🔥 Firebase app initialized');
      }

      // Initialize Firestore with validation
      this.db = firebase.firestore();

      if (!this.db) {
        throw new Error('Failed to initialize Firestore database');
      }

      log.info('🗄️ Firestore database initialized');

      // Enable offline support
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
        log.info('💾 Offline support enabled');
      } catch (err) {
        log.warn('⚠️ Offline support failed:', err.code);
      }

      this.initialized = true;
      log.info('✅ Comment system ready!');
      return true;
    } catch (error) {
      log.error('❌ Init failed:', error);
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
    if (window.firebase && window.firebase.firestore && window.firebase.auth) {
      log.info('🔄 Firebase already loaded, skipping...');
      return;
    }

    const scripts = [
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js'
    ];

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          FirebaseLogger.debug(`Loaded: ${src.split('/').pop()}`);
          resolve();
        };
        script.onerror = () => {
          FirebaseLogger.error(`Failed to load: ${src}`);
          reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
      });
    }

    // Wait for Firebase to be fully available with retry mechanism
    await this.waitForFirebase();
  }

  // Wait for Firebase to be fully initialized with retry
  async waitForFirebase(maxRetries = 10, delay = 100) {
    for (let i = 0; i < maxRetries; i++) {
      if (window.firebase &&
          typeof window.firebase.initializeApp === 'function' &&
          typeof window.firebase.firestore === 'function') {
        log.info('✅ Firebase SDK fully loaded and ready');
        return;
      }

      // Debug thông tin về Firebase state
      this.debugFirebaseState();

      log.info(`⏳ Waiting for Firebase SDK... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error('Firebase SDK failed to load completely after maximum retries');
  }

  // Debug Firebase state để troubleshoot
  debugFirebaseState() {
    log.debug('🔍 Firebase Debug State:');
    log.debug('- window.firebase exists:', !!window.firebase);
    if (window.firebase) {
      log.debug('- firebase.initializeApp type:', typeof window.firebase.initializeApp);
      log.debug('- firebase.firestore type:', typeof window.firebase.firestore);
      log.debug('- firebase.apps length:', window.firebase.apps ? window.firebase.apps.length : 'undefined');
    }
  }

  // 🔑 CROSS-BROWSER USER ID SYSTEM
  // Tạo User ID persistent cross-browser với multiple storage methods
  async getUserId() {
    // Get user ID from storage
    let userId = this._tryGetUserIdFromStorage();

    if (!userId) {
      // Generate new user ID with better entropy
      userId = this._generateUserId();
      this._saveUserIdToAllStorage(userId);
      log.info('🆔 Generated new cross-browser User ID:', userId);
    }

    return userId;
  }

  _tryGetUserIdFromStorage() {
    // Try localStorage first
    let userId = localStorage.getItem('movie_commenter_id');
    if (userId) return userId;

    // Try sessionStorage
    userId = sessionStorage.getItem('movie_commenter_id');
    if (userId) {
      // Save back to localStorage for persistence
      localStorage.setItem('movie_commenter_id', userId);
      return userId;
    }

    // Try IndexedDB (for cross-browser persistence)
    userId = this._getFromIndexedDB();
    if (userId) {
      localStorage.setItem('movie_commenter_id', userId);
      return userId;
    }

    return null;
  }

  _generateUserId() {
    // Create more unique ID with browser fingerprint
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const browserFingerprint = this._getBrowserFingerprint();

    return `user_${browserFingerprint}_${random}_${timestamp}`;
  }

  _getBrowserFingerprint() {
    // Create semi-persistent browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
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

  _saveUserIdToAllStorage(userId) {
    try {
      // Save to localStorage
      localStorage.setItem('movie_commenter_id', userId);

      // Save to sessionStorage as backup
      sessionStorage.setItem('movie_commenter_id', userId);

      // Save to IndexedDB for cross-browser persistence
      this._saveToIndexedDB(userId);

      log.info('💾 User ID saved to all storage methods');
    } catch (error) {
      log.warn('⚠️ Failed to save user ID to some storage methods:', error);
    }
  }

  _getFromIndexedDB() {
    // This is synchronous fallback - in real implementation would be async
    // For now, return null and let it generate new ID
    return null;
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
      log.warn('⚠️ IndexedDB save failed:', error);
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
  async generateSyncCode() {
    const userId = await this.getUserId();
    const userName = this.getUserName();

    // Create 6-digit sync code
    const syncCode = Math.random().toString().substring(2, 8);

    // Save sync mapping to Firebase and wait for completion
    await this._saveSyncCode(syncCode, userId, userName);

    log.info('🔑 Sync code generated and saved:', syncCode);
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
      log.info('🔑 Sync code saved:', syncCode);
    } catch (error) {
      log.error('❌ Failed to save sync code:', error);
    }
  }

  // Use sync code to sync with another device
  async useSyncCode(syncCode) {
    log.info('🔄 Starting sync process with code:', syncCode);

    // Log current user before sync
    const currentUserId = this.getUserId();
    const currentUserName = this.getUserName();
    log.info('📊 Current user before sync:', { currentUserId, currentUserName });

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

      log.info('🗑️ Cleared legacy localStorage data (Firebase-only mode)');

      // Delete the sync code after use
      await this.db.collection('syncCodes').doc(syncCode).delete();

      log.info('✅ Synced with user:', data.userName);
      log.info('🔄 Cleared all caches for new user data');

      return {
        userId: data.userId,
        userName: data.userName
      };

    } catch (error) {
      log.error('❌ Sync code failed:', error);
      throw error;
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
      <div style="background: #1e1e1e; border-radius: 12px; padding: 30px; max-width: 400px; width: 90%; color: #fff;">
        <h3 style="margin: 0 0 20px 0; text-align: center; color: #6c5ce7;">🔄 Đồng bộ thiết bị</h3>

        <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 14px; color: #888; margin-bottom: 5px;">Thiết bị hiện tại:</div>
          <div style="font-weight: 500;">${currentUserName}</div>
          <div style="font-size: 12px; color: #666; word-break: break-all;">${currentUserId}</div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button id="generate-sync-code" style="flex: 1; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            📤 Tạo mã sync
          </button>
          <button id="use-sync-code" style="flex: 1; padding: 12px; background: #00b894; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            📥 Nhập mã sync
          </button>
        </div>

        <div id="sync-content" style="min-height: 80px; text-align: center; color: #888; padding: 20px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-size: 16px; margin-bottom: 10px;">📱</div>
          <div>Chọn một tùy chọn để đồng bộ dữ liệu giữa các thiết bị</div>
          <div style="font-size: 12px; margin-top: 10px; color: #666;">
            Phim đã lưu sẽ được sync trên tất cả thiết bị
          </div>
        </div>

        <button id="close-sync-dialog" style="width: 100%; padding: 10px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px;">
          Đóng
        </button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Event handlers
    document.getElementById('generate-sync-code').onclick = async () => {
      const button = document.getElementById('generate-sync-code');
      button.disabled = true;
      button.textContent = '⏳ Đang tạo mã...';
      
      try {
        const syncCode = await this.generateSyncCode();
        document.getElementById('sync-content').innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #6c5ce7; margin-bottom: 15px; letter-spacing: 2px;">${syncCode}</div>
          <div style="font-size: 14px; color: #888; margin-bottom: 15px;">
            📱 Nhập mã này trên thiết bị khác
          </div>
          <div style="font-size: 12px; color: #666; background: #333; padding: 10px; border-radius: 6px;">
            ⏰ Mã có hiệu lực trong 24 giờ<br>
            🔒 Mã chỉ sử dụng được 1 lần
          </div>
        </div>
      `;
      } catch (error) {
        log.error('❌ Generate sync code failed:', error);
        document.getElementById('sync-content').innerHTML = `
          <div style="text-align: center; color: #ff5722;">
            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
            <div>Không thể tạo mã sync. Vui lòng thử lại.</div>
          </div>
        `;
      } finally {
        button.disabled = false;
        button.textContent = '📤 Tạo mã sync';
      }
    };

    document.getElementById('use-sync-code').onclick = () => {
      document.getElementById('sync-content').innerHTML = `
        <div>
          <div style="font-size: 14px; color: #888; margin-bottom: 10px; text-align: center;">
            Nhập mã sync từ thiết bị khác:
          </div>
          <input type="text" id="sync-code-input" placeholder="Nhập mã 6 số" maxlength="6"
                 style="width: 100%; padding: 15px; border: 1px solid #555; border-radius: 6px; background: #333; color: #fff; text-align: center; font-size: 20px; margin-bottom: 15px; letter-spacing: 2px;">
          <button id="apply-sync-code" style="width: 100%; padding: 12px; background: #00b894; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            🔄 Đồng bộ ngay
          </button>
          <div style="font-size: 12px; color: #666; margin-top: 10px; text-align: center;">
            Sau khi đồng bộ, trang sẽ tự động tải lại
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
          log.info('🚀 Attempting immediate refresh...');
          if (window.immediateRefreshSavedMovies) {
            const refreshSuccess = await window.immediateRefreshSavedMovies();
            log.info(`🎯 Immediate refresh result: ${refreshSuccess}`);
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
              log.info('🔄 Starting immediate refresh after sync...');

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
                log.info('🔄 Force reloading saved movies with new user...');
                const newMovies = await window.Storage.getSavedMovies();
                log.info(`📚 Found ${newMovies.length} movies for synced user`);

                // If no movies found, try Firebase directly
                if (newMovies.length === 0 && window.movieComments?.initialized) {
                  log.info('🔄 No movies in cache, trying Firebase directly...');
                  const firebaseMovies = await window.movieComments.getSavedMovies();
                  log.info(`📚 Firebase returned ${firebaseMovies.length} movies`);
                }
              }

              // Call the refresh function to update UI
              if (window.refreshSavedMoviesAfterSync) {
                await window.refreshSavedMoviesAfterSync();
              }

              log.info('✅ Immediate refresh completed, reloading page...');
            } catch (error) {
              log.error('❌ Error in immediate refresh:', error);
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

    const userId = await this.getUserId();
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
      log.error('❌ Add comment failed:', error);
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
      log.error('❌ Get comments failed:', error);
      return [];
    }
  }

  // Like/unlike comment
  async toggleLike(commentId) {
    const userId = await this.getUserId();
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
      log.error('❌ Toggle like failed:', error);
      return false;
    }
  }

  // Report comment
  async reportComment(commentId, reason = 'inappropriate') {
    const userId = await this.getUserId();
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

      log.info('🚨 Comment reported');
      return true;
    } catch (error) {
      log.error('❌ Report failed:', error);
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
  async renderComment(comment) {
    const timeAgo = this.getTimeAgo(comment.timestamp);
    const userId = await this.getUserId();
    const isLiked = comment.likedBy?.includes(userId);
    
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
      log.info('💾 Movie saved to localStorage:', movie.name);
      return true;
    } catch (error) {
      log.error('❌ Save to localStorage failed:', error);
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
      log.info('💾 Movie removed from localStorage:', slug);
      return true;
    } catch (error) {
      log.error('❌ Remove from localStorage failed:', error);
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

    const userId = await this.getUserId();
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
        FirebaseLogger.debug('Movie already saved:', movie.name);
        return false; // Already saved
      }

      await this.db.collection('savedMovies').add(movieData);
      FirebaseLogger.success('Movie saved to Firebase:', movie.name);

      // Also save to localStorage as backup
      this.saveToLocalStorage(movie);

      // Show success notification
      this.showNotification(`✅ Đã lưu "${movie.name}" vào danh sách yêu thích`);

      return true;
    } catch (error) {
      // Fallback to localStorage if Firebase fails
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        FirebaseLogger.warn('Firebase permissions denied, saving to localStorage');
        const success = this.saveToLocalStorage(movie);
        if (success) {
          this.showNotification(`✅ Đã lưu "${movie.name}" (offline mode)`);
          return true;
        }
      }

      FirebaseLogger.error('Save movie failed:', error);
      throw new Error('Không thể lưu phim. Vui lòng thử lại.');
    }
  }

  // Xóa phim khỏi Firebase với fallback
  async removeSavedMovie(slug) {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();

    try {
      const snapshot = await this.db.collection('savedMovies')
        .where('userId', '==', userId)
        .where('slug', '==', slug)
        .get();

      if (snapshot.empty) {
        FirebaseLogger.debug('Movie not found in saved list:', slug);
        return false; // Not found
      }

      const batch = this.db.batch();
      let movieName = '';

      snapshot.docs.forEach(doc => {
        movieName = doc.data().name || slug;
        batch.delete(doc.ref);
      });

      await batch.commit();
      FirebaseLogger.success('Movie removed from Firebase:', slug);

      // Also remove from localStorage
      this.removeFromLocalStorage(slug);

      // Show success notification
      this.showNotification(`✅ Đã xóa "${movieName}" khỏi danh sách yêu thích`);

      return true;
    } catch (error) {
      // Fallback to localStorage if Firebase fails
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        FirebaseLogger.warn('Firebase permissions denied, removing from localStorage');
        const success = this.removeFromLocalStorage(slug);
        if (success) {
          this.showNotification(`✅ Đã xóa phim khỏi danh sách (offline mode)`);
          return true;
        }
      }

      FirebaseLogger.error('Remove movie failed:', error);
      throw new Error('Không thể xóa phim. Vui lòng thử lại.');
    }
  }

  // Lấy danh sách phim đã lưu với fallback và index optimization
  async getSavedMovies() {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();

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
        FirebaseLogger.warn('Composite index not found, querying without orderBy');
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

      FirebaseLogger.debug(`Loaded ${movies.length} saved movies from Firebase`);
      return movies;
    } catch (error) {
      // No localStorage fallback - Firebase only
      FirebaseLogger.error('Get saved movies failed:', error);
      return [];
    }
  }

  // Kiểm tra phim đã được lưu chưa với fallback
  async isMovieSaved(slug) {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();

    try {
      const snapshot = await this.db.collection('savedMovies')
        .where('userId', '==', userId)
        .where('slug', '==', slug)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      // No localStorage fallback - Firebase only
      FirebaseLogger.error('Check movie saved failed:', error);
      return false;
    }
  }

  // Xóa tất cả phim đã lưu
  async clearAllSavedMovies() {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();

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
      FirebaseLogger.success(`Cleared ${snapshot.size} saved movies from Firebase`);
      return snapshot.size;
    } catch (error) {
      FirebaseLogger.error('Clear saved movies failed:', error);
      throw new Error('Không thể xóa danh sách phim. Vui lòng thử lại.');
    }
  }

  // 📺 FIREBASE WATCH PROGRESS SYSTEM
  // Lưu tiến độ xem vào Firebase

  // Lưu tiến độ xem
  async setWatchProgress(movieSlug, episodeInfo) {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();
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
      FirebaseLogger.debug('Watch progress saved:', movieSlug, episodeInfo.episodeName);
    } catch (error) {
      FirebaseLogger.error('Save watch progress failed:', error);
    }
  }

  // Lấy tiến độ xem với fallback
  async getWatchProgress(movieSlug) {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();
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
        FirebaseLogger.warn('Firebase permissions denied for watch progress, using localStorage');
        const watchProgress = JSON.parse(localStorage.getItem('watchProgress') || '{}');
        return watchProgress[movieSlug] || null;
      }

      FirebaseLogger.error('Get watch progress failed:', error);
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
      FirebaseLogger.error('Get all watch progress failed:', error);
      return {};
    }
  }

  // Xóa tiến độ xem
  async clearWatchProgress(movieSlug) {
    if (!this.initialized) await this.init();

    const userId = await this.getUserId();
    const docId = `${userId}_${movieSlug}`;

    try {
      await this.db.collection('watchProgress').doc(docId).delete();
      FirebaseLogger.debug('Watch progress cleared:', movieSlug);
    } catch (error) {
      FirebaseLogger.error('Clear watch progress failed:', error);
    }
  }

  // 🔔 NOTIFICATION SYSTEM METHODS
  // Tích hợp notification system vào Firebase config

  /**
   * Tạo notification mới
   */
  async createNotification({
    title,
    content,
    type = 'admin_announcement',
    scheduledAt = null,
    expiresAt = null,
    metadata = {},
    priority = 'normal'
  }) {
    if (!this.initialized) await this.init();

    try {
      const now = firebase.firestore.FieldValue.serverTimestamp();

      const notification = {
        title: title.trim(),
        content: content.trim(),
        type,
        status: scheduledAt ? 'scheduled' : 'active',
        createdAt: now,
        scheduledAt: scheduledAt ? firebase.firestore.Timestamp.fromDate(new Date(scheduledAt)) : null,
        expiresAt: expiresAt ? firebase.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
        readBy: [],
        metadata: {
          ...metadata,
          priority,
          adminId: this.getUserId()
        },
        stats: {
          totalReads: 0,
          totalViews: 0
        }
      };

      const docRef = await this.db.collection('notifications').add(notification);

      FirebaseLogger.info(`✅ Created notification: ${docRef.id}`);
      return { id: docRef.id, ...notification };
    } catch (error) {
      FirebaseLogger.error('❌ Create notification failed:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách notifications
   */
  async getNotifications({
    type = null,
    status = 'active',
    limit = 50,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    includeExpired = false
  } = {}) {
    if (!this.initialized) await this.init();

    try {
      let query = this.db.collection('notifications');

      // Simplified query to avoid permission issues
      // We'll filter by type and status in JavaScript instead

      // Order first, then filter expired (to avoid Firebase query constraint)
      query = query.orderBy(orderBy, orderDirection).limit(limit);

      // Note: We'll filter expired notifications in JavaScript instead of Firestore
      // to avoid the "inequality filter must be first orderBy" constraint

      const snapshot = await query.get();
      const notifications = [];

      const now = new Date();

      snapshot.forEach(doc => {
        const data = doc.data();
        const notification = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          scheduledAt: data.scheduledAt?.toDate(),
          expiresAt: data.expiresAt?.toDate()
        };

        // Filter in JavaScript to avoid complex Firestore queries
        if (type && notification.type !== type) {
          return; // Skip if type doesn't match
        }

        if (status && notification.status !== status) {
          return; // Skip if status doesn't match
        }

        if (!includeExpired && notification.expiresAt && notification.expiresAt < now) {
          return; // Skip expired notifications
        }

        notifications.push(notification);
      });

      FirebaseLogger.debug(`📋 Retrieved ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      FirebaseLogger.error('❌ Get notifications failed:', error);

      // Fallback: return empty array instead of throwing to avoid breaking UI
      FirebaseLogger.warn('🔄 Returning empty notifications array as fallback');
      return [];
    }
  }

  /**
   * Đánh dấu notification đã đọc
   */
  async markNotificationAsRead(notificationId, userId = null) {
    if (!this.initialized) await this.init();

    try {
      const currentUserId = userId || this.getUserId();

      const notificationRef = this.db.collection('notifications').doc(notificationId);

      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(notificationRef);

        if (!doc.exists) {
          throw new Error('Notification not found');
        }

        const data = doc.data();
        const readBy = data.readBy || [];

        // Nếu chưa đọc thì thêm vào
        if (!readBy.includes(currentUserId)) {
          readBy.push(currentUserId);

          // Tính toán giá trị mới cho totalReads
          const currentTotalReads = (data.stats && data.stats.totalReads) || 0;
          const newTotalReads = currentTotalReads + 1;

          transaction.update(notificationRef, {
            readBy,
            'stats.totalReads': newTotalReads
          });
        }
      });

      FirebaseLogger.debug(`✅ Marked notification ${notificationId} as read`);
      return true;
    } catch (error) {
      FirebaseLogger.error('❌ Mark as read failed:', error);
      throw error;
    }
  }

  /**
   * Xóa notification
   */
  async deleteNotification(notificationId) {
    if (!this.initialized) await this.init();

    try {
      await this.db.collection('notifications').doc(notificationId).delete();
      FirebaseLogger.info(`🗑️ Deleted notification: ${notificationId}`);
      return true;
    } catch (error) {
      FirebaseLogger.error('❌ Delete notification failed:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng notifications chưa đọc
   */
  async getUnreadNotificationCount(userId = null) {
    if (!this.initialized) await this.init();

    try {
      const currentUserId = userId || this.getUserId();

      const snapshot = await this.db.collection('notifications')
        .where('status', '==', 'active')
        .get();

      let unreadCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const readBy = data.readBy || [];

        if (!readBy.includes(currentUserId)) {
          unreadCount++;
        }
      });

      FirebaseLogger.debug(`📊 Unread count: ${unreadCount}`);
      return unreadCount;
    } catch (error) {
      FirebaseLogger.error('❌ Get unread count failed:', error);
      return 0;
    }
  }

  /**
   * Tạo auto-notification cho phim mới
   */
  async createMovieNotification(movies) {
    if (!Array.isArray(movies) || movies.length === 0) return;

    try {
      const movieCount = movies.length;
      const firstMovie = movies[0];

      const title = movieCount === 1
        ? `🎬 Phim mới: ${firstMovie.name}`
        : `🎬 ${movieCount} phim mới được cập nhật`;

      const content = movieCount === 1
        ? `Phim "${firstMovie.name}" vừa được thêm vào hệ thống. Xem ngay!`
        : `${movieCount} phim mới vừa được cập nhật. Khám phá ngay những bộ phim hot nhất!`;

      await this.createNotification({
        title,
        content,
        type: 'new_movie',
        metadata: {
          movieCount,
          movies: movies.slice(0, 5).map(m => ({ slug: m.slug, name: m.name })),
          priority: 'high'
        }
      });

      FirebaseLogger.info(`🎬 Created movie notification for ${movieCount} movies`);
    } catch (error) {
      FirebaseLogger.error('❌ Create movie notification failed:', error);
    }
  }

  /**
   * Lắng nghe real-time notifications
   */
  listenToNotifications(callback, userId = null) {
    if (!this.initialized) {
      FirebaseLogger.warn('Firebase not initialized, cannot listen to notifications');
      return null;
    }

    try {
      const currentUserId = userId || this.getUserId();

      const unsubscribe = this.db.collection('notifications')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
          const notifications = [];

          snapshot.forEach(doc => {
            const data = doc.data();
            const readBy = data.readBy || [];

            notifications.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              scheduledAt: data.scheduledAt?.toDate(),
              expiresAt: data.expiresAt?.toDate(),
              isRead: readBy.includes(currentUserId)
            });
          });

          callback(notifications);
        }, (error) => {
          FirebaseLogger.error('Notification listener error:', error);
        });

      return unsubscribe;
    } catch (error) {
      FirebaseLogger.error('❌ Listen to notifications failed:', error);
      return null;
    }
  }
}

// Global instance
window.movieComments = new MovieCommentSystem();

// Auto-init when DOM ready with error handling
async function initMovieComments() {
  try {
    const success = await window.movieComments.init();
    if (!success) {
      FirebaseLogger.warn('⚠️ Firebase initialization failed, running in fallback mode');
      // App vẫn có thể hoạt động với localStorage fallback
    }
  } catch (error) {
    FirebaseLogger.error('❌ Critical Firebase error:', error);
    // Có thể thêm fallback mechanism ở đây
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMovieComments);
} else {
  initMovieComments();
}

FirebaseLogger.info('Movie Comment System with Notifications loaded! Use movieComments.renderCommentSection(container, movieSlug)');