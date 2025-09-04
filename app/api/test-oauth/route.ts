import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test basic Supabase connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Test OAuth providers
    const { data: providers, error: providersError } = await supabase.auth.listIdentities()
    
    return NextResponse.json({
      success: true,
      session: session ? {
        userId: session.user.id,
        email: session.user.email,
        provider: session.user.app_metadata?.provider
      } : null,
      sessionError: sessionError?.message,
      providers: providers || [],
      providersError: providersError?.message,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
