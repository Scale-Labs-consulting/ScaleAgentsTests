import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string
    const fileId = formData.get('fileId') as string

    console.log('📁 Chunked upload request received:', {
      fileName,
      chunkIndex,
      totalChunks,
      chunkSize: chunk?.size,
      userId
    })

    if (!chunk || !fileName || !userId || !accessToken || chunkIndex === undefined || totalChunks === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Check if Vercel Blob is configured
    const useFallback = !process.env.BLOB_READ_WRITE_TOKEN

    let chunkUrl: string
    
    if (useFallback) {
      // Use Supabase Storage for chunk
      const chunkFileName = `${userId}/${fileId}/chunk-${chunkIndex.toString().padStart(4, '0')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sales-calls')
        .upload(chunkFileName, chunk)
      
      if (uploadError) {
        console.error('❌ Supabase Storage chunk upload failed:', uploadError)
        return NextResponse.json(
          { error: `Chunk upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sales-calls')
        .getPublicUrl(chunkFileName)
      
      chunkUrl = publicUrl
    } else {
      // Use Vercel Blob for chunk
      const chunkFileName = `${userId}/${fileId}/chunk-${chunkIndex.toString().padStart(4, '0')}`
      
      try {
        const blob = await put(chunkFileName, chunk, {
          access: 'public',
          addRandomSuffix: false
        })
        
        chunkUrl = blob.url
      } catch (blobError) {
        console.error('❌ Vercel Blob chunk upload failed:', blobError)
        return NextResponse.json(
          { error: `Chunk upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded:`, chunkUrl)

    // If this is the last chunk, trigger file assembly
    if (chunkIndex === totalChunks - 1) {
      console.log('🎯 Last chunk received, triggering file assembly...')
      
      // Store chunk information in database for assembly
      const { data: chunkRecord, error: dbError } = await supabase
        .from('file_chunks')
        .insert({
          file_id: fileId,
          chunk_index: chunkIndex,
          chunk_url: chunkUrl,
          is_last: true,
          total_chunks: totalChunks,
          user_id: userId
        })
        .select()
        .single()

      if (dbError) {
        console.error('❌ Failed to store chunk record:', dbError)
        return NextResponse.json(
          { error: 'Failed to store chunk information' },
          { status: 500 }
        )
      }

      // Trigger assembly process
      try {
        const assemblyResponse = await fetch(`${request.nextUrl.origin}/api/sales-analyst/assemble-chunks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            fileId,
            fileName,
            userId,
            totalChunks
          })
        })

        if (!assemblyResponse.ok) {
          console.error('❌ Assembly trigger failed:', assemblyResponse.status)
        } else {
          console.log('✅ File assembly triggered successfully')
        }
      } catch (assemblyError) {
        console.error('❌ Assembly trigger error:', assemblyError)
      }
    } else {
      // Store chunk information for later assembly
      const { error: dbError } = await supabase
        .from('file_chunks')
        .insert({
          file_id: fileId,
          chunk_index: chunkIndex,
          chunk_url: chunkUrl,
          is_last: false,
          total_chunks: totalChunks,
          user_id: userId
        })

      if (dbError) {
        console.error('❌ Failed to store chunk record:', dbError)
        return NextResponse.json(
          { error: 'Failed to store chunk information' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      chunkUrl,
      isLast: chunkIndex === totalChunks - 1,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`
    })

  } catch (error) {
    console.error('❌ Chunked upload error:', error)
    return NextResponse.json(
      { error: `Chunked upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
