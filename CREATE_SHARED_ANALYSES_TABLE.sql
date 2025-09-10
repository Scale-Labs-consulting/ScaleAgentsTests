-- Create shared_analyses table for public sharing functionality
CREATE TABLE IF NOT EXISTS shared_analyses (
  id TEXT PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES sales_call_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create analysis_notes table for user notes
CREATE TABLE IF NOT EXISTS analysis_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES sales_call_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(analysis_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_analyses_analysis_id ON shared_analyses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_shared_analyses_user_id ON shared_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_analyses_expires_at ON shared_analyses(expires_at);

CREATE INDEX IF NOT EXISTS idx_analysis_notes_analysis_id ON analysis_notes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_notes_user_id ON analysis_notes(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE shared_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_analyses
CREATE POLICY "Users can create share links for their own analyses" ON shared_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own share links" ON shared_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share links" ON shared_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for analysis_notes
CREATE POLICY "Users can manage their own notes" ON analysis_notes
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for analysis_notes
CREATE TRIGGER update_analysis_notes_updated_at 
  BEFORE UPDATE ON analysis_notes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON shared_analyses TO authenticated;
GRANT ALL ON analysis_notes TO authenticated;
