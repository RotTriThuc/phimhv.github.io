// 🔧 Firebase Debug Tool for GitHub Pages
// Tool để debug và sửa lỗi Firebase trên production

class FirebaseDebugTool {
  constructor() {
    this.debugInfo = {
      firebaseLoaded: false,
      movieCommentsLoaded: false,
      initialized: false,
      connectionTest: false,
      errors: []
    };
  }

  // Chạy full diagnostic
  async runFullDiagnostic() {
    console.log('🔍 Starting Firebase diagnostic...');
    
    const results = {
      step1: await this.checkFirebaseSDK(),
      step2: await this.checkMovieComments(),
      step3: await this.checkInitialization(),
      step4: await this.checkConnection(),
      step5: await this.testSaveMovie(),
      step6: await this.checkFirestoreRules()
    };

    this.showDiagnosticResults(results);
    return results;
  }

  // Step 1: Check Firebase SDK
  async checkFirebaseSDK() {
    console.log('📦 Checking Firebase SDK...');
    
    if (!window.firebase) {
      console.error('❌ Firebase SDK not loaded');
      return { success: false, error: 'Firebase SDK not loaded' };
    }

    if (!window.firebase.firestore) {
      console.error('❌ Firestore not available');
      return { success: false, error: 'Firestore not available' };
    }

    console.log('✅ Firebase SDK loaded');
    return { success: true };
  }

  // Step 2: Check MovieComments instance
  async checkMovieComments() {
    console.log('🎬 Checking MovieComments instance...');
    
    if (!window.movieComments) {
      console.error('❌ movieComments not available');
      return { success: false, error: 'movieComments not available' };
    }

    console.log('✅ movieComments instance found');
    return { success: true };
  }

  // Step 3: Check initialization
  async checkInitialization() {
    console.log('🔄 Checking Firebase initialization...');
    
    if (!window.movieComments.initialized) {
      console.warn('⚠️ Firebase not initialized, attempting to initialize...');
      
      try {
        const initResult = await window.movieComments.init();
        if (initResult) {
          console.log('✅ Firebase initialized successfully');
          return { success: true, message: 'Initialized manually' };
        } else {
          console.error('❌ Firebase initialization failed');
          return { success: false, error: 'Initialization failed' };
        }
      } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return { success: false, error: error.message };
      }
    }

