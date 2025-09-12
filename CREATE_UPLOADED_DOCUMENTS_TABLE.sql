-- Create uploaded_documents table for Scale Expert document analysis
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  extracted_text TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_file_type ON uploaded_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_created_at ON uploaded_documents(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to only access their own documents
CREATE POLICY "Users can only access their own documents" ON uploaded_documents
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policy for service role to access all documents
CREATE POLICY "Service role can access all documents" ON uploaded_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_uploaded_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_uploaded_documents_updated_at
  BEFORE UPDATE ON uploaded_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_uploaded_documents_updated_at();

-- Add comments for documentation
COMMENT ON TABLE uploaded_documents IS 'Stores uploaded documents for Scale Expert analysis including PDFs, Word docs, Excel files, etc.';
COMMENT ON COLUMN uploaded_documents.user_id IS 'Reference to the user who uploaded the document';
COMMENT ON COLUMN uploaded_documents.file_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN uploaded_documents.file_url IS 'URL to the document stored in Vercel Blob';
COMMENT ON COLUMN uploaded_documents.file_type IS 'File extension/type (pdf, docx, xlsx, etc.)';
COMMENT ON COLUMN uploaded_documents.extracted_text IS 'Text content extracted from the document for analysis';
COMMENT ON COLUMN uploaded_documents.file_size IS 'Size of the file in bytes';
