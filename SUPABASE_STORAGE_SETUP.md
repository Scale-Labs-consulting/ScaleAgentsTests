# Supabase Storage Setup for Sales Calls

## Create Storage Bucket

You need to create a storage bucket in your Supabase project to store the uploaded MP4 files.

### Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to "Storage" in the left sidebar

2. **Create a new bucket**
   - Click "Create a new bucket"
   - **Bucket name**: `sales-calls`
   - **Public bucket**: ✅ Check this (so files can be accessed)
   - Click "Create bucket"

3. **Set up RLS (Row Level Security)**
   - Go to "Storage" → "Policies"
   - Click on the `sales-calls` bucket
   - Add the following policies:

### Storage Policies

**Policy 1: Allow authenticated users to upload files**
```sql
CREATE POLICY "Allow authenticated users to upload sales calls" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sales-calls' AND 
  auth.role() = 'authenticated'
);
```

**Policy 2: Allow users to view their own files**
```sql
CREATE POLICY "Allow users to view their own sales calls" ON storage.objects
FOR SELECT USING (
  bucket_id = 'sales-calls' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Allow users to delete their own files**
```sql
CREATE POLICY "Allow users to delete their own sales calls" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sales-calls' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## File Structure

Files will be stored with this structure:
```
sales-calls/
├── user-id-1/
│   ├── timestamp-filename1.mp4
│   └── timestamp-filename2.mp4
└── user-id-2/
    └── timestamp-filename3.mp4
```

## Testing

After setting up the storage bucket:

1. **Upload a test file** through the Sales Analyst page
2. **Check Supabase Storage** to see the file was uploaded
3. **Check the database** to see the record was created
4. **Try analyzing** the uploaded file

## Troubleshooting

If uploads fail:
- Check that the `sales-calls` bucket exists
- Verify RLS policies are set correctly
- Check browser console for error messages
- Ensure your Supabase environment variables are correct
