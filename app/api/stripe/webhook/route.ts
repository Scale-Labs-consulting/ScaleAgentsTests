import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { getPlanByStripeProductId } from '@/lib/subscription-plans'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const customerId = session.customer as string
          const planId = session.metadata?.plan_id
          const userId = session.metadata?.user_id

          if (planId && userId) {
            // Update user subscription in database
            await supabase
              .from('profiles')
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_plan: planId,
                subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', userId)

            console.log(`Subscription created for user ${userId}: ${subscription.id}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user by Stripe customer ID
        const { data: user } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          // Get plan from subscription
          const productId = subscription.items.data[0]?.price?.product as string
          const plan = getPlanByStripeProductId(productId)

          await supabase
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              subscription_plan: plan?.id || null,
              subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', user.id)

          console.log(`Subscription updated for user ${user.id}: ${subscription.status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user by Stripe customer ID
        const { data: user } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              subscription_plan: null,
              subscription_current_period_end: null,
            })
            .eq('id', user.id)

          console.log(`Subscription canceled for user ${user.id}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          const customerId = subscription.customer as string

          // Get user by Stripe customer ID
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('stripe_customer_id', customerId)
            .single()

          if (user) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', user.id)

            console.log(`Payment succeeded for user ${user.id}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          const customerId = subscription.customer as string

          // Get user by Stripe customer ID
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('stripe_customer_id', customerId)
            .single()

          if (user) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', user.id)

            console.log(`Payment failed for user ${user.id}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
