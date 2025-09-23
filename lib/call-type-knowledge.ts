// Knowledge base for different types of sales calls
// This defines specific knowledge, techniques, and best practices for each call type

export interface CallTypeKnowledge {
  name: string
  description: string
  objectives: string[]
  keyTechniques: string[]
  commonChallenges: string[]
  successMetrics: string[]
  bestPractices: string[]
  commonMistakes: string[]
  specificPrompts: string[]
}

export const CALL_TYPE_KNOWLEDGE: Record<string, CallTypeKnowledge> = {
  'Chamada Fria': {
    name: 'Chamada Fria',
    description: 'Primeira abordagem a um prospect que não conhece a empresa ou solução',
    objectives: [
      'Captar a atenção nos primeiros 10 segundos',
      'Identificar se o prospect tem o problema que a solução resolve',
      'Agendar uma reunião de descoberta',
      'Qualificar o prospect (autoridade, necessidade, orçamento)'
    ],
    keyTechniques: [
      'Abertura com padrão de interrupção',
      'Pergunta de qualificação inicial',
      'Uso de referências ou casos de sucesso',
      'Técnica do "menos é mais" - falar pouco, perguntar muito',
      'Criação de urgência ou escassez'
    ],
    commonChallenges: [
      'Resistência inicial do prospect',
      'Falta de contexto sobre a empresa',
      'Objeções de tempo ("não tenho tempo agora")',
      'Desconfiança por ser uma abordagem não solicitada'
    ],
    successMetrics: [
      'Taxa de conversão para reunião agendada',
      'Tempo de duração da chamada',
      'Qualidade das perguntas feitas',
      'Informações coletadas sobre o prospect'
    ],
    bestPractices: [
      'Pesquisar o prospect antes da chamada',
      'Ter um script flexível, não rígido',
      'Focar em benefícios, não características',
      'Usar tom conversacional, não comercial',
      'Fazer perguntas abertas para descobrir necessidades'
    ],
    commonMistakes: [
      'Falar demais sobre a empresa/produto',
      'Não fazer perguntas de qualificação',
      'Desistir na primeira objeção',
      'Não ter um próximo passo claro',
      'Não adaptar o discurso ao perfil do prospect'
    ],
    specificPrompts: [
      'Como foi a abertura da chamada? O comercial conseguiu captar a atenção nos primeiros segundos?',
      'Que técnicas de qualificação foram utilizadas?',
      'Como o comercial lidou com a resistência inicial?',
      'Foi estabelecido um próximo passo claro?'
    ]
  },

  'Chamada de Agendamento': {
    name: 'Chamada de Agendamento',
    description: 'Chamada para agendar uma reunião mais detalhada após interesse inicial',
    objectives: [
      'Confirmar o interesse do prospect',
      'Alinhar expectativas sobre a reunião',
      'Definir agenda e participantes',
      'Manter o momentum e urgência'
    ],
    keyTechniques: [
      'Confirmação do interesse manifestado',
      'Criação de expectativa sobre a reunião',
      'Definição clara de agenda',
      'Identificação dos decisores',
      'Uso de calendário para criar compromisso'
    ],
    commonChallenges: [
      'Perda de interesse entre o primeiro contato e agendamento',
      'Dificuldade em alinhar agendas',
      'Indefinição sobre quem deve participar',
      'Expectativas não alinhadas'
    ],
    successMetrics: [
      'Taxa de comparecimento na reunião agendada',
      'Qualidade dos participantes confirmados',
      'Clareza da agenda definida',
      'Tempo entre agendamento e reunião'
    ],
    bestPractices: [
      'Reforçar o valor da reunião',
      'Ser flexível com horários',
      'Confirmar participantes-chave',
      'Enviar convite imediatamente',
      'Fazer follow-up antes da reunião'
    ],
    commonMistakes: [
      'Não confirmar a necessidade/interesse',
      'Agendar muito longe no futuro',
      'Não definir agenda clara',
      'Não identificar decisores',
      'Não fazer follow-up de confirmação'
    ],
    specificPrompts: [
      'O comercial confirmou o interesse antes de agendar?',
      'Foi definida uma agenda clara para a próxima reunião?',
      'Os participantes corretos foram identificados?',
      'Houve criação de expectativa sobre o valor da reunião?'
    ]
  },

  'Reunião de Descoberta': {
    name: 'Reunião de Descoberta',
    description: 'Reunião focada em entender profundamente as necessidades e desafios do prospect',
    objectives: [
      'Mapear a situação atual do prospect',
      'Identificar dores e necessidades específicas',
      'Entender o processo de decisão',
      'Qualificar orçamento e timeline',
      'Construir relacionamento e confiança'
    ],
    keyTechniques: [
      'Técnica BANT (Budget, Authority, Need, Timeline)',
      'Perguntas abertas e de aprofundamento',
      'Escuta ativa e reformulação',
      'Mapeamento de stakeholders',
      'Técnica do "Por quê?" (5 whys)'
    ],
    commonChallenges: [
      'Prospect não se abrir sobre problemas reais',
      'Informações sobre orçamento limitadas',
      'Múltiplos decisores não presentes',
      'Necessidades vagas ou mal definidas'
    ],
    successMetrics: [
      'Profundidade das informações coletadas',
      'Clareza sobre o processo de decisão',
      'Identificação de dores específicas',
      'Qualificação de orçamento e timeline'
    ],
    bestPractices: [
      'Preparar perguntas estratégicas',
      'Focar 80% do tempo em perguntas',
      'Tomar notas visíveis',
      'Fazer resumos durante a conversa',
      'Confirmar entendimento antes de prosseguir'
    ],
    commonMistakes: [
      'Falar demais sobre a solução',
      'Não fazer perguntas de aprofundamento',
      'Assumir necessidades sem confirmar',
      'Não mapear o processo de decisão',
      'Pular etapas de qualificação'
    ],
    specificPrompts: [
      'Que perguntas de descoberta foram feitas?',
      'O comercial conseguiu identificar dores específicas?',
      'Foi mapeado o processo de decisão da empresa?',
      'Houve qualificação de orçamento e timeline?'
    ]
  },

  'Reunião de Fecho': {
    name: 'Reunião de Fecho',
    description: 'Reunião focada em apresentar a proposta e fechar o negócio',
    objectives: [
      'Apresentar solução personalizada',
      'Lidar com objeções finais',
      'Negociar termos e condições',
      'Obter compromisso de compra',
      'Definir próximos passos para implementação'
    ],
    keyTechniques: [
      'Apresentação baseada nas necessidades descobertas',
      'Técnicas de fechamento (assumptivo, alternativo, urgência)',
      'Tratamento de objeções com método LAER',
      'Uso de casos de sucesso similares',
      'Criação de senso de urgência'
    ],
    commonChallenges: [
      'Objeções de preço',
      'Necessidade de aprovação de terceiros',
      'Comparação com concorrentes',
      'Adiamento da decisão'
    ],
    successMetrics: [
      'Taxa de fechamento',
      'Valor do negócio fechado',
      'Tempo de ciclo de vendas',
      'Satisfação do cliente com a proposta'
    ],
    bestPractices: [
      'Conectar solução às dores identificadas',
      'Apresentar ROI claro',
      'Usar prova social',
      'Ser flexível na negociação',
      'Confirmar decisores presentes'
    ],
    commonMistakes: [
      'Apresentar solução genérica',
      'Não lidar adequadamente com objeções',
      'Pressionar demais',
      'Não ter alternativas preparadas',
      'Não definir próximos passos claros'
    ],
    specificPrompts: [
      'A proposta foi personalizada para as necessidades identificadas?',
      'Como foram tratadas as objeções de preço?',
      'Houve uso de técnicas de fechamento adequadas?',
      'Foi criado senso de urgência apropriado?'
    ]
  },

  'Reunião de Esclarecimento de Dúvidas': {
    name: 'Reunião de Esclarecimento de Dúvidas',
    description: 'Reunião para esclarecer dúvidas técnicas ou comerciais antes da decisão',
    objectives: [
      'Esclarecer dúvidas técnicas específicas',
      'Resolver objeções pendentes',
      'Fornecer informações adicionais',
      'Remover barreiras para a decisão',
      'Reforçar valor da solução'
    ],
    keyTechniques: [
      'Escuta ativa das preocupações',
      'Explicações técnicas simplificadas',
      'Uso de analogias e exemplos',
      'Demonstrações práticas',
      'Conexão com especialistas técnicos'
    ],
    commonChallenges: [
      'Dúvidas técnicas complexas',
      'Múltiplas objeções simultâneas',
      'Necessidade de validação técnica',
      'Comparação detalhada com concorrentes'
    ],
    successMetrics: [
      'Número de dúvidas resolvidas',
      'Satisfação com as explicações',
      'Redução de objeções',
      'Progressão no processo de decisão'
    ],
    bestPractices: [
      'Preparar respostas para dúvidas comuns',
      'Trazer especialistas quando necessário',
      'Usar materiais de apoio visuais',
      'Confirmar entendimento',
      'Documentar acordos e esclarecimentos'
    ],
    commonMistakes: [
      'Não preparar adequadamente',
      'Dar respostas vagas ou evasivas',
      'Não confirmar se a dúvida foi esclarecida',
      'Não conectar esclarecimentos ao valor',
      'Não definir próximos passos'
    ],
    specificPrompts: [
      'As dúvidas foram esclarecidas de forma clara?',
      'O comercial demonstrou conhecimento técnico adequado?',
      'Foram usados exemplos práticos nas explicações?',
      'Houve confirmação de que as dúvidas foram resolvidas?'
    ]
  },

  'Reunião de One Call Close': {
    name: 'Reunião de One Call Close',
    description: 'Reunião que combina descoberta, apresentação e fechamento em uma única sessão',
    objectives: [
      'Descobrir necessidades rapidamente',
      'Apresentar solução de forma impactante',
      'Lidar com objeções imediatamente',
      'Fechar o negócio na mesma chamada',
      'Criar urgência para decisão imediata'
    ],
    keyTechniques: [
      'Estrutura SPIN (Situation, Problem, Implication, Need-payoff)',
      'Apresentação orientada por benefícios',
      'Técnicas de fechamento múltiplas',
      'Criação de urgência genuína',
      'Uso intensivo de prova social'
    ],
    commonChallenges: [
      'Tempo limitado para descoberta',
      'Necessidade de decisão rápida',
      'Múltiplas objeções em sequência',
      'Pressão de tempo'
    ],
    successMetrics: [
      'Taxa de fechamento na primeira chamada',
      'Valor médio dos negócios fechados',
      'Satisfação do cliente pós-venda',
      'Tempo médio de chamada'
    ],
    bestPractices: [
      'Estruturar a chamada claramente',
      'Ser eficiente na descoberta',
      'Criar momentum crescente',
      'Usar escassez de forma ética',
      'Ter múltiplas opções de fechamento'
    ],
    commonMistakes: [
      'Pular etapas de descoberta',
      'Pressionar de forma excessiva',
      'Não adaptar ao ritmo do prospect',
      'Não ter alternativas preparadas',
      'Não confirmar entendimento antes de fechar'
    ],
    specificPrompts: [
      'A estrutura da chamada foi bem organizada?',
      'Houve descoberta adequada mesmo com tempo limitado?',
      'As técnicas de fechamento foram aplicadas adequadamente?',
      'Foi criado senso de urgência apropriado?'
    ]
  }
}

// Helper function to get knowledge for a specific call type
export function getCallTypeKnowledge(callType: string): CallTypeKnowledge | null {
  return CALL_TYPE_KNOWLEDGE[callType] || null
}

// Helper function to get all available call types
export function getAvailableCallTypes(): string[] {
  return Object.keys(CALL_TYPE_KNOWLEDGE)
}

// Helper function to get specific prompts for a call type
export function getCallTypePrompts(callType: string): string[] {
  const knowledge = getCallTypeKnowledge(callType)
  return knowledge?.specificPrompts || []
}

// Helper function to get best practices for a call type
export function getCallTypeBestPractices(callType: string): string[] {
  const knowledge = getCallTypeKnowledge(callType)
  return knowledge?.bestPractices || []
}

// Helper function to get common mistakes for a call type
export function getCallTypeCommonMistakes(callType: string): string[] {
  const knowledge = getCallTypeKnowledge(callType)
  return knowledge?.commonMistakes || []
}
