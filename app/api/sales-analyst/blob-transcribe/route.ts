import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { del } from '@vercel/blob'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'
import { 
  getMomentosFortesFracosPrompt,
  getAnaliseQuantitativaPrompt,
  getPontosFortesPrompt,
  getPontosFortesGSPrompt,
  getPontosFracosPrompt,
  getPontosFracosGSPrompt,
  getAnaliseQuantitativaCompletaPrompt,
  getExplicacaoPontuacaoPrompt,
  getJustificacaoGSPrompt,
  getJustificativaAvaliacaoPrompt,
  SYSTEM_PROMPTS,
  getEnhancedMomentosFortesPrompt,
  getEnhancedPontosFortesPrompt,
  getEnhancedPontosFracosPrompt,
  getEnhancedDicasGeraisPrompt,
  getEnhancedFocoProximasCallsPrompt,
  getPontosFracosPromptWithContext,
  getEnhancedPontosFracosPromptWithContext
} from '@/lib/comprehensive-prompts'
import { convertToStructuredJSON, SalesAnalysisJSON } from '@/lib/sales-analysis-schema'

// Function to perform comprehensive chunked analysis for very long transcriptions
async function performChunkedAnalysis(transcription: string, maxChunkLength: number, callType?: string) {
  console.log('🔍 Starting comprehensive chunked analysis...')
  
  // Split transcription into chunks at speaker boundaries
  const chunks = splitTranscriptionIntoChunks(transcription, maxChunkLength)
  console.log(`📝 Split transcription into ${chunks.length} chunks`)
  
  let totalTokensUsed = 0
  
  // STRATEGY: Analyze each field across ALL chunks to get complete call analysis
  
  // 1. Use provided call type instead of analyzing
  console.log(`🔄 Using provided call type: ${callType || 'Chamada Fria'}`)
  const callTypeResult = { tipoCall: callType || 'Chamada Fria', totalTokensUsed: 0 }
  
  // 2. Analyze each field across all chunks
  const fieldResults = {
    pontosFortes: '',
    pontosFracos: '',
    resumoDaCall: '',
    dicasGerais: '',
    focoParaProximasCalls: '',
    scoring: {
      clarezaFluenciaFala: 0,
      tomControlo: 0,
      envolvimentoConversacional: 0,
      efetividadeDescobertaNecessidades: 0,
      entregaValorAjusteSolucao: 0,
      habilidadesLidarObjeccoes: 0,
      estruturaControleReuniao: 0,
      fechamentoProximosPassos: 0
    }
  }
  
  // Analyze each field across all chunks
  const fieldsToAnalyze = [
    { name: 'Pontos Fortes', key: 'pontosFortes', systemPrompt: SYSTEM_PROMPTS.PONTOS_FORTES, userPrompt: getPontosFortesPrompt },
    { name: 'Pontos Fracos', key: 'pontosFracos', systemPrompt: SYSTEM_PROMPTS.PONTOS_FRACOS, userPrompt: getPontosFracosPrompt },
    { name: 'Resumo da Call', key: 'resumoDaCall', systemPrompt: 'És um assistente especializado em análise de calls de vendas. A tua única função é analisar a transcrição da call e identificar os momentos de maior e menor desempenho do comercial.', userPrompt: (transcription: string) => `Quando eu te fornecer uma transcrição completa de uma call de vendas, a tua resposta deve ser objetiva e fornecer um feedback generalizado sobre três momentos-chave: início, meio e fim da reunião. Não precisas de analisar cada segundo ou minuto da conversa, apenas destacar os pontos essenciais do desempenho do comercial nos seguintes aspetos:

Início da Call:
- Apresentação inicial: Como foi a introdução? O comercial gerou rapport com a lead?  
- Perguntas: O comercial fez boas perguntas para entender as necessidades da lead?  

Meio da Call:
- Apresentação do serviço/proposta: O comercial explicou bem a solução? Conseguiu manter o interesse?  
- Lidar com objeções: Como o comercial geriu dúvidas e preocupações da lead?  

Fim da Call:
- Fecho e/ou próximos passos: O comercial conduziu bem o encerramento? O lead ficou com clareza sobre os próximos passos?  

Estrutura da Resposta:

Momentos Fortes do Comercial:
- Início: [Destaca um ponto forte do início da call]  
- Meio: [Destaca um ponto forte do meio da call]  
- Fim: [Destaca um ponto forte do final da call]  

Momentos Fracos do Comercial:
- Início: [Identifica um ponto fraco do início da call]  
- Meio: [Identifica um ponto fraco do meio da call]  
- Fim: [Identifica um ponto fraco do final da call]  

Regras Importantes:
- A tua resposta deve ser clara e objetiva – apenas o essencial.  
- NÃO uses emojis, números, markdowns (como **texto** ou ## títulos) ou qualquer tipo de formatação especial. Apenas texto normal.  
- Usa apenas texto limpo, pois o resultado será inserido diretamente no Google Sheets.  
- Mantém o foco na qualidade do discurso, técnicas de venda, persuasão e fechamento.  
- Se não houver momentos fortes ou fracos evidentes em alguma parte (início, meio ou fim), diz "Não foi identificado".  
- NÃO uses asteriscos (**) para negrito - escreve apenas o texto normal.

Todas as tuas respostas devem ser exclusivamente em português de Portugal (especificamente de Lisboa), respeitando as seguintes regras:  

1. Tratamento: Utiliza "tu" em vez de "você" para tratamento informal e "o senhor/a senhora" para tratamento formal.  

2. Pronomes e Conjugações:  
   - Utiliza "tu fazes" em vez de "você faz"  
   - Utiliza os pronomes "te/ti/contigo" em vez de formas com "você"  
   - Utiliza a 2ª pessoa do singular nas conjugações verbais: "tu estás", "tu vais", etc.  

3. Evita gerúndios:  
   - Utiliza "estou a fazer" em vez de "estou fazendo"  
   - Utiliza "estamos a analisar" em vez de "estamos analisando"  
   - Substitui todas as construções com gerúndio pela estrutura "a + infinitivo"  

4. Colocação dos pronomes clíticos:  
   - Prefere a ênclise na maioria dos contextos ("Disse-me" em vez de "Me disse").  

5. Preserva os sons e sotaque lisboeta, que tende a reduzir as vogais átonas.  

6. Utiliza sempre o pretérito perfeito simples em vez do composto em situações de ações concluídas ("Eu comi" em vez de "Eu tenho comido").  

É ABSOLUTAMENTE ESSENCIAL que todas as respostas sigam estas regras, sem exceção. Em caso de dúvida, opta sempre pela forma utilizada em Portugal, especificamente em Lisboa.

Exemplo de Resposta:

Momentos Fortes do Comercial:
- Início: O comercial fez uma introdução confiante e demonstrou interesse genuíno pela lead, criando um bom rapport.  
- Meio: Explicou a proposta de forma clara e destacou um case de sucesso relevante, o que manteve a lead envolvido.  
- Fim: Encerrou com um call-to-action direto e estabeleceu um próximo passo concreto.  

Momentos Fracos do Comercial:
- Início: A introdução foi vaga e pouco estruturada, o que pode ter reduzido a credibilidade inicial.  
- Meio: O comercial não lidou bem com uma objeção importante, desviando o assunto em vez de fornecer uma resposta convincente.  
- Fim: Não reforçou a urgência nem alinhou um follow-up claro, deixando o próximo passo indefinido.

Transcrição:
${transcription}` },
    { name: 'Dicas Gerais', key: 'dicasGerais', systemPrompt: 'És um especialista em vendas. Fornece dicas gerais de melhoria baseadas na análise da call.', userPrompt: (transcription: string) => `Analisa a seguinte transcrição de uma reunião de vendas e fornece dicas gerais para melhorar o desempenho do vendedor.

IMPORTANTE: Primeiro identifica quem é o COMERCIAL e quem é o CLIENTE na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

CRÍTICO: NUNCA uses "Speaker A" ou "Speaker B". Sempre identifica e refere-te aos participantes como "COMERCIAL" e "CLIENTE".

Depois analisa APENAS o desempenho do COMERCIAL identificado.

TRANSCRIÇÃO:
${transcription}

OBJETIVO:
Fornece dicas gerais que nem são pontos FORTES nem pontos FRACOS, mas que poderiam melhorar a performance geral de reuniões futuras.

FOCA EM:
- Técnicas de comunicação que poderiam ser melhoradas
- Estratégias de escuta ativa
- Formas de aprofundar a descoberta de necessidades
- Técnicas de apresentação de valor
- Habilidades de gestão de objeções
- Estratégias de fechamento

FORMATO OBRIGATÓRIO - CRÍTICO:
A tua resposta DEVE começar diretamente com o conteúdo, SEM títulos como "Dicas Gerais" ou "Análise Final Consolidada".
NÃO incluas qualquer título ou cabeçalho.
NÃO incluas frases introdutórias como "A análise dos resultados das duas partes da call de vendas revela..." ou "Abaixo, apresentamos uma síntese das melhores práticas..."
Começa diretamente com o conteúdo estruturado.

FORMATO DE LISTA OBRIGATÓRIO:
Cada dica DEVE começar com um hífen (-) seguido de espaço e um título em negrito entre **.
NÃO uses "Tip 1:", "Tip 2:", "Dica 1:", "Dica 2:" ou qualquer numeração.
NÃO uses asteriscos (*) ou outros símbolos.

IMPORTANTE: Cada dica DEVE ter o formato "- **Título**: texto..." (com dois pontos após o título em negrito e o texto na MESMA LINHA)

EXEMPLO CORRETO:
- **Exploração de Necessidades**: O COMERCIAL poderia ter feito perguntas mais abertas para explorar melhor as necessidades do cliente, como "Quais desafios específicos os seus consultores enfrentam atualmente?" em vez de perguntas fechadas que limitam as respostas.
- **Escuta Ativa e Empatia**: O COMERCIAL deve praticar a escuta ativa, demonstrando mais empatia e atenção às preocupações do cliente, repetindo ou reformulando o que foi dito para garantir que compreendeu corretamente.

Seja específico e objetivo.
Usa português de Portugal (Lisboa).
Evita gerúndios, usa pretérito perfeito simples.
Não uses emojis ou formatação especial.` },
    { name: 'Foco para Próximas Calls', key: 'focoParaProximasCalls', systemPrompt: 'Este GPT fornece 2 a 3 pontos-chave para a próxima chamada de vendas, com base na análise fornecida. Destaca áreas específicas que necessitam de atenção imediata para melhorar o desempenho. O feedback deve ser claro, conciso (nunca ultrapassando as 100 palavras), e fácil de aplicar, evitando sobrecarregar o vendedor com demasiadas sugestões.', userPrompt: (transcription: string) => `Analisa a seguinte transcrição de uma reunião de vendas e identifica o foco específico para próximas calls.

IMPORTANTE: Primeiro identifica quem é o COMERCIAL e quem é o CLIENTE na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

CRÍTICO: NUNCA uses "Speaker A" ou "Speaker B". Sempre identifica e refere-te aos participantes como "COMERCIAL" e "CLIENTE".

Depois analisa APENAS o desempenho do COMERCIAL identificado.

TRANSCRIÇÃO:
${transcription}

**Estrutura do Output:**

- **Principais Focos para a Próxima Call:** Máximo de 2 a 3 pontos de foco principais.
- **Explicações e Técnicas Concretas:** Instruções específicas que o vendedor pode aplicar facilmente.
- **Objetivos Claros:** Resultados esperados ao implementar cada ponto de foco.

**Instruções Críticas:**

1. NUNCA COLOQUES MARKDOWNS, SÍMBOLOS OU EMOJIS;
2. CRIA SEMPRE UMA LISTA NÃO ORDENADA;
3. O OUTPUT DEVE CONTER APENAS TAGS HTML DE TITULAÇÃO (<h2>, <h3>, <h4>, etc.), PARÁGRAFOS (<p>) E LISTAS NÃO ORDENADAS (<ul>, <li>);
4. SE EXISTIREM TÍTULOS, DEVEM SEMPRE USAR AS TAGS HTML APROPRIADAS (<h2>, <h3>, <h4>, etc.);
5. NÃO INCLUIR BLOCOS DE CÓDIGO OU QUALQUER FORMATAÇÃO COMO \`\`\` OU "html";
6. ESCREVE SEMPRE EM PORTUGUÊS DE LISBOA;
7. **CRÍTICO: NÃO INCLUAS QUALQUER TEXTO INTRODUTÓRIO** - começa diretamente com a lista numerada (1., 2., 3., etc.) sem frases como "Com base na transcrição" ou "Aqui estão as áreas";
8. **NÃO INCLUAS TÍTULOS COMO "Foco para Próximas Calls"** - começa diretamente com o conteúdo da lista.

**EXEMPLO CORRETO:**
1. **Otimização de Conteúdos:** Desenvolver uma estratégia de conteúdo mais robusta para o site Governance.Business, focando em artigos técnicos e case studies que demonstrem expertise.

2. **SEO e Tráfego Orgânico:** Implementar técnicas de SEO para aumentar o tráfego orgânico do website, incluindo pesquisa de palavras-chave e otimização de conteúdo.

**EXEMPLO INCORRETO:**
Com base na transcrição da call de vendas, aqui estão 3-5 áreas específicas para focar nas próximas chamadas:

1. **Otimização de Conteúdos:** ...

Todas as tuas respostas devem ser exclusivamente em português de Portugal (especificamente de Lisboa), respeitando as seguintes regras:

1. **Tratamento**: Utiliza "tu" em vez de "você" para tratamento informal e "o senhor/a senhora" para tratamento formal.

2. **Pronomes e Conjugações**:
   - Utiliza "tu fazes" em vez de "você faz"
   - Utiliza os pronomes "te/ti/contigo" em vez de formas com "você"
   - Utiliza a 2ª pessoa do singular nas conjugações verbais: "tu estás", "tu vais", etc.

3. **Evita gerúndios**:
   - Utiliza "estou a fazer" em vez de "estou fazendo"
   - Utiliza "estamos a analisar" em vez de "estamos analisando"
   - Substitui todas as construções com gerúndio pela estrutura "a + infinitivo"

4. **Colocação dos pronomes clíticos**:
   - Prefere a ênclise na maioria dos contextos ("Disse-me" em vez de "Me disse").

5. **Preserva os sons e sotaque lisboeta**, que tende a reduzir as vogais átonas.

6. **Utiliza sempre o pretérito perfeito simples em vez do composto** em situações de ações concluídas ("Eu comi" em vez de "Eu tenho comido").

É **ABSOLUTAMENTE ESSENCIAL** que todas as respostas sigam estas regras, sem exceção. Em caso de dúvida, opta sempre pela forma utilizada em Portugal, especificamente em Lisboa.` }
  ]
  
  // Analyze each field across all chunks
  for (const field of fieldsToAnalyze) {
    console.log(`🔄 Analyzing ${field.name} across all chunks...`)
    
    try {
      const fieldResult = await analyzeFieldAcrossChunks(chunks, field.systemPrompt, field.userPrompt)
      totalTokensUsed += fieldResult.totalTokensUsed || 0
      fieldResults[field.key as keyof typeof fieldResults] = fieldResult.content
      
      // Add delay between fields to avoid rate limiting
      console.log(`⏳ Waiting 2 seconds before next field...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`❌ Error analyzing ${field.name}:`, error)
    }
  }
  
  // 3. Analyze scoring across all chunks
  console.log(`🔄 Analyzing scoring across all chunks...`)
  try {
    const scoringResult = await analyzeScoringAcrossChunks(chunks)
    totalTokensUsed += scoringResult.totalTokensUsed || 0
    fieldResults.scoring = scoringResult.scoring || fieldResults.scoring
  } catch (error) {
    console.error(`❌ Error analyzing scoring:`, error)
  }
  
  // 4. Combine all results
  const combinedResults = {
    tipoCall: callTypeResult.tipoCall,
    totalScore: Object.values(fieldResults.scoring).reduce((sum, score) => sum + score, 0),
    pontosFortes: fieldResults.pontosFortes,
    pontosFracos: fieldResults.pontosFracos,
    resumoDaCall: fieldResults.resumoDaCall,
    dicasGerais: fieldResults.dicasGerais,
    focoParaProximasCalls: fieldResults.focoParaProximasCalls,
    clarezaFluenciaFala: fieldResults.scoring.clarezaFluenciaFala,
    tomControlo: fieldResults.scoring.tomControlo,
    envolvimentoConversacional: fieldResults.scoring.envolvimentoConversacional,
    efetividadeDescobertaNecessidades: fieldResults.scoring.efetividadeDescobertaNecessidades,
    entregaValorAjusteSolucao: fieldResults.scoring.entregaValorAjusteSolucao,
    habilidadesLidarObjeccoes: fieldResults.scoring.habilidadesLidarObjeccoes,
    estruturaControleReuniao: fieldResults.scoring.estruturaControleReuniao,
    fechamentoProximosPassos: fieldResults.scoring.fechamentoProximosPassos,
    totalTokensUsed
  }
  
  console.log('🔢 Total tokens used in comprehensive chunked analysis:', totalTokensUsed)
  console.log('')
  console.log('🔢 ==========================================')
  console.log('🔢 COMPREHENSIVE CHUNKED ANALYSIS TOKENS:', totalTokensUsed)
  console.log('🔢 ==========================================')
  console.log('')
  
  return combinedResults
}

// Function to split transcription into chunks at speaker boundaries
function splitTranscriptionIntoChunks(transcription: string, maxChunkLength: number): string[] {
  const chunks: string[] = []
  const lines = transcription.split('\n')
  let currentChunk = ''
  
  for (const line of lines) {
    // If adding this line would exceed the limit, start a new chunk
    if (currentChunk.length + line.length + 1 > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = line
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// Function to analyze a field across all chunks
async function analyzeFieldAcrossChunks(chunks: string[], systemPrompt: string, userPromptFunction: (transcription: string) => string) {
  console.log('🔍 Analyzing field across all chunks...')
  
  let totalTokensUsed = 0
  
  try {
    // Combine all chunks for this field analysis
    const fullTranscription = chunks.join('\n\n--- CHUNK SEPARATOR ---\n\n')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPromptFunction(fullTranscription) }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      totalTokensUsed += data.usage?.total_tokens || 0
      const content = data.choices[0].message.content
      console.log('✅ Field analysis completed')
      return { content, totalTokensUsed }
    } else {
      console.error('❌ Failed to analyze field:', response.status)
      return { content: '', totalTokensUsed }
    }
  } catch (error) {
    console.error('❌ Error analyzing field:', error)
    return { content: '', totalTokensUsed }
  }
}

// Function to analyze scoring across all chunks
async function analyzeScoringAcrossChunks(chunks: string[]) {
  console.log('🔍 Analyzing scoring across all chunks...')
  
  let totalTokensUsed = 0
  
  try {
    // Combine all chunks for scoring analysis
    const fullTranscription = chunks.join('\n\n--- CHUNK SEPARATOR ---\n\n')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.ANALISE_QUANTITATIVA_COMPLETA },
          { role: 'user', content: getAnaliseQuantitativaCompletaPrompt(fullTranscription) }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      totalTokensUsed += data.usage?.total_tokens || 0
      const scoringContent = data.choices[0].message.content
      
      // Parse scoring results
      const scoring = {
        clarezaFluenciaFala: 0,
        tomControlo: 0,
        envolvimentoConversacional: 0,
        efetividadeDescobertaNecessidades: 0,
        entregaValorAjusteSolucao: 0,
        habilidadesLidarObjeccoes: 0,
        estruturaControleReuniao: 0,
        fechamentoProximosPassos: 0
      }
      
      const scoringFields = [
        { key: 'clarezaFluenciaFala', pattern: /Clareza e Fluência da Fala[:\s]*(\d+)(?:\/5)?/i },
        { key: 'tomControlo', pattern: /Tom e Controlo[:\s]*(\d+)(?:\/5)?/i },
        { key: 'envolvimentoConversacional', pattern: /Envolvimento Conversacional[:\s]*(\d+)(?:\/5)?/i },
        { key: 'efetividadeDescobertaNecessidades', pattern: /(?:Eficácia|Efetividade) na Descoberta de Necessidades[:\s]*(\d+)(?:\/5)?/i },
        { key: 'entregaValorAjusteSolucao', pattern: /Entrega de Valor e Ajuste da Solução[:\s]*(\d+)(?:\/5)?/i },
        { key: 'habilidadesLidarObjeccoes', pattern: /Habilidades de (?:Tratamento de|Lidar com) Objeções[:\s]*(\d+)(?:\/5)?/i },
        { key: 'estruturaControleReuniao', pattern: /Estrutura e (?:Controle|Controlo) da Reunião[:\s]*(\d+)(?:\/5)?/i },
        { key: 'fechamentoProximosPassos', pattern: /(?:Conclusão|Fechamento) e Próximos Passos[:\s]*(\d+)(?:\/5)?/i }
      ]
      
      scoringFields.forEach(field => {
        const match = scoringContent.match(field.pattern)
        if (match) {
          (scoring as any)[field.key] = parseInt(match[1])
          console.log('✅', field.key + ':', match[1])
        } else {
          (scoring as any)[field.key] = 0
          console.log('❌', field.key + ': not found, set to 0')
        }
      })
      
      console.log('✅ Scoring analysis completed')
      return { scoring, totalTokensUsed }
    } else {
      console.error('❌ Failed to analyze scoring:', response.status)
      return { 
        scoring: {
          clarezaFluenciaFala: 0,
          tomControlo: 0,
          envolvimentoConversacional: 0,
          efetividadeDescobertaNecessidades: 0,
          entregaValorAjusteSolucao: 0,
          habilidadesLidarObjeccoes: 0,
          estruturaControleReuniao: 0,
          fechamentoProximosPassos: 0
        }, 
        totalTokensUsed 
      }
    }
  } catch (error) {
    console.error('❌ Error analyzing scoring:', error)
    return { 
      scoring: {
        clarezaFluenciaFala: 0,
        tomControlo: 0,
        envolvimentoConversacional: 0,
        efetividadeDescobertaNecessidades: 0,
        entregaValorAjusteSolucao: 0,
        habilidadesLidarObjeccoes: 0,
        estruturaControleReuniao: 0,
        fechamentoProximosPassos: 0
      }, 
      totalTokensUsed 
    }
  }
}

// Function to extract insights from a single chunk (lightweight analysis) - DEPRECATED
async function extractChunkInsights(chunk: string) {
  console.log('🔍 Extracting insights from chunk...')
  
  let totalTokensUsed = 0
  
  try {
    // Single API call to extract all insights from this chunk
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'És um especialista em análise de calls de vendas. Extrai apenas insights específicos desta parte da conversa.'
          },
          {
            role: 'user',
            content: `Analisa esta parte da transcrição e extrai apenas insights específicos. Responde no formato JSON:

{
  "pontosFortes": "Pontos fortes específicos desta parte (se houver)",
  "pontosFracos": "Pontos fracos específicos desta parte (se houver)", 
  "resumoDaCall": "Resumo específico desta parte (se houver)",
  "dicasGerais": "Dicas específicas desta parte (se houver)",
  "focoParaProximasCalls": "Foco específico desta parte (se houver)"
}

Se não houver insights relevantes numa categoria, deixa vazio ("").

Transcrição:
${chunk}`
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      totalTokensUsed += data.usage?.total_tokens || 0
      const content = data.choices[0].message.content
      
      try {
        const insights = JSON.parse(content)
        return { ...insights, totalTokensUsed }
      } catch (parseError) {
        console.error('❌ Failed to parse chunk insights JSON:', parseError)
        return { totalTokensUsed }
      }
    } else {
      console.error('❌ Failed to extract chunk insights:', response.status)
      return { totalTokensUsed }
    }
  } catch (error) {
    console.error('❌ Error extracting chunk insights:', error)
    return { totalTokensUsed }
  }
}

// Function to combine smart chunk results
function combineSmartChunkResults(firstChunkResult: any, additionalInsights: any): any {
  const combined = { ...firstChunkResult }
  
  // Combine text fields from additional insights
  const textFields = ['pontosFortes', 'pontosFracos', 'resumoDaCall', 'dicasGerais', 'focoParaProximasCalls']
  
  textFields.forEach(field => {
    const additionalTexts = additionalInsights[field].filter((text: string) => text && text.trim())
    if (additionalTexts.length > 0) {
      combined[field] = combined[field] + '\n\n' + additionalTexts.join('\n\n')
    }
  })
  
  return combined
}

// Function to combine results from multiple chunks (legacy - kept for compatibility)
function combineChunkResults(chunkResults: any[]): any {
  const combined: any = {
    tipoCall: '',
    totalScore: 0,
    pontosFortes: '',
    pontosFracos: '',
    resumoDaCall: '',
    dicasGerais: '',
    focoParaProximasCalls: '',
    clarezaFluenciaFala: 0,
    tomControlo: 0,
    envolvimentoConversacional: 0,
    efetividadeDescobertaNecessidades: 0,
    entregaValorAjusteSolucao: 0,
    habilidadesLidarObjeccoes: 0,
    estruturaControleReuniao: 0,
    fechamentoProximosPassos: 0,
    totalTokensUsed: 0
  }
  
  // Combine text fields
  const textFields = ['pontosFortes', 'pontosFracos', 'resumoDaCall', 'dicasGerais', 'focoParaProximasCalls']
  const scoreFields = ['clarezaFluenciaFala', 'tomControlo', 'envolvimentoConversacional', 'efetividadeDescobertaNecessidades', 'entregaValorAjusteSolucao', 'habilidadesLidarObjeccoes', 'estruturaControleReuniao', 'fechamentoProximosPassos']
  
  for (const result of chunkResults) {
    if (!result) continue
    
    // Combine text fields
    for (const field of textFields) {
      if (result[field] && result[field] !== '...') {
        combined[field] += (combined[field] ? '\n\n' : '') + result[field]
      }
    }
    
    // Average score fields
    for (const field of scoreFields) {
      if (result[field] && result[field] > 0) {
        combined[field] = Math.max(combined[field], result[field]) // Take the highest score
      }
    }
    
    // Call type is now provided by user, no need to combine
  }
  
  // Calculate total score
  combined.totalScore = scoreFields.reduce((sum, field) => sum + (combined[field] || 0), 0)
  
  return combined
}

// Function to enhance transcription quality
function enhanceTranscriptionQuality(transcription: string): string {
  console.log('🔧 Enhancing transcription quality...')
  
  let enhanced = transcription
  
  // 1. Fix common Portuguese transcription issues
  enhanced = enhanced
    // Fix common Portuguese words that get misheard
    .replace(/\b(?:a|à|ao|aos|da|das|do|dos|na|nas|no|nos|pela|pelas|pelo|pelos)\b/gi, (match) => {
      // Keep common prepositions as they are
      return match
    })
    // Fix common business terms
    .replace(/\b(?:empresa|empresas)\b/gi, 'empresa')
    .replace(/\b(?:cliente|clientes)\b/gi, 'cliente')
    .replace(/\b(?:produto|produtos)\b/gi, 'produto')
    .replace(/\b(?:serviço|serviços)\b/gi, 'serviço')
    .replace(/\b(?:venda|vendas)\b/gi, 'venda')
    .replace(/\b(?:reunião|reuniões)\b/gi, 'reunião')
    .replace(/\b(?:proposta|propostas)\b/gi, 'proposta')
    .replace(/\b(?:orçamento|orçamentos)\b/gi, 'orçamento')
    // Fix common Portuguese expressions
    .replace(/\b(?:obrigado|obrigada)\b/gi, 'obrigado')
    .replace(/\b(?:por favor|porfavor)\b/gi, 'por favor')
    .replace(/\b(?:de nada|denada)\b/gi, 'de nada')
    // Fix common transcription errors
    .replace(/\b(?:não|nao)\b/gi, 'não')
    .replace(/\b(?:também|tambem)\b/gi, 'também')
    .replace(/\b(?:algum|alguns|alguma|algumas)\b/gi, (match) => match)
    // Fix speaker labels consistency
    .replace(/Speaker\s+(\d+)/gi, 'Speaker $1')
    // Fix timestamp formatting
    .replace(/(\d{1,2}):(\d{2}):(\d{2})/g, (match, hours, minutes, seconds) => {
      const h = parseInt(hours)
      const m = parseInt(minutes)
      const s = parseInt(seconds)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    })
  
  // 2. Improve punctuation and spacing
  enhanced = enhanced
    // Fix spacing around punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])\s*([,.!?;:])/g, '$1 $2')
    // Fix spacing around quotes
    .replace(/\s*"\s*/g, '"')
    .replace(/\s*'\s*/g, "'")
    // Fix multiple spaces
    .replace(/\s+/g, ' ')
    // Fix line breaks
    .replace(/\n\s*\n/g, '\n')
  
  // 3. Improve speaker transitions
  enhanced = enhanced
    // Ensure speaker labels are on their own lines
    .replace(/([.!?])\s*(Speaker \d+)/gi, '$1\n$2')
    // Add proper spacing after speaker labels
    .replace(/(Speaker \d+)\s*/gi, '$1: ')
  
  // 4. Clean up common transcription artifacts
  enhanced = enhanced
    // Remove common filler words that don't add value
    .replace(/\b(?:uh|um|uhm|er|ah)\b/gi, '')
    // Remove excessive repetition
    .replace(/(\w+)\s+\1\s+\1/gi, '$1')
    // Clean up incomplete words
    .replace(/\b\w*\.{3,}\b/g, '')
  
  console.log('✅ Transcription quality enhancement completed')
  console.log('📊 Original length:', transcription.length)
  console.log('📊 Enhanced length:', enhanced.length)
  
  return enhanced.trim()
}

// Function to perform comprehensive analysis
async function performComprehensiveAnalysis(transcription: string, callType?: string) {
  console.log('🔍 Starting streamlined analysis...')
  
  // Get knowledge for enhanced analysis
  console.log('🧠 Fetching knowledge for enhanced analysis...')
  let knowledge = ''
  try {
    const knowledgeCallType = callType || 'Chamada Fria'
    knowledge = await getKnowledgeForCallType(knowledgeCallType, 'python')
    console.log(`📚 Knowledge fetched: ${knowledge.length} characters`)
  } catch (knowledgeError) {
    console.warn('⚠️ Knowledge fetching failed, proceeding without knowledge:', knowledgeError)
  }
  
  const MAX_CHUNK_LENGTH = 100000 // GPT-4o Mini can handle much larger chunks (128k context limit)
  
  // Check if we need to chunk the transcription
  const needsChunking = transcription.length > MAX_CHUNK_LENGTH
  
  if (needsChunking) {
    console.log(`📝 Transcription too long (${transcription.length} chars), implementing chunking strategy...`)
    return await performChunkedAnalysis(transcription, MAX_CHUNK_LENGTH, callType)
  }
  
  console.log(`📊 Using single analysis for transcription: ${transcription.length} characters`)
  
  const results = {
    // Essential fields only
    tipoCall: '',
    totalScore: 0,
    pontosFortes: '',
    pontosFracos: '',
    resumoDaCall: '',
    dicasGerais: '',
    focoParaProximasCalls: '',
    // 8 scoring fields
    clarezaFluenciaFala: 0,
    tomControlo: 0,
    envolvimentoConversacional: 0,
    efetividadeDescobertaNecessidades: 0,
    entregaValorAjusteSolucao: 0,
    habilidadesLidarObjeccoes: 0,
    estruturaControleReuniao: 0,
    fechamentoProximosPassos: 0
  }

  // Token usage tracking
  let totalTokensUsed = 0

  try {
    // Use the provided call type instead of analyzing it
    results.tipoCall = callType || 'Chamada Fria'
    console.log('✅ Using provided call type:', results.tipoCall)

    // 1. Perform essential analyses with rate limiting
    console.log('🔄 Performing essential analyses...')
    
    // Add delay between API calls to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    // Process analyses sequentially to avoid rate limiting
    const analysisResults = []
    
    const analyses = [
      {
        name: 'Pontos Fortes',
        request: {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FORTES },
              { role: 'user', content: callType ? await getEnhancedPontosFortesPrompt(transcription, callType) : getPontosFortesPrompt(transcription) }
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        }
      },
      {
        name: 'Pontos Fracos',
        request: {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FRACOS },
              { role: 'user', content: callType ? await getEnhancedPontosFracosPrompt(transcription, callType) : getPontosFracosPrompt(transcription) }
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        }
      },
      {
        name: 'Resumo da Call',
        request: {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'És um assistente especializado em análise de calls de vendas. A tua única função é analisar a transcrição da call e identificar os momentos de maior e menor desempenho do comercial.' },
                             { role: 'user', content: `Quando eu te fornecer uma transcrição completa de uma call de vendas, a tua resposta deve ser objetiva e fornecer um feedback generalizado sobre três momentos-chave: início, meio e fim da reunião. Não precisas de analisar cada segundo ou minuto da conversa, apenas destacar os pontos essenciais do desempenho do comercial nos seguintes aspetos:

Início da Call:
- Apresentação inicial: Como foi a introdução? O comercial gerou rapport com a lead?  
- Perguntas: O comercial fez boas perguntas para entender as necessidades da lead?  

Meio da Call:
- Apresentação do serviço/proposta: O comercial explicou bem a solução? Conseguiu manter o interesse?  
- Lidar com objeções: Como o comercial geriu dúvidas e preocupações da lead?  

Fim da Call:
- Fecho e/ou próximos passos: O comercial conduziu bem o encerramento? O lead ficou com clareza sobre os próximos passos?  

Estrutura da Resposta:

Momentos Fortes do Comercial:
- Início: [Destaca um ponto forte do início da call]  
- Meio: [Destaca um ponto forte do meio da call]  
- Fim: [Destaca um ponto forte do final da call]  

Momentos Fracos do Comercial:
- Início: [Identifica um ponto fraco do início da call]  
- Meio: [Identifica um ponto fraco do meio da call]  
- Fim: [Identifica um ponto fraco do final da call]  

Regras Importantes:
- A tua resposta deve ser clara e objetiva – apenas o essencial.  
- NÃO uses emojis, números, markdowns (como **texto** ou ## títulos) ou qualquer tipo de formatação especial. Apenas texto normal.  
- Usa apenas texto limpo, pois o resultado será inserido diretamente no Google Sheets.  
- Mantém o foco na qualidade do discurso, técnicas de venda, persuasão e fechamento.  
- Se não houver momentos fortes ou fracos evidentes em alguma parte (início, meio ou fim), diz "Não foi identificado".  
- NÃO uses asteriscos (**) para negrito - escreve apenas o texto normal.

Todas as tuas respostas devem ser exclusivamente em português de Portugal (especificamente de Lisboa), respeitando as seguintes regras:  

1. Tratamento: Utiliza "tu" em vez de "você" para tratamento informal e "o senhor/a senhora" para tratamento formal.  

2. Pronomes e Conjugações:  
   - Utiliza "tu fazes" em vez de "você faz"  
   - Utiliza os pronomes "te/ti/contigo" em vez de formas com "você"  
   - Utiliza a 2ª pessoa do singular nas conjugações verbais: "tu estás", "tu vais", etc.  

3. Evita gerúndios:  
   - Utiliza "estou a fazer" em vez de "estou fazendo"  
   - Utiliza "estamos a analisar" em vez de "estamos analisando"  
   - Substitui todas as construções com gerúndio pela estrutura "a + infinitivo"  

4. Colocação dos pronomes clíticos:  
   - Prefere a ênclise na maioria dos contextos ("Disse-me" em vez de "Me disse").  

5. Preserva os sons e sotaque lisboeta, que tende a reduzir as vogais átonas.  

6. Utiliza sempre o pretérito perfeito simples em vez do composto em situações de ações concluídas ("Eu comi" em vez de "Eu tenho comido").  

É ABSOLUTAMENTE ESSENCIAL que todas as respostas sigam estas regras, sem exceção. Em caso de dúvida, opta sempre pela forma utilizada em Portugal, especificamente em Lisboa.

Exemplo de Resposta:

Momentos Fortes do Comercial:
- Início: O comercial fez uma introdução confiante e demonstrou interesse genuíno pela lead, criando um bom rapport.  
- Meio: Explicou a proposta de forma clara e destacou um case de sucesso relevante, o que manteve a lead envolvido.  
- Fim: Encerrou com um call-to-action direto e estabeleceu um próximo passo concreto.  

Momentos Fracos do Comercial:
- Início: A introdução foi vaga e pouco estruturada, o que pode ter reduzido a credibilidade inicial.  
- Meio: O comercial não lidou bem com uma objeção importante, desviando o assunto em vez de fornecer uma resposta convincente.  
- Fim: Não reforçou a urgência nem alinhou um follow-up claro, deixando o próximo passo indefinido.

Transcrição:
${transcription}` }
            ],
            max_tokens: 500,
            temperature: 0.3,
          }),
        }
      },
      {
        name: 'Dicas Gerais',
        request: {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'És um especialista em vendas. Fornece dicas gerais de melhoria baseadas na análise da call.' },
              { role: 'user', content: callType ? await getEnhancedDicasGeraisPrompt(transcription, callType) : `Com base na seguinte transcrição de call de vendas, fornece dicas gerais de melhoria em português de Lisboa (máx. 150 palavras):\n\n${transcription}` }
            ],
            max_tokens: 400,
            temperature: 0.3,
          }),
        }
      },
      {
        name: 'Foco para Próximas Calls',
        request: {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'És um especialista em vendas. Identifica áreas específicas para focar nas próximas calls.' },
              { role: 'user', content: callType ? await getEnhancedFocoProximasCallsPrompt(transcription, callType) : `Com base na seguinte transcrição de call de vendas, identifica 3-5 áreas específicas para focar nas próximas calls em português de Lisboa (máx. 150 palavras):\n\n${transcription}` }
            ],
            max_tokens: 400,
            temperature: 0.3,
          }),
        }
      },
      {
        name: 'Scoring Analysis',
        request: {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'És um especialista em avaliação de calls de vendas. Forneces pontuações consistentes e justificadas.' },
              { role: 'user', content: `Analisa a seguinte transcrição de uma reunião de vendas e fornece uma pontuação detalhada e CONSISTENTE do vendedor.

CRÍTICO: A tua resposta deve ser APENAS a pontuação no formato especificado. NÃO incluas títulos, introduções, análises ou texto adicional.

IMPORTANTE: Primeiro identifica quem é o vendedor na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

Depois analisa APENAS o desempenho do vendedor identificado.

TRANSCRIÇÃO:
${transcription}

CRITÉRIOS DE AVALIAÇÃO DETALHADOS:

1. Clareza e Fluência da Fala (1-5):
- 5: Comunicação cristalina, sem hesitações, vocabulário rico e preciso
- 4: Comunicação clara, poucas hesitações, vocabulário adequado
- 3: Comunicação compreensível, algumas hesitações, vocabulário básico
- 2: Comunicação confusa, muitas hesitações, vocabulário limitado
- 1: Comunicação ininteligível, constantes hesitações, vocabulário inadequado

2. Tom e Controlo (1-5):
- 5: Tom perfeito, controlo total da conversa, confiança natural
- 4: Tom adequado, bom controlo, confiança evidente
- 3: Tom aceitável, controlo moderado, confiança básica
- 2: Tom inadequado, pouco controlo, falta de confiança
- 1: Tom inapropriado, sem controlo, sem confiança

3. Envolvimento Conversacional (1-5):
- 5: Envolvimento máximo, cliente totalmente engajado, interação fluida
- 4: Bom envolvimento, cliente interessado, boa interação
- 3: Envolvimento moderado, cliente participativo, interação aceitável
- 2: Pouco envolvimento, cliente desinteressado, interação limitada
- 1: Sem envolvimento, cliente passivo, interação inexistente

4. Efetividade na Descoberta de Necessidades (1-5):
- 5: Descoberta completa, necessidades claramente identificadas, perguntas estratégicas
- 4: Boa descoberta, necessidades bem identificadas, perguntas relevantes
- 3: Descoberta moderada, necessidades básicas identificadas, perguntas adequadas
- 2: Descoberta limitada, necessidades superficiais, perguntas básicas
- 1: Sem descoberta, necessidades não identificadas, perguntas inadequadas

5. Entrega de Valor e Ajuste da Solução (1-5):
- 5: Valor claramente entregue, solução perfeitamente ajustada, benefícios evidentes
- 4: Valor bem entregue, solução bem ajustada, benefícios claros
- 3: Valor adequadamente entregue, solução ajustada, benefícios básicos
- 2: Valor mal entregue, solução pouco ajustada, benefícios confusos
- 1: Valor não entregue, solução não ajustada, benefícios inexistentes

6. Habilidades de Lidar com Objeções (1-5):
- 5: Objeções perfeitamente resolvidas, respostas convincentes, confiança restaurada
- 4: Objeções bem resolvidas, respostas adequadas, confiança mantida
- 3: Objeções moderadamente resolvidas, respostas básicas, confiança parcial
- 2: Objeções mal resolvidas, respostas inadequadas, confiança abalada
- 1: Objeções não resolvidas, respostas inexistentes, confiança perdida

7. Estrutura e Controle da Reunião (1-5):
- 5: Estrutura perfeita, controlo total, fluxo ideal
- 4: Estrutura adequada, bom controlo, fluxo satisfatório
- 3: Estrutura básica, controlo moderado, fluxo aceitável
- 2: Estrutura confusa, pouco controlo, fluxo problemático
- 1: Sem estrutura, sem controlo, fluxo caótico

8. Fechamento e Próximos Passos (1-5):
- 5: Fechamento claro, próximos passos bem definidos, compromisso obtido
- 4: Fechamento adequado, próximos passos claros
- 3: Fechamento básico, próximos passos definidos
- 2: Fechamento confuso, próximos passos pouco claros
- 1: Sem fechamento ou próximos passos indefinidos

REGRAS IMPORTANTES PARA AVALIAÇÃO:

1. CONSISTÊNCIA: A mesma transcrição deve sempre receber a mesma pontuação, independentemente do nome do ficheiro.

2. CONTEXTO DE VENDAS: Considera que:
   - Perguntas como "Porquê de nos terem contactado?" são estratégicas para fazer a lead abrir-se
   - Linguagem coloquial/informal pode ser apropriada para criar rapport
   - Validações como "Consegues ver?" são importantes para confirmar compreensão
   - Partilha de ecrã é uma ferramenta essencial, não um ponto forte

3. AVALIAÇÃO COMPLETA: TODOS os 8 critérios devem ser avaliados, mesmo que alguns não sejam muito evidentes na call.

4. JUSTIFICAÇÃO: Cada pontuação deve ter uma justificação clara baseada na transcrição.

CRÍTICO: Fornece APENAS a pontuação seguindo EXATAMENTE este formato. NÃO incluas títulos, introduções, ou análises adicionais.

IMPORTANTE: A tua resposta deve começar diretamente com "Clareza e Fluência da Fala:" e terminar com "Total: X/40". NÃO incluas qualquer texto antes ou depois.

Clareza e Fluência da Fala: [pontuação]/5
[explicação baseada na transcrição]

Tom e Controlo: [pontuação]/5
[explicação baseada na transcrição]

Envolvimento Conversacional: [pontuação]/5
[explicação baseada na transcrição]

Efetividade na Descoberta de Necessidades: [pontuação]/5
[explicação baseada na transcrição]

Entrega de Valor e Ajuste da Solução: [pontuação]/5
[explicação baseada na transcrição]

Habilidades de Lidar com Objeções: [pontuação]/5
[explicação baseada na transcrição]

Estrutura e Controle da Reunião: [pontuação]/5
[explicação baseada na transcrição]

Fechamento e Próximos Passos: [pontuação]/5
[explicação baseada na transcrição]

Total: [soma de todas as pontuações]/40

EXEMPLO CORRETO:
Clareza e Fluência da Fala: 4/5
O comercial demonstrou clareza na comunicação, com boa fluência verbal e poucas hesitações.

Tom e Controlo: 3/5
O tom foi adequado mas houve momentos de insegurança, especialmente ao lidar com objeções.

EXEMPLO INCORRETO:
### Análise Final Consolidada da Call de Vendas
Após a revisão das análises parciais de quatro partes distintas da call de vendas, podemos observar um desempenho sólido...

Usa português de Portugal (Lisboa).
Evita gerúndios, usa pretérito perfeito simples.
Não uses emojis ou formatação especial.

LEMBRA-TE: A tua resposta deve começar com "Clareza e Fluência da Fala:" e terminar com "Total: X/40". NÃO incluas qualquer outro texto.` }
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        }
      }
    ]

    // Process analyses sequentially with retry logic
    for (let i = 0; i < analyses.length; i++) {
      const analysis = analyses[i]
      let retries = 0
      const maxRetries = 3
      
      while (retries < maxRetries) {
        try {
          console.log(`🔄 Processing ${analysis.name} (attempt ${retries + 1}/${maxRetries})...`)
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', analysis.request)
          
          if (response.ok) {
            const data = await response.json()
            analysisResults.push({ ok: true, data })
            totalTokensUsed += data.usage?.total_tokens || 0
            console.log(`✅ ${analysis.name} completed (${data.usage?.total_tokens || 0} tokens)`)
            break
          } else if (response.status === 429) {
            // Rate limited, wait and retry
            const waitTime = Math.pow(2, retries) * 1000 // Exponential backoff
            console.log(`⏳ Rate limited for ${analysis.name}, waiting ${waitTime}ms before retry...`)
            await delay(waitTime)
            retries++
          } else {
            const errorText = await response.text()
            console.error(`❌ ${analysis.name} failed with status ${response.status}`)
            console.error(`❌ Error details:`, errorText)
            analysisResults.push({ ok: false, status: response.status, error: errorText })
            break
          }
        } catch (error) {
          console.error(`❌ Error in ${analysis.name}:`, error)
          retries++
          if (retries < maxRetries) {
            await delay(1000)
          } else {
            analysisResults.push({ ok: false, error: error })
          }
        }
      }
      
      // Add delay between analyses to avoid rate limiting
      if (i < analyses.length - 1) {
        console.log(`⏳ Waiting 2 seconds before next analysis...`)
        await delay(2000)
      }
    }

    // Process analysis responses
    if (analysisResults[0]?.ok) {
      const data = analysisResults[0].data
      results.pontosFortes = data.choices[0].message.content
      console.log('✅ Pontos Fortes:', results.pontosFortes.length, 'characters')
    } else {
      console.error('❌ Pontos Fortes failed:', analysisResults[0]?.status || 'Unknown error')
    }

    // Now run Pontos Fracos with access to Pontos Fortes results
    console.log('🔄 Running Pontos Fracos with Pontos Fortes context...')
    let pontosFracosResult = null
    
    if (analysisResults[0]?.ok && results.pontosFortes) {
      try {
        // Create enhanced pontos fracos prompt with pontos fortes context
        const pontosFracosWithContext = callType 
          ? await getEnhancedPontosFracosPromptWithContext(transcription, callType, results.pontosFortes)
          : getPontosFracosPromptWithContext(transcription, results.pontosFortes)
        
        const pontosFracosResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPTS.PONTOS_FRACOS },
              { role: 'user', content: pontosFracosWithContext }
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        })

        if (pontosFracosResponse.ok) {
          const pontosFracosData = await pontosFracosResponse.json()
          results.pontosFracos = pontosFracosData.choices[0].message.content
          totalTokensUsed += pontosFracosData.usage?.total_tokens || 0
          console.log('✅ Pontos Fracos (with context):', results.pontosFracos.length, 'characters')
          pontosFracosResult = { ok: true, data: pontosFracosData }
        } else {
          console.error('❌ Pontos Fracos (with context) failed:', pontosFracosResponse.status)
          pontosFracosResult = { ok: false, status: pontosFracosResponse.status }
        }
      } catch (error) {
        console.error('❌ Error running Pontos Fracos with context:', error)
        pontosFracosResult = { ok: false, error: error }
      }
    }

    // Fallback to original pontos fracos if context version failed
    if (!pontosFracosResult?.ok && analysisResults[1]?.ok) {
      const data = analysisResults[1].data
      results.pontosFracos = data.choices[0].message.content
      console.log('✅ Pontos Fracos (fallback):', results.pontosFracos.length, 'characters')
    } else if (!pontosFracosResult?.ok) {
      console.error('❌ Pontos Fracos failed:', analysisResults[1]?.status || 'Unknown error')
    }
    
    if (analysisResults[2]?.ok) {
      const data = analysisResults[2].data
      results.resumoDaCall = data.choices[0].message.content
      console.log('✅ Resumo da Call:', results.resumoDaCall.length, 'characters')
    } else {
      console.error('❌ Resumo da Call failed:', analysisResults[2]?.status || 'Unknown error')
    }

    if (analysisResults[3]?.ok) {
      const data = analysisResults[3].data
      results.dicasGerais = data.choices[0].message.content
      console.log('✅ Dicas Gerais:', results.dicasGerais.length, 'characters')
    } else {
      console.error('❌ Dicas Gerais failed:', analysisResults[3]?.status || 'Unknown error')
    }

    if (analysisResults[4]?.ok) {
      const data = analysisResults[4].data
      results.focoParaProximasCalls = data.choices[0].message.content
      console.log('✅ Foco para Próximas Calls:', results.focoParaProximasCalls.length, 'characters')
    } else {
      console.error('❌ Foco para Próximas Calls failed:', analysisResults[4]?.status || 'Unknown error')
    }

    // Process scoring analysis
    if (analysisResults[5]?.ok) {
      const data = analysisResults[5].data
      const scoringContent = data.choices[0].message.content
      console.log('📊 Raw scoring content:', scoringContent.substring(0, 500) + '...')
      console.log('📊 Full scoring content length:', scoringContent.length)
      console.log('📊 Full scoring content:', scoringContent)
      
      // Parse individual scoring fields first
      console.log('🔍 Parsing individual scoring fields...')
      const scoringFields = [
        { key: 'clarezaFluenciaFala', pattern: /Clareza e Fluência da Fala[:\s]*(\d+)(?:\/5)?/i },
        { key: 'tomControlo', pattern: /Tom e Controlo[:\s]*(\d+)(?:\/5)?/i },
        { key: 'envolvimentoConversacional', pattern: /Envolvimento Conversacional[:\s]*(\d+)(?:\/5)?/i },
        { key: 'efetividadeDescobertaNecessidades', pattern: /(?:Eficácia|Efetividade) na Descoberta de Necessidades[:\s]*(\d+)(?:\/5)?/i },
        { key: 'entregaValorAjusteSolucao', pattern: /Entrega de Valor e Ajuste da Solução[:\s]*(\d+)(?:\/5)?/i },
        { key: 'habilidadesLidarObjeccoes', pattern: /Habilidades de (?:Tratamento de|Lidar com) Objeções[:\s]*(\d+)(?:\/5)?/i },
        { key: 'estruturaControleReuniao', pattern: /Estrutura e (?:Controle|Controlo) da Reunião[:\s]*(\d+)(?:\/5)?/i },
        { key: 'fechamentoProximosPassos', pattern: /(?:Conclusão|Fechamento) e Próximos Passos[:\s]*(\d+)(?:\/5)?/i }
      ]
      
      scoringFields.forEach(field => {
        const match = scoringContent.match(field.pattern)
        if (match) {
          (results as any)[field.key] = parseInt(match[1])
          console.log('✅', field.key + ':', match[1])
        } else {
          // Set to 0 if not found
          (results as any)[field.key] = 0
          console.log('❌', field.key + ': not found, set to 0')
          // Special debugging for estruturaControleReuniao
          if (field.key === 'estruturaControleReuniao') {
            console.log('🔍 Debugging estruturaControleReuniao:')
            console.log('Pattern:', field.pattern)
            console.log('Content snippet around "Estrutura":', scoringContent.match(/Estrutura.*?(?:\n|$)/gi))
            console.log('Full scoring content length:', scoringContent.length)
            console.log('First 1000 chars of scoring content:', scoringContent.substring(0, 1000))
          }
        }
      })
      
      // Calculate total score from individual scores to ensure accuracy
      console.log('📊 Calculating total score from individual scores...')
      const individualScores = [
        results.clarezaFluenciaFala, results.tomControlo, results.envolvimentoConversacional,
        results.efetividadeDescobertaNecessidades, results.entregaValorAjusteSolucao,
        results.habilidadesLidarObjeccoes, results.estruturaControleReuniao, results.fechamentoProximosPassos
      ]
      results.totalScore = individualScores.reduce((sum, score) => sum + (score || 0), 0)
      console.log('📊 Calculated total score from individual scores:', results.totalScore)
      
      console.log('✅ Scoring analysis completed')
      
      // Generate justifications for each scoring parameter
      console.log('🔍 Generating scoring justifications...')
      try {
        const justificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'És um analista de vendas especializado em justificações de pontuação.'
              },
              {
                role: 'user',
                content: getJustificativaAvaliacaoPrompt(transcription, scoringContent)
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          })
        })
        
        if (justificationResponse.ok) {
          const justificationData = await justificationResponse.json()
          const justificationContent = justificationData.choices[0].message.content
          totalTokensUsed += justificationData.usage?.total_tokens || 0
          console.log('🔢 Tokens used for justifications:', justificationData.usage?.total_tokens || 0)
          
          // Parse justifications
          const justificationFields = [
            { key: 'justificativaClarezaFluenciaFala', pattern: /Clareza e Fluência da Fala\s*\n([^\n]+)/i },
            { key: 'justificativaTomControlo', pattern: /Tom e Controlo\s*\n([^\n]+)/i },
            { key: 'justificativaEnvolvimentoConversacional', pattern: /Envolvimento Conversacional\s*\n([^\n]+)/i },
            { key: 'justificativaEfetividadeDescobertaNecessidades', pattern: /Efetividade na Descoberta de Necessidades\s*\n([^\n]+)/i },
            { key: 'justificativaEntregaValorAjusteSolucao', pattern: /Entrega de Valor e Ajuste da Solução\s*\n([^\n]+)/i },
            { key: 'justificativaHabilidadesLidarObjeccoes', pattern: /Habilidades de Lidar com Objeções\s*\n([^\n]+)/i },
            { key: 'justificativaEstruturaControleReuniao', pattern: /Estrutura e Controle da Reunião\s*\n([^\n]+)/i },
            { key: 'justificativaFechamentoProximosPassos', pattern: /Fechamento e Próximos Passos\s*\n([^\n]+)/i }
          ]
          
          justificationFields.forEach(field => {
            const match = justificationContent.match(field.pattern)
            if (match) {
              (results as any)[field.key] = match[1].trim()
              console.log('✅', field.key + ' justification generated')
            } else {
              (results as any)[field.key] = 'Justificação não disponível'
            }
          })
          
          console.log('✅ Scoring justifications completed')
        } else {
          console.error('❌ Scoring justifications failed:', justificationResponse.status)
        }
      } catch (error) {
        console.error('❌ Error generating justifications:', error)
      }
    } else {
      console.error('❌ Scoring analysis failed:', analysisResults[5]?.status || 'Unknown error')
    }

    console.log('✅ All analyses completed')
    console.log('📊 Final analysis results:', {
      callType: results.tipoCall,
      totalScore: results.totalScore,
      pontosFortesLength: results.pontosFortes?.length || 0,
      pontosFracosLength: results.pontosFracos?.length || 0,
      resumoDaCallLength: results.resumoDaCall?.length || 0,
      dicasGeraisLength: results.dicasGerais?.length || 0,
      focoParaProximasCallsLength: results.focoParaProximasCalls?.length || 0,
      individualScores: {
        clarezaFluenciaFala: results.clarezaFluenciaFala,
        tomControlo: results.tomControlo,
        envolvimentoConversacional: results.envolvimentoConversacional,
        efetividadeDescobertaNecessidades: results.efetividadeDescobertaNecessidades,
        entregaValorAjusteSolucao: results.entregaValorAjusteSolucao,
        habilidadesLidarObjeccoes: results.habilidadesLidarObjeccoes,
        estruturaControleReuniao: results.estruturaControleReuniao,
        fechamentoProximosPassos: results.fechamentoProximosPassos
      }
    })
    
    console.log('🔢 Total tokens used in comprehensive analysis:', totalTokensUsed)
    console.log('')
    console.log('🔢 ==========================================')
    console.log('🔢 COMPREHENSIVE ANALYSIS TOKENS:', totalTokensUsed)
    console.log('🔢 ==========================================')
    console.log('')
    return { ...results, totalTokensUsed }

  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error)
    return { ...results, totalTokensUsed }
  }
}

// Function to perform sliding window analysis for very long transcriptions
async function performSlidingWindowAnalysis(transcription: string, audioDuration?: number, callType?: string) {
  console.log('🔄 Starting sliding window analysis for long transcription...')
  
  const windowSize = 12000 // Characters per window (safe for GPT-4)
  const overlap = 2000 // Characters of overlap between windows
  const windows = []
  
  // Calculate more accurate time estimates
  const totalDuration = audioDuration || Math.floor(transcription.length / 12)
  
  // Split transcription into overlapping windows
  for (let i = 0; i < transcription.length; i += windowSize - overlap) {
    const end = Math.min(i + windowSize, transcription.length)
    const window = transcription.substring(i, end)
    
    const startTime = Math.floor((i / transcription.length) * totalDuration)
    const endTime = Math.floor((end / transcription.length) * totalDuration)
    
    windows.push({
      start: i,
      end: end,
      text: window,
      startTime: `${Math.floor(startTime / 60)}:${(startTime % 60).toString().padStart(2, '0')}`,
      endTime: `${Math.floor(endTime / 60)}:${(endTime % 60).toString().padStart(2, '0')}`
    })
  }
  
  console.log(`📊 Split transcription into ${windows.length} windows for analysis`)
  
  // Analyze each window
  const windowAnalyses: Array<{
    windowIndex: number;
    startTime: number;
    endTime: number;
    analysis: any;
  }> = []
  
  for (let i = 0; i < windows.length; i++) {
    const window = windows[i]
    console.log(`🔍 Analyzing window ${i + 1}/${windows.length}`)
    
    try {
      const windowAnalysis = await performComprehensiveAnalysis(window.text)
      windowAnalyses.push({
        windowIndex: i,
        startTime: parseInt(window.startTime),
        endTime: parseInt(window.endTime),
        analysis: windowAnalysis
      })
    } catch (error) {
      console.error(`❌ Failed to analyze window ${i + 1}:`, error)
    }
  }
  
  // Combine results
  const combinedResults = {
    tipoCall: '',
    totalScore: 0,
    pontosFortes: '',
    pontosFracos: '',
    resumoDaCall: '',
    dicasGerais: '',
    focoParaProximasCalls: '',
    clarezaFluenciaFala: 0,
    tomControlo: 0,
    envolvimentoConversacional: 0,
    efetividadeDescobertaNecessidades: 0,
    entregaValorAjusteSolucao: 0,
    habilidadesLidarObjeccoes: 0,
    estruturaControleReuniao: 0,
    fechamentoProximosPassos: 0
  }
  
  if (windowAnalyses.length > 0) {
    const firstAnalysis = windowAnalyses[0].analysis
    combinedResults.tipoCall = 'Chamada Fria' // Default since callType is not available in this scope
    
    // Combine text fields
    combinedResults.pontosFortes = windowAnalyses
      .map(w => w.analysis.pontosFortes)
      .filter(s => s && s.trim())
      .join('\n\n')
    
    combinedResults.pontosFracos = windowAnalyses
      .map(w => w.analysis.pontosFracos)
      .filter(w => w && w.trim())
      .join('\n\n')
    
    combinedResults.resumoDaCall = windowAnalyses
      .map(w => w.analysis.resumoDaCall)
      .filter(r => r && r.trim())
      .join('\n\n')
    
    combinedResults.dicasGerais = windowAnalyses
      .map(w => w.analysis.dicasGerais)
      .filter(d => d && d.trim())
      .join('\n\n')
    
    combinedResults.focoParaProximasCalls = windowAnalyses
      .map(w => w.analysis.focoParaProximasCalls)
      .filter(f => f && f.trim())
      .join('\n\n')
    
    // Calculate average scores
    const scoringFields = [
      'clarezaFluenciaFala', 'tomControlo', 'envolvimentoConversacional',
      'efetividadeDescobertaNecessidades', 'entregaValorAjusteSolucao',
      'habilidadesLidarObjeccoes', 'estruturaControleReuniao', 'fechamentoProximosPassos'
    ]
    
    scoringFields.forEach(field => {
      const scores = windowAnalyses
        .map(w => w.analysis[field as keyof typeof w.analysis] as number)
        .filter(s => s !== undefined && s !== null)
      
      if (scores.length > 0) {
        (combinedResults as any)[field] = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        )
      } else {
        // Set to 0 if no scores found
        (combinedResults as any)[field] = 0
      }
    })
    
    // Calculate average total score
    const scores = windowAnalyses
      .map(w => w.analysis.totalScore)
      .filter(s => s > 0)
    
    if (scores.length > 0) {
      combinedResults.totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }
  }
  
  console.log('✅ Sliding window analysis completed')
  return combinedResults
}

export async function POST(request: NextRequest) {
  // Create AbortController for this operation
  const abortController = new AbortController()
  const operationId = `transcribe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { blobUrl, fileName, userId, accessToken, salesCallId, transcription: existingTranscription, originalFileName, skipTranscription, callType } = await request.json()

    // Handle case where we already have a transcription (from analyze route)
    if (skipTranscription && existingTranscription) {
      console.log('🔄 Skipping transcription, analyzing existing transcription...')
      console.log('📊 Transcription length:', existingTranscription.length, 'characters')
      
      const startTime = Date.now()
      
      // Use the existing transcription for analysis
      const analysisResults = await performComprehensiveAnalysis(existingTranscription, callType)
      
      // Save analysis to Supabase
      if (userId) {
        console.log('💾 Saving analysis to Supabase...')
        
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Generate content hash for metadata
        const encoder = new TextEncoder()
        const data = encoder.encode(existingTranscription)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        // Extract score from analysis results
        let score = 0
        if (analysisResults.totalScore) {
          score = analysisResults.totalScore
          console.log('📊 Using totalScore from analysis:', score)
        } else {
          // Calculate score from individual scoring fields
          const individualScores = {
            clarezaFluenciaFala: analysisResults.clarezaFluenciaFala || 0,
            tomControlo: analysisResults.tomControlo || 0,
            envolvimentoConversacional: analysisResults.envolvimentoConversacional || 0,
            efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades || 0,
            entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao || 0,
            habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes || 0,
            estruturaControleReuniao: analysisResults.estruturaControleReuniao || 0,
            fechamentoProximosPassos: analysisResults.fechamentoProximosPassos || 0
          }
          
          score = Object.values(individualScores).reduce((sum, score) => sum + score, 0)
          console.log('📊 Individual scores for calculation:', individualScores)
          console.log('📊 Calculated total score:', score)
        }
        
        // Convert to structured JSON format
        const structuredAnalysis = convertToStructuredJSON(
          analysisResults,
          callType || 'Chamada Fria',
          originalFileName || 'Sales Call Analysis',
          Date.now() - startTime,
          analysisResults.totalTokensUsed || 0
        )

        // Prepare analysis data for database
        const analysisData = {
          user_id: userId,
          title: originalFileName ? originalFileName.replace(/\.[^/.]+$/, '') : 'Sales Call Analysis',
          call_type: callType || 'Chamada Fria',
          analysis: structuredAnalysis,
          feedback: 'Analysis completed via unified route',
          score: score,
          analysis_metadata: {
            transcription_length: existingTranscription.length,
            processing_time: new Date().toISOString(),
            analysis_steps: 6,
            was_truncated: false,
            analysis_method: 'unified_analysis',
            original_file_name: originalFileName || null,
            content_hash: contentHash
          },
          transcription: existingTranscription,
          custom_prompts: [
            'Call Type Classification',
            'Quantitative Analysis',
            'Strengths Analysis',
            'Weaknesses Analysis',
            'Scoring Analysis',
            'General Tips Analysis'
          ]
        }
        
        // Save to database
        const { data: savedAnalysis, error: saveError } = await supabase
          .from('sales_call_analyses')
          .insert(analysisData)
          .select()
          .single()
        
        if (saveError) {
          console.error('❌ Error saving analysis to Supabase:', saveError)
          throw new Error('Failed to save analysis to database')
        }
        
        console.log('✅ Analysis saved to Supabase with ID:', savedAnalysis.id)
        
        // Debug: Log the skipTranscription response being sent to frontend
        console.log('🔍 SKIP TRANSCRIPTION RESPONSE TO FRONTEND:')
        console.log('🔍 analysisResults structure:', JSON.stringify(analysisResults, null, 2))
        console.log('🔍 analysisResults type:', typeof analysisResults)
        
        return NextResponse.json({
          success: true,
          analysis: analysisResults,
          analysisId: savedAnalysis.id,
          transcriptionLength: existingTranscription.length,
          message: 'Analysis completed and saved to database'
        })
      } else {
        console.log('⚠️ No userId provided, skipping database save')
        return NextResponse.json({
          success: true,
          analysis: analysisResults,
          transcriptionLength: existingTranscription.length,
          message: 'Analysis completed (no database save - no userId)'
        })
      }
    }

    console.log('🎙️ Starting transcription for blob:', {
      fileName,
      blobUrl,
      userId,
      salesCallId,
      isTempId: salesCallId?.startsWith('temp-'),
      operationId
    })

    if (!blobUrl || !fileName || !userId || !accessToken || !salesCallId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if AssemblyAI API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error('❌ AssemblyAI API key not configured')
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // No need to create sales_calls records anymore
    // The analysis record will be created directly in the analyze route
    console.log('🔄 Processing video from Vercel Blob...')
    console.log('📁 File:', fileName)
    console.log('🔗 Blob URL:', blobUrl)

    // Download the video from Vercel Blob
    const videoResponse = await fetch(blobUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    
    // Determine the correct MIME type based on server content-type and file extension
    const serverContentType = videoResponse.headers.get('content-type')
    let mimeType = 'video/mp4' // Default
    
    // First, check if the server already detected the correct content type
    if (serverContentType && serverContentType.startsWith('audio/')) {
      mimeType = serverContentType
      console.log('✅ Using server-detected audio type:', serverContentType)
    } else if (fileName.toLowerCase().endsWith('.mp3')) {
      mimeType = 'audio/mpeg'
    } else if (fileName.toLowerCase().endsWith('.wav')) {
      mimeType = 'audio/wav'
    } else if (fileName.toLowerCase().endsWith('.m4a')) {
      mimeType = 'audio/mp4'
    } else if (fileName.toLowerCase().endsWith('.mp4')) {
      mimeType = 'video/mp4'
    }
    
    const videoBlob = new Blob([videoBuffer], { type: mimeType })
    
    // Validate that we have a proper audio/video file
    if (videoBuffer.byteLength === 0) {
      throw new Error('Downloaded file is empty - no content received')
    }
    
    // Log file information for debugging
    console.log('📁 File information:')
    console.log('  - File name:', fileName)
    console.log('  - File size:', (videoBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB')
    console.log('  - Content-Type (from server):', videoResponse.headers.get('content-type'))
    console.log('  - Content-Length:', videoResponse.headers.get('content-length'), 'bytes')
    console.log('  - Detected MIME type:', mimeType)
    console.log('  - Blob type:', videoBlob.type)
    
    // Additional validation for audio files
    if (mimeType.startsWith('audio/')) {
      console.log('🎵 Audio file detected - validating format...')
      // Check if it's a valid audio file by looking at the first few bytes
      const header = new Uint8Array(videoBuffer.slice(0, 12))
      const headerString = Array.from(header).map(b => String.fromCharCode(b)).join('')
      
      if (mimeType === 'audio/wav' && !headerString.startsWith('RIFF')) {
        console.warn('⚠️ Warning: File claims to be WAV but doesn\'t have RIFF header')
      }
      
      console.log('✅ Audio file validation passed')
    }

    // Check for cancellation before AssemblyAI upload
    if (abortController.signal.aborted) {
      throw new Error('Operation cancelled')
    }

    // Upload to AssemblyAI for transcription
    console.log('📤 Uploading to AssemblyAI...')
    console.log('📁 File details for AssemblyAI:')
    console.log('  - File name:', fileName)
    console.log('  - File type:', videoBlob.type)
    console.log('  - File size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB')
    
    // Create FormData for AssemblyAI upload
    const formData = new FormData()
    
    // Use a filename that matches the actual file type for AssemblyAI
    let assemblyFileName = fileName
    if (mimeType.startsWith('audio/')) {
      if (mimeType === 'audio/mpeg') {
        assemblyFileName = fileName.replace(/\.[^/.]+$/, '.mp3')
      } else if (mimeType === 'audio/wav') {
        assemblyFileName = fileName.replace(/\.[^/.]+$/, '.wav')
      } else if (mimeType === 'audio/mp4') {
        assemblyFileName = fileName.replace(/\.[^/.]+$/, '.m4a')
      }
    }
    
    console.log('📁 AssemblyAI filename:', assemblyFileName)
    console.log('🔍 Final file details before AssemblyAI upload:')
    console.log('  - Original filename:', fileName)
    console.log('  - AssemblyAI filename:', assemblyFileName)
    console.log('  - Blob MIME type:', videoBlob.type)
    console.log('  - Blob size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB')
    
    formData.append('file', videoBlob, assemblyFileName)

    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!
      },
      body: formData,
      signal: abortController.signal // Add abort signal
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ AssemblyAI upload error:', errorText)
      console.error('📁 File details that failed:')
      console.error('  - File name:', fileName)
      console.error('  - File type:', videoBlob.type)
      console.error('  - File size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB')
      console.error('  - Response status:', uploadResponse.status)
      console.error('  - Response status text:', uploadResponse.statusText)
      
      // Provide more specific error messages
      if (uploadResponse.status === 400) {
        throw new Error(`AssemblyAI upload failed: Invalid file format. The file appears to be ${videoBlob.type} but AssemblyAI expects audio/video. Please ensure the file is a valid audio or video file.`)
      } else if (uploadResponse.status === 413) {
        throw new Error(`AssemblyAI upload failed: File too large. The file is ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB, which exceeds AssemblyAI's size limits.`)
      } else {
        throw new Error(`AssemblyAI upload failed: ${uploadResponse.statusText}. File type: ${videoBlob.type}, Size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`)
      }
    }

    const uploadResult = await uploadResponse.json()
    const audioUrl = uploadResult.upload_url

    console.log('✅ File uploaded to AssemblyAI:', audioUrl)

    // Check for cancellation before starting transcription
    if (abortController.signal.aborted) {
      throw new Error('Operation cancelled')
    }

    // Start transcription
    console.log('🎙️ Starting AssemblyAI transcription with core quality features:')
    console.log('  - Language: Portuguese (pt)')
    console.log('  - Speaker Diarization: Enabled')
    console.log('  - Automatic Punctuation: Enabled')
    console.log('  - Format Text: Enabled')
    console.log('  - Enhanced Post-Processing: Enabled')
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLY_AI_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'pt',
        speaker_labels: true,
        punctuate: true,
        format_text: true
      }),
      signal: abortController.signal // Add abort signal
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('❌ AssemblyAI transcription error:', errorText)
      throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.statusText}`)
    }

    const transcriptResult = await transcriptResponse.json()
    const transcriptId = transcriptResult.id

    console.log('✅ Transcription started, ID:', transcriptId)

    // Poll for completion
    let transcription = ''
    let audioDuration: number | undefined = undefined
    let attempts = 0
    const maxAttempts = 120 // 10 minutes with 5-second intervals (increased for Pro plan 800s limit)
    
    console.log('⏳ Starting transcription polling (max attempts:', maxAttempts, ')')

    while (attempts < maxAttempts) {
      // Dynamic polling interval: start with 5s, increase to 10s after 2 minutes
      const pollInterval = attempts > 24 ? 10000 : 5000 // 10s after 2 minutes, 5s before
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      attempts++

      const elapsedMinutes = Math.round(attempts * pollInterval / 60000)
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts} (${elapsedMinutes} minutes elapsed)`)
      
      // Warning at 12 minutes (720 seconds) - close to Vercel Pro plan timeout
      if (elapsedMinutes >= 12 && attempts === Math.floor(720000 / pollInterval)) {
        console.log('⚠️ WARNING: Approaching Vercel Pro plan timeout limit (13+ minutes)')
        console.log('⚠️ If transcription takes longer, consider using async processing')
      }

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLY_AI_API_KEY!
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`)
      }

      const statusResult = await statusResponse.json()
      console.log(`📊 Transcription status (attempt ${attempts}):`, statusResult.status)
      
      // Log additional status information for debugging
      if (statusResult.status === 'processing') {
        console.log(`  - Progress: ${statusResult.progress || 'unknown'}%`)
        if (statusResult.audio_duration) {
          console.log(`  - Audio duration: ${statusResult.audio_duration}s`)
          audioDuration = statusResult.audio_duration
        }
      } else if (statusResult.status === 'completed') {
        console.log(`  - Final audio duration: ${statusResult.audio_duration || 'unknown'}s`)
        console.log(`  - Words transcribed: ${statusResult.words ? (Array.isArray(statusResult.words) ? statusResult.words.length : statusResult.words) : 'unknown'}`)
        if (statusResult.audio_duration) {
          audioDuration = statusResult.audio_duration
        }
      }

      if (statusResult.status === 'completed') {
        // Format transcription with speaker diarization
        if (statusResult.utterances && statusResult.utterances.length > 0) {
          // Use utterances if available (preferred format)
          console.log(`🔍 Processing ${statusResult.utterances.length} utterances...`)
          transcription = statusResult.utterances.map((utterance: any) => {
            const startTime = Math.floor(utterance.start / 1000)
            const minutes = Math.floor(startTime / 60)
            const seconds = startTime % 60
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            return `Speaker ${utterance.speaker} (${timeStr}) - ${utterance.text}`
          }).join('\n\n')
        } else if (statusResult.words && statusResult.words.length > 0) {
          // Process words array and group by speaker
          console.log('🔍 Processing words array format...')
          const speakerGroups: { [key: string]: string[] } = {}
          let currentSpeaker = ''
          let currentText = ''
          
          statusResult.words.forEach((word: any) => {
            if (word.speaker !== currentSpeaker) {
              if (currentSpeaker && currentText.trim()) {
                if (!speakerGroups[currentSpeaker]) speakerGroups[currentSpeaker] = []
                speakerGroups[currentSpeaker].push(currentText.trim())
              }
              currentSpeaker = word.speaker
              currentText = word.text
            } else {
              currentText += ' ' + word.text
            }
          })
          
          // Add the last group
          if (currentSpeaker && currentText.trim()) {
            if (!speakerGroups[currentSpeaker]) speakerGroups[currentSpeaker] = []
            speakerGroups[currentSpeaker].push(currentText.trim())
          }
          
          // Format as speaker utterances
          transcription = Object.entries(speakerGroups)
            .map(([speaker, texts]) => 
              texts.map(text => `Speaker ${speaker} - ${text}`).join('\n')
            )
            .join('\n\n')
        } else {
          // Fallback to raw text
          console.log('🔍 Using raw text fallback...')
          transcription = statusResult.text || ''
        }
        
        // Validate that we have a proper transcription
        if (!transcription || transcription.trim().length < 50) {
          console.error('❌ Transcription is too short or empty, using raw text as fallback')
          transcription = statusResult.text || ''
        }
        
        // Log detailed transcription information
        console.log('✅ Raw transcription completed with speaker diarization:', transcription.length, 'characters')
        console.log('📊 Raw transcription details:')
        console.log('  - Total characters:', transcription.length)
        console.log('  - Utterances count:', statusResult.utterances ? statusResult.utterances.length : 'N/A')
        console.log('  - Words count:', statusResult.words ? statusResult.words.length : 'N/A')
        console.log('  - Raw text length:', statusResult.text ? statusResult.text.length : 'N/A')
        console.log('  - Estimated duration (assuming ~100 chars/second):', Math.round(transcription.length / 100), 'seconds')
        console.log('  - Estimated duration (minutes):', Math.round(transcription.length / 100 / 60), 'minutes')
        
        // Enhance transcription quality
        console.log('🔧 Applying transcription quality enhancements...')
        transcription = enhanceTranscriptionQuality(transcription)
        console.log('✅ Enhanced transcription ready:', transcription.length, 'characters')
        
        // Transcription preview removed for cleaner logs
        
        // Check for any potential truncation indicators
        if (transcription.includes('...') || transcription.includes('truncated')) {
          console.warn('⚠️ Potential transcription truncation detected!')
        }
        
        break
      } else if (statusResult.status === 'error') {
        throw new Error(`Transcription failed: ${statusResult.error}`)
      }
    }

    if (!transcription) {
      // If transcription times out, save the transcript ID for later processing
      console.log('⏰ Transcription timed out, saving for async processing...')
      
      // Save the incomplete analysis with the transcript ID
      const incompleteAnalysis = {
        status: 'processing',
        callType: callType || 'Chamada Fria',
        feedback: 'Transcription in progress...',
        score: 0,
        analysis: {
          tipoCall: callType || 'Chamada Fria',
          totalScore: 0,
          pontosFortes: [],
          pontosFracos: [],
          resumoDaCall: 'Transcription is still processing. Please check back later.',
          dicasGerais: [],
          focoParaProximasCalls: [],
          clarezaFluenciaFala: 0,
          tomControlo: 0,
          envolvimentoConversacional: 0,
          efetividadeDescobertaNecessidades: 0,
          entregaValorAjusteSolucao: 0,
          habilidadesLidarObjeccoes: 0,
          estruturaControleReuniao: 0,
          fechamentoProximosPassos: 0
        },
        analysis_metadata: {
          transcription_id: transcriptId,
          processing_timeout: true,
          processing_started_at: new Date().toISOString(),
          audio_duration: audioDuration
        },
        transcription: '',
        custom_prompts: ['Transcription Timeout']
      }
      
      // Save to database
      const { data: analysisData, error: analysisError } = await supabase
        .from('sales_call_analyses')
        .insert({
          sales_call_id: salesCallId,
          user_id: userId,
          status: 'processing',
          call_type: callType || 'Chamada Fria',
          feedback: 'Transcription is still processing. Please check back later.',
          score: 0,
          analysis: incompleteAnalysis,
          analysis_metadata: {
            transcription_id: transcriptId,
            processing_timeout: true,
            processing_started_at: new Date().toISOString(),
            audio_duration: audioDuration
          },
          transcription: '',
          custom_prompts: ['Transcription Timeout']
        })
        .select()
        .single()
      
      if (analysisError) {
        console.error('❌ Error saving incomplete analysis:', analysisError)
        throw new Error('Failed to save incomplete analysis')
      }
      
      console.log('✅ Incomplete analysis saved with transcript ID:', transcriptId)
      
      return NextResponse.json({
        success: true,
        analysis: incompleteAnalysis,
        transcription: '',
        message: 'Transcription is still processing. Please check back in a few minutes.',
        duplicateInfo: null,
        timeout: true,
        transcriptId: transcriptId
      })
    }

    // Analyze with ChatGPT using comprehensive analysis
    console.log('🤖 Starting comprehensive analysis with ChatGPT...')
    
    // Log transcription length for debugging
    console.log(`📊 Full transcription length: ${transcription.length} characters`)
    
    // Clean up transcription content
    let transcriptionToAnalyze = transcription.trim()
    
    // Check for any problematic characters that might cause API issues
    if (transcriptionToAnalyze.includes('\x00') || transcriptionToAnalyze.includes('\uFFFD')) {
      console.log('⚠️ Found problematic characters in transcription, cleaning...')
      transcriptionToAnalyze = transcriptionToAnalyze.replace(/[\x00\uFFFD]/g, '')
    }
    
    // Validate transcription content
    if (!transcriptionToAnalyze || transcriptionToAnalyze.length < 100) {
      throw new Error('Transcription is too short or empty for analysis')
    }
    
    console.log(`📊 Full transcription length: ${transcriptionToAnalyze.length} characters`)
    
    // Check for cancellation before analysis
    if (abortController.signal.aborted) {
      throw new Error('Operation cancelled')
    }

    // DUPLICATE CHECK - Check for existing analysis with same content before expensive GPT analysis
    console.log('🔍 Checking for duplicate content before analysis...')
    
    // Generate SHA-256 hash of the transcription content
    const encoder = new TextEncoder()
    const data = encoder.encode(transcriptionToAnalyze)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('🔐 Generated content hash:', contentHash.substring(0, 16) + '...')
    
    // Check if we already have an analysis with this exact content
    const { data: existingAnalysis, error: duplicateCheckError } = await supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_metadata->>content_hash', contentHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
      // PGRST116 means "no rows returned" which is expected when no duplicate exists
      console.warn('⚠️ Error checking for duplicates:', duplicateCheckError)
    }
    
    if (existingAnalysis) {
      console.log('🔄 Duplicate content detected!')
      console.log('📊 Existing analysis ID:', existingAnalysis.id)
      console.log('📅 Created at:', existingAnalysis.created_at)
      console.log('📝 Title:', existingAnalysis.title)
      console.log('💰 Creating new analysis record with duplicate content to save AssemblyAI and GPT credits!')
      
      // Delete the file from Vercel Blob since it's a duplicate and we don't need it
      try {
        console.log('🗑️ Deleting duplicate file from Vercel Blob to save storage costs...')
        await del(blobUrl)
        console.log('✅ Duplicate file deleted from Vercel Blob successfully')
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete duplicate file from blob storage:', deleteError)
        // Don't fail the entire process if blob deletion fails
      }
      
      // Return the existing analysis instead of creating a duplicate
      console.log('✅ Returning existing analysis to avoid duplicates...')
      
      // Debug: Log the duplicate response being sent to frontend
      console.log('🔍 DUPLICATE RESPONSE TO FRONTEND:')
      console.log('🔍 existingAnalysis.analysis structure:', JSON.stringify(existingAnalysis.analysis, null, 2))
      console.log('🔍 existingAnalysis.analysis type:', typeof existingAnalysis.analysis)
      
      // Return the existing analysis result
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis.analysis,
        analysisId: existingAnalysis.id,
        message: 'Duplicate content detected - returning existing analysis',
        isDuplicate: true,
        duplicateInfo: {
          originalId: existingAnalysis.id,
          originalTitle: existingAnalysis.title,
          originalDate: existingAnalysis.created_at,
          contentHash: contentHash.substring(0, 16) + '...'
        }
      })
    }
    
    console.log('✅ No duplicate content found, proceeding with GPT analysis...')

    // Use direct comprehensive analysis for the transcription
    console.log('🔄 Using direct comprehensive analysis for transcription...')
    
    const startTime = Date.now()
    
    // Call the comprehensive analysis function directly
    const analysisResults = await performComprehensiveAnalysis(transcriptionToAnalyze, callType)
    
    console.log('✅ Comprehensive analysis completed')
    console.log('📊 Analysis results received:', {
      callType: analysisResults.tipoCall,
      score: analysisResults.totalScore,
      hasStrengths: !!analysisResults.pontosFortes,
      hasWeaknesses: !!analysisResults.pontosFracos
    })
    
    // Debug individual scores
    console.log('📊 Individual scores from analysis:', {
      clarezaFluenciaFala: analysisResults.clarezaFluenciaFala,
      tomControlo: analysisResults.tomControlo,
      envolvimentoConversacional: analysisResults.envolvimentoConversacional,
      efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades,
      entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao,
      habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes,
      estruturaControleReuniao: analysisResults.estruturaControleReuniao,
      fechamentoProximosPassos: analysisResults.fechamentoProximosPassos
    })
    
    // Calculate expected total
    const expectedTotal = (analysisResults.clarezaFluenciaFala || 0) +
                        (analysisResults.tomControlo || 0) +
                        (analysisResults.envolvimentoConversacional || 0) +
                        (analysisResults.efetividadeDescobertaNecessidades || 0) +
                        (analysisResults.entregaValorAjusteSolucao || 0) +
                        (analysisResults.habilidadesLidarObjeccoes || 0) +
                        (analysisResults.estruturaControleReuniao || 0) +
                        (analysisResults.fechamentoProximosPassos || 0)
    
    console.log('📊 Expected total from individual scores:', expectedTotal)
    console.log('📊 Reported totalScore:', analysisResults.totalScore)
    
    // Function to parse comprehensive analysis text into structured bullet points
    const parseComprehensiveAnalysis = (text: string) => {
      if (!text) return []
      
      console.log('🔍 Raw text for parsing:', text.substring(0, 200) + '...')
      
      // Split by lines and look for patterns like timestamps and descriptions
      const lines = text.split('\n').filter(line => line.trim())
      const bulletPoints = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Look for various timestamp patterns:
        // - "00:27" (exact time)
        // - "No início" (relative time)
        // - "No meio da call" (relative time)
        // - "Transmitiste segurança quando disseste" (action-based)
        // - "Boa Abordagem Inicial" (section headers)
        const timestampMatch = line.match(/^(\d{1,2}:\d{2})/)
        const relativeTimeMatch = line.match(/^(No início|No meio da call|No fecho|Transmitiste|A pergunta|Quando|Ao|Durante)/i)
        const sectionHeaderMatch = line.match(/^(Boa Abordagem Inicial|Identificação Eficaz|Apresentação Clara|Gestão de Objeções|Conclusão Positiva)/i)
        
        if (timestampMatch || relativeTimeMatch || sectionHeaderMatch) {
          const timestamp = timestampMatch ? timestampMatch[1] : 
                          relativeTimeMatch ? relativeTimeMatch[1] : 
                          sectionHeaderMatch![1]
          const description = timestampMatch ? 
            line.substring(timestamp.length + 1).trim() : 
            relativeTimeMatch ? line.substring(relativeTimeMatch[1].length + 1).trim() :
            line.substring(sectionHeaderMatch![1].length + 1).trim()
          
          if (description) {
            bulletPoints.push({
              timestamp: timestamp,
              description: description,
              quote: '' // We'll look for quotes in the next lines
            })
          } else if (sectionHeaderMatch) {
            // If it's just a section header, create a bullet point with the header as description
            bulletPoints.push({
              timestamp: 'Section',
              description: timestamp,
              quote: ''
            })
          }
        } else if (bulletPoints.length > 0) {
          // Check if this line contains a quote (starts with quotes or contains quoted text)
          const quoteMatch = line.match(/["""]([^"""]+)["""]/)
          if (quoteMatch) {
            // Update the last bullet point with the quote
            bulletPoints[bulletPoints.length - 1].quote = quoteMatch[1]
          } else if (line.includes('"') || line.includes('"') || line.includes('"')) {
            // Extract any quoted text from this line
            const quoteMatch = line.match(/["""]([^"""]+)["""]/)
            if (quoteMatch) {
              bulletPoints[bulletPoints.length - 1].quote = quoteMatch[1]
            }
          } else if (line.trim() && !line.startsWith('Timestamp:') && !line.startsWith('Momento:')) {
            // If this line has content and isn't a timestamp label, it might be additional description
            const lastPoint = bulletPoints[bulletPoints.length - 1]
            if (lastPoint && !lastPoint.description.includes(line.trim())) {
              lastPoint.description += ' ' + line.trim()
            }
          }
        }
      }
      
      // If no structured points were found, create a simple bullet point from the text
      if (bulletPoints.length === 0 && text.trim()) {
        console.log('⚠️ No structured points found, creating fallback bullet points')
        // Split by sentences and create simple bullet points
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            bulletPoints.push({
              timestamp: 'General',
              description: sentence.trim(),
              quote: ''
            })
          }
        })
      }
      
      console.log('✅ Parsed bullet points:', bulletPoints)
      return bulletPoints
    }
    
    // Parse comprehensive analysis results into structured data
    const structuredStrengths = parseComprehensiveAnalysis(analysisResults.pontosFortes || '')
    const structuredImprovements = parseComprehensiveAnalysis(analysisResults.pontosFracos || '')
    
    console.log('🔍 Parsing comprehensive analysis results:', {
      callType: analysisResults.tipoCall || 'Not found',
      score: analysisResults.totalScore || 'Not found',
      strengthsCount: structuredStrengths.length,
      improvementsCount: structuredImprovements.length
    })
    
    // Debug: Log the actual analysis results
    console.log('🔍 Raw analysis results from OpenAI:', {
      callType: analysisResults.tipoCall,
      score: analysisResults.totalScore,
      pontosFortes: analysisResults.pontosFortes?.substring(0, 100) + '...',
      pontosFracos: analysisResults.pontosFracos?.substring(0, 100) + '...',
      resumoDaCall: analysisResults.resumoDaCall?.substring(0, 100) + '...',
      dicasGerais: analysisResults.dicasGerais?.substring(0, 100) + '...',
      focoParaProximasCalls: analysisResults.focoParaProximasCalls?.substring(0, 100) + '...',
      clarezaFluenciaFala: analysisResults.clarezaFluenciaFala,
      tomControlo: analysisResults.tomControlo,
      envolvimentoConversacional: analysisResults.envolvimentoConversacional,
      efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades,
      entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao,
      habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes,
      estruturaControleReuniao: analysisResults.estruturaControleReuniao,
      fechamentoProximosPassos: analysisResults.fechamentoProximosPassos
    })
    
    const analysis = {
      call_type: analysisResults.tipoCall || 'Não identificado',
      score: analysisResults.totalScore || 0,
      feedback: 'Análise completa realizada com IA',
      analysis: {
        // Use structured comprehensive analysis results
        strengths: structuredStrengths.length > 0 ? structuredStrengths : [],
        improvements: structuredImprovements.length > 0 ? structuredImprovements : [],
        techniques: [],
        objections: [],
        scoring: {},
        // Add comprehensive analysis results
        momentosFortesFracos: '',
        analiseQuantitativa: '',
        pontosFortes: analysisResults.pontosFortes || '',
        pontosFortesGS: '',
        pontosFracos: analysisResults.pontosFracos || '',
        pontosFracosGS: '',
        analiseQuantitativaCompleta: '',
        explicacaoPontuacao: '',
        justificacaoGS: '',
        tipoCall: analysisResults.tipoCall || '',
        // New required fields
        resumoDaCall: analysisResults.resumoDaCall || '',
        dicasGerais: analysisResults.dicasGerais || '',
        focoParaProximasCalls: analysisResults.focoParaProximasCalls || '',
        // 8 scoring fields
        clarezaFluenciaFala: analysisResults.clarezaFluenciaFala || 0,
        tomControlo: analysisResults.tomControlo || 0,
        envolvimentoConversacional: analysisResults.envolvimentoConversacional || 0,
        efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades || 0,
        entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao || 0,
        habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes || 0,
        estruturaControleReuniao: analysisResults.estruturaControleReuniao || 0,
        fechamentoProximosPassos: analysisResults.fechamentoProximosPassos || 0,
        // 8 justification fields (not available in current analysis results)
        justificativaClarezaFluenciaFala: '',
        justificativaTomControlo: '',
        justificativaEnvolvimentoConversacional: '',
        justificativaEfetividadeDescobertaNecessidades: '',
        justificativaEntregaValorAjusteSolucao: '',
        justificativaHabilidadesLidarObjeccoes: '',
        justificativaEstruturaControleReuniao: '',
        justificativaFechamentoProximosPassos: ''
      }
    }

    // Content hash already generated in duplicate check above
    console.log('🔄 Proceeding with new analysis...')
    
    // Clear the existingAnalysis variable since we're proceeding with a new analysis
    const duplicateAnalysis = null
    
    // Save analysis to Supabase
    console.log('💾 Saving analysis to Supabase...')
    
    // Use existing Supabase client
    
    // Convert to structured JSON format
    const structuredAnalysis = convertToStructuredJSON(
      analysisResults,
      callType || 'Chamada Fria',
      fileName || 'Sales Call Analysis',
      Date.now() - startTime,
      analysisResults.totalTokensUsed || 0
    )

    // Prepare analysis data for database
    const analysisData = {
      user_id: userId,
      title: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Sales Call Analysis',
      call_type: callType || 'Chamada Fria',
      analysis: structuredAnalysis,
      feedback: 'Analysis completed via unified route',
      score: analysisResults.totalScore || 0,
      analysis_metadata: {
        transcription_length: transcriptionToAnalyze.length,
        processing_time: new Date().toISOString(),
        analysis_steps: 6,
        was_truncated: false,
        analysis_method: 'unified_analysis',
        original_file_name: fileName || null,
        content_hash: contentHash
      },
      transcription: transcriptionToAnalyze,
      custom_prompts: [
        'Call Type Classification',
        'Quantitative Analysis',
        'Strengths Analysis',
        'Weaknesses Analysis',
        'Scoring Analysis',
        'General Tips Analysis'
      ]
    }
    
    // Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('sales_call_analyses')
      .insert(analysisData)
      .select()
      .single()
    
    if (saveError) {
      console.error('❌ Error saving analysis to Supabase:', saveError)
      throw new Error('Failed to save analysis to database')
    }
    
    console.log('✅ Analysis saved to Supabase with ID:', savedAnalysis.id)

    // Calculate AssemblyAI transcription cost
    const assemblyAICostPerMinute = 0.00065 // Universal model pricing
    const audioDurationMinutes = audioDuration ? audioDuration / 60 : 0
    const assemblyAICost = audioDurationMinutes * assemblyAICostPerMinute

    // Debug: Log what we're about to store in the database
    console.log('🔍 Final analysis object being stored:', {
      call_type: analysisData.analysis.callInfo.callType,
      score: analysisData.score,
      overallScore: analysisData.analysis.overallScore.total,
      category: analysisData.analysis.overallScore.category,
      scoring: {
        clarityAndFluency: analysisData.analysis.scoring.clarityAndFluency.score,
        toneAndControl: analysisData.analysis.scoring.toneAndControl.score,
        engagement: analysisData.analysis.scoring.engagement.score,
        needsDiscovery: analysisData.analysis.scoring.needsDiscovery.score,
        valueDelivery: analysisData.analysis.scoring.valueDelivery.score,
        objectionHandling: analysisData.analysis.scoring.objectionHandling.score,
        meetingControl: analysisData.analysis.scoring.meetingControl.score,
        closing: analysisData.analysis.scoring.closing.score
      },
      insights: {
        strengthsCount: analysisData.analysis.insights.strengths.length,
        improvementsCount: analysisData.analysis.insights.improvements.length
      }
    })

    // Analysis completed and saved to Supabase
    console.log('✅ Analysis completed and saved to Supabase')

    // Use the analysis data from the comprehensive analysis
    const salesAnalysis = {
      id: savedAnalysis.id,
      analysis: {
        call_type: analysisResults.tipoCall || 'Não identificado',
        score: analysisResults.totalScore || 0,
        analysis: {
          pontosFortes: analysisResults.pontosFortes || '',
          pontosFracos: analysisResults.pontosFracos || '',
          resumoDaCall: analysisResults.resumoDaCall || '',
          dicasGerais: analysisResults.dicasGerais || '',
          focoParaProximasCalls: analysisResults.focoParaProximasCalls || '',
          clarezaFluenciaFala: analysisResults.clarezaFluenciaFala || 0,
          tomControlo: analysisResults.tomControlo || 0,
          envolvimentoConversacional: analysisResults.envolvimentoConversacional || 0,
          efetividadeDescobertaNecessidades: analysisResults.efetividadeDescobertaNecessidades || 0,
          entregaValorAjusteSolucao: analysisResults.entregaValorAjusteSolucao || 0,
          habilidadesLidarObjeccoes: analysisResults.habilidadesLidarObjeccoes || 0,
          estruturaControleReuniao: analysisResults.estruturaControleReuniao || 0,
          fechamentoProximosPassos: analysisResults.fechamentoProximosPassos || 0
        }
      },
      score: analysisResults.totalScore || 0
    }

    // Analysis completed successfully

    console.log('✅ Analysis completed and stored:', salesAnalysis.id)
    
    // Print prominent token usage summary
    const totalTokens = analysisResults.totalTokensUsed || 0
    console.log('')
    console.log('🔢 ==========================================')
    console.log('🔢 TOTAL TOKENS USED FOR ANALYSIS:', totalTokens)
    console.log('🔢 ASSEMBLYAI TRANSCRIPTION COST: $' + assemblyAICost.toFixed(4))
    console.log('🔢 AUDIO DURATION: ' + audioDurationMinutes.toFixed(2) + ' minutes')
    console.log('🔢 ==========================================')
    console.log('')

    // Delete the file from Vercel Blob to save storage costs
    try {
      console.log('🗑️ Deleting file from Vercel Blob to save storage costs...')
      await del(blobUrl)
      console.log('✅ File deleted from Vercel Blob successfully')
      
      // Blob file deleted successfully
        
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete blob file:', deleteError)
      // Don't fail the entire process if blob deletion fails
      // The file will eventually be cleaned up by Vercel's retention policies
    }

    // Debug: Log the final response
    console.log('🔍 Final response analysis object:', {
      pontosFortes: salesAnalysis.analysis.analysis.pontosFortes?.substring(0, 100) + '...',
      pontosFracos: salesAnalysis.analysis.analysis.pontosFracos?.substring(0, 100) + '...',
      totalScore: salesAnalysis.score,
      individualScores: {
        clarezaFluenciaFala: salesAnalysis.analysis.analysis.clarezaFluenciaFala,
        tomControlo: salesAnalysis.analysis.analysis.tomControlo,
        envolvimentoConversacional: salesAnalysis.analysis.analysis.envolvimentoConversacional,
        efetividadeDescobertaNecessidades: salesAnalysis.analysis.analysis.efetividadeDescobertaNecessidades,
        entregaValorAjusteSolucao: salesAnalysis.analysis.analysis.entregaValorAjusteSolucao,
        habilidadesLidarObjeccoes: salesAnalysis.analysis.analysis.habilidadesLidarObjeccoes,
        estruturaControleReuniao: salesAnalysis.analysis.analysis.estruturaControleReuniao,
        fechamentoProximosPassos: salesAnalysis.analysis.analysis.fechamentoProximosPassos
      }
    })

    // Debug: Log the exact response being sent to frontend
    console.log('🔍 FINAL RESPONSE TO FRONTEND:')
    console.log('🔍 salesAnalysis structure:', JSON.stringify(salesAnalysis, null, 2))
    console.log('🔍 salesAnalysis.analysis:', salesAnalysis.analysis)
    console.log('🔍 salesAnalysis.analysis.analysis:', salesAnalysis.analysis.analysis)
    console.log('🔍 salesAnalysis.analysis.analysis.analysis:', salesAnalysis.analysis.analysis)
    console.log('🔍 salesAnalysis.score:', salesAnalysis.score)

    return NextResponse.json({
      success: true,
      analysis: salesAnalysis,
      transcription: transcription, // Return the full transcription
      message: 'Analysis completed successfully',
      duplicateInfo: null
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Operation cancelled') {
      console.log('🚫 Transcription cancelled by user')
      return NextResponse.json(
        { error: 'Operation cancelled' },
        { status: 499 } // Client closed request
      )
    }
    
    console.error('❌ Blob transcription error:', error)
    return NextResponse.json(
      { error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
