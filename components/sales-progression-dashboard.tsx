'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Target, Award, AlertCircle } from 'lucide-react'
import { SalesAnalysisJSON } from '@/lib/sales-analysis-schema'

interface ProgressionData {
  analyses: SalesAnalysisJSON[]
  progression: SalesAnalysisJSON
  summary: {
    totalAnalyses: number
    averageScore: number
    bestScore: number
    worstScore: number
    trend: 'improving' | 'stable' | 'declining'
    improvementAreas: string[]
    consistentStrengths: string[]
  }
}

interface SalesProgressionDashboardProps {
  userId: string
}

export function SalesProgressionDashboard({ userId }: SalesProgressionDashboardProps) {
  const [progressionData, setProgressionData] = useState<ProgressionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgressionData()
  }, [userId])

  const fetchProgressionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-analyst/progression?userId=${userId}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch progression data')
      }
      
      const data = await response.json()
      setProgressionData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-500'
      case 'declining':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-green-500'
    if (score >= 32) return 'text-blue-500'
    if (score >= 24) return 'text-yellow-500'
    if (score >= 16) return 'text-orange-500'
    return 'text-red-500'
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'clarityAndFluency': 'Clareza e Fluência',
      'toneAndControl': 'Tom e Controlo',
      'engagement': 'Envolvimento',
      'needsDiscovery': 'Descoberta de Necessidades',
      'valueDelivery': 'Entrega de Valor',
      'objectionHandling': 'Lidar com Objeções',
      'meetingControl': 'Controlo da Reunião',
      'closing': 'Fechamento'
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white/60 mt-2">A carregar dados de progressão...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-500">Erro ao carregar dados: {error}</p>
      </div>
    )
  }

  if (!progressionData || progressionData.analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-8 w-8 text-white/40 mx-auto mb-2" />
        <p className="text-white/60">Nenhuma análise encontrada. Faça upload de uma chamada para ver a progressão.</p>
      </div>
    )
  }

  const { summary, analyses } = progressionData

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total de Análises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{summary.totalAnalyses}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Pontuação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(summary.averageScore)}`}>
              {summary.averageScore.toFixed(1)}/50
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Melhor Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(summary.bestScore)}`}>
              {summary.bestScore}/50
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Tendência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getTrendIcon(summary.trend)}
              <span className={`font-semibold ${getTrendColor(summary.trend)}`}>
                {summary.trend === 'improving' ? 'Melhorando' : 
                 summary.trend === 'declining' ? 'Declinando' : 'Estável'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance */}
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Performance Recente</span>
          </CardTitle>
          <CardDescription className="text-white/60">
            Últimas {Math.min(5, analyses.length)} análises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyses.slice(0, 5).map((analysis, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-semibold ${getScoreColor(analysis.overallScore.total)}`}>
                      {analysis.overallScore.total}/50
                    </div>
                    <div className="text-white/80">
                      {analysis.callInfo.fileName}
                    </div>
                    <Badge variant="outline" className="text-white/60 border-white/20">
                      {analysis.callInfo.callType}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <Progress 
                      value={(analysis.overallScore.total / 50) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="text-sm text-white/60">
                  {new Date(analysis.callInfo.date).toLocaleDateString('pt-PT')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Pontos Fortes Consistentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.consistentStrengths.length > 0 ? (
              <div className="space-y-2">
                {summary.consistentStrengths.map((strength, index) => (
                  <Badge key={index} variant="outline" className="text-green-400 border-green-400/20 mr-2 mb-2">
                    {getCategoryLabel(strength)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-white/60">Continue a praticar para identificar pontos fortes consistentes.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-500" />
              <span>Áreas de Melhoria</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.improvementAreas.length > 0 ? (
              <div className="space-y-2">
                {summary.improvementAreas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-orange-400 border-orange-400/20 mr-2 mb-2">
                    {getCategoryLabel(area)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-white/60">Excelente! Não há áreas específicas que precisem de melhoria.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Scoring Breakdown */}
      {analyses.length > 0 && (
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Análise Detalhada - Última Chamada</CardTitle>
            <CardDescription className="text-white/60">
              Pontuação por categoria da análise mais recente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analyses[0].scoring).map(([category, data]) => (
                <div key={category} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 font-medium">
                      {getCategoryLabel(category)}
                    </span>
                    <span className={`font-semibold ${getScoreColor(data.score * 10)}`}>
                      {data.score}/5
                    </span>
                  </div>
                  <Progress value={(data.score / 5) * 100} className="h-2" />
                  {data.description && (
                    <p className="text-white/60 text-sm mt-2">{data.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
