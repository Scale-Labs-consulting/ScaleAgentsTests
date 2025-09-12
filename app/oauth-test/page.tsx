'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OAuthTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testOAuth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/test-oauth-debug')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  const testOAuthFlow = () => {
    if (testResult?.oauthUrl) {
      window.location.href = testResult.oauthUrl
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Debug Test</CardTitle>
          <CardDescription>
            Test the OAuth configuration and flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testOAuth} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test OAuth Configuration'}
          </Button>
          
          {testResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
              
              {testResult.oauthUrl && (
                <div className="mt-4">
                  <Button onClick={testOAuthFlow} className="w-full">
                    Test OAuth Flow (Redirect to Google)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
