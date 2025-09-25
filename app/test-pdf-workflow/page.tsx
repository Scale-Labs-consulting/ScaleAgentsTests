'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Brain, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const callTypes = [
  'Chamada Fria',
  'Chamada de Agendamento', 
  'Reunião de Descoberta',
  'Reunião de Fecho',
  'Reunião de Esclarecimento de Dúvidas',
  'Reunião de One Call Close'
]

export default function TestPDFWorkflowPage() {
  const [selectedCallType, setSelectedCallType] = useState('Chamada Fria')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setError(null)
    setTestResults(null)

    try {
      const response = await fetch(`/api/test-pdf-parsing-workflow?callType=${encodeURIComponent(selectedCallType)}`)
      const data = await response.json()

      if (data.success) {
        setTestResults(data.testResults)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PDF Parsing Workflow Test</h1>
        <p className="text-muted-foreground">
          Test the PDF knowledge extraction and prompt enhancement workflow without sending to ChatGPT
        </p>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Select a call type and run the workflow test to see PDF parsing and prompt enhancement in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Call Type</label>
              <Select value={selectedCallType} onValueChange={setSelectedCallType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call type" />
                </SelectTrigger>
                <SelectContent>
                  {callTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runTest} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Test Failed</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.knowledgeFetching.hasKnowledge ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-blue-800">Knowledge Found</div>
                  <div className="text-xs text-blue-600">
                    {testResults.knowledgeFetching.knowledgeLength} chars
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.promptEnhancement.enhancementRatio.toFixed(1)}x
                  </div>
                  <div className="text-sm text-green-800">Enhancement Ratio</div>
                  <div className="text-xs text-green-600">
                    {testResults.promptEnhancement.enhancedPromptLength} chars
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.knowledgeFetching.knowledgeSource === 'blob-storage' ? '📄' : '📚'}
                  </div>
                  <div className="text-sm text-purple-800">Knowledge Source</div>
                  <div className="text-xs text-purple-600">
                    {testResults.knowledgeFetching.knowledgeSource === 'blob-storage' ? 'JavaScript PDF Parser' : 'Local Fallback'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Preview */}
          {testResults.knowledgeFetching.hasKnowledge && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Extracted Knowledge Preview
                </CardTitle>
                <CardDescription>
                  First 500 characters of the extracted knowledge from PDF files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {testResults.knowledgeFetching.knowledgePreview}
                  </pre>
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">
                    {testResults.knowledgeFetching.knowledgeLength} characters
                  </Badge>
                  <Badge variant={testResults.knowledgeFetching.knowledgeSource === 'blob-storage' ? 'default' : 'secondary'}>
                    {testResults.knowledgeFetching.knowledgeSource}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Prompt Structure</CardTitle>
              <CardDescription>
                How the knowledge is integrated into the analysis prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Knowledge Section</h4>
                    <div className="text-sm text-blue-600">
                      {testResults.promptEnhancement.knowledgeSectionLength} characters
                    </div>
                    <div className="mt-2 text-xs text-blue-500">
                      Contains call-type specific knowledge from PDFs
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Analysis Section</h4>
                    <div className="text-sm text-green-600">
                      {testResults.promptEnhancement.analysisSectionLength} characters
                    </div>
                    <div className="mt-2 text-xs text-green-500">
                      Contains the original analysis instructions
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Enhancement Ratio</h4>
                  <div className="text-2xl font-bold text-yellow-600">
                    {testResults.promptEnhancement.enhancementRatio.toFixed(2)}x
                  </div>
                  <div className="text-sm text-yellow-600">
                    The prompt is {testResults.promptEnhancement.enhancementRatio.toFixed(1)}x larger with knowledge
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Prompt Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Enhanced Prompt</CardTitle>
              <CardDescription>
                The final prompt that would be sent to ChatGPT (first 1000 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {testResults.finalPrompt.fullPrompt.substring(0, 1000)}
                  {testResults.finalPrompt.fullPrompt.length > 1000 && '\n\n... (truncated)'}
                </pre>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Total length: {testResults.finalPrompt.fullPrompt.length} characters
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How to Use This Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>PDF Parsing:</strong> Uses JavaScript-based PDF extraction (pdf-parse and pdf2json libraries)</p>
            <p>2. <strong>Select a Call Type:</strong> Choose from the dropdown to test different knowledge files</p>
            <p>3. <strong>Run the Test:</strong> Click "Run Test" to see the PDF parsing and prompt enhancement in action</p>
            <p>4. <strong>Check Results:</strong> Review the extracted knowledge, enhancement ratio, and final prompt structure</p>
            <p>5. <strong>Verify Quality:</strong> Ensure the extracted text is clean and properly encoded (no garbled characters)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
