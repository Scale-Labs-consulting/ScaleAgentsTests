# Authentication Troubleshooting Guide

## Current Issue: Auth Callback Failing with PKCE Error

You're getting redirected to `/login?error=auth_callback_failed` after Google sign-in with the error:
```
invalid request: both auth code and code verifier should be non-empty
```

This is a **PKCE (Proof Key for Code Exchange)** issue. The auth callback needs to handle the PKCE flow properly.

## ✅ FIXED: Updated Auth Callback

The auth callback has been updated to use the correct PKCE configuration. The fix includes:

1. **Matching Supabase client configuration** between the main client and auth callback
2. **Proper PKCE flow setup** with `flowType: 'pkce'`
3. **Enhanced error logging** for better debugging

## Step 1: Test the Fix

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Clear browser cache and cookies** (important!)

3. **Test Google Sign-in again**:
   - Go to your login page
   - Click "Sign in with Google"
   - Complete the OAuth flow
   - Check the terminal for debug messages

## Step 2: Check Environment Variables

First, let's verify your environment variables are properly configured:

1. **Visit the debug endpoint**: Go to `http://localhost:3000/debug-env` in your browser
2. **Check the response** - it should show all environment variables as `true`

If any are `false`, you need to add them to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_KEY=your-openai-key-here
```

## Step 3: Check Supabase Google OAuth Configuration

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication → Providers**
3. **Enable Google provider** if not already enabled
4. **Verify the redirect URL** is set to: `http://localhost:3000/auth/callback`
5. **Make sure you have valid Google OAuth credentials**

## Step 4: Check Google OAuth Setup

1. **Go to Google Cloud Console**
2. **Navigate to APIs & Services → Credentials**
3. **Find your OAuth 2.0 Client ID**
4. **Add these authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback` (for production)

## Step 5: Debug the Auth Callback

The auth callback now has detailed logging. Check your terminal where you're running `npm run dev` for these messages:

```
🔄 Auth callback triggered
📝 Request URL: http://localhost:3000/auth/callback?code=...
🔑 Auth code present: true
🔧 Supabase URL configured: true
🔧 Supabase Anon Key configured: true
🔐 Exchanging code for session...
✅ Auth callback successful, session established
👤 User ID: [user-id]
🔄 Redirecting to dashboard...
```

## Step 6: Test Auth Configuration

Visit `http://localhost:3000/test-auth` to verify your Supabase auth configuration is working correctly.

## Step 7: Common Issues and Solutions

### Issue 1: "Missing environment variables"
**Solution**: Add the missing variables to your `.env.local` file

### Issue 2: "Invalid redirect URI"
**Solution**: Update your Google OAuth redirect URIs to include `http://localhost:3000/auth/callback`

### Issue 3: "Invalid client"
**Solution**: Check that your Google OAuth client ID and secret match in Supabase

### Issue 4: "Code exchange failed" or "PKCE error"
**Solution**: 
- Clear browser cache and cookies
- Restart the development server
- Try signing in again
- The updated auth callback should now handle PKCE correctly

## Step 8: Test the Complete Flow

1. **Clear your browser cache and cookies**
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Go to your login page**
4. **Click "Sign in with Google"**
5. **Complete the OAuth flow**
6. **Check the terminal for debug messages**

## Step 9: Check Browser Console

Open your browser's developer tools and check the Console tab for any JavaScript errors during the sign-in process.

## Step 10: Verify Supabase Logs

1. **Go to your Supabase Dashboard**
2. **Navigate to Logs → Auth**
3. **Look for any errors during the sign-in process**

## What Was Fixed

### Before (PKCE Error):
```typescript
// Simple client without proper PKCE config
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### After (Fixed):
```typescript
// Client with proper PKCE configuration matching main client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'scaleagents-auth',
    flowType: 'pkce',
    debug: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'scaleagents-web'
    }
  }
})
```

## Production Considerations

When deploying to production:

1. **Update Google OAuth redirect URIs** to include your production domain
2. **Update Supabase redirect URL** to your production domain
3. **Set environment variables** in your hosting platform
4. **Ensure HTTPS** is enabled (required for OAuth)

## Still Having Issues?

If you're still experiencing problems:

1. **Check the exact error message** in the URL parameters
2. **Look at the terminal output** for detailed logs
3. **Verify all environment variables** are correctly set
4. **Test with a fresh browser session** (incognito/private mode)
5. **Check that your Supabase project is active** and not paused
6. **Visit** `http://localhost:3000/test-auth` to verify auth configuration

## Quick Fix Checklist

- [ ] Environment variables are set in `.env.local`
- [ ] Google OAuth is enabled in Supabase
- [ ] Redirect URI is correct in Google Cloud Console
- [ ] Redirect URI is correct in Supabase
- [ ] Development server is restarted
- [ ] Browser cache is cleared
- [ ] No JavaScript errors in browser console
- [ ] Auth callback uses proper PKCE configuration ✅
