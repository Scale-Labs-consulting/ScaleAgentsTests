-- Supabase Storage Setup for Sales Calls
-- Run these commands in your Supabase SQL Editor

-- 1. Create the sales-calls bucket (if it doesn't exist)
-- Go to Storage in Supabase Dashboard and create bucket named 'sales-calls' as public

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for INSERT (upload) - Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload sales calls" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sales-calls' AND 
  auth.role() = 'authenticated'
);

-- 4. Create policy for SELECT (view) - Allow users to view their own files
CREATE POLICY "Allow users to view their own sales calls" ON storage.objects
FOR SELECT USING (
  bucket_id = 'sales-calls' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create policy for DELETE - Allow users to delete their own files
CREATE POLICY "Allow users to delete their own sales calls" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sales-calls' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Create policy for UPDATE - Allow users to update their own files
CREATE POLICY "Allow users to update their own sales calls" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'sales-calls' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. For real authentication, this policy is not needed
-- (Only use the above policies for authenticated users)

-- 8. Check existing policies
SELECT * FROM storage.policies WHERE bucket_id = 'sales-calls';
