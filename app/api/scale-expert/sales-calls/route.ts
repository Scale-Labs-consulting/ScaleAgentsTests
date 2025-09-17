import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/sales-calls')
  
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
    const userId = searchParams.get('userId')

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'Access token and userId are required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Verify the user is requesting their own data
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    console.log('📊 Fetching sales calls for user:', userId)

    // Fetch sales calls for the user from sales_call_analyses table
    const { data: salesCalls, error: fetchError } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch sales calls' },
        { status: 500 }
      )
    }

    console.log('✅ Sales calls fetched:', salesCalls?.length || 0)

    return NextResponse.json({
      success: true,
      salesCalls: salesCalls || []
    })

  } catch (error) {
    console.error('💥 Fetch error:', error)
    return NextResponse.json(
      { error: `Failed to fetch sales calls: ${error}` },
      { status: 500 }
    )
  }
}
