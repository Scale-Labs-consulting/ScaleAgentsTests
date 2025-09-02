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
  SYSTEM_PROMPTS
} from '@/lib/comprehensive-prompts'

// Function to perform comprehensive analysis
async function performComprehensiveAnalysis(transcription: string) {
  console.log('🔍 Starting comprehensive analysis...')
  
  const results = {
    callType: '',
    totalScore: 0,
    strengths: '',
    improvements: '',
    techniques: '',
    objections: '',
    feedback: '',
    scoring: { raw: '', total: 0 },
    momentosFortesFracos: '',
    analiseQuantitativa: '',
    pontosFortes: '',
    pontosFortesGS: '',
    pontosFracos: '',
    pontosFracosGS: '',
    analiseQuantitativaCompleta: '',
    explicacaoPontuacao: '',
    justificacaoGS: '',
    tipoCall: ''
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

    // 2. Perform comprehensive quantitative analysis (includes scoring)
    console.log('📊 Performing comprehensive quantitative analysis...')
    const analiseCompletaResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (analiseCompletaResponse.ok) {
      const analiseCompletaData = await analiseCompletaResponse.json()
      const analiseCompletaContent = analiseCompletaData.choices[0].message.content
      results.analiseQuantitativaCompleta = analiseCompletaContent
      
      // Parse scoring from the comprehensive analysis
      const scoringMatch = analiseCompletaContent.match(/Pontuação Total:\s*(\d+)\/40/i)
      if (scoringMatch) {
        results.totalScore = parseInt(scoringMatch[1])
      }
      
      // Parse individual scores with improved patterns
      const scoringLines = analiseCompletaContent.split('\n').filter((line: string) => line.trim())
      const scoringObj: { raw: string; total: number; [key: string]: any } = { raw: analiseCompletaContent, total: 0 }
      
      console.log('🔍 Parsing scoring lines:', scoringLines.length, 'lines')
      
      scoringLines.forEach((line: string) => {
        console.log('📝 Processing line:', line)
        
        // More flexible patterns to match various formats
        const patterns = [
          /^(.+?):\s*(\d+)\/5$/i,
          /^(.+?)\s*:\s*(\d+)\/5$/i,
          /^(.+?):\s*(\d+)$/i,
          /^(.+?)\s*-\s*(\d+)\/5$/i,
          /^(.+?)\s*(\d+)\/5$/i,
          /^(.+?):\s*(\d+)\s*\/\s*5$/i,
          /^(.+?)\s*:\s*(\d+)\s*\/\s*5$/i,
          /^(.+?)\s*(\d+)\s*\/\s*5$/i,
        ]
        
        for (const pattern of patterns) {
          const match = line.match(pattern)
          if (match) {
            const key = match[1].trim()
            const score = parseInt(match[2])
            console.log('✅ Found score:', key, '=', score)
            scoringObj[key] = score
            break
          }
        }
      })
      
      console.log('📊 Final scoring object:', scoringObj)
      
      // Calculate total from individual scores
      const individualScores = Object.entries(scoringObj)
        .filter(([key, value]) => key !== 'raw' && key !== 'total' && typeof value === 'number')
        .map(([key, value]) => value as number)
      
      if (individualScores.length > 0) {
        const calculatedTotal = individualScores.reduce((sum, score) => sum + score, 0)
        scoringObj.total = calculatedTotal
        results.totalScore = calculatedTotal
      }
      
      results.scoring = scoringObj
      console.log('✅ Comprehensive analysis completed')
    }

    // 3. Perform other analyses in parallel
    console.log('🔄 Performing parallel analyses...')
    const analysisPromises = [
      // Momentos Fortes e Fracos
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.MOMENTOS_FORTES_FRACOS },
            { role: 'user', content: getMomentosFortesFracosPrompt(transcription) }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }),
      
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
          max_tokens: 1500,
          temperature: 0.7,
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
          max_tokens: 1500,
          temperature: 0.7,
        }),
      }),
      
      // Pontos Fortes GS
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FORTES_GS },
            { role: 'user', content: getPontosFortesGSPrompt(transcription) }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }),
      
      // Pontos Fracos GS
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FRACOS_GS },
            { role: 'user', content: getPontosFracosGSPrompt(transcription) }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })
    ]

    const analysisResponses = await Promise.all(analysisPromises)
    
    // Process responses
    if (analysisResponses[0].ok) {
      const data = await analysisResponses[0].json()
      results.momentosFortesFracos = data.choices[0].message.content
    }
    
    if (analysisResponses[1].ok) {
      const data = await analysisResponses[1].json()
      results.pontosFortes = data.choices[0].message.content
    }
    
    if (analysisResponses[2].ok) {
      const data = await analysisResponses[2].json()
      results.pontosFracos = data.choices[0].message.content
    }
    
    if (analysisResponses[3].ok) {
      const data = await analysisResponses[3].json()
      results.pontosFortesGS = data.choices[0].message.content
    }
    
    if (analysisResponses[4].ok) {
      const data = await analysisResponses[4].json()
      results.pontosFracosGS = data.choices[0].message.content
    }

    // 4. Perform additional analyses that depend on scoring results
    console.log('🔄 Performing additional analyses...')
    
    // Explicação Pontuação
    if (results.scoring.raw) {
      console.log('📊 Getting scoring explanation...')
      const explicacaoResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.EXPLICACAO_PONTUACAO },
            { role: 'user', content: getExplicacaoPontuacaoPrompt(transcription, results.scoring.raw) }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      if (explicacaoResponse.ok) {
        const data = await explicacaoResponse.json()
        results.explicacaoPontuacao = data.choices[0].message.content
      }
    }

    // Justificação GS
    if (results.scoring.raw) {
      console.log('📝 Getting GS justification...')
      const justificacaoResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.JUSTIFICACAO_GS },
            { role: 'user', content: getJustificacaoGSPrompt(results.scoring.raw) }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (justificacaoResponse.ok) {
        const data = await justificacaoResponse.json()
        results.justificacaoGS = data.choices[0].message.content
      }
    }

    console.log('✅ All analyses completed')
    return results

  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error)
    return results
  }
}

