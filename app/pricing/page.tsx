'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [isYearly, setIsYearly] = useState(false)

  // Handle Stripe checkout cancellation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const canceled = urlParams.get('canceled')
    
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

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Por favor, faça login para subscrever um plano.",
        variant: "destructive"
      })
      router.push('/login')
      return
    }

    setLoading(plan.id)
    
    try {
      // Redirect to custom branded checkout
      const billingPeriod = isYearly ? 'yearly' : 'monthly'
      const checkoutUrl = `/checkout-custom?plan=${plan.id}&billing=${billingPeriod}`
      
      router.push(checkoutUrl)
    } catch (error) {
      console.error('Error redirecting to checkout:', error)
      toast({
        title: "Erro",
        description: "Erro ao redirecionar para o checkout. Tente novamente.",
        variant: "destructive"
      })
      setLoading(null)
    }
  }


  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/background-4.jpg"
          alt="Background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/20 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Escolhe o Teu Plano
              </h1>
            </div>
            
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center relative">
                {/* Monthly Option */}
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    !isYearly 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Mensal
                </button>
                
                {/* Yearly Option with Badge */}
                <button
                  onClick={() => setIsYearly(true)}
                  className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isYearly 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>Anual</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
                    isYearly 
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  }`}>
                    Poupe 20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 flex items-center justify-center px-6 pb-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
            {/* Plano Base */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-2 flex flex-col group hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-700 hover:text-white transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-4">Plano Base</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-2">
                  €{isYearly ? SUBSCRIPTION_PLANS[1].yearlyPrice : SUBSCRIPTION_PLANS[1].price}
                </div>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-white/80">
                  /mês
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                  €{isYearly ? '1,392' : '1,668'}/ano
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Scale Expert Agent</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Análises de crescimento</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Estratégias de escala</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Suporte por email</span>
                </li>
              </ul>

              <Button 
                onClick={() => handleSubscribe(SUBSCRIPTION_PLANS[1])}
                disabled={loading === 'base'}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 group-hover:bg-white group-hover:text-purple-600"
              >
                {loading === 'base' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>A processar...</span>
                  </div>
                ) : (
                  'Começar Agora'
                )}
              </Button>
            </div>

            {/* Plano Pro */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-2 flex flex-col group hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-700 hover:text-white transition-all duration-300 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-1 text-xs font-semibold">
                  Mais Popular
                </Badge>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-4">Plano Pro</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-2">
                  €{isYearly ? SUBSCRIPTION_PLANS[2].yearlyPrice : SUBSCRIPTION_PLANS[2].price}
                </div>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-white/80">
                  /mês
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                  €{isYearly ? '2,688' : '3,228'}/ano
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Sales Analyst Agent</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Análise de chamadas de vendas</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Otimização de pipeline</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Previsão de receita</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Suporte prioritário</span>
                </li>
              </ul>

              <Button 
                onClick={() => handleSubscribe(SUBSCRIPTION_PLANS[2])}
                disabled={loading === 'pro'}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 group-hover:bg-white group-hover:text-purple-600"
              >
                {loading === 'pro' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>A processar...</span>
                  </div>
                ) : (
                  'Começar Agora'
                )}
              </Button>
            </div>

            {/* Plano Enterprise */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-2 flex flex-col group hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-700 hover:text-white transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-4">Plano Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-2">
                  €{isYearly ? SUBSCRIPTION_PLANS[3].yearlyPrice : SUBSCRIPTION_PLANS[3].price}
                </div>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-white/80">
                  /mês
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                  €{isYearly ? '4,500' : '5,400'}/ano
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Todos os agents atuais</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Agents futuros incluídos</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Scale Expert Agent</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Sales Analyst Agent</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Suporte 24/7</span>
                </li>
              </ul>

              <Button 
                onClick={() => handleSubscribe(SUBSCRIPTION_PLANS[3])}
                disabled={loading === 'enterprise'}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 group-hover:bg-white group-hover:text-purple-600"
              >
                {loading === 'enterprise' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>A processar...</span>
                  </div>
                ) : (
                  'Começar Agora'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
