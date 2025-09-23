// Sales Analysis JSON Schema for structured data storage and progression tracking

export interface SalesAnalysisJSON {
  // Basic call information
  callInfo: {
    callType: string
    duration?: number // in minutes
    participants?: string[]
    date: string
    fileName: string
  }
  
  // Overall scoring
  overallScore: {
    total: number // 0-100
    category: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor'
  }
  
  // Detailed scoring by category
  scoring: {
    clarityAndFluency: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    toneAndControl: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    engagement: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    needsDiscovery: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    valueDelivery: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    objectionHandling: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    meetingControl: {
      score: number // 0-5
      description: string
      examples: string[]
    }
    closing: {
      score: number // 0-5
      description: string
      examples: string[]
    }
  }
  
  // Strengths and improvements
  insights: {
    strengths: {
      category: string
      description: string
      impact: 'high' | 'medium' | 'low'
      examples: string[]
    }[]
    improvements: {
      category: string
      description: string
      priority: 'high' | 'medium' | 'low'
      actionableSteps: string[]
      examples: string[]
    }[]
  }
  
  // Call summary and recommendations
  summary: {
    callObjective: string
    outcome: 'successful' | 'partial' | 'unsuccessful'
    nextSteps: string[]
    keyTakeaways: string[]
    generalTips: string[]
  }
  
  // Progression tracking data
  progression: {
    previousScore?: number
    improvementAreas: string[]
    consistentStrengths: string[]
    trend: 'improving' | 'stable' | 'declining'
  }
  
  // Metadata
  metadata: {
    analysisVersion: string
    processingTime: number // in seconds
    tokensUsed: number
    model: string
    timestamp: string
  }
  
  // Original content fields for backward compatibility
  pontosFortes?: string
  pontosFracos?: string
  resumoDaCall?: string
  dicasGerais?: string
  focoParaProximasCalls?: string
  clarezaFluenciaFala?: number
  tomControlo?: number
  envolvimentoConversacional?: number
  efetividadeDescobertaNecessidades?: number
  entregaValorAjusteSolucao?: number
  habilidadesLidarObjeccoes?: number
  estruturaControleReuniao?: number
  fechamentoProximosPassos?: number
}

