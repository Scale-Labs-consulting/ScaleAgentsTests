-- Migration: Add content hash indexes for duplicate detection
-- This migration adds indexes to improve performance when checking for duplicate content

-- Add index for faster duplicate detection using content hash
CREATE INDEX IF NOT EXISTS idx_sales_call_analyses_content_hash 
ON sales_call_analyses ((analysis_metadata->>'content_hash'));

-- Add composite index for faster user-based duplicate detection
CREATE INDEX IF NOT EXISTS idx_sales_call_analyses_user_content_hash 
ON sales_call_analyses (user_id, (analysis_metadata->>'content_hash'));

-- Add comment explaining the purpose
COMMENT ON INDEX idx_sales_call_analyses_content_hash IS 'Index for fast duplicate content detection across all users';
COMMENT ON INDEX idx_sales_call_analyses_user_content_hash IS 'Index for fast duplicate content detection per user';

-- Verify indexes were created
SELECT 
    indexname, 
    tablename, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'sales_call_analyses' 
AND indexname LIKE '%content_hash%';
