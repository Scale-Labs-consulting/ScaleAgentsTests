// Test endpoint to verify blob storage accessibility
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n🧪 ===== BLOB STORAGE TEST START =====`)
    
    // Test 1: Check if the base URL is accessible
    const baseUrl = 'https://scale-agents-testemunhos.public.blob.vercel-storage.com'
    console.log(`🔗 Testing base URL: ${baseUrl}`)
    
    try {
      const baseResponse = await fetch(baseUrl, { method: 'HEAD' })
      console.log(`📡 Base URL Response: ${baseResponse.status} ${baseResponse.statusText}`)
    } catch (error) {
      console.log(`❌ Base URL Error:`, error)
    }
    
    // Test 2: Check if the folder is accessible
    const folderUrl = 'https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/'
    console.log(`🔗 Testing folder URL: ${folderUrl}`)
    
    try {
      const folderResponse = await fetch(folderUrl, { method: 'HEAD' })
      console.log(`📡 Folder URL Response: ${folderResponse.status} ${folderResponse.statusText}`)
    } catch (error) {
      console.log(`❌ Folder URL Error:`, error)
    }
    
    // Test 3: Try a simple file name (no special characters)
    const simpleFileName = 'test.txt'
    const simpleUrl = `https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/${simpleFileName}`
    console.log(`🔗 Testing simple file URL: ${simpleUrl}`)
    
    try {
      const simpleResponse = await fetch(simpleUrl, { method: 'HEAD' })
      console.log(`📡 Simple file Response: ${simpleResponse.status} ${simpleResponse.statusText}`)
    } catch (error) {
      console.log(`❌ Simple file Error:`, error)
    }
    
    // Test 4: Try with different headers
    const testFileName = 'Mindset.pdf'
    const testUrl = `https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/${testFileName}`
    console.log(`🔗 Testing with different headers: ${testUrl}`)
    
    try {
      const response1 = await fetch(testUrl, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      console.log(`📡 With User-Agent Response: ${response1.status} ${response1.statusText}`)
    } catch (error) {
      console.log(`❌ With User-Agent Error:`, error)
    }
    
    // Test 5: Try GET instead of HEAD
    try {
      const response2 = await fetch(testUrl, { 
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, text/plain, application/octet-stream'
        }
      })
      console.log(`📡 GET Response: ${response2.status} ${response2.statusText}`)
      if (response2.ok) {
        const contentLength = response2.headers.get('content-length')
        const contentType = response2.headers.get('content-type')
        console.log(`📊 Content-Length: ${contentLength}`)
        console.log(`📊 Content-Type: ${contentType}`)
      }
    } catch (error) {
      console.log(`❌ GET Error:`, error)
    }
    
    const result = {
      success: true,
      baseUrl,
      folderUrl,
      testUrl,
      timestamp: new Date().toISOString()
    }
    
    console.log(`🧪 ===== BLOB STORAGE TEST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Blob storage test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
