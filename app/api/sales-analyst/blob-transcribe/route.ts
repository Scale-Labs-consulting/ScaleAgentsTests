import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { del } from '@vercel/blob'

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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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

    // Convert video to audio using OpenAI Whisper
    console.log('🎵 Converting video to audio...')
    
    // Create FormData for Whisper API
    const formData = new FormData()
    formData.append('file', videoBlob, fileName)
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities', 'segment')

    // Process with OpenAI Whisper
    console.log('📤 Sending to OpenAI Whisper...')
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: formData
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error('❌ Whisper API error:', errorText)
      throw new Error(`Whisper API failed: ${whisperResponse.statusText}`)
    }

    const whisperResult = await whisperResponse.json()
    const transcription = whisperResult.text

    console.log('✅ Transcription completed:', transcription.length, 'characters')

    // Analyze with ChatGPT
    console.log('🤖 Analyzing with ChatGPT...')
    
    // Truncate transcription to avoid token limits
    const truncatedTranscription = transcription.length > 8000 
      ? transcription.substring(0, 8000) + '... [truncated]'
      : transcription

    const analysisPrompt = `Analisa esta transcrição de uma chamada de vendas em português e fornece uma análise completa e estruturada.

Transcrição:
${truncatedTranscription}

Fornece a tua análise em formato de texto simples, estruturada da seguinte forma:

**TIPO DE CHAMADA:**
[Identifica se é prospetiva, follow-up, demonstração, fechamento, etc.]

**PONTUAÇÃO GERAL:**
[Pontuação de 1-10 baseada na qualidade da chamada]

**PONTOS FORTES:**
• [Ponto forte 1 - descrição clara e concisa]
• [Ponto forte 2 - descrição clara e concisa]
• [Ponto forte 3 - descrição clara e concisa]

**ÁREAS DE MELHORIA:**
• [Área de melhoria 1 - descrição clara e concisa]
• [Área de melhoria 2 - descrição clara e concisa]
• [Área de melhoria 3 - descrição clara e concisa]

**TÉCNICAS UTILIZADAS:**
• [Técnica 1 - descrição clara e concisa]
• [Técnica 2 - descrição clara e concisa]

**OBJEÇÕES E TRATAMENTO:**
• [Objeção identificada e como foi tratada - descrição clara e concisa]

**FEEDBACK GERAL:**
[Análise detalhada e sugestões práticas para melhorar]

IMPORTANTE:
- Responde em português
- Mantém o formato acima
- Cada ponto deve ser uma frase clara e concisa
- NÃO incluas timestamps ou referências temporais
- Cada bullet point deve ser uma ideia completa mas concisa
- Evita frases muito longas ou complexas`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'És um especialista em análise de vendas com experiência em avaliar chamadas de vendas e fornecer feedback construtivo.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI analysis error:', errorText)
      throw new Error(`OpenAI analysis failed: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const analysisContent = openaiData.choices[0].message.content
    
    // Parse the analysis
    const callTypeMatch = analysisContent.match(/\*\*TIPO DE CHAMADA:\*\*\s*(.+?)(?=\n\*\*|$)/i)
    const scoreMatch = analysisContent.match(/\*\*PONTUAÇÃO GERAL:\*\*\s*(\d+)/i)
    const strengthsMatch = analysisContent.match(/\*\*PONTOS FORTES:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const improvementsMatch = analysisContent.match(/\*\*ÁREAS DE MELHORIA:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const techniquesMatch = analysisContent.match(/\*\*TÉCNICAS UTILIZADAS:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const objectionsMatch = analysisContent.match(/\*\*OBJEÇÕES E TRATAMENTO:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const feedbackMatch = analysisContent.match(/\*\*FEEDBACK GERAL:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    
    const extractBulletPoints = (text: string) => {
      if (!text) return []
      return text
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.trim().substring(1).trim())
        .filter(item => item.length > 0)
    }
    
    const analysis = {
      call_type: callTypeMatch ? callTypeMatch[1].trim() : 'Não identificado',
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : 'Análise não disponível',
      analysis: {
        strengths: extractBulletPoints(strengthsMatch ? strengthsMatch[1] : ''),
        improvements: extractBulletPoints(improvementsMatch ? improvementsMatch[1] : ''),
        techniques: extractBulletPoints(techniquesMatch ? techniquesMatch[1] : ''),
        objections: extractBulletPoints(objectionsMatch ? objectionsMatch[1] : '')
      }
    }

    // Store analysis in database
    const analysisData = {
      user_id: userId,
      title: fileName.replace(/\.[^/.]+$/, ''),
      status: 'completed',
      call_type: analysis.call_type,
      feedback: analysis.feedback,
      score: analysis.score,
      analysis: analysis.analysis,
      analysis_metadata: {
        blob_url: blobUrl,
        original_transcription_length: transcription.length,
        truncated_transcription_length: truncatedTranscription.length,
        tokens_used: openaiData.usage?.total_tokens || 0
      },
      transcription: truncatedTranscription
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
      transcription: truncatedTranscription,
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
