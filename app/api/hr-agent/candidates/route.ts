import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing accessToken parameter' },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Get candidates for the user (with optional limit)
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit')
    
    let query = supabase
      .from('hr_candidates')
      .select(`
        *,
        agents (
          id,
          name,
          type
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    
    const { data: candidates, error: candidatesError } = await query

    if (candidatesError) {
      console.error('❌ Candidates fetch error:', candidatesError)
      return NextResponse.json(
        { error: 'Failed to fetch candidates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      candidates: candidates || []
    })

  } catch (error) {
    console.error('❌ Get candidates error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { accessToken, name, email, phone, position } = await request.json()

    if (!accessToken || !name || !position) {
      return NextResponse.json(
        { error: 'Missing required parameters: accessToken, name, and position' },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Get or create HR agent for the user
    let { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'hr_agent')
      .single()

    if (agentError && agentError.code !== 'PGRST116') {
      console.error('❌ Agent error:', agentError)
      return NextResponse.json(
        { error: 'Failed to get HR agent' },
        { status: 500 }
      )
    }

    if (!agent) {
      // Create HR agent if it doesn't exist
      const { data: newAgent, error: createAgentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: 'HR Agent',
          type: 'hr_agent',
          description: 'Intelligent talent acquisition and human resources management'
        })
        .select('id')
        .single()

      if (createAgentError) {
        console.error('❌ Create agent error:', createAgentError)
        return NextResponse.json(
          { error: 'Failed to create HR agent' },
          { status: 500 }
        )
      }
      agent = newAgent
    }

    // Create candidate record
    const candidateData = {
      user_id: user.id,
      agent_id: agent.id,
      name,
      email: email || null,
      phone: phone || null,
      position,
      status: 'pending',
      form_data: {
        name,
        email,
        phone,
        position
      }
    }

    const { data: candidate, error: createError } = await supabase
      .from('hr_candidates')
      .insert(candidateData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Create candidate error:', createError)
      return NextResponse.json(
        { error: 'Failed to create candidate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      candidate
    })

  } catch (error) {
    console.error('❌ Create candidate error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
