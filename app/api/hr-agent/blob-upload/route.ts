import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteBlobFile } from '@/lib/blob-cleanup'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Extract user information from the request
        let payload: { userId: string; accessToken: string; originalFileName?: string; candidateName?: string; position?: string }
        
        try {
          if (typeof clientPayload === 'string') {
            payload = JSON.parse(clientPayload)
          } else {
            payload = clientPayload as unknown as { userId: string; accessToken: string; originalFileName?: string; candidateName?: string; position?: string }
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

        console.log('🔐 Generating HR upload token for user:', payload.userId)

        return {
          allowedContentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-zip-compressed'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: payload.userId,
            accessToken: payload.accessToken,
            originalFileName: payload.originalFileName || (pathname || 'unknown'),
            candidateName: payload.candidateName,
            position: payload.position
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ HR Blob upload completed:', blob.url)

        try {
          if (!tokenPayload) {
            throw new Error('No token payload received')
          }
          const { userId, accessToken, originalFileName, candidateName, position } = JSON.parse(tokenPayload)

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

          // Get or create HR agent for the user
          let { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'hr_agent')
            .single()

          if (agentError && agentError.code !== 'PGRST116') {
            console.error('❌ Agent error:', agentError)
            throw new Error('Failed to get HR agent')
          }

          if (!agent) {
            // Create HR agent if it doesn't exist
            const { data: newAgent, error: createAgentError } = await supabase
              .from('agents')
              .insert({
                user_id: userId,
                name: 'HR Agent',
                type: 'hr_agent',
                description: 'Intelligent talent acquisition and human resources management'
              })
              .select('id')
              .single()

            if (createAgentError) {
              console.error('❌ Create agent error:', createAgentError)
              throw new Error('Failed to create HR agent')
            }
            agent = newAgent
          }

          // Check if this is a ZIP file - don't create candidate record for ZIP files
          const isZipFile = blob.contentType === 'application/zip' || 
                           blob.contentType === 'application/x-zip-compressed' ||
                           (originalFileName || blob.pathname).toLowerCase().endsWith('.zip')
          
          if (isZipFile) {
            console.log('📦 ZIP file detected, skipping candidate record creation')
            console.log('✅ ZIP file uploaded successfully:', blob.url)
          } else {
            // Create database record for HR candidate (only for non-ZIP files)
            // Extract candidate name from filename if not provided
            const extractedCandidateName = candidateName || (originalFileName || blob.pathname).replace(/\.[^/.]+$/, '')
            
            const candidateData = {
              user_id: userId,
              agent_id: agent.id,
              name: extractedCandidateName,
              position: position || 'Unknown Position',
              cv_file_url: blob.url,
              cv_file_size: blob.size || 0,
              status: 'pending',
              form_data: {
                originalFileName: originalFileName || blob.pathname,
                fileType: blob.contentType,
                blobPath: blob.pathname,
                uploadDate: new Date().toISOString()
              }
            }

            console.log('📝 Creating HR candidate record:', candidateData)

            const { data: candidate, error: dbError } = await supabase
              .from('hr_candidates')
              .insert(candidateData)
              .select()
              .single()

            if (dbError) {
              console.error('❌ Database error:', dbError)
              throw new Error('Failed to create candidate record')
            }

            console.log('✅ HR candidate record created:', candidate.id)
          }

        } catch (error) {
          console.error('❌ Error in onUploadCompleted:', error)
          
          // Clean up the blob file since database insertion failed
          if (blob?.url) {
            console.log('🗑️ Cleaning up blob file due to database insertion failure...')
            await deleteBlobFile(blob.url)
          }
          
          throw new Error('Could not update database')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('❌ HR Client upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
