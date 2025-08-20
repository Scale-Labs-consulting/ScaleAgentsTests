-- Fix HR Candidates table schema
-- Add missing columns and fix column names

-- First, let's check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hr_candidates' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add agent_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN agent_id UUID;
    END IF;

    -- Add cv_file_url column if it doesn't exist (rename from cv_url if needed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'cv_file_url'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'hr_candidates' AND column_name = 'cv_url'
        ) THEN
            -- Rename cv_url to cv_file_url
            ALTER TABLE hr_candidates RENAME COLUMN cv_url TO cv_file_url;
        ELSE
            -- Add cv_file_url column
            ALTER TABLE hr_candidates ADD COLUMN cv_file_url TEXT;
        END IF;
    END IF;

    -- Add analysis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'analysis'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN analysis JSONB;
    END IF;

    -- Add score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'score'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN score INTEGER;
    END IF;

    -- Add analyzed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'analyzed_at'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN analyzed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add cv_content column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'cv_content'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN cv_content TEXT;
    END IF;

    -- Add form_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_candidates' AND column_name = 'form_data'
    ) THEN
        ALTER TABLE hr_candidates ADD COLUMN form_data JSONB;
    END IF;

END $$;

-- Show the final schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hr_candidates' 
ORDER BY ordinal_position;
