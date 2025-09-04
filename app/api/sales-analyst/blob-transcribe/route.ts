import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { del } from '@vercel/blob'
import { 
  getMomentosFortesFracosPrompt,
  getAnaliseQuantitativaPrompt,
  getPontosFortesPrompt,
  getPontosFortesGSPrompt,
  getPontosFracosPrompt,
  getPontosFracosGSPrompt,
  getAnaliseQuantitativaCompletaPrompt,
  getExplicacaoPontuacaoPrompt,
  getJustificacaoGSPrompt,
  getTipoCallPrompt,
  getJustificativaAvaliacaoPrompt,
  SYSTEM_PROMPTS
} from '@/lib/comprehensive-prompts'

// Function to perform comprehensive analysis
async function performComprehensiveAnalysis(transcription: string) {
  console.log('🔍 Starting streamlined analysis...')
  
  const results = {
    // Essential fields only
    tipoCall: '',
    totalScore: 0,
    pontosFortes: '',
    pontosFracos: '',
    resumoDaCall: '',
    dicasGerais: '',
    focoParaProximasCalls: '',
    // 8 scoring fields
    clarezaFluenciaFala: 0,
    tomControlo: 0,
    envolvimentoConversacional: 0,
    efetividadeDescobertaNecessidades: 0,
    entregaValorAjusteSolucao: 0,
    habilidadesLidarObjeccoes: 0,
    estruturaControleReuniao: 0,
    fechamentoProximosPassos: 0
  }

  try {
    // 1. Determine call type first
    console.log('📞 Analyzing call type...')
    const tipoCallResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.TIPO_CALL },
          { role: 'user', content: getTipoCallPrompt(transcription) }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    })

    if (tipoCallResponse.ok) {
      const tipoCallData = await tipoCallResponse.json()
      const numericCallType = tipoCallData.choices[0].message.content.trim()
      
      // Convert numeric call type to proper label
      const callTypeMap: { [key: string]: string } = {
        '1': 'Chamada Fria',
        '2': 'Chamada de Agendamento',
        '3': 'Reunião de Descoberta',
        '4': 'Reunião de Fecho',
        '5': 'Reunião de Esclarecimento de Dúvidas',
        '6': 'Reunião de One Call Close'
      }
      
      results.tipoCall = callTypeMap[numericCallType] || numericCallType
      console.log('✅ Call type determined:', results.tipoCall)
    }

    // 2. Perform essential analyses in parallel
    console.log('🔄 Performing essential analyses...')
    const analysisPromises = [
      // Pontos Fortes
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FORTES },
            { role: 'user', content: getPontosFortesPrompt(transcription) }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      }),
      
      // Pontos Fracos
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FRACOS },
            { role: 'user', content: getPontosFracosPrompt(transcription) }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      }),
      
      // Resumo da Call
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'És um especialista em análise de calls de vendas. Fornece um resumo conciso e objetivo da call.' },
            { role: 'user', content: `Analisa a seguinte transcrição e fornece um resumo da call de vendas em português de Lisboa (máx. 200 palavras):\n\n${transcription}` }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }),
      
      // Dicas Gerais
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'És um especialista em vendas. Fornece dicas gerais de melhoria baseadas na análise da call.' },
            { role: 'user', content: `Com base na seguinte transcrição de call de vendas, fornece dicas gerais de melhoria em português de Lisboa (máx. 150 palavras):\n\n${transcription}` }
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      }),
      
      // Foco para Próximas Calls
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'És um especialista em vendas. Identifica áreas específicas para focar nas próximas calls.' },
            { role: 'user', content: `Com base na seguinte transcrição de call de vendas, identifica 3-5 áreas específicas para focar nas próximas calls em português de Lisboa (máx. 150 palavras):\n\n${transcription}` }
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      }),
      
      // Comprehensive scoring analysis
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.ANALISE_QUANTITATIVA_COMPLETA },
            { role: 'user', content: getAnaliseQuantitativaCompletaPrompt(transcription) }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      })
    ]

    const analysisResponses = await Promise.all(analysisPromises)

    // Process analysis responses
    if (analysisResponses[0].ok) {
      const data = await analysisResponses[0].json()
      results.pontosFortes = data.choices[0].message.content
      console.log('✅ Pontos Fortes:', results.pontosFortes.length, 'characters')
    } else {
      console.error('❌ Pontos Fortes failed:', analysisResponses[0].status)
    }

    if (analysisResponses[1].ok) {
      const data = await analysisResponses[1].json()
      results.pontosFracos = data.choices[0].message.content
      console.log('✅ Pontos Fracos:', results.pontosFracos.length, 'characters')
    } else {
      console.error('❌ Pontos Fracos failed:', analysisResponses[1].status)
    }
    
    if (analysisResponses[2].ok) {
      const data = await analysisResponses[2].json()
      results.resumoDaCall = data.choices[0].message.content
      console.log('✅ Resumo da Call:', results.resumoDaCall.length, 'characters')
    } else {
      console.error('❌ Resumo da Call failed:', analysisResponses[2].status)
    }
    
    if (analysisResponses[3].ok) {
      const data = await analysisResponses[3].json()
      results.dicasGerais = data.choices[0].message.content
      console.log('✅ Dicas Gerais:', results.dicasGerais.length, 'characters')
    } else {
      console.error('❌ Dicas Gerais failed:', analysisResponses[3].status)
    }
    
    if (analysisResponses[4].ok) {
      const data = await analysisResponses[4].json()
      results.focoParaProximasCalls = data.choices[0].message.content
      console.log('✅ Foco para Próximas Calls:', results.focoParaProximasCalls.length, 'characters')
    } else {
      console.error('❌ Foco para Próximas Calls failed:', analysisResponses[4].status)
    }

    // Process scoring analysis
    if (analysisResponses[5].ok) {
      const data = await analysisResponses[5].json()
      const scoringContent = data.choices[0].message.content
      
      // Parse total score
      const scoringMatch = scoringContent.match(/Pontuação Total:\s*(\d+)\/40/i)
      if (scoringMatch) {
        results.totalScore = parseInt(scoringMatch[1])
      }
      
      // Parse individual scoring fields
      console.log('🔍 Parsing individual scoring fields...')
      const scoringFields = [
        { key: 'clarezaFluenciaFala', pattern: /Clareza e Fluência da Fala[:\s]*(\d+)/i },
        { key: 'tomControlo', pattern: /Tom e Controlo[:\s]*(\d+)/i },
        { key: 'envolvimentoConversacional', pattern: /Envolvimento Conversacional[:\s]*(\d+)/i },
        { key: 'efetividadeDescobertaNecessidades', pattern: /Efetividade na Descoberta de Necessidades[:\s]*(\d+)/i },
        { key: 'entregaValorAjusteSolucao', pattern: /Entrega de Valor e Ajuste da Solução[:\s]*(\d+)/i },
        { key: 'habilidadesLidarObjeccoes', pattern: /Habilidades de Lidar com Objeções[:\s]*(\d+)/i },
        { key: 'estruturaControleReuniao', pattern: /Estrutura e Controle da Reunião[:\s]*(\d+)/i },
        { key: 'fechamentoProximosPassos', pattern: /Fechamento e Próximos Passos[:\s]*(\d+)/i }
      ]
      
      scoringFields.forEach(field => {
        const match = scoringContent.match(field.pattern)
        if (match) {
          (results as any)[field.key] = parseInt(match[1])
          console.log('✅', field.key + ':', match[1])
        } else {
          // Set to 0 if not found
          (results as any)[field.key] = 0
        }
      })
      
      console.log('✅ Scoring analysis completed')
      
      // Generate justifications for each scoring parameter
      console.log('🔍 Generating scoring justifications...')
      try {
        const justificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'És um analista de vendas especializado em justificações de pontuação.'
              },
              {
                role: 'user',
                content: getJustificativaAvaliacaoPrompt(transcription, scoringContent)
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          })
        })
        
        if (justificationResponse.ok) {
          const justificationData = await justificationResponse.json()
          const justificationContent = justificationData.choices[0].message.content
          
          // Parse justifications
          const justificationFields = [
            { key: 'justificativaClarezaFluenciaFala', pattern: /Clareza e Fluência da Fala\s*\n([^\n]+)/i },
            { key: 'justificativaTomControlo', pattern: /Tom e Controlo\s*\n([^\n]+)/i },
            { key: 'justificativaEnvolvimentoConversacional', pattern: /Envolvimento Conversacional\s*\n([^\n]+)/i },
            { key: 'justificativaEfetividadeDescobertaNecessidades', pattern: /Efetividade na Descoberta de Necessidades\s*\n([^\n]+)/i },
            { key: 'justificativaEntregaValorAjusteSolucao', pattern: /Entrega de Valor e Ajuste da Solução\s*\n([^\n]+)/i },
            { key: 'justificativaHabilidadesLidarObjeccoes', pattern: /Habilidades de Lidar com Objeções\s*\n([^\n]+)/i },
            { key: 'justificativaEstruturaControleReuniao', pattern: /Estrutura e Controle da Reunião\s*\n([^\n]+)/i },
            { key: 'justificativaFechamentoProximosPassos', pattern: /Fechamento e Próximos Passos\s*\n([^\n]+)/i }
          ]
          
          justificationFields.forEach(field => {
            const match = justificationContent.match(field.pattern)
            if (match) {
              (results as any)[field.key] = match[1].trim()
              console.log('✅', field.key + ' justification generated')
            } else {
              (results as any)[field.key] = 'Justificação não disponível'
            }
          })
          
          console.log('✅ Scoring justifications completed')
        } else {
          console.error('❌ Scoring justifications failed:', justificationResponse.status)
        }
      } catch (error) {
        console.error('❌ Error generating justifications:', error)
      }
    } else {
      console.error('❌ Scoring analysis failed:', analysisResponses[5].status)
    }

    console.log('✅ All analyses completed')
    console.log('📊 Final analysis results:', {
      callType: results.tipoCall,
      totalScore: results.totalScore,
      pontosFortesLength: results.pontosFortes?.length || 0,
      pontosFracosLength: results.pontosFracos?.length || 0,
      resumoDaCallLength: results.resumoDaCall?.length || 0,
      dicasGeraisLength: results.dicasGerais?.length || 0,
      focoParaProximasCallsLength: results.focoParaProximasCalls?.length || 0,
      individualScores: {
        clarezaFluenciaFala: results.clarezaFluenciaFala,
        tomControlo: results.tomControlo,
        envolvimentoConversacional: results.envolvimentoConversacional,
        efetividadeDescobertaNecessidades: results.efetividadeDescobertaNecessidades,
        entregaValorAjusteSolucao: results.entregaValorAjusteSolucao,
        habilidadesLidarObjeccoes: results.habilidadesLidarObjeccoes,
        estruturaControleReuniao: results.estruturaControleReuniao,
        fechamentoProximosPassos: results.fechamentoProximosPassos
      }
    })
    return results

  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error)
    return results
  }
}

