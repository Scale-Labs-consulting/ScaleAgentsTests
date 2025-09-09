// Subscription plans configuration
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  stripeProductId: string
  stripePriceId: string
  stripeCheckoutUrl: string
  popular?: boolean
  maxAnalyses?: number
  maxFileSize?: number | null // in MB, null means no limit
  priority?: 'low' | 'medium' | 'high'
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'base',
    name: 'Plano Base',
    description: 'Perfeito para começar com análises básicas de vendas',
    price: 139,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Até 10 análises por mês',
      'Ficheiros de qualquer tamanho',
      'Análise básica de vendas',
      'Relatórios em PDF',
      'Suporte por email',
      'Histórico de análises'
    ],
    stripeProductId: 'prod_SzaQSOBw40d82a',
    stripePriceId: 'price_base_monthly', // You'll need to get this from Stripe
    stripeCheckoutUrl: 'https://buy.stripe.com/test_7sY6oA6sqakYdWcfkWbo401',
    maxAnalyses: 10,
    maxFileSize: null, // No file size limit
    priority: 'low'
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    description: 'Para equipas que precisam de análises avançadas',
    price: 269,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Até 50 análises por mês',
      'Ficheiros de qualquer tamanho',
      'Análise avançada de vendas',
      'Relatórios detalhados',
      'Suporte prioritário',
      'Histórico completo',
      'Exportação de dados',
      'Análise de tendências'
    ],
    stripeProductId: 'prod_SzaQ0Rm5hs2psP',
    stripePriceId: 'price_pro_monthly', // You'll need to get this from Stripe
    stripeCheckoutUrl: 'https://buy.stripe.com/test_cNi7sE04278M05m6Oqbo402',
    maxAnalyses: 50,
    maxFileSize: null, // No file size limit
    priority: 'medium',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Plano Enterprise',
    description: 'Para empresas que precisam de análises ilimitadas',
    price: 450,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Análises ilimitadas',
      'Ficheiros de qualquer tamanho',
      'Análise premium de vendas',
      'Relatórios personalizados',
      'Suporte dedicado',
      'API access',
      'Integração com CRM',
      'Análise de equipa',
      'Dashboard avançado',
      'White-label options'
    ],
    stripeProductId: 'prod_SzaQRovKIXLDGr',
    stripePriceId: 'price_enterprise_monthly', // You'll need to get this from Stripe
    stripeCheckoutUrl: 'https://buy.stripe.com/test_eVqbIU0429gUaK0fkWbo403',
    maxAnalyses: -1, // -1 means unlimited
    maxFileSize: null, // No file size limit
    priority: 'high'
  }
]

export const getPlanById = (id: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id)
}

export const getPlanByStripeProductId = (stripeProductId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.stripeProductId === stripeProductId)
}

export const getPlanByStripeCheckoutUrl = (checkoutUrl: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.stripeCheckoutUrl === checkoutUrl)
}
