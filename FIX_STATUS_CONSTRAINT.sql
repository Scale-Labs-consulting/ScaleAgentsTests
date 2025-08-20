-- Check the current status constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'hr_candidates'::regclass 
AND contype = 'c';

-- Check what status values are currently allowed
SELECT DISTINCT status FROM hr_candidates;

-- Drop the existing constraint if it exists
ALTER TABLE hr_candidates DROP CONSTRAINT IF EXISTS hr_candidates_status_check;

-- Add the correct constraint with all needed status values
ALTER TABLE hr_candidates ADD CONSTRAINT hr_candidates_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'hr_candidates'::regclass 
AND contype = 'c';
