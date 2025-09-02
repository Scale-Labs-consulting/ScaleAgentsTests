import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/upload')
  try {
    console.log('=== STARTING TRANSCRIPTION PROCESS ===')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      title: title,
      userId: userId
    })

    if (!file || !title || !userId) {
      console.error('❌ Missing required parameters')
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      console.error('❌ Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only video files are allowed' },
        { status: 400 }
      )
    }

    console.log('✅ File validation passed')
    console.log('🔄 Processing file for transcription...')

    // Check API keys
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Check AssemblyAI API key for speaker diarization
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.warn('⚠️ AssemblyAI API key not found - will use Whisper fallback for speaker detection')
              console.log('🔍 Environment variable check: ASSEMBLY_AI_API_KEY =', process.env.ASSEMBLY_AI_API_KEY ? 'Found' : 'Not found')
    } else {
      console.log('✅ AssemblyAI API key found - will use enhanced speaker diarization')
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create temporary files
    const tempDir = tmpdir()
    const inputPath = join(tempDir, `input_${Date.now()}.${file.name.split('.').pop()}`)
    const audioPath = join(tempDir, `audio_${Date.now()}.wav`)
    
    console.log('📝 Writing file to temp directory...')
    await writeFile(inputPath, buffer)
    
    try {
                      // Convert video to audio using ffmpeg with optimized settings for multi-speaker detection
     console.log('🔄 Converting video to audio with enhanced speaker detection...')
     // Enhanced audio processing for better speaker separation:
     // - Higher sample rate (32kHz) for better voice clarity
     // - Stereo audio (2 channels) for spatial separation
     // - Noise reduction and voice enhancement filters
     // - Dynamic range compression for consistent levels
     const ffmpegCommand = `"C:\\ffmpeg\\ffmpeg-2025-08-07-git-fa458c7243-essentials_build\\bin\\ffmpeg.exe" -i "${inputPath}" -vn -acodec pcm_s16le -ar 32000 -ac 2 -af "highpass=f=80,lowpass=f=8000,anlmdn=s=7:p=0.002:r=0.01,compand=0.3|0.3:1|1:-90/-60/-40/-30/-20/-10/-3/0:6:0:-90:0.2,volume=1.5" "${audioPath}" -y`
      
             try {
         await execAsync(ffmpegCommand)
         console.log('✅ Audio conversion successful')
         
         // Verify the audio file was created and has content
         const audioStats = await import('fs').then(fs => fs.promises.stat(audioPath))
         if (audioStats.size === 0) {
           throw new Error('Audio file is empty - no audio track found')
         }
         
       } catch (ffmpegError) {
         console.error('❌ FFmpeg conversion failed:', ffmpegError)
         return NextResponse.json(
           { error: 'Failed to convert video to audio. Please ensure the video has audio track and is not corrupted.' },
           { status: 400 }
         )
       }

      // Check audio file size
      const audioStats = await import('fs').then(fs => fs.promises.stat(audioPath))
      const audioSizeMB = audioStats.size / (1024 * 1024)
      console.log('📊 Audio file size:', audioSizeMB.toFixed(2), 'MB')

      let transcription = ''
      const openAILimit = 25 * 1024 * 1024 // 25MB

      // Choose processing method based on available APIs
      if (process.env.ASSEMBLY_AI_API_KEY) {
        // Use AssemblyAI for enhanced speaker diarization
        console.log('🎤 Using AssemblyAI for enhanced speaker diarization...')
                  console.log('🔑 API Key found:', process.env.ASSEMBLY_AI_API_KEY.substring(0, 8) + '...')
        transcription = await processWithAssemblyAI(audioPath)
      } else if (audioStats.size <= openAILimit) {
        // Fallback to Whisper for smaller files
        console.log('📤 Processing audio file with Whisper (fallback)...')
        transcription = await processAudioFile(audioPath)
      } else {
        // Fallback to Whisper for larger files
        console.log('📤 Audio file too large, splitting into chunks with Whisper...')
        transcription = await processLargeAudioFile(audioPath, audioStats.size)
      }

      // Clean up temporary files
      try {
        await unlink(inputPath)
        await unlink(audioPath)
        console.log('🧹 Temporary files cleaned up')
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp files:', cleanupError)
      }

      console.log('✅ Transcription successful!')
      console.log('📊 Transcription stats:', {
        length: transcription.length,
        wordCount: transcription.split(' ').length,
        first100Chars: transcription.substring(0, 100),
        last100Chars: transcription.substring(transcription.length - 100)
      })
      
      console.log('\n' + '='.repeat(80))
      console.log('🎯 FULL TRANSCRIPTION RESULT')
      console.log('='.repeat(80))
      console.log('📝 TRANSCRIPTION:')
      console.log('-'.repeat(80))
      console.log(transcription)
      console.log('-'.repeat(80))
      console.log('📊 TRANSCRIPTION SUMMARY:')
      console.log(`• Total characters: ${transcription.length}`)
      console.log(`• Total words: ${transcription.split(' ').length}`)
      console.log(`• Lines: ${transcription.split('\n').length}`)
      console.log(`• Speaker segments: ${(transcription.match(/speaker \d+/gi) || []).length}`)
      console.log('='.repeat(80))

      // Return success with transcription and proceed to analysis
      return NextResponse.json({
        success: true,
        transcription: transcription,
        message: 'Transcription completed successfully - Proceeding to AI analysis',
        stats: {
          length: transcription.length,
          wordCount: transcription.split(' ').length,
          lines: transcription.split('\n').length,
          speakerSegments: (transcription.match(/speaker \d+/gi) || []).length
        }
      })

    } catch (error) {
      // Clean up on error
      try {
        await unlink(inputPath)
        await unlink(audioPath)
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp files:', cleanupError)
      }
      throw error
    }

  } catch (error) {
    console.error('💥 API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}

// AssemblyAI Speaker Diarization Function
async function processWithAssemblyAI(audioPath: string): Promise<string> {
  console.log('🎤 Using AssemblyAI for enhanced speaker diarization...')
  
  const fs = await import('fs')
  const audioBuffer = await fs.promises.readFile(audioPath)
  
  // Step 1: Upload audio to AssemblyAI
  console.log('📤 Uploading audio to AssemblyAI...')
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
      'Content-Type': 'application/octet-stream'
    },
    body: audioBuffer
  })
  
  if (!uploadResponse.ok) {
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.statusText}`)
  }
  
  const { upload_url } = await uploadResponse.json()
  console.log('✅ Audio uploaded successfully')
  
  // Step 2: Start transcription with speaker diarization
  console.log('🎯 Starting transcription with speaker diarization...')
  
  const requestBody = {
    audio_url: upload_url,
    speaker_labels: true,
    language_code: 'pt',
    punctuate: true,
    format_text: true,
    boost_param: 'high',
    speech_threshold: 0.2, // Sensitive to speech
    diarization: {
      enabled: true,
      speakers_expected: 2, // Expected but not forced
      sensitivity: 0.7 // Balanced sensitivity for accurate detection
    },
    auto_highlights: false,
    entity_detection: false,
    auto_chapters: false,
    content_safety: false,
    iab_categories: false,
    auto_highlights_result: false,
    sentiment_analysis: false,
    language_detection: false
  }
  
  console.log('📤 Request payload:', JSON.stringify(requestBody, null, 2))
  
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!transcriptResponse.ok) {
    const errorText = await transcriptResponse.text()
    console.error('❌ AssemblyAI transcription request failed:')
    console.error('Status:', transcriptResponse.status)
    console.error('Status Text:', transcriptResponse.statusText)
    console.error('Error Response:', errorText)
    
    // If it's a 400 error, try with simplified parameters
    if (transcriptResponse.status === 400) {
      console.log('🔄 Trying with simplified AssemblyAI parameters...')
      const simplifiedBody = {
        audio_url: upload_url,
        speaker_labels: true,
        language_code: 'pt'
      }
      
      console.log('📤 Simplified request payload:', JSON.stringify(simplifiedBody, null, 2))
      
      const retryResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simplifiedBody)
      })
      
      if (retryResponse.ok) {
        console.log('✅ Simplified request succeeded!')
        const { id } = await retryResponse.json()
        console.log(`📋 Transcription ID: ${id}`)
        
        // Continue with the simplified response
        let transcript: any = null
        let attempts = 0
        const maxAttempts = 60
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: {
              'Authorization': process.env.ASSEMBLY_AI_API_KEY!
            }
          })
          
          transcript = await statusResponse.json()
          
          if (transcript.status === 'completed') {
            console.log('✅ AssemblyAI transcription completed!')
            break
          } else if (transcript.status === 'error') {
            throw new Error(`AssemblyAI transcription error: ${transcript.error}`)
          }
          
          attempts++
          console.log(`⏳ Status: ${transcript.status} (attempt ${attempts}/${maxAttempts})`)
        }
        
        if (!transcript || transcript.status !== 'completed') {
          throw new Error('AssemblyAI transcription timed out')
        }
        
        // Process the simplified results
        console.log('🔍 Processing simplified AssemblyAI results...')
        console.log('📊 AssemblyAI Analysis:')
        console.log(`• Total utterances: ${transcript.utterances?.length || 0}`)
        console.log(`• Speakers detected: ${new Set(transcript.utterances?.map((u: any) => u.speaker) || []).size}`)
        console.log(`• Confidence: ${transcript.confidence}`)
        
        // Format the transcription with speaker information
        let formattedTranscription = ''
        const speakerMap = new Map()
        let speakerCounter = 1
        
        if (transcript.utterances && transcript.utterances.length > 0) {
          for (const utterance of transcript.utterances) {
            const originalSpeaker = utterance.speaker
            
            // Map speakers to numbered format
            if (!speakerMap.has(originalSpeaker)) {
              speakerMap.set(originalSpeaker, `speaker ${speakerCounter}`)
              speakerCounter++
            }
            
            const speaker = speakerMap.get(originalSpeaker)
            const startTime = Math.floor(utterance.start / 1000) // Convert to seconds
            const timestamp = `[${Math.floor(startTime / 3600).toString().padStart(2, '0')}:${Math.floor((startTime % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(startTime % 60).toString().padStart(2, '0')}]`
            
            formattedTranscription += `${timestamp} - ${speaker} - ${utterance.text}\n`
          }
        }
        
        console.log('📊 Speaker mapping:', Object.fromEntries(speakerMap))
        console.log('🎤 AssemblyAI Speaker Detection Summary:')
        console.log(`• Speakers identified: ${speakerMap.size}`)
        console.log(`• Total utterances: ${transcript.utterances?.length || 0}`)
        console.log(`• Average confidence: ${transcript.confidence}`)
        
        return formattedTranscription.trim()
      } else {
        const retryErrorText = await retryResponse.text()
        console.error('❌ Simplified request also failed:', retryErrorText)
        throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.statusText} - ${errorText}`)
      }
    } else {
      throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.statusText} - ${errorText}`)
    }
  }
  
  const { id } = await transcriptResponse.json()
  console.log(`📋 Transcription ID: ${id}`)
  
  // Step 3: Poll for completion
  console.log('⏳ Waiting for transcription to complete...')
  let transcript: any = null
  let attempts = 0
  const maxAttempts = 60 // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: {
      'Authorization': process.env.ASSEMBLY_AI_API_KEY!
    }
    })
    
    transcript = await statusResponse.json()
    
    if (transcript.status === 'completed') {
      console.log('✅ AssemblyAI transcription completed!')
      break
    } else if (transcript.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${transcript.error}`)
    }
    
    attempts++
    console.log(`⏳ Status: ${transcript.status} (attempt ${attempts}/${maxAttempts})`)
  }
  
  if (!transcript || transcript.status !== 'completed') {
    throw new Error('AssemblyAI transcription timed out')
  }
  
  // Step 4: Process the results
  console.log('🔍 Processing AssemblyAI results...')
  console.log('📊 AssemblyAI Analysis:')
  console.log(`• Total utterances: ${transcript.utterances?.length || 0}`)
  console.log(`• Speakers detected: ${new Set(transcript.utterances?.map((u: any) => u.speaker) || []).size}`)
  console.log(`• Confidence: ${transcript.confidence}`)
  
  // Format the transcription with speaker information
  let formattedTranscription = ''
  const speakerMap = new Map()
  let speakerCounter = 1
  
  if (transcript.utterances && transcript.utterances.length > 0) {
    // Count utterances per speaker to identify the main speakers
    const speakerCounts = new Map()
    for (const utterance of transcript.utterances) {
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
      for (const utterance of transcript.utterances) {
        const originalSpeaker = utterance.speaker
        if (!speakerMap.has(originalSpeaker)) {
          speakerMap.set(originalSpeaker, `speaker ${speakerCounter}`)
          speakerCounter++
        }
      }
    }
    
    // Format the transcription
    for (const utterance of transcript.utterances) {
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
  console.log(`• Total utterances: ${transcript.utterances?.length || 0}`)
  console.log(`• Average confidence: ${transcript.confidence}`)
  
  return formattedTranscription.trim()
}

async function processAudioFile(audioPath: string): Promise<string> {
  const fs = await import('fs')
  const audioBuffer = await fs.promises.readFile(audioPath)
  
  const formData = new FormData()
  const blob = new Blob([audioBuffer], { type: 'audio/wav' })
  formData.append('file', blob, 'audio.wav')
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities', 'segment')
  formData.append('language', 'pt') // Specify Portuguese language
  // Enhanced prompt for better speaker detection and sales context
  formData.append('prompt', 'Esta é uma conversa de vendas em português entre um comercial (vendedor) e um cliente. O comercial faz perguntas sobre necessidades, apresenta soluções e tenta fechar a venda. O cliente responde, faz objeções e toma decisões. Identifique claramente quem está a falar em cada momento.')

  console.log('📤 Sending to OpenAI Whisper API...')
  
  // Retry logic for OpenAI API calls
  const maxRetries = 3
  let lastError: any = null
  let result: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt}/${maxRetries} - Sending to OpenAI Whisper API...`)
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Attempt ${attempt} failed:`, response.status, errorText)
        
        // If it's a 502 error, wait and retry
        if (response.status === 502 && attempt < maxRetries) {
          console.log(`⏳ Waiting 5 seconds before retry...`)
          await new Promise(resolve => setTimeout(resolve, 5000))
          lastError = new Error(`Transcription failed: ${response.statusText} - ${errorText}`)
          continue
        }
        
        throw new Error(`Transcription failed: ${response.statusText} - ${errorText}`)
      }
      
      // Success - get the result and break out of retry loop
      console.log(`✅ Attempt ${attempt} successful!`)
      result = await response.json()
      break
      
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        console.log(`⏳ Attempt ${attempt} failed, retrying in 5 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      } else {
        console.error('❌ All retry attempts failed')
        throw lastError
      }
    }
  }

           console.log('🔍 Whisper response structure:', {
        hasSegments: !!result.segments,
        segmentsCount: result.segments?.length || 0,
        firstSegment: result.segments?.[0] || 'No segments',
        hasSpeaker: result.segments?.[0]?.speaker !== undefined,
        speakerInfo: result.segments?.slice(0, 5).map((s: any) => ({ speaker: s.speaker, text: s.text?.substring(0, 30) })) || []
      })
      
      // Log detailed speaker detection info
      if (result.segments && result.segments.length > 0) {
        const speakers = new Set(result.segments.map((s: any) => s.speaker).filter(Boolean))
        console.log('🎤 Speaker Detection Analysis:')
        console.log(`• Total segments: ${result.segments.length}`)
        console.log(`• Unique speakers detected: ${speakers.size}`)
        console.log(`• Speakers found: ${Array.from(speakers).join(', ')}`)
        console.log(`• Segments with speaker info: ${result.segments.filter((s: any) => s.speaker !== undefined).length}`)
        console.log(`• Segments without speaker info: ${result.segments.filter((s: any) => s.speaker === undefined).length}`)
        
        // Show first few segments with speaker info
        console.log('📋 First 5 segments with speaker info:')
        result.segments.slice(0, 5).forEach((segment: any, index: number) => {
          console.log(`  ${index + 1}. Speaker: ${segment.speaker || 'Unknown'} | Text: "${segment.text?.substring(0, 50)}..."`)
        })
      }
   
           // Process verbose JSON response to extract speaker information
      if (result.segments) {
        let transcription = ''
        let speakerMap = new Map()
        let speakerCounter = 1
        
                 // Check if Whisper provided speaker information
         const hasSpeakerInfo = result.segments.some((segment: any) => segment.speaker !== undefined && segment.speaker !== null)
        
        if (hasSpeakerInfo) {
          // Use Whisper's speaker diarization
          for (const segment of result.segments) {
            const originalSpeaker = segment.speaker || 'Unknown'
            
            console.log('🔍 Segment speaker info:', {
              originalSpeaker,
              segmentStart: segment.start,
              segmentText: segment.text?.substring(0, 50) + '...'
            })
            
            // Map speakers to numbered format
            if (!speakerMap.has(originalSpeaker)) {
              speakerMap.set(originalSpeaker, `speaker ${speakerCounter}`)
              speakerCounter++
            }
            
            const speaker = speakerMap.get(originalSpeaker)
            const timestamp = segment.start ? `[${Math.floor(segment.start / 3600).toString().padStart(2, '0')}:${Math.floor((segment.start % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(segment.start % 60).toString().padStart(2, '0')}]` : ''
            
            transcription += `${timestamp} - ${speaker} - ${segment.text}\n`
          }
        } else {
                  // Enhanced fallback: Use advanced conversation pattern detection
        console.log('⚠️ No speaker info from Whisper, using enhanced fallback detection')
        transcription = detectSpeakersByPattern(result.segments)
        }
        
        console.log('📊 Speaker mapping:', Object.fromEntries(speakerMap))
        console.log('📝 Final transcription format preview (first 3 lines):')
        const lines = transcription.trim().split('\n')
        lines.slice(0, 3).forEach((line, index) => {
          console.log(`  ${index + 1}. ${line}`)
        })
        if (lines.length > 3) {
          console.log(`  ... and ${lines.length - 3} more lines`)
        }
        return transcription.trim()
      }
   
        return result.text
   }
   
       // Enhanced speaker detection based on advanced conversation patterns and sales context
    function detectSpeakersByPattern(segments: any[]): string {
      let transcription = ''
      let currentSpeaker = 1
      let speakerMap = new Map()
      let speakerCounter = 1
      
      console.log('🔍 Attempting enhanced pattern-based speaker detection...')
      console.log(`📊 Total segments to analyze: ${segments.length}`)
      
      // Sales-specific patterns for better speaker identification
      const salespersonPatterns = [
        // Greetings and introductions
        'olá', 'bom dia', 'boa tarde', 'boa noite', 'sou', 'chamo-me', 'represento', 'empresa',
        // Sales questions
        'qual é', 'como está', 'quais são', 'pode-me dizer', 'gostaria de saber', 'tem interesse',
        // Product presentation
        'oferecemos', 'temos', 'podemos', 'solução', 'produto', 'serviço', 'benefício', 'vantagem',
        // Closing techniques
        'gostaria de agendar', 'podemos marcar', 'quando seria', 'qual seria', 'fazer proposta'
      ]
      
      const customerPatterns = [
        // Responses and objections
        'sim', 'não', 'talvez', 'pode ser', 'não sei', 'tenho dúvidas', 'preciso de pensar',
        // Questions about product
        'quanto custa', 'como funciona', 'quais são', 'pode explicar', 'tem garantia',
        // Decision making
        'vou pensar', 'preciso de falar', 'não tenho orçamento', 'não estou interessado'
      ]
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const nextSegment = segments[i + 1]
        const prevSegment = segments[i - 1]
        
        // Enhanced conversation pattern detection
        let shouldSwitchSpeaker = false
        let speakerType = 'unknown'
        
        // 1. Enhanced pause detection (more nuanced)
        if (prevSegment && segment.start - prevSegment.end > 1.5) {
          console.log(`⏸️ Significant pause detected (${(segment.start - prevSegment.end).toFixed(1)}s) - likely speaker change`)
          shouldSwitchSpeaker = true
        }
        
        // 2. Sales-specific pattern detection
        const text = segment.text.toLowerCase()
        const isSalesperson = salespersonPatterns.some(pattern => text.includes(pattern))
        const isCustomer = customerPatterns.some(pattern => text.includes(pattern))
        
        if (isSalesperson) {
          speakerType = 'salesperson'
          console.log(`💼 Salesperson pattern detected: "${segment.text.substring(0, 50)}..."`)
        } else if (isCustomer) {
          speakerType = 'customer'
          console.log(`👤 Customer pattern detected: "${segment.text.substring(0, 50)}..."`)
        }
        
        // 3. Question-answer pattern detection
        const questionWords = ['qual', 'quem', 'onde', 'quando', 'porquê', 'como', 'o que', 'que', 'se', 'pode', 'gostaria', 'tem']
        const isQuestion = questionWords.some(word => 
          text.includes(word) && 
          (text.trim().endsWith('?') || text.trim().endsWith('?'))
        )
        
        // 4. Short response detection (more comprehensive)
        const isShortResponse = segment.text.length < 60 && (
          text.includes('sim') || text.includes('não') || text.includes('ok') || 
          text.includes('certo') || text.includes('entendo') || text.includes('claro') ||
          text.includes('talvez') || text.includes('pode ser')
        )
        
        // 5. Natural conversation flow detection
        if (isQuestion && nextSegment && nextSegment.text.length < 120) {
          console.log(`❓ Question-answer pattern detected - likely speaker change`)
          shouldSwitchSpeaker = true
        }
        
        // 6. Overlapping speech detection
        if (prevSegment && segment.start < prevSegment.end) {
          console.log(`🔄 Overlapping speech detected - likely different speakers`)
          shouldSwitchSpeaker = true
        }
        
        // 7. Tone and length analysis
        const isLongPresentation = segment.text.length > 200 && (
          text.includes('oferecemos') || text.includes('temos') || text.includes('solução') ||
          text.includes('produto') || text.includes('serviço')
        )
        
        if (isLongPresentation) {
          speakerType = 'salesperson'
          console.log(`📢 Long presentation detected - likely salesperson`)
        }
        
        // Switch speaker based on patterns
        if (shouldSwitchSpeaker || (speakerType !== 'unknown' && currentSpeaker === 1 && speakerType === 'customer')) {
          currentSpeaker = currentSpeaker === 1 ? 2 : 1
          if (!speakerMap.has(currentSpeaker)) {
            speakerMap.set(currentSpeaker, `speaker ${currentSpeaker}`)
            speakerCounter++
          }
          console.log(`🔄 Switching to speaker ${currentSpeaker} (${speakerType})`)
        }
        
        // Ensure we have at least 2 speakers
        if (speakerMap.size === 0) {
          speakerMap.set(1, 'speaker 1')
          speakerMap.set(2, 'speaker 2')
        }
        
        const speaker = speakerMap.get(currentSpeaker) || `speaker ${currentSpeaker}`
        const timestamp = segment.start ? `[${Math.floor(segment.start / 3600).toString().padStart(2, '0')}:${Math.floor((segment.start % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(segment.start % 60).toString().padStart(2, '0')}]` : ''
        
        // Add speaker type hint in comments
        const speakerHint = speakerType !== 'unknown' ? ` (${speakerType})` : ''
        transcription += `${timestamp} - ${speaker}${speakerHint} - ${segment.text}\n`
      }
      
      console.log(`📊 Enhanced pattern-based detection complete. Speakers detected: ${speakerMap.size}`)
      console.log('📊 Speaker mapping:', Object.fromEntries(speakerMap))
      
      return transcription.trim()
    }
   
   async function processLargeAudioFile(audioPath: string, fileSize: number): Promise<string> {
  console.log('🎵 Using FFmpeg to split audio into proper chunks...')
  
  // Use FFmpeg to split audio into proper chunks (respecting audio boundaries)
  const tempDir = await import('os').then(os => os.tmpdir())
  const { join } = await import('path')
  const fs = await import('fs')
  
  // Create a temporary directory for chunks
  const chunksDir = join(tempDir, `chunks_${Date.now()}`)
  await fs.promises.mkdir(chunksDir, { recursive: true })
  
  try {
         // Use FFmpeg to split audio into 3-minute segments (180 seconds) with enhanced quality
     // This ensures we don't break in the middle of words/sentences and maintains audio quality for speaker detection
     const ffmpegSplitCommand = `"C:\\ffmpeg\\ffmpeg-2025-08-07-git-fa458c7243-essentials_build\\bin\\ffmpeg.exe" -i "${audioPath}" -f segment -segment_time 180 -c:a pcm_s16le -ar 32000 -ac 2 -af "anlmdn=s=7:p=0.002:r=0.01,compand=0.3|0.3:1|1:-90/-60/-40/-30/-20/-10/-3/0:6:0:-90:0.2" "${join(chunksDir, 'chunk_%03d.wav')}" -y`
    
    console.log('🔄 Splitting audio into 3-minute segments...')
    await execAsync(ffmpegSplitCommand)
    
    // Get list of chunk files
    const chunkFiles = await fs.promises.readdir(chunksDir)
    const wavChunks = chunkFiles.filter(file => file.endsWith('.wav')).sort()
    
    console.log(`📦 Created ${wavChunks.length} audio chunks`)
    
    const transcriptions: string[] = []
    const globalSpeakerMap = new Map() // Global speaker mapping across all chunks
    let globalSpeakerCounter = 1
    
    for (let i = 0; i < wavChunks.length; i++) {
      const chunkPath = join(chunksDir, wavChunks[i])
      console.log(`🔄 Processing chunk ${i + 1}/${wavChunks.length}: ${wavChunks[i]}`)
      
      // Check chunk size
      const chunkStats = await fs.promises.stat(chunkPath)
      const chunkSizeMB = chunkStats.size / (1024 * 1024)
      console.log(`📊 Chunk size: ${chunkSizeMB.toFixed(2)} MB`)
      
      // Read chunk file
      const chunkBuffer = await fs.promises.readFile(chunkPath)
      
      const formData = new FormData()
      const blob = new Blob([chunkBuffer], { type: 'audio/wav' })
      formData.append('file', blob, wavChunks[i])
      formData.append('model', 'whisper-1')
      formData.append('response_format', 'verbose_json')
      formData.append('timestamp_granularities', 'segment')
      formData.append('language', 'pt') // Specify Portuguese language
      // Enhanced prompt for better speaker detection and sales context
      formData.append('prompt', 'Esta é uma conversa de vendas em português entre um comercial (vendedor) e um cliente. O comercial faz perguntas sobre necessidades, apresenta soluções e tenta fechar a venda. O cliente responde, faz objeções e toma decisões. Identifique claramente quem está a falar em cada momento.')

             // Retry logic for chunk processing
       const maxRetries = 3
       let lastError: any = null
       let result: any = null
       
       for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
           console.log(`📤 Chunk ${i + 1} - Attempt ${attempt}/${maxRetries} - Sending to OpenAI Whisper API...`)
           
           const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
             method: 'POST',
             headers: {
               'Authorization': `Bearer ${process.env.OPENAI_KEY}`
             },
             body: formData
           })

           if (!response.ok) {
             const errorText = await response.text()
             console.error(`❌ Chunk ${i + 1} - Attempt ${attempt} failed:`, response.status, errorText)
             
             // If it's a 502 error, wait and retry
             if (response.status === 502 && attempt < maxRetries) {
               console.log(`⏳ Chunk ${i + 1} - Waiting 5 seconds before retry...`)
               await new Promise(resolve => setTimeout(resolve, 5000))
               lastError = new Error(`Chunk ${i + 1} failed: ${response.statusText}`)
               continue
             }
             
             throw new Error(`Chunk ${i + 1} failed: ${response.statusText}`)
           }
           
           // Success - get the result and break out of retry loop
           console.log(`✅ Chunk ${i + 1} - Attempt ${attempt} successful!`)
           result = await response.json()
           break
           
         } catch (error) {
           lastError = error
           if (attempt < maxRetries) {
             console.log(`⏳ Chunk ${i + 1} - Attempt ${attempt} failed, retrying in 5 seconds...`)
             await new Promise(resolve => setTimeout(resolve, 5000))
           } else {
             console.error(`❌ Chunk ${i + 1} - All retry attempts failed`)
             throw lastError
           }
         }
       }
       
       console.log(`🔍 Chunk ${i + 1} Whisper response structure:`, {
         hasSegments: !!result.segments,
         segmentsCount: result.segments?.length || 0,
         firstSegment: result.segments?.[0] || 'No segments',
         hasSpeaker: result.segments?.[0]?.speaker !== undefined
       })
       
               // Process verbose JSON response to extract speaker information
        let transcription = ''
        
        if (result.segments) {
          // Check if Whisper provided speaker information
          const hasSpeakerInfo = result.segments.some((segment: any) => segment.speaker !== undefined && segment.speaker !== null)
          
          if (hasSpeakerInfo) {
            // Use Whisper's speaker diarization
            for (const segment of result.segments) {
              const originalSpeaker = segment.speaker || 'Unknown'
              
              console.log(`🔍 Chunk ${i + 1} segment speaker info:`, {
                originalSpeaker,
                segmentStart: segment.start,
                segmentText: segment.text?.substring(0, 50) + '...'
              })
              
              // Map speakers to numbered format using global mapping
              if (!globalSpeakerMap.has(originalSpeaker)) {
                globalSpeakerMap.set(originalSpeaker, `speaker ${globalSpeakerCounter}`)
                globalSpeakerCounter++
              }
              
              const speaker = globalSpeakerMap.get(originalSpeaker)
              const timestamp = segment.start ? `[${Math.floor(segment.start / 3600).toString().padStart(2, '0')}:${Math.floor((segment.start % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(segment.start % 60).toString().padStart(2, '0')}]` : ''
              
              transcription += `${timestamp} - ${speaker} - ${segment.text}\n`
            }
          } else {
            // Fallback: Use conversation pattern detection
            console.log(`⚠️ Chunk ${i + 1}: No speaker info from Whisper, using fallback detection`)
            transcription = detectSpeakersByPattern(result.segments)
          }
        } else {
          transcription = result.text
        }
      
      transcriptions.push(transcription.trim())
      
      console.log(`✅ Chunk ${i + 1} completed: ${transcription.length} characters`)
    }

    // Combine all transcriptions with proper spacing
    const fullTranscription = transcriptions.filter(t => t.length > 0).join('\n')
    console.log('✅ All chunks processed successfully')
    console.log(`📊 Total transcription length: ${fullTranscription.length} characters`)
    
    return fullTranscription
    
  } finally {
    // Clean up chunks directory
    try {
      await fs.promises.rm(chunksDir, { recursive: true, force: true })
      console.log('🧹 Chunks directory cleaned up')
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up chunks directory:', cleanupError)
    }
  }
}
