-- HR Talent Database Schema
-- This file contains the SQL commands to set up the database tables for the HR Talent feature

-- Create hr_candidates table
CREATE TABLE IF NOT EXISTS hr_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    position TEXT NOT NULL,
    cv_url TEXT,
    cv_content TEXT,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    score INTEGER,
    analysis JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hr_candidates_user_id ON hr_candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_status ON hr_candidates(status);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_created_at ON hr_candidates(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE hr_candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own candidates" ON hr_candidates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own candidates" ON hr_candidates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" ON hr_candidates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" ON hr_candidates
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_hr_candidates_updated_at 
    BEFORE UPDATE ON hr_candidates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON hr_candidates TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE hr_candidates IS 'Stores candidate information from Google Forms CSV uploads';
COMMENT ON COLUMN hr_candidates.id IS 'Unique identifier for the candidate';
COMMENT ON COLUMN hr_candidates.user_id IS 'Reference to the user who uploaded the candidate';
COMMENT ON COLUMN hr_candidates.name IS 'Full name of the candidate';
COMMENT ON COLUMN hr_candidates.email IS 'Email address of the candidate';
COMMENT ON COLUMN hr_candidates.position IS 'Position the candidate is applying for';
COMMENT ON COLUMN hr_candidates.cv_url IS 'URL to the candidate''s CV file';
COMMENT ON COLUMN hr_candidates.submission_date IS 'Date when the candidate submitted their application';
COMMENT ON COLUMN hr_candidates.status IS 'Current status of the candidate analysis (pending, processing, completed, failed)';
COMMENT ON COLUMN hr_candidates.score IS 'AI-generated score for the candidate (0-100)';
COMMENT ON COLUMN hr_candidates.analysis IS 'JSON object containing the detailed AI analysis';
COMMENT ON COLUMN hr_candidates.analyzed_at IS 'Timestamp when the analysis was completed';
COMMENT ON COLUMN hr_candidates.created_at IS 'Timestamp when the candidate record was created';
COMMENT ON COLUMN hr_candidates.updated_at IS 'Timestamp when the candidate record was last updated';
