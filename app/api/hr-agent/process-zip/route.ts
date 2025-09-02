import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromURL } from '@/lib/pdf-utils'
import { extractPersonalInfoFromCV, preparePersonalInfoForDatabase } from '@/lib/hr-personal-info-extractor'
import { deleteBlobFile } from '@/lib/blob-cleanup'
import { updateZipStatus, getZipProcessId } from '../zip-status/route'
import OpenAI from 'openai'
import JSZip from 'jszip'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

// Track processing status to prevent duplicates
const processingZips = new Set<string>()

// Track processed ZIPs to prevent re-processing
const processedZips = new Set<string>()

// Clean up old processed ZIPs periodically (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  console.log('🧹 Cleaning up old processed ZIPs...')
  // Note: In a real implementation, you'd want to store this in a database
  // For now, we'll just log the cleanup
}, 60 * 60 * 1000) // Run every hour

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { zipBlobUrl, userId, accessToken } = body

    if (!accessToken || !zipBlobUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: accessToken, zipBlobUrl, and userId' },
        { status: 400 }
      )
    }

              // Prevent duplicate processing
     if (processingZips.has(zipBlobUrl)) {
       console.log('⚠️ ZIP already being processed:', zipBlobUrl)
       return NextResponse.json(
         { error: 'ZIP file is already being processed' },
         { status: 409 }
       )
     }

     processingZips.add(zipBlobUrl)
     console.log('🔒 Started processing ZIP:', zipBlobUrl)

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

     // Check if this ZIP has already been processed by looking in the database
     const { data: existingZipProcessing } = await supabase
       .from('hr_candidates')
       .select('id, notes')
       .eq('user_id', userId)
       .like('notes', `%Uploaded from ZIP file%`)
       .like('notes', `%${zipBlobUrl.split('/').pop()?.split('.')[0] || 'unknown'}%`)
       .limit(1)

     if (existingZipProcessing && existingZipProcessing.length > 0) {
       console.log('⚠️ ZIP already processed (found in database):', zipBlobUrl)
       processingZips.delete(zipBlobUrl) // Clean up processing flag
       return NextResponse.json(
         { error: 'ZIP file has already been processed' },
         { status: 409 }
       )
     }

     console.log('📦 Processing ZIP file:', zipBlobUrl)

    // Get process ID for status tracking
    const processId = getZipProcessId(zipBlobUrl)
    
    try {
      // Update status: extracting
      updateZipStatus(processId, {
        phase: 'extracting',
        currentFile: 'Downloading ZIP file...',
        currentIndex: 0,
        totalFiles: 1
      })

      // Download the ZIP file
      const zipResponse = await fetch(zipBlobUrl)
      if (!zipResponse.ok) {
        throw new Error('Failed to download ZIP file')
      }

      const zipBuffer = await zipResponse.arrayBuffer()
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(zipBuffer)

      console.log(`📦 ZIP contains ${Object.keys(zipContent.files).length} files`)

      // Debug: List all files in ZIP
      console.log('📦 All files in ZIP:')
      Object.entries(zipContent.files).forEach(([filename, file]) => {
        console.log(`  - ${filename} (dir: ${file.dir}, size: ${file._data.uncompressedSize})`)
      })
      
      // Debug: Show file filtering details
      console.log('🔍 File filtering details:')
      Object.entries(zipContent.files).forEach(([filename, file]) => {
        const isDir = file.dir
        const size = file._data.uncompressedSize
        const isHidden = filename.startsWith('.')
        const isMacOS = filename.includes('__MACOSX')
        const isWindows = filename.includes('Thumbs.db')
        const hasSupportedExt = ['.pdf', '.doc', '.docx', '.txt'].some(ext => filename.toLowerCase().endsWith(ext))
        const isLargeEnough = size > 1000
        
        console.log(`  - ${filename}: dir=${isDir}, size=${size}, hidden=${isHidden}, macos=${isMacOS}, windows=${isWindows}, supported=${hasSupportedExt}, large=${isLargeEnough}`)
      })

      // Count supported files (exclude very small files that might be metadata)
      const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt']
      const supportedFiles = Object.entries(zipContent.files).filter(([filename, file]) => 
        !file.dir && 
        file._data.uncompressedSize > 1000 && // Exclude files smaller than 1KB
        !filename.startsWith('.') && // Exclude hidden files
        !filename.includes('__MACOSX') && // Exclude macOS metadata
        !filename.includes('Thumbs.db') && // Exclude Windows metadata
        supportedExtensions.some(ext => filename.toLowerCase().endsWith(ext))
      )

      console.log(`📦 Found ${supportedFiles.length} supported CV files:`)
      supportedFiles.forEach(([filename, file]) => {
        console.log(`  - ${filename} (size: ${file._data.uncompressedSize} bytes)`)
      })
      
      // Debug: Show processing order
      console.log('🔄 Processing order:')
      supportedFiles.forEach(([filename, file], index) => {
        console.log(`  ${index + 1}. ${filename}`)
      })

      // Update status: starting processing
      updateZipStatus(processId, {
        phase: 'processing',
        currentFile: 'Initializing...',
        currentIndex: 0,
        totalFiles: supportedFiles.length
      })

      const results = []

      // Process each supported file in the ZIP
      for (let i = 0; i < supportedFiles.length; i++) {
        const [filename, file] = supportedFiles[i]

        // Update status with current file
        updateZipStatus(processId, {
          phase: 'processing',
          currentFile: filename,
          currentIndex: i + 1,
          totalFiles: supportedFiles.length
        })

        console.log(`📄 Processing file ${i + 1}/${supportedFiles.length}: ${filename}`)

        try {
          // Extract file content
          const fileBuffer = await file.async('nodebuffer')
          
          // Upload individual file to Vercel Blob
          const { put } = await import('@vercel/blob')
          const blob = await put(filename, fileBuffer, {
            access: 'public',
            addRandomSuffix: true
          })

          console.log(`✅ File uploaded to blob: ${blob.url}`)

                     // Create candidate record
           const candidateName = filename.replace(/\.[^/.]+$/, '') // Remove extension for candidate name
           
           // Generate a unique ZIP processing ID
           const zipProcessingId = zipBlobUrl.split('/').pop()?.split('.')[0] || 'unknown'
           
           // Check if candidate with same name and ZIP source already exists
           const { data: existingCandidate } = await supabase
             .from('hr_candidates')
             .select('id')
             .eq('user_id', userId)
             .eq('name', candidateName)
             .like('notes', `%ZIP-ID: ${zipProcessingId}%`)
             .single()

           if (existingCandidate) {
             console.log(`⚠️ Candidate already exists for ${filename}, skipping...`)
             // Clean up blob file
             await deleteBlobFile(blob.url)
             results.push({
               filename,
               success: false,
               error: 'Candidate already exists'
             })
             continue
           }
           
           const { data: candidate, error: candidateError } = await supabase
             .from('hr_candidates')
             .insert({
               user_id: userId,
               name: candidateName,
               email: '',
               phone: '',
               position: 'Unknown Position',
               cv_file_url: blob.url,
               status: 'pending',
               notes: `Uploaded from ZIP file: ${filename} (ZIP-ID: ${zipProcessingId})`,
               created_at: new Date().toISOString()
             })
             .select()
             .single()

          if (candidateError || !candidate) {
            console.error(`❌ Could not create candidate for file: ${filename}`, candidateError)
            // Clean up blob file
            await deleteBlobFile(blob.url)
            results.push({
              filename,
              success: false,
              error: 'Failed to create candidate record'
            })
            continue
          }

          console.log(`✅ Created candidate record for: ${filename} (ID: ${candidate.id})`)
          
          // Debug: Check for existing candidates with same name
          const { data: existingCandidates, error: checkError } = await supabase
            .from('hr_candidates')
            .select('id, name, created_at, notes')
            .eq('user_id', userId)
            .eq('name', candidateName)
            .order('created_at', { ascending: false })
          
          if (!checkError && existingCandidates) {
            console.log(`🔍 Found ${existingCandidates.length} candidates with name "${candidateName}":`)
            existingCandidates.forEach((c, index) => {
              console.log(`  ${index + 1}. ID: ${c.id}, Created: ${c.created_at}, Notes: ${c.notes}`)
            })
          }

          // Process the CV
          const cvText = await extractTextFromURL(blob.url)
          
          if (!cvText || cvText.length < 10) {
            console.error(`❌ Failed to extract text from: ${filename}`)
            results.push({
              filename,
              success: false,
              error: 'Failed to extract text from CV'
            })
            continue
          }

          // Extract personal information
          const personalInfo = await extractPersonalInfoFromCV(cvText)
          
          // Analyze CV with AI
          const analysis = await analyzeCVWithRecruitmentCriteria(cvText)
          
          const candidateScore = analysis.finalScore || 0
          console.log(`📊 ${filename} score: ${candidateScore}/10`)

          if (candidateScore > 5) {
            // Save candidate with analysis
            const personalInfoForDB = preparePersonalInfoForDatabase(personalInfo)
            
            const { error: updateError } = await supabase
              .from('hr_candidates')
              .update({
                status: 'evaluated',
                                 notes: `Processed from ZIP file. Score: ${candidateScore}/10. Extracted ${cvText.length} characters. (ZIP-ID: ${zipProcessingId})`,
                evaluation: analysis,
                overall_score: analysis.finalScore,
                form_data: {
                  extractedText: cvText.substring(0, 2000),
                  textLength: cvText.length,
                  parsedAt: new Date().toISOString(),
                  aiAnalysis: analysis,
                  personalInfo: personalInfo,
                  source: 'zip_import',
                  originalFilename: filename
                },
                ...personalInfoForDB
              })
              .eq('id', candidate.id)

            if (updateError) {
              console.error(`❌ Update error for ${filename}:`, updateError)
              results.push({
                filename,
                success: false,
                error: 'Failed to update candidate with analysis'
              })
            } else {
              console.log(`✅ Successfully processed: ${filename}`)
              results.push({
                filename,
                success: true,
                candidateId: candidate.id,
                candidateSaved: true,
                score: candidateScore,
                extractedText: cvText.substring(0, 500),
                textLength: cvText.length,
                personalInfo: personalInfo,
                aiAnalysis: analysis
              })
            }
          } else {
            // Delete low-scoring candidate
            console.log(`❌ Low score for ${filename}, removing candidate`)
            await supabase
              .from('hr_candidates')
              .delete()
              .eq('id', candidate.id)

            // Clean up blob file
            await deleteBlobFile(blob.url)

            results.push({
              filename,
              success: false,
              candidateSaved: false,
              error: 'Low AI score - candidate removed',
              score: candidateScore
            })
          }

        } catch (fileError) {
          console.error(`❌ Error processing file ${filename}:`, fileError)
          results.push({
            filename,
            success: false,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          })
        }
      }

      // Clean up the original ZIP file
      await deleteBlobFile(zipBlobUrl)

      const successfulCount = results.filter(r => r.success).length
      const failedCount = results.filter(r => !r.success).length

      console.log(`✅ ZIP processing completed: ${successfulCount} successful, ${failedCount} failed`)
      
      // Debug: Show all candidates created during this ZIP processing
      const zipProcessingId = zipBlobUrl.split('/').pop()?.split('.')[0] || 'unknown'
      const { data: allCandidates, error: summaryError } = await supabase
        .from('hr_candidates')
        .select('id, name, created_at, notes')
        .eq('user_id', userId)
        .like('notes', `%ZIP-ID: ${zipProcessingId}%`)
        .order('created_at', { ascending: false })
      
      if (!summaryError && allCandidates) {
        console.log(`📊 Summary: Found ${allCandidates.length} candidates from this ZIP processing (ZIP-ID: ${zipProcessingId}):`)
        allCandidates.forEach((c, index) => {
          console.log(`  ${index + 1}. ID: ${c.id}, Name: "${c.name}", Created: ${c.created_at}`)
        })
      }

      // Update final status
      updateZipStatus(processId, {
        phase: 'completed',
        currentFile: 'Processing completed',
        currentIndex: supportedFiles.length,
        totalFiles: supportedFiles.length,
        successful: successfulCount,
        failed: failedCount,
        results: {
          total: results.length,
          successful: successfulCount,
          failed: failedCount,
          details: results
        }
      })

      // Clean up processing flag and mark as processed
      processingZips.delete(zipBlobUrl)
      processedZips.add(zipBlobUrl)
      console.log('🔓 Finished processing ZIP:', zipBlobUrl)
      console.log('✅ Marked ZIP as processed:', zipBlobUrl)

      return NextResponse.json({
        success: true,
        message: `Processed ${successfulCount} CVs successfully, ${failedCount} failed`,
        results,
        summary: {
          total: results.length,
          successful: successfulCount,
          failed: failedCount
        }
      })

    } catch (error) {
      console.error('❌ ZIP processing error:', error)
      
      // Clean up processing flag
      processingZips.delete(zipBlobUrl)
      console.log('🔓 Error cleanup - removed ZIP from processing:', zipBlobUrl)
      
      // Update error status
      updateZipStatus(processId, {
        phase: 'error',
        currentFile: 'Processing failed',
        currentIndex: 0,
        totalFiles: 0
      })
      
      // Clean up the ZIP file on error
      await deleteBlobFile(zipBlobUrl)
      
      return NextResponse.json(
        { error: 'ZIP processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Process ZIP error:', error)
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
    
    // Analyze strengths
    const strengthsPrompt = `Pontos fortes:

Preciso que analises esta resposta "${cvText.substring(0, 4000)}" e o candidato em questao e me digas em 15 palavras os pontos fortes dele.

3 no máximo.

Output só os pontes fortes.`

    console.log('🤖 Analyzing strengths...')
    const strengthsCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized Portuguese recruitment assistant. Analyze CVs and provide strengths in Portuguese. Be concise and specific.'
        },
        {
          role: 'user',
          content: strengthsPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const strengthsResponse = strengthsCompletion.choices[0]?.message?.content || ''

    // Analyze concerns
    const concernsPrompt = `Pontos em ter em atenção:

Preciso que analises esta resposta "${cvText.substring(0, 4000)}" e o candidato em questao e me digas em 15 palavras os pontos a ter em atenção dele.

3 no máximo.

Output só os pontes a ter em atençao.`

    console.log('🤖 Analyzing concerns...')
    const concernsCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized Portuguese recruitment assistant. Analyze CVs and provide concerns in Portuguese. Be concise and specific.'
        },
        {
          role: 'user',
          content: concernsPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const concernsResponse = concernsCompletion.choices[0]?.message?.content || ''
    
    console.log('🤖 Strengths response:', strengthsResponse)
    console.log('🤖 Concerns response:', concernsResponse)
    
    // Calculate a simple score based on text length and content quality
    const textLength = cvText.length
    const hasEmail = cvText.toLowerCase().includes('@')
    const hasPhone = /\d{9,}/.test(cvText)
    const hasExperience = /experiência|experience|anos|years/i.test(cvText)
    const hasEducation = /formação|education|licenciatura|mestrado|bachelor|master/i.test(cvText)
    
    let score = 5.0 // Base score
    
    if (textLength > 500) score += 1
    if (textLength > 1000) score += 1
    if (hasEmail) score += 0.5
    if (hasPhone) score += 0.5
    if (hasExperience) score += 1
    if (hasEducation) score += 1
    
    // Round score to nearest 0.5 interval
    score = Math.round(score * 2) / 2
    score = Math.min(score, 10.0)
    score = Math.max(score, 1.0)

    // Extract structured data from CV
    const evaluationDetails = {
      experienceYears: extractExperienceYears(cvText),
      location: extractLocation(cvText),
      languages: extractLanguages(cvText),
      salesExperience: hasSalesExperience(cvText) ? 'Sim' : 'Não especificado',
      availability: extractAvailability(cvText)
    }

    const parsedStrengths = parseResponseToList(strengthsResponse)
    const parsedConcerns = parseResponseToList(concernsResponse)
    
    console.log('🧹 Parsed strengths:', parsedStrengths)
    console.log('🧹 Parsed concerns:', parsedConcerns)
    
    const analysis = {
      finalScore: score,
      strengths: parsedStrengths,
      concerns: parsedConcerns,
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
 * Parse AI response to list format
 * @param response - AI response text
 * @returns string[] - List of items
 */
function parseResponseToList(response: string): string[] {
  try {
    // Clean the response
    let cleaned = response.trim()
    
    // Remove common prefixes
    cleaned = cleaned.replace(/^(pontos fortes?|strengths?|pontos a ter em atenção|concerns?):?\s*/i, '')
    
    // Split by common delimiters
    const items = cleaned
      .split(/[•\-\*]\s*/)
      .map(item => item.trim())
      .filter(item => item.length > 0 && item.length < 100)
    
    // If no items found, try comma separation
    if (items.length === 0) {
      const commaItems = cleaned
        .split(/[,;]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length < 100)
      
      return commaItems.slice(0, 3)
    }
    
    return items.slice(0, 3)
  } catch (error) {
    console.error('❌ Error parsing response to list:', error)
    return ['Análise em progresso']
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
