// Test endpoint to find the correct Vercel Blob URL format
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n🧪 ===== VERCEL BLOB FORMAT TEST START =====`)
    
    const testFileName = 'Mindset.pdf'
    const encodedFileName = encodeURIComponent(testFileName)
    
    // Different possible URL formats for Vercel Blob
    const urlFormats = [
      {
        name: 'Format 1: Standard public blob URL with folder',
        url: `https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/${encodedFileName}`
      },
      {
        name: 'Format 2: Public blob URL without folder',
        url: `https://scale-agents-testemunhos.public.blob.vercel-storage.com/${encodedFileName}`
      },
      {
        name: 'Format 3: Direct blob URL with folder',
        url: `https://scale-agents-testemunhos.blob.vercel-storage.com/SalesAnalystKnowledge/${encodedFileName}`
      },
      {
        name: 'Format 4: Direct blob URL without folder',
        url: `https://scale-agents-testemunhos.blob.vercel-storage.com/${encodedFileName}`
      },
      {
        name: 'Format 5: Alternative public URL',
        url: `https://scale-agents-testemunhos.public.blob.vercel-storage.com/${testFileName}`
      },
      {
        name: 'Format 6: Alternative direct URL',
        url: `https://scale-agents-testemunhos.blob.vercel-storage.com/${testFileName}`
      }
    ]
    
    const results = []
    
    for (const format of urlFormats) {
      console.log(`\n🔗 Testing: ${format.name}`)
      console.log(`📄 URL: ${format.url}`)
      
      try {
        const response = await fetch(format.url, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          console.log(`✅ SUCCESS! This format works!`)
          results.push({
            format: format.name,
            url: format.url,
            status: response.status,
            statusText: response.statusText,
            success: true,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          })
        } else {
          console.log(`❌ Failed: ${response.status} ${response.statusText}`)
          results.push({
            format: format.name,
            url: format.url,
            status: response.status,
            statusText: response.statusText,
            success: false
          })
        }
      } catch (error) {
        console.log(`❌ Error:`, error)
        results.push({
          format: format.name,
          url: format.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    }
    
    const successfulFormats = results.filter(r => r.success)
    
    console.log(`\n📊 Test Results:`)
    console.log(`   Total formats tested: ${urlFormats.length}`)
    console.log(`   Successful formats: ${successfulFormats.length}`)
    
    if (successfulFormats.length > 0) {
      console.log(`✅ Working formats:`)
      successfulFormats.forEach(format => {
        console.log(`   - ${format.format}`)
        console.log(`     URL: ${format.url}`)
      })
    } else {
      console.log(`❌ No working formats found`)
    }
    
    const result = {
      success: true,
      testFileName,
      totalFormats: urlFormats.length,
      successfulFormats: successfulFormats.length,
      results,
      workingFormats: successfulFormats,
      timestamp: new Date().toISOString()
    }
    
    console.log(`🧪 ===== VERCEL BLOB FORMAT TEST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Vercel blob format test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
