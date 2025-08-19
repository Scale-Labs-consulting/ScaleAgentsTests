import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileName, userId } = await request.json()

    if (!fileUrl || !fileName || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Import OpenAI dynamically to avoid build-time errors
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log('🎬 Starting transcription for:', fileName)
    console.log('🔗 File URL:', fileUrl)

    // Transcribe the video using OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: fileUrl,
      model: 'whisper-1',
      response_format: 'text',
      language: 'pt', // Portuguese
    })

    console.log('✅ Transcription completed')
    console.log('📝 Transcription length:', transcription.length)

    // Create database record for the transcription
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const salesCallData = {
      user_id: userId,
      title: fileName.replace(/\.[^/.]+$/, ''),
      file_url: fileUrl,
      file_path: fileUrl,
      file_size: 0, // We don't have the size from blob URL
      duration: 0,
      status: 'transcribed',
      transcription: transcription
    }

    const { data: salesCall, error: dbError } = await supabase
      .from('sales_calls')
      .insert(salesCallData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create database record' },
        { status: 500 }
      )
    }

    console.log('✅ Database record created:', salesCall.id)

    return NextResponse.json({
      success: true,
      transcription: transcription,
      salesCall: salesCall
    })

  } catch (error) {
    console.error('❌ Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}
