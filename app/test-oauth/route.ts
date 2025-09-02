import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
      }
    })
    
    // Test OAuth initiation
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })
    
    return NextResponse.json({
      success: true,
      oauthUrl: data.url,
      error: error?.message,
      provider: 'google',
      redirectTo: 'http://localhost:3000/auth/callback',
      config: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        supabaseUrl: supabaseUrl ? 'configured' : 'missing',
        supabaseKey: supabaseAnonKey ? 'configured' : 'missing'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
