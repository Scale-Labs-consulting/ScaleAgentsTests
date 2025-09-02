-- Fix Agents Table RLS Policies
-- This script ensures the agents table allows proper access for system agents

-- ========================================
-- CHECK CURRENT STATE
-- ========================================

-- Check if agents table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'agents'
AND schemaname = 'public';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
AND schemaname = 'public';

-- ========================================
-- FIX RLS POLICIES FOR AGENTS TABLE
-- ========================================

-- Option 1: Disable RLS for agents table (if it's meant to be public)
-- ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies for agents table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON agents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON agents;

-- Create new policies that allow proper access
-- Allow all authenticated users to read agents
CREATE POLICY "Enable read access for all users" ON agents
    FOR SELECT USING (true);

-- Allow authenticated users to insert agents (for system agents)
CREATE POLICY "Enable insert for authenticated users" ON agents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own agents
CREATE POLICY "Enable update for authenticated users" ON agents
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own agents
CREATE POLICY "Enable delete for authenticated users" ON agents
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- ALTERNATIVE: CREATE AGENT DIRECTLY
-- ========================================

-- If the above policies don't work, we can create the agent directly
-- First, let's check if the agent already exists
SELECT id, name, type, is_active FROM agents WHERE type = 'scale_expert';

-- If no agent exists, create it directly (this bypasses RLS)
INSERT INTO agents (id, user_id, name, type, description, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Scale Expert',
    'scale_expert',
    'AI-powered scaling strategies and business growth optimization',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Verify the agent was created
SELECT id, name, type, is_active FROM agents WHERE type = 'scale_expert';

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if the agent now exists
SELECT 
    id,
    name,
    type,
    is_active,
    created_at
FROM agents 
WHERE type = 'scale_expert';

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'agents'
AND schemaname = 'public';
