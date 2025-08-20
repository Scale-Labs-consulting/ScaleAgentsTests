/**
 * Extract text content from a PDF buffer
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
    console.log(`📄 Extracting text from PDF (${buffer.length} bytes)`)
    
    // For now, return a placeholder message
    // This will be replaced with actual PDF parsing functionality
    const pdfData = {
      text: `PDF file detected (${buffer.length} bytes). PDF text extraction is currently being updated for better serverless compatibility. Please convert to text format for now.`,
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: '1.0'
    }
    
    console.log(`✅ PDF placeholder created: ${pdfData.text.length} characters`)
    
    return pdfData
  } catch (error) {
    console.error('❌ PDF extraction error:', error)
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      // Word documents - for now, return a placeholder
      return `Word document: ${file.name} - Content extraction not implemented for Word documents yet. Please convert to text format.`
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
