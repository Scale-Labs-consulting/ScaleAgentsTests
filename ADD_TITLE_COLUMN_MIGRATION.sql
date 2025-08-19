-- Migration: Add title column to sales_call_analyses table
-- This migration adds the missing title column that is being used in the application

-- Add the title column to sales_call_analyses table
ALTER TABLE sales_call_analyses 
ADD COLUMN title TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN sales_call_analyses.title IS 'Title of the sales call analysis, typically derived from the original file name';

-- Create an index on the title column for better query performance
CREATE INDEX idx_sales_call_analyses_title ON sales_call_analyses(title);

-- Update existing records to have a default title if they don't have one
UPDATE sales_call_analyses 
SET title = 'Sales Call Analysis ' || id::text 
WHERE title IS NULL;

-- Make sure the column is not null for future records (optional)
-- ALTER TABLE sales_call_analyses ALTER COLUMN title SET NOT NULL;
