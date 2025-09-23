import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SalesAnalysisJSON, calculateProgressionTrend } from '@/lib/sales-analysis-schema'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch user's sales call analyses
    const { data: analyses, error } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching analyses:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ 
        analyses: [],
        progression: null,
        message: 'No analyses found'
      })
    }

    // Convert analyses to structured format and calculate progression
    const structuredAnalyses: SalesAnalysisJSON[] = analyses.map(analysis => {
      // If analysis is already in structured format, use it directly
      if (analysis.analysis && typeof analysis.analysis === 'object' && 'callInfo' in analysis.analysis) {
        return analysis.analysis as SalesAnalysisJSON
      }
      
      // Otherwise, convert from legacy format
      return {
        callInfo: {
          callType: analysis.call_type || 'Chamada Fria',
          fileName: analysis.title || 'Sales Call Analysis',
          date: analysis.created_at
        },
        overallScore: {
          total: analysis.score || 0,
          category: analysis.score >= 40 ? 'excellent' : 
                   analysis.score >= 32 ? 'good' : 
                   analysis.score >= 24 ? 'average' : 
                   analysis.score >= 16 ? 'needs_improvement' : 'poor'
        },
        scoring: {
          clarityAndFluency: { score: 0, description: '', examples: [] },
          toneAndControl: { score: 0, description: '', examples: [] },
          engagement: { score: 0, description: '', examples: [] },
          needsDiscovery: { score: 0, description: '', examples: [] },
          valueDelivery: { score: 0, description: '', examples: [] },
          objectionHandling: { score: 0, description: '', examples: [] },
          meetingControl: { score: 0, description: '', examples: [] },
          closing: { score: 0, description: '', examples: [] }
        },
        insights: {
          strengths: [],
          improvements: []
        },
        summary: {
          callObjective: '',
          outcome: 'partial',
          nextSteps: [],
          keyTakeaways: []
        },
        progression: {
          improvementAreas: [],
          consistentStrengths: [],
          trend: 'stable'
        },
        metadata: {
          analysisVersion: '1.0',
          processingTime: 0,
          tokensUsed: 0,
          model: 'gpt-4o-mini',
          timestamp: analysis.created_at
        }
      }
    })

    // Calculate progression trends
    const progressionData = structuredAnalyses.length > 1 ? 
      calculateProgressionTrend(structuredAnalyses[0], structuredAnalyses.slice(1)) : 
      structuredAnalyses[0]

    // Calculate summary statistics
    const summaryStats = {
      totalAnalyses: structuredAnalyses.length,
      averageScore: structuredAnalyses.reduce((sum, analysis) => sum + analysis.overallScore.total, 0) / structuredAnalyses.length,
      bestScore: Math.max(...structuredAnalyses.map(analysis => analysis.overallScore.total)),
      worstScore: Math.min(...structuredAnalyses.map(analysis => analysis.overallScore.total)),
      trend: progressionData.progression.trend,
      improvementAreas: progressionData.progression.improvementAreas,
      consistentStrengths: progressionData.progression.consistentStrengths
    }

    return NextResponse.json({
      analyses: structuredAnalyses,
      progression: progressionData,
      summary: summaryStats
    })

  } catch (error) {
    console.error('Error in progression API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