// Function to perform sliding window analysis for very long transcriptions
async function performSlidingWindowAnalysis(transcription: string, audioDuration?: number) {
  console.log('🔄 Starting sliding window analysis for long transcription...')
  
  const windowSize = 12000 // Characters per window (safe for GPT-4)
  const overlap = 2000 // Characters of overlap between windows
  const windows = []
  
  // Calculate more accurate time estimates
  const totalDuration = audioDuration || Math.floor(transcription.length / 12)
  
  // Split transcription into overlapping windows
  for (let i = 0; i < transcription.length; i += windowSize - overlap) {
    const end = Math.min(i + windowSize, transcription.length)
    const window = transcription.substring(i, end)
    
    const startTime = Math.floor((i / transcription.length) * totalDuration)
    const endTime = Math.floor((end / transcription.length) * totalDuration)
    
    windows.push({
      start: i,
      end: end,
      text: window,
      startTime: `${Math.floor(startTime / 60)}:${(startTime % 60).toString().padStart(2, '0')}`,
      endTime: `${Math.floor(endTime / 60)}:${(endTime % 60).toString().padStart(2, '0')}`
    })
  }
  
  console.log(`📊 Split transcription into ${windows.length} windows for analysis`)
  
  // Analyze each window
  const windowAnalyses: Array<{
    windowIndex: number;
    startTime: number;
    endTime: number;
    analysis: any;
  }> = []
  
  for (let i = 0; i < windows.length; i++) {
    const window = windows[i]
    console.log(`🔍 Analyzing window ${i + 1}/${windows.length}`)
    
    try {
      const windowAnalysis = await performComprehensiveAnalysis(window.text)
      windowAnalyses.push({
        windowIndex: i,
        startTime: parseInt(window.startTime),
        endTime: parseInt(window.endTime),
        analysis: windowAnalysis
      })
    } catch (error) {
      console.error(`❌ Failed to analyze window ${i + 1}:`, error)
    }
  }
  
  // Combine results
  const combinedResults = {
    tipoCall: '',
    totalScore: 0,
    pontosFortes: '',
    pontosFracos: '',
    resumoDaCall: '',
    dicasGerais: '',
    focoParaProximasCalls: '',
    clarezaFluenciaFala: 0,
    tomControlo: 0,
    envolvimentoConversacional: 0,
    efetividadeDescobertaNecessidades: 0,
    entregaValorAjusteSolucao: 0,
    habilidadesLidarObjeccoes: 0,
    estruturaControleReuniao: 0,
    fechamentoProximosPassos: 0
  }
  
  if (windowAnalyses.length > 0) {
    const firstAnalysis = windowAnalyses[0].analysis
    combinedResults.tipoCall = firstAnalysis.tipoCall
    
    // Combine text fields
    combinedResults.pontosFortes = windowAnalyses
      .map(w => w.analysis.pontosFortes)
      .filter(s => s && s.trim())
      .join('\n\n')
    
    combinedResults.pontosFracos = windowAnalyses
      .map(w => w.analysis.pontosFracos)
      .filter(w => w && w.trim())
      .join('\n\n')
    
    combinedResults.resumoDaCall = windowAnalyses
      .map(w => w.analysis.resumoDaCall)
      .filter(r => r && r.trim())
      .join('\n\n')
    
    combinedResults.dicasGerais = windowAnalyses
      .map(w => w.analysis.dicasGerais)
      .filter(d => d && d.trim())
      .join('\n\n')
    
    combinedResults.focoParaProximasCalls = windowAnalyses
      .map(w => w.analysis.focoParaProximasCalls)
      .filter(f => f && f.trim())
      .join('\n\n')
    
    // Calculate average scores
    const scoringFields = [
      'clarezaFluenciaFala', 'tomControlo', 'envolvimentoConversacional',
      'efetividadeDescobertaNecessidades', 'entregaValorAjusteSolucao',
      'habilidadesLidarObjeccoes', 'estruturaControleReuniao', 'fechamentoProximosPassos'
    ]
    
    scoringFields.forEach(field => {
      const scores = windowAnalyses
        .map(w => w.analysis[field as keyof typeof w.analysis] as number)
        .filter(s => s !== undefined && s !== null)
      
      if (scores.length > 0) {
        (combinedResults as any)[field] = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        )
      } else {
        // Set to 0 if no scores found
        (combinedResults as any)[field] = 0
      }
    })
    
    // Calculate average total score
    const scores = windowAnalyses
      .map(w => w.analysis.totalScore)
      .filter(s => s > 0)
    
    if (scores.length > 0) {
      combinedResults.totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }
  }
  
  console.log('✅ Sliding window analysis completed')
  return combinedResults
}

