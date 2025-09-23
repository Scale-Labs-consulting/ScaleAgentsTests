'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getPlanById } from '@/lib/subscription-plans'
import CustomCheckout from '@/components/custom-checkout'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function CustomCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState<string | null>(null)

  const planId = searchParams.get('plan')
  const billingPeriod = searchParams.get('billing') || 'monthly'

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (!planId) {
      setError('Plano não especificado')
      return
    }

    const selectedPlan = getPlanById(planId)
    if (!selectedPlan) {
      setError('Plano não encontrado')
      return
    }

    setPlan(selectedPlan)
  }, [user, planId, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">A carregar...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro de Checkout</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/pricing')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Voltar aos Preços
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">A carregar checkout...</span>
        </div>
      </div>
    )
  }

  return (
    <CustomCheckout 
      plan={plan} 
      billingPeriod={billingPeriod as 'monthly' | 'yearly'} 
      userId={user.id} 
    />
  )
}

export default function CustomCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">A carregar...</span>
        </div>
      </div>
    }>
      <CustomCheckoutContent />
    </Suspense>
  )
}
