import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import OpenAI from 'openai'
import { put, del } from '@vercel/blob'
import { extractTextFromFile } from '@/lib/pdf-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
})

interface GoogleFormRow {
  [key: string]: string
}

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  cvUrl: string
  cvContent?: string
  submissionDate: string
  status: 'pending'
  formData?: any // Store the original Google Form data
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const cvFile = formData.get('cvFile') as File
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string
    const candidateName = formData.get('candidateName') as string
    const candidateEmail = formData.get('candidateEmail') as string
    const candidatePosition = formData.get('candidatePosition') as string

    console.log('📊 Processing CV upload for HR Talent:', {
      fileName: cvFile?.name,
      fileSize: cvFile?.size,
      userId,
      candidateName,
      candidateEmail
    })

    if (!cvFile || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate file type - accept common CV formats
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
    const fileExtension = cvFile.name.toLowerCase().substring(cvFile.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'File must be a PDF, DOC, DOCX, TXT, or RTF' },
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

    // Upload file to Vercel Blob
    let blobUrl = ''
    try {
      console.log(`📤 Uploading file to Vercel Blob: ${cvFile.name}`)
      const blob = await put(cvFile.name, cvFile, {
        access: 'public',
      })
      blobUrl = blob.url
      console.log(`✅ File uploaded to Vercel Blob: ${blobUrl}`)
    } catch (blobError) {
      console.error('❌ Vercel Blob upload error:', blobError)
      return NextResponse.json(
        { error: 'Failed to upload file to Vercel Blob' },
        { status: 500 }
      )
    }

    // Extract CV content from uploaded file
    let cvContent = ''
    try {
      console.log(`📄 Extracting CV content from uploaded file: ${cvFile.name}`)
      cvContent = await extractTextFromFile(cvFile)
      console.log(`✅ CV content extracted (${cvContent?.length || 0} characters)`)
      
      // Debug: Show first 500 characters of CV content
      if (cvContent && cvContent.length > 0) {
        console.log(`🔍 First 500 chars of CV content:`, cvContent.substring(0, 500))
      } else {
        console.log(`❌ CV content is empty or null`)
      }
    } catch (cvError) {
      console.warn(`⚠️ Failed to extract CV content:`, cvError)
      cvContent = `CV content could not be extracted: ${cvError instanceof Error ? cvError.message : 'Unknown error'}`
    }

    // Use provided candidate info or extract from CV
    let candidateInfo = {
      name: candidateName || 'Unknown Candidate',
      email: candidateEmail || 'no-email@example.com',
      position: candidatePosition || 'Sales Position'
    }

    // If no candidate info provided, try to extract from CV
    if (!candidateName && !candidateEmail && !candidatePosition && cvContent && !cvContent.includes('could not be extracted')) {
      try {
        console.log('🤖 Using ChatGPT to extract candidate information from CV...')
        const extractedInfo = await extractCandidateInfoFromCV(cvContent)
        candidateInfo = {
          name: extractedInfo.name !== 'Unknown Candidate' ? extractedInfo.name : candidateInfo.name,
          email: extractedInfo.email !== 'no-email@example.com' ? extractedInfo.email : candidateInfo.email,
          position: extractedInfo.position !== 'Unknown Position' ? extractedInfo.position : candidateInfo.position
        }
        console.log('✅ Candidate information extracted:', candidateInfo)
      } catch (aiError) {
        console.warn('⚠️ Failed to extract candidate info with AI:', aiError)
      }
    }

    // Run the 3-prompt analysis to get score
    console.log('🧠 Running analysis for candidate:', candidateInfo.name)
    const analysisResult = await runCandidateAnalysisWithDetails(cvContent, {}, candidateInfo)
    console.log(`📊 Candidate score: ${analysisResult.score}/10`)

    // Store analysis result for display
    const analysisResults = [{
      candidateName: candidateInfo.name,
      candidateEmail: candidateInfo.email,
      candidatePosition: candidateInfo.position,
      score: analysisResult.score,
      prompt1_response: analysisResult.prompt1_response,
      prompt2_response: analysisResult.prompt2_response,
      prompt3_response: analysisResult.prompt3_response,
      raw_content: analysisResult.raw_content
    }]

    // Only add to qualified candidates if score > 5
    let qualifiedCandidates: any[] = []
    if (analysisResult.score > 5) {
      const candidate = {
        id: crypto.randomUUID(),
        name: candidateInfo.name,
        email: candidateInfo.email,
        position: candidateInfo.position,
        cvUrl: cvFile.name,
        cvContent: cvContent,
        submissionDate: new Date().toISOString(),
        status: 'pending',
        score: analysisResult.score
      }
      
      console.log('🔍 Created qualified candidate record:', {
        name: candidate.name,
        email: candidate.email,
        position: candidate.position,
        score: analysisResult.score
      })
      
      qualifiedCandidates.push(candidate)
      console.log('✅ Qualified candidate added to list')
    } else {
      console.log(`❌ Candidate ${candidateInfo.name} scored ${analysisResult.score}/10 - below threshold (5)`)
    }

    console.log(`✅ Processed 1 candidate, ${qualifiedCandidates.length} qualified (score > 5)`)

    // Store only qualified candidates in database
    let storedCandidates = []
    if (qualifiedCandidates.length > 0) {
      const { data: stored, error: dbError } = await supabase
        .from('hr_candidates')
        .insert(qualifiedCandidates.map(candidate => ({
          id: candidate.id,
          user_id: userId,
          agent_id: '9485f376-003f-489c-b038-2817c02ad15d', // HR Agent ID from your agents table
          name: candidate.name,
          email: candidate.email,
          position: candidate.position,
                     cv_file_url: blobUrl,
          cv_content: candidate.cvContent || null,
          form_data: null, // No form data for direct upload
          score: candidate.score, // Store the score
          status: 'completed', // Mark as completed since analysis is done
          analyzed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })))
        .select()

      if (dbError) {
        console.error('❌ Database error:', dbError)
        return NextResponse.json(
          { error: 'Failed to store candidate' },
          { status: 500 }
        )
      }
      
      storedCandidates = stored || []
    }

         console.log('✅ Candidates stored in database:', storedCandidates?.length)

     // Clean up: Delete file from Vercel Blob after processing
     try {
       console.log(`🗑️ Deleting file from Vercel Blob: ${blobUrl}`)
       await del(blobUrl)
       console.log(`✅ File deleted from Vercel Blob successfully`)
     } catch (deleteError) {
       console.warn(`⚠️ Failed to delete file from Vercel Blob:`, deleteError)
       // Don't fail the request if cleanup fails
     }

     return NextResponse.json({
       success: true,
       candidates: qualifiedCandidates,
       analysisResults: analysisResults, // Return analysis results for display
       message: `Successfully processed 1 candidate, ${qualifiedCandidates.length} qualified (score > 5)`
     })

  } catch (error) {
    console.error('❌ CSV upload error:', error)
    return NextResponse.json(
      { error: `CSV processing failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

// Function to extract CV content from uploaded file (now using utility)
async function extractCVContentFromFile(file: File): Promise<string> {
  return extractTextFromFile(file)
}

// Function to extract CV content from various file types (kept for backward compatibility)
async function extractCVContent(cvUrl: string): Promise<string> {
  try {
    console.log('🔍 Extracting CV content from URL:', cvUrl)
    
    // Handle Google Drive URLs
    if (cvUrl.includes('drive.google.com')) {
      return await extractFromGoogleDrive(cvUrl)
    }
    
    // Handle direct file URLs
    if (cvUrl.startsWith('http')) {
      return await extractFromDirectURL(cvUrl)
    }
    
    throw new Error('Unsupported URL format')
    
  } catch (error) {
    console.error('❌ CV extraction error:', error)
    throw error
  }
}

// Extract content from Google Drive URLs
async function extractFromGoogleDrive(driveUrl: string): Promise<string> {
  try {
    // Convert Google Drive sharing URL to direct download URL
    const fileId = extractGoogleDriveFileId(driveUrl)
    if (!fileId) {
      throw new Error('Could not extract file ID from Google Drive URL')
    }
    
    // Try to get file content using Google Drive API or direct download
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    
    console.log('📥 Downloading from Google Drive:', directUrl)
    
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`)
    }
    
    const buffer = await response.arrayBuffer()
    const text = new TextDecoder('utf-8').decode(buffer)
    
    // If it's a binary file (PDF, DOCX), we'll need to handle it differently
    if (text.includes('<!DOCTYPE html>') || text.includes('<html>') || text.includes('accounts.google.com')) {
      // This might be a Google Drive error page or HTML
      console.log(`❌ Received HTML instead of file content. HTML preview:`, text.substring(0, 500))
      throw new Error('Google Drive file is restricted or requires authentication. Please make the file publicly accessible or provide a direct download link.')
    }
    
    console.log(`✅ Successfully extracted text content. Preview:`, text.substring(0, 200))
    return text
    
  } catch (error) {
    console.error('❌ Google Drive extraction error:', error)
    throw error
  }
}

