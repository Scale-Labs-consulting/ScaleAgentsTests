import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - /api/sales-analyst/analyze')
  
  try {
    const { transcription, salesCallId, userId, originalFileName } = await request.json()
    
    console.log('📁 Received originalFileName:', originalFileName)
    console.log('📁 Type of originalFileName:', typeof originalFileName)
    
    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // CONTENT HASH DEDUPLICATION
    console.log('🔍 Checking for duplicate content...')
    
    // Generate SHA-256 hash of the transcription content
    const encoder = new TextEncoder()
    const data = encoder.encode(transcription)
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
      
      // Return the existing analysis instead of creating a new one
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
    
    console.log('✅ No duplicate content found, proceeding with new analysis...')

    console.log('📝 Analyzing transcription with GPT-4...')
    console.log('📊 Transcription length:', transcription.length, 'characters')

    // Check OpenAI API key
    if (!process.env.OPENAI_KEY) {
      console.error('❌ OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Function to estimate token count (rough approximation: 1 token ≈ 4 characters)
    function estimateTokens(text: string): number {
      return Math.ceil(text.length / 4)
    }

    // Function to split transcription into chunks for GPT-4o-mini (128K context)
    function splitTranscriptionIntoChunks(transcription: string, maxCharsPerChunk: number = 20000): string[] {
      if (transcription.length <= maxCharsPerChunk) {
        return [transcription]
      }

      const chunks: string[] = []
      let currentChunk = ''
      const sentences = transcription.split(/(?<=[.!?])\s+/)
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxCharsPerChunk) {
          currentChunk += sentence + ' '
        } else {
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim())
          }
          currentChunk = sentence + ' '
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      
      console.log(`📦 Split transcription into ${chunks.length} chunks`)
      return chunks
    }

    // Function to analyze chunks and combine results
    async function analyzeInChunks(
      transcription: string, 
      promptTemplate: string, 
      systemMessage: string,
      analysisType: string
    ): Promise<string> {
      const chunks = splitTranscriptionIntoChunks(transcription)
      
      if (chunks.length === 1) {
        // Single chunk - direct analysis
        console.log(`📋 Analyzing ${analysisType} with single chunk...`)
                 return await makeGPTCall(
           promptTemplate.replace('${TRANSCRIPTION}', chunks[0]),
           systemMessage
         )
      }
      
      // Multiple chunks - analyze each and combine
      console.log(`📋 Analyzing ${analysisType} with ${chunks.length} chunks...`)
      
      const chunkResults: string[] = []
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`📦 Processing chunk ${i + 1}/${chunks.length} for ${analysisType}...`)
        
        const chunkPrompt = promptTemplate.replace('${TRANSCRIPTION}', chunks[i])
                 const chunkResult = await makeGPTCall(
           chunkPrompt,
           systemMessage
         )
        
        chunkResults.push(chunkResult)
      }
      
      // Combine chunk results
      console.log(`🔗 Combining ${chunks.length} chunk results for ${analysisType}...`)
      const combinedPrompt = `Analisa os seguintes resultados de análise de diferentes partes da mesma call de vendas e cria uma análise final consolidada:

${chunkResults.map((result, index) => `PARTE ${index + 1}:\n${result}`).join('\n\n')}

Cria uma análise final que combine todos estes resultados de forma coerente e abrangente.`

             return await makeGPTCall(
         combinedPrompt,
         `És um analista especializado em consolidação de análises de calls de vendas. A tua função é combinar múltiplas análises parciais numa análise final completa e coerente.`
       )
    }

    // Make multiple focused API calls for comprehensive analysis
    console.log('🔄 Starting multi-step analysis...')
    
         // Step 1: Call Type Classification
     console.log('📋 Step 1: Analyzing call type...')
     const callTypePrompt = `Analisa a seguinte transcrição de conversa e classifica-a numa das seguintes categorias:

 Chamada Fria: Primeiro contacto com um potencial cliente que não foi previamente contactado. Características típicas incluem: apresentação inicial da empresa/produto, introdução do vendedor, identificação inicial de necessidades, e tentativa de agendar uma reunião de descoberta.

 Chamada de Agendamento: Conversa focada em marcar uma reunião ou call específica. Características típicas incluem: discussão de disponibilidade, confirmação de horários, envio de convites, e preparação para a reunião.

 Reunião de Descoberta: Conversa profunda para entender as necessidades, desafios e objetivos do cliente. Características típicas incluem: perguntas detalhadas sobre a empresa/negócio, identificação de problemas específicos, exploração da situação atual, e questões sobre orçamento, autoridade de decisão, cronograma ou necessidades específicas.

 Reunião de Fecho: Conversa focada em finalizar uma venda ou acordo. Características típicas incluem: discussão de preços finais, negociação de termos, apresentação de propostas finais, e tentativa de obter um compromisso ou assinatura.

 Reunião de Esclarecimento de Dúvidas: Conversa focada em responder perguntas específicas do cliente sobre o produto/serviço. Características típicas incluem: muitas perguntas técnicas ou de implementação, esclarecimentos sobre funcionalidades específicas, e poucos elementos de descoberta ou fecho.

 Reunião de One Call Close: Conversa que combina descoberta e fecho numa única reunião. Características típicas incluem: identificação rápida de necessidades, apresentação de solução personalizada, e tentativa de fecho imediato.

 Analisa a transcrição completa para fazer tua determinação, pois o tipo de call pode ser confirmado ao longo de toda a conversa.

 Após analisar, responde APENAS com o nome exato da categoria: "Chamada Fria", "Chamada de Agendamento", "Reunião de Descoberta", "Reunião de Fecho", "Reunião de Esclarecimento de Dúvidas", ou "Reunião de One Call Close". Não incluas explicações ou texto adicional.

 TRANSCRIÇÃO:
 ${transcription}`

    const callTypeResult = await analyzeInChunks(
      transcription,
      callTypePrompt,
      'És um analista especializado em classificação de chamadas de vendas.',
      'call type'
    )

    // Step 2: Speaker Identification and Quantitative Analysis
    console.log('📊 Step 2: Identifying speakers and analyzing conversation balance...')
    const quantitativePrompt = `Por favor, analise a transcrição da call a seguir e identifique os seguintes pontos:

IDENTIFICAÇÃO DOS FALANTES
- Analisa a transcrição para identificar quem é o COMERCIAL (vendedor) e quem é o CLIENTE.
- Procura por indicadores como:
  * Quem faz perguntas sobre necessidades, problemas, orçamento
  * Quem apresenta soluções, produtos ou serviços
  * Quem fala sobre a própria empresa vs. quem fala sobre a empresa do outro
  * Quem conduz a reunião e quem responde às perguntas
  * Quem fala sobre preços, propostas, ou próximos passos
- Identifica claramente: "O COMERCIAL é [nome/identificação]" e "O CLIENTE é [nome/identificação]"

DISTRIBUIÇÃO DA CONVERSA
- Calcule a percentagem de fala de cada parte (comercial e cliente), considerando a quantidade de palavras ou tempo falado.
- Apresente os resultados com a percentagem exata de fala do comercial e do cliente.

TEMPO DE RESPOSTA DO COMERCIAL
- Meça o tempo médio de resposta do comercial a cada intervenção do cliente.
- Indique esses tempos em minutos e segundos.

PROPORÇÕES IDEAIS DE FALA
Compare as proporções de fala reais com as proporções ideais para cada tipo de call:
- Chamada Fria: Cliente 40% / Comercial 60%
- Chamada de Agendamento: Cliente 30% / Comercial 70%
- Reunião de Descoberta: Cliente 60% / Comercial 40%
- Reunião de Fecho: Cliente 40% / Comercial 60%
- Reunião de Esclarecimento de Dúvidas: Cliente 50% / Comercial 50%
- Reunião de One Call Close: Cliente 45% / Comercial 55%

FEEDBACK SOBRE O EQUILÍBRIO DA CONVERSA
- Compare as proporções reais de fala com as proporções ideais.
- Forneça feedback sobre como melhorar o equilíbrio da conversa e o engajamento entre o comercial e o cliente.

Transcrição da Chamada:
${transcription}

Instruções críticas:
1. NÃO uses markdown, símbolos extras ou emojis.
2. Escreve sempre em português de Lisboa.
3. Usa formatação simples com títulos em MAIÚSCULAS e listas com hífens.
4. Os valores devem ser apresentados de forma clara e direta.
5. Da-me so o resultado final, não precisas de dar comentarios adicionais
6. É CRÍTICO identificar corretamente quem é o comercial vs. cliente`

    const quantitativeResult = await analyzeInChunks(
      transcription,
      quantitativePrompt,
      'És um analista especializado em análise quantitativa de conversas de vendas.',
      'quantitative analysis'
    )

    // Step 3: Strong Points Analysis
    console.log('💪 Step 3: Analyzing strong points...')
    const strengthsPrompt = `Analisa a seguinte transcrição de uma reunião de vendas e identifica os pontos fortes do vendedor ao longo da call.

IMPORTANTE: Primeiro identifica quem é o vendedor na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

Depois analisa APENAS o desempenho do vendedor identificado.

TRANSCRIÇÃO:
${transcription}

REGRAS CRÍTICAS PARA IDENTIFICAÇÃO DE PONTOS FORTES:

1. NÃO consideres como pontos fortes:
   - Partilha de ecrã - é uma ferramenta essencial, não um ponto forte
   - Ações básicas como "dizer olá" ou "apresentar-se"
   - Técnicas padrão que qualquer vendedor deveria fazer
   - Ferramentas ou recursos utilizados (como partilhar ecrã)

2. FOCA em pontos fortes reais:
   - Perguntas estratégicas e bem formuladas
   - Escuta ativa e empatia genuína
   - Apresentação personalizada da solução
   - Gestão eficaz de objeções
   - Criação de rapport e confiança
   - Estrutura clara e controlo da reunião
   - Fechamento eficaz com próximos passos claros

Estrutura o output como uma lista de parágrafos separados, cada um começando com um bullet point (•), com comentários objectivos e claros sobre os momentos mais positivos do vendedor na reunião.

IMPORTANTE: Cada ponto deve estar num parágrafo separado, começando com "• " e terminando com uma quebra de linha.

Indica sempre os timestamps dos momentos para contextualizar as falas.

Observa o desempenho do vendedor ao longo destas fases:
- Início da reunião (apresentação inicial e rapport)
- Perguntas feitas (intenção, impacto, relevância)
- Apresentação da solução/proposta (clareza, personalização, diferenciação)
- Gestão de objeções (respostas bem estruturadas, confiança, segurança)
- Fecho da reunião (próximos passos, compromisso)

Usa frases como:
- "No início, mostrou interesse genuíno ao perguntar sobre..."
- "A pergunta sobre X foi crucial porque..."
- "No meio da call, teve o seu momento mais forte quando..."
- "Transmitiu segurança quando disse..."

Dá especial atenção a falas que demonstrem empatia, autoridade, personalização e visão estratégica. Sempre que fizer sentido, inclui uma citação direta da transcrição para ilustrar o ponto.

Mantém a linguagem simples, directa e sem floreados.
Não uses títulos como "Pontos Fortes" ou "Conclusão". Apenas a lista, como se fosse um feedback direto.

FORMATO OBRIGATÓRIO:
• [Primeiro ponto forte] [quebra de linha]
• [Segundo ponto forte] [quebra de linha]
• [Terceiro ponto forte] [quebra de linha]
etc.

Usa sempre Timestamp das frases que utilizaste para contextualizar.

Indica em que momento esteve mais forte, e porque.

Idioma: português de Portugal (Lisboa), com uso de pretérito perfeito simples e sem gerúndios.`

    const strengthsResult = await analyzeInChunks(
      transcription,
      strengthsPrompt,
      'És um analista especializado em identificar pontos fortes em chamadas de vendas.',
      'strengths analysis'
    )

    // Step 4: Weak Points Analysis
    console.log('⚠️ Step 4: Analyzing weak points...')
    const weaknessesPrompt = `Antes de tudo verifica a análise dos pontos fortes que te vou dar, para que não ha descrepancias de informação: ${strengthsResult}

Agora analisa a seguinte transcrição de uma reunião de vendas e identifica os pontos fracos do vendedor ao longo da call.

IMPORTANTE: Primeiro identifica quem é o vendedor na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

Depois analisa APENAS o desempenho do vendedor identificado.

TRANSCRIÇÃO:
${transcription}

REGRAS CRÍTICAS PARA IDENTIFICAÇÃO DE PONTOS FRACOS:

1. NÃO consideres como pontos fracos:
   - Perguntas estratégicas como "Porquê de nos terem contactado?" - estas são intencionais para fazer a lead abrir-se
   - Linguagem coloquial/informal - pode ser apropriada para criar rapport e proximidade
   - Validações como "Consegues ver?" - são importantes para confirmar compreensão
   - Partilha de ecrã - é uma ferramenta essencial, não um ponto fraco
   - Técnicas de vendas válidas que podem parecer informais mas são estratégicas

2. FOCA em pontos fracos reais:
   - Falta de preparação ou conhecimento do produto/serviço
   - Não aproveitar oportunidades para aprofundar necessidades
   - Falar demasiado de funcionalidades em vez de benefícios
   - Não lidar adequadamente com objeções reais
   - Falta de estrutura ou controlo da reunião
   - Não criar sentido de urgência quando apropriado
   - Falta de follow-up ou próximos passos claros

Depois de analisares, estrutura o output como uma lista de parágrafos separados, cada um começando com um bullet point (•), com comentários objectivos e claros sobre os momentos mais frágeis do vendedor na reunião.

IMPORTANTE: Cada ponto deve estar num parágrafo separado, começando com "• " e terminando com uma quebra de linha.

Indica sempre a timestamp das falas para contextualizar.

Observa o desempenho do vendedor ao longo destas fases:
- Início da reunião (apresentação inicial e rapport)
- Perguntas feitas (intenção, impacto, profundidade)
- Apresentação da solução/proposta (clareza, excesso de detalhe técnico, falta de alinhamento)
- Gestão de objeções (respostas genéricas, falta de escuta ativa, hesitação)
- Fecho da reunião (próximos passos pouco claros, falta de urgência ou follow-up forte)

Usa frases como:
- "No início, poderia ter evitado..."
- "A pergunta sobre X poderia ter sido mais específica porque..."
- "Neste momento, deixou passar uma oportunidade de aprofundar..."
- "Faltou clareza quando disse..."
- "No fecho, não criou um verdadeiro sentido de urgência porque..."

Dá especial atenção a momentos em que:
- Não aproveitou oportunidades para aprofundar a dor da lead
- Falou demasiado de funcionalidades em vez de benefícios concretos
- Soou genérico ou pouco consultivo
- Evitou lidar diretamente com uma preocupação do cliente

Sempre que fizer sentido, inclui uma citação direta da transcrição para ilustrar o ponto.

FORMATO OBRIGATÓRIO:
• [Primeiro ponto fraco] [quebra de linha]
• [Segundo ponto fraco] [quebra de linha]
• [Terceiro ponto fraco] [quebra de linha]
etc.

Usa sempre timestamp das frases que utilizaste para contextualizar.

Indica em que momento teve o ponto mais fraco da call e justifica.

Idioma: português de Portugal (Lisboa), com uso de pretérito perfeito simples e sem gerúndios.`

    const weaknessesResult = await analyzeInChunks(
      transcription,
      weaknessesPrompt,
      'És um analista especializado em identificar pontos fracos em chamadas de vendas.',
      'weaknesses analysis'
    )

    // Step 5: Scoring Analysis
    console.log('⭐ Step 5: Analyzing scoring...')
    const scoringPrompt = `Analisa a seguinte transcrição de uma reunião de vendas e fornece uma pontuação detalhada e CONSISTENTE do vendedor.

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
- 5: Comunicação clara, fluente, sem pausas desnecessárias
- 4: Comunicação clara com algumas pausas menores
- 3: Comunicação compreensível mas com algumas hesitações
- 2: Comunicação pouco clara ou muitas hesitações
- 1: Comunicação muito confusa ou ininteligível

2. Tom e Controlo (1-5):
- 5: Tom profissional, confiante, controlo emocional excelente
- 4: Tom adequado, confiança visível, bom controlo
- 3: Tom adequado mas falta de confiança ou controlo
- 2: Tom inadequado ou falta de controlo emocional
- 1: Tom muito inadequado ou perda de controlo

3. Envolvimento Conversacional (1-5):
- 5: Excelente equilíbrio entre falar e ouvir, engajamento ativo
- 4: Bom equilíbrio, engajamento adequado
- 3: Equilíbrio moderado, algum engajamento
- 2: Desequilíbrio na conversa, pouco engajamento
- 1: Conversa muito desequilibrada, sem engajamento

4. Efetividade na Descoberta de Necessidades (1-5):
- 5: Identificou claramente todas as necessidades e dores do cliente
- 4: Identificou a maioria das necessidades importantes
- 3: Identificou algumas necessidades básicas
- 2: Identificou poucas necessidades ou de forma superficial
- 1: Não identificou necessidades ou fez perguntas inadequadas

5. Entrega de Valor e Ajuste da Solução (1-5):
- 5: Apresentou valor claramente alinhado com as necessidades identificadas
- 4: Apresentou valor adequado com algum alinhamento
- 3: Apresentou valor mas com alinhamento limitado
- 2: Apresentou valor mas sem alinhamento claro
- 1: Não apresentou valor ou solução inadequada

6. Habilidades de Lidar com Objeções (1-5):
- 5: Respondeu a todas as objeções de forma eficaz e confiante
- 4: Respondeu adequadamente à maioria das objeções
- 3: Respondeu a algumas objeções mas com dificuldades
- 2: Respondeu mal às objeções ou evitou-as
- 1: Não conseguiu lidar com objeções ou agravou-as

7. Estrutura e Controle da Reunião (1-5):
- 5: Estrutura clara, controlo total da reunião, fluxo natural
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

Fornece a pontuação seguindo EXATAMENTE este formato:

Clareza e Fluência da Fala: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Tom e Controlo: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Envolvimento Conversacional: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Efetividade na Descoberta de Necessidades: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Entrega de Valor e Ajuste da Solução: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Habilidades de Lidar com Objeções: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Estrutura e Controle da Reunião: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Fechamento e Próximos Passos: [pontuação]/5
Justificação: [explicação baseada na transcrição]

Total: [soma de todas as pontuações]/40

Usa português de Portugal (Lisboa).
Evita gerúndios, usa pretérito perfeito simples.
Não uses emojis ou formatação especial.`

    const scoringResult = await analyzeInChunks(
      transcription,
      scoringPrompt,
      'És um analista especializado em pontuação de performance de vendas.',
      'scoring analysis'
    )

    // Step 6: Strong and Weak Moments by Phase
    console.log('📈 Step 6: Analyzing moments by phase...')
    const momentsPrompt = `Resumo Momentos Fortes e Fracos do comercial:

És um assistente especializado em análise de calls de vendas. A tua única função é analisar a transcrição da call e identificar os momentos de maior e menor desempenho do comercial.

Quando eu te fornecer uma transcrição completa de uma call de vendas, a tua resposta deve ser objetiva e fornecer um feedback generalizado sobre três momentos-chave: início, meio e fim da reunião. Não precisas de analisar cada segundo ou minuto da conversa, apenas destacar os pontos essenciais do desempenho do comercial nos seguintes aspetos:

Início da Call:
- Apresentação inicial: Como foi a introdução? O comercial gerou rapport com o lead?
- Perguntas: O comercial fez boas perguntas para entender as necessidades do lead?

Meio da Call:
- Apresentação do serviço/proposta: O comercial explicou bem a solução? Conseguiu manter o interesse?
- Lidar com objeções: Como o comercial geriu dúvidas e preocupações do lead?

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
- Não uses emojis, números, markdowns ou qualquer tipo de formatação especial. Apenas texto normal.
- Usa apenas texto limpo, pois o resultado será inserido diretamente no Google Sheets.
- Mantém o foco na qualidade do discurso, técnicas de venda, persuasão e fechamento.
- Se não houver momentos fortes ou fracos evidentes em alguma parte (início, meio ou fim), diz "Não foi identificado".

Todas as tuas respostas devem ser exclusivamente em português de Portugal (especificamente de Lisboa), respeitando as seguintes regras:

1. Tratamento: Utiliza "tu" em vez de "você" para tratamento informal e "o senhor/a senhora" para tratamento formal.
2. Pronomes e Conjugações: Utiliza "tu fazes" em vez de "você faz", utiliza os pronomes "te/ti/contigo" em vez de formas com "você", utiliza a 2ª pessoa do singular nas conjugações verbais: "tu estás", "tu vais", etc.
3. Evita gerúndios: Utiliza "estou a fazer" em vez de "estou fazendo", utiliza "estamos a analisar" em vez de "estamos analisando", substitui todas as construções com gerúndio pela estrutura "a + infinitivo".
4. Colocação dos pronomes clíticos: Prefere a ênclise na maioria dos contextos ("Disse-me" em vez de "Me disse").
5. Preserva os sons e sotaque lisboeta, que tende a reduzir as vogais átonas.
6. Utiliza sempre o pretérito perfeito simples em vez do composto em situações de ações concluídas ("Eu comi" em vez de "Eu tenho comido").

É ABSOLUTAMENTE ESSENCIAL que todas as respostas sigam estas regras, sem exceção. Em caso de dúvida, opta sempre pela forma utilizada em Portugal, especificamente em Lisboa.

TRANSCRIÇÃO:
${transcription}`

    const momentsResult = await analyzeInChunks(
      transcription,
      momentsPrompt,
      'És um analista especializado em análise temporal de chamadas de vendas.',
      'moments analysis'
    )

    // Step 7: Call Summary Analysis (Resumo da Call)
    console.log('📋 Step 7: Analyzing call summary...')
    const callSummaryPrompt = `Analisa a seguinte transcrição de uma reunião de vendas e cria um resumo detalhado dos momentos fortes e fracos do COMERCIAL (vendedor) ao longo da call.

IMPORTANTE: Primeiro identifica quem é o COMERCIAL na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

Depois analisa APENAS o desempenho do COMERCIAL identificado.

TRANSCRIÇÃO:
${transcription}

Cria um resumo estruturado com os seguintes pontos:

Momentos Fortes do Comercial:
- Início: [Analisa como o comercial se apresentou, criou rapport, e iniciou a conversa]
- Meio: [Analisa como o comercial apresentou a proposta, lidou com objeções, e manteve o interesse]
- Fim: [Analisa como o comercial fechou a reunião, definiu próximos passos, e criou compromisso]

Momentos Fracos do Comercial:
- Início: [Identifica falhas na apresentação inicial, criação de rapport, ou organização]
- Meio: [Identifica problemas na apresentação da proposta, gestão de objeções, ou comunicação]
- Fim: [Identifica falhas no fechamento, definição de próximos passos, ou clareza]

Regras importantes:
- Usa sempre timestamps das falas para contextualizar
- Inclui citações diretas da transcrição quando relevante
- Foca apenas no desempenho do COMERCIAL
- Seja específico e objetivo
- Usa português de Portugal (Lisboa)
- Evita gerúndios, usa pretérito perfeito simples
- Não uses emojis ou formatação especial

Estrutura a resposta exatamente assim:

Momentos Fortes do Comercial:
- Início: [texto]
- Meio: [texto]  
- Fim: [texto]

Momentos Fracos do Comercial:
- Início: [texto]
- Meio: [texto]
- Fim: [texto]`

    const callSummaryResult = await analyzeInChunks(
      transcription,
      callSummaryPrompt,
      'És um analista especializado em resumos de chamadas de vendas.',
      'call summary analysis'
    )

    // Step 8: General Tips Analysis (Dicas Gerais)
    console.log('🧠 Step 8: Analyzing general tips...')
    const tipsPrompt = `Analisa a seguinte transcrição de uma reunião de vendas e fornece dicas gerais para melhorar o desempenho do vendedor.

IMPORTANTE: Primeiro identifica quem é o vendedor na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

Depois analisa APENAS o desempenho do vendedor identificado.

TRANSCRIÇÃO:
${transcription}

Fornece dicas gerais que nem são pontos FORTES nem pontos FRACOS, mas que poderiam melhorar a performance geral de reuniões futuras.

Foca em:
- Técnicas de comunicação que poderiam ser melhoradas
- Estratégias de escuta ativa
- Formas de aprofundar a descoberta de necessidades
- Técnicas de apresentação de valor
- Habilidades de gestão de objeções
- Estratégias de fechamento

Estrutura a resposta como uma lista de dicas práticas e acionáveis.
Seja específico e objetivo.
Usa português de Portugal (Lisboa).
Evita gerúndios, usa pretérito perfeito simples.
Não uses emojis ou formatação especial.`

    const tipsResult = await analyzeInChunks(
      transcription,
      tipsPrompt,
      'És um analista especializado em dicas de melhoria para vendas.',
      'tips analysis'
    )

    // Step 9: Focus for Next Calls Analysis (Foco para próximas calls)
    console.log('🚀 Step 9: Analyzing focus for next calls...')
    const focusPrompt = `Analisa a seguinte transcrição de uma reunião de vendas e identifica o foco específico para próximas calls.

IMPORTANTE: Primeiro identifica quem é o vendedor na transcrição. Procura por:
- Quem faz perguntas sobre necessidades, problemas, orçamento
- Quem apresenta soluções, produtos ou serviços  
- Quem conduz a reunião
- Quem fala sobre preços, propostas, ou próximos passos

Depois analisa APENAS o desempenho do vendedor identificado.

TRANSCRIÇÃO:
${transcription}

Identifica o foco específico para próximas calls, explicando concretamente como ultrapassar os obstáculos encontrados e melhorar as falhas delineadas, ao mesmo tempo que partilhando as ferramentas a serem utilizadas para ajudar todo o processo.

Foca em:
- Áreas específicas que precisam de melhoria
- Técnicas ou estratégias a implementar
- Ferramentas ou recursos a utilizar
- Objetivos específicos para a próxima call
- Métricas ou indicadores a monitorizar

Estrutura a resposta como um plano de ação claro e específico.
Seja prático e acionável.
Usa português de Portugal (Lisboa).
Evita gerúndios, usa pretérito perfeito simples.
Não uses emojis ou formatação especial.`

    const focusResult = await analyzeInChunks(
      transcription,
      focusPrompt,
      'És um analista especializado em planos de ação para vendas.',
      'focus analysis'
    )

    // Helper function to make GPT calls
    async function makeGPTCall(prompt: string, systemMessage: string) {
      // Estimate total tokens for this request
      const systemTokens = estimateTokens(systemMessage)
      const promptTokens = estimateTokens(prompt)
      const totalTokens = systemTokens + promptTokens
      
      console.log(`🔢 Token estimation: System=${systemTokens}, Prompt=${promptTokens}, Total=${totalTokens}`)
      
      // Ensure we stay well under the 128K limit (using 100K as safety margin)
      if (totalTokens > 100000) {
        throw new Error(`Token count too high: ${totalTokens} tokens. Maximum allowed: 100000 tokens.`)
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GPT call failed: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      return result.choices[0].message.content
    }

    // Combine all results into a comprehensive analysis
    console.log('🔗 Combining analysis results...')
    
    let combinedAnalysis: any = {
      callType: callTypeResult.trim(),
      quantitativeAnalysis: quantitativeResult,
      strengths: [],
      weaknesses: [],
      scoring: {},
      strongMoments: {},
      weakMoments: {},
      callSummary: {},
      tips: '',
      focus: ''
    }

    // Parse JSON results
    try {
      const strengthsParsed = JSON.parse(strengthsResult)
      combinedAnalysis.strengths = Array.isArray(strengthsParsed) ? strengthsParsed : [strengthsParsed]
    } catch (error) {
      console.warn('⚠️ Could not parse strengths as JSON:', strengthsResult)
      combinedAnalysis.strengths = [{ description: strengthsResult }]
    }

    try {
      const weaknessesParsed = JSON.parse(weaknessesResult)
      combinedAnalysis.weaknesses = Array.isArray(weaknessesParsed) ? weaknessesParsed : [weaknessesParsed]
    } catch (error) {
      console.warn('⚠️ Could not parse weaknesses as JSON:', weaknessesResult)
      combinedAnalysis.weaknesses = [{ description: weaknessesResult }]
    }

    try {
      const scoringParsed = JSON.parse(scoringResult)
      combinedAnalysis.scoring = scoringParsed
    } catch (error) {
      console.warn('⚠️ Could not parse scoring as JSON, parsing as text:', scoringResult)
      // Parse the text format scoring result
      const scoringLines = scoringResult.split('\n').filter(line => line.trim())
      const scoringObj: any = { raw: scoringResult }
      
      scoringLines.forEach(line => {
        const match = line.match(/^(.+?):\s*(\d+)\/5$/)
        if (match) {
          const key = match[1].trim().toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[çãõ]/g, (char) => {
              if (char === 'ç') return 'c'
              if (char === 'ã') return 'a'
              if (char === 'õ') return 'o'
              return char
            })
          const score = parseInt(match[2])
          scoringObj[key] = score
        }
      })
      
      combinedAnalysis.scoring = scoringObj
    }

    try {
      const momentsParsed = JSON.parse(momentsResult)
      combinedAnalysis.strongMoments = momentsParsed.strongMoments || momentsParsed
      combinedAnalysis.weakMoments = momentsParsed.weakMoments || momentsParsed
    } catch (error) {
      console.warn('⚠️ Could not parse moments as JSON:', momentsResult)
      combinedAnalysis.strongMoments = { raw: momentsResult }
      combinedAnalysis.weakMoments = { raw: momentsResult }
    }

    try {
      const callSummaryParsed = JSON.parse(callSummaryResult)
      combinedAnalysis.callSummary = callSummaryParsed
    } catch (error) {
      console.warn('⚠️ Could not parse call summary as JSON:', callSummaryResult)
      combinedAnalysis.callSummary = { raw: callSummaryResult }
    }

    // Add tips and focus results
    combinedAnalysis.tips = tipsResult
    combinedAnalysis.focus = focusResult

    console.log('✅ Multi-step analysis completed successfully')
    console.log('📊 Combined analysis structure:', Object.keys(combinedAnalysis))
    console.log('📝 Scoring analysis preview:')
    console.log('--- START OF SCORING ---')
    console.log(combinedAnalysis.scoring?.raw || combinedAnalysis.scoring)
    console.log('--- END OF SCORING ---')
    console.log('📝 Full analysis preview:')
    console.log('--- START OF ANALYSIS ---')
    console.log(JSON.stringify(combinedAnalysis, null, 2))
    console.log('--- END OF ANALYSIS ---')

                   // Save analysis to Supabase if userId is provided
      let analysisId = null
      if (userId) {
        try {
         console.log('💾 Saving analysis to Supabase...')
         
         // Extract score from scoring analysis
         let score = 0
         try {
           const scoringText = combinedAnalysis.scoring.raw || combinedAnalysis.scoring || ''
           console.log('🔍 Extracting score from:', scoringText.substring(0, 200) + '...')
           
           // Try multiple patterns to extract the score
           const patterns = [
             /Pontuação Total:\s*(\d+)\/40/i,
             /Pontuação Total:\s*(\d+)/i,
             /Total:\s*(\d+)\/40/i,
             /Score:\s*(\d+)\/40/i,
             /Score:\s*(\d+)/i,
             /(\d+)\/40\s*\(Total\)/i,
             /Total Score:\s*(\d+)/i,
             /(\d+)\s*\/\s*40/i
           ]
           
           for (const pattern of patterns) {
             const scoreMatch = scoringText.match(pattern)
             if (scoreMatch) {
               score = parseFloat(scoreMatch[1])
               console.log('✅ Score extracted with pattern:', pattern, 'Score:', score)
               break
             }
           }
           
           // If no pattern matched, try to find any number followed by /40
           if (score === 0) {
             const fallbackMatch = scoringText.match(/(\d+)\/40/)
             if (fallbackMatch) {
               score = parseFloat(fallbackMatch[1])
               console.log('✅ Score extracted with fallback pattern. Score:', score)
             }
           }
           
           // If still no score found, try to find any number that could be a score
           if (score === 0) {
             const numbers = scoringText.match(/\b(\d{1,2})\b/g)
             if (numbers) {
               const possibleScores = numbers.map((n: string) => parseInt(n)).filter((n: number) => n >= 0 && n <= 40)
               if (possibleScores.length > 0) {
                 // Take the highest number that could be a score
                 score = Math.max(...possibleScores)
                 console.log('✅ Score extracted from possible scores:', possibleScores, 'Selected:', score)
               }
             }
           }
           
         } catch (error) {
           console.warn('⚠️ Could not extract score from analysis:', error)
         }
         
         // Ensure score is a valid number and within range
         if (isNaN(score) || score < 0 || score > 40) {
           console.warn('⚠️ Invalid score detected, setting to 0:', score)
           score = 0
         }
         
                   console.log('📊 Final score value:', score, 'Type:', typeof score)

          // Validate user exists in profiles
         console.log('🔍 Validating user...')
         
         const { data: user, error: userError } = await supabase
           .from('profiles')
           .select('id')
           .eq('id', userId)
           .single()
         
         if (userError || !user) {
           console.error('❌ User not found in profiles:', userId)
           throw new Error(`User with ID ${userId} not found in profiles`)
         }
         
         console.log('✅ User validation passed')

                   // Validate and normalize call_type
          let normalizedCallType = 'Reunião de Descoberta' // Default to Reunião de Descoberta
          if (combinedAnalysis.callType) {
            const callTypeText = combinedAnalysis.callType.trim()
            // Check for exact matches first
            if (['Chamada Fria', 'Chamada de Agendamento', 'Reunião de Descoberta', 'Reunião de Fecho', 'Reunião de Esclarecimento de Dúvidas', 'Reunião de One Call Close'].includes(callTypeText)) {
              normalizedCallType = callTypeText
            } else {
              // Try to extract call type from the text
              const lowerCallType = callTypeText.toLowerCase()
              if (lowerCallType.includes('chamada fria') || lowerCallType.includes('cold call')) {
                normalizedCallType = 'Chamada Fria'
              } else if (lowerCallType.includes('agendamento') || lowerCallType.includes('scheduling')) {
                normalizedCallType = 'Chamada de Agendamento'
              } else if (lowerCallType.includes('descoberta') || lowerCallType.includes('discovery')) {
                normalizedCallType = 'Reunião de Descoberta'
              } else if (lowerCallType.includes('fecho') || lowerCallType.includes('closing')) {
                normalizedCallType = 'Reunião de Fecho'
              } else if (lowerCallType.includes('esclarecimento') || lowerCallType.includes('dúvidas') || lowerCallType.includes('q&a')) {
                normalizedCallType = 'Reunião de Esclarecimento de Dúvidas'
              } else if (lowerCallType.includes('one call close') || lowerCallType.includes('one call')) {
                normalizedCallType = 'Reunião de One Call Close'
              }
            }
          }
          
                    console.log('📝 Original call type:', combinedAnalysis.callType)
          console.log('📝 Normalized call type:', normalizedCallType)

          // Create feedback summary
          const feedbackSummary = `${combinedAnalysis.strengths?.length ? 'Strengths identified. ' : ''}${combinedAnalysis.weaknesses?.length ? 'Areas for improvement noted. ' : ''}Call type: ${normalizedCallType}`

          // Prepare the data to be inserted
         const insertData: any = {
           user_id: userId,
           status: 'completed',
           call_type: normalizedCallType,
           feedback: feedbackSummary,
           score: score,
           title: originalFileName ? originalFileName.replace(/\.[^/.]+$/, '').trim() : `Análise ${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`, // Store original file name without extension
           analysis: combinedAnalysis,
           analysis_metadata: {
             transcription_length: transcription.length,
             processing_time: new Date().toISOString(),
             analysis_steps: 6,
             was_truncated: false,
             analysis_method: 'chunked_full_context',
             original_sales_call_id: salesCallId || null, // Store original ID if provided
             original_file_name: originalFileName || null, // Store original filename for display
             content_hash: contentHash // Store the content hash for future deduplication
           },
           transcription: transcription,
           custom_prompts: [
             'Call Type Classification',
             'Quantitative Analysis', 
             'Strong Points Analysis',
             'Weak Points Analysis',
             'Scoring Analysis',
             'Moments by Phase Analysis'
           ]
         }

         console.log('💾 Attempting to save analysis to Supabase...')
         console.log('📊 Insert data structure:', Object.keys(insertData))
         console.log('👤 User ID:', userId)
         console.log('📝 Call Type:', combinedAnalysis.callType)
         console.log('📊 Score:', score)
         console.log('📏 Transcription length:', transcription.length)
         console.log('📁 Original filename:', originalFileName)
         console.log('📝 Title being saved:', insertData.title)
         console.log('📝 Title type:', typeof insertData.title)
         console.log('📝 Title length:', insertData.title?.length)

         // Check if data is too large for Supabase
         const dataSize = JSON.stringify(insertData).length
         console.log('📊 Total data size:', dataSize, 'characters')
         
         if (dataSize > 1000000) { // 1MB limit
           console.warn('⚠️ Data size exceeds 1MB, truncating transcription...')
           insertData.transcription = insertData.transcription.substring(0, 500000) // Keep first 500K chars
           console.log('📏 Truncated transcription length:', insertData.transcription.length)
         }

         const { data, error } = await supabase
           .from('sales_call_analyses')
           .insert(insertData)
           .select()
           .single()

         if (error) {
           console.error('❌ Error saving to Supabase:', error)
           console.error('🔍 Error details:', {
             code: error.code,
             message: error.message,
             details: error.details,
             hint: error.hint
           })
           console.error('📊 Data that failed to insert:', JSON.stringify(insertData, null, 2))
           
           // Log the raw error response for debugging
           console.error('🔍 Raw error object:', JSON.stringify(error, null, 2))
           
           // Check for specific error types
           if (error.code === '23505') {
             console.error('❌ Duplicate key violation detected')
           } else if (error.code === '23503') {
             console.error('❌ Foreign key violation detected')
           } else if (error.code === '23502') {
             console.error('❌ Not null violation detected')
           } else if (error.code === '22P02') {
             console.error('❌ Invalid text representation detected')
           }
           
           throw new Error(`Failed to save analysis: ${error.message} (Code: ${error.code})`)
         }

         analysisId = data.id
         console.log('✅ Analysis saved to Supabase with ID:', analysisId)
         console.log('📝 Saved title:', data.title)
         console.log('📝 Saved data:', JSON.stringify(data, null, 2))
         
       } catch (error) {
         console.error('❌ Error saving analysis to Supabase:', error)
         // Continue with the response even if Supabase save fails
       }
     }

    return NextResponse.json({
      success: true,
      analysis: combinedAnalysis,
      analysisId: analysisId,
      message: 'Multi-step analysis completed successfully',
      transcriptionLength: transcription.length,
      processedLength: transcription.length,
      wasTruncated: false,
      analysisMethod: 'chunked_full_context'
    })

  } catch (error) {
    console.error('💥 Analysis API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
