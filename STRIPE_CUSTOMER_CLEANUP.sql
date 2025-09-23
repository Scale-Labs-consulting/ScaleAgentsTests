-- Clean up invalid Stripe customer IDs after manual deletion
-- Run this query to see which profiles have customer IDs that might be invalid

-- First, check which profiles have Stripe customer IDs
SELECT 
    id, 
    email, 
    first_name, 
    last_name,
    stripe_customer_id,
    created_at
FROM profiles 
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC;

-- If you want to clear ALL customer IDs and let them be recreated automatically:
-- (ONLY run this if you're sure you want to reset all customer relationships)

-- UPDATE profiles 
-- SET stripe_customer_id = NULL 
-- WHERE stripe_customer_id IS NOT NULL;

-- Alternative: Clear only specific invalid customer IDs if you know them:
-- UPDATE profiles 
-- SET stripe_customer_id = NULL 
-- WHERE stripe_customer_id IN ('cus_T4d5tjaJPkE2tF', 'cus_AnotherInvalidId');

