import { createClient } from '@supabase/supabase-js'

// Create service role client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UsageTrackingData {
  userId: string
  agentType: 'scale-expert' | 'sales-analyst'
  actionType: 'message' | 'upload' | 'analysis'
  referenceId?: string
  metadata?: Record<string, any>
}

/**
 * Track usage for a specific user and agent
 * This function both inserts into usage_tracking table and increments profile counters
 */
export async function trackUsage(data: UsageTrackingData) {
  try {
    console.log('📊 Tracking usage:', data)

    // Insert into usage_tracking table (trigger will automatically increment profile counters)
    const { data: trackingRecord, error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: data.userId,
        agent_type: data.agentType,
        action_type: data.actionType,
        reference_id: data.referenceId || null,
        metadata: data.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error tracking usage:', error)
      throw error
    }

    console.log('✅ Usage tracked successfully:', trackingRecord)
    return trackingRecord
  } catch (error) {
    console.error('Usage tracking error:', error)
    throw error
  }
}

/**
 * Get usage counts for a user from the profiles table (faster than querying usage_tracking)
 */
export async function getUserUsageCounts(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('scale_expert_messages, sales_analyst_uploads, scale_expert_messages_monthly, sales_analyst_uploads_monthly')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error getting usage counts:', error)
      throw error
    }

    return {
      scaleExpertMessages: profile.scale_expert_messages || 0,
      salesAnalystUploads: profile.sales_analyst_uploads || 0,
      scaleExpertMessagesMonthly: profile.scale_expert_messages_monthly || 0,
      salesAnalystUploadsMonthly: profile.sales_analyst_uploads_monthly || 0
    }
  } catch (error) {
    console.error('Error getting user usage counts:', error)
    throw error
  }
}

/**
 * Reset monthly usage counters (to be run monthly)
 */
export async function resetMonthlyUsageCounters() {
  try {
    const { error } = await supabase.rpc('reset_monthly_usage_counters')
    
    if (error) {
      console.error('❌ Error resetting monthly counters:', error)
      throw error
    }

    console.log('✅ Monthly usage counters reset successfully')
    return true
  } catch (error) {
    console.error('Error resetting monthly counters:', error)
    throw error
  }
}

/**
 * Check if user has reached their usage limit
 */
export async function checkUsageLimit(userId: string, userPlan: string | null, agentId: string): Promise<boolean> {
  try {
    const usage = await getUserUsageCounts(userId)
    
    if (!userPlan) {
      // Free users have limits
      if (agentId === 'scale-expert') {
        return usage.scaleExpertMessagesMonthly >= 5
      } else if (agentId === 'sales-analyst') {
        return usage.salesAnalystUploadsMonthly >= 2
      }
      return true
    }
    
    // Paid plans have no limits
    return false
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return true // Default to blocked if we can't check
  }
}
