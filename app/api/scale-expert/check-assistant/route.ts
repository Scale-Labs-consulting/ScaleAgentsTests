import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/check-assistant')
  
  try {
    if (!process.env.SCALE_EXPERT) {
      return NextResponse.json({ error: 'SCALE_EXPERT env variable not set' }, { status: 400 })
    }

    // Retrieve the assistant configuration
    const assistant = await openai.beta.assistants.retrieve(process.env.SCALE_EXPERT)
    
    console.log('📊 Current Assistant Configuration:')
    console.log('  ID:', assistant.id)
    console.log('  Name:', assistant.name)
    console.log('  Model:', assistant.model)
    console.log('  Tools:', assistant.tools.length)
    console.log('  Tool Resources:', JSON.stringify(assistant.tool_resources, null, 2))

    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        model: assistant.model,
        tools: assistant.tools,
        tool_resources: assistant.tool_resources,
        instructions_preview: assistant.instructions?.substring(0, 200) + '...'
      }
    })

  } catch (error) {
    console.error('💥 Check assistant error:', error)
    return NextResponse.json(
      { error: `Failed to check assistant: ${error}` },
      { status: 500 }
    )
  }
}

