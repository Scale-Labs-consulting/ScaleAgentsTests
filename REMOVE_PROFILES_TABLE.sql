-- Remove profiles table and related components
-- Run this in your Supabase SQL Editor

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the profiles table (this will also drop all policies)
DROP TABLE IF EXISTS profiles CASCADE;

-- Success message
SELECT 'Profiles table and related components removed successfully! Now using auth.user_metadata for user information.' as message;
