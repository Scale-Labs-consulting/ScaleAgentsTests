import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const { blobUrl } = await request.json()

    if (!blobUrl) {
      return NextResponse.json(
        { error: 'Blob URL is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting blob:', blobUrl)

    // Delete the blob from Vercel Blob
    await del(blobUrl)

    console.log('✅ Blob deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting blob:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
