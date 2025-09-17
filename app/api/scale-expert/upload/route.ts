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

    // Validate file type - expanded to include business documents, images, and binary data
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
      'text/xml',
      // Image files (for visual analysis)
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/ico',
      // Binary data files
      'application/octet-stream'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', { 
        fileType: file.type, 
        allowedTypes: allowedTypes 
      })
      return NextResponse.json(
        { error: 'Invalid file type. Supported types: audio, video, PDF, Word, Excel, PowerPoint, text files, CSV, JSON, XML, images (PNG, JPEG, GIF, WebP, SVG, BMP, TIFF), and binary data files.' },
        { status: 400 }
      )
    }

    // Determine file category
    const isAudioVideo = file.type.startsWith('audio/') || file.type.startsWith('video/')
    const isBinaryData = file.type === 'application/octet-stream'
    
    // For binary data files, try to detect actual file type from extension
    let detectedFileType = file.type
    if (isBinaryData) {
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const extensionToMimeType: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'mp4': 'video/mp4',
        'avi': 'video/avi',
        'mov': 'video/quicktime',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'ico': 'image/ico',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'dat': 'application/octet-stream',
        'bin': 'application/octet-stream',
        'exe': 'application/x-msdownload',
        'dll': 'application/x-msdownload'
      }
      
      if (fileExtension && extensionToMimeType[fileExtension]) {
        detectedFileType = extensionToMimeType[fileExtension]
        console.log('🔍 Detected file type from extension:', {
          originalType: file.type,
          detectedType: detectedFileType,
          extension: fileExtension
        })
      }
    }

    // File size validation removed - all plans can upload any file size

    console.log('📁 Processing file:', { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      userId,
      isAudioVideo,
      isBinaryData
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

    // Determine file category and processing approach based on detected type
    const isDetectedAudioVideo = detectedFileType.startsWith('audio/') || detectedFileType.startsWith('video/')
    const isDetectedDocument = detectedFileType.startsWith('application/pdf') || 
                              detectedFileType.startsWith('application/msword') ||
                              detectedFileType.startsWith('application/vnd.openxmlformats-officedocument') ||
                              detectedFileType.startsWith('text/') ||
                              detectedFileType.startsWith('application/json') ||
                              detectedFileType.startsWith('application/xml')
    const isDetectedImage = detectedFileType.startsWith('image/')
    
    const isSalesCall = isAudioVideo || isDetectedAudioVideo
    const isDocument = isDetectedDocument
    const isImage = isDetectedImage
    const isDataFile = isBinaryData && !isDetectedAudioVideo && !isDetectedDocument && !isDetectedImage

    console.log('📊 File classification:', {
      originalType: file.type,
      detectedType: detectedFileType,
      isAudioVideo,
      isDetectedAudioVideo,
      isSalesCall,
      isDocument,
      isImage,
      isDataFile,
      isBinaryData
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

    } else if (isDocument) {
      // Handle as business document - use blob-transcribe for processing
      console.log('📄 Processing business document for text extraction...')
      
      try {
        // Use the blob-transcribe route for document processing
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const transcribeUrl = `${baseUrl}/api/scale-expert/blob-transcribe`
        
        const transcribeResponse = await fetch(transcribeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blobUrl: blob.url,
            fileName: originalFileName,
            userId: userId
          })
        })

        console.log('📥 Document processing response status:', transcribeResponse.status)
        
        if (!transcribeResponse.ok) {
          const errorText = await transcribeResponse.text()
          console.warn('⚠️ Document processing failed:', errorText)
          
          return NextResponse.json({
            success: true,
            fileUrl: blob.url,
            fileType: 'document',
            extractedText: null,
            message: 'Document uploaded but processing failed'
          })
        } else {
          const transcribeData = await transcribeResponse.json()
          console.log('✅ Document processed successfully:', transcribeData)
          
          return NextResponse.json({
            success: true,
            fileUrl: blob.url,
            fileType: 'document',
            extractedText: transcribeData.transcription?.substring(0, 1000) + '...', // Preview for frontend
            fullTextLength: transcribeData.transcription?.length || 0,
            documentType: transcribeData.documentType,
            message: 'Document uploaded and processed successfully'
          })
        }
      } catch (processingError) {
        console.error('❌ Document processing error:', processingError)
        return NextResponse.json({
          success: true,
          fileUrl: blob.url,
          fileType: 'document',
          extractedText: null,
          message: 'Document uploaded but processing failed'
        })
      }
    } else if (isImage) {
      // Handle as image file - store in database for analysis
      console.log('🖼️ Processing image file for visual analysis...')
      
      try {
        // Create database record for the image file
        const { data: imageFile, error: dbError } = await supabase
          .from('uploaded_documents')
          .insert({
            user_id: userId,
            file_name: originalFileName,
            file_type: detectedFileType, // Use detected file type
            file_url: blob.url,
            file_size: file.size,
            extracted_text: null, // Images don't have extractable text
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

        console.log('✅ Image file database record created:', imageFile.id)

        return NextResponse.json({
          success: true,
          fileUrl: blob.url,
          fileType: 'image',
          documentId: imageFile.id,
          originalFileName: originalFileName,
          fileSize: file.size,
          message: 'Image uploaded successfully. The Scale Expert can analyze this image for visual content, charts, diagrams, screenshots, and other visual business information.'
        })
      } catch (processingError) {
        console.error('❌ Image file processing error:', processingError)
        return NextResponse.json({
          success: true,
          fileUrl: blob.url,
          fileType: 'image',
          originalFileName: originalFileName,
          fileSize: file.size,
          message: 'Image uploaded but processing failed'
        })
      }
    } else if (isDataFile) {
      // Handle as binary data file - store in database for analysis
      console.log('📊 Processing binary data file...')
      
      try {
        // Create database record for the data file
        const { data: dataFile, error: dbError } = await supabase
          .from('uploaded_documents')
          .insert({
            user_id: userId,
            file_name: originalFileName,
            file_type: detectedFileType, // Use detected file type instead of original
            file_url: blob.url,
            file_size: file.size,
            extracted_text: null, // Binary data cannot be extracted as text
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

        console.log('✅ Binary data file database record created:', dataFile.id)

        return NextResponse.json({
          success: true,
          fileUrl: blob.url,
          fileType: 'data',
          documentId: dataFile.id,
          originalFileName: originalFileName,
          fileSize: file.size,
          message: 'Binary data file uploaded successfully. The Scale Expert can analyze this file based on its content and context.'
        })
      } catch (processingError) {
        console.error('❌ Binary data file processing error:', processingError)
        return NextResponse.json({
          success: true,
          fileUrl: blob.url,
          fileType: 'data',
          originalFileName: originalFileName,
          fileSize: file.size,
          message: 'Binary data file uploaded but processing failed'
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
