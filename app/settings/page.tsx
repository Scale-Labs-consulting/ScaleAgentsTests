'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Shield, 
  CreditCard,
  Save,
  Check,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  ArrowLeft,
  Crown,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getPlanById } from '@/lib/subscription-plans'
import type { Database } from '@/types/database'
import Image from 'next/image'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile form state
  const [displayName, setDisplayName] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileUpdated, setProfileUpdated] = useState(false)


  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Initialize form with current user metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setDisplayName(user.user_metadata.full_name || user.user_metadata.first_name || '')
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return
    
    setIsUpdatingProfile(true)
    setProfileUpdated(false)
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim()
        }
      })
      
      if (error) throw error
      
      setProfileUpdated(true)
      setTimeout(() => setProfileUpdated(false), 3000)
    } catch (error) {
      console.error('Failed to update user metadata:', error)
    } finally {
      setIsUpdatingProfile(false)
    }
  }


  const handleUpdatePassword = async () => {
    if (!user || !currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Por favor, preencha todos os campos')
      return
    }
    
    // Clear previous errors
    setPasswordError('')
    setPasswordUpdated(false)
    
    // Client-side validation
    if (newPassword.length < 6) {
      setPasswordError('A palavra-passe deve ter pelo menos 6 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('As palavras-passe não coincidem')
      return
    }
    
    setIsUpdatingPassword(true)
    
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      })
      
      if (signInError) {
        setPasswordError('Palavra-passe atual incorreta')
        return
      }
      
      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('Password should be at least 6 characters')) {
          setPasswordError('A palavra-passe deve ter pelo menos 6 caracteres')
        } else if (error.message.includes('Password is too weak')) {
          setPasswordError('A palavra-passe é muito fraca. Use uma palavra-passe mais forte')
        } else {
          setPasswordError('Erro ao atualizar palavra-passe: ' + error.message)
        }
        return
      }
      
      setPasswordUpdated(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Show success message briefly, then log out
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }, 2000)
      
    } catch (error) {
      console.error('Failed to update password:', error)
      setPasswordError('Erro inesperado ao atualizar palavra-passe')
    } finally {
      setIsUpdatingPassword(false)
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
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-purple-900/30 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-white/20 text-white hover:bg-white/10 bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Conta</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/20'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/20'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Segurança
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/20'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Faturação
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 border border-white/20 rounded-lg backdrop-blur-md shadow-2xl">
          {activeTab === 'profile' && (
            <div className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-white">Informações do Perfil</CardTitle>
                <p className="text-sm text-white/70">Atualize as suas informações pessoais e detalhes da conta.</p>
              </CardHeader>
              
              <CardContent className="px-0 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-white/5 border-white/20 text-white/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/50 mt-1">O endereço de email não pode ser alterado. Contacte o suporte se precisar de atualizar o seu email.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Nome</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Introduza o seu nome de exibição"
                    className="w-full bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <div className="flex items-center space-x-4">
                    {profileUpdated && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Perfil atualizado com sucesso!</span>
                      </div>
                    )}
                    <Button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    >
                      {isUpdatingProfile ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>A guardar...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Save className="w-4 h-4" />
                          <span>Guardar Alterações</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-white">Definições de Segurança</CardTitle>
                <p className="text-sm text-white/70">Gerir a sua palavra-passe e preferências de segurança.</p>
              </CardHeader>
              
              <CardContent className="px-0 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Palavra-passe Atual</label>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Introduza a sua palavra-passe atual"
                      className="w-full pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords ? (
                        <EyeOff className="h-4 w-4 text-white/40" />
                      ) : (
                        <Eye className="h-4 w-4 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Nova Palavra-passe</label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Introduza a sua nova palavra-passe"
                    className="w-full bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Confirmar Nova Palavra-passe</label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a sua nova palavra-passe"
                    className="w-full bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                  />
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Alterar a sua palavra-passe irá desligá-lo da sessão
                  </p>
                </div>
                
                {/* Error Message */}
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-400">{passwordError}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <div className="flex items-center space-x-4">
                    {passwordUpdated && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Palavra-passe atualizada com sucesso!</span>
                      </div>
                    )}
                    <Button 
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    >
                      {isUpdatingPassword ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>A atualizar...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4" />
                          <span>Atualizar Palavra-passe</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-white">Faturação e Subscrição</CardTitle>
                <p className="text-sm text-white/70">Gerir a sua subscrição e informações de faturação.</p>
              </CardHeader>
              
              <CardContent className="px-0 space-y-6">
                <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Plano Atual</h3>
                      <p className="text-sm text-white/70">Plano Gratuito</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/pricing')}
                      className="border-white/20 text-white hover:bg-white/10 bg-white/5"
                    >
                      Atualizar Plano
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white/10 border border-white/20 rounded-lg p-6 backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100/20 rounded-full mx-auto">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Gerir Faturação</h3>
                      <p className="text-sm text-white/70 mb-4">
                        Aceda ao portal Stripe para gerir a sua subscrição, métodos de pagamento e faturas.
                      </p>
                    </div>
                    <Button 
                      onClick={() => window.open('https://billing.stripe.com/p/login/test_dRm6oAbMK0Ko8BS1u6bo400', '_blank')}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Gerir Faturação
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
