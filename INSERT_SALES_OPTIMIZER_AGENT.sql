-- Insert Sales Optimizer Agent
-- Run this script in your Supabase SQL Editor

-- First, update the agents table to allow the new agent type
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_type_check;
ALTER TABLE agents ADD CONSTRAINT agents_type_check 
CHECK (type IN ('scale_expert', 'sales_analyst', 'hr_agent', 'sales_optimizer'));

-- Insert Sales Optimizer agent if it doesn't exist
INSERT INTO agents (id, user_id, name, type, description, is_active, config)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Sales Optimizer',
    'sales_optimizer',
    'AI-powered advanced sales call analysis with detailed insights, phase-by-phase breakdown, and personalized improvement recommendations',
    true,
    '{
        "version": "2.0",
        "features": [
            "Advanced AI Analysis",
            "Phase-by-Phase Breakdown", 
            "Detailed Scoring System",
            "Personalized Recommendations",
            "Performance Benchmarking",
            "Actionable Insights"
        ],
        "analysis_categories": [
            "Clareza & Fluência",
            "Tom & Controlo", 
            "Envolvimento Conversacional",
            "Descoberta de Necessidades",
            "Entrega de Valor",
            "Lidar com Objeções",
            "Controlo da Reunião",
            "Fechamento"
        ],
        "max_file_size": "100MB",
        "supported_formats": ["mp4", "mov", "avi"],
        "processing_time": "2-5 minutes"
    }'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the agent was created
SELECT id, name, type, is_active, config FROM agents WHERE type = 'sales_optimizer';

-- Update the database schema constraint for other tables that reference agent types
-- This ensures consistency across the database

-- Check if the sales_call_analyses table needs updating for the new agent
-- (It should already work as it uses the same analysis structure)

COMMENT ON TABLE agents IS 'Contains all AI agents available in the system - Scale Expert, Sales Analyst, HR Agent, and Sales Optimizer';
COMMENT ON COLUMN agents.type IS 'Type of agent: scale_expert, sales_analyst, hr_agent, sales_optimizer';
COMMENT ON COLUMN agents.config IS 'JSON configuration for agent-specific settings and capabilities';

