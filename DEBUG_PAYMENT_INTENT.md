# Debug Payment Intent Error

## Required Environment Variables

Your payment intent creation needs these environment variables:

```env
# Stripe (you have this)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...

# Supabase (check if you have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # This one is often missing!

# App URL (optional but recommended)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Most Likely Issue: Missing SUPABASE_SERVICE_ROLE_KEY

The payment intent API needs `SUPABASE_SERVICE_ROLE_KEY` to:
1. Look up user details in the database
2. Create/update Stripe customer records

## How to Get Your Service Role Key

1. Go to your **Supabase Dashboard**
2. Click on **Settings** → **API**
3. Copy the **service_role** key (not the anon key!)
4. Add it to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Quick Test

To test if your environment variables are working, you can:

1. **Check the browser console** when the error occurs
2. **Look at your server logs** for more detailed error messages
3. **Verify Stripe key format**:
   - Test keys start with `sk_test_`
   - Live keys start with `sk_live_`

## Common Issues

### Issue 1: Wrong Stripe Key Type
- Make sure you're using a **secret key** (starts with `sk_`)
- Not a **publishable key** (starts with `pk_`)

### Issue 2: Test vs Live Mode Mismatch
- If using test keys, make sure all Stripe resources are in test mode
- If using live keys, make sure all resources are in live mode

### Issue 3: Missing Supabase Service Role Key
- The API endpoint needs service role access to read/write user data
- Regular anon key won't work for server-side operations

## Next Steps

1. **Add the missing SUPABASE_SERVICE_ROLE_KEY**
2. **Restart your development server**
3. **Try the checkout again**
4. **Check browser console for detailed error messages**

If you're still getting errors after adding the service role key, check the server logs for more specific error details!
