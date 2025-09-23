// Test endpoint to check specific file accessibility
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n🧪 ===== SPECIFIC FILES TEST START =====`)
    
    // List of files to test
    const filesToTest = [
      'Mindset.pdf',
      'Vendas por chamada telefónica.pdf',
      'Objeções (chamada telefónica).pdf',
      'Objeções mais Comuns (Chamada telefónica).pdf',
      'Introdução às vendas.pdf'
    ]
    
    const results = []
    
    for (const fileName of filesToTest) {
      console.log(`\n📄 Testing file: ${fileName}`)
      
      // Test with original filename
      const originalUrl = `https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/${fileName}`
      console.log(`🔗 Original URL: ${originalUrl}`)
      
      try {
        const response = await fetch(originalUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        console.log(`📡 Original Response: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          results.push({
            fileName,
            url: originalUrl,
            status: response.status,
            statusText: response.statusText,
            success: true
          })
        } else {
          // Test with encoded filename
          const encodedFileName = encodeURIComponent(fileName)
          const encodedUrl = `https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/${encodedFileName}`
          console.log(`🔗 Encoded URL: ${encodedUrl}`)
          
          const encodedResponse = await fetch(encodedUrl, { 
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          
          console.log(`📡 Encoded Response: ${encodedResponse.status} ${encodedResponse.statusText}`)
          
          results.push({
            fileName,
            originalUrl,
            encodedUrl,
            originalStatus: response.status,
            encodedStatus: encodedResponse.status,
            success: encodedResponse.ok
          })
        }
      } catch (error) {
        console.log(`❌ Error testing ${fileName}:`, error)
        results.push({
          fileName,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    }
    
    // Test if we can list files in the folder
    console.log(`\n📁 Testing folder listing...`)
    try {
      const folderUrl = 'https://scale-agents-testemunhos.public.blob.vercel-storage.com/SalesAnalystKnowledge/'
      const folderResponse = await fetch(folderUrl, { 
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      console.log(`📡 Folder Response: ${folderResponse.status} ${folderResponse.statusText}`)
      
      if (folderResponse.ok) {
        const folderContent = await folderResponse.text()
        console.log(`📄 Folder Content Preview: ${folderContent.substring(0, 1000)}`)
      }
    } catch (error) {
      console.log(`❌ Folder listing error:`, error)
    }
    
    const result = {
      success: true,
      filesTested: filesToTest.length,
      results,
      timestamp: new Date().toISOString()
    }
    
    console.log(`\n🧪 ===== SPECIFIC FILES TEST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Specific files test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
