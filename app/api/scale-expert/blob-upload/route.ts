import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Extract user information from the request
        let payload: { userId: string; accessToken: string; originalFileName?: string }
        
        try {
          if (typeof clientPayload === 'string') {
            payload = JSON.parse(clientPayload)
          } else {
            payload = clientPayload as unknown as { userId: string; accessToken: string; originalFileName?: string }
          }
        } catch (error) {
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

        console.log('🔐 Generating upload token for user:', payload.userId)

        return {
          allowedContentTypes: ['video/*', 'audio/*', 'application/*', 'text/*'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: payload.userId,
            accessToken: payload.accessToken,
            originalFileName: payload.originalFileName || (pathname || 'unknown')
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Blob upload completed for scale expert:', blob.url)
        // No database operations needed - just return success
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('❌ Client upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
