# Onboarding Form Troubleshooting

## Error: "Error saving profile: {}"

This error typically occurs when the database columns for the onboarding form don't exist yet. Here's how to fix it:

### Step 1: Run the Database Migration

You need to run the SQL migration to add the new columns to your `profiles` table.

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this migration script:**

```sql
-- Add new onboarding fields to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS business_product_service TEXT,
ADD COLUMN IF NOT EXISTS ideal_customer TEXT,
ADD COLUMN IF NOT EXISTS problem_solved TEXT,
ADD COLUMN IF NOT EXISTS business_model TEXT,
ADD COLUMN IF NOT EXISTS average_ticket TEXT,
ADD COLUMN IF NOT EXISTS conversion_rate TEXT,
ADD COLUMN IF NOT EXISTS sales_cycle TEXT,
ADD COLUMN IF NOT EXISTS lead_generation TEXT,
ADD COLUMN IF NOT EXISTS common_objections TEXT,
ADD COLUMN IF NOT EXISTS main_competitors TEXT,
ADD COLUMN IF NOT EXISTS differentiation TEXT,
ADD COLUMN IF NOT EXISTS pricing_structure TEXT,
ADD COLUMN IF NOT EXISTS monthly_revenue TEXT,
ADD COLUMN IF NOT EXISTS growth_bottleneck TEXT,
ADD COLUMN IF NOT EXISTS funnel_drop_off TEXT;

-- Ensure the updated_at trigger is in place and correctly updates on any column change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger to ensure it covers all new columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for the new columns
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

SELECT 'Onboarding fields added to profiles table successfully!' as message;
```

### Step 2: Verify the Migration

After running the migration, you should see:
- A success message: "Onboarding fields added to profiles table successfully!"
- The new columns should appear in your `profiles` table schema

### Step 3: Test the Form

1. **Refresh your browser**
2. **Try filling out the onboarding form again**
3. **Click "Completar onboarding"**

### Alternative: Use the Migration File

If you prefer, you can also run the migration from the file:

1. **Open the file**: `ADD_ONBOARDING_FIELDS.sql`
2. **Copy the entire contents**
3. **Paste into Supabase SQL Editor**
4. **Run the query**

### Common Issues

#### Issue: "Column already exists"
- **Solution**: This is normal - the `IF NOT EXISTS` clause prevents errors if columns already exist

#### Issue: "Permission denied"
- **Solution**: Make sure you're using the service role key or have proper permissions

#### Issue: "Table 'profiles' doesn't exist"
- **Solution**: Run the basic profile setup first:
  ```sql
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

### Still Having Issues?

If you're still getting errors after running the migration:

1. **Check the browser console** for detailed error messages
2. **Check Supabase logs** for any database errors
3. **Verify your Supabase connection** is working properly

The form should now work correctly and save all the business context information to your database! 🎉
