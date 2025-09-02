# Deployment Guide - Direct AssemblyAI Upload

## 🚀 Overview

This guide explains how to deploy your ScaleAgents application to Vercel using the direct AssemblyAI upload method, which bypasses Vercel's 4.5MB limit by uploading files directly to AssemblyAI.

## 📋 Prerequisites

- Vercel account
- Supabase project configured
- OpenAI API key
- AssemblyAI API key

## 🔧 Environment Variables

Set these environment variables in your Vercel project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_KEY=your_openai_api_key

# AssemblyAI Configuration
ASSEMBLY_AI_API_KEY=your_assemblyai_api_key
```

## 🚀 Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Configure Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables listed above

### 3. Verify Deployment

After deployment, test with:
- Small files (< 4MB) - should work fine
- Large files (> 4MB) - should also work with direct AssemblyAI upload

## 📁 How It Works

### Upload Flow

```
User selects file
    ↓
Get AssemblyAI upload URL
    ↓
Upload directly to AssemblyAI
    ↓
Start transcription
    ↓
Poll for completion
    ↓
Return transcription
```

### Key Benefits

1. **No Vercel Limits**: Files go directly to AssemblyAI
2. **No FFmpeg Required**: AssemblyAI handles all processing
3. **Reliable**: Works with files of any size
4. **Fast**: Direct upload to AssemblyAI

## 🔧 Configuration Files

### vercel.json
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/sales-analyst/assembly-transcribe/route.ts": {
      "maxDuration": 300
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **AssemblyAI Key Not Found**
   - ✅ Solution: Set `ASSEMBLY_AI_API_KEY` in Vercel environment variables

2. **Function Timeout**
   - ✅ Solution: Extended timeout to 300 seconds in vercel.json

3. **Upload Failures**
   - Check AssemblyAI API key is valid
   - Verify file format is supported (MP4, etc.)

### Debug Steps

1. **Check Vercel Logs**
   ```bash
   vercel logs your-project-name
   ```

2. **Test AssemblyAI Connection**
   - Verify API key works in AssemblyAI dashboard
   - Check account has sufficient credits

## 📊 Performance

### Expected Results

- **Small files**: 30-60 seconds total processing
- **Large files**: 2-5 minutes total processing
- **No size limits**: Works with files up to 1GB+

## 🚀 Next Steps

1. **Deploy to Production**
   ```bash
   vercel --prod
   ```

2. **Test with Various File Sizes**
   - Test with 1MB, 10MB, 50MB files
   - Verify transcription quality

3. **Monitor Performance**
   - Check Vercel function logs
   - Monitor AssemblyAI usage

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables
3. Test AssemblyAI API key separately
4. Check AssemblyAI account status

---

**Note**: This method is the most reliable for Vercel deployment as it completely bypasses Vercel's file size limitations by using AssemblyAI's direct upload service.