export async function POST(request: NextRequest) {
  try {
    const { blobUrl, fileName, userId, accessToken, salesCallId } = await request.json()

    console.log('🎙️ Starting transcription for blob:', {
      fileName,
      blobUrl,
      userId,
      salesCallId
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

    // Create authenticated Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Update sales call status to processing
    await supabase
      .from('sales_calls')
      .update({ status: 'processing' })
      .eq('id', salesCallId)

    console.log('🔄 Processing video from Vercel Blob...')

    // Download the video from Vercel Blob
    const videoResponse = await fetch(blobUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })

    // Upload to AssemblyAI for transcription
    console.log('📤 Uploading to AssemblyAI...')
    
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
    console.log('🎙️ Starting AssemblyAI transcription...')
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        'Content-Type': 'application/json'
      },
             body: JSON.stringify({
         audio_url: audioUrl,
         language_code: 'pt',
         speaker_labels: true
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
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

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

      if (statusResult.status === 'completed') {
        // Format transcription with speaker diarization
        if (statusResult.utterances && statusResult.utterances.length > 0) {
          transcription = statusResult.utterances.map((utterance: any) => {
            const startTime = Math.floor(utterance.start / 1000)
            const minutes = Math.floor(startTime / 60)
            const seconds = startTime % 60
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            return `Speaker ${utterance.speaker} (${timeStr}) - ${utterance.text}`
          }).join('\n\n')
        } else {
          transcription = statusResult.text
        }
        console.log('✅ Transcription completed with speaker diarization:', transcription.length, 'characters')
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
    
    // Truncate transcription to avoid token limits
    const truncatedTranscription = transcription.length > 8000 
      ? transcription.substring(0, 8000) + '... [truncated]'
      : transcription

    // Perform comprehensive analysis with multiple specialized prompts
    const analysisResults = await performComprehensiveAnalysis(truncatedTranscription)
    
    console.log('✅ Comprehensive analysis completed')
    
    // Extract basic analysis data for backward compatibility
    const callTypeMatch = analysisResults.callType ? [null, analysisResults.callType] : null
    const scoreMatch = analysisResults.totalScore ? [null, analysisResults.totalScore.toString()] : null
    const strengthsMatch = analysisResults.strengths ? [null, analysisResults.strengths] : null
    const improvementsMatch = analysisResults.improvements ? [null, analysisResults.improvements] : null
    const techniquesMatch = analysisResults.techniques ? [null, analysisResults.techniques] : null
    const objectionsMatch = analysisResults.objections ? [null, analysisResults.objections] : null
    const feedbackMatch = analysisResults.feedback ? [null, analysisResults.feedback] : null
    
              // Use scoring from comprehensive analysis
      const scoringObj: { raw: string; total: number; [key: string]: any } = analysisResults.scoring || { raw: '', total: 0 }
    
    console.log('🔍 Parsing results:', {
      callType: callTypeMatch ? callTypeMatch[1] : 'Not found',
      score: scoreMatch ? scoreMatch[1] : 'Not found',
      strengths: strengthsMatch ? 'Found' : 'Not found',
      improvements: improvementsMatch ? 'Found' : 'Not found',
      techniques: techniquesMatch ? 'Found' : 'Not found',
      objections: objectionsMatch ? 'Found' : 'Not found',
      feedback: feedbackMatch ? 'Found' : 'Not found'
    })
    
    const analysis = {
      call_type: analysisResults.tipoCall || callTypeMatch?.[1]?.trim() || 'Não identificado',
      score: scoringObj?.total || (scoreMatch?.[1] ? parseInt(scoreMatch[1]) : 0),
      feedback: feedbackMatch?.[1]?.trim() || 'Análise não disponível',
      analysis: {
        // Use comprehensive analysis results for all fields
        strengths: analysisResults.pontosFortes ? [analysisResults.pontosFortes] : [],
        improvements: analysisResults.pontosFracos ? [analysisResults.pontosFracos] : [],
        techniques: analysisResults.analiseQuantitativa ? [analysisResults.analiseQuantitativa] : [],
        objections: analysisResults.pontosFracosGS ? [analysisResults.pontosFracosGS] : [],
        scoring: scoringObj || {},
        // Add comprehensive analysis results
        momentosFortesFracos: analysisResults.momentosFortesFracos || '',
        analiseQuantitativa: analysisResults.analiseQuantitativa || '',
        pontosFortes: analysisResults.pontosFortes || '',
        pontosFortesGS: analysisResults.pontosFortesGS || '',
        pontosFracos: analysisResults.pontosFracos || '',
        pontosFracosGS: analysisResults.pontosFracosGS || '',
        analiseQuantitativaCompleta: analysisResults.analiseQuantitativaCompleta || '',
        explicacaoPontuacao: analysisResults.explicacaoPontuacao || '',
        justificacaoGS: analysisResults.justificacaoGS || '',
        tipoCall: analysisResults.tipoCall || ''
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
      
      // Update the sales call status to completed
      await supabase
        .from('sales_calls')
        .update({ 
          status: 'completed',
          duration: 0
        })
        .eq('id', salesCallId)
      
      // Return the existing analysis instead of creating a new one
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis.analysis,
        analysisId: existingAnalysis.id,
        message: 'Duplicate content detected - returning existing analysis',
        isDuplicate: true,
        duplicateInfo: {
          originalId: existingAnalysis.id,
          originalTitle: existingAnalysis.title,
          originalDate: existingAnalysis.created_at,
          contentHash: contentHash.substring(0, 16) + '...'
        }
      })
    }
    
    console.log('✅ No duplicate content found, proceeding with new analysis...')

    // Store analysis in database
    const analysisData = {
      sales_call_id: salesCallId,
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
        truncated_transcription_length: truncatedTranscription.length,
        tokens_used: 0, // Will be calculated from comprehensive analysis
        content_hash: contentHash // Store the content hash for future deduplication
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
      .eq('id', salesCallId)

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
        .eq('id', salesCallId)
        
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete blob file:', deleteError)
      // Don't fail the entire process if blob deletion fails
      // The file will eventually be cleaned up by Vercel's retention policies
    }

    return NextResponse.json({
      success: true,
      analysis: salesAnalysis,
      transcription: transcription, // Return the full transcription
      message: 'Analysis completed successfully'
    })

  } catch (error) {
    console.error('❌ Blob transcription error:', error)
    return NextResponse.json(
      { error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
