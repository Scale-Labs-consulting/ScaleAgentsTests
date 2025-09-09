import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'
import { extractTextFromURL } from '@/lib/pdf-utils'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/upload')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string

    console.log('📁 Form data received:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      userId: userId,
      hasAccessToken: !!accessToken
    })

    if (!file || !userId || !accessToken) {
      console.log('❌ Missing required data:', { 
        hasFile: !!file, 
        hasUserId: !!userId, 
        hasAccessToken: !!accessToken 
      })
      return NextResponse.json(
        { error: 'File, userId, and accessToken are required' },
        { status: 400 }
      )
    }

    // Validate file type - expanded to include business documents
    const allowedTypes = [
      // Audio/Video files (for sales calls)
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/mp3',
      'video/mp4', 'video/webm', 'video/avi', 'video/mov',
      // Document files (for business analysis)
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/json',
      'application/xml',
      'text/xml'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', { 
        fileType: file.type, 
        allowedTypes: allowedTypes 
      })
      return NextResponse.json(
        { error: 'Invalid file type. Supported types: audio, video, PDF, Word, Excel, PowerPoint, text files, CSV, JSON, XML.' },
        { status: 400 }
      )
    }

    // File size validation removed - all plans can upload any file size

    console.log('📁 Processing file:', { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      userId,
      isAudioVideo
    })

    // Convert video to audio if needed (using server-side FFmpeg like sales analyst)
    let fileToUpload = file
    let originalFileName = file.name
    
    if (file.type.startsWith('video/')) {
      console.log('🎬 Converting video to audio using server-side FFmpeg...')
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Create temporary files
        const tempDir = tmpdir()
        const inputPath = join(tempDir, `input_${Date.now()}.${file.name.split('.').pop()}`)
        const audioPath = join(tempDir, `audio_${Date.now()}.wav`)
        
        console.log('📝 Writing video file to temp directory...')
        await writeFile(inputPath, buffer)
        
        // Convert video to audio using FFmpeg with optimized settings
        console.log('🔄 Converting video to audio with enhanced settings...')
        const ffmpegCommand = `"C:\\ffmpeg\\ffmpeg-2025-08-07-git-fa458c7243-essentials_build\\bin\\ffmpeg.exe" -i "${inputPath}" -vn -acodec pcm_s16le -ar 32000 -ac 2 -af "highpass=f=80,lowpass=f=8000,anlmdn=s=7:p=0.002:r=0.01,compand=0.3|0.3:1|1:-90/-60/-40/-30/-20/-10/-3/0:6:0:-90:0.2,volume=1.5" "${audioPath}" -y`
        
        await execAsync(ffmpegCommand)
        console.log('✅ Audio conversion successful')
        
        // Verify the audio file was created and has content
        const audioStats = await import('fs').then(fs => fs.promises.stat(audioPath))
        if (audioStats.size === 0) {
          throw new Error('Audio file is empty - no audio track found')
        }
        
        // Read the converted audio file
        const audioBuffer = await import('fs').then(fs => fs.promises.readFile(audioPath))
        
        // Create a new File object from the audio buffer
        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })
        fileToUpload = new File([audioBlob], file.name.replace(/\.[^/.]+$/, '.wav'), {
          type: 'audio/wav'
        })
        
        console.log('✅ Video converted to audio:', {
          originalName: originalFileName,
          convertedName: fileToUpload.name,
          originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
          convertedSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB`
        })
        
        // Clean up temporary files
        try {
          await unlink(inputPath)
          await unlink(audioPath)
          console.log('🧹 Temporary files cleaned up')
        } catch (cleanupError) {
          console.warn('⚠️ Failed to clean up temp files:', cleanupError)
        }
        
      } catch (conversionError) {
        console.error('❌ Video conversion failed:', conversionError)
        return NextResponse.json(
          { error: `Video conversion failed: ${conversionError}` },
          { status: 500 }
        )
      }
    } else {
      console.log('📁 No conversion needed - using original file')
    }

    // Upload file to Vercel Blob
    console.log('📤 Starting Vercel Blob upload...')
    let blob
    try {
      blob = await put(fileToUpload.name, fileToUpload, {
        access: 'public',
        addRandomSuffix: true
      })

      console.log('✅ File uploaded to blob:', blob.url)
    } catch (blobError) {
      console.error('❌ Vercel Blob upload failed:', blobError)
      return NextResponse.json(
        { error: `Blob upload failed: ${blobError}` },
        { status: 500 }
      )
    }

    // Determine file category and processing approach
    const isSalesCall = isAudioVideo
    const isDocument = !isAudioVideo

    console.log('📊 File classification:', {
      isAudioVideo,
      isSalesCall,
      isDocument,
      fileType: file.type
    })

    if (isSalesCall) {
      // Handle as sales call - create database record and start transcription
      console.log('🎙️ Creating sales call database record...')
             const { data: salesCall, error: dbError } = await supabase
         .from('sales_calls')
         .insert({
           user_id: userId,
           title: originalFileName, // Use original filename
           file_url: blob.url,
           status: 'uploaded',
           created_at: new Date().toISOString()
         })
         .select()
         .single()

            if (dbError) {
        console.error('❌ Database error:', dbError)
        return NextResponse.json(
          { error: 'Failed to create database record' },
          { status: 500 }
        )
      }

      console.log('✅ Sales call database record created:', salesCall.id)

       // Start transcription process for audio/video files
       let transcription = null
       try {
         console.log('🎙️ Starting transcription process...')
         console.log('🔗 Transcription URL:', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scale-expert/transcribe`)
         console.log('📤 Transcription request payload:', {
           fileUrl: blob.url,
           salesCallId: salesCall.id,
           hasAccessToken: !!accessToken
         })
         
         // Construct absolute URL for transcription API
         const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
         const transcriptionUrl = `${baseUrl}/api/scale-expert/transcribe`
         
         const transcriptionResponse = await fetch(transcriptionUrl, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             fileUrl: blob.url,
             salesCallId: salesCall.id,
             accessToken: accessToken
           })
         })

         console.log('📥 Transcription response status:', transcriptionResponse.status)
         
         if (!transcriptionResponse.ok) {
           const errorText = await transcriptionResponse.text()
           console.warn('⚠️ Transcription request failed:', errorText)
         } else {
           const transcriptionData = await transcriptionResponse.json()
           console.log('✅ Transcription completed for Scale Expert:', transcriptionData)
           
           // Store the transcription result to return to frontend
           transcription = transcriptionData.transcription
           console.log('📝 Transcription length:', transcription?.length || 0)
         }
       } catch (transcriptionError) {
         console.warn('⚠️ Transcription error (non-critical):', transcriptionError)
       }

             const response = {
         success: true,
         salesCallId: salesCall.id,
         fileUrl: blob.url,
         fileType: 'sales_call',
         originalFileName: originalFileName,
         converted: fileToUpload !== file,
         transcription: transcription, // Include transcription result
         message: fileToUpload !== file ? 'Video converted to audio and uploaded successfully - transcription completed' : 'Sales call uploaded successfully - transcription completed'
       }
       
       console.log('📤 Sending success response:', response)
       return NextResponse.json(response)

    } else {
      // Handle as business document - extract text content immediately
      console.log('📄 Processing business document for text extraction...')
      
      try {
        // Extract text content from the document
        const textContent = await extractTextFromURL(blob.url)
        
        if (textContent && textContent.trim()) {
          console.log('✅ Document text extracted successfully')
          
          // Store the extracted text in a temporary way for the chat session
          // We'll pass this information back to the frontend
          return NextResponse.json({
            success: true,
            fileUrl: blob.url,
            fileType: 'document',
            extractedText: textContent.substring(0, 1000) + '...', // Preview for frontend
            fullTextLength: textContent.length,
            message: 'Document uploaded and processed successfully'
          })
        } else {
          console.warn('⚠️ No text content extracted from document')
          return NextResponse.json({
            success: true,
            fileUrl: blob.url,
            fileType: 'document',
            extractedText: null,
            message: 'Document uploaded but no text content could be extracted'
          })
        }
      } catch (extractionError) {
        console.error('❌ Document text extraction error:', extractionError)
        return NextResponse.json({
          success: true,
          fileUrl: blob.url,
          fileType: 'document',
          extractedText: null,
          message: 'Document uploaded but text extraction failed'
        })
      }
    }

  } catch (error) {
    console.error('💥 Upload error:', error)
    return NextResponse.json(
      { error: `Upload failed: ${error}` },
      { status: 500 }
    )
  }
}
