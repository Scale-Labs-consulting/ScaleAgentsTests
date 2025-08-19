'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  ArrowLeft, Star, CheckCircle, Clock, FileText, Download, MessageSquare,
  TrendingUp, TrendingDown, Target, BarChart3, Award, AlertTriangle,
  Users, Timer, Percent, ThumbsUp, ThumbsDown, Brain, Rocket, Volume2,
  Search, Gift, Shield, Layout
} from 'lucide-react'

// Function to format text with proper paragraph breaks
const formatTextWithParagraphs = (text: string) => {
  if (!text) return text
  
  // Clean up markdown syntax that shouldn't be there
  let cleanedText = text
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '')   // Remove italic markdown
  
  // Split by patterns that indicate new points (bullet points, dashes, or " - " patterns)
  // This handles the specific pattern from the AI output
  const parts = cleanedText.split(/(?:\n|^)(?:[-•]\s*|\.\s*-\s*)/).filter(part => part.trim())
  
  // Format each part as a separate paragraph with bullet points
  const formattedParts = parts.map(part => part.trim()).filter(part => part.length > 0)
  
  // If we have multiple parts, format them with bullet points
  if (formattedParts.length > 1) {
    return formattedParts.join('\n\n• ')
  }
  
  // If it's a single part, try to split by sentences that start with " - "
  const sentences = cleanedText.split(/(?<=\.)\s*-\s*/).filter(sentence => sentence.trim())
  if (sentences.length > 1) {
    return sentences.map(sentence => sentence.trim()).join('\n\n• ')
  }
  
  // If it's still a single part, try to split by numbered sections
  const numberedSections = cleanedText.split(/(?:\n|^)\s*\*\*\d+\.\s*/).filter(section => section.trim())
  if (numberedSections.length > 1) {
    return numberedSections.map(section => section.trim()).join('\n\n• ')
  }
  
  // If it's still a single part, just return the cleaned text
  return cleanedText
}

// Markdown renderer component with custom styling
const MarkdownRenderer = ({ content }: { content: string }) => {
  // Format the content to ensure proper paragraph breaks
  const formattedContent = formatTextWithParagraphs(content)
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom styling for markdown elements
        p: ({ children }) => <p className="text-sm text-white/90 mb-3">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-white/80">{children}</em>,
        h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-white mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold text-white mb-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>,
        li: ({ children }) => <li className="text-sm text-white/90 mb-2">{children}</li>,
        code: ({ children }) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white/80">{children}</code>,
        pre: ({ children }) => <pre className="bg-white/10 p-3 rounded-lg border border-white/20 overflow-x-auto mb-3">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-white/30 pl-4 italic text-white/80 mb-3">{children}</blockquote>,
      }}
    >
      {formattedContent}
    </ReactMarkdown>
  )
}

interface AnalysisData {
  id: string
  user_id: string
  status: string
  call_type: string
  feedback: string
  score: number
  title?: string
  analysis: {
    callType: string
    quantitativeAnalysis: string
    strengths: any[] | { raw?: string }
    weaknesses: any[] | { raw?: string }
    scoring: any
    strongMoments: any
    weakMoments: any
  }
  transcription: string
  custom_prompts: string[]
  created_at: string
}

