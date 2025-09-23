import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { getPlanById } from '@/lib/subscription-plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()
    
    console.log('🔄 Creating subscription for payment intent:', paymentIntentId)
    
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    console.log('💳 Payment intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment intent has not succeeded' },
        { status: 400 }
      )
    }

    // Check if we have the required metadata
    if (!paymentIntent.metadata?.plan_id || !paymentIntent.metadata?.user_id) {
      return NextResponse.json(
        { error: 'Payment intent missing required metadata (plan_id, user_id)' },
        { status: 400 }
      )
    }

    const userId = paymentIntent.metadata.user_id
    const planId = paymentIntent.metadata.plan_id
    const billingPeriod = paymentIntent.metadata.billing_period || 'monthly'

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get plan details
    const plan = getPlanById(planId)
    if (!plan) {
      console.error('❌ Plan not found:', planId)
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Get the appropriate price ID
    const priceId = billingPeriod === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId

    console.log('📋 Creating subscription with:', {
      customer: paymentIntent.customer,
      priceId,
      planId,
      billingPeriod
    })

    // Create subscription using the payment method from the payment intent
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer as string,
      items: [{
        price: priceId,
      }],
      default_payment_method: paymentIntent.payment_method as string,
      metadata: {
        plan_id: planId,
        user_id: userId,
        billing_period: billingPeriod,
      },
    })

    console.log('✅ Subscription created:', subscription.id)

    // Update user subscription in database
    const updateData = {
      stripe_customer_id: paymentIntent.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_plan: planId,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }

    console.log('💾 Updating user profile with:', updateData)

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user subscription in database' },
        { status: 500 }
      )
    }

    console.log(`✅ Subscription created and user updated for user ${userId}: ${subscription.id}`)

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_id: planId,
        current_period_end: subscription.current_period_end
      }
    })

  } catch (error) {
    console.error('❌ Error creating subscription:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

