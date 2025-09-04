# Google OAuth Login Troubleshooting Guide

## Current Issue
You registered with Google but cannot log in. This guide will help you identify and fix the problem.

## Quick Fixes Applied
1. ✅ Fixed redirect URL in OAuth call (was pointing to `/auth/callback`, now points to `/dashboard`)
2. ✅ Simplified auth callback route for better reliability
3. ✅ Added comprehensive error handling and debugging
4. ✅ Added URL parameter error detection

## Step-by-Step Troubleshooting

### 1. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to log in with Google
4. Look for error messages starting with ❌ or 🔴

### 2. Test OAuth Configuration
Visit this URL to test your OAuth setup:
```
http://localhost:3000/api/test-oauth
```

This will show:
- Supabase connection status
- Current session info
- OAuth provider status
- Any configuration errors

### 3. Verify Supabase Settings

#### 3.1 Check Google Provider
1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Providers**
3. Ensure **Google** is enabled
4. Verify your Google Client ID and Secret are correct

#### 3.2 Check Site URL
1. In **Authentication** > **Settings**
2. Verify **Site URL** matches your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

#### 3.3 Check Redirect URLs
1. In **Authentication** > **Settings**
2. Add these redirect URLs:
   - `http://localhost:3000/dashboard`
   - `https://your-domain.com/dashboard` (if production)

### 4. Verify Google Cloud Console

#### 4.1 Check OAuth 2.0 Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID
4. Verify these settings:

**Authorized JavaScript origins:**
- `http://localhost:3000`
- `https://your-domain.com` (if production)
- `https://your-supabase-project.supabase.co`

**Authorized redirect URIs:**
- `http://localhost:3000/dashboard`
- `https://your-domain.com/dashboard` (if production)
- `https://your-supabase-project.supabase.co/auth/v1/callback`

### 5. Check Environment Variables
Ensure your `.env.local` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 6. Test the Flow

#### 6.1 Clear Browser Data
1. Clear cookies and localStorage for your domain
2. Try logging in again

#### 6.2 Check Network Tab
1. Open developer tools > Network tab
2. Try Google login
3. Look for failed requests or error responses

### 7. Common Issues and Solutions

#### Issue: "Invalid redirect URI"
**Solution:** 
- Check Google Cloud Console redirect URIs
- Ensure Supabase site URL matches your app URL
- Verify all redirect URLs are added to Supabase settings

#### Issue: "OAuth provider not enabled"
**Solution:**
- Enable Google provider in Supabase dashboard
- Verify Google Client ID and Secret are correct

#### Issue: "User not found"
**Solution:**
- Check if user exists in Supabase auth.users table
- Verify the Google account email matches what's in your database

#### Issue: Redirect loop
**Solution:**
- Check Supabase redirect URLs configuration
- Ensure dashboard route is accessible without authentication

### 8. Debug Mode
If issues persist, enable debug mode:

1. Edit `lib/supabase.ts`
2. Change `debug: false` to `debug: true`
3. Check console for detailed OAuth flow logs

### 9. Manual Testing
Test the OAuth flow manually:

1. Visit: `http://localhost:3000/login`
2. Click "Continuar com Google"
3. Complete Google OAuth
4. Check if you're redirected to dashboard
5. Check browser console for any errors

### 10. Get Help
If you're still having issues:

1. Check the browser console for specific error messages
2. Visit `/api/test-oauth` to see configuration status
3. Share the error messages and test results
4. Check Supabase logs in your dashboard

## Expected Behavior
After clicking "Continuar com Google":
1. Browser should redirect to Google OAuth consent screen
2. After consent, should redirect back to your app
3. Should automatically log you in and redirect to dashboard
4. No blue debug boxes should appear

## Next Steps
1. Try the Google login again
2. Check browser console for errors
3. Visit `/api/test-oauth` to test configuration
4. Let me know what errors you see
