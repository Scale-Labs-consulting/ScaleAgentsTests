import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDFWithPython } from '@/lib/python-pdf-utils'

export async function POST(request: NextRequest) {
  try {
    const { blobUrl, fileName, userId, accessToken } = await request.json()

    if (!blobUrl || !fileName || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('📄 Scale Expert PDF extraction request:', {
      fileName,
      userId,
      blobUrl
    })

    // Download the PDF from the blob URL
    const response = await fetch(blobUrl)
    if (!response.ok) {
      throw new Error('Failed to download PDF from blob')
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('✅ PDF downloaded, size:', buffer.length, 'bytes')

    // Use Python PyMuPDF for superior PDF text extraction
    console.log('🐍 Using Python PyMuPDF for Scale Expert PDF parsing...')
    const pdfData = await extractTextFromPDFWithPython(buffer, {
      max: 10, // Limit to 10 pages for testing
      normalizeWhitespace: true
    })

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No text content extracted from PDF',
        fileName: fileName
      }, { status: 400 })
    }

    console.log(`✅ Scale Expert PDF extraction successful: ${pdfData.text.length} characters, ${pdfData.numpages} pages`)

    return NextResponse.json({
      success: true,
      text: pdfData.text,
      fileName: fileName,
      numPages: pdfData.numpages,
      extractionMethod: 'Scale Expert PDF Parser (Python PyMuPDF)',
      metadata: {
        version: pdfData.version,
        info: pdfData.info
      }
    })

  } catch (error) {
    console.error('❌ Scale Expert PDF extraction error:', error)
    return NextResponse.json(
      { 
        error: 'Scale Expert PDF extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

