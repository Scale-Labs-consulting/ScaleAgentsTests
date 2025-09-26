-- Clean up duplicate subscriptions
-- This script will help clean up the duplicate subscriptions created

-- First, let's see what we have
SELECT 
  id, 
  email, 
  stripe_customer_id, 
  stripe_subscription_id, 
  subscription_status, 
  subscription_plan,
  created_at
FROM profiles 
WHERE stripe_subscription_id IS NOT NULL
ORDER BY created_at DESC;

-- Update all profiles to have only one active subscription
-- Keep the most recent subscription for each user
WITH latest_subscriptions AS (
  SELECT 
    id,
    stripe_subscription_id,
    ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
  FROM profiles 
  WHERE stripe_subscription_id IS NOT NULL
)
UPDATE profiles 
SET 
  stripe_subscription_id = NULL,
  subscription_status = NULL,
  subscription_plan = NULL,
  subscription_current_period_end = NULL
WHERE id IN (
  SELECT id 
  FROM latest_subscriptions 
  WHERE rn > 1
);

-- Add a unique constraint to prevent future duplicates
-- This will prevent multiple active subscriptions for the same user
ALTER TABLE profiles 
ADD CONSTRAINT unique_active_subscription 
UNIQUE (id, subscription_status) 
WHERE subscription_status = 'active';

-- Alternative: Add a unique constraint on stripe_subscription_id
-- ALTER TABLE profiles 
-- ADD CONSTRAINT unique_stripe_subscription_id 
-- UNIQUE (stripe_subscription_id);
