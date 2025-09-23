import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This is a simple endpoint to check if the server is responding
    return NextResponse.json({ 
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      message: 'Upload debug endpoint is working'
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed' },
      { status: 500 }
    )
  }
}
