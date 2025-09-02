import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { accessToken, jobPost, step, answers } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameter: accessToken' },
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

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Step 1: Initial job post analysis
    if (step === 'analyze-job-post') {
      if (!jobPost) {
        return NextResponse.json(
          { error: 'Job post is required for analysis' },
          { status: 400 }
        )
      }

      console.log('🤖 Analyzing job post for contextual questions...')
      
      const analysisPrompt = `SISTEMA DE ANÁLISE AVANÇADA DE CANDIDATOS

image.pngIMPORTANTE: Utiliza APENAS Português Europeu (pt-PT), NUNCA Português Brasileiro (pt-BR). Evita expressões como "valoriza", "equipe", "desafios", "carreira" no sentido brasileiro. Usa termos como "valoriza", "equipa", "desafios", "carreira" no sentido português europeu.

PASSO 2: ANÁLISE DO JOB POST + PERGUNTAS CHAVE
Após receber o job post, analisa-o rapidamente e identifica 2-3 gaps críticos de informação que realmente impactam a qualidade da seleção. Faz APENAS as perguntas essenciais:

PERGUNTAS CRÍTICAS POSSÍVEIS (escolhe 2-3 máximo):
Se não estiver claro no job post:
"Qual é o principal desafio/dor que esta contratação deve resolver na empresa?"
"Que tipo de perfis tiveram mais sucesso (ou falharam) em posições similares na vossa empresa?"
"Esta é uma posição para crescer internamente ou precisam de alguém com capacidade de adaptação rápida?"
"O produto/serviço requer venda consultiva (ciclo longo, high-ticket) ou é mais transacional?"
"Preferem candidatos com experiência específica no vosso setor ou valorizam mais experiência comercial sólida genérica?"

NUNCA perguntes:
Informação que já está clara no job post
Mais de 3 perguntas
Perguntas genéricas ou óbvias

ANALISA O SEGUINTE JOB POST:
${jobPost}

FORNECE A TUA ANÁLISE NO SEGUINTE FORMATO JSON:

{
  "questions": ["Pergunta 1", "Pergunta 2", "Pergunta 3"],
  "jobContext": "Resumo do contexto da posição em 50 palavras"
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'És um Senior Executive Recruiter especializado em análise de job posts e identificação de gaps críticos de informação para recrutamento de alta qualidade. IMPORTANTE: Utiliza APENAS Português Europeu (pt-PT), NUNCA Português Brasileiro (pt-BR). NUNCA uses a expressão "bata o solo a correr" - utiliza alternativas como "capacidade de adaptação rápida", "experiência imediata", ou "pronto para assumir responsabilidades".'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content || ''
      
      try {
        // Clean and parse the response
        let cleanedResponse = response.trim()
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\n?/, '')
        }
        if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\n?/, '')
        }
        
        const analysis = JSON.parse(cleanedResponse)
        
        return NextResponse.json({
          success: true,
          step: 'questions',
          questions: analysis.questions || [],
          jobContext: analysis.jobContext || '',
          message: 'Por favor, responde às seguintes perguntas para uma análise mais precisa:'
        })
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        return NextResponse.json({
          success: true,
          step: 'questions',
          questions: [
            'Qual é o principal desafio que esta contratação deve resolver na empresa?',
            'Que tipo de perfis tiveram mais sucesso em posições similares na vossa empresa?'
          ],
          jobContext: 'Análise em progresso',
          message: 'Por favor, responde às seguintes perguntas para uma análise mais precisa:'
        })
      }
    }

    // Step 2: Confirm analysis with answers
    if (step === 'confirm-analysis') {
      if (!answers || !Array.isArray(answers)) {
        return NextResponse.json(
          { error: 'Answers array is required for confirmation' },
          { status: 400 }
        )
      }

      console.log('✅ Confirming analysis with provided answers...')
      
      return NextResponse.json({
        success: true,
        step: 'ready',
        message: 'Perfeito! Tenho agora o contexto completo para fazer uma análise cirúrgica. Por favor, carrega o CSV com os candidatos e os respetivos CVs para eu identificar os 3-10 candidatos mais promissores para esta posição específica.',
        context: {
          answers,
          readyForAnalysis: true
        }
      })
    }

    // Default: Step 1 - Request job post
    return NextResponse.json({
      success: true,
      step: 'request-job-post',
      message: 'Para fazer uma análise precisa e contextualizada, preciso primeiro de compreender a posição em detalhe. Por favor, cola aqui o job post completo da vaga que estás a recrutar.'
    })

  } catch (error) {
    console.error('❌ HR Agent analyze job error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
