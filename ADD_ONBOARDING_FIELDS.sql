-- Add onboarding fields to profiles table for business context
-- Run this in your Supabase SQL Editor

-- Add the new onboarding fields to the profiles table
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

-- Update the updated_at timestamp when any of these columns are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger only if it doesn't exist (safer approach)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON profiles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Grant permissions for the new columns
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Success message
SELECT 'Onboarding fields added successfully!' as message;
