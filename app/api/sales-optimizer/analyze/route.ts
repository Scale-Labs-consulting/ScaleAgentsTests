import { NextRequest, NextResponse } from 'next/server'
import { SalesOptimizerService } from '@/lib/sales-optimizer'

export async function POST(request: NextRequest) {
  try {
    const { salesCallId, userId } = await request.json()

    if (!salesCallId || !userId) {
      return NextResponse.json(
        { error: 'Sales call ID and user ID are required' },
        { status: 400 }
      )
    }

    const analysis = await SalesOptimizerService.analyzeSalesCall(salesCallId, userId)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing sales call:', error)
    return NextResponse.json(
      { error: 'Failed to analyze sales call' },
      { status: 500 }
    )
  }
}

