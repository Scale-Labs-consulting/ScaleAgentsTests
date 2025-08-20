import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { extractTextFromURL } from '@/lib/pdf-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { candidateId, userId, accessToken } = await request.json()

    console.log('🧠 Analyzing candidate:', candidateId)

    if (!candidateId || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
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

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('hr_candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('user_id', userId)
      .single()

    if (candidateError || !candidate) {
      console.error('❌ Candidate not found:', candidateError)
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    console.log('✅ Candidate found:', candidate.name)

    // Update status to processing
    await supabase
      .from('hr_candidates')
      .update({ status: 'processing' })
      .eq('id', candidateId)

    try {
      // Truncate CV content to fit within token limits (roughly 3000 tokens for CV content)
      const maxCvLength = 12000 // ~3000 tokens (4 chars per token average)
      const cvContent = candidate.cv_content || 'CV content not available'
      const truncatedCvContent = cvContent.length > maxCvLength 
        ? cvContent.substring(0, maxCvLength) + '\n\n[CV content truncated due to length]'
        : cvContent

      console.log(`📄 CV content length: ${cvContent.length} chars, truncated to: ${truncatedCvContent.length} chars`)

      // Analyze CV using OpenAI with the new 3-prompt workflow
      
      // Build candidate information from form data and CV
      let candidateInfo = ''
      
      if (candidate.form_data) {
        const formData = candidate.form_data
        candidateInfo = `
Informações do Candidato:
- Nome: ${candidate.name}
- Email: ${candidate.email}
- Idade: ${formData.Idade || 'Não especificada'}
- Residência: ${formData.Residência || 'Não especificada'}
- Regime de trabalho pretendido: ${formData.Regime || 'Não especificado'}
- Já fez vendas diretas: ${formData['Já fizeste vendas diretas?'] || 'Não especificado'}
- Anos de experiência em vendas: ${formData['Se sim, quantos anos tens de experiência em vendas diretas?'] || '0'}
- Setores de experiência: ${formData['Setores em que tem experiência'] || 'Não especificado'}
- Línguas faladas: ${formData['Línguas faladas'] || 'Não especificado'}
- Confiança na habilidade de vender (0-10): ${formData['De 0-10, o quão confiante estás na tua habilidade de vendedor?'] || 'Não especificado'}
- Facilidade com feedback negativo (0-10): ${formData['De 0-10, o quão fácil lidas com feedback negativo?'] || 'Não especificado'}
- Confiança sob pressão (0-10): ${formData['De 0-10, o quão confiante trabalhas sob pressão?'] || 'Não especificado'}
- Disponibilidade imediata: ${formData['Tens disponibilidade imediata?'] || 'Não especificado'}
`
      }

      // Prompt 1: Main scoring evaluation
      const prompt1 = `
Como assistente de recrutamento especializado, a tua função é avaliar candidatos para posições comerciais para empresas parceiras. 
Segue este processo estruturado de avaliação:

CRITÉRIOS ELIMINATÓRIOS Primeiro, verifique se o candidato atende aos requisitos mínimos de cada empresa. Se qualquer critério eliminatório não for atendido, atribua pontuação 0 e encerre a avaliação para aquela empresa.

Comopi:
Idade: 20-45 anos
Carta de condução obrigatória
Disponibilidade para deslocações frequentes
Conhecimento em design e setor

MoBrand:
Inglês fluente obrigatório
Experiência B2B comprovada
Disponibilidade horário 14:00-22:00 GMT
Documentação portuguesa regularizada

Lugotech:
Localização: Guimarães ou arredores
Disponibilidade presencial segundas-feiras
Experiência em vendas ou call center

Grafislab:
Inglês fluente
Francês desejável
Disponibilidade regime híbrido Ermesinde
Idade: 25-35 anos

Mariana Arga e Lima:
Experiência em vendas consultivas
Capacidade comprovada de gestão de ciclo comercial completo
Disponibilidade para trabalho remoto

Mush:
Idade: 23-38 anos
Formação ou experiência em Marketing
Localização: Porto ou arredores
Disponibilidade regime híbrido

Slide Lab:
Idade: 22-33 anos
Experiência comercial prévia (2-3 anos)
Inglês fluente
Localização: Lisboa

Fashion Details:
Idade: <35 anos
Conhecimento setor moda
Carta de condução
Localização: Trofa

MagikEvolution:
Idade: 22-30 anos
Localização: Trofa/Maia/Santo Tirso/Vizela/Famalicão
Disponibilidade regime híbrido

Maria Costa e Maia:
Experiência mínima 2 anos em vendas
Residência Porto ou Lisboa
Disponibilidade regime híbrido
Capacidade gestão 10 reuniões/dia

SISTEMA DE PONTUAÇÃO (Para candidatos que passaram os critérios eliminatórios)
CÁLCULO DA PONTUAÇÃO FINAL:
Para cada empresa, calcular:

Média ponderada dos critérios com os seguintes pesos:
Experiência em Vendas: 35%
Localização e Disponibilidade: 25%
Competências Linguísticas: 20%
Soft Skills: 10%
Expectativa Salarial: 10%

Multiplicar por fatores específicos apenas se todos os requisitos mínimos forem atendidos:
Match de setor de interesse: x1.1
Match de regime de trabalho: x1.1
Match geográfico perfeito: x1.1

Se o candidato tiver 0 anos de experiência, a pontuação final não pode exceder 3.0.
Se o candidato tiver menos de 1 ano de experiência, a pontuação final não pode exceder 5.0.

Como output, dar um rating de 0-10, apenas o número final.

FATORES MULTIPLICADORES Aplicar apenas se pontuação base >5:
Match perfeito de setor: x1.2
Match perfeito de localização: x1.1
Match perfeito de regime de trabalho: x1.1

LIMITADORES
0 anos de experiência: pontuação máxima 3.0
Menos de 1 ano de experiência: pontuação máxima 5.0
Não atendimento de qualquer critério eliminatório: pontuação 0

OUTPUT Fornecer:
Pontuação final (0-10, uma casa decimal)
As três empresas com maior pontuação
Principais pontos fortes do candidato
Principais pontos de atenção
Mesmo com informações incompletas, fornece sempre uma avaliação baseada nos dados disponíveis, indicando quais critérios não puderam ser avaliados

Eis o candidato que estamos a avaliar:

${candidateInfo}

CV Content:
${truncatedCvContent}

Analisa este candidato baseado nas informações do formulário e conteúdo do CV e retorna apenas um número de 0-10 com uma casa decimal (ex: 7.5).
`

      // Execute the 3-prompt workflow
      
      // Prompt 1: Main scoring evaluation
      console.log('🤖 Executing Prompt 1: Main scoring evaluation...')
      const completion1 = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "És um especialista em recrutamento para posições comerciais. Avalias candidatos para 10 empresas parceiras seguindo critérios específicos. Retornas apenas um número de 0-10."
          },
          {
            role: "user",
            content: prompt1
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })

      const scoreResponse = completion1.choices[0]?.message?.content
      if (!scoreResponse) {
        throw new Error('No score response received from OpenAI')
      }

      // Extract score from response (should be just a number)
      const scoreMatch = scoreResponse.match(/(\d+\.?\d*)/)
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0
      console.log(`📊 Score extracted: ${score}`)

      // Prompt 2: Strengths analysis
      console.log('🤖 Executing Prompt 2: Strengths analysis...')
      const prompt2 = `
Preciso que analises esta resposta "${scoreResponse}" e o candidato em questao e me digas em 15 palavras os pontos fortes dele.

3 no máximo.

Output só os pontes fortes.
`
      
      const completion2 = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "És um especialista em análise de candidatos. Identificas pontos fortes de forma concisa."
          },
          {
            role: "user",
            content: prompt2
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      })

      const strengthsResponse = completion2.choices[0]?.message?.content || 'Pontos fortes não identificados'

      // Prompt 3: Weaknesses analysis
      console.log('🤖 Executing Prompt 3: Weaknesses analysis...')
      const prompt3 = `
Preciso que analises esta resposta "${scoreResponse}" e o candidato em questao e me digas em 15 palavras os pontos a ter em atenção dele.

3 no máximo.

Output só os pontes a ter em atençao.
`
      
      const completion3 = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "És um especialista em análise de candidatos. Identificas pontos de atenção de forma concisa."
          },
          {
            role: "user",
            content: prompt3
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      })

      const weaknessesResponse = completion3.choices[0]?.message?.content || 'Pontos de atenção não identificados'

      // Compile analysis results
      const analysis = {
        score: score,
        strengths: [strengthsResponse],
        weaknesses: [weaknessesResponse],
        fit: `Candidato avaliado com pontuação ${score}/10`,
        recommendation: score >= 7 ? 'Recomendado' : score >= 5 ? 'Com reservas' : 'Não recomendado',
        interview_questions: ['Avaliação baseada em critérios específicos das empresas parceiras'],
        raw_content: scoreResponse,
        prompt1_response: scoreResponse,
        prompt2_response: strengthsResponse,
        prompt3_response: weaknessesResponse
      }

      // Store analysis in database
      console.log('💾 Storing analysis results...')
      const { error: updateError } = await supabase
        .from('hr_candidates')
        .update({
          status: 'completed',
          score: analysis.score || 0,
          analysis: analysis,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', candidateId)

      if (updateError) {
        console.error('❌ Failed to update candidate analysis:', updateError)
        console.error('❌ Update data:', {
          status: 'completed',
          score: analysis.score || 0,
          analysis: analysis,
          analyzed_at: new Date().toISOString()
        })
        throw new Error(`Failed to store analysis results: ${updateError.message}`)
      }

      console.log('✅ Analysis completed successfully for:', candidate.name)

      return NextResponse.json({
        success: true,
        candidateName: candidate.name,
        score: analysis.score || 0,
        analysis: analysis,
        message: 'Analysis completed successfully'
      })

    } catch (analysisError) {
      console.error('❌ Analysis failed:', analysisError)
      
      // Update status to failed
      await supabase
        .from('hr_candidates')
        .update({ 
          status: 'failed',
          analysis: { error: analysisError instanceof Error ? analysisError.message : 'Analysis failed' }
        })
        .eq('id', candidateId)

      throw analysisError
    }

  } catch (error) {
    console.error('❌ Analyze candidate error:', error)
    return NextResponse.json(
      { error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
