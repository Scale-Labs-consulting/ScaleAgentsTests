import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
      }
    })
    
    // Test OAuth initiation with detailed logging
    console.log('🧪 Testing OAuth initiation...')
    console.log('📍 Supabase URL:', supabaseUrl)
    console.log('📍 Current origin: http://localhost:3000')
    console.log('📍 Redirect URL: http://localhost:3000/auth/callback')
    
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
    
    console.log('📊 OAuth response:', { data, error })
    
    return NextResponse.json({
      success: !error,
      oauthUrl: data?.url,
      error: error?.message,
      provider: 'google',
      redirectTo: 'http://localhost:3000/auth/callback',
      config: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        supabaseUrl: supabaseUrl ? 'configured' : 'missing',
        supabaseKey: supabaseAnonKey ? 'configured' : 'missing'
      },
      debug: {
        fullOAuthData: data,
        fullError: error
      }
    })
  } catch (error) {
    console.error('❌ OAuth test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
