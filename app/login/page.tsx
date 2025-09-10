'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn, signInWithGoogle } = useAuth()
  const { isFirstTime } = useFirstTimeUser()

  // Check for OAuth callback errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const errorDetails = urlParams.get('details')
    
    if (errorParam) {
      let errorMessage = 'Erro de autenticação. Por favor, tente novamente.'
      
      switch (errorParam) {
        case 'no_auth_code':
          errorMessage = 'Código de autenticação não encontrado. Tente novamente.'
          break
        case 'auth_failed':
          errorMessage = errorDetails ? `Falha na autenticação: ${errorDetails}` : 'Falha na autenticação.'
          break
        case 'no_session':
          errorMessage = 'Sessão não criada. Tente novamente.'
          break
        case 'auth_exception':
          errorMessage = 'Erro inesperado na autenticação. Tente novamente.'
          break
        case 'missing_env_vars':
          errorMessage = 'Erro de configuração. Contacte o administrador.'
          break
      }
      
      setError(errorMessage)
      
      // Clear the error from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      newUrl.searchParams.delete('details')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    console.log('🔐 Attempting to sign in with email:', email)
    
    try {
      const result = await signIn(email, password)
      console.log('✅ Sign in successful:', result)
      
      // Check if we need to redirect to a specific page
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo')
      
      // Verify session before redirecting
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Check if this is a first-time user
          if (isFirstTime) {
            router.push('/complete-profile')
          } else {
            router.push(redirectTo || '/dashboard')
          }
        } else {
          // Force a small delay to allow auth state to update
          setTimeout(() => {
            if (isFirstTime) {
              router.push('/complete-profile')
            } else {
              router.push(redirectTo || '/dashboard')
            }
          }, 1000)
        }
      } catch (error) {
        setTimeout(() => {
          if (isFirstTime) {
            router.push('/complete-profile')
          } else {
            router.push(redirectTo || '/dashboard')
          }
        }, 1000)
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Falha ao iniciar sessão. Por favor, verifique as suas credenciais.'
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou palavra-passe inválidos. Por favor, tente novamente.'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, verifique o seu email e confirme a sua conta antes de iniciar sessão.'
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Demasiadas tentativas de login. Por favor, aguarde um momento antes de tentar novamente.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    
    try {
      await signInWithGoogle()
      // The redirect will be handled by Supabase OAuth
    } catch (error: any) {
      console.error('❌ Google sign in error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Falha ao iniciar sessão com Google. Por favor, tente novamente.'
      
      if (error.message?.includes('Invalid Refresh Token')) {
        errorMessage = 'Erro de autenticação. Por favor, tente novamente ou contacte o suporte.'
      } else if (error.message?.includes('both auth code and code verifier should be non-empty')) {
        errorMessage = 'Erro de autenticação. Por favor, limpe o cache do navegador e tente novamente.'
      } else if (error.message?.includes('Invalid redirect URI')) {
        errorMessage = 'Erro de configuração OAuth. Contacte o administrador.'
      } else if (error.message?.includes('OAuth provider not enabled')) {
        errorMessage = 'Autenticação Google não está ativada. Contacte o administrador.'
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'Conta Google não encontrada. Tente registar-se primeiro.'
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Credenciais inválidas. Verifique se a sua conta Google está correta.'
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/brand-background.png"
          alt="Background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/20 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link 
            href="/" 
            className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar atrás
          </Link>

          {/* Login Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center space-y-6">
              {/* Logo */}
              <div className="flex justify-center">
                <Image
                  src="/images/logo-white.png"
                  alt="ScaleAgents"
                  width={200}
                  height={60}
                  className="h-12 w-auto mx-auto"
                />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">Iniciar Sessão no ScaleAgents</CardTitle>
                <CardDescription className="text-white/70">
                  Por favor, inicie sessão na sua conta ScaleAgents para continuar
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-red-400 text-sm">{error}</p>
                  {error.includes('não encontrada') && (
                    <div className="mt-2">
                      <Link href="/register" className="text-purple-400 hover:text-purple-300 text-sm underline">
                        Ir para Registar-se →
                      </Link>
                    </div>
                  )}
                  {error.includes('limpe o cache do navegador') && (
                    <div className="mt-2">
                      <p className="text-red-300 text-xs">
                        <strong>Como limpar o cache:</strong> Pressione Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac), 
                        selecione "Cookies e dados do site" e "Imagens e ficheiros em cache", depois clique em "Limpar dados".
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Endereço de email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Introduza o seu endereço de email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Introduza a sua palavra-passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button 
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-12 text-base font-medium"
              >
                {isLoading ? 'A iniciar sessão...' : 'Iniciar Sessão'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="flex items-center">
                  <div className="flex-1 border-t border-white/20"></div>
                  <span className="px-3 text-white/70 text-sm">Ou continuar com</span>
                  <div className="flex-1 border-t border-white/20"></div>
                </div>
              </div>

              {/* Google Sign In Button */}
              <Button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-white/20 h-12 text-base font-medium"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>A iniciar sessão...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Iniciar sessão com Google</span>
                  </div>
                )}
              </Button>

              {/* Sign Up Link */}
              <div className="text-center pt-4">
                <p className="text-white/70">
                  Não tem uma conta?{' '}
                  <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                    Registar-se
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
