# Sales Optimizer Assistant Setup Guide

## Overview
The Sales Optimizer is an advanced AI assistant designed to replace the existing Sales Analyst with enhanced capabilities, deeper analysis, and more actionable insights.

## Key Features
- **Advanced AI Analysis** with 10 specialized analysis categories
- **Phase-by-Phase Breakdown** (Opening, Discovery, Presentation, Closing)
- **Detailed 8-Category Scoring System** (0-5 each, total 0-40)
- **Performance Benchmarking** against industry standards
- **Personalized Improvement Roadmaps** with actionable recommendations
- **Critical Moments Analysis** for identifying key turning points

## Setup Steps

### 1. Create OpenAI Assistant
Run the setup endpoint to create the Sales Optimizer assistant in OpenAI:

```bash
curl -X POST http://localhost:3000/api/sales-optimizer/setup-assistant
```

This will:
- Create a new OpenAI assistant with specialized sales analysis instructions
- Configure 5 specialized tools for sales call analysis
- Set up file search capabilities for knowledge base integration
- Return the assistant ID for configuration

### 2. Database Configuration
Run the SQL script to add the Sales Optimizer agent to your database:

```sql
-- Run in Supabase SQL Editor
\i INSERT_SALES_OPTIMIZER_AGENT.sql
```

This will:
- Add `sales_optimizer` as a new agent type
- Insert the Sales Optimizer agent record
- Update database constraints
- Add configuration metadata

### 3. Environment Variables
Ensure your `.env.local` has the required OpenAI configuration:

```bash
# OpenAI Configuration
OPENAI_KEY=your_openai_api_key_here
```

### 4. Test the Assistant
Access the test page at `/test-sales-optimizer` to:
- Upload sales call videos (MP4, MOV, AVI)
- Trigger advanced AI analysis
- View comprehensive results with detailed breakdowns
- Test the enhanced user interface

## Enhanced Capabilities vs Sales Analyst

| Feature | Sales Analyst | Sales Optimizer |
|---------|---------------|-----------------|
| **Analysis Depth** | Basic scoring | Phase-by-phase + benchmarking |
| **AI Prompts** | 6 standard prompts | 10 advanced structured prompts |
| **Output Structure** | Text-based | JSON + executive summary |
| **Progress Tracking** | None | Real-time progress bar |
| **User Experience** | Simple upload/analyze | Multi-tab interface with history |
| **Scoring System** | 8 categories (0-5) | 8 categories + benchmarking |
| **Recommendations** | General tips | Personalized action plans |
| **Performance Analysis** | Basic feedback | Critical moments + trends |

## API Endpoints

### Upload Sales Call
```http
POST /api/sales-optimizer/upload
Content-Type: multipart/form-data

file: [video file]
userId: string
title: string (optional)
```

### Analyze Sales Call
```http
POST /api/sales-optimizer/analyze
Content-Type: application/json

{
  "salesCallId": "uuid",
  "userId": "uuid"
}
```

### Get Analyses
```http
GET /api/sales-optimizer/analyses?userId=uuid
```

### Delete Analysis
```http
DELETE /api/sales-optimizer/analyses?id=uuid
```

## Analysis Output Structure

The Sales Optimizer provides structured JSON output with:

```json
{
  "tipoCall": "Chamada Fria",
  "totalScore": 32,
  "pontosFortes": "Detailed strengths analysis...",
  "pontosFracos": "Specific improvement areas...",
  "resumoDaCall": "Executive summary...",
  "dicasGerais": "Contextual advice...",
  "focoParaProximasCalls": "Priority actions...",
  "clarezaFluenciaFala": 4,
  "tomControlo": 3,
  "envolvimentoConversacional": 4,
  "efetividadeDescobertaNecessidades": 3,
  "entregaValorAjusteSolucao": 4,
  "habilidadesLidarObjeccoes": 2,
  "estruturaControleReuniao": 4,
  "fechamentoProximosPassos": 3,
  "analiseDetalhadaPorFase": {
    "abertura": "Opening phase analysis...",
    "descoberta": "Discovery phase analysis...",
    "apresentacao": "Presentation phase analysis...",
    "fechamento": "Closing phase analysis..."
  },
  "sugestoesEspecificas": [
    "Specific suggestion 1",
    "Specific suggestion 2",
    "Specific suggestion 3"
  ],
  "benchmarkPerformance": {
    "vsMedia": "Comparison with industry average",
    "vsMelhores": "Comparison with top performers",
    "proximosPassos": "Improvement roadmap"
  }
}
```

## Integration with Existing System

The Sales Optimizer maintains full compatibility with:
- Existing `sales_calls` table structure
- Current `sales_call_analyses` table
- Supabase Storage for file management
- User authentication and authorization

## Next Steps

1. **Test the Assistant**: Use the test page to verify functionality
2. **Compare Performance**: Run parallel analyses with both assistants
3. **User Feedback**: Gather feedback on the enhanced experience
4. **Integration**: Once satisfied, integrate into the main dashboard
5. **Migration**: Plan migration strategy from Sales Analyst to Sales Optimizer

## Troubleshooting

### Common Issues

1. **OpenAI API Key Missing**
   - Ensure `OPENAI_KEY` is set in `.env.local`
   - Verify the key has sufficient credits

2. **Assistant Creation Failed**
   - Check OpenAI API status
   - Verify API key permissions
   - Check rate limits

3. **Database Errors**
   - Run the SQL script in Supabase
   - Check database permissions
   - Verify table constraints

4. **File Upload Issues**
   - Check Supabase Storage configuration
   - Verify file size limits
   - Check CORS settings

### Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set
3. Test with a small MP4 file first
4. Check Supabase logs for database issues

## Performance Expectations

- **File Upload**: 2-10 seconds (depending on file size)
- **Analysis Processing**: 2-5 minutes (depending on call length)
- **Results Display**: Instant (cached in database)
- **Concurrent Users**: Supports multiple simultaneous analyses

The Sales Optimizer provides significantly enhanced analysis capabilities while maintaining the reliability and performance of the existing system.
