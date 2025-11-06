// 🌉 Firebase Init Bridge
// Initialize Firebase v8 compat để dùng với firebase-auth.js

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
  authDomain: "phim-comments.firebaseapp.com",
  projectId: "phim-comments",
  storageBucket: "phim-comments.firebasestorage.app",
  messagingSenderId: "338411994257",
  appId: "1:338411994257:web:870b6a7cd166a50bc75330"
};

// Wait for Firebase SDK to load
const initFirebaseV8 = () => {
  if (window.firebase && window.firebase.apps.length === 0) {
    console.log('🔥 Initializing Firebase v8 for Auth...');
    
    // Initialize Firebase v8
    window.firebase.initializeApp(firebaseConfig);
    
    // Create mock movieComments for compatibility
    window.movieComments = {
      initialized: true,
      db: window.firebase.firestore()
    };
    
    console.log('✅ Firebase v8 initialized for Auth system');
  }
};

// Try to initialize immediately
initFirebaseV8();

// If not ready, wait and try again
if (!window.firebase || window.firebase.apps.length === 0) {
  console.log('⏳ Waiting for Firebase SDK...');
  
  // Retry every 100ms for up to 5 seconds
  let attempts = 0;
  const maxAttempts = 50;
  
  const retryInterval = setInterval(() => {
    attempts++;
    
    if (window.firebase && window.firebase.apps.length === 0) {
      initFirebaseV8();
      clearInterval(retryInterval);
    } else if (attempts >= maxAttempts) {
      console.error('❌ Firebase SDK not loaded after timeout');
      clearInterval(retryInterval);
    }
  }, 100);
}
