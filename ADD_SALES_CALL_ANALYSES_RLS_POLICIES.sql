-- Add missing RLS policies for sales_call_analyses table
-- This ensures users can only access their own analysis records

-- Enable RLS on sales_call_analyses table (if not already enabled)
ALTER TABLE sales_call_analyses ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own sales call analyses
CREATE POLICY "Users can view own sales call analyses" ON sales_call_analyses
    FOR SELECT USING (user_id = auth.uid());

-- Policy for users to insert their own sales call analyses
CREATE POLICY "Users can insert own sales call analyses" ON sales_call_analyses
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own sales call analyses
CREATE POLICY "Users can update own sales call analyses" ON sales_call_analyses
    FOR UPDATE USING (user_id = auth.uid());

-- Policy for users to delete their own sales call analyses
CREATE POLICY "Users can delete own sales call analyses" ON sales_call_analyses
    FOR DELETE USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE sales_call_analyses IS 'Sales call analysis results with comprehensive scoring and feedback';
