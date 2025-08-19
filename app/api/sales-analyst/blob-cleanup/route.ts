import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldBlobFiles, getBlobStorageStats, cleanupUserFiles } from '@/lib/blob-cleanup'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'
    const maxAge = parseInt(searchParams.get('maxAge') || '24')
    const userId = searchParams.get('userId')

    console.log('🧹 Blob cleanup request:', { dryRun, maxAge, userId })

    if (userId) {
      // Clean up specific user's files
      const result = await cleanupUserFiles(userId, { maxAge, dryRun })
      return NextResponse.json({
        success: true,
        message: `User cleanup completed`,
        result
      })
    } else {
      // Clean up all old files
      const result = await cleanupOldBlobFiles({ maxAge, dryRun })
      return NextResponse.json({
        success: true,
        message: `Global cleanup completed`,
        result
      })
    }

  } catch (error) {
    console.error('❌ Blob cleanup error:', error)
    return NextResponse.json(
      { error: `Cleanup failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, options = {} } = await request.json()

    console.log('📊 Blob management request:', { action, options })

    switch (action) {
      case 'stats':
        const stats = await getBlobStorageStats()
        return NextResponse.json({
          success: true,
          stats
        })

      case 'cleanup':
        const { maxAge = 24, dryRun = false, userId } = options
        const result = await cleanupOldBlobFiles({ maxAge, dryRun, userId })
        return NextResponse.json({
          success: true,
          result
        })

      case 'user-cleanup':
        const { userId: targetUserId, maxAge: userMaxAge = 1 } = options
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'userId is required for user cleanup' },
            { status: 400 }
          )
        }
        const userResult = await cleanupUserFiles(targetUserId, { maxAge: userMaxAge })
        return NextResponse.json({
          success: true,
          result: userResult
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Blob management error:', error)
    return NextResponse.json(
      { error: `Operation failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
