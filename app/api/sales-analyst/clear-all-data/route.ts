import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/clear-all-data')
  
  try {
    // Get user from session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the user from the request headers (if available) or from the request body
    const { userId } = await request.json().catch(() => ({}))
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please provide userId in request body.' },
        { status: 400 }
      )
    }


    console.log(`🗑️ Clearing ALL data for user: ${userId}`)

    // Delete all analyses for the user
    const { error: analysesError } = await supabase
      .from('sales_call_analyses')
      .delete()
      .eq('user_id', userId)

    if (analysesError) {
      console.error('❌ Error deleting analyses:', analysesError)
      return NextResponse.json(
        { error: `Failed to delete analyses: ${analysesError.message}` },
        { status: 500 }
      )
    }

    // sales_calls table has been removed

    console.log(`✅ All data cleared for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
      userId: userId
    })

  } catch (error) {
    console.error('💥 Clear all data API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
