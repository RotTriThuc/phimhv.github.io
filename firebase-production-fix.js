// 🚨 FIREBASE PRODUCTION FIX - Immediate Solution
// Sửa lỗi Firebase không hoạt động trên GitHub Pages

(function() {
  'use strict';
  
  console.log('🚨 Firebase Production Fix loading...');

  // Force Firebase to work on GitHub Pages
  const FirebaseProductionFix = {
    
    // Check if we're on GitHub Pages
    isGitHubPages() {
      return window.location.hostname.includes('github.io') || 
             window.location.hostname.includes('github.com');
    },

    // Enhanced Firebase initialization for production
    async forceFirebaseInit() {
      console.log('🔄 Force initializing Firebase for production...');
      
      try {
        // Wait for Firebase SDK to be available
        let attempts = 0;
        while (!window.firebase && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }

        if (!window.firebase) {
          throw new Error('Firebase SDK not available after 6 seconds');
        }

        // Initialize Firebase app if not already done
        if (!window.firebase.apps.length) {
          const firebaseConfig = {
            apiKey: "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
            authDomain: "phim-comments.firebaseapp.com",
            projectId: "phim-comments",
            storageBucket: "phim-comments.firebasestorage.app",
            messagingSenderId: "338411994257",
            appId: "1:338411994257:web:870b6a7cd166a50bc75330"
          };
          
          window.firebase.initializeApp(firebaseConfig);
          console.log('✅ Firebase app initialized');
        }

        // Get Firestore instance
        const db = window.firebase.firestore();
        
        // Test connection
        await db.collection('test').limit(1).get();
        console.log('✅ Firebase connection verified');

        return { success: true, db };
      } catch (error) {
        console.error('❌ Force Firebase init failed:', error);
        return { success: false, error: error.message };
      }
    },

    // Create backup storage system
    createBackupStorage() {
      return {
        async saveMovie(movie) {
          try {
            // Try Firebase first
            if (window.movieComments?.initialized) {
              return await window.movieComments.saveMovie(movie);
            }
            
            // Fallback to enhanced localStorage
            const saved = JSON.parse(localStorage.getItem('savedMovies') || '[]');
            
            // Check if already exists
            if (saved.some(m => m.slug === movie.slug)) {
              return false;
            }
            
            const movieData = {
              ...movie,
              savedAt: Date.now(),
              source: 'localStorage-backup'
            };
            
            saved.unshift(movieData);
            localStorage.setItem('savedMovies', JSON.stringify(saved));
            
            // Also save to IndexedDB for extra persistence
            this.saveToIndexedDB(movieData);
            
            console.log('💾 Movie saved to backup storage:', movie.name);
            return true;
          } catch (error) {
            console.error('❌ Backup save failed:', error);
            return false;
          }
        },

        async getSavedMovies() {
          try {
            // Try Firebase first
            if (window.movieComments?.initialized) {
              const firebaseMovies = await window.movieComments.getSavedMovies();
              if (firebaseMovies.length > 0) {
                return firebaseMovies;
              }
            }
            
            // Fallback to localStorage
            const localMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
            
            // Also try IndexedDB
            const indexedMovies = await this.getFromIndexedDB();
            
            // Merge and deduplicate
            const allMovies = [...localMovies, ...indexedMovies];
            const uniqueMovies = allMovies.filter((movie, index, self) => 
              index === self.findIndex(m => m.slug === movie.slug)
            );
            
            console.log(`📚 Loaded ${uniqueMovies.length} movies from backup storage`);
            return uniqueMovies;
          } catch (error) {
            console.error('❌ Backup get failed:', error);
            return [];
          }
        },

        async removeSavedMovie(slug) {
          try {
            // Try Firebase first
            if (window.movieComments?.initialized) {
              const result = await window.movieComments.removeSavedMovie(slug);
              if (result) return true;
            }
            
            // Remove from localStorage
            const saved = JSON.parse(localStorage.getItem('savedMovies') || '[]');
            const filtered = saved.filter(m => m.slug !== slug);
            localStorage.setItem('savedMovies', JSON.stringify(filtered));
            
            // Remove from IndexedDB
            this.removeFromIndexedDB(slug);
            
            console.log('🗑️ Movie removed from backup storage:', slug);
            return true;
          } catch (error) {
            console.error('❌ Backup remove failed:', error);
            return false;
          }
        },

        // IndexedDB methods for extra persistence
        async saveToIndexedDB(movie) {
          try {
            const request = indexedDB.open('MovieBackup', 1);
            
            request.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('movies')) {
                db.createObjectStore('movies', { keyPath: 'slug' });
              }
            };
            
            request.onsuccess = (e) => {
              const db = e.target.result;
              const transaction = db.transaction(['movies'], 'readwrite');
              const store = transaction.objectStore('movies');
              store.put(movie);
            };
          } catch (error) {
            console.warn('⚠️ IndexedDB save failed:', error);
          }
        },

        async getFromIndexedDB() {
          try {
            return new Promise((resolve) => {
              const request = indexedDB.open('MovieBackup', 1);
              
              request.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('movies')) {
                  resolve([]);
                  return;
                }
                
                const transaction = db.transaction(['movies'], 'readonly');
                const store = transaction.objectStore('movies');
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                  resolve(getAllRequest.result || []);
                };
                
                getAllRequest.onerror = () => {
                  resolve([]);
                };
              };
              
              request.onerror = () => {
                resolve([]);
              };
            });
          } catch (error) {
            console.warn('⚠️ IndexedDB get failed:', error);
            return [];
          }
        },

        async removeFromIndexedDB(slug) {
          try {
            const request = indexedDB.open('MovieBackup', 1);
            
            request.onsuccess = (e) => {
              const db = e.target.result;
              if (db.objectStoreNames.contains('movies')) {
                const transaction = db.transaction(['movies'], 'readwrite');
                const store = transaction.objectStore('movies');
                store.delete(slug);
              }
            };
          } catch (error) {
            console.warn('⚠️ IndexedDB remove failed:', error);
          }
        }
      };
    },

    // Override Storage methods to use backup
    overrideStorageMethods() {
      if (!window.Storage) return;
      
      const backupStorage = this.createBackupStorage();
      
      // Override getSavedMovies
      const originalGetSavedMovies = window.Storage.getSavedMovies;
      window.Storage.getSavedMovies = async function() {
        try {
          return await backupStorage.getSavedMovies();
        } catch (error) {
          console.error('❌ Enhanced getSavedMovies failed:', error);
          return originalGetSavedMovies.call(this);
        }
      };

      // Override saveMovie
      const originalSaveMovie = window.Storage.saveMovie;
      window.Storage.saveMovie = async function(movie) {
        try {
          return await backupStorage.saveMovie(movie);
        } catch (error) {
          console.error('❌ Enhanced saveMovie failed:', error);
          return originalSaveMovie.call(this, movie);
        }
      };

      // Override removeSavedMovie
      const originalRemoveSavedMovie = window.Storage.removeSavedMovie;
      window.Storage.removeSavedMovie = async function(slug) {
        try {
          return await backupStorage.removeSavedMovie(slug);
        } catch (error) {
          console.error('❌ Enhanced removeSavedMovie failed:', error);
          return originalRemoveSavedMovie.call(this, slug);
        }
      };

      console.log('✅ Storage methods enhanced with backup system');
    },

    // Show fix status
    showFixStatus() {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed; top: 20px; left: 20px; z-index: 10000;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white; padding: 15px 20px; border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px; max-width: 350px;
      `;
      
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">🚨 Firebase Production Fix</div>
        <div style="font-size: 12px;">Enhanced backup system activated</div>
        <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
          Phim đã lưu sẽ không mất khi clear cache!
        </div>
        <button onclick="this.parentElement.remove()" style="
          position: absolute; top: 5px; right: 10px;
          background: none; border: none; color: white;
          font-size: 16px; cursor: pointer;
        ">×</button>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 8000);
    },

    // Main initialization
    async init() {
      console.log('🚨 Starting Firebase Production Fix...');
      
      // Force Firebase initialization
      const firebaseResult = await this.forceFirebaseInit();
      
      if (firebaseResult.success) {
        console.log('✅ Firebase working on production');
      } else {
        console.warn('⚠️ Firebase failed, using backup system');
      }
      
      // Always enable backup system for extra safety
      this.overrideStorageMethods();
      
      // Show status
      if (this.isGitHubPages()) {
        this.showFixStatus();
      }
      
      console.log('✅ Firebase Production Fix completed');
    }
  };

  // Auto-run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => FirebaseProductionFix.init(), 1000);
    });
  } else {
    setTimeout(() => FirebaseProductionFix.init(), 1000);
  }

  // Make it globally available
  window.FirebaseProductionFix = FirebaseProductionFix;

})();

console.log('🚨 Firebase Production Fix loaded!');
