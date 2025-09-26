import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('🐍 Python PDF parser in Edge Runtime')
    console.log('📄 File:', file.name, 'Size:', file.size)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // For now, we'll use the JavaScript fallback since Edge Runtime doesn't support Python yet
    // This is a placeholder for when Vercel adds Python support to Edge Runtime
    console.log('⚠️ Python not yet available in Edge Runtime, using JavaScript fallback')
    
    // Import and use JavaScript PDF parser
    const { extractTextFromPDF } = await import('../../lib/pdf-utils')
    const result = await extractTextFromPDF(buffer, { max: 20 })
    
    return NextResponse.json({
      success: true,
      text: result.text,
      numpages: result.numpages,
      numrender: result.numrender,
      info: result.info,
      metadata: result.metadata,
      method: 'javascript-fallback'
    })

  } catch (error) {
    console.error('❌ Python PDF parser error:', error)
    return NextResponse.json(
      { error: 'PDF parsing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
