'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { 
  Users,
  User,
  Calendar,
  Mail,
  Briefcase,
  Brain,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  cv_url: string
  submission_date: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  score?: number
  analysis?: any
  created_at: string
}

export default function CandidatesPage() {
  const { user, initialized, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Load candidates on mount
  useEffect(() => {
    if (user) {
      loadCandidates()
    }
  }, [user])

  const loadCandidates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session found')
      }

      const response = await fetch('/api/hr-talent/candidates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load candidates')
      }

      const result = await response.json()
      
      if (result.success) {
        setCandidates(result.candidates || [])
      } else {
        throw new Error(result.error || 'Failed to load candidates')
      }
    } catch (error) {
      console.error('❌ Load candidates error:', error)
      toast({
        title: "Erro ao carregar candidatos",
        description: error instanceof Error ? error.message : 'Failed to load candidates',
        variant: "destructive"
      })
    } finally {
      setLoadingCandidates(false)
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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Analisado'
      case 'processing': return 'A processar'
      case 'failed': return 'Falhou'
      default: return 'Pendente'
    }
  }

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
                  onClick={() => router.push('/hr-talent')}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao HR Talent
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Candidatos</h1>
                  <p className="text-white/70">Gerencie e analise candidatos</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadCandidates}
                  className="text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="max-w-6xl mx-auto mb-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                      <Input
                        placeholder="Procurar por nome, email ou posição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md"
                    >
                      <option value="all">Todos os Estados</option>
                      <option value="pending">Pendente</option>
                      <option value="processing">A Processar</option>
                      <option value="completed">Analisado</option>
                      <option value="failed">Falhou</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Candidates List */}
          <div className="max-w-6xl mx-auto">
            {loadingCandidates ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-white/70">A carregar candidatos...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum candidato encontrado</h3>
                  <p className="text-white/60 mb-4">
                    {candidates.length === 0 
                      ? 'Ainda não há candidatos. Carregue um CSV do Google Forms para começar.'
                      : 'Nenhum candidato corresponde aos filtros aplicados.'
                    }
                  </p>
                  {candidates.length === 0 && (
                    <Button 
                      onClick={() => router.push('/hr-talent')}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    >
                      Carregar CSV
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <Card key={candidate.id} className="bg-white/10 border-white/20 backdrop-blur-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{candidate.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-white/60 mt-1">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {candidate.email}
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="w-4 h-4 mr-1" />
                                {candidate.position}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(candidate.submission_date)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {candidate.score !== undefined && (
                              <p className="text-white font-semibold mb-1">
                                {candidate.score}/100
                              </p>
                            )}
                            <Badge 
                              className={`${getStatusColor(candidate.status)} border`}
                            >
                              {getStatusText(candidate.status)}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Analysis Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedCandidate.name}</h2>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedCandidate(null)}
                className="text-white hover:bg-white/10"
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Candidato</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-white/60 text-sm">Email:</span>
                    <p className="text-white">{selectedCandidate.email}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Posição:</span>
                    <p className="text-white">{selectedCandidate.position}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Data de Submissão:</span>
                    <p className="text-white">{formatDate(selectedCandidate.submission_date)}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Pontuação:</span>
                    <p className="text-white text-lg font-semibold">
                      {selectedCandidate.score || 'N/A'}/100
                    </p>
                  </div>
                </div>
              </div>

              {selectedCandidate.analysis && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Análise do CV</h3>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10 max-h-96 overflow-y-auto">
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
