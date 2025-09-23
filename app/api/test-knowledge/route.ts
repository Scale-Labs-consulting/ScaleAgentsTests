// Test endpoint to verify knowledge system is working
import { NextRequest, NextResponse } from 'next/server'
import { getKnowledgeForCallType, getAvailableCallTypes, hasKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callType = searchParams.get('callType') || 'Chamada Fria'
    
    console.log(`\n🧪 ===== KNOWLEDGE TEST START =====`)
    console.log(`📋 Testing call type: ${callType}`)
    
    // Test 1: Check available call types
    const availableCallTypes = getAvailableCallTypes()
    console.log(`📋 Available call types: ${availableCallTypes.join(', ')}`)
    
    // Test 2: Check if call type has knowledge
    const hasKnowledge = hasKnowledgeForCallType(callType)
    console.log(`📚 Has knowledge for ${callType}: ${hasKnowledge}`)
    
    // Test 3: Fetch knowledge
    const knowledge = await getKnowledgeForCallType(callType)
    
    const result = {
      success: true,
      callType,
      availableCallTypes,
      hasKnowledge,
      knowledgeLength: knowledge.length,
      knowledgePreview: knowledge.substring(0, 500),
      timestamp: new Date().toISOString()
    }
    
    console.log(`\n🧪 KNOWLEDGE TEST RESULT:`)
    console.log(`   📋 Call Type: ${callType}`)
    console.log(`   📚 Has Knowledge: ${hasKnowledge}`)
    console.log(`   📊 Knowledge Length: ${knowledge.length} characters`)
    console.log(`   📝 Preview: "${knowledge.substring(0, 200).replace(/\n/g, ' ')}..."`)
    console.log(`🧪 ===== KNOWLEDGE TEST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Knowledge test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callType } = body
    
    if (!callType) {
      return NextResponse.json({
        success: false,
        error: 'callType is required'
      }, { status: 400 })
    }
    
    console.log(`\n🧪 ===== KNOWLEDGE TEST POST START =====`)
    console.log(`📋 Testing call type: ${callType}`)
    
    // Test knowledge fetching
    const knowledge = await getKnowledgeForCallType(callType)
    
    const result = {
      success: true,
      callType,
      knowledgeLength: knowledge.length,
      knowledgePreview: knowledge.substring(0, 1000),
      timestamp: new Date().toISOString()
    }
    
    console.log(`🧪 ===== KNOWLEDGE TEST POST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Knowledge test POST error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
