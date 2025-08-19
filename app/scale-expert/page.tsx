'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Send, 
  ArrowLeft, 
  User, 
  Loader2,
  MessageSquare,
  Sparkles,
  Square
} from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export default function ScaleExpertPage() {
  const router = useRouter()
  const { user, loading, initialized } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Handle authentication redirect
  useEffect(() => {
    console.log('Scale Expert - Auth state:', { loading, initialized, hasUser: !!user, userId: user?.id })
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, loading, initialized, router])

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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px` // max height of 128px (8rem)
    }
  }, [inputMessage])

  const createThread = async () => {
    try {
      const response = await fetch('/api/scale-expert/thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create thread')
      }

      const data = await response.json()
      setThreadId(data.threadId)
      return data.threadId
    } catch (error) {
      console.error('Error creating thread:', error)
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
    if (!inputMessage.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
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
      // Create thread if it doesn't exist
      let currentThreadId = threadId
      if (!currentThreadId) {
        currentThreadId = await createThread()
      }

      // Send message to assistant
      const response = await fetch('/api/scale-expert/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: currentThreadId,
          message: userMessage.content,
          userId: user.id
        }),
        signal: abortControllerRef.current?.signal
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Simulate streaming effect
      const fullResponse = data.response
      const words = fullResponse.split(' ')
      let currentText = ''
      
      for (let i = 0; i < words.length; i++) {
        // Check if the request was aborted
        if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
          console.log('Streaming stopped by user')
          return
        }
        
        currentText += (i > 0 ? ' ' : '') + words[i]
        
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: currentText }
            : msg
        ))
        
        // Add a small delay for the streaming effect
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 30))
      }

      // Finalize the message
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: fullResponse, isStreaming: false }
          : msg
      ))
    } catch (error) {
      console.error('Error sending message:', error)
      
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

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading || !initialized || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">
            {loading ? 'A carregar...' : !initialized ? 'A inicializar...' : 'A verificar autenticação...'}
          </p>
        </div>
      </div>
    )
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
        <header className="border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToDashboard}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Painel
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Agente Scale Expert</h1>
                    <p className="text-white/70 text-sm">Assistência de escalabilidade com IA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bem-vindo ao Agente Scale Expert</h3>
                <p className="text-white/60 mb-6">
                  Pergunta-me qualquer coisa sobre escalar o teu negócio, estratégias de crescimento ou desafios operacionais.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Image 
                          src="/images/logo-white.png" 
                          alt="Scale Labs" 
                          width={16} 
                          height={16}
                          className="w-4 h-4"
                        />
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                        : 'bg-white/10 border border-white/20 backdrop-blur-md'
                    }`}>
                      <div className="prose prose-invert max-w-none">
                        {message.role === 'assistant' ? (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Custom components for better styling
                              h1: ({children}) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-base font-bold mb-1">{children}</h3>,
                              p: ({children}) => <p className="mb-2">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-3 pl-0">{children}</ol>,
                              li: ({children}) => <li className="text-white/90 mb-4 leading-relaxed">{children}</li>,
                              strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                              em: ({children}) => <em className="italic text-white/90">{children}</em>,
                              code: ({children}) => <code className="bg-white/20 px-1 py-0.5 rounded text-sm">{children}</code>,
                              pre: ({children}) => <pre className="bg-white/10 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-white/80 mb-2">{children}</blockquote>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 bg-white/70 animate-pulse ml-1"></span>
                        )}
                      </div>
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-white/70' : 'text-white/50'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Pergunta ao Scale Expert qualquer coisa..."
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-500 resize-none min-h-[44px] max-h-32"
                  disabled={isLoading}
                  rows={1}
                />
              </div>
              <Button
                onClick={isLoading ? stopMessage : sendMessage}
                disabled={!isLoading && !inputMessage.trim()}
                className={`${
                  isLoading 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                    : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-2 text-center">
              Pressiona Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
