import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tool functions for the Scale Expert agent
const tools = {
  // Check if user has uploaded documents
  check_user_documents: async (userId: string, parameters: {}) => {
    try {
      console.log('📋 Checking user documents for userId:', userId)
      
      const { data: documents, error } = await supabase
        .from('uploaded_documents')
        .select('id, file_name, file_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching user documents:', error)
        return { error: 'Failed to check user documents' }
      }

      if (!documents || documents.length === 0) {
        return {
          hasDocuments: false,
          totalDocuments: 0,
          message: 'Nenhum documento carregado. Podes carregar documentos para análises mais específicas.'
        }
      }

      // Group documents by type
      const documentsByType = documents.reduce((acc, doc) => {
        const type = doc.file_type || 'unknown'
        if (!acc[type]) acc[type] = []
        acc[type].push(doc)
        return acc
      }, {} as Record<string, any[]>)

      return {
        hasDocuments: true,
        totalDocuments: documents.length,
        documentsByType,
        recentDocuments: documents.slice(0, 5).map(doc => ({
          id: doc.id,
          fileName: doc.file_name,
          fileType: doc.file_type,
          uploadedAt: new Date(doc.created_at).toLocaleDateString('pt-PT')
        })),
        message: `Encontrados ${documents.length} documento(s) carregado(s). Posso analisar estes documentos para dar conselhos mais específicos.`
      }
    } catch (error) {
      console.error('❌ Error in check_user_documents:', error)
      return { error: 'Failed to check user documents' }
    }
  },

  // Get detailed sales call analysis (deprecated - transcriptions now passed in chat context)
  get_sales_call_analysis: async (userId: string, callId?: string) => {
    return {
      message: 'As transcrições das chamadas de vendas são agora incluídas automaticamente quando fazes upload de um ficheiro. Não precisas de pedir análises separadas - já tens todo o contexto da chamada disponível nesta conversa.'
    }
  },

  // Get business metrics and KPIs
  get_business_metrics: async (userId: string) => {
    try {
      // Get sales calls metrics
      const { data: salesCalls, error: salesError } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)

      if (salesError) {
        return { error: 'Failed to fetch business metrics' }
      }

      // Get HR candidates metrics
      const { data: candidates, error: hrError } = await supabase
        .from('hr_candidates')
        .select('*')
        .eq('user_id', userId)

      if (hrError) {
        return { error: 'Failed to fetch HR metrics' }
      }

      const metrics = {
        sales: {
          totalCalls: salesCalls?.length || 0,
          completedCalls: salesCalls?.filter(call => call.status === 'completed').length || 0,
          pendingCalls: salesCalls?.filter(call => call.status === 'pending').length || 0,
          averageDuration: salesCalls?.reduce((acc, call) => acc + (call.duration || 0), 0) / (salesCalls?.length || 1) || 0
        },
        hr: {
          totalCandidates: candidates?.length || 0,
          evaluatedCandidates: candidates?.filter(candidate => candidate.status === 'evaluated').length || 0,
          averageScore: candidates?.reduce((acc, candidate) => acc + (candidate.overall_score || 0), 0) / (candidates?.length || 1) || 0,
          topCandidates: candidates?.filter(candidate => candidate.overall_score && candidate.overall_score >= 8).length || 0
        },
        overall: {
          totalRecords: (salesCalls?.length || 0) + (candidates?.length || 0),
          lastActivity: new Date().toLocaleDateString('pt-PT')
        }
      }

      return metrics
    } catch (error) {
      return { error: 'Failed to calculate business metrics' }
    }
  },

  // Search for specific patterns in sales calls
  search_sales_patterns: async (userId: string, searchTerm: string) => {
    try {
      // Try sales_call_analyses table first
      const { data: salesCalls, error } = await supabase
        .from('sales_call_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error searching sales patterns from sales_call_analyses:', error)
        
        // Fallback: try sales_calls table
        console.log('🔄 Trying fallback to sales_calls table for pattern search...')
        const { data: fallbackCalls, error: fallbackError } = await supabase
          .from('sales_calls')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        if (fallbackError) {
          return { error: 'Failed to search sales patterns from both tables' }
        }

        if (!fallbackCalls || fallbackCalls.length === 0) {
          return { message: 'No sales calls found for pattern search' }
        }

        // Search for patterns in fallback data
        const matchingCalls = fallbackCalls.filter(call => 
          call.transcription && 
          call.transcription.toLowerCase().includes(searchTerm.toLowerCase())
        )

        return {
          searchTerm,
          totalCalls: fallbackCalls.length,
          matchingCalls: matchingCalls.length,
          results: matchingCalls.map(call => ({
            id: call.id,
            title: call.title,
            date: new Date(call.created_at).toLocaleDateString('pt-PT'),
            snippet: call.transcription?.substring(0, 200) + '...' || 'No transcription available',
            relevanceScore: call.transcription?.toLowerCase().split(searchTerm.toLowerCase()).length - 1 || 0
          }))
        }
      }

      if (!salesCalls || salesCalls.length === 0) {
        return { message: 'No sales calls found for pattern search' }
      }

      // Search for patterns in transcriptions from sales_call_analyses
      const matchingCalls = salesCalls.filter(call => 
        call.transcription && 
        call.transcription.toLowerCase().includes(searchTerm.toLowerCase())
      )

      const patterns = {
        searchTerm,
        totalCalls: salesCalls.length,
        matchingCalls: matchingCalls.length,
        results: matchingCalls.map(call => ({
          id: call.id,
          title: call.title,
          date: new Date(call.created_at).toLocaleDateString('pt-PT'),
          context: call.transcription?.substring(
            Math.max(0, call.transcription.toLowerCase().indexOf(searchTerm.toLowerCase()) - 100),
            call.transcription.toLowerCase().indexOf(searchTerm.toLowerCase()) + searchTerm.length + 100
          ) || 'No context found'
        }))
      }

      return patterns
    } catch (error) {
      return { error: 'Failed to search sales patterns' }
    }
  },

  // Generate scaling recommendations
  generate_scaling_recommendations: async (userId: string, focusArea: string) => {
    try {
      // Get business data for recommendations
      const { data: salesCalls } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')

      const { data: candidates } = await supabase
        .from('hr_candidates')
        .select('*')
        .eq('user_id', userId)

      const recommendations = {
        focusArea,
        timestamp: new Date().toISOString(),
        dataPoints: {
          salesCalls: salesCalls?.length || 0,
          candidates: candidates?.length || 0,
          averageScore: candidates?.reduce((acc, c) => acc + (c.overall_score || 0), 0) / (candidates?.length || 1) || 0
        },
        recommendations: []
      }

      // Generate recommendations based on focus area
      switch (focusArea.toLowerCase()) {
        case 'sales':
          if (salesCalls && salesCalls.length > 0) {
            recommendations.recommendations = [
              'Implemente um sistema de CRM para rastrear leads e oportunidades',
              'Desenvolva scripts de vendas baseados nas suas conversas mais bem-sucedidas',
              'Considere automatizar follow-ups com prospects',
              'Analise padrões de objeções para melhorar o processo de vendas'
            ]
          }
          break
        case 'hiring':
          if (candidates && candidates.length > 0) {
            recommendations.recommendations = [
              'Crie um processo de onboarding estruturado para novos colaboradores',
              'Implemente avaliações de performance regulares',
              'Desenvolva planos de carreira para reter talentos',
              'Considere programas de formação contínua'
            ]
          }
          break
        case 'operations':
          recommendations.recommendations = [
            'Implemente ferramentas de automação para tarefas repetitivas',
            'Desenvolva processos documentados para escalabilidade',
            'Considere outsourcing para funções não-core',
            'Implemente métricas de performance para monitorizar crescimento'
          ]
          break
        default:
          recommendations.recommendations = [
            'Foque na automação de processos-chave',
            'Desenvolva uma estratégia de crescimento sustentável',
            'Invista em tecnologia que suporte escalabilidade',
            'Construa uma equipa forte com processos claros'
          ]
      }

      return recommendations
    } catch (error) {
      return { error: 'Failed to generate recommendations' }
    }
  },

  // Analyze uploaded documents
  analyze_uploaded_document: async (userId: string, parameters: { documentId?: string, analysisType: string }) => {
    try {
      const { documentId, analysisType } = parameters
      
      let query = supabase
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (documentId) {
        query = query.eq('id', documentId)
      } else {
        query = query.limit(5) // Get last 5 documents for analysis
      }

      const { data: documents, error } = await query

      if (error) {
        return { error: 'Failed to fetch documents' }
      }

      if (!documents || documents.length === 0) {
        return { message: 'No documents found for analysis' }
      }

      // Analyze documents based on type
      const analysis = {
        totalDocuments: documents.length,
        analysisType,
        documents: documents.map(doc => ({
          id: doc.id,
          fileName: doc.file_name,
          fileType: doc.file_type,
          uploadedAt: new Date(doc.created_at).toLocaleDateString('pt-PT'),
          textLength: doc.extracted_text?.length || 0,
          hasText: !!doc.extracted_text
        })),
        insights: []
      }

      // Generate insights based on analysis type
      switch (analysisType) {
        case 'summary':
          analysis.insights = [
            `Encontrados ${documents.length} documentos para análise`,
            `Tipos de ficheiros: ${[...new Set(documents.map(d => d.file_type))].join(', ')}`,
            `Documento mais recente: ${documents[0].file_name}`,
            `Total de texto extraído: ${documents.reduce((sum, doc) => sum + (doc.extracted_text?.length || 0), 0)} caracteres`
          ]
          break
        case 'financial_analysis':
          analysis.insights = [
            'Análise financeira dos documentos:',
            'Procurando por indicadores financeiros, métricas de performance, e dados de receita...',
            'Recomendação: Foque em documentos com dados financeiros estruturados para melhor análise'
          ]
          break
        case 'strategy_review':
          analysis.insights = [
            'Revisão estratégica dos documentos:',
            'Analisando planos de negócio, estratégias de crescimento, e objetivos...',
            'Recomendação: Documentos estratégicos são cruciais para o planeamento de escalabilidade'
          ]
          break
        case 'compliance_check':
          analysis.insights = [
            'Verificação de conformidade:',
            'Verificando documentos para requisitos legais, regulamentações, e políticas...',
            'Recomendação: Mantenha documentação atualizada para evitar problemas de conformidade'
          ]
          break
        default:
          analysis.insights = [
            'Análise geral dos documentos:',
            'Documentos carregados com sucesso e prontos para análise',
            'Use as ferramentas de pesquisa para encontrar informações específicas'
          ]
      }

      return analysis
    } catch (error) {
      return { error: 'Failed to analyze documents' }
    }
  },

  // Analyze uploaded images for visual content
  analyze_image: async (userId: string, parameters: { imageId?: string }) => {
    try {
      const { imageId } = parameters
      
      let query = supabase
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', userId)
        .like('file_type', 'image/%')
        .order('created_at', { ascending: false })

      if (imageId) {
        query = query.eq('id', imageId)
      } else {
        query = query.limit(5) // Get last 5 images
      }

      const { data: images, error } = await query

      if (error) {
        console.error('❌ Error fetching images:', error)
        return { error: 'Failed to fetch images' }
      }

      if (!images || images.length === 0) {
        return { message: 'No images found for analysis' }
      }

      const analysis = {
        totalImages: images.length,
        images: images.map(image => ({
          id: image.id,
          fileName: image.file_name,
          fileType: image.file_type,
          fileSize: image.file_size,
          uploadDate: new Date(image.created_at).toLocaleDateString('pt-PT'),
          fileUrl: image.file_url
        })),
        insights: [
          `Total de ${images.length} imagens analisadas`,
          'Tipos de imagem: ' + [...new Set(images.map(img => img.file_type.split('/')[1]))].join(', '),
          'As imagens podem conter gráficos, diagramas, screenshots, infográficos ou outras informações visuais de negócio'
        ]
      }

      return analysis
    } catch (error) {
      console.error('❌ Error in analyze_image:', error)
      return { error: 'Failed to analyze images' }
    }
  },

  // Search documents with enhanced semantic search
  search_documents: async (userId: string, parameters: { searchTerm: string, documentType?: string }) => {
    try {
      const { searchTerm, documentType } = parameters
      
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
        return { error: 'Failed to fetch documents' }
      }

      if (!documents || documents.length === 0) {
        return { 
          message: `Nenhum documento encontrado com o termo "${searchTerm}"`,
          searchTerm,
          documentType: documentType || 'all',
          totalResults: 0,
          results: []
        }
      }

      // Try enhanced semantic search first
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scale-expert/improved-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchTerm,
            userId,
            documentType
          })
        })

        if (response.ok) {
          const enhancedResults = await response.json()
          console.log(`✅ Enhanced search completed: ${enhancedResults.totalResults} documents found`)
          return enhancedResults
        }
      } catch (enhancedError) {
        console.log('⚠️ Enhanced search failed, falling back to basic search:', enhancedError)
      }

      // Fallback to basic text search
      console.log('📝 Using basic text search as fallback')
      
      const basicResults = documents
        .filter(doc => doc.extracted_text && doc.extracted_text.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(doc => {
          const text = doc.extracted_text || ''
          const searchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase())
          
          let snippet = ''
          if (searchIndex !== -1) {
            const start = Math.max(0, searchIndex - 100)
            const end = Math.min(text.length, searchIndex + searchTerm.length + 100)
            snippet = text.substring(start, end)
            if (start > 0) snippet = '...' + snippet
            if (end < text.length) snippet = snippet + '...'
          }

          return {
            id: doc.id,
            fileName: doc.file_name,
            fileType: doc.file_type,
            uploadedAt: new Date(doc.created_at).toLocaleDateString('pt-PT'),
            snippet: snippet || 'Conteúdo encontrado mas snippet não disponível',
            relevanceScore: text.toLowerCase().split(searchTerm.toLowerCase()).length - 1,
            similarity: 0.5 // Default for basic search
          }
        })

      // Sort by relevance score
      basicResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

      return {
        searchTerm,
        documentType: documentType || 'all',
        totalResults: basicResults.length,
        results: basicResults,
        searchMethod: 'basic_text'
      }
    } catch (error) {
      console.error('❌ Search documents error:', error)
      return { error: 'Failed to search documents' }
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/tools')
  
  try {
    const { toolName, parameters, userId } = await request.json()

    if (!toolName || !userId) {
      return NextResponse.json(
        { error: 'Tool name and userId are required' },
        { status: 400 }
      )
    }

    console.log('🔧 Executing tool:', { toolName, parameters, userId })

    // Execute the requested tool
    if (tools[toolName as keyof typeof tools]) {
      const result = await tools[toolName as keyof typeof tools](userId, parameters)
      
      console.log('✅ Tool execution result:', result)
      
      return NextResponse.json({
        success: true,
        result
      })
    } else {
      return NextResponse.json(
        { error: `Unknown tool: ${toolName}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('💥 Tool execution error:', error)
    return NextResponse.json(
      { error: `Tool execution failed: ${error}` },
      { status: 500 }
    )
  }
}
