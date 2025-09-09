import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/check-database')
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all analyses from the database
    const { data: analyses, error: analysesError } = await supabase
      .from('sales_call_analyses')
      .select('id, user_id, title, created_at, analysis_metadata->>content_hash')
      .order('created_at', { ascending: false })

    if (analysesError) {
      console.error('❌ Error fetching analyses:', analysesError)
      return NextResponse.json(
        { error: `Failed to fetch analyses: ${analysesError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Database check completed:', analyses?.length || 0, 'analyses found')

    return NextResponse.json({
      success: true,
      totalAnalyses: analyses?.length || 0,
      analyses: analyses?.map(analysis => ({
        id: analysis.id,
        user_id: analysis.user_id,
        title: analysis.title,
        created_at: analysis.created_at,
        content_hash: analysis.content_hash?.substring(0, 16) + '...' || 'none'
      })) || []
    })

  } catch (error) {
    console.error('💥 Check database API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
