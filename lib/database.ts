import { supabase } from './supabase'
import type { 
  Agent, 
  Conversation, 
  Message, 
  SalesCall, 
  HRCandidate,
  AgentInsert,
  ConversationInsert,
  MessageInsert,
  SalesCallInsert,
  HRCandidateInsert
} from '@/types/database'

// ========================================
// AGENT OPERATIONS
// ========================================

export const getAgents = async (userId: string) => {
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return agents
}

export const createAgent = async (agentData: AgentInsert) => {
  const { data: agent, error } = await supabase
    .from('agents')
    .insert(agentData)
    .select()
    .single()

  if (error) throw error
  return agent
}

export const updateAgent = async (agentId: string, updates: Partial<Agent>) => {
  const { data: agent, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single()

  if (error) throw error
  return agent
}

// ========================================
// SCALE EXPERT OPERATIONS
// ========================================

export const getConversations = async (userId: string) => {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      agents (
        name,
        type
      )
    `)
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return conversations
}

export const createConversation = async (conversationData: ConversationInsert) => {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert(conversationData)
    .select()
    .single()

  if (error) throw error
  return conversation
}

export const getMessages = async (conversationId: string) => {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return messages
}

export const addMessage = async (messageData: MessageInsert) => {
  const { data: message, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()

  if (error) throw error
  return message
}

export const updateConversationTitle = async (conversationId: string, title: string) => {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select()
    .single()

  if (error) throw error
  return conversation
}

export const getConversationWithMessages = async (conversationId: string) => {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (
        id,
        role,
        content,
        tokens_used,
        metadata,
        created_at
      )
    `)
    .eq('id', conversationId)
    .single()

  if (error) throw error
  return conversation
}

export const deleteConversation = async (conversationId: string) => {
  // First, delete all messages associated with this conversation
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)

  if (messagesError) {
    console.error('Error deleting messages:', messagesError)
    throw messagesError
  }

  // Then, delete the conversation itself
  const { error: conversationError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (conversationError) {
    console.error('Error deleting conversation:', conversationError)
    throw conversationError
  }
}

export const archiveConversation = async (conversationId: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) throw error
}

// ========================================
// SALES ANALYST OPERATIONS
// ========================================

export const getSalesCalls = async (userId: string) => {
  const { data: salesCalls, error } = await supabase
    .from('sales_calls')
    .select(`
      *,
      agents (
        name,
        type
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return salesCalls
}

export const createSalesCall = async (salesCallData: SalesCallInsert) => {
  const { data: salesCall, error } = await supabase
    .from('sales_calls')
    .insert(salesCallData)
    .select()
    .single()

  if (error) throw error
  return salesCall
}

export const updateSalesCall = async (salesCallId: string, updates: Partial<SalesCall>) => {
  const { data: salesCall, error } = await supabase
    .from('sales_calls')
    .update(updates)
    .eq('id', salesCallId)
    .select()
    .single()

  if (error) throw error
  return salesCall
}

export const getSalesFeedbackPrompts = async (userId: string) => {
  const { data: prompts, error } = await supabase
    .from('sales_feedback_prompts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) throw error
  return prompts
}

// ========================================
// HR AGENT OPERATIONS
// ========================================

export const getHRCandidates = async (userId: string) => {
  const { data: candidates, error } = await supabase
    .from('hr_candidates')
    .select(`
      *,
      agents (
        name,
        type
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return candidates
}

export const createHRCandidate = async (candidateData: HRCandidateInsert) => {
  const { data: candidate, error } = await supabase
    .from('hr_candidates')
    .insert(candidateData)
    .select()
    .single()

  if (error) throw error
  return candidate
}

export const updateHRCandidate = async (candidateId: string, updates: Partial<HRCandidate>) => {
  const { data: candidate, error } = await supabase
    .from('hr_candidates')
    .update(updates)
    .eq('id', candidateId)
    .select()
    .single()

  if (error) throw error
  return candidate
}

export const getHREvaluationCriteria = async (userId: string) => {
  const { data: criteria, error } = await supabase
    .from('hr_evaluation_criteria')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) throw error
  return criteria
}

// ========================================
// USAGE TRACKING
// ========================================

export const logUsage = async (usageData: {
  user_id: string
  agent_id: string
  action_type: string
  tokens_used?: number
  cost?: number
  metadata?: Record<string, any>
}) => {
  const { data: usageLog, error } = await supabase
    .from('usage_logs')
    .insert(usageData)
    .select()
    .single()

  if (error) throw error
  return usageLog
}

export const getCredits = async (userId: string) => {
  const { data: credits, error } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return credits
}

export const updateCredits = async (userId: string, updates: {
  credits_remaining?: number
  credits_used?: number
  reset_date?: string
}) => {
  const { data: credits, error } = await supabase
    .from('credits')
    .upsert({
      user_id: userId,
      ...updates
    })
    .select()
    .single()

  if (error) throw error
  return credits
}
