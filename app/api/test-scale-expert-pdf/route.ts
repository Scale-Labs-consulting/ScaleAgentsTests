// Test Scale Expert PDF parsing specifically
import { NextRequest, NextResponse } from 'next/server'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n🎯 ===== TESTING SCALE EXPERT PDF PARSING =====`)
    
    const { searchParams } = new URL(request.url)
    const callType = searchParams.get('callType') || 'Reunião de Descoberta'
    
    console.log(`📋 Testing Scale Expert call type: ${callType}`)
    
    // Test knowledge fetching with PDF parsing
    const startTime = Date.now()
    const knowledge = await getKnowledgeForCallType(callType)
    const endTime = Date.now()
    
    const processingTime = endTime - startTime
    
    // Analyze the knowledge content
    const knowledgeParts = knowledge.split('\n\n---\n\n')
    const fileCount = knowledgeParts.length
    
    // Get statistics about the content
    const totalLength = knowledge.length
    const avgLengthPerFile = fileCount > 0 ? Math.round(totalLength / fileCount) : 0
    
    // Sample some content from each file
    const fileSamples = knowledgeParts.map((part, index) => ({
      fileIndex: index + 1,
      length: part.length,
      preview: part.substring(0, 300).replace(/\s+/g, ' ').trim(),
      hasContent: part.trim().length > 0,
      quality: analyzeTextQuality(part)
    }))
    
    // Overall quality assessment
    const overallQuality = assessOverallQuality(fileSamples)
    
    console.log(`\n📊 SCALE EXPERT PDF PARSING RESULTS:`)
    console.log(`   📋 Call Type: ${callType}`)
    console.log(`   📁 Files Found: ${fileCount}`)
    console.log(`   📝 Total Knowledge Length: ${totalLength} characters`)
    console.log(`   📊 Average per File: ${avgLengthPerFile} characters`)
    console.log(`   ⏱️ Processing Time: ${processingTime}ms`)
    console.log(`   🎯 Overall Quality: ${overallQuality.score}/10 (${overallQuality.description})`)
    
    fileSamples.forEach((file, index) => {
      console.log(`   📄 File ${index + 1}: ${file.length} chars - Quality: ${file.quality.score}/10`)
      console.log(`      Preview: "${file.preview.substring(0, 100)}..."`)
    })
    
    console.log(`🎯 ===== SCALE EXPERT TEST END =====\n`)
    
    return NextResponse.json({
      success: true,
      callType,
      processingTime,
      fileCount,
      totalKnowledgeLength: totalLength,
      averageLengthPerFile: avgLengthPerFile,
      overallQuality,
      fileSamples,
      fullKnowledge: knowledge, // Include full content for analysis
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`❌ Scale Expert PDF parsing test error:`, error)
    
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

/**
 * Assess overall quality of all files
 */
function assessOverallQuality(fileSamples: any[]): { score: number; description: string } {
  if (fileSamples.length === 0) {
    return { score: 0, description: 'No files found' }
  }
  
  const avgScore = fileSamples.reduce((sum, file) => sum + file.quality.score, 0) / fileSamples.length
  const totalIssues = fileSamples.reduce((sum, file) => sum + file.quality.issues.length, 0)
  
  let description = ''
  if (avgScore >= 8) {
    description = 'Excellent - High quality extraction'
  } else if (avgScore >= 6) {
    description = 'Good - Minor issues'
  } else if (avgScore >= 4) {
    description = 'Fair - Some garbled text'
  } else if (avgScore >= 2) {
    description = 'Poor - Significant issues'
  } else {
    description = 'Very Poor - Major extraction problems'
  }
  
  if (totalIssues > 0) {
    description += ` (${totalIssues} issues found)`
  }
  
  return {
    score: Math.round(avgScore),
    description
  }
}
