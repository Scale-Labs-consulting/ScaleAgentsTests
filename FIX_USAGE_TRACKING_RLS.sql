-- Fix RLS policies for usage_tracking table to allow service role inserts

-- Drop existing policies
DROP POLICY IF EXISTS "System can insert usage data" ON usage_tracking;
DROP POLICY IF EXISTS "Users can view own usage data" ON usage_tracking;
DROP POLICY IF EXISTS "Users cannot modify usage data" ON usage_tracking;
DROP POLICY IF EXISTS "Users cannot delete usage data" ON usage_tracking;

-- Create new policies that work with service role
-- Policy: Allow service role to insert usage data
CREATE POLICY "Service role can insert usage data" ON usage_tracking
    FOR INSERT WITH CHECK (true);

-- Policy: Users can only see their own usage data
CREATE POLICY "Users can view own usage data" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can update usage data (for admin purposes)
CREATE POLICY "Service role can update usage data" ON usage_tracking
    FOR UPDATE USING (true);

-- Policy: Service role can delete usage data (for admin purposes)
CREATE POLICY "Service role can delete usage data" ON usage_tracking
    FOR DELETE USING (true);

-- Policy: Users cannot modify their usage data directly
CREATE POLICY "Users cannot modify usage data" ON usage_tracking
    FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete usage data" ON usage_tracking
    FOR DELETE USING (false);
