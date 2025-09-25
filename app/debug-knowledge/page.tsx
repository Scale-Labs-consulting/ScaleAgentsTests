'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Brain, FileText, CheckCircle, XCircle } from 'lucide-react'

const callTypes = [
  'Chamada Fria',
  'Chamada de Agendamento', 
  'Reunião de Descoberta',
  'Reunião de Fecho',
  'Reunião de Esclarecimento de Dúvidas',
  'Reunião de One Call Close'
]

export default function DebugKnowledgePage() {
  const [selectedCallType, setSelectedCallType] = useState('Chamada Fria')
  const [extractionMethod, setExtractionMethod] = useState('python')
  const [isLoading, setIsLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDebugTest = async () => {
    setIsLoading(true)
    setError(null)
    setDebugResult(null)

    try {
      const response = await fetch(`/api/sales-analyst/debug-knowledge?callType=${encodeURIComponent(selectedCallType)}&method=${extractionMethod}`)
      const data = await response.json()

      if (data.success) {
        setDebugResult(data)
      } else {
        setError(data.error || 'Debug test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          Knowledge Extraction Debug
        </h1>
        <p className="text-muted-foreground">
          Debug and monitor Python PyMuPDF knowledge extraction for sales analyst
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Configuration</CardTitle>
          <CardDescription>
            Test knowledge extraction with different call types and methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="callType">Call Type</Label>
              <Select value={selectedCallType} onValueChange={setSelectedCallType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call type" />
                </SelectTrigger>
                <SelectContent>
                  {callTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Extraction Method</Label>
              <Select value={extractionMethod} onValueChange={setExtractionMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python PyMuPDF (Recommended)</SelectItem>
                  <SelectItem value="pdfjs">PDF.js (Mozilla)</SelectItem>
                  <SelectItem value="auto">Auto (Best Available)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={runDebugTest}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Knowledge Extraction...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Run Debug Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {debugResult && (
        <div className="space-y-6">
          {/* Debug Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Debug Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Call Type</div>
                  <div className="text-lg font-bold text-blue-600">{debugResult.callType}</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Method</div>
                  <div className="text-lg font-bold text-green-600">{debugResult.method}</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Processing Time</div>
                  <div className="text-lg font-bold text-purple-600">{debugResult.processingTime}ms</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-orange-600" />
                Knowledge Extraction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-800">Knowledge Length</div>
                  <div className="text-lg font-bold text-orange-600">{debugResult.knowledgeLength} characters</div>
                </div>

                <div className="space-y-2">
                  <Label>Knowledge Preview</Label>
                  <Textarea
                    value={debugResult.knowledgePreview}
                    readOnly
                    className="min-h-[200px] text-sm"
                    placeholder="Knowledge preview will appear here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Showing first 500 characters of {debugResult.knowledgeLength} total
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Full Knowledge (for debugging)</Label>
                  <Textarea
                    value={debugResult.fullKnowledge}
                    readOnly
                    className="min-h-[300px] text-sm"
                    placeholder="Full knowledge will appear here..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Timestamp:</span>
                  <span>{new Date(debugResult.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Success:</span>
                  <span className="text-green-600">✅ Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Method Used:</span>
                  <span>{debugResult.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Processing Time:</span>
                  <span>{debugResult.processingTime}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
