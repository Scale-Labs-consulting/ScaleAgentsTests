// Test Scale Expert PDF extraction vs Sales Analyst knowledge extraction
import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromURL } from '@/lib/pdf-utils'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n🔬 ===== COMPARING PDF EXTRACTION METHODS =====`)
    
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName') || 'Base R2.pdf'
    const callType = searchParams.get('callType') || 'Reunião de Descoberta'
    
    console.log(`📄 Testing file: ${fileName}`)
    console.log(`📋 Call type: ${callType}`)
    
    // Test 1: Scale Expert method (extractTextFromURL)
    console.log(`\n🔍 Method 1: Scale Expert (extractTextFromURL)`)
    const scaleExpertStart = Date.now()
    let scaleExpertResult = null
    
    try {
      const storeId = 'yjq0uw1vlhs3s48i'
      const encodedFileName = encodeURIComponent(fileName)
      const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/SalesAnalystKnowledge/${encodedFileName}`
      
      console.log(`🔗 Scale Expert URL: ${blobUrl}`)
      
      const scaleExpertText = await extractTextFromURL(blobUrl)
      const scaleExpertTime = Date.now() - scaleExpertStart
      
      scaleExpertResult = {
        success: true,
        textLength: scaleExpertText?.length || 0,
        processingTime: scaleExpertTime,
        preview: scaleExpertText?.substring(0, 300) || '',
        quality: analyzeTextQuality(scaleExpertText || '')
      }
      
      console.log(`✅ Scale Expert: ${scaleExpertText?.length || 0} chars in ${scaleExpertTime}ms`)
    } catch (error) {
      const scaleExpertTime = Date.now() - scaleExpertStart
      scaleExpertResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: scaleExpertTime
      }
      console.log(`❌ Scale Expert failed:`, error)
    }
    
    // Test 2: Sales Analyst method (getKnowledgeForCallType)
    console.log(`\n🔍 Method 2: Sales Analyst (getKnowledgeForCallType)`)
    const salesAnalystStart = Date.now()
    let salesAnalystResult = null
    
    try {
      const salesAnalystKnowledge = await getKnowledgeForCallType(callType)
      const salesAnalystTime = Date.now() - salesAnalystStart
      
      // Find the specific file content within the knowledge
      const knowledgeParts = salesAnalystKnowledge.split('\n\n---\n\n')
      const targetFileContent = knowledgeParts.find(part => 
        part.toLowerCase().includes(fileName.toLowerCase().replace('.pdf', ''))
      ) || knowledgeParts[0] || ''
      
      salesAnalystResult = {
        success: true,
        textLength: targetFileContent.length,
        totalKnowledgeLength: salesAnalystKnowledge.length,
        fileCount: knowledgeParts.length,
        processingTime: salesAnalystTime,
        preview: targetFileContent.substring(0, 300),
        quality: analyzeTextQuality(targetFileContent)
      }
      
      console.log(`✅ Sales Analyst: ${targetFileContent.length} chars (${salesAnalystKnowledge.length} total) in ${salesAnalystTime}ms`)
    } catch (error) {
      const salesAnalystTime = Date.now() - salesAnalystStart
      salesAnalystResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: salesAnalystTime
      }
      console.log(`❌ Sales Analyst failed:`, error)
    }
    
    // Comparison
    console.log(`\n📊 COMPARISON RESULTS:`)
    if (scaleExpertResult.success && salesAnalystResult.success) {
      const lengthDiff = scaleExpertResult.textLength - salesAnalystResult.textLength
      const qualityDiff = scaleExpertResult.quality.score - salesAnalystResult.quality.score
      const timeDiff = scaleExpertResult.processingTime - salesAnalystResult.processingTime
      
      console.log(`   📏 Length: Scale Expert ${scaleExpertResult.textLength} vs Sales Analyst ${salesAnalystResult.textLength} (diff: ${lengthDiff > 0 ? '+' : ''}${lengthDiff})`)
      console.log(`   🎯 Quality: Scale Expert ${scaleExpertResult.quality.score}/10 vs Sales Analyst ${salesAnalystResult.quality.score}/10 (diff: ${qualityDiff > 0 ? '+' : ''}${qualityDiff})`)
      console.log(`   ⏱️ Time: Scale Expert ${scaleExpertResult.processingTime}ms vs Sales Analyst ${salesAnalystResult.processingTime}ms (diff: ${timeDiff > 0 ? '+' : ''}${timeDiff}ms)`)
      
      let winner = 'Tie'
      if (lengthDiff > 0 && qualityDiff > 0) winner = 'Scale Expert'
      else if (lengthDiff < 0 && qualityDiff < 0) winner = 'Sales Analyst'
      else if (Math.abs(lengthDiff) > 1000) winner = lengthDiff > 0 ? 'Scale Expert' : 'Sales Analyst'
      else if (Math.abs(qualityDiff) > 2) winner = qualityDiff > 0 ? 'Scale Expert' : 'Sales Analyst'
      
      console.log(`   🏆 Winner: ${winner}`)
    }
    
    console.log(`🔬 ===== COMPARISON COMPLETE =====\n`)
    
    return NextResponse.json({
      success: true,
      fileName,
      callType,
      scaleExpert: scaleExpertResult,
      salesAnalyst: salesAnalystResult,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`❌ Comparison test error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Analyze the quality of extracted text
 */
function analyzeTextQuality(text: string): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 10
  
  // Check for garbled characters
  const garbledPatterns = [
    /[●]{2,}/g, // Multiple bullet points
    /\b[a-z]\s+[a-z]\s+[a-z]\b/g, // Single letters separated by spaces
    /[^\w\s\.,;:!?\-\(\)\[\]\"\'\/\@\#\$\%\&\*\+\=\<\>\|\~\`]/g, // Special characters
    /\bPaMs\b/g, // Known garbled words
    /\bmMp\b/g,
    /\bu\s+r\s+b\s+o\b/g
  ]
  
  garbledPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      issues.push(`Garbled pattern ${index + 1}: ${matches.length} occurrences`)
      score -= Math.min(2, matches.length * 0.5)
    }
  })
  
  // Check for proper Portuguese words
  const portugueseWords = text.match(/\b(para|com|uma|que|não|mais|sobre|entre|sobre|através|durante|após|antes|depois|quando|onde|como|porque|então|também|ainda|sempre|nunca|muito|pouco|grande|pequeno|bom|mau|novo|velho|primeiro|último|melhor|pior)\b/gi)
  if (portugueseWords && portugueseWords.length > 10) {
    score += 1 // Bonus for good Portuguese content
  }
  
  // Check for readable sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const readableSentences = sentences.filter(s => s.match(/^[A-Za-z]/) && s.length > 20)
  const readabilityRatio = readableSentences.length / Math.max(1, sentences.length)
  
  if (readabilityRatio < 0.3) {
    issues.push(`Low readability: ${Math.round(readabilityRatio * 100)}% readable sentences`)
    score -= 3
  }
  
  return {
    score: Math.max(0, Math.min(10, Math.round(score))),
    issues
  }
}
