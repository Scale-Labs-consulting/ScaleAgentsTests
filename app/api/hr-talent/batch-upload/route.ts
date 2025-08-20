import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { put, del } from '@vercel/blob'
import { extractTextFromFile } from '@/lib/pdf-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
})

interface BatchUploadResult {
  success: boolean
  fileName: string
  candidateName: string
  score: number
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('cvFiles') as File[]
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string

    console.log(`📊 Processing batch upload for HR Talent: ${files.length} files`)

    if (!files.length || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate all files
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
    for (const file of files) {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (!allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { error: `File ${file.name} must be a PDF, DOC, DOCX, TXT, or RTF` },
          { status: 400 }
        )
      }
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

    const results: BatchUploadResult[] = []
    const qualifiedCandidates: any[] = []

    // Process files in parallel with concurrency limit
    const concurrencyLimit = 3 // Process 3 files at a time to avoid rate limits
    const chunks = []
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit))
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (file) => {
        try {
          console.log(`📤 Processing file: ${file.name}`)
          
          // Upload to Vercel Blob
          const blob = await put(file.name, file, { access: 'public' })
          
                     // Extract content
           let cvContent = ''
           try {
             cvContent = await extractTextFromFile(file)
             console.log(`📄 CV content extracted for ${file.name}: ${cvContent.length} characters`)
             
             // Show first 500 characters for debugging
             if (cvContent.length > 0) {
               console.log(`🔍 First 500 chars of CV content:`, cvContent.substring(0, 500))
             }
           } catch (cvError) {
             cvContent = `CV content could not be extracted: ${cvError instanceof Error ? cvError.message : 'Unknown error'}`
             console.warn(`⚠️ CV content extraction failed for ${file.name}:`, cvError)
           }

          // Extract candidate info
          let candidateInfo = {
            name: 'Unknown Candidate',
            email: 'no-email@example.com',
            position: 'Sales Position'
          }

          if (cvContent && !cvContent.includes('could not be extracted')) {
            try {
              const extractedInfo = await extractCandidateInfoFromCV(cvContent)
              candidateInfo = {
                name: extractedInfo.name !== 'Unknown Candidate' ? extractedInfo.name : candidateInfo.name,
                email: extractedInfo.email !== 'no-email@example.com' ? extractedInfo.email : candidateInfo.email,
                position: extractedInfo.position !== 'Unknown Position' ? extractedInfo.position : candidateInfo.position
              }
            } catch (aiError) {
              console.warn(`⚠️ Failed to extract candidate info for ${file.name}:`, aiError)
            }
          }

                     // Run analysis
           console.log(`🧠 Running analysis for ${file.name} - Candidate: ${candidateInfo.name}`)
           const analysisResult = await runCandidateAnalysisWithDetails(cvContent, {}, candidateInfo)
           console.log(`📊 Analysis result for ${file.name}: Score ${analysisResult.score}/10`)
          
          // Clean up blob
          try {
            await del(blob.url)
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete blob for ${file.name}:`, deleteError)
          }

          const result: BatchUploadResult = {
            success: true,
            fileName: file.name,
            candidateName: candidateInfo.name,
            score: analysisResult.score
          }

          // Add to qualified candidates if score > 5
          if (analysisResult.score > 5) {
            qualifiedCandidates.push({
              id: crypto.randomUUID(),
              name: candidateInfo.name,
              email: candidateInfo.email,
              position: candidateInfo.position,
              cvUrl: file.name,
              cvContent: cvContent,
              submissionDate: new Date().toISOString(),
              status: 'pending',
              score: analysisResult.score
            })
          }

          return result

        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error)
          return {
            success: false,
            fileName: file.name,
            candidateName: 'Unknown',
            score: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
    }

    // Store qualified candidates in database
    let storedCandidates = []
    if (qualifiedCandidates.length > 0) {
      const { data: stored, error: dbError } = await supabase
        .from('hr_candidates')
        .insert(qualifiedCandidates.map(candidate => ({
          id: candidate.id,
          user_id: userId,
          agent_id: '9485f376-003f-489c-b038-2817c02ad15d',
          name: candidate.name,
          email: candidate.email,
          position: candidate.position,
          cv_file_url: candidate.cvUrl,
          cv_content: candidate.cvContent || null,
          form_data: null,
          score: candidate.score,
          status: 'completed',
          analyzed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })))
        .select()

      if (dbError) {
        console.error('❌ Database error:', dbError)
        return NextResponse.json(
          { error: 'Failed to store candidates' },
          { status: 500 }
        )
      }
      
      storedCandidates = stored || []
    }

    const successfulUploads = results.filter(r => r.success).length
    const qualifiedCount = qualifiedCandidates.length

    console.log(`✅ Batch processing complete: ${successfulUploads}/${files.length} successful, ${qualifiedCount} qualified`)

    return NextResponse.json({
      success: true,
      results: results,
      qualifiedCandidates: qualifiedCandidates,
      summary: {
        totalFiles: files.length,
        successfulUploads,
        qualifiedCount,
        failedUploads: files.length - successfulUploads
      },
      message: `Successfully processed ${successfulUploads}/${files.length} files, ${qualifiedCount} qualified (score > 5)`
    })

  } catch (error) {
    console.error('❌ Batch upload error:', error)
    return NextResponse.json(
      { error: `Batch processing failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

// Helper functions (same as single upload)
async function extractCVContentFromFile(file: File): Promise<string> {
  return extractTextFromFile(file)
}

async function extractCandidateInfoFromCV(cvContent: string): Promise<{name: string, email: string, position: string}> {
  try {
    const maxCvLengthForInfo = 4000
    const truncatedCvContent = cvContent.length > maxCvLengthForInfo 
      ? cvContent.substring(0, maxCvLengthForInfo) + '\n\n[CV content truncated for info extraction]'
      : cvContent
    
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
    
    try {
      const candidateInfo = JSON.parse(responseContent)
      return {
        name: candidateInfo.name || 'Unknown Candidate',
        email: candidateInfo.email || 'no-email@example.com',
        position: candidateInfo.position || 'Unknown Position'
      }
    } catch (parseError) {
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

async function runCandidateAnalysisWithDetails(cvContent: string, formData: any, candidateInfo: any): Promise<{
  score: number;
  prompt1_response: string;
  prompt2_response: string;
  prompt3_response: string;
  raw_content: string;
}> {
  try {
    const maxCvLength = 8000
    const truncatedCvContent = cvContent.length > maxCvLength 
      ? cvContent.substring(0, maxCvLength) + '\n\n[CV content truncated due to length]'
      : cvContent

    // Simplified prompt for batch processing
    const prompt1 = `
      Como assistente de recrutamento especializado, avalia este candidato para posições comerciais.
      
      Candidato: ${candidateInfo.name}
      Email: ${candidateInfo.email}
      Posição: ${candidateInfo.position}
      
      CV Content:
      ${truncatedCvContent}
      
      Avalia este candidato e retorna apenas um número de 0-10 com uma casa decimal (ex: 7.5).
    `

    const completion1 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "És um especialista em recrutamento para posições comerciais. Retornas apenas um número de 0-10."
        },
        {
          role: "user",
          content: prompt1
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    })

    const scoreResponse = completion1.choices[0]?.message?.content || '5.0'
    const scoreMatch = scoreResponse.match(/(\d+\.?\d*)/)
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0

    return {
      score: score,
      prompt1_response: scoreResponse,
      prompt2_response: 'Batch processing - strengths analysis skipped',
      prompt3_response: 'Batch processing - weaknesses analysis skipped',
      raw_content: `Score: ${score}/10`
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
