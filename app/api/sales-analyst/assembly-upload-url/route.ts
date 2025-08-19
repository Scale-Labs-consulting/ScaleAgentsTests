import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, userId, accessToken } = await request.json()

    console.log('📥 Received parameters:', {
      fileName: typeof fileName + ': ' + fileName,
      fileSize: typeof fileSize + ': ' + fileSize,
      userId: typeof userId + ': ' + userId,
      accessToken: typeof accessToken + ': ' + (accessToken ? 'present' : 'missing')
    })

    if (!fileName || !fileSize || !userId || !accessToken) {
      console.error('❌ Missing required parameters:', {
        fileName: !!fileName,
        fileSize: !!fileSize,
        userId: !!userId,
        accessToken: !!accessToken
      })
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if Assembly AI API key is available
    if (!process.env.ASSEMBLYAI_KEY) {
      console.error('❌ Assembly AI API key not configured')
      return NextResponse.json(
        { error: 'Assembly AI API key not configured' },
        { status: 500 }
      )
    }

    console.log('🎬 Getting Assembly AI upload URL for client-side upload:', fileName)
    console.log('📏 File size:', fileSize, 'bytes')
    console.log('🔑 API Key available:', !!process.env.ASSEMBLYAI_KEY)
    console.log('🔑 API Key length:', process.env.ASSEMBLYAI_KEY?.length || 0)

    // Get upload URL from Assembly AI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: fileName,
        size: fileSize
      }),
    })

    console.log('📥 Upload URL response status:', uploadResponse.status)
    console.log('📥 Upload URL response headers:', Object.fromEntries(uploadResponse.headers.entries()))

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ Assembly AI upload URL error:', errorText)
      console.error('❌ Full error response:', errorText)

      // Try to parse the error response as JSON
      try {
        const errorJson = JSON.parse(errorText)
        console.error('❌ Parsed error:', errorJson)
      } catch (e) {
        console.error('❌ Could not parse error as JSON')
      }

      return NextResponse.json(
        { error: `Failed to get upload URL: ${uploadResponse.status} - ${errorText.substring(0, 200)}` },
        { status: 500 }
      )
    }

    const uploadData = await uploadResponse.json()
    const { upload_url } = uploadData
    console.log('✅ Upload URL obtained for client-side upload:', upload_url)

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
