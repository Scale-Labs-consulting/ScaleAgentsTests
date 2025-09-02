import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// In-memory store for ZIP processing status
// In production, you'd want to use Redis or a database
const processingStatus = new Map<string, {
  phase: 'uploading' | 'extracting' | 'processing' | 'completed' | 'error'
  currentFile?: string
  currentIndex?: number
  totalFiles?: number
  successful?: number
  failed?: number
  results?: any
  lastUpdated: number
}>()

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { processId, accessToken, userId } = body

    if (!processId || !accessToken || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Authenticate the user
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Get processing status
    const status = processingStatus.get(processId)
    console.log(`🔍 Looking for processId: ${processId}`)
    console.log(`🔍 Available processIds:`, Array.from(processingStatus.keys()))
    console.log(`🔍 Found status:`, status)
    
    if (!status) {
      // If no status found, check if this might be an already processed ZIP
      // This could happen if the ZIP was already processed but the status was cleared
      console.log(`⚠️ No status found for processId: ${processId}, checking if already processed`)
      
      // Check if there are any candidates with this ZIP ID in their notes
      const { data: existingCandidates } = await supabase
        .from('hr_candidates')
        .select('id, notes')
        .eq('user_id', userId)
        .like('notes', `%${processId}%`)
        .limit(1)
      
      if (existingCandidates && existingCandidates.length > 0) {
        console.log(`ℹ️ Found existing candidates for processId: ${processId}, returning already processed status`)
        return NextResponse.json({
          alreadyProcessed: true,
          phase: 'completed',
          message: 'This ZIP file has already been processed. Check the candidates list for the results.',
          successful: 0,
          total: 0
        })
      }
      
      // If no existing candidates found, return a default "processing" state
      console.log(`⚠️ No status found for processId: ${processId}, returning default`)
      return NextResponse.json({
        phase: 'processing',
        currentFile: 'Initializing...',
        currentIndex: 0,
        totalFiles: 1
      })
    }

    // Clean up old entries (older than 10 minutes)
    const now = Date.now()
    for (const [key, value] of processingStatus.entries()) {
      if (now - value.lastUpdated > 10 * 60 * 1000) {
        processingStatus.delete(key)
      }
    }

    return NextResponse.json(status)

  } catch (error) {
    console.error('❌ ZIP status error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

// Export functions to update status from other routes
export function updateZipStatus(
  processId: string, 
  status: Partial<{
    phase: 'uploading' | 'extracting' | 'processing' | 'completed' | 'error'
    currentFile: string
    currentIndex: number
    totalFiles: number
    successful: number
    failed: number
    results: any
  }>
) {
  console.log(`📊 updateZipStatus called with processId: ${processId}`)
  console.log(`📊 Status to update:`, status)
  
  const existing = processingStatus.get(processId) || {
    phase: 'processing' as const,
    lastUpdated: Date.now()
  }
  
  const updatedStatus = {
    ...existing,
    ...status,
    lastUpdated: Date.now()
  }
  
  processingStatus.set(processId, updatedStatus)
  
  console.log(`📊 Updated ZIP status for ${processId}:`, updatedStatus)
  console.log(`📊 Total status entries:`, processingStatus.size)
}

export function getZipProcessId(blobUrl: string): string {
  // Extract a unique identifier from the blob URL
  return blobUrl.split('/').pop()?.split('.')[0] || 'unknown'
}
