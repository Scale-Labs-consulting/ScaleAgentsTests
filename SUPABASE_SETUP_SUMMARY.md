# Supabase Setup Summary

## ✅ What's Been Completed

### 1. **Database Schema** (`database_schema.sql`)
- ✅ Complete PostgreSQL schema for all three agents
- ✅ Row Level Security (RLS) policies for user isolation
- ✅ Indexes for optimal performance
- ✅ Triggers for automatic timestamps
- ✅ Sample data for testing

### 2. **TypeScript Types** (`types/database.ts`)
- ✅ Full type safety for all database operations
- ✅ Type aliases for easier development
- ✅ Insert/Update type definitions

### 3. **Supabase Client** (`lib/supabase.ts`)
- ✅ Configured Supabase client with TypeScript
- ✅ Helper functions for user management
- ✅ Profile creation and updates

### 4. **Authentication Hook** (`hooks/useAuth.ts`)
- ✅ Custom React hook for authentication
- ✅ Session management
- ✅ Profile fetching
- ✅ Sign up, sign in, sign out functions

### 5. **Database Service** (`lib/database.ts`)
- ✅ CRUD operations for all three agents
- ✅ Usage tracking functions
- ✅ Credit system management
- ✅ Type-safe database operations

### 6. **Dependencies**
- ✅ `@supabase/supabase-js` installed via pnpm
- ✅ Environment variables template (`env.example`)

## 🚀 Next Steps

### 1. **Set Up Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 2. **Configure Environment Variables**
Create a `.env.local` file in your project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. **Run Database Schema**
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `database_schema.sql`
4. Click **Run** to execute the schema

### 4. **Set Up Storage Buckets**
Create these storage buckets in Supabase:
- `sales-calls` - For MP4 sales call recordings
- `hr-cvs` - For candidate CV files
- `avatars` - For user avatars

### 5. **Update Your Existing Pages**
Replace the simulated authentication in your login/register pages with real Supabase auth:

**Login Page** (`app/login/page.tsx`):
```typescript
import { useAuth } from '@/hooks/useAuth'

// Replace the handleSubmit function:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  
  try {
    await signIn(email, password)
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    // Handle error (show toast, etc.)
  } finally {
    setIsLoading(false)
  }
}
```

**Register Page** (`app/register/page.tsx`):
```typescript
import { useAuth } from '@/hooks/useAuth'

// Replace the handleSubmit function:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!validateForm()) return
  
  setIsLoading(true)
  
  try {
    await signUp(email, password, formData.firstName, formData.lastName)
    router.push('/dashboard')
  } catch (error) {
    console.error('Registration error:', error)
    // Handle error (show toast, etc.)
  } finally {
    setIsLoading(false)
  }
}
```

**Dashboard Page** (`app/dashboard/page.tsx`):
```typescript
import { useAuth } from '@/hooks/useAuth'

// Add at the top of your component:
const { user, profile, signOut } = useAuth()

// Replace the handleLogout function:
const handleLogout = async () => {
  try {
    await signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }
}
```

## 🔧 Available Functions

### Authentication
- `signUp(email, password, firstName?, lastName?)`
- `signIn(email, password)`
- `signOut()`
- `updateProfile(updates)`

### Agents
- `getAgents(userId)`
- `createAgent(agentData)`
- `updateAgent(agentId, updates)`

### Scale Expert
- `getConversations(userId)`
- `createConversation(conversationData)`
- `getMessages(conversationId)`
- `addMessage(messageData)`

### Sales Analyst
- `getSalesCalls(userId)`
- `createSalesCall(salesCallData)`
- `updateSalesCall(salesCallId, updates)`
- `getSalesFeedbackPrompts(userId)`

### HR Agent
- `getHRCandidates(userId)`
- `createHRCandidate(candidateData)`
- `updateHRCandidate(candidateId, updates)`
- `getHREvaluationCriteria(userId)`

### Usage Tracking
- `logUsage(usageData)`
- `getCredits(userId)`
- `updateCredits(userId, updates)`

## 🛠️ Testing Your Setup

1. **Start your development server**:
   ```bash
   pnpm dev
   ```

2. **Create a Supabase project** and add your environment variables

3. **Run the database schema** in Supabase SQL Editor

4. **Test authentication** by visiting `/login` and `/register`

5. **Check the dashboard** to see if user data is being fetched

## 🔍 Troubleshooting

### Common Issues:
1. **Environment variables not loaded**: Restart your dev server after adding `.env.local`
2. **RLS policy errors**: Ensure user is authenticated before accessing data
3. **Type errors**: Make sure all imports are correct from `@/types/database`

### Debug Commands:
```sql
-- Check if user profile was created
SELECT * FROM profiles WHERE id = auth.uid();

-- Check user agents
SELECT * FROM agents WHERE user_id = auth.uid();
```

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

Your database is now ready for the three AI agents! 🎉
