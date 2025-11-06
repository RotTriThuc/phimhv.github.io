// 🔐 Firebase Authentication System
// Hệ thống đăng nhập/đăng ký với Firebase Auth
// Thay thế localStorage User ID bằng Firebase Auth UID

class FirebaseAuth {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.initialized = false;
    this.authStateListeners = [];
  }

  // 🚀 Initialize Firebase Auth
  async init() {
    try {
      console.log('🔐 Initializing Firebase Authentication...');

      // Wait for Firebase to be ready
      await this.waitForFirebase();

      this.auth = window.firebase.auth();

      // Setup auth state listener
      this.setupAuthStateListener();

      // Check for existing session
      await this.checkExistingSession();

      this.initialized = true;
      console.log('✅ Firebase Authentication initialized');

      return true;
    } catch (error) {
      console.error('❌ Firebase Auth initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  // 🕐 Wait for Firebase to be ready
  async waitForFirebase(maxWaitTime = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      if (window.firebase && window.firebase.auth) {
        console.log('🔥 Firebase Auth SDK ready');
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Firebase Auth SDK not ready after timeout');
  }

  // 👂 Setup auth state listener
  setupAuthStateListener() {
    this.auth.onAuthStateChanged(async (user) => {
      console.log('🔄 Auth state changed:', user ? user.email : 'No user');
      
      this.currentUser = user;

      // Notify all listeners
      this.authStateListeners.forEach(callback => {
        try {
          callback(user);
        } catch (error) {
          console.error('❌ Auth state listener error:', error);
        }
      });

      // Update UI
      this.updateAuthUI(user);

      // If user logged in, migrate old data if exists
      if (user) {
        await this.migrateOldUserData(user.uid);
      }
    });
  }

  // 📝 Register new user with email/password
  async registerWithEmail(email, password, displayName) {
    try {
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('📝 Registering new user:', email);

      // Create user
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile with display name
      if (displayName) {
        await user.updateProfile({
          displayName: displayName
        });
      }

      // Send verification email
      await user.sendEmailVerification();

      console.log('✅ User registered successfully:', user.uid);
      
      this.showNotification('✅ Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');

      return { success: true, user: user };

    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = 'Đăng ký thất bại';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email đã được sử dụng';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
          break;
        default:
          errorMessage = error.message;
      }

      this.showNotification('❌ ' + errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // 🔑 Login with email/password
  async loginWithEmail(email, password) {
    try {
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('🔑 Logging in user:', email);

      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log('✅ User logged in successfully:', user.uid);
      
      this.showNotification('✅ Đăng nhập thành công!');

      return { success: true, user: user };

    } catch (error) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Đăng nhập thất bại';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Tài khoản không tồn tại';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Sai mật khẩu';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Tài khoản đã bị vô hiệu hóa';
          break;
        default:
          errorMessage = error.message;
      }

      this.showNotification('❌ ' + errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // 🌐 Login with Google
  async loginWithGoogle() {
    try {
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('🌐 Logging in with Google...');

      const provider = new window.firebase.auth.GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');

      const userCredential = await this.auth.signInWithPopup(provider);
      const user = userCredential.user;

      console.log('✅ Google login successful:', user.uid);
      
      this.showNotification('✅ Đăng nhập Google thành công!');

      return { success: true, user: user };

    } catch (error) {
      console.error('❌ Google login failed:', error);
      
      let errorMessage = 'Đăng nhập Google thất bại';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Đã hủy đăng nhập';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup bị chặn. Vui lòng cho phép popup.';
      }

      this.showNotification('❌ ' + errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // 🚪 Logout
  async logout() {
    try {
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('🚪 Logging out user...');

      await this.auth.signOut();

      console.log('✅ User logged out successfully');
      
      this.showNotification('✅ Đã đăng xuất');

      return { success: true };

    } catch (error) {
      console.error('❌ Logout failed:', error);
      this.showNotification('❌ Đăng xuất thất bại');
      return { success: false, error: error.message };
    }
  }

  // 🔄 Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('📧 Sending password reset email to:', email);

      await this.auth.sendPasswordResetEmail(email);

      console.log('✅ Password reset email sent');
      
      this.showNotification('✅ Email đặt lại mật khẩu đã được gửi');

      return { success: true };

    } catch (error) {
      console.error('❌ Password reset failed:', error);
      
      let errorMessage = 'Gửi email thất bại';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email không tồn tại';
      }

      this.showNotification('❌ ' + errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // 👤 Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // 🆔 Get user ID (UID)
  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  // ✅ Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  }

  // 📧 Check if email is verified
  isEmailVerified() {
    return this.currentUser ? this.currentUser.emailVerified : false;
  }

  // 📱 Check existing session
  async checkExistingSession() {
    return new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          console.log('✅ Existing session found:', user.email);
          this.currentUser = user;
        } else {
          console.log('ℹ️ No existing session');
        }
        resolve(user);
      });
    });
  }

  // 🔔 Add auth state listener
  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.authStateListeners.push(callback);
    }
  }

  // 🔄 Migrate old localStorage data to Firebase Auth user
  async migrateOldUserData(newUserId) {
    try {
      const oldUserId = localStorage.getItem('movie_user_id_v2') || 
                        localStorage.getItem('movie_commenter_id');

      if (!oldUserId || oldUserId === newUserId) {
        console.log('ℹ️ No migration needed');
        return;
      }

      console.log('🔄 Migrating data from old User ID to Firebase Auth UID...');
      console.log('Old ID:', oldUserId);
      console.log('New ID:', newUserId);

      // Wait for Firebase Primary Storage to be ready
      if (!window.FirebasePrimaryStorage || !window.FirebasePrimaryStorage.initialized) {
        console.log('⏳ Waiting for Firebase Primary Storage...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Migrate saved movies
      const db = window.movieComments?.db || window.firebase.firestore();
      
      // Get old movies
      const oldMoviesSnapshot = await db
        .collection('savedMovies')
        .where('userId', '==', oldUserId)
        .get();

      console.log(`📚 Found ${oldMoviesSnapshot.size} movies to migrate`);

      // Migrate each movie
      const batch = db.batch();
      let migratedCount = 0;

      oldMoviesSnapshot.forEach(doc => {
        const data = doc.data();
        const newDocId = `${newUserId}_${data.slug}`;
        
        // Create new document with new user ID
        const newDocRef = db.collection('savedMovies').doc(newDocId);
        batch.set(newDocRef, {
          ...data,
          userId: newUserId,
          migratedAt: new Date(),
          oldUserId: oldUserId
        });

        // Delete old document
        batch.delete(doc.ref);
        migratedCount++;
      });

      // Commit batch
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${migratedCount} movies successfully`);
        
        this.showNotification(`✅ Đã chuyển ${migratedCount} phim đã lưu sang tài khoản mới`);
      }

      // Clear old User ID from localStorage
      localStorage.removeItem('movie_user_id_v2');
      localStorage.removeItem('movie_commenter_id');

      // Force refresh saved movies
      if (window.FirebasePrimaryStorage) {
        await window.FirebasePrimaryStorage.forceRefresh();
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.showNotification('⚠️ Không thể chuyển dữ liệu cũ. Phim đã lưu có thể bị mất.');
    }
  }

  // 🎨 Update UI based on auth state
  updateAuthUI(user) {
    // Update header user info
    const userInfoEl = document.querySelector('.user-info');
    if (userInfoEl) {
      if (user) {
        userInfoEl.innerHTML = `
          <div class="user-avatar">
            <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="Avatar" />
          </div>
          <span class="user-name">${user.displayName || user.email}</span>
          <button class="btn-logout" onclick="window.firebaseAuth.logout()">Đăng xuất</button>
        `;
      } else {
        userInfoEl.innerHTML = `
          <button class="btn-login" onclick="window.firebaseAuth.showAuthModal()">Đăng nhập</button>
        `;
      }
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
  }

  // 🎭 Show auth modal
  showAuthModal(mode = 'login') {
    // Remove existing modal if any
    const existingModal = document.querySelector('.auth-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="auth-modal-content">
        <button class="auth-modal-close" onclick="this.closest('.auth-modal').remove()">✕</button>
        
        <div class="auth-tabs">
          <button class="auth-tab ${mode === 'login' ? 'active' : ''}" data-tab="login">Đăng nhập</button>
          <button class="auth-tab ${mode === 'register' ? 'active' : ''}" data-tab="register">Đăng ký</button>
        </div>

        <!-- Login Form -->
        <form class="auth-form ${mode === 'login' ? 'active' : ''}" id="login-form">
          <h2>Đăng nhập</h2>
          
          <div class="form-group">
            <input type="email" id="login-email" placeholder="Email" required />
          </div>
          
          <div class="form-group">
            <input type="password" id="login-password" placeholder="Mật khẩu" required />
          </div>
          
          <button type="submit" class="btn-primary">Đăng nhập</button>
          
          <div class="auth-divider">hoặc</div>
          
          <button type="button" class="btn-google" onclick="window.firebaseAuth.loginWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"></path><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"></path><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"></path><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"></path></svg>
            Đăng nhập với Google
          </button>
          
          <div class="auth-footer">
            <a href="#" onclick="window.firebaseAuth.showResetPasswordModal(); return false;">Quên mật khẩu?</a>
          </div>
        </form>

        <!-- Register Form -->
        <form class="auth-form ${mode === 'register' ? 'active' : ''}" id="register-form">
          <h2>Đăng ký tài khoản</h2>
          
          <div class="form-group">
            <input type="text" id="register-name" placeholder="Tên hiển thị" required />
          </div>
          
          <div class="form-group">
            <input type="email" id="register-email" placeholder="Email" required />
          </div>
          
          <div class="form-group">
            <input type="password" id="register-password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" required />
          </div>
          
          <div class="form-group">
            <input type="password" id="register-confirm" placeholder="Xác nhận mật khẩu" required />
          </div>
          
          <button type="submit" class="btn-primary">Đăng ký</button>
          
          <div class="auth-divider">hoặc</div>
          
          <button type="button" class="btn-google" onclick="window.firebaseAuth.loginWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"></path><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"></path><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"></path><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"></path></svg>
            Đăng ký với Google
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind tab switching
    modal.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        
        modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        modal.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        e.target.classList.add('active');
        modal.querySelector(`#${targetTab}-form`).classList.add('active');
      });
    });

    // Bind login form
    modal.querySelector('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#login-email').value;
      const password = modal.querySelector('#login-password').value;
      
      const result = await this.loginWithEmail(email, password);
      if (result.success) {
        modal.remove();
      }
    });

    // Bind register form
    modal.querySelector('#register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = modal.querySelector('#register-name').value;
      const email = modal.querySelector('#register-email').value;
      const password = modal.querySelector('#register-password').value;
      const confirm = modal.querySelector('#register-confirm').value;
      
      if (password !== confirm) {
        this.showNotification('❌ Mật khẩu xác nhận không khớp');
        return;
      }
      
      const result = await this.registerWithEmail(email, password, name);
      if (result.success) {
        modal.remove();
      }
    });
  }

  // 🔐 Show reset password modal
  showResetPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="auth-modal-content">
        <button class="auth-modal-close" onclick="this.closest('.auth-modal').remove()">✕</button>
        
        <form class="auth-form active" id="reset-form">
          <h2>Đặt lại mật khẩu</h2>
          <p>Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
          
          <div class="form-group">
            <input type="email" id="reset-email" placeholder="Email" required />
          </div>
          
          <button type="submit" class="btn-primary">Gửi email</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#reset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#reset-email').value;
      
      const result = await this.sendPasswordResetEmail(email);
      if (result.success) {
        modal.remove();
      }
    });
  }

  // 📢 Show notification
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'auth-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 16px 24px;
      border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      font-size: 14px; max-width: 400px; font-weight: 500;
      animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

// Global instance
window.firebaseAuth = new FirebaseAuth();

// Auto-initialize when page loads
window.addEventListener('load', async () => {
  console.log('🔐 Starting Firebase Auth initialization...');
  
  // Wait for Firebase SDK
  let attempts = 0;
  const maxAttempts = 20;
  
  const waitAndInit = async () => {
    if (window.firebase && window.firebase.auth) {
      await window.firebaseAuth.init();
      return;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(waitAndInit, 500);
    } else {
      console.error('❌ Firebase Auth initialization timeout');
    }
  };
  
  setTimeout(waitAndInit, 1000);
});

console.log('🔐 Firebase Authentication System loaded');
