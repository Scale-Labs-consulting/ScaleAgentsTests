# HR Talent Agent Setup Guide

## Overview
The HR Talent agent allows you to analyze candidate CVs from Google Forms CSV uploads using AI. It provides automated scoring, strengths/weaknesses analysis, and interview questions generation.

## Features
- **CSV Upload**: Import candidate data from Google Forms
- **AI Analysis**: Automated CV analysis with scoring (0-100)
- **Candidate Management**: View, search, and filter candidates
- **Detailed Reports**: Comprehensive analysis with strengths, weaknesses, and interview questions

## Database Setup

### 1. Run the Database Schema
Execute the SQL commands in `HR_TALENT_DATABASE_SETUP.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the contents of HR_TALENT_DATABASE_SETUP.sql
```

### 2. Verify Table Creation
Check that the `hr_candidates` table was created successfully in your Supabase dashboard.

## Google Forms Setup

### 1. Create Google Form
Create a Google Form with the following fields:
- **Nome completo** (Full Name) - Text
- **Email** - Email
- **Posição** (Position) - Text
- **CV** (Resume) - File upload
- **Timestamp** - Automatic (Google Forms adds this)

### 2. Export CSV
- Go to your Google Form responses
- Click the three dots menu
- Select "Download responses (.csv)"
- The CSV will contain all form submissions

## File Structure

```
app/
├── hr-talent/
│   ├── page.tsx                    # Main HR Talent page
│   └── candidates/
│       └── page.tsx                # Candidates list page
└── api/hr-talent/
    ├── upload-csv/
    │   └── route.ts                # CSV upload handler
    ├── candidates/
    │   └── route.ts                # Fetch candidates
    └── analyze-candidate/
        └── route.ts                # AI analysis handler
```

## API Endpoints

### 1. Upload CSV
- **POST** `/api/hr-talent/upload-csv`
- Uploads CSV file and extracts candidate data
- Stores candidates in database

### 2. Fetch Candidates
- **GET** `/api/hr-talent/candidates`
- Retrieves all candidates for the authenticated user
- Supports filtering and search

### 3. Analyze Candidate
- **POST** `/api/hr-talent/analyze-candidate`
- Performs AI analysis on candidate CV
- Returns scoring and detailed analysis

## Usage Workflow

### 1. Upload CSV
1. Navigate to `/hr-talent`
2. Click "Escolher Ficheiro" and select your Google Forms CSV
3. The system will extract candidate data and display them

### 2. Analyze Candidates
1. View the list of extracted candidates
2. Click "Analisar" for each candidate
3. AI will analyze the CV and provide scoring

### 3. View Results
1. Click "Ver Análise" to see detailed results
2. Review scoring, strengths, weaknesses, and interview questions
3. Use the candidates list page for bulk management

## Analysis Output

The AI analysis provides:
- **Score (0-100)**: Overall candidate suitability
- **Strengths**: Key positive attributes
- **Weaknesses**: Areas for improvement
- **Fit Assessment**: Position suitability
- **Recommendation**: Interview recommendation
- **Interview Questions**: Specific questions based on CV

## Environment Variables

Ensure these are set in your `.env.local`:
```
OPENAI_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Dependencies

The feature requires these packages:
```json
{
  "csv-parse": "^6.1.0",
  "openai": "^4.0.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

## Security

- Row Level Security (RLS) enabled on `hr_candidates` table
- Users can only access their own candidates
- Authentication required for all operations
- File upload validation and sanitization

## Troubleshooting

### Common Issues

1. **CSV Upload Fails**
   - Check file format (must be .csv)
   - Verify Google Forms field names match expected format
   - Ensure file size is reasonable

2. **Analysis Fails**
   - Check OpenAI API key is valid
   - Verify CV URL is accessible
   - Check network connectivity

3. **Database Errors**
   - Run the database schema setup
   - Verify RLS policies are correct
   - Check user authentication

### Debug Steps

1. Check browser console for errors
2. Verify API endpoints are responding
3. Check Supabase logs for database issues
4. Validate environment variables

## Customization

### Field Mapping
Update the field mapping in `app/api/hr-talent/upload-csv/route.ts`:

```typescript
const candidate: Candidate = {
  name: record['Nome completo'] || record['Name'] || 'N/A',
  email: record['Email'] || record['E-mail'] || 'N/A',
  position: record['Posição'] || record['Position'] || 'N/A',
  cvUrl: record['CV'] || record['Currículo'] || '',
  // ... other fields
}
```

### Analysis Prompt
Customize the AI analysis prompt in `app/api/hr-talent/analyze-candidate/route.ts` to match your specific requirements.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Verify all setup steps are completed
4. Test with a simple CSV file first
