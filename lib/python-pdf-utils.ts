import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { existsSync } from 'fs'
import os from 'os'

/**
 * Clean up temporary file silently
 */
async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await fs.unlink(filePath)
    }
  } catch (error) {
    // Silently ignore cleanup errors - they're not critical
  }
}

/**
 * Clean up old temporary files (older than 1 hour)
 */
export async function cleanupOldTempFiles(): Promise<void> {
  try {
    const tempDir = os.tmpdir()
    if (!existsSync(tempDir)) return

    const files = await fs.readdir(tempDir)
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    for (const file of files) {
      if (file.startsWith('temp_') && file.endsWith('.pdf')) {
        const filePath = path.join(tempDir, file)
        try {
          const stats = await fs.stat(filePath)
          if (now - stats.mtime.getTime() > oneHour) {
            await fs.unlink(filePath)
          }
        } catch (error) {
          // Silently ignore cleanup errors
        }
      }
    }
  } catch (error) {
    // Silently ignore cleanup errors
  }
}

/**
 * Extract text from PDF using Python PyMuPDF
 * This provides superior text extraction compared to JavaScript libraries
 */
export async function extractTextFromPDFWithPython(
  buffer: Buffer,
  options?: {
    max?: number
    normalizeWhitespace?: boolean
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
    console.log(`🐍 Extracting text from PDF using Python PyMuPDF (${buffer.length} bytes)`)
    
    // Clean up old temp files periodically
    await cleanupOldTempFiles()
    
    // Use system temporary directory (works in Vercel serverless environment)
    const tempDir = os.tmpdir()
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`)
    await fs.writeFile(tempPdfPath, buffer)
    
    try {
      // Call Python script
      const pythonScript = path.join(process.cwd(), 'scripts', 'pdf_parser.py')
      const maxPages = options?.max || undefined
      
      const args = [pythonScript, tempPdfPath]
      if (maxPages) {
        args.push('--max-pages', maxPages.toString())
      }
      
      console.log(`🐍 Running Python PDF parser: python ${args.join(' ')}`)
      
      const result = await new Promise<{
        success: boolean
        text: string
        num_pages: number
        pages_processed: number
        method: string
        error?: string
        file_size: number
      }>((resolve, reject) => {
        const python = spawn('python', args, {
          stdio: ['pipe', 'pipe', 'pipe']
        })
        
        let stdout = ''
        let stderr = ''
        
        python.stdout.on('data', (data) => {
          stdout += data.toString()
        })
        
        python.stderr.on('data', (data) => {
          stderr += data.toString()
        })
        
        python.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout)
              resolve(result)
            } catch (parseError) {
              reject(new Error(`Failed to parse Python output: ${parseError}`))
            }
          } else {
            reject(new Error(`Python script failed with code ${code}: ${stderr}`))
          }
        })
        
        python.on('error', (error) => {
          reject(new Error(`Python execution error: ${error.message}`))
        })
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Python PDF extraction failed')
      }
      
      // Clean up temporary file silently
      await cleanupTempFile(tempPdfPath)
      
      let cleanedText = result.text
      if (options?.normalizeWhitespace !== false) {
        cleanedText = cleanAndFormatText(result.text)
      }
      
      console.log(`✅ Python PyMuPDF extraction successful: ${cleanedText.length} characters, ${result.pages_processed} pages processed`)
      
      return {
        text: cleanedText,
        numpages: result.num_pages,
        numrender: result.pages_processed,
        info: {
          file_size: result.file_size,
          method: result.method
        },
        metadata: {},
        version: 'Python PyMuPDF'
      }
      
    } finally {
      // Clean up temporary file silently
      await cleanupTempFile(tempPdfPath)
    }
    
  } catch (error) {
    console.error('❌ Python PDF extraction error:', error)
    
    return {
      text: `PDF file detected (${buffer.length} bytes). Python PyMuPDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure Python and PyMuPDF are installed.`,
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: 'Python PyMuPDF - Error'
    }
  }
}

/**
 * Clean and format extracted text
 */
function cleanAndFormatText(text: string): string {
  if (!text) return ''
  
  // Remove excessive whitespace
  let cleaned = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim()
  
  // Remove common PDF artifacts
  cleaned = cleaned
    .replace(/\f/g, '\n') // Replace form feeds with newlines
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
  
  return cleaned
}

/**
 * Extract text from a URL using Python PyMuPDF
 * Downloads the file and processes it with Python for superior text extraction
 */
export async function extractTextFromURLWithPython(url: string): Promise<string> {
  try {
    console.log(`🐍 Extracting text from URL using Python PyMuPDF: ${url}`)
    
    // Download the file from the URL
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
      console.log('📄 Detected PDF file, using Python PyMuPDF for extraction')
      const pdfData = await extractTextFromPDFWithPython(Buffer.from(buffer))
      return pdfData.text
    }
    
    // For non-PDF files, fall back to regular text extraction
    console.log('📄 Non-PDF file detected, using standard text extraction')
    return new TextDecoder().decode(buffer)
    
  } catch (error) {
    console.error('❌ Python URL extraction error:', error)
    throw error
  }
}

/**
 * Check if Python and PyMuPDF are available
 */
export async function checkPythonPDFAvailability(): Promise<{
  python: boolean
  pymupdf: boolean
  error?: string
}> {
  try {
    // Check if Python is available
    const pythonCheck = await new Promise<boolean>((resolve) => {
      const python = spawn('python', ['--version'], { stdio: 'pipe' })
      python.on('close', (code) => resolve(code === 0))
      python.on('error', () => resolve(false))
    })
    
    if (!pythonCheck) {
      return {
        python: false,
        pymupdf: false,
        error: 'Python is not installed or not in PATH'
      }
    }
    
    // Check if PyMuPDF is available
    const pymupdfCheck = await new Promise<boolean>((resolve) => {
      const python = spawn('python', ['-c', 'import fitz; print("PyMuPDF available")'], { stdio: 'pipe' })
      python.on('close', (code) => resolve(code === 0))
      python.on('error', () => resolve(false))
    })
    
    return {
      python: true,
      pymupdf: pymupdfCheck,
      error: pymupdfCheck ? undefined : 'PyMuPDF is not installed. Run: pip install PyMuPDF'
    }
    
  } catch (error) {
    return {
      python: false,
      pymupdf: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
