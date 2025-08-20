// Centralized prompts for the ScaleAgents application

export const SALES_ANALYSIS_PROMPT = `Analisa esta transcrição de uma chamada de vendas em português e fornece uma análise completa e estruturada.

Transcrição:
{transcription}

Fornece a tua análise em formato de texto simples, estruturada EXATAMENTE da seguinte forma:

**TIPO DE CHAMADA:**
[Identifica se é prospetiva, follow-up, demonstração, fechamento, etc.]

**PONTUAÇÃO GERAL:**
[Pontuação de 1-40 baseada na qualidade da chamada - APENAS O NÚMERO]

**PONTOS FORTES:**
• [Ponto forte 1 - descrição clara e concisa]
• [Ponto forte 2 - descrição clara e concisa]
• [Ponto forte 3 - descrição clara e concisa]

**ÁREAS DE MELHORIA:**
• [Área de melhoria 1 - descrição clara e concisa]
• [Área de melhoria 2 - descrição clara e concisa]
• [Área de melhoria 3 - descrição clara e concisa]

**TÉCNICAS UTILIZADAS:**
• [Técnica 1 - descrição clara e concisa]
• [Técnica 2 - descrição clara e concisa]

**OBJEÇÕES E TRATAMENTO:**
• [Objeção identificada e como foi tratada - descrição clara e concisa]

**FEEDBACK GERAL:**
[Análise detalhada e sugestões práticas para melhorar]

IMPORTANTE:
- Responde APENAS em português
- Mantém EXATAMENTE o formato acima com os títulos em negrito
- Cada ponto deve ser uma frase clara e concisa
- NÃO incluas timestamps ou referências temporais
- Cada bullet point deve ser uma ideia completa mas concisa
- Evita frases muito longas ou complexas
- A pontuação deve ser APENAS um número de 1 a 40`

export const SALES_ANALYSIS_SYSTEM_PROMPT = 'És um especialista em análise de vendas com experiência em avaliar chamadas de vendas e fornecer feedback construtivo.'

// Function to replace placeholders in prompts
export function formatPrompt(template: string, replacements: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return result
}

// Function to get the complete sales analysis prompt
export function getSalesAnalysisPrompt(transcription: string): string {
  return formatPrompt(SALES_ANALYSIS_PROMPT, { transcription })
}
