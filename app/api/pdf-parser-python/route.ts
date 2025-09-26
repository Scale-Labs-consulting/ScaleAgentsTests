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
    
    // For now, we'll return a placeholder response since Edge Runtime doesn't support
    // the Node.js dependencies required by pdf2json (node:fs, node:console, etc.)
    console.log('⚠️ Edge Runtime cannot use pdf2json due to Node.js dependencies')
    
    // Return a placeholder response that indicates the Edge Function is working
    // but cannot parse PDFs due to runtime limitations
    return NextResponse.json({
      success: true,
      text: 'PDF parsing not available in Edge Runtime due to Node.js dependencies',
      numpages: 0,
      numrender: 0,
      info: { title: 'Edge Runtime Limitation' },
      metadata: { method: 'edge-runtime-limitation' },
      method: 'edge-runtime-limitation',
      error: 'Edge Runtime cannot access Node.js file system APIs required by pdf2json'
    })

  } catch (error) {
    console.error('❌ Python PDF parser error:', error)
    return NextResponse.json(
      { error: 'PDF parsing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
