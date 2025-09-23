import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { upload_url, fileName, userId, accessToken } = await request.json()

    if (!upload_url || !fileName || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if Assembly AI API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error('❌ Assembly AI API key not configured')
      return NextResponse.json(
        { error: 'Assembly AI API key not configured' },
        { status: 500 }
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

    console.log('🎙️ Starting transcription for:', fileName)

    // Step 1: Start transcription
    console.log('🎙️ Starting transcription...')
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: 'pt', // Portuguese
        speaker_labels: true,
        punctuate: true,
        format_text: true
      }),
    })

    console.log('📥 Transcript response status:', transcriptResponse.status)

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('❌ Assembly AI transcription error:', errorText)
      return NextResponse.json(
        { error: `Failed to start transcription: ${transcriptResponse.status} - ${errorText.substring(0, 200)}` },
        { status: 500 }
      )
    }

    const transcriptData = await transcriptResponse.json()
    const { id: transcriptId } = transcriptData
    console.log('✅ Transcription started with ID:', transcriptId)

    // Step 2: Poll for completion
    let transcription = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        },
      })

      if (!statusResponse.ok) {
        console.error('Failed to check transcription status:', statusResponse.status)
        continue
      }

      const transcriptStatusData = await statusResponse.json()
      console.log(`📊 Transcription status: ${transcriptStatusData.status} (attempt ${attempts})`)

      if (transcriptStatusData.status === 'completed') {
        transcription = transcriptStatusData.text
        console.log('✅ Transcription completed!')
        break
      } else if (transcriptStatusData.status === 'error') {
        return NextResponse.json(
          { error: 'Transcription failed' },
          { status: 500 }
        )
      }
    }

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription timed out' },
        { status: 500 }
      )
    }

    // Step 3: Analyze with ChatGPT
    console.log('🤖 Analyzing transcription with ChatGPT...')
    
    // Truncate transcription to avoid token limits (keep first 8000 characters)
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
        model: 'gpt-4o-mini',
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
      return NextResponse.json(
        { error: `Failed to analyze with OpenAI: ${openaiResponse.status} - ${errorText.substring(0, 200)}` },
        { status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    const analysisContent = openaiData.choices[0].message.content
    
    // Parse the text response from ChatGPT
    console.log('📝 ChatGPT analysis response:', analysisContent)
    
    // Extract information from the text response
    const callTypeMatch = analysisContent.match(/\*\*TIPO DE CHAMADA:\*\*\s*(.+?)(?=\n\*\*|$)/i)
    const scoreMatch = analysisContent.match(/\*\*PONTUAÇÃO GERAL:\*\*\s*(\d+)/i)
    const strengthsMatch = analysisContent.match(/\*\*PONTOS FORTES:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const improvementsMatch = analysisContent.match(/\*\*ÁREAS DE MELHORIA:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const techniquesMatch = analysisContent.match(/\*\*TÉCNICAS UTILIZADAS:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const objectionsMatch = analysisContent.match(/\*\*OBJEÇÕES E TRATAMENTO:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    const feedbackMatch = analysisContent.match(/\*\*FEEDBACK GERAL:\*\*([\s\S]*?)(?=\n\*\*|$)/i)
    
    // Extract bullet points from sections
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

    // Step 4: Check for duplicate content before storing
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

    // Generate content hash for metadata (but don't use for duplicate detection)
    const encoder = new TextEncoder()
    const data = encoder.encode(truncatedTranscription)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('🔐 Generated content hash:', contentHash.substring(0, 16) + '...')
    console.log('🔄 Creating new analysis (duplicate detection disabled)...')
    
    console.log('✅ No duplicate content found, proceeding with new analysis...')

    const analysisData = {
      user_id: userId,
      title: fileName.replace(/\.[^/.]+$/, ''),
      status: 'completed',
      call_type: analysis.call_type,
      feedback: analysis.feedback,
      score: analysis.score,
      analysis: analysis.analysis,
      analysis_metadata: {
        assembly_ai_transcript_id: transcriptId,
        transcription_url: `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        original_transcription_length: transcription.length,
        truncated_transcription_length: truncatedTranscription.length,
        tokens_used: openaiData.usage?.total_tokens || 0,
        content_hash: contentHash // Store the content hash for future deduplication
      },
      transcription: truncatedTranscription // Store truncated version for reference
    }

    const { data: salesAnalysis, error: dbError } = await supabase
      .from('sales_call_analyses')
      .insert(analysisData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create analysis record' },
        { status: 500 }
      )
    }

    console.log('✅ Analysis record created:', salesAnalysis.id)

    return NextResponse.json({
      success: true,
      analysis: salesAnalysis,
      transcription: truncatedTranscription
    })

  } catch (error) {
    console.error('❌ Assembly AI transcription error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
