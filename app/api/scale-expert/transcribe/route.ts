import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🎙️ API ROUTE CALLED - /api/scale-expert/transcribe (POST)')
  
  try {
    const { fileUrl, salesCallId, accessToken } = await request.json()

    console.log('📥 Transcription request received:', {
      fileUrl: fileUrl,
      fileUrlLength: fileUrl?.length,
      salesCallId,
      hasAccessToken: !!accessToken
    })

    if (!fileUrl || !salesCallId || !accessToken) {
      console.log('❌ Missing required parameters:', { hasFileUrl: !!fileUrl, hasSalesCallId: !!salesCallId, hasAccessToken: !!accessToken })
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate file URL format
    try {
      new URL(fileUrl)
    } catch (error) {
      console.error('❌ Invalid file URL format:', fileUrl)
      return NextResponse.json(
        { error: 'Invalid file URL format' },
        { status: 400 }
      )
    }

    // Check if Assembly AI API key is available
    console.log('🔑 Checking AssemblyAI API key:', !!process.env.ASSEMBLY_AI_API_KEY)
    console.log('🔑 API key length:', process.env.ASSEMBLY_AI_API_KEY?.length)
    console.log('🔑 API key starts with:', process.env.ASSEMBLY_AI_API_KEY?.substring(0, 10) + '...')
    
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error('❌ Assembly AI API key not configured')
      return NextResponse.json(
        { error: 'Assembly AI API key not configured' },
        { status: 500 }
      )
    }

    console.log('🎙️ Starting transcription for Scale Expert:', salesCallId)

    // Step 1: Start transcription with speaker identification
    console.log('🎙️ Starting transcription with AssemblyAI and speaker identification...')
    
    const requestBody = {
      audio_url: fileUrl,
      speaker_labels: true,
      language_code: 'pt',
      punctuate: true,
      format_text: true
    }
    
    console.log('📤 AssemblyAI request payload:', JSON.stringify(requestBody, null, 2))
    
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('📥 Transcript response status:', transcriptResponse.status)

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('❌ Assembly AI transcription error:', errorText)
      return NextResponse.json(
        { error: `Failed to start transcription: ${transcriptResponse.status} - ${errorText.substring(0, 200)}` },
        { status: 500 }
      )
    }

    const transcriptData = await transcriptResponse.json()
    const { id: transcriptId } = transcriptData
    console.log('✅ Transcription started with ID:', transcriptId)
    console.log('📊 Full AssemblyAI response:', transcriptData)

    // Step 2: Poll for completion
    let transcription = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        },
      })

      if (!statusResponse.ok) {
        console.error('Failed to check transcription status:', statusResponse.status)
        continue
      }

      const transcriptStatusData = await statusResponse.json()
      console.log(`📊 Transcription status: ${transcriptStatusData.status} (attempt ${attempts})`)

      if (transcriptStatusData.status === 'completed') {
        // Process the transcription with speaker identification
        console.log('✅ Transcription completed!')
        console.log('🔍 Processing AssemblyAI results with speaker identification...')
        console.log('📊 AssemblyAI Analysis:')
        console.log(`• Total utterances: ${transcriptStatusData.utterances?.length || 0}`)
        console.log(`• Speakers detected: ${new Set(transcriptStatusData.utterances?.map((u: any) => u.speaker) || []).size}`)
        console.log(`• Confidence: ${transcriptStatusData.confidence}`)
        
        // Format the transcription with speaker information
        let formattedTranscription = ''
        const speakerMap = new Map()
        let speakerCounter = 1
        
        if (transcriptStatusData.utterances && transcriptStatusData.utterances.length > 0) {
          // Count utterances per speaker to identify the main speakers
          const speakerCounts = new Map()
          for (const utterance of transcriptStatusData.utterances) {
            const speaker = utterance.speaker
            speakerCounts.set(speaker, (speakerCounts.get(speaker) || 0) + 1)
          }
          
          // Sort speakers by utterance count (most frequent first)
          const sortedSpeakers = Array.from(speakerCounts.entries())
            .sort((a, b) => b[1] - a[1])
          
          console.log('📊 Speaker utterance counts:', Object.fromEntries(speakerCounts))
          console.log('📊 Sorted speakers by frequency:', sortedSpeakers.map(([speaker, count]) => `${speaker}: ${count} utterances`))
          
          // Handle speaker mapping based on actual detection
          console.log(`🎯 Detected ${sortedSpeakers.length} speakers, mapping accordingly...`)
          
          if (sortedSpeakers.length > 2) {
            console.log('⚠️ Detected more than 2 speakers, keeping all speakers...')
            
            // Map all speakers to numbered format
            for (let i = 0; i < sortedSpeakers.length; i++) {
              speakerMap.set(sortedSpeakers[i][0], `speaker ${i + 1}`)
            }
          } else {
            // Normal mapping for 1-2 speakers
            console.log(`✅ Detected ${sortedSpeakers.length} speaker(s), using normal mapping`)
            for (const utterance of transcriptStatusData.utterances) {
              const originalSpeaker = utterance.speaker
              if (!speakerMap.has(originalSpeaker)) {
                speakerMap.set(originalSpeaker, `speaker ${speakerCounter}`)
                speakerCounter++
              }
            }
          }
          
          // Format the transcription
          for (const utterance of transcriptStatusData.utterances) {
            const originalSpeaker = utterance.speaker
            const speaker = speakerMap.get(originalSpeaker)
            const startTime = Math.floor(utterance.start / 1000) // Convert to seconds
            const timestamp = `[${Math.floor(startTime / 3600).toString().padStart(2, '0')}:${Math.floor((startTime % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(startTime % 60).toString().padStart(2, '0')}]`
            
            formattedTranscription += `${timestamp} - ${speaker} - ${utterance.text}\n`
          }
        }
        
        console.log('📊 Speaker mapping:', Object.fromEntries(speakerMap))
        console.log('🎤 AssemblyAI Speaker Detection Summary:')
        console.log(`• Speakers identified: ${speakerMap.size}`)
        console.log(`• Total utterances: ${transcriptStatusData.utterances?.length || 0}`)
        console.log(`• Average confidence: ${transcriptStatusData.confidence}`)
        
        transcription = formattedTranscription.trim()
        
        // Fallback to plain text if no utterances were processed
        if (!transcription || transcription.length === 0) {
          console.log('⚠️ No formatted transcription generated, falling back to plain text')
          transcription = transcriptStatusData.text || 'Transcription not available'
        }
        
        break
      } else if (transcriptStatusData.status === 'error') {
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

    // Step 3: Return transcription directly for Scale Expert to use in conversation
    console.log('✅ Transcription completed and ready for Scale Expert analysis')
    console.log('📊 Transcription length:', transcription.length, 'characters')

    return NextResponse.json({
      success: true,
      transcription: transcription,
      transcriptId: transcriptId,
      message: 'Transcription ready for Scale Expert analysis'
    })

  } catch (error) {
    console.error('❌ Scale Expert transcription error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('🎙️ API ROUTE CALLED - /api/scale-expert/transcribe (GET)')
  
  try {
    const { searchParams } = new URL(request.url)
    const salesCallId = searchParams.get('salesCallId')
    
    if (!salesCallId) {
      return NextResponse.json(
        { error: 'salesCallId parameter is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Checking transcription status for sales call:', salesCallId)
    
    // For now, we'll return a simple response indicating the transcription is ready
    // In a real implementation, you might want to store transcription results in a database
    // and check the actual status there
    
    return NextResponse.json({
      success: true,
      transcription: "Transcription is ready for analysis. This is a placeholder response.",
      message: 'Transcription status checked'
    })
    
  } catch (error) {
    console.error('❌ Error checking transcription status:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
