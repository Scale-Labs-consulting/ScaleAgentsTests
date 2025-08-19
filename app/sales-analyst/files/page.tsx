'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SalesReport } from '@/components/sales-report'
import { 
  ArrowLeft,
  MessageSquare, 
  Clock,
  Star,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Search,
  Filter
} from 'lucide-react'

interface SalesCall {
  id: string
  title: string
  fileUrl: string
  duration: number
  uploadDate: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  feedback?: string
  score?: number
  transcription?: string
  fileSize?: string
}

export default function SalesAnalystFilesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [salesCalls, setSalesCalls] = useState<SalesCall[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)
  const [selectedCall, setSelectedCall] = useState<SalesCall | null>(null)
  const [selectedCallTranscription, setSelectedCallTranscription] = useState<string>('')
  const [showReport, setShowReport] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Handle authentication redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch analyses from Supabase
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return
      
      try {
        setLoadingAnalyses(true)
        const response = await fetch(`/api/sales-analyst/analyses?userId=${user.id}`)
        const result = await response.json()
        
        if (result.success) {
          // Transform Supabase data to match our interface
          const transformedCalls = result.analyses.map((analysis: any) => {
            // Generate a better title
            let displayTitle = 'Análise'
            console.log('🔍 Processing analysis:', analysis.id)
            console.log('🔍 Analysis title:', analysis.title)
            console.log('🔍 Analysis metadata:', analysis.analysis_metadata)
            
            if (analysis.title && analysis.title.trim()) {
              displayTitle = `Análise ${analysis.title}`
              console.log('✅ Using analysis.title:', displayTitle)
            } else {
              // Try to extract filename from analysis metadata or use ID as fallback
              const metadata = analysis.analysis_metadata || {}
              const originalFileName = metadata.original_file_name || analysis.title
              if (originalFileName && originalFileName.trim()) {
                displayTitle = `Análise ${originalFileName}`
                console.log('✅ Using metadata.original_file_name:', displayTitle)
              } else {
                displayTitle = `Análise ${analysis.id.slice(0, 8)}`
                console.log('⚠️ Using fallback ID:', displayTitle)
              }
            }
            
            return {
              id: analysis.id,
              title: displayTitle,
              fileUrl: '',
              duration: 0,
              uploadDate: new Date(analysis.created_at).toISOString().split('T')[0],
              status: analysis.status as 'completed' | 'processing' | 'failed',
              feedback: analysis.feedback || '',
              score: analysis.score || 0,
              transcription: analysis.transcription || '',
              fileSize: 'N/A'
            }
          })
          
          setSalesCalls(transformedCalls)
        } else {
          console.error('Failed to fetch analyses:', result.error)
        }
      } catch (error) {
        console.error('Error fetching analyses:', error)
      } finally {
        setLoadingAnalyses(false)
      }
    }

    fetchAnalyses()
  }, [user])

  if (loading || loadingAnalyses) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">
            {loading ? 'Loading...' : 'Loading analyses...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleCallSelect = async (call: SalesCall) => {
    setSelectedCall(call)
    
    // Fetch transcription if available
    try {
      const response = await fetch(`/api/sales-analyst/transcription/${call.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedCallTranscription(data.transcription || '')
      }
    } catch (error) {
      console.error('Error fetching transcription:', error)
    }
  }

  const getStatusIcon = (status: SalesCall['status']) => {
    switch (status) {
      case 'uploaded':
        return <FileText className="w-4 h-4 text-blue-400" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const filteredCalls = salesCalls.filter(call => {
    const matchesSearch = call.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: SalesCall['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

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
                  variant="ghost" 
                  onClick={handleBackToDashboard}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao dashboard
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Ficheiros de Análise</h1>
                  <p className="text-white/70">Ver e gerir as suas análises de chamadas de vendas</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => router.push('/sales-analyst')}
                >
                  Upload New
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Filters and Search */}
          <div className="mb-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Procurar ficheiros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-white/50" />
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 appearance-none pr-8 cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="all" className="bg-gray-800 text-white">Todos os Estados</option>
                        <option value="completed" className="bg-gray-800 text-white">Concluído</option>
                        <option value="processing" className="bg-gray-800 text-white">A Processar</option>
                        <option value="failed" className="bg-gray-800 text-white">Falhou</option>
                        <option value="uploaded" className="bg-gray-800 text-white">Carregado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Files List */}
          <div className="space-y-4">
            {filteredCalls.length === 0 ? (
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Nenhum ficheiro encontrado</h3>
                  <p className="text-white/60 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Tente ajustar a sua pesquisa ou filtros'
                      : 'Carregue a sua primeira chamada de vendas para começar'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button 
                      onClick={() => router.push('/sales-analyst')}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    >
                      Carregar Primeiro Ficheiro
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredCalls.map((call) => (
                <Card 
                  key={call.id}
                  className={`bg-white/10 border-white/20 backdrop-blur-md transition-all duration-300 ${
                    call.status === 'completed' 
                      ? 'hover:bg-white/15 cursor-pointer hover:border-purple-500/50' 
                      : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (call.status === 'completed') {
                      router.push(`/sales-analyst/report/${call.id}`)
                    } else {
                      handleCallSelect(call)
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(call.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{call.title}</h3>
                          <p className="text-sm text-white/60">
                            {call.uploadDate} • {formatDuration(call.duration)} • {call.fileSize}
                            {call.status === 'completed' && (
                              <span className="ml-2 text-purple-400 text-xs">• Clique para ver relatório</span>
                            )}
                          </p>
                          {call.feedback && (
                            <p className="text-sm text-white/70 mt-2 line-clamp-2">
                              {call.feedback}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {call.score && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Star className="w-3 h-3 mr-1" />
                            {call.score}/40
                          </Badge>
                        )}
                        <Badge className={getStatusColor(call.status)}>
                          {call.status === 'completed' ? 'Concluído' : 
                           call.status === 'processing' ? 'A Processar' : 
                           call.status === 'failed' ? 'Falhou' : 
                           call.status === 'uploaded' ? 'Carregado' : call.status}
                        </Badge>
                        
                        <div className="flex items-center space-x-1">
                          {call.status === 'completed' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-white/60 hover:text-white hover:bg-white/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/sales-analyst/report/${call.id}`)
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {call.status === 'failed' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {call.status === 'processing' && (
                      <div className="mt-4 flex items-center space-x-2 text-sm text-yellow-400">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Análise de IA em progresso...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analysis Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedCall.title}</h2>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedCall(null)
                  setSelectedCallTranscription('')
                }}
                className="text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Duration:</span>
                  <p className="text-white">{formatDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <span className="text-white/60">Upload Date:</span>
                  <p className="text-white">{selectedCall.uploadDate}</p>
                </div>
                <div>
                  <span className="text-white/60">Status:</span>
                  <p className="text-white capitalize">{selectedCall.status}</p>
                </div>
                {selectedCall.score && (
                  <div>
                    <span className="text-white/60">Score:</span>
                    <p className="text-white">{selectedCall.score}/10</p>
                  </div>
                )}
              </div>

              {selectedCall.feedback && (
                <div>
                  <h3 className="font-semibold mb-2">AI Feedback</h3>
                  <div className="p-4 bg-white/5 rounded border border-white/10 max-h-60 overflow-y-auto">
                    <p className="text-white/80">{selectedCall.feedback}</p>
                  </div>
                </div>
              )}

              {/* Transcription Display */}
              {selectedCallTranscription && (
                <div>
                  <h3 className="font-semibold mb-2">📝 Transcription</h3>
                  <div className="p-4 bg-white/5 rounded border border-white/10 max-h-60 overflow-y-auto">
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{selectedCallTranscription}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {selectedCall.status === 'completed' && (
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    onClick={() => {
                      setReportData({
                        analysisResult: selectedCall,
                        transcriptionStats: { wordCount: selectedCallTranscription.split(' ').length },
                        fileName: selectedCall.title,
                        uploadDate: selectedCall.uploadDate
                      })
                      setShowReport(true)
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    setSelectedCall(null)
                    setSelectedCallTranscription('')
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 z-50">
          <SalesReport 
            analysisResult={reportData.analysisResult}
            transcriptionStats={reportData.transcriptionStats}
            fileName={reportData.fileName}
            uploadDate={reportData.uploadDate}
            onClose={() => setShowReport(false)}
          />
        </div>
      )}
    </div>
  )
}
