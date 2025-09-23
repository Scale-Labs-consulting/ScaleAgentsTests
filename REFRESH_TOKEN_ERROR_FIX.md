# Fix: Invalid Refresh Token Error

## Problem
You're seeing this error when opening the app:
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

## What This Means
This happens when Supabase has an invalid or expired refresh token stored in your browser's localStorage. This is common when:
- You haven't used the app for a long time
- The Supabase project was reset or reconfigured
- There was a browser storage corruption
- You switched between development/production environments

## ✅ Automatic Fix (Already Implemented)
The app now automatically detects and handles this error by:
1. Detecting the "Invalid Refresh Token" error
2. Automatically clearing the invalid tokens from localStorage
3. Resetting the authentication state
4. Allowing you to log in fresh

## 🛠️ Manual Fix Options

### Option 1: Browser Console (Recommended)
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Copy and paste this code:

```javascript
// Clear ScaleAgents Auth Tokens
(function() {
  let clearedCount = 0;
  
  // Clear specific ScaleAgents auth key
  if (localStorage.getItem('scaleagents-auth')) {
    localStorage.removeItem('scaleagents-auth');
    clearedCount++;
    console.log('✅ Cleared: scaleagents-auth');
  }
  
  // Clear Supabase-generated keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token')) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log('✅ Cleared:', key);
    }
  });
  
  if (clearedCount === 0) {
    console.log('ℹ️ No auth tokens found to clear');
  } else {
    console.log(`🎉 Successfully cleared ${clearedCount} auth token(s)`);
    console.log('💡 Please refresh the page to reinitialize authentication');
  }
})();
```

4. Press Enter to run it
5. Refresh the page

### Option 2: Browser Storage Cleanup
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Find "Local Storage" in the left sidebar
4. Click on your domain (localhost:3000 or your production URL)
5. Look for keys that contain:
   - `scaleagents-auth`
   - `sb-` followed by your project name
   - Any key containing `supabase` or `auth-token`
6. Delete these keys
7. Refresh the page

### Option 3: Clear All Browser Data
1. Go to your browser settings
2. Find "Clear browsing data" or "Privacy and Security"
3. Select "Cookies and other site data" and "Cached images and files"
4. Choose "Last hour" or "Last 24 hours"
5. Clear the data
6. Refresh the page

## 🔍 Prevention
The updated authentication system now includes:
- Better error handling for invalid refresh tokens
- Automatic cleanup of corrupted auth data
- More resilient session management
- Improved logging for debugging

## 🆘 If Problems Persist
If you continue seeing this error after trying the fixes above:

1. Check the browser console for additional error messages
2. Try logging in with a different browser or incognito mode
3. Verify your Supabase project is still active and configured correctly
4. Check if your environment variables are correct:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📧 Still Need Help?
If none of these solutions work, the error might indicate a deeper issue with:
- Supabase project configuration
- Network connectivity
- Environment variables
- Database permissions

In that case, check the full error logs and Supabase dashboard for more details.
