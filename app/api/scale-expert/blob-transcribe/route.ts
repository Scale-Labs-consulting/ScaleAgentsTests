import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const { blobUrl, fileName, userId, accessToken, salesCallId } = await request.json()

    console.log('🎙️ Starting transcription for scale expert blob:', {
      fileName,
      blobUrl,
      userId,
      salesCallId
    })

    if (!blobUrl || !fileName || !userId || !accessToken || !salesCallId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Determine file type from extension
    const fileExtension = fileName.toLowerCase().split('.').pop()
    const isAudioVideo = ['mp4', 'mp3', 'wav', 'avi', 'mov', 'm4a', 'aac', 'ogg'].includes(fileExtension || '')
    const isTextFile = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(fileExtension || '')
    const isDocumentFile = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension || '')

    console.log('📁 File type detection:', { fileName, fileExtension, isAudioVideo, isTextFile, isDocumentFile })

    // Handle text files differently - read content directly
    if (isTextFile) {
      console.log('📄 Processing text file directly...')
      
      const fileResponse = await fetch(blobUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download text file: ${fileResponse.statusText}`)
      }

      const textContent = await fileResponse.text()
      console.log('✅ Text file content extracted:', textContent.length, 'characters')

      // Delete the file from Vercel Blob to save storage costs
      try {
        console.log('🗑️ Deleting text file from Vercel Blob to save storage costs...')
        await del(blobUrl)
        console.log('✅ Text file deleted from Vercel Blob successfully')
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete blob file:', deleteError)
      }

      return NextResponse.json({
        success: true,
        transcription: textContent,
        message: 'Text file content extracted successfully for scale expert'
      })
    }

    // Handle document files (PDF, Word, Excel, PowerPoint)
    if (isDocumentFile) {
      console.log('📄 Processing document file for text extraction...')
      
      try {
        // Import the PDF utils
        const { extractTextFromURL } = await import('@/lib/pdf-utils')
        
        // Extract text content from the document
        const textContent = await extractTextFromURL(blobUrl)
        
        if (textContent && textContent.trim()) {
          console.log('✅ Document text extracted successfully:', textContent.length, 'characters')
          
          // Store the document in the database for future reference
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          // Get user ID from the request body
          const { userId } = await request.json().catch(() => ({}))
          
          if (userId) {
            try {
              const { data: document, error: dbError } = await supabase
                .from('uploaded_documents')
                .insert({
                  user_id: userId,
                  file_name: fileName,
                  file_url: blobUrl,
                  file_type: fileExtension,
                  extracted_text: textContent,
                  created_at: new Date().toISOString()
                })
                .select()
                .single()

              if (dbError) {
                console.warn('⚠️ Failed to store document in database:', dbError)
              } else {
                console.log('✅ Document stored in database:', document.id)
              }
            } catch (dbError) {
              console.warn('⚠️ Database error (non-critical):', dbError)
            }
          }

          return NextResponse.json({
            success: true,
            transcription: textContent,
            message: 'Document content extracted successfully for scale expert',
            documentType: fileExtension
          })
        } else {
          console.warn('⚠️ No text content extracted from document')
          return NextResponse.json({
            success: true,
            transcription: `Document file (${fileExtension}) uploaded but no text content could be extracted. This might be an image-based document or a scanned file.`,
            message: 'Document uploaded but text extraction failed',
            documentType: fileExtension
          })
        }
      } catch (extractionError) {
        console.error('❌ Document text extraction error:', extractionError)
        return NextResponse.json({
          success: true,
          transcription: `Document file (${fileExtension}) uploaded but text extraction failed: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`,
          message: 'Document uploaded but text extraction failed',
          documentType: fileExtension
        })
      }
    }

    // For audio/video files, use AssemblyAI
    if (!isAudioVideo) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload audio/video files (MP4, MP3, etc.), text files (TXT, MD, etc.), or document files (PDF, Word, Excel, PowerPoint).' },
        { status: 400 }
      )
    }

    // Check if AssemblyAI API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error('❌ AssemblyAI API key not configured')
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('🔄 Processing audio/video from Vercel Blob...')

    // Download the file from Vercel Blob
    const fileResponse = await fetch(blobUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const fileBlob = new Blob([fileBuffer])

    // Upload to AssemblyAI for transcription
    console.log('📤 Uploading to AssemblyAI...')
    
    // Create FormData for AssemblyAI upload
    const formData = new FormData()
    formData.append('file', fileBlob, fileName)

    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ AssemblyAI upload error:', errorText)
      throw new Error(`AssemblyAI upload failed: ${uploadResponse.statusText}`)
    }

    const uploadResult = await uploadResponse.json()
    const audioUrl = uploadResult.upload_url

    console.log('✅ File uploaded to AssemblyAI:', audioUrl)

    // Start transcription
    console.log('🎙️ Starting AssemblyAI transcription...')
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'pt',
        speaker_labels: true
      })
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('❌ AssemblyAI transcription error:', errorText)
      throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.statusText}`)
    }

    const transcriptResult = await transcriptResponse.json()
    const transcriptId = transcriptResult.id

    console.log('✅ Transcription started, ID:', transcriptId)

    // Poll for completion
    let transcription = ''
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY!
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`)
      }

      const statusResult = await statusResponse.json()
      console.log(`📊 Transcription status (attempt ${attempts}):`, statusResult.status)

      if (statusResult.status === 'completed') {
        // Format transcription with speaker diarization
        if (statusResult.utterances && statusResult.utterances.length > 0) {
          transcription = statusResult.utterances.map((utterance: any) => {
            const startTime = Math.floor(utterance.start / 1000)
            const minutes = Math.floor(startTime / 60)
            const seconds = startTime % 60
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            return `Speaker ${utterance.speaker} (${timeStr}) - ${utterance.text}`
          }).join('\n\n')
        } else {
          transcription = statusResult.text
        }
        console.log('✅ Transcription completed with speaker diarization:', transcription.length, 'characters')
        break
      } else if (statusResult.status === 'error') {
        throw new Error(`Transcription failed: ${statusResult.error}`)
      }
    }

    if (!transcription) {
      throw new Error('Transcription timed out')
    }

    console.log('✅ Transcription completed for scale expert')

    // Delete the file from Vercel Blob to save storage costs
    try {
      console.log('🗑️ Deleting file from Vercel Blob to save storage costs...')
      await del(blobUrl)
      console.log('✅ File deleted from Vercel Blob successfully')
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete blob file:', deleteError)
      // Don't fail the entire process if blob deletion fails
      // The file will eventually be cleaned up by Vercel's retention policies
    }

    return NextResponse.json({
      success: true,
      transcription: transcription,
      message: 'Transcription completed successfully for scale expert'
    })

  } catch (error) {
    console.error('❌ Scale expert blob transcription error:', error)
    return NextResponse.json(
      { error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
