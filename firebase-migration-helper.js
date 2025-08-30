// 🔄 FIREBASE MIGRATION HELPER
// Script để migrate dữ liệu từ localStorage sang Firebase và verify setup

class FirebaseMigrationHelper {
  constructor() {
    this.migrationComplete = false;
  }

  // Kiểm tra và migrate localStorage sang Firebase
  async migrateLocalStorageToFirebase() {
    console.log('🔄 Starting localStorage to Firebase migration...');
    
    try {
      // Đợi Firebase khởi tạo
      if (!window.movieComments || !window.movieComments.initialized) {
        console.log('⏳ Waiting for Firebase to initialize...');
        await this.waitForFirebase();
      }

      // Migrate saved movies
      await this.migrateSavedMovies();
      
      // Migrate watch progress
      await this.migrateWatchProgress();
      
      // Cleanup localStorage after successful migration
      this.cleanupLocalStorage();
      
      this.migrationComplete = true;
      console.log('✅ Migration completed successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
  }

  // Đợi Firebase khởi tạo
  async waitForFirebase(maxWait = 10000) {
    const startTime = Date.now();
    
    while (!window.movieComments?.initialized) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Firebase initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Firebase is ready');
  }

  // Migrate saved movies từ localStorage
  async migrateSavedMovies() {
    const localMovies = this.getLocalStorageMovies();
    
    if (localMovies.length === 0) {
      console.log('📚 No saved movies in localStorage to migrate');
      return;
    }

    console.log(`📚 Found ${localMovies.length} movies in localStorage, migrating...`);
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const movie of localMovies) {
      try {
        // Kiểm tra xem phim đã có trong Firebase chưa
        const isAlreadySaved = await window.movieComments.isMovieSaved(movie.slug);
        
        if (isAlreadySaved) {
          console.log(`⏭️ Movie already in Firebase: ${movie.name}`);
          skippedCount++;
          continue;
        }

        // Lưu vào Firebase
        const success = await window.movieComments.saveMovie(movie);
        if (success) {
          migratedCount++;
          console.log(`✅ Migrated: ${movie.name}`);
        }
        
        // Delay nhỏ để tránh rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to migrate ${movie.name}:`, error);
      }
    }

    console.log(`📊 Migration summary: ${migratedCount} migrated, ${skippedCount} skipped`);
  }

  // Migrate watch progress từ localStorage
  async migrateWatchProgress() {
    const localProgress = this.getLocalStorageWatchProgress();
    const movieSlugs = Object.keys(localProgress);
    
    if (movieSlugs.length === 0) {
      console.log('📺 No watch progress in localStorage to migrate');
      return;
    }

    console.log(`📺 Found ${movieSlugs.length} watch progress entries, migrating...`);
    
    let migratedCount = 0;

    for (const movieSlug of movieSlugs) {
      try {
        const progressData = localProgress[movieSlug];
        
        // Kiểm tra xem đã có trong Firebase chưa
        const existingProgress = await window.movieComments.getWatchProgress(movieSlug);
        
        if (existingProgress) {
          console.log(`⏭️ Watch progress already in Firebase: ${movieSlug}`);
          continue;
        }

        // Migrate vào Firebase
        await window.movieComments.setWatchProgress(movieSlug, progressData);
        migratedCount++;
        console.log(`✅ Migrated watch progress: ${movieSlug}`);
        
        // Delay nhỏ
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Failed to migrate watch progress ${movieSlug}:`, error);
      }
    }

    console.log(`📊 Watch progress migration: ${migratedCount} entries migrated`);
  }

  // Lấy saved movies từ localStorage
  getLocalStorageMovies() {
    try {
      const saved = localStorage.getItem('savedMovies');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Error reading localStorage savedMovies:', error);
      return [];
    }
  }

  // Lấy watch progress từ localStorage
  getLocalStorageWatchProgress() {
    try {
      const progress = localStorage.getItem('watchProgress');
      return progress ? JSON.parse(progress) : {};
    } catch (error) {
      console.error('❌ Error reading localStorage watchProgress:', error);
      return {};
    }
  }

  // Cleanup localStorage sau khi migrate thành công
  cleanupLocalStorage() {
    try {
      // Backup trước khi xóa
      const backup = {
        savedMovies: this.getLocalStorageMovies(),
        watchProgress: this.getLocalStorageWatchProgress(),
        backupDate: new Date().toISOString()
      };
      
      localStorage.setItem('firebase_migration_backup', JSON.stringify(backup));
      console.log('💾 Created backup before cleanup');
      
      // Xóa dữ liệu cũ
      localStorage.removeItem('savedMovies');
      localStorage.removeItem('watchProgress');
      
      console.log('🗑️ Cleaned up localStorage (backup preserved)');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Verify Firebase setup
  async verifyFirebaseSetup() {
    console.log('🔍 Verifying Firebase setup...');
    
    const checks = {
      firebaseLoaded: !!window.firebase,
      movieCommentsLoaded: !!window.movieComments,
      initialized: !!window.movieComments?.initialized,
      firestoreConnected: false,
      canWrite: false,
      canRead: false
    };

    try {
      // Test Firestore connection
      if (window.movieComments?.db) {
        checks.firestoreConnected = true;
        
        // Test write permission
        const testDoc = {
          test: true,
          timestamp: new Date(),
          userId: window.movieComments.getUserId()
        };
        
        await window.movieComments.db.collection('test').add(testDoc);
        checks.canWrite = true;
        
        // Test read permission
        const snapshot = await window.movieComments.db.collection('test').limit(1).get();
        checks.canRead = true;
        
        // Cleanup test data
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.delete();
        }
      }
    } catch (error) {
      console.error('❌ Firebase verification error:', error);
    }

    // Report results
    console.log('📊 Firebase Setup Verification:');
    Object.entries(checks).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${value}`);
    });

    const allGood = Object.values(checks).every(v => v === true);
    
    if (allGood) {
      console.log('🎉 Firebase setup is perfect!');
    } else {
      console.log('⚠️ Some Firebase features may not work properly');
    }

    return checks;
  }

