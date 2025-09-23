// Enhanced timestamp utilities for Sales Analyst
export interface TimestampInfo {
  timestamp: string
  phrase: string
  speaker: string
  confidence?: number
}

/**
 * Extract timestamps from AssemblyAI transcription with word-level timestamps
 */
export function extractTimestampsFromAssemblyAI(transcription: string): TimestampInfo[] {
  const timestamps: TimestampInfo[] = []
  
  // AssemblyAI format: "Speaker 1: [00:02:15] Hello, how are you today?"
  const speakerPattern = /(Speaker \d+):\s*\[(\d{2}:\d{2}:\d{2})\]\s*(.+?)(?=(?:Speaker \d+)|$)/g
  
  let match
  while ((match = speakerPattern.exec(transcription)) !== null) {
    const [, speaker, time, phrase] = match
    timestamps.push({
      timestamp: time,
      phrase: phrase.trim(),
      speaker: speaker
    })
  }
  
  return timestamps
}

/**
 * Find the best timestamp for a given phrase
 */
export function findBestTimestamp(phrase: string, timestamps: TimestampInfo[]): string | null {
  // Clean the phrase for comparison
  const cleanPhrase = phrase.toLowerCase().replace(/[^\w\s]/g, '').trim()
  
  // Find exact matches first
  for (const ts of timestamps) {
    const cleanTimestamp = ts.phrase.toLowerCase().replace(/[^\w\s]/g, '').trim()
    if (cleanTimestamp.includes(cleanPhrase) || cleanPhrase.includes(cleanTimestamp)) {
      return ts.timestamp
    }
  }
  
  // Find partial matches
  for (const ts of timestamps) {
    const words = cleanPhrase.split(' ')
    const timestampWords = ts.phrase.toLowerCase().replace(/[^\w\s]/g, '').trim().split(' ')
    
    // Check if at least 3 words match
    const matchingWords = words.filter(word => 
      timestampWords.some(tw => tw.includes(word) || word.includes(tw))
    )
    
    if (matchingWords.length >= Math.min(3, words.length * 0.6)) {
      return ts.timestamp
    }
  }
  
  return null
}

/**
 * Format timestamp for display (MM:SS format)
 */
export function formatTimestamp(timestamp: string): string {
  // Convert HH:MM:SS to MM:SS if needed
  if (timestamp.includes(':')) {
    const parts = timestamp.split(':')
    if (parts.length === 3) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      const seconds = parseInt(parts[2])
      
      // If less than 1 hour, show MM:SS
      if (hours === 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    }
  }
  
  return timestamp
}

/**
 * Extract full phrases from transcription with timestamps
 */
export function extractFullPhrases(transcription: string): { phrase: string; timestamp: string; speaker: string }[] {
  const phrases: { phrase: string; timestamp: string; speaker: string }[] = []
  
  // Split by speaker changes
  const speakerSections = transcription.split(/(?=Speaker \d+:)/)
  
  for (const section of speakerSections) {
    if (!section.trim()) continue
    
    // Extract speaker and timestamp
    const speakerMatch = section.match(/^(Speaker \d+):\s*\[(\d{2}:\d{2}:\d{2})\]/)
    if (speakerMatch) {
      const [, speaker, timestamp] = speakerMatch
      const phrase = section.replace(/^Speaker \d+:\s*\[\d{2}:\d{2}:\d{2}\]\s*/, '').trim()
      
      if (phrase.length > 10) { // Only include substantial phrases
        phrases.push({
          phrase,
          timestamp: formatTimestamp(timestamp),
          speaker
        })
      }
    }
  }
  
  return phrases
}

/**
 * Enhanced phrase extraction with context
 */
export function extractPhrasesWithContext(transcription: string, targetPhrase: string): { phrase: string; timestamp: string; context: string } | null {
  const phrases = extractFullPhrases(transcription)
  
  for (const phraseInfo of phrases) {
    if (phraseInfo.phrase.toLowerCase().includes(targetPhrase.toLowerCase())) {
      // Get surrounding context
      const currentIndex = phrases.indexOf(phraseInfo)
      const context = [
        currentIndex > 0 ? phrases[currentIndex - 1].phrase : '',
        phraseInfo.phrase,
        currentIndex < phrases.length - 1 ? phrases[currentIndex + 1].phrase : ''
      ].filter(p => p.trim()).join(' ')
      
      return {
        phrase: phraseInfo.phrase,
        timestamp: phraseInfo.timestamp,
        context
      }
    }
  }
  
  return null
}
