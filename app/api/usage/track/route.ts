import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, agentType, actionType, referenceId, metadata } = await request.json()
    
    console.log('📊 Usage tracking request:', { userId, agentType, actionType, referenceId, metadata })

    // Validate required fields
    if (!userId || !agentType || !actionType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, agentType, actionType' },
        { status: 400 }
      )
    }

    // Validate agent type
    if (!['scale-expert', 'sales-analyst'].includes(agentType)) {
      return NextResponse.json(
        { error: 'Invalid agent type. Must be scale-expert or sales-analyst' },
        { status: 400 }
      )
    }

    // Validate action type
    if (!['message', 'upload', 'analysis'].includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid action type. Must be message, upload, or analysis' },
        { status: 400 }
      )
    }

    // Create service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert usage tracking record
    const { data, error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        agent_type: agentType,
        action_type: actionType,
        reference_id: referenceId || null,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error tracking usage:', error)
      return NextResponse.json(
        { error: 'Failed to track usage' },
        { status: 500 }
      )
    }

    console.log('✅ Usage tracked successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Usage tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const agentType = searchParams.get('agentType')
    const actionType = searchParams.get('actionType')
    const startDate = searchParams.get('startDate')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Create service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)

    if (agentType) {
      query = query.eq('agent_type', agentType)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching usage data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Usage fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