export default function AnalysisReportPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useAuth()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle authentication redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch analysis data
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user || !params.id) return
      
      try {
        setLoadingAnalysis(true)
        setError(null)
        
        const response = await fetch(`/api/sales-analyst/analyses/${params.id}?userId=${user.id}`)
        const result = await response.json()
        
        if (result.success) {
          setAnalysis(result.analysis)
        } else {
          setError(result.error || 'Failed to fetch analysis')
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
        setError('Failed to load analysis')
      } finally {
        setLoadingAnalysis(false)
      }
    }

    fetchAnalysis()
  }, [user, params.id])

  const getCallTypeLabel = (callType: string) => {
    // Handle both old numeric format and new descriptive format
    switch (callType) {
      case '1': return 'Discovery Call'
      case '2': return 'Follow-up Call'
      case '3': return 'Q&A Call'
      case 'Discovery Call': return 'Discovery Call'
      case 'Follow-up Call': return 'Follow-up Call'
      case 'Q&A Call': return 'Q&A Call'
      default: return callType || 'Unknown'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 30) return 'text-green-500'
    if (score >= 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 30) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (score >= 20) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  // Parse quantitative analysis for better display
  const parseQuantitativeAnalysis = (text: string) => {
    if (!text) return null
    
    const lines = text.split('\n').filter(line => line.trim())
    const sections = {
      identification: [] as string[],
      distribution: [] as string[],
      responseTime: '',
      idealProportions: [] as string[],
      feedback: ''
    }
    
    let currentSection = 'identification'
    
    lines.forEach(line => {
      if (line.includes('Comercial:') || line.includes('Cliente:')) {
        sections.identification.push(line.trim())
      } else if (line.includes('%')) {
        sections.distribution.push(line.trim())
      } else if (line.includes('Tempo médio')) {
        sections.responseTime = line.trim()
      } else if (line.includes('Discovery Call') || line.includes('Follow-Up') || line.includes('Q&A')) {
        sections.idealProportions.push(line.trim())
      } else if (line.includes('O comercial deve')) {
        sections.feedback = line.trim()
      }
    })
    
    return sections
  }

  // Parse moments for better display
  const parseMoments = (text: string) => {
    if (!text) return []
    
    // Split by bullet points or numbered items
    const items = text.split(/(?:\n|^)(?:[-•*]\s*|\d+\.\s*)/).filter(item => item.trim())
    return items.map(item => item.trim()).filter(item => item.length > 0)
  }

  if (loading || loadingAnalysis) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">A carregar análise...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao Carregar Análise</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/sales-analyst/files')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Ficheiros
          </Button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Análise Não Encontrada</h2>
          <p className="text-gray-400 mb-4">A análise solicitada não foi encontrada.</p>
          <Button onClick={() => router.push('/sales-analyst/files')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Ficheiros
          </Button>
        </div>
      </div>
    )
  }

  const quantitativeData = parseQuantitativeAnalysis(analysis.analysis?.quantitativeAnalysis)
  const strongMoments = parseMoments(analysis.analysis?.strongMoments?.raw || '')
  const weakMoments = parseMoments(analysis.analysis?.weakMoments?.raw || '')

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => router.push('/sales-analyst/files')} 
                  variant="ghost" 
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar aos Ficheiros
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {analysis.title ? `Análise ${analysis.title}` : `Relatório de Análise`}
                  </h1>
                  <p className="text-white/70">
                    {new Date(analysis.created_at).toLocaleDateString()} • {analysis.id.slice(0, 8)}
                  </p>
                </div>
              </div>
                             <div className="flex items-center space-x-3">
                 <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                   <Download className="h-4 w-4 mr-2" />
                   Descarregar Relatório
                 </Button>
               </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Main Analysis - Centered */}
            <div className="lg:col-span-3 space-y-6">






              {/* Structured Analysis Results */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-white">
                    <BarChart3 className="h-6 w-6 text-purple-400" />
                    <span>Análise Estruturada</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Text Fields Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tipo de Call */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-400" />
                        Tipo de Call
                      </h4>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                        <p className="text-white/80">{getCallTypeLabel(analysis.call_type)}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-400" />
                        Score Total
                      </h4>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                        <p className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}/40
                        </p>
                      </div>
                    </div>

                    {/* Pontos Fortes */}
                    <div className="space-y-2 lg:col-span-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-2 text-green-400" />
                        Pontos Fortes 
                      </h4>
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20 max-h-48 overflow-y-auto">
                        {(analysis.analysis.strengths && typeof analysis.analysis.strengths === 'object' && 'raw' in analysis.analysis.strengths) ? (
                          <div className="prose prose-invert max-w-none">
                            <MarkdownRenderer content={String(analysis.analysis.strengths.raw)} />
                          </div>
                        ) : Array.isArray(analysis.analysis.strengths) && analysis.analysis.strengths.length > 0 ? (
                          <div className="space-y-2">
                            {analysis.analysis.strengths.map((strength, index) => (
                              <p key={index} className="text-white/80 text-sm">• {strength.description || strength}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/60 text-sm">Dados não disponíveis</p>
                        )}
                      </div>
                    </div>

                    {/* Pontos Fracos */}
                    <div className="space-y-2 lg:col-span-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <ThumbsDown className="h-4 w-4 mr-2 text-red-400" />
                        Pontos Fracos 
                      </h4>
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20 max-h-48 overflow-y-auto">
                        {(analysis.analysis.weaknesses && typeof analysis.analysis.weaknesses === 'object' && 'raw' in analysis.analysis.weaknesses) ? (
                          <div className="prose prose-invert max-w-none">
                            <MarkdownRenderer content={String(analysis.analysis.weaknesses.raw)} />
                          </div>
                        ) : Array.isArray(analysis.analysis.weaknesses) && analysis.analysis.weaknesses.length > 0 ? (
                          <div className="space-y-2">
                            {analysis.analysis.weaknesses.map((weakness, index) => (
                              <p key={index} className="text-white/80 text-sm">• {weakness.description || weakness}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/60 text-sm">Dados não disponíveis</p>
                        )}
                      </div>
                    </div>

                    {/* Resumo da Call */}
                    <div className="space-y-2 lg:col-span-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-400" />
                        Resumo da Call
                      </h4>
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20 max-h-64 overflow-y-auto">
                        {(analysis.analysis as any).callSummary ? (
                          <div className="prose prose-invert max-w-none">
                            <MarkdownRenderer content={String((analysis.analysis as any).callSummary.raw || (analysis.analysis as any).callSummary)} />
                          </div>
                        ) : (
                          <p className="text-white/60 text-sm">Dados não disponíveis</p>
                        )}
                      </div>
                    </div>

                    {/* Dicas Gerais */}
                    <div className="space-y-2 lg:col-span-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-purple-400" />
                        Dicas Gerais
                      </h4>
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20 max-h-48 overflow-y-auto">
                        {(analysis.analysis as any).tips ? (
                          <MarkdownRenderer content={(analysis.analysis as any).tips.raw || (analysis.analysis as any).tips} />
                        ) : (
                          <p className="text-white/60 text-sm">Dados não disponíveis</p>
                        )}
                      </div>
                    </div>

                    {/* Foco para próximas calls */}
                    <div className="space-y-2 lg:col-span-2">
                      <h4 className="font-semibold text-white flex items-center">
                        <Rocket className="h-4 w-4 mr-2 text-orange-400" />
                        Foco para próximas calls 
                      </h4>
                      <div className="bg-white/10 p-4 rounded-lg border border-white/20 max-h-48 overflow-y-auto">
                        {(analysis.analysis as any).focus ? (
                          <MarkdownRenderer content={(analysis.analysis as any).focus.raw || (analysis.analysis as any).focus} />
                        ) : (
                          <p className="text-white/60 text-sm">Dados não disponíveis</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scoring Fields Section */}
                  <div className="border-t border-white/20 pt-6">
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      Pontuações Detalhadas (1-5)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { key: 'clareza', label: 'Clareza e Fluência da Fala', icon: MessageSquare },
                        { key: 'tom', label: 'Tom e Controlo', icon: Volume2 },
                        { key: 'envolvimento', label: 'Envolvimento Conversacional', icon: Users },
                        { key: 'descoberta', label: 'Efetividade na Descoberta de Necessidades', icon: Search },
                        { key: 'entrega', label: 'Entrega de Valor e Ajuste da Solução', icon: Gift },
                        { key: 'objeções', label: 'Habilidades de Lidar com Objeções', icon: Shield },
                        { key: 'estrutura', label: 'Estrutura e Controle da Reunião', icon: Layout },
                        { key: 'fechamento', label: 'Fechamento e Próximos Passos', icon: CheckCircle }
                      ].map(({ key, label, icon: Icon }) => {
                        // Function to extract score from scoring data
                        const getScore = () => {
                          // First try to get from parsed scoring object
                          if (analysis.analysis.scoring?.[key]) {
                            return analysis.analysis.scoring[key]
                          }
                          
                          // If not found, try to parse from raw text
                          if (analysis.analysis.scoring?.raw && typeof analysis.analysis.scoring.raw === 'string') {
                            const lines = analysis.analysis.scoring.raw.split('\n')
                            for (const line of lines) {
                              if (line.includes(label)) {
                                const match = line.match(/(\d+)\/5/)
                                if (match) return parseInt(match[1])
                              }
                            }
                          }
                          
                          return 'N/A'
                        }
                        
                        const score = getScore()
                        return (
                          <div key={key} className="bg-white/10 p-4 rounded-lg border border-white/20 text-center">
                            <div className="flex items-center justify-center mb-3">
                              <Icon className="h-5 w-5 text-blue-400" />
                            </div>
                            <h5 className="text-white/90 text-sm font-medium mb-2">{label}</h5>
                            <div className="text-lg font-bold text-white">{score}/5</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Stats Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Call Type</span>
                    <Badge variant="outline" className="border-white/20 text-white">{getCallTypeLabel(analysis.call_type)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Status</span>
                    <Badge className="bg-green-500/20 text-green-400">
                      {analysis.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Score</span>
                    <span className={`font-semibold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/40
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Created</span>
                    <span className="text-sm text-white/80">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
