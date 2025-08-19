# ScaleAgents Database Setup Guide

This guide will help you set up the database for your ScaleAgents SaaS application using Supabase.

## 🗄️ Database Schema Overview

The database is designed to support three main AI agents for individual users:

1. **Scale Expert** - Custom GPT conversations
2. **Sales Analyst** - Sales call analysis with MP4 uploads
3. **HR Agent** - Candidate evaluation with CV uploads

## 📋 Prerequisites

- Supabase account
- Node.js and npm/pnpm installed
- Basic knowledge of SQL and TypeScript

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `database_schema.sql`
4. Click **Run** to execute the schema

### 3. Install Supabase Client

```bash
npm install @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
```

### 4. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

## 📊 Database Tables

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase auth) |
| `agents` | AI agents configuration |

### Scale Expert Tables

| Table | Purpose |
|-------|---------|
| `conversations` | Chat conversations |
| `messages` | Individual messages in conversations |

### Sales Analyst Tables

| Table | Purpose |
|-------|---------|
| `sales_calls` | Sales call recordings and analysis |
| `sales_feedback_prompts` | Custom prompts for analysis |
| `sales_call_feedback` | Analysis results |

### HR Agent Tables

| Table | Purpose |
|-------|---------|
| `hr_candidates` | Candidate information and CVs |
| `hr_evaluation_criteria` | Custom evaluation criteria |
| `hr_candidate_evaluations` | Individual evaluation scores |

### Billing Tables

| Table | Purpose |
|-------|---------|
| `usage_logs` | Usage tracking for billing |
| `credits` | Credit system management |

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Profile data is only accessible to the owner
- Proper user-based isolation

### Authentication Integration

- Automatic profile creation on user signup
- User-based access control
- Individual user data isolation

## 📈 Performance Optimizations

### Indexes

The schema includes strategic indexes for:
- User lookups by email
- User-based data queries
- Agent type filtering
- Status-based filtering
- Date-based queries

### Triggers

- Automatic `updated_at` timestamp updates
- Profile creation on user signup

## 🔄 Usage Examples

### Creating an Agent

```typescript
import { supabase } from '@/lib/supabase'

const createAgent = async (name: string, type: AgentType, description?: string) => {
  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      name,
      type,
      description
    })
    .select()
    .single()

  if (error) throw error
  return agent
}
```

### Adding a Conversation

```typescript
const createConversation = async (agentId: string) => {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      agent_id: agentId,
      title: 'New Conversation'
    })
    .select()
    .single()

  if (error) throw error
  return conversation
}
```

### Uploading a Sales Call

```typescript
const uploadSalesCall = async (agentId: string, fileUrl: string, title: string) => {
  const { data: salesCall, error } = await supabase
    .from('sales_calls')
    .insert({
      user_id: user.id,
      agent_id: agentId,
      title,
      file_url: fileUrl,
      status: 'uploaded'
    })
    .select()
    .single()

  if (error) throw error
  return salesCall
}
```

### Adding HR Candidate

```typescript
const addHRCandidate = async (agentId: string, candidateData: HRCandidateInsert) => {
  const { data: candidate, error } = await supabase
    .from('hr_candidates')
    .insert({
      user_id: user.id,
      agent_id: agentId,
      ...candidateData
    })
    .select()
    .single()

  if (error) throw error
  return candidate
}
```

## 🛠️ File Storage Setup

### Supabase Storage Buckets

Create the following storage buckets in Supabase:

1. **sales-calls** - For MP4 sales call recordings
2. **hr-cvs** - For candidate CV files
3. **avatars** - For user avatars

### Storage Policies

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (
  auth.uid()::text = storage.foldername(name)[1]
);
```

## 🔧 Configuration

### Agent Configuration

Each agent can have custom configuration stored in the `config` JSONB field:

```typescript
// Scale Expert config
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2000
}

// Sales Analyst config
{
  "analysis_prompts": ["prompt1", "prompt2"],
  "scoring_criteria": ["clarity", "engagement", "closing"]
}

// HR Agent config
{
  "evaluation_criteria": ["experience", "skills", "culture_fit"],
  "scoring_weights": {"experience": 0.4, "skills": 0.3, "culture_fit": 0.3}
}
```

## 🚨 Important Notes

1. **Backup your data** before running schema changes
2. **Test in development** before applying to production
3. **Monitor usage** through the `usage_logs` table
4. **Set up alerts** for credit limits and usage thresholds

## 🔍 Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure user is authenticated
2. **Foreign Key Errors**: Check that referenced IDs exist
3. **Storage Access Denied**: Verify storage policies are correctly set

### Debug Queries

```sql
-- Check user agents
SELECT name, type, config 
FROM agents 
WHERE user_id = auth.uid();

-- Check user conversations
SELECT c.title, a.name as agent_name
FROM conversations c
JOIN agents a ON c.agent_id = a.id
WHERE c.user_id = auth.uid();
```

## 📚 Next Steps

1. Set up Stripe integration for payments
2. Implement file upload functionality
3. Create agent-specific UI components
4. Set up usage monitoring and alerts
5. Implement credit system logic

## 🤝 Support

For issues or questions:
1. Check Supabase documentation
2. Review RLS policies
3. Verify environment variables
4. Check browser console for errors
