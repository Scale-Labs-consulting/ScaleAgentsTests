import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, billingPeriod = 'monthly' } = await request.json()
    
    console.log('🛒 Creating checkout session for:', { planId, userId, billingPeriod })
    
    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: planId and userId' },
        { status: 400 }
      )
    }

    // Create Supabase client to get user details
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Import subscription plans to get the correct price ID
    const { SUBSCRIPTION_PLANS } = await import('@/lib/subscription-plans')
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // For now, use the direct checkout URLs since the price IDs need to be configured
    // This is a temporary solution until you set up the proper Stripe price IDs
    const checkoutUrl = billingPeriod === 'yearly' ? plan.stripeYearlyCheckoutUrl : plan.stripeCheckoutUrl
    
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Checkout URL not configured for this plan' }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id

    // Validate existing customer ID or create new one
    if (customerId) {
      try {
        // Verify the customer exists in Stripe
        console.log('🔍 Validating existing customer ID in Stripe...')
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing customer validated')
      } catch (customerError: any) {
        console.warn('⚠️ Existing customer ID is invalid:', customerError.message)
        console.log('🧹 Clearing invalid customer ID from database')
        
        // Clear the invalid customer ID from database
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: null })
          .eq('id', userId)
        
        // Set to null so we create a new one
        customerId = null
      }
    }

    if (!customerId) {
      console.log('🆕 Creating new Stripe customer for user:', userId)
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
        metadata: {
          supabase_user_id: userId,
        },
      })

      customerId = customer.id

      // Update user with Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // For now, return the direct checkout URL with customer info and success URL
    // This will work until you configure proper Stripe price IDs
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment-success?success=true`
    const urlWithCustomer = `${checkoutUrl}?client_reference_id=${userId}&prefilled_email=${encodeURIComponent(user.email)}&success_url=${encodeURIComponent(successUrl)}`
    
    console.log('✅ Checkout URL created:', urlWithCustomer)
    
    return NextResponse.json({ 
      sessionId: null, // Not using session for direct URLs
      url: urlWithCustomer,
      customerId: customerId
    })

  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
