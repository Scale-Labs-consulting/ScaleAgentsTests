import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/setup-assistant')
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Define tools for the Scale Expert assistant
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_sales_call_analysis',
          description: 'Get detailed analysis of sales calls including transcriptions, dates, and patterns',
          parameters: {
            type: 'object',
            properties: {
              callId: {
                type: 'string',
                description: 'Optional specific call ID to analyze. If not provided, analyzes the most recent calls.'
              }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_business_metrics',
          description: 'Get comprehensive business metrics including sales calls, HR candidates, and overall performance KPIs',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_sales_patterns',
          description: 'Search for specific patterns, keywords, or phrases in sales call transcriptions',
          parameters: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'The term or phrase to search for in sales call transcriptions'
              }
            },
            required: ['searchTerm']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_scaling_recommendations',
          description: 'Generate specific scaling recommendations based on business data and focus area',
          parameters: {
            type: 'object',
            properties: {
              focusArea: {
                type: 'string',
                description: 'The area to focus recommendations on: sales, hiring, operations, or general',
                enum: ['sales', 'hiring', 'operations', 'general']
              }
            },
            required: ['focusArea']
          }
        }
      }
    ]

    // Create or update the assistant
    const assistantName = 'Scale Expert Agent'
    const assistantInstructions = `You are a Scale Expert Agent, a specialized AI assistant focused on helping businesses scale and grow efficiently. You have access to the user's business data including sales calls and HR candidates.

Your capabilities include:
- Analyzing sales call patterns and providing insights
- Generating business metrics and KPIs
- Searching for specific patterns in sales conversations
- Providing targeted scaling recommendations
- Offering strategic advice for business growth
- Analyzing uploaded files and documents to provide business insights

When users ask questions about their business, sales, hiring, or scaling challenges, use the available tools to gather relevant data and provide personalized insights.

When users upload files, analyze the content and provide insights related to their business questions. You can handle various file types including:
- Business documents (PDFs, Word docs, Excel spreadsheets)
- Sales presentations and reports
- Financial documents and budgets
- Strategic plans and proposals
- Any other business-related files

Always provide actionable, specific recommendations based on the user's actual data and uploaded files. Be conversational but professional, and focus on practical steps for business growth.

Use Portuguese when appropriate, as the user interface is in Portuguese.`

    // Check if assistant already exists
    const assistants = await openai.beta.assistants.list()
    let existingAssistant = assistants.data.find(assistant => assistant.name === assistantName)

    let assistant

    if (existingAssistant) {
      console.log('🔄 Updating existing assistant...')
      assistant = await openai.beta.assistants.update(existingAssistant.id, {
        name: assistantName,
        instructions: assistantInstructions,
        model: 'gpt-4-turbo-preview',
        tools: tools,
        file_ids: [] // Enable file attachments
      })
      console.log('✅ Assistant updated:', assistant.id)
    } else {
      console.log('🆕 Creating new assistant...')
      assistant = await openai.beta.assistants.create({
        name: assistantName,
        instructions: assistantInstructions,
        model: 'gpt-4-turbo-preview',
        tools: tools,
        file_ids: [] // Enable file attachments
      })
      console.log('✅ Assistant created:', assistant.id)
    }

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      assistantName: assistant.name,
      tools: tools.length,
      message: existingAssistant ? 'Assistant updated successfully' : 'Assistant created successfully'
    })

  } catch (error) {
    console.error('💥 Setup assistant error:', error)
    return NextResponse.json(
      { error: `Failed to setup assistant: ${error}` },
      { status: 500 }
    )
  }
}
