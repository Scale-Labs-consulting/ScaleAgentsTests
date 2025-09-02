-- Run this migration to add personal information columns to hr_candidates table
-- Execute this in your Supabase SQL editor

-- Add personal information columns to hr_candidates table
ALTER TABLE hr_candidates 
ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}';

-- Add specific columns for commonly extracted information
ALTER TABLE hr_candidates 
ADD COLUMN IF NOT EXISTS extracted_name TEXT,
ADD COLUMN IF NOT EXISTS extracted_email TEXT,
ADD COLUMN IF NOT EXISTS extracted_phone TEXT,
ADD COLUMN IF NOT EXISTS extracted_location TEXT,
ADD COLUMN IF NOT EXISTS extracted_linkedin TEXT,
ADD COLUMN IF NOT EXISTS extracted_github TEXT,
ADD COLUMN IF NOT EXISTS extracted_website TEXT,
ADD COLUMN IF NOT EXISTS extracted_date_of_birth DATE,
ADD COLUMN IF NOT EXISTS extracted_nationality TEXT,
ADD COLUMN IF NOT EXISTS extracted_languages TEXT[],
ADD COLUMN IF NOT EXISTS extracted_skills TEXT[],
ADD COLUMN IF NOT EXISTS extracted_experience_years INTEGER,
ADD COLUMN IF NOT EXISTS extracted_education TEXT[],
ADD COLUMN IF NOT EXISTS extracted_certifications TEXT[],
ADD COLUMN IF NOT EXISTS extracted_availability TEXT,
ADD COLUMN IF NOT EXISTS extracted_salary_expectation TEXT,
ADD COLUMN IF NOT EXISTS extracted_work_permit TEXT,
ADD COLUMN IF NOT EXISTS extracted_remote_preference TEXT,
ADD COLUMN IF NOT EXISTS extracted_notice_period TEXT;

-- Add indexes for commonly queried extracted fields
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_location ON hr_candidates(extracted_location);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_experience_years ON hr_candidates(extracted_experience_years);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_languages ON hr_candidates USING GIN(extracted_languages);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_skills ON hr_candidates USING GIN(extracted_skills);

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hr_candidates' 
AND column_name LIKE 'extracted_%'
ORDER BY column_name;
