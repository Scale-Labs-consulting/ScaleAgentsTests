import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/debug-analyses')
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all analyses for the user with detailed information
    const { data: analyses, error } = await supabase
      .from('sales_call_analyses')
      .select('id, title, created_at, analysis_metadata, user_id, sales_call_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching analyses:', error)
      return NextResponse.json(
        { error: `Failed to fetch analyses: ${error.message}` },
        { status: 500 }
      )
    }

    // sales_calls table has been removed

    // Process the analyses to show content hashes
    const processedAnalyses = analyses?.map(analysis => ({
      id: analysis.id,
      title: analysis.title,
      created_at: analysis.created_at,
      sales_call_id: analysis.sales_call_id,
      content_hash: analysis.analysis_metadata?.content_hash || 'NO HASH',
      content_hash_short: analysis.analysis_metadata?.content_hash?.substring(0, 16) + '...' || 'NO HASH',
      metadata_keys: Object.keys(analysis.analysis_metadata || {}),
      full_metadata: analysis.analysis_metadata
    })) || []

    // sales_calls table has been removed

    console.log('✅ Debug analyses fetched:', processedAnalyses.length, 'records')

    return NextResponse.json({
      success: true,
      userId: userId,
      totalAnalyses: processedAnalyses.length,
      analyses: processedAnalyses
    })

  } catch (error) {
    console.error('💥 Debug analyses API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
