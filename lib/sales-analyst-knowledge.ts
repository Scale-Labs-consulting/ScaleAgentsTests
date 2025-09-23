// Sales Analyst Knowledge Service
// Fetches knowledge files from blob storage based on call type

import { extractTextFromPDF, extractTextFromURL } from './pdf-utils'

export interface KnowledgeFile {
  name: string
  content: string
  callTypes: string[]
}

export interface CallTypeKnowledgeMapping {
  [callType: string]: string[]
}

/**
 * Cleans and normalizes extracted PDF text with aggressive cleaning for garbled text
 */
function cleanExtractedText(text: string): string {
  try {
    console.log(`🧹 Cleaning extracted text (${text.length} characters)`)
    
    let cleaned = text
    
    // First, try to fix the most common garbled patterns
    // Fix the specific pattern you showed: "● ● ● ● 2 PaMs mMp u r b o a e e o c o n x l"
    cleaned = cleaned
      // Remove bullet point artifacts
      .replace(/●\s*●\s*●\s*●/g, '')
      .replace(/●/g, '')
      
      // Fix the specific garbled pattern from your example
      .replace(/2\s+PaMs\s+mMp/g, '2 Páginas')
      .replace(/PaMs/g, 'Páginas')
      .replace(/mMp/g, '')
      
      // Fix spaced-out words (common PDF extraction issue)
      .replace(/u\s+r\s+b\s+o\s+a\s+e\s+e\s+o\s+c\s+o\s+n\s+x\s+l/g, 'urbano ocorrência')
      .replace(/r\s+m\s+e\s+h\s+r\s+ﬁ\s+c\s+i\s+d\s+s\s+m/g, 'reme hr ficidade')
      .replace(/o\s+a\s+a\s+o\s+s\s+a\s+d\s+r\s+o\s+n\s+v\s+i/g, 'oaa os ad ro nvi')
      .replace(/g\s+a\s+z\s+o\s+e\s+ç\s+n\s+e\s+a/g, 'gaz o e ç ne a')
      
      // Fix UTF-8 encoding issues
      .replace(/Ã¡/g, 'á')
      .replace(/Ã /g, 'à')
      .replace(/Ã¢/g, 'â')
      .replace(/Ã£/g, 'ã')
      .replace(/Ã¤/g, 'ä')
      .replace(/Ã©/g, 'é')
      .replace(/Ã¨/g, 'è')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã«/g, 'ë')
      .replace(/Ã­/g, 'í')
      .replace(/Ã¬/g, 'ì')
      .replace(/Ã®/g, 'î')
      .replace(/Ã¯/g, 'ï')
      .replace(/Ã³/g, 'ó')
      .replace(/Ã²/g, 'ò')
      .replace(/Ã´/g, 'ô')
      .replace(/Ãµ/g, 'õ')
      .replace(/Ã¶/g, 'ö')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã¹/g, 'ù')
      .replace(/Ã»/g, 'û')
      .replace(/Ã¼/g, 'ü')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã±/g, 'ñ')
      
      // Fix common PDF extraction artifacts
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/ﬀ/g, 'ff')
      .replace(/ﬃ/g, 'ffi')
      .replace(/ﬄ/g, 'ffl')
      
      // Remove excessive spacing between characters (common in garbled text)
      .replace(/([a-zA-Z])\s+([a-zA-Z])/g, '$1$2')
      .replace(/([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])/g, '$1$2$3')
      
      // Fix specific Portuguese words that commonly get garbled
      .replace(/\bv\s+e\s+n\s+d\s+a\s+s\b/g, 'vendas')
      .replace(/\bc\s+h\s+a\s+m\s+a\s+d\s+a\b/g, 'chamada')
      .replace(/\bt\s+e\s+l\s+e\s+f\s+ó\s+n\s+i\s+c\s+a\b/g, 'telefónica')
      .replace(/\bo\s+b\s+j\s+e\s+ç\s+õ\s+e\s+s\b/g, 'objeções')
      .replace(/\br\s+e\s+u\s+n\s+i\s+ã\s+o\b/g, 'reunião')
      .replace(/\bd\s+e\s+s\s+c\s+o\s+b\s+e\s+r\s+t\s+a\b/g, 'descoberta')
      .replace(/\bf\s+e\s+c\s+h\s+o\b/g, 'fecho')
      .replace(/\bf\s+e\s+c\s+h\s+a\s+m\s+e\s+n\s+t\s+o\b/g, 'fechamento')
      .replace(/\bi\s+n\s+t\s+r\s+o\s+d\s+u\s+ç\s+ã\s+o\b/g, 'introdução')
      .replace(/\bm\s+i\s+n\s+d\s+s\s+e\s+t\b/g, 'mindset')
      .replace(/\bf\s+u\s+n\s+d\s+a\s+m\s+e\s+n\s+t\s+o\s+s\b/g, 'fundamentos')
      .replace(/\bc\s+r\s+o\s+s\s+s\b/g, 'cross')
      .replace(/\bu\s+p\s+s\s+e\s+l\s+l\s+i\s+n\s+g\b/g, 'upselling')
      .replace(/\br\s+e\s+s\s+e\s+l\s+l\b/g, 'resell')
      .replace(/\bp\s+r\s+o\s+d\s+u\s+t\s+o\s+s\b/g, 'produtos')
      
      // Remove or fix garbled characters that don't make sense
      .replace(/[^\w\s\.,;:!?\-\(\)\[\]\"\'\/\@\#\$\%\&\*\+\=\<\>\|\~\`áàâãäéèêëíìîïóòôõöúùûüçñ]/g, ' ')
      
      // Fix spacing issues
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .replace(/\s+([.,;:!?])/g, '$1') // Remove spaces before punctuation
      .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2') // Add space after punctuation
      
      // Final cleanup
      .replace(/\s+/g, ' ') // Final space cleanup
      .trim()
    
    // If the text is still heavily garbled (lots of single characters), try a more aggressive approach
    if (cleaned.length > 0 && (cleaned.match(/\b[a-zA-Z]\b/g) || []).length > cleaned.length * 0.3) {
      console.log(`⚠️ Text appears heavily garbled, applying aggressive cleaning`)
      
      // Try to reconstruct words from single characters
      cleaned = cleaned
        // Remove single character "words" that are likely artifacts
        .replace(/\b[a-zA-Z]\b/g, '')
        // Clean up resulting spacing
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    console.log(`✅ Text cleaning completed: ${cleaned.length} characters`)
    console.log(`📄 Cleaned preview: ${cleaned.substring(0, 200)}...`)
    
    return cleaned
    
  } catch (error) {
    console.error(`❌ Text cleaning error:`, error)
    return text // Return original text if cleaning fails
  }
}

// Mapping of call types to their corresponding knowledge file patterns
// These patterns will be used to match against actual files in blob storage
const CALL_TYPE_KNOWLEDGE_PATTERNS: CallTypeKnowledgeMapping = {
  'Chamada Fria': [
    'Vendas por chamada telefónica',
    'Objeções (chamada telefónica)',
    'Objeções mais Comuns (Chamada telefónica)',
    'Introdução às vendas',
    'Mindset'
  ],
  'Chamada de Agendamento': [
    'Vendas por chamada telefónica',
    'Objeções (chamada telefónica)',
    'Objeções mais Comuns (Chamada telefónica)',
    'Introdução às vendas'
  ],
  'Reunião de Descoberta': [
    'Base R2',
    'Base R3',
    'Introdução às vendas',
    'Mindset'
  ],
  'Reunião de Fecho': [
    'O Fecho de um negócio',
    'Objeções (Videochamada)',
    'Objeções mais Comuns (Videochamada)',
    'Fundamentos de Cross Selling e Upselling',
    'Fundamentos do Resell Produtos'
  ],
  'Reunião de Esclarecimento de Dúvidas': [
    'Objeções (Videochamada)',
    'Objeções mais Comuns (Videochamada)',
    'Base R2',
    'Base R3'
  ],
  'Reunião de One Call Close': [
    'O Fecho de um negócio',
    'Vendas por chamada telefónica',
    'Objeções (Videochamada)',
    'Objeções mais Comuns (Videochamada)',
    'Fundamentos de Cross Selling e Upselling'
  ]
}

/**
 * Fetches knowledge content for a specific call type
 */
/**
 * Discovers all available files in the SalesAnalystKnowledge folder
 */
async function discoverAvailableFiles(): Promise<string[]> {
  try {
    console.log(`🔍 Discovering available knowledge files...`)
    
    const storeId = 'yjq0uw1vlhs3s48i' // STATIC_ASSETS_BLOB_TOKEN store
    const baseUrl = `https://${storeId}.public.blob.vercel-storage.com`
    const folderUrl = `${baseUrl}/SalesAnalystKnowledge/`
    
    // List of possible file extensions to try
    const extensions = ['.pdf', '.txt', '.docx', '.doc', '.md']
    
    // Comprehensive list of possible knowledge file patterns
    const commonPatterns = [
      // Known existing files
      'Vendas por chamada telefónica',
      'Objeções (chamada telefónica)',
      'Objeções mais Comuns (Chamada telefónica)',
      'Introdução às vendas',
      'Mindset',
      'Base R2',
      'Base R3',
      'O Fecho de um negócio',
      'Objeções (Videochamada)',
      'Objeções mais Comuns (Videochamada)',
      'Fundamentos de Cross Selling e Upselling',
      'Fundamentos do Resell Produtos',
      
      // Missing files variations
      'Fundamentos R1',
      'R1',
      'Base R1',
      'Estrutura e preparação para reuniões',
      'Estrutura e preparação',
      'Preparação para reuniões',
      'Preparação reuniões',
      'Estrutura reuniões',
      'Preparação',
      'Estrutura',
      
      // Additional common patterns
      'Chamadas de agendamento',
      'Agendamento de reuniões',
      'Descoberta de necessidades',
      'Reunião de descoberta',
      'Fechamento de vendas',
      'Técnicas de fechamento',
      'Cross selling',
      'Upselling',
      'Resell',
      'Vendas consultivas',
      'Processo de vendas',
      'Metodologia de vendas',
      'Scripts de vendas',
      'Argumentos de vendas',
      
      // Numbered variations
      'R1', 'R2', 'R3', 'R4', 'R5',
      'Base R1', 'Base R4', 'Base R5',
      'Fundamentos R2', 'Fundamentos R3', 'Fundamentos R4',
      
      // Single word patterns
      'Reuniões',
      'Agendamento',
      'Descoberta',
      'Fechamento',
      'Técnicas',
      'Scripts',
      'Argumentos',
      'Metodologia',
      'Processo',
      'Vendas',
      'Cross',
      'Upselling',
      'Resell'
    ]
    
    const availableFiles: string[] = []
    
    // Test each pattern with each extension
    for (const pattern of commonPatterns) {
      for (const extension of extensions) {
        const fileName = `${pattern}${extension}`
        const encodedFileName = encodeURIComponent(fileName)
        const fileUrl = `${folderUrl}${encodedFileName}`
        
        try {
          const response = await fetch(fileUrl, {
            method: 'HEAD',
            headers: {
              'Accept': 'application/pdf, text/plain, application/octet-stream, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
          })
          
          if (response.ok) {
            availableFiles.push(fileName)
            console.log(`   ✅ Found: ${fileName}`)
            break // Found the file, no need to try other extensions for this pattern
          }
        } catch (error) {
          // File doesn't exist, continue to next extension
        }
      }
    }
    
    console.log(`📊 Total available files discovered: ${availableFiles.length}`)
    return availableFiles
    
  } catch (error) {
    console.error(`❌ Error discovering files:`, error)
    return []
  }
}

/**
 * Matches available files against call type patterns
 */
function matchFilesToCallType(availableFiles: string[], callType: string): string[] {
  const patterns = CALL_TYPE_KNOWLEDGE_PATTERNS[callType] || []
  const matchedFiles: string[] = []
  
  for (const pattern of patterns) {
    // Find files that match this pattern (case-insensitive, partial match)
    const matchingFiles = availableFiles.filter(file => {
      const fileNameWithoutExt = file.replace(/\.[^/.]+$/, '') // Remove extension
      return fileNameWithoutExt.toLowerCase().includes(pattern.toLowerCase())
    })
    
    matchedFiles.push(...matchingFiles)
  }
  
  // Remove duplicates
  return [...new Set(matchedFiles)]
}

export async function getKnowledgeForCallType(callType: string): Promise<string> {
  try {
    console.log(`\n🧠 ===== FETCHING KNOWLEDGE FOR ${callType.toUpperCase()} =====`)
    
    // First, discover all available files
    const availableFiles = await discoverAvailableFiles()
    
    if (availableFiles.length === 0) {
      console.log(`⚠️ No knowledge files found in blob storage`)
      return ''
    }
    
    // Match files to the call type
    const matchedFiles = matchFilesToCallType(availableFiles, callType)
    
    if (matchedFiles.length === 0) {
      console.log(`⚠️ No knowledge files matched for call type: ${callType}`)
      console.log(`📋 Available files:`, availableFiles)
      console.log(`📋 Patterns for ${callType}:`, CALL_TYPE_KNOWLEDGE_PATTERNS[callType] || [])
      return ''
    }
    
    console.log(`📋 Matched files for ${callType}:`, matchedFiles)
    
    // Fetch all matched files in parallel
    const fetchPromises = matchedFiles.map(fileName => fetchKnowledgeFile(fileName))
    const results = await Promise.all(fetchPromises)
    
    // Combine all knowledge content
    const combinedKnowledge = results
      .filter(content => content.trim().length > 0)
      .join('\n\n---\n\n')
    
    console.log(`✅ Knowledge fetched for ${callType}: ${combinedKnowledge.length} characters from ${matchedFiles.length} files`)
    console.log(`🧠 ===== KNOWLEDGE FETCHING END =====\n`)
    
    return combinedKnowledge
    
  } catch (error) {
    console.error(`❌ Error fetching knowledge for ${callType}:`, error)
    return ''
  }
}

/**
 * Fetches a single knowledge file from blob storage
 */
async function fetchKnowledgeFile(fileName: string): Promise<string> {
  try {
    // Use the STATIC_ASSETS_BLOB_TOKEN blob store
    const storeId = 'yjq0uw1vlhs3s48i' // This should be the store ID for STATIC_ASSETS_BLOB_TOKEN
    const encodedFileName = encodeURIComponent(fileName)
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/SalesAnalystKnowledge/${encodedFileName}`
    
    console.log(`📥 Fetching knowledge file: ${fileName}`)
    console.log(`🔗 URL: ${blobUrl}`)
    console.log(`🏪 Using STATIC_ASSETS_BLOB_TOKEN store`)
    
    // Check if it's a PDF file
    if (fileName.toLowerCase().endsWith('.pdf')) {
      console.log(`📄 PDF file detected: ${fileName} - trying Python backend first`)
      
      try {
        // Try Python backend (Railway/production URL)
        const pythonServiceUrl = process.env.PYTHON_PDF_SERVICE_URL || 'http://localhost:5000'
        console.log(`🐍 Trying Python PDF parser at ${pythonServiceUrl} for ${fileName}`)
        
        const pythonResponse = await fetch(`${pythonServiceUrl}/extract-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: blobUrl
          })
        })

        if (pythonResponse.ok) {
          const pythonResult = await pythonResponse.json()
          if (pythonResult.success && pythonResult.text && pythonResult.text.trim().length > 0) {
            console.log(`✅ Python extraction successful: ${pythonResult.text.length} characters using ${pythonResult.extraction_method}`)
            console.log(`📄 Text preview: ${pythonResult.text.substring(0, 200)}...`)
            return pythonResult.text
          } else {
            console.warn(`⚠️ Python extraction returned no text for ${fileName}`)
          }
        } else {
          console.warn(`⚠️ Python backend not available (${pythonResponse.status}): ${pythonResponse.statusText}`)
        }
      } catch (pythonError) {
        console.log(`⚠️ Python backend failed for ${fileName}:`, pythonError instanceof Error ? pythonError.message : 'Unknown error')
      }
      
      // Fallback to Scale Expert's method if Python backend fails
      try {
        console.log(`🔄 Trying Scale Expert's extractTextFromURL fallback for ${fileName}`)
        const extractedText = await extractTextFromURL(blobUrl)
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log(`✅ Scale Expert extraction successful: ${extractedText.length} characters`)
          console.log(`📄 Text preview: ${extractedText.substring(0, 200)}...`)
          return extractedText
        } else {
          console.warn(`⚠️ Scale Expert extraction returned no text for ${fileName}`)
        }
      } catch (scaleExpertError) {
        console.log(`⚠️ Scale Expert extraction failed for ${fileName}:`, scaleExpertError instanceof Error ? scaleExpertError.message : 'Unknown error')
      }
      
      // Final fallback to direct fetch + pdf-parse
      try {
        console.log(`🔄 Trying direct fetch + pdf-parse final fallback for ${fileName}`)
        const response = await fetch(blobUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf, text/plain, application/octet-stream'
          }
        })

        if (!response.ok) {
          console.warn(`⚠️ Failed to fetch ${fileName}: ${response.status} ${response.statusText}`)
          return ''
        }

        // Get the PDF buffer
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Try pdf-parse
        let extractedText = ''
        let extractionMethod = 'none'
        
        try {
          console.log(`🔍 Trying pdf-parse extraction for ${fileName}`)
          const pdfParse = await import('pdf-parse')
          const pdfData = await pdfParse.default(buffer)
          
          if (pdfData.text && pdfData.text.trim().length > 0) {
            extractedText = cleanExtractedText(pdfData.text)
            extractionMethod = 'pdf-parse'
            console.log(`✅ pdf-parse successful: ${extractedText.length} characters, ${pdfData.numpages} pages`)
          }
        } catch (pdfParseError) {
          console.log(`⚠️ pdf-parse failed for ${fileName}:`, pdfParseError instanceof Error ? pdfParseError.message : 'Unknown error')
        }
        
        // Fallback to pdf2json if pdf-parse failed or returned no text
        if (!extractedText || extractedText.length === 0) {
          try {
            console.log(`🔄 Trying pdf2json fallback for ${fileName}`)
            const pdfData = await extractTextFromPDF(buffer)
            
            if (pdfData.text && pdfData.text.trim().length > 0) {
              extractedText = cleanExtractedText(pdfData.text)
              extractionMethod = 'pdf2json'
              console.log(`✅ pdf2json fallback successful: ${extractedText.length} characters, ${pdfData.numpages} pages`)
            }
          } catch (pdf2jsonError) {
            console.error(`❌ pdf2json fallback also failed:`, pdf2jsonError)
          }
        }
        
        if (!extractedText || extractedText.length === 0) {
          console.warn(`⚠️ No text content extracted from PDF: ${fileName}`)
          return `[PDF Content: ${fileName} - Text extraction yielded no results. This might be an image-based PDF.]`
        }
        
        console.log(`✅ Successfully extracted text from PDF ${fileName} using ${extractionMethod} (${extractedText.length} characters)`)
        console.log(`📄 Text preview: ${extractedText.substring(0, 200)}...`)
        
        return extractedText
        
      } catch (error) {
        console.error(`❌ PDF text extraction failed for ${fileName}:`, error)
        return `[PDF Content: ${fileName} - Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`
      }
    } else {
      // Handle text/markdown files
      const response = await fetch(blobUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, text/plain, application/octet-stream'
        }
      })

      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch ${fileName}: ${response.status} ${response.statusText}`)
        return ''
      }

      const content = await response.text()
      
      if (!content || content.trim().length === 0) {
        console.warn(`⚠️ Empty content in ${fileName}`)
        return ''
      }

      console.log(`✅ Successfully fetched ${fileName} (${content.length} characters)`)
      return content
    }

  } catch (error) {
    console.error(`❌ Error fetching knowledge file ${fileName}:`, error)
    return ''
  }
}

/**
 * Gets all available call types that have knowledge patterns
 */
export function getAvailableCallTypes(): string[] {
  return Object.keys(CALL_TYPE_KNOWLEDGE_PATTERNS)
}

/**
 * Gets knowledge patterns for a specific call type
 */
export function getKnowledgePatternsForCallType(callType: string): string[] {
  return CALL_TYPE_KNOWLEDGE_PATTERNS[callType] || []
}

/**
 * Checks if a call type has knowledge patterns available
 */
export function hasKnowledgeForCallType(callType: string): boolean {
  const patterns = CALL_TYPE_KNOWLEDGE_PATTERNS[callType]
  return patterns && patterns.length > 0
}