// Helper function to convert current analysis format to JSON schema
export function convertToStructuredJSON(
  analysisResults: any,
  callType: string,
  fileName: string,
  processingTime: number,
  tokensUsed: number
): SalesAnalysisJSON {
  // Debug: Log the analysis results structure
  console.log('🔍 Converting analysis results to structured JSON:', {
    totalScore: analysisResults.totalScore,
    clarezaFluenciaFala: analysisResults.clarezaFluenciaFala,
    tomControlo: analysisResults.tomControlo,
    pontosFortes: analysisResults.pontosFortes?.substring(0, 100),
    callType: callType
  })

  // Calculate overall score category
  const totalScore = analysisResults.totalScore || 0
  const getScoreCategory = (score: number): 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor' => {
    if (score >= 40) return 'excellent'
    if (score >= 32) return 'good'
    if (score >= 24) return 'average'
    if (score >= 16) return 'needs_improvement'
    return 'poor'
  }

  // Parse strengths and improvements from text
  const parseStrengths = (text: string) => {
    if (!text) return []
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => ({
      category: 'General',
      description: line.trim(),
      impact: 'medium' as const,
      examples: []
    }))
  }

  const parseImprovements = (text: string) => {
    if (!text) return []
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => ({
      category: 'General',
      description: line.trim(),
      priority: 'medium' as const,
      actionableSteps: [],
      examples: []
    }))
  }

  return {
    callInfo: {
      callType: callType || 'Chamada Fria',
      fileName: fileName,
      date: new Date().toISOString()
    },
    
    overallScore: {
      total: totalScore,
      category: getScoreCategory(totalScore)
    },
    
    scoring: {
      clarityAndFluency: {
        score: analysisResults.clarezaFluenciaFala || 0,
        description: 'Clareza na comunicação e fluência verbal',
        examples: []
      },
      toneAndControl: {
        score: analysisResults.tomControlo || 0,
        description: 'Tom de voz e controlo da conversa',
        examples: []
      },
      engagement: {
        score: analysisResults.envolvimentoConversacional || 0,
        description: 'Envolvimento e interação com o cliente',
        examples: []
      },
      needsDiscovery: {
        score: analysisResults.efetividadeDescobertaNecessidades || 0,
        description: 'Efetividade na descoberta de necessidades',
        examples: []
      },
      valueDelivery: {
        score: analysisResults.entregaValorAjusteSolucao || 0,
        description: 'Entrega de valor e ajuste da solução',
        examples: []
      },
      objectionHandling: {
        score: analysisResults.habilidadesLidarObjeccoes || 0,
        description: 'Habilidades para lidar com objeções',
        examples: []
      },
      meetingControl: {
        score: analysisResults.estruturaControleReuniao || 0,
        description: 'Estrutura e controlo da reunião',
        examples: []
      },
      closing: {
        score: analysisResults.fechamentoProximosPassos || 0,
        description: 'Fechamento e próximos passos',
        examples: []
      }
    },
    
    insights: {
      strengths: parseStrengths(analysisResults.pontosFortes || ''),
      improvements: parseImprovements(analysisResults.pontosFracos || '')
    },
    
    summary: {
      callObjective: 'Análise de performance da chamada',
      outcome: totalScore >= 32 ? 'successful' : totalScore >= 24 ? 'partial' : 'unsuccessful',
      nextSteps: analysisResults.focoParaProximasCalls ? 
        analysisResults.focoParaProximasCalls.split('\n').filter((step: string) => step.trim()) : [],
      keyTakeaways: analysisResults.resumoDaCall ? 
        analysisResults.resumoDaCall.split('\n').filter((takeaway: string) => takeaway.trim()) : [],
      generalTips: analysisResults.dicasGerais ? 
        analysisResults.dicasGerais.split('\n').filter((tip: string) => tip.trim()) : []
    },
    
    progression: {
      improvementAreas: [],
      consistentStrengths: [],
      trend: 'stable'
    },
    
    metadata: {
      analysisVersion: '2.0',
      processingTime: processingTime,
      tokensUsed: tokensUsed,
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString()
    },
    
    // Preserve original content fields for backward compatibility
    pontosFortes: analysisResults.pontosFortes || '',
    pontosFracos: analysisResults.pontosFracos || '',
    resumoDaCall: analysisResults.resumoDaCall || '',
    dicasGerais: analysisResults.dicasGerais || '',
    focoParaProximasCalls: analysisResults.focoParaProximasCalls || '',
    clarezaFluenciaFala: analysisResults.clarezaFluenciaFala || 0,
    tomControlo: analysisResults.tomControlo || 0,
    envolvimentoConversacional: analysisResults.envolvimentoConversacional || 0,
    efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades || 0,
    entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao || 0,
    habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes || 0,
    estruturaControleReuniao: analysisResults.estruturaControleReuniao || 0,
    fechamentoProximosPassos: analysisResults.fechamentoProximosPassos || 0
  }
}

// Helper function to calculate progression trends
export function calculateProgressionTrend(
  currentAnalysis: SalesAnalysisJSON,
  previousAnalyses: SalesAnalysisJSON[]
): SalesAnalysisJSON {
  if (previousAnalyses.length === 0) {
    return currentAnalysis
  }

  const currentScore = currentAnalysis.overallScore.total
  const previousScore = previousAnalyses[previousAnalyses.length - 1].overallScore.total
  
  // Calculate trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (currentScore > previousScore + 2) {
    trend = 'improving'
  } else if (currentScore < previousScore - 2) {
    trend = 'declining'
  }

  // Find consistent strengths (categories that consistently score 4+)
  const consistentStrengths: string[] = []
  const allAnalyses = [...previousAnalyses, currentAnalysis]
  
  const categories = [
    'clarityAndFluency', 'toneAndControl', 'engagement', 'needsDiscovery',
    'valueDelivery', 'objectionHandling', 'meetingControl', 'closing'
  ] as const

  categories.forEach(category => {
    const scores = allAnalyses.map(analysis => analysis.scoring[category].score)
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    if (avgScore >= 4) {
      consistentStrengths.push(category)
    }
  })

  // Find improvement areas (categories that consistently score < 3)
  const improvementAreas: string[] = []
  categories.forEach(category => {
    const scores = allAnalyses.map(analysis => analysis.scoring[category].score)
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    if (avgScore < 3) {
      improvementAreas.push(category)
    }
  })

  return {
    ...currentAnalysis,
    progression: {
      previousScore,
      improvementAreas,
      consistentStrengths,
      trend
    }
  }
}
