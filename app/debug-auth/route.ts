import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Check if we're in a callback URL
    const url = new URL(request.url)
    const isCallback = url.pathname.includes('auth/callback')
    const hasCode = url.searchParams.has('code')
    const hasError = url.searchParams.has('error')
    
    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        accessToken: session?.access_token ? 'present' : 'missing'
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        emailConfirmed: user?.email_confirmed_at
      },
      errors: {
        sessionError: sessionError?.message,
        userError: userError?.message
      },
      url: {
        isCallback,
        hasCode,
        hasError,
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams.entries())
      },
      config: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        storageKey: 'scaleagents-auth',
        supabaseUrl: supabaseUrl ? 'configured' : 'missing',
        supabaseKey: supabaseAnonKey ? 'configured' : 'missing'
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
