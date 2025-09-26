import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { getPlanById } from '@/lib/subscription-plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { planId, billingPeriod = 'monthly', userId } = await request.json()
    
    console.log('🛒 Creating payment intent for:', { planId, userId, billingPeriod })
    
    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios em falta: planId e userId' },
        { status: 400 }
      )
    }

    // Create Supabase client to get user details
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user details
    console.log('🔍 Looking up user:', userId)
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('👤 User lookup result:', { user: !!user, error: userError?.message })

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      )
    }
    
    // Get plan details
    console.log('📋 Looking up plan:', planId)
    const plan = getPlanById(planId)
    if (!plan) {
      console.error('❌ Plan not found:', planId)
      return NextResponse.json({ error: 'ID do plano inválido' }, { status: 400 })
    }
    console.log('✅ Plan found:', plan.name)

    // Calculate amount - VAT is INCLUDED in the price (like X Premium)
    const totalPrice = billingPeriod === 'yearly' 
      ? plan.yearlyPrice * 12  // Convert monthly equivalent to annual total
      : plan.price
    
    // The displayed price already includes VAT, so we use it directly
    const totalAmount = Math.round(totalPrice * 100) // Convert to cents
    
    console.log('💰 Pricing calculation:', {
      totalPrice,
      totalAmountCents: totalAmount,
      totalAmountEuros: totalAmount / 100,
      billingPeriod
    })

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id
    console.log('💳 Existing customer ID:', customerId)

    // Validate existing customer ID or create new one
    if (customerId) {
      try {
        // Verify the customer exists in Stripe
        console.log('🔍 Validating existing customer ID in Stripe...')
        const existingCustomer = await stripe.customers.retrieve(customerId)
        console.log('✅ Existing customer validated:', existingCustomer.id)
      } catch (customerError: any) {
        console.warn('⚠️ Existing customer ID is invalid:', customerError.message)
        console.log('🧹 Clearing invalid customer ID from database')
        
        // Clear the invalid customer ID from database
        const { error: clearError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: null })
          .eq('id', userId)
        
        if (clearError) {
          console.error('❌ Failed to clear invalid customer ID:', clearError)
        } else {
          console.log('✅ Invalid customer ID cleared from database')
        }
        
        // Set to null so we create a new one
        customerId = null
      }
    }

    if (!customerId) {
      console.log('🆕 Creating new Stripe customer for user:', userId)
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
          metadata: {
            supabase_user_id: userId,
          },
        })

        customerId = customer.id
        console.log('✅ Stripe customer created:', customerId)

        // Update user with Stripe customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)
        
        if (updateError) {
          console.error('❌ Failed to update user with customer ID:', updateError)
          // Continue anyway, we can still create the payment intent
        } else {
          console.log('✅ User updated with customer ID')
        }
      } catch (stripeError) {
        console.error('❌ Stripe customer creation failed:', stripeError)
        throw stripeError
      }
    }

    // Create the payment intent for subscription setup
    console.log('💳 Creating payment intent with amount:', totalAmount, 'cents')
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      customer: customerId,
      setup_future_usage: 'off_session', // For future subscription payments
      metadata: {
        plan_id: planId,
        user_id: userId,
        billing_period: billingPeriod,
        plan_name: plan.name,
      },
      description: `${plan.name} - ${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
      receipt_email: user.email,
      payment_method_types: ['card'], // Only allow card payments
      // Remove automatic_payment_methods since we're specifying payment_method_types
    })
    
    console.log('✅ Payment intent created:', paymentIntent.id)
    
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      customerId: customerId
    })

  } catch (error) {
    console.error('❌ Error creating payment intent:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({ 
      error: 'Falha ao criar intenção de pagamento',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
