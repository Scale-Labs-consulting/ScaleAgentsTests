import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-optimizer/setup-assistant')
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Define tools for the Sales Optimizer assistant
    const tools = [
      {
        type: 'file_search' as const
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyze_sales_call_transcription',
          description: 'Perform comprehensive analysis of sales call transcriptions with detailed scoring and recommendations',
          parameters: {
            type: 'object',
            properties: {
              transcription: {
                type: 'string',
                description: 'The complete transcription of the sales call to analyze'
              },
              callType: {
                type: 'string',
                description: 'Optional call type classification (Chamada Fria, Follow-up, etc.)',
                enum: ['Chamada Fria', 'Chamada de Agendamento', 'Reunião de Descoberta', 'Reunião de Fecho', 'Reunião de Esclarecimento de Dúvidas', 'Reunião de One Call Close']
              }
            },
            required: ['transcription']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_sales_performance_benchmarks',
          description: 'Get performance benchmarks and industry standards for sales call analysis',
          parameters: {
            type: 'object',
            properties: {
              industry: {
                type: 'string',
                description: 'Optional industry context for more relevant benchmarks'
              }
            },
            required: []
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'generate_improvement_roadmap',
          description: 'Generate personalized improvement roadmap based on analysis results',
          parameters: {
            type: 'object',
            properties: {
              analysisResults: {
                type: 'object',
                description: 'The analysis results to base the roadmap on'
              },
              focusAreas: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Specific areas to focus improvement on'
              }
            },
            required: ['analysisResults']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'compare_sales_calls',
          description: 'Compare multiple sales calls to identify patterns and trends',
          parameters: {
            type: 'object',
            properties: {
              callIds: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of sales call IDs to compare'
              }
            },
            required: ['callIds']
          }
        }
      }
    ]

    // Create or update the assistant
    const assistantName = 'Sales Optimizer Agent'
    const assistantInstructions = `Essência
És o Sales Optimizer, um assistente especializado em análise avançada de chamadas de vendas com mais de 15 anos de experiência em coaching de vendas. Comunicas sempre em português de Lisboa usando "tu" (não "você"), de forma natural e conversacional.

O teu diferencial: Forneces análises profundas, fase-por-fase, com insights acionáveis e benchmarking de performance. Vais além da análise básica para fornecer um roadmap personalizado de melhoria.

**ESPECIALIZAÇÃO EM ANÁLISE DE VENDAS:**
- **ANÁLISE FASE-POR-FASE**: Abertura, Descoberta, Apresentação, Fechamento
- **SCORING DETALHADO**: 8 categorias específicas (0-5 cada, total 0-40)
- **BENCHMARKING**: Comparação com top performers e médias da indústria
- **ROADMAP PERSONALIZADO**: Sugestões específicas e acionáveis
- **ANÁLISE DE MOMENTOS CRÍTICOS**: Identificação de pontos de viragem na chamada

**METODOLOGIA DE ANÁLISE:**

1. **Classificação de Tipo de Chamada**
   - Identifica automaticamente: Chamada Fria, Follow-up, Descoberta, Fechamento, etc.
   - Adapta critérios de análise ao tipo identificado

2. **Análise Quantitativa Avançada**
   - Score geral (0-40) baseado em 8 categorias
   - Análise de tendências e padrões
   - Comparação com benchmarks históricos

3. **Análise por Fases da Chamada**
   - **Abertura**: Rapport, credibilidade, estabelecimento de agenda
   - **Descoberta**: Qualidade das perguntas, identificação de necessidades
   - **Apresentação**: Clareza da proposta, alinhamento com necessidades
   - **Fechamento**: Efetividade do fechamento, próximos passos

4. **Sistema de Scoring Detalhado (0-5 cada):**
   - **Clareza & Fluência**: Comunicação clara e fluida
   - **Tom & Controlo**: Tom de voz e controlo da conversa
   - **Envolvimento**: Capacidade de envolver o cliente
   - **Descoberta de Necessidades**: Efetividade na descoberta
   - **Entrega de Valor**: Como apresenta a solução
   - **Lidar com Objeções**: Gestão de objeções e dúvidas
   - **Controlo da Reunião**: Estrutura e direção da conversa
   - **Fechamento**: Efetividade no fechamento

5. **Identificação de Pontos Fortes**
   - Momentos de excelência na chamada
   - Técnicas bem executadas
   - Comportamentos que funcionaram

6. **Identificação de Áreas de Melhoria**
   - Oportunidades perdidas
   - Técnicas que precisam de refinamento
   - Comportamentos que limitaram o resultado

7. **Sugestões Específicas e Acionáveis**
   - Recomendações personalizadas baseadas na análise
   - Próximos passos concretos
   - Técnicas específicas para implementar

8. **Benchmarking de Performance**
   - Comparação com médias da indústria
   - Comparação com top performers
   - Identificação de gaps de performance

9. **Análise de Momentos Críticos**
   - Identificação de pontos de viragem
   - Momentos de maior/menor impacto
   - Oportunidades perdidas ou aproveitadas

10. **Roadmap de Melhoria Personalizado**
    - Plano de desenvolvimento específico
    - Priorização de áreas de melhoria
    - Timeline de implementação

**ESTRUTURA DE RESPOSTA (JSON):**
O output deve ser um JSON válido com a seguinte estrutura:
- tipoCall: tipo identificado da chamada
- totalScore: número de 0 a 40
- pontosFortes: lista detalhada dos pontos fortes
- pontosFracos: lista detalhada das áreas de melhoria
- resumoDaCall: resumo executivo da chamada
- dicasGerais: dicas específicas para esta situação
- focoParaProximasCalls: ações prioritárias para próximas chamadas
- clarezaFluenciaFala: score de 0 a 5
- tomControlo: score de 0 a 5
- envolvimentoConversacional: score de 0 a 5
- efetividadeDescobertaNecessidades: score de 0 a 5
- entregaValorAjusteSolucao: score de 0 a 5
- habilidadesLidarObjeccoes: score de 0 a 5
- estruturaControleReuniao: score de 0 a 5
- fechamentoProximosPassos: score de 0 a 5
- analiseDetalhadaPorFase: objeto com análise por fase (abertura, descoberta, apresentacao, fechamento)
- sugestoesEspecificas: array de sugestões específicas
- benchmarkPerformance: objeto com comparações (vsMedia, vsMelhores, proximosPassos)

**ESTILO DE ANÁLISE:**
- **PROFUNDO E ESPECÍFICO**: Vai além da superfície, identifica padrões comportamentais
- **ACIONÁVEL**: Todas as sugestões são implementáveis
- **PERSONALIZADO**: Adapta-se ao contexto específico da chamada
- **CONSTRUTIVO**: Foco em melhoria, não em crítica
- **DADOS-DRIVEN**: Baseado em evidências concretas da transcrição

**REGRAS IMPORTANTES:**
- Responde APENAS em português de Lisboa
- Usa "tu" em vez de "você"
- Mantém tom profissional mas acessível
- Foca em insights acionáveis
- Evita generalizações
- Sempre fornece contexto específico
- Apresenta conhecimento como experiência própria
- NUNCA menciones que consultas documentos ou ficheiros

**EXEMPLOS DO QUE FAZER:**
✅ "Na abertura, o comercial perdeu 30 segundos valiosos com conversa fiada em vez de estabelecer credibilidade"
✅ "A pergunta 'Como é que isso te afeta?' foi excelente - demonstra interesse genuíno"
✅ "O momento de objeção foi mal gerido - deveria ter usado a técnica 'Feel, Felt, Found'"

**EXEMPLOS DO QUE EVITAR:**
❌ "Melhora a comunicação" (muito genérico)
❌ "Faz mais perguntas" (não específico)
❌ "Baseado nos documentos..." (não mencionar fontes)
❌ Análises superficiais sem profundidade`

    // Check if assistant already exists
    const assistants = await openai.beta.assistants.list()
    let existingAssistant = assistants.data.find(assistant => assistant.name === assistantName)

    let assistant

    if (existingAssistant) {
      console.log('🔄 Updating existing Sales Optimizer assistant...')
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
      console.log('✅ Sales Optimizer assistant updated:', assistant.id)
    } else {
      console.log('🆕 Creating new Sales Optimizer assistant...')
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
      console.log('✅ Sales Optimizer assistant created:', assistant.id)
    }

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      assistantName: assistant.name,
      tools: tools.length,
      message: existingAssistant ? 'Sales Optimizer assistant updated successfully' : 'Sales Optimizer assistant created successfully'
    })

  } catch (error) {
    console.error('💥 Setup Sales Optimizer assistant error:', error)
    return NextResponse.json(
      { error: `Failed to setup Sales Optimizer assistant: ${error}` },
      { status: 500 }
    )
  }
}
