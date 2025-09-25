import { NextRequest, NextResponse } from 'next/server'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callType = searchParams.get('callType') || 'Chamada Fria'
    const method = searchParams.get('method') || 'python'

    console.log(`🧠 Debug: Fetching knowledge for ${callType} using ${method}`)

    const startTime = Date.now()
    const knowledge = await getKnowledgeForCallType(callType, method as any)
    const endTime = Date.now()

    console.log(`✅ Debug: Knowledge fetched in ${endTime - startTime}ms`)

    return NextResponse.json({
      success: true,
      callType,
      method,
      processingTime: endTime - startTime,
      knowledgeLength: knowledge.length,
      knowledgePreview: knowledge.substring(0, 500) + (knowledge.length > 500 ? '...' : ''),
      fullKnowledge: knowledge,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Debug knowledge fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
