// Database types for ScaleAgents SaaS
// These types match the Supabase database schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          company_name: string | null
          industry: string | null
          how_did_you_hear: string | null
          business_product_service: string | null
          ideal_customer: string | null
          problem_solved: string | null
          business_model: string | null
          average_ticket: string | null
          conversion_rate: string | null
          sales_cycle: string | null
          lead_generation: string | null
          common_objections: string | null
          main_competitors: string | null
          differentiation: string | null
          pricing_structure: string | null
          monthly_revenue: string | null
          growth_bottleneck: string | null
          funnel_drop_off: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          industry?: string | null
          how_did_you_hear?: string | null
          business_product_service?: string | null
          ideal_customer?: string | null
          problem_solved?: string | null
          business_model?: string | null
          average_ticket?: string | null
          conversion_rate?: string | null
          sales_cycle?: string | null
          lead_generation?: string | null
          common_objections?: string | null
          main_competitors?: string | null
          differentiation?: string | null
          pricing_structure?: string | null
          monthly_revenue?: string | null
          growth_bottleneck?: string | null
          funnel_drop_off?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          industry?: string | null
          how_did_you_hear?: string | null
          business_product_service?: string | null
          ideal_customer?: string | null
          problem_solved?: string | null
          business_model?: string | null
          average_ticket?: string | null
          conversion_rate?: string | null
          sales_cycle?: string | null
          lead_generation?: string | null
          common_objections?: string | null
          main_competitors?: string | null
          differentiation?: string | null
          pricing_structure?: string | null
          monthly_revenue?: string | null
          growth_bottleneck?: string | null
          funnel_drop_off?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'scale_expert' | 'sales_analyst' | 'hr_agent'
          description: string | null
          is_active: boolean
          config: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'scale_expert' | 'sales_analyst' | 'hr_agent'
          description?: string | null
          is_active?: boolean
          config?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'scale_expert' | 'sales_analyst' | 'hr_agent'
          description?: string | null
          is_active?: boolean
          config?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          title: string | null
          status: 'active' | 'archived' | 'deleted'
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          title?: string | null
          status?: 'active' | 'archived' | 'deleted'
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          title?: string | null
          status?: 'active' | 'archived' | 'deleted'
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used?: number
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens_used?: number
          metadata?: Record<string, any>
          created_at?: string
        }
      }
      sales_calls: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          title: string
          file_url: string
          file_size: number | null
          duration_seconds: number | null
          status: 'uploaded' | 'processing' | 'completed' | 'failed'
          analysis: Record<string, any>
          feedback: string | null
          score: number | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          title: string
          file_url: string
          file_size?: number | null
          duration_seconds?: number | null
          status?: 'uploaded' | 'processing' | 'completed' | 'failed'
          analysis?: Record<string, any>
          feedback?: string | null
          score?: number | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          title?: string
          file_url?: string
          file_size?: number | null
          duration_seconds?: number | null
          status?: 'uploaded' | 'processing' | 'completed' | 'failed'
          analysis?: Record<string, any>
          feedback?: string | null
          score?: number | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      sales_feedback_prompts: {
        Row: {
          id: string
          user_id: string
          name: string
          prompt: string
          is_active: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          prompt: string
          is_active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          prompt?: string
          is_active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      sales_call_feedback: {
        Row: {
          id: string
          sales_call_id: string
          prompt_id: string
          feedback: string
          score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          sales_call_id: string
          prompt_id: string
          feedback: string
          score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          sales_call_id?: string
          prompt_id?: string
          feedback?: string
          score?: number | null
          created_at?: string
        }
      }
      hr_candidates: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          name: string
          email: string | null
          phone: string | null
          position: string
          cv_file_url: string | null
          cv_file_size: number | null
          form_data: Record<string, any>
          status: 'pending' | 'processing' | 'evaluated' | 'rejected' | 'accepted'
          overall_score: number | null
          evaluation: Record<string, any>
          notes: string | null
          created_at: string
          updated_at: string
          // Extracted personal information fields
          personal_info?: Record<string, any>
          extracted_name?: string
          extracted_email?: string
          extracted_phone?: string
          extracted_location?: string
          extracted_linkedin?: string
          extracted_github?: string
          extracted_website?: string
          extracted_date_of_birth?: string
          extracted_nationality?: string
          extracted_languages?: string[]
          extracted_skills?: string[]
          extracted_experience_years?: number
          extracted_education?: string[]
          extracted_certifications?: string[]
          extracted_availability?: string
          extracted_salary_expectation?: string
          extracted_work_permit?: string
          extracted_remote_preference?: string
          extracted_notice_period?: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          name: string
          email?: string | null
          phone?: string | null
          position: string
          cv_file_url?: string | null
          cv_file_size?: number | null
          form_data?: Record<string, any>
          status?: 'pending' | 'processing' | 'evaluated' | 'rejected' | 'accepted'
          overall_score?: number | null
          evaluation?: Record<string, any>
          notes?: string | null
          created_at?: string
          updated_at?: string
          // Extracted personal information fields
          personal_info?: Record<string, any>
          extracted_name?: string
          extracted_email?: string
          extracted_phone?: string
          extracted_location?: string
          extracted_linkedin?: string
          extracted_github?: string
          extracted_website?: string
          extracted_date_of_birth?: string
          extracted_nationality?: string
          extracted_languages?: string[]
          extracted_skills?: string[]
          extracted_experience_years?: number
          extracted_education?: string[]
          extracted_certifications?: string[]
          extracted_availability?: string
          extracted_salary_expectation?: string
          extracted_work_permit?: string
          extracted_remote_preference?: string
          extracted_notice_period?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          position?: string
          cv_file_url?: string | null
          cv_file_size?: number | null
          form_data?: Record<string, any>
          status?: 'pending' | 'processing' | 'evaluated' | 'rejected' | 'accepted'
          overall_score?: number | null
          evaluation?: Record<string, any>
          notes?: string | null
          created_at?: string
          updated_at?: string
          // Extracted personal information fields
          personal_info?: Record<string, any>
          extracted_name?: string
          extracted_email?: string
          extracted_phone?: string
          extracted_location?: string
          extracted_linkedin?: string
          extracted_github?: string
          extracted_website?: string
          extracted_date_of_birth?: string
          extracted_nationality?: string
          extracted_languages?: string[]
          extracted_skills?: string[]
          extracted_experience_years?: number
          extracted_education?: string[]
          extracted_certifications?: string[]
          extracted_availability?: string
          extracted_salary_expectation?: string
          extracted_work_permit?: string
          extracted_remote_preference?: string
          extracted_notice_period?: string
        }
      }
      hr_evaluation_criteria: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          weight: number
          is_active: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          weight?: number
          is_active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          weight?: number
          is_active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      hr_candidate_evaluations: {
        Row: {
          id: string
          candidate_id: string
          criteria_id: string
          score: number
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          criteria_id: string
          score: number
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          criteria_id?: string
          score?: number
          feedback?: string | null
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          action_type: string
          tokens_used: number
          cost: number
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          action_type: string
          tokens_used?: number
          cost?: number
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          action_type?: string
          tokens_used?: number
          cost?: number
          metadata?: Record<string, any>
          created_at?: string
        }
      }
      credits: {
        Row: {
          id: string
          user_id: string
          credits_remaining: number
          credits_used: number
          reset_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_remaining?: number
          credits_used?: number
          reset_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_remaining?: number
          credits_used?: number
          reset_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type SalesCall = Database['public']['Tables']['sales_calls']['Row']
export type SalesFeedbackPrompt = Database['public']['Tables']['sales_feedback_prompts']['Row']
export type SalesCallFeedback = Database['public']['Tables']['sales_call_feedback']['Row']
export type HRCandidate = Database['public']['Tables']['hr_candidates']['Row']
export type HREvaluationCriteria = Database['public']['Tables']['hr_evaluation_criteria']['Row']
export type HRCandidateEvaluation = Database['public']['Tables']['hr_candidate_evaluations']['Row']
export type UsageLog = Database['public']['Tables']['usage_logs']['Row']
export type Credits = Database['public']['Tables']['credits']['Row']

// Agent types
export type AgentType = 'scale_expert' | 'sales_analyst' | 'hr_agent'

// Status types
export type ConversationStatus = 'active' | 'archived' | 'deleted'
export type SalesCallStatus = 'uploaded' | 'processing' | 'completed' | 'failed'
export type HRCandidateStatus = 'pending' | 'processing' | 'evaluated' | 'rejected' | 'accepted'
export type MessageRole = 'user' | 'assistant' | 'system'

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type AgentInsert = Database['public']['Tables']['agents']['Insert']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type SalesCallInsert = Database['public']['Tables']['sales_calls']['Insert']
export type HRCandidateInsert = Database['public']['Tables']['hr_candidates']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type AgentUpdate = Database['public']['Tables']['agents']['Update']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']
export type SalesCallUpdate = Database['public']['Tables']['sales_calls']['Update']
export type HRCandidateUpdate = Database['public']['Tables']['hr_candidates']['Update']
