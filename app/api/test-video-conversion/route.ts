import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, fileType } = await request.json()
    
    console.log('🧪 Testing video conversion for:', { fileName, fileSize, fileType })
    
    // Simulate the video conversion process
    const shouldConvert = fileType.startsWith('video/')
    
    return NextResponse.json({
      shouldConvert,
      fileName,
      fileSize,
      fileType,
      message: shouldConvert ? 'Video file detected - conversion needed' : 'Audio file - no conversion needed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test video conversion error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}
