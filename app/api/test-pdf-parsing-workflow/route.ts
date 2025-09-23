import { NextRequest, NextResponse } from 'next/server'
import { getKnowledgeForCallType } from '@/lib/sales-analyst-knowledge'
import { enhancePromptWithCallTypeKnowledge } from '@/lib/comprehensive-prompts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callType = searchParams.get('callType') || 'Chamada Fria'
    
    console.log(`\n🧪 ===== TESTING PDF PARSING WORKFLOW =====`)
    console.log(`📋 Call Type: ${callType}`)
    
    // Step 1: Test knowledge fetching
    console.log(`\n📥 Step 1: Fetching knowledge for ${callType}...`)
    const knowledge = await getKnowledgeForCallType(callType)
    
    console.log(`📊 Knowledge Results:`)
    console.log(`   - Has Knowledge: ${knowledge && knowledge.trim().length > 0}`)
    console.log(`   - Knowledge Length: ${knowledge ? knowledge.length : 0} characters`)
    
    if (knowledge && knowledge.length > 0) {
      console.log(`   - Knowledge Preview: ${knowledge.substring(0, 300)}...`)
    }
    
    // Step 2: Test prompt enhancement
    console.log(`\n🔧 Step 2: Testing prompt enhancement...`)
    const basePrompt = `Identifica e resume os pontos fortes da reunião de vendas com base na transcrição fornecida.

IMPORTANTE: Antes de começar a análise, identifica claramente quem é o VENDEDOR/COMERCIAL na transcrição. O comercial é normalmente a pessoa que:
- Apresenta produtos/serviços
- Faz perguntas sobre necessidades do cliente
- Tenta fechar a venda
- Tem um papel ativo de vendas

A tua análise deve focar APENAS no desempenho do VENDEDOR identificado.

CRÍTICO: Na tua resposta, NUNCA uses "Speaker A" ou "Speaker B". Sempre refere-te ao comercial como "o comercial" e ao cliente como "o cliente". NUNCA combines "comercial" com "Speaker A/B" - usa APENAS "o comercial".

REGRAS CRÍTICAS PARA IDENTIFICAÇÃO DE PONTOS FORTES:

1. NÃO consideres como pontos fortes:
   - Partilha de ecrã - é uma ferramenta essencial, não um ponto forte
   - Ações básicas como "dizer olá" ou "apresentar-se"
   - Técnicas padrão que qualquer comercial deveria fazer
   - Ferramentas ou recursos utilizados (como partilhar ecrã)

2. FOCA em pontos fortes reais:
   - Perguntas estratégicas e bem formuladas
   - Escuta ativa e empatia genuína
   - Apresentação personalizada da solução
   - Gestão eficaz de objeções
   - Criação de rapport e confiança
   - Estrutura clara e controlo da reunião
   - Fechamento eficaz com próximos passos claros

O feedback deve ser objetivo, conciso (máx. 140 palavras) e focado na melhoria contínua.  
Deve responder sempre em português de Lisboa.  
Cada ponto forte deve ter um Momento exato (Timestamp) e uma Citação Direta da transcrição.  
Se uma citação contiver erros gramaticais, palavras truncadas ou frases incompletas, corrige-a para garantir um português fluente e natural, mantendo o significado original.

REGRAS DE COMUNICAÇÃO:
Todas as tuas respostas devem ser exclusivamente em português de Portugal (especificamente de Lisboa), respeitando as seguintes regras:  

1. Tratamento: Utiliza "tu" em vez de "você" para tratamento informal e "o senhor/a senhora" para tratamento formal.  
2. Pronomes e Conjugações: Utiliza "tu fazes" em vez de "você faz", "te/ti/contigo" em vez de formas com "você", e a 2ª pessoa do singular nas conjugações verbais.  
3. Evita gerúndios: Utiliza "estou a fazer" em vez de "estou fazendo", "estamos a analisar" em vez de "estamos analisando".  
4. Colocação dos pronomes clíticos: Prefere a ênclise na maioria dos contextos ("Disse-me" em vez de "Me disse").  
5. Preserva os sons e sotaque lisboeta, que tende a reduzir as vogais átonas.  
6. Utiliza sempre o pretérito perfeito simples em vez do composto em situações de ações concluídas ("Eu comi" em vez de "Eu tenho comido").  
7. SE FOR O COMERCIAL A FALAR FALA SEMPRE NA TERCEIRA PESSOA DO SINGULAR, POR EXEMPLO: "TU FALASTE", "TU INICIASTE" ETC

É ABSOLUTAMENTE ESSENCIAL que todas as respostas sigam estas regras, sem exceção. Em caso de dúvida, opta sempre pela forma utilizada em Portugal, especificamente em Lisboa.

Estrutura da Resposta (formato de lista com bullets):

- **Boa Abordagem Inicial**: Momento em que a introdução foi clara, envolvente e estabeleceu rapport com o cliente. Timestamp: [Momento exato] "[Citação direta retirada da transcrição]"

- **Identificação Eficaz de Necessidades**: Quando o comercial fez perguntas relevantes que ajudaram a entender as necessidades do cliente. Timestamp: [Momento exato] "[Citação direta retirada da transcrição]"

- **Apresentação Clara de Soluções**: Onde o comercial explicou de forma convincente como o produto ou serviço resolve o problema do cliente. Timestamp: [Momento exato] "[Citação direta retirada da transcrição]"

- **Gestão de Objeções**: Situações em que o comercial lidou bem com dúvidas ou hesitações do cliente. Timestamp: [Momento exato] "[Citação direta retirada da transcrição]"

- **Conclusão Positiva**: Momentos em que o comercial avançou eficazmente para o próximo passo ou para o fecho da venda. Timestamp: [Momento exato] "[Citação direta retirada da transcrição]"

Instruções Críticas:
- USA markdown para criar a lista com bullets (formato: - **Título**: texto...)
- Escreve sempre em português de Lisboa.
- Inclui citação direta do transcript para cada ponto forte, com o timestamp exato.
- USA APENAS o formato de bullet list especificado acima.
- NÃO incluas títulos como "Pontos Fortes da Reunião" - começa diretamente com os pontos individuais em formato de lista.

Transcrição para análise:
teste`

    const enhancedPrompt = await enhancePromptWithCallTypeKnowledge(basePrompt, callType)
    
    console.log(`📊 Prompt Enhancement Results:`)
    console.log(`   - Base Prompt Length: ${basePrompt.length} characters`)
    console.log(`   - Enhanced Prompt Length: ${enhancedPrompt.length} characters`)
    console.log(`   - Enhancement Ratio: ${(enhancedPrompt.length / basePrompt.length).toFixed(2)}x`)
    
    // Step 3: Show the final prompt structure
    console.log(`\n📝 Step 3: Final Enhanced Prompt Structure:`)
    const knowledgeSection = enhancedPrompt.substring(0, enhancedPrompt.indexOf('Identifica e resume'))
    const analysisSection = enhancedPrompt.substring(enhancedPrompt.indexOf('Identifica e resume'))
    
    console.log(`   - Knowledge Section Length: ${knowledgeSection.length} characters`)
    console.log(`   - Analysis Section Length: ${analysisSection.length} characters`)
    
    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      testResults: {
        callType,
        timestamp: new Date().toISOString(),
        knowledgeFetching: {
          hasKnowledge: knowledge && knowledge.trim().length > 0,
          knowledgeLength: knowledge ? knowledge.length : 0,
          knowledgePreview: knowledge ? knowledge.substring(0, 500) : null,
          knowledgeSource: knowledge && knowledge.includes('CONHECIMENTO ESPECÍFICO') ? 'blob-storage' : 'local-fallback'
        },
        promptEnhancement: {
          basePromptLength: basePrompt.length,
          enhancedPromptLength: enhancedPrompt.length,
          enhancementRatio: enhancedPrompt.length / basePrompt.length,
          knowledgeSectionLength: knowledgeSection.length,
          analysisSectionLength: analysisSection.length
        },
        finalPrompt: {
          knowledgeSection: knowledgeSection,
          analysisSection: analysisSection,
          fullPrompt: enhancedPrompt
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Test workflow failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
