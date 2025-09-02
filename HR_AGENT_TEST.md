# HR Agent Test Guide

## Overview
The HR Agent is now fully implemented with the following features:
- Candidate management (add, view, delete)
- CV upload and processing
- AI-powered CV analysis and information extraction
- Detailed candidate evaluation views

## Test Steps

### 1. Access HR Agent
1. Login to the application
2. Go to the dashboard
3. Click on "HR Agent" in the agents section
4. Verify you're redirected to `/hr-agent`

### 2. Add a Candidate
1. Click on "Add Candidate" tab
2. Fill in the required fields:
   - Name: "John Doe"
   - Position: "Software Engineer"
   - Email: "john@example.com" (optional)
   - Phone: "+1 (555) 123-4567" (optional)
3. Click "Add Candidate"
4. Verify the candidate appears in the candidates list

### 3. Upload CV
1. Find the candidate you just created
2. Click "Upload CV" button
3. Select a PDF, Word document, or text file
4. Click "Upload CV"
5. Verify the CV is uploaded and the status shows "pending"

### 4. Process CV
1. Click "Process CV" button
2. Wait for the processing to complete
3. Verify the status changes to "evaluated"
4. Check that the AI evaluation appears with:
   - Overall score
   - Strengths and concerns
   - Recommendation (Interview/Reject/Consider)
   - Extracted skills and experience

### 5. View Detailed Evaluation
1. Click "View Details" button
2. Verify you're taken to the detailed candidate page
3. Check all tabs:
   - Overview: Contact info, skills, quick actions
   - AI Evaluation: Full analysis, recommendation, experience, education
   - CV Content: Raw extracted text

### 6. Test API Endpoints
The following API endpoints should be working:

#### GET /api/hr-agent/candidates
- Fetches all candidates for the user
- Requires accessToken parameter

#### POST /api/hr-agent/candidates
- Creates a new candidate
- Requires: accessToken, name, position
- Optional: email, phone

#### GET /api/hr-agent/candidates/[id]
- Fetches specific candidate details
- Requires accessToken parameter

#### POST /api/hr-agent/blob-upload
- Handles CV file uploads
- Supports PDF, Word, and text files
- Creates candidate record with file URL

#### POST /api/hr-agent/process-cv
- Processes uploaded CV with AI
- Extracts information and provides evaluation
- Updates candidate status and evaluation data

## Expected Features

### Information Extraction
The AI should extract:
- Personal information (name, email, phone, location, LinkedIn)
- Technical and soft skills
- Work experience with company names, positions, dates, achievements
- Education history
- Overall assessment and recommendation

### AI Analysis
- Overall score (1-10 scale)
- Strengths and areas of concern
- Position fit assessment
- Years of relevant experience
- Key achievements
- Recommendation (Interview/Reject/Consider) with reasoning

### UI Features
- Responsive design
- Status indicators (pending, processing, evaluated)
- File upload with progress
- Detailed candidate views
- Navigation between pages

## Troubleshooting

### Common Issues
1. **CV upload fails**: Check file format (PDF, DOC, DOCX, TXT)
2. **Processing fails**: Verify OpenAI API key is set
3. **No evaluation**: Ensure CV contains readable text
4. **Authentication errors**: Check user session and access token

### Database Tables
Verify these tables exist in Supabase:
- `hr_candidates`
- `hr_evaluation_criteria`
- `hr_candidate_evaluations`
- `agents` (with hr_agent type)

### Environment Variables
Ensure these are set:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Success Criteria
- ✅ Users can add candidates
- ✅ Users can upload CV files
- ✅ AI processes CVs and extracts information
- ✅ Users can view detailed evaluations
- ✅ All API endpoints work correctly
- ✅ UI is responsive and user-friendly
- ✅ Error handling works properly
