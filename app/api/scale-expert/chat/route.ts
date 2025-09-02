import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromURL } from '@/lib/pdf-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get assistant ID dynamically
async function getAssistantId() {
  try {
    // First, try to use the environment variable
    if (process.env.SCALE_EXPERT) {
      console.log('✅ Using SCALE_EXPERT environment variable')
      return process.env.SCALE_EXPERT
    }
    
    // If no environment variable, try to find existing assistant
    const assistants = await openai.beta.assistants.list()
    const scaleExpertAssistant = assistants.data.find(assistant => assistant.name === 'Scale Expert Agent')
    
    if (scaleExpertAssistant) {
      console.log('✅ Found existing Scale Expert Assistant')
      return scaleExpertAssistant.id
    }
    
    // If assistant doesn't exist, create it
    console.log('🆕 Assistant not found, creating new one...')
    const response = await fetch(`/api/scale-expert/setup-assistant`, {
      method: 'POST'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.assistantId
    }
    
    throw new Error('Failed to create assistant')
  } catch (error) {
    console.error('❌ Error getting assistant ID:', error)
    throw new Error('No assistant ID available and failed to create one')
  }
}

// Function to fetch user's sales calls with transcriptions
async function getUserSalesCalls(userId: string) {
  try {
    const { data: salesCalls, error } = await supabase
      .from('sales_calls')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5) // Limit to 5 most recent calls

    if (error) {
      console.error('❌ Error fetching sales calls:', error)
      return []
    }

    return salesCalls || []
  } catch (error) {
    console.error('❌ Error in getUserSalesCalls:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/chat')
  
  try {
    const { threadId, message, userId, uploadedFile } = await request.json()
    
    console.log('📥 Received chat request:', {
      hasThreadId: !!threadId,
      hasMessage: !!message,
      hasUserId: !!userId,
      hasUploadedFile: !!uploadedFile,
      uploadedFileDetails: uploadedFile ? {
        name: uploadedFile.name,
        type: uploadedFile.type,
        fileType: uploadedFile.fileType,
        hasUrl: !!uploadedFile.url,
        hasSalesCallId: !!uploadedFile.salesCallId
      } : null
    })
    
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

    // Fetch user's sales calls for context
    console.log('📁 Fetching user sales calls for context...')
    const salesCalls = await getUserSalesCalls(userId)
    console.log('📊 Found sales calls:', salesCalls.length)

    // Prepare enhanced message with sales calls context and uploaded files
    let enhancedMessage = message
    let fileContext = ''
    
    // Handle uploaded file if provided
    if (uploadedFile && uploadedFile.url) {
      console.log('📁 Processing uploaded file:', uploadedFile)
      
      if (uploadedFile.fileType === 'document' && uploadedFile.extractedText) {
        // Document with pre-extracted text
        fileContext = `\n\n--- Uploaded Document Analysis ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nDocument Type: Business Document\nContent:\n${uploadedFile.extractedText}\n--- End Uploaded Document ---`
        console.log('✅ Document content provided from frontend')
      } else if (uploadedFile.fileType === 'sales_call') {
        // Sales call - use transcription if provided directly from frontend
        console.log('🎙️ Processing sales call file:', uploadedFile)
        
        if (uploadedFile.extractedText) {
          // Transcription is already provided from frontend
          fileContext = `\n\n--- Uploaded Sales Call Transcription ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nTranscription:\n${uploadedFile.extractedText}\n--- End Uploaded Sales Call ---`
          console.log('✅ Sales call transcription provided from frontend')
        } else {
          // No transcription available yet
          fileContext = `\n\n--- Uploaded Sales Call ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nNote: This is a sales call that will be transcribed and analyzed. The transcription may take a few minutes to complete.\n--- End Uploaded Sales Call ---`
          console.log('⚠️ Sales call transcription not yet available')
        }
      } else {
        // Fallback: try to extract text from the uploaded file
        try {
          const fileContent = await extractTextFromURL(uploadedFile.url)
          
          if (fileContent && fileContent.trim()) {
            fileContext = `\n\n--- Uploaded File Analysis ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nContent:\n${fileContent}\n--- End Uploaded File ---`
            console.log('✅ File content extracted successfully')
          } else {
            console.log('⚠️ No text content extracted from file')
            fileContext = `\n\n--- Uploaded File ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nNote: This file could not be processed for text content. Please provide a summary or ask specific questions about this file.\n--- End Uploaded File ---`
          }
        } catch (fileError) {
          console.error('❌ Error processing uploaded file:', fileError)
          fileContext = `\n\n--- Uploaded File ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nNote: Error processing this file. Please provide a summary or ask specific questions about this file.\n--- End Uploaded File ---`
        }
      }
    }
    
    if (salesCalls.length > 0) {
      const salesCallsContext = salesCalls.map((call, index) => {
        const transcription = call.transcription || 'No transcription available'
        const date = new Date(call.created_at).toLocaleDateString('pt-PT')
        return `\n\n--- Sales Call ${index + 1} (${date}) ---\nTitle: ${call.title}\nTranscription:\n${transcription}\n--- End Sales Call ${index + 1} ---`
      }).join('\n')

      enhancedMessage = `Context: The user has ${salesCalls.length} recent sales calls available for analysis.${uploadedFile ? ' Additionally, they have uploaded a file for analysis.' : ''}

${salesCallsContext}${fileContext}

User Question: ${message}

Please analyze the sales calls above${uploadedFile ? ' and the uploaded file' : ''} and provide insights related to the user's question about scaling, growth, or business challenges.`
    } else if (uploadedFile) {
      enhancedMessage = `Context: The user has uploaded a file for analysis.${fileContext}

User Question: ${message}

Please analyze the uploaded file and provide insights related to the user's question about scaling, growth, or business challenges.`
    }

    // Note: File content is already included in the enhanced message context
    // No need to upload files to OpenAI separately
    console.log('📁 File content included in message context, no separate file upload needed')
    
    // Add the user's message to the thread
    console.log('📤 Adding enhanced user message to thread...')
    
    const messageData: any = {
      role: 'user',
      content: enhancedMessage,
      metadata: {
        userId: userId || 'unknown',
        timestamp: new Date().toISOString(),
        hasSalesCalls: (salesCalls.length > 0).toString(),
        salesCallsCount: salesCalls.length.toString(),
        hasFileAttachments: (uploadedFile ? 'true' : 'false')
      }
    }
    
    const userMessage = await openai.beta.threads.messages.create(threadId, messageData)

    console.log('✅ User message added:', userMessage.id)

    // Get assistant ID and run the assistant
    console.log('🤖 Getting assistant ID...')
    const assistantId = await getAssistantId()
    console.log('🤖 Running Scale Expert Agent...')
    console.log('📊 Run creation params:', { threadId, assistantId, userId })
    
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
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

    while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
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

        // Handle tool calls
        if (runStatus === 'requires_action' && runCheck.required_action?.type === 'submit_tool_outputs') {
          console.log('🔧 Processing tool calls...')
          
          const toolCalls = runCheck.required_action.submit_tool_outputs.tool_calls
          const toolOutputs = []

          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name
            const toolArgs = JSON.parse(toolCall.function.arguments)
            
            console.log(`🔧 Executing tool: ${toolName}`, toolArgs)

            try {
              // Call our tools API
              const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scale-expert/tools`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  toolName,
                  parameters: toolArgs,
                  userId
                })
              })

              if (toolResponse.ok) {
                const toolResult = await toolResponse.json()
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(toolResult.result)
                })
                console.log(`✅ Tool ${toolName} executed successfully`)
              } else {
                console.error(`❌ Tool ${toolName} failed`)
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: 'Tool execution failed' })
                })
              }
            } catch (toolError) {
              console.error(`❌ Tool ${toolName} error:`, toolError)
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Tool execution error' })
              })
            }
          }

          // Submit tool outputs
          console.log('📤 Submitting tool outputs...')
          await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
            tool_outputs: toolOutputs
          })

          console.log('✅ Tool outputs submitted, continuing run...')
          runStatus = 'in_progress'
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
