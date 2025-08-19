'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Clock, 
  MessageSquare, 
  Target, 
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  Share2,
  Calendar,
  User,
  Users,
  BarChart3,
  Lightbulb,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Rocket
} from 'lucide-react'

interface SalesReportProps {
  analysisResult: any
  transcriptionStats?: any
  fileName?: string
  uploadDate?: string
  onClose?: () => void
}

export function SalesReport({ 
  analysisResult, 
  transcriptionStats, 
  fileName = "Sales Call",
  uploadDate = new Date().toLocaleDateString(),
  onClose 
}: SalesReportProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'transcript'>('summary')

  const getCallTypeLabel = (type: string) => {
    // Handle both old numeric format and new descriptive format
    switch (type) {
      case '1': return 'Discovery Call'
      case '2': return 'Follow-up Call'
      case '3': return 'Q&A Call'
      case 'Discovery Call': return 'Discovery Call'
      case 'Follow-up Call': return 'Follow-up Call'
      case 'Q&A Call': return 'Q&A Call'
      default: return type || 'Unknown'
    }
  }

  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case '1': return <Target className="w-4 h-4" />
      case '2': return <MessageSquare className="w-4 h-4" />
      case '3': return <Users className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-400'
    if (score >= 3) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 4) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (score >= 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const getTotalScoreColor = (score: number) => {
    if (score >= 32) return 'text-green-400'
    if (score >= 24) return 'text-yellow-400'
    return 'text-red-400'
  }

  const renderAnalysisField = (value: any) => {
    if (typeof value === 'string') {
      return value
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  // Markdown renderer component with custom styling
  const MarkdownRenderer = ({ content }: { content: string }) => {
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
        {content}
      </ReactMarkdown>
    )
  }

  const extractScore = (text: string, category: string) => {
    // Try multiple patterns to extract the score
    const patterns = [
      new RegExp(`${category}[^\\d]*(\\d+)/5`, 'i'),
      new RegExp(`${category}[^\\d]*(\\d+)`, 'i'),
      new RegExp(`(\\d+)/5[^\\d]*${category}`, 'i'),
      new RegExp(`(\\d+)[^\\d]*${category}`, 'i')
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const score = parseInt(match[1])
        // Ensure score is within valid range (1-5)
        if (score >= 1 && score <= 5) {
          return score
        }
      }
    }
    
    // If no valid score found, return 0
    return 0
  }

  const extractTotalScore = (text: string) => {
    const regex = /Pontuação Total:\s*(\d+)\/40/i
    const match = text.match(regex)
    return match ? parseInt(match[1]) : 0
  }

  const handleExport = () => {
    // TODO: Implement PDF export
    window.print()
  }

  const handleShare = () => {
    // TODO: Implement sharing functionality
    navigator.clipboard.writeText(window.location.href)
  }

  // Extract scores from the analysis
  const scoringData = analysisResult.scoring
  console.log('🔍 Scoring data structure:', scoringData)
  
  // Handle different scoring data formats
  let scores: any = {}
  
  if (typeof scoringData === 'object' && scoringData !== null) {
    // If scoring data is an object with individual properties
    if (scoringData.clareza !== undefined) {
      scores = {
        clareza: scoringData.clareza || 0,
        tom: scoringData.tom || 0,
        envolvimento: scoringData.envolvimento || 0,
        descoberta: scoringData.descoberta || 0,
        entrega: scoringData.entrega || 0,
        objeções: scoringData.objeções || 0,
        estrutura: scoringData.estrutura || 0,
        fechamento: scoringData.fechamento || 0
      }
    } else if (scoringData.raw) {
      // If scoring data has a raw text property
      const scoringText = scoringData.raw
      console.log('🔍 Scoring text from raw:', scoringText)
      
      scores = {
        clareza: extractScore(scoringText, 'Clareza e Fluência da Fala'),
        tom: extractScore(scoringText, 'Tom e Controlo'),
        envolvimento: extractScore(scoringText, 'Envolvimento Conversacional'),
        descoberta: extractScore(scoringText, 'Eficácia na Descoberta de Necessidades'),
        entrega: extractScore(scoringText, 'Entrega de Valor e Ajuste da Solução'),
        objeções: extractScore(scoringText, 'Habilidades de Tratamento de Objeções'),
        estrutura: extractScore(scoringText, 'Estrutura e Controlo da Reunião'),
        fechamento: extractScore(scoringText, 'Conclusão e Próximos Passos')
      }
    }
  } else if (typeof scoringData === 'string') {
    // If scoring data is a string
    console.log('🔍 Scoring text from string:', scoringData)
    
    scores = {
      clareza: extractScore(scoringData, 'Clareza e Fluência da Fala'),
      tom: extractScore(scoringData, 'Tom e Controlo'),
      envolvimento: extractScore(scoringData, 'Envolvimento Conversacional'),
      descoberta: extractScore(scoringData, 'Eficácia na Descoberta de Necessidades'),
      entrega: extractScore(scoringData, 'Entrega de Valor e Ajuste da Solução'),
      objeções: extractScore(scoringData, 'Habilidades de Tratamento de Objeções'),
      estrutura: extractScore(scoringData, 'Estrutura e Controlo da Reunião'),
      fechamento: extractScore(scoringData, 'Conclusão e Próximos Passos')
    }
  }
  
  // Ensure all scores are within valid range (1-5)
  Object.keys(scores).forEach(key => {
    if (typeof scores[key] === 'number') {
      if (scores[key] < 1 || scores[key] > 5) {
        console.warn(`⚠️ Invalid score for ${key}: ${scores[key]}, setting to 0`)
        scores[key] = 0
      }
    } else {
      scores[key] = 0
    }
  })
  
  // Extract total score
  const scoringText = typeof scoringData === 'string' ? scoringData : scoringData?.raw || ''
  const totalScore = extractTotalScore(scoringText)
  
  console.log('🔍 Final extracted scores:', scores)

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Sales Call Analysis Report</h1>
                  <p className="text-white/70">{fileName} • {uploadDate}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleShare}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                onClick={handleExport}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {onClose && (
                <Button 
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'summary', label: 'Executive Summary', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'detailed', label: 'Detailed Analysis', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'transcript', label: 'Transcript', icon: <MessageSquare className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-white/60 hover:text-white/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 flex-1 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Call Type */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span>Tipo de Call</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  {getCallTypeIcon(analysisResult.callType)}
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {getCallTypeLabel(analysisResult.callType)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Pontos Fortes */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ThumbsUp className="w-5 h-5 text-green-400" />
                  <span>Pontos Fortes 👍</span>
                </CardTitle>
                <CardDescription>
                  Colocar todos os pontos que foram respeitados na estrutura e discurso do cliente nesta reunião de Role Play. Identificar tanto as coisas incríveis e excelentes que ele fez bem, mas também passos cruciais que ele concretizou na Role Play.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.strengths ? (
                  <div className="space-y-4">
                    {(() => {
                      const strengthsText = renderAnalysisField(analysisResult.strengths)
                      
                      // Handle different data structures
                      let content = strengthsText
                      if (typeof strengthsText === 'object') {
                        if (strengthsText.raw) {
                          content = strengthsText.raw
                        } else if (strengthsText.description) {
                          content = strengthsText.description
                        } else if (Array.isArray(strengthsText)) {
                          content = strengthsText.map(item => 
                            typeof item === 'object' && item.description ? item.description : String(item)
                          ).join('\n\n')
                        }
                      }
                      
                      // Convert bullet points to markdown format
                      const markdownContent = content
                        .replace(/(?:\n|^)(?:[-•]\s*|\.\s*-\s*)/g, '\n• ') // Convert bullet points to markdown
                        .replace(/\n\n+/g, '\n\n') // Clean up multiple line breaks
                        .trim()
                      
                      return (
                        <div className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={markdownContent} />
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No specific strengths identified</p>
                )}
              </CardContent>
            </Card>

            {/* Pontos Fracos */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ThumbsDown className="w-5 h-5 text-red-400" />
                  <span>Pontos Fracos 👎</span>
                </CardTitle>
                <CardDescription>
                  Todas as falhas sejam elas diretas ou indiretas, ou seja, falhas de ter feito algo erradamente ou por não ter feito algo que era crucial/necessário ter feito.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.weaknesses ? (
                  <div className="space-y-4">
                    {(() => {
                      const weaknessesText = renderAnalysisField(analysisResult.weaknesses)
                      
                      // Handle different data structures
                      let content = weaknessesText
                      if (typeof weaknessesText === 'object') {
                        if (weaknessesText.raw) {
                          content = weaknessesText.raw
                        } else if (weaknessesText.description) {
                          content = weaknessesText.description
                        } else if (Array.isArray(weaknessesText)) {
                          content = weaknessesText.map(item => 
                            typeof item === 'object' && item.description ? item.description : String(item)
                          ).join('\n\n')
                        }
                      }
                      
                      // Convert bullet points to markdown format
                      const markdownContent = content
                        .replace(/(?:\n|^)(?:[-•]\s*|\.\s*-\s*)/g, '\n• ') // Convert bullet points to markdown
                        .replace(/\n\n+/g, '\n\n') // Clean up multiple line breaks
                        .trim()
                      
                      return (
                        <div className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={markdownContent} />
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No specific areas for improvement identified</p>
                )}
              </CardContent>
            </Card>

            {/* Resumo da Call */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span>Resumo da Call</span>
                </CardTitle>
                <CardDescription>
                  Análise detalhada dos momentos fortes e fracos do comercial ao longo da reunião
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Momentos Fortes do Comercial */}
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h4 className="font-semibold text-green-400 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Momentos Fortes do Comercial:
                    </h4>
                    <div className="space-y-2 text-white/80 text-sm">
                      {analysisResult.callSummary ? (
                        (() => {
                          const summaryText = renderAnalysisField(analysisResult.callSummary)
                          const strongMoments = summaryText.match(/Momentos Fortes do Comercial:(.*?)(?=Momentos Fracos do Comercial:|$)/s)
                          
                          if (strongMoments) {
                            const moments = strongMoments[1].trim()
                            const inicio = moments.match(/- Início:\s*(.*?)(?=\n- |$)/s)
                            const meio = moments.match(/- Meio:\s*(.*?)(?=\n- |$)/s)
                            const fim = moments.match(/- Fim:\s*(.*?)(?=\n- |$)/s)
                            
                            return (
                              <>
                                {inicio && (
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium text-green-300">• Início:</span>
                                    <span>{inicio[1].trim()}</span>
                                  </div>
                                )}
                                {meio && (
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium text-green-300">• Meio:</span>
                                    <span>{meio[1].trim()}</span>
                                  </div>
                                )}
                                {fim && (
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium text-green-300">• Fim:</span>
                                    <span>{fim[1].trim()}</span>
                                  </div>
                                )}
                              </>
                            )
                          }
                          
                          // Fallback to parsing line by line
                          return summaryText.split('\n').map((line: string, index: number) => {
                            if (line.includes('Início:') || line.includes('Meio:') || line.includes('Fim:')) {
                              const [phase, ...content] = line.split(':')
                              if (content.length > 0) {
                                return (
                                  <div key={index} className="flex items-start space-x-2">
                                    <span className="font-medium text-green-300">• {phase.trim()}:</span>
                                    <span>{content.join(':').trim()}</span>
                                  </div>
                                )
                              }
                            }
                            return null
                          }).filter(Boolean)
                        })()
                      ) : (
                        <p className="text-white/60 text-sm">Análise dos momentos fortes não disponível</p>
                      )}
                    </div>
                  </div>

                  {/* Momentos Fracos do Comercial */}
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-semibold text-red-400 mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Momentos Fracos do Comercial:
                    </h4>
                    <div className="space-y-2 text-white/80 text-sm">
                      {analysisResult.callSummary ? (
                        (() => {
                          const summaryText = renderAnalysisField(analysisResult.callSummary)
                          const weakMoments = summaryText.match(/Momentos Fracos do Comercial:(.*?)(?=Momentos Fortes do Comercial:|$)/s)
                          
                          if (weakMoments) {
                            const moments = weakMoments[1].trim()
                            const inicio = moments.match(/- Início:\s*(.*?)(?=\n- |$)/s)
                            const meio = moments.match(/- Meio:\s*(.*?)(?=\n- |$)/s)
                            const fim = moments.match(/- Fim:\s*(.*?)(?=\n- |$)/s)
                            
                            return (
                              <>
                                {inicio && (
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium text-red-300">• Início:</span>
                                    <span>{inicio[1].trim()}</span>
                                  </div>
                                )}
                                {meio && (
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium text-red-300">• Meio:</span>
                                    <span>{meio[1].trim()}</span>
                                  </div>
                                )}
                                {fim && (
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium text-red-300">• Fim:</span>
                                    <span>{fim[1].trim()}</span>
                                  </div>
                                )}
                              </>
                            )
                          }
                          
                          // Fallback to parsing line by line
                          return summaryText.split('\n').map((line: string, index: number) => {
                            if (line.includes('Início:') || line.includes('Meio:') || line.includes('Fim:')) {
                              const [phase, ...content] = line.split(':')
                              if (content.length > 0) {
                                return (
                                  <div key={index} className="flex items-start space-x-2">
                                    <span className="font-medium text-red-300">• {phase.trim()}:</span>
                                    <span>{content.join(':').trim()}</span>
                                  </div>
                                )
                              }
                            }
                            return null
                          }).filter(Boolean)
                        })()
                      ) : (
                        <p className="text-white/60 text-sm">Análise dos momentos fracos não disponível</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dicas Gerais */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-yellow-400" />
                  <span>Dicas Gerais 🧠</span>
                </CardTitle>
                <CardDescription>
                  Conselhos que nem são pontos FORTES nem pontos FRACOS mas que poderam eventualmente melhorar a overall performance de reuniões futuras.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-white/90 text-sm">
                    • Practice active listening techniques to better understand client needs<br/>
                    • Develop a structured approach to objection handling<br/>
                    • Focus on building rapport early in the conversation<br/>
                    • Prepare follow-up questions to deepen discovery<br/>
                    • Work on maintaining conversation flow and momentum
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Foco para próximas calls */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 text-purple-400" />
                  <span>Foco para próximas calls 🚀</span>
                </CardTitle>
                <CardDescription>
                  Explicar concretamente como ultrapassar os obsctáculos encontrádos e melhorar as falhas delineadas, ao mesmo tempo que partilhando as ferramentas a serem utilizadas para ajudar todo o processo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <h4 className="font-semibold text-purple-400 mb-2">Immediate Focus Areas:</h4>
                    <ul className="text-white/80 text-sm space-y-1">
                      <li>• Improve opening techniques and rapport building</li>
                      <li>• Enhance discovery question framework</li>
                      <li>• Strengthen objection handling responses</li>
                      <li>• Develop clearer closing strategies</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <h4 className="font-semibold text-purple-400 mb-2">Tools & Techniques:</h4>
                    <ul className="text-white/80 text-sm space-y-1">
                      <li>• Use SPIN questioning methodology</li>
                      <li>• Implement BANT qualification framework</li>
                      <li>• Practice active listening exercises</li>
                      <li>• Develop objection handling scripts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Scoring */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Detailed Scoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Clareza e Fluência da Fala:</span>
                      <Badge className={getScoreBadgeColor(scores.clareza)}>
                        {scores.clareza}/5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Tom e Controlo:</span>
                      <Badge className={getScoreBadgeColor(scores.tom)}>
                        {scores.tom}/5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Envolvimento Conversacional:</span>
                      <Badge className={getScoreBadgeColor(scores.envolvimento)}>
                        {scores.envolvimento}/5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Efetividade na Descoberta de Necessidades:</span>
                      <Badge className={getScoreBadgeColor(scores.descoberta)}>
                        {scores.descoberta}/5
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Entrega de Valor e Ajuste da Solução:</span>
                      <Badge className={getScoreBadgeColor(scores.entrega)}>
                        {scores.entrega}/5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Habilidades de Lidar com Objeções:</span>
                      <Badge className={getScoreBadgeColor(scores.objeções)}>
                        {scores.objeções}/5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Estrutura e Controle da Reunião:</span>
                      <Badge className={getScoreBadgeColor(scores.estrutura)}>
                        {scores.estrutura}/5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Fechamento e Próximos Passos:</span>
                      <Badge className={getScoreBadgeColor(scores.fechamento)}>
                        {scores.fechamento}/5
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-lg">Total Score:</span>
                  <Badge className={`text-xl px-4 py-2 ${getTotalScoreColor(totalScore) ? 'bg-white/10 border-white/20' : ''}`}>
                    <span className={getTotalScoreColor(totalScore)}>{totalScore}/40</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* Call Type Analysis */}
            {analysisResult.callType && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getCallTypeIcon(analysisResult.callType)}
                    <span>Call Classification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white/5 rounded-lg border border-purple-500/30">
                    <p className="text-white/90">
                      This call was classified as a <strong>{getCallTypeLabel(analysisResult.callType)}</strong>. 
                      This type of call typically focuses on {analysisResult.callType === '1' ? 'discovering customer needs and understanding their context' : 
                      analysisResult.callType === '2' ? 'following up on previous interactions and presenting solutions' : 
                      'addressing specific questions and concerns about the product or service'}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Detailed Scoring */}
            {analysisResult.scoring && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span>Detailed Scoring</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white/5 rounded-lg border border-yellow-500/30">
                    <p className="text-white/90 text-sm whitespace-pre-wrap">
                      {renderAnalysisField(analysisResult.scoring)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Call Transcript</span>
              </CardTitle>
              <CardDescription>
                Full transcription of the sales call for reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 max-h-96 overflow-y-auto">
                <p className="text-white/80 text-sm whitespace-pre-wrap">
                  {analysisResult.transcription || 'Transcript not available'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
