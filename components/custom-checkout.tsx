'use client'

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, CreditCard, Shield } from 'lucide-react'
import Image from 'next/image'
import { SubscriptionPlan } from '@/lib/subscription-plans'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CustomCheckoutProps {
  plan: SubscriptionPlan
  billingPeriod: 'monthly' | 'yearly'
  userId: string
}

interface CheckoutFormProps {
  plan: SubscriptionPlan
  billingPeriod: 'monthly' | 'yearly'
  clientSecret: string
  userId: string
  onSuccess: () => void
}

function CheckoutForm({ plan, billingPeriod, clientSecret, userId, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<{name: string, email: string} | null>(null)
  const [paymentSucceeded, setPaymentSucceeded] = useState(false)

  // Get user info for billing details
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: user } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .single()
        
        if (user) {
          const name = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.email
          setUserInfo({ name, email: user.email })
        }
      } catch (error) {
        console.error('Error getting user info:', error)
        setUserInfo({ name: 'ScaleAgents Customer', email: '' })
      }
    }
    getUserInfo()
  }, [userId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?success=true`,
        payment_method_data: {
          billing_details: {
            name: userInfo?.name || 'ScaleAgents Customer',
            email: userInfo?.email || undefined,
            phone: '', // Required when fields.billingDetails is 'never'
            address: {
              country: 'PT', // Default to Portugal since your app is in Portuguese
              line1: '',
              line2: '',
              city: '',
              state: '',
              postal_code: '',
            }
          }
        }
      },
    })

    if (result.error) {
      setError(result.error.message || 'An error occurred')
      setIsLoading(false)
    } else {
      // Payment succeeded, show confirmation
      setPaymentSucceeded(true)
      setIsLoading(false)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        onSuccess()
      }, 3000)
    }
  }

  // Calculate the correct price based on billing period
  const totalPrice = billingPeriod === 'yearly' 
    ? plan.yearlyPrice * 12  // Convert monthly equivalent to annual total
    : plan.price
  const savings = billingPeriod === 'yearly' ? ((plan.price * 12) - (plan.yearlyPrice * 12)) : 0
  
  // VAT is INCLUDED in the price (like X Premium)
  // Total price already includes VAT, so we calculate backwards
  const priceExcludingVAT = totalPrice / 1.23  // Remove VAT to get base price
  const vatAmount = totalPrice - priceExcludingVAT
  const totalAmount = totalPrice  // Total is the same as the displayed price

  // Show success screen if payment succeeded
  if (paymentSucceeded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-400">A sua subscrição foi ativada com sucesso.</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-medium mb-2">Detalhes da Subscrição</h3>
            <p className="text-sm text-gray-400 mb-1">{plan.name}</p>
            <p className="text-lg font-semibold">€{totalPrice.toFixed(2)}/{billingPeriod === 'yearly' ? 'ano' : 'mês'}</p>
          </div>
          <p className="text-sm text-gray-500 mt-6">A redirecioná-lo para o dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Sidebar - Exact X Premium Layout */}
      <div className="w-1/2 bg-black text-white">
        {/* Header */}
        <header className="bg-black" style={{ backgroundColor: 'rgb(0, 0, 0)' }}>
          <div className="flex items-stretch p-4">
            <div className="flex items-center">
              <button 
                onClick={() => window.history.back()}
                className="group flex items-center transition-all duration-200 px-3 py-2"
              >
                {/* Logo visible by default, hidden on hover */}
                <div className="group-hover:opacity-0 group-hover:scale-95 transition-all duration-200 flex items-center">
                  <Image
                    src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
                    alt="ScaleAgents"
                    width={120}
                    height={36}
                    className="h-6 w-auto"
                  />
                </div>
                
                {/* Back text hidden by default, visible on hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 flex items-center text-white">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.417 7H15a1 1 0 0 1 0 2H3.417l4.591 4.591a1 1 0 0 1-1.415 1.416l-6.3-6.3a1 1 0 0 1 0-1.414l6.3-6.3A1 1 0 0 1 8.008 2.41z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-sm font-medium">Voltar atrás</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Product Summary */}
        <div className="px-8 py-6">
          <div className="mb-8">
            <span className="text-gray-400 text-base font-medium">Subscrever {plan.name}</span>
            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-5xl font-semibold text-white">€{totalPrice.toFixed(2)}</span>
                <div className="ml-4">
                  <span className="text-sm text-gray-400">
                    por<br className="block" />{billingPeriod === 'yearly' ? 'ano' : 'mês'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <section className="px-8 py-6">
          <ul>
            <li className="mb-4">
              <div className="flex items-start">
                <div className="flex-1 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">{plan.name}</div>
                    <div className="text-xs text-gray-400 mb-1">ScaleAgents</div>
                    <div className="text-xs text-gray-400">
                      {billingPeriod === 'yearly' ? 'Faturado anualmente' : 'Faturado mensalmente'}
                    </div>
                  </div>
                  <div className="ml-2 text-sm font-medium text-white">
                    €{totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </li>
          </ul>

          {/* Footer Breakdown */}
          <div className="border-t border-gray-800 pt-4">
            <div>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-white">Subtotal</span>
                <span className="text-sm font-semibold text-white">€{priceExcludingVAT.toFixed(2)}</span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400">VAT</span>
                    <svg className="w-3 h-3 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M6 12C9.28235 12 12 9.28235 12 6C12 2.72353 9.27647 0 5.99412 0C2.71765 0 0 2.72353 0 6C0 9.28235 2.72353 12 6 12ZM6 11C3.22353 11 1.00588 8.77647 1.00588 6C1.00588 3.22941 3.21765 1 5.99412 1C8.77059 1 10.9941 3.22941 11 6C11.0059 8.77647 8.77647 11 6 11ZM5.94706 3.90588C6.37647 3.90588 6.71177 3.56471 6.71177 3.14118C6.71177 2.71176 6.37647 2.37059 5.94706 2.37059C5.52353 2.37059 5.18235 2.71176 5.18235 3.14118C5.18235 3.56471 5.52353 3.90588 5.94706 3.90588ZM4.97059 9.23529H7.36471C7.60588 9.23529 7.79412 9.06471 7.79412 8.82353C7.79412 8.59412 7.60588 8.41177 7.36471 8.41177H6.63529V5.41765C6.63529 5.1 6.47647 4.88824 6.17647 4.88824H5.18235C4.94118 4.88824 4.75294 5.07059 4.75294 5.3C4.75294 5.54118 4.94118 5.71176 5.18235 5.71176H5.7V8.41177H4.97059C4.72941 8.41177 4.54118 8.59412 4.54118 8.82353C4.54118 9.06471 4.72941 9.23529 4.97059 9.23529Z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-400">€{vatAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-gray-800 pt-4">
                <span className="text-sm font-medium text-white">Total a pagar hoje</span>
                <span className="text-base font-semibold text-white">€{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Side - Payment Form */}
      <div className="w-1/2 bg-white p-8 flex flex-col">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pagar com cartão</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card'],
                fields: {
                  billingDetails: 'never'
                }
              }}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!stripe || isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-md transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A processar...</span>
                </div>
              ) : (
                'Pagar e subscrever'
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Ao confirmar a subscrição, o senhor concede permissão à ScaleAgents para efetuar cobranças conforme as condições estipuladas, até que ocorra o cancelamento.
              </p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span>Powered by <strong>stripe</strong></span>
              <span>|</span>
              <span>Termos</span>
              <span>Privacidade</span>
              <span>Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomCheckout({ plan, billingPeriod, userId }: CustomCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        console.log('🚀 Creating payment intent with:', { planId: plan.id, billingPeriod, userId })
        
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: plan.id,
            billingPeriod,
            userId
          }),
        })

        console.log('📡 Response status:', response.status)
        console.log('📡 Response ok:', response.ok)
        
        let data
        try {
          data = await response.json()
          console.log('📦 Response data:', data)
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError)
          const text = await response.text()
          console.error('📄 Raw response:', text)
          throw new Error('Resposta inválida do servidor')
        }
        
        if (!response.ok) {
          console.error('Payment intent creation failed:', data)
          throw new Error(data.error || data.details || 'Falha ao criar intenção de pagamento')
        }

        if (!data.clientSecret) {
          console.error('❌ No client secret in response:', data)
          throw new Error('Resposta inválida: client secret em falta')
        }

        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error('Error creating payment intent:', error)
        setError(error instanceof Error ? error.message : 'Ocorreu um erro')
      }
    }

    createPaymentIntent()
  }, [plan.id, billingPeriod, userId])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.history.back()}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">A preparar checkout...</span>
        </div>
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7c3aed',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm
        plan={plan}
        billingPeriod={billingPeriod}
        clientSecret={clientSecret}
        userId={userId}
        onSuccess={() => {
          window.location.href = '/dashboard?success=true'
        }}
      />
    </Elements>
  )
}
