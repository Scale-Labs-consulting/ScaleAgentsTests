import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string
    const fileSize = parseInt(formData.get('fileSize') as string)

    if (!chunk || !fileName || !userId) {
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

    // Create temp directory for chunks
    const tempDir = join(process.cwd(), 'temp', userId)
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    // Save chunk to temp directory
    const chunkPath = join(tempDir, `${fileName}.part${chunkIndex}`)
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
    await writeFile(chunkPath, chunkBuffer)

    // If this is the last chunk, combine all chunks
    if (chunkIndex === totalChunks - 1) {
      console.log(`Combining ${totalChunks} chunks for file: ${fileName}`)
      
      try {
        const { createReadStream, createWriteStream } = require('fs')
        const { pipeline } = require('stream/promises')
        const { readFile } = require('fs/promises')
        
        const finalPath = join(tempDir, fileName)
        const writeStream = createWriteStream(finalPath)

        // Combine all chunks using append mode
        for (let i = 0; i < totalChunks; i++) {
          const chunkPath = join(tempDir, `${fileName}.part${i}`)
          console.log(`Reading chunk ${i}: ${chunkPath}`)
          
          const readStream = createReadStream(chunkPath)
          await pipeline(readStream, writeStream, { end: false })
        }
        
        writeStream.end()
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })

        console.log(`File combined successfully: ${finalPath}`)

        // Read the combined file
        const finalFile = await readFile(finalPath)
        const fileBlob = new Blob([finalFile], { type: 'video/mp4' })
        console.log(`File blob created, size: ${fileBlob.size} bytes`)

        // Upload to Supabase Storage
        const storageFileName = `${userId}/${Date.now()}-${fileName}`
        console.log(`Uploading to Supabase: ${storageFileName}`)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sales-calls')
          .upload(storageFileName, fileBlob)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
          )
        }

        console.log('File uploaded to Supabase successfully')

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('sales-calls')
          .getPublicUrl(storageFileName)

        console.log(`Public URL: ${publicUrl}`)

        // Create database record
        const salesCallData = {
          user_id: userId,
          title: fileName.replace(/\.[^/.]+$/, ''),
          file_url: publicUrl,
          file_path: storageFileName,
          file_size: fileSize,
          duration: 0,
          status: 'uploaded'
        }

        console.log('Creating database record:', salesCallData)

        const { data: salesCall, error: dbError } = await supabase
          .from('sales_calls')
          .insert(salesCallData)
          .select()
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          await supabase.storage
            .from('sales-calls')
            .remove([storageFileName])
          
          return NextResponse.json(
            { error: 'Failed to create database record' },
            { status: 500 }
          )
        }

        console.log('Database record created successfully:', salesCall)

        // Clean up temp files
        const { rm } = require('fs/promises')
        await rm(tempDir, { recursive: true, force: true })

        return NextResponse.json({
          success: true,
          salesCall: salesCall
        })
        
      } catch (error) {
        console.error('Error combining chunks:', error)
        return NextResponse.json(
          { error: 'Failed to combine file chunks' },
          { status: 500 }
        )
      }
    }

    // Return success for chunk upload
    return NextResponse.json({
      success: true,
      chunkIndex: chunkIndex,
      message: 'Chunk uploaded successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
