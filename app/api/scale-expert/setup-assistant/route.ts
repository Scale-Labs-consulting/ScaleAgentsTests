import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/setup-assistant')
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Check if SCALE_EXPERT environment variable is set
    if (!process.env.SCALE_EXPERT) {
      console.error('❌ SCALE_EXPERT environment variable is not set')
      return NextResponse.json(
        { error: 'SCALE_EXPERT environment variable is required' },
        { status: 500 }
      )
    }

    // Check if VECTOR_STORE_ID environment variable is set
    if (!process.env.VECTOR_STORE_ID) {
      console.error('❌ VECTOR_STORE_ID environment variable is not set')
      return NextResponse.json(
        { error: 'VECTOR_STORE_ID environment variable is required' },
        { status: 500 }
      )
    }

    // Define tools for the Scale Expert assistant
    const tools = [
      {
        type: 'file_search' as const
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_sales_call_analysis',
          description: 'Get detailed analysis of sales calls including transcriptions, dates, and patterns',
          parameters: {
            type: 'object',
            properties: {
              callId: {
                type: 'string',
                description: 'Optional specific call ID to analyze. If not provided, analyzes the most recent calls.'
              }
            },
            required: []
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_business_metrics',
          description: 'Get comprehensive business metrics including sales calls, HR candidates, and overall performance KPIs',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'search_sales_patterns',
          description: 'Search for specific patterns, keywords, or phrases in sales call transcriptions',
          parameters: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'The term or phrase to search for in sales call transcriptions'
              }
            },
            required: ['searchTerm']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'generate_scaling_recommendations',
          description: 'Generate specific scaling recommendations based on business data and focus area',
          parameters: {
            type: 'object',
            properties: {
              focusArea: {
                type: 'string',
                description: 'The area to focus recommendations on: sales, hiring, operations, or general',
                enum: ['sales', 'hiring', 'operations', 'general']
              }
            },
            required: ['focusArea']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyze_uploaded_document',
          description: 'Analyze uploaded documents (PDF, Word, Excel, etc.) and extract business insights',
          parameters: {
            type: 'object',
            properties: {
              documentId: {
                type: 'string',
                description: 'Optional specific document ID to analyze. If not provided, analyzes the most recent documents.'
              },
              analysisType: {
                type: 'string',
                description: 'Type of analysis to perform on the document',
                enum: ['summary', 'financial_analysis', 'strategy_review', 'compliance_check', 'general_insights']
              }
            },
            required: ['analysisType']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'search_documents',
          description: 'Search for specific content, keywords, or patterns in uploaded documents',
          parameters: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'The term or phrase to search for in document content'
              },
              documentType: {
                type: 'string',
                description: 'Optional filter by document type',
                enum: ['pdf', 'word', 'excel', 'powerpoint', 'text', 'all']
              }
            },
            required: ['searchTerm']
          }
        }
      }
    ]

    // Create or update the assistant
    const assistantName = 'Scale Expert Agent'
    const assistantInstructions = `## Core Identity
És o assistente oficial da Scale Labs, especializado em vendas e crescimento empresarial. Comunicas sempre em português de Lisboa usando "tu", de forma direta e profissional, mas natural.

## Metodologia
- **Insight First**: Sempre demonstra conhecimento profundo antes de fazer perguntas
- **Context Aware**: Usa toda a conversa anterior para dar respostas personalizadas
- **Natural Flow**: Adapta o tom e estrutura conforme a situação

## Estilo de Comunicação
- Usa "tu" em vez de "você"
- Tom de especialista confiante mas humano
- Varia as frases de abertura:
  - "Olha, o que se passa aqui é..."
  - "Já vi isto muitas vezes..."
  - "Baseado na minha experiência..."
  - "O problema real não é esse, é..."
  - "Vou ser direto contigo..."

## Estrutura Flexível (NÃO OBRIGATÓRIA)
**Para problemas novos:**
1. Diagnóstico psicológico/comportamental
2. 2-3 soluções específicas
3. Uma pergunta para confirmar

**Para follow-ups:**
- Referencia a conversa anterior
- Dá continuidade natural
- Não repete o mesmo formato

## Regras Importantes
- **NUNCA** uses a mesma estrutura em todas as respostas
- **SEMPRE** referencia a conversa anterior quando relevante
- **VARIA** as frases de abertura e estrutura
- **ADAPTA** o tom conforme a situação
- **MANTÉM** a expertise mas com naturalidade

## Diagnósticos Profundos
Vai sempre à raiz psicológica, não superficialidades:

❌ **ERRADO**: "Implementa um CRM", "Melhora o treinamento"
✅ **CORRETO**: "O problema não é técnico, é de visibilidade e credibilidade percebida"

## Finalização
Termina com perguntas específicas que permitam dar conselhos mais precisos, mas varia o formato:
- "Agora diz-me: [pergunta específica]"
- "Diz-me uma coisa: [pergunta específica]"
- "Para te ajudar melhor: [pergunta específica]"
- "Só mais uma coisa: [pergunta específica]"

**CRÍTICO - USO DE DOCUMENTOS:**
- **SEMPRE** usa File Search ANTES de responder a perguntas sobre vendas, processos, SOPs, estratégias
- **INTEGRA NATURALMENTE**: Usa o conhecimento dos documentos como se fosse tua experiência própria
- **NUNCA MENCIONES** que estás a consultar documentos ou ficheiros
- **NUNCA DIGAS**: "Baseado nos documentos...", "Nos ficheiros vejo...", "De acordo com as informações disponíveis..."
- Apresenta o conhecimento como "Baseado na minha experiência...", "Já vi isto funcionar...", "O que costumo ver é..."

**APRESENTAÇÃO:**
- **NUNCA** incluas marcadores de citação como 【4:0†source】
- Respostas limpas, conversacionais e profissionais
- Apresenta todo o conhecimento como experiência própria`

    // Update the existing assistant using the SCALE_EXPERT environment variable
    console.log('🔄 Updating existing assistant with ID:', process.env.SCALE_EXPERT)
    
    const assistant = await openai.beta.assistants.update(process.env.SCALE_EXPERT, {
      name: assistantName,
      instructions: assistantInstructions,
      model: 'gpt-4o',
      tools: tools,
      tool_resources: {
        file_search: {
          vector_store_ids: [process.env.VECTOR_STORE_ID]
        }
      }
    })
    
    console.log('✅ Assistant updated:', assistant.id)

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      assistantName: assistant.name,
      tools: tools.length,
      message: 'Assistant updated successfully'
    })

  } catch (error) {
    console.error('💥 Setup assistant error:', error)
    return NextResponse.json(
      { error: `Failed to setup assistant: ${error}` },
      { status: 500 }
    )
  }
}
