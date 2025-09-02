# Authentication Setup Guide

## Issue Fixed
The error you encountered was due to using the deprecated `@supabase/auth-helpers-nextjs` package. I've updated the auth callback route to use the current Supabase client approach.

## Environment Variables Required

Make sure you have the following environment variables in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (for sales analyst)
OPENAI_KEY=your_openai_api_key
```

## How to Get These Values

### 1. Supabase Project URL and Keys
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy it to `OPENAI_KEY`

## Google OAuth Setup

Make sure your Google OAuth is properly configured in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
5. Set the **Redirect URL** to: `https://your-domain.com/auth/callback`

## Testing the Fix

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test Google Sign-in**:
   - Go to your login page
   - Click "Sign in with Google"
   - Complete the OAuth flow
   - You should be redirected to `/dashboard` without errors

## What Was Changed

### Before (Deprecated):
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

const supabase = createRouteHandlerClient({ cookies })
```

### After (Current):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

## Troubleshooting

### If you still get errors:

1. **Check environment variables**:
   ```bash
   # Make sure all required variables are set
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Clear browser cache and cookies**:
   - Clear all browser data for your domain
   - Try in an incognito/private window

3. **Check Supabase logs**:
   - Go to your Supabase Dashboard
   - Check **Logs** → **Auth** for any errors

4. **Verify Google OAuth setup**:
   - Ensure redirect URLs match exactly
   - Check that Google OAuth is enabled in Supabase

## Next Steps

Once authentication is working:

1. Test the complete user flow:
   - Registration
   - Login
   - Google OAuth
   - Logout

2. Verify that user profiles are created correctly

3. Test the sales analyst functionality with authenticated users

## Support

If you continue to have issues:

1. Check the browser console for any JavaScript errors
2. Check the terminal where you're running `npm run dev` for server errors
3. Verify all environment variables are correctly set
4. Ensure your Supabase project is active and accessible
