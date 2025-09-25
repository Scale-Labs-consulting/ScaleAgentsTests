import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { transcriptId, analysisId } = await request.json()
    
    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Checking transcription status for ID:', transcriptId)
    
    // Check AssemblyAI status
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!
      }
    })
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`)
    }
    
    const statusResult = await statusResponse.json()
    console.log('📊 Transcription status:', statusResult.status)
    
    if (statusResult.status === 'completed') {
      // Get the transcription
      const transcription = statusResult.text || ''
      
      if (transcription) {
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Update the analysis with the completed transcription
        const { error: updateError } = await supabase
          .from('sales_call_analyses')
          .update({
            status: 'completed',
            transcription: transcription,
            analysis_metadata: {
              transcription_completed_at: new Date().toISOString(),
              audio_duration: statusResult.audio_duration
            }
          })
          .eq('id', analysisId)
        
        if (updateError) {
          console.error('❌ Error updating analysis:', updateError)
          return NextResponse.json(
            { error: 'Failed to update analysis' },
            { status: 500 }
          )
        }
        
        console.log('✅ Transcription completed and analysis updated')
        
        return NextResponse.json({
          success: true,
          status: 'completed',
          transcription: transcription,
          message: 'Transcription completed successfully'
        })
      }
    } else if (statusResult.status === 'error') {
      console.error('❌ Transcription failed:', statusResult.error)
      return NextResponse.json(
        { error: `Transcription failed: ${statusResult.error}` },
        { status: 500 }
      )
    } else {
      // Still processing
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Transcription is still processing'
      })
    }
    
  } catch (error) {
    console.error('❌ Check transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to check transcription status' },
      { status: 500 }
    )
  }
}
