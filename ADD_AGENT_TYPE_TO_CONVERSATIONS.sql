-- Add agent_type field to conversations table for usage tracking
-- This allows us to distinguish between Scale Expert and other agent conversations

ALTER TABLE conversations 
ADD COLUMN agent_type TEXT DEFAULT 'scale-expert' 
CHECK (agent_type IN ('scale-expert', 'sales-analyst', 'hr-agent'));

-- Create index for faster queries on agent_type
CREATE INDEX idx_conversations_agent_type ON conversations(agent_type);

-- Create index for faster usage tracking queries
CREATE INDEX idx_conversations_user_agent_created 
ON conversations(user_id, agent_type, created_at);

-- Update existing conversations to have the correct agent_type
-- (assuming all existing conversations are Scale Expert)
UPDATE conversations 
SET agent_type = 'scale-expert' 
WHERE agent_type IS NULL;
