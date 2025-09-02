import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tool functions for the Scale Expert agent
const tools = {
  // Get detailed sales call analysis
  get_sales_call_analysis: async (userId: string, callId?: string) => {
    try {
      let query = supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (callId) {
        query = query.eq('id', callId)
      } else {
        query = query.limit(10) // Get last 10 calls for analysis
      }

      const { data: salesCalls, error } = await query

      if (error) {
        return { error: 'Failed to fetch sales calls' }
      }

      if (!salesCalls || salesCalls.length === 0) {
        return { message: 'No sales calls found for analysis' }
      }

      // Analyze sales calls
      const analysis = {
        totalCalls: salesCalls.length,
        dateRange: {
          earliest: new Date(salesCalls[salesCalls.length - 1].created_at).toLocaleDateString('pt-PT'),
          latest: new Date(salesCalls[0].created_at).toLocaleDateString('pt-PT')
        },
        calls: salesCalls.map(call => ({
          id: call.id,
          title: call.title,
          date: new Date(call.created_at).toLocaleDateString('pt-PT'),
          transcription: call.transcription,
          duration: call.duration || 'Unknown',
          status: call.status
        }))
      }

      return analysis
    } catch (error) {
      return { error: 'Failed to analyze sales calls' }
    }
  },

  // Get business metrics and KPIs
  get_business_metrics: async (userId: string) => {
    try {
      // Get sales calls metrics
      const { data: salesCalls, error: salesError } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)

      if (salesError) {
        return { error: 'Failed to fetch business metrics' }
      }

      // Get HR candidates metrics
      const { data: candidates, error: hrError } = await supabase
        .from('hr_candidates')
        .select('*')
        .eq('user_id', userId)

      if (hrError) {
        return { error: 'Failed to fetch HR metrics' }
      }

      const metrics = {
        sales: {
          totalCalls: salesCalls?.length || 0,
          completedCalls: salesCalls?.filter(call => call.status === 'completed').length || 0,
          pendingCalls: salesCalls?.filter(call => call.status === 'pending').length || 0,
          averageDuration: salesCalls?.reduce((acc, call) => acc + (call.duration || 0), 0) / (salesCalls?.length || 1) || 0
        },
        hr: {
          totalCandidates: candidates?.length || 0,
          evaluatedCandidates: candidates?.filter(candidate => candidate.status === 'evaluated').length || 0,
          averageScore: candidates?.reduce((acc, candidate) => acc + (candidate.overall_score || 0), 0) / (candidates?.length || 1) || 0,
          topCandidates: candidates?.filter(candidate => candidate.overall_score && candidate.overall_score >= 8).length || 0
        },
        overall: {
          totalRecords: (salesCalls?.length || 0) + (candidates?.length || 0),
          lastActivity: new Date().toLocaleDateString('pt-PT')
        }
      }

      return metrics
    } catch (error) {
      return { error: 'Failed to calculate business metrics' }
    }
  },

  // Search for specific patterns in sales calls
  search_sales_patterns: async (userId: string, searchTerm: string) => {
    try {
      const { data: salesCalls, error } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        return { error: 'Failed to search sales patterns' }
      }

      if (!salesCalls || salesCalls.length === 0) {
        return { message: 'No sales calls found for pattern search' }
      }

      // Search for patterns in transcriptions
      const matchingCalls = salesCalls.filter(call => 
        call.transcription && 
        call.transcription.toLowerCase().includes(searchTerm.toLowerCase())
      )

      const patterns = {
        searchTerm,
        totalCalls: salesCalls.length,
        matchingCalls: matchingCalls.length,
        results: matchingCalls.map(call => ({
          id: call.id,
          title: call.title,
          date: new Date(call.created_at).toLocaleDateString('pt-PT'),
          context: call.transcription?.substring(
            Math.max(0, call.transcription.toLowerCase().indexOf(searchTerm.toLowerCase()) - 100),
            call.transcription.toLowerCase().indexOf(searchTerm.toLowerCase()) + searchTerm.length + 100
          ) || 'No context found'
        }))
      }

      return patterns
    } catch (error) {
      return { error: 'Failed to search sales patterns' }
    }
  },

  // Generate scaling recommendations
  generate_scaling_recommendations: async (userId: string, focusArea: string) => {
    try {
      // Get business data for recommendations
      const { data: salesCalls } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')

      const { data: candidates } = await supabase
        .from('hr_candidates')
        .select('*')
        .eq('user_id', userId)

      const recommendations = {
        focusArea,
        timestamp: new Date().toISOString(),
        dataPoints: {
          salesCalls: salesCalls?.length || 0,
          candidates: candidates?.length || 0,
          averageScore: candidates?.reduce((acc, c) => acc + (c.overall_score || 0), 0) / (candidates?.length || 1) || 0
        },
        recommendations: []
      }

      // Generate recommendations based on focus area
      switch (focusArea.toLowerCase()) {
        case 'sales':
          if (salesCalls && salesCalls.length > 0) {
            recommendations.recommendations = [
              'Implemente um sistema de CRM para rastrear leads e oportunidades',
              'Desenvolva scripts de vendas baseados nas suas conversas mais bem-sucedidas',
              'Considere automatizar follow-ups com prospects',
              'Analise padrões de objeções para melhorar o processo de vendas'
            ]
          }
          break
        case 'hiring':
          if (candidates && candidates.length > 0) {
            recommendations.recommendations = [
              'Crie um processo de onboarding estruturado para novos colaboradores',
              'Implemente avaliações de performance regulares',
              'Desenvolva planos de carreira para reter talentos',
              'Considere programas de formação contínua'
            ]
          }
          break
        case 'operations':
          recommendations.recommendations = [
            'Implemente ferramentas de automação para tarefas repetitivas',
            'Desenvolva processos documentados para escalabilidade',
            'Considere outsourcing para funções não-core',
            'Implemente métricas de performance para monitorizar crescimento'
          ]
          break
        default:
          recommendations.recommendations = [
            'Foque na automação de processos-chave',
            'Desenvolva uma estratégia de crescimento sustentável',
            'Invista em tecnologia que suporte escalabilidade',
            'Construa uma equipa forte com processos claros'
          ]
      }

      return recommendations
    } catch (error) {
      return { error: 'Failed to generate recommendations' }
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/tools')
  
  try {
    const { toolName, parameters, userId } = await request.json()

    if (!toolName || !userId) {
      return NextResponse.json(
        { error: 'Tool name and userId are required' },
        { status: 400 }
      )
    }

    console.log('🔧 Executing tool:', { toolName, parameters, userId })

    // Execute the requested tool
    if (tools[toolName as keyof typeof tools]) {
      const result = await tools[toolName as keyof typeof tools](userId, parameters)
      
      console.log('✅ Tool execution result:', result)
      
      return NextResponse.json({
        success: true,
        result
      })
    } else {
      return NextResponse.json(
        { error: `Unknown tool: ${toolName}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('💥 Tool execution error:', error)
    return NextResponse.json(
      { error: `Tool execution failed: ${error}` },
      { status: 500 }
    )
  }
}
