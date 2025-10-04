// Sales Optimizer Service - Enhanced Sales Call Analysis with Advanced AI
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export interface SalesCall {
  id: string
  user_id: string
  title?: string
  file_url: string
  file_size?: number
  call_type?: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  duration?: number
  created_at: string
  updated_at: string
}

export interface SalesOptimizerAnalysis {
  id: string
  sales_call_id: string
  user_id: string
  title?: string
  status: 'processing' | 'completed' | 'failed'
  call_type?: string
  feedback: string
  score: number
  analysis: any
  analysis_metadata: any
  transcription: string
  custom_prompts: string[]
  created_at: string
}

export class SalesOptimizerService {
  static async uploadSalesCall(
    file: File,
    userId: string,
    title?: string
  ): Promise<SalesCall> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `sales-calls/${userId}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('sales-calls')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('sales-calls')
      .getPublicUrl(filePath)

    // Save to database
    const { data, error } = await supabase
      .from('sales_calls')
      .insert({
        user_id: userId,
        title: title || file.name,
        file_url: publicUrl,
        file_size: file.size,
        status: 'uploaded'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getSalesCall(id: string): Promise<SalesCall | null> {
    const { data, error } = await supabase
      .from('sales_calls')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async getSalesCallWithTranscription(id: string): Promise<SalesCall & { transcription?: string } | null> {
    const data = await this.getSalesCall(id)
    if (!data) return null

    // Try to get transcription from analysis
    const { data: analysis } = await supabase
      .from('sales_call_analyses')
      .select('transcription')
      .eq('sales_call_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const transcription = analysis?.transcription || ''

    return {
      ...data,
      transcription
    }
  }

  static async analyzeSalesCall(
    salesCallId: string,
    userId: string
  ): Promise<SalesOptimizerAnalysis> {
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
      const analysis = await this.performAdvancedOpenAIAnalysis(salesCall.file_url)

      // Create analysis record
      const analysisData = {
        sales_call_id: salesCallId,
        user_id: userId,
        feedback: analysis.feedback,
        score: analysis.score,
        analysis: analysis.detailedAnalysis,
        transcription: analysis.transcription,
        custom_prompts: this.getAdvancedPrompts()
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

  private static async transcribeAudioFromUrl(fileUrl: string): Promise<string> {
    try {
      // Download the file
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const blob = new Blob([arrayBuffer])
      
      // Use OpenAI Whisper for transcription
      const formData = new FormData()
      formData.append('file', blob, 'audio.mp4')
      formData.append('model', 'whisper-1')
      formData.append('language', 'pt')

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`
        },
        body: formData
      })

      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`)
      }

      const result = await transcriptionResponse.json()
      return result.text
    } catch (error) {
      console.error('Error transcribing audio:', error)
      throw error
    }
  }

  private static async performAdvancedOpenAIAnalysis(fileUrl: string) {
    try {
      // Use existing transcription logic from sales analyst
      const transcript = await this.transcribeAudioFromUrl(fileUrl)

      // Advanced AI Analysis with enhanced prompts
      const analysisPrompt = `
Como um especialista em vendas com mais de 15 anos de experiência, analisa esta chamada de vendas em português.

TRANSCRIÇÃO DA CHAMADA:
${transcript}

INSTRUÇÕES DE ANÁLISE:
1. Classifica o tipo de chamada (Chamada Fria, Follow-up, Apresentação, Negociação, etc.)
2. Analisa cada fase da chamada (abertura, descoberta, apresentação, fechamento)
3. Identifica pontos fortes e áreas de melhoria específicas
4. Fornece scores detalhados (0-5) para cada categoria
5. Sugere ações concretas para melhorar performance
6. Calcula score geral (0-40)

ESTRUTURA DE RESPOSTA (JSON):
{
  "tipoCall": "tipo identificado",
  "totalScore": número_0_a_40,
  "pontosFortes": "lista detalhada dos pontos fortes",
  "pontosFracos": "lista detalhada das áreas de melhoria", 
  "resumoDaCall": "resumo executivo da chamada",
  "dicasGerais": "dicas específicas para esta situação",
  "focoParaProximasCalls": "ações prioritárias para próximas chamadas",
  "clarezaFluenciaFala": score_0_5,
  "tomControlo": score_0_5,
  "envolvimentoConversacional": score_0_5,
  "efetividadeDescobertaNecessidades": score_0_5,
  "entregaValorAjusteSolucao": score_0_5,
  "habilidadesLidarObjeccoes": score_0_5,
  "estruturaControleReuniao": score_0_5,
  "fechamentoProximosPassos": score_0_5,
  "analiseDetalhadaPorFase": {
    "abertura": "análise específica da abertura",
    "descoberta": "análise da fase de descoberta",
    "apresentacao": "análise da apresentação",
    "fechamento": "análise do fechamento"
  },
  "sugestoesEspecificas": [
    "sugestão 1",
    "sugestão 2",
    "sugestão 3"
  ],
  "benchmarkPerformance": {
    "vsMedia": "comparação com benchmarks",
    "vsMelhores": "comparação com top performers",
    "proximosPassos": "roadmap de melhoria"
  }
}

Responde APENAS com o JSON válido, sem texto adicional.
`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'És um especialista em vendas com vasta experiência em análise de chamadas. Forneces análises detalhadas e acionáveis em formato JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })

      const analysisText = completion.choices[0]?.message?.content || '{}'
      const detailedAnalysis = JSON.parse(analysisText)

      // Generate feedback summary
      const feedbackPrompt = `
Com base nesta análise detalhada, gera um feedback executivo conciso e acionável:

ANÁLISE: ${JSON.stringify(detailedAnalysis)}

Gera um feedback de 2-3 parágrafos que:
1. Destaca os principais pontos fortes
2. Identifica as 2-3 áreas mais críticas para melhoria
3. Fornece uma recomendação específica e acionável

Mantém um tom construtivo e profissional.
`

      const feedbackCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'És um coach de vendas experiente que fornece feedback construtivo e acionável.'
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 500
      })

      const feedback = feedbackCompletion.choices[0]?.message?.content || 'Análise concluída com sucesso.'

      return {
        transcription: transcript,
        detailedAnalysis,
        feedback,
        score: detailedAnalysis.totalScore || 0,
        duration: Math.ceil(transcript.length / 100) // Rough estimate
      }
    } catch (error) {
      console.error('Error in OpenAI analysis:', error)
      throw error
    }
  }

  private static getAdvancedPrompts() {
    return [
      'Classificação de Tipo de Chamada',
      'Análise Quantitativa Avançada',
      'Análise por Fases da Chamada',
      'Identificação de Pontos Fortes',
      'Identificação de Áreas de Melhoria',
      'Sistema de Scoring Detalhado',
      'Sugestões Específicas e Acionáveis',
      'Benchmarking de Performance',
      'Análise de Momentos Críticos',
      'Roadmap de Melhoria Personalizado'
    ]
  }

  static async getAnalyses(userId: string): Promise<SalesOptimizerAnalysis[]> {
    const { data, error } = await supabase
      .from('sales_call_analyses')
      .select(`
        *,
        sales_calls!inner(user_id)
      `)
      .eq('sales_calls.user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getAnalysis(id: string): Promise<SalesOptimizerAnalysis | null> {
    const { data, error } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async deleteAnalysis(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_call_analyses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

