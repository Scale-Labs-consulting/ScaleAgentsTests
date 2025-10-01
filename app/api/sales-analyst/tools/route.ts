import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/tools')
  
  try {
    const { tool, parameters } = await request.json()
    
    console.log(`🔧 Executing tool: ${tool}`)
    console.log(`📋 Parameters:`, parameters)

    let result: any = {}

    switch (tool) {
      case 'analyze_sales_call_transcription':
        result = await analyzeSalesCallTranscription(parameters)
        break

      case 'get_sales_knowledge':
        result = await getSalesKnowledge(parameters)
        break

      case 'compare_with_previous_calls':
        result = await compareWithPreviousCalls(parameters)
        break

      case 'generate_improvement_plan':
        result = await generateImprovementPlan(parameters)
        break

      default:
        throw new Error(`Unknown tool: ${tool}`)
    }

    console.log(`✅ Tool ${tool} executed successfully`)
    
    return NextResponse.json({
      success: true,
      tool,
      result
    })

  } catch (error) {
    console.error('💥 Tool execution error:', error)
    return NextResponse.json(
      { error: `Tool execution failed: ${error}` },
      { status: 500 }
    )
  }
}

// Tool implementations
async function analyzeSalesCallTranscription(parameters: any) {
  const { transcription, callType, context } = parameters
  
  if (!transcription) {
    throw new Error('Transcription is required for analysis')
  }

  console.log(`📊 Analyzing transcription (${transcription.length} chars) for call type: ${callType}`)

  // Get relevant knowledge for the call type
  let knowledge = ''
  try {
    knowledge = await getKnowledgeForCallType(callType || 'Chamada Fria', 'python')
    console.log(`📚 Retrieved knowledge: ${knowledge.length} characters`)
  } catch (error) {
    console.warn('⚠️ Failed to get knowledge:', error)
  }

  // Perform comprehensive analysis using the structured approach
  const analysis = {
    callType: callType || 'Unknown',
    transcriptionLength: transcription.length,
    knowledgeAvailable: knowledge.length > 0,
    analysisTimestamp: new Date().toISOString(),
    context: context || {},
    
    // This would be the actual analysis result
    // The assistant will use this data to perform the analysis
    analysisData: {
      transcription: transcription,
      callType: callType,
      knowledge: knowledge,
      context: context
    }
  }

  return analysis
}

async function getSalesKnowledge(parameters: any) {
  const { callType, focusArea } = parameters
  
  console.log(`📚 Getting sales knowledge for call type: ${callType}, focus: ${focusArea}`)

  try {
    const knowledge = await getKnowledgeForCallType(callType, 'python')
    
    return {
      callType,
      focusArea,
      knowledge,
      knowledgeLength: knowledge.length,
      retrievedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error getting sales knowledge:', error)
    return {
      callType,
      focusArea,
      knowledge: 'Knowledge not available',
      error: error.message,
      retrievedAt: new Date().toISOString()
    }
  }
}

async function compareWithPreviousCalls(parameters: any) {
  const { userId, limit = 5 } = parameters
  
  console.log(`📊 Comparing with previous calls for user: ${userId}, limit: ${limit}`)

  try {
    // Get previous call analyses for this user
    const { data: previousAnalyses, error } = await supabase
      .from('sales_call_analyses')
      .select(`
        id,
        sales_call_id,
        call_type,
        score,
        analysis,
        created_at,
        sales_calls!inner(title, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // Analyze patterns and trends
    const patterns = {
      totalCalls: previousAnalyses.length,
      averageScore: previousAnalyses.reduce((sum, call) => sum + (call.score || 0), 0) / previousAnalyses.length,
      callTypes: previousAnalyses.reduce((acc, call) => {
        acc[call.call_type] = (acc[call.call_type] || 0) + 1
        return acc
      }, {}),
      scoreTrend: previousAnalyses.map(call => ({
        date: call.created_at,
        score: call.score,
        callType: call.call_type
      })),
      commonStrengths: [],
      commonWeaknesses: [],
      improvementAreas: []
    }

    // Extract common patterns from analysis data
    previousAnalyses.forEach(analysis => {
      if (analysis.analysis) {
        try {
          const analysisData = typeof analysis.analysis === 'string' 
            ? JSON.parse(analysis.analysis) 
            : analysis.analysis

          if (analysisData.pontosFortes) {
            patterns.commonStrengths.push(analysisData.pontosFortes)
          }
          if (analysisData.pontosFracos) {
            patterns.commonWeaknesses.push(analysisData.pontosFracos)
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse analysis data:', parseError)
        }
      }
    })

    return {
      userId,
      patterns,
      previousAnalyses: previousAnalyses.map(analysis => ({
        id: analysis.id,
        callType: analysis.call_type,
        score: analysis.score,
        date: analysis.created_at,
        title: analysis.sales_calls?.title
      })),
      retrievedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error comparing with previous calls:', error)
    return {
      userId,
      patterns: null,
      error: error.message,
      retrievedAt: new Date().toISOString()
    }
  }
}

async function generateImprovementPlan(parameters: any) {
  const { analysisResults, focusAreas } = parameters
  
  console.log(`📈 Generating improvement plan for analysis results`)

  try {
    // Extract key insights from analysis results
    const insights = {
      currentScore: analysisResults.totalScore || analysisResults.score || 0,
      strengths: analysisResults.pontosFortes || '',
      weaknesses: analysisResults.pontosFracos || '',
      callType: analysisResults.tipoCall || 'Unknown',
      focusAreas: focusAreas || []
    }

    // Generate improvement plan based on insights
    const improvementPlan = {
      overallGoal: `Improve sales call performance from ${insights.currentScore} to target score`,
      priorityAreas: insights.focusAreas.length > 0 ? insights.focusAreas : ['communication', 'discovery', 'closing'],
      specificActions: [
        'Practice active listening techniques',
        'Develop better questioning strategies',
        'Improve objection handling skills',
        'Enhance closing techniques'
      ],
      timeline: '4-6 weeks',
      successMetrics: [
        'Increase overall score by 20%',
        'Improve consistency across calls',
        'Better customer engagement'
      ],
      resources: [
        'Sales training materials',
        'Practice call sessions',
        'Mentorship program'
      ]
    }

    return {
      insights,
      improvementPlan,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error generating improvement plan:', error)
    return {
      insights: null,
      improvementPlan: null,
      error: error.message,
      generatedAt: new Date().toISOString()
    }
  }
}
