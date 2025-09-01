// 🔐 Firebase Anonymous Authentication Fix
// Giải quyết vấn đề mất dữ liệu khi clear cookies trên GitHub Pages

class FirebaseAuthFix {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.initialized = false;
  }

  // 🚀 Initialize Firebase Auth
  async init() {
    if (this.initialized) return;

    try {
      // Wait for Firebase to be loaded
      await this.waitForFirebase();
      
      // Initialize Firebase Auth
      this.auth = firebase.auth();
      
      // Listen for auth state changes
      this.auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        if (user) {
          console.log('✅ User authenticated:', user.uid);
          // Update movieComments to use Firebase Auth UID
          this.updateMovieCommentsUserId(user.uid);
        } else {
          console.log('👤 No authenticated user');
        }
      });

      this.initialized = true;
      console.log('🔐 Firebase Auth initialized');
      
    } catch (error) {
      console.error('❌ Firebase Auth init failed:', error);
    }
  }

  // Wait for Firebase to be available
  async waitForFirebase(maxRetries = 20, delay = 100) {
    for (let i = 0; i < maxRetries; i++) {
      if (window.firebase && firebase.auth) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error('Firebase Auth not available');
  }

  // 🆔 Get or Create Anonymous User
  async getAuthenticatedUserId() {
    if (!this.initialized) {
      await this.init();
    }

    try {
      // Check if user is already signed in
      if (this.currentUser) {
        console.log('✅ Using existing auth user:', this.currentUser.uid);
        return this.currentUser.uid;
      }

      // Sign in anonymously
      console.log('🔑 Signing in anonymously...');
      const result = await this.auth.signInAnonymously();
      
      console.log('✅ Anonymous sign-in successful:', result.user.uid);
      return result.user.uid;
      
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      
      // Fallback to old method
      return this.getFallbackUserId();
    }
  }

  // 🔄 Fallback to old User ID method
  getFallbackUserId() {
    console.log('⚠️ Using fallback User ID method');
    
    let userId = localStorage.getItem('movie_user_id_v2') || 
                 localStorage.getItem('movie_commenter_id');
    
    if (!userId) {
      userId = this.generateDeterministicUserId();
      localStorage.setItem('movie_user_id_v2', userId);
    }
    
    return userId;
  }

  // 🎯 Generate Deterministic User ID (improved)
  generateDeterministicUserId() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown',
      navigator.maxTouchPoints || 0,
      new Date().getTimezoneOffset()
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `user_det_${Math.abs(hash).toString(36)}`;
  }

  // 🔧 Update movieComments to use Firebase Auth UID
  updateMovieCommentsUserId(authUid) {
    if (window.movieComments) {
      // Override getUserId method
      window.movieComments.getUserId = () => authUid;
      console.log('✅ movieComments updated to use Firebase Auth UID');
    }
  }

  // 🔄 Migrate existing data to new auth user
  async migrateExistingData() {
    try {
      const oldUserId = localStorage.getItem('movie_user_id_v2') || 
                       localStorage.getItem('movie_commenter_id');
      
      if (!oldUserId || !this.currentUser) {
        return;
      }

      console.log('🔄 Migrating data from old user ID to Firebase Auth...');
      
      // Get Firebase instance
      const db = firebase.firestore();
      
      // Migrate saved movies
      const savedMoviesQuery = await db.collection('savedMovies')
        .where('userId', '==', oldUserId)
        .get();
      
      const batch = db.batch();
      let migratedCount = 0;
      
      savedMoviesQuery.forEach(doc => {
        const newDocRef = db.collection('savedMovies').doc();
        const data = doc.data();
        data.userId = this.currentUser.uid;
        data.migratedFrom = oldUserId;
        data.migratedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        batch.set(newDocRef, data);
        migratedCount++;
      });
      
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${migratedCount} saved movies to Firebase Auth`);
        
        // Show notification to user
        if (window.movieComments && window.movieComments.showNotification) {
          window.movieComments.showNotification(
            `✅ Đã chuyển đổi ${migratedCount} phim đã lưu sang hệ thống bảo mật mới`
          );
        }
      }
      
    } catch (error) {
      console.error('❌ Data migration failed:', error);
    }
  }

  // 🎯 Main method to get user ID
  async getUserId() {
    const authUserId = await this.getAuthenticatedUserId();
    
    // Try to migrate existing data once
    if (this.currentUser && !localStorage.getItem('migration_completed')) {
      await this.migrateExistingData();
      localStorage.setItem('migration_completed', 'true');
    }
    
    return authUserId;
  }
}

// 🌟 Global instance
window.firebaseAuthFix = new FirebaseAuthFix();

// 🔧 Auto-initialize when Firebase is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.firebaseAuthFix.init();
    console.log('🔐 Firebase Auth Fix ready');
  } catch (error) {
    console.error('❌ Firebase Auth Fix initialization failed:', error);
  }
});

console.log('🔐 Firebase Auth Fix loaded');
