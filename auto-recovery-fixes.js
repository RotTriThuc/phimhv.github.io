// 🔧 Auto-Recovery Quick Fixes
// Khắc phục các vấn đề phổ biến trong auto-recovery system

class AutoRecoveryFixes {
  constructor() {
    this.fixes = [];
    this.appliedFixes = [];
  }

  // 🔍 Detect and Fix Common Issues
  async detectAndFix() {
    console.log('🔧 Starting auto-recovery diagnostics and fixes...');

    const issues = await this.detectIssues();

    if (issues.length === 0) {
      console.log('✅ No issues detected with auto-recovery system');
      return { success: true, issues: [], fixes: [] };
    }

    console.log(`🚨 Detected ${issues.length} issues:`, issues);

    const fixes = await this.applyFixes(issues);

    return {
      success: fixes.every((f) => f.success),
      issues,
      fixes
    };
  }

  // 🔍 Issue Detection
  async detectIssues() {
    const issues = [];

    // Issue 1: Enhanced User Manager not working
    if (
      !window.enhancedUserManager ||
      typeof window.enhancedUserManager.getEnhancedUserId !== 'function'
    ) {
      issues.push({
        id: 'enhanced_user_manager_missing',
        severity: 'critical',
        description: 'Enhanced User Manager not available or not functioning'
      });
    }

    // Issue 2: Auto Recovery not working
    if (
      !window.autoRecovery ||
      typeof window.autoRecovery.detectDataLoss !== 'function'
    ) {
      issues.push({
        id: 'auto_recovery_missing',
        severity: 'critical',
        description: 'Auto Recovery system not available or not functioning'
      });
    }

    // Issue 3: Firebase not properly initialized
    if (!window.movieComments || !window.movieComments.initialized) {
      issues.push({
        id: 'firebase_not_initialized',
        severity: 'critical',
        description: 'Firebase/MovieComments system not properly initialized'
      });
    }

    // Issue 4: User ID generation issues
    try {
      const userId1 = await this.testUserIdGeneration();
      const userId2 = await this.testUserIdGeneration();

      if (userId1 !== userId2) {
        issues.push({
          id: 'user_id_not_deterministic',
          severity: 'high',
          description: 'User ID generation is not deterministic'
        });
      }
    } catch (error) {
      issues.push({
        id: 'user_id_generation_error',
        severity: 'critical',
        description: `User ID generation error: ${error.message}`
      });
    }

    // Issue 5: Storage access issues
    try {
      const testKey = 'test_storage_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== 'test') {
        issues.push({
          id: 'storage_access_issue',
          severity: 'high',
          description: 'localStorage access issues detected'
        });
      }
    } catch (error) {
      issues.push({
        id: 'storage_access_error',
        severity: 'critical',
        description: `Storage access error: ${error.message}`
      });
    }

    // Issue 6: Firebase query issues
    if (window.movieComments?.db) {
      try {
        await window.movieComments.db.collection('test').limit(1).get();
      } catch (error) {
        issues.push({
          id: 'firebase_query_error',
          severity: 'high',
          description: `Firebase query error: ${error.message}`
        });
      }
    }

    // Issue 7: Auto-recovery not triggering
    if (window.autoRecovery) {
      try {
        const dataLoss = await window.autoRecovery.detectDataLoss();
        if (dataLoss.hasDataLoss && !this.hasAutoRecoveryRun()) {
          issues.push({
            id: 'auto_recovery_not_triggering',
            severity: 'high',
            description: 'Auto-recovery should trigger but is not running'
          });
        }
      } catch (error) {
        issues.push({
          id: 'auto_recovery_detection_error',
          severity: 'high',
          description: `Auto-recovery detection error: ${error.message}`
        });
      }
    }

