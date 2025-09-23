// Subscription plans configuration
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  yearlyPrice: number
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
    yearlyPrice: 0,
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
    price: 139,
    yearlyPrice: 116,
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
    stripePriceId: 'price_1S7YT92cuDLLRqcPYvJvQMhw', // Monthly price ID
    stripeYearlyPriceId: 'price_1S7YUC2cuDLLRqcPouPsZAeP', // Yearly price ID
    stripeCheckoutUrl: 'https://buy.stripe.com/test_7sY6oA6sqakYdWcfkWbo401',
    stripeYearlyCheckoutUrl: 'https://buy.stripe.com/test_cNicMY9ECct67xO8Wybo406',
    maxAnalyses: 10,
    maxFileSize: null, // No file size limit
    priority: 'low',
    allowedAgents: ['scale-expert'] // Only Scale Expert
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    description: 'Para equipas que precisam de análises avançadas',
    price: 269,
    yearlyPrice: 224,
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
    stripePriceId: 'price_1S7Z5J2cuDLLRqcPkdwXnYzf', // Monthly price ID
    stripeYearlyPriceId: 'price_1S7Z5a2cuDLLRqcPQN2Ky9hU', // Yearly price ID
    stripeCheckoutUrl: 'https://buy.stripe.com/test_cNi7sE04278M05m6Oqbo402',
    stripeYearlyCheckoutUrl: 'https://buy.stripe.com/test_eVqdR2cQO64IdWcdcObo407',
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
    price: 450,
    yearlyPrice: 375,
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
    stripePriceId: 'price_1S7YQO2cuDLLRqcPBH2rRMhj', // Monthly price ID
    stripeYearlyPriceId: 'price_1S7YQw2cuDLLRqcPHszvueiT', // Yearly price ID
    stripeCheckoutUrl: 'https://buy.stripe.com/test_eVqbIU0429gUaK0fkWbo403',
    stripeYearlyCheckoutUrl: 'https://buy.stripe.com/test_bJe4gs9EC8cQg4kb4Gbo404',
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
