import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // This endpoint helps clear auth state on the client side
    return NextResponse.json({
      success: true,
      message: 'Auth state cleared. Please try logging in again.',
      instructions: [
        '1. Clear your browser cache and cookies',
        '2. Close all browser tabs for this site',
        '3. Open a new tab and try logging in again'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
