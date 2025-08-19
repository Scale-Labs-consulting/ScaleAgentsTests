import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string

    if (!file || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if Assembly AI API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Assembly AI API key not configured' },
        { status: 500 }
      )
    }

    console.log('🎬 Starting direct Assembly AI upload for:', file.name)

    // Step 1: Upload to Assembly AI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Assembly AI upload error:', errorText)
      return NextResponse.json(
        { error: 'Failed to upload to Assembly AI' },
        { status: 500 }
      )
    }

    const { upload_url } = await uploadResponse.json()
    console.log('✅ File uploaded to Assembly AI:', upload_url)

    // Step 2: Start transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: 'pt', // Portuguese
        auto_highlights: true,
        sentiment_analysis: true,
        auto_chapters: true,
      }),
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('Assembly AI transcription error:', errorText)
      return NextResponse.json(
        { error: 'Failed to start transcription' },
        { status: 500 }
      )
    }

    const { id: transcriptId } = await transcriptResponse.json()
    console.log('✅ Transcription started with ID:', transcriptId)

    // Step 3: Poll for completion
    let transcription = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY,
        },
      })

      if (!statusResponse.ok) {
        console.error('Failed to check transcription status')
        continue
      }

      const transcriptData = await statusResponse.json()
      console.log(`📊 Transcription status: ${transcriptData.status} (attempt ${attempts})`)

      if (transcriptData.status === 'completed') {
        transcription = transcriptData.text
        console.log('✅ Transcription completed!')
        break
      } else if (transcriptData.status === 'error') {
        return NextResponse.json(
          { error: 'Transcription failed' },
          { status: 500 }
        )
      }
    }

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription timed out' },
        { status: 500 }
      )
    }

    // Step 4: Create database record
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

    const salesCallData = {
      user_id: userId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_url: upload_url, // Assembly AI URL
      file_path: upload_url,
      file_size: file.size,
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
    console.error('❌ Assembly AI upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
