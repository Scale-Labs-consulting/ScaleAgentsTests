import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

const ASSISTANT_ID = 'asst_eMJXppgACFR4AoMoeKQYtpWt'

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/chat')
  
  try {
    const { threadId, message, userId } = await request.json()
    
    // Check for abort signal
    const abortSignal = request.signal
    
    if (!threadId || !message) {
      return NextResponse.json(
        { error: 'Thread ID and message are required' },
        { status: 400 }
      )
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('📝 Processing message for Scale Expert Agent...')
    console.log('📊 Message details:', { threadId, messageLength: message.length, userId })

    // Add the user's message to the thread
    console.log('📤 Adding user message to thread...')
    const userMessage = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
      metadata: {
        userId: userId || 'unknown',
        timestamp: new Date().toISOString()
      }
    })

    console.log('✅ User message added:', userMessage.id)

    // Run the assistant
    console.log('🤖 Running Scale Expert Agent...')
    console.log('📊 Run creation params:', { threadId, assistantId: ASSISTANT_ID, userId })
    
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      metadata: {
        userId: userId || 'unknown',
        timestamp: new Date().toISOString()
      }
    })

    console.log('🔄 Run created:', { runId: run?.id, runStatus: run?.status, runObject: run })

    // Validate run was created successfully
    if (!run || !run.id) {
      console.error('❌ Run creation failed - invalid response:', run)
      throw new Error('Failed to create run - no run ID returned')
    }

    // Poll for completion
    let runStatus = run.status
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    console.log('🔄 Starting polling loop with:', { threadId, runId: run.id, initialStatus: runStatus })

    while (runStatus === 'queued' || runStatus === 'in_progress') {
      // Check for abort signal
      if (abortSignal.aborted) {
        console.log('🛑 Request aborted by client')
        throw new Error('Request aborted by client')
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Run timed out after 5 minutes')
      }

      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      try {
        // Validate threadId is still valid
        if (!threadId) {
          throw new Error(`ThreadId is undefined on attempt ${attempts + 1}`)
        }
        
        console.log(`🔄 Checking run status (attempt ${attempts + 1}):`, { threadId, runId: run.id })
        
        // Use list method with limit=1 to get only the most recent run efficiently
        const runs = await openai.beta.threads.runs.list(threadId, { limit: 1 })
        const runCheck = runs.data.find(r => r.id === run.id)
        
        if (!runCheck) {
          // If not found in recent runs, try with a larger limit
          const allRuns = await openai.beta.threads.runs.list(threadId, { limit: 10 })
          const foundRun = allRuns.data.find(r => r.id === run.id)
          if (!foundRun) {
            throw new Error(`Run ${run.id} not found in thread ${threadId}`)
          }
          runCheck = foundRun
        }
        
        runStatus = runCheck.status
        attempts++

        console.log(`🔄 Run status (attempt ${attempts}):`, runStatus)

        if (runStatus === 'failed') {
          throw new Error(`Run failed: ${runCheck.last_error?.message || 'Unknown error'}`)
        }

        if (runStatus === 'cancelled') {
          throw new Error('Run was cancelled')
        }
      } catch (retrieveError) {
        console.error('❌ Error retrieving run status:', retrieveError)
        console.error('❌ Debug info:', { threadId, runId: run.id, threadIdType: typeof threadId, runIdType: typeof run.id })
        throw new Error(`Failed to check run status: ${retrieveError}`)
      }
    }

    console.log('✅ Run completed with status:', runStatus)

    // Get the assistant's response
    console.log('📥 Retrieving assistant response...')
    const messages = await openai.beta.threads.messages.list(threadId)
    
    // Find the latest assistant message
    const assistantMessage = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    if (!assistantMessage) {
      throw new Error('No assistant response found')
    }

    // Extract the text content
    const responseText = assistantMessage.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text.value)
      .join('\n')

    console.log('✅ Assistant response retrieved:', responseText.substring(0, 100) + '...')

    return NextResponse.json({
      success: true,
      response: responseText,
      messageId: assistantMessage.id,
      runId: run.id,
      threadId: threadId
    })

  } catch (error) {
    console.error('💥 Chat error:', error)
    return NextResponse.json(
      { error: `Chat failed: ${error}` },
      { status: 500 }
    )
  }
}
