-- Add call_type column to sales_calls table
-- This migration adds support for categorizing sales calls by type

-- Add call_type column to sales_calls table
ALTER TABLE sales_calls 
ADD COLUMN IF NOT EXISTS call_type TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN sales_calls.call_type IS 'Type of sales call (e.g., Chamada Fria, Reunião de Descoberta, etc.)';

-- Create index on call_type for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_calls_call_type ON sales_calls(call_type);

-- Update existing records with default call type if needed
-- (Optional - only run if you want to set a default for existing records)
-- UPDATE sales_calls 
-- SET call_type = 'Chamada Fria' 
-- WHERE call_type IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_calls' 
AND column_name = 'call_type';
