// Debug PDF content extraction
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName') || 'Vendas por chamada telefónica.pdf'
    
    console.log(`\n🔍 ===== DEBUGGING PDF CONTENT =====`)
    console.log(`📄 File: ${fileName}`)
    
    // Fetch the PDF file
    const storeId = 'yjq0uw1vlhs3s48i'
    const encodedFileName = encodeURIComponent(fileName)
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/SalesAnalystKnowledge/${encodedFileName}`
    
    console.log(`🔗 URL: ${blobUrl}`)
    
    const response = await fetch(blobUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf, text/plain, application/octet-stream'
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch PDF: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Get the PDF buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`📊 PDF Buffer Size: ${buffer.length} bytes`)
    
    // Try different extraction methods
    const results: any = {
      fileName,
      bufferSize: buffer.length,
      methods: {}
    }
    
    // Method 1: pdf-parse
    try {
      console.log(`🔍 Trying pdf-parse...`)
      const pdfParse = await import('pdf-parse')
      const pdfData = await pdfParse.default(buffer)
      
      results.methods.pdfParse = {
        success: true,
        textLength: pdfData.text?.length || 0,
        numPages: pdfData.numpages || 0,
        rawText: pdfData.text?.substring(0, 500) || '',
        info: pdfData.info || {},
        metadata: pdfData.metadata || {}
      }
      
      console.log(`✅ pdf-parse: ${pdfData.text?.length || 0} characters, ${pdfData.numpages || 0} pages`)
    } catch (error) {
      results.methods.pdfParse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.log(`❌ pdf-parse failed:`, error)
    }
    
    // Method 2: pdf2json
    try {
      console.log(`🔍 Trying pdf2json...`)
      const { extractTextFromPDF } = await import('@/lib/pdf-utils')
      const pdfData = await extractTextFromPDF(buffer)
      
      results.methods.pdf2json = {
        success: true,
        textLength: pdfData.text?.length || 0,
        numPages: pdfData.numpages || 0,
        rawText: pdfData.text?.substring(0, 500) || '',
        info: pdfData.info || {},
        metadata: pdfData.metadata || {}
      }
      
      console.log(`✅ pdf2json: ${pdfData.text?.length || 0} characters, ${pdfData.numpages || 0} pages`)
    } catch (error) {
      results.methods.pdf2json = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.log(`❌ pdf2json failed:`, error)
    }
    
    // Method 3: Raw buffer analysis
    try {
      console.log(`🔍 Analyzing raw buffer...`)
      const bufferString = buffer.toString('utf8')
      const bufferStringLatin1 = buffer.toString('latin1')
      
      results.methods.rawBuffer = {
        utf8Length: bufferString.length,
        latin1Length: bufferStringLatin1.length,
        utf8Preview: bufferString.substring(0, 200),
        latin1Preview: bufferStringLatin1.substring(0, 200)
      }
      
      console.log(`📊 Raw buffer analysis: UTF8=${bufferString.length}, Latin1=${bufferStringLatin1.length}`)
    } catch (error) {
      results.methods.rawBuffer = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    console.log(`🔍 ===== DEBUG COMPLETE =====\n`)
    
    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`❌ Debug PDF error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