  // Show migration status UI
  showMigrationStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'firebase-migration-status';
    statusDiv.style.cssText = `
      position: fixed; top: 20px; left: 20px; z-index: 9999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 15px 20px; border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px; max-width: 350px;
    `;

    statusDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">🔄 Firebase Migration</div>
      <div id="migration-progress">Checking setup...</div>
      <button id="start-migration" style="
        margin-top: 10px; padding: 8px 15px; background: #4CAF50;
        color: white; border: none; border-radius: 5px; cursor: pointer;
      ">Start Migration</button>
      <button id="close-migration" style="
        margin-top: 10px; margin-left: 10px; padding: 8px 15px; 
        background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;
      ">Close</button>
    `;

    document.body.appendChild(statusDiv);

    // Event handlers
    document.getElementById('start-migration').onclick = async () => {
      document.getElementById('migration-progress').textContent = 'Migrating...';
      const success = await this.migrateLocalStorageToFirebase();
      
      if (success) {
        document.getElementById('migration-progress').innerHTML = '✅ Migration completed!';
      } else {
        document.getElementById('migration-progress').innerHTML = '❌ Migration failed';
      }
    };

    document.getElementById('close-migration').onclick = () => {
      statusDiv.remove();
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.remove();
      }
    }, 30000);
  }
}

// Global instance
window.firebaseMigrationHelper = new FirebaseMigrationHelper();

// Auto-run verification when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.firebaseMigrationHelper.verifyFirebaseSetup();
    }, 2000);
  });
} else {
  setTimeout(() => {
    window.firebaseMigrationHelper.verifyFirebaseSetup();
  }, 2000);
}

console.log('🔄 Firebase Migration Helper loaded!');
console.log('💡 Use: firebaseMigrationHelper.migrateLocalStorageToFirebase()');
console.log('💡 Use: firebaseMigrationHelper.showMigrationStatus()');
