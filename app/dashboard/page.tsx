'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Bot, TrendingUp, Users, Zap, MessageSquare, BarChart3, UserCheck, LogOut, Settings, Crown, ChevronRight, ChevronLeft, HelpCircle, Moon, UserPlus, FileText, Send, ArrowLeft, Loader2, Sparkles, Square, Upload, FileAudio, Plus, ArrowUp, Play, Pause, Volume2, VolumeX, Download, Trash2, CheckCircle, AlertCircle, Clock, Calendar, Target, Brain, ArrowRight, XCircle, X, MoreHorizontal, Edit3, FileVideo, Search, RefreshCw, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { forceLogout, supabase } from '@/lib/supabase'
import { ChatService, getScaleExpertAgentId } from '@/lib/chat-service'
import { useToast } from '@/hooks/use-toast'
import { convertVideoToAudio, shouldConvertVideo } from '@/lib/video-converter'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  fileInfo?: {
    name: string
    type: string
    url: string
    size?: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('scale-expert')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user, signOut, loading, initialized } = useAuth()

  // Scale Expert states
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null) // OpenAI thread ID
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null) // Our database conversation ID
  const [conversations, setConversations] = useState<any[]>([])
  const [chatService, setChatService] = useState<ChatService | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [showConversationMenu, setShowConversationMenu] = useState(false)
  const [editingConversationName, setEditingConversationName] = useState<string>('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [conversationFile, setConversationFile] = useState<{ name: string; url?: string } | null>(null)
  
  // Sales Analyst specific state
  const [salesUploadedFile, setSalesUploadedFile] = useState<File | null>(null)
  const [salesIsUploading, setSalesIsUploading] = useState(false)
  const [salesUploadProgress, setSalesUploadProgress] = useState(0)
  const [salesUploadStatus, setSalesUploadStatus] = useState('')
  const [salesAnalysisResult, setSalesAnalysisResult] = useState<any>(null)
  const [isFileSelectionInProgress, setIsFileSelectionInProgress] = useState(false)
  const [salesIsAnalyzing, setSalesIsAnalyzing] = useState(false)
  
  // AbortController for cancelling upload operations
  const salesAbortControllerRef = useRef<AbortController | null>(null)
  
  // Cleanup effect to abort operations when component unmounts
  useEffect(() => {
    return () => {
      if (salesAbortControllerRef.current) {
        console.log('🧹 Cleaning up sales upload operations on unmount')
        salesAbortControllerRef.current.abort()
        salesAbortControllerRef.current = null
      }
    }
  }, [])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)

  const [uploadedFileType, setUploadedFileType] = useState<'sales_call' | 'document' | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [salesCallId, setSalesCallId] = useState<string | null>(null)

  // Sales Analyst states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [audioRef] = useState(useRef<HTMLAudioElement>(null))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [salesCalls, setSalesCalls] = useState<any[]>([])
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const salesFileInputRef = useRef<HTMLInputElement>(null)
  
  // Enhanced upload states
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  
  // Subscription states
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  
  // Analysis list states
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  
  // Keyboard escape handler for analysis modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showAnalysisModal) {
        console.log('Escape key pressed, closing modal')
        setShowAnalysisModal(false)
        setSelectedAnalysis(null)
      }
    }

    if (showAnalysisModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showAnalysisModal])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Bulk selection states
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showAnalysisDeleteConfirmation, setShowAnalysisDeleteConfirmation] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<any>(null)

  // Function to check if content is available for sending messages
  const isContentAvailable = useCallback(() => {
    // If no file is selected and no conversation file, allow sending text-only messages
    if (!selectedFile && !conversationFile) {
      return true
    }

    // If file is selected but still uploading, content is not available
    if (selectedFile && uploading) {
      console.log('🔍 Content not available: still uploading')
      return false
    }

    // If file is uploaded but no content extracted yet, content is not available
    if (selectedFile && uploadedFileUrl && !extractedText) {
      console.log('🔍 Content not available: uploaded but no extracted text', { uploadedFileUrl, extractedText })
      return false
    }

    // If we have extracted text, uploaded file, or conversation file, content is available
    const available = !!(extractedText || uploadedFileUrl || conversationFile)
    console.log('🔍 Content availability check:', { 
      selectedFile: !!selectedFile, 
      conversationFile: !!conversationFile,
      uploading, 
      uploadedFileUrl: !!uploadedFileUrl, 
      extractedText: !!extractedText, 
      available 
    })
    return available
  }, [selectedFile, conversationFile, uploading, uploadedFileUrl, extractedText])

  // Function to get status message for file processing
  const getFileStatusMessage = useCallback(() => {
    if (!selectedFile && !conversationFile) {
      return null
    }

    if (selectedFile && uploading) {
      return 'A processar ficheiro...'
    }

    if (selectedFile && uploadedFileUrl && !extractedText) {
      return 'A extrair conteúdo...'
    }

    return null
  }, [selectedFile, conversationFile, uploading, uploadedFileUrl, extractedText])

  // Sales Analyst helper functions
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Enhanced file validation
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return 'Por favor, carregue um ficheiro de vídeo (MP4, MOV, AVI, etc.)'
    }
    
    // File size validation removed - all plans can upload any file size
    
    return null
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
      // Reset the file input after drag and drop
      if (salesFileInputRef.current) {
        salesFileInputRef.current.value = ''
      }
    }
  }

  // Subscription management functions
  const loadSubscription = async () => {
    if (!user) return
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, subscription_current_period_end, stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setSubscription(profile)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const openCustomerPortal = async () => {
    if (!user) return
    
    setSubscriptionLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      toast({
        title: "Erro",
        description: "Erro ao abrir o portal do cliente. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  // Handle file selection (from input or drag & drop)
  const handleFileSelection = async (file: File) => {
    console.log('🎯 handleFileSelection called with file:', file.name, file.size, file.type)
    
    // Prevent multiple simultaneous file selections
    if (isFileSelectionInProgress) {
      console.log('⚠️ File selection already in progress, ignoring duplicate call')
      return
    }
    
    setIsFileSelectionInProgress(true)
    console.log('🔒 File selection locked')
    
    // Clear previous errors
    setUploadError(null)
    
    // Simple authentication check
    if (!user || !user.id) {
      console.log('❌ No user found, redirecting to login')
      toast({
        title: "Erro",
        description: 'Por favor, faça login para continuar.',
        variant: "destructive"
      })
      router.push('/login')
      setIsFileSelectionInProgress(false)
      console.log('🔓 File selection unlocked (auth error)')
      return
    }

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      console.log('❌ File validation failed:', validationError)
      setUploadError(validationError)
      toast({
        title: "Erro",
        description: validationError,
        variant: "destructive"
      })
      setIsFileSelectionInProgress(false)
      console.log('🔓 File selection unlocked (validation error)')
      return
    }

    console.log('✅ File validation passed, setting up upload...')

    // Create file preview
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setFilePreview(url)
    }

    setSalesUploadedFile(file)
    setSalesIsUploading(true)
    setSalesUploadProgress(0)
    setSalesUploadStatus('A preparar o carregamento...')
    setSalesAnalysisResult(null)
    
    console.log('📁 File state set, starting upload process...')
    console.log('📁 Current salesUploadedFile state:', file.name)
    console.log('📁 Current salesIsUploading state:', true)

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: '📁 Sales Analyst file selected for upload',
        data: { 
          fileName: file.name, 
          fileSize: file.size, 
          fileType: file.type 
        }
      })
    })

    try {
      console.log('🔑 Getting access token...')
      console.log('👤 User ID:', user.id)
      
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '🔑 Starting Sales Analyst upload process...',
          data: { userId: user.id, fileName: file.name }
        })
      })
      
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
      setSalesUploadStatus('A fazer upload do ficheiro...')
      await uploadSalesFileClientSide(file, accessToken)
    
    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.message === 'Operation cancelled') {
        console.log('🚫 Upload cancelled by user')
        setSalesUploadStatus('Upload cancelado')
        setSalesIsUploading(false)
        setSalesUploadProgress(0)
        
        // Don't show error toast for cancellation
        return
      }
      
      console.error('❌ Upload error:', error)
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '❌ Sales Analyst upload failed:',
          data: { error: error instanceof Error ? error.message : String(error) }
        })
      })
      
      setSalesUploadStatus('Erro no carregamento')
      setSalesIsUploading(false)
      setSalesUploadProgress(0)
      
      // Reset file input on error
      if (salesFileInputRef.current) {
        salesFileInputRef.current.value = ''
      }
      
      // Show error to user
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro no carregamento. Por favor, tente novamente.',
        variant: "destructive"
      })
    } finally {
      // Always release the file selection lock and reset file input
      setIsFileSelectionInProgress(false)
      if (salesFileInputRef.current) {
        salesFileInputRef.current.value = ''
      }
      console.log('🔓 File selection unlocked and input reset')
    }
  }

  const uploadSalesFile = async () => {
    console.log('🚀 uploadSalesFile called with:', { 
      salesUploadedFile: salesUploadedFile?.name, 
      user: user?.id 
    })
    
    if (!salesUploadedFile || !user) {
      console.log('❌ Missing required data:', { 
        hasFile: !!salesUploadedFile, 
        hasUser: !!user 
      })
      return
    }

    try {
      console.log('🔑 Getting access token...')
      console.log('👤 User ID:', user.id)
      
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '🔑 Starting Sales Analyst upload process...',
          data: { userId: user.id, fileName: salesUploadedFile.name }
        })
      })
      
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
      setSalesUploadStatus('A fazer upload do ficheiro...')
      await uploadSalesFileClientSide(salesUploadedFile, accessToken)
    
    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.message === 'Operation cancelled') {
        console.log('🚫 Upload cancelled by user')
        setSalesUploadStatus('Upload cancelado')
        setSalesIsUploading(false)
        setSalesUploadProgress(0)
        
        // Don't show error toast for cancellation
        return
      }
      
      console.error('❌ Upload error:', error)
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '❌ Sales Analyst upload failed:',
          data: { error: error instanceof Error ? error.message : String(error) }
        })
      })
      
      setSalesUploadStatus('Erro no carregamento')
      setSalesIsUploading(false)
      setSalesUploadProgress(0)
      
      // Show error to user
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro no carregamento. Por favor, tente novamente.',
        variant: "destructive"
      })
    }
  }

  // Function to cancel sales analyst upload and reset to initial state
  const cancelSalesUpload = () => {
    console.log('🚫 Cancelling sales analyst upload...')
    
    // Abort ongoing operations
    if (salesAbortControllerRef.current) {
      console.log('🛑 Aborting ongoing operations...')
      salesAbortControllerRef.current.abort()
      salesAbortControllerRef.current = null
    }
    
    // Reset all sales analyst states
    setSalesUploadedFile(null)
    setSalesIsUploading(false)
    setSalesUploadProgress(0)
    setSalesUploadStatus('')
    setSalesAnalysisResult(null)
    setUploadError(null)
    setFilePreview(null)
    
    // Clear file input
    if (salesFileInputRef.current) {
      salesFileInputRef.current.value = ''
    }
    
    // Log the cancellation
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: '🚫 Sales Analyst upload cancelled by user',
        data: { userId: user?.id }
      })
    }).catch(console.error)
    
    console.log('✅ Sales analyst reset to initial state')
  }

  const uploadSalesFileClientSide = async (file: File, accessToken: string) => {
    // Create new AbortController for this upload operation
    const abortController = new AbortController()
    salesAbortControllerRef.current = abortController
    
    try {
      // Check if we should convert video to audio
      let fileToUpload = file
      let isConverted = false
      
      if (shouldConvertVideo(file)) {
        try {
          setSalesUploadStatus('A converter vídeo para áudio...')
          setSalesUploadProgress(5)
          
          // Check if operation was cancelled
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled')
          }
          
          console.log('🎵 Converting video to audio for better processing...')
          fileToUpload = await convertVideoToAudio(file)
          isConverted = true
          
          console.log('✅ Video converted to audio:', {
            originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
            convertedSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB`,
            reduction: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`
          })
          
          setSalesUploadProgress(15)
        } catch (error) {
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled')
          }
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

      console.log('🚀 Starting client-side Vercel Blob upload...')
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '🚀 Starting client-side Vercel Blob upload...',
          data: { fileName: file.name, fileSize: file.size }
        })
      })

      // Step 1: Upload to Vercel Blob using client upload
      setSalesUploadStatus('A fazer upload para Vercel Blob...')
      setSalesUploadProgress(20)

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled')
      }

      // Import the upload function from @vercel/blob/client
      const { upload } = await import('@vercel/blob/client')

      const blob = await upload(fileToUpload.name, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/sales-analyst/blob-upload',
        clientPayload: JSON.stringify({
          userId: user!.id,
          accessToken: accessToken,
          originalFileName: file.name,
          isConverted: isConverted
        })
      })

      console.log('✅ File uploaded to Vercel Blob:', blob.url)

      // Step 2: Create a temporary sales call ID for now
      // We'll use the blob URL as a reference and create the record later if needed
      setSalesUploadStatus('A processar vídeo e iniciar transcrição...')
      setSalesUploadProgress(50)

      // Generate a temporary ID based on the blob URL
      const tempSalesCallId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Step 3: Start transcription and analysis
      setSalesUploadStatus('A processar vídeo e iniciar transcrição...')
      setSalesUploadProgress(60)

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled')
      }

      try {
        const transcriptionResponse = await fetch('/api/sales-analyst/blob-transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            blobUrl: blob.url,
            fileName: file.name,
            userId: user!.id,
            accessToken: accessToken,
            salesCallId: tempSalesCallId
          }),
          signal: abortController.signal // Add abort signal to the fetch request
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

        // Show appropriate status message
        if (result.duplicateInfo) {
          setSalesUploadStatus('Análise existente encontrada! (Conteúdo duplicado detectado)')
        } else {
          setSalesUploadStatus('Análise concluída com sucesso!')
        }
        setSalesUploadProgress(100)

        // Store analysis result for display
        setSalesAnalysisResult(result.analysis)
        
        // Show toast with duplicate info if applicable
        if (result.duplicateInfo) {
          toast({
            title: "Análise Existente Encontrada",
            description: "Este conteúdo já foi analisado anteriormente. Exibindo análise existente.",
            variant: "default"
          })
        }
        
        // Reset upload state after 3 seconds
        setTimeout(() => {
          setSalesUploadedFile(null)
          setSalesIsUploading(false)
          setSalesUploadProgress(0)
          setSalesUploadStatus('')
        }, 3000)
        
      } catch (error) {
        if (abortController.signal.aborted) {
          console.log('🚫 Transcription cancelled by user')
          throw new Error('Operation cancelled')
        }
        console.error('❌ Transcription error:', error)
        throw error
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        console.log('🚫 Upload cancelled by user')
        throw new Error('Operation cancelled')
      }
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
    } finally {
      // Clear the abort controller reference
      if (salesAbortControllerRef.current === abortController) {
        salesAbortControllerRef.current = null
      }
    }
  }

  // Fetch analyses for the sales analyst
  const fetchAnalyses = async () => {
    if (!user) {
      console.log('❌ No user found, skipping fetchAnalyses')
      return
    }
    
    console.log('🔍 Fetching analyses for user:', user.id)
    
    try {
      setLoadingAnalyses(true)
      const response = await fetch(`/api/sales-analyst/analyses?userId=${user.id}`)
      const result = await response.json()
      
      console.log('📊 Fetch analyses response:', result)
      console.log('📊 Number of analyses found:', result.analyses?.length || 0)
      
      if (result.success) {
        // Transform Supabase data to match our interface
        const transformedAnalyses = result.analyses.map((analysis: any) => {
          console.log('📝 Processing analysis:', analysis.id, 'Title:', analysis.title)
          
          // Use the title as-is, since it's already properly formatted
          let displayTitle = analysis.title || 'Análise'
          
          // If no title, try to extract filename from analysis metadata or use ID as fallback
          if (!displayTitle || displayTitle.trim() === 'Análise') {
            const metadata = analysis.analysis_metadata || {}
            const originalFileName = metadata.original_file_name
            if (originalFileName && originalFileName.trim()) {
              displayTitle = originalFileName.replace(/\.[^/.]+$/, '') // Remove file extension
            } else {
              displayTitle = `Análise ${analysis.id.slice(0, 8)}`
            }
          }
          
          return {
            id: analysis.id,
            title: displayTitle,
            uploadDate: new Date(analysis.created_at).toISOString().split('T')[0],
            status: analysis.status as 'completed' | 'processing' | 'failed',
            feedback: analysis.feedback || '',
            score: analysis.score || 0,
            callType: analysis.call_type || 'N/A',
            analysis: analysis.analysis || {}
          }
        })
        
        console.log('✅ Transformed analyses:', transformedAnalyses.length)
        setAnalyses(transformedAnalyses)
      } else {
        console.error('Failed to fetch analyses:', result.error)
        toast({
          title: "Erro",
          description: 'Falha ao carregar análises',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
      toast({
        title: "Erro",
        description: 'Erro ao carregar análises',
        variant: "destructive"
      })
    } finally {
      setLoadingAnalyses(false)
    }
  }

  // Auth guard logic
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Load subscription data when user is available
  useEffect(() => {
    if (user) {
      loadSubscription()
    }
  }, [user])

  // Handle success/cancel messages from Stripe checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      const canceled = urlParams.get('canceled')
      
      if (success === 'true') {
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "A sua subscrição foi ativada. Bem-vindo!",
          variant: "default"
        })
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (canceled === 'true') {
        toast({
          title: "Pagamento cancelado",
          description: "O pagamento foi cancelado. Pode tentar novamente quando quiser.",
          variant: "destructive"
        })
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // Handle agent selection from URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const agentParam = urlParams.get('agent')
      if (agentParam === 'sales-analyst') {
        setSelectedAgent('sales-analyst')
        setActiveTab('upload')
      }
    }
  }, [])



  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowProfileModal(false)
      }
    }

    if (showProfileModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileModal])

  // Close agent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const dropdownElement = document.querySelector('[data-agent-dropdown]')
      
      if (dropdownElement && !dropdownElement.contains(target)) {
        setShowAgentDropdown(false)
      }
    }

    if (showAgentDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAgentDropdown])

  // Initialize chat service and load conversations
  useEffect(() => {
    const initializeChatService = async () => {
      if (user && selectedAgent === 'scale-expert') {
        try {
          const agentId = await getScaleExpertAgentId()
          const service = new ChatService(user.id, agentId)
          setChatService(service)
          
          // Load conversations
          const userConversations = await service.getConversations()
          setConversations(userConversations)
        } catch (error) {
          console.error('Error initializing chat service:', error)
          // Don't throw the error, just log it and continue
          // The chat functionality will be disabled but the app won't crash
        }
      }
    }

    initializeChatService()
  }, [user, selectedAgent])

  // Fetch analyses when sales analyst is selected
  useEffect(() => {
    if (user && selectedAgent === 'sales-analyst') {
      fetchAnalyses()
    }
  }, [user, selectedAgent])

  // Reset selections when analyses change
  useEffect(() => {
    setSelectedAnalyses(new Set())
    setSelectAll(false)
  }, [analyses])

  // Bulk selection functions
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAnalyses(new Set())
      setSelectAll(false)
    } else {
      const filteredAnalyses = analyses.filter(analysis => {
        const matchesSearch = analysis.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter
        return matchesSearch && matchesStatus
      })
      setSelectedAnalyses(new Set(filteredAnalyses.map(a => a.id)))
      setSelectAll(true)
    }
  }

  const toggleAnalysisSelection = (analysisId: string) => {
    const newSelected = new Set(selectedAnalyses)
    if (newSelected.has(analysisId)) {
      newSelected.delete(analysisId)
    } else {
      newSelected.add(analysisId)
    }
    setSelectedAnalyses(newSelected)
    
    // Check if all filtered analyses are selected
    const filteredAnalyses = analyses.filter(analysis => {
      const matchesSearch = analysis.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter
      return matchesSearch && matchesStatus
    })
    setSelectAll(newSelected.size === filteredAnalyses.length)
  }

  const deleteAnalyses = async (analysisIds: string[]) => {
    if (analysisIds.length === 0) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast({
          title: "Erro",
          description: "Sessão ativa não encontrada",
          variant: "destructive"
        })
        return
      }

      // Delete each analysis
      const deletePromises = analysisIds.map(async (analysisId) => {
        const response = await fetch(`/api/sales-analyst/analyses/${analysisId}?accessToken=${session.access_token}`, {
          method: 'DELETE'
        })
        return response.ok
      })

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(Boolean).length

      if (successCount > 0) {
        toast({
          title: "Sucesso",
          description: `${successCount} análise(s) eliminada(s) com sucesso`,
        })
        setSelectedAnalyses(new Set())
        setSelectAll(false)
        fetchAnalyses() // Refresh the list
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao eliminar análises",
        variant: "destructive"
      })
    }
  }

  const deleteSelectedAnalyses = async () => {
    await deleteAnalyses(Array.from(selectedAnalyses))
  }



  // Load conversation when selected
  const loadConversation = async (conversationId: string) => {
    if (!chatService) return

    try {
      const { conversation, messages: conversationMessages } = await chatService.loadConversation(conversationId)
      
      // Convert ChatMessage to Message format
      const convertedMessages: Message[] = conversationMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }))
      
      console.log('📚 Loading conversation:', conversationId, 'with', convertedMessages.length, 'messages')
      setMessages(convertedMessages)
      setCurrentConversationId(conversationId)
      
      // Extract file information from conversation metadata and add it to the first user message if it exists
      if (conversation.metadata?.fileName && convertedMessages.length > 0) {
        // Find the first user message to attach the file to
        const firstUserMessageIndex = convertedMessages.findIndex(msg => msg.role === 'user')
        if (firstUserMessageIndex !== -1) {
          // Add file info to the first user message
          convertedMessages[firstUserMessageIndex] = {
            ...convertedMessages[firstUserMessageIndex],
            fileInfo: {
              name: conversation.metadata.fileName,
              type: conversation.metadata.fileType || 'unknown',
              url: conversation.metadata.fileUrl || '',
              size: 0
            }
          }
          setMessages(convertedMessages)
        }
        
        // Also set conversation file for backward compatibility
        setConversationFile({
          name: conversation.metadata.fileName,
          url: conversation.metadata.fileUrl
        })
      } else {
        setConversationFile(null)
      }
      
      // Don't set threadId here - we'll create a new OpenAI thread for new conversations
      setThreadId(null) // Reset OpenAI thread for new conversation
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  // Create new conversation
  const createNewConversation = async () => {
    if (!chatService) {
      console.warn('Chat service not available, creating local conversation')
      // Fallback to local state only
      const tempConversationId = 'local-' + Date.now().toString()
      setCurrentConversationId(tempConversationId)
      setThreadId(null) // Reset OpenAI thread for new conversation
      setMessages([])
      setConversationFile(null)
      return
    }

    try {
      const newConversation = await chatService.createConversation()
      setCurrentConversationId(newConversation.id)
      setThreadId(null) // Reset OpenAI thread for new conversation
      setMessages([])
      setConversationFile(null)
      
      // Refresh conversations list
      const userConversations = await chatService.getConversations()
      setConversations(userConversations)
    } catch (error) {
      console.error('Error creating new conversation:', error)
    }
  }

  // Real Scale Expert chat functions
  const createThread = async () => {
    try {
      console.log('🔄 Creating new OpenAI thread...')
      const response = await fetch('/api/scale-expert/thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('📥 Thread creation response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Thread creation failed:', errorText)
        throw new Error(`Failed to create thread: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Thread created successfully:', data.threadId)
      setThreadId(data.threadId)
      return data.threadId
    } catch (error) {
      console.error('❌ Error creating thread:', error)
      throw error
    }
  }

  const stopMessage = () => {
    console.log('Stop button clicked')
    
    // Set loading to false first
    setIsLoading(false)
    
    // Update the streaming message to show it was stopped
    setMessages(prev => prev.map(msg => 
      msg.isStreaming 
        ? { ...msg, content: msg.content + '\n\n*Mensagem parada pelo utilizador*', isStreaming: false }
        : msg
    ))
    
    // Abort the request last
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (error) {
        console.log('Abort error (expected):', error)
      }
      abortControllerRef.current = null
    }
  }

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !selectedFile) || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim() || (selectedFile ? `Uploaded file: ${selectedFile.name}` : ''),
      timestamp: new Date(),
      fileInfo: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type,
        url: uploadedFileUrl || '',
        size: selectedFile.size
      } : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    
    // Create database conversation if none exists
    if (!currentConversationId && chatService) {
      try {
        console.log('🆕 Creating new database conversation...')
        const newConversation = await chatService.createConversation()
        setCurrentConversationId(newConversation.id)
        console.log('✅ Database conversation created:', newConversation.id)
        
        // If there's a file, update the conversation metadata
        if (selectedFile && uploadedFileUrl) {
          try {
            await chatService.updateConversationMetadata(newConversation.id, {
              fileName: selectedFile.name,
              fileUrl: uploadedFileUrl,
              fileType: selectedFile.type,
              hasTranscription: !!extractedText
            })
            console.log('✅ Conversation metadata updated with file information')
            
            // Also update the conversation file state for immediate display
            setConversationFile({
              name: selectedFile.name,
              url: uploadedFileUrl
            })
          } catch (error) {
            console.error('❌ Error updating conversation metadata:', error)
          }
        }
        
        // Refresh conversations list
        const userConversations = await chatService.getConversations()
        setConversations(userConversations)
      } catch (dbError) {
        console.error('❌ Error creating database conversation:', dbError)
        // Continue with chat even if database creation fails
      }
    }
    
    // Clear uploaded file immediately after sending (before AI response)
    if (selectedFile) {
      console.log('🧹 Clearing file immediately after send:', {
        hasSelectedFile: !!selectedFile,
        selectedFileName: selectedFile?.name,
        hasUploadedFileUrl: !!uploadedFileUrl
      })
      
      setSelectedFile(null)
      setUploadedFileUrl(null)
      setUploadedFileType(null)
      setExtractedText(null)
      setSalesCallId(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
        console.log('✅ File input cleared immediately')
      }
      // Reset textarea height immediately
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = '32px'
        console.log('✅ Textarea height reset immediately')
      }
    }
    
    setIsLoading(true)
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    // Create streaming message
    const streamingMessageId = (Date.now() + 1).toString()
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, streamingMessage])

    try {
      // Create OpenAI thread if it doesn't exist (separate from our database conversation)
      let currentThreadId = threadId
      if (!currentThreadId) {
        currentThreadId = await createThread()
      }

      // Prepare request body with optional uploaded file
      const requestBody: any = {
        threadId: currentThreadId,
        message: userMessage.content,
        userId: user.id
      }

      // Add uploaded file information if available
      console.log('🔍 File upload status check:', {
        hasSelectedFile: !!selectedFile,
        hasUploadedFileUrl: !!uploadedFileUrl,
        selectedFileName: selectedFile?.name,
        uploadedFileUrl: uploadedFileUrl,
        uploadedFileType: uploadedFileType,
        hasExtractedText: !!extractedText,
        salesCallId: salesCallId,

      })
      
      if (selectedFile && uploadedFileUrl) {
        console.log('📤 Adding uploaded file to chat request:', {
          fileName: selectedFile.name,
          fileType: uploadedFileType,
          hasExtractedText: !!extractedText,
          salesCallId: salesCallId
        })
        requestBody.uploadedFile = {
          name: selectedFile.name,
          type: selectedFile.type,
          url: uploadedFileUrl,
          fileType: uploadedFileType,
          extractedText: extractedText,
          salesCallId: salesCallId
        }
      } else if (selectedFile && !uploadedFileUrl) {
        console.log('⚠️ File selected but not uploaded yet - waiting for upload to complete')
        // Wait a bit for upload to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check again after waiting
        if (uploadedFileUrl) {
          console.log('✅ Upload completed during wait, adding file to chat request')
          requestBody.uploadedFile = {
            name: selectedFile.name,
            type: selectedFile.type,
            url: uploadedFileUrl,
            fileType: uploadedFileType,
            extractedText: extractedText,
            salesCallId: salesCallId
          }
        } else {
          console.log('❌ Upload still not completed, proceeding without file')
        }
      }

      // Send message to assistant
      console.log('📤 Sending message to Scale Expert API...')
      const response = await fetch('/api/scale-expert/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal
      })

      console.log('📥 Chat API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Chat API failed:', errorText)
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📥 Received response data:', { 
        hasResponse: !!data.response, 
        responseLength: data.response?.length || 0,
        responsePreview: data.response?.substring(0, 100) + '...'
      })
      
      // Simulate streaming effect with better handling
      const fullResponse = data.response
      
      if (!fullResponse || fullResponse.trim() === '') {
        console.log('⚠️ Empty response received')
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: 'Desculpe, não consegui gerar uma resposta. Tenta novamente.', isStreaming: false }
            : msg
        ))
        return
      }
      
      // Use character-based streaming for better formatting preservation
      try {
        const characters = fullResponse.split('')
        let currentText = ''
        
        for (let i = 0; i < characters.length; i++) {
          // Check if the request was aborted
          if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
            console.log('Streaming stopped by user')
            return
          }
          
          currentText += characters[i]
          
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: currentText }
              : msg
          ))
          
          // Add a consistent delay for the streaming effect
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      } catch (streamingError) {
        console.error('❌ Error during streaming:', streamingError)
        // Fallback: show the complete response immediately
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: fullResponse, isStreaming: false }
            : msg
        ))
      }

      // Finalize the message with the complete response
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: fullResponse, isStreaming: false }
          : msg
      ))

      // Save messages to database for persistence
      if (chatService && currentConversationId) {
        try {
          console.log('💾 Saving messages to database...')
          
          // Save user message to database
          await chatService.addMessage(currentConversationId, {
            role: 'user',
            content: userMessage.content,
            tokens_used: 0
          })

          // Save AI response to database
          await chatService.addMessage(currentConversationId, {
            role: 'assistant',
            content: fullResponse,
            tokens_used: 0
          })

          // Generate conversation title from first message if this is the first exchange
          if (messages.length === 0) {
            await chatService.generateConversationTitle(currentConversationId, userMessage.content)
          }

          console.log('✅ Messages saved to database successfully')
        } catch (dbError) {
          console.error('❌ Error saving messages to database:', dbError)
          // Don't throw error here - chat still works even if database save fails
        }
      } else {
        console.log('⚠️ Chat service not available, messages not saved to database')
      }

      // File already cleared immediately after send, no need to clear again
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Clear uploaded file on error (clear regardless of upload status)
      console.log('🧹 Clearing file after error:', {
        hasSelectedFile: !!selectedFile,
        selectedFileName: selectedFile?.name,
        hasUploadedFileUrl: !!uploadedFileUrl
      })
      
      if (selectedFile) {
        console.log('✅ Clearing file state after error...')
        setSelectedFile(null)
        setUploadedFileUrl(null)
        setUploadedFileType(null)
        setExtractedText(null)
        setSalesCallId(null)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
          console.log('✅ File input cleared after error')
        }
        // Reset textarea height on error
        if (inputRef.current) {
          inputRef.current.style.height = '32px' // Reset to initial height
          console.log('✅ Textarea height reset after error')
        }
      } else {
        console.log('⚠️ No file to clear after error')
      }
      
      // Check if the error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted by user')
        return
      }
      
      // Update streaming message with error
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
          : msg
      ))
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    // Shift+Enter will naturally create a new line in the textarea
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Upload function using client-side Vercel Blob upload (same as sales analyst)
  const uploadSalesCall = useCallback(async () => {
    console.log('🚀 uploadSalesCall called with:', { 
      selectedFile: selectedFile?.name, 
      fileType: selectedFile?.type, 
      fileSize: selectedFile?.size,
      userId: user?.id 
    })
    
    if (!selectedFile || !user) {
      console.log('❌ Missing required data:', { hasFile: !!selectedFile, hasUser: !!user })
      return
    }

    setUploading(true)
    setUploadedFileUrl(null) // Clear previous URL
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast({
          title: "Erro de sessão",
          description: "Sessão ativa não encontrada. Por favor, faça login novamente.",
          variant: "destructive"
        })
        return
      }

      // Use client-side upload approach (same as sales analyst)
      console.log('🚀 Starting client-side upload...')
      await uploadFileClientSide(selectedFile, session.access_token)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Erro ao carregar ficheiro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      })
      // Clear selected file on error
      setSelectedFile(null)
      setUploadedFileType(null)
      setExtractedText(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setUploading(false)
    }
  }, [selectedFile, user, toast])

  // Function to upload files using client-side Vercel Blob upload (same as sales analyst)
  const uploadFileClientSide = async (file: File, accessToken: string) => {
    try {
      // Check if we should convert video to audio
      let fileToUpload = file
      let isConverted = false
      
      if (shouldConvertVideo(file)) {
        try {
          console.log('🎵 Converting video to audio for better processing...')
          fileToUpload = await convertVideoToAudio(file)
          isConverted = true
          
          console.log('✅ Video converted to audio:', {
            originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
            convertedSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB`,
            reduction: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`
          })
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

      console.log('🚀 Starting client-side Vercel Blob upload...')

      // Step 1: Upload to Vercel Blob using client upload
      const { upload } = await import('@vercel/blob/client')

      const blob = await upload(fileToUpload.name, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/scale-expert/blob-upload',
        clientPayload: JSON.stringify({
          userId: user!.id,
          accessToken: accessToken,
          originalFileName: file.name,
          isConverted: isConverted
        })
      })

      console.log('✅ File uploaded to Vercel Blob:', blob.url)

      // Step 2: Start transcription directly
      const transcriptionResponse = await fetch('/api/scale-expert/blob-transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
          userId: user!.id,
          accessToken: accessToken,
          salesCallId: 'temp-id' // Not used anymore but kept for compatibility
        })
      })

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const result = await transcriptionResponse.json()

      // Store the uploaded file information for use in chat
      setUploadedFileUrl(blob.url)
      setUploadedFileType('sales_call')
      setSalesCallId(salesCallId)
      
      if (result.transcription) {
        setExtractedText(result.transcription)
        
        // Update conversation metadata with file information if conversation exists
        if (currentConversationId && chatService) {
          try {
            await chatService.updateConversationMetadata(currentConversationId, {
              fileName: file.name,
              fileUrl: blob.url,
              fileType: file.type,
              hasTranscription: true
            })
            console.log('✅ Conversation metadata updated with file information')
          } catch (error) {
            console.error('❌ Error updating conversation metadata:', error)
          }
        }
        
        // Show success message with duplicate info if applicable
        const message = result.duplicateInfo 
          ? `Ficheiro carregado e transcrito com sucesso (análise existente encontrada)`
          : "Ficheiro carregado e transcrito com sucesso"
        
        toast({
          title: "Sucesso",
          description: message
        })
      } else {
        toast({
          title: "Sucesso",
          description: "Ficheiro carregado com sucesso e a ser transcrito"
        })
      }

    } catch (error) {
      console.error('❌ Client-side upload error:', error)
      throw error
    }
  }







  const clearSelectedFile = async () => {
    // If there's an uploaded file URL, delete it from Vercel Blob
    if (uploadedFileUrl) {
      try {
        console.log('🗑️ Deleting blob:', uploadedFileUrl)
        
        const response = await fetch('/api/scale-expert/delete-blob', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            blobUrl: uploadedFileUrl
          })
        })

        if (response.ok) {
          console.log('✅ Blob deleted successfully')
        } else {
          console.error('❌ Failed to delete blob')
        }
      } catch (error) {
        console.error('❌ Error deleting blob:', error)
      }
    }

    // Clear all file-related state
    setSelectedFile(null)
    setUploadedFileUrl(null)
    setUploadedFileType(null)
    setExtractedText(null)
    setSalesCallId(null)
    setConversationFile(null)
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Reset textarea height when file is cleared
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = '32px' // Reset to initial height
    }
  }

  // Auto-upload when file is selected
  useEffect(() => {
          if (selectedFile && !uploadedFileUrl && !uploading) {
      console.log('Auto-uploading selected file...')
      uploadSalesCall()
    }
      }, [selectedFile, uploadedFileUrl, uploading, uploadSalesCall])

  // Debug state changes
  useEffect(() => {
    console.log('🔄 State update:', {
      selectedFile: selectedFile?.name,
      uploading,
      uploadedFileUrl: !!uploadedFileUrl,
      extractedText: !!extractedText,
      extractedTextLength: extractedText?.length,
      
    })
      }, [selectedFile, uploading, uploadedFileUrl, extractedText])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 128) // max 128px (8rem)
      textarea.style.height = `${newHeight}px`
    }
  }, [inputMessage])

  const handleLogout = async () => {
    console.log('🔍 handleLogout function called!')
    try {
      console.log('🚪 User initiated logout...')
      setShowProfileModal(false) // Close the modal first
      console.log('📱 Modal closed, calling signOut...')
      
      // Try normal logout first
      await signOut()
      console.log('✅ SignOut completed successfully')
    } catch (error) {
      console.error('❌ Normal logout failed, trying force logout...', error)
      
      // If normal logout fails, try force logout
      try {
        await forceLogout()
        console.log('✅ Force logout completed')
        router.push('/login')
      } catch (forceError) {
        console.error('❌ Force logout also failed:', forceError)
        alert('Logout failed. Please try clearing your browser data manually.')
      }
    }
  }

  // Conversation management functions
  const handleRenameConversation = async () => {
    if (!selectedConversation || !editingConversationName.trim() || !chatService) {
      setIsEditingName(false)
      setEditingConversationName('')
      return
    }

    try {
      await chatService.updateConversationTitle(selectedConversation.id, editingConversationName.trim())
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, title: editingConversationName.trim() }
          : conv
      ))
      
      // Update current conversation if it's the one being renamed
      if (currentConversationId === selectedConversation.id) {
        setSelectedConversation({ ...selectedConversation, title: editingConversationName.trim() })
      }
      
      toast({
        title: "Sucesso",
        description: "Nome da conversa alterado com sucesso"
      })
    } catch (error) {
      console.error('Error renaming conversation:', error)
      toast({
        title: "Erro",
        description: "Falha ao alterar o nome da conversa",
        variant: "destructive"
      })
    } finally {
      setIsEditingName(false)
      setEditingConversationName('')
      setShowConversationMenu(false)
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !chatService) {
      setShowConversationMenu(false)
      return
    }

    try {
      await chatService.deleteConversation(selectedConversation.id)
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id))
      
      // If this was the current conversation, clear it
      if (currentConversationId === selectedConversation.id) {
        setCurrentConversationId(null)
        setMessages([])
        setThreadId(null)
      }
      
      toast({
        title: "Sucesso",
        description: "Conversa eliminada com sucesso"
      })
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: "Erro",
        description: "Falha ao eliminar a conversa",
        variant: "destructive"
      })
    } finally {
      setShowConversationMenu(false)
      setSelectedConversation(null)
    }
  }

  // Early returns for loading and authentication
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

  if (!user) {
    return null
  }

  // Get current agent details
  const getCurrentAgent = () => {
    return agents.find(agent => agent.id === selectedAgent) || agents[0]
  }

  const agents = [
    {
      id: 'scale-expert',
      name: 'Scale Expert',
      description: 'Estratégias de crescimento com IA e otimização de crescimento empresarial',
      icon: TrendingUp,
      status: 'active',
      lastUsed: 'há 2 horas'
    },
    {
      id: 'sales-analyst',
      name: 'Sales Analyst',
      description: 'Análise avançada de vendas e insights de otimização de receitas',
      icon: BarChart3,
      status: 'active',
      lastUsed: 'há 1 dia'
    },
    {
      id: 'hr-talent',
      name: 'HR Agent',
      description: 'Intelligent talent acquisition and human resources management',
      icon: UserCheck,
      status: 'coming-soon',
      lastUsed: 'Em Breve'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/brand-background.png"
          alt="Background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/20 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10">


        {/* Main Content */}
        <div className="flex h-screen">
          {/* Left Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900/95 border-r border-white/10 backdrop-blur-sm flex flex-col h-screen transition-all duration-300`}>
            {/* Header */}
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <Image
                    src="/images/logo-white.png"
                    alt="ScaleLabs"
                    width={200}
                    height={60}
                    className="h-8 w-auto"
                  />
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-white" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            {!sidebarCollapsed && selectedAgent !== 'sales-analyst' && (
              <div className="flex-1 overflow-y-auto mt-6">
                {/* Past Chats Section */}
                <div className="px-4 pb-2">
                  <h3 className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Past Chats</h3>
                  <div className="space-y-0.5">
                    {conversations.length === 0 ? (
                      <div className="p-1.5">
                        <p className="text-white/40 text-sm">No conversations yet</p>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <div 
                          key={conversation.id}
                          className={`group p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors relative ${
                            currentConversationId === conversation.id ? 'bg-white/10' : ''
                          }`}
                          onClick={() => loadConversation(conversation.id)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-white/70 text-sm truncate flex-1">
                              {conversation.title || 'Untitled Conversation'}
                            </p>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                              onClick={(e) => {
                                e.stopPropagation()
                                const rect = e.currentTarget.getBoundingClientRect()
                                setMenuPosition({
                                  x: rect.left,
                                  y: rect.bottom + 5
                                })
                                setSelectedConversation(conversation)
                                setShowConversationMenu(true)
                              }}
                            >
                              <MoreHorizontal className="w-3 h-3 text-white/60" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Spacer to push profile to bottom when collapsed or when Sales Analyst is active */}
            {(sidebarCollapsed || selectedAgent === 'sales-analyst') && <div className="flex-1"></div>}

            {/* User Profile - Fixed at Bottom */}
            <div className="p-3 border-t border-white/10 flex-shrink-0">
              <div className="relative">
                <button 
                  ref={buttonRef}
                  className={`w-full border-transparent text-white hover:bg-white/20 hover:border-white/50 flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2 rounded-md transition-colors`}
                  onClick={() => setShowProfileModal(!showProfileModal)}
                  title={sidebarCollapsed ? (user?.user_metadata?.full_name || user?.email || 'User') : undefined}
                >
                  <div className="w-8 h-8 min-w-8 min-h-8 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-white font-medium">
                      {user?.user_metadata?.full_name || 
                       (user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                         ? `${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`
                         : user?.user_metadata?.first_name || user?.email || 'User'
                       )}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>


          {/* Conversation Menu */}
          {showConversationMenu && selectedConversation && createPortal(
            <div 
              className="fixed z-[99999] inset-0"
              onClick={() => setShowConversationMenu(false)}
            >
              <div 
                className="absolute bg-gray-900/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md min-w-48"
                style={{ 
                  top: menuPosition.y,
                  left: menuPosition.x,
                  pointerEvents: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  {isEditingName ? (
                    <div className="p-2">
                      <Input
                        value={editingConversationName}
                        onChange={(e) => setEditingConversationName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameConversation()
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false)
                            setEditingConversationName('')
                          }
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        placeholder="Nome da conversa"
                        autoFocus
                      />
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          onClick={handleRenameConversation}
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          Guardar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setIsEditingName(false)
                            setEditingConversationName('')
                          }}
                          className="text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded flex items-center space-x-2"
                        onClick={() => {
                          setEditingConversationName(selectedConversation.title || '')
                          setIsEditingName(true)
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Mudar o nome</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded flex items-center space-x-2"
                        onClick={() => {
                          setShowConversationMenu(false)
                          setShowDeleteConfirmation(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirmation && selectedConversation && createPortal(
            <div 
              className="fixed z-[99999] inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              <div 
                className="bg-gray-900/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Eliminar chat?
                  </h3>
                  <p className="text-white/70 text-sm">
                    Isto irá eliminar <strong>"{selectedConversation.title || 'Untitled Conversation'}"</strong>.
                  </p>
                </div>
                
                <div className="flex space-x-3 justify-end">
                  <Button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirmation(false)
                      handleDeleteConversation()
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Profile Modal */}
          {showProfileModal && createPortal(
            <div 
              ref={modalRef} 
              className="fixed z-[99999]"
              style={{ 
                pointerEvents: 'none',
                bottom: '16px',
                left: sidebarCollapsed ? '64px' : '16px'
              }}
            >
              <div 
                className="w-80 bg-gray-900/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="p-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {user?.user_metadata?.full_name || 
                         (user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                           ? `${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`
                           : user?.user_metadata?.first_name || user?.email || 'User'
                         )}
                      </p>
                      <p className="text-white/60 text-sm">{user?.email || 'No email'}</p>
                    </div>
                  </div>

                  {/* Subscription Section */}
                  <div className="mb-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm font-medium">
                          {subscription?.subscription_plan ? 
                            `Plano ${subscription.subscription_plan.charAt(0).toUpperCase() + subscription.subscription_plan.slice(1)}` : 
                            'Plano Gratuito'
                          }
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        subscription?.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' :
                        subscription?.subscription_status === 'past_due' ? 'bg-yellow-500/20 text-yellow-400' :
                        subscription?.subscription_status === 'canceled' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {subscription?.subscription_status === 'active' ? 'Ativo' :
                         subscription?.subscription_status === 'past_due' ? 'Em Atraso' :
                         subscription?.subscription_status === 'canceled' ? 'Cancelado' :
                         'Gratuito'}
                      </div>
                    </div>
                    
                    {subscription?.subscription_current_period_end && (
                      <p className="text-white/60 text-xs mb-2">
                        Renova em: {new Date(subscription.subscription_current_period_end).toLocaleDateString('pt-PT')}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      {subscription?.subscription_plan ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-white/20 text-white hover:bg-white/10 bg-white/5 text-xs"
                          onClick={openCustomerPortal}
                          disabled={subscriptionLoading}
                        >
                          {subscriptionLoading ? 'A carregar...' : 'Gerir Subscrição'}
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-xs"
                          onClick={() => {
                            setShowProfileModal(false)
                            router.push('/pricing')
                          }}
                        >
                          Ver Planos
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">Créditos</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-white/60 text-sm">3 restantes</span>
                        <ChevronRight className="w-3 h-3 text-white/60" />
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-400 text-xs">Créditos diários usados primeiro</span>
                    </div>
                  </div>

                  {/* Quick Actions Section */}
                  <div className="mb-4">
                    <h3 className="text-white font-semibold text-sm mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <button 
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-left"
                        onClick={() => {
                          setShowProfileModal(false)
                          setSelectedAgent('sales-analyst')
                          setActiveTab('upload')
                        }}
                      >
                        <div className="w-8 h-8 rounded-md bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Ficheiros de Análise de Vendas</p>
                          <p className="text-white/60 text-xs">Ver e gerir as suas análises de chamadas de vendas</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-white/20 text-white hover:bg-white/10 bg-white/5"
                      onClick={() => {
                        setShowProfileModal(false)
                        router.push('/settings')
                      }}
                    >
                      <Settings className="w-3 h-3 mr-2" />
                      Definições
                    </Button>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-white/60" />
                        <span className="text-white text-sm">Centro de Ajuda</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4 text-white/60" />
                        <span className="text-white text-sm">Aparência</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-white/60" />
                    </div>
                    <button 
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors text-left" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('🖱️ Logout button clicked!')
                        handleLogout()
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">Terminar sessão</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Scale Expert Interface */}
          <div className="flex-1 flex flex-col bg-black relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black" />
            <div className="relative z-10 flex flex-col h-full">
                          {/* Top Bar with Agent Selector */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  {/* Agent Dropdown */}
                  <div className="relative" data-agent-dropdown>
                    <button 
                      className="flex items-center space-x-2 px-4 py-3 border-transparent rounded-lg hover:bg-white/10 hover:border-white/50 transition-colors"
                      onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        selectedAgent === 'scale-expert' 
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600' 
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                      }`}>
                        {(() => {
                          const currentAgent = getCurrentAgent()
                          const IconComponent = currentAgent.icon
                          return <IconComponent className="w-3 h-3 text-white" />
                        })()}
                      </div>
                      <span className="text-white font-medium">{getCurrentAgent().name}</span>
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showAgentDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md z-50">
                        <div className="py-1">
                          <button 
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                            onClick={() => {
                              setShowAgentDropdown(false)
                              setSelectedAgent('scale-expert')
                            }}
                          >
                            <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-600 to-violet-600 flex items-center justify-center">
                              <TrendingUp className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-white text-sm">Scale Expert</span>
                          </button>
                          <button 
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                            onClick={() => {
                              setShowAgentDropdown(false)
                              setSelectedAgent('sales-analyst')
                              setActiveTab('upload')
                            }}
                          >
                            <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                              <BarChart3 className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-white text-sm">Sales Analyst</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Chat Button - Top Right */}
                <div className="flex items-center">
                  {selectedAgent === 'scale-expert' && (
                    <button 
                      onClick={createNewConversation}
                      className="flex items-center space-x-3 px-5 py-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-white font-medium">Novo chat</span>
                    </button>
                  )}
                </div>
              </div>

            {/* Agent Content */}
            <div className="flex-1 overflow-hidden">
              {selectedAgent === 'scale-expert' && (
                <div className="h-full flex flex-col">
                  {/* Scale Expert Chat Messages */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="w-full mx-auto pt-8">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20">
                          <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">Bem-vindo ao Agente Scale Expert</h3>
                            <p className="text-white/60 mb-6 text-base leading-relaxed">
                              Pergunta-me qualquer coisa sobre escalar o teu negócio, estratégias de crescimento, desafios operacionais ou as tuas chamadas de vendas.
                            </p>
                            <div className="text-base text-white/50">
                              💡 Dica: O agente pode analisar as tuas chamadas de vendas carregadas para fornecer insights personalizados.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Conversation File Display - Only show when no file info in messages */}
                          {conversationFile && messages.length > 0 && !messages.some(msg => msg.fileInfo) && (
                            <div className="mb-6 flex items-center justify-end">
                              <div className="max-w-2xl ml-auto mr-16">
                                <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 flex items-center space-x-3 max-w-[400px]">
                                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-white">{conversationFile.name}</div>
                                    <div className="text-xs text-white/60">
                                      Ficheiro da conversa
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConversationFile(null)}
                                    className="bg-white text-black hover:bg-gray-200 text-xs h-4 w-4 p-0 ml-1 border-0"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {messages.map((message) => {
                            console.log('🎨 Rendering message:', { id: message.id, role: message.role, hasFileInfo: !!message.fileInfo, content: message.content })
                            return (
                            <div
                              key={message.id}
                              className={`mb-8 ${message.role === 'user' ? 'flex justify-end' : ''}`}
                            >
                            {message.role === 'user' ? (
                              <div className="max-w-2xl ml-auto mr-16">
                                {/* File attachment box (if present) */}
                                {message.fileInfo && (
                                  <div className="mb-3">
                                    <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-white">{message.fileInfo.name}</div>
                                        <div className="text-xs text-white/60">
                                          {message.fileInfo.size ? `${(message.fileInfo.size / 1024 / 1024).toFixed(1)} MB` : 'File'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Text message (if present) */}
                                {message.content && !message.content.startsWith('📎') && (
                                  <div className="bg-purple-800/80 text-white rounded-lg p-4 shadow-sm">
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-normal">{message.content}</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full max-w-4xl mx-auto px-4">
                                <div className="text-white">
                                  <div className="markdown-content text-base leading-relaxed font-normal space-y-4">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        // Custom styling for markdown elements
                                        h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-white">{children}</h1>,
                                        h2: ({children}) => <h2 className="text-xl font-semibold mb-3 text-white">{children}</h2>,
                                        h3: ({children}) => <h3 className="text-lg font-semibold mb-2 text-white">{children}</h3>,
                                        h4: ({children}) => <h4 className="text-base font-semibold mb-2 text-white">{children}</h4>,
                                        p: ({children}) => <p className="mb-4 text-white leading-relaxed">{children}</p>,
                                        ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-white">{children}</ul>,
                                        ol: ({children}) => <ol className="list-decimal list-outside mb-4 space-y-2 text-white pl-6">{children}</ol>,
                                        li: ({children}) => <li className="text-white leading-relaxed mb-2">{children}</li>,
                                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                        em: ({children}) => <em className="italic text-white">{children}</em>,
                                        code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono text-white">{children}</code>,
                                        pre: ({children}) => <pre className="bg-white/10 p-3 rounded-lg overflow-x-auto mb-4 text-sm font-mono text-white">{children}</pre>,
                                        blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-white/80 mb-4">{children}</blockquote>,
                                        table: ({children}) => <table className="w-full border-collapse border border-white/20 mb-4 text-white">{children}</table>,
                                        th: ({children}) => <th className="border border-white/20 px-3 py-2 bg-white/10 font-semibold">{children}</th>,
                                        td: ({children}) => <td className="border border-white/20 px-3 py-2">{children}</td>,
                                        a: ({children, href}) => <a href={href} className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                  {message.isStreaming && !message.content && (
                                    <div className="flex items-center space-x-1 mt-4">
                                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                        })}
                        </>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Scale Expert Input Area */}
                  <div className="backdrop-blur-sm p-4">
                    <div className="max-w-2xl mx-auto">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      


                      {/* Selected File Display - Inside Input Area */}
                      <div className={`bg-white/10 border border-white/20 rounded-lg flex flex-col transition-all duration-300 ${
                        selectedFile ? 'p-4' : 'p-4'
                      }`}>
                        {selectedFile && (
                          <div className="mb-4 flex items-center justify-start">
                            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center space-x-3 max-w-[350px]">
                              <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center">
                                {uploading ? (
                                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                  <FileText className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm text-white truncate">
                                  {selectedFile.name}
                                </div>
                                <div className="text-sm text-white/50">
                                  {uploading ? 'A processar...' : 
                                   uploadedFileUrl && !extractedText ? 'A extrair...' : 
                                   extractedText ? 'Pronto' : 'Ficheiro selecionado'}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={clearSelectedFile}
                                className="bg-white text-black hover:bg-gray-200 text-sm h-5 w-5 p-0 ml-2 border-0"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-end space-x-3">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="bg-transparent border-none text-white hover:bg-white/10 p-3 h-9 w-9 rounded-md flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          
                          <Textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (isContentAvailable() && (inputMessage.trim() || selectedFile)) {
                                  sendMessage()
                                }
                              }
                            }}
                            placeholder={!isContentAvailable() ? getFileStatusMessage() || "Aguarde o processamento do ficheiro..." : "Pergunte qualquer coisa..."}
                            className="bg-transparent border-none text-white placeholder-white/50 focus:outline-none focus:ring-0 focus:border-none focus-visible:ring-0 focus-visible:outline-none resize-none flex-1 transition-all duration-300 min-h-[36px] max-h-32 overflow-y-auto"
                            disabled={isLoading || !isContentAvailable()}
                            rows={1}
                            spellCheck={false}
                          />
                          
                          <Button
                            onClick={sendMessage}
                            disabled={(!inputMessage.trim() && !selectedFile) || !isContentAvailable() || isLoading}
                            className="p-3 h-9 w-9 rounded-md disabled:opacity-50 flex-shrink-0 bg-purple-600 hover:bg-purple-700"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-center mt-2 space-y-1">
                        <p className="text-xs text-white/50">
                          Pressiona Enter para enviar • Shift+Enter para nova linha • Clique no + para carregar ficheiros
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAgent === 'sales-analyst' && (
                <div className="h-full flex flex-col">
                  {/* Sales Analyst Content */}
                  <div className="flex-1 overflow-y-auto p-6 w-full">
                    <div className="w-full mx-auto">
                      {/* Tabs */}
                      <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
                        <button
                          onClick={() => setActiveTab('upload')}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'upload' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Upload className="w-4 h-4 inline mr-2" />
                          Carregar Ficheiro
                        </button>
                        <button
                          onClick={() => setActiveTab('analyses')}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'analyses' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <FileText className="w-4 h-4 inline mr-2" />
                          Ver Análises ({analyses.length})
                        </button>
                      </div>

                      {/* Upload Tab */}
                      {activeTab === 'upload' && (
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
                            <div 
                              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                                isFileSelectionInProgress 
                                  ? 'cursor-not-allowed border-gray-500 bg-gray-500/10' 
                                  : isDragOver 
                                    ? 'cursor-pointer border-purple-500 bg-purple-500/10 scale-105' 
                                    : 'cursor-pointer border-white/20 hover:border-purple-500/50 hover:bg-white/5'
                              }`}
                              onClick={() => {
                                console.log('🎯 File input clicked, current file:', salesFileInputRef.current?.files?.[0]?.name)
                                console.log('🔒 File selection in progress:', isFileSelectionInProgress)
                                if (!isFileSelectionInProgress) {
                                  salesFileInputRef.current?.click()
                                } else {
                                  console.log('⚠️ File selection already in progress, ignoring click')
                                }
                              }}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <input
                                ref={salesFileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  console.log('📁 File input onChange triggered')
                                  console.log('🔒 File selection in progress:', isFileSelectionInProgress)
                                  
                                  if (isFileSelectionInProgress) {
                                    console.log('⚠️ File selection already in progress, ignoring onChange')
                                    return
                                  }
                                  
                                  const file = e.target.files?.[0]
                                  console.log('📁 Selected file:', file?.name, file?.size, file?.type)
                                  if (file) {
                                    console.log('📁 Calling handleFileSelection...')
                                    handleFileSelection(file)
                                    // Don't reset the input value immediately - let the upload process handle it
                                    console.log('📁 File selection initiated')
                                  } else {
                                    console.log('📁 No file selected')
                                  }
                                }}
                                className="hidden"
                              />
                              {!salesUploadedFile ? (
                                <>
                                  <div className="flex items-center justify-center mb-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                                      isDragOver 
                                        ? 'bg-purple-500/30 scale-110' 
                                        : 'bg-purple-500/20'
                                    }`}>
                                      <Upload className={`w-8 h-8 transition-colors duration-300 ${
                                        isDragOver ? 'text-purple-300' : 'text-purple-400'
                                      }`} />
                                    </div>
                                  </div>
                                  <p className="text-lg font-medium text-white mb-2">
                                    {isFileSelectionInProgress 
                                      ? 'A processar seleção de ficheiro...' 
                                      : isDragOver 
                                        ? 'Largue o ficheiro aqui' 
                                        : 'Clique aqui para carregar o seu ficheiro ou arraste'
                                    }
                                  </p>
                                  <p className="text-white/50 text-sm mb-4">
                                    Formatos suportados: MP4, MOV, AVI, WMV
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-center mb-4">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-lg font-medium text-white mb-2">
                                    {salesUploadedFile.name}
                                  </p>
                                  <p className="text-white/60 mb-2">
                                    Tamanho: {(salesUploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                                  </p>
                                  <p className="text-white/60 mb-2">
                                    Tipo: {salesUploadedFile.type}
                                  </p>
                                </>
                              )}
                              <div className="flex justify-center space-x-2 mt-4">
                                {salesIsUploading ? (
                                  // Show only Cancel button during upload
                                  <Button 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation() // Prevent event bubbling to parent drag-and-drop area
                                      cancelSalesUpload()
                                    }}
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                  >
                                    Cancelar
                                  </Button>
                                ) : (
                                  // Show normal buttons when not uploading
                                  <>
                                    <Button 
                                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                                      onClick={(e) => {
                                        e.stopPropagation() // Prevent event bubbling to parent drag-and-drop area
                                        console.log('🔘 Button clicked, current file:', salesFileInputRef.current?.files?.[0]?.name)
                                        console.log('🔒 File selection in progress:', isFileSelectionInProgress)
                                        if (!isFileSelectionInProgress) {
                                          salesFileInputRef.current?.click()
                                        } else {
                                          console.log('⚠️ File selection already in progress, ignoring button click')
                                        }
                                      }}
                                    >
                                      {salesUploadedFile ? 'Alterar Ficheiro' : 'Escolher Ficheiro'}
                                    </Button>
                                    {salesUploadedFile && (
                                      <Button 
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation() // Prevent event bubbling to parent drag-and-drop area
                                          setSalesUploadedFile(null)
                                          setSalesUploadStatus('')
                                          setSalesUploadProgress(0)
                                          setUploadError(null)
                                          setFilePreview(null)
                                          if (salesFileInputRef.current) {
                                            salesFileInputRef.current.value = ''
                                          }
                                        }}
                                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                      >
                                        Limpar Ficheiro
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Error Display */}
                            {uploadError && (
                              <div className="p-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Erro de Validação</span>
                                </div>
                                <p className="mt-1 text-sm">{uploadError}</p>
                              </div>
                            )}

                            {/* Upload Progress */}
                            {salesIsUploading && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-white/70 font-medium">{salesUploadStatus}</span>
                                  <span className="text-white/70 bg-white/10 px-2 py-1 rounded-full text-xs">
                                    {salesUploadProgress}%
                                  </span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-violet-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                                    style={{ width: `${salesUploadProgress}%` }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                  </div>
                                </div>
                                {salesUploadProgress > 0 && salesUploadProgress < 100 && (
                                  <div className="flex items-center justify-center space-x-2 text-xs text-white/50">
                                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Status Message */}
                            {salesUploadStatus && !salesIsUploading && (
                              <div className={`p-3 rounded-lg text-sm ${
                                salesUploadStatus.includes('failed') || salesUploadStatus.includes('error')
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                              }`}>
                                {salesUploadStatus}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Analyses Tab */}
                      {activeTab === 'analyses' && (
                        <div className="space-y-6">
                          {/* Search and Filter */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                                <Input
                                  placeholder="Procurar análises..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectAll}
                                  onCheckedChange={toggleSelectAll}
                                  className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <span className="text-white/70 text-sm">
                                  Selecionar todas
                                </span>
                              </div>
                              
                              {selectedAnalyses.size > 0 && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Eliminar {selectedAnalyses.size}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-gray-900 border-white/20">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">Eliminar Análises Selecionadas</AlertDialogTitle>
                                      <AlertDialogDescription className="text-white/70">
                                        Tem a certeza que pretende eliminar {selectedAnalyses.size} análise(s) selecionada(s)? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={deleteSelectedAnalyses}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Eliminar {selectedAnalyses.size}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>



                          {/* Analyses List */}
                          {loadingAnalyses ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                              <span className="ml-3 text-white/70">A carregar análises...</span>
                            </div>
                          ) : analyses.length === 0 ? (
                            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                              <CardContent className="py-12 text-center">
                                <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">Nenhuma análise encontrada</h3>
                                <p className="text-white/60">Carregue o seu primeiro ficheiro para começar a analisar chamadas de vendas.</p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="grid gap-4">
                              {analyses
                                .filter(analysis => {
                                  const matchesSearch = analysis.title.toLowerCase().includes(searchTerm.toLowerCase())
                                  const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter
                                  return matchesSearch && matchesStatus
                                })
                                .map((analysis) => (
                                  <Card 
                                    key={analysis.id} 
                                    className={`bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-colors cursor-pointer ${
                                      selectedAnalyses.has(analysis.id) ? 'border-purple-500/50 bg-purple-500/5' : ''
                                    }`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                          {/* Checkbox for bulk selection */}
                                          <div onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                              checked={selectedAnalyses.has(analysis.id)}
                                              onCheckedChange={() => toggleAnalysisSelection(analysis.id)}
                                              className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                            />
                                          </div>
                                          
                                          <div 
                                            className="flex-1 cursor-pointer"
                                            onClick={() => {
                                              setSelectedAnalysis(analysis)
                                              setShowAnalysisModal(true)
                                            }}
                                          >
                                            <h3 className="text-white font-medium mb-1">{analysis.title}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-white/60">
                                              <span>{analysis.uploadDate}</span>
                                              <span>Tipo: {analysis.callType}</span>
                                              {analysis.score > 0 && (
                                                <span className="flex items-center">
                                                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                                  {analysis.score}/40
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Badge 
                                            variant={analysis.status === 'completed' ? 'default' : analysis.status === 'processing' ? 'secondary' : 'destructive'}
                                            className={analysis.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                                     analysis.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                                                     'bg-red-500/20 text-red-400 border-red-500/30'}
                                          >
                                            {analysis.status === 'completed' ? 'Concluído' : 
                                             analysis.status === 'processing' ? 'A Processar' : 'Falhou'}
                                          </Badge>
                                          
                                          {/* Individual delete button */}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setAnalysisToDelete(analysis)
                                              setShowAnalysisDeleteConfirmation(true)
                                            }}
                                            className="h-8 w-8 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                          
                                          <ChevronRight className="w-4 h-4 text-white/40" />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>


            </div>
          </div>
        </div>
      </div>

              {/* Analysis Detail Modal */}
        {showAnalysisModal && selectedAnalysis && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => {
              console.log('Backdrop clicked, closing modal')
              setShowAnalysisModal(false)
              setSelectedAnalysis(null)
            }}
          >
            <div 
              className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedAnalysis.title}</h2>
              <Button 
                variant="ghost" 
                onClick={() => {
                  console.log('Close button clicked, closing modal')
                  setShowAnalysisModal(false)
                  setSelectedAnalysis(null)
                }}
                className="text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-lg">
                  <span className="text-white/60 block">Data:</span>
                  <p className="text-white font-medium">{selectedAnalysis.uploadDate}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <span className="text-white/60 block">Estado:</span>
                  <p className="text-white font-medium capitalize">{selectedAnalysis.status}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <span className="text-white/60 block">Tipo de Chamada:</span>
                  <p className="text-white font-medium">{selectedAnalysis.analysis?.callType || selectedAnalysis.analysis?.call_type || selectedAnalysis.call_type || 'N/A'}</p>
                </div>
                {selectedAnalysis.score > 0 && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <span className="text-white/60 block">Pontuação:</span>
                    <p className="text-white font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {selectedAnalysis.score}/40
                    </p>
                  </div>
                )}
              </div>

              {/* Analysis Details */}
              {selectedAnalysis.analysis && (
                <div className="space-y-4">
                  
                  {/* Pontos Fortes */}
                  {(selectedAnalysis.analysis?.analysis_fields?.pontosFortes || selectedAnalysis.analysis?.analysis?.pontosFortes || selectedAnalysis.analysis?.pontosFortes) && (
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
                          {selectedAnalysis.analysis?.analysis_fields?.pontosFortes || selectedAnalysis.analysis?.analysis?.pontosFortes || selectedAnalysis.analysis?.pontosFortes}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {/* Pontos de Melhoria */}
                  {(selectedAnalysis.analysis?.analysis_fields?.pontosFracos || selectedAnalysis.analysis?.analysis?.pontosFracos || selectedAnalysis.analysis?.pontosFracos) && (
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
                          {selectedAnalysis.analysis?.analysis_fields?.pontosFracos || selectedAnalysis.analysis?.analysis?.pontosFracos || selectedAnalysis.analysis?.pontosFracos}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {/* Resumo da Chamada */}
                  {(selectedAnalysis.analysis?.analysis_fields?.resumoDaCall || selectedAnalysis.analysis?.analysis?.resumoDaCall || selectedAnalysis.analysis?.resumoDaCall) && (
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
                          {selectedAnalysis.analysis?.analysis_fields?.resumoDaCall || selectedAnalysis.analysis?.analysis?.resumoDaCall || selectedAnalysis.analysis?.resumoDaCall}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {/* Dicas Gerais */}
                  {(selectedAnalysis.analysis?.analysis_fields?.dicasGerais || selectedAnalysis.analysis?.analysis?.dicasGerais || selectedAnalysis.analysis?.dicasGerais) && (
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
                          {selectedAnalysis.analysis?.analysis_fields?.dicasGerais || selectedAnalysis.analysis?.analysis?.dicasGerais || selectedAnalysis.analysis?.dicasGerais}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {/* Foco para Próximas Calls */}
                  {(selectedAnalysis.analysis?.analysis_fields?.focoParaProximasCalls || selectedAnalysis.analysis?.analysis?.focoParaProximasCalls || selectedAnalysis.analysis?.focoParaProximasCalls) && (
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
                          {selectedAnalysis.analysis?.analysis_fields?.focoParaProximasCalls || selectedAnalysis.analysis?.analysis?.focoParaProximasCalls || selectedAnalysis.analysis?.focoParaProximasCalls}
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.clarezaFluenciaFala ?? selectedAnalysis.analysis?.analysis?.clarezaFluenciaFala ?? selectedAnalysis.analysis?.clarezaFluenciaFala ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaClarezaFluenciaFala || selectedAnalysis.analysis?.justificativaClarezaFluenciaFala) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaClarezaFluenciaFala || selectedAnalysis.analysis?.justificativaClarezaFluenciaFala}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Tom e Controlo</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.tomControlo ?? selectedAnalysis.analysis?.analysis?.tomControlo ?? selectedAnalysis.analysis?.tomControlo ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaTomControlo || selectedAnalysis.analysis?.justificativaTomControlo) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaTomControlo || selectedAnalysis.analysis?.justificativaTomControlo}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Envolvimento Conversacional</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.envolvimentoConversacional ?? selectedAnalysis.analysis?.analysis?.envolvimentoConversacional ?? selectedAnalysis.analysis?.envolvimentoConversacional ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaEnvolvimentoConversacional || selectedAnalysis.analysis?.justificativaEnvolvimentoConversacional) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaEnvolvimentoConversacional || selectedAnalysis.analysis?.justificativaEnvolvimentoConversacional}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Efetividade na Descoberta de Necessidades</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.efetividadeDescobertaNecessidades ?? selectedAnalysis.analysis?.analysis?.efetividadeDescobertaNecessidades ?? selectedAnalysis.analysis?.efetividadeDescobertaNecessidades ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaEfetividadeDescobertaNecessidades || selectedAnalysis.analysis?.justificativaEfetividadeDescobertaNecessidades) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaEfetividadeDescobertaNecessidades || selectedAnalysis.analysis?.justificativaEfetividadeDescobertaNecessidades}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Entrega de Valor e Ajuste da Solução</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.entregaValorAjusteSolucao ?? selectedAnalysis.analysis?.analysis?.entregaValorAjusteSolucao ?? selectedAnalysis.analysis?.entregaValorAjusteSolucao ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaEntregaValorAjusteSolucao || selectedAnalysis.analysis?.justificativaEntregaValorAjusteSolucao) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaEntregaValorAjusteSolucao || selectedAnalysis.analysis?.justificativaEntregaValorAjusteSolucao}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Habilidades de Lidar com Objeções</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.habilidadesLidarObjeccoes ?? selectedAnalysis.analysis?.analysis?.habilidadesLidarObjeccoes ?? selectedAnalysis.analysis?.habilidadesLidarObjeccoes ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaHabilidadesLidarObjeccoes || selectedAnalysis.analysis?.justificativaHabilidadesLidarObjeccoes) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaHabilidadesLidarObjeccoes || selectedAnalysis.analysis?.justificativaHabilidadesLidarObjeccoes}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Estrutura e Controle da Reunião</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.estruturaControleReuniao ?? selectedAnalysis.analysis?.analysis?.estruturaControleReuniao ?? selectedAnalysis.analysis?.estruturaControleReuniao ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaEstruturaControleReuniao || selectedAnalysis.analysis?.justificativaEstruturaControleReuniao) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaEstruturaControleReuniao || selectedAnalysis.analysis?.justificativaEstruturaControleReuniao}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="border-l-4 border-white/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">Fechamento e Próximos Passos</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.analysis_fields?.fechamentoProximosPassos ?? selectedAnalysis.analysis?.analysis?.fechamentoProximosPassos ?? selectedAnalysis.analysis?.fechamentoProximosPassos ?? 0}</span>
                              <span className="text-white/60 text-sm">/5</span>
                            </div>
                          </div>
                          {(selectedAnalysis.analysis?.analysis_fields?.justificativaFechamentoProximosPassos || selectedAnalysis.analysis?.justificativaFechamentoProximosPassos) && (
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
                                {selectedAnalysis.analysis?.analysis_fields?.justificativaFechamentoProximosPassos || selectedAnalysis.analysis?.justificativaFechamentoProximosPassos}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Delete Confirmation Modal */}
      {showAnalysisDeleteConfirmation && analysisToDelete && (
        <div 
          className="fixed z-[99999] inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowAnalysisDeleteConfirmation(false)}
        >
          <div 
            className="bg-gray-900/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Eliminar análise?
              </h3>
              <p className="text-white/70 text-sm">
                Isto irá eliminar <strong>"{analysisToDelete.title}"</strong>.
              </p>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <Button
                onClick={() => setShowAnalysisDeleteConfirmation(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowAnalysisDeleteConfirmation(false)
                  deleteAnalyses([analysisToDelete.id])
                  setAnalysisToDelete(null)
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}