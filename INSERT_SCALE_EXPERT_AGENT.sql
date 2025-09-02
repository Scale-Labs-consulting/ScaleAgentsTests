-- Insert Scale Expert Agent
-- Run this script in your Supabase SQL Editor

-- First, let's check if the agents table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'agents'
) as agents_table_exists;

-- Insert Scale Expert agent if it doesn't exist
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

-- If you need to create the agents table first, uncomment the following:
/*
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('scale_expert', 'sales_analyst', 'hr_agent')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/
