import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { searchTerm, userId, documentType } = await request.json()

    if (!searchTerm || !userId) {
      return NextResponse.json(
        { error: 'searchTerm and userId are required' },
        { status: 400 }
      )
    }

    console.log('🔍 Enhanced document search:', { searchTerm, userId, documentType })

    // Get user's documents
    let query = supabase
      .from('uploaded_documents')
      .select('*')
      .eq('user_id', userId)

    if (documentType && documentType !== 'all') {
      query = query.eq('file_type', documentType)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('❌ Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        searchTerm,
        documentType: documentType || 'all',
        totalResults: 0,
        results: [],
        message: `Nenhum documento encontrado com o termo "${searchTerm}"`
      })
    }

    // Create embedding for search term
    const searchEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: searchTerm
    })

    const searchVector = searchEmbedding.data[0].embedding

    // For each document, create embedding and calculate similarity
    const results = []
    
    for (const doc of documents) {
      if (!doc.extracted_text || doc.extracted_text.trim().length === 0) {
        continue
      }

      try {
        // Create embedding for document text (first 8000 chars to stay within limits)
        const docText = doc.extracted_text.substring(0, 8000)
        const docEmbedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: docText
        })

        const docVector = docEmbedding.data[0].embedding

        // Calculate cosine similarity
        const similarity = cosineSimilarity(searchVector, docVector)

        // Only include documents with reasonable similarity
        if (similarity > 0.1) {
          // Find the best snippet containing the search term
          const text = doc.extracted_text
          const searchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase())
          
          let snippet = ''
          if (searchIndex !== -1) {
            const start = Math.max(0, searchIndex - 150)
            const end = Math.min(text.length, searchIndex + searchTerm.length + 150)
            snippet = text.substring(start, end)
            if (start > 0) snippet = '...' + snippet
            if (end < text.length) snippet = snippet + '...'
          } else {
            // If exact term not found, take a representative snippet
            snippet = text.substring(0, 300) + (text.length > 300 ? '...' : '')
          }

          results.push({
            id: doc.id,
            fileName: doc.file_name,
            fileType: doc.file_type,
            uploadedAt: new Date(doc.created_at).toLocaleDateString('pt-PT'),
            snippet,
            similarity: Math.round(similarity * 100) / 100,
            relevanceScore: similarity
          })
        }
      } catch (embeddingError) {
        console.error('❌ Error creating embedding for document:', doc.id, embeddingError)
        // Fallback to basic text search
        if (doc.extracted_text.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            id: doc.id,
            fileName: doc.file_name,
            fileType: doc.file_type,
            uploadedAt: new Date(doc.created_at).toLocaleDateString('pt-PT'),
            snippet: doc.extracted_text.substring(0, 300) + '...',
            similarity: 0.5, // Default similarity for text match
            relevanceScore: 0.5
          })
        }
      }
    }

    // Sort by similarity score
    results.sort((a, b) => b.similarity - a.similarity)

    console.log(`✅ Enhanced search completed: ${results.length} relevant documents found`)

    return NextResponse.json({
      searchTerm,
      documentType: documentType || 'all',
      totalResults: results.length,
      results: results.slice(0, 10), // Limit to top 10 results
      searchMethod: 'semantic_embedding'
    })

  } catch (error) {
    console.error('❌ Enhanced search error:', error)
    return NextResponse.json(
      { error: 'Enhanced search failed' },
      { status: 500 }
    )
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}
