# Stripe Payment Integration Setup

## Environment Variables Required

Add the following to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Schema Updates

You need to add the following columns to your `profiles` table in Supabase:

```sql
-- Add subscription-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
```

## Stripe Dashboard Setup

1. **Create Products and Prices in Stripe Dashboard:**
   - Go to Products in your Stripe dashboard
   - Create 3 products matching your plans:
     - Plano Base (€29/month)
     - Plano Pro (€79/month) 
     - Plano Enterprise (€199/month)

2. **Get Price IDs:**
   - After creating products, get the price IDs
   - Update the `stripePriceId` field in `lib/subscription-plans.ts`

3. **Set up Webhooks:**
   - Go to Webhooks in Stripe dashboard
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## Features Implemented

### ✅ **Pricing Page** (`/pricing`)
- Beautiful pricing cards with all 3 plans
- Direct integration with your Stripe checkout URLs
- FAQ section
- Responsive design

### ✅ **Subscription Management**
- User profile shows current subscription status
- "Manage Subscription" button opens Stripe Customer Portal
- Real-time subscription status updates
- Plan upgrade/downgrade support

### ✅ **API Endpoints**
- `/api/stripe/checkout` - Create checkout sessions
- `/api/stripe/webhook` - Handle Stripe webhooks
- `/api/stripe/portal` - Customer portal access

### ✅ **Webhook Integration**
- Automatic subscription status updates
- Payment success/failure handling
- Subscription cancellation/reactivation

## Usage

1. **For Users:**
   - Click "Ver Planos" in profile to go to pricing page
   - Select a plan and click "Subscrever"
   - Redirected to Stripe checkout
   - After payment, redirected back to dashboard

2. **For Subscription Management:**
   - Click "Gerir Subscrição" in profile
   - Opens Stripe Customer Portal
   - Can update payment methods, cancel, etc.

## Testing

Use Stripe test mode with these test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Next Steps

1. Add the environment variables
2. Run the database migration
3. Set up products in Stripe dashboard
4. Configure webhooks
5. Test the complete flow
6. Deploy to production with live Stripe keys

The integration is now complete and ready for testing!
