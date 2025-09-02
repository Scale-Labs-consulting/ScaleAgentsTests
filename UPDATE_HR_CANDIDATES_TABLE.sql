-- Update hr_candidates table with new extracted personal information columns
-- Run this in your Supabase SQL editor to add the missing columns

-- Add personal information JSONB column
ALTER TABLE hr_candidates 
ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}';

-- Add specific extracted information columns
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_location ON hr_candidates(extracted_location);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_experience_years ON hr_candidates(extracted_experience_years);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_languages ON hr_candidates USING GIN(extracted_languages);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_extracted_skills ON hr_candidates USING GIN(extracted_skills);

-- Add comments for documentation
COMMENT ON COLUMN hr_candidates.personal_info IS 'Structured personal information extracted from CV using AI';
COMMENT ON COLUMN hr_candidates.extracted_name IS 'Full name extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_email IS 'Email address extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_phone IS 'Phone number extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_location IS 'Location/city extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_linkedin IS 'LinkedIn profile URL extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_github IS 'GitHub profile URL extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_website IS 'Personal website URL extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_date_of_birth IS 'Date of birth extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_nationality IS 'Nationality extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_languages IS 'Languages spoken extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_skills IS 'Skills extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_experience_years IS 'Years of experience extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_education IS 'Education history extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_certifications IS 'Certifications extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_availability IS 'Availability extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_salary_expectation IS 'Salary expectation extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_work_permit IS 'Work permit status extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_remote_preference IS 'Remote work preference extracted from CV';
COMMENT ON COLUMN hr_candidates.extracted_notice_period IS 'Notice period extracted from CV';

-- Verify the migration by showing all columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'hr_candidates' 
ORDER BY ordinal_position;

-- Show only the new extracted columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'hr_candidates' 
AND column_name LIKE 'extracted_%'
ORDER BY column_name;
