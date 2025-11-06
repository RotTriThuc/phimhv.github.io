@echo off
echo ============================================
echo   DEPLOY FIREBASE SECURITY RULES
echo ============================================
echo.

echo Step 1: Copying rules to firestore.rules...
copy /Y firestore-rules-secure.rules firestore.rules

echo.
echo Step 2: Deploying to Firebase...
firebase deploy --only firestore:rules

echo.
echo ============================================
echo   DONE! Firebase Rules deployed successfully
echo ============================================
pause
