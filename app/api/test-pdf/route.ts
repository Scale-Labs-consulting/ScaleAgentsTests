import { NextResponse } from 'next/server'
import { extractTextFromURL, extractTextFromPDF } from '@/lib/pdf-utils'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { url, testBuffer } = await request.json()
    
    if (testBuffer) {
      // Test direct buffer parsing
      console.log('🧪 Testing PDF extraction from buffer')
      const buffer = Buffer.from(testBuffer, 'base64')
      const result = await extractTextFromPDF(buffer)
      
      return NextResponse.json({
        success: true,
        method: 'buffer',
        textLength: result.text.length,
        textPreview: result.text.substring(0, 500),
        numPages: result.numpages,
        fullText: result.text
      })
    }
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL or testBuffer is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing PDF extraction from URL:', url)
    
    const text = await extractTextFromURL(url)
    
    return NextResponse.json({
      success: true,
      method: 'url',
      textLength: text.length,
      textPreview: text.substring(0, 500),
      fullText: text
    })
    
  } catch (error) {
    console.error('❌ Test PDF error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
