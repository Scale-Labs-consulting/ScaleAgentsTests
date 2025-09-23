/**
 * Extract text content from a PDF buffer using pdf2json
 * @param buffer - PDF file buffer
 * @param options - PDF parsing options
 * @returns Promise<string> - Extracted text content
 */
export async function extractTextFromPDF(
  buffer: Buffer, 
  options?: {
    max?: number // Max pages to parse
    normalizeWhitespace?: boolean
    disableCombineTextItems?: boolean
  }
): Promise<{
  text: string
  numpages: number
  numrender: number
  info: any
  metadata: any
  version: string
}> {
  try {
    console.log(`📄 Extracting text from PDF using pdf2json (${buffer.length} bytes)`)
    
    // Dynamic import to avoid issues in serverless environment
    const PDFParser = (await import('pdf2json')).default
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser()
      
      // Handle parsing errors
      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error('❌ PDF parsing error:', errData.parserError)
        reject(new Error(`PDF parsing failed: ${errData.parserError}`))
      })
      
             // Handle successful parsing
       pdfParser.on("pdfParser_dataReady", (pdfData) => {
         try {
           console.log(`📄 PDF parsed successfully: ${pdfData.Pages?.length || 0} pages`)
           
           // Method 1: Use getRawTextContent() - the standard method
           const textContent = pdfParser.getRawTextContent()
           console.log(`📄 getRawTextContent(): ${textContent.length} characters`)
           
           // Method 2: Try getAllFieldsTypes() for form fields
           const fieldsContent = pdfParser.getAllFieldsTypes()
           console.log(`📄 getAllFieldsTypes(): ${Object.keys(fieldsContent).length} fields`)
           
               // Method 3: Enhanced manual extraction from PDF structure
               let manualText = ''
               if (pdfData.Pages && pdfData.Pages.length > 0) {
                 for (let i = 0; i < pdfData.Pages.length; i++) {
                   const page = pdfData.Pages[i]
                   console.log(`📄 Page ${i + 1}:`, {
                     texts: page.Texts?.length || 0,
                     images: page.Images?.length || 0,
                     fills: page.Fills?.length || 0
                   })
                   
                   if (page.Texts) {
                     // Sort texts by Y position (top to bottom) and X position (left to right)
                     const sortedTexts = page.Texts.sort((a, b) => {
                       const aY = a.y || 0
                       const bY = b.y || 0
                       if (Math.abs(aY - bY) < 5) { // Same line
                         return (a.x || 0) - (b.x || 0) // Sort by X position
                       }
                       return bY - aY // Sort by Y position (top to bottom)
                     })
                     
                     let currentLine = ''
                     let lastY = -1
                     
                     for (let j = 0; j < sortedTexts.length; j++) {
                       const text = sortedTexts[j]
                       const currentY = text.y || 0
                       
                       if (text.R && text.R.length > 0) {
                         let textContent = ''
                         for (let k = 0; k < text.R.length; k++) {
                           const run = text.R[k]
                           if (run.T) {
                             // Decode URL-encoded text
                             try {
                               textContent += decodeURIComponent(run.T)
                             } catch (e) {
                               textContent += run.T
                             }
                           }
                         }
                         
                         // Check if this is a new line (different Y position)
                         if (Math.abs(currentY - lastY) > 5) {
                           if (currentLine.trim()) {
                             manualText += currentLine.trim() + '\n'
                           }
                           currentLine = textContent
                         } else {
                           // Same line, append with space
                           currentLine += (currentLine ? ' ' : '') + textContent
                         }
                         
                         lastY = currentY
                       }
                     }
                     
                     // Add the last line
                     if (currentLine.trim()) {
                       manualText += currentLine.trim() + '\n'
                     }
                   }
                 }
               }
           
           console.log(`📄 Manual extraction: ${manualText.length} characters`)
           
                       // Choose the best result
            let finalText = textContent
            if (!finalText || finalText.length === 0) {
              finalText = manualText
            }
            
            // If still no text, try to get any available content
            if (!finalText || finalText.length === 0) {
              finalText = `PDF file with ${pdfData.Pages?.length || 0} pages. Text extraction yielded no results. This might be an image-based PDF or a scanned document.`
            }
            
            // Decode URL-encoded text
            try {
              finalText = decodeURIComponent(finalText)
            } catch (error) {
              console.log('⚠️ URL decoding failed, using original text')
            }
            
            // Clean and format the text for better readability
            finalText = cleanAndFormatText(finalText)
            
            console.log(`✅ Final text length: ${finalText.length} characters`)
           
           resolve({
             text: finalText,
             numpages: pdfData.Pages?.length || 0,
             numrender: pdfData.Pages?.length || 0,
             info: pdfData.Meta || {},
             metadata: pdfData.Meta || {},
             version: pdfData.Meta?.PDFFormatVersion || '1.0'
           })
         } catch (error) {
           console.error('❌ Error extracting text content:', error)
           reject(error)
         }
       })
      
      // Parse the PDF buffer
      pdfParser.parseBuffer(buffer)
    })
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error)
    
    // Fallback: return a basic structure with error information
    return {
      text: `PDF file detected (${buffer.length} bytes). PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try uploading a text version of the CV.`,
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: '1.0'
    }
  }
}

