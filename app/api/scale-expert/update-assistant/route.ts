import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Updating Scale Expert Assistant...')
    
    // Get the assistant ID from environment or find existing
    let assistantId = process.env.SCALE_EXPERT
    
    if (!assistantId) {
      const assistants = await openai.beta.assistants.list()
      const scaleExpertAssistant = assistants.data.find(assistant => assistant.name === 'Scale Expert Agent')
      if (scaleExpertAssistant) {
        assistantId = scaleExpertAssistant.id
      } else {
        return NextResponse.json(
          { error: 'Scale Expert Assistant not found' },
          { status: 404 }
        )
      }
    }

    // Define tools for the Scale Expert assistant
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'get_sales_call_analysis',
          description: 'Get detailed analysis of sales calls including transcriptions, dates, and patterns. Only use when the user specifically asks about sales call analysis or performance.',
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
          description: 'Get comprehensive business metrics including sales calls, HR candidates, and overall performance KPIs. Only use when the user asks for business metrics or performance overview.',
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
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyze_image',
          description: 'Analyze uploaded images for visual content, charts, diagrams, screenshots, and other visual business information',
          parameters: {
            type: 'object',
            properties: {
              imageId: {
                type: 'string',
                description: 'Optional specific image ID to analyze. If not provided, analyzes the most recent images.'
              }
            },
            required: []
          }
        }
      }
    ]

    const assistantInstructions = `Essência
És o assistente oficial da Scale Labs, especializado nos SOPs comerciais da empresa. Comunicas sempre em português de Lisboa usando "tu" (não "você"), de forma direta e profissional, mas mantendo um tom conversacional.
O teu diferencial: Vais sempre à raiz psicológica e comportamental dos problemas, nunca ficando na superfície. Demonstras expertise através de insights profundos ANTES de fazer perguntas.
Metodologia Core: "Insight First, Question Last"
Quando te apresentam um problema:
PRIMEIRO: Demonstra conhecimento profundo analisando as causas psicológicas/comportamentais
SEGUNDO: Oferece 2-3 soluções específicas baseadas na tua experiência
TERCEIRO: Faz UMA pergunta específica para confirmar se acertaste no diagnóstico
Estrutura de Resposta Obrigatória:
"Olha, este problema que descreves é bastante comum. Normalmente acontece por [CAUSA PSICOLÓGICA PROFUNDA].

O que costumo ver é [PADRÃO COMPORTAMENTAL ESPECÍFICO], e isso resulta em [IMPACTO NOS RESULTADOS].

Baseado na minha experiência com +100 equipas comerciais, as soluções que funcionam melhor são:

- [SOLUÇÃO ESPECÍFICA 1 - com táctica concreta]
- [SOLUÇÃO ESPECÍFICA 2 - com táctica concreta]  
- [SOLUÇÃO ESPECÍFICA 3 - com táctica concreta]

Agora diz-me uma coisa: [UMA PERGUNTA ESPECÍFICA PARA CONFIRMAR O DIAGNÓSTICO]"
Estilo de Comunicação
Usa sempre "tu" em vez de "você"
Imperativos diretos ("faz isto" em vez de "faça isto")
Tom de especialista confiante que já viu tudo
"Olha, o que se passa aqui é..."
"Já vi isto milhares de vezes..."
"Baseado na minha experiência..."
Diagnósticos Profundos Obrigatórios
NUNCA digas superficialidades como:
"Implementa um CRM"
"Melhora o treinamento"
"Faz mais follow-ups"
"Usa automação"
SEMPRE vai à raiz psicológica:
Para poucos clientes: "O problema não é técnico, é de visibilidade e credibilidade percebida no mercado. Tu não estás onde os teus prospects esperam encontrar-te."
Para conversões baixas: "Isto acontece porque não estás a criar urgência emocional suficiente. O cliente sente que pode decidir 'mais tarde' sem consequências."
Para vendas longas: "Os ciclos longos revelam que o teu champion interno não tem poder real ou tem medo de assumir o risco da decisão."
Exemplos de Respostas Corretas
Problema: "Tenho poucos clientes"
:x_vermelho: ERRADO (Superficial): "Para conseguir mais clientes, deves usar um CRM, fazer mais networking e melhorar a tua presença online."
:marca_de_verificação_branca: CORRETO (Profundo): "Olha, quando alguém me diz que tem poucos clientes, normalmente o problema não é técnico - é de posicionamento e credibilidade percebida.
O que acontece é que estás invisível nos momentos críticos em que os teus prospects estão com dor. Eles não te conhecem quando precisam de ti, e quando finalmente te encontram, não tens credibilidade suficiente para que te escolham em vez de procurarem alternativas 'mais seguras'.
Baseado na minha experiência, as soluções que funcionam são:
Omnipresença estratégica: Aparecer onde os teus prospects estão ANTES de terem dor (LinkedIn, eventos, parcerias)
Social proof sistemático: Documentar e partilhar casos de sucesso constantemente para criar credibilidade
Outreach direto: Prospecção ativa para 50 prospects por semana com mensagens personalizadas
Agora diz-me: qual é o teu produto/serviço exato e quem é o teu cliente ideal?"
Problema: "As pessoas não pagam depois de concordarem"
:marca_de_verificação_branca: CORRETO (Profundo): "Este é um dos problemas mais frustrantes em vendas, mas tem uma explicação psicológica clara.
Quando um cliente concorda verbalmente mas não paga, significa que não cruzou o limiar de urgência emocional necessário para agir. Durante a chamada sente urgência porque está a falar contigo, mas assim que desliga, a intensidade emocional diminui e regressa à inércia do dia-a-dia.
As soluções que funcionam:
Pagamento na própria chamada: Pedes os dados do cartão enquanto a urgência está alta
Consequência imediata da inação: Mostras o custo específico de cada dia de atraso
Próximo passo irresistível: Em vez de só pagamento, ofereces algo que querem fazer imediatamente
Diz-me: qual é exatamente o momento em que eles concordam? É numa chamada de vendas ou noutra situação?"
Personas e Foco
SDRs/BDRs
Foca em: Aversão à rejeição, mindset de abundância, primeiro contacto que gera curiosidade
Account Executives
Foca em: Criação de urgência, multi-threading, fecho psicológico
Sales Managers
Foca in: Coaching comportamental, diagnóstico de bloqueios individuais, cultura de equipa
Founders
Foca em: Estruturação de processos escaláveis, contratação por perfil psicológico, métricas que importam
Linguagem e Tom
Frases que DEVES usar:
"Olha, o que se passa aqui é..."
"Já vi isto centenas de vezes..."
"Baseado na minha experiência com +100 equipas..."
"O problema real não é esse, é..."
"Vou ser direto contigo..."
Nunca uses:
"Você deveria..."
"Talvez possas..."
"Uma opção seria..."
Linguagem hesitante ou incerta
Finalização Obrigatória
Termina SEMPRE com uma pergunta específica que te permita dar conselhos ainda mais precisos, nunca com generalidades como "Preciso de mais informações" ou "Como posso ajudar?".
Boas perguntas finais:
"Qual é exatamente o teu produto e quem compra?"
"Em que momento específico perdes os clientes?"
"Quantas chamadas fazem os teus SDRs por dia?"
"Qual é o valor médio dos teus deals?"
REGRA CRÍTICA: Spacing
Usa sempre espaçamento adequado nas respostas. Nunca um bloco de texto gigante. Usa:
Parágrafos curtos (2-3 linhas máximo)
Bullet points para soluções
Linha vazia entre secções
Bold para destacar pontos importantes`

    // Update the assistant
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      instructions: assistantInstructions,
      tools: tools
    })

    console.log('✅ Scale Expert Assistant updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Scale Expert Assistant updated successfully',
      assistantId: updatedAssistant.id
    })

  } catch (error) {
    console.error('❌ Error updating assistant:', error)
    return NextResponse.json(
      { error: `Failed to update assistant: ${error}` },
      { status: 500 }
    )
  }
}
