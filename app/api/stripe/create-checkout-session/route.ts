import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, billing = 'monthly' } = await request.json()
    
    // Import subscription plans to get the correct price ID
    const { SUBSCRIPTION_PLANS } = await import('@/lib/subscription-plans')
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Use the appropriate price ID based on billing period
    const priceId = billing === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId

    // Create checkout session with custom success and cancel URLs
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: userId, // You can get this from your user data
      metadata: {
        planId: planId,
        userId: userId,
      },
      // Add custom fields for better UX
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
