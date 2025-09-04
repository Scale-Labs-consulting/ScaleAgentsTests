'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'O nome é obrigatório'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'O apelido é obrigatório'
    }

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
      await signUp(formData.email, formData.password, formData.firstName, formData.lastName)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error)
      setGeneralError(error.message || 'Falha ao criar conta. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    setGeneralError('')
    
    try {
      await signInWithGoogle()
      // The redirect will be handled by Supabase OAuth
    } catch (error: any) {
      console.error('❌ Google sign up error:', error)
      setGeneralError('Falha ao registar-se com Google. Por favor, tente novamente.')
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
            <h1 className="text-2xl font-bold text-white">Criar a sua conta</h1>
            <p className="text-white/70 mt-2">Junte-se a milhares de empresas que crescem com IA</p>
          </div>

          {/* Register Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-white">Registar-se</CardTitle>
              <CardDescription className="text-white/70">
                Crie a sua conta para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generalError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-red-400 text-sm">{generalError}</p>
                </div>
              )}

              {/* Google Sign Up Button */}
              <Button 
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full mb-6 bg-white text-gray-900 hover:bg-gray-100 border border-white/20 font-medium"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>A registar-se...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continuar com Google</span>
                  </div>
                )}
              </Button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="flex items-center">
                  <div className="flex-1 border-t border-white/20"></div>
                  <span className="px-2 text-white text-xs uppercase">Ou registe-se com email</span>
                  <div className="flex-1 border-t border-white/20"></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="João"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 ${
                          errors.firstName ? 'border-red-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-400 text-sm">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Apelido</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Silva"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 ${
                          errors.lastName ? 'border-red-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-400 text-sm">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao@exemplo.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Criar uma palavra-passe"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 ${
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmar Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmar a sua palavra-passe"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 ${
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

                <div className="text-center mb-6">
                  <div className="flex items-start justify-center space-x-3 max-w-sm mx-auto">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 flex-shrink-0"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-white/70 leading-relaxed text-left">
                      Ao continuar, concordas com os{' '}
                      <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                        Terms of Service
                      </Link>{' '}
                      e{' '}
                      <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-12 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? 'A criar conta...' : 'Criar Conta'}
                </Button>
              </form>

              <div className="mt-6 text-center">
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
