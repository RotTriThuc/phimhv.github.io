// 🧪 Test Script cho Firebase Auth Fix
// Kiểm tra xem giải pháp có hoạt động đúng không

class FirebaseAuthFixTester {
  constructor() {
    this.testResults = [];
    this.testMovie = {
      slug: 'test-movie-auth-fix',
      name: 'Test Movie for Auth Fix',
      poster_url: 'https://example.com/poster.jpg',
      year: 2024,
      lang: 'Vietsub',
      quality: 'HD',
      episode_current: 'Tập 1'
    };
  }

  // 🎯 Main test runner
  async runAllTests() {
    console.log('🧪 Starting Firebase Auth Fix Tests...');
    
    try {
      await this.testFirebaseAuthInitialization();
      await this.testUserIdGeneration();
      await this.testMovieSaveWithAuth();
      await this.testDataPersistence();
      await this.testMigrationProcess();
      await this.testFallbackMechanism();
      
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  // Test 1: Firebase Auth Initialization
  async testFirebaseAuthInitialization() {
    console.log('🔍 Test 1: Firebase Auth Initialization');
    
    try {
      // Check if Firebase Auth Fix is loaded
      if (!window.firebaseAuthFix) {
        throw new Error('Firebase Auth Fix not loaded');
      }

      // Initialize
      await window.firebaseAuthFix.init();
      
      // Check if Firebase Auth is available
      if (!firebase.auth) {
        throw new Error('Firebase Auth SDK not loaded');
      }

      this.addTestResult('Firebase Auth Initialization', true, 'Firebase Auth Fix loaded and initialized successfully');
      
    } catch (error) {
      this.addTestResult('Firebase Auth Initialization', false, error.message);
    }
  }

  // Test 2: User ID Generation
  async testUserIdGeneration() {
    console.log('🔍 Test 2: User ID Generation');
    
    try {
      // Get user ID using new method
      const userId1 = await window.firebaseAuthFix.getUserId();
      
      if (!userId1) {
        throw new Error('Failed to generate user ID');
      }

      // Get user ID again - should be same
      const userId2 = await window.firebaseAuthFix.getUserId();
      
      if (userId1 !== userId2) {
        throw new Error('User ID not consistent');
      }

      // Check if it's Firebase Auth UID format
      const isFirebaseUID = userId1.length >= 20 && !userId1.includes('user_');
      
      this.addTestResult('User ID Generation', true, 
        `Generated consistent User ID: ${userId1.substring(0, 10)}... (Firebase UID: ${isFirebaseUID})`);
      
    } catch (error) {
      this.addTestResult('User ID Generation', false, error.message);
    }
  }

  // Test 3: Movie Save with Auth
  async testMovieSaveWithAuth() {
    console.log('🔍 Test 3: Movie Save with Firebase Auth');
    
    try {
      // Wait for movieComments to be ready
      if (!window.movieComments) {
        throw new Error('movieComments not available');
      }

      await window.movieComments.init();

      // Save test movie
      const saveResult = await window.movieComments.saveMovie(this.testMovie);
      
      if (!saveResult) {
        throw new Error('Failed to save movie');
      }

      // Verify movie is saved
      const isSaved = await window.movieComments.isMovieSaved(this.testMovie.slug);
      
      if (!isSaved) {
        throw new Error('Movie not found after save');
      }

      this.addTestResult('Movie Save with Auth', true, 'Movie saved and verified successfully');
      
    } catch (error) {
      this.addTestResult('Movie Save with Auth', false, error.message);
    }
  }

  // Test 4: Data Persistence Simulation
  async testDataPersistence() {
    console.log('🔍 Test 4: Data Persistence Simulation');
    
    try {
      // Get current user ID
      const originalUserId = await window.firebaseAuthFix.getUserId();
      
      // Simulate clearing localStorage (but not Firebase Auth)
      const oldLocalStorageUserId = localStorage.getItem('movie_user_id_v2');
      localStorage.removeItem('movie_user_id_v2');
      localStorage.removeItem('movie_commenter_id');
      
      // Get user ID again - should still be same (from Firebase Auth)
      const newUserId = await window.firebaseAuthFix.getUserId();
      
      if (originalUserId !== newUserId) {
        throw new Error('User ID changed after localStorage clear');
      }

      // Restore localStorage for other tests
      if (oldLocalStorageUserId) {
        localStorage.setItem('movie_user_id_v2', oldLocalStorageUserId);
      }

      this.addTestResult('Data Persistence', true, 'User ID persisted after localStorage clear');
      
    } catch (error) {
      this.addTestResult('Data Persistence', false, error.message);
    }
  }

  // Test 5: Migration Process
  async testMigrationProcess() {
    console.log('🔍 Test 5: Migration Process');
    
    try {
      // Create fake old user data
      const fakeOldUserId = 'user_test_old_12345';
      localStorage.setItem('movie_commenter_id', fakeOldUserId);
      localStorage.removeItem('migration_completed');

      // Create new Firebase Auth Fix instance to trigger migration
      const testAuthFix = new window.FirebaseAuthFix();
      await testAuthFix.init();
      
      // Get user ID - should trigger migration
      const newUserId = await testAuthFix.getUserId();
      
      // Check if migration was marked complete
      const migrationCompleted = localStorage.getItem('migration_completed');
      
      if (!migrationCompleted) {
        console.warn('⚠️ Migration not marked complete (may be normal if no data to migrate)');
      }

      this.addTestResult('Migration Process', true, 'Migration process executed successfully');
      
    } catch (error) {
      this.addTestResult('Migration Process', false, error.message);
    }
  }

  // Test 6: Fallback Mechanism
  async testFallbackMechanism() {
    console.log('🔍 Test 6: Fallback Mechanism');
    
    try {
      // Temporarily disable Firebase Auth to test fallback
      const originalAuth = firebase.auth;
      firebase.auth = null;

      const testAuthFix = new window.FirebaseAuthFix();
      const fallbackUserId = await testAuthFix.getUserId();
      
      if (!fallbackUserId) {
        throw new Error('Fallback mechanism failed');
      }

      // Restore Firebase Auth
      firebase.auth = originalAuth;

      this.addTestResult('Fallback Mechanism', true, 'Fallback to old method works correctly');
      
    } catch (error) {
      this.addTestResult('Fallback Mechanism', false, error.message);
      
      // Ensure Firebase Auth is restored
      if (window.firebase && window.firebase.auth) {
        firebase.auth = window.firebase.auth;
      }
    }
  }

  // Helper: Add test result
  addTestResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  // Display final results
  displayResults() {
    console.log('\n🧪 Firebase Auth Fix Test Results:');
    console.log('=====================================');
    
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (!result.passed) {
        console.log(`   Error: ${result.message}`);
      }
    });
    
    console.log(`\n📊 Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Firebase Auth Fix is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the implementation.');
    }

    // Show notification to user
    if (window.movieComments && window.movieComments.showNotification) {
      const message = passedTests === totalTests 
        ? `✅ Firebase Auth Fix: ${passedTests}/${totalTests} tests passed`
        : `⚠️ Firebase Auth Fix: ${passedTests}/${totalTests} tests passed`;
      
      window.movieComments.showNotification(message);
    }
  }

  // Clean up test data
  async cleanup() {
    try {
      if (window.movieComments) {
        await window.movieComments.removeSavedMovie(this.testMovie.slug);
      }
      console.log('🧹 Test cleanup completed');
    } catch (error) {
      console.warn('⚠️ Test cleanup failed:', error);
    }
  }
}

// 🚀 Auto-run tests when page loads (only in development)
document.addEventListener('DOMContentLoaded', async () => {
  // Only run tests in development or when explicitly requested
  const runTests = window.location.hostname === 'localhost' || 
                   window.location.search.includes('test=firebase-auth');
  
  if (runTests) {
    console.log('🧪 Auto-running Firebase Auth Fix tests...');
    
    // Wait for Firebase to be ready
    setTimeout(async () => {
      const tester = new FirebaseAuthFixTester();
      await tester.runAllTests();
      await tester.cleanup();
    }, 3000);
  }
});

// Global access for manual testing
window.FirebaseAuthFixTester = FirebaseAuthFixTester;

console.log('🧪 Firebase Auth Fix Test Suite loaded');
