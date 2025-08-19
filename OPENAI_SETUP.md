# OpenAI Setup for Sales Analyst

## Environment Variables

Add the following to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_KEY=OPENAI_KEY
```

## What's Been Implemented

### 1. **Real AI Analysis**
- ✅ **OpenAI Whisper** for audio transcription
- ✅ **OpenAI GPT-4** for sales call analysis
- ✅ **Predefined prompts** for consistent analysis

### 2. **Analysis Criteria**
The AI analyzes sales calls based on:
1. **Opening and value proposition**
2. **Objection handling techniques**
3. **Closing and follow-up strategies**
4. **Overall communication effectiveness**

### 3. **API Integration**
- ✅ **Server-side processing** via `/api/sales-analyst/analyze`
- ✅ **File upload** to Supabase Storage
- ✅ **Database storage** of analysis results
- ✅ **Real-time status updates**

### 4. **Database Schema**
- ✅ **sales_calls** table for file metadata
- ✅ **sales_call_analyses** table for AI results
- ✅ **Proper indexing** for performance

## How It Works

1. **User uploads MP4 file** → Stored in Supabase Storage
2. **User clicks "Analyze Call"** → Triggers API endpoint
3. **API downloads video** → Converts to audio
4. **OpenAI Whisper transcribes** → Audio to text
5. **OpenAI GPT-4 analyzes** → Text to sales insights
6. **Results stored** → Database and UI updated

## Next Steps

1. **Add your OpenAI key** to `.env.local`
2. **Run the database migrations** in Supabase
3. **Test with a real MP4 file** → Upload and analyze!

## Testing

Once setup is complete:
1. Go to Sales Analyst page
2. Upload an MP4 sales call
3. Click "Analyze Call"
4. Wait for real AI analysis (2-5 minutes)
5. View detailed feedback and scores

The AI will provide:
- **Overall score** (1-10)
- **Detailed feedback** for each criterion
- **Specific improvement areas**
- **Key strengths identified**
