import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, accessToken } = await request.json()

    if (!userId || !accessToken) {
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

    // Test database connection and sales_calls table
    const { data: testRecord, error: testError } = await supabase
      .from('sales_calls')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Database test failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }

    // Test creating a sample record
    const sampleData = {
      user_id: userId,
      title: 'Test Upload',
      file_url: 'https://test.com/test.mp4',
      file_size: 0,
      duration_seconds: 0,
      status: 'test',
      metadata: {
        isTest: true,
        originalFileName: 'test.mp4'
      }
    }

    const { data: createdRecord, error: createError } = await supabase
      .from('sales_calls')
      .insert(sampleData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Record creation test failed:', createError)
      return NextResponse.json({
        success: false,
        error: 'Record creation failed',
        details: createError.message
      }, { status: 500 })
    }

    // Clean up test record
    await supabase
      .from('sales_calls')
      .delete()
      .eq('id', createdRecord.id)

    return NextResponse.json({
      success: true,
      message: 'Database connection and sales_calls table working correctly',
      testRecordId: createdRecord.id
    })

  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
