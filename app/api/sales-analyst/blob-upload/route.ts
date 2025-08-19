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

    // Upload directly to Supabase Storage (which handles large files)
    const storageFileName = `${userId}/${Date.now()}-${file.name}`
    console.log(`Uploading to Supabase Storage: ${storageFileName}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sales-calls')
      .upload(storageFileName, file)

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
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_url: publicUrl,
      file_path: storageFileName,
      file_size: file.size,
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

    return NextResponse.json({
      success: true,
      salesCall: salesCall
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