export async function POST(request: NextRequest) {
  try {
    const { blobUrl, fileName, userId, accessToken, salesCallId } = await request.json()

    console.log('🎙️ Starting transcription for blob:', {
      fileName,
      blobUrl,
      userId,
      salesCallId,
      isTempId: salesCallId.startsWith('temp-')
    })

    if (!blobUrl || !fileName || !userId || !accessToken || !salesCallId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if AssemblyAI API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error('❌ AssemblyAI API key not configured')
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if salesCallId is a temporary ID or a real UUID
    let actualSalesCallId = salesCallId
    let salesCallRecord = null
    
    if (salesCallId.startsWith('temp-')) {
      console.log('🔄 Temporary sales call ID detected, creating actual record...')
      
      // Create a new sales call record since we have a temporary ID
      const salesCallData = {
        user_id: userId,
        title: fileName.replace(/\.[^/.]+$/, ''),
        file_url: blobUrl,
        file_size: 0,
        duration_seconds: 0,
        status: 'processing',
        metadata: {
          originalFileName: fileName,
          blobUrl: blobUrl,
          createdFromTempId: true
        }
      }
      
      const { data: newSalesCall, error: createError } = await supabase
        .from('sales_calls')
        .insert(salesCallData)
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Failed to create sales call record:', createError)
        throw new Error('Failed to create sales call record')
      }
      
      actualSalesCallId = newSalesCall.id
      salesCallRecord = newSalesCall
      console.log('✅ Created new sales call record:', actualSalesCallId)
    } else {
      // Update existing sales call status to processing
      await supabase
        .from('sales_calls')
        .update({ status: 'processing' })
        .eq('id', salesCallId)
    }

    console.log('🔄 Processing video from Vercel Blob...')

    // Download the video from Vercel Blob
    const videoResponse = await fetch(blobUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    // Log file information for debugging
    console.log('📁 Video file information:')
    console.log('  - File size:', (videoBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB')
    console.log('  - Content-Type:', videoResponse.headers.get('content-type'))
    console.log('  - Content-Length:', videoResponse.headers.get('content-length'), 'bytes')

    // Upload to AssemblyAI for transcription
    console.log('📤 Uploading to AssemblyAI...')
    console.log('📁 File details for AssemblyAI:')
    console.log('  - File name:', fileName)
    console.log('  - File type:', videoBlob.type)
    console.log('  - File size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB')
    
    // Create FormData for AssemblyAI upload
    const formData = new FormData()
    formData.append('file', videoBlob, fileName)

    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ AssemblyAI upload error:', errorText)
      throw new Error(`AssemblyAI upload failed: ${uploadResponse.statusText}`)
    }

    const uploadResult = await uploadResponse.json()
    const audioUrl = uploadResult.upload_url

    console.log('✅ File uploaded to AssemblyAI:', audioUrl)

    // Start transcription
    console.log('🎙️ Starting AssemblyAI transcription with features:')
    console.log('  - Language: Portuguese (pt)')
    console.log('  - Speaker Diarization: Enabled')
    console.log('  - Automatic Punctuation: Enabled')
    console.log('  - Format Text: Enabled')
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'pt',
        speaker_labels: true,
        punctuate: true,
        format_text: true
      })
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('❌ AssemblyAI transcription error:', errorText)
      throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.statusText}`)
    }

    const transcriptResult = await transcriptResponse.json()
    const transcriptId = transcriptResult.id

    console.log('✅ Transcription started, ID:', transcriptId)

    // Poll for completion
    let transcription = ''
    let audioDuration: number | undefined = undefined
    let attempts = 0
    const maxAttempts = 120 // 10 minutes with 5-second intervals (increased for longer files)
    
    console.log('⏳ Starting transcription polling (max attempts:', maxAttempts, ')')

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts} (${Math.round(attempts * 5 / 60)} minutes elapsed)`)

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY!
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`)
      }

      const statusResult = await statusResponse.json()
      console.log(`📊 Transcription status (attempt ${attempts}):`, statusResult.status)
      
      // Log additional status information for debugging
      if (statusResult.status === 'processing') {
        console.log(`  - Progress: ${statusResult.progress || 'unknown'}%`)
        if (statusResult.audio_duration) {
          console.log(`  - Audio duration: ${statusResult.audio_duration}s`)
          audioDuration = statusResult.audio_duration
        }
      } else if (statusResult.status === 'completed') {
        console.log(`  - Final audio duration: ${statusResult.audio_duration || 'unknown'}s`)
        console.log(`  - Words transcribed: ${statusResult.words ? (Array.isArray(statusResult.words) ? statusResult.words.length : statusResult.words) : 'unknown'}`)
        if (statusResult.audio_duration) {
          audioDuration = statusResult.audio_duration
        }
      }

      if (statusResult.status === 'completed') {
        // Debug: Log the full status result to understand what we're getting
        console.log('🔍 Full AssemblyAI status result:', JSON.stringify(statusResult, null, 2))
        
        // Format transcription with speaker diarization
        if (statusResult.utterances && statusResult.utterances.length > 0) {
          // Use utterances if available (preferred format)
          transcription = statusResult.utterances.map((utterance: any) => {
            const startTime = Math.floor(utterance.start / 1000)
            const minutes = Math.floor(startTime / 60)
            const seconds = startTime % 60
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            return `Speaker ${utterance.speaker} (${timeStr}) - ${utterance.text}`
          }).join('\n\n')
        } else if (statusResult.words && statusResult.words.length > 0) {
          // Process words array and group by speaker
          console.log('🔍 Processing words array format...')
          const speakerGroups: { [key: string]: string[] } = {}
          let currentSpeaker = ''
          let currentText = ''
          
          statusResult.words.forEach((word: any) => {
            if (word.speaker !== currentSpeaker) {
              if (currentSpeaker && currentText.trim()) {
                if (!speakerGroups[currentSpeaker]) speakerGroups[currentSpeaker] = []
                speakerGroups[currentSpeaker].push(currentText.trim())
              }
              currentSpeaker = word.speaker
              currentText = word.text
            } else {
              currentText += ' ' + word.text
            }
          })
          
          // Add the last group
          if (currentSpeaker && currentText.trim()) {
            if (!speakerGroups[currentSpeaker]) speakerGroups[currentSpeaker] = []
            speakerGroups[currentSpeaker].push(currentText.trim())
          }
          
          // Format as speaker utterances
          transcription = Object.entries(speakerGroups)
            .map(([speaker, texts]) => 
              texts.map(text => `Speaker ${speaker} - ${text}`).join('\n')
            )
            .join('\n\n')
        } else {
          // Fallback to raw text
          transcription = statusResult.text || ''
        }
        
        // Log detailed transcription information
        console.log('✅ Transcription completed with speaker diarization:', transcription.length, 'characters')
        console.log('📊 Transcription details:')
        console.log('  - Total characters:', transcription.length)
        console.log('  - Utterances count:', statusResult.utterances ? statusResult.utterances.length : 'N/A')
        console.log('  - Words count:', statusResult.words ? statusResult.words.length : 'N/A')
        console.log('  - Raw text length:', statusResult.text ? statusResult.text.length : 'N/A')
        console.log('  - Estimated duration (assuming ~100 chars/second):', Math.round(transcription.length / 100), 'seconds')
        console.log('  - Estimated duration (minutes):', Math.round(transcription.length / 100 / 60), 'minutes')
        
        // Log first 200 characters of transcription for debugging
        console.log('🔍 Transcription preview:', transcription.substring(0, 200) + (transcription.length > 200 ? '...' : ''))
        
        // Check for any potential truncation indicators
        if (transcription.includes('...') || transcription.includes('truncated')) {
          console.warn('⚠️ Potential transcription truncation detected!')
        }
        
        break
      } else if (statusResult.status === 'error') {
        throw new Error(`Transcription failed: ${statusResult.error}`)
      }
    }

    if (!transcription) {
      throw new Error('Transcription timed out')
    }

    // Analyze with ChatGPT using comprehensive analysis
    console.log('🤖 Starting comprehensive analysis with ChatGPT...')
    
    // Log transcription length for debugging
    console.log(`📊 Full transcription length: ${transcription.length} characters`)
    
    // For very long transcriptions, we'll use a sliding window approach
    // to ensure we analyze the entire content while staying within token limits
    let analysisResults
    if (transcription.length > 15000) {
      console.log('⚠️ Long transcription detected, using sliding window analysis...')
      // Use the audio duration we captured during polling
      analysisResults = await performSlidingWindowAnalysis(transcription, audioDuration)
    } else {
      // For shorter transcriptions, analyze the full content
      analysisResults = await performComprehensiveAnalysis(transcription)
    }
    
    console.log('✅ Comprehensive analysis completed')
    
    // Function to parse comprehensive analysis text into structured bullet points
    const parseComprehensiveAnalysis = (text: string) => {
      if (!text) return []
      
      console.log('🔍 Raw text for parsing:', text.substring(0, 200) + '...')
      
      // Split by lines and look for patterns like timestamps and descriptions
      const lines = text.split('\n').filter(line => line.trim())
      const bulletPoints = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Look for various timestamp patterns:
        // - "00:27" (exact time)
        // - "No início" (relative time)
        // - "No meio da call" (relative time)
        // - "Transmitiste segurança quando disseste" (action-based)
        // - "Boa Abordagem Inicial" (section headers)
        const timestampMatch = line.match(/^(\d{1,2}:\d{2})/)
        const relativeTimeMatch = line.match(/^(No início|No meio da call|No fecho|Transmitiste|A pergunta|Quando|Ao|Durante)/i)
        const sectionHeaderMatch = line.match(/^(Boa Abordagem Inicial|Identificação Eficaz|Apresentação Clara|Gestão de Objeções|Conclusão Positiva)/i)
        
        if (timestampMatch || relativeTimeMatch || sectionHeaderMatch) {
          const timestamp = timestampMatch ? timestampMatch[1] : 
                          relativeTimeMatch ? relativeTimeMatch[1] : 
                          sectionHeaderMatch![1]
          const description = timestampMatch ? 
            line.substring(timestamp.length + 1).trim() : 
            relativeTimeMatch ? line.substring(relativeTimeMatch[1].length + 1).trim() :
            line.substring(sectionHeaderMatch![1].length + 1).trim()
          
          if (description) {
            bulletPoints.push({
              timestamp: timestamp,
              description: description,
              quote: '' // We'll look for quotes in the next lines
            })
          } else if (sectionHeaderMatch) {
            // If it's just a section header, create a bullet point with the header as description
            bulletPoints.push({
              timestamp: 'Section',
              description: timestamp,
              quote: ''
            })
          }
        } else if (bulletPoints.length > 0) {
          // Check if this line contains a quote (starts with quotes or contains quoted text)
          const quoteMatch = line.match(/["""]([^"""]+)["""]/)
          if (quoteMatch) {
            // Update the last bullet point with the quote
            bulletPoints[bulletPoints.length - 1].quote = quoteMatch[1]
          } else if (line.includes('"') || line.includes('"') || line.includes('"')) {
            // Extract any quoted text from this line
            const quoteMatch = line.match(/["""]([^"""]+)["""]/)
            if (quoteMatch) {
              bulletPoints[bulletPoints.length - 1].quote = quoteMatch[1]
            }
          } else if (line.trim() && !line.startsWith('Timestamp:') && !line.startsWith('Momento:')) {
            // If this line has content and isn't a timestamp label, it might be additional description
            const lastPoint = bulletPoints[bulletPoints.length - 1]
            if (lastPoint && !lastPoint.description.includes(line.trim())) {
              lastPoint.description += ' ' + line.trim()
            }
          }
        }
      }
      
      // If no structured points were found, create a simple bullet point from the text
      if (bulletPoints.length === 0 && text.trim()) {
        console.log('⚠️ No structured points found, creating fallback bullet points')
        // Split by sentences and create simple bullet points
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            bulletPoints.push({
              timestamp: 'General',
              description: sentence.trim(),
              quote: ''
            })
          }
        })
      }
      
      console.log('✅ Parsed bullet points:', bulletPoints)
      return bulletPoints
    }
    
    // Parse comprehensive analysis results into structured data
    const structuredStrengths = parseComprehensiveAnalysis(analysisResults.pontosFortes || '')
    const structuredImprovements = parseComprehensiveAnalysis(analysisResults.pontosFracos || '')
    
    console.log('🔍 Parsing comprehensive analysis results:', {
      callType: analysisResults.tipoCall || 'Not found',
      score: analysisResults.totalScore || 'Not found',
      strengthsCount: structuredStrengths.length,
      improvementsCount: structuredImprovements.length
    })
    
    // Debug: Log the actual analysis results
    console.log('🔍 Raw analysis results from OpenAI:', {
      tipoCall: analysisResults.tipoCall,
      totalScore: analysisResults.totalScore,
      pontosFortes: analysisResults.pontosFortes?.substring(0, 100) + '...',
      pontosFracos: analysisResults.pontosFracos?.substring(0, 100) + '...',
      resumoDaCall: analysisResults.resumoDaCall?.substring(0, 100) + '...',
      dicasGerais: analysisResults.dicasGerais?.substring(0, 100) + '...',
      focoParaProximasCalls: analysisResults.focoParaProximasCalls?.substring(0, 100) + '...',
      clarezaFluenciaFala: analysisResults.clarezaFluenciaFala,
      tomControlo: analysisResults.tomControlo,
      envolvimentoConversacional: analysisResults.envolvimentoConversacional,
      efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades,
      entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao,
      habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes,
      estruturaControleReuniao: analysisResults.estruturaControleReuniao,
      fechamentoProximosPassos: analysisResults.fechamentoProximosPassos
    })
    
    const analysis = {
      call_type: analysisResults.tipoCall || 'Não identificado',
      score: analysisResults.totalScore || 0,
      feedback: 'Análise completa realizada com IA',
      analysis: {
        // Use structured comprehensive analysis results
        strengths: structuredStrengths.length > 0 ? structuredStrengths : [],
        improvements: structuredImprovements.length > 0 ? structuredImprovements : [],
        techniques: [],
        objections: [],
        scoring: {},
        // Add comprehensive analysis results
        momentosFortesFracos: '',
        analiseQuantitativa: '',
        pontosFortes: analysisResults.pontosFortes || '',
        pontosFortesGS: '',
        pontosFracos: analysisResults.pontosFracos || '',
        pontosFracosGS: '',
        analiseQuantitativaCompleta: '',
        explicacaoPontuacao: '',
        justificacaoGS: '',
        tipoCall: analysisResults.tipoCall || '',
        // New required fields
        resumoDaCall: analysisResults.resumoDaCall || '',
        dicasGerais: analysisResults.dicasGerais || '',
        focoParaProximasCalls: analysisResults.focoParaProximasCalls || '',
        // 8 scoring fields
        clarezaFluenciaFala: analysisResults.clarezaFluenciaFala || 0,
        tomControlo: analysisResults.tomControlo || 0,
        envolvimentoConversacional: analysisResults.envolvimentoConversacional || 0,
        efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades || 0,
        entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao || 0,
        habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes || 0,
        estruturaControleReuniao: analysisResults.estruturaControleReuniao || 0,
        fechamentoProximosPassos: analysisResults.fechamentoProximosPassos || 0,
        // 8 justification fields
        justificativaClarezaFluenciaFala: (analysisResults as any).justificativaClarezaFluenciaFala || '',
        justificativaTomControlo: (analysisResults as any).justificativaTomControlo || '',
        justificativaEnvolvimentoConversacional: (analysisResults as any).justificativaEnvolvimentoConversacional || '',
        justificativaEfetividadeDescobertaNecessidades: (analysisResults as any).justificativaEfetividadeDescobertaNecessidades || '',
        justificativaEntregaValorAjusteSolucao: (analysisResults as any).justificativaEntregaValorAjusteSolucao || '',
        justificativaHabilidadesLidarObjeccoes: (analysisResults as any).justificativaHabilidadesLidarObjeccoes || '',
        justificativaEstruturaControleReuniao: (analysisResults as any).justificativaEstruturaControleReuniao || '',
        justificativaFechamentoProximosPassos: (analysisResults as any).justificativaFechamentoProximosPassos || ''
      }
    }

    // Check for duplicate content before storing
    const encoder = new TextEncoder()
    const data = encoder.encode(transcription)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('🔐 Generated content hash:', contentHash.substring(0, 16) + '...')
    
    // Check if we already have an analysis with this exact content
    const { data: existingAnalysis, error: duplicateCheckError } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_metadata->>content_hash', contentHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
      console.warn('⚠️ Error checking for duplicates:', duplicateCheckError)
    }
    
    if (existingAnalysis) {
      console.log('🔄 Duplicate content detected!')
      console.log('📊 Existing analysis ID:', existingAnalysis.id)
      console.log('📅 Created at:', existingAnalysis.created_at)
      console.log('📝 Title:', existingAnalysis.title)
      console.log('📝 Creating new analysis record with same content...')
      
      // Even though it's duplicate content, we'll create a new analysis record
      // This allows users to have multiple records for the same call if needed
    }
    
    console.log('✅ No duplicate content found, proceeding with new analysis...')

    // Debug: Log what we're about to store in the database
    console.log('🔍 Final analysis object being stored:', {
      call_type: analysis.call_type,
      score: analysis.score,
      analysis_fields: {
        pontosFortes: analysis.analysis.pontosFortes?.substring(0, 100) + '...',
        pontosFracos: analysis.analysis.pontosFracos?.substring(0, 100) + '...',
        resumoDaCall: analysis.analysis.resumoDaCall?.substring(0, 100) + '...',
        dicasGerais: analysis.analysis.dicasGerais?.substring(0, 100) + '...',
        focoParaProximasCalls: analysis.analysis.focoParaProximasCalls?.substring(0, 100) + '...',
        clarezaFluenciaFala: analysis.analysis.clarezaFluenciaFala,
        tomControlo: analysis.analysis.tomControlo,
        envolvimentoConversacional: analysis.analysis.envolvimentoConversacional,
        efetividadeDescobertaNecessidades: analysis.analysis.efetividadeDescobertaNecessidades,
        entregaValorAjusteSolucao: analysis.analysis.entregaValorAjusteSolucao,
        habilidadesLidarObjeccoes: analysis.analysis.habilidadesLidarObjeccoes,
        estruturaControleReuniao: analysis.analysis.estruturaControleReuniao,
        fechamentoProximosPassos: analysis.analysis.fechamentoProximosPassos
      }
    })

    // Store analysis in database
    const analysisData = {
      sales_call_id: actualSalesCallId,
      user_id: userId,
      title: fileName.replace(/\.[^/.]+$/, ''),
      status: 'completed',
      call_type: analysis.call_type,
      feedback: analysis.feedback,
      score: parseFloat(analysis.score.toString()),
      analysis: analysis.analysis,
      analysis_metadata: {
        blob_url: blobUrl,
        original_transcription_length: transcription.length,
        analysis_method: transcription.length > 15000 ? 'sliding_window' : 'full_transcription',
        tokens_used: 0, // Will be calculated from comprehensive analysis
        content_hash: contentHash, // Store the content hash for future deduplication
        original_sales_call_id: salesCallId, // Store the original temp ID for reference
        is_duplicate_content: !!existingAnalysis, // Flag if this is duplicate content
        duplicate_of: existingAnalysis ? existingAnalysis.id : null, // Reference to original analysis if duplicate
        duplicate_detected_at: new Date().toISOString()
      },
      transcription: transcription // Store the full transcription, not truncated
    }

    const { data: salesAnalysis, error: dbError } = await supabase
      .from('sales_call_analyses')
      .insert(analysisData)
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create analysis record' },
        { status: 500 }
      )
    }

    // Update sales call status to completed
    await supabase
      .from('sales_calls')
      .update({ 
        status: 'completed',
        duration: 0 // Could calculate from video metadata if needed
      })
      .eq('id', actualSalesCallId)

    console.log('✅ Analysis completed and stored:', salesAnalysis.id)

    // Delete the file from Vercel Blob to save storage costs
    try {
      console.log('🗑️ Deleting file from Vercel Blob to save storage costs...')
      await del(blobUrl)
      console.log('✅ File deleted from Vercel Blob successfully')
      
      // Update the sales call record to remove the blob URL since it's deleted
      await supabase
        .from('sales_calls')
        .update({ 
          file_url: null,
          metadata: {
            blob_deleted: true,
            deleted_at: new Date().toISOString(),
            original_blob_url: blobUrl
          }
        })
        .eq('id', actualSalesCallId)
        
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete blob file:', deleteError)
      // Don't fail the entire process if blob deletion fails
      // The file will eventually be cleaned up by Vercel's retention policies
    }

    return NextResponse.json({
      success: true,
      analysis: salesAnalysis,
      transcription: transcription, // Return the full transcription
      message: existingAnalysis 
        ? 'Analysis completed successfully (duplicate content detected, but new record created)' 
        : 'Analysis completed successfully',
      duplicateInfo: existingAnalysis ? {
        originalId: existingAnalysis.id,
        originalTitle: existingAnalysis.title,
        originalDate: existingAnalysis.created_at,
        contentHash: contentHash.substring(0, 16) + '...'
      } : null
    })

  } catch (error) {
    console.error('❌ Blob transcription error:', error)
    return NextResponse.json(
      { error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
