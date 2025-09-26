import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromURL } from '@/lib/pdf-utils'
import { ChatService } from '@/lib/chat-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get assistant ID dynamically
async function getAssistantId() {
  try {
    // First, try to use the environment variable
    if (process.env.SCALE_EXPERT) {
      console.log('✅ Using SCALE_EXPERT environment variable')
      return process.env.SCALE_EXPERT
    }
    
    // If no environment variable, try to find existing assistant
    const assistants = await openai.beta.assistants.list()
    const scaleExpertAssistant = assistants.data.find(assistant => assistant.name === 'Scale Expert Agent')
    
    if (scaleExpertAssistant) {
      console.log('✅ Found existing Scale Expert Assistant')
      return scaleExpertAssistant.id
    }
    
    // If assistant doesn't exist, create it directly
    console.log('🆕 Assistant not found, creating new one...')
    
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

    const assistantName = 'Scale Expert Agent'
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

    // Try to update existing assistant first
    const existingAssistant = assistants.data.find(assistant => assistant.name === 'Scale Expert Agent')
    if (existingAssistant) {
      console.log('🔄 Updating existing assistant...')
      const updatedAssistant = await openai.beta.assistants.update(existingAssistant.id, {
        instructions: assistantInstructions,
        tools: tools
      })
      console.log('✅ Assistant updated:', updatedAssistant.id)
      return updatedAssistant.id
    }
    
    const assistant = await openai.beta.assistants.create({
      name: assistantName,
      instructions: assistantInstructions,
      model: 'gpt-4o',
      tools: tools
    })
    
    console.log('✅ Assistant created:', assistant.id)
    return assistant.id
    
  } catch (error) {
    console.error('❌ Error getting assistant ID:', error)
    throw new Error('No assistant ID available and failed to create one')
  }
}

// Function to fetch user's sales calls with transcriptions
async function getUserSalesCalls(userId: string) {
  try {
    // Fetch from sales_call_analyses table (this is where the actual data is stored)
    const { data: salesCalls, error } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5) // Limit to 5 most recent calls

    if (error) {
      console.error('❌ Error fetching sales calls:', error)
      return []
    }

    return salesCalls || []
  } catch (error) {
    console.error('❌ Error in getUserSalesCalls:', error)
    return []
  }
}

