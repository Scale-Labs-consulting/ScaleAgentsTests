# Google OAuth Setup Guide for ScaleAgents

This guide will help you configure Google OAuth authentication for your ScaleAgents application using Supabase.

## Prerequisites

- A Supabase project
- A Google Cloud Console account
- Your application domain (for production) or localhost (for development)

## Step 1: Configure Google Cloud Console

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure the OAuth consent screen if prompted:
   - **User Type**: External (or Internal if using Google Workspace)
   - **App name**: ScaleAgents
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Scopes**: Add `email`, `profile`, `openid`

### 1.3 Configure OAuth 2.0 Client

1. **Application type**: Web application
2. **Name**: ScaleAgents Web Client
3. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://your-domain.com` (for production)
   - `https://your-supabase-project.supabase.co` (Supabase auth callback)
4. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://your-domain.com/auth/callback` (for production)
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### 1.4 Get Your Credentials

After creating the OAuth client, you'll get:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-client-secret`

## Step 2: Configure Supabase Authentication

### 2.1 Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Enable**
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
5. Click **Save**

### 2.2 Configure Site URL

1. In **Authentication** > **Settings**
2. Set **Site URL** to your application URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

### 2.3 Configure Redirect URLs

1. In **Authentication** > **Settings**
2. Add redirect URLs:
   - `http://localhost:3000/dashboard` (development)
   - `https://your-domain.com/dashboard` (production)

## Step 3: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google OAuth (optional - Supabase handles this)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 4: Test the Integration

### 4.1 Development Testing

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continuar com Google"
4. Complete the Google OAuth flow
5. Verify you're redirected to the dashboard

### 4.2 Production Testing

1. Deploy your application
2. Test the Google OAuth flow on your production domain
3. Verify redirects work correctly

## Step 5: Handle User Data

### 5.1 User Profile Creation

When users sign in with Google, Supabase will automatically create a user record. You may want to create a profile record in your `profiles` table:

```sql
-- This trigger will create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 5.2 Access User Data

In your application, you can access Google user data:

```typescript
const { user } = useAuth()

// Google user data is available in user_metadata
const googleData = user?.user_metadata
const fullName = googleData?.full_name
const firstName = googleData?.first_name
const lastName = googleData?.last_name
const avatarUrl = googleData?.avatar_url
```

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Ensure all redirect URIs are correctly configured in Google Cloud Console
   - Check that your Supabase site URL matches your application URL

2. **"Client ID not found" error**:
   - Verify your Google Client ID is correct in Supabase
   - Ensure the OAuth consent screen is properly configured

3. **Redirect loop**:
   - Check your redirect URLs in Supabase settings
   - Ensure your application handles the auth callback correctly

4. **User not created in profiles table**:
   - Verify the database trigger is created correctly
   - Check that the `profiles` table exists and has the correct structure

### Debug Mode

Enable debug mode in your Supabase client for development:

```typescript
// In lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true, // Enable for development
  }
})
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Environment Variables**: Never commit secrets to version control
3. **Domain Verification**: Verify your domain in Google Cloud Console for production
4. **Rate Limiting**: Monitor for unusual authentication patterns
5. **User Permissions**: Implement proper role-based access control

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all configuration steps are completed
3. Test with a fresh browser session
4. Check Supabase logs in the dashboard
5. Review Google Cloud Console logs
