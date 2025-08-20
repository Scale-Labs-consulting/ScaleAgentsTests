# HR Talent - New Workflow Documentation

## 🎯 **New 3-Prompt Analysis Workflow**

### **Workflow Overview:**
1. **Upload CSV** → Extract CV content
2. **Extract candidate info** from CV using ChatGPT
3. **Analyze candidate** using 3 specialized prompts
4. **Store results** in database

### **Prompt 1: Main Scoring Evaluation**
- **Purpose**: Evaluate candidate against 10 partner companies
- **Criteria**: Age, location, experience, languages, availability
- **Output**: Score 0-10 (one decimal place)
- **Companies**: Comopi, MoBrand, Lugotech, Grafislab, Mariana Arga e Lima, Mush, Slide Lab, Fashion Details, MagikEvolution, Maria Costa e Maia

### **Prompt 2: Strengths Analysis**
- **Purpose**: Identify candidate's main strengths
- **Input**: Score response from Prompt 1
- **Output**: 3 strengths maximum, 15 words each
- **Format**: Concise bullet points

### **Prompt 3: Weaknesses Analysis**
- **Purpose**: Identify areas of concern
- **Input**: Score response from Prompt 1
- **Output**: 3 points of attention maximum, 15 words each
- **Format**: Concise bullet points

### **Scoring System:**
- **0-10 scale** with one decimal place
- **Weighted criteria**: Experience (35%), Location (25%), Languages (20%), Soft Skills (10%), Salary (10%)
- **Multipliers**: Sector match (x1.1), Work regime (x1.1), Geographic match (x1.1)
- **Limitations**: 0 years experience (max 3.0), <1 year experience (max 5.0)

### **Database Storage:**
- **score**: Numeric score (0-10)
- **strengths**: Array of strength points
- **weaknesses**: Array of weakness points
- **recommendation**: "Recomendado", "Com reservas", or "Não recomendado"
- **analysis**: Full JSON with all prompt responses

### **Recommendation Logic:**
- **Score ≥ 7**: "Recomendado"
- **Score ≥ 5**: "Com reservas"
- **Score < 5**: "Não recomendado"

## 🔧 **Technical Implementation:**

### **Token Management:**
- **CV content**: Truncated to 12,000 characters (~3,000 tokens)
- **Prompt 1**: ~2,000 tokens
- **Prompt 2**: ~200 tokens
- **Prompt 3**: ~200 tokens
- **Total**: ~5,400 tokens (within 8,192 limit)

### **Error Handling:**
- **CV extraction failure**: Uses fallback values
- **AI analysis failure**: Stores error in database
- **JSON parsing failure**: Uses raw content
- **Score extraction**: Regex fallback to 5.0

### **Database Schema:**
```sql
hr_candidates:
- id (UUID)
- user_id (UUID)
- agent_id (UUID)
- name (TEXT)
- email (TEXT)
- position (TEXT)
- cv_file_url (TEXT)
- cv_content (TEXT)
- status (TEXT: pending/processing/completed/failed)
- score (INTEGER)
- analysis (JSONB)
- analyzed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## 🚀 **Usage:**

1. **Upload CSV** with CV links
2. **System extracts** CV content automatically
3. **Click "Analisar"** to run 3-prompt analysis
4. **View results** with score, strengths, and weaknesses
5. **Check recommendation** based on score threshold

## 📊 **Expected Output:**
```json
{
  "score": 7.5,
  "strengths": ["Experiência sólida em vendas B2B", "Inglês fluente", "Localização ideal"],
  "weaknesses": ["Pouca experiência em setor específico", "Disponibilidade limitada"],
  "recommendation": "Recomendado",
  "fit": "Candidato avaliado com pontuação 7.5/10"
}
```
