# Stripe Subscription Fix Guide

## Problem Identified
You're only seeing `POST /v1/payment_methods` in your Stripe logs because the subscription isn't being properly tracked in your app. Here's what was wrong and how it's now fixed:

## Issues Found & Fixed

### 1. ✅ **Missing Database Columns**
**Problem**: The `profiles` table was missing subscription-related columns.

**Solution**: Added the following columns to your profiles table:
```sql
-- Run this SQL in your Supabase SQL Editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;
```

### 2. ✅ **Checkout Flow Issues**
**Problem**: Your checkout page was using direct Stripe URLs without proper metadata.

**Solution**: Updated the checkout flow to:
- Use your API endpoint (`/api/stripe/create-checkout-session`)
- Create Stripe customers with proper metadata
- Pass user information to the checkout process

### 3. ✅ **Enhanced Webhook Handling**
**Problem**: Webhooks couldn't identify users from direct checkout URLs.

**Solution**: Enhanced the webhook to:
- Handle multiple ways to identify users (metadata, client_reference_id, customer ID, email)
- Automatically determine subscription plans from Stripe product IDs
- Better error handling and logging

### 4. ✅ **Updated TypeScript Types**
**Problem**: Database types didn't include subscription fields.

**Solution**: Updated `types/database.ts` with all subscription-related fields.

## Next Steps to Complete the Fix

### 1. **Run Database Migration** (REQUIRED)
Execute this SQL in your Supabase SQL Editor:

```sql
-- Add subscription-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
```

### 2. **Configure Stripe Webhooks** (REQUIRED)
1. Go to your Stripe Dashboard
2. Navigate to **Developers** → **Webhooks**
3. Add a new webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted` 
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### 3. **Environment Variables Check**
Ensure you have all required Stripe environment variables:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. **Test the Fix**
1. Try purchasing a subscription
2. Check your Stripe logs - you should now see:
   - `POST /v1/payment_methods` (payment method creation)
   - `POST /v1/checkout/sessions` (checkout session creation)
   - `POST /v1/subscriptions` (subscription creation)
3. Check your webhook endpoint logs
4. Verify the subscription data appears in your Supabase profiles table

## How It Works Now

### Checkout Process:
1. User clicks "Subscribe" → Goes to `/checkout?plan=pro&billing=monthly`
2. Checkout page calls `/api/stripe/create-checkout-session`
3. API creates/gets Stripe customer and returns checkout URL with user info
4. User completes payment on Stripe
5. Stripe sends webhook to `/api/stripe/webhook`
6. Webhook identifies user and updates subscription in database

### Webhook Events:
- **`checkout.session.completed`**: Creates subscription record
- **`invoice.payment_succeeded`**: Confirms active subscription
- **`customer.subscription.updated`**: Updates subscription changes
- **`customer.subscription.deleted`**: Handles cancellations

## Troubleshooting

### If Subscriptions Still Don't Update:

1. **Check Webhook Logs**:
   ```bash
   # Check your app logs for webhook events
   # Look for: "🎉 Processing subscription for user..."
   ```

2. **Verify Database Columns**:
   ```sql
   -- Check if columns exist
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name LIKE '%subscription%' OR column_name LIKE '%stripe%';
   ```

3. **Test Webhook Manually**:
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Make a test purchase
   - Check console for webhook events

4. **Check User Identification**:
   ```sql
   -- Check if users have email/customer_id for webhook matching
   SELECT id, email, stripe_customer_id FROM profiles LIMIT 5;
   ```

### Common Issues:

- **"User not found"**: Webhook can't identify user → Check email matching
- **"Plan not found"**: Product ID not in subscription plans → Update `lib/subscription-plans.ts`
- **"Webhook signature failed"**: Wrong webhook secret → Check `STRIPE_WEBHOOK_SECRET`

## Success Indicators

When working correctly, you should see:
- ✅ Subscription data in your profiles table
- ✅ Multiple Stripe API calls in logs (not just payment_methods)
- ✅ Webhook events being processed successfully
- ✅ User subscription status updating in your app

The fix addresses the root cause: your app wasn't properly receiving and processing Stripe's subscription events, so it never knew when subscriptions were created or updated.
