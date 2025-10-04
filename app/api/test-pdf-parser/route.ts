import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDFWithPython } from '@/lib/python-pdf-utils'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing PDF parser with URL: ${url}`)

    // Test the Python PDF parser
    const result = await extractTextFromPDFWithPython(url)

    return NextResponse.json({
      success: true,
      message: 'PDF parser test completed',
      result: {
        textLength: result.length,
        textPreview: result.substring(0, 200) + '...',
        method: 'python-pdf-parser'
      }
    })

  } catch (error) {
    console.error('❌ PDF parser test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'PDF parser test failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
