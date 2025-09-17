'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Client-side auth callback handling...')
        
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        console.log('🔍 Callback parameters:', { 
          code: !!code, 
          error: error || 'none',
          errorDescription: errorDescription || 'none'
        })
        
        if (error) {
          console.error('❌ OAuth error received:', error, errorDescription)
          setError(`Erro de autenticação: ${errorDescription || error}`)
          setIsLoading(false)
          return
        }
        
        if (!code) {
          console.error('❌ No auth code found in callback')
          setError('Código de autenticação não encontrado. Tente novamente.')
          setIsLoading(false)
          return
        }
        
        console.log('🔍 Exchanging code for session with PKCE flow...')
        console.log('🔍 Code:', code)
        console.log('🔍 Supabase client config:', {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true
        })
        
        // Check if we have a code verifier in localStorage
        const codeVerifier = localStorage.getItem('sb-scaleagents-auth-auth-token-code-verifier')
        console.log('🔍 Code verifier in localStorage:', codeVerifier ? 'Found' : 'Not found')
        
        // Debug: Check all localStorage keys related to Supabase
        console.log('🔍 All localStorage keys:')
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('supabase') || key && key.includes('auth')) {
            console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`)
          }
        }
        
        // For PKCE flow, try getSession() first (Supabase handles code exchange automatically)
        console.log('🔍 Trying getSession() first for PKCE flow...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Session found via getSession()')
          console.log('👤 User ID:', session.user?.id)
          console.log('📧 User email:', session.user?.email)
          router.push('/loading')
          return
        }
        
        if (sessionError) {
          console.log('❌ getSession() failed, trying manual code exchange...')
          console.log('🔍 Session error:', sessionError.message)
        }
        
        // Fallback: manual code exchange
        console.log('🔍 Trying manual code exchange...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('❌ Code exchange error:', exchangeError)
          console.log('🔍 Error details:', exchangeError.message)
          setError(`Erro na troca de código: ${exchangeError.message}`)
          setIsLoading(false)
          return
        }
        
        if (data.session) {
          console.log('✅ Auth callback successful, session established')
          console.log('👤 User ID:', data.session.user?.id)
          console.log('📧 User email:', data.session.user?.email)
          
          // Redirect to loading page
          console.log('✅ User authenticated, redirecting to loading page')
          router.push('/loading')
        } else {
          console.error('❌ No session found after code exchange')
          setError('Sessão não encontrada. Tente novamente.')
          setIsLoading(false)
        }
        
      } catch (error) {
        console.error('❌ Auth callback exception:', error)
        setError('Erro inesperado durante a autenticação. Tente novamente.')
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processando autenticação...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro de Autenticação</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
