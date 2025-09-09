'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown, ArrowLeft } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

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
      // Redirect to custom checkout page
      router.push(`/checkout?plan=${plan.id}`)
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

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'base':
        return <Zap className="w-6 h-6" />
      case 'pro':
        return <Star className="w-6 h-6" />
      case 'enterprise':
        return <Crown className="w-6 h-6" />
      default:
        return <Zap className="w-6 h-6" />
    }
  }

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'base':
        return 'from-blue-500 to-cyan-500'
      case 'pro':
        return 'from-purple-500 to-violet-500'
      case 'enterprise':
        return 'from-orange-500 to-red-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Escolha o seu Plano
            </h1>
            <p className="text-white/70 text-lg">
              Desbloqueie o poder da análise de vendas com IA
            </p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative bg-white/10 border-white/20 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-purple-500/25' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-1">
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${getPlanGradient(plan.id)} flex items-center justify-center text-white`}>
                  {getPlanIcon(plan.id)}
                </div>
                
                <CardTitle className="text-2xl font-bold text-white">
                  {plan.name}
                </CardTitle>
                
                <CardDescription className="text-white/70 text-base">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    €{plan.price}
                  </span>
                  <span className="text-white/60 ml-2">
                    /{plan.interval === 'month' ? 'mês' : 'ano'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Limits */}
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Análises por mês:</span>
                    <span className="text-white font-medium">
                      {plan.maxAnalyses === -1 ? 'Ilimitadas' : plan.maxAnalyses}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Tamanho máximo:</span>
                    <span className="text-white font-medium">
                      {plan.maxFileSize}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Prioridade:</span>
                    <span className="text-white font-medium capitalize">
                      {plan.priority}
                    </span>
                  </div>
                </div>
                
                {/* Subscribe Button */}
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                      : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                  }`}
                >
                  {loading === plan.id ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>A processar...</span>
                    </div>
                  ) : (
                    `Subscrever ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}
