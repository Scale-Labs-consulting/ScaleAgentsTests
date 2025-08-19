import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/analyses/[id]')
  
  try {
    const resolvedParams = await params
    console.log('📋 Analysis ID:', resolvedParams.id)
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching analysis:', error)
      return NextResponse.json(
        { error: `Failed to fetch analysis: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    console.log('✅ Fetched analysis from Supabase:', data.id)

    return NextResponse.json({
      success: true,
      analysis: data
    })

  } catch (error) {
    console.error('💥 Analysis API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
