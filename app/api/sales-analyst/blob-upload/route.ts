import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Check if Vercel Blob is configured
    const useFallback = !process.env.BLOB_READ_WRITE_TOKEN
    if (useFallback) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN not set - using Supabase Storage fallback')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string
    const isConverted = formData.get('isConverted') === 'true'
    const isTruncated = formData.get('isTruncated') === 'true'
    const originalFileName = formData.get('originalFileName') as string

    console.log('📁 Blob upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      userId: userId,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN
    })

    if (!file || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate file type (video or audio)
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Only video or audio files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (100MB limit for serverless functions)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (file.size > maxSize) {
      console.error(`❌ File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit`)
      return NextResponse.json(
        { 
          error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB for direct upload.`,
          suggestion: 'Please compress your video or use a smaller file. For larger files, consider using the chunked upload feature.'
        },
        { status: 413 }
      )
    }

    // Create authenticated Supabase client
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

    let fileUrl: string
    let filePath: string
    
    if (useFallback) {
      // Use Supabase Storage as fallback
      console.log('📤 Uploading to Supabase Storage (fallback)...')
      
      const fileName = `${userId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sales-calls')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('❌ Supabase Storage upload failed:', uploadError)
        return NextResponse.json(
          { error: `Supabase Storage upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sales-calls')
        .getPublicUrl(fileName)
      
      fileUrl = publicUrl
      filePath = fileName
      
      console.log('✅ File uploaded to Supabase Storage:', fileUrl)
    } else {
      // Use Vercel Blob
      console.log('📤 Uploading to Vercel Blob...')
      console.log('🔑 Blob token configured:', !!process.env.BLOB_READ_WRITE_TOKEN)
      
      let blob: any
      try {
        blob = await put(`${userId}/${Date.now()}-${file.name}`, file, {
          access: 'public',
          addRandomSuffix: false
        })

        fileUrl = blob.url
        filePath = blob.pathname
        
        console.log('✅ File uploaded to Vercel Blob:', fileUrl)
      } catch (blobError) {
        console.error('❌ Vercel Blob upload failed:', blobError)
        
        // Check if it's an authentication error
        if (blobError instanceof Error && blobError.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Vercel Blob authentication failed. Please check BLOB_READ_WRITE_TOKEN.' },
            { status: 500 }
          )
        }
        
        // Check if it's a configuration error
        if (blobError instanceof Error && blobError.message.includes('store')) {
          return NextResponse.json(
            { error: 'Vercel Blob store not found. Please create a blob store with "vercel blob create".' },
            { status: 500 }
          )
        }
        
        throw blobError
      }
    }

    // Create database record
    const salesCallData = {
      user_id: userId,
      agent_id: null, // Will be set when agent is created
      title: (originalFileName || file.name).replace(/\.[^/.]+$/, ''),
      file_url: fileUrl,
      file_size: file.size,
      duration_seconds: 0,
      status: 'uploaded',
      metadata: {
        isConverted,
        isTruncated,
        originalFileName: originalFileName || file.name,
        fileType: file.type,
        storageType: useFallback ? 'supabase' : 'vercel-blob',
        filePath: filePath,
        conversionInfo: isConverted ? {
          originalSize: file.size,
          convertedAt: new Date().toISOString()
        } : null,
        truncationInfo: isTruncated ? {
          originalSize: file.size,
          truncatedAt: new Date().toISOString()
        } : null
      }
    }

    console.log('📝 Creating database record:', salesCallData)

    const { data: salesCall, error: dbError } = await supabase
      .from('sales_calls')
      .insert(salesCallData)
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create database record' },
        { status: 500 }
      )
    }

    console.log('✅ Database record created:', salesCall.id)

    return NextResponse.json({
      success: true,
      salesCall: salesCall,
      blobUrl: fileUrl,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Blob upload error:', error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
