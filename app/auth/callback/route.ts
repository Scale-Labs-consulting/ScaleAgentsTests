import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔄 Auth callback triggered')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  
  console.log('🔍 Callback parameters:', { code: !!code, state: !!state })
  
  if (!code) {
    console.error('❌ No auth code found in callback')
    return NextResponse.redirect(new URL('/login?error=no_auth_code', request.url))
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.redirect(new URL('/login?error=missing_env_vars', request.url))
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
      }
    })
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Auth callback error:', error)
      return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(error.message)}`, request.url))
    }
    
    if (data.session) {
      console.log('✅ Auth callback successful, session established')
      console.log('👤 User ID:', data.session.user?.id)
      console.log('📧 User email:', data.session.user?.email)
      console.log('🆕 Is new user:', data.session.user?.created_at === data.session.user?.updated_at)
      
      // Always redirect to dashboard - first-time user check will be handled there
      console.log('✅ User authenticated, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      console.error('❌ No session found after code exchange')
      return NextResponse.redirect(new URL('/login?error=no_session', request.url))
    }
    
  } catch (error) {
    console.error('❌ Auth callback exception:', error)
    return NextResponse.redirect(new URL('/login?error=auth_exception', request.url))
  }
}
