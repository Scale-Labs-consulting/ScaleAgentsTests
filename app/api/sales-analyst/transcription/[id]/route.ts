import { NextRequest, NextResponse } from 'next/server'
import { SalesAnalystService } from '@/lib/sales-analyst'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callId = params.id
    
    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    const salesCall = await SalesAnalystService.getSalesCallWithTranscription(callId)
    
    if (!salesCall) {
      return NextResponse.json(
        { error: 'Sales call not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transcription: salesCall.transcription || '',
      message: 'Transcription retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching transcription:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
