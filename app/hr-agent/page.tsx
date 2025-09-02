'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Send, 
  User,
  ArrowRight,
  Upload,
  MessageSquare,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: any
  isTyping?: boolean
}

// Typing animation component
const TypingMessage = ({ content, messageId, onComplete }: { content: string, messageId: string, onComplete: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isComplete) return

    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => prev + content[currentIndex])
        setCurrentIndex(prev => prev + 1)
      } else {
        setIsComplete(true)
        onComplete()
        clearInterval(interval)
      }
    }, 7) // Adjust speed here (lower = faster)

    return () => clearInterval(interval)
  }, [currentIndex, content, isComplete, onComplete])

  return (
    <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
          li: ({ children }) => <li className="text-white/90">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1">{children}</h3>,
          code: ({ children }) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-purple-300">{children}</code>,
          pre: ({ children }) => <pre className="bg-white/5 p-2 rounded text-xs font-mono text-white/90 overflow-x-auto mb-2">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-500 pl-3 italic text-white/80 mb-2">{children}</blockquote>,
        }}
      >
        {displayedContent}
      </ReactMarkdown>

    </div>
  )
}

interface ChatStep {
  step: 'request-job-post' | 'questions' | 'ready' | 'upload'
  questions?: string[]
  jobContext?: string
  answers?: string[]
}

