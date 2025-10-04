import { NextRequest, NextResponse } from 'next/server'
import { SalesOptimizerService } from '@/lib/sales-optimizer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const title = formData.get('title') as string

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      )
    }

    const salesCall = await SalesOptimizerService.uploadSalesCall(file, userId, title)

    return NextResponse.json(salesCall)
  } catch (error) {
    console.error('Error uploading sales call:', error)
    return NextResponse.json(
      { error: 'Failed to upload sales call' },
      { status: 500 }
    )
  }
}

