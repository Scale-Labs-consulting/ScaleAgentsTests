import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export interface ExtractedPersonalInfo {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
  dateOfBirth: string
  nationality: string
  languages: string[]
  skills: string[]
  experienceYears: number
  education: string[]
  certifications: string[]
  availability: string
  salaryExpectation: string
  workPermit: string
  remotePreference: string
  noticePeriod: string
  summary: string
}

/**
 * Extract personal information from CV text using GPT
 * @param cvText - Extracted CV text
 * @returns Promise<ExtractedPersonalInfo> - Structured personal information
 */
export async function extractPersonalInfoFromCV(cvText: string): Promise<ExtractedPersonalInfo> {
  try {
    console.log('🤖 Starting personal information extraction...')
    
    const prompt = `Como assistente especializado em extração de informações de CVs, a tua função é extrair informações pessoais e profissionais de forma estruturada.

CV do candidato para análise:
${cvText.substring(0, 8000)}

IMPORTANTE: Responde APENAS com JSON válido, sem texto adicional, sem markdown, sem explicações.
A resposta deve ser EXATAMENTE neste formato JSON:

{
  "name": "Nome completo do candidato",
  "email": "Email do candidato",
  "phone": "Número de telefone",
  "location": "Localização/Cidade",
  "linkedin": "URL do LinkedIn (se disponível)",
  "github": "URL do GitHub (se disponível)",
  "website": "Website pessoal (se disponível)",
  "dateOfBirth": "Data de nascimento (YYYY-MM-DD ou texto)",
  "nationality": "Nacionalidade",
  "languages": ["Português", "Inglês"],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "experienceYears": 2,
  "education": ["Licenciatura em Engenharia Informática - Universidade de Lisboa"],
  "certifications": ["Certificação 1", "Certificação 2"],
  "availability": "Disponibilidade (ex: Imediata, 2 semanas)",
  "salaryExpectation": "Expectativa salarial (se mencionada)",
  "workPermit": "Permissão de trabalho (se mencionada)",
  "remotePreference": "Preferência de trabalho remoto",
  "noticePeriod": "Período de aviso prévio",
  "summary": "Resumo profissional em 2-3 frases"
}

INSTRUÇÕES ESPECÍFICAS:
- Se uma informação não estiver disponível, usa "Não especificado"
- Para arrays vazios, usa []
- Para números, usa 0 se não especificado
- Para URLs, inclui apenas se estiverem completas
- Para datas, usa formato YYYY-MM-DD se possível, senão texto
- Extrai pelo menos 5-10 skills mais relevantes
- Inclui todos os idiomas mencionados
- Para educação, inclui grau e instituição`

    console.log('🤖 Sending personal info extraction request to OpenAI...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized CV information extraction assistant. Always respond in Portuguese and provide structured analysis in JSON format. Extract all available personal and professional information accurately.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000
    })

    console.log('🤖 Received response from OpenAI')
    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    try {
      console.log('🤖 Parsing JSON response for personal info...')
      console.log('📄 Raw AI response:', response)
      
      // Clean the response
      let cleanedResponse = response.trim()
      
      // Remove markdown formatting if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\n?/, '')
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\n?/, '')
      }
      
      console.log('🧹 Cleaned response:', cleanedResponse)
      
      const extractedInfo = JSON.parse(cleanedResponse)
      console.log('✅ JSON parsing successful for personal info')
      console.log('📊 Extracted personal info:', extractedInfo)
      
      // Validate and provide defaults for missing fields
      const validatedInfo: ExtractedPersonalInfo = {
        name: extractedInfo.name || 'Não especificado',
        email: extractedInfo.email || 'Não especificado',
        phone: extractedInfo.phone || 'Não especificado',
        location: extractedInfo.location || 'Não especificado',
        linkedin: extractedInfo.linkedin || 'Não especificado',
        github: extractedInfo.github || 'Não especificado',
        website: extractedInfo.website || 'Não especificado',
        dateOfBirth: extractedInfo.dateOfBirth || 'Não especificado',
        nationality: extractedInfo.nationality || 'Não especificado',
        languages: Array.isArray(extractedInfo.languages) ? extractedInfo.languages : ['Português'],
        skills: Array.isArray(extractedInfo.skills) ? extractedInfo.skills : [],
        experienceYears: typeof extractedInfo.experienceYears === 'number' ? extractedInfo.experienceYears : 0,
        education: Array.isArray(extractedInfo.education) ? extractedInfo.education : [],
        certifications: Array.isArray(extractedInfo.certifications) ? extractedInfo.certifications : [],
        availability: extractedInfo.availability || 'Não especificado',
        salaryExpectation: extractedInfo.salaryExpectation || 'Não especificado',
        workPermit: extractedInfo.workPermit || 'Não especificado',
        remotePreference: extractedInfo.remotePreference || 'Não especificado',
        noticePeriod: extractedInfo.noticePeriod || 'Não especificado',
        summary: extractedInfo.summary || 'Resumo não disponível'
      }
      
      return validatedInfo
    } catch (parseError) {
      console.error('❌ JSON parse error for personal info:', parseError)
      console.log('📄 Raw response that failed to parse:', response)
      
      // Return default structure with error indication
      return {
        name: 'Erro na extração',
        email: 'Não especificado',
        phone: 'Não especificado',
        location: 'Não especificado',
        linkedin: 'Não especificado',
        github: 'Não especificado',
        website: 'Não especificado',
        dateOfBirth: 'Não especificado',
        nationality: 'Não especificado',
        languages: ['Português'],
        skills: [],
        experienceYears: 0,
        education: [],
        certifications: [],
        availability: 'Não especificado',
        salaryExpectation: 'Não especificado',
        workPermit: 'Não especificado',
        remotePreference: 'Não especificado',
        noticePeriod: 'Não especificado',
        summary: 'Erro na extração de informações pessoais'
      }
    }
  } catch (error) {
    console.error('❌ Personal info extraction error:', error)
    throw error
  }
}

/**
 * Prepare database update object from extracted personal info
 * @param personalInfo - Extracted personal information
 * @returns Object ready for database update
 */
export function preparePersonalInfoForDatabase(personalInfo: ExtractedPersonalInfo) {
  return {
    personal_info: personalInfo,
    extracted_name: personalInfo.name,
    extracted_email: personalInfo.email,
    extracted_phone: personalInfo.phone,
    extracted_location: personalInfo.location,
    extracted_linkedin: personalInfo.linkedin !== 'Não especificado' ? personalInfo.linkedin : null,
    extracted_github: personalInfo.github !== 'Não especificado' ? personalInfo.github : null,
    extracted_website: personalInfo.website !== 'Não especificado' ? personalInfo.website : null,
    extracted_date_of_birth: personalInfo.dateOfBirth !== 'Não especificado' ? personalInfo.dateOfBirth : null,
    extracted_nationality: personalInfo.nationality,
    extracted_languages: personalInfo.languages,
    extracted_skills: personalInfo.skills,
    extracted_experience_years: personalInfo.experienceYears,
    extracted_education: personalInfo.education,
    extracted_certifications: personalInfo.certifications,
    extracted_availability: personalInfo.availability,
    extracted_salary_expectation: personalInfo.salaryExpectation,
    extracted_work_permit: personalInfo.workPermit,
    extracted_remote_preference: personalInfo.remotePreference,
    extracted_notice_period: personalInfo.noticePeriod
  }
}
