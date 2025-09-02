import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/analyses/[id]')
  
  try {
    const resolvedParams = await params
    console.log('📋 Analysis ID:', resolvedParams.id)
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching analysis:', error)
      return NextResponse.json(
        { error: `Failed to fetch analysis: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    console.log('✅ Fetched analysis from Supabase:', data.id)

    return NextResponse.json({
      success: true,
      analysis: data
    })

  } catch (error) {
    console.error('💥 Analysis API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/analyses/[id]/DELETE')
  
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
    const analysisId = params.id

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      )
    }

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client with service role key for deletion
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user has access to this analysis by checking the access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Check if the analysis exists and belongs to this user
    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('sales_call_analyses')
      .select('id, user_id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching analysis:', fetchError)
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the analysis
    const { error: deleteError } = await supabase
      .from('sales_call_analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Error deleting analysis:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      )
    }

    console.log(`✅ Analysis ${analysisId} deleted successfully for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully'
    })

  } catch (error) {
    console.error('💥 Delete analysis API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