    console.log('✅ Firebase already initialized');
    return { success: true };
  }

  // Step 4: Check connection
  async checkConnection() {
    console.log('🔗 Testing Firebase connection...');
    
    try {
      if (!window.movieComments.db) {
        return { success: false, error: 'Firestore database not available' };
      }

      // Test read permission
      await window.movieComments.db.collection('test').limit(1).get();
      console.log('✅ Firebase connection successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Step 5: Test save movie
  async testSaveMovie() {
    console.log('💾 Testing save movie...');
    
    try {
      const testMovie = {
        slug: 'firebase-test-' + Date.now(),
        name: 'Firebase Test Movie',
        poster_url: 'https://via.placeholder.com/300x400',
        year: 2024,
        lang: 'Vietsub',
        quality: 'HD',
        episode_current: 'Full'
      };

      const result = await window.movieComments.saveMovie(testMovie);
      
      if (result) {
        console.log('✅ Save movie test successful');
        
        // Clean up test movie
        try {
          await window.movieComments.removeSavedMovie(testMovie.slug);
          console.log('🗑️ Test movie cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup test movie:', cleanupError);
        }
        
        return { success: true };
      } else {
        return { success: false, error: 'Save returned false' };
      }
    } catch (error) {
      console.error('❌ Save movie test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Step 6: Check Firestore rules
  async checkFirestoreRules() {
    console.log('🛡️ Checking Firestore rules...');
    
    try {
      // Test write permission to savedMovies collection
      const testDoc = {
        test: true,
        timestamp: new Date(),
        userId: 'test-user-' + Date.now()
      };

      const docRef = await window.movieComments.db.collection('savedMovies').add(testDoc);
      console.log('✅ Write permission OK');
      
      // Clean up
      await docRef.delete();
      console.log('🗑️ Test document cleaned up');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Firestore rules test failed:', error);
      
      if (error.code === 'permission-denied') {
        return { 
          success: false, 
          error: 'Permission denied - check Firestore rules',
          suggestion: 'Update Firestore rules to allow read/write'
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Show diagnostic results
  showDiagnosticResults(results) {
    console.log('\n📊 FIREBASE DIAGNOSTIC RESULTS:');
    console.log('=====================================');
    
    const steps = [
      { name: 'Firebase SDK', result: results.step1 },
      { name: 'MovieComments', result: results.step2 },
      { name: 'Initialization', result: results.step3 },
      { name: 'Connection', result: results.step4 },
      { name: 'Save Movie', result: results.step5 },
      { name: 'Firestore Rules', result: results.step6 }
    ];

    let allPassed = true;
    
    steps.forEach((step, index) => {
      const status = step.result.success ? '✅' : '❌';
      const message = step.result.success ? 'PASS' : `FAIL: ${step.result.error}`;
      console.log(`${index + 1}. ${step.name}: ${status} ${message}`);
      
      if (!step.result.success) {
        allPassed = false;
        if (step.result.suggestion) {
          console.log(`   💡 Suggestion: ${step.result.suggestion}`);
        }
      }
    });

    console.log('=====================================');
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - Firebase is working!');
      this.showSuccessMessage();
    } else {
      console.log('❌ SOME TESTS FAILED - Firebase needs fixing');
      this.showFixInstructions(results);
    }
  }

  // Show success message
  showSuccessMessage() {
    const message = `
🎉 Firebase hoạt động hoàn hảo!

✅ Phim đã lưu sẽ không mất khi clear cache
✅ Cross-device sync hoạt động
✅ Tất cả tính năng Firebase đã sẵn sàng

Bạn có thể lưu phim và không lo mất dữ liệu!
    `;
    
    console.log(message);
    this.showNotification('🎉 Firebase hoạt động hoàn hảo!', 'success');
  }

  // Show fix instructions
  showFixInstructions(results) {
    console.log('\n🔧 HƯỚNG DẪN SỬA LỖI:');
    
    if (!results.step1.success) {
      console.log('1. Firebase SDK không load được:');
      console.log('   - Kiểm tra kết nối internet');
      console.log('   - Reload trang và thử lại');
    }
    
    if (!results.step3.success) {
      console.log('2. Firebase không khởi tạo được:');
      console.log('   - Chạy: await movieComments.init()');
      console.log('   - Kiểm tra Firebase config');
    }
    
    if (!results.step4.success) {
      console.log('3. Không kết nối được Firebase:');
      console.log('   - Kiểm tra internet connection');
      console.log('   - Kiểm tra Firestore rules');
    }
    
    if (!results.step6.success) {
      console.log('4. Firestore rules chặn truy cập:');
      console.log('   - Cập nhật Firestore rules cho phép read/write');
      console.log('   - Hoặc enable anonymous authentication');
    }

    this.showNotification('❌ Firebase cần được sửa lỗi', 'error');
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 15px 20px; border-radius: 8px; color: white;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px; max-width: 350px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ${type === 'success' ? 'background: #4CAF50;' : 
        type === 'error' ? 'background: #f44336;' : 'background: #2196F3;'}
    `;
    
    notification.innerHTML = `
      <div>${message}</div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute; top: 5px; right: 10px;
        background: none; border: none; color: white;
        font-size: 18px; cursor: pointer;
      ">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Quick fix attempt
  async quickFix() {
    console.log('🚀 Attempting quick fix...');
    
    try {
      // Force Firebase initialization
      if (window.movieComments && !window.movieComments.initialized) {
        console.log('🔄 Force initializing Firebase...');
        await window.movieComments.init();
      }
      
      // Test if it works now
      const testResult = await this.testSaveMovie();
      
      if (testResult.success) {
        console.log('✅ Quick fix successful!');
        this.showNotification('✅ Firebase đã được sửa!', 'success');
        return true;
      } else {
        console.log('❌ Quick fix failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Quick fix error:', error);
      return false;
    }
  }

  // Show debug UI
  showDebugUI() {
    const existingUI = document.getElementById('firebase-debug-ui');
    if (existingUI) {
      existingUI.remove();
    }

    const debugUI = document.createElement('div');
    debugUI.id = 'firebase-debug-ui';
    debugUI.style.cssText = `
      position: fixed; top: 50px; left: 20px; z-index: 9999;
      background: #1e1e1e; color: white; padding: 20px;
      border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px; max-width: 400px;
    `;

    debugUI.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 15px;">🔧 Firebase Debug Tool</div>
      
      <button id="run-diagnostic" style="
        width: 100%; padding: 10px; margin-bottom: 10px;
        background: #2196F3; color: white; border: none;
        border-radius: 5px; cursor: pointer;
      ">🔍 Run Full Diagnostic</button>
      
      <button id="quick-fix" style="
        width: 100%; padding: 10px; margin-bottom: 10px;
        background: #4CAF50; color: white; border: none;
        border-radius: 5px; cursor: pointer;
      ">🚀 Quick Fix</button>
      
      <button id="force-init" style="
        width: 100%; padding: 10px; margin-bottom: 10px;
        background: #FF9800; color: white; border: none;
        border-radius: 5px; cursor: pointer;
      ">🔄 Force Initialize</button>
      
      <button id="close-debug" style="
        width: 100%; padding: 10px;
        background: #666; color: white; border: none;
        border-radius: 5px; cursor: pointer;
      ">❌ Close</button>
      
      <div id="debug-status" style="
        margin-top: 15px; padding: 10px;
        background: #333; border-radius: 5px;
        font-size: 12px; color: #ccc;
      ">Ready to debug...</div>
    `;

    document.body.appendChild(debugUI);

    // Event handlers
    document.getElementById('run-diagnostic').onclick = async () => {
      document.getElementById('debug-status').textContent = 'Running diagnostic...';
      await this.runFullDiagnostic();
      document.getElementById('debug-status').textContent = 'Diagnostic completed. Check console for results.';
    };

    document.getElementById('quick-fix').onclick = async () => {
      document.getElementById('debug-status').textContent = 'Attempting quick fix...';
      const success = await this.quickFix();
      document.getElementById('debug-status').textContent = success ? 'Quick fix successful!' : 'Quick fix failed. Try full diagnostic.';
    };

    document.getElementById('force-init').onclick = async () => {
      document.getElementById('debug-status').textContent = 'Force initializing...';
      try {
        await window.movieComments.init();
        document.getElementById('debug-status').textContent = 'Force initialization completed.';
      } catch (error) {
        document.getElementById('debug-status').textContent = 'Force initialization failed: ' + error.message;
      }
    };

    document.getElementById('close-debug').onclick = () => {
      debugUI.remove();
    };
  }
}

// Global instance
window.firebaseDebugTool = new FirebaseDebugTool();

// Auto-show debug UI if Firebase seems to have issues
setTimeout(() => {
  if (!window.movieComments?.initialized) {
    console.warn('⚠️ Firebase not initialized after 3 seconds. Showing debug tool...');
    window.firebaseDebugTool.showDebugUI();
  }
}, 3000);

// Keyboard shortcut to show debug UI
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    window.firebaseDebugTool.showDebugUI();
  }
});

console.log('🔧 Firebase Debug Tool loaded!');
console.log('💡 Use: firebaseDebugTool.runFullDiagnostic()');
console.log('💡 Use: firebaseDebugTool.showDebugUI()');
console.log('💡 Shortcut: Ctrl+Shift+D to show debug UI');
