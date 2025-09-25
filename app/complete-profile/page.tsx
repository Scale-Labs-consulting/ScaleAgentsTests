'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, upsertUserProfile } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function CompleteProfilePage() {
  const [formData, setFormData] = useState({
    // Basic info
    name: '',
    companyName: '',
    
    // NEGÓCIO CORE
    businessProductService: '',
    idealCustomer: '',
    problemSolved: '',
    businessModel: '',
    
    // VENDAS & PERFORMANCE
    averageTicket: '',
    conversionRate: '',
    salesCycle: '',
    leadGeneration: '',
    commonObjections: '',
    
    // POSICIONAMENTO
    mainCompetitors: '',
    differentiation: '',
    pricingStructure: '',
    
    // OBJETIVOS & BOTTLENECKS
    monthlyRevenue: '',
    growthBottleneck: '',
    funnelDropOff: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const businessModels = [
    'B2B',
    'B2C', 
    'SaaS',
    'Consultoria',
    'E-commerce',
    'Marketplace',
    'Freemium',
    'Subscription',
    'One-time',
    'Outro'
  ]

  const leadGenerationOptions = [
    'Cold Email',
    'Anúncios (Google, Facebook, etc.)',
    'Referrals',
    'Content Marketing',
    'SEO',
    'LinkedIn',
    'Eventos/Networking',
    'Outbound Sales',
    'Inbound Marketing',
    'Outro'
  ]

  const funnelStages = [
    'Lead Generation',
    'First Call/Meeting',
    'Proposta/Quote',
    'Negociação',
    'Closing',
    'Onboarding',
    'Retenção'
  ]

  const revenueRanges = [
    '0-5k',
    '5k-10k',
    '10k-50k',
    '50k-100k',
    '100k-500k',
    '500k+'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Basic required fields
    if (!formData.name.trim()) {
      newErrors.name = 'O nome é obrigatório'
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'O nome da empresa é obrigatório'
    }

    // Core business fields
    if (!formData.businessProductService.trim()) {
      newErrors.businessProductService = 'Descreva o que vendes'
    }
    if (!formData.idealCustomer.trim()) {
      newErrors.idealCustomer = 'Descreva o teu cliente ideal'
    }
    if (!formData.problemSolved.trim()) {
      newErrors.problemSolved = 'Descreva o problema que resolves'
    }
    if (!formData.businessModel) {
      newErrors.businessModel = 'Selecione o modelo de negócio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')
    
    // Show initial loading toast
    toast({
      title: "A processar informações...",
      description: "A validar e guardar o teu perfil de negócio.",
      duration: 3000,
    })
    
    // Test database connection first
    try {
      console.log('🧪 Testing database connection...')
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.error('❌ Database connection test failed:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }
      console.log('✅ Database connection test successful')
      
      // Test if the new columns exist
      console.log('🧪 Testing new columns...')
      const { data: columnTest, error: columnError } = await supabase
        .from('profiles')
        .select('business_product_service, ideal_customer, problem_solved, business_model')
        .limit(1)
      
      if (columnError) {
        console.error('❌ Column test failed:', columnError)
        throw new Error(`New columns not found: ${columnError.message}`)
      }
      console.log('✅ New columns test successful')
    } catch (dbError: any) {
      console.error('❌ Database test error:', dbError)
      setError(`Erro de base de dados: ${dbError?.message || 'Erro desconhecido'}`)
      setIsLoading(false)
      return
    }
    
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Prepare the data to be saved
      const profileData = {
          id: user.id,
          email: user.email || '', // Add required email field
          first_name: firstName,
          last_name: lastName,
          company_name: formData.companyName,
        business_product_service: formData.businessProductService,
        ideal_customer: formData.idealCustomer,
        problem_solved: formData.problemSolved,
        business_model: formData.businessModel,
        average_ticket: formData.averageTicket,
        conversion_rate: formData.conversionRate,
        sales_cycle: formData.salesCycle,
        lead_generation: formData.leadGeneration,
        common_objections: formData.commonObjections,
        main_competitors: formData.mainCompetitors,
        differentiation: formData.differentiation,
        pricing_structure: formData.pricingStructure,
        monthly_revenue: formData.monthlyRevenue,
        growth_bottleneck: formData.growthBottleneck,
        funnel_drop_off: formData.funnelDropOff,
        onboarding_completed: true, // Mark onboarding as completed
          updated_at: new Date().toISOString()
      }

      console.log('📝 Attempting to save profile data:', profileData)
      console.log('👤 User ID:', user.id)
      console.log('📧 User Email:', user.email)

      // Save profile data to database directly
      try {
        const { data: savedProfile, error: saveError } = await supabase
          .from('profiles')
          .upsert(profileData)
          .select()
          .single()
        
        if (saveError) {
          console.error('❌ Save error:', saveError)
          console.error('❌ Save error details:', {
            message: saveError?.message,
            details: saveError?.details,
            hint: saveError?.hint,
            code: saveError?.code
          })
          throw saveError
        }
        
        console.log('✅ Profile saved successfully!', savedProfile)
        
        // Show success message
        setSuccessMessage('Perfil guardado com sucesso!')
        
        toast({
          title: "Perfil criado com sucesso! 🎉",
          description: "As tuas informações foram guardadas. A redirecionar para o dashboard...",
          duration: 5000,
        })
        
        // Verify the profile was saved with all required fields
        const requiredFields = ['first_name', 'last_name', 'company_name', 'business_product_service', 'ideal_customer', 'problem_solved', 'business_model']
        const missingFields = requiredFields.filter(field => !savedProfile[field])
        
        if (missingFields.length > 0) {
          console.warn('⚠️ Some required fields are missing from saved profile:', missingFields)
        } else {
          console.log('✅ All required fields are present in saved profile')
        }
      } catch (saveError) {
        console.error('❌ Save error:', saveError)
        throw saveError
      }
      
      // Redirect to dashboard with a small delay to ensure database is updated
      console.log('✅ Profile saved successfully, redirecting to dashboard...')
      setTimeout(() => {
        // Force a hard navigation to ensure the useFirstTimeUser hook re-evaluates
        window.location.href = '/dashboard'
      }, 500)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      console.error('Error type:', typeof error)
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
        statusText: error?.statusText
      })
      
      // Try to get more specific error information
      let errorMessage = 'Erro desconhecido'
      let errorTitle = 'Erro ao guardar perfil'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Enhanced error handling with specific messages
      if (error?.message?.includes('duplicate key')) {
        errorTitle = 'Perfil já existe'
        errorMessage = 'Já existe um perfil para este utilizador. A tentar atualizar...'
      } else if (error?.message?.includes('permission denied')) {
        errorTitle = 'Erro de permissão'
        errorMessage = 'Não tens permissão para guardar o perfil. Contacta o suporte.'
      } else if (error?.message?.includes('network')) {
        errorTitle = 'Erro de rede'
        errorMessage = 'Problema de ligação. Verifica a tua internet e tenta novamente.'
      } else if (error?.message?.includes('timeout')) {
        errorTitle = 'Timeout'
        errorMessage = 'A operação demorou demasiado tempo. Tenta novamente.'
      }
      
      setError(`Erro ao guardar perfil: ${errorMessage}`)
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    try {
      if (!user) {
        console.error('❌ No user found for skip operation')
        router.push('/dashboard')
        return
      }

      console.log('⏭️ User skipping onboarding, marking as completed...')
      
      toast({
        title: "A saltar onboarding...",
        description: "A marcar como concluído e a redirecionar.",
        duration: 3000,
      })
      
      // Mark the user as having completed onboarding by setting basic required fields
      // This will prevent them from seeing the form again
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '', // Add required email field
          first_name: 'User', // Set a default name
          last_name: 'Skipped',
          company_name: 'Not specified',
          business_product_service: 'Skipped onboarding',
          ideal_customer: 'Not specified',
          problem_solved: 'Not specified',
          business_model: 'Not specified',
          onboarding_completed: true, // Mark onboarding as completed (skipped)
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Error marking user as completed:', error)
        toast({
          title: "Aviso",
          description: "Houve um problema ao marcar como concluído, mas vamos continuar.",
          variant: "destructive",
          duration: 4000,
        })
        // Still redirect even if there's an error
      } else {
        console.log('✅ User marked as completed onboarding')
        toast({
          title: "Onboarding saltado",
          description: "Podes completar o teu perfil mais tarde nas definições.",
          duration: 4000,
        })
      }
      
      // Force a hard navigation to ensure the useFirstTimeUser hook re-evaluates
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (error) {
      console.error('❌ Error in handleSkip:', error)
      // Still redirect even if there's an error
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear general error when user starts typing
    if (error) {
      setError('')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/background-4.jpg"
          alt="Background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/20 to-black/70" />
      </div>

      {/* Logo - Fixed top left */}
      <div className="fixed top-4 left-4 z-20">
        <Image
          src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
          alt="ScaleAgents Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          
          <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
              <CardTitle className="text-3xl font-bold text-white">
                Contexto Essencial do Negócio
            </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Ajuda-nos a personalizar a tua experiência fornecendo informações sobre o teu negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Success Message */}
                {successMessage && (
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <p className="text-green-200 text-sm font-medium">{successMessage}</p>
                    </div>
                    <p className="text-green-300 text-xs mt-2">
                      A redirecionar para o dashboard...
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <p className="text-red-200 text-sm font-medium">Erro ao guardar perfil</p>
                    </div>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                    <p className="text-red-300 text-xs mt-2">
                      <strong>Dica:</strong> Verifica se todos os campos obrigatórios estão preenchidos e tenta novamente.
                    </p>
                  </div>
                )}
                
                {/* BASIC INFO */}
                <div className="space-y-6 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Informação Básica
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                      <Label htmlFor="name" className="text-white font-medium">O teu Nome</Label>
                <Input
                  id="name"
                  type="text"
                        placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.name && (
                        <p className="text-red-400 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white font-medium">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  type="text"
                        placeholder="Scale Labs"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 ${
                    errors.companyName ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.companyName && (
                        <p className="text-red-400 text-sm">{errors.companyName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* NEGÓCIO CORE */}
                <div className="space-y-6 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Negócio Core
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessProductService" className="text-white font-medium">
                        O que vendes exactamente? (produto/serviço detalhado)
                      </Label>
                      <Textarea
                        id="businessProductService"
                        placeholder="Descreve detalhadamente o que a tua empresa vende..."
                        value={formData.businessProductService}
                        onChange={(e) => handleInputChange('businessProductService', e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px] ${
                          errors.businessProductService ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errors.businessProductService && (
                        <p className="text-red-400 text-sm">{errors.businessProductService}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idealCustomer" className="text-white font-medium">
                        Quem é o teu cliente ideal? (demográfico, cargo, empresa)
                      </Label>
                      <Textarea
                        id="idealCustomer"
                        placeholder="Descreve o teu cliente ideal..."
                        value={formData.idealCustomer}
                        onChange={(e) => handleInputChange('idealCustomer', e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px] ${
                          errors.idealCustomer ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errors.idealCustomer && (
                        <p className="text-red-400 text-sm">{errors.idealCustomer}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="problemSolved" className="text-white font-medium">
                        Que problema específico resolves para os clientes?
                      </Label>
                      <Textarea
                        id="problemSolved"
                        placeholder="Qual é o problema principal que resolves..."
                        value={formData.problemSolved}
                        onChange={(e) => handleInputChange('problemSolved', e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px] ${
                          errors.problemSolved ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errors.problemSolved && (
                        <p className="text-red-400 text-sm">{errors.problemSolved}</p>
                )}
              </div>

              <div className="space-y-2">
                      <Label htmlFor="businessModel" className="text-white font-medium">
                        Qual é o teu modelo de negócio?
                      </Label>
                      <Select value={formData.businessModel} onValueChange={(value) => handleInputChange('businessModel', value)}>
                        <SelectTrigger className={`bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-purple-500 ${
                          errors.businessModel ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Selecione o modelo de negócio" />
                  </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {businessModels.map((model) => (
                            <SelectItem key={model} value={model} className="text-white hover:bg-gray-700">
                              {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                      {errors.businessModel && (
                        <p className="text-red-400 text-sm">{errors.businessModel}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* VENDAS & PERFORMANCE */}
                <div className="space-y-6 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Vendas & Performance
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="averageTicket" className="text-white font-medium">
                        Qual é o ticket médio das tuas vendas?
                      </Label>
                      <Input
                        id="averageTicket"
                        type="text"
                        placeholder="€500, €2,000, €10,000+"
                        value={formData.averageTicket}
                        onChange={(e) => handleInputChange('averageTicket', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conversionRate" className="text-white font-medium">
                        Qual é a tua taxa de conversão atual? (%)
                      </Label>
                      <Input
                        id="conversionRate"
                        type="text"
                        placeholder="5%, 15%, 25%"
                        value={formData.conversionRate}
                        onChange={(e) => handleInputChange('conversionRate', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salesCycle" className="text-white font-medium">
                        Qual é o teu ciclo de vendas típico?
                      </Label>
                      <Input
                        id="salesCycle"
                        type="text"
                        placeholder="30 dias, 3 meses, 6 meses"
                        value={formData.salesCycle}
                        onChange={(e) => handleInputChange('salesCycle', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leadGeneration" className="text-white font-medium">
                        Como geras leads atualmente?
                      </Label>
                      <Select value={formData.leadGeneration} onValueChange={(value) => handleInputChange('leadGeneration', value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Selecione o método principal" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {leadGenerationOptions.map((method) => (
                            <SelectItem key={method} value={method} className="text-white hover:bg-gray-700">
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commonObjections" className="text-white font-medium">
                      Que objeções recebes mais frequentemente?
                    </Label>
                    <Textarea
                      id="commonObjections"
                      placeholder="Lista as principais objeções que os clientes levantam..."
                      value={formData.commonObjections}
                      onChange={(e) => handleInputChange('commonObjections', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                    />
                  </div>
                </div>

                {/* POSICIONAMENTO */}
                <div className="space-y-6 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Posicionamento
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mainCompetitors" className="text-white font-medium">
                        Quem são os teus principais concorrentes?
                      </Label>
                      <Textarea
                        id="mainCompetitors"
                        placeholder="Lista os teus principais concorrentes..."
                        value={formData.mainCompetitors}
                        onChange={(e) => handleInputChange('mainCompetitors', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="differentiation" className="text-white font-medium">
                        Como te diferencias da concorrência?
                      </Label>
                      <Textarea
                        id="differentiation"
                        placeholder="O que te torna único em relação aos concorrentes..."
                        value={formData.differentiation}
                        onChange={(e) => handleInputChange('differentiation', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricingStructure" className="text-white font-medium">
                        Como está estruturado o teu pricing?
                      </Label>
                      <Textarea
                        id="pricingStructure"
                        placeholder="Descreve a estrutura de preços (packages, hourly, subscription, etc.)..."
                        value={formData.pricingStructure}
                        onChange={(e) => handleInputChange('pricingStructure', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                {/* OBJETIVOS & BOTTLENECKS */}
                <div className="space-y-6 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Objetivos & Bottlenecks
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRevenue" className="text-white font-medium">
                        Qual é a receita mensal atual?
                      </Label>
                      <Select value={formData.monthlyRevenue} onValueChange={(value) => handleInputChange('monthlyRevenue', value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Selecione o range de receita" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {revenueRanges.map((range) => (
                            <SelectItem key={range} value={range} className="text-white hover:bg-gray-700">
                              €{range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="growthBottleneck" className="text-white font-medium">
                        Qual é o maior bottleneck no teu crescimento atual?
                      </Label>
                      <Input
                        id="growthBottleneck"
                        type="text"
                        placeholder="Lead generation, conversão, retenção..."
                        value={formData.growthBottleneck}
                        onChange={(e) => handleInputChange('growthBottleneck', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
              </div>

              <div className="space-y-2">
                    <Label htmlFor="funnelDropOff" className="text-white font-medium">
                      Onde perdes mais clientes no funil?
                    </Label>
                    <Select value={formData.funnelDropOff} onValueChange={(value) => handleInputChange('funnelDropOff', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Selecione a etapa onde perdes mais clientes" />
                  </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {funnelStages.map((stage) => (
                          <SelectItem key={stage} value={stage} className="text-white hover:bg-gray-700">
                            {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  </div>
              </div>

              {/* Action Buttons */}
                <div className="flex gap-4 pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Saltar por agora
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>A guardar perfil...</span>
                      </div>
                    ) : (
                      'Completar Onboarding'
                    )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
