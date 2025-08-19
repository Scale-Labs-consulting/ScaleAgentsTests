import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string
    const isConverted = formData.get('isConverted') === 'true'
    const originalFileName = formData.get('originalFileName') as string

    console.log('📁 Blob upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      userId: userId
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

    // Validate file size (500MB limit for Vercel Blob)
    const maxSize = 500 * 1024 * 1024 // 500MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 500MB.` },
        { status: 400 }
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

    // Upload to Vercel Blob
    console.log('📤 Uploading to Vercel Blob...')
    const blob = await put(`${userId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false
    })

    console.log('✅ File uploaded to Vercel Blob:', blob.url)

    // Create database record
    const salesCallData = {
      user_id: userId,
      title: (originalFileName || file.name).replace(/\.[^/.]+$/, ''),
      file_url: blob.url,
      file_path: blob.pathname,
      file_size: file.size,
      duration: 0,
      status: 'uploaded',
      metadata: {
        isConverted,
        originalFileName: originalFileName || file.name,
        fileType: file.type,
        conversionInfo: isConverted ? {
          originalSize: file.size,
          convertedAt: new Date().toISOString()
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
      blobUrl: blob.url,
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
