-- Add onboarding_completed field to profiles table
-- This provides a clear, dedicated field to track onboarding completion status
-- Run this in your Supabase SQL Editor

-- Add the onboarding_completed field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles that have all required fields to mark them as completed
UPDATE profiles 
SET onboarding_completed = TRUE 
WHERE first_name IS NOT NULL 
  AND last_name IS NOT NULL 
  AND company_name IS NOT NULL 
  AND business_product_service IS NOT NULL 
  AND ideal_customer IS NOT NULL 
  AND problem_solved IS NOT NULL 
  AND business_model IS NOT NULL
  AND NOT (first_name = 'User' AND last_name = 'Skipped' AND business_product_service = 'Skipped onboarding');

-- Mark skipped profiles as completed (they won't see onboarding again)
UPDATE profiles 
SET onboarding_completed = TRUE 
WHERE first_name = 'User' 
  AND last_name = 'Skipped' 
  AND business_product_service = 'Skipped onboarding';

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Success message
SELECT 'Onboarding completed field added successfully!' as message;
