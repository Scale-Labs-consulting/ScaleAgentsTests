import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Get user from request headers
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
          throw new Error('No authorization header')
        }

        // Create Supabase client to verify user
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Verify the access token
        const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        
        if (error || !user) {
          throw new Error('Not authorized')
        }

        return {
          allowedContentTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
          tokenPayload: JSON.stringify({
            userId: user.id,
            fileName: pathname.split('/').pop() || 'video.mp4'
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Video upload completed:', blob.url)
        
        try {
          const { userId, fileName } = JSON.parse(tokenPayload)
          
          // Create Supabase client
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )

          // Create database record
          const salesCallData = {
            user_id: userId,
            title: fileName.replace(/\.[^/.]+$/, ''),
            file_url: blob.url,
            file_path: blob.pathname,
            file_size: blob.size,
            duration: 0,
            status: 'uploaded'
          }

          const { data: salesCall, error: dbError } = await supabase
            .from('sales_calls')
            .insert(salesCallData)
            .select()
            .single()

          if (dbError) {
            console.error('Database error:', dbError)
            throw new Error('Could not create database record')
          }

          console.log('Database record created:', salesCall)
          
        } catch (error) {
          console.error('Error in onUploadCompleted:', error)
          throw new Error('Could not process upload completion')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
