'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Upload, Plus, FileText, User, Briefcase, Mail, Phone, Star, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, ChevronRight, Search } from 'lucide-react'

interface Candidate {
  id: string
  name: string
  extracted_name?: string | null
  email: string | null
  phone: string | null
  position: string
  status: 'pending' | 'processing' | 'evaluated' | 'rejected' | 'accepted'
  overall_score: number | null
  evaluation: any
  form_data: any
  cv_file_url: string | null
  created_at: string
}

export default function CandidatesPage() {
  const router = useRouter()
  const { user, initialized, loading } = useAuth()
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  useEffect(() => {
    if (user) {
      fetchCandidates()
    }
  }, [user])

  // Reset selections when filtered candidates change
  useEffect(() => {
    setSelectedCandidates(new Set())
    setSelectAll(false)
  }, [filteredCandidates])

  // Bulk selection functions
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates(new Set())
      setSelectAll(false)
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)))
      setSelectAll(true)
    }
  }

  const toggleCandidateSelection = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
    setSelectAll(newSelected.size === filteredCandidates.length)
  }

  const deleteSelectedCandidates = async () => {
    if (selectedCandidates.size === 0) return

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

      // Delete each selected candidate
      const deletePromises = Array.from(selectedCandidates).map(async (candidateId) => {
        const response = await fetch(`/api/hr-agent/candidates/${candidateId}?accessToken=${session.access_token}`, {
          method: 'DELETE'
        })
        return response.ok
      })

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(Boolean).length

      if (successCount > 0) {
        toast({
          title: "Sucesso",
          description: `${successCount} candidato(s) eliminado(s) com sucesso`,
        })
        setSelectedCandidates(new Set())
        setSelectAll(false)
        fetchCandidates() // Refresh the list
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao eliminar candidatos selecionados",
        variant: "destructive"
      })
    }
  }

  const fetchCandidates = async () => {
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
      
      const response = await fetch(`/api/hr-agent/candidates?accessToken=${session.access_token}`)
      const data = await response.json()
      
             if (data.success) {
         setCandidates(data.candidates)
         setFilteredCandidates(data.candidates)
       } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao carregar candidatos",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar candidatos",
        variant: "destructive"
      })
    } finally {
      setLoadingCandidates(false)
    }
  }



  const processCV = async (candidateId: string) => {
    setProcessing(candidateId)
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
      
      const response = await fetch('/api/hr-agent/process-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          accessToken: session.access_token
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "CV processado com sucesso"
        })
        fetchCandidates()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao processar CV",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar CV",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const uploadCV = async (candidateId: string) => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor selecione um ficheiro",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
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
      
      // Get upload URL
      const uploadResponse = await fetch('/api/hr-agent/blob-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.access_token,
          userId: user?.id,
          originalFileName: selectedFile.name,
          candidateName: candidates.find(c => c.id === candidateId)?.name,
          position: candidates.find(c => c.id === candidateId)?.position
        })
      })

      const uploadData = await uploadResponse.json()
      
      if (!uploadData.url) {
        throw new Error('Failed to get upload URL')
      }

      // Upload file
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const fileResponse = await fetch(uploadData.url, {
        method: 'POST',
        body: formData
      })

      if (!fileResponse.ok) {
        throw new Error('Failed to upload file')
      }

      toast({
        title: "Sucesso",
        description: "CV carregado com sucesso"
      })
      
      setSelectedFile(null)
      fetchCandidates()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar CV",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const deleteCandidate = async (candidateId: string) => {
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
      
      const response = await fetch(`/api/hr-agent/candidates/${candidateId}?accessToken=${session.access_token}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Candidato eliminado com sucesso"
        })
        fetchCandidates()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao eliminar candidato",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao eliminar candidato",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'processing': return 'A processar'
      case 'evaluated': return 'Avaliado'
      case 'accepted': return 'Aceite'
      case 'rejected': return 'Rejeitado'
      default: return status
    }
  }

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredCandidates(candidates)
      return
    }

    const filtered = candidates.filter(candidate => {
      const searchTerm = query.toLowerCase()
      const candidateName = (candidate.extracted_name || candidate.name || '').toLowerCase()

      return candidateName.includes(searchTerm)
    })

    setFilteredCandidates(filtered)
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
                   onClick={() => router.push('/hr-agent')}
                   className="text-white hover:bg-white/10"
                 >
                   ← Voltar ao Agente RH
                 </Button>
                                 <div>
                   <h1 className="text-2xl font-bold">Candidatos</h1>
                   <p className="text-white/70">Gerir e avaliar todos os seus candidatos</p>
                 </div>
              </div>
              <div className="flex items-center space-x-2">
                                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-white hover:bg-white/10"
                   onClick={() => router.push('/hr-agent')}
                 >
                   Carregar CV
                   <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
              </div>
            </div>
          </div>
        </header>

                 {/* Main Content */}
         <div className="container mx-auto px-4 py-8">
           <div className="space-y-6">
 
             {/* Search and Bulk Actions */}
             <div className="flex items-center justify-between gap-4">
               <div className="relative flex-1">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-white/50" />
                 </div>
                 <Input
                   type="text"
                   placeholder="Pesquisar candidatos por nome..."
                   value={searchQuery}
                   onChange={(e) => handleSearch(e.target.value)}
                   className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-purple-500/20"
                 />
                 {searchQuery && (
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleSearch('')}
                       className="text-white/50 hover:text-white hover:bg-white/10"
                     >
                       ✕
                     </Button>
                   </div>
                 )}
               </div>
               
               {/* Bulk Selection Controls */}
               {filteredCandidates.length > 0 && (
                 <div className="flex items-center space-x-3">
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       checked={selectAll}
                       onCheckedChange={toggleSelectAll}
                       className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                     />
                     <span className="text-sm text-white/70">
                       {selectedCandidates.size > 0 
                         ? `${selectedCandidates.size} selecionado(s)` 
                         : 'Selecionar todos'
                       }
                     </span>
                   </div>
                   
                   {selectedCandidates.size > 0 && (
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button 
                           variant="destructive" 
                           size="sm"
                           className="bg-red-600 hover:bg-red-700 text-white"
                         >
                           Eliminar {selectedCandidates.size}
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent className="bg-gray-900 border-white/20">
                         <AlertDialogHeader>
                           <AlertDialogTitle className="text-white">Eliminar Candidatos Selecionados</AlertDialogTitle>
                           <AlertDialogDescription className="text-white/70">
                             Tem a certeza que pretende eliminar {selectedCandidates.size} candidato(s) selecionado(s)? Esta ação não pode ser desfeita.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                             Cancelar
                           </AlertDialogCancel>
                           <AlertDialogAction 
                             onClick={deleteSelectedCandidates}
                             className="bg-red-600 hover:bg-red-700"
                           >
                             Eliminar {selectedCandidates.size}
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   )}
                 </div>
               )}
             </div>

             {/* Search Results Info */}
             {searchQuery && (
               <div className="text-sm text-white/70">
                 {filteredCandidates.length === 1 
                   ? '1 candidato encontrado' 
                   : `${filteredCandidates.length} candidatos encontrados`
                 }
                 {filteredCandidates.length !== candidates.length && (
                   <span className="ml-2">
                     de {candidates.length} total
                   </span>
                 )}
               </div>
             )}

             <div className="grid gap-6">
                {loadingCandidates ? (
                  <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                    <CardContent className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                                                 <p className="text-white/70">A carregar candidatos...</p>
                      </div>
                    </CardContent>
                  </Card>
                                 ) : filteredCandidates.length === 0 ? (
                  <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <User className="h-8 w-8 text-white/40 mb-2" />
                                                                <p className="text-white/70">
                     {searchQuery ? 'Nenhum candidato encontrado para esta pesquisa' : 'Ainda não há candidatos'}
                   </p>
                   <p className="text-sm text-white/50">
                     {searchQuery ? 'Tente uma pesquisa diferente' : 'Adicione o seu primeiro candidato para começar'}
                   </p>
                    </CardContent>
                  </Card>
                                 ) : (
                   filteredCandidates.map((candidate) => (
                    <Card 
                      key={candidate.id} 
                      className={`bg-white/10 border-white/20 backdrop-blur-md shadow-xl hover:bg-white/15 hover:border-purple-500/30 transition-all duration-300 group ${
                        selectedCandidates.has(candidate.id) ? 'border-purple-500/50 bg-purple-500/5' : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Checkbox for bulk selection */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedCandidates.has(candidate.id)}
                                onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                                className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                              />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div 
                              className="cursor-pointer"
                              onClick={() => router.push(`/hr-agent/candidate/${candidate.id}`)}
                            >
                              <CardTitle className="text-white text-lg">{candidate.extracted_name || candidate.name}</CardTitle>
                              <div className="flex items-center space-x-2 text-white/70">
                                <Briefcase className="h-4 w-4" />
                                <span>{candidate.position}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                                                         <Badge className={`${getStatusColor(candidate.status)} border`}>
                               {getStatusIcon(candidate.status)}
                               <span className="ml-1">{getStatusLabel(candidate.status)}</span>
                             </Badge>
                            {candidate.overall_score && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                <Star className="h-3 w-3 mr-1" />
                                {candidate.overall_score.toFixed(1)}/10
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {candidate.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-white/50" />
                              <span className="text-sm text-white/70">{candidate.email}</span>
                            </div>
                          )}
                          {candidate.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-white/50" />
                              <span className="text-sm text-white/70">{candidate.phone}</span>
                            </div>
                          )}
                        </div>

                        {candidate.evaluation && (
                          <div className="space-y-3 mb-4">
                                                         <h4 className="font-medium text-white">Avaliação IA</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {candidate.evaluation.strengths && candidate.evaluation.strengths.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-green-400">Pontos Fortes</p>
                                  <ul className="text-sm text-white/70">
                                    {candidate.evaluation.strengths.slice(0, 2).map((strength: string, i: number) => (
                                      <li key={i}>• {strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {candidate.evaluation.concerns && candidate.evaluation.concerns.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-yellow-400">Pontos de Atenção</p>
                                  <ul className="text-sm text-white/70">
                                    {candidate.evaluation.concerns.slice(0, 2).map((concern: string, i: number) => (
                                      <li key={i}>• {concern}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            onClick={() => router.push(`/hr-agent/candidate/${candidate.id}`)}
                            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                          >
                                                         <User className="h-4 w-4 mr-2" />
                             Ver Detalhes
                          </Button>
                          {!candidate.cv_file_url ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                                                                     <Upload className="h-4 w-4 mr-2" />
                                   Carregar CV
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-white/20">
                                <DialogHeader>
                                                                     <DialogTitle className="text-white">Carregar CV para {candidate.name}</DialogTitle>
                                   <DialogDescription className="text-white/70">
                                     Selecione um ficheiro PDF, Word ou texto para carregar.
                                   </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                                                         <Label htmlFor="cv-file" className="text-white">Ficheiro CV</Label>
                                    <Input
                                      id="cv-file"
                                      type="file"
                                      accept=".pdf,.doc,.docx,.txt"
                                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                      className="bg-white/10 border-white/20 text-white"
                                    />
                                  </div>
                                  <Button 
                                    onClick={() => uploadCV(candidate.id)}
                                    disabled={!selectedFile || uploading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                                  >
                                                                         {uploading ? 'A carregar...' : 'Carregar CV'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => window.open(candidate.cv_file_url!, '_blank')}
                              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                            >
                                                             <FileText className="h-4 w-4 mr-2" />
                               Ver CV
                            </Button>
                          )}

                          {candidate.cv_file_url && candidate.status === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={() => processCV(candidate.id)}
                              disabled={processing === candidate.id}
                              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                            >
                                                             {processing === candidate.id ? 'A processar...' : 'Processar CV'}
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                                             <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                                 Eliminar
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-white/20">
                              <AlertDialogHeader>
                                                                 <AlertDialogTitle className="text-white">Eliminar Candidato</AlertDialogTitle>
                                 <AlertDialogDescription className="text-white/70">
                                   Tem a certeza que pretende eliminar {candidate.name}? Esta ação não pode ser desfeita.
                                 </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                                                 <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancelar</AlertDialogCancel>
                                 <AlertDialogAction 
                                   onClick={() => deleteCandidate(candidate.id)}
                                   className="bg-red-600 hover:bg-red-700"
                                 >
                                   Eliminar
                                 </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