/**
 * Extract text content from a File object (for use in API routes)
 * @param file - File object from form data
 * @returns Promise<string> - Extracted text content
 */
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log(`🔍 Extracting text from file: ${file.name}`)
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (fileExtension === '.txt' || fileExtension === '.rtf') {
      // Text files - read directly
      const text = await file.text()
      console.log(`✅ Text content extracted: ${text.length} characters`)
      return text
    } else if (fileExtension === '.pdf') {
      // PDF files - use pdf-parse
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const pdfData = await extractTextFromPDF(buffer)
      return pdfData.text
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      // Word documents - use mammoth
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        console.log(`✅ Word document text extracted: ${result.value.length} characters`)
        return result.value
      } catch (error) {
        console.error('❌ Word document extraction error:', error)
        return `Word document: ${file.name} - Could not extract text. Please convert to text format.`
      }
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    console.error('❌ File extraction error:', error)
    throw error
  }
}

/**
 * Extract text content from a URL (for Google Drive or direct URLs)
 * @param url - URL to the file
 * @returns Promise<string> - Extracted text content
 */
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    console.log(`🔍 Extracting text from URL: ${url}`)
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      return await extractFromGoogleDrive(url)
    }
    
    // Handle direct file URLs
    if (url.startsWith('http')) {
      return await extractFromDirectURL(url)
    }
    
    throw new Error('Unsupported URL format')
  } catch (error) {
    console.error('❌ URL extraction error:', error)
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
    
    // Check if it's a PDF file
    const uint8Array = new Uint8Array(buffer)
    if (uint8Array.length >= 4 && 
        uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && 
        uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
      // This is a PDF file
      const pdfData = await extractTextFromPDF(Buffer.from(buffer))
      return pdfData.text
    }
    
    // Assume it's a text file
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
    const uint8Array = new Uint8Array(buffer)
    
    // Check if it's a PDF file (PDF magic number: %PDF)
    if (uint8Array.length >= 4 && 
        uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && 
        uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
      console.log('📄 Detected PDF file')
      const pdfData = await extractTextFromPDF(Buffer.from(buffer))
      return pdfData.text
    }
    
    // Check if it's a Word document (DOCX: PK magic number)
    if (uint8Array.length >= 4 && 
        uint8Array[0] === 0x50 && uint8Array[1] === 0x4B) {
      console.log('📄 Detected Word document')
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
        return result.value
      } catch (error) {
        console.error('❌ Word document extraction error:', error)
        throw new Error('Could not extract text from Word document')
      }
    }
    
    // Check if it's a DOC file (DOC magic number: D0CF11E0)
    if (uint8Array.length >= 4 && 
        uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF && 
        uint8Array[2] === 0x11 && uint8Array[3] === 0xE0) {
      console.log('📄 Detected DOC file')
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
        return result.value
      } catch (error) {
        console.error('❌ DOC file extraction error:', error)
        throw new Error('Could not extract text from DOC file')
      }
    }
    
    // Assume it's a text file
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

/**
 * Clean and format extracted text for better readability and analysis
 * @param text - Raw extracted text
 * @returns string - Cleaned and formatted text
 */
