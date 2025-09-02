import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromURL } from '@/lib/pdf-utils'
import { extractPersonalInfoFromCV, preparePersonalInfoForDatabase } from '@/lib/hr-personal-info-extractor'
import { deleteBlobFile } from '@/lib/blob-cleanup'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { candidateId, blobUrl, fileName, userId, accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameter: accessToken' },
        { status: 400 }
      )
    }

    // Handle two scenarios:
    // 1. Process existing candidate (candidateId provided)
    // 2. Process new upload (blobUrl provided)
    if (!candidateId && !blobUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: either candidateId or blobUrl' },
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

    let candidate: any
    let candidateIdToUse: string

    if (candidateId) {
      // Scenario 1: Process existing candidate
      const { data: existingCandidate, error: candidateError } = await supabase
        .from('hr_candidates')
        .select('*')
        .eq('id', candidateId)
        .single()

      if (candidateError || !existingCandidate) {
        console.error('❌ Candidate error:', candidateError)
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        )
      }

      candidate = existingCandidate
      candidateIdToUse = candidateId

      // Update status to processing
      await supabase
        .from('hr_candidates')
        .update({ status: 'processing' })
        .eq('id', candidateId)
    } else {
      // Scenario 2: Process new upload - find the candidate by blob URL
      // Add a small delay to ensure the record is committed
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: newCandidate, error: candidateError } = await supabase
        .from('hr_candidates')
        .select('*')
        .eq('cv_file_url', blobUrl)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (candidateError || !newCandidate) {
        console.error('❌ New candidate error:', candidateError)
        console.log('🔍 Looking for candidate with blobUrl:', blobUrl)
        console.log('🔍 User ID:', userId)
        
        // Try a broader search without single() to see what we get
        const { data: candidates, error: searchError } = await supabase
          .from('hr_candidates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        
        console.log('🔍 Found candidates:', candidates)
        console.log('🔍 Search error:', searchError)
        
        // Clean up the blob file since candidate lookup failed
        if (blobUrl) {
          console.log('🗑️ Cleaning up blob file due to candidate lookup failure...')
          await deleteBlobFile(blobUrl)
        }
        
        return NextResponse.json(
          { error: 'Candidate not found for blob URL. Please try again.' },
          { status: 404 }
        )
      }

      candidate = newCandidate
      candidateIdToUse = newCandidate.id

      // Update status to processing
      await supabase
        .from('hr_candidates')
        .update({ status: 'processing' })
        .eq('id', candidateIdToUse)
    }

    console.log('📄 Processing CV for candidate:', candidate.name)

    try {
      // Extract text from CV file
      console.log('🔍 Starting text extraction from URL:', candidate.cv_file_url)
      const cvText = await extractTextFromURL(candidate.cv_file_url)
      
      console.log('📄 Raw CV text preview:', cvText.substring(0, 200))
      
      if (!cvText || cvText.length < 10) {
        throw new Error('Failed to extract meaningful text from CV')
      }

      console.log('✅ CV text extracted, length:', cvText.length)

      // Extract personal information from CV
      console.log('🤖 Starting personal information extraction...')
      const personalInfo = await extractPersonalInfoFromCV(cvText)
      console.log('✅ Personal information extraction completed')

      // Analyze CV with OpenAI using Portuguese recruitment prompt
      console.log('🤖 Starting AI analysis with recruitment criteria...')
      const analysis = await analyzeCVWithRecruitmentCriteria(cvText)
      console.log('✅ AI analysis completed')

      // Check if candidate score is above threshold
      const candidateScore = analysis.finalScore || 0
      console.log(`📊 Candidate score: ${candidateScore}/10`)

      if (candidateScore > 5) {
        // Prepare personal info for database
        const personalInfoForDB = preparePersonalInfoForDatabase(personalInfo)
        
        // Update candidate with extracted text, personal info, and analysis (score > 5)
        console.log('✅ Candidate score > 5, updating database with personal info...')
        const { error: updateError } = await supabase
          .from('hr_candidates')
          .update({
            status: 'evaluated',
            notes: `Successfully analyzed CV with AI. Score: ${candidateScore}/10. Extracted ${cvText.length} characters and personal information.`,
            evaluation: analysis,
            overall_score: analysis.finalScore,
            form_data: {
              extractedText: cvText.substring(0, 2000), // Store first 2000 chars
              textLength: cvText.length,
              parsedAt: new Date().toISOString(),
              aiAnalysis: analysis,
              personalInfo: personalInfo
            },
            ...personalInfoForDB
          })
          .eq('id', candidateIdToUse)

        if (updateError) {
          console.error('❌ Update error:', updateError)
          throw new Error('Failed to update candidate with parsed text')
        }
      } else {
        // Delete candidate if score is 5 or below
        console.log('❌ Candidate score ≤ 5, removing from database...')
        const { error: deleteError } = await supabase
          .from('hr_candidates')
          .delete()
          .eq('id', candidateIdToUse)

        if (deleteError) {
          console.error('❌ Delete error:', deleteError)
          throw new Error('Failed to remove low-scoring candidate')
        }

        // Clean up the blob file since candidate was deleted
        if (candidate.cv_file_url) {
          console.log('🗑️ Cleaning up blob file for deleted candidate...')
          await deleteBlobFile(candidate.cv_file_url)
        }
      }

      console.log('✅ CV parsing completed for candidate:', candidate.name)
      
      const response = {
        success: true,
        candidateId: candidateIdToUse,
        extractedText: cvText,
        textLength: cvText.length,
        textPreview: cvText.substring(0, 500),
        personalInfo: personalInfo,
        aiAnalysis: analysis,
        candidateSaved: candidateScore > 5,
        score: candidateScore
      }
      
      console.log('📤 API Response:', response)
      console.log('📊 candidateSaved value:', response.candidateSaved, 'candidateScore:', candidateScore)

      return NextResponse.json(response)

    } catch (error) {
      console.error('❌ CV processing error:', error)
      
      // Update status to failed
      await supabase
        .from('hr_candidates')
        .update({ 
          status: 'failed',
          notes: `Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
        .eq('id', candidateIdToUse)

      // Clean up the blob file since processing failed
      if (candidate.cv_file_url) {
        console.log('🗑️ Cleaning up blob file due to processing failure...')
        await deleteBlobFile(candidate.cv_file_url)
      }

      return NextResponse.json(
        { error: 'CV parsing failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Process CV error:', error)
    
    // Clean up the blob file if we have it and there was an error
    if (blobUrl) {
      console.log('🗑️ Cleaning up blob file due to general error...')
      await deleteBlobFile(blobUrl)
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}

/**
 * Analyze CV with OpenAI using Portuguese recruitment criteria
 * @param cvText - Extracted CV text
 * @returns Promise<any> - AI analysis results
 */
async function analyzeCVWithRecruitmentCriteria(cvText: string) {
  try {
    console.log('🤖 Initializing OpenAI analysis...')
    
    // Analyze CV with the new comprehensive Portuguese recruitment prompt
    const recruitmentPrompt = `SISTEMA DE ANÁLISE AVANÇADA DE CANDIDATOS

IMPORTANTE: Utiliza APENAS Português Europeu (pt-PT), NUNCA Português Brasileiro (pt-BR). Evita expressões como "valoriza", "equipe", "desafios", "carreira" no sentido brasileiro. Usa termos como "valoriza", "equipa", "desafios", "carreira" no sentido português europeu.

IDENTIDADE E MISSÃO
És um Senior Executive Recruiter com 15+ anos de experiência, especializado em identificar talentos comerciais de alta performance. A tua missão é analisar candidatos com profundidade cirúrgica, identificando não apenas competências técnicas, mas principalmente fit cultural, potencial de crescimento e indicadores de sucesso a longo prazo.

METODOLOGIA DE ANÁLISE PROFUNDA
FASE 1: CONTEXTUALIZAÇÃO ESTRATÉGICA
Antes de iniciar qualquer análise, deves compreender profundamente:
Estágio da empresa (impacta no perfil ideal)
Desafios específicos que a contratação deve resolver
Cultura organizacional e fit cultural necessário
Características do mercado/produto (consultiva vs transacional, B2B vs B2C)
Histórico de sucesso/insucesso em contratações anteriores

FASE 2: ANÁLISE MULTIDIMENSIONAL DOS CANDIDATOS
A. ANÁLISE DE EXPERIÊNCIA (Peso: 30%)
Não te limites aos anos de experiência. Analisa:
Qualidade das empresas onde trabalhou (startups vs corporações)
Progressão de carreira - há evolução consistente?
Contexto das conquistas - vendeu em mercado em crescimento ou declínio?
Diversidade de experiências - adaptabilidade vs especialização
Gaps de carreira - são justificáveis ou red flags?

B. ANÁLISE COMPORTAMENTAL E FIT CULTURAL (Peso: 25%)
Identifica através de indicadores subtis:
Linguagem utilizada no CV - profissional vs casual
Estrutura de apresentação - organização mental
Achievements vs responsibilities - foco em resultados vs tarefas
Consistência narrativa - há coerência na trajetória?
Indicadores de ambição vs estabilidade

C. ANÁLISE DE RESULTADOS E PERFORMANCE (Peso: 25%)
Vai além dos números apresentados:
Contexto dos resultados - equipa, mercado, recursos disponíveis
Sustentabilidade - picos isolados vs performance consistente
Métricas complementares - não só vendas (retenção, satisfação cliente)
Benchmarking - performance vs pares na mesma função/setor

D. INDICADORES DE POTENCIAL (Peso: 20%)
Procura sinais de:
Capacidade de aprendizagem - adaptação a novos setores/mercados
Resiliência - como lidou com períodos difíceis
Liderança emergente - influência sem autoridade formal
Visão comercial - compreende o negócio além da venda
Network e relacionamentos - qualidade vs quantidade

FASE 3: DETECÇÃO DE RED FLAGS
RED FLAGS CRÍTICOS:
Inconsistências temporais ou de informação
Job hopping sem justificação clara (>3 empresas em 2 anos)
Estagnação prolongada sem evolução (mesma função 5+ anos)
Ausência de métricas ou resultados quantificáveis
Superqualificação suspeita para a posição
Linguagem excessivamente genérica ou clichês
Falta de personalização do CV para a posição

CONTEXTUALIZAÇÕES CRÍTICAS:
Idade vs Energia vs Experiência: Uma pessoa de 55 anos pode ser ideal para consultoria high-ticket, mas inadequada para startup de ritmo acelerado
Overqualification Risk: Candidato sénior para posição júnior - risco de saída rápida
Cultural Misalignment: Perfil corporativo para startup ou vice-versa

SISTEMA DE SCORING AVANÇADO
SCORING BASE (1-10):
1-2: Totalmente inadequado - múltiplos red flags
3-4: Inadequado - não atende requisitos básicos
5-6: Adequado - atende critérios mínimos
7-8: Bom match - sólido com potencial
9-10: Candidato estrela - match quase perfeito

MULTIPLICADORES DE CONTEXTO:
Perfect cultural fit: x1.2
Setor específico relevante: x1.15
Network/contactos valiosos: x1.1
Timing ideal de carreira: x1.1

PENALIZADORES:
Red flags menores: -0.5 a -1.0
Red flags críticos: -2.0 a -3.0
Overqualification risk: -1.0
Geographic/availability concerns: -0.5

OUTPUT ESTRUTURADO
Para cada candidato no TOP 3-10:
1. SCORE FINAL (X.X/10)
2. EXECUTIVE SUMMARY (máx. 100 palavras) Resumir o porque de achares que e um bom candidato.
3. KEY STRENGTHS (2-3 pontos) Principais pontos fortes específicos para esta posição
4. CONCERNS & RED FLAGS (2-3 pontos) Áreas de atenção ou potenciais riscos
5. INTERVIEW FOCUS (3-4 perguntas críticas) Perguntas essenciais para validar na entrevista

Estratégia de approach/sedução

PRINCÍPIOS DE ANÁLISE
✅ SIM:
Análise contextual profunda
Foco na qualidade vs quantidade de experiência
Consideração de potencial vs histórico
Adaptação aos desafios específicos da empresa

❌ NUNCA:
Discriminação por idade, género, origem
Análise superficial baseada apenas em keywords
Ignorar contexto de mercado/empresa
Recomendações genéricas não personalizadas
Usar a expressão "'bata o solo a correr" - utiliza alternativas como "capacidade de adaptação rápida", "experiência imediata", ou "pronto para assumir responsabilidades"

LEMBRA-TE: O teu objetivo não é encontrar o CV perfeito, mas sim identificar os candidatos com maior probabilidade de sucesso e impacto positivo nesta empresa específica, neste momento específico.

ANALISA O SEGUINTE CV:
${cvText.substring(0, 8000)}

FORNECE A TUA ANÁLISE NO SEGUINTE FORMATO JSON:

{
  "score": 7.5,
  "executiveSummary": "Resumo executivo em 100 palavras máximo",
  "keyStrengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "concerns": ["Preocupação 1", "Preocupação 2", "Preocupação 3"],
  "interviewFocus": ["Pergunta 1", "Pergunta 2", "Pergunta 3", "Pergunta 4"],
  "approachStrategy": "Estratégia de approach/sedução"
}`

    console.log('🤖 Analyzing CV with comprehensive recruitment criteria...')
    const recruitmentCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'És um Senior Executive Recruiter com 15+ anos de experiência, especializado em identificar talentos comerciais de alta performance. Analisa candidatos com profundidade cirúrgica, identificando não apenas competências técnicas, mas principalmente fit cultural, potencial de crescimento e indicadores de sucesso a longo prazo. IMPORTANTE: Utiliza APENAS Português Europeu (pt-PT), NUNCA Português Brasileiro (pt-BR).'
        },
        {
          role: 'user',
          content: recruitmentPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const recruitmentResponse = recruitmentCompletion.choices[0]?.message?.content || ''
    
    console.log('🤖 Recruitment analysis response:', recruitmentResponse)
    
    // Parse the JSON response
    let analysisResult
    try {
      // Clean the response
      let cleanedResponse = recruitmentResponse.trim()
      
      // Remove markdown formatting if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\n?/, '')
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\n?/, '')
      }
      
      analysisResult = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('❌ JSON parse error for recruitment analysis:', parseError)
      console.log('📄 Raw response that failed to parse:', recruitmentResponse)
      
      // Fallback to basic analysis
      analysisResult = {
        score: 5.0,
        executiveSummary: "Análise em progresso",
        keyStrengths: ["Análise em progresso"],
        concerns: ["Análise em progresso"],
        interviewFocus: ["Análise em progresso"],
        approachStrategy: "Análise em progresso"
      }
    }
    
    console.log('🤖 Analysis result:', analysisResult)
    console.log('🤖 Executive Summary:', analysisResult.executiveSummary)
    console.log('🤖 Key Strengths:', analysisResult.keyStrengths)
    console.log('🤖 Concerns:', analysisResult.concerns)
    
    // Use the score from the comprehensive analysis
    const score = analysisResult.score || 5.0
    
    // Extract structured data from CV for additional context
    const evaluationDetails = {
      experienceYears: extractExperienceYears(cvText),
      location: extractLocation(cvText),
      languages: extractLanguages(cvText),
      salesExperience: hasSalesExperience(cvText) ? 'Sim' : 'Não especificado',
      availability: extractAvailability(cvText)
    }
    
    const analysis = {
      finalScore: score,
      executiveSummary: analysisResult.executiveSummary || "Análise em progresso",
      keyStrengths: analysisResult.keyStrengths || ["Análise em progresso"],
      concerns: analysisResult.concerns || ["Análise em progresso"],
      interviewFocus: analysisResult.interviewFocus || ["Análise em progresso"],
      approachStrategy: analysisResult.approachStrategy || "Análise em progresso",
      evaluationDetails: evaluationDetails
    }

    console.log('✅ AI analysis completed')
    console.log('📊 Analysis result:', analysis)
    
    return analysis

  } catch (error) {
    console.error('❌ AI analysis error:', error)
    throw error
  }
}



/**
 * Extract experience years from CV text
 * @param text - CV text
 * @returns number - Years of experience
 */
function extractExperienceYears(text: string): number {
  try {
    const patterns = [
      /(\d+)\s*(anos?|years?)\s*(de\s*)?experiência/i,
      /experiência\s*(de\s*)?(\d+)\s*(anos?|years?)/i,
      /(\d+)\s*(anos?|years?)\s*(de\s*)?trabalho/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const years = parseInt(match[1] || match[2])
        if (years >= 0 && years <= 50) {
          return years
        }
      }
    }
    
    return 0
  } catch (error) {
    return 0
  }
}

/**
 * Extract location from CV text
 * @param text - CV text
 * @returns string - Location
 */
function extractLocation(text: string): string {
  try {
    const patterns = [
      /(lisboa|porto|braga|coimbra|faro|aveiro|leiria|santarém|setúbal|vila\s*nova\s*de\s*gaia)/i,
      /localização[:\s]*([^,\n]+)/i,
      /morada[:\s]*([^,\n]+)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1] || match[0]
      }
    }
    
    return 'Não especificado'
  } catch (error) {
    return 'Não especificado'
  }
}

/**
 * Extract languages from CV text
 * @param text - CV text
 * @returns string[] - List of languages
 */
function extractLanguages(text: string): string[] {
  try {
    const languages = []
    
    if (/português|portuguese/i.test(text)) languages.push('Português')
    if (/inglês|english/i.test(text)) languages.push('Inglês')
    if (/espanhol|spanish/i.test(text)) languages.push('Espanhol')
    if (/francês|french/i.test(text)) languages.push('Francês')
    if (/alemão|german/i.test(text)) languages.push('Alemão')
    if (/italiano|italian/i.test(text)) languages.push('Italiano')
    
    return languages.length > 0 ? languages : ['Português']
  } catch (error) {
    return ['Português']
  }
}

/**
 * Check if candidate has sales experience
 * @param text - CV text
 * @returns boolean - Has sales experience
 */
function hasSalesExperience(text: string): boolean {
  try {
    const salesKeywords = [
      /vendas|sales/i,
      /comercial|commercial/i,
      /cliente|customer/i,
      /negócio|business/i,
      /marketing/i,
      /account\s*manager/i,
      /sales\s*representative/i
    ]
    
    return salesKeywords.some(pattern => pattern.test(text))
  } catch (error) {
    return false
  }
}

/**
 * Extract availability from CV text
 * @param text - CV text
 * @returns string - Availability
 */
function extractAvailability(text: string): string {
  try {
    if (/imediata|immediate/i.test(text)) return 'Imediata'
    if (/remoto|remote/i.test(text)) return 'Remoto'
    if (/híbrido|hybrid/i.test(text)) return 'Híbrido'
    if (/presencial|on-site/i.test(text)) return 'Presencial'
    
    return 'Não especificado'
  } catch (error) {
    return 'Não especificado'
  }
}

