import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, userId, accessToken } = await request.json()

    if (!fileName || !fileSize || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if Assembly AI API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error('❌ Assembly AI API key not configured')
      return NextResponse.json(
        { error: 'Assembly AI API key not configured' },
        { status: 500 }
      )
    }

    console.log('🎬 Getting Assembly AI upload URL for:', fileName)
    console.log('📏 File size:', fileSize, 'bytes')

    // Get upload URL from Assembly AI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: fileName,
        size: fileSize
      }),
    })

    console.log('📥 Upload URL response status:', uploadResponse.status)
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ Assembly AI upload URL error:', errorText)
      return NextResponse.json(
        { error: `Failed to get upload URL: ${uploadResponse.status} - ${errorText.substring(0, 200)}` },
        { status: 500 }
      )
    }

    const uploadData = await uploadResponse.json()
    const { upload_url } = uploadData
    console.log('✅ Upload URL obtained:', upload_url)

    return NextResponse.json({
      upload_url: upload_url
    })

  } catch (error) {
    console.error('❌ Assembly AI upload URL error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
