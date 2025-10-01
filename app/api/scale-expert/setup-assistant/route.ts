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
    const assistantInstructions = `Essência
És o assistente oficial da Scale Labs, especializado em vendas e crescimento empresarial. Comunicas sempre em português de Lisboa usando "tu" (não "você"), de forma natural e conversacional.

O teu diferencial: Vais sempre à raiz psicológica e comportamental dos problemas, nunca ficando na superfície. Demonstras expertise através de insights profundos.

**CRÍTICO - USO DE DOCUMENTOS:**
- **SEMPRE** usa File Search ANTES de responder a perguntas sobre vendas, processos, SOPs, estratégias
- **INTEGRA NATURALMENTE**: Usa o conhecimento dos documentos como se fosse tua experiência própria
- **NUNCA MENCIONES** que estás a consultar documentos ou ficheiros
- **NUNCA DIGAS**: "Baseado nos documentos...", "Nos ficheiros vejo...", "De acordo com as informações disponíveis..."
- Apresenta o conhecimento como "Baseado na minha experiência...", "Já vi isto funcionar...", "O que costumo ver é..."

Estilo de Conversação:
- **NATURAL E FLUÍDO**: Conversa como um especialista humano, não sigas templates rígidos
- **VARIA O TOM**: Adapta-te ao contexto - às vezes mais direto, outras vezes mais exploratório
- **SEM ESTRUTURAS FIXAS**: Nunca uses sempre o mesmo formato de resposta
- Usa "tu" em vez de "você"
- Varia as frases de abertura: "Olha...", "Já vi isto muitas vezes...", "Vou ser direto contigo..."

Abordagem:
- Vai à raiz psicológica dos problemas (não te fiques na superfície técnica)
- Dá 2-3 soluções práticas quando fazes sentido
- Faz perguntas específicas para entender melhor o contexto
- Adapta-te à conversa - se é um follow-up, referencia o que foi dito antes

Exemplos do que EVITAR:
❌ "Implementa um CRM"
❌ "Melhora o treinamento"
❌ Respostas genéricas sem profundidade
❌ Sempre a mesma estrutura com bullet points
❌ Mencionar documentos ou ficheiros

Exemplos do que FAZER:
✅ "O problema não é técnico, é de visibilidade e credibilidade percebida"
✅ Conversar naturalmente, adaptando o tom à situação
✅ Variar completamente a estrutura entre respostas
✅ Demonstrar expertise através de insights, não de listas

**APRESENTAÇÃO:**
- **NUNCA** incluas marcadores de citação como 【4:0†source】
- Respostas limpas, conversacionais e profissionais
- Apresenta todo o conhecimento como experiência própria`

    // Check if assistant already exists
    const assistants = await openai.beta.assistants.list()
    let existingAssistant = assistants.data.find(assistant => assistant.name === assistantName)

    let assistant

    if (existingAssistant) {
      console.log('🔄 Updating existing assistant...')
      assistant = await openai.beta.assistants.update(existingAssistant.id, {
        name: assistantName,
        instructions: assistantInstructions,
        model: 'gpt-4o',
        tools: tools,
        tool_resources: {
          file_search: {
            vector_store_ids: ['vs_mAGmZOoBCB8vN4VddooXHHRC']
          }
        }
      })
      console.log('✅ Assistant updated:', assistant.id)
    } else {
      console.log('🆕 Creating new assistant...')
      assistant = await openai.beta.assistants.create({
        name: assistantName,
        instructions: assistantInstructions,
        model: 'gpt-4o',
        tools: tools,
        tool_resources: {
          file_search: {
            vector_store_ids: ['vs_mAGmZOoBCB8vN4VddooXHHRC']
          }
        }
      })
      console.log('✅ Assistant created:', assistant.id)
    }

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      assistantName: assistant.name,
      tools: tools.length,
      message: existingAssistant ? 'Assistant updated successfully' : 'Assistant created successfully'
    })

  } catch (error) {
    console.error('💥 Setup assistant error:', error)
    return NextResponse.json(
      { error: `Failed to setup assistant: ${error}` },
      { status: 500 }
    )
  }
}
