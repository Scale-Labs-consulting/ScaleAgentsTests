import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromURL, extractTextFromPDFWithPDFJS } from '@/lib/pdf-utils'

export async function POST(request: NextRequest) {
  try {
    const { url, fileName, method = 'javascript' } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      )
    }

    console.log(`📄 Testing PDF extraction from: ${url} using ${method} method`)

    let extractedText = ''
    let extractionMethod = ''

    if (method === 'pdfjs') {
      // Use PDF.js enhanced method for URL-based PDFs
      try {
        // First download the PDF from URL
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.status}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const pdfData = await extractTextFromPDFWithPDFJS(buffer, {
          max: 10, // Limit to 10 pages for testing
          normalizeWhitespace: true
        })
        
        extractedText = pdfData.text
        extractionMethod = 'PDF.js Parser (Mozilla)'
      } catch (error) {
        console.error('❌ PDF.js URL extraction error:', error)
        // Fallback to standard method
        extractedText = await extractTextFromURL(url)
        extractionMethod = 'JavaScript PDF Parser (fallback)'
      }
    } else {
      // Use standard JavaScript PDF parser
      extractedText = await extractTextFromURL(url)
      extractionMethod = method === 'scale-expert' ? 'Scale Expert PDF Parser' : 'JavaScript PDF Parser'
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No text content extracted from PDF',
          fileName: fileName || 'Unknown'
        },
        { status: 400 }
      )
    }

    console.log(`✅ PDF extraction successful: ${extractedText.length} characters using ${extractionMethod}`)

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: fileName || 'Custom PDF',
      textLength: extractedText.length,
      extractionMethod: extractionMethod,
      method: method
    })

  } catch (error) {
    console.error('❌ PDF extraction error:', error)
    return NextResponse.json(
      { 
        error: 'PDF extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}