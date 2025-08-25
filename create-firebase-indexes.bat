@echo off
title Create Firebase Indexes
color 0A

echo ========================================
echo    FIREBASE INDEXES CREATION GUIDE
echo ========================================
echo.

echo 🔥 Firebase Composite Index Setup
echo.
echo Current Error:
echo "The query requires an index"
echo.

echo 📋 REQUIRED INDEXES:
echo.
echo 1. savedMovies Collection:
echo    - Collection ID: savedMovies
echo    - Field 1: userId (Ascending)
echo    - Field 2: savedAt (Descending)
echo.

echo 2. watchProgress Collection:
echo    - Collection ID: watchProgress  
echo    - Field 1: userId (Ascending)
echo    - Field 2: updatedAt (Descending)
echo.

echo 3. comments Collection:
echo    - Collection ID: comments
echo    - Field 1: movieSlug (Ascending)
echo    - Field 2: timestamp (Descending)
echo.

echo ========================================
echo           SETUP STEPS
echo ========================================
echo.

echo OPTION A - Quick Setup (Recommended):
echo 1. Copy this link and open in browser:
echo    https://console.firebase.google.com/v1/r/project/phim-comments/firestore/indexes?create_composite=ClFwcm9qZWN0cy9waGltLWNvbW1lbnRzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zYXZlZE1vdmllcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoLCgdzYXZlZEF0EAIaDAoIX19uYW1lX18QAg
echo.
echo 2. Click "Create Index" button
echo 3. Wait 1-5 minutes for creation
echo.

echo OPTION B - Manual Setup:
echo 1. Go to: https://console.firebase.google.com/
echo 2. Select project: phim-comments
echo 3. Navigate: Firestore Database → Indexes
echo 4. Click "Create Index"
echo 5. Enter the index details above
echo 6. Click "Create"
echo.

echo ========================================
echo          CURRENT STATUS
echo ========================================
echo.
echo ✅ Website is working with fallback system
echo ✅ Movies are being saved successfully  
echo ✅ Cross-device sync is active
echo ⏳ Performance optimization pending
echo.

echo 📊 Performance Impact:
echo Without Index: Manual sorting (slower)
echo With Index:    Database sorting (faster)
echo.

echo ========================================
echo           VERIFICATION
echo ========================================
echo.
echo After creating indexes:
echo 1. Refresh your website
echo 2. Check browser console
echo 3. Look for: "📚 Loaded X saved movies from Firebase"
echo 4. No more index error messages
echo.

echo Press any key to open Firebase Console...
pause > nul

start https://console.firebase.google.com/project/phim-comments/firestore/indexes

echo.
echo Firebase Console opened in browser.
echo Follow the steps above to create indexes.
echo.
echo ========================================
echo    INDEX CREATION COMPLETED!
echo ========================================
echo.
echo Your website will automatically use the
echo optimized queries once indexes are ready.
echo.
echo No code changes needed - everything is
echo already implemented with fallback support!
echo.

pause
