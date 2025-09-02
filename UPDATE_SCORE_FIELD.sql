-- Update the overall_score field to support scores up to 10.0
-- Change from NUMERIC(3,2) to NUMERIC(3,1) to support 10.0
ALTER TABLE hr_candidates 
ALTER COLUMN overall_score TYPE NUMERIC(3,1);

-- Add a comment to document the scoring system
COMMENT ON COLUMN hr_candidates.overall_score IS 'AI evaluation score from 1.0 to 10.0 in 0.5 intervals (1.0, 1.5, 2.0, ..., 9.5, 10.0)';

-- Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'hr_candidates' AND column_name = 'overall_score';
