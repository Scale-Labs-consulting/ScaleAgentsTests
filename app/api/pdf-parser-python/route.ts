import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf-utils'

// Use Node.js runtime for PDF parsing (not Edge Runtime)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('🐍 PDF parser in Node.js Runtime')
    console.log('📄 File:', file.name, 'Size:', file.size)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Use the existing PDF parsing utility
    console.log('📄 Extracting text from PDF using pdf2json...')
    const pdfData = await extractTextFromPDF(buffer, {
      max: 20, // Limit to 20 pages for performance
      normalizeWhitespace: true
    })
    
    console.log(`✅ PDF extraction successful: ${pdfData.text.length} characters, ${pdfData.numpages} pages`)
    
    return NextResponse.json({
      success: true,
      text: pdfData.text,
      numpages: pdfData.numpages,
      numrender: pdfData.numrender,
      info: pdfData.info || { title: 'PDF Document' },
      metadata: {
        method: 'nodejs-pdf2json',
        filename: file.name,
        file_size: file.size
      },
      version: 'nodejs-pdf2json'
    })

  } catch (error) {
    console.error('❌ PDF parser error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'PDF parsing failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