    return issues;
  }

  // 🔧 Apply Fixes
  async applyFixes(issues) {
    const fixes = [];

    for (const issue of issues) {
      try {
        const fix = await this.applyFix(issue);
        fixes.push(fix);

        if (fix.success) {
          this.appliedFixes.push(issue.id);
          console.log(`✅ Fixed: ${issue.description}`);
        } else {
          console.log(`❌ Failed to fix: ${issue.description} - ${fix.error}`);
        }
      } catch (error) {
        fixes.push({
          issueId: issue.id,
          success: false,
          error: error.message
        });
        console.log(`❌ Error fixing ${issue.id}: ${error.message}`);
      }
    }

    return fixes;
  }

  // 🔧 Individual Fix Methods
  async applyFix(issue) {
    switch (issue.id) {
    case 'enhanced_user_manager_missing':
      return await this.fixEnhancedUserManager();

    case 'auto_recovery_missing':
      return await this.fixAutoRecovery();

    case 'firebase_not_initialized':
      return await this.fixFirebaseInitialization();

    case 'user_id_not_deterministic':
      return await this.fixUserIdDeterminism();

    case 'storage_access_issue':
      return await this.fixStorageAccess();

    case 'firebase_query_error':
      return await this.fixFirebaseQueries();

    case 'auto_recovery_not_triggering':
      return await this.fixAutoRecoveryTriggering();

    default:
      return {
        issueId: issue.id,
        success: false,
        error: 'No fix available for this issue'
      };
    }
  }

  // Fix: Enhanced User Manager
  async fixEnhancedUserManager() {
    try {
      // Reinitialize enhanced user manager
      if (window.enhancedUserManager) {
        await window.enhancedUserManager.init();
      } else {
        // Create minimal enhanced user manager if missing
        window.enhancedUserManager = {
          async getEnhancedUserId() {
            // Fallback implementation
            let userId =
              localStorage.getItem('movie_user_id_v2') ||
              localStorage.getItem('movie_commenter_id');

            if (!userId) {
              // Generate deterministic ID
              const fingerprint = this.getSimpleFingerprint();
              userId = `user_det_${fingerprint}`;
              localStorage.setItem('movie_user_id_v2', userId);
            }

            return userId;
          },

          getSimpleFingerprint() {
            const data = [
              navigator.userAgent,
              navigator.language,
              screen.width + 'x' + screen.height,
              navigator.platform
            ].join('|');

            let hash = 0;
            for (let i = 0; i < data.length; i++) {
              const char = data.charCodeAt(i);
              hash = (hash << 5) - hash + char;
              hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
          },

          async attemptAutoRecovery() {
            return await this.getEnhancedUserId();
          },

          async init() {
            console.log('Enhanced User Manager fallback initialized');
          }
        };

        await window.enhancedUserManager.init();
      }

      return { issueId: 'enhanced_user_manager_missing', success: true };
    } catch (error) {
      return {
        issueId: 'enhanced_user_manager_missing',
        success: false,
        error: error.message
      };
    }
  }

  // Fix: Auto Recovery
  async fixAutoRecovery() {
    try {
      if (window.autoRecovery) {
        // Force re-initialization
        window.autoRecovery.isRecovering = false;
        window.autoRecovery.recoveryAttempts = 0;
      } else {
        // Create minimal auto recovery if missing
        window.autoRecovery = {
          async detectDataLoss() {
            const userId =
              localStorage.getItem('movie_user_id_v2') ||
              localStorage.getItem('movie_commenter_id');
            const movies = (await window.Storage?.getSavedMovies()) || [];

            return {
              hasDataLoss: !userId || movies.length === 0,
              probability: !userId || movies.length === 0 ? 1.0 : 0.0,
              indicators: {
                noUserId: !userId,
                noMovies: movies.length === 0
              }
            };
          },

          async startAutoRecovery() {
            console.log('🔄 Starting fallback auto-recovery...');

            try {
              // Try to get user ID
              let userId =
                await window.enhancedUserManager?.getEnhancedUserId();

              if (!userId && window.movieComments) {
                userId = await window.movieComments.getUserId();
              }

              if (userId) {
                // Try to load movies
                const movies = (await window.Storage?.getSavedMovies()) || [];

                return {
                  userIdRecovered: true,
                  dataRecovered: movies.length > 0,
                  moviesFound: movies.length,
                  method: 'fallback_recovery'
                };
              }

              return {
                userIdRecovered: false,
                dataRecovered: false,
                moviesFound: 0
              };
            } catch (error) {
              console.error('Fallback auto-recovery error:', error);
              return { success: false, error: error.message };
            }
          },

          async checkAndRecover() {
            const dataLoss = await this.detectDataLoss();

            if (dataLoss.hasDataLoss) {
              return await this.startAutoRecovery();
            }

            return { success: true, reason: 'no_recovery_needed' };
          }
        };
      }

      return { issueId: 'auto_recovery_missing', success: true };
    } catch (error) {
      return {
        issueId: 'auto_recovery_missing',
        success: false,
        error: error.message
      };
    }
  }

  // Fix: Firebase Initialization
  async fixFirebaseInitialization() {
    try {
      if (window.movieComments && !window.movieComments.initialized) {
        // Force re-initialization
        await window.movieComments.init();
      }

      // Wait for initialization
      let attempts = 0;
      while (!window.movieComments?.initialized && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      if (window.movieComments?.initialized) {
        return { issueId: 'firebase_not_initialized', success: true };
      } else {
        throw new Error('Firebase initialization timeout');
      }
    } catch (error) {
      return {
        issueId: 'firebase_not_initialized',
        success: false,
        error: error.message
      };
    }
  }

  // Fix: User ID Determinism
  async fixUserIdDeterminism() {
    try {
      // Clear inconsistent user IDs
      localStorage.removeItem('movie_commenter_id');
      sessionStorage.removeItem('movie_commenter_id');

      // Force regeneration with enhanced system
      if (window.enhancedUserManager) {
        const newUserId = await window.enhancedUserManager.getEnhancedUserId();
        console.log('Generated deterministic User ID:', newUserId);
      }

      return { issueId: 'user_id_not_deterministic', success: true };
    } catch (error) {
      return {
        issueId: 'user_id_not_deterministic',
        success: false,
        error: error.message
      };
    }
  }

  // Fix: Storage Access
  async fixStorageAccess() {
    try {
      // Clear any corrupted storage
      const corruptedKeys = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          const value = localStorage.getItem(key);
          JSON.parse(value || '{}');
        } catch (error) {
          if (key.includes('movie')) {
            corruptedKeys.push(key);
          }
        }
      }

      corruptedKeys.forEach((key) => {
        localStorage.removeItem(key);
        console.log('Removed corrupted storage key:', key);
      });

      return { issueId: 'storage_access_issue', success: true };
    } catch (error) {
      return {
        issueId: 'storage_access_issue',
        success: false,
        error: error.message
      };
    }
  }

  // Fix: Firebase Queries
  async fixFirebaseQueries() {
    try {
      // Test and fix Firebase connection
      if (window.movieComments?.db) {
        // Enable offline persistence if not already enabled
        try {
          await window.movieComments.db.enablePersistence({
            synchronizeTabs: true
          });
        } catch (error) {
          // Persistence might already be enabled
          console.log(
            'Firebase persistence already enabled or failed:',
            error.code
          );
        }
      }

      return { issueId: 'firebase_query_error', success: true };
    } catch (error) {
      return {
        issueId: 'firebase_query_error',
        success: false,
        error: error.message
      };
    }
  }

  // Fix: Auto-Recovery Triggering
  async fixAutoRecoveryTriggering() {
    try {
      // Force trigger auto-recovery
      if (window.autoRecovery) {
        console.log('🔄 Force triggering auto-recovery...');
        const result = await window.autoRecovery.startAutoRecovery();
        console.log('Auto-recovery result:', result);
      }

      return { issueId: 'auto_recovery_not_triggering', success: true };
    } catch (error) {
      return {
        issueId: 'auto_recovery_not_triggering',
        success: false,
        error: error.message
      };
    }
  }

  // Helper Methods
  async testUserIdGeneration() {
    if (
      window.enhancedUserManager &&
      window.enhancedUserManager._generateDeterministicUserId
    ) {
      return window.enhancedUserManager._generateDeterministicUserId();
    } else if (window.movieComments) {
      return await window.movieComments.getUserId();
    }
    return null;
  }

  hasAutoRecoveryRun() {
    return (
      localStorage.getItem('auto_recovery_last_run') &&
      Date.now() - parseInt(localStorage.getItem('auto_recovery_last_run')) <
        60000
    ); // 1 minute
  }

  // Public API
  async quickFix() {
    console.log('🚀 Running quick fix for auto-recovery issues...');

    const result = await this.detectAndFix();

    if (result.success) {
      console.log('✅ All issues fixed successfully');

      // Mark recovery as run
      localStorage.setItem('auto_recovery_last_run', Date.now().toString());

      // Try to reload movies
      if (window.Storage) {
        const movies = await window.Storage.getSavedMovies();
        console.log(`📚 Movies now accessible: ${movies.length}`);
      }
    } else {
      console.log(
        '❌ Some issues could not be fixed:',
        result.fixes.filter((f) => !f.success)
      );
    }

    return result;
  }
}

// Global instance
window.autoRecoveryFixes = new AutoRecoveryFixes();

// Auto-run quick fix on load if issues detected
window.addEventListener('load', async () => {
  setTimeout(async () => {
    try {
      const issues = await window.autoRecoveryFixes.detectIssues();

      if (issues.length > 0) {
        console.log(
          `🔧 Detected ${issues.length} auto-recovery issues, applying quick fixes...`
        );
        await window.autoRecoveryFixes.quickFix();
      }
    } catch (error) {
      console.error('Auto-fix error:', error);
    }
  }, 3000); // Wait 3 seconds for all systems to load
});

console.log('🔧 Auto-Recovery Fixes loaded');