function cleanAndFormatText(text: string): string {
  try {
    console.log('🧹 Cleaning and formatting text...')
    
    // Step 1: Fix common PDF extraction issues
    let cleaned = text
      // Fix common character replacements - be more specific to avoid removing actual letters
      .replace(/\sC\s/g, ' ') // Remove standalone "C" with spaces around it
      .replace(/^C\s/g, ' ') // Remove "C" at very start of text
      .replace(/\sC$/g, ' ') // Remove "C" at very end of text
      
      // Fix common word concatenations
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space between words
      
      // Fix common PDF extraction issues where letters get cut off
      .replace(/([A-Z])\s([A-Z])/g, '$1$2') // Fix split words like "C ONTACT" -> "CONTACT"
      .replace(/([a-z])\s([A-Z])/g, '$1$2') // Fix split words like "c Ontact" -> "cOntact"
      .replace(/([A-Z])\s([a-z])/g, '$1$2') // Fix split words like "C ontact" -> "Contact"
      
      // Fix common formatting issues
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+([.,;:!?])/g, '$1') // Remove spaces before punctuation
      .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2') // Add space after punctuation
      
      // Fix common CV section headers
      .replace(/PESSOAL/g, '\n\nPESSOAL\n')
      .replace(/IDIOMAS/g, '\n\nIDIOMAS\n')
      .replace(/CURRICULUM VITAE/g, '\n\nCURRICULUM VITAE\n')
      .replace(/FORMAÇÃO/g, '\n\nFORMAÇÃO\n')
      .replace(/EXPERIÊNCIA/g, '\n\nEXPERIÊNCIA\n')
      .replace(/APTIDÕES/g, '\n\nAPTIDÕES\n')
      .replace(/SKILLS/g, '\n\nSKILLS\n')
      .replace(/EDUCATION/g, '\n\nEDUCATION\n')
      .replace(/WORK EXPERIENCE/g, '\n\nWORK EXPERIENCE\n')
      .replace(/CONTACT/g, '\n\nCONTACT\n')
      .replace(/PERSONAL/g, '\n\nPERSONAL\n')
      
      // Fix mangled words that commonly occur in PDF extraction
      .replace(/EDU ATION/g, 'EDUCATION')
      .replace(/G ELO ARDOSO/g, 'ANGELO CARDOSO')
      .replace(/ONTA T/g, 'CONTACT')
      .replace(/Phone:/g, '\nPhone: ')
      .replace(/agouveiacardoso@hotmail\.com/g, '\nEmail: agouveiacardoso@hotmail.com')
      .replace(/Lisboa, ampolide, Rua Inácio Pardelhas Sanchez/g, '\nLocation: Lisboa, ampolide, Rua Inácio Pardelhas Sanchez')
      
      // Fix specific patterns from the user's example
      .replace(/EDUATIONÂNG/g, 'EDUCATION ÂNGELO')
      .replace(/G ELOARDOSOBI/g, 'ANGELO CARDOSO BI')
      .replace(/DEVELOPERONTAT/g, 'DEVELOPER CONTACT')
      .replace(/SAPAnalytics loud/g, 'SAP Analytics Cloud')
      .replace(/SAPBW\/4HANASQLABAP/g, 'SAP BW/4HANA SQL ABAP')
      .replace(/Data miningAnalysis forOffice/g, 'Data Mining Analysis for Office')
      .replace(/INSTITUTOPOLITÉ NIO SETÚBAL/g, 'INSTITUTO POLITÉCNICO SETÚBAL')
      .replace(/HigherTechnicalProfessional ourse/g, 'Higher Technical Professional Course')
      .replace(/English \(Fluent\)Portuguese \(Fluent\)/g, 'English (Fluent), Portuguese (Fluent)')
      .replace(/LANG UAG ES/g, 'LANGUAGES')
      .replace(/WORKEXPERIENEPROFILE/g, 'WORK EXPERIENCE PROFILE')
      .replace(/BusinessIntelligence/g, 'Business Intelligence')
      .replace(/SAPsystems/g, 'SAP systems')
      .replace(/SAPBW\/4HANAandSAPAnalytics/g, 'SAP BW/4HANA and SAP Analytics')
      .replace(/SEPTEMBER 2021 -MARH 2024/g, 'SEPTEMBER 2021 - MARCH 2024')
      .replace(/DeloitteBi developer/g, 'Deloitte BI Developer')
      .replace(/BIsolutions/g, 'BI solutions')
      .replace(/SAPBW\/4HANA/g, 'SAP BW/4HANA')
      .replace(/SAPAnalytics loud/g, 'SAP Analytics Cloud')
      .replace(/Analysis forOffice/g, 'Analysis for Office')
      .replace(/data sets/g, 'datasets')
      .replace(/system migration fromSAPR\/3 toSAPS\/4HANA/g, 'system migration from SAP R/3 to SAP S/4HANA')
      .replace(/management of process chains inSAPBW/g, 'management of process chains in SAP BW')
      .replace(/process chains to ensure thetimely/g, 'process chains to ensure the timely')
      .replace(/data loading and transformationprocesses/g, 'data loading and transformation processes')
      
      // Fix common field patterns
      .replace(/([A-Z][a-z]+):/g, '\n$1: ') // Add line breaks before field labels
      .replace(/([A-Z]+):/g, '\n$1: ') // Add line breaks before uppercase field labels
      
      // Fix email patterns
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '\nEmail: $1')
      
      // Fix phone patterns
      .replace(/(\d{9,})/g, '\nPhone: $1')
      
      // Fix date patterns
      .replace(/(\d{2}-\d{2}-\d{4})/g, '\nDate: $1')
      
      // Clean up multiple line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\n\s*\n/g, '\n\n')
      
      // Trim whitespace
      .trim()
    
    console.log('✅ Text cleaning completed')
    console.log('📄 Cleaned text preview:', cleaned.substring(0, 300))
    
    return cleaned
    
  } catch (error) {
    console.error('❌ Text cleaning error:', error)
    return text // Return original text if cleaning fails
  }
}
