import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🔍 API ROUTE CALLED - /api/scale-expert/get-transcription')
  
  try {
    const { salesCallId, accessToken } = await request.json()

    console.log('📥 Get transcription request:', {
      salesCallId,
      hasAccessToken: !!accessToken
    })

    if (!salesCallId || !accessToken) {
      console.log('❌ Missing required parameters:', { hasSalesCallId: !!salesCallId, hasAccessToken: !!accessToken })
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Get the transcription from sales_call_analyses table
    console.log('🔍 Querying sales_call_analyses table for transcription...')
    const { data: transcriptionRecord, error } = await supabase
      .from('sales_call_analyses')
      .select('transcription, status, analysis_metadata')
      .eq('sales_call_id', salesCallId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('📊 Database query result:', {
      hasData: !!transcriptionRecord,
      hasError: !!error,
      error: error?.message,
      transcriptionLength: transcriptionRecord?.transcription?.length
    })

    if (error) {
      console.error('❌ Error fetching transcription:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transcription' },
        { status: 500 }
      )
    }

    if (!transcriptionRecord) {
      return NextResponse.json(
        { error: 'Transcription not found or not completed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transcription: transcriptionRecord.transcription,
      status: transcriptionRecord.status,
      metadata: transcriptionRecord.analysis_metadata
    })

  } catch (error) {
    console.error('❌ Get transcription error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
