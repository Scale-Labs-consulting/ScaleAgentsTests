// Test endpoint to verify blob storage URLs
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName') || 'Vendas por chamada telefónica.pdf'
    
    console.log(`\n🧪 ===== BLOB URL TEST START =====`)
    console.log(`📄 Testing file: ${fileName}`)
    
    const blobUrl = `https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/${fileName}`
    
    console.log(`🔗 URL: ${blobUrl}`)
    
    // Test the URL
    const response = await fetch(blobUrl, {
      method: 'HEAD', // Just check if file exists
      headers: {
        'Accept': 'application/pdf, text/plain, application/octet-stream'
      }
    })
    
    console.log(`📡 HTTP Response: ${response.status} ${response.statusText}`)
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`)
    console.log(`📊 Content-Length: ${response.headers.get('content-length')}`)
    
    const result = {
      success: response.ok,
      fileName,
      url: blobUrl,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      timestamp: new Date().toISOString()
    }
    
    console.log(`🧪 ===== BLOB URL TEST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Blob URL test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
