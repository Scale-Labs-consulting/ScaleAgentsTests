import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    const hasBlobToken = !!blobToken
    const tokenLength = blobToken ? blobToken.length : 0
    const tokenPrefix = blobToken ? blobToken.substring(0, 10) + '...' : 'N/A'
    
    const diagnostics = {
      blobConfigured: hasBlobToken,
      tokenLength,
      tokenPrefix,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      recommendations: []
    }
    
    if (!hasBlobToken) {
      diagnostics.recommendations.push(
        'BLOB_READ_WRITE_TOKEN environment variable is not set',
        'Run "vercel blob create sales-calls-store" to create a blob store',
        'Add the token to your Vercel environment variables'
      )
    } else if (tokenLength < 50) {
      diagnostics.recommendations.push(
        'BLOB_READ_WRITE_TOKEN appears to be too short',
        'Verify the token is correctly copied from Vercel'
      )
    } else {
      diagnostics.recommendations.push(
        'BLOB_READ_WRITE_TOKEN appears to be configured correctly',
        'If uploads still fail, check Vercel Blob store permissions'
      )
    }
    
    return NextResponse.json({
      success: true,
      diagnostics
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      diagnostics: {
        blobConfigured: false,
        error: true
      }
    }, { status: 500 })
  }
}
