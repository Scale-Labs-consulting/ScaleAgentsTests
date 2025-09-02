'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, User, Briefcase, Mail, Phone, MapPin, Star, FileText, Download, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  position: string
  status: 'pending' | 'processing' | 'evaluated' | 'rejected' | 'accepted'
  overall_score: number | null
  evaluation: any
  form_data: any
  cv_file_url: string | null
  created_at: string
  // Extracted personal information fields
  personal_info?: any
  extracted_name?: string
  extracted_email?: string
  extracted_phone?: string
  extracted_location?: string
  extracted_linkedin?: string
  extracted_github?: string
  extracted_website?: string
  extracted_date_of_birth?: string
  extracted_nationality?: string
  extracted_languages?: string[]
  extracted_skills?: string[]
  extracted_experience_years?: number
  extracted_education?: string[]
  extracted_certifications?: string[]
  extracted_availability?: string
  extracted_salary_expectation?: string
  extracted_work_permit?: string
  extracted_remote_preference?: string
  extracted_notice_period?: string
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, initialized, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { user: !!user, initialized, paramsId: params.id })
    
    if (initialized && !user) {
      console.log('❌ No user, redirecting to login')
      router.push('/login')
      return
    }

    if (user && params.id) {
      console.log('✅ User and params found, fetching candidate')
      fetchCandidate()
    } else {
      console.log('⏳ Waiting for user or params:', { user: !!user, paramsId: params.id })
    }
  }, [user, initialized, params.id, router])

  const fetchCandidate = async () => {
    try {
      console.log('🔍 Fetching candidate with ID:', params.id)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('❌ No active session found')
        toast({
          title: "Error",
          description: "No active session found",
          variant: "destructive"
        })
        router.push('/login')
        return
      }

      console.log('✅ Session found, making API request...')
      const response = await fetch(`/api/hr-agent/candidates/${params.id}?accessToken=${session.access_token}`)
      console.log('📡 API Response status:', response.status)
      
      const data = await response.json()
      console.log('📄 API Response data:', data)
      
      if (data.success) {
        console.log('✅ Candidate fetched successfully:', data.candidate)
        setCandidate(data.candidate)
      } else {
        console.error('❌ API returned error:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch candidate",
          variant: "destructive"
        })
        router.push('/hr-agent/candidates')
      }
    } catch (error) {
      console.error('❌ Fetch candidate error:', error)
      toast({
        title: "Error",
        description: "Failed to fetch candidate",
        variant: "destructive"
      })
      router.push('/hr-agent/candidates')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing': return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'evaluated': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'accepted': return <Star className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'evaluated': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case 'Interview': return 'bg-green-100 text-green-800'
      case 'Reject': return 'bg-red-100 text-red-800'
      case 'Consider': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const deleteCandidate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "No active session found",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch(`/api/hr-agent/candidates/${candidate.id}?accessToken=${session.access_token}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Candidate deleted successfully"
        })
        router.push('/hr-agent/candidates')
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete candidate",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive"
      })
    }
  }

  if (authLoading || !initialized || loading) {
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

  if (!candidate) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <p className="text-white/70">Candidato não encontrado</p>
            <Button 
              onClick={() => router.push('/hr-agent/candidates')} 
              className="mt-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            >
              Voltar aos Candidatos
            </Button>
          </div>
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
      <div className="relative z-10">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/hr-agent/candidates')}
              className="mb-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Candidatos
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-white">{candidate.extracted_name || candidate.name}</h1>
                <p className="text-white/70">{candidate.position || 'Unknown Position'}</p>
              </div>
              
              {/* Quick Actions - Top Right */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-md w-96">
                <CardHeader>
                  <CardTitle className="text-white">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-3">
                    {candidate.cv_file_url && (
                      <Button 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-10 text-xs font-medium"
                        onClick={() => window.open(candidate.cv_file_url!, '_blank')}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Ver CV
                      </Button>
                    )}
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-10 text-xs font-medium"
                      onClick={() => {
                        // For now, show a toast notification
                        toast({
                          title: "Editar Candidato",
                          description: `A abrir editor para ${candidate.extracted_name || candidate.name}...`,
                          duration: 3000,
                        })
                        // TODO: Implement edit functionality - could be:
                        // 1. Navigate to edit page: router.push(`/hr-agent/candidate/${candidate.id}/edit`)
                        // 2. Open edit modal
                        // 3. Open edit form in a new tab
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-10 text-xs font-medium">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Eliminar Candidato</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Tem a certeza que pretende eliminar {candidate.extracted_name || candidate.name}? Esta ação não pode ser desfeita e irá eliminar permanentemente o candidato e o seu CV.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={deleteCandidate}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="space-y-8">
            {/* Top Row: Contact Info and Evaluation Details side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Contact Information */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <User className="h-5 w-5" />
                    <span>Informação de Contacto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Use extracted information if available, fallback to original fields */}
                  {(candidate.extracted_email || candidate.email) && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <Mail className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/50 font-medium">Email</span>
                        <span className="text-sm text-white/90">{candidate.extracted_email || candidate.email}</span>
                      </div>
                    </div>
                  )}
                  {(candidate.extracted_phone || candidate.phone) && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <Phone className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/50 font-medium">Telemóvel</span>
                        <span className="text-sm text-white/90">{candidate.extracted_phone || candidate.phone}</span>
                      </div>
                    </div>
                  )}
                  {candidate.extracted_location && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <MapPin className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/50 font-medium">Endereço</span>
                        <span className="text-sm text-white/90">{candidate.extracted_location}</span>
                      </div>
                    </div>
                  )}
                  {candidate.extracted_linkedin && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <ExternalLink className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <a 
                        href={candidate.extracted_linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        Perfil LinkedIn
                      </a>
                    </div>
                  )}
                  {candidate.extracted_github && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <ExternalLink className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <a 
                        href={candidate.extracted_github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        GitHub
                      </a>
                    </div>
                  )}
                  {candidate.extracted_website && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <ExternalLink className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <a 
                        href={candidate.extracted_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  {candidate.extracted_nationality && candidate.extracted_nationality !== 'Não especificado' && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-black/10 border border-white/5">
                      <User className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <span className="text-sm text-white/90">{candidate.extracted_nationality}</span>
                    </div>
                  )}
                  {!candidate.extracted_email && !candidate.email && !candidate.extracted_phone && !candidate.phone && 
                   !candidate.extracted_location && !candidate.extracted_linkedin && !candidate.extracted_github && 
                   !candidate.extracted_website && (!candidate.extracted_nationality || candidate.extracted_nationality === 'Não especificado') && (
                    <div className="text-center py-8">
                      <p className="text-white/70">Contact information will be displayed here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Evaluation Details */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Detalhes da Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Badges */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Evaluated
                    </Badge>
                    {candidate.overall_score && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Star className="h-3 w-3 mr-1" />
                        {candidate.overall_score.toFixed(1)}/10
                      </Badge>
                    )}
                  </div>
                  {candidate.evaluation?.evaluationDetails ? (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-white/5">
                          <span className="text-sm text-white/70">Anos de Experiência</span>
                          <span className="text-sm font-medium text-white">
                            {candidate.extracted_experience_years || candidate.evaluation?.evaluationDetails?.experienceYears || 0} Anos
                          </span>
                        </div>
                                               <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-white/5">
                         <span className="text-sm text-white/70">Disponibilidade</span>
                         <span className="text-sm font-medium text-white">
                           {candidate.extracted_availability || candidate.evaluation?.evaluationDetails?.availability || 'Não especificado'}
                         </span>
                       </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-white/5">
                          <span className="text-sm text-white/70">Experiência em Vendas</span>
                          <span className="text-sm font-medium text-white">
                            {candidate.evaluation?.evaluationDetails?.salesExperience || 'Não especificado'}
                          </span>
                        </div>
                        {candidate.extracted_salary_expectation && candidate.extracted_salary_expectation !== 'Não especificado' && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-white/5">
                            <span className="text-sm text-white/70">Expectativa Salarial</span>
                            <span className="text-sm font-medium text-white">
                              {candidate.extracted_salary_expectation}
                            </span>
                          </div>
                        )}
                        {candidate.extracted_remote_preference && candidate.extracted_remote_preference !== 'Não especificado' && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-white/5">
                            <span className="text-sm text-white/70">Preferência Remota</span>
                            <span className="text-sm font-medium text-white">
                              {candidate.extracted_remote_preference}
                            </span>
                          </div>
                        )}
                      </div>
                      {candidate.extracted_languages && candidate.extracted_languages.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-3 text-white">Languages</h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.extracted_languages.map((language: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-gray-700 text-white hover:bg-gray-600">
                                {language}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/70">Evaluation details will be displayed here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Middle Row: AI Analysis (full width) */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Análise IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Executive Summary */}
                {candidate.evaluation?.executiveSummary && (
                  <div>
                    <h4 className="font-medium text-base mb-3 text-white">Resumo Executivo</h4>
                    <div className="p-3 rounded-lg bg-black/10 border border-white/5">
                      <p className="text-base text-white/90 leading-relaxed">{candidate.evaluation.executiveSummary}</p>
                    </div>
                  </div>
                )}

                {/* Key Strengths (from new analysis) */}
                {candidate.evaluation?.keyStrengths && candidate.evaluation.keyStrengths.length > 0 && (
                  <div>
                    <h4 className="font-medium text-base mb-3 text-white">Pontos Fortes Principais</h4>
                    <ul className="text-base space-y-2">
                      {candidate.evaluation.keyStrengths.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start p-2 rounded-lg bg-black/10 border border-white/5">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-white/90">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Legacy Strengths (fallback) */}
                {(!candidate.evaluation?.keyStrengths || candidate.evaluation.keyStrengths.length === 0) && 
                 candidate.evaluation?.strengths && candidate.evaluation.strengths.length > 0 && (
                  <div>
                    <h4 className="font-medium text-base mb-3 text-white">Pontos Fortes</h4>
                    <ul className="text-base space-y-2">
                      {candidate.evaluation.strengths.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start p-2 rounded-lg bg-black/10 border border-white/5">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-white/90">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {candidate.evaluation?.concerns && candidate.evaluation.concerns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-base mb-3 text-white">Áreas de Preocupação</h4>
                    <ul className="text-base space-y-2">
                      {candidate.evaluation.concerns.map((concern: string, i: number) => (
                        <li key={i} className="flex items-start p-2 rounded-lg bg-black/10 border border-white/5">
                          <AlertCircle className="h-4 w-4 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-white/90">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interview Focus */}
                {candidate.evaluation?.interviewFocus && candidate.evaluation.interviewFocus.length > 0 && (
                  <div>
                    <h4 className="font-medium text-base mb-3 text-white">Foco da Entrevista</h4>
                    <ul className="text-base space-y-2">
                      {candidate.evaluation.interviewFocus.map((question: string, i: number) => (
                        <li key={i} className="flex items-start p-2 rounded-lg bg-black/10 border border-white/5">
                          <FileText className="h-4 w-4 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-white/90">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Approach Strategy */}
                {candidate.evaluation?.approachStrategy && (
                  <div>
                    <h4 className="font-medium text-base mb-3 text-white">Estratégia de Approach</h4>
                    <div className="p-3 rounded-lg bg-black/10 border border-white/5">
                      <p className="text-base text-white/90 leading-relaxed">{candidate.evaluation.approachStrategy}</p>
                    </div>
                  </div>
                )}

                {/* No Analysis Available */}
                {(!candidate.evaluation?.executiveSummary && 
                  (!candidate.evaluation?.keyStrengths || candidate.evaluation.keyStrengths.length === 0) &&
                  (!candidate.evaluation?.strengths || candidate.evaluation.strengths.length === 0) &&
                  (!candidate.evaluation?.concerns || candidate.evaluation.concerns.length === 0) &&
                  (!candidate.evaluation?.interviewFocus || candidate.evaluation.interviewFocus.length === 0) &&
                  !candidate.evaluation?.approachStrategy) && (
                  <div className="text-center py-8">
                    <p className="text-white/70">AI analysis will be displayed here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


        </div>
      </div>
    </div>
  )
}
