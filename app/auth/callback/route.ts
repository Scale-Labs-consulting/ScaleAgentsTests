import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔄 Auth callback triggered')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('📝 Request URL:', request.url)
  console.log('🔑 Auth code present:', !!code)
  console.log('🔍 All search params:', Object.fromEntries(requestUrl.searchParams.entries()))

  if (code) {
    try {
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔧 Supabase URL configured:', !!supabaseUrl)
      console.log('🔧 Supabase Anon Key configured:', !!supabaseAnonKey)
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables')
        return NextResponse.redirect(new URL('/login?error=missing_env_vars', request.url))
      }
      
      // Create a simple Supabase client without complex configuration
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      console.log('🔐 Exchanging code for session...')
      
      // Try the exchange with minimal configuration
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Auth callback error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Try alternative approach - let Supabase handle it automatically
        console.log('🔄 Trying alternative approach...')
        
        // Create a new client with session detection
        const supabaseWithSession = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            detectSessionInUrl: true,
            flowType: 'pkce'
          }
        })
        
        // Try to get session directly
        const { data: sessionData, error: sessionError } = await supabaseWithSession.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          return NextResponse.redirect(new URL(`/login?error=auth_callback_failed&details=${encodeURIComponent(error.message)}`, request.url))
        }
        
        if (sessionData.session) {
          console.log('✅ Session found via alternative approach')
          console.log('👤 User ID:', sessionData.session.user?.id)
          console.log('📧 User email:', sessionData.session.user?.email)
        } else {
          console.error('❌ No session found')
          return NextResponse.redirect(new URL(`/login?error=auth_callback_failed&details=${encodeURIComponent(error.message)}`, request.url))
        }
      } else {
        console.log('✅ Auth callback successful, session established')
        console.log('👤 User ID:', data.session?.user?.id)
        console.log('📧 User email:', data.session?.user?.email)
      }
      
    } catch (error) {
      console.error('❌ Auth callback exception:', error)
      return NextResponse.redirect(new URL('/login?error=auth_callback_exception', request.url))
    }
  } else {
    console.error('❌ No auth code found in callback')
    console.log('🔍 Available params:', Object.fromEntries(requestUrl.searchParams.entries()))
    return NextResponse.redirect(new URL('/login?error=no_auth_code', request.url))
  }

  // URL to redirect to after sign in process completes
  console.log('🔄 Redirecting to dashboard...')
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