// Extract content from direct URLs
async function extractFromDirectURL(url: string): Promise<string> {
  try {
    console.log('📥 Downloading from direct URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`)
    }
    
    const buffer = await response.arrayBuffer()
    const text = new TextDecoder('utf-8').decode(buffer)
    
    return text
    
  } catch (error) {
    console.error('❌ Direct URL extraction error:', error)
    throw error
  }
}

// Extract Google Drive file ID from URL
function extractGoogleDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /open\?usp=forms_web&id=([a-zA-Z0-9-_]+)/, // Handle Google Forms format
    /id=([a-zA-Z0-9-_]+)/ // General ID pattern
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

// Function to extract candidate information from CV content using ChatGPT
async function extractCandidateInfoFromCV(cvContent: string): Promise<{name: string, email: string, position: string}> {
  try {
    console.log('🤖 Sending CV content to ChatGPT for analysis...')
    
    // Truncate CV content to fit within token limits for candidate info extraction
    const maxCvLengthForInfo = 4000 // ~1000 tokens (4 chars per token average)
    const truncatedCvContent = cvContent.length > maxCvLengthForInfo 
      ? cvContent.substring(0, maxCvLengthForInfo) + '\n\n[CV content truncated for info extraction]'
      : cvContent
    
    console.log(`📄 CV content length for info extraction: ${cvContent.length} chars, truncated to: ${truncatedCvContent.length} chars`)
    console.log(`🔍 Truncated CV content for ChatGPT:`, truncatedCvContent.substring(0, 200) + '...')
    
    const prompt = `
      Analisa o seguinte conteúdo de CV e extrai as seguintes informações:
      
      CONTEÚDO DO CV:
      ${truncatedCvContent}
      
      Por favor, extrai e retorna APENAS um objeto JSON com a seguinte estrutura:
      {
        "name": "Nome completo da pessoa",
        "email": "Email da pessoa",
        "position": "Posição/cargo que está a candidatar-se"
      }
      
      Regras importantes:
      - Se não conseguires encontrar alguma informação, usa valores padrão:
        - name: "Unknown Candidate"
        - email: "no-email@example.com" 
        - position: "Unknown Position"
      - Retorna APENAS o JSON, sem texto adicional
      - Certifica-te de que o JSON é válido
    `
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "És um assistente especializado em extrair informações de CVs. Forneces apenas JSON válido como resposta."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })
    
    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from ChatGPT')
    }
    
    console.log(`🤖 ChatGPT response for candidate info:`, responseContent)
    
    // Try to parse the JSON response
    try {
      const candidateInfo = JSON.parse(responseContent)
      console.log(`✅ Parsed candidate info:`, candidateInfo)
      return {
        name: candidateInfo.name || 'Unknown Candidate',
        email: candidateInfo.email || 'no-email@example.com',
        position: candidateInfo.position || 'Unknown Position'
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse ChatGPT response as JSON:', responseContent)
      return {
        name: 'Unknown Candidate',
        email: 'no-email@example.com',
        position: 'Unknown Position'
      }
    }
    
  } catch (error) {
    console.error('❌ Error extracting candidate info with ChatGPT:', error)
    return {
      name: 'Unknown Candidate',
      email: 'no-email@example.com',
      position: 'Unknown Position'
    }
  }
}

