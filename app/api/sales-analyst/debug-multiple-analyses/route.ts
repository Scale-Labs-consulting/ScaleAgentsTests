import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all analyses
    const { data: analyses, error } = await supabase
      .from('sales_call_analyses')
      .select('id, title, created_at, user_id, analysis_metadata')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('❌ Error fetching analyses:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }
    
    console.log('📊 Total analyses found:', analyses?.length || 0)
    
    // Group by user_id to see if there are multiple analyses per user
    const userAnalysisCounts: { [key: string]: number } = {}
    const userAnalyses: { [key: string]: any[] } = {}
    
    analyses?.forEach(analysis => {
      const userId = analysis.user_id
      userAnalysisCounts[userId] = (userAnalysisCounts[userId] || 0) + 1
      if (!userAnalyses[userId]) {
        userAnalyses[userId] = []
      }
      userAnalyses[userId].push(analysis)
    })
    
    console.log('👥 Analysis counts per user:', userAnalysisCounts)
    
    // Check for duplicate content hashes
    const contentHashes: { [key: string]: number } = {}
    analyses?.forEach(analysis => {
      const hash = analysis.analysis_metadata?.content_hash
      if (hash) {
        contentHashes[hash] = (contentHashes[hash] || 0) + 1
      }
    })
    
    const duplicateHashes = Object.entries(contentHashes).filter(([hash, count]) => count > 1)
    console.log('🔐 Duplicate content hashes:', duplicateHashes)
    
    return NextResponse.json({
      success: true,
      totalAnalyses: analyses?.length || 0,
      userAnalysisCounts,
      userAnalyses,
      duplicateHashes,
      analyses: analyses?.map(analysis => ({
        id: analysis.id,
        title: analysis.title,
        created_at: analysis.created_at,
        user_id: analysis.user_id,
        content_hash: analysis.analysis_metadata?.content_hash?.substring(0, 16) + '...',
        analysis_method: analysis.analysis_metadata?.analysis_method
      }))
    })
    
  } catch (error) {
    console.error('💥 Debug error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
