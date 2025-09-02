import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'scaleagents-auth',
        flowType: 'pkce',
        debug: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'scaleagents-web'
        }
      }
    })
    
    // Test the auth configuration
    const { data: { session }, error } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      sessionUser: session?.user?.id,
      error: error?.message,
      config: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        storageKey: 'scaleagents-auth'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
