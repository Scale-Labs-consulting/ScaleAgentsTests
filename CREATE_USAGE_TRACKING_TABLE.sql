-- Create a dedicated usage tracking table for more accurate usage monitoring
-- This provides better tracking than counting conversations/sales_calls

CREATE TABLE usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('scale-expert', 'sales-analyst')),
    action_type TEXT NOT NULL CHECK (action_type IN ('message', 'upload', 'analysis')),
    reference_id UUID, -- References the specific conversation, sales_call, or analysis
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_usage_tracking_user_agent ON usage_tracking(user_id, agent_type);
CREATE INDEX idx_usage_tracking_user_created ON usage_tracking(user_id, created_at);
CREATE INDEX idx_usage_tracking_agent_created ON usage_tracking(agent_type, created_at);

-- Create a composite index for monthly usage queries
CREATE INDEX idx_usage_tracking_monthly_usage 
ON usage_tracking(user_id, agent_type, action_type, created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage data
CREATE POLICY "Users can view own usage data" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert usage data (for API routes)
CREATE POLICY "System can insert usage data" ON usage_tracking
    FOR INSERT WITH CHECK (true);

-- Policy: Users cannot modify their usage data
CREATE POLICY "Users cannot modify usage data" ON usage_tracking
    FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete usage data" ON usage_tracking
    FOR DELETE USING (false);
