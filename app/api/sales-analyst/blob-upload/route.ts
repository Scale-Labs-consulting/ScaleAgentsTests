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
        let payload: { userId: string; accessToken: string; originalFileName?: string; callType?: string }
        
        try {
          if (typeof clientPayload === 'string') {
            payload = JSON.parse(clientPayload)
          } else {
            payload = clientPayload as unknown as { userId: string; accessToken: string; originalFileName?: string; callType?: string }
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
          allowedContentTypes: ['video/*', 'audio/*'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: payload.userId,
            accessToken: payload.accessToken,
            originalFileName: payload.originalFileName || (pathname || 'unknown'),
            callType: payload.callType || 'Chamada Fria'
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Blob upload completed:', blob.url)

        try {
          if (!tokenPayload) {
            throw new Error('No token payload received')
          }
          const { userId, accessToken, originalFileName, callType } = JSON.parse(tokenPayload)

          // Create authenticated Supabase client
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            }
          )


          // File uploaded successfully - no database record needed here
          // The analysis record will be created in the blob-transcribe route
          console.log('✅ File uploaded successfully to blob storage')
          console.log('📁 File URL:', blob.url)
          console.log('📁 Original filename:', originalFileName || blob.pathname)

        } catch (error) {
          console.error('❌ Error in onUploadCompleted:', error)
          throw new Error('Could not update database')
        }
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
