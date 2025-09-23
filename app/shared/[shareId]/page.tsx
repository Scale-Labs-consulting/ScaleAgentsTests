'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  AlertCircle,
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
  Rocket,
  Phone,
  HelpCircle,
  Zap,
  FileText,
  Loader2,
  Copy
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

export default function SharedAnalysisPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (shareId) {
      fetchSharedAnalysis()
    }
  }, [shareId])

  const fetchSharedAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-analyst/shared/${shareId}`)
      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.analysis)
      } else {
        setError(result.error || 'Análise não encontrada')
      }
    } catch (err) {
      console.error('Error fetching shared analysis:', err)
      setError('Erro ao carregar a análise')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">A carregar análise...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Análise não encontrada</h1>
          <p className="text-white/70">{error || 'Esta análise não existe ou expirou.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-white text-xs font-bold tracking-wider">SCALELABS</div>
              <div>
                <h1 className="text-xl font-bold text-white">ScaleAgents</h1>
                <p className="text-slate-300 text-sm">Análise de Vendas Partilhada</p>
              </div>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center">
              <Share2 className="w-3 h-3 mr-1" />
              Partilhado
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analysis Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{analysis.title}</h2>
            </div>
            
            {/* Transcript Section */}
            {showTranscript && (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Transcrição da Chamada
                </h3>
                <div className="max-h-96 overflow-y-auto">
                  {(() => {
                    const transcription = analysis.transcription || analysis.analysis?.transcription || ''
                    
                    if (!transcription) {
                      return <p className="text-white/60 text-sm">Transcrição não disponível</p>
                    }
                    
                    // Check if transcription has speaker diarization (contains "Speaker" or similar patterns)
                    const hasSpeakerDiarization = transcription.includes('Speaker') || 
                      transcription.includes('speaker') || 
                      transcription.match(/Speaker \d+/i)
                    
                    if (hasSpeakerDiarization) {
                      // Format with speaker diarization
                      const lines = transcription.split('\n')
                      return (
                        <div className="space-y-3">
                          {lines.map((line: string, index: number) => {
                            if (line.trim() === '') return null
                            
                            // Check if line contains speaker information
                            const speakerMatch = line.match(/^(Speaker \d+)/i)
                            if (speakerMatch) {
                              const speaker = speakerMatch[1]
                              const text = line.replace(/^Speaker \d+/i, '').trim()
                              const isEven = index % 2 === 0
                              
                              return (
                                <div key={index} className={`p-3 rounded-lg border ${
                                  isEven ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'
                                }`}>
                                  <div className="flex items-start space-x-3">
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                      isEven ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                                    }`}>
                                      {speaker}
                                    </div>
                                    <p className="text-white/90 text-sm leading-relaxed flex-1">
                                      {text}
                                    </p>
                                  </div>
                                </div>
                              )
                            } else {
                              // Regular text without speaker identification
                              return (
                                <p key={index} className="text-white/80 text-sm leading-relaxed">
                                  {line}
                                </p>
                              )
                            }
                          })}
                        </div>
                      )
                    } else {
                      // No speaker diarization - show as plain text
                      return (
                        <>
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-300 text-sm font-medium">Sem Identificação de Orador</span>
                            </div>
                            <p className="text-yellow-200/80 text-xs">
                              Esta transcrição não possui identificação de oradores. Para uma melhor análise, 
                              certifique-se de que o speaker diarization está ativado.
                            </p>
                          </div>
                          <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
                            {transcription}
                          </p>
                        </>
                      )
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Analysis Summary - Single Purple Box */}
            <div className="bg-purple-600/30 p-4 rounded-lg border border-purple-500/40">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-white/90 block text-xs">Data:</span>
                  <p className="text-white font-medium">{new Date(analysis.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
                <div>
                  <span className="text-white/90 block text-xs">Estado:</span>
                  <p className="text-white font-medium capitalize">Concluído</p>
                </div>
                <div>
                  <span className="text-white/90 block text-xs">Tipo de Chamada:</span>
                  <p className="text-white font-medium">{analysis.analysis?.callType || analysis.analysis?.call_type || analysis.call_type || 'N/A'}</p>
                </div>
                {analysis.score > 0 && (
                  <div>
                    <span className="text-white/90 block text-xs">Pontuação:</span>
                    <p className="text-white font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {analysis.score}/40
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Details */}
            {analysis.analysis && (
              <div className="space-y-4">
                
                {/* Pontos Fortes */}
                {(analysis.analysis?.analysis_fields?.pontosFortes || analysis.analysis?.analysis?.pontosFortes || analysis.analysis?.pontosFortes) && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Pontos Fortes</h3>
                    <div className="text-white/90 text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-white">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-white/90 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-outside mb-3 space-y-2 text-white/90 pl-4">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-outside mb-3 space-y-2 text-white/90 pl-4">{children}</ol>,
                          li: ({children}) => <li className="mb-2 text-white/90 leading-relaxed">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-white/80">{children}</em>,
                          code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-green-500 pl-3 italic text-white/80 mb-3">{children}</blockquote>,
                        }}
                      >
                        {analysis.analysis?.analysis_fields?.pontosFortes || analysis.analysis?.analysis?.pontosFortes || analysis.analysis?.pontosFortes}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {/* Pontos de Melhoria */}
                {(analysis.analysis?.analysis_fields?.pontosFracos || analysis.analysis?.analysis?.pontosFracos || analysis.analysis?.pontosFracos) && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Pontos de Melhoria</h3>
                    <div className="text-white/90 text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-white">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-white/90 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-outside mb-3 space-y-2 text-white/90 pl-4">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-outside mb-3 space-y-2 text-white/90 pl-4">{children}</ol>,
                          li: ({children}) => <li className="mb-2 text-white/90 leading-relaxed">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-white/80">{children}</em>,
                          code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-red-500 pl-3 italic text-white/80 mb-3">{children}</blockquote>,
                        }}
                      >
                        {analysis.analysis?.analysis_fields?.pontosFracos || analysis.analysis?.analysis?.pontosFracos || analysis.analysis?.pontosFracos}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {/* Resumo da Chamada */}
                {(analysis.analysis?.analysis_fields?.resumoDaCall || analysis.analysis?.analysis?.resumoDaCall || analysis.analysis?.resumoDaCall) && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Resumo da Chamada</h3>
                    <div className="text-white/90 text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-white">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-white/90 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-white/90">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-outside mb-3 space-y-1 text-white/90 pl-4">{children}</ol>,
                          li: ({children}) => <li className="mb-1 text-white/90">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-white/80">{children}</em>,
                          code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-3 italic text-white/80 mb-3">{children}</blockquote>,
                        }}
                      >
                        {analysis.analysis?.analysis_fields?.resumoDaCall || analysis.analysis?.analysis?.resumoDaCall || analysis.analysis?.resumoDaCall}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {/* Dicas Gerais */}
                {(analysis.analysis?.analysis_fields?.dicasGerais || analysis.analysis?.analysis?.dicasGerais || analysis.analysis?.dicasGerais) && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Dicas Gerais</h3>
                    <div className="text-white/90 text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-white">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-white/90 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-white/90">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-outside mb-3 space-y-1 text-white/90 pl-4">{children}</ol>,
                          li: ({children}) => <li className="mb-1 text-white/90">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-white/80">{children}</em>,
                          code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-3 italic text-white/80 mb-3">{children}</blockquote>,
                        }}
                      >
                        {analysis.analysis?.analysis_fields?.dicasGerais || analysis.analysis?.analysis?.dicasGerais || analysis.analysis?.dicasGerais}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {/* Foco para Próximas Calls */}
                {(analysis.analysis?.analysis_fields?.focoParaProximasCalls || analysis.analysis?.analysis?.focoParaProximasCalls || analysis.analysis?.focoParaProximasCalls) && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Foco para Próximas Calls</h3>
                    <div className="text-white/90 text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-white">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-white/90 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-white/90">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-outside mb-3 space-y-1 text-white/90 pl-4">{children}</ol>,
                          li: ({children}) => <li className="mb-1 text-white/90">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-white/80">{children}</em>,
                          code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-3 italic text-white/80 mb-3">{children}</blockquote>,
                        }}
                      >
                        {analysis.analysis?.analysis_fields?.focoParaProximasCalls || analysis.analysis?.analysis?.focoParaProximasCalls || analysis.analysis?.focoParaProximasCalls}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {/* 8 Scoring Fields - Always Show */}
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-6">Pontuação da Chamada</h3>
                  <div className="space-y-6">
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Clareza e Fluência da Fala</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.clarezaFluenciaFala ?? analysis.analysis?.analysis?.clarezaFluenciaFala ?? analysis.analysis?.clarezaFluenciaFala ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaClarezaFluenciaFala || analysis.analysis?.justificativaClarezaFluenciaFala) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaClarezaFluenciaFala || analysis.analysis?.justificativaClarezaFluenciaFala}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Tom e Controlo</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.tomControlo ?? analysis.analysis?.analysis?.tomControlo ?? analysis.analysis?.tomControlo ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaTomControlo || analysis.analysis?.justificativaTomControlo) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaTomControlo || analysis.analysis?.justificativaTomControlo}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Envolvimento Conversacional</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.envolvimentoConversacional ?? analysis.analysis?.analysis?.envolvimentoConversacional ?? analysis.analysis?.envolvimentoConversacional ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaEnvolvimentoConversacional || analysis.analysis?.justificativaEnvolvimentoConversacional) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaEnvolvimentoConversacional || analysis.analysis?.justificativaEnvolvimentoConversacional}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Efetividade na Descoberta de Necessidades</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.efetividadeDescobertaNecessidades ?? analysis.analysis?.analysis?.efetividadeDescobertaNecessidades ?? analysis.analysis?.efetividadeDescobertaNecessidades ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaEfetividadeDescobertaNecessidades || analysis.analysis?.justificativaEfetividadeDescobertaNecessidades) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaEfetividadeDescobertaNecessidades || analysis.analysis?.justificativaEfetividadeDescobertaNecessidades}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Entrega de Valor e Ajuste da Solução</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.entregaValorAjusteSolucao ?? analysis.analysis?.analysis?.entregaValorAjusteSolucao ?? analysis.analysis?.entregaValorAjusteSolucao ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaEntregaValorAjusteSolucao || analysis.analysis?.justificativaEntregaValorAjusteSolucao) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaEntregaValorAjusteSolucao || analysis.analysis?.justificativaEntregaValorAjusteSolucao}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Habilidades de Lidar com Objeções</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.habilidadesLidarObjeccoes ?? analysis.analysis?.analysis?.habilidadesLidarObjeccoes ?? analysis.analysis?.habilidadesLidarObjeccoes ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaHabilidadesLidarObjeccoes || analysis.analysis?.justificativaHabilidadesLidarObjeccoes) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaHabilidadesLidarObjeccoes || analysis.analysis?.justificativaHabilidadesLidarObjeccoes}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Estrutura e Controle da Reunião</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.estruturaControleReuniao ?? analysis.analysis?.analysis?.estruturaControleReuniao ?? analysis.analysis?.estruturaControleReuniao ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaEstruturaControleReuniao || analysis.analysis?.justificativaEstruturaControleReuniao) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaEstruturaControleReuniao || analysis.analysis?.justificativaEstruturaControleReuniao}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="border-l-4 border-white/30 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">Fechamento e Próximos Passos</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-white">{analysis.analysis?.analysis_fields?.fechamentoProximosPassos ?? analysis.analysis?.analysis?.fechamentoProximosPassos ?? analysis.analysis?.fechamentoProximosPassos ?? 0}</span>
                            <span className="text-white/60 text-sm">/5</span>
                          </div>
                        </div>
                        {(analysis.analysis?.analysis_fields?.justificativaFechamentoProximosPassos || analysis.analysis?.justificativaFechamentoProximosPassos) && (
                          <div className="text-white/80 text-sm leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 text-white/80 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/80">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/80 pl-4">{children}</ol>,
                                li: ({children}) => <li className="mb-1 text-white/80">{children}</li>,
                              }}
                            >
                              {analysis.analysis?.analysis_fields?.justificativaFechamentoProximosPassos || analysis.analysis?.justificativaFechamentoProximosPassos}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                
              </div>
            )}
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-1 bg-slate-800/50 p-4 rounded-lg">
            <div className="space-y-6">
              {/* Share Section */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Partilhar</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = window.location.href
                    navigator.clipboard.writeText(url)
                  }}
                  className="w-full bg-purple-600/30 border-purple-500/40 text-white hover:bg-purple-600/40 rounded-md"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copiar link
                </Button>
              </div>

              {/* Transcript Section */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Transcrição</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const transcript = analysis.transcription || analysis.analysis?.transcription || 'Transcrição não disponível'
                      try {
                        await navigator.clipboard.writeText(transcript)
                      } catch (err) {
                        console.error('Failed to copy transcript:', err)
                      }
                    }}
                    className="w-full bg-purple-600/30 border-purple-500/40 text-white hover:bg-purple-600/40 rounded-md"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar transcrição
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full bg-purple-600/30 border-purple-500/40 text-white hover:bg-purple-600/40 rounded-md"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição'}
                  </Button>
                </div>
              </div>

              {/* Print Section */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="w-full bg-purple-600/30 border-purple-500/40 text-white hover:bg-purple-600/40 rounded-md"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
