import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { transcriptionId, blobUrl, fileName, userId, salesCallId, callType } = await request.json()
    
    console.log('🔄 Starting async transcription processing...')
    console.log('📁 File:', fileName)
    console.log('🔗 Blob URL:', blobUrl)
    console.log('👤 User ID:', userId)
    console.log('📞 Sales Call ID:', salesCallId)
    console.log('📋 Call Type:', callType)
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Update the transcription status to processing
    await supabase
      .from('sales_call_analyses')
      .update({ 
        status: 'processing',
        analysis_metadata: {
          processing_started_at: new Date().toISOString(),
          async_processing: true
        }
      })
      .eq('id', transcriptionId)
    
    // Start the transcription process in the background
    // This will be handled by a separate service or webhook
    console.log('✅ Async transcription started')
    
    return NextResponse.json({
      success: true,
      message: 'Transcription started in background',
      transcriptionId: transcriptionId
    })
    
  } catch (error) {
    console.error('❌ Async transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to start async transcription' },
      { status: 500 }
    )
  }
}
