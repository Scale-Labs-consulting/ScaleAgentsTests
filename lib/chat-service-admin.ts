import { 
  getConversations, 
  createConversation, 
  getMessages, 
  addMessage, 
  updateConversationTitle,
  getConversationWithMessages,
  deleteConversation,
  archiveConversation
} from './database-admin'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used?: number
  metadata?: Record<string, any>
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  title: string | null
  status: 'active' | 'archived' | 'deleted'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  messages?: ChatMessage[]
}

/**
 * Admin ChatService - uses service role key and bypasses RLS
 * Use ONLY in server-side API routes
 */
export class ChatServiceAdmin {
  private userId: string
  private agentId: string

  constructor(userId: string, agentId: string) {
    this.userId = userId
    this.agentId = agentId
  }

  // Get all conversations for the user
  async getConversations(): Promise<Conversation[]> {
    try {
      const conversations = await getConversations(this.userId)
      return conversations.filter(conv => conv.agent_id === this.agentId)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  // Create a new conversation
  async createConversation(title?: string): Promise<Conversation> {
    try {
      const conversation = await createConversation({
        user_id: this.userId,
        agent_id: this.agentId,
        title: title || 'New Chat',
        status: 'active',
        metadata: {}
      })
      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Get messages for a specific conversation
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const messages = await getMessages(conversationId)
      return messages
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  // Add a message to a conversation
  async addMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    try {
      const newMessage = await addMessage({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        tokens_used: message.tokens_used || 0,
        metadata: message.metadata || {}
      })
      return newMessage
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  }

  // Update conversation title
  async updateConversationTitle(conversationId: string, title: string): Promise<Conversation> {
    try {
      const conversation = await updateConversationTitle(conversationId, title)
      return conversation
    } catch (error) {
      console.error('Error updating conversation title:', error)
      throw error
    }
  }

  // Get conversation with all messages
  async getConversationWithMessages(conversationId: string): Promise<Conversation> {
    try {
      const conversation = await getConversationWithMessages(conversationId)
      return conversation
    } catch (error) {
      console.error('Error fetching conversation with messages:', error)
      throw error
    }
  }

  // Delete conversation (soft delete)
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await deleteConversation(conversationId)
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      await archiveConversation(conversationId)
    } catch (error) {
      console.error('Error archiving conversation:', error)
      throw error
    }
  }

  // Generate conversation title from first user message
  async generateConversationTitle(conversationId: string, firstMessage: string): Promise<string> {
    try {
      // Simple title generation - take first 50 characters of first message
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 50) + '...'
        : firstMessage
      
      await this.updateConversationTitle(conversationId, title)
      return title
    } catch (error) {
      console.error('Error generating conversation title:', error)
      throw error
    }
  }

  // Load conversation and its messages
  async loadConversation(conversationId: string): Promise<{ conversation: Conversation, messages: ChatMessage[] }> {
    try {
      const conversation = await this.getConversationWithMessages(conversationId)
      return {
        conversation,
        messages: conversation.messages || []
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      throw error
    }
  }
}

