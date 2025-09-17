'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const planId = searchParams.get('plan')
  const billingPeriod = searchParams.get('billing') || 'monthly'

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!planId) {
      setError('Plano não especificado')
      setLoading(false)
      return
    }

    // Get the plan and use the appropriate Stripe checkout URL
    const getCheckoutUrl = async () => {
      try {
        // Import the subscription plans to get the correct URL
        const { SUBSCRIPTION_PLANS } = await import('@/lib/subscription-plans')
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
        
        if (!plan) {
          setError('Plano não encontrado')
          setLoading(false)
          return
        }

        // Use the appropriate checkout URL based on billing period
        const url = billingPeriod === 'yearly' ? plan.stripeYearlyCheckoutUrl : plan.stripeCheckoutUrl
        
        setCheckoutUrl(url)
        // Auto-redirect after showing the page briefly
        setTimeout(() => {
          window.location.href = url
        }, 2000)
      } catch (error) {
        console.error('Error getting checkout URL:', error)
        setError('Erro ao obter URL de checkout')
      } finally {
        setLoading(false)
      }
    }

    getCheckoutUrl()
  }, [user, planId, billingPeriod, router])

  const handleGoBack = () => {
    router.push('/pricing')
  }

  const handleRedirectNow = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Redirecionamento para Pagamento
          </CardTitle>
          <CardDescription className="text-white/70">
            Será redirecionado para o Stripe Checkout em breve
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-white/70">A preparar o checkout...</p>
            </div>
          )}

          {error && (
            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Planos
              </Button>
            </div>
          )}

          {checkoutUrl && !loading && (
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-4" />
              <p className="text-white/70 mb-4">
                Redirecionamento automático em progresso...
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleRedirectNow}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                >
                  Ir para Pagamento Agora
                </Button>
                <Button 
                  onClick={handleGoBack}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar aos Planos
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-white/50">
            <p>Pagamento seguro processado pelo Stripe</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-md shadow-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-white/70">A carregar...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
