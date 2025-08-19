import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/analyses')
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const salesCallId = searchParams.get('salesCallId')
    
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

    let query = supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // If salesCallId is provided, filter by it
    if (salesCallId) {
      query = query.eq('sales_call_id', salesCallId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching analyses:', error)
      return NextResponse.json(
        { error: `Failed to fetch analyses: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Fetched analyses from Supabase:', data?.length || 0, 'records')

    return NextResponse.json({
      success: true,
      analyses: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('💥 Analyses API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/analyses (POST)')
  
  try {
    const { salesCallId, userId, analysis } = await request.json()
    
    if (!salesCallId || !userId || !analysis) {
      return NextResponse.json(
        { error: 'Sales call ID, user ID, and analysis are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('sales_call_analyses')
      .insert({
        sales_call_id: salesCallId,
        user_id: userId,
        status: 'completed',
        call_type: analysis.callType,
        feedback: analysis.feedback || 'Analysis completed',
        score: analysis.score || 0,
        analysis: analysis,
        analysis_metadata: {
          transcription_length: analysis.transcriptionLength || 0,
          processing_time: new Date().toISOString(),
          analysis_steps: 6,
          was_truncated: false
        },
        transcription: analysis.transcription || '',
        custom_prompts: [
          'Call Type Classification',
          'Quantitative Analysis', 
          'Strong Points Analysis',
          'Weak Points Analysis',
          'Scoring Analysis',
          'Moments by Phase Analysis'
        ]
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error saving analysis:', error)
      return NextResponse.json(
        { error: `Failed to save analysis: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Analysis saved to Supabase with ID:', data.id)

    return NextResponse.json({
      success: true,
      analysisId: data.id,
      message: 'Analysis saved successfully'
    })

  } catch (error) {
    console.error('💥 Analysis save API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
