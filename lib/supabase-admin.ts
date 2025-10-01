import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ CRITICAL: Missing Supabase service role environment variables!')
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Admin client with service role key - bypasses RLS policies
// Use this ONLY in server-side code (API routes, server actions)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('✅ Supabase Admin client initialized (service role)')

