import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { analysisId, userId } = await request.json()
    
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
      .select('id, title, analysis, transcription, created_at')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      )
    }

    // Generate a unique share ID
    const shareId = randomBytes(16).toString('hex')
    
    // Store the share link in the database
    const { error: insertError } = await supabase
      .from('shared_analyses')
      .insert({
        id: shareId,
        analysis_id: analysisId,
        user_id: userId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })

    if (insertError) {
      console.error('Error creating share link:', insertError)
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shareId: shareId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
