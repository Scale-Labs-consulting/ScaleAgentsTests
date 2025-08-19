import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, data } = await request.json()
    
    // Format the log message for terminal display
    let logMessage = `[FRONTEND] ${message}`
    
    if (data) {
      if (typeof data === 'object') {
        logMessage += ` ${JSON.stringify(data, null, 2)}`
      } else {
        logMessage += ` ${data}`
      }
    }
    
    // Log to terminal (this will appear in your Cursor terminal)
    console.log(logMessage)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log API error:', error)
    return NextResponse.json({ error: 'Failed to log message' }, { status: 500 })
  }
}
