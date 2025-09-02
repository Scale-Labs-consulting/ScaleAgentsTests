import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteBlobFile } from '@/lib/blob-cleanup'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log('📦 ZIP upload request received')
    const body = (await request.json()) as HandleUploadBody
    console.log('📦 Request body type:', typeof body)
    console.log('📦 Request body keys:', Object.keys(body))

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log('🔐 ZIP onBeforeGenerateToken called')
        console.log('🔐 Pathname:', pathname)
        console.log('🔐 Client payload type:', typeof clientPayload)
        console.log('🔐 Client payload:', clientPayload)
        
        // Extract user information from the request
        let payload: { userId: string; accessToken: string; originalFileName?: string }
        
        try {
          if (typeof clientPayload === 'string') {
            payload = JSON.parse(clientPayload)
          } else {
            payload = clientPayload as unknown as { userId: string; accessToken: string; originalFileName?: string }
          }
          console.log('🔐 Parsed payload:', payload)
        } catch (error) {
          console.error('🔐 Error parsing client payload:', error)
          throw new Error('Invalid client payload format')
        }

        if (!payload?.userId || !payload?.accessToken) {
          throw new Error('Missing required parameters: userId and accessToken')
        }

        // Authenticate the user
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${payload.accessToken}`
              }
            }
          }
        )

        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          throw new Error('Invalid access token')
        }

        console.log('🔐 Generating ZIP upload token for user:', payload.userId)

        return {
          allowedContentTypes: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: payload.userId,
            accessToken: payload.accessToken,
            originalFileName: payload.originalFileName || (pathname || 'unknown'),
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ ZIP Blob upload completed:', blob.url)

        try {
          if (!tokenPayload) {
            throw new Error('No token payload received')
          }
          const { userId, accessToken } = JSON.parse(tokenPayload)

          // Process the ZIP file
          console.log('📦 Starting ZIP processing...')
          
          const processResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/hr-agent/process-zip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              zipBlobUrl: blob.url,
              userId,
              accessToken
            })
          })

          const processData = await processResponse.json()
          
          if (processResponse.status === 409) {
            // ZIP already processed - this is not an error, just inform the user
            console.log('ℹ️ ZIP already processed:', processData.error)
            return NextResponse.json({
              success: true,
              message: 'ZIP file has already been processed',
              alreadyProcessed: true,
              summary: {
                message: 'This ZIP file has already been processed. Check the candidates list for the results.',
                successful: 0,
                total: 0
              }
            })
          }
          
          if (!processData.success) {
            console.error('❌ ZIP processing failed:', processData.error)
            throw new Error('Failed to process ZIP file')
          }

          console.log('✅ ZIP processing completed successfully')
          console.log('📊 Processing summary:', processData.summary)

        } catch (error) {
          console.error('❌ Error in ZIP upload completed:', error)
          
          // Clean up the ZIP file since processing failed
          if (blob?.url) {
            console.log('🗑️ Cleaning up ZIP file due to processing failure...')
            await deleteBlobFile(blob.url)
          }
          
          throw new Error('Could not process ZIP file')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('❌ ZIP Client upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
