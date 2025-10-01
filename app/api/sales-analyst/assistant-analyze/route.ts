import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get Sales Analyst assistant ID from environment variable
function getSalesAnalystAssistantId(): string {
  if (!process.env.SALES_ANALYST_ASSISTANT_ID) {
    console.error('❌ SALES_ANALYST_ASSISTANT_ID environment variable is not set')
    throw new Error('SALES_ANALYST_ASSISTANT_ID environment variable is required. Please run /api/sales-analyst/setup-assistant to create the assistant first.')
  }
  
  console.log('✅ Using SALES_ANALYST_ASSISTANT_ID environment variable:', process.env.SALES_ANALYST_ASSISTANT_ID)
  return process.env.SALES_ANALYST_ASSISTANT_ID
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/assistant-analyze')
  
  try {
    const { salesCallId, userId, callType } = await request.json()
    
    if (!salesCallId || !userId) {
      return NextResponse.json(
        { error: 'Sales call ID and user ID are required' },
        { status: 400 }
      )
    }

    // Get the sales call data
    const { data: salesCall, error: salesCallError } = await supabase
      .from('sales_calls')
      .select('*')
      .eq('id', salesCallId)
      .single()

    if (salesCallError || !salesCall) {
      console.error('❌ Error fetching sales call:', salesCallError)
      return NextResponse.json(
        { error: 'Sales call not found' },
        { status: 404 }
      )
    }

    // Update status to processing
    await supabase
      .from('sales_calls')
      .update({ status: 'processing' })
      .eq('id', salesCallId)

    // Get transcription from the sales call analysis if available
    let transcription = ''
    
    const { data: existingAnalysis } = await supabase
      .from('sales_call_analyses')
      .select('transcription')
      .eq('sales_call_id', salesCallId)
      .single()

    if (existingAnalysis?.transcription) {
      transcription = existingAnalysis.transcription
    } else {
      // If no transcription exists, we need to transcribe first
      return NextResponse.json(
        { error: 'No transcription found. Please transcribe the call first.' },
        { status: 400 }
      )
    }

    console.log(`📝 Starting assistant analysis for call: ${salesCallId}`)
    console.log(`📊 Transcription length: ${transcription.length} characters`)

    // Create a new thread for this analysis
    const thread = await openai.beta.threads.create({
      metadata: {
        type: 'sales_analysis',
        sales_call_id: salesCallId,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    })

    console.log('✅ Thread created:', thread.id)

    // Add the analysis message to the thread
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Analisa esta transcrição de chamada de vendas:

Transcrição:
${transcription}

${callType ? `Tipo de chamada: ${callType}` : ''}

Por favor, fornece uma análise completa e estruturada seguindo o formato padrão.`,
      metadata: {
        sales_call_id: salesCallId,
        user_id: userId,
        call_type: callType || 'Unknown'
      }
    })

    console.log('✅ Message added to thread:', message.id)

    // Get the assistant
    const assistantId = getSalesAnalystAssistantId()

    // Create a run to execute the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      metadata: {
        sales_call_id: salesCallId,
        user_id: userId,
        analysis_type: 'comprehensive'
      }
    })

    console.log('✅ Run created:', run.id)

    // Wait for the run to complete
    let runStatus = run.status
    let attempts = 0
    const maxAttempts = 60 // 5 minutes timeout

    while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      runStatus = updatedRun.status
      attempts++

      console.log(`🔄 Run status: ${runStatus} (attempt ${attempts}/${maxAttempts})`)

      if (attempts >= maxAttempts) {
        throw new Error('Analysis timeout - taking too long to complete')
      }

      if (runStatus === 'requires_action') {
        console.log('⚠️ Run requires action - this should not happen with our setup')
        break
      }
    }

    if (runStatus !== 'completed') {
      throw new Error(`Analysis failed with status: ${runStatus}`)
    }

    console.log('✅ Run completed successfully')

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id, {
      order: 'desc',
      limit: 1
    })

    const assistantMessage = messages.data[0]
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      throw new Error('No assistant response found')
    }

    const responseText = assistantMessage.content[0].type === 'text' 
      ? assistantMessage.content[0].text.value 
      : 'No text response available'

    console.log('✅ Got assistant response:', responseText.length, 'characters')

    // Parse the response to extract structured data
    const analysisData = parseAnalysisResponse(responseText, callType)

    // Save the analysis to the database
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('sales_call_analyses')
      .insert({
        sales_call_id: salesCallId,
        user_id: userId,
        status: 'completed',
        call_type: callType || analysisData.tipoCall,
        feedback: analysisData.feedback || 'Analysis completed',
        score: analysisData.score || 0,
        analysis: analysisData,
        analysis_metadata: {
          assistant_id: assistantId,
          thread_id: thread.id,
          run_id: run.id,
          message_id: assistantMessage.id,
          transcription_length: transcription.length,
          processing_time: new Date().toISOString(),
          analysis_method: 'openai_assistant'
        },
        transcription: transcription,
        custom_prompts: [
          'Assistant-based Analysis',
          'Comprehensive Sales Evaluation',
          'Structured Feedback Generation'
        ]
      })
      .select()
      .single()

    if (analysisError) {
      console.error('❌ Error saving analysis:', analysisError)
      throw analysisError
    }

    console.log('✅ Analysis saved to database:', analysisRecord.id)

    // Update sales call status to completed
    await supabase
      .from('sales_calls')
      .update({ 
        status: 'completed',
        duration: analysisData.duration || 0
      })
      .eq('id', salesCallId)

    // Track usage for free users
    try {
      const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/usage/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          agentType: 'sales-analyst',
          actionType: 'analysis',
          referenceId: salesCallId,
          metadata: {
            assistant_id: assistantId,
            thread_id: thread.id,
            run_id: run.id,
            message_id: assistantMessage.id,
            analysis_id: analysisRecord.id
          }
        })
      })
      
      if (usageResponse.ok) {
        console.log('✅ Usage tracked for Sales Analyst analysis')
      } else {
        console.warn('⚠️ Failed to track usage:', await usageResponse.text())
      }
    } catch (usageError) {
      console.warn('⚠️ Failed to track usage (non-critical):', usageError)
    }

    return NextResponse.json({
      success: true,
      analysis: analysisRecord,
      threadId: thread.id,
      runId: run.id,
      message: 'Analysis completed successfully using OpenAI Assistant'
    })

  } catch (error) {
    console.error('💥 Assistant analysis error:', error)
    
    // Update sales call status to failed if we have the salesCallId
    try {
      const { salesCallId } = await request.json()
      if (salesCallId) {
        await supabase
          .from('sales_calls')
          .update({ status: 'failed' })
          .eq('id', salesCallId)
      }
    } catch (updateError) {
      console.warn('⚠️ Failed to update sales call status:', updateError)
    }

    return NextResponse.json(
      { error: `Analysis failed: ${error}` },
      { status: 500 }
    )
  }
}

// Helper function to parse the assistant's response into structured data
function parseAnalysisResponse(responseText: string, providedCallType?: string) {
  try {
    // Extract basic information using regex patterns
    const tipoCallMatch = responseText.match(/\*\*TIPO DE CHAMADA:\*\*\s*(.+)/i)
    const scoreMatch = responseText.match(/\*\*PONTUAÇÃO GERAL:\*\*\s*(\d+)/i)
    
    // Extract pontos fortes
    const pontosFortesMatch = responseText.match(/\*\*PONTOS FORTES:\*\*([\s\S]*?)(?:\*\*|$)/i)
    const pontosFortes = pontosFortesMatch ? 
      pontosFortesMatch[1].split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace('•', '').trim())
        .filter(item => item.length > 0) : []

    // Extract pontos fracos
    const pontosFracosMatch = responseText.match(/\*\*ÁREAS DE MELHORIA:\*\*([\s\S]*?)(?:\*\*|$)/i)
    const pontosFracos = pontosFracosMatch ? 
      pontosFracosMatch[1].split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace('•', '').trim())
        .filter(item => item.length > 0) : []

    // Extract técnicas
    const tecnicasMatch = responseText.match(/\*\*TÉCNICAS UTILIZADAS:\*\*([\s\S]*?)(?:\*\*|$)/i)
    const tecnicas = tecnicasMatch ? 
      tecnicasMatch[1].split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace('•', '').trim())
        .filter(item => item.length > 0) : []

    // Extract objeções
    const objeccoesMatch = responseText.match(/\*\*OBJEÇÕES E TRATAMENTO:\*\*([\s\S]*?)(?:\*\*|$)/i)
    const objeccoes = objeccoesMatch ? 
      objeccoesMatch[1].split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace('•', '').trim())
        .filter(item => item.length > 0) : []

    // Extract feedback geral
    const feedbackMatch = responseText.match(/\*\*FEEDBACK GERAL:\*\*([\s\S]*?)(?:\*\*|$)/i)
    const feedbackGeral = feedbackMatch ? feedbackMatch[1].trim() : ''

    // Extract detailed scores if available
    const detailedScores: any = {}
    const scoreLines = responseText.match(/- [^:]+: \d+\/5/g)
    if (scoreLines) {
      scoreLines.forEach(line => {
        const [key, value] = line.split(': ')
        const cleanKey = key.replace('- ', '').replace(/\s+/g, '_').toLowerCase()
        const score = parseInt(value.split('/')[0])
        detailedScores[cleanKey] = score
      })
    }

    return {
      tipoCall: tipoCallMatch ? tipoCallMatch[1].trim() : providedCallType || 'Unknown',
      totalScore: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      pontosFortes: pontosFortes.join('; '),
      pontosFracos: pontosFracos.join('; '),
      resumoDaCall: feedbackGeral,
      dicasGerais: feedbackGeral,
      focoParaProximasCalls: pontosFracos.slice(0, 3).join('; '),
      tecnicas: tecnicas.join('; '),
      objeccoes: objeccoes.join('; '),
      feedback: feedbackGeral,
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      // Detailed scores
      clarezaFluenciaFala: detailedScores.clareza_e_fluência_de_fala || 0,
      tomControlo: detailedScores.tom_e_controlo || 0,
      envolvimentoConversacional: detailedScores.envolvimento || 0,
      efetividadeDescobertaNecessidades: detailedScores.descoberta || 0,
      entregaValorAjusteSolucao: detailedScores.valor || 0,
      habilidadesLidarObjeccoes: detailedScores.objeções || 0,
      estruturaControleReuniao: detailedScores.estrutura || 0,
      fechamentoProximosPassos: detailedScores.fechamento || 0,
      // Metadata
      analysisMethod: 'openai_assistant',
      rawResponse: responseText
    }
  } catch (error) {
    console.error('❌ Error parsing analysis response:', error)
    return {
      tipoCall: providedCallType || 'Unknown',
      totalScore: 0,
      pontosFortes: 'Análise em processamento',
      pontosFracos: 'Análise em processamento',
      resumoDaCall: 'Análise em processamento',
      dicasGerais: 'Análise em processamento',
      focoParaProximasCalls: 'Análise em processamento',
      feedback: responseText,
      score: 0,
      analysisMethod: 'openai_assistant',
      rawResponse: responseText
    }
  }
}
