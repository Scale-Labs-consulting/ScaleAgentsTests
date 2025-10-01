'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bot, TrendingUp, Users, Zap, MessageSquare, BarChart3, UserCheck, LogOut, Settings, Crown, ChevronRight, ChevronLeft, HelpCircle, Moon, UserPlus, FileText, Send, ArrowLeft, Loader2, Sparkles, Square, Upload, FileAudio, Plus, ArrowUp, Play, Pause, Volume2, VolumeX, Download, Trash2, CheckCircle, AlertCircle, Clock, Calendar, Target, Brain, ArrowRight, XCircle, X, MoreHorizontal, Edit3, FileVideo, Search, RefreshCw, Star, Copy, StickyNote, Share2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser'
import { forceLogout, supabase } from '@/lib/supabase'
import { ChatService, getScaleExpertAgentId } from '@/lib/chat-service'
import { useToast } from '@/hooks/use-toast'
import { convertVideoToAudio, shouldConvertVideo } from '@/lib/video-converter'
import { hasAgentAccess, getAvailableAgents, getPlanById, hasReachedUsageLimit, getUsageLimit } from '@/lib/subscription-plans'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'


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
  const [isRedirecting, setIsRedirecting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user, signOut, loading, initialized } = useAuth()
  const { isFirstTime, isLoading: isFirstTimeLoading } = useFirstTimeUser()

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
  const [salesCallType, setSalesCallType] = useState<string>('Chamada Fria')
  const [salesIsUploading, setSalesIsUploading] = useState(false)
  const [salesUploadProgress, setSalesUploadProgress] = useState(0)
  const [salesUploadStatus, setSalesUploadStatus] = useState('')
  const [salesAnalysisResult, setSalesAnalysisResult] = useState<any>(null)
  const [isFileSelectionInProgress, setIsFileSelectionInProgress] = useState(false)
  const [salesIsAnalyzing, setSalesIsAnalyzing] = useState(false)
  
  // Enhanced upload progress state
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null)
  const [currentProgressPhrase, setCurrentProgressPhrase] = useState('')
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('')
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'1D' | '7D' | '14D' | '30D' | 'custom'>('1D')
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null})

  // Filter analyses based on date range
  const getFilteredAnalyses = () => {
    if (!analyses || analyses.length === 0) return []
    
    const now = new Date()
    let startDate: Date
    
    switch (dateFilter) {
      case '1D':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7D':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '14D':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '30D':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (!customDateRange.start || !customDateRange.end) return analyses
        return analyses.filter((analysis: any) => {
          // Use uploadDate which is already formatted as YYYY-MM-DD
          const analysisDate = new Date(analysis.uploadDate)
          return analysisDate >= customDateRange.start! && analysisDate <= customDateRange.end!
        })
      default:
        return analyses
    }
    
    return analyses.filter((analysis: any) => {
      // Use uploadDate which is already formatted as YYYY-MM-DD
      const analysisDate = new Date(analysis.uploadDate)
      return analysisDate >= startDate
    })
  }

  // Prepare chart data for average score over time
  const getChartData = () => {
    const filtered = getFilteredAnalyses()
    if (filtered.length === 0) return []

    // Group analyses by date and calculate average score
    const groupedByDate = filtered.reduce((acc: any, analysis: any) => {
      const date = analysis.uploadDate
      if (!acc[date]) {
        acc[date] = { scores: [], count: 0 }
      }
      acc[date].scores.push(analysis.score || 0)
      acc[date].count += 1
      return acc
    }, {})

    // Convert to chart data format
    const chartData = Object.entries(groupedByDate)
      .map(([date, data]: [string, any]) => ({
        date: new Date(date).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
        fullDate: date,
        averageScore: Math.round(data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.count),
        count: data.count
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

    return chartData
  }
  
  // AbortController for cancelling upload operations
  const salesAbortControllerRef = useRef<AbortController | null>(null)
  
  // Cycling progress phrases that alternate continuously
  const progressPhrases = [
    'A preparar gravação para transcrição...',
    'A validar ficheiro e preparar processamento...',
    'A fazer upload para o servidor...',
    'A converter vídeo para áudio (se necessário)...',
    'A processar ficheiro e iniciar transcrição...',
    'A transcrever chamada com IA...',
    'A preparar análise...',
    'A analisar pontos fortes da chamada...',
    'A analisar pontos de melhoria...',
    'A gerar recomendações...',
    'A processar com algoritmos avançados...',
    'A gerar insights personalizados...',
    'A criar relatório detalhado...',
    'A finalizar processamento...',
    'A otimizar qualidade do áudio...',
    'A extrair metadados do ficheiro...'
  ]
  
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

  // Update progress phrases and ETA in real-time
  useEffect(() => {
    if (salesIsUploading && uploadStartTime) {
      const eta = calculateETA(salesUploadProgress, uploadStartTime)
      setEstimatedTimeRemaining(eta)
    }
  }, [salesUploadProgress, salesIsUploading, uploadStartTime])

  // Cycle through progress phrases continuously
  useEffect(() => {
    if (!salesIsUploading) return

    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % progressPhrases.length)
    }, 2000) // Change phrase every 2 seconds

    return () => clearInterval(interval)
  }, [salesIsUploading, progressPhrases.length])

  // Handle Stripe checkout success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')
    const sessionId = urlParams.get('session_id')
    const paymentIntent = urlParams.get('payment_intent')
    const redirectStatus = urlParams.get('redirect_status')
    
    // Handle Stripe checkout success (both session and payment intent flows)
    if (success === 'true' && (sessionId || (paymentIntent && redirectStatus === 'succeeded'))) {
      // Set redirecting state and redirect to payment success page immediately
      setIsRedirecting(true)
      // Add the payment parameters to the success page URL
      const successUrl = `/payment-success?success=true&payment_intent=${paymentIntent || ''}&redirect_status=${redirectStatus || ''}&session_id=${sessionId || ''}`
      router.replace(successUrl)
      return
    }
    
    // Handle Stripe checkout cancellation
    if (canceled === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado. Pode tentar novamente quando quiser.",
        variant: "destructive",
        duration: 5000,
      })
      
      // Clear URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('canceled')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [toast])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)

  const [uploadedFileType, setUploadedFileType] = useState<'sales_call' | 'document' | 'data' | null>(null)
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
  
  // Usage tracking states
  const [scaleExpertUsage, setScaleExpertUsage] = useState(0)
  const [salesAnalystUsage, setSalesAnalystUsage] = useState(0)
  
  // Analysis list states
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  
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
  const [isRefreshing, setIsRefreshing] = useState(false)
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
    // Check file type - now supports video files and application/octet-stream
    if (!file.type.startsWith('video/') && file.type !== 'application/octet-stream') {
      return 'Por favor, carregue um ficheiro de vídeo (MP4, MOV, AVI, etc.) ou um ficheiro de dados (application/octet-stream)'
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

  const loadUsageData = async () => {
    if (!user) return
    
    try {
      // Load usage data from profiles table (faster than querying usage_tracking)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('scale_expert_messages_monthly, sales_analyst_uploads_monthly')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error loading usage data from profiles:', error)
        // Fallback to usage_tracking table
        await loadUsageDataFromTrackingTable()
        return
      }
      
      setScaleExpertUsage(profile.scale_expert_messages_monthly || 0)
      setSalesAnalystUsage(profile.sales_analyst_uploads_monthly || 0)
    } catch (error) {
      console.error('Error loading usage data:', error)
      // Fallback to old method if profiles table doesn't have usage fields yet
      await loadUsageDataFromTrackingTable()
    }
  }

  const loadUsageDataFromTrackingTable = async () => {
    if (!user) return
    
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      // Get Scale Expert message usage
      const { data: scaleExpertUsage } = await supabase
        .from('usage_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('agent_type', 'scale-expert')
        .eq('action_type', 'message')
        .gte('created_at', startOfMonth.toISOString())
      
      // Get Sales Analyst upload usage
      const { data: salesAnalystUsage } = await supabase
        .from('usage_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('agent_type', 'sales-analyst')
        .eq('action_type', 'upload')
        .gte('created_at', startOfMonth.toISOString())
      
      setScaleExpertUsage(scaleExpertUsage?.length || 0)
      setSalesAnalystUsage(salesAnalystUsage?.length || 0)
    } catch (fallbackError) {
      console.error('Fallback usage loading also failed:', fallbackError)
      // Final fallback to sales_calls table for sales analyst
      try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const { data: salesAnalystUploads } = await supabase
          .from('sales_calls')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString())
        
        setSalesAnalystUsage(salesAnalystUploads?.length || 0)
        setScaleExpertUsage(0)
      } catch (finalError) {
        console.error('All usage loading methods failed:', finalError)
      }
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
    } else if (file.type === 'application/octet-stream') {
      // For binary data files, we'll show a generic file icon
      // No preview available for binary data
      setFilePreview(null)
    }

    setSalesUploadedFile(file)
    setSalesIsUploading(true)
    setSalesUploadProgress(0)
    setSalesUploadStatus('A preparar o carregamento...')
    setSalesAnalysisResult(null)
    setUploadStartTime(Date.now())
    setCurrentPhraseIndex(0)
    setEstimatedTimeRemaining('')
    
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
      await uploadSalesFileClientSide(file, accessToken, salesCallType)
    
    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.message === 'Operation cancelled') {
        console.log('🚫 Upload cancelled by user')
        setSalesUploadStatus('Upload cancelado')
        setSalesIsUploading(false)
        setSalesUploadProgress(0)
        setSalesIsAnalyzing(false)
        
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
      setSalesIsAnalyzing(false)
      
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


  const getCurrentProgressPhrase = (): string => {
    return progressPhrases[currentPhraseIndex] || progressPhrases[0]
  }

  // Calculate ETA based on progress and elapsed time
  const calculateETA = (progress: number, startTime: number): string => {
    if (progress <= 0 || !startTime) return '8 minutos'
    
    const elapsed = Date.now() - startTime
    const elapsedMinutes = elapsed / 60000 // elapsed time in minutes
    
    // If we're in the first 20% of progress, use a more conservative estimate
    if (progress < 20) {
      const estimatedTotal = 8 // 8 minutes total estimate
      const remaining = Math.max(1, estimatedTotal - elapsedMinutes)
      return `${Math.round(remaining)} minutos`
    }
    
    // For progress > 20%, calculate based on actual rate
    const rate = progress / elapsedMinutes // progress per minute
    const remaining = (100 - progress) / rate
    
    if (remaining < 0.5) return 'Quase pronto...'
    if (remaining < 1) return 'Menos de 1 minuto'
    if (remaining < 2) return '1-2 minutos'
    
    const minutes = Math.round(remaining)
    return `${minutes} minutos`
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
    setSalesIsAnalyzing(false)
    setUploadError(null)
    setFilePreview(null)
    setUploadStartTime(null)
    setCurrentPhraseIndex(0)
    setEstimatedTimeRemaining('')
    
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

  const uploadSalesFileClientSide = async (file: File, accessToken: string, callType: string) => {
    // Create new AbortController for this upload operation
    const abortController = new AbortController()
    salesAbortControllerRef.current = abortController
    
    try {
      // Check if we should convert video to audio
      let fileToUpload = file
      let isConverted = false
      
      if (shouldConvertVideo(file)) {
        // For very large files (>500MB), use a more aggressive conversion approach
        if (file.size > 500 * 1024 * 1024) {
          console.log('📁 Large file detected - using optimized conversion approach')
          setSalesUploadStatus('A converter ficheiro grande (pode demorar alguns minutos)...')
          setSalesUploadProgress(30)
          
          try {
            // Use a more aggressive timeout for large files
            const conversionTimeout = 600000 // 10 minutes for very large files
            console.log(`⏱️ Extended timeout set to ${conversionTimeout / 1000}s for ${(file.size / (1024 * 1024)).toFixed(1)}MB file`)
            
            const conversionPromise = convertVideoToAudio(file)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Video conversion timeout')), conversionTimeout)
            )
            
            fileToUpload = await Promise.race([conversionPromise, timeoutPromise]) as File
            isConverted = true
            
            console.log('✅ Large file converted to audio:', {
              originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
              convertedSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB`,
              reduction: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`
            })
            
            setSalesUploadProgress(15)
          } catch (error) {
            if (abortController.signal.aborted) {
              throw new Error('Operation cancelled')
            }
            console.error('❌ Large file conversion failed:', error)
            
            // For large files, if conversion fails, we need to inform the user
            const isTimeoutError = error instanceof Error && error.message.includes('timeout')
            const errorMessage = isTimeoutError 
              ? `Conversão de ficheiro grande demorou muito tempo (${(file.size / (1024 * 1024)).toFixed(1)}MB). Tenta com um ficheiro menor ou contacta o suporte.`
              : `Falha ao converter ficheiro grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Tenta com um ficheiro menor.`
            
            toast({
              title: "Erro na conversão de ficheiro grande",
              description: errorMessage,
              variant: "destructive",
            })
            
            throw error // Don't continue with original file for large files
          }
        } else {
          try {
            setSalesUploadStatus('A converter vídeo para áudio...')
            setSalesUploadProgress(30)
            
            // Check if operation was cancelled
            if (abortController.signal.aborted) {
              throw new Error('Operation cancelled')
            }
            
            console.log('🎵 Converting video to audio for better processing...')
            
            // Add timeout for large files
            const conversionTimeout = file.size > 200 * 1024 * 1024 ? 300000 : 60000 // 5min for large files, 1min for smaller
            console.log(`⏱️ Conversion timeout set to ${conversionTimeout / 1000}s for ${(file.size / (1024 * 1024)).toFixed(1)}MB file`)
            
            const conversionPromise = convertVideoToAudio(file)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Video conversion timeout')), conversionTimeout)
            )
            
            fileToUpload = await Promise.race([conversionPromise, timeoutPromise]) as File
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
          
          // Check if it's a timeout error
          const isTimeoutError = error instanceof Error && error.message.includes('timeout')
          const errorMessage = isTimeoutError 
            ? `Conversão de vídeo demorou muito tempo (${(file.size / (1024 * 1024)).toFixed(1)}MB). Tentando upload original...`
            : "Falha ao converter vídeo para áudio. Tentando upload original..."
          
          toast({
            title: isTimeoutError ? "Conversão muito lenta" : "Erro na conversão",
            description: errorMessage,
            variant: "destructive",
          })
          // Continue with original file if conversion fails
          fileToUpload = file
          }
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
      setSalesUploadProgress(15)

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled')
      }

      // Import the upload function from @vercel/blob/client
      const { upload } = await import('@vercel/blob/client')

      setSalesUploadProgress(25) // Upload starting

      const blob = await upload(fileToUpload.name, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/sales-analyst/blob-upload',
        clientPayload: JSON.stringify({
          userId: user!.id,
          accessToken: accessToken,
          originalFileName: file.name,
          isConverted: isConverted,
          callType: callType
        })
      })

      console.log('✅ File uploaded to Vercel Blob:', blob.url)

      // Step 2: Create a temporary sales call ID for now
      // We'll use the blob URL as a reference and create the record later if needed
      setSalesUploadStatus('A processar ficheiro e preparar transcrição...')
      setSalesUploadProgress(35)

      // Generate a temporary ID based on the blob URL
      const tempSalesCallId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Step 3: Start transcription and analysis
      setSalesUploadStatus('A iniciar transcrição com IA...')
      setSalesUploadProgress(40)

      // Simulate gradual progress during transcription
      // Declare interval ID outside try block so it's accessible in error handling
      let transcriptionProgressInterval: NodeJS.Timeout | null = null
      
      try {
        transcriptionProgressInterval = setInterval(() => {
          setSalesUploadProgress(prev => {
            if (prev < 65) return prev + 2 // Slowly increment during transcription
            return prev
          })
        }, 2000) // Update every 2 seconds

        // Check if operation was cancelled
        if (abortController.signal.aborted) {
          if (transcriptionProgressInterval) clearInterval(transcriptionProgressInterval)
          throw new Error('Operation cancelled')
        }
        // Start analysis
        setSalesIsAnalyzing(true)
        
        setSalesUploadStatus('A transcrever conteúdo de áudio...')
        setSalesUploadProgress(45)
        
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
            salesCallId: tempSalesCallId,
            callType: callType
          }),
          signal: abortController.signal // Add abort signal to the fetch request
        })

        // Clear the transcription progress interval
        if (transcriptionProgressInterval) clearInterval(transcriptionProgressInterval)
        
        // Transcription completed, now analyzing
        setSalesUploadStatus('A preparar análise detalhada...')
        setSalesUploadProgress(70)

        if (!transcriptionResponse.ok) {
          let errorMessage = 'Transcription failed'
          try {
            const errorData = await transcriptionResponse.json()
            errorMessage = errorData.error || errorMessage
          } catch (jsonError) {
            // If response is not JSON, try to get text
            try {
              const errorText = await transcriptionResponse.text()
              console.error('❌ Non-JSON error response:', errorText)
              errorMessage = `Server error: ${transcriptionResponse.status} - ${errorText.substring(0, 100)}`
            } catch (textError) {
              errorMessage = `Server error: ${transcriptionResponse.status} - ${transcriptionResponse.statusText}`
            }
          }
          throw new Error(errorMessage)
        }

        setSalesUploadStatus('A analisar pontos fortes...')
        setSalesUploadProgress(78)
        
        let result
        try {
          result = await transcriptionResponse.json()
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError)
          const responseText = await transcriptionResponse.text()
          console.error('❌ Response text:', responseText.substring(0, 200))
          throw new Error('Invalid response format from server')
        }

        setSalesUploadStatus('A analisar pontos de melhoria...')
        setSalesUploadProgress(85)

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

        setSalesUploadStatus('A gerar recomendações finais...')
        setSalesUploadProgress(93)

        // Analysis completed
        setSalesIsAnalyzing(false)
        
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
        // Clear the interval in case of error
        if (transcriptionProgressInterval) {
          clearInterval(transcriptionProgressInterval)
        }
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
      
      // Check if it's a 503 error from Vercel Blob
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('503')) {
        console.warn('⚠️ Vercel Blob temporarily unavailable, but analysis will continue...')
        // Don't throw error for 503 - let the system continue with fallback
        console.log('🔄 Continuing with analysis despite Vercel Blob 503 error...')
        // Continue with the analysis process - don't return early
        // The analysis should continue even if Vercel Blob fails
        // Remove the return statement to allow the function to continue
      } else {
        // Only throw error for non-503 errors
        console.error('❌ Vercel Blob upload error:', error)
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: '❌ Vercel Blob upload failed:',
            data: { error: errorMessage }
          })
        })
        throw error
      }
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
            analysis: analysis.analysis || {},
            transcription: analysis.transcription || ''
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

  // Refresh analyses with loading state
  const refreshAnalyses = async () => {
    setIsRefreshing(true)
    try {
      await fetchAnalyses()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle analyses tab click - fetch data if not already loaded
  const handleAnalysesTabClick = () => {
    setActiveTab('analyses')
    // Only fetch if we don't have analyses loaded yet
    if (analyses.length === 0 && user && selectedAgent === 'sales-analyst' && !loadingAnalyses) {
      fetchAnalyses()
    }
  }

  // Auth guard logic
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Redirect first-time users to complete profile
  useEffect(() => {
    console.log('🔄 Dashboard redirect check:', {
      initialized,
      hasUser: !!user,
      isFirstTimeLoading,
      isFirstTime,
      willRedirect: initialized && user && !isFirstTimeLoading && isFirstTime
    })
    
    if (initialized && user && !isFirstTimeLoading && isFirstTime) {
      console.log('🆕 First-time user detected, redirecting to complete profile')
      router.push('/complete-profile')
    }
  }, [user, initialized, isFirstTime, isFirstTimeLoading, router])

  // Show loading screen while checking if user is first-time
  if (initialized && user && isFirstTimeLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">A carregar...</p>
        </div>
      </div>
    )
  }

  // Load subscription data when user is available
  useEffect(() => {
    if (user) {
      loadSubscription()
      loadUsageData()
    }
  }, [user])

  // Check agent access when subscription or selected agent changes
  useEffect(() => {
    if (subscription && selectedAgent) {
      const userPlan = subscription.subscription_plan
      const hasAccess = hasAgentAccess(userPlan, selectedAgent)
      
      if (!hasAccess) {
        // Redirect to the first available agent or show upgrade prompt
        const availableAgents = getAvailableAgents(userPlan)
        if (availableAgents.length > 0) {
          setSelectedAgent(availableAgents[0])
          toast({
            title: "Acesso Restrito",
            description: `O seu plano atual não inclui acesso ao ${selectedAgent === 'scale-expert' ? 'Scale Expert' : 'Sales Analyst'}. Redirecionado para o agente disponível.`,
            variant: "destructive"
          })
        } else {
          // No agents available, show upgrade prompt
          setShowSubscriptionModal(true)
          toast({
            title: "Upgrade Necessário",
            description: "O seu plano atual não inclui acesso a nenhum agente. Considere fazer upgrade para aceder às funcionalidades.",
            variant: "destructive"
          })
        }
      }
    }
  }, [subscription, selectedAgent, toast])

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
        setActiveTab('overview')
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

  // Fetch analyses only when user explicitly navigates to analyses tab
  useEffect(() => {
    if (user && selectedAgent === 'sales-analyst' && activeTab === 'analyses' && analyses.length === 0) {
      fetchAnalyses()
    }
  }, [user, selectedAgent, activeTab, analyses.length])

  // Reset selections when analyses change
  useEffect(() => {
    setSelectedAnalyses(new Set())
    setSelectAll(false)
  }, [analyses])

  // Load notes when analysis is selected
  const loadNotes = async (analysisId: string) => {
    if (!user) return
    
    setLoadingNotes(true)
    try {
      const response = await fetch(`/api/sales-analyst/notes?analysisId=${analysisId}&userId=${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        setNotes(result.notes || '')
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }

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
      const newConversation = await chatService.createConversation('Novo Chat')
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

    // Check usage limits for free users
    const userPlan = subscription?.subscription_plan
    if (selectedAgent === 'scale-expert' && hasReachedUsageLimit(userPlan, 'scale-expert', scaleExpertUsage)) {
      toast({
        title: "Limite de Uso Atingido",
        description: "Atingiu o limite de 5 mensagens para o Scale Expert. Faça upgrade para enviar mais mensagens.",
        variant: "destructive"
      })
      setShowSubscriptionModal(true)
      return
    }

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
    
        // Update usage tracking for free users
        if (selectedAgent === 'scale-expert' && !subscription?.subscription_plan) {
          console.log('📊 Updating Scale Expert usage counter:', scaleExpertUsage, '->', scaleExpertUsage + 1)
          setScaleExpertUsage(prev => prev + 1)
          // Reload usage data to ensure accuracy
          loadUsageData()
        }
    
    // Create database conversation if none exists
    if (!currentConversationId && chatService) {
      try {
        console.log('🆕 Creating new database conversation...')
        const newConversation = await chatService.createConversation('Novo Chat')
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
        // Wait a bit for upload to complete (reduced delay)
        await new Promise(resolve => setTimeout(resolve, 500))
        
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
      
      // Use chunk-based streaming that works even when tab is not active
      try {
        const characters = fullResponse.split('')
        let currentText = ''
        const chunkSize = 3 // Process 3 characters at a time for faster display
        
        for (let i = 0; i < characters.length; i += chunkSize) {
          // Check if the request was aborted
          if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
            console.log('Streaming stopped by user')
            return
          }
          
          // Add a chunk of characters
          const chunk = characters.slice(i, i + chunkSize).join('')
          currentText += chunk
          
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: currentText }
              : msg
          ))
          
          // Use a more reliable delay that works in background tabs
          await new Promise(resolve => {
            const start = performance.now()
            const delay = 1.5 // 1.5ms delay per chunk (3 characters)
            
            const checkTime = () => {
              if (performance.now() - start >= delay) {
                resolve(undefined)
              } else {
                // Use setImmediate if available, otherwise setTimeout
                if (typeof setImmediate !== 'undefined') {
                  setImmediate(checkTime)
                } else {
                  setTimeout(checkTime, 0)
                }
              }
            }
            checkTime()
          })
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

    // Check usage limits for free users
    const userPlan = subscription?.subscription_plan
    if (selectedAgent === 'sales-analyst' && hasReachedUsageLimit(userPlan, 'sales-analyst', salesAnalystUsage)) {
      toast({
        title: "Limite de Uso Atingido",
        description: "Atingiu o limite de 2 uploads para o Sales Analyst. Faça upgrade para fazer mais uploads.",
        variant: "destructive"
      })
      setShowSubscriptionModal(true)
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
        let errorMessage = 'Transcription failed'
        try {
          const errorData = await transcriptionResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await transcriptionResponse.text()
            console.error('❌ Non-JSON error response:', errorText)
            errorMessage = `Server error: ${transcriptionResponse.status} - ${errorText.substring(0, 100)}`
          } catch (textError) {
            errorMessage = `Server error: ${transcriptionResponse.status} - ${transcriptionResponse.statusText}`
          }
        }
        throw new Error(errorMessage)
      }

      let result
      try {
        result = await transcriptionResponse.json()
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError)
        const responseText = await transcriptionResponse.text()
        console.error('❌ Response text:', responseText.substring(0, 200))
        throw new Error('Invalid response format from server')
      }

      // Determine file type based on response and file characteristics
      let fileType: 'sales_call' | 'document' | 'data' = 'sales_call'
      
      if (result.documentType) {
        // Document file with extracted text
        fileType = 'document'
      } else if (file.type === 'application/octet-stream') {
        // Binary data file
        fileType = 'data'
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        // Audio/video file for sales call
        fileType = 'sales_call'
      }

      // Store the uploaded file information for use in chat
      setUploadedFileUrl(blob.url)
      setUploadedFileType(fileType)
      setSalesCallId(salesCallId)
      
        // Update usage tracking for free users
        if (selectedAgent === 'sales-analyst' && !subscription?.subscription_plan) {
          setSalesAnalystUsage(prev => prev + 1)
          // Reload usage data to ensure accuracy
          loadUsageData()
        }
      
      if (result.transcription) {
        // Document/audio transcription completed
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

  // Show loading screen when redirecting to payment success
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">A redirecionar para a página de confirmação...</p>
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
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/background-4.jpg"
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
                  <Link href="/" className="block">
                    <Image
                      src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
                      alt="ScaleLabs"
                      width={200}
                      height={60}
                      className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </Link>
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
                  <h3 className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Chats Antigos</h3>
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

                  {/* Credits - Only show for free users */}
                    {!subscription?.subscription_plan && (
                      <div className="mb-4 space-y-4">
                        {/* Scale Expert Usage */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold text-sm">Créditos Scale Expert</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-white/60 text-sm">
                                {5 - scaleExpertUsage} restantes
                              </span>
                              <ChevronRight className="w-3 h-3 text-white/60" />
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-purple-600 to-violet-600"
                              style={{ 
                                width: `${(scaleExpertUsage / 5) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-xs text-purple-400">
                              Mensagens Restantes do Scale Expert
                            </span>
                          </div>
                        </div>

                        {/* Sales Analyst Usage */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold text-sm">Créditos Sales Analyst</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-white/60 text-sm">
                                {2 - salesAnalystUsage} restantes
                              </span>
                              <ChevronRight className="w-3 h-3 text-white/60" />
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600"
                              style={{ 
                                width: `${(salesAnalystUsage / 2) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-blue-400">
                              Análises Restantes do Sales Analyst
                            </span>
                          </div>
                        </div>
                      </div>
                    )}


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
                            className={`w-full flex items-center space-x-3 px-3 py-2 transition-colors ${
                              hasAgentAccess(subscription?.subscription_plan, 'scale-expert') 
                                ? 'hover:bg-white/10 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              setShowAgentDropdown(false)
                              if (hasAgentAccess(subscription?.subscription_plan, 'scale-expert')) {
                                setSelectedAgent('scale-expert')
                              } else {
                                setShowSubscriptionModal(true)
                                toast({
                                  title: "Upgrade Necessário",
                                  description: "O Scale Expert está disponível no Plano Base. Faça upgrade para aceder.",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-600 to-violet-600 flex items-center justify-center">
                              <TrendingUp className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-white text-sm">Scale Expert</span>
                            {!hasAgentAccess(subscription?.subscription_plan, 'scale-expert') && (
                              <Crown className="w-3 h-3 text-yellow-400 ml-auto" />
                            )}
                          </button>
                          <button 
                            className={`w-full flex items-center space-x-3 px-3 py-2 transition-colors ${
                              hasAgentAccess(subscription?.subscription_plan, 'sales-analyst') 
                                ? 'hover:bg-white/10 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              setShowAgentDropdown(false)
                              if (hasAgentAccess(subscription?.subscription_plan, 'sales-analyst')) {
                                setSelectedAgent('sales-analyst')
                                setActiveTab('overview')
                              } else {
                                setShowSubscriptionModal(true)
                                toast({
                                  title: "Upgrade Necessário",
                                  description: "O Sales Analyst está disponível no Plano Pro. Faça upgrade para aceder.",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                              <BarChart3 className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-white text-sm">Sales Analyst</span>
                            {!hasAgentAccess(subscription?.subscription_plan, 'sales-analyst') && (
                              <Crown className="w-3 h-3 text-yellow-400 ml-auto" />
                            )}
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
              {selectedAgent === 'scale-expert' && hasAgentAccess(subscription?.subscription_plan, 'scale-expert') && (
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
                                        ul: ({children}) => <ul className="mb-4 space-y-3 text-white">{children}</ul>,
                                        ol: ({children}) => <ol className="mb-4 space-y-3 text-white">{children}</ol>,
                                        li: ({children}) => <li className="text-white leading-relaxed mb-3 flex items-start"><span className="mr-2 text-white">•</span><span className="flex-1">{children}</span></li>,
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

              {selectedAgent === 'sales-analyst' && hasAgentAccess(subscription?.subscription_plan, 'sales-analyst') && (
                <div className="h-full flex flex-col">
                  {/* Sales Analyst Content */}
                  <div className="flex-1 overflow-y-auto p-6 w-full">
                    <div className="w-full mx-auto">
                      {/* Tabs and Date Filter */}
                      <div className="mb-6 flex items-center justify-between">
                        <div className="bg-white/10 rounded-lg p-1 inline-flex">
                          <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'overview' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <BarChart3 className="w-4 h-4 inline mr-2" />
                            Visão Geral
                          </button>
                          <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'upload' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Upload className="w-4 h-4 inline mr-2" />
                            Carregar Ficheiro
                          </button>
                          <button
                            onClick={handleAnalysesTabClick}
                            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'analyses' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <FileText className="w-4 h-4 inline mr-2" />
                            Ver Análises
                          </button>
                        </div>
                        
                        {/* Date Filter - Only show on overview tab */}
                        {activeTab === 'overview' && (
                          <div className="bg-white/10 rounded-lg p-1 flex items-center space-x-0">
                            <button
                              onClick={() => setDateFilter('1D')}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                dateFilter === '1D'
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              1D
                            </button>
                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                            <button
                              onClick={() => setDateFilter('7D')}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                dateFilter === '7D'
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              7D
                            </button>
                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                            <button
                              onClick={() => setDateFilter('14D')}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                dateFilter === '14D'
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              14D
                            </button>
                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                            <button
                              onClick={() => setDateFilter('30D')}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                dateFilter === '30D'
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              30D
                            </button>
                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                    dateFilter === 'custom'
                                      ? 'bg-purple-600 text-white shadow-lg'
                                      : 'text-white/70 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  Definir Data
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="end">
                                <div className="p-4">
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-white text-sm font-medium">Selecionar Período</Label>
                                      <div className="mt-2 space-y-2">
                                        <div>
                                          <Label className="text-white/70 text-xs">Data de Início</Label>
                                          <CalendarComponent
                                            mode="single"
                                            selected={customDateRange.start || undefined}
                                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, start: date || null }))}
                                            className="rounded-md border-slate-600 bg-slate-800"
                                            classNames={{
                                              day: "bg-transparent text-white hover:bg-purple-600 hover:text-white",
                                              day_selected: "bg-purple-600 text-white",
                                              day_today: "bg-purple-600/20 text-white",
                                              head_cell: "text-white/70",
                                              cell: "text-white",
                                              button: "text-white hover:bg-purple-600/20",
                                              nav_button: "text-white hover:bg-purple-600/20",
                                              caption: "text-white"
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-white/70 text-xs">Data de Fim</Label>
                                          <CalendarComponent
                                            mode="single"
                                            selected={customDateRange.end || undefined}
                                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, end: date || null }))}
                                            className="rounded-md border-slate-600 bg-slate-800"
                                            classNames={{
                                              day: "bg-transparent text-white hover:bg-purple-600 hover:text-white",
                                              day_selected: "bg-purple-600 text-white",
                                              day_today: "bg-purple-600/20 text-white",
                                              head_cell: "text-white/70",
                                              cell: "text-white",
                                              button: "text-white hover:bg-purple-600/20",
                                              nav_button: "text-white hover:bg-purple-600/20",
                                              caption: "text-white"
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (customDateRange.start && customDateRange.end) {
                                            setDateFilter('custom')
                                          }
                                        }}
                                        disabled={!customDateRange.start || !customDateRange.end}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                      >
                                        Aplicar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setCustomDateRange({ start: null, end: null })
                                          setDateFilter('1D')
                                        }}
                                        className="bg-white text-black border-white hover:bg-gray-100"
                                      >
                                        Limpar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>


                      {/* Overview Tab */}
                      {activeTab === 'overview' && (
                        <div className="space-y-8">
                          {/* Statistics Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                              <CardContent className="p-6">
                                <div>
                                  <p className="text-white/70 text-sm font-medium">Total de Análises</p>
                                  <p className="text-3xl font-bold text-white mt-2">{getFilteredAnalyses().length}</p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                              <CardContent className="p-6">
                                <div>
                                  <p className="text-white/70 text-sm font-medium">Pontuação Média</p>
                                  <p className="text-3xl font-bold text-white mt-2">
                                    {(() => {
                                      const filtered = getFilteredAnalyses()
                                      return filtered.length > 0 
                                        ? Math.round(filtered.reduce((sum: number, analysis: any) => sum + (analysis.score || 0), 0) / filtered.length)
                                        : 0
                                    })()}/40
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                              <CardContent className="p-6">
                                <div>
                                  <p className="text-white/70 text-sm font-medium">Total de Horas Analisadas</p>
                                  <p className="text-3xl font-bold text-white mt-2">
                                    {(() => {
                                      const filtered = getFilteredAnalyses()
                                      // Calculate total hours from analysis metadata or estimate from call duration
                                      const totalMinutes = filtered.reduce((total: number, analysis: any) => {
                                        // Try to get duration from analysis metadata
                                        const metadata = analysis.analysis?.metadata || analysis.analysis_metadata || {}
                                        const duration = metadata.duration || metadata.call_duration || metadata.audio_duration
                                        
                                        if (duration) {
                                          // If duration is in seconds, convert to minutes
                                          return total + (typeof duration === 'number' ? duration / 60 : 0)
                                        }
                                        
                                        // If no duration available, estimate based on transcription length
                                        const transcription = analysis.analysis?.transcription || analysis.transcription || ''
                                        if (transcription) {
                                          // Rough estimate: 150 words per minute for speech
                                          const wordCount = transcription.split(' ').length
                                          return total + (wordCount / 150)
                                        }
                                        
                                        // Default estimate: 30 minutes per call
                                        return total + 30
                                      }, 0)
                                      
                                      const totalHours = Math.round(totalMinutes / 60 * 10) / 10 // Round to 1 decimal place
                                      return `${totalHours}h`
                                    })()}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Average Score Chart */}
                          {(() => {
                            const chartData = getChartData()
                            return chartData.length > 0 && (
                              <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                                <CardHeader>
                                  <CardTitle className="text-white flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Evolução da Pontuação Média
                                  </CardTitle>
                                  <CardDescription className="text-white/70">
                                    Pontuação média das suas análises ao longo do tempo
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis 
                                          dataKey="date" 
                                          stroke="#9CA3AF"
                                          fontSize={12}
                                          tickLine={false}
                                          axisLine={false}
                                        />
                                        <YAxis 
                                          stroke="#9CA3AF"
                                          fontSize={12}
                                          tickLine={false}
                                          axisLine={false}
                                          domain={[0, 40]}
                                          tickFormatter={(value) => `${value}/40`}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#F9FAFB'
                                          }}
                                          labelStyle={{ color: '#F9FAFB' }}
                                          formatter={(value: any, name: string) => [
                                            `${value}/40`,
                                            'Pontuação Média'
                                          ]}
                                          labelFormatter={(label) => `Data: ${label}`}
                                        />
                                        <Line
                                          type="monotone"
                                          dataKey="averageScore"
                                          stroke="#8B5CF6"
                                          strokeWidth={3}
                                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                                          activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: '#1F2937' }}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })()}

                          {/* Recent Analyses */}
                          <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                            <CardHeader>
                              <CardTitle className="text-white flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                Análises Recentes
                              </CardTitle>
                              <CardDescription className="text-white/70">
                                As suas últimas análises de chamadas de vendas
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {(() => {
                                const filtered = getFilteredAnalyses()
                                return filtered.length > 0 ? (
                                  <div className="space-y-4">
                                    {filtered.slice(0, 5).map((analysis: any, index: number) => (
                                    <div key={analysis.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                      <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                                          <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                          <h4 className="text-white font-medium">{analysis.title}</h4>
                                          <p className="text-white/60 text-sm">
                                            {new Date(analysis.uploadDate).toLocaleDateString('pt-PT')} • 
                                            {analysis.analysis?.callType || analysis.analysis?.call_type || 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                          <p className="text-white font-bold text-lg">{analysis.score || 0}/40</p>
                                          <p className="text-white/60 text-xs">Pontuação</p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedAnalysis(analysis)
                                            setShowAnalysisModal(true)
                                          }}
                                          className="border-white/20 text-white hover:bg-white/10 bg-white/5"
                                        >
                                          Ver Detalhes
                                        </Button>
                                      </div>
                                    </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
                                    <h3 className="text-white/70 text-lg font-medium mb-2">Nenhuma análise encontrada</h3>
                                    <p className="text-white/50 mb-4">
                                      {analyses.length === 0 
                                        ? "Carregue o seu primeiro ficheiro para começar a analisar as suas chamadas de vendas."
                                        : "Nenhuma análise encontrada para o período selecionado."
                                      }
                                    </p>
                                    {analyses.length === 0 && (
                                      <Button
                                        onClick={() => setActiveTab('upload')}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Carregar Ficheiro
                                      </Button>
                                    )}
                                  </div>
                                )
                              })()}
                            </CardContent>
                          </Card>

                          {/* Performance Insights */}
                          {(() => {
                            const filtered = getFilteredAnalyses()
                            return filtered.length > 0 && (
                            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                              <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                  <Brain className="w-5 h-5 mr-2" />
                                  Insights de Performance
                                </CardTitle>
                                <CardDescription className="text-white/70">
                                  Análise das suas tendências de performance
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="text-white font-medium">Áreas de Força</h4>
                                    <div className="space-y-2">
                                      {(() => {
                                        const filtered = getFilteredAnalyses()
                                        return filtered.length > 0 && (
                                          <>
                                            <div className="flex justify-between items-center">
                                              <span className="text-white/70 text-sm">Clareza e Fluência</span>
                                              <span className="text-white font-medium">
                                                {Math.round(filtered.reduce((sum: number, analysis: any) => 
                                                  sum + (analysis.analysis?.scoring?.clarityAndFluency?.score || analysis.analysis?.analysis_fields?.clarezaFluenciaFala || 0), 0) / filtered.length
                                                )}/5
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-white/70 text-sm">Tom e Controlo</span>
                                              <span className="text-white font-medium">
                                                {Math.round(filtered.reduce((sum: number, analysis: any) => 
                                                  sum + (analysis.analysis?.scoring?.toneAndControl?.score || analysis.analysis?.analysis_fields?.tomControlo || 0), 0) / filtered.length
                                                )}/5
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-white/70 text-sm">Envolvimento</span>
                                              <span className="text-white font-medium">
                                                {Math.round(filtered.reduce((sum: number, analysis: any) => 
                                                  sum + (analysis.analysis?.scoring?.engagement?.score || analysis.analysis?.analysis_fields?.envolvimentoConversacional || 0), 0) / filtered.length
                                                )}/5
                                              </span>
                                            </div>
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-white font-medium">Áreas de Melhoria</h4>
                                    <div className="space-y-2">
                                      {(() => {
                                        const filtered = getFilteredAnalyses()
                                        return filtered.length > 0 && (
                                          <>
                                            <div className="flex justify-between items-center">
                                              <span className="text-white/70 text-sm">Descoberta de Necessidades</span>
                                              <span className="text-white font-medium">
                                                {Math.round(filtered.reduce((sum: number, analysis: any) => 
                                                  sum + (analysis.analysis?.scoring?.needsDiscovery?.score || analysis.analysis?.analysis_fields?.efetividadeDescobertaNecessidades || 0), 0) / filtered.length
                                                )}/5
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-white/70 text-sm">Lidar com Objeções</span>
                                              <span className="text-white font-medium">
                                                {Math.round(filtered.reduce((sum: number, analysis: any) => 
                                                  sum + (analysis.analysis?.scoring?.objectionHandling?.score || analysis.analysis?.analysis_fields?.habilidadesLidarObjeccoes || 0), 0) / filtered.length
                                                )}/5
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-white/70 text-sm">Fechamento</span>
                                              <span className="text-white font-medium">
                                                {Math.round(filtered.reduce((sum: number, analysis: any) => 
                                                  sum + (analysis.analysis?.scoring?.closing?.score || analysis.analysis?.analysis_fields?.fechamentoProximosPassos || 0), 0) / filtered.length
                                                )}/5
                                              </span>
                                            </div>
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            )
                          })()}
                        </div>
                      )}

                      {/* Upload Tab */}
                      {activeTab === 'upload' && (
                        <div className="space-y-8">

                          {/* Upload Call Recording Section */}
                          <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                            <CardHeader>
                              <CardTitle className="text-white text-xl font-semibold">
                                Carregar Gravação de Chamada
                              </CardTitle>
                              <CardDescription className="text-white/70">
                                Carregue um ficheiro de áudio para gerar automaticamente uma transcrição
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                            {/* File Upload */}
                            <div 
                              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
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
                                accept=".mp4,.mp3,.mov,.avi,.wmv"
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
                                  <div className="flex items-center justify-center mb-6">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                                      isDragOver 
                                        ? 'bg-purple-500/30 scale-110' 
                                        : 'bg-purple-500/20'
                                    }`}>
                                      <Upload className={`w-10 h-10 transition-colors duration-300 ${
                                        isDragOver ? 'text-purple-300' : 'text-purple-400'
                                      }`} />
                                    </div>
                                  </div>
                                  <p className="text-lg font-medium text-white mb-4">
                                    {isFileSelectionInProgress 
                                      ? 'A processar seleção de ficheiro...' 
                                      : isDragOver 
                                        ? 'Largue o ficheiro aqui' 
                                        : 'Clique aqui para carregar o seu ficheiro ou arraste'
                                    }
                                  </p>
                                  <p className="text-white/50 text-sm mb-4">
                                    Formatos suportados: MP4, MP3, MOV, AVI, WMV
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
                                  <p className="text-white/60 mb-2">
                                    Tamanho: {(salesUploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                                    {salesUploadedFile.size > 50 * 1024 * 1024 && (
                                      <span className="text-yellow-400 ml-2">(Processamento pode demorar mais tempo)</span>
                                    )}
                                  </p>
                                </>
                              )}
                              
                              {/* Call Type Selection */}
                              <div className="mb-6">
                                <Label htmlFor="call-type" className="block text-sm font-medium text-white/80 mb-2">
                                  Tipo de Chamada
                                </Label>
                                <Select value={salesCallType} onValueChange={setSalesCallType}>
                                  <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                                    <SelectValue placeholder="Selecione o tipo de chamada" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-900 border-white/20">
                                    <SelectItem value="Chamada Fria" className="text-white hover:bg-white/10">
                                      Chamada Fria
                                    </SelectItem>
                                    <SelectItem value="Chamada de Agendamento" className="text-white hover:bg-white/10">
                                      Chamada de Agendamento
                                    </SelectItem>
                                    <SelectItem value="Reunião de Descoberta" className="text-white hover:bg-white/10">
                                      Reunião de Descoberta
                                    </SelectItem>
                                    <SelectItem value="Reunião de Fecho" className="text-white hover:bg-white/10">
                                      Reunião de Fecho
                                    </SelectItem>
                                    <SelectItem value="Reunião de Esclarecimento de Dúvidas" className="text-white hover:bg-white/10">
                                      Reunião de Esclarecimento de Dúvidas
                                    </SelectItem>
                                    <SelectItem value="Reunião de One Call Close" className="text-white hover:bg-white/10">
                                      Reunião de One Call Close
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex justify-center space-x-2 mt-4">
                                {salesIsUploading ? (
                                  // Show only Cancel button during upload
                                  <Button 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation() // Prevent event bubbling to parent drag-and-drop area
                                      cancelSalesUpload()
                                    }}
                                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-purple-500/50"
                                  >
                                    Cancelar
                                  </Button>
                                ) : (
                                  // Show normal buttons when not uploading
                                  <>
                                    <Button 
                                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
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

                            {/* Enhanced Upload Progress */}
                            {(salesIsUploading || salesIsAnalyzing) && (
                              <div className="space-y-4 mt-6">
                                {/* Purple Spinner */}
                                <div className="flex justify-center">
                                  <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                                </div>

                                {/* Processing Text */}
                                <div className="text-center">
                                  <p className="text-white text-lg font-medium">A processar conteúdo de áudio...</p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="bg-purple-500 h-3 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${salesUploadProgress}%` }}
                                  ></div>
                                </div>

                                {/* Progress Details */}
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <div className="font-medium">
                                    {salesUploadProgress}%
                                  </div>
                                  {uploadStartTime && (
                                    <div className="font-medium">
                                      ETA: {estimatedTimeRemaining || '8 minutos'}
                                    </div>
                                  )}
                                </div>
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

                            {/* Knowledge Display Section */}
                            {salesAnalysisResult?.knowledgeExtraction && (
                              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-center space-x-2 mb-3">
                                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <h3 className="text-white font-semibold">Conhecimento Extraído</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/70 text-sm mb-1">Método de Extração</div>
                                    <div className="text-white font-medium">
                                      {salesAnalysisResult.knowledgeExtraction.method === 'python' ? '🐍 Python PyMuPDF' : 
                                       salesAnalysisResult.knowledgeExtraction.method === 'pdfjs' ? '📄 PDF.js' : 
                                       salesAnalysisResult.knowledgeExtraction.method || 'N/A'}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/70 text-sm mb-1">Tamanho do Conhecimento</div>
                                    <div className="text-white font-medium">
                                      {salesAnalysisResult.knowledgeExtraction.length || 0} caracteres
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/70 text-sm mb-1">Fonte</div>
                                    <div className="text-white font-medium">
                                      {salesAnalysisResult.knowledgeExtraction.source || 'N/A'}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/70 text-sm mb-1">Ficheiros Processados</div>
                                    <div className="text-white font-medium">
                                      {salesAnalysisResult.knowledgeExtraction.filesProcessed || 0} ficheiros
                                    </div>
                                  </div>
                                </div>
                                
                                {salesAnalysisResult.knowledgeExtraction.preview && (
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/70 text-sm mb-2">Pré-visualização do Conhecimento</div>
                                    <div className="text-white/80 text-sm max-h-32 overflow-y-auto bg-black/20 rounded p-2">
                                      {salesAnalysisResult.knowledgeExtraction.preview}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            </CardContent>
                          </Card>

                        </div>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={refreshAnalyses}
                                disabled={isRefreshing}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'A atualizar...' : 'Atualizar'}
                              </Button>
                              
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
                                              loadNotes(analysis.id)
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
              className="bg-gray-900 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto"
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
            
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-3 space-y-6">
            
                {/* Transcript Section */}
                {showTranscript && (
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Transcrição da Chamada
                    </h3>
                    <div className="max-h-96 overflow-y-auto">
                      {(() => {
                        const transcription = selectedAnalysis.transcription || selectedAnalysis.analysis?.transcription || ''
                        
                        if (!transcription) {
                          return <p className="text-white/60 text-sm">Transcrição não disponível</p>
                        }
                        
                        // Parse and format transcription with speaker segments
                        const parseTranscription = (text: string) => {
                          // Match patterns like "Speaker A (00:00) - text"
                          const speakerPattern = /Speaker ([AB]|\d+) \((\d{2}:\d{2})\) - /gi
                          const segments: Array<{ speaker: string, timestamp: string, text: string }> = []
                          
                          let lastIndex = 0
                          let match
                          
                          while ((match = speakerPattern.exec(text)) !== null) {
                            if (segments.length > 0) {
                              // Set the text of the previous segment
                              segments[segments.length - 1].text = text.substring(lastIndex, match.index).trim()
                            }
                            
                            segments.push({
                              speaker: match[1],
                              timestamp: match[2],
                              text: ''
                            })
                            
                            lastIndex = match.index + match[0].length
                          }
                          
                          // Set text for the last segment
                          if (segments.length > 0) {
                            segments[segments.length - 1].text = text.substring(lastIndex).trim()
                          }
                          
                          return segments
                        }
                        
                        const segments = parseTranscription(transcription)
                        
                        if (segments.length > 0) {
                          // Format with speaker diarization
                          return (
                            <div className="space-y-2">
                              {segments.map((segment, segmentIndex) => {
                                // Split each segment's text into sentences for better readability
                                const sentences = segment.text
                                  .split(/(?<=[.!?])\s+/)
                                  .filter(s => s.trim().length > 0)
                                
                                const isEven = segmentIndex % 2 === 0
                                
                                return (
                                  <div key={segmentIndex} className="p-3 rounded-lg border bg-gray-500/10 border-gray-500/20">
                                    <div className="flex items-start space-x-3">
                                      <div className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                                        isEven ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                                      }`}>
                                        Speaker {segment.speaker}
                                      </div>
                                      <div className="text-xs text-white/50 shrink-0">
                                        {segment.timestamp}
                                      </div>
                                      <div className="text-white/90 text-sm leading-relaxed flex-1">
                                        {sentences.map((sentence, sentenceIndex) => (
                                          <div key={sentenceIndex} className="mb-2 last:mb-0">
                                            {sentence}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        } else {
                          // No speaker diarization - split by sentences
                          const sentences = transcription
                            .split(/(?<=[.!?])\s+/)
                            .filter((s: string) => s.trim().length > 0)
                          
                          return (
                            <>
                              <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg mb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                                  <span className="text-yellow-300 text-sm font-medium">Sem Identificação de Orador</span>
                                </div>
                                <p className="text-yellow-200/80 text-xs">
                                  Esta transcrição não possui identificação de oradores. Para uma melhor análise, 
                                  certifique-se de que o speaker diarization está ativado.
                                </p>
                              </div>
                              <div className="space-y-2 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                                {sentences.map((sentence: string, index: number) => (
                                  <div key={index} className="text-white/80 text-sm leading-relaxed">
                                    {sentence}
                                  </div>
                                ))}
                              </div>
                            </>
                          )
                        }
                      })()}
                    </div>
                  </div>
                )}
              
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
                  <p className="text-white font-medium">{selectedAnalysis.analysis?.callInfo?.callType || selectedAnalysis.analysis?.callType || selectedAnalysis.analysis?.call_type || selectedAnalysis.call_type || 'N/A'}</p>
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
                  {selectedAnalysis.analysis?.insights?.strengths && selectedAnalysis.analysis.insights.strengths.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Pontos Fortes
                      </h3>
                      <div className="space-y-3">
                        {selectedAnalysis.analysis.insights.strengths.map((strength: any, index: number) => {
                          // Parse the strength description to extract title, analysis, and quote
                          const parseStrength = (text: string) => {
                            // Enhanced pattern for full phrases with MM:SS timestamps (without brackets)
                            const titleMatch = text.match(/^- \*\*(.*?)\*\*:\s*(.*?)\s*Timestamp:\s*([^\s]+)\s*"([^"]+)"/);
                            
                            if (titleMatch) {
                              return {
                                title: titleMatch[1],
                                analysis: titleMatch[2].trim(),
                                quote: titleMatch[4],
                                timestamp: titleMatch[3]
                              };
                            }
                            
                            // Enhanced fallback: try to extract components separately with better regex
                            const titleMatch2 = text.match(/^- \*\*(.*?)\*\*:/);
                            const quoteMatch = text.match(/"([^"]{10,})"/); // Require at least 10 characters for full phrases
                            const timestampMatch = text.match(/Timestamp:\s*([^\s]+)/);
                            
                            if (titleMatch2 && quoteMatch) {
                              // Extract analysis text between title and timestamp
                              const titleEnd = titleMatch2[0].length;
                              const timestampStart = text.indexOf('Timestamp:');
                              const analysis = timestampStart > titleEnd ? 
                                text.substring(titleEnd, timestampStart).trim() : '';
                              
                              return {
                                title: titleMatch2[1],
                                analysis: analysis,
                                quote: quoteMatch[1],
                                timestamp: timestampMatch ? timestampMatch[1] : null
                              };
                            }
                            
                            // If no structured format found, return the whole text
                            return {
                              title: 'Ponto Forte',
                              analysis: text,
                              quote: '',
                              timestamp: null
                            };
                          };
                          
                          const parsed = parseStrength(strength.description);
                          
                          return (
                            <div key={index} className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
                      <div className="text-white/90 text-sm leading-relaxed">
                                <div className="flex items-start space-x-2">
                                  <span className="text-white text-lg leading-none">•</span>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <em className="text-white font-medium">{parsed.title}</em>
                                      {parsed.timestamp && (
                                        <span className="text-white/60 text-sm">
                                          {parsed.timestamp}
                                        </span>
                                      )}
                                    </div>
                                    {parsed.analysis && (
                                      <div className="mt-1 text-white/90 text-sm">
                                        {parsed.analysis}
                                      </div>
                                    )}
                                    {parsed.quote && (
                                      <div className="mt-1 text-white/80 italic">
                                        "{parsed.quote}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Pontos de Melhoria */}
                  {selectedAnalysis.analysis?.insights?.improvements && selectedAnalysis.analysis.insights.improvements.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Pontos de Melhoria
                      </h3>
                      <div className="space-y-3">
                        {selectedAnalysis.analysis.insights.improvements.map((improvement: any, index: number) => {
                          // Parse the improvement description to extract title, analysis, and quote
                          const parseImprovement = (text: string) => {
                            // Enhanced pattern for full phrases with MM:SS timestamps (without brackets)
                            const titleMatch = text.match(/^- \*\*(.*?)\*\*:\s*(.*?)\s*Timestamp:\s*([^\s]+)\s*"([^"]+)"/);
                            
                            if (titleMatch) {
                              return {
                                title: titleMatch[1],
                                analysis: titleMatch[2].trim(),
                                quote: titleMatch[4],
                                timestamp: titleMatch[3]
                              };
                            }
                            
                            // Enhanced fallback: try to extract components separately with better regex
                            const titleMatch2 = text.match(/^- \*\*(.*?)\*\*:/);
                            const quoteMatch = text.match(/"([^"]{10,})"/); // Require at least 10 characters for full phrases
                            const timestampMatch = text.match(/Timestamp:\s*([^\s]+)/);
                            
                            if (titleMatch2 && quoteMatch) {
                              // Extract analysis text between title and timestamp
                              const titleEnd = titleMatch2[0].length;
                              const timestampStart = text.indexOf('Timestamp:');
                              const analysis = timestampStart > titleEnd ? 
                                text.substring(titleEnd, timestampStart).trim() : '';
                              
                              return {
                                title: titleMatch2[1],
                                analysis: analysis,
                                quote: quoteMatch[1],
                                timestamp: timestampMatch ? timestampMatch[1] : null
                              };
                            }
                            
                            // If no structured format found, return the whole text
                            return {
                              title: 'Ponto de Melhoria',
                              analysis: text,
                              quote: '',
                              timestamp: null
                            };
                          };
                          
                          const parsed = parseImprovement(improvement.description);
                          
                          // Debug logging to help understand parsing
                          console.log('🔍 Parsing improvement:', {
                            original: improvement.description,
                            parsed: parsed,
                            hasTimestamp: !!parsed.timestamp
                          });
                          
                          return (
                            <div key={index} className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
                      <div className="text-white/90 text-sm leading-relaxed">
                                <div className="flex items-start space-x-2">
                                  <span className="text-white text-lg leading-none">•</span>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <em className="text-white font-medium">{parsed.title}</em>
                                      {parsed.timestamp && (
                                        <span className="text-white/60 text-sm">
                                          {parsed.timestamp}
                                        </span>
                                      )}
                                    </div>
                                    {parsed.analysis && (
                                      <div className="mt-1 text-white/90 text-sm">
                                        {parsed.analysis}
                                      </div>
                                    )}
                                    {parsed.quote && (
                                      <div className="mt-1 text-white/80 italic">
                                        "{parsed.quote}"
                                      </div>
                                    )}
                                    {improvement.actionableSteps && improvement.actionableSteps.length > 0 && (
                                      <div className="mt-2">
                                        <h4 className="text-xs font-semibold text-white/80 mb-1">Passos Acionáveis:</h4>
                                        <ul className="text-xs text-white/70 space-y-1">
                                          {improvement.actionableSteps.map((step: string, stepIndex: number) => (
                                            <li key={stepIndex} className="flex items-start space-x-1">
                                              <span className="text-orange-400 mt-0.5">•</span>
                                              <span>{step}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Resumo da Chamada */}
                  {selectedAnalysis.analysis?.summary?.keyTakeaways && selectedAnalysis.analysis.summary.keyTakeaways.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Resumo da Chamada
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Momentos Fortes do Comercial */}
                        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                          <h4 className="text-base font-semibold text-white mb-3 flex items-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
                            Momentos Fortes do Comercial
                          </h4>
                          <div className="space-y-2">
                            {(() => {
                              // Get content from resumoDaCall field
                              const resumoContent = selectedAnalysis.analysis.resumoDaCall || ''
                              
                              // Extract strong points from the resumoDaCall content
                              const strongPointsMatch = resumoContent.match(/Momentos Fortes do Comercial:\s*([\s\S]*?)(?=\n\nMomentos Fracos do Comercial:|$)/)
                              
                              if (strongPointsMatch) {
                                const strongPointsText = strongPointsMatch[1].trim()
                                const moments = strongPointsText.split(/(?=Início:|Meio:|Fim:)/).filter((moment: string) => {
                                  const trimmed = moment.trim()
                                  return trimmed && 
                                    !trimmed.includes('Não foi identificado') && 
                                    !trimmed.includes('não foi identificado') &&
                                    trimmed.length > 10 // Ensure substantial content
                                })
                                
                                return moments.map((moment: string, index: number) => {
                                  const cleanMoment = moment.trim()
                                  
                                  return (
                                    <div key={`strong-${index}`} className="text-white/90 text-sm leading-relaxed">
                                      <div className="flex items-start space-x-2">
                                        <span className="text-white text-lg leading-none">•</span>
                                        <div className="flex-1">
                                          <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                              em: ({children}) => <em className="italic text-white/80">{children}</em>,
                                            }}
                                          >
                                            {cleanMoment}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              }
                              
                              // If no strong points found, show a message
                              return (
                                <div className="text-white/60 text-sm italic">
                                  Nenhum momento forte identificado nesta análise.
                                </div>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Momentos Fracos do Comercial */}
                        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                          <h4 className="text-base font-semibold text-white mb-3 flex items-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
                            Momentos Fracos do Comercial
                          </h4>
                          <div className="space-y-2">
                            {(() => {
                              // Get content from resumoDaCall field
                              const resumoContent = selectedAnalysis.analysis.resumoDaCall || ''
                              
                              // Extract weak points from the resumoDaCall content
                              const weakPointsMatch = resumoContent.match(/Momentos Fracos do Comercial:\s*([\s\S]*?)$/)
                              
                              if (weakPointsMatch) {
                                const weakPointsText = weakPointsMatch[1].trim()
                                const moments = weakPointsText.split(/(?=Início:|Meio:|Fim:)/).filter((moment: string) => {
                                  const trimmed = moment.trim()
                                  return trimmed && 
                                    !trimmed.includes('Não foi identificado') && 
                                    !trimmed.includes('não foi identificado') &&
                                    trimmed.length > 10 // Ensure substantial content
                                })
                                
                                return moments.map((moment: string, index: number) => {
                                  const cleanMoment = moment.trim()
                                  
                                  return (
                                    <div key={`weak-${index}`} className="text-white/90 text-sm leading-relaxed">
                                      <div className="flex items-start space-x-2">
                                        <span className="text-white text-lg leading-none">•</span>
                                        <div className="flex-1">
                                          <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                              em: ({children}) => <em className="italic text-white/80">{children}</em>,
                                            }}
                                          >
                                            {cleanMoment}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              }
                              
                              // If no weak points found, show a message
                              return (
                                <div className="text-white/60 text-sm italic">
                                  Nenhum momento fraco identificado nesta análise.
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Dicas Gerais */}
                  {selectedAnalysis.analysis?.summary?.generalTips && selectedAnalysis.analysis.summary.generalTips.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Dicas Gerais
                      </h3>
                      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                      <div className="text-white/90 text-sm leading-relaxed">
                          {selectedAnalysis.analysis.summary.generalTips.map((tip: string, index: number) => {
                            // Clean the tip content by removing introductory text and extracting actual tips
                            let cleanTip = tip
                              // Remove common introductory phrases
                              .replace(/^Após analisar a transcrição da chamada de vendas[^:]*:\s*/i, '')
                              .replace(/^Aqui estão algumas dicas[^:]*:\s*/i, '')
                              .replace(/^Com base na análise[^:]*:\s*/i, '')
                              .replace(/^Para melhorar o desempenho[^:]*:\s*/i, '')
                              .replace(/^Após analisar a transcrição[^:]*:\s*/i, '')
                              .replace(/^Com base na transcrição[^:]*:\s*/i, '')
                              .replace(/^Análise da transcrição[^:]*:\s*/i, '')
                              .replace(/^Dicas gerais[^:]*:\s*/i, '')
                              .replace(/^Recomendações[^:]*:\s*/i, '')
                              .trim()
                            
                            return (
                              <div key={index} className="mb-4 last:mb-0">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({children}) => <em className="italic text-white/80">{children}</em>,
                                    p: ({children}) => <p className="mb-2 text-white/90 leading-relaxed">{children}</p>,
                                    ul: ({children}) => <ul className="list-disc list-outside mb-2 space-y-1 text-white/90 pl-4">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal list-outside mb-2 space-y-1 text-white/90 pl-4">{children}</ol>,
                                    li: ({children}) => <li className="mb-1 text-white/90 leading-relaxed">{children}</li>,
                                  }}
                                >
                                  {cleanTip}
                        </ReactMarkdown>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Foco para Próximas Chamadas */}
                  {selectedAnalysis.analysis?.summary?.nextSteps && selectedAnalysis.analysis.summary.nextSteps.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Foco para Próximas Chamadas
                      </h3>
                      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                        <ul className="space-y-2 text-white/90 text-sm leading-relaxed">
                          {selectedAnalysis.analysis.summary.nextSteps.map((step: string, index: number) => {
                            // Remove the "-" from the beginning of each step
                            const cleanStep = step.replace(/^-\s*/, '').trim()
                            return (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-white text-lg leading-none mt-0.5">•</span>
                                <span>{cleanStep}</span>
                              </li>
                            )
                          })}
                        </ul>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.clarityAndFluency?.score ?? selectedAnalysis.analysis?.analysis_fields?.clarezaFluenciaFala ?? selectedAnalysis.analysis?.analysis?.clarezaFluenciaFala ?? selectedAnalysis.analysis?.clarezaFluenciaFala ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.toneAndControl?.score ?? selectedAnalysis.analysis?.analysis_fields?.tomControlo ?? selectedAnalysis.analysis?.analysis?.tomControlo ?? selectedAnalysis.analysis?.tomControlo ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.engagement?.score ?? selectedAnalysis.analysis?.analysis_fields?.envolvimentoConversacional ?? selectedAnalysis.analysis?.analysis?.envolvimentoConversacional ?? selectedAnalysis.analysis?.envolvimentoConversacional ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.needsDiscovery?.score ?? selectedAnalysis.analysis?.analysis_fields?.efetividadeDescobertaNecessidades ?? selectedAnalysis.analysis?.analysis?.efetividadeDescobertaNecessidades ?? selectedAnalysis.analysis?.efetividadeDescobertaNecessidades ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.valueDelivery?.score ?? selectedAnalysis.analysis?.analysis_fields?.entregaValorAjusteSolucao ?? selectedAnalysis.analysis?.analysis?.entregaValorAjusteSolucao ?? selectedAnalysis.analysis?.entregaValorAjusteSolucao ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.objectionHandling?.score ?? selectedAnalysis.analysis?.analysis_fields?.habilidadesLidarObjeccoes ?? selectedAnalysis.analysis?.analysis?.habilidadesLidarObjeccoes ?? selectedAnalysis.analysis?.habilidadesLidarObjeccoes ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.meetingControl?.score ?? selectedAnalysis.analysis?.analysis_fields?.estruturaControleReuniao ?? selectedAnalysis.analysis?.analysis?.estruturaControleReuniao ?? selectedAnalysis.analysis?.estruturaControleReuniao ?? 0}</span>
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
                              <span className="text-2xl font-bold text-white">{selectedAnalysis.analysis?.scoring?.closing?.score ?? selectedAnalysis.analysis?.analysis_fields?.fechamentoProximosPassos ?? selectedAnalysis.analysis?.analysis?.fechamentoProximosPassos ?? selectedAnalysis.analysis?.fechamentoProximosPassos ?? 0}</span>
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
              
              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Share Section */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Partilhar</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsSharing(true)
                      try {
                        const response = await fetch('/api/sales-analyst/share', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            analysisId: selectedAnalysis.id,
                            userId: user?.id
                          })
                        })
                        
                        const result = await response.json()
                        
                        if (result.success) {
                          const shareUrl = `${window.location.origin}/shared/${result.shareId}`
                          await navigator.clipboard.writeText(shareUrl)
                          toast({
                            title: "Link partilhado!",
                            description: "O link foi copiado para a área de transferência.",
                          })
                        } else {
                          throw new Error(result.error || 'Erro ao criar link de partilha')
                        }
                      } catch (error) {
                        console.error('Error sharing analysis:', error)
                        toast({
                          title: "Erro ao partilhar",
                          description: "Não foi possível criar o link de partilha.",
                          variant: "destructive"
                        })
                      } finally {
                        setIsSharing(false)
                      }
                    }}
                    disabled={isSharing}
                    className="w-full border-white/20 text-white hover:bg-white/10 bg-white/5"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {isSharing ? 'A partilhar...' : 'Partilhar chamada'}
                  </Button>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Notes Section */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">Notas</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={loadingNotes ? "A carregar notas..." : "Clique para adicionar notas..."}
                    disabled={loadingNotes}
                    className="w-full h-24 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/sales-analyst/notes', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              analysisId: selectedAnalysis.id,
                              userId: user?.id,
                              notes: notes
                            })
                          })
                          
                          if (response.ok) {
                            toast({
                              title: "Notas guardadas!",
                              description: "As suas notas foram guardadas com sucesso.",
                            })
                          }
                        } catch (error) {
                          toast({
                            title: "Erro ao guardar",
                            description: "Não foi possível guardar as notas.",
                            variant: "destructive"
                          })
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      Guardar
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Transcript Section */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Transcrição</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const transcript = selectedAnalysis.transcription || selectedAnalysis.analysis?.transcription || 'Transcrição não disponível'
                        try {
                          await navigator.clipboard.writeText(transcript)
                          toast({
                            title: "Transcrição copiada!",
                            description: "A transcrição foi copiada para a área de transferência.",
                          })
                        } catch (err) {
                          toast({
                            title: "Erro ao copiar",
                            description: "Não foi possível copiar a transcrição.",
                            variant: "destructive"
                          })
                        }
                      }}
                      className="w-full border-white/20 text-white hover:bg-white/10 bg-white/5"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar transcrição
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="w-full border-white/20 text-white hover:bg-white/10 bg-white/5"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição'}
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Delete Section */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAnalysisToDelete(selectedAnalysis)
                      setShowAnalysisDeleteConfirmation(true)
                    }}
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-red-500/5"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar conversa
                  </Button>
                </div>
              </div>
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