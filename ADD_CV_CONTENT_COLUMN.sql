-- Migration: Add cv_content column to hr_candidates table
-- Run this in your Supabase SQL editor if the table already exists

-- Add cv_content column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' 
        AND column_name = 'cv_content'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN cv_content TEXT;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN hr_candidates.cv_content IS 'Extracted text content from the CV file for AI analysis';
