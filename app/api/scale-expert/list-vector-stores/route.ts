import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/list-vector-stores')
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // List all vector stores
    console.log('📋 Listing vector stores...')
    const vectorStores = await openai.beta.vectorStores.list()
    
    console.log('✅ Vector stores found:', vectorStores.data.length)
    vectorStores.data.forEach((vs, index) => {
      console.log(`  ${index + 1}. ${vs.name || 'Unnamed'} (${vs.id}) - ${vs.file_counts?.total || 0} files`)
    })

    return NextResponse.json({
      success: true,
      vectorStores: vectorStores.data.map(vs => ({
        id: vs.id,
        name: vs.name,
        fileCount: vs.file_counts?.total || 0,
        created: vs.created_at,
        status: vs.status
      }))
    })

  } catch (error) {
    console.error('💥 List vector stores error:', error)
    return NextResponse.json(
      { error: `Failed to list vector stores: ${error}` },
      { status: 500 }
    )
  }
}

