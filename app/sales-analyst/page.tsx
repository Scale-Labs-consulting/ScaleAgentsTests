'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { convertVideoToAudio, shouldConvertVideo } from '@/lib/video-converter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  FileVideo, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Download,
  Trash2,
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
  FileText,
  Loader2,
  ArrowRight,
  XCircle
} from 'lucide-react'

interface SalesCall {
  id: string
  title: string
  fileUrl: string
  duration: number
  uploadDate: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  transcription?: string
  score?: number
  feedback?: string
}

export default function SalesAnalystPage() {
  const { user, initialized, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [transcript, setTranscript] = useState<string>('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [audioRef] = useState(useRef<HTMLAudioElement>(null))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [salesCalls, setSalesCalls] = useState<SalesCall[]>([])
  const [selectedCall, setSelectedCall] = useState<SalesCall | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)



  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Simple redirect to login if not authenticated
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
    const file = event.target.files?.[0]
    if (!file) return

    // Simple authentication check
    if (!user || !user.id) {
      alert('Por favor, faça login para continuar.')
      router.push('/login')
      return
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Por favor, carregue um ficheiro de vídeo')
      return
    }

    setUploadedFile(file)
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('A preparar o carregamento...')
    setAnalysisResult(null)

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
        console.error('❌ No active session found')
        throw new Error('No active session found. Please log in again.')
      }
      
      const accessToken = session.access_token
      console.log('🔑 Access token obtained:', accessToken ? 'Yes' : 'No')
      
      if (!accessToken) {
        throw new Error('Access token is missing. Please log in again.')
      }
    
      // Use client-side upload approach
      console.log('🚀 Starting client-side upload...')
      setUploadStatus('A fazer upload do ficheiro...')
      await uploadFileClientSide(file, accessToken)
    
    } catch (error) {
      console.error('❌ Upload error:', error)
      setUploadStatus('Erro no carregamento')
      setIsUploading(false)
      setUploadProgress(0)
      
      // Show error to user
      alert(error instanceof Error ? error.message : 'Erro no carregamento. Por favor, tente novamente.')
      
      // If it's an authentication error, redirect to login
      if (error instanceof Error && error.message.includes('session')) {
        router.push('/login')
      }
    }
  }

  const uploadFileClientSide = async (file: File, accessToken: string) => {
    try {
      // Check if we should convert video to audio
      let fileToUpload = file
      let isConverted = false
      
      if (shouldConvertVideo(file)) {
        try {
          setUploadStatus('A converter vídeo para áudio...')
          setUploadProgress(5)
          
          console.log('🎵 Converting video to audio for better processing...')
          fileToUpload = await convertVideoToAudio(file)
          isConverted = true
          
          console.log('✅ Video converted to audio:', {
            originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
            convertedSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB`,
            reduction: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`
          })
          
          setUploadProgress(15)
        } catch (error) {
          console.error('❌ Video conversion failed:', error)
          toast({
            title: "Erro na conversão",
            description: "Falha ao converter vídeo para áudio. Tentando upload original...",
            variant: "destructive",
          })
          // Continue with original file if conversion fails
          fileToUpload = file
        }
      }

      console.log('🚀 Starting Vercel Blob upload...')
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '🚀 Starting Vercel Blob upload...',
          data: { fileName: file.name, fileSize: file.size }
        })
      })

      // Step 1: Upload to Vercel Blob
      setUploadStatus('A fazer upload para Vercel Blob...')
      setUploadProgress(20)

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('userId', user.id)
      formData.append('accessToken', accessToken)
      formData.append('isConverted', isConverted.toString())
      formData.append('originalFileName', file.name)

      const blobUploadResponse = await fetch('/api/sales-analyst/blob-upload', {
        method: 'POST',
        body: formData
      })

      if (!blobUploadResponse.ok) {
        const errorData = await blobUploadResponse.json()
        throw new Error(errorData.error || 'Failed to upload to Vercel Blob')
      }

      const uploadResult = await blobUploadResponse.json()
      console.log('✅ File uploaded to Vercel Blob:', uploadResult.blobUrl)

      // Step 2: Start transcription and analysis
      setUploadStatus('A processar vídeo e iniciar transcrição...')
      setUploadProgress(60)

      const transcriptionResponse = await fetch('/api/sales-analyst/blob-transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blobUrl: uploadResult.blobUrl,
          fileName: file.name,
          userId: user.id,
          accessToken: accessToken,
          salesCallId: uploadResult.salesCall.id
        })
      })

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const result = await transcriptionResponse.json()

      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '✅ Vercel Blob upload and transcription completed!',
          data: { 
            transcriptionLength: result.transcription?.length || 0,
            analysis: result.analysis 
          }
        })
      })

      setUploadStatus('Análise concluída com sucesso!')
      setUploadProgress(100)

      // Store analysis result for display
      setAnalysisResult(result.analysis)
      
      // Store transcript for display
      if (result.transcription) {
        setTranscript(result.transcription)
        setShowTranscript(true)
      }
      
      // Reset upload state after 3 seconds
      setTimeout(() => {
        setUploadedFile(null)
        setIsUploading(false)
        setUploadProgress(0)
        setUploadStatus('')
      }, 3000)
      
    } catch (error) {
      console.error('❌ Vercel Blob upload error:', error)
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '❌ Vercel Blob upload failed:',
          data: { error: error instanceof Error ? error.message : String(error) }
        })
      })
      throw error
    }
  }

  const analyzeTranscription = async (transcription: string) => {
    console.log('🧠 Starting AI analysis...')
    console.log('📁 Uploaded file name:', uploadedFile?.name)
    console.log('📁 Uploaded file:', uploadedFile)
    
    try {
      const requestBody = { 
        transcription,
        userId: user.id,
        originalFileName: uploadedFile?.name || null
      }
      console.log('📤 Sending request body:', requestBody)
      
      const response = await fetch('/api/sales-analyst/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Analysis completed successfully!')
        console.log('📊 Analysis result:', result.analysis)
        
        // Store analysis result for display
        setAnalysisResult(result.analysis)
        
        // Show warning if transcription was truncated
        if (result.wasTruncated) {
          console.log(`⚠️ Note: Transcription was truncated (${result.transcriptionLength} → ${result.processedLength} chars) for analysis`)
        }
        
        setUploadStatus('Análise concluída com sucesso!')
        setUploadProgress(100)
        
        // Reset upload state after 3 seconds
        setTimeout(() => {
          setUploadedFile(null)
          setIsUploading(false)
          setUploadProgress(0)
          setUploadStatus('')
        }, 3000)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('❌ Analysis error:', error)
      setUploadStatus('A análise falhou. Por favor, tente novamente.')
      setTimeout(() => {
        setUploadedFile(null)
        setIsUploading(false)
        setUploadProgress(0)
        setUploadStatus('')
      }, 3000)
    }
  }

  const analyzeCall = async (callId: string, transcription?: string) => {
    // If transcription is provided directly, use it; otherwise try to find the call
    let callTranscription = transcription
    let callTitle = ''
    
    if (!callTranscription) {
      const call = salesCalls.find(c => c.id === callId)
      if (!call) {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: '❌ Call not found for analysis:',
            data: { callId }
          })
        })
        return
      }
      callTranscription = call.transcription || ''
      callTitle = call.title
    } else {
      // Find the call just for the title
      const call = salesCalls.find(c => c.id === callId)
      callTitle = call?.title || 'Unknown'
    }

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: '🧠 Starting AI analysis for call:',
        data: { callId, title: callTitle }
      })
    })

    // Update status to processing
    setSalesCalls(prev => prev.map(c => 
      c.id === callId ? { ...c, status: 'processing' as const } : c
    ))

    try {
      // Show analysis status
      setUploadStatus('A IA está a analisar a sua chamada de vendas...')
      
      // Use the transcription that was passed in or found in the call object
      const transcription = callTranscription || ''
       
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '📊 Transcription length:',
          data: { length: transcription.length, characters: true }
        })
      })
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '📄 Transcription preview:',
          data: transcription.substring(0, 200) + '...'
        })
      })
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '🔍 Full transcription available:',
          data: !!transcription
        })
      })
     
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '🚀 Sending transcription to ChatGPT API...' })
      })
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '📤 API endpoint: /api/sales-analyst/analyze' })
      })
      
               // Call the API for analysis
      const response = await fetch('/api/sales-analyst/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcription,
          userId: user.id
        })
      })

      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '📥 API Response status:',
          data: { status: response.status }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: '❌ API Error:',
            data: errorData
          })
        })
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '✅ API Response received successfully!' })
      })
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '📊 Analysis result structure:',
          data: Object.keys(result)
        })
      })
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '🔍 Full analysis result:',
          data: result
        })
      })
      
               if (result.success) {
           await fetch('/api/log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ message: '🎉 Analysis completed successfully!' })
           })
           await fetch('/api/log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               message: '📈 Score:',
               data: result.analysis?.score || 'No score available'
             })
           })
           await fetch('/api/log', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               message: '💬 Feedback preview:',
               data: result.analysis?.feedback?.substring(0, 100) + '...' || 'No feedback available'
             })
           })
           
           if (result.analysisId) {
             await fetch('/api/log', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 message: '💾 Analysis saved to Supabase:',
                 data: { analysisId: result.analysisId }
               })
             })
           }
           
           // Store analysis result for display
           setAnalysisResult(result.analysis)
           
           setUploadStatus('Análise concluída com sucesso!')
           setUploadProgress(100)
           
           console.log('✅ Analysis completed and saved to database')
           
           // Reset upload state after 3 seconds
           setTimeout(() => {
             setUploadedFile(null)
             setIsUploading(false)
             setUploadProgress(0)
             setUploadStatus('')
           }, 3000)
      } else {
        console.error('❌ Analysis failed:', result.error)
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('❌ Analysis error:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      setUploadStatus('A análise falhou. Por favor, tente novamente.')
      setTimeout(() => {
        setUploadedFile(null)
        setIsUploading(false)
        setUploadProgress(0)
        setUploadStatus('')
      }, 3000) // Reset upload state after 3 seconds
    }
  }

  const handleCallSelect = async (call: SalesCall) => {
    setSelectedCall(call)
    
    // Fetch transcription if available
    try {
      const response = await fetch(`/api/sales-analyst/transcription/${call.id}`)
      if (response.ok) {
        const data = await response.json()
        // setSelectedCallTranscription(data.transcription || '') // This state is no longer needed
      }
    } catch (error) {
      console.error('Error fetching transcription:', error)
    }
  }

  const getStatusIcon = (status: SalesCall['status']) => {
    switch (status) {
      case 'uploaded':
        return <FileVideo className="w-4 h-4 text-blue-400" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
                  <h1 className="text-2xl font-bold">Agente de Análise de Vendas</h1>
                  <p className="text-white/70">Carregue chamadas de vendas e obtenha feedback com IA</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/10"
                    onClick={() => router.push('/sales-analyst/files')}
                  >
                    Ver Análises
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
                  <span>Carregar Chamada de Vendas</span>
                </CardTitle>
                <CardDescription>
                  Carregue um ficheiro MP4 para obter análise de vendas com IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    {uploadedFile ? uploadedFile.name : 'Clique aqui para carregar o seu ficheiro ou arraste'}
                  </p>
                  {uploadedFile && (
                    <p className="text-white/60 mb-2">
                      Tamanho do ficheiro: {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  )}
                  <p className="text-white/50 text-sm mb-4">Formato Suportado: MP4 (sem limite de tamanho)</p>
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
                    {uploadedFile && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setUploadedFile(null)
                          setUploadStatus('')
                          setUploadProgress(0)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Limpar Ficheiro
                      </Button>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{uploadStatus}</span>
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

                {/* View Files Button */}
                <div className="text-center">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                    onClick={() => router.push('/sales-analyst/files')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Todas as Análises
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcript Display */}
          {showTranscript && transcript && (
            <div className="max-w-4xl mx-auto mt-8">
              <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <FileText className="w-5 h-5" />
                    <span>Transcrição da Chamada</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTranscript(false)}
                      className="ml-auto text-white/60 hover:text-white"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Transcrição completa com identificação de oradores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10 max-h-96 overflow-y-auto">
                    <pre className="text-white/90 text-sm whitespace-pre-wrap font-mono">
                      {transcript}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                  // setSelectedCallTranscription('') // This state is no longer needed
                }}
                className="text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Duração:</span>
                    <p className="text-white">{formatDuration(selectedCall.duration)}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Data de Carregamento:</span>
                    <p className="text-white">{selectedCall.uploadDate}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Estado:</span>
                    <p className="text-white capitalize">{selectedCall.status}</p>
                  </div>
                  {/* {selectedCall.score && ( // This field is no longer available in the new SalesCall interface
                    <div>
                      <span className="text-white/60">Pontuação:</span>
                      <p className="text-white">{selectedCall.score}/10</p>
                    </div>
                  )} */}
                </div>

              {/* {selectedCall.feedback && ( // This field is no longer available in the new SalesCall interface
                <div>
                  <h3 className="font-semibold mb-2">Feedback da IA</h3>
                  <div className="p-4 bg-white/5 rounded border-l-4 border-purple-500">
                    <p className="text-white/80">{selectedCall.feedback}</p>
                  </div>
                </div>
              )} */}

              {/* Transcription Display */}
              {/* {selectedCallTranscription && ( // This state is no longer needed
                <div>
                  <h3 className="font-semibold mb-2">📝 Transcrição</h3>
                  <div className="p-4 bg-white/5 rounded border border-white/10 max-h-60 overflow-y-auto">
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{selectedCallTranscription}</p>
                  </div>
                </div>
              )} */}

              <div className="flex space-x-2">
                {selectedCall.status === 'completed' && (
                  <Button 
                    onClick={() => analyzeCall(selectedCall.id)}
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Re-analisar
                  </Button>
                )}
                {selectedCall.status === 'processing' && (
                  <div className="flex items-center space-x-2 text-sm text-yellow-400">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Análise de IA em progresso...</span>
                  </div>
                )}
                                  <Button 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      // setReportData({ // This state is no longer needed
                      //   analysisResult: selectedCall,
                      //   transcriptionStats: { wordCount: selectedCallTranscription.split(' ').length },
                      //   fileName: selectedCall.title,
                      //   uploadDate: selectedCall.uploadDate
                      // })
                      // setShowReport(true)
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Relatório
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report Modal */}
      {/* {showReport && reportData && ( // This state is no longer needed
        <div className="fixed inset-0 z-50">
          <SalesReport 
            analysisResult={reportData.analysisResult}
            transcriptionStats={reportData.transcriptionStats}
            fileName={reportData.fileName}
            uploadDate={reportData.uploadDate}
            onClose={() => setShowReport(false)}
          />
        </div>
      )} */}
    </div>
  )
}
