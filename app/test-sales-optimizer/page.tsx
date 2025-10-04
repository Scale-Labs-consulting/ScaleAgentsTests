'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  Play, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Brain,
  Zap,
  Star
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface SalesCall {
  id: string
  title: string
  file_url: string
  file_size?: number
  call_type?: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  duration?: number
  created_at: string
}

interface SalesOptimizerAnalysis {
  id: string
  sales_call_id: string
  title?: string
  status: 'processing' | 'completed' | 'failed'
  call_type?: string
  feedback: string
  score: number
  analysis: any
  transcription: string
  created_at: string
}

export default function TestSalesOptimizerPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State management
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [salesCall, setSalesCall] = useState<SalesCall | null>(null)
  const [analyses, setAnalyses] = useState<SalesOptimizerAnalysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<SalesOptimizerAnalysis | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('upload')

  const handleFileUpload = async () => {
    if (!uploadedFile || !user) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('userId', user.id)
      formData.append('title', uploadedFile.name)

      const response = await fetch('/api/sales-optimizer/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setSalesCall(data)
      setActiveTab('analyze')
      
      toast({
        title: 'Ficheiro carregado com sucesso!',
        description: 'Agora podes analisar a chamada.',
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível carregar o ficheiro.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!salesCall || !user) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 1000)

    try {
      const response = await fetch('/api/sales-optimizer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesCallId: salesCall.id,
          userId: user.id
        })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const analysis = await response.json()
      
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
      // Refresh analyses list
      await fetchAnalyses()
      
      setActiveTab('results')
      setSelectedAnalysis(analysis)
      
      toast({
        title: 'Análise concluída!',
        description: 'A tua chamada foi analisada com sucesso.',
      })
    } catch (error) {
      console.error('Analysis error:', error)
      clearInterval(progressInterval)
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar a chamada.',
        variant: 'destructive'
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const fetchAnalyses = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/sales-optimizer/analyses?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 32) return 'text-green-500'
    if (score >= 24) return 'text-yellow-500'
    if (score >= 16) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 32) return 'default'
    if (score >= 24) return 'secondary'
    if (score >= 16) return 'outline'
    return 'destructive'
  }

  const renderAnalysisDetails = (analysis: SalesOptimizerAnalysis) => {
    if (!analysis.analysis) return null

    const data = analysis.analysis

    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Score Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl font-bold">
                <span className={getScoreColor(data.totalScore || 0)}>
                  {data.totalScore || 0}
                </span>
                <span className="text-2xl text-gray-500">/40</span>
              </div>
              <Badge variant={getScoreBadgeVariant(data.totalScore || 0)}>
                {data.totalScore >= 32 ? 'Excelente' : 
                 data.totalScore >= 24 ? 'Bom' : 
                 data.totalScore >= 16 ? 'Médio' : 'Necessita Melhoria'}
              </Badge>
            </div>
            <Progress value={((data.totalScore || 0) / 40) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Detailed Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Scores Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'clarezaFluenciaFala', label: 'Clareza & Fluência' },
                { key: 'tomControlo', label: 'Tom & Controlo' },
                { key: 'envolvimentoConversacional', label: 'Envolvimento' },
                { key: 'efetividadeDescobertaNecessidades', label: 'Descoberta de Necessidades' },
                { key: 'entregaValorAjusteSolucao', label: 'Entrega de Valor' },
                { key: 'habilidadesLidarObjeccoes', label: 'Lidar com Objeções' },
                { key: 'estruturaControleReuniao', label: 'Controlo da Reunião' },
                { key: 'fechamentoProximosPassos', label: 'Fechamento' }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{label}</span>
                    <span className={`font-bold ${getScoreColor(data[key] || 0)}`}>
                      {data[key] || 0}/5
                    </span>
                  </div>
                  <Progress value={((data[key] || 0) / 5) * 100} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.pontosFortes || ''}
                readOnly
                className="min-h-[150px] bg-green-50 border-green-200"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-5 h-5" />
                Áreas de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.pontosFracos || ''}
                readOnly
                className="min-h-[150px] bg-orange-50 border-orange-200"
              />
            </CardContent>
          </Card>
        </div>

        {/* Call Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Resumo da Chamada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.resumoDaCall || ''}
              readOnly
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Foco para Próximas Chamadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.focoParaProximasCalls || ''}
              readOnly
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* General Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Dicas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.dicasGerais || ''}
              readOnly
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Sales Optimizer - Teste
          </h1>
          <p className="text-white/70 text-lg">
            Assistente avançado de análise de chamadas de vendas
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-white border-white/30">
              <Zap className="w-3 h-3 mr-1" />
              AI Avançado
            </Badge>
            <Badge variant="outline" className="text-white border-white/30">
              <Star className="w-3 h-3 mr-1" />
              Análise Detalhada
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10">
            <TabsTrigger value="upload" className="data-[state=active]:bg-white/20">
              Upload
            </TabsTrigger>
            <TabsTrigger value="analyze" className="data-[state=active]:bg-white/20">
              Analisar
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-white/20">
              Resultados
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/20">
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Carregar Chamada de Vendas</CardTitle>
                <CardDescription className="text-white/70">
                  Carrega um ficheiro MP4 da tua chamada de vendas para análise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70 mb-4">
                    Arrasta o ficheiro aqui ou clica para selecionar
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp4,.mov,.avi"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Selecionar Ficheiro
                  </Button>
                </div>

                {uploadedFile && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{uploadedFile.name}</p>
                        <p className="text-white/70 text-sm">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        onClick={handleFileUpload}
                        disabled={isUploading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isUploading ? 'A carregar...' : 'Carregar'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze" className="space-y-6">
            {salesCall ? (
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Analisar Chamada</CardTitle>
                  <CardDescription className="text-white/70">
                    Inicia a análise avançada da tua chamada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{salesCall.title}</p>
                        <p className="text-white/70 text-sm">
                          Status: <Badge variant="outline">{salesCall.status}</Badge>
                        </p>
                      </div>
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || salesCall.status !== 'uploaded'}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isAnalyzing ? 'Analisando...' : 'Analisar Chamada'}
                      </Button>
                    </div>

                    {isAnalyzing && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-white/70" />
                          <span className="text-white/70 text-sm">A processar análise...</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2" />
                        <p className="text-white/50 text-xs">
                          {Math.round(analysisProgress)}% concluído
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70">
                    Primeiro carrega uma chamada na aba Upload
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {selectedAnalysis ? (
              renderAnalysisDetails(selectedAnalysis)
            ) : (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70">
                    Nenhuma análise selecionada
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Análises</CardTitle>
                <CardDescription className="text-white/70">
                  Todas as análises anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => {
                        setSelectedAnalysis(analysis)
                        setActiveTab('results')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {analysis.title || 'Análise Sem Título'}
                          </p>
                          <p className="text-white/70 text-sm">
                            {new Date(analysis.created_at).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getScoreBadgeVariant(analysis.score)}>
                            {analysis.score}/40
                          </Badge>
                          <Badge variant="outline" className="text-white/70">
                            {analysis.call_type || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

