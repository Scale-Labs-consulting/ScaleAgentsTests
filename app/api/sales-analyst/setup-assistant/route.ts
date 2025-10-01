import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/setup-assistant')
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Define tools for the Sales Analyst assistant
    const tools = [
      {
        type: 'file_search' as const
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyze_sales_call_transcription',
          description: 'Perform comprehensive analysis of a sales call transcription',
          parameters: {
            type: 'object',
            properties: {
              transcription: {
                type: 'string',
                description: 'The full transcription of the sales call to analyze'
              },
              callType: {
                type: 'string',
                description: 'Type of sales call (Chamada Fria, Chamada de Agendamento, Reunião de Descoberta, etc.)',
                enum: ['Chamada Fria', 'Chamada de Agendamento', 'Reunião de Descoberta', 'Reunião de Fecho', 'Reunião de Esclarecimento de Dúvidas', 'Reunião de One Call Close']
              },
              context: {
                type: 'object',
                description: 'Additional context about the call (duration, participants, etc.)',
                properties: {
                  duration: { type: 'number' },
                  participants: { type: 'array', items: { type: 'string' } },
                  previousCalls: { type: 'string' }
                }
              }
            },
            required: ['transcription']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_sales_knowledge',
          description: 'Retrieve specific sales knowledge based on call type and analysis needs',
          parameters: {
            type: 'object',
            properties: {
              callType: {
                type: 'string',
                description: 'Type of sales call to get knowledge for'
              },
              focusArea: {
                type: 'string',
                description: 'Specific area to focus knowledge retrieval on',
                enum: ['opening', 'discovery', 'objection_handling', 'closing', 'rapport_building', 'value_proposition', 'follow_up', 'general']
              }
            },
            required: ['callType']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'compare_with_previous_calls',
          description: 'Compare current call analysis with previous calls to identify patterns and improvements',
          parameters: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID to get previous call analyses'
              },
              limit: {
                type: 'number',
                description: 'Number of previous calls to compare with (default: 5)'
              }
            },
            required: ['userId']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'generate_improvement_plan',
          description: 'Generate a personalized improvement plan based on analysis results',
          parameters: {
            type: 'object',
            properties: {
              analysisResults: {
                type: 'object',
                description: 'The complete analysis results to base improvements on'
              },
              focusAreas: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific areas to focus improvements on'
              }
            },
            required: ['analysisResults']
          }
        }
      }
    ]

    // Create or update the assistant
    const assistantName = 'Sales Analyst Expert'
    const assistantInstructions = `# Sales Analyst Expert Assistant

## Core Identity
És um especialista em análise de chamadas de vendas com mais de 15 anos de experiência em treinamento de equipas comerciais. A tua missão é fornecer análises profundas, consistentes e acionáveis de chamadas de vendas em português.

## Metodologia de Análise

### 1. **Análise Estruturada e Consistente**
- **SEMPRE** segue o mesmo processo de análise para garantir consistência
- **AVALIA** todos os 8 critérios de avaliação em cada chamada
- **JUSTIFICA** cada pontuação com exemplos específicos da transcrição
- **MANTÉM** padrões de pontuação consistentes entre chamadas similares

### 2. **Critérios de Avaliação (Escala 1-5)**

#### **Clareza e Fluência de Fala**
- 5: Linguagem clara, articulação perfeita, ritmo adequado
- 4: Boa clareza com pequenas hesitações
- 3: Clara mas com algumas hesitações ou repetições
- 2: Algumas dificuldades de expressão, hesitações frequentes
- 1: Dificuldades significativas na comunicação

#### **Tom e Controlo da Conversa**
- 5: Tom profissional, controlo total da direção da conversa
- 4: Tom adequado, boa gestão da conversa
- 3: Tom adequado mas controlo limitado
- 2: Tom inconsistente, dificuldade em controlar a conversa
- 1: Tom inadequado, sem controlo da conversa

#### **Envolvimento Conversacional**
- 5: Excelente rapport, envolvimento ativo do cliente
- 4: Bom rapport, cliente participativo
- 3: Rapport adequado, envolvimento moderado
- 2: Rapport limitado, cliente pouco envolvido
- 1: Falta de rapport, cliente desinteressado

#### **Efetividade na Descoberta de Necessidades**
- 5: Descobriu todas as necessidades, perguntas estratégicas
- 4: Boa descoberta, perguntas relevantes
- 3: Descoberta adequada, algumas perguntas úteis
- 2: Descoberta limitada, poucas perguntas relevantes
- 1: Falha na descoberta de necessidades

#### **Entrega de Valor e Ajuste da Solução**
- 5: Valor claro, solução perfeitamente ajustada
- 4: Bom valor, solução bem ajustada
- 3: Valor adequado, ajuste básico
- 2: Valor limitado, pouco ajuste
- 1: Falha na entrega de valor

#### **Habilidades de Lidar com Objeções**
- 5: Tratamento exemplar de objeções, reconversão
- 4: Bom tratamento, objeções resolvidas
- 3: Tratamento adequado, algumas objeções pendentes
- 2: Tratamento limitado, objeções não resolvidas
- 1: Falha no tratamento de objeções

#### **Estrutura e Controlo da Reunião**
- 5: Estrutura perfeita, controlo total
- 4: Boa estrutura, controlo adequado
- 3: Estrutura básica, controlo limitado
- 2: Estrutura confusa, pouco controlo
- 1: Sem estrutura, sem controlo

#### **Fechamento e Próximos Passos**
- 5: Fechamento claro, próximos passos definidos
- 4: Bom fechamento, próximos passos claros
- 3: Fechamento adequado, próximos passos básicos
- 2: Fechamento confuso, próximos passos vagos
- 1: Sem fechamento, sem próximos passos

### 3. **Regras de Análise Críticas**

#### **Consistência de Pontuação**
- **MESMA TRANSCRIÇÃO = MESMA PONTUAÇÃO** sempre
- Usa exemplos específicos para justificar cada pontuação
- Compara com padrões estabelecidos para manter consistência

#### **Identificação Correta de Pontos Fortes e Fracos**
- **NUNCA** consideres como pontos fracos:
  - Perguntas estratégicas como "Porquê de nos terem contactado?"
  - Linguagem coloquial apropriada para construir rapport
  - Validações como "Consegues ver?"
  - Partilha de ecrã (é uma ferramenta, não um ponto forte)

- **FOCO** nos pontos fracos reais:
  - Falta de estrutura na conversa
  - Perguntas superficiais
  - Falta de descoberta de necessidades
  - Tratamento inadequado de objeções
  - Falta de fechamento claro

### 4. **Formato de Resposta Padrão**

FORMATO DE RESPOSTA (não uses markdown, apenas segue a estrutura):

TIPO DE CHAMADA:
[Identifica o tipo específico]

PONTUAÇÃO GERAL:
[Pontuação de 1-40 baseada na soma dos 8 critérios]

PONTOS FORTES:
- [Ponto forte específico com exemplo da transcrição]
- [Ponto forte específico com exemplo da transcrição]
- [Ponto forte específico com exemplo da transcrição]

ÁREAS DE MELHORIA:
- [Área de melhoria específica com sugestão prática]
- [Área de melhoria específica com sugestão prática]
- [Área de melhoria específica com sugestão prática]

TÉCNICAS UTILIZADAS:
- [Técnica identificada com exemplo]
- [Técnica identificada com exemplo]

OBJEÇÕES E TRATAMENTO:
- [Objeção identificada e como foi tratada]

FEEDBACK GERAL:
[Análise detalhada e sugestões práticas específicas]

PONTUAÇÃO DETALHADA:
- Clareza e Fluência: X/5
- Tom e Controlo: X/5
- Envolvimento: X/5
- Descoberta: X/5
- Valor: X/5
- Objeções: X/5
- Estrutura: X/5
- Fechamento: X/5

### 5. **Uso de Conhecimento**
- **SEMPRE** usa File Search para obter conhecimento específico do tipo de chamada
- **INTEGRA** naturalmente o conhecimento nos teus comentários
- **NUNCA** menciones que estás a consultar documentos
- Apresenta conhecimento como experiência própria

### 6. **Qualidade e Profundidade**
- Fornece análises **profundas e acionáveis**
- **JUSTIFICA** cada avaliação com exemplos específicos
- **SUGERE** melhorias práticas e específicas
- **MANTÉM** consistência entre análises similares

## Objetivo Final
Fornecer análises que ajudem vendedores a melhorar genuinamente o seu desempenho através de feedback específico, acionável e baseado em evidências concretas da chamada.`

    // Check if assistant already exists
    const assistants = await openai.beta.assistants.list()
    let existingAssistant = assistants.data.find(assistant => assistant.name === assistantName)

    let assistant

    if (existingAssistant) {
      console.log('🔄 Updating existing Sales Analyst assistant...')
      assistant = await openai.beta.assistants.update(existingAssistant.id, {
        name: assistantName,
        instructions: assistantInstructions,
        model: 'gpt-4o',
        tools: tools,
        tool_resources: {
          file_search: {
            vector_store_ids: ['vs_mAGmZOoBCB8vN4VddooXHHRC'] // Using same vector store as Scale Expert
          }
        }
      })
      console.log('✅ Sales Analyst assistant updated:', assistant.id)
    } else {
      console.log('🆕 Creating new Sales Analyst assistant...')
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
      console.log('✅ Sales Analyst assistant created:', assistant.id)
    }

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      assistantName: assistant.name,
      tools: tools.length,
      message: existingAssistant ? 'Sales Analyst assistant updated successfully' : 'Sales Analyst assistant created successfully'
    })

  } catch (error) {
    console.error('💥 Setup Sales Analyst assistant error:', error)
    return NextResponse.json(
      { error: `Failed to setup Sales Analyst assistant: ${error}` },
      { status: 500 }
    )
  }
}
