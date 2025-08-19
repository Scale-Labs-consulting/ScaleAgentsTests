'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn } = useAuth()

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
      const redirectTo = urlParams.get('redirectTo') || '/dashboard'
      
      router.push(redirectTo)
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
          {/* Back to Home */}
          <Link 
            href="/" 
            className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Link>

          {/* Logo */}
          <div className="text-center mb-8">
            <Image
              src="/images/logo-white.png"
              alt="ScaleLabs"
              width={200}
              height={60}
              className="h-8 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
            <p className="text-white/70 mt-2">Inicie sessão na sua conta</p>
          </div>

          {/* Login Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-white">Iniciar Sessão</CardTitle>
              <CardDescription className="text-white/70">
                Introduza as suas credenciais para aceder à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Introduza o seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Introduza a sua palavra-passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-white/70">Lembrar-me</Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                    Esqueceu a palavra-passe?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'A iniciar sessão...' : 'Iniciar Sessão'}
                </Button>
              </form>

                             <div className="mt-6 text-center">
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
