// 🔥 FIREBASE SECURITY RULES
// Copy these rules to Firebase Console → Firestore Database → Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 💬 COMMENTS COLLECTION
    // Allow read/write for all users (anonymous authentication)
    match /comments/{document} {
      allow read, write: if true;
    }
    
    // ❤️ SAVED MOVIES COLLECTION  
    // Allow users to manage their own saved movies
    match /savedMovies/{document} {
      allow read, write: if true;
      // Alternative: restrict to user's own data
      // allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    // 📺 WATCH PROGRESS COLLECTION
    // Allow users to manage their own watch progress
    match /watchProgress/{document} {
      allow read, write: if true;
      // Alternative: restrict to user's own data  
      // allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    // 👤 USERS COLLECTION (if needed)
    match /users/{userId} {
      allow read, write: if true;
      // Alternative: restrict to own user data
      // allow read, write: if request.auth.uid == userId;
    }
    
    // 📊 ANALYTICS COLLECTION (read-only for users)
    match /analytics/{document} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}

/* 
🔧 SETUP INSTRUCTIONS:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Navigate to Firestore Database → Rules
4. Replace existing rules with the rules above
5. Click "Publish"

⚠️ SECURITY NOTES:

Current rules allow all users to read/write all data.
This is suitable for a public movie website where:
- Comments are public
- Saved movies can be shared
- Watch progress is user-specific but not sensitive

For production, consider:
- Implementing proper user authentication
- Restricting data access to authenticated users only
- Adding rate limiting
- Validating data structure

🚀 ALTERNATIVE SECURE RULES:

For authenticated users only:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For user-specific data only:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /savedMovies/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /watchProgress/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```
*/
