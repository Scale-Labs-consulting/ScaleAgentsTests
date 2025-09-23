import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { getPlanByStripeProductId, getPlanById } from '@/lib/subscription-plans'
import Stripe from 'stripe'

// Helper function to identify subscription plan from Stripe subscription
function identifySubscriptionPlan(subscription: Stripe.Subscription): string | null {
  // Try to get plan from subscription items
  if (subscription.items.data[0]) {
    const productId = subscription.items.data[0].price.product as string
    const plan = getPlanByStripeProductId(productId)
    if (plan) {
      console.log(`✅ Plan identified by product ID ${productId}: ${plan.id}`)
      return plan.id
    }
    console.warn(`⚠️ No plan found for product ID: ${productId}`)
  }
  
  // Try to get plan from subscription metadata
  if (subscription.metadata?.plan_id) {
    const planId = subscription.metadata.plan_id
    const plan = getPlanById(planId)
    if (plan) {
      console.log(`✅ Plan identified by metadata: ${planId}`)
      return planId
    }
    console.warn(`⚠️ Invalid plan ID in metadata: ${planId}`)
  }
  
  console.warn(`⚠️ Could not identify plan for subscription: ${subscription.id}`)
  return null
}

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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Only handle subscription setup payments
        if (paymentIntent.metadata?.plan_id && paymentIntent.metadata?.user_id) {
          const userId = paymentIntent.metadata.user_id
          const planId = paymentIntent.metadata.plan_id
          const billingPeriod = paymentIntent.metadata.billing_period || 'monthly'
          
          console.log(`💳 Payment succeeded for user ${userId}, creating subscription...`)
          
          // Get plan details
          const plan = getPlanById(planId)
          if (!plan) {
            console.error('❌ Plan not found:', planId)
            break
          }
          
          // Get the appropriate price ID
          const priceId = billingPeriod === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId
          
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
          
          // Update user subscription in database
          const updateData = {
            stripe_customer_id: paymentIntent.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_plan: planId,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Error updating user subscription:', updateError)
          } else {
            console.log(`✅ Subscription created for user ${userId}: ${subscription.id}`)
          }
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const customerId = session.customer as string
          let planId = session.metadata?.plan_id
          let userId = session.metadata?.user_id

          // If metadata is not available (direct checkout URLs), try to get user by client_reference_id or customer
          if (!userId) {
            userId = session.client_reference_id
          }
          
          // If still no user ID, try to find user by customer ID or email
          if (!userId) {
            const { data: user } = await supabase
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single()
            
            if (user) {
              userId = user.id
            } else {
              // Try to find by email
              const customer = await stripe.customers.retrieve(customerId)
              if ('email' in customer && customer.email) {
                const { data: userByEmail } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('email', customer.email)
                  .single()
                
                if (userByEmail) {
                  userId = userByEmail.id
                }
              }
            }
          }

          // If no planId in metadata, try to determine from the subscription
          if (!planId) {
            planId = identifySubscriptionPlan(subscription)
          }

          if (userId) {
            console.log(`🎉 Processing subscription for user ${userId}, plan: ${planId}`)
            
            // Update user subscription in database
            const updateData: any = {
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }
            
            // Set the subscription plan if identified
            if (planId) {
              updateData.subscription_plan = planId
            }

            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', userId)

            if (updateError) {
              console.error('❌ Error updating user subscription:', updateError)
            } else {
              console.log(`✅ Subscription created for user ${userId}: ${subscription.id}`)
            }
          } else {
            console.error('❌ Could not identify user for subscription:', subscription.id)
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
          // Identify the subscription plan
          const planId = identifySubscriptionPlan(subscription)

          const updateData: any = {
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }

          // Update subscription plan if we can identify it
          if (planId) {
            updateData.subscription_plan = planId
          }

          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)

          console.log(`Subscription updated for user ${user.id}: ${subscription.status}, plan: ${planId || 'unchanged'}`)
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
            // Identify the subscription plan
            const planId = identifySubscriptionPlan(subscription)

            const updateData: any = {
              subscription_status: 'active',
              subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }

            // Update subscription plan if we can identify it
            if (planId) {
              updateData.subscription_plan = planId
            }

            await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', user.id)

            console.log(`Payment succeeded for user ${user.id}, plan: ${planId || 'unchanged'}`)
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
            // Identify the subscription plan to ensure we maintain plan info even when payment fails
            const planId = identifySubscriptionPlan(subscription)

            const updateData: any = {
              subscription_status: 'past_due',
            }

            // Keep the subscription plan even if payment failed
            if (planId) {
              updateData.subscription_plan = planId
            }

            await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', user.id)

            console.log(`Payment failed for user ${user.id}, plan: ${planId || 'unchanged'}`)
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
