import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { analysisId, userId, notes } = await request.json()
    
    if (!analysisId || !userId) {
      return NextResponse.json(
        { error: 'Analysis ID and User ID are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the analysis exists and belongs to the user
    const { data: analysis, error: fetchError } = await supabase
      .from('sales_call_analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      )
    }

    // Update or insert notes
    const { error: upsertError } = await supabase
      .from('analysis_notes')
      .upsert({
        analysis_id: analysisId,
        user_id: userId,
        notes: notes || '',
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error saving notes:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notes saved successfully'
    })

  } catch (error) {
    console.error('Notes API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('analysisId')
    const userId = searchParams.get('userId')
    
    if (!analysisId || !userId) {
      return NextResponse.json(
        { error: 'Analysis ID and User ID are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch notes
    const { data: notes, error } = await supabase
      .from('analysis_notes')
      .select('notes')
      .eq('analysis_id', analysisId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching notes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notes: notes?.notes || ''
    })

  } catch (error) {
    console.error('Notes GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
