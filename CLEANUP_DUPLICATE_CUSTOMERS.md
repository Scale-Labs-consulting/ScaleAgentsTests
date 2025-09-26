# Clean Up Duplicate Stripe Customers

## The Problem
You have duplicate customers in Stripe for the same user. This happens when multiple webhook events fire and create multiple customers.

## Solution

### 1. **Check Current Duplicates**
Go to your Stripe Dashboard → Customers and look for:
- Multiple customers with the same email: `angelo.revampify@gmail.com`
- Same customer name: "User Skipped"

### 2. **Clean Up in Stripe Dashboard**
1. Go to **Stripe Dashboard** → **Customers**
2. Find the duplicate customers for `angelo.revampify@gmail.com`
3. **Keep the most recent one** (the one with the active subscription)
4. **Delete the older duplicates**:
   - Click on each duplicate customer
   - Scroll to bottom → **Delete customer**
   - Confirm deletion

### 3. **Update Database**
After cleaning up Stripe, update your database to use the correct customer ID:

```sql
-- Find the correct customer ID from Stripe
-- Update the profiles table with the correct stripe_customer_id
UPDATE profiles 
SET stripe_customer_id = 'cus_CORRECT_CUSTOMER_ID_HERE'
WHERE email = 'angelo.revampify@gmail.com';
```

### 4. **Prevention (Already Implemented)**
The webhook handlers now have duplicate prevention:
- ✅ Checks for existing Stripe customer ID before creating new ones
- ✅ Checks for existing active subscriptions before creating new ones
- ✅ Skips processing if duplicates are detected

## What to Do Now

1. **Clean up existing duplicates** in Stripe Dashboard
2. **Update database** with correct customer ID
3. **Test a new payment** - should only create 1 customer now

## Future Payments
With the updated webhook handlers, future payments will:
- ✅ Check for existing customers before creating new ones
- ✅ Only create 1 customer per user
- ✅ Only create 1 subscription per payment
