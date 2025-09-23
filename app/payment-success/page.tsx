'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Check if we have success parameters
    const success = searchParams.get('success')
    const paymentIntent = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')
    
    // If not a successful payment, redirect to dashboard
    if (success !== 'true' || !(paymentIntent || redirectStatus === 'succeeded')) {
      router.push('/dashboard')
      return
    }

    // Create subscription if we have a payment intent
    const createSubscription = async () => {
      if (paymentIntent) {
        try {
          console.log('🔄 Creating subscription for payment intent:', paymentIntent)
          
          const response = await fetch('/api/stripe/create-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent
            })
          })

          const data = await response.json()
          
          if (response.ok) {
            console.log('✅ Subscription created successfully:', data)
          } else {
            console.error('❌ Failed to create subscription:', data.error)
          }
        } catch (error) {
          console.error('❌ Error creating subscription:', error)
        }
      }
    }

    // Create subscription first, then start countdown
    createSubscription()

    // Countdown to redirect to dashboard
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pagamento Realizado com Sucesso! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            A sua subscrição foi ativada com sucesso. Bem-vindo ao ScaleAgents!
          </p>
        </div>

        {/* Success Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Subscrição Ativada</h3>
                <p className="text-gray-600">O seu plano foi ativado e está pronto para usar</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Acesso Completo</h3>
                <p className="text-gray-600">Pode agora aceder a todas as funcionalidades premium</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Comece Agora</h3>
                <p className="text-gray-600">Explore os nossos agentes de IA e otimize o seu negócio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Ir para o Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <p className="text-gray-500 text-sm">
            Será redirecionado automaticamente em {countdown} segundos
          </p>
        </div>

        {/* Logo */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center space-x-3">
            <Image
              src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-black.png"
              alt="Scale Labs"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Obrigado por confiar na Scale Labs!
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
