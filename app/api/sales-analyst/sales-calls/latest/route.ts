import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, accessToken, blobUrl } = await request.json()

    if (!userId || !accessToken || !blobUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Get the latest sales call record for this user and blob URL
    const { data: salesCall, error } = await supabase
      .from('sales_calls')
      .select('*')
      .eq('user_id', userId)
      .eq('file_url', blobUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching sales call:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sales call record' },
        { status: 500 }
      )
    }

    if (!salesCall) {
      return NextResponse.json(
        { error: 'Sales call record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      salesCall: salesCall
    })

  } catch (error) {
    console.error('❌ Error in sales-calls/latest:', error)
    return NextResponse.json(
      { error: `Failed to get sales call: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
