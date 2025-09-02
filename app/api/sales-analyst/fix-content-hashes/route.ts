import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/fix-content-hashes')
  
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all analyses for this user that don't have content hashes
    const { data: analysesWithoutHash, error: fetchError } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .or('analysis_metadata->>content_hash.is.null,analysis_metadata->>content_hash.eq.')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching analyses:', fetchError)
      return NextResponse.json(
        { error: `Failed to fetch analyses: ${fetchError.message}` },
        { status: 500 }
      )
    }

    console.log(`📊 Found ${analysesWithoutHash?.length || 0} analyses without content hashes`)

    if (!analysesWithoutHash || analysesWithoutHash.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All analyses already have content hashes',
        processed: 0,
        duplicates: 0
      })
    }

    let processed = 0
    let duplicates = 0
    const processedHashes = new Map<string, string[]>() // hash -> [analysisIds]

    for (const analysis of analysesWithoutHash) {
      try {
        // Generate content hash
        const encoder = new TextEncoder()
        const data = encoder.encode(analysis.transcription || '')
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // Check if we've already processed this hash
        if (processedHashes.has(contentHash)) {
          const existingIds = processedHashes.get(contentHash)!
          existingIds.push(analysis.id)
          processedHashes.set(contentHash, existingIds)
          duplicates++
          
          console.log(`🔄 Duplicate content hash found: ${contentHash.substring(0, 16)}...`)
          console.log(`📊 Analysis IDs with same content: ${existingIds.join(', ')}`)
          
          // Keep the first analysis, mark others for deletion
          if (existingIds.length > 1) {
            const idsToDelete = existingIds.slice(1) // Keep first, delete rest
            console.log(`🗑️ Marking ${idsToDelete.length} duplicate analyses for deletion`)
            
            // Update the first analysis with the content hash
            await supabase
              .from('sales_call_analyses')
              .update({
                analysis_metadata: {
                  ...analysis.analysis_metadata,
                  content_hash: contentHash,
                  duplicate_analysis_ids: idsToDelete
                }
              })
              .eq('id', existingIds[0])
            
            // Delete duplicate analyses
            for (const idToDelete of idsToDelete) {
              await supabase
                .from('sales_call_analyses')
                .delete()
                .eq('id', idToDelete)
              console.log(`🗑️ Deleted duplicate analysis: ${idToDelete}`)
            }
          }
        } else {
          // First time seeing this hash
          processedHashes.set(contentHash, [analysis.id])
          
          // Update the analysis with the content hash
          await supabase
            .from('sales_call_analyses')
            .update({
              analysis_metadata: {
                ...analysis.analysis_metadata,
                content_hash: contentHash
              }
            })
            .eq('id', analysis.id)
          
          processed++
          console.log(`✅ Added content hash to analysis: ${analysis.id}`)
        }
      } catch (error) {
        console.error(`❌ Error processing analysis ${analysis.id}:`, error)
      }
    }

    console.log(`✅ Content hash fix completed`)
    console.log(`📊 Processed: ${processed} analyses`)
    console.log(`🔄 Duplicates found: ${duplicates} analyses`)

    return NextResponse.json({
      success: true,
      message: 'Content hashes added and duplicates removed',
      processed,
      duplicates,
      totalHashes: processedHashes.size
    })

  } catch (error) {
    console.error('💥 Fix content hashes API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
