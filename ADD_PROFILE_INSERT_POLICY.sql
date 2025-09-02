-- Add missing INSERT policy for profiles table
-- Run this in your Supabase SQL Editor

-- Add the missing INSERT policy for profiles
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Success message
SELECT 'Profile INSERT policy added successfully!' as message;
