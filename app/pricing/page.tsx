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
        return 'from-blue-500 to-cyan-600'
      case 'pro':
        return 'from-purple-600 to-violet-600'
      case 'enterprise':
        return 'from-purple-700 to-pink-600'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-white hover:bg-white/10 border border-white/20 hover:border-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Escolha o seu Plano
            </h1>
            <p className="text-white/70 text-lg">
              Desbloqueie o poder da análise de vendas com IA
            </p>
          </div>
          
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative bg-white/10 border-white/20 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-purple-500/30 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-1 text-xs font-semibold shadow-lg">
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${getPlanGradient(plan.id)} flex items-center justify-center text-white shadow-lg`}>
                  {getPlanIcon(plan.id)}
                </div>
                
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                
                <CardDescription className="text-white/70 text-base mb-4">
                  {plan.description}
                </CardDescription>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <span className="text-4xl font-bold text-white">
                    €{plan.price}
                  </span>
                  <span className="text-white/60 ml-2 text-base">
                    /{plan.interval === 'month' ? 'mês' : 'ano'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold text-base mb-3">Funcionalidades Incluídas</h3>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/90 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Limits */}
                <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                  <h4 className="text-white font-semibold text-base mb-3">Limites do Plano</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Análises por mês:</span>
                    <span className="text-white font-semibold">
                      {plan.maxAnalyses === -1 ? 'Ilimitadas' : plan.maxAnalyses}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Tamanho máximo:</span>
                    <span className="text-white font-semibold">
                      {plan.maxFileSize ? `${plan.maxFileSize}MB` : 'Sem limite'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Prioridade:</span>
                    <span className="text-white font-semibold capitalize">
                      {plan.priority === 'low' ? 'Normal' : plan.priority === 'medium' ? 'Alta' : 'Máxima'}
                    </span>
                  </div>
                </div>
                
                {/* Subscribe Button */}
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 text-base font-semibold transition-all duration-300 shadow-lg ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 hover:shadow-purple-500/25'
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 hover:shadow-slate-500/25'
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
