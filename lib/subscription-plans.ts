// Subscription plans configuration
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  monthlyYearlyPrice: number // Yearly price when paying monthly
  yearlyPrice: number // Yearly price when paying yearly
  yearlyMonthlyPrice: number // Monthly price when paying yearly
  currency: string
  interval: 'month' | 'year'
  features: string[]
  stripeProductId: string
  stripePriceId: string
  stripeYearlyPriceId: string
  stripeCheckoutUrl: string
  stripeYearlyCheckoutUrl: string
  popular?: boolean
  maxAnalyses?: number
  maxFileSize?: number | null // in MB, null means no limit
  priority?: 'low' | 'medium' | 'high'
  allowedAgents: string[] // Which agents this plan can access
  usageLimits?: {
    scaleExpertMessages?: number
    salesAnalystUploads?: number
  }
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    description: 'Experimente as funcionalidades básicas',
    price: 0,
    monthlyYearlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyPrice: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      '5 mensagens para Scale Expert',
      '2 uploads para Sales Analyst',
      'Funcionalidades básicas',
      'Suporte por email'
    ],
    stripeProductId: '',
    stripePriceId: '',
    stripeYearlyPriceId: '',
    stripeCheckoutUrl: '',
    stripeYearlyCheckoutUrl: '',
    maxAnalyses: 0,
    maxFileSize: null,
    priority: 'low',
    allowedAgents: ['scale-expert', 'sales-analyst'], // Both agents with limits
    usageLimits: {
      scaleExpertMessages: 5,
      salesAnalystUploads: 2
    }
  },
  {
    id: 'base',
    name: 'Plano Base',
    description: 'Perfeito para começar com análises básicas de vendas',
    price: 49,
    monthlyYearlyPrice: 588,
    yearlyPrice: 490,
    yearlyMonthlyPrice: 40.83,
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
    stripePriceId: 'price_1SBYwB2cuDLLRqcP2tiSxjNc', // Monthly price ID
    stripeYearlyPriceId: 'price_1SBYwB2cuDLLRqcPNMstuj5f', // Yearly price ID
    stripeCheckoutUrl: 'https://buy.stripe.com/test_fZu14g7wu8cQf0g2yabo409',
    stripeYearlyCheckoutUrl: 'https://buy.stripe.com/test_bJebIU2cabp2f0g8Wybo40a',
    maxAnalyses: 10,
    maxFileSize: null, // No file size limit
    priority: 'low',
    allowedAgents: ['scale-expert'] // Only Scale Expert
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    description: 'Para equipas que precisam de análises avançadas',
    price: 64,
    monthlyYearlyPrice: 768,
    yearlyPrice: 640,
    yearlyMonthlyPrice: 53.33,
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
    stripePriceId: 'price_1SBYzE2cuDLLRqcPjnI3VHUu', // Monthly price ID
    stripeYearlyPriceId: 'price_1SBYzP2cuDLLRqcPrZwgAZv6', // Yearly price ID
    stripeCheckoutUrl: 'https://buy.stripe.com/test_4gM7sE1863WA5pG4Gibo40b',
    stripeYearlyCheckoutUrl: 'https://buy.stripe.com/test_00weV6bMKgJm6tKegSbo40c',
    maxAnalyses: 50,
    maxFileSize: null, // No file size limit
    priority: 'medium',
    popular: true,
    allowedAgents: ['sales-analyst'] // Only Sales Analyst
  },
  {
    id: 'enterprise',
    name: 'Plano Enterprise',
    description: 'Para empresas que precisam de análises ilimitadas',
    price: 89,
    monthlyYearlyPrice: 1068,
    yearlyPrice: 890,
    yearlyMonthlyPrice: 74.17,
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
    stripePriceId: 'price_1SBZ1L2cuDLLRqcPPBIYxVe1', // Monthly price ID
    stripeYearlyPriceId: 'price_1SBZ1L2cuDLLRqcPnyO1XYrq', // Yearly price ID
    stripeCheckoutUrl: 'https://buy.stripe.com/test_28E7sEeYW3WAcS83Cebo40d',
    stripeYearlyCheckoutUrl: 'https://buy.stripe.com/test_4gM00cdUSgJmf0ggp0bo40e',
    maxAnalyses: -1, // -1 means unlimited
    maxFileSize: null, // No file size limit
    priority: 'high',
    allowedAgents: ['scale-expert', 'sales-analyst'] // Both agents
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

// Helper function to check if a user has access to a specific agent
export const hasAgentAccess = (userPlan: string | null, agentId: string): boolean => {
  // Free users (null plan) have access to both agents with limits
  if (!userPlan) return true
  
  const plan = getPlanById(userPlan)
  if (!plan) return false
  
  return plan.allowedAgents.includes(agentId)
}

// Helper function to get available agents for a plan
export const getAvailableAgents = (userPlan: string | null): string[] => {
  // Free users (null plan) have access to both agents with limits
  if (!userPlan) return ['scale-expert', 'sales-analyst']
  
  const plan = getPlanById(userPlan)
  if (!plan) return []
  
  return plan.allowedAgents
}

// Helper function to check if a user has reached their usage limit
export const hasReachedUsageLimit = (userPlan: string | null, agentId: string, currentUsage: number): boolean => {
  if (!userPlan) {
    // Free users have limits
    if (agentId === 'scale-expert') {
      return currentUsage >= 5
    } else if (agentId === 'sales-analyst') {
      return currentUsage >= 2
    }
    return true
  }
  
  const plan = getPlanById(userPlan)
  if (!plan || !plan.usageLimits) return false // Paid plans have no limits
  
  if (agentId === 'scale-expert' && plan.usageLimits.scaleExpertMessages) {
    return currentUsage >= plan.usageLimits.scaleExpertMessages
  } else if (agentId === 'sales-analyst' && plan.usageLimits.salesAnalystUploads) {
    return currentUsage >= plan.usageLimits.salesAnalystUploads
  }
  
  return false
}

// Helper function to get usage limit for a user
export const getUsageLimit = (userPlan: string | null, agentId: string): number => {
  if (!userPlan) {
    // Free users have limits
    if (agentId === 'scale-expert') return 5
    if (agentId === 'sales-analyst') return 2
    return 0
  }
  
  const plan = getPlanById(userPlan)
  if (!plan || !plan.usageLimits) return -1 // Unlimited for paid plans
  
  if (agentId === 'scale-expert' && plan.usageLimits.scaleExpertMessages) {
    return plan.usageLimits.scaleExpertMessages
  } else if (agentId === 'sales-analyst' && plan.usageLimits.salesAnalystUploads) {
    return plan.usageLimits.salesAnalystUploads
  }
  
  return -1 // Unlimited
}
