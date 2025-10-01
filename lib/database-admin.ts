import { supabaseAdmin } from './supabase-admin'
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
// ADMIN DATABASE OPERATIONS
// These functions use the service role key and bypass RLS
// Use ONLY in server-side API routes
// ========================================

// ========================================
// SCALE EXPERT OPERATIONS
// ========================================

export const createConversation = async (conversationData: ConversationInsert) => {
  const { data: conversation, error } = await supabaseAdmin
    .from('conversations')
    .insert(conversationData)
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw error
  }
  return conversation
}

export const getConversations = async (userId: string) => {
  const { data: conversations, error } = await supabaseAdmin
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

export const addMessage = async (messageData: MessageInsert) => {
  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert(messageData)
    .select()
    .single()

  if (error) {
    console.error('Error adding message:', error)
    throw error
  }
  return message
}

export const getMessages = async (conversationId: string) => {
  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return messages
}

export const updateConversationTitle = async (conversationId: string, title: string) => {
  const { data: conversation, error } = await supabaseAdmin
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select()
    .single()

  if (error) throw error
  return conversation
}

export const getConversationWithMessages = async (conversationId: string) => {
  const { data: conversation, error } = await supabaseAdmin
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
  const { error: messagesError } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)

  if (messagesError) {
    console.error('Error deleting messages:', messagesError)
    throw messagesError
  }

  // Then, delete the conversation itself
  const { error: conversationError } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (conversationError) {
    console.error('Error deleting conversation:', conversationError)
    throw conversationError
  }
}

export const archiveConversation = async (conversationId: string) => {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) throw error
}

// ========================================
// SALES ANALYST OPERATIONS
// ========================================

export const getSalesCalls = async (userId: string) => {
  const { data: salesCalls, error } = await supabaseAdmin
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
  const { data: salesCall, error } = await supabaseAdmin
    .from('sales_calls')
    .insert(salesCallData)
    .select()
    .single()

  if (error) throw error
  return salesCall
}

export const updateSalesCall = async (salesCallId: string, updates: Partial<SalesCall>) => {
  const { data: salesCall, error } = await supabaseAdmin
    .from('sales_calls')
    .update(updates)
    .eq('id', salesCallId)
    .select()
    .single()

  if (error) throw error
  return salesCall
}

// ========================================
// HR AGENT OPERATIONS
// ========================================

export const getHRCandidates = async (userId: string) => {
  const { data: candidates, error } = await supabaseAdmin
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
  const { data: candidate, error } = await supabaseAdmin
    .from('hr_candidates')
    .insert(candidateData)
    .select()
    .single()

  if (error) throw error
  return candidate
}

export const updateHRCandidate = async (candidateId: string, updates: Partial<HRCandidate>) => {
  const { data: candidate, error } = await supabaseAdmin
    .from('hr_candidates')
    .update(updates)
    .eq('id', candidateId)
    .select()
    .single()

  if (error) throw error
  return candidate
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
  const { data: usageLog, error } = await supabaseAdmin
    .from('usage_logs')
    .insert(usageData)
    .select()
    .single()

  if (error) throw error
  return usageLog
}

