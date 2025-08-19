# Vercel Blob Deployment Guide

## 🚀 Overview

This guide explains how to deploy your ScaleAgents application with Vercel Blob for handling large file uploads. Vercel Blob is the perfect solution for bypassing the 4.5MB serverless function limit and handling files up to 500MB.

## 📋 Prerequisites

- Vercel account
- Supabase project configured
- OpenAI API key
- Vercel Blob store (will be created during setup)

## 🔧 Environment Variables

Set these environment variables in your Vercel project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_KEY=your_openai_api_key

# Vercel Blob (will be auto-configured)
BLOB_READ_WRITE_TOKEN=auto-generated
```

## 🚀 Deployment Steps

### 1. Create Vercel Blob Store

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Create a new blob store
vercel blob create sales-calls-store

# This will output your BLOB_READ_WRITE_TOKEN
```

### 2. Deploy to Vercel

```bash
# Deploy your application
vercel --prod
```

### 3. Configure Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables listed above
4. The `BLOB_READ_WRITE_TOKEN` will be automatically added when you create the blob store

## 📁 How Vercel Blob Works

### Upload Flow

```
User selects file
    ↓
Upload to Vercel Blob (bypasses 4.5MB limit)
    ↓
Store file URL in database
    ↓
Download from Blob for processing
    ↓
Process with OpenAI Whisper
    ↓
Analyze with ChatGPT
    ↓
Store results in database
```

### Key Benefits

1. **No Size Limits**: Handles files up to 500MB
2. **Direct Uploads**: Bypasses serverless function limits
3. **Global CDN**: Fast access worldwide
4. **99.999999999% Durability**: S3-backed storage
5. **Automatic Multipart**: Large files handled automatically

## 🔧 Configuration Files

### vercel.json
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/sales-analyst/blob-upload/route.ts": {
      "maxDuration": 300
    },
    "app/api/sales-analyst/blob-transcribe/route.ts": {
      "maxDuration": 300
    }
  }
}
```

## 📊 File Size Support

| File Size | Upload Method | Processing |
|-----------|---------------|------------|
| < 100MB   | Direct upload | Standard |
| 100MB+    | Multipart upload | Automatic |
| 500MB+    | Not supported | N/A |

## 🛠️ API Routes

### 1. Blob Upload Route (`/api/sales-analyst/blob-upload`)
- Handles file upload to Vercel Blob
- Creates database record
- Returns blob URL and sales call ID

### 2. Blob Transcription Route (`/api/sales-analyst/blob-transcribe`)
- Downloads file from Vercel Blob
- Processes with OpenAI Whisper
- Analyzes with ChatGPT
- Stores results in database

## 🛠️ Troubleshooting

### Common Issues

1. **Blob Store Not Found**
   - ✅ Solution: Create blob store with `vercel blob create`
   - Check environment variables are set

2. **Upload Failures**
   - ✅ Solution: Check file size limits (500MB max)
   - Verify blob store permissions

3. **Processing Timeouts**
   - ✅ Solution: Extended timeouts in vercel.json
   - Large files may take longer to process

### Debug Steps

1. **Check Blob Store**
   ```bash
   vercel blob ls
   ```

2. **View Upload Logs**
   ```bash
   vercel logs your-project-name
   ```

3. **Test Blob Access**
   - Check blob URLs are accessible
   - Verify file downloads work

## 📈 Performance Optimization

### Recommendations

1. **Use Multipart Uploads**
   - Automatic for files > 100MB
   - Better reliability and speed

2. **Optimize File Formats**
   - Use compressed video formats
   - Consider audio-only for transcription

3. **Monitor Usage**
   - Check Vercel Blob dashboard
   - Monitor storage and bandwidth

## 🔒 Security Considerations

1. **File Access Control**
   - Files are stored with public access
   - URLs are not easily guessable
   - Consider private access if needed

2. **User Authentication**
   - Supabase auth required
   - User isolation enforced

3. **File Validation**
   - Only video files allowed
   - Server-side validation

## 📊 Pricing

Vercel Blob pricing is based on:
- **Storage**: $0.04/GB/month
- **Bandwidth**: $0.08/GB
- **Operations**: $0.50 per 1M operations

### Cost Estimation

For 100 sales calls/month:
- Average file size: 50MB
- Storage: ~5GB = $0.20/month
- Bandwidth: ~5GB = $0.40/month
- Operations: ~200 = $0.0001/month

**Total: ~$0.60/month**

## 🚀 Next Steps

1. **Deploy to Production**
   ```bash
   vercel --prod
   ```

2. **Test with Large Files**
   - Upload files > 10MB
   - Verify processing works

3. **Monitor Performance**
   - Check Vercel Blob dashboard
   - Monitor function logs

4. **Optimize as Needed**
   - Adjust file size limits
   - Fine-tune processing

## 📞 Support

If you encounter issues:

1. Check Vercel Blob documentation: https://vercel.com/docs/vercel-blob
2. Verify environment variables
3. Test with smaller files first
4. Check Vercel function logs

---

**Note**: Vercel Blob is the recommended solution for handling large file uploads on Vercel. It completely bypasses the 4.5MB serverless function limit and provides enterprise-grade storage with global CDN.
