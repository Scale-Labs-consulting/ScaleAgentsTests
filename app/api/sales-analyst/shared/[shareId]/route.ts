import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const resolvedParams = await params
    const shareId = resolvedParams.shareId
    
    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the share record
    const { data: shareRecord, error: shareError } = await supabase
      .from('shared_analyses')
      .select('*')
      .eq('id', shareId)
      .single()

    if (shareError || !shareRecord) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      )
    }

    // Check if the share link has expired
    const now = new Date()
    const expiresAt = new Date(shareRecord.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Fetch the analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('id', shareRecord.analysis_id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Remove sensitive information
    const sanitizedAnalysis = {
      ...analysis,
      user_id: undefined, // Remove user ID for privacy
      id: analysis.id, // Keep analysis ID for reference
    }

    return NextResponse.json({
      success: true,
      analysis: sanitizedAnalysis,
      sharedAt: shareRecord.created_at,
      expiresAt: shareRecord.expires_at
    })

  } catch (error) {
    console.error('Shared analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
