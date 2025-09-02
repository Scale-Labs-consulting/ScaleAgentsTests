import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteBlobFile } from '@/lib/blob-cleanup'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
    const { id: candidateId } = await params

    if (!accessToken || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required parameters: accessToken and candidateId' },
        { status: 400 }
      )
    }

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

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Get candidate with agent information
    const { data: candidate, error: candidateError } = await supabase
      .from('hr_candidates')
      .select(`
        *,
        agents (
          id,
          name,
          type
        )
      `)
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single()

    if (candidateError || !candidate) {
      console.error('❌ Candidate fetch error:', candidateError)
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      candidate
    })

  } catch (error) {
    console.error('❌ Get candidate error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { accessToken, ...updateData } = await request.json()
    const { id: candidateId } = await params

    if (!accessToken || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required parameters: accessToken and candidateId' },
        { status: 400 }
      )
    }

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

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Update candidate
    const { data: candidate, error: updateError } = await supabase
      .from('hr_candidates')
      .update(updateData)
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !candidate) {
      console.error('❌ Candidate update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update candidate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      candidate
    })

  } catch (error) {
    console.error('❌ Update candidate error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
    const { id: candidateId } = await params

    if (!accessToken || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required parameters: accessToken and candidateId' },
        { status: 400 }
      )
    }

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

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // First, get the candidate to retrieve the CV file URL
    const { data: candidate, error: fetchError } = await supabase
      .from('hr_candidates')
      .select('cv_file_url')
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('❌ Candidate fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Delete candidate from database
    const { error: deleteError } = await supabase
      .from('hr_candidates')
      .delete()
      .eq('id', candidateId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Candidate delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete candidate' },
        { status: 500 }
      )
    }

    // Clean up the blob file if it exists
    if (candidate?.cv_file_url) {
      console.log('🗑️ Cleaning up blob file for deleted candidate:', candidate.cv_file_url)
      try {
        await deleteBlobFile(candidate.cv_file_url)
        console.log('✅ Blob file deleted successfully')
      } catch (blobError) {
        console.error('⚠️ Failed to delete blob file:', blobError)
        // Don't fail the entire operation if blob deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete candidate error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
