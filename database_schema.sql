-- ScaleAgents SaaS Database Schema
-- Supabase PostgreSQL Database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CORE TABLES
-- ========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- AGENTS TABLES
-- ========================================

-- Agents table
CREATE TABLE agents (
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

-- ========================================
-- SCALE EXPERT (Custom GPT) TABLES
-- ========================================

-- Conversations for Scale Expert
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages in conversations
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SALES ANALYST TABLES
-- ========================================

-- Sales calls
CREATE TABLE sales_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
    analysis JSONB DEFAULT '{}',
    feedback TEXT,
    score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales call feedback prompts
CREATE TABLE sales_feedback_prompts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales call feedback results
CREATE TABLE sales_call_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_call_id UUID REFERENCES sales_calls(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES sales_feedback_prompts(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales call analyses (for OpenAI integration)
CREATE TABLE sales_call_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_call_id UUID REFERENCES sales_calls(id) ON DELETE CASCADE NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    call_type TEXT,
    feedback TEXT NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    analysis JSONB NOT NULL,
    analysis_metadata JSONB DEFAULT '{}',
    transcription TEXT,
    custom_prompts TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster duplicate detection using content hash
CREATE INDEX idx_sales_call_analyses_content_hash 
ON sales_call_analyses ((analysis_metadata->>'content_hash'));

-- Index for faster user-based queries
CREATE INDEX idx_sales_call_analyses_user_content_hash 
ON sales_call_analyses (user_id, (analysis_metadata->>'content_hash'));

-- ========================================
-- HR AGENT TABLES
-- ========================================

-- HR candidates
CREATE TABLE hr_candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT NOT NULL,
    cv_file_url TEXT,
    cv_file_size BIGINT,
    form_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'evaluated', 'rejected', 'accepted')),
    overall_score DECIMAL(3,2),
    evaluation JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HR evaluation criteria
CREATE TABLE hr_evaluation_criteria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HR candidate evaluations
CREATE TABLE hr_candidate_evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES hr_candidates(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES hr_evaluation_criteria(id) ON DELETE CASCADE,
    score DECIMAL(3,2) NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- BILLING & USAGE TABLES
-- ========================================

-- Usage tracking
CREATE TABLE usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits system
CREATE TABLE credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    credits_remaining INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    reset_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);

-- Agents indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_active ON agents(is_active);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Sales calls indexes
CREATE INDEX idx_sales_calls_user_id ON sales_calls(user_id);
CREATE INDEX idx_sales_calls_agent_id ON sales_calls(agent_id);
CREATE INDEX idx_sales_calls_status ON sales_calls(status);

-- Sales feedback prompts indexes
CREATE INDEX idx_sales_feedback_prompts_user_id ON sales_feedback_prompts(user_id);

-- Sales call analyses indexes
CREATE INDEX idx_sales_call_analyses_sales_call_id ON sales_call_analyses(sales_call_id);
CREATE INDEX idx_sales_call_analyses_user_id ON sales_call_analyses(user_id);

-- HR candidates indexes
CREATE INDEX idx_hr_candidates_user_id ON hr_candidates(user_id);
CREATE INDEX idx_hr_candidates_agent_id ON hr_candidates(agent_id);
CREATE INDEX idx_hr_candidates_status ON hr_candidates(status);

-- HR evaluation criteria indexes
CREATE INDEX idx_hr_evaluation_criteria_user_id ON hr_evaluation_criteria(user_id);

-- Usage logs indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- Credits indexes
CREATE INDEX idx_credits_user_id ON credits(user_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_feedback_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_call_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_candidate_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Agents policies
CREATE POLICY "Users can view own agents" ON agents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own agents" ON agents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own agents" ON agents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own agents" ON agents
    FOR DELETE USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in own conversations" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Sales calls policies
CREATE POLICY "Users can view own sales calls" ON sales_calls
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sales calls" ON sales_calls
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sales calls" ON sales_calls
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sales calls" ON sales_calls
    FOR DELETE USING (user_id = auth.uid());

-- Sales feedback prompts policies
CREATE POLICY "Users can view own sales feedback prompts" ON sales_feedback_prompts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sales feedback prompts" ON sales_feedback_prompts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sales feedback prompts" ON sales_feedback_prompts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sales feedback prompts" ON sales_feedback_prompts
    FOR DELETE USING (user_id = auth.uid());

-- Sales call feedback policies
CREATE POLICY "Users can view own sales call feedback" ON sales_call_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_calls sc
            WHERE sc.id = sales_call_feedback.sales_call_id
            AND sc.user_id = auth.uid()
        )
    );

-- HR candidates policies
CREATE POLICY "Users can view own HR candidates" ON hr_candidates
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own HR candidates" ON hr_candidates
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own HR candidates" ON hr_candidates
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own HR candidates" ON hr_candidates
    FOR DELETE USING (user_id = auth.uid());

-- HR evaluation criteria policies
CREATE POLICY "Users can view own HR evaluation criteria" ON hr_evaluation_criteria
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own HR evaluation criteria" ON hr_evaluation_criteria
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own HR evaluation criteria" ON hr_evaluation_criteria
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own HR evaluation criteria" ON hr_evaluation_criteria
    FOR DELETE USING (user_id = auth.uid());

-- HR candidate evaluations policies
CREATE POLICY "Users can view own HR candidate evaluations" ON hr_candidate_evaluations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM hr_candidates hc
            WHERE hc.id = hr_candidate_evaluations.candidate_id
            AND hc.user_id = auth.uid()
        )
    );

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
    FOR SELECT USING (user_id = auth.uid());

-- Credits policies
CREATE POLICY "Users can view own credits" ON credits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own credits" ON credits
    FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_calls_updated_at BEFORE UPDATE ON sales_calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_feedback_prompts_updated_at BEFORE UPDATE ON sales_feedback_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_candidates_updated_at BEFORE UPDATE ON hr_candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_evaluation_criteria_updated_at BEFORE UPDATE ON hr_evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert sample agents (you can remove this in production)
INSERT INTO agents (user_id, name, type, description) VALUES
    (NULL, 'Scale Expert', 'scale_expert', 'AI-powered scaling strategies and business growth optimization'),
    (NULL, 'Sales Analyst', 'sales_analyst', 'Advanced sales analytics and revenue optimization insights'),
    (NULL, 'HR Agent', 'hr_agent', 'Intelligent talent acquisition and human resources management');

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE agents IS 'AI agents available to users';
COMMENT ON TABLE conversations IS 'Chat conversations for Scale Expert agent';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE sales_calls IS 'Sales call recordings and analysis';
COMMENT ON TABLE sales_feedback_prompts IS 'Custom prompts for sales call analysis';
COMMENT ON TABLE sales_call_feedback IS 'Feedback results for sales calls';
COMMENT ON TABLE hr_candidates IS 'HR candidates for evaluation';
COMMENT ON TABLE hr_evaluation_criteria IS 'Custom evaluation criteria for HR candidates';
COMMENT ON TABLE hr_candidate_evaluations IS 'Individual evaluation scores for candidates';
COMMENT ON TABLE usage_logs IS 'Usage tracking for billing and analytics';
COMMENT ON TABLE credits IS 'Credit system for usage limits';
