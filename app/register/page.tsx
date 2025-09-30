'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  const { isFirstTime } = useFirstTimeUser()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'O email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'O email é inválido'
    }

    if (!formData.password) {
      newErrors.password = 'A palavra-passe é obrigatória'
    } else if (formData.password.length < 8) {
      newErrors.password = 'A palavra-passe deve ter pelo menos 8 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor, confirme a sua palavra-passe'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As palavras-passe não coincidem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setGeneralError('')
    
    try {
      const result = await signUp(formData.email, formData.password)
      
      // Show success message with email verification instructions
      
      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Por favor, verifique o seu email e clique no link de confirmação para ativar a sua conta. Depois podes iniciar sessão.",
        duration: 8000,
      })
      
      // Show additional instructions
      setTimeout(() => {
        toast({
          title: "Verificação de email necessária",
          description: "Verifique a sua caixa de entrada (e spam) para o email de confirmação. Clique no link para ativar a sua conta.",
          duration: 10000,
        })
      }, 2000)
      
      // Don't redirect immediately - let user see the success message
      // They can manually go to dashboard or login after confirming email
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Enhanced error messages
      let errorMessage = 'Falha ao criar conta. Por favor, tente novamente.'
      let errorTitle = 'Erro ao criar conta'
      
      if (error.message?.includes('User already registered') || error.message?.includes('Email already registered')) {
        errorTitle = 'Email já registado'
        errorMessage = 'Este email já está registado. Por favor, use "Iniciar Sessão" em vez de "Registar-se".'
      } else if (error.message?.includes('Password should be at least')) {
        errorTitle = 'Palavra-passe muito fraca'
        errorMessage = 'A palavra-passe deve ter pelo menos 8 caracteres e incluir letras e números.'
      } else if (error.message?.includes('Invalid email')) {
        errorTitle = 'Email inválido'
        errorMessage = 'Por favor, introduza um endereço de email válido.'
      } else if (error.message?.includes('Signup requires a valid password')) {
        errorTitle = 'Palavra-passe inválida'
        errorMessage = 'Por favor, introduza uma palavra-passe válida com pelo menos 8 caracteres.'
      } else if (error.message?.includes('Rate limit exceeded')) {
        errorTitle = 'Demasiadas tentativas'
        errorMessage = 'Demasiadas tentativas de registo. Por favor, aguarde alguns minutos antes de tentar novamente.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setGeneralError(errorMessage)
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    setGeneralError('')
    setSuccessMessage('')
    
    try {
      await signInWithGoogle()
      
      // Show success message for Google sign up
      toast({
        title: "A iniciar sessão com Google... 🔐",
        description: "A redirecionar para o Google para completar o registo.",
        duration: 5000,
      })
      
      // The redirect will be handled by Supabase OAuth
    } catch (error: any) {
      console.error('❌ Google sign up error:', error)
      
      // Enhanced error messages for Google sign up
      let errorMessage = 'Falha ao registar-se com Google. Por favor, tente novamente.'
      let errorTitle = 'Erro no registo com Google'
      
      if (error.message?.includes('Invalid Refresh Token')) {
        errorTitle = 'Conta Google já registada'
        errorMessage = 'Esta conta Google já está registada. Por favor, use "Iniciar Sessão" em vez de "Registar-se".'
      } else if (error.message?.includes('User already registered')) {
        errorTitle = 'Conta Google já registada'
        errorMessage = 'Esta conta Google já está registada. Por favor, use "Iniciar Sessão" em vez de "Registar-se".'
      } else if (error.message?.includes('Email already registered')) {
        errorTitle = 'Email já registado'
        errorMessage = 'Este email já está registado. Por favor, use "Iniciar Sessão" em vez de "Registar-se".'
      } else if (error.message?.includes('Invalid redirect URI')) {
        errorTitle = 'Erro de configuração'
        errorMessage = 'Erro de configuração OAuth. Contacte o administrador.'
      } else if (error.message?.includes('OAuth provider not enabled')) {
        errorTitle = 'Google Auth desativado'
        errorMessage = 'Autenticação Google não está ativada. Contacte o administrador.'
      } else if (error.message?.includes('both auth code and code verifier should be non-empty')) {
        errorTitle = 'Erro de autenticação'
        errorMessage = 'Erro de autenticação. Por favor, limpe o cache do navegador e tente novamente.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setGeneralError(errorMessage)
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/background-4.jpg"
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

          {/* Register Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center space-y-6">
              {/* Logo */}
              <div className="flex justify-center">
                <Link href="/" className="block">
                  <Image
                    src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
                    alt="ScaleAgents"
                    width={200}
                    height={60}
                    className="h-12 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">Criar a sua Conta ScaleAgents</CardTitle>
                <CardDescription className="text-white/70">
                  Junte-se a milhares de empresas que usam ScaleAgents para formação de vendas com IA
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {generalError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-red-400 text-sm">{generalError}</p>
                  </div>
                  {generalError.includes('já está registada') && (
                    <div className="mt-2">
                      <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm underline">
                        Ir para Iniciar Sessão →
                      </Link>
                    </div>
                  )}
                  {generalError.includes('limpe o cache do navegador') && (
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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Criar uma palavra-passe"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 ${
                      errors.password ? 'border-red-500' : ''
                    }`}
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
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">Confirmar Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmar a sua palavra-passe"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 focus:ring-purple-500 ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-white/50 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Continue with Email Button */}
              <Button 
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-12 text-base font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>A criar conta...</span>
                  </div>
                ) : (
                  'Criar Conta com Email'
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="flex items-center">
                  <div className="flex-1 border-t border-white/20"></div>
                  <span className="px-3 text-white/70 text-sm">Ou continuar com</span>
                  <div className="flex-1 border-t border-white/20"></div>
                </div>
              </div>

              {/* Google Sign Up Button */}
              <Button 
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-white/20 h-12 text-base font-medium"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>A redirecionar...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Criar Conta com Google</span>
                  </div>
                )}
              </Button>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <p className="text-white/70">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                    Iniciar sessão
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
