import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          supabaseUrl: supabaseUrl ? 'configured' : 'missing',
          supabaseKey: supabaseAnonKey ? 'configured' : 'missing'
        }
      })
    }
    
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
        redirectTo: `${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'}/auth/callback`,
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
      redirectTo: `${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'}/auth/callback`,
      config: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        supabaseUrl: supabaseUrl ? 'configured' : 'missing',
        supabaseKey: supabaseAnonKey ? 'configured' : 'missing',
        environment: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}