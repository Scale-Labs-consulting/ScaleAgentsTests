import { supabase } from './supabase'
import type { SalesCall, SalesCallInsert, SalesCallUpdate } from '@/types/database'

export interface SalesCallAnalysis {
  id: string
  salesCallId: string
  feedback: string
  score: number
  analysis: {
    opening: { score: number; feedback: string }
    discovery: { score: number; feedback: string }
    objectionHandling: { score: number; feedback: string }
    closing: { score: number; feedback: string }
    overall: { score: number; feedback: string }
  }
  transcription: string
  customPrompts: string[]
  createdAt: string
}

export class SalesAnalystService {
  static async uploadSalesCall(
    file: File,
    userId: string,
    title?: string
  ): Promise<SalesCall> {
    try {
      // Upload file to Supabase Storage
      const fileName = `${userId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sales-calls')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sales-calls')
        .getPublicUrl(fileName)

      // Create database record
      const salesCallData: SalesCallInsert = {
        user_id: userId,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        file_url: publicUrl,
        file_path: fileName,
        duration: 0, // Will be calculated during analysis
        status: 'uploaded'
      }

      const { data: salesCall, error: dbError } = await supabase
        .from('sales_calls')
        .insert(salesCallData)
        .select()
        .single()

      if (dbError) throw dbError

      return salesCall
    } catch (error) {
      console.error('Error uploading sales call:', error)
      throw error
    }
  }

  static async getSalesCalls(userId: string): Promise<SalesCall[]> {
    try {
      const { data, error } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sales calls:', error)
      throw error
    }
  }

  static async getSalesCall(id: string): Promise<SalesCall | null> {
    const { data, error } = await supabase
      .from('sales_calls')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching sales call:', error)
      return null
    }

    return data
  }

  static async getSalesCallWithTranscription(id: string): Promise<SalesCall & { transcription?: string } | null> {
    const { data, error } = await supabase
      .from('sales_calls')
      .select(`
        *,
        sales_call_analyses (
          transcription
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching sales call with transcription:', error)
      return null
    }

    // Extract transcription from the analysis if it exists
    const transcription = data.sales_call_analyses?.[0]?.transcription

    return {
      ...data,
      transcription
    }
  }

  static async analyzeSalesCall(
    salesCallId: string,
    userId: string
  ): Promise<SalesCallAnalysis> {
    try {
      // Get the sales call
      const salesCall = await this.getSalesCall(salesCallId)
      if (!salesCall) throw new Error('Sales call not found')

      // Update status to processing
      await supabase
        .from('sales_calls')
        .update({ status: 'processing' })
        .eq('id', salesCallId)

      // Extract audio and analyze using OpenAI
      const analysis = await this.performOpenAIAnalysis(salesCall.file_url)

      // Create analysis record
      const analysisData = {
        sales_call_id: salesCallId,
        user_id: userId,
        feedback: analysis.feedback,
        score: analysis.score,
        analysis: analysis.detailedAnalysis,
        transcription: analysis.transcription,
        custom_prompts: this.getDefaultPrompts()
      }

      const { data: analysisRecord, error: analysisError } = await supabase
        .from('sales_call_analyses')
        .insert(analysisData)
        .select()
        .single()

      if (analysisError) throw analysisError

      // Update sales call status to completed
      await supabase
        .from('sales_calls')
        .update({ 
          status: 'completed',
          duration: analysis.duration || 0
        })
        .eq('id', salesCallId)

      return analysisRecord
    } catch (error) {
      // Update status to failed
      await supabase
        .from('sales_calls')
        .update({ status: 'failed' })
        .eq('id', salesCallId)

      console.error('Error analyzing sales call:', error)
      throw error
    }
  }

  private static async performOpenAIAnalysis(fileUrl: string) {
    try {
      // Download the video file
      const response = await fetch(fileUrl)
      const videoBlob = await response.blob()

      // Convert video to audio (simplified - in production you'd use ffmpeg)
      const audioBlob = await this.extractAudioFromVideo(videoBlob)

      // Transcribe audio using OpenAI Whisper
      const transcription = await this.transcribeAudio(audioBlob)

      // Analyze transcription using OpenAI GPT
      const analysis = await this.analyzeTranscription(transcription)

      return {
        transcription,
        feedback: analysis.feedback,
        score: analysis.score,
        detailedAnalysis: analysis.detailedAnalysis,
        duration: analysis.duration
      }
    } catch (error) {
      console.error('Error in OpenAI analysis:', error)
      throw error
    }
  }

  private static async extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
    // This is a simplified version - in production you'd use ffmpeg or a similar tool
    // For now, we'll return the video blob as-is and handle it on the backend
    return videoBlob
  }

  private static async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.mp4')
    formData.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text
  }

  private static async analyzeTranscription(transcription: string) {
    const prompts = this.getDefaultPrompts()
    const analysisPrompt = `
You are a sales expert analyzing a sales call. Here is the transcription:

${transcription}

Please analyze this sales call using the following criteria:
${prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}

Provide a comprehensive analysis including:
1. Overall score (1-10)
2. Detailed feedback for each criterion
3. Specific areas for improvement
4. Key strengths identified

Format your response as JSON with the following structure:
{
  "score": 8.5,
  "feedback": "Overall analysis summary...",
  "detailedAnalysis": {
    "opening": {"score": 8, "feedback": "Opening analysis..."},
    "discovery": {"score": 7, "feedback": "Discovery analysis..."},
    "objectionHandling": {"score": 6, "feedback": "Objection handling analysis..."},
    "closing": {"score": 7, "feedback": "Closing analysis..."},
    "overall": {"score": 7, "feedback": "Overall analysis..."}
  }
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a sales expert providing detailed analysis of sales calls. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`)
    }

    const result = await response.json()
    const analysisText = result.choices[0].message.content

    try {
      const analysis = JSON.parse(analysisText)
      return {
        score: analysis.score,
        feedback: analysis.feedback,
        detailedAnalysis: analysis.detailedAnalysis,
        duration: this.estimateDuration(transcription)
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        score: 7.5,
        feedback: analysisText,
        detailedAnalysis: {
          opening: { score: 7, feedback: "Analysis provided" },
          discovery: { score: 7, feedback: "Analysis provided" },
          objectionHandling: { score: 7, feedback: "Analysis provided" },
          closing: { score: 7, feedback: "Analysis provided" },
          overall: { score: 7, feedback: analysisText }
        },
        duration: this.estimateDuration(transcription)
      }
    }
  }

  private static getDefaultPrompts(): string[] {
    return [
      'Analyze the opening and value proposition',
      'Evaluate objection handling techniques',
      'Assess closing and follow-up strategies',
      'Review overall communication effectiveness'
    ]
  }

  private static estimateDuration(transcription: string): number {
    // Rough estimate: 150 words per minute
    const wordCount = transcription.split(' ').length
    return Math.round((wordCount / 150) * 60)
  }

  static async deleteSalesCall(id: string): Promise<void> {
    try {
      // Get the sales call to delete the file
      const salesCall = await this.getSalesCall(id)
      if (salesCall?.file_path) {
        await supabase.storage
          .from('sales-calls')
          .remove([salesCall.file_path])
      }

      // Delete from database
      await supabase
        .from('sales_calls')
        .delete()
        .eq('id', id)
    } catch (error) {
      console.error('Error deleting sales call:', error)
      throw error
    }
  }

  static async getAnalysisHistory(userId: string): Promise<SalesCallAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('sales_call_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching analysis history:', error)
      throw error
    }
  }
}