// Function to run the 3-prompt analysis and return score
async function runCandidateAnalysis(cvContent: string, formData: any, candidateInfo: any): Promise<number> {
  try {
    // Truncate CV content to fit within token limits
    const maxCvLength = 8000 // ~2000 tokens (4 chars per token average)
    const truncatedCvContent = cvContent.length > maxCvLength 
      ? cvContent.substring(0, maxCvLength) + '\n\n[CV content truncated due to length]'
      : cvContent

    // Build candidate information from form data
    let candidateInfoText = ''
    if (formData) {
      candidateInfoText = `
Informações do Candidato:
- Nome: ${candidateInfo.name}
- Email: ${candidateInfo.email}
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

${candidateInfoText}

CV Content:
${truncatedCvContent}

Analisa este candidato baseado nas informações do formulário e conteúdo do CV e retorna apenas um número de 0-10 com uma casa decimal (ex: 7.5).
`

    // Execute the analysis
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

    return score

  } catch (error) {
    console.error('❌ Error running candidate analysis:', error)
    return 0 // Return 0 if analysis fails
  }
}

// Function to run the 3-prompt analysis and return detailed results
async function runCandidateAnalysisWithDetails(cvContent: string, formData: any, candidateInfo: any): Promise<{
  score: number;
  prompt1_response: string;
  prompt2_response: string;
  prompt3_response: string;
  raw_content: string;
}> {
  try {
    // Truncate CV content to fit within token limits
    const maxCvLength = 8000 // ~2000 tokens (4 chars per token average)
    const truncatedCvContent = cvContent.length > maxCvLength 
      ? cvContent.substring(0, maxCvLength) + '\n\n[CV content truncated due to length]'
      : cvContent

    // Build candidate information from form data
    let candidateInfoText = ''
    if (formData) {
      candidateInfoText = `
Informações do Candidato:
- Nome: ${candidateInfo.name}
- Email: ${candidateInfo.email}
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

${candidateInfoText}

CV Content:
${truncatedCvContent}

Analisa este candidato baseado nas informações do formulário e conteúdo do CV e retorna apenas um número de 0-10 com uma casa decimal (ex: 7.5).
`

    // Execute the analysis
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

    return {
      score: score,
      prompt1_response: scoreResponse,
      prompt2_response: strengthsResponse,
      prompt3_response: weaknessesResponse,
      raw_content: `Score: ${score}/10\nStrengths: ${strengthsResponse}\nWeaknesses: ${weaknessesResponse}`
    }

  } catch (error) {
    console.error('❌ Error running candidate analysis with details:', error)
    return {
      score: 0,
      prompt1_response: 'Analysis failed',
      prompt2_response: 'Analysis failed',
      prompt3_response: 'Analysis failed',
      raw_content: 'Analysis failed'
    }
  }
}
