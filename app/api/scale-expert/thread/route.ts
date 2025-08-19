import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/thread')
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('📝 Creating new thread for Scale Expert Agent...')

    // Create a new thread
    const thread = await openai.beta.threads.create({
      metadata: {
        type: 'scale_expert',
        created_at: new Date().toISOString()
      }
    })

    console.log('✅ Thread created successfully:', thread.id)

    return NextResponse.json({
      success: true,
      threadId: thread.id,
      message: 'Thread created successfully'
    })

  } catch (error) {
    console.error('💥 Thread creation error:', error)
    return NextResponse.json(
      { error: `Failed to create thread: ${error}` },
      { status: 500 }
    )
  }
}