// Function to fetch user's business profile for context
async function getUserBusinessProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching business profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('❌ Error in getUserBusinessProfile:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/scale-expert/chat')
  
  try {
    const { threadId, message, userId, uploadedFile } = await request.json()
    
    console.log('📥 Received chat request:', {
      hasThreadId: !!threadId,
      hasMessage: !!message,
      hasUserId: !!userId,
      hasUploadedFile: !!uploadedFile,
      uploadedFileDetails: uploadedFile ? {
        name: uploadedFile.name,
        type: uploadedFile.type,
        fileType: uploadedFile.fileType,
        hasUrl: !!uploadedFile.url,
        hasSalesCallId: !!uploadedFile.salesCallId
      } : null
    })
    
    // Check for abort signal
    const abortSignal = request.signal
    
    if (!threadId || !message) {
      return NextResponse.json(
        { error: 'Thread ID and message are required' },
        { status: 400 }
      )
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('📝 Processing message for Scale Expert Agent...')
    console.log('📊 Message details:', { threadId, messageLength: message.length, userId })

    // Check if this is a simple greeting or basic message
    const simpleGreetings = ['olá', 'ola', 'hello', 'hi', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'como está', 'como vai', 'tudo bem', 'obrigado', 'obrigada', 'thanks', 'thank you']
    const isSimpleMessage = simpleGreetings.some(greeting => 
      message.toLowerCase().trim().includes(greeting) && message.length < 50
    )
    
    let salesCalls = []
    let businessProfile = null
    
    if (!isSimpleMessage) {
      // Only fetch context for complex messages
      console.log('📁 Fetching user sales calls for context...')
      salesCalls = await getUserSalesCalls(userId)
      console.log('📊 Found sales calls:', salesCalls.length)

      console.log('👤 Fetching user business profile for context...')
      businessProfile = await getUserBusinessProfile(userId)
      console.log('📋 Business profile found:', !!businessProfile)
    } else {
      console.log('💬 Simple message detected, skipping context fetching for speed')
    }

    // Prepare enhanced message with sales calls context, business profile, and uploaded files
    let enhancedMessage = message
    let fileContext = ''
    let businessContext = ''
    
    // For simple messages, skip complex context building
    if (isSimpleMessage) {
      enhancedMessage = message // Use original message for simple greetings
    } else {
      // Handle uploaded file if provided (validate it's a real file with URL)
      if (uploadedFile && uploadedFile.url && uploadedFile.name) {
      console.log('📁 Processing uploaded file:', uploadedFile)
      
      if (uploadedFile.fileType === 'document' && uploadedFile.extractedText) {
        // Document with pre-extracted text
        fileContext = `\n\n--- Uploaded Document Analysis ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nDocument Type: Business Document\nContent:\n${uploadedFile.extractedText}\n--- End Uploaded Document ---`
        console.log('✅ Document content provided from frontend')
      } else if (uploadedFile.fileType === 'data') {
        // Binary data file
        fileContext = `\n\n--- Uploaded Data File ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nFile Type: Binary Data File\nNote: This is a binary data file that may contain structured data, databases, or other business information. The Scale Expert can provide analysis and recommendations based on the file context and your specific questions.\n--- End Uploaded Data File ---`
        console.log('✅ Binary data file provided from frontend')
      } else if (uploadedFile.fileType === 'sales_call') {
        // Sales call - use transcription if provided directly from frontend
        console.log('🎙️ Processing sales call file:', uploadedFile)
        
        if (uploadedFile.extractedText) {
          // Transcription is already provided from frontend
          fileContext = `\n\n--- Uploaded Sales Call Transcription ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nTranscription:\n${uploadedFile.extractedText}\n--- End Uploaded Sales Call ---`
          console.log('✅ Sales call transcription provided from frontend')
        } else {
          // No transcription available yet
          fileContext = `\n\n--- Uploaded Sales Call ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nNote: This is a sales call that will be transcribed and analyzed. The transcription may take a few minutes to complete.\n--- End Uploaded Sales Call ---`
          console.log('⚠️ Sales call transcription not yet available')
        }
      } else {
        // Fallback: try to extract text from the uploaded file
        try {
          const fileContent = await extractTextFromURL(uploadedFile.url)
          
          if (fileContent && fileContent.trim()) {
            fileContext = `\n\n--- Uploaded File Analysis ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nContent:\n${fileContent}\n--- End Uploaded File ---`
            console.log('✅ File content extracted successfully')
          } else {
            console.log('⚠️ No text content extracted from file')
            fileContext = `\n\n--- Uploaded File ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nNote: This file could not be processed for text content. Please provide a summary or ask specific questions about this file.\n--- End Uploaded File ---`
          }
        } catch (fileError) {
          console.error('❌ Error processing uploaded file:', fileError)
          fileContext = `\n\n--- Uploaded File ---\nFile: ${uploadedFile.name}\nType: ${uploadedFile.type}\nNote: Error processing this file. Please provide a summary or ask specific questions about this file.\n--- End Uploaded File ---`
        }
      }
    }
    } // Close the else block for non-simple messages

    // Build business profile context (optimized for speed) - only for complex messages
    if (!isSimpleMessage && businessProfile) {
      const keyFields = []
      
      // Only include the most important fields to reduce context size
      if (businessProfile.business_product_service) {
        keyFields.push(`Produto: ${businessProfile.business_product_service}`)
      }
      if (businessProfile.ideal_customer) {
        keyFields.push(`Cliente: ${businessProfile.ideal_customer}`)
      }
      if (businessProfile.business_model) {
        keyFields.push(`Modelo: ${businessProfile.business_model}`)
      }
      if (businessProfile.monthly_revenue) {
        keyFields.push(`Receita: €${businessProfile.monthly_revenue}`)
      }
      if (businessProfile.growth_bottleneck) {
        keyFields.push(`Bottleneck: ${businessProfile.growth_bottleneck}`)
      }

      if (keyFields.length > 0) {
        businessContext = `\n\nNegócio: ${keyFields.join(' | ')}`
      }
    }
    
    // Build enhanced message only for complex messages
    if (!isSimpleMessage) {
      if (salesCalls.length > 0) {
      // Limit to 2 most recent calls and truncate transcriptions for speed
      const recentCalls = salesCalls.slice(0, 2)
      const salesCallsContext = recentCalls.map((call, index) => {
        const transcription = call.transcription || 'No transcription available'
        const truncatedTranscription = transcription.length > 1000 ? transcription.substring(0, 1000) + '...' : transcription
        const date = new Date(call.created_at).toLocaleDateString('pt-PT')
        return `\n\nCall ${index + 1} (${date}): ${call.title}\n${truncatedTranscription}`
      }).join('\n')

      enhancedMessage = `Context: ${salesCalls.length} sales calls${(uploadedFile && uploadedFile.url && uploadedFile.name) ? ', uploaded file' : ''}${businessContext ? ', business profile' : ''}.

${businessContext}${salesCallsContext}${fileContext}

Question: ${message}

Provide actionable insights and recommendations based on the context above.`
    } else if (uploadedFile && uploadedFile.url && uploadedFile.name) {
      enhancedMessage = `Context: Uploaded file${businessContext ? ', business profile' : ''}.${fileContext}

${businessContext}

Question: ${message}

Analyze and provide actionable recommendations.`
    } else if (businessContext) {
      enhancedMessage = `Context: Business profile available.

${businessContext}

Question: ${message}

Provide personalized recommendations based on their business context.`
      }
    } // Close the message building block for complex messages

    // Note: File content is already included in the enhanced message context
    // No need to upload files to OpenAI separately
    console.log('📁 File content included in message context, no separate file upload needed')
    
    // Add the user's message to the thread
    console.log('📤 Adding enhanced user message to thread...')
    
    const messageData: any = {
      role: 'user',
      content: enhancedMessage,
      metadata: {
        userId: userId || 'unknown',
        timestamp: new Date().toISOString(),
        hasSalesCalls: (salesCalls.length > 0).toString(),
        salesCallsCount: salesCalls.length.toString(),
        hasFileAttachments: ((uploadedFile && uploadedFile.url && uploadedFile.name) ? 'true' : 'false'),
        hasBusinessProfile: (!!businessProfile).toString(),
        businessProfileComplete: (!!businessProfile && businessProfile.business_product_service && businessProfile.ideal_customer && businessProfile.problem_solved && businessProfile.business_model).toString()
      }
    }
    
    const userMessage = await openai.beta.threads.messages.create(threadId, messageData)

    console.log('✅ User message added:', userMessage.id)

    // Get assistant ID and run the assistant
    console.log('🤖 Getting assistant ID...')
    const assistantId = await getAssistantId()
    console.log('🤖 Running Scale Expert Agent...')
    console.log('📊 Run creation params:', { threadId, assistantId, userId })
    
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      metadata: {
        userId: userId || 'unknown',
        timestamp: new Date().toISOString()
      }
    })

    console.log('🔄 Run created:', { runId: run?.id, runStatus: run?.status, runObject: run })

    // Validate run was created successfully
    if (!run || !run.id) {
      console.error('❌ Run creation failed - invalid response:', run)
      throw new Error('Failed to create run - no run ID returned')
    }

    // Poll for completion
    let runStatus = run.status
    let attempts = 0
    const maxAttempts = 120 // 2 minutes with 1-second intervals for faster response

    console.log('🔄 Starting polling loop with:', { threadId, runId: run.id, initialStatus: runStatus })

    while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
      // Check for abort signal
      if (abortSignal.aborted) {
        console.log('🛑 Request aborted by client')
        throw new Error('Request aborted by client')
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Run timed out after 5 minutes')
      }

      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second for faster response
      
      try {
        // Validate threadId is still valid
        if (!threadId) {
          throw new Error(`ThreadId is undefined on attempt ${attempts + 1}`)
        }
        
        console.log(`🔄 Checking run status (attempt ${attempts + 1}):`, { threadId, runId: run.id })
        
        // Use list method with limit=1 to get only the most recent run efficiently
        const runs = await openai.beta.threads.runs.list(threadId, { limit: 1 })
        let runCheck = runs.data.find(r => r.id === run.id)
        
        if (!runCheck) {
          // If not found in recent runs, try with a larger limit
          const allRuns = await openai.beta.threads.runs.list(threadId, { limit: 10 })
          const foundRun = allRuns.data.find(r => r.id === run.id)
          if (!foundRun) {
            throw new Error(`Run ${run.id} not found in thread ${threadId}`)
          }
          runCheck = foundRun
        }
        
        runStatus = runCheck.status
        attempts++

        console.log(`🔄 Run status (attempt ${attempts}):`, runStatus)

        if (runStatus === 'failed') {
          throw new Error(`Run failed: ${runCheck.last_error?.message || 'Unknown error'}`)
        }

        if (runStatus === 'cancelled') {
          throw new Error('Run was cancelled')
        }

        // Handle tool calls
        if (runStatus === 'requires_action' && runCheck.required_action?.type === 'submit_tool_outputs') {
          console.log('🔧 Processing tool calls...')
          
          const toolCalls = runCheck.required_action.submit_tool_outputs.tool_calls
          const toolOutputs = []

          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name
            const toolArgs = JSON.parse(toolCall.function.arguments)
            
            console.log(`🔧 Executing tool: ${toolName}`, toolArgs)

            try {
              // Call our tools API
              const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scale-expert/tools`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  toolName,
                  parameters: toolArgs,
                  userId
                })
              })

              if (toolResponse.ok) {
                const toolResult = await toolResponse.json()
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(toolResult.result)
                })
                console.log(`✅ Tool ${toolName} executed successfully`)
              } else {
                console.error(`❌ Tool ${toolName} failed`)
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: 'Tool execution failed' })
                })
              }
            } catch (toolError) {
              console.error(`❌ Tool ${toolName} error:`, toolError)
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Tool execution error' })
              })
            }
          }

          // Submit tool outputs
          console.log('📤 Submitting tool outputs...')
          await openai.beta.threads.runs.submitToolOutputs(run.id, {
            thread_id: threadId,
            tool_outputs: toolOutputs
          })

          console.log('✅ Tool outputs submitted, continuing run...')
          runStatus = 'in_progress'
        }
      } catch (retrieveError) {
        console.error('❌ Error retrieving run status:', retrieveError)
        console.error('❌ Debug info:', { threadId, runId: run.id, threadIdType: typeof threadId, runIdType: typeof run.id })
        throw new Error(`Failed to check run status: ${retrieveError}`)
      }
    }

    console.log('✅ Run completed with status:', runStatus)

    // Get the assistant's response
    console.log('📥 Retrieving assistant response...')
    const messages = await openai.beta.threads.messages.list(threadId)
    
    // Find the latest assistant message
    const assistantMessage = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    if (!assistantMessage) {
      throw new Error('No assistant response found')
    }

    // Extract the text content
    let responseText = assistantMessage.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text.value)
      .join('\n')

    // Clean up citation markers and source references while preserving formatting
    responseText = responseText
      .replace(/【\d+:\d+†source】/g, '') // Remove citation markers like 【4:0†source】
      .replace(/【.*?†.*?】/g, '') // Remove any other citation patterns
      .replace(/\[\d+:\d+†source\]/g, '') // Remove alternative citation formats
      .replace(/\[.*?†.*?\]/g, '') // Remove any other bracket citation patterns
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive line breaks
      .replace(/^\- /gm, '- ') // Ensure consistent bullet point formatting
      .replace(/^\* /gm, '- ') // Convert asterisk bullets to dashes
      .replace(/^(\d+)\. /gm, '$1. ') // Ensure numbered lists have proper spacing
      .replace(/\n- /g, '\n- ') // Ensure bullet points have consistent spacing
      .trim()

    console.log('✅ Assistant response retrieved:', responseText.substring(0, 100) + '...')

    // Initialize conversation ID
    let conversationId = threadId // Use threadId as conversationId for consistency

    // Save conversation and messages to database
    try {
      console.log('💾 Saving conversation and messages to database...')
      
      // Initialize chat service
      const chatService = new ChatService(userId, '00000000-0000-0000-0000-000000000001') // Scale Expert agent ID
      
      try {
        // Try to get existing conversation
        const existingConversation = await chatService.getConversationWithMessages(conversationId)
        if (!existingConversation) {
          // Create new conversation
          console.log('🆕 Creating new conversation...')
          const newConversation = await chatService.createConversation('Nova Conversa com Scale Expert')
          conversationId = newConversation.id
          console.log('✅ New conversation created:', conversationId)
        } else {
          console.log('✅ Using existing conversation:', conversationId)
        }
      } catch (conversationError) {
        console.log('🆕 Creating new conversation (existing not found)...')
        const newConversation = await chatService.createConversation('Nova Conversa com Scale Expert')
        conversationId = newConversation.id
        console.log('✅ New conversation created:', conversationId)
      }
      
      // Save user message
      console.log('💾 Saving user message...')
      await chatService.addMessage(conversationId, {
        role: 'user',
        content: message,
        tokens_used: 0,
        metadata: {
          threadId: threadId,
          hasFileAttachments: ((uploadedFile && uploadedFile.url && uploadedFile.name) ? 'true' : 'false'),
          fileInfo: uploadedFile ? {
            name: uploadedFile.name,
            type: uploadedFile.type,
            fileType: uploadedFile.fileType
          } : null
        }
      })
      
      // Save assistant response
      console.log('💾 Saving assistant response...')
      await chatService.addMessage(conversationId, {
        role: 'assistant',
        content: responseText,
        tokens_used: 0,
        metadata: {
          threadId: threadId,
          runId: run.id,
          openaiMessageId: assistantMessage.id
        }
      })
      
      console.log('✅ Messages saved to database successfully')
    } catch (dbError) {
      console.warn('⚠️ Failed to save messages to database (non-critical):', dbError)
      // Don't fail the request if database saving fails
    }

    // Track usage for free users
    try {
      const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/usage/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          agentType: 'scale-expert',
          actionType: 'message',
          referenceId: null, // Don't use OpenAI message ID as it's not a UUID
          metadata: {
            threadId: threadId,
            runId: run.id,
            openaiMessageId: assistantMessage.id,
            messageLength: responseText.length
          }
        })
      })
      
      if (usageResponse.ok) {
        console.log('✅ Usage tracked for Scale Expert message')
      } else {
        console.warn('⚠️ Failed to track usage:', await usageResponse.text())
      }
    } catch (usageError) {
      console.warn('⚠️ Usage tracking error (non-critical):', usageError)
    }

    return NextResponse.json({
      success: true,
      response: responseText,
      messageId: assistantMessage.id,
      runId: run.id,
      threadId: threadId,
      conversationId: conversationId
    })

  } catch (error) {
    console.error('💥 Chat error:', error)
    return NextResponse.json(
      { error: `Chat failed: ${error}` },
      { status: 500 }
    )
  }
}
