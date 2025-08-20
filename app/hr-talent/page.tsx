'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  FileText, 
  Users,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  Target,
  MessageSquare,
  Zap,
  Brain,
  Loader2,
  ArrowRight,
  XCircle,
  Download,
  Eye
} from 'lucide-react'

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  cvUrl: string
  cvContent?: string
  submissionDate: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  score?: number
  analysis?: any
}

export default function HRTalentPage() {
  const { user, initialized, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const [showAnalysisResults, setShowAnalysisResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Show loading while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">
            {loading ? 'A carregar...' : 'A inicializar...'}
          </p>
        </div>
      </div>
    )
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    // Simple authentication check
    if (!user || !user.id) {
      alert('Por favor, faça login para continuar.')
      router.push('/login')
      return
    }

    // Validate file types - accept CV formats
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
    for (const file of files) {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (!allowedExtensions.includes(fileExtension)) {
        alert(`Por favor, carregue apenas ficheiros PDF, DOC, DOCX, TXT, ou RTF. Ficheiro inválido: ${file.name}`)
        return
      }
    }

    setUploadedFiles(files)
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('A preparar o carregamento...')

    try {
      console.log('🔑 Getting access token...')
      console.log('👤 User ID:', user.id)
      
      // Simple session check - just get the current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session error:', error)
        throw new Error('Authentication error. Please log in again.')
      }

      if (!session) {
        throw new Error('No active session found. Please log in again.')
      }

      console.log('✅ Session validated successfully')

      // Upload CV files
      setUploadStatus(`A carregar ${files.length} ficheiros CV...`)
      setUploadProgress(20)

      const formData = new FormData()
      files.forEach(file => {
        formData.append('cvFiles', file)
      })
      formData.append('userId', user.id)
      formData.append('accessToken', session.access_token)

      const response = await fetch('/api/hr-talent/batch-upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Batch CV upload completed successfully!')
        console.log('📊 Summary:', result.summary)
        console.log('📊 Results:', result.results)
        
        setCandidates(result.qualifiedCandidates || [])
        setAnalysisResults(result.results || [])
        setShowAnalysisResults(true)
        setUploadStatus(`Processamento concluído! ${result.summary.successfulUploads}/${result.summary.totalFiles} ficheiros processados, ${result.summary.qualifiedCount} candidatos qualificados.`)
        setUploadProgress(100)
        
        // Reset upload state after 5 seconds
        setTimeout(() => {
          setUploadedFiles([])
          setIsUploading(false)
          setUploadProgress(0)
          setUploadStatus('')
        }, 5000)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
      
    } catch (error) {
      console.error('❌ CV upload error:', error)
      setUploadStatus(`Erro: ${error instanceof Error ? error.message : 'Upload failed'}`)
      setTimeout(() => {
        setUploadedFiles([])
        setIsUploading(false)
        setUploadProgress(0)
        setUploadStatus('')
      }, 3000)
    }
  }

  const analyzeCandidate = async (candidateId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session found')
      }

      const response = await fetch('/api/hr-talent/analyze-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId,
          userId: user.id,
          accessToken: session.access_token
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      
      if (result.success) {
        // Update the candidate in the list
        setCandidates(prev => prev.map(c => 
          c.id === candidateId 
            ? { ...c, status: 'completed', score: result.score, analysis: result.analysis }
            : c
        ))
        
        toast({
          title: "Análise concluída",
          description: `Candidato ${result.candidateName} analisado com sucesso`,
        })
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('❌ Analysis error:', error)
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : 'Analysis failed',
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
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
                  onClick={() => router.push('/dashboard')}
                  className="text-white hover:bg-white/10"
                >
                  ← Voltar ao Painel
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Agente de Recursos Humanos</h1>
                  <p className="text-white/70">Analise candidatos através de upload direto de CVs</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10"
                  onClick={() => router.push('/hr-talent/candidates')}
                >
                  Ver Candidatos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Upload Area */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Upload className="w-5 h-5" />
                  <span>Carregar CV do Candidato</span>
                </CardTitle>
                <CardDescription>
                  Carregue um ficheiro CV para análise automática do candidato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    {uploadedFiles.length > 0 
                      ? `${uploadedFiles.length} ficheiro(s) selecionado(s)` 
                      : 'Clique aqui para carregar ficheiros CV ou arraste'
                    }
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="text-white/60 mb-2 space-y-1">
                      <p>Ficheiros selecionados:</p>
                      {uploadedFiles.map((file, index) => (
                        <p key={index} className="text-sm">
                          • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-white/50 text-sm mb-4">Formatos Suportados: PDF (com extração de texto), DOC, DOCX, TXT, RTF</p>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-purple-500 rounded"></div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    >
                      Escolher Ficheiro
                    </Button>
                    {uploadedFiles.length > 0 && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setUploadedFiles([])
                          setIsUploading(false)
                          setUploadProgress(0)
                          setUploadStatus('')
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Progresso</span>
                      <span className="text-white/70">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Status Message */}
                {uploadStatus && !isUploading && (
                  <div className={`p-3 rounded-lg text-sm ${
                    uploadStatus.includes('failed') || uploadStatus.includes('error')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {uploadStatus}
                  </div>
                )}

                                 {/* View Candidates Button */}
                 <div className="text-center space-y-2">
                   <Button 
                     className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                     onClick={() => router.push('/hr-talent/candidates')}
                   >
                     <Users className="w-4 h-4 mr-2" />
                     Ver Todos os Candidatos
                   </Button>
                   
                   {showPreview && csvPreview.length > 0 && (
                     <Button 
                       variant="outline"
                       className="border-white/20 text-white hover:bg-white/10"
                       onClick={() => setShowPreview(!showPreview)}
                     >
                       <FileText className="w-4 h-4 mr-2" />
                       {showPreview ? 'Ocultar' : 'Mostrar'} Dados Extraídos
                     </Button>
                   )}
                 </div>
              </CardContent>
            </Card>
          </div>

                     {/* CSV Data Preview */}
           {showPreview && csvPreview.length > 0 && (
             <div className="max-w-4xl mx-auto mt-8">
               <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2 text-white">
                     <FileText className="w-5 h-5" />
                     <span>Dados Extraídos do CSV ({csvPreview.length} registos)</span>
                   </CardTitle>
                   <CardDescription>
                     Visualização dos dados brutos extraídos do ficheiro CSV
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                                           {csvPreview.slice(0, 5).map((record, index) => (
                        <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <h4 className="font-semibold text-white mb-2">Registo {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {Object.entries(record).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-white/60 font-medium">{key}:</span>
                                <p className="text-white break-words">
                                  {typeof value === 'string' && value.length > 100 
                                    ? `${value.substring(0, 100)}...` 
                                    : String(value) || 'N/A'
                                  }
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          {/* Show CV Content if available */}
                          {candidates[index]?.cvContent && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <h5 className="text-white/80 font-medium mb-2">Conteúdo do CV Extraído:</h5>
                              <div className="bg-white/5 p-3 rounded border border-white/10 max-h-40 overflow-y-auto">
                                <p className="text-white/70 text-xs whitespace-pre-wrap">
                                  {candidates[index].cvContent.length > 500 
                                    ? `${candidates[index].cvContent.substring(0, 500)}...`
                                    : candidates[index].cvContent
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                     {csvPreview.length > 5 && (
                       <div className="text-center text-white/60 text-sm">
                         Mostrando os primeiros 5 registos de {csvPreview.length} total
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}

           {/* Analysis Results Display */}
           {showAnalysisResults && analysisResults.length > 0 && (
             <div className="max-w-4xl mx-auto mt-8">
               <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2 text-white">
                     <Brain className="w-5 h-5" />
                     <span>Resultados da Análise ({analysisResults.length} candidatos)</span>
                   </CardTitle>
                   <CardDescription>
                     Output dos prompts de análise para cada candidato
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-6">
                     {analysisResults.map((result, index) => (
                       <div key={index} className="bg-white/5 p-6 rounded-lg border border-white/10">
                         <h4 className="font-semibold text-white mb-4 flex items-center">
                           <User className="w-4 h-4 mr-2" />
                           Candidato {index + 1}: {result.candidateName || 'Unknown'}
                         </h4>
                         
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           {/* Score Section */}
                           <div className="bg-white/5 p-4 rounded border border-white/10">
                             <h5 className="text-white/80 font-medium mb-2 flex items-center">
                               <BarChart3 className="w-4 h-4 mr-2" />
                               Pontuação Final
                             </h5>
                             <div className="text-3xl font-bold text-center mb-2">
                               <span className={`${
                                 result.score >= 7 ? 'text-green-400' : 
                                 result.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                               }`}>
                                 {result.score || 0}/10
                               </span>
                             </div>
                             <p className="text-white/60 text-sm text-center">
                               {result.score >= 7 ? 'Recomendado' : 
                                result.score >= 5 ? 'Com reservas' : 'Não recomendado'}
                             </p>
                           </div>

                           {/* Analysis Details */}
                           <div className="space-y-4">
                             {/* Prompt 1 Response */}
                             {result.prompt1_response && (
                               <div className="bg-white/5 p-3 rounded border border-white/10">
                                 <h6 className="text-white/80 font-medium mb-2 text-sm">Prompt 1 - Avaliação Principal:</h6>
                                 <p className="text-white/70 text-xs whitespace-pre-wrap">
                                   {result.prompt1_response}
                                 </p>
                               </div>
                             )}

                             {/* Prompt 2 Response */}
                             {result.prompt2_response && (
                               <div className="bg-white/5 p-3 rounded border border-white/10">
                                 <h6 className="text-white/80 font-medium mb-2 text-sm">Prompt 2 - Pontos Fortes:</h6>
                                 <p className="text-white/70 text-xs whitespace-pre-wrap">
                                   {result.prompt2_response}
                                 </p>
                               </div>
                             )}

                             {/* Prompt 3 Response */}
                             {result.prompt3_response && (
                               <div className="bg-white/5 p-3 rounded border border-white/10">
                                 <h6 className="text-white/80 font-medium mb-2 text-sm">Prompt 3 - Pontos de Atenção:</h6>
                                 <p className="text-white/70 text-xs whitespace-pre-wrap">
                                   {result.prompt3_response}
                                 </p>
                               </div>
                             )}

                             {/* Raw Analysis Content */}
                             {result.raw_content && (
                               <div className="bg-white/5 p-3 rounded border border-white/10">
                                 <h6 className="text-white/80 font-medium mb-2 text-sm">Conteúdo Bruto da Análise:</h6>
                                 <p className="text-white/70 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                                   {result.raw_content}
                                 </p>
                               </div>
                             )}
                           </div>
                         </div>

                         {/* Candidate Info */}
                         <div className="mt-4 pt-4 border-t border-white/10">
                           <h5 className="text-white/80 font-medium mb-2">Informações do Candidato:</h5>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                             <div>
                               <span className="text-white/60">Nome:</span>
                               <p className="text-white">{result.candidateName || 'N/A'}</p>
                             </div>
                             <div>
                               <span className="text-white/60">Email:</span>
                               <p className="text-white">{result.candidateEmail || 'N/A'}</p>
                             </div>
                             <div>
                               <span className="text-white/60">Posição:</span>
                               <p className="text-white">{result.candidatePosition || 'N/A'}</p>
                             </div>
                             <div>
                               <span className="text-white/60">Status:</span>
                               <Badge 
                                 variant={result.score >= 7 ? 'default' : 
                                         result.score >= 5 ? 'secondary' : 'destructive'}
                                 className="text-xs"
                               >
                                 {result.score >= 7 ? 'Qualificado' : 
                                  result.score >= 5 ? 'Em Análise' : 'Rejeitado'}
                               </Badge>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}

           {/* Candidates List */}
           {candidates.length > 0 && (
             <div className="max-w-4xl mx-auto mt-8">
               <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2 text-white">
                     <Users className="w-5 h-5" />
                     <span>Candidatos Encontrados ({candidates.length})</span>
                   </CardTitle>
                   <CardDescription>
                     Lista de candidatos extraídos do CSV
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {candidates.map((candidate) => (
                       <div key={candidate.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                             <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                               <User className="w-5 h-5 text-purple-400" />
                             </div>
                             <div>
                               <h3 className="font-semibold text-white">{candidate.name}</h3>
                               <p className="text-white/60 text-sm">{candidate.email}</p>
                               <p className="text-white/60 text-sm">{candidate.position}</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-4">
                             <div className="text-right">
                               <p className="text-white/60 text-sm">
                                 {formatDate(candidate.submissionDate)}
                               </p>
                               <Badge 
                                 variant={candidate.status === 'completed' ? 'default' : 
                                         candidate.status === 'processing' ? 'secondary' : 
                                         candidate.status === 'failed' ? 'destructive' : 'outline'}
                                 className="mt-1"
                               >
                                 {candidate.status === 'completed' ? 'Analisado' :
                                  candidate.status === 'processing' ? 'A processar' :
                                  candidate.status === 'failed' ? 'Falhou' : 'Pendente'}
                               </Badge>
                             </div>
                             <div className="flex space-x-2">
                               {candidate.status === 'pending' && (
                                 <Button
                                   size="sm"
                                   onClick={() => analyzeCandidate(candidate.id)}
                                   className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                                 >
                                   <Brain className="w-4 h-4 mr-2" />
                                   Analisar
                                 </Button>
                               )}
                               {candidate.status === 'completed' && (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => setSelectedCandidate(candidate)}
                                   className="border-white/20 text-white hover:bg-white/10"
                                 >
                                   <Eye className="w-4 h-4 mr-2" />
                                   Ver Análise
                                 </Button>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
        </div>
      </div>

      {/* Candidate Analysis Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedCandidate(null)}
                className="text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Email:</span>
                  <p className="text-white">{selectedCandidate.email}</p>
                </div>
                <div>
                  <span className="text-white/60">Posição:</span>
                  <p className="text-white">{selectedCandidate.position}</p>
                </div>
                <div>
                  <span className="text-white/60">Data de Submissão:</span>
                  <p className="text-white">{formatDate(selectedCandidate.submissionDate)}</p>
                </div>
                <div>
                  <span className="text-white/60">Pontuação:</span>
                  <p className="text-white">{selectedCandidate.score || 'N/A'}/100</p>
                </div>
              </div>

              {selectedCandidate.analysis && (
                <div>
                  <h3 className="font-semibold mb-2">Análise do CV</h3>
                  <div className="p-4 bg-white/5 rounded border border-white/10">
                    <pre className="text-white/80 text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedCandidate.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
