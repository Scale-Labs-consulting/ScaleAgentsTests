import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, fileType } = await request.json()
    
    console.log('🧪 Testing upload flow for:', { fileName, fileSize, fileType })
    
    // Check if file is too large for client-side conversion
    const isLargeFile = fileSize > 100 * 1024 * 1024 // 100MB
    const shouldConvert = fileType.startsWith('video/')
    
    let recommendations = []
    
    if (isLargeFile && shouldConvert) {
      recommendations.push('File is large - consider server-side conversion')
    }
    
    if (fileSize > 500 * 1024 * 1024) { // 500MB
      recommendations.push('File is very large - may cause timeout issues')
    }
    
    return NextResponse.json({
      fileName,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(1)}MB`,
      fileType,
      shouldConvert,
      isLargeFile,
      recommendations,
      message: 'Upload flow analysis completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test upload flow error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}
