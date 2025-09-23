// Test endpoint to verify knowledge access with correct URL
import { NextRequest, NextResponse } from 'next/server'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n🧪 ===== KNOWLEDGE ACCESS TEST START =====`)
    
    const { searchParams } = new URL(request.url)
    const callType = searchParams.get('callType') || 'Chamada Fria'
    
    console.log(`📋 Testing call type: ${callType}`)
    
    // Test knowledge fetching
    const knowledge = await getKnowledgeForCallType(callType)
    
    const result = {
      success: true,
      callType,
      knowledgeLength: knowledge.length,
      hasKnowledge: knowledge.length > 0,
      knowledgePreview: knowledge.substring(0, 500),
      timestamp: new Date().toISOString()
    }
    
    console.log(`\n🧪 KNOWLEDGE ACCESS TEST RESULT:`)
    console.log(`   📋 Call Type: ${callType}`)
    console.log(`   📊 Knowledge Length: ${knowledge.length} characters`)
    console.log(`   ✅ Has Knowledge: ${knowledge.length > 0}`)
    console.log(`   📝 Preview: "${knowledge.substring(0, 200).replace(/\n/g, ' ')}..."`)
    console.log(`🧪 ===== KNOWLEDGE ACCESS TEST END =====\n`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error(`❌ Knowledge access test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
