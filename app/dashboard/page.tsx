'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, TrendingUp, Users, Zap, MessageSquare, BarChart3, UserCheck, LogOut, Settings, Crown, ChevronRight, HelpCircle, Moon, UserPlus, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { forceLogout } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user, profile, signOut, loading, initialized } = useAuth()

  // Auth guard logic
  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowProfileModal(false)
      }
    }

    if (showProfileModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileModal])

  const handleLogout = async () => {
    console.log('🔍 handleLogout function called!')
    try {
      console.log('🚪 User initiated logout...')
      setShowProfileModal(false) // Close the modal first
      console.log('📱 Modal closed, calling signOut...')
      
      // Try normal logout first
      await signOut()
      console.log('✅ SignOut completed successfully')
    } catch (error) {
      console.error('❌ Normal logout failed, trying force logout...', error)
      
      // If normal logout fails, try force logout
      try {
        await forceLogout()
        console.log('✅ Force logout completed')
        router.push('/login')
      } catch (forceError) {
        console.error('❌ Force logout also failed:', forceError)
        alert('Logout failed. Please try clearing your browser data manually.')
      }
    }
  }

  // Early returns for loading and authentication
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">
            {loading ? 'A carregar...' : 'A inicializar...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const agents = [
    {
      id: 'scale-expert',
      name: 'Scale Expert',
      description: 'Estratégias de crescimento com IA e otimização de crescimento empresarial',
      icon: TrendingUp,
      status: 'active',
      lastUsed: 'há 2 horas'
    },
    {
      id: 'sales-analyst',
      name: 'Sales Analyst',
      description: 'Análise avançada de vendas e insights de otimização de receitas',
      icon: BarChart3,
      status: 'active',
      lastUsed: 'há 1 dia'
    },
    {
      id: 'hr-talent',
      name: 'HR Talent',
      description: 'Aquisição inteligente de talentos e gestão de recursos humanos',
      icon: UserCheck,
      status: 'active',
      lastUsed: 'há 3 dias'
    }
  ]

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
        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-white/10 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Image
                    src="/images/logo-white.png"
                    alt="ScaleLabs"
                    width={200}
                    height={60}
                    className="h-8 w-auto"
                  />
                </div>
                <div className="relative">
                  <button 
                    ref={buttonRef}
                    className="border-transparent text-white hover:bg-white/20 hover:border-white/50 flex items-center space-x-3 px-4 py-2 rounded-md transition-colors"
                    onClick={() => setShowProfileModal(!showProfileModal)}
                  >
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile?.first_name || user?.email || 'User'
                      }
                    </span>
                  </button>

                  {/* Profile Modal */}
                  {showProfileModal && createPortal(
                    <div 
                      ref={modalRef} 
                      className="fixed z-[99999]"
                      style={{ 
                        pointerEvents: 'none',
                        top: '88px',
                        right: '16px'
                      }}
                    >
                      <div 
                        className="w-80 bg-gray-900/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div className="p-4">
                          {/* User Info */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-semibold">
                                {profile?.first_name && profile?.last_name 
                                  ? `${profile.first_name} ${profile.last_name}`
                                  : profile?.first_name || user?.email || 'User'
                                }
                              </p>
                              <p className="text-white/60 text-sm">{user?.email || 'No email'}</p>
                            </div>
                          </div>

                          {/* Upgrade Section */}
                          <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Crown className="w-4 h-4 text-yellow-400" />
                              <span className="text-white text-sm">Tornar Pro</span>
                            </div>
                                                          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-xs">
                                Atualizar
                              </Button>
                          </div>

                          {/* Credits */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-semibold text-sm">Créditos</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-white/60 text-sm">3 restantes</span>
                                <ChevronRight className="w-3 h-3 text-white/60" />
                              </div>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-blue-400 text-xs">Créditos diários usados primeiro</span>
                            </div>
                          </div>

                          {/* Quick Actions Section */}
                          <div className="mb-4">
                            <h3 className="text-white font-semibold text-sm mb-2">Quick Actions</h3>
                            <div className="space-y-2">
                              <button 
                                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-left"
                                onClick={() => {
                                  setShowProfileModal(false)
                                  router.push('/sales-analyst/files')
                                }}
                              >
                                <div className="w-8 h-8 rounded-md bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                                                      <p className="text-white text-sm font-medium">Ficheiros de Análise de Vendas</p>
                                  <p className="text-white/60 text-xs">Ver e gerir as suas análises de chamadas de vendas</p>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mb-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-white/20 text-white hover:bg-white/10 bg-white/5"
                              onClick={() => {
                                setShowProfileModal(false)
                                router.push('/settings')
                              }}
                            >
                              <Settings className="w-3 h-3 mr-2" />
                              Definições
                            </Button>
                          </div>

                          {/* Navigation Links */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                              <div className="flex items-center space-x-2">
                                <HelpCircle className="w-4 h-4 text-white/60" />
                                <span className="text-white text-sm">Centro de Ajuda</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                              <div className="flex items-center space-x-2">
                                <Moon className="w-4 h-4 text-white/60" />
                                <span className="text-white text-sm">Aparência</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-white/60" />
                            </div>
                            <button 
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors text-left" 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('🖱️ Logout button clicked!')
                                handleLogout()
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <LogOut className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-sm font-medium">Terminar sessão</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>
          </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta!</h1>
            <p className="text-white/70">Aqui está o que os seus agentes de IA têm estado a fazer</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-purple-500/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Total de Conversas</p>
                    <p className="text-3xl font-bold text-white">1,247</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-green-500/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Agentes Ativos</p>
                    <p className="text-3xl font-bold text-white">2</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-blue-500/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Insights Gerados</p>
                    <p className="text-3xl font-bold text-white">89</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-2xl shadow-orange-500/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Taxa de Crescimento</p>
                    <p className="text-3xl font-bold text-white">+23%</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Agents Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Os Seus Agentes de IA</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const IconComponent = agent.icon
                return (
                  <Card key={agent.id} className="bg-white/10 border-white/20 backdrop-blur-md shadow-xl hover:bg-white/15 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                            <Badge 
                              variant={agent.status === 'active' ? 'default' : 'secondary'}
                              className={agent.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}
                            >
                              {agent.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      <CardDescription className="text-white/80 mb-4 text-sm flex-1">
                        {agent.description}
                      </CardDescription>
                      <div className="flex items-center justify-between mt-auto">
                        <p className="text-sm text-white/60">Último uso: {agent.lastUsed}</p>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg w-32"
                          onClick={() => {
                            if (agent.id === 'sales-analyst') {
                              router.push('/sales-analyst')
                            } else if (agent.id === 'scale-expert') {
                              router.push('/scale-expert')
                            } else if (agent.id === 'hr-talent') {
                              router.push('/hr-talent')
                            }
                          }}
                        >
                          Conversar Agora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
