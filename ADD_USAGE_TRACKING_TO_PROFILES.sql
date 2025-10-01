-- Add usage tracking fields to profiles table
-- This provides faster access to usage counts without querying usage_tracking table

-- Add usage tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS scale_expert_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_analyst_uploads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scale_expert_messages_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_analyst_uploads_monthly INTEGER DEFAULT 0;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_scale_expert_messages ON profiles(scale_expert_messages);
CREATE INDEX IF NOT EXISTS idx_profiles_sales_analyst_uploads ON profiles(sales_analyst_uploads);
CREATE INDEX IF NOT EXISTS idx_profiles_scale_expert_monthly ON profiles(scale_expert_messages_monthly);
CREATE INDEX IF NOT EXISTS idx_profiles_sales_analyst_monthly ON profiles(sales_analyst_uploads_monthly);

-- Create a function to reset monthly counters
CREATE OR REPLACE FUNCTION reset_monthly_usage_counters()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET 
        scale_expert_messages_monthly = 0,
        sales_analyst_uploads_monthly = 0
    WHERE 
        scale_expert_messages_monthly > 0 
        OR sales_analyst_uploads_monthly > 0;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage_counter(
    p_user_id UUID,
    p_agent_type TEXT,
    p_action_type TEXT
)
RETURNS void AS $$
BEGIN
    IF p_agent_type = 'scale-expert' AND p_action_type = 'message' THEN
        UPDATE profiles 
        SET 
            scale_expert_messages = scale_expert_messages + 1,
            scale_expert_messages_monthly = scale_expert_messages_monthly + 1
        WHERE id = p_user_id;
    ELSIF p_agent_type = 'sales-analyst' AND p_action_type = 'upload' THEN
        UPDATE profiles 
        SET 
            sales_analyst_uploads = sales_analyst_uploads + 1,
            sales_analyst_uploads_monthly = sales_analyst_uploads_monthly + 1
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically increment counters when usage_tracking records are inserted
CREATE OR REPLACE FUNCTION trigger_increment_usage_counters()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM increment_usage_counter(NEW.user_id, NEW.agent_type, NEW.action_type);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS increment_usage_counters_trigger ON usage_tracking;
CREATE TRIGGER increment_usage_counters_trigger
    AFTER INSERT ON usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION trigger_increment_usage_counters();

-- Update existing profiles with current usage counts
UPDATE profiles 
SET 
    scale_expert_messages = COALESCE((
        SELECT COUNT(*) 
        FROM usage_tracking 
        WHERE usage_tracking.user_id = profiles.id 
        AND agent_type = 'scale-expert' 
        AND action_type = 'message'
    ), 0),
    sales_analyst_uploads = COALESCE((
        SELECT COUNT(*) 
        FROM usage_tracking 
        WHERE usage_tracking.user_id = profiles.id 
        AND agent_type = 'sales-analyst' 
        AND action_type = 'upload'
    ), 0),
    scale_expert_messages_monthly = COALESCE((
        SELECT COUNT(*) 
        FROM usage_tracking 
        WHERE usage_tracking.user_id = profiles.id 
        AND agent_type = 'scale-expert' 
        AND action_type = 'message'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    ), 0),
    sales_analyst_uploads_monthly = COALESCE((
        SELECT COUNT(*) 
        FROM usage_tracking 
        WHERE usage_tracking.user_id = profiles.id 
        AND agent_type = 'sales-analyst' 
        AND action_type = 'upload'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    ), 0);

-- Verify the changes
SELECT 
    id,
    email,
    scale_expert_messages,
    sales_analyst_uploads,
    scale_expert_messages_monthly,
    sales_analyst_uploads_monthly
FROM profiles 
LIMIT 5;
