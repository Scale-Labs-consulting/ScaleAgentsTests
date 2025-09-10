# Onboarding Form Setup - Contexto Essencial

## Overview
The onboarding form has been completely redesigned to collect essential business context that will help personalize the AI agents' responses and provide more targeted insights.

## Database Migration Required

### 1. Run the SQL Migration
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add onboarding fields to profiles table for business context
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
```

## Form Sections

### 1. **Informação Básica**
- Nome
- Nome da Empresa

### 2. **Negócio Core** (Required)
- **O que vendes exactamente?** - Detailed description of products/services
- **Quem é o teu cliente ideal?** - Demographics, role, company type
- **Que problema específico resolves?** - Main problem solved for clients
- **Modelo de negócio** - B2B, B2C, SaaS, Consultoria, etc.

### 3. **Vendas & Performance** (Optional)
- **Ticket médio** - Average sale value
- **Taxa de conversão** - Current conversion rate
- **Ciclo de vendas** - Typical sales cycle duration
- **Geração de leads** - How leads are currently generated
- **Objeções comuns** - Most frequent objections

### 4. **Posicionamento** (Optional)
- **Principais concorrentes** - Main competitors
- **Diferenciação** - How they differentiate from competition
- **Estrutura de pricing** - Pricing model and structure

### 5. **Objetivos & Bottlenecks** (Optional)
- **Receita mensal** - Current monthly revenue range
- **Maior bottleneck** - Main growth bottleneck
- **Perda no funil** - Where they lose most customers in the funnel

## Key Features

### ✅ **Smart Validation**
- Only core business fields are required
- Optional fields provide additional context
- Clear error messages for required fields

### ✅ **Responsive Design**
- Mobile-friendly layout
- Grid system for optimal spacing
- Dark theme matching your app

### ✅ **User Experience**
- Organized in logical sections
- Clear labels and placeholders
- Skip option for users who want to complete later

### ✅ **Data Structure**
- All fields stored as TEXT for flexibility
- Proper database relationships maintained
- Updated_at timestamp automatically managed

## Files Updated

1. **`ADD_ONBOARDING_FIELDS.sql`** - Database migration script
2. **`types/database.ts`** - Updated TypeScript types
3. **`app/complete-profile/page.tsx`** - Complete form redesign
4. **`hooks/useFirstTimeUser.ts`** - Updated validation logic

## Benefits

### 🎯 **Better AI Personalization**
- AI agents can provide more targeted advice
- Responses tailored to specific business context
- Industry-specific insights and recommendations

### 📊 **Improved Analytics**
- Better understanding of user base
- Identify common patterns and bottlenecks
- Track business growth metrics

### 🚀 **Enhanced User Experience**
- More relevant suggestions and content
- Personalized onboarding journey
- Better agent recommendations

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Test form submission with all fields
- [ ] Test form submission with only required fields
- [ ] Test skip functionality
- [ ] Verify data is saved correctly in database
- [ ] Test first-time user detection
- [ ] Verify existing users aren't affected

## Next Steps

1. **Run the database migration**
2. **Test the new form**
3. **Update AI agent prompts** to use the new business context
4. **Create analytics dashboards** to visualize the collected data
5. **Implement personalized recommendations** based on the business context
