# Profile Completion Fix

## Issue
The `useFirstTimeUser` hook was failing because it was trying to query for columns (`company_name`, `industry`, `how_did_you_hear`) that don't exist in the current `profiles` table schema.

## Solution
1. **Database Migration**: Run the SQL script to add the missing columns
2. **TypeScript Types**: Updated the database types to include the new columns
3. **Error Handling**: Improved error handling in the `useFirstTimeUser` hook

## Steps to Fix

### 1. Run Database Migration
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add missing columns to profiles table for profile completion
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS how_did_you_hear TEXT;

-- Update the updated_at timestamp when any of these columns are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for the new columns
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
```

### 2. Files Updated
- ✅ `ADD_PROFILE_COMPLETION_COLUMNS.sql` - Database migration script
- ✅ `types/database.ts` - Updated TypeScript types
- ✅ `hooks/useFirstTimeUser.ts` - Improved error handling

### 3. Expected Behavior After Fix
- New users will be redirected to `/complete-profile` when they first enter the dashboard
- The profile completion form will work correctly
- Existing users won't be affected
- No more "Error checking profile" errors

## Testing
1. Run the SQL migration in Supabase
2. Try logging in with a new user account
3. Verify that the user is redirected to the profile completion page
4. Complete the profile and verify they can access the dashboard
5. Check that existing users can still access the dashboard normally