export default function HRAgentPage() {
  const { user, initialized, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState<ChatStep>({ step: 'request-job-post' })
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingMessages, setTypingMessages] = useState<Set<string>>(new Set())
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])



  // Initialize chat with welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: 'Olá! Estou aqui para te ajudar a identificar os melhores talentos comerciais para a tua empresa.\n\nPara começar, preciso de compreender a posição que estás a recrutar. Podes colar aqui o job post completo da vaga?',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [user, messages.length])

  const addMessage = (content: string, type: 'user' | 'assistant', data?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
    }
    setMessages(prev => [...prev, newMessage])
    
    // Start typing animation for assistant messages
    if (type === 'assistant') {
      setTypingMessages(prev => new Set(prev).add(newMessage.id))
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    
    // Reset input box to default size
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.style.height = '44px'
    }
    
    setIsLoading(true)

    // Add user message
    addMessage(userMessage, 'user')

    try {
      // Get access token
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session?.access_token) {
        throw new Error('Authentication error. Please log in again.')
      }

      const accessToken = session.access_token

      if (currentStep.step === 'request-job-post') {
        // Step 1: Analyze job post
        const response = await fetch('/api/hr-agent/analyze-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            jobPost: userMessage,
            step: 'analyze-job-post'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to analyze job post')
        }

        const result = await response.json()
        
        if (result.step === 'questions' && result.questions?.length > 0) {
          setCurrentStep({
            step: 'questions',
            questions: result.questions,
            jobContext: result.jobContext
          })

          const questionsText = result.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')
          addMessage(
            `Perfeito! Analisei o job post e identifiquei alguns pontos importantes para uma análise mais precisa.\n\n**Contexto da posição:**\n${result.jobContext}\n\n**Perguntas para análise contextualizada:**\n${questionsText}\n\nPor favor, responde a estas perguntas para eu poder fazer uma análise cirúrgica dos candidatos.`,
            'assistant',
            { questions: result.questions }
          )
        }
      } else if (currentStep.step === 'questions') {
        // Step 2: Confirm analysis with answers
        const answers = userMessage.split('\n').filter(line => line.trim())
        
        const response = await fetch('/api/hr-agent/analyze-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            step: 'confirm-analysis',
            answers
          })
        })

        if (!response.ok) {
          throw new Error('Failed to confirm analysis')
        }

        const result = await response.json()
        
        if (result.step === 'ready') {
          setCurrentStep({
            step: 'ready',
            answers
          })

          addMessage(
            result.message,
            'assistant',
            { readyForAnalysis: true }
          )
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      addMessage(
        'Desculpa, ocorreu um erro. Podes tentar novamente?',
        'assistant'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    await processFiles(files)
  }



  const processFiles = async (files: File[]) => {
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to continue.",
        variant: "destructive"
      })
      router.push('/login')
      return
    }

    // Validate files
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-zip-compressed']
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Type",
        description: `Please upload only PDF, Word documents, TXT files, or ZIP files.`,
        variant: "destructive"
      })
      return
    }

    setUploadedFiles(files)
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('Preparing upload...')

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session?.access_token) {
        throw new Error('Authentication error. Please log in again.')
      }

      const accessToken = session.access_token
      const results: any[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadStatus(`File ${i + 1} of ${files.length}: ${file.name}`)
        setUploadProgress((i / files.length) * 100)

        try {
          // Upload to Vercel Blob
          const { upload } = await import('@vercel/blob/client')
          const candidateName = file.name.replace(/\.[^/.]+$/, '')
          
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/hr-agent/blob-upload',
            clientPayload: JSON.stringify({
              userId: user?.id || '',
              accessToken: accessToken,
              originalFileName: file.name,
              candidateName: candidateName
            })
          })

        // Check if it's a ZIP file
        if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.toLowerCase().endsWith('.zip')) {
          // Process ZIP file
          setUploadStatus(`File ${i + 1} of ${files.length}: Processing ZIP - ${file.name}`)
          setUploadProgress(((i + 0.5) / files.length) * 100)

          const zipProcessingResponse = await fetch('/api/hr-agent/process-zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              zipBlobUrl: blob.url,
              userId: user?.id || '',
              accessToken: accessToken
            })
          })

          if (!zipProcessingResponse.ok) {
            const errorData = await zipProcessingResponse.json()
            results.push({
              fileName: file.name,
              success: false,
              error: errorData.error || 'ZIP processing failed'
            })
          } else {
            const result = await zipProcessingResponse.json()
            
            // For ZIP files, the result contains multiple file results
            if (result.results && Array.isArray(result.results)) {
              // Add each individual file result to the results array
              result.results.forEach((fileResult: any) => {
                results.push({
                  fileName: fileResult.filename || file.name,
                  success: fileResult.success,
                  candidateSaved: fileResult.success && fileResult.score > 5,
                  aiAnalysis: fileResult.aiAnalysis,
                  error: fileResult.error,
                  score: fileResult.score
                })
              })
            } else {
              // Fallback for single result
              results.push({
                fileName: file.name,
                success: true,
                ...result
              })
            }
          }
        } else {
          // Process individual CV file
          setUploadStatus(`File ${i + 1} of ${files.length}: Analyzing CV - ${file.name}`)
          setUploadProgress(((i + 0.5) / files.length) * 100)

          const processingResponse = await fetch('/api/hr-agent/process-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blobUrl: blob.url,
              fileName: file.name,
              userId: user?.id || '',
              accessToken: accessToken
            })
          })

          if (!processingResponse.ok) {
            const errorData = await processingResponse.json()
            results.push({
              fileName: file.name,
              success: false,
              error: errorData.error || 'CV processing failed'
            })
          } else {
            const result = await processingResponse.json()
            results.push({
              fileName: file.name,
              success: true,
              ...result
            })
          }
        }
        } catch (fileError) {
          console.error('File processing error:', fileError)
          results.push({
            fileName: file.name,
            success: false,
            error: fileError instanceof Error ? fileError.message : 'File processing failed'
          })
        }
      }

      console.log('📊 Results array:', results)
      
      // Debug: Log the structure of successful results
      results.filter(r => r.success).forEach((result, index) => {
        console.log(`📋 Result ${index + 1}:`, {
          fileName: result.fileName,
          aiAnalysis: result.aiAnalysis,
          score: result.score,
          candidateSaved: result.candidateSaved,
          executiveSummary: result.aiAnalysis?.executiveSummary,
          finalScore: result.aiAnalysis?.finalScore
        })
      })
      
      const successfulCount = results.filter(r => r.success).length
      const savedCount = results.filter(r => r.success && r.candidateSaved).length
      const totalProcessedCount = results.length // This includes all individual CVs processed
      console.log('📊 Successful count:', successfulCount, 'Saved count:', savedCount, 'Total processed:', totalProcessedCount)
      
      setUploadProgress(100)
      setUploadStatus(`🎉 ${successfulCount}/${totalProcessedCount} CVs processed successfully! ${savedCount} candidates saved.`)

      // Add results to chat
      const resultsMessage = `**Análise Completa dos Candidatos**\n\n` +
        `📊 **Resultados:**\n` +
        `• ${successfulCount}/${totalProcessedCount} CVs processados com sucesso\n` +
        `• ${savedCount} candidatos salvos na base de dados\n\n` +
        `**Top Candidatos Identificados:**\n` +
        results
          .filter(r => r.success && r.candidateSaved)
          .sort((a, b) => (b.aiAnalysis?.finalScore || b.score || 0) - (a.aiAnalysis?.finalScore || a.score || 0))
          .slice(0, 3)
          .map((result, index) => {
            const score = result.aiAnalysis?.finalScore || result.score || 0
            const summary = result.aiAnalysis?.executiveSummary || 
                           result.analysis?.executiveSummary || 
                           'Análise em progresso'
            
            console.log(`📝 Mapping result ${index + 1}:`, {
              fileName: result.fileName,
              score,
              summary,
              aiAnalysisKeys: result.aiAnalysis ? Object.keys(result.aiAnalysis) : 'No aiAnalysis',
              analysisKeys: result.analysis ? Object.keys(result.analysis) : 'No analysis',
              fullAiAnalysis: result.aiAnalysis,
              fullAnalysis: result.analysis
            })
            
            // Use extracted name if available, otherwise fall back to filename
            const candidateName = result.personalInfo?.name || 
                                result.extracted_name || 
                                result.fileName?.replace(/\.(pdf|doc|docx|txt)$/i, '') || 
                                result.fileName || 
                                'Candidato Desconhecido'
            
            return `${index + 1}. **${candidateName}** - Score: ${score}/10\n   ${summary}`
          })
          .join('\n\n')

      addMessage(resultsMessage, 'assistant', { results })

      toast({
        title: "Analysis Complete! 🎉",
        description: `${successfulCount} CVs processed successfully. ${savedCount} candidates saved.`,
      })

      // Reset after 5 seconds
      setTimeout(() => {
        setUploadedFiles([])
        setIsUploading(false)
        setUploadProgress(0)
        setUploadStatus('')
      }, 5000)
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('Upload failed')
      
      addMessage(
        'Desculpa, ocorreu um erro durante o upload. Podes tentar novamente?',
        'assistant'
      )
    } finally {
      // Always reset upload state
      setIsUploading(false)
      setUploadProgress(0)
      setUploadedFiles([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
    // Shift+Enter creates a new line (handled automatically by textarea)
  }

  // Show loading while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm flex-shrink-0">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/dashboard')}
                  className="text-white hover:bg-white/10"
                >
                  ← Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-bold">HR Agent</h1>
                  <p className="text-white/70 text-sm">AI-powered recruitment assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10"
                  onClick={() => router.push('/hr-agent/candidates')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Candidates
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${message.type === 'user' ? 'flex justify-end' : ''}`}
              >
                {message.type === 'user' ? (
                  // User message - purple box with white text
                  <div className="max-w-3xl">
                    <div className="bg-purple-600 text-white rounded-lg p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>
                  </div>
                ) : (
                  // Assistant message - no box, plain text like ChatGPT
                  <div className="py-6">
                    <div className="max-w-3xl mx-auto px-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-white">
                          {typingMessages.has(message.id) ? (
                            <TypingMessage
                              content={message.content}
                              messageId={message.id}
                              onComplete={() => {
                                setTypingMessages(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(message.id)
                                  return newSet
                                })
                              }}
                            />
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                em: ({ children }) => <em className="italic text-white">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-3 pl-0">{children}</ol>,
                                li: ({ children }) => <li className="text-white mb-4 leading-relaxed">{children}</li>,
                                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
                                code: ({ children }) => <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                                pre: ({ children }) => <pre className="bg-gray-700 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-2">{children}</blockquote>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="py-6">
                <div className="max-w-3xl mx-auto px-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="text-sm text-gray-400">Analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="py-6">
                <div className="max-w-3xl mx-auto px-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-2">Processing Files</div>
                      <div className="text-xs text-gray-400 mb-3">{uploadStatus}</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

                 {/* Input Area */}
         <div className="border-t border-white/10 backdrop-blur-sm flex-shrink-0">
           <div className="container mx-auto px-4 py-4">
             <div className="max-w-4xl mx-auto">
               <div className="relative">
                 <Textarea
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyDown={handleKeyPress}
                   placeholder={
                     currentStep.step === 'request-job-post' 
                       ? "Cola aqui o job post completo..." 
                       : currentStep.step === 'questions'
                       ? "Responde às perguntas acima..."
                       : "Escreve a tua mensagem..."
                   }
                   className="min-h-[44px] max-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none overflow-y-auto pr-20 pl-12"
                   disabled={isLoading}
                   rows={1}
                   style={{
                     height: 'auto',
                     minHeight: '44px',
                     maxHeight: '200px'
                   }}
                   onInput={(e) => {
                     const target = e.target as HTMLTextAreaElement
                     target.style.height = 'auto'
                     target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                   }}
                 />
                 
                 {/* File Upload Button - Inside Input */}
                 <div className="absolute left-2 bottom-2">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => fileInputRef.current?.click()}
                     className="h-8 w-8 p-0 bg-transparent hover:bg-white/10 text-purple-300 hover:text-purple-200"
                     disabled={isUploading}
                   >
                     <Plus className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 {/* Send Button - Inside Input */}
                 <div className="absolute right-2 bottom-2">
                   <Button
                     onClick={handleSendMessage}
                     disabled={!inputValue.trim() || isLoading}
                     className="h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                   >
                     <Send className="w-4 h-4" />
                   </Button>
                 </div>
               </div>
               
               {/* File inputs (hidden) */}
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".pdf,.doc,.docx,.txt,.zip"
                 multiple
                 onChange={handleFileUpload}
                 className="hidden"
               />

             </div>
           </div>
         </div>
      </div>
    </div>
  )
}