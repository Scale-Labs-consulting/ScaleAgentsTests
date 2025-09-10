'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowRight, Bot, TrendingUp, Users, Zap, MessageSquare, BarChart3, UserCheck, ChevronLeft, ChevronRight, Play, ChevronDown, ChevronUp } from 'lucide-react'

export default function HomePage() {
  const [currentCase, setCurrentCase] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openFAQs, setOpenFAQs] = useState<number[]>([])
  const [isYearly, setIsYearly] = useState(true)
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set())
  const [countedValues, setCountedValues] = useState<Record<string, number>>({})

  // Counting animation function
  const animateCount = (key: string, target: number, duration: number = 2000) => {
    const startTime = Date.now()
    const startValue = 0
    
    const updateCount = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart)
      
      setCountedValues(prev => ({
        ...prev,
        [key]: currentValue
      }))
      
      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }
    
    requestAnimationFrame(updateCount)
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set(prev).add(entry.target.id))
            
            // Trigger counting animation for metrics
            if (entry.target.id === 'hero-metrics') {
              animateCount('revenue', 10, 2000) // €10M+
              animateCount('markets', 40, 2000) // 40+
              animateCount('calls', 1000, 2000) // 1000+
              animateCount('departments', 170, 2000) // 170+
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('[data-animate]')
    animatedElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const agents = [
    {
      id: 'scale-expert',
      name: 'Especialista em Escala',
      description: 'Identifica oportunidades de crescimento e estratégias de escalabilidade que geram €10M+ em receita adicional',
      icon: TrendingUp,
      features: ['Análise de Crescimento de Receita', 'Estratégias de Expansão de Mercado', 'Otimização de Recursos', 'Acompanhamento de Performance'],
      color: 'from-purple-500 to-violet-600',
      result: '€10M+ Gerados'
    },
    {
      id: 'sales-analyst',
      name: 'Analista de Vendas',
      description: 'Analisa 1000+ chamadas de vendas para aumentar as taxas de fechamento em 40% e otimizar todo o funil de vendas',
      icon: BarChart3,
      features: ['Análise e Pontuação de Chamadas', 'Otimização de Pipeline', 'Previsão de Receita', 'Gestão de Objeções'],
      color: 'from-violet-500 to-purple-600',
      result: '40% Mais Fechamentos'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/brand-background.png"
          alt="Background"
          fill
          className="object-cover opacity-20 dark:opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-purple-50/30 to-white/90 dark:from-black/50 dark:via-purple-900/20 dark:to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'pt-4' : ''
        }`}>
          <div className={`container mx-auto px-4 transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/20 dark:border-white/10 shadow-lg rounded-2xl max-w-6xl' 
              : 'bg-transparent'
          }`}>
            <div className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled ? 'py-4' : 'py-6'
            }`}>
              {/* Logo - Always visible */}
              <div className="flex items-center space-x-4">
                <Image
                  src="/images/logo-black.png"
                  alt="Scale Labs"
                  width={200}
                  height={60}
                  className="h-8 w-auto dark:hidden"
                />
                <Image
                  src="/images/logo-white.png"
                  alt="Scale Labs"
                  width={200}
                  height={60}
                  className="h-8 w-auto hidden dark:block"
                />
              </div>
              
              {/* Centered Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#agents" className={`transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white' 
                    : 'text-white/80 hover:text-white'
                }`}>
                  Agentes IA
                </a>
                <a href="#pricing" className={`transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white' 
                    : 'text-white/80 hover:text-white'
                }`}>
                  Preços
                </a>
                <a href="#contact" className={`transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white' 
                    : 'text-white/80 hover:text-white'
                }`}>
                  Perguntas Frequentes
                </a>
              </nav>
              
              {/* Right side actions */}
                <div className="flex items-center space-x-4">
                <Link href="/login" className={`transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white' 
                    : 'text-white/80 hover:text-white'
                }`}>
                    Entrar
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                      Começar
                    </Button>
                  </Link>
                </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-5xl mx-auto">
              <Badge 
                id="hero-badge"
                data-animate
                variant="outline" 
                className={`mb-6 border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/10 transition-all duration-1000 ${
                  visibleElements.has('hero-badge') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <Bot className="w-4 h-4 mr-2" />
                Inteligência Empresarial Alimentada por IA
              </Badge>
              <h1 
                id="hero-title"
                data-animate
                className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-700 delay-100 ${
                  visibleElements.has('hero-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <span className="text-gray-900 dark:text-white">O Departamento Comercial</span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-300 dark:to-violet-400 bg-clip-text text-transparent">Que Nunca Dorme</span>
              </h1>
              <p 
                id="hero-description"
                data-animate
                className={`text-xl md:text-2xl text-gray-700 dark:text-white/80 mb-12 leading-relaxed max-w-4xl mx-auto transition-all duration-700 delay-200 ${
                  visibleElements.has('hero-description') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Agentes IA com o conhecimento de 170+ departamentos otimizados. Escala o teu negócio 24/7 
                sem contratar uma equipa inteira. Obtém insights instantâneos, processos automatizados e 
                aceleração de crescimento sem precedentes.
              </p>
              
              {/* Video Section */}
              <div 
                id="hero-video"
                data-animate
                className={`mb-16 transition-all duration-700 delay-300 ${
                  visibleElements.has('hero-video') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative max-w-4xl mx-auto bg-gray-900/50 dark:bg-black/50 rounded-2xl overflow-hidden border border-gray-200/20 dark:border-white/10">
                  <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-violet-600/20 dark:from-purple-900/30 dark:to-violet-900/30 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 dark:bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 dark:hover:bg-white/30 transition-all duration-300 cursor-pointer group">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1 group-hover:scale-110 transition-transform"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2">
                  Como a Scale Labs Gera €10M+ para Clientes
                </h3>
                <p className="text-gray-600 dark:text-white/70">
                  Descobre o sistema exato por trás de 170+ departamentos otimizados
                </p>
              </div>

              {/* Metrics Section */}
              <div 
                id="hero-metrics"
                data-animate
                className={`bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 border border-gray-200 dark:border-gray-700 transition-all duration-700 delay-400 ${
                  visibleElements.has('hero-metrics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      €{countedValues.revenue || 0}M+
                    </div>
                    <div className="text-gray-600 dark:text-white/70 text-sm">Gerados para clientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {countedValues.markets || 0}+
                    </div>
                    <div className="text-gray-600 dark:text-white/70 text-sm">Mercados diferentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {countedValues.calls || 0}+
                    </div>
                    <div className="text-gray-600 dark:text-white/70 text-sm">Chamadas de vendas analisadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {countedValues.departments || 0}+
                    </div>
                    <div className="text-gray-600 dark:text-white/70 text-sm">Departamentos otimizados</div>
                  </div>
                </div>
              </div>

              <div 
                id="hero-cta"
                data-animate
                className={`flex justify-center transition-all duration-700 delay-500 ${
                  visibleElements.has('hero-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-lg px-8 py-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    Quero Ter Acesso
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-24">
              <h2 
                id="problem-title"
                data-animate
                className={`text-4xl md:text-5xl font-bold mb-20 pb-8 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent transition-all duration-700 delay-600 ${
                  visibleElements.has('problem-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Porque 90% dos Negócios Falham a Escalar?
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: "🔥",
                  title: "Consultores Custam Fortunas",
                  description: "€20k-100k+ para consultoria que pode ou não funcionar. A maioria dos negócios não tem este budget, mas precisa deste conhecimento.",
                  gradient: "from-purple-500 to-violet-600"
                },
                {
                  icon: "📞",
                  title: "Equipas Comerciais São Caras",
                  description: "Contratar, treinar e manter vendedores custa €50k+ por pessoa/ano. E ainda assim a maioria não converte como devia.",
                  gradient: "from-violet-500 to-purple-600"
                },
                {
                  icon: "⏰",
                  title: "Processos Manuais Consomem Tempo",
                  description: "Founders gastam 80% do tempo em tarefas que sistemas poderiam fazer. Resultado? Zero tempo para estratégia e crescimento.",
                  gradient: "from-purple-600 to-violet-700"
                },
                {
                  icon: "🛒",
                  title: "Ofertas Que Não Convertem",
                  description: "Mesmo com produtos excelentes, as ofertas não convertem porque não foram testadas e otimizadas com dados reais.",
                  gradient: "from-violet-600 to-purple-700"
                }
              ].map((problem, index) => (
                <div 
                  key={index} 
                  id={`problem-card-${index}`}
                  data-animate
                  className={`group relative bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg hover:shadow-2xl backdrop-blur-sm hover:scale-105 hover:-translate-y-2 ${
                    visibleElements.has(`problem-card-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${800 + (index * 100)}ms`,
                    transitionDuration: '700ms',
                    transitionProperty: 'opacity, transform',
                    transitionTimingFunction: 'ease-out'
                  }}
                >
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-r ${problem.gradient} rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <span className="text-2xl filter drop-shadow-sm">{problem.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">{problem.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="agents" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
                <h2 
                  id="solution-title"
                  data-animate
                  className={`text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-all duration-700 delay-700 ${
                    visibleElements.has('solution-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  A Solução: Agentes IA com Conhecimento Real
              </h2>
              <p 
                id="solution-description"
                data-animate
                className={`text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-all duration-700 delay-800 ${
                  visibleElements.has('solution-description') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Não é AI genérico. É o conhecimento de 170+ departamentos, sistematizado em agents que trabalham para ti.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Scale Expert Agent */}
              <div 
                id="scale-expert-card"
                data-animate
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-gray-900 dark:text-white transition-all duration-700 delay-900 ${
                  visibleElements.has('scale-expert-card') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Scale Expert Agent</h3>
                </div>
                <div className="space-y-4">
                  {[
                    "Cria scripts que convertem baseados em 1000+ calls",
                    "Desenvolve ofertas irresistíveis para o teu mercado",
                    "Optimiza processos com metodologias de €10M+ gerados",
                    "Treina a tua equipa com knowledge de 40+ mercados",
                    "Analisa e optimiza o teu modelo de negócio",
                    "Cria estratégias baseadas em patterns comprovados"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Analyst Agent */}
              <div 
                id="sales-analyst-card"
                data-animate
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-gray-900 dark:text-white transition-all duration-700 delay-1000 ${
                  visibleElements.has('sales-analyst-card') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mr-4">
                    <BarChart3 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Sales Analyst Agent</h3>
                </div>
                <div className="space-y-4">
                  {[
                    "Analisa todas as tuas calls automaticamente",
                    "Identifica objeções e pontos de melhoria",
                    "Compara com database de 1000+ calls de sucesso",
                    "Sugere melhorias específicas em tempo real",
                    "Acompanha o teu desempenho",
                    "Optimiza continuamente baseado em resultados"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 
                id="pricing-title"
                data-animate
                className={`text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-all duration-700 delay-1100 ${
                  visibleElements.has('pricing-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Escolhe o Teu Plano
              </h2>
              
              {/* Pricing Toggle */}
              <div 
                id="pricing-toggle"
                data-animate
                className={`flex items-center justify-center mb-8 transition-all duration-700 delay-1200 ${
                  visibleElements.has('pricing-toggle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center relative">
                    {/* Monthly Option */}
                    <button
                      onClick={() => setIsYearly(false)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        !isYearly 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Mensal
                    </button>
                    
                    {/* Yearly Option with Badge */}
                    <button
                      onClick={() => setIsYearly(true)}
                      className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isYearly 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <span>Anual</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
                        isYearly 
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' 
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        Save 20%
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Plano Base */}
              <div 
                id="pricing-base"
                data-animate
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-2 flex flex-col group hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-700 hover:text-white ${
                  visibleElements.has('pricing-base') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: '1300ms',
                  transitionDuration: '700ms',
                  transitionProperty: 'opacity, transform',
                  transitionTimingFunction: 'ease-out'
                }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-4">Plano Base</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-2">
                    €{isYearly ? '116' : '139'}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-white/80">
                    {isYearly ? '/mês' : '/mês'}
                  </p>
                  {isYearly && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                      €1,390/ano
                    </p>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Scale Expert Agent</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Análises de crescimento</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Estratégias de escala</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Suporte por email</span>
                  </li>
                </ul>

                <Link href="/register">
                  <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 group-hover:bg-white group-hover:text-purple-600">
                    Começar Agora
                  </Button>
                </Link>
              </div>

              {/* Plano Pro */}
              <div 
                id="pricing-pro"
                data-animate
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-2 flex flex-col group hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-700 hover:text-white ${
                  visibleElements.has('pricing-pro') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: '1400ms',
                  transitionDuration: '700ms',
                  transitionProperty: 'opacity, transform',
                  transitionTimingFunction: 'ease-out'
                }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-4">Plano Pro</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-2">
                    €{isYearly ? '224' : '269'}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-white/80">
                    {isYearly ? '/mês' : '/mês'}
                  </p>
                  {isYearly && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                      €2,690/ano
                    </p>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Sales Analyst Agent</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Análise de chamadas de vendas</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Otimização de pipeline</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Previsão de receita</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Suporte prioritário</span>
                  </li>
                </ul>

                <Link href="/register">
                  <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 group-hover:bg-white group-hover:text-purple-600">
                    Começar Agora
                  </Button>
                </Link>
              </div>

              {/* Plano Enterprise */}
              <div 
                id="pricing-enterprise"
                data-animate
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-2 flex flex-col group hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-700 hover:text-white ${
                  visibleElements.has('pricing-enterprise') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: '1500ms',
                  transitionDuration: '700ms',
                  transitionProperty: 'opacity, transform',
                  transitionTimingFunction: 'ease-out'
                }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-4">Plano Enterprise</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-white mb-2">
                    €{isYearly ? '375' : '450'}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-white/80">
                    {isYearly ? '/mês' : '/mês'}
                  </p>
                  {isYearly && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                      €4,500/ano
                    </p>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Todos os agents atuais</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Agents futuros incluídos</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Scale Expert Agent</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Sales Analyst Agent</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-white/90">Suporte 24/7</span>
                  </li>
                </ul>

                <Link href="/register">
                  <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 group-hover:bg-white group-hover:text-purple-600">
                    Começar Agora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Success Cases Section - Hidden for now */}
        {/* <section id="features" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Casos de Sucesso Reais
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Vê como transformámos negócios em 40+ mercados diferentes
              </p>
            </div>

            Carousel
            <div className="relative max-w-6xl mx-auto">
              Case Studies Data
              {(() => {
                const caseStudies = [
                {
                  bgColor: "bg-blue-600",
                  category: "SaaS • €50k → €200k MRR",
                  title: "De €50k para €200k MRR em 8 meses",
                    description: "Como optimizámos o processo comercial de uma SaaS tech",
                    metric: "€200k MRR",
                    chartData: ["€50k", "€75k", "€120k", "€150k", "€200k"]
                },
                {
                  bgColor: "bg-teal-600",
                  category: "Agency • 500+ leads/mês",
                  title: "500+ leads qualificados por mês",
                    description: "Como automatizámos a geração de leads numa agência",
                    metric: "500+ leads/mês",
                    chartData: ["1230", "1450", "2550", "2250", "2580"]
                },
                {
                  bgColor: "bg-orange-600",
                  category: "Retail • +250% ROI",
                  title: "ROI de 250% em campanhas",
                    description: "Optimização total de funil para retail",
                    metric: "+250% ROI",
                    chartData: ["17,900", "22,100", "28,500", "31,200", "35,800"]
                },
                {
                  bgColor: "bg-indigo-600",
                  category: "FinTech • 80% menos churn",
                  title: "Reduzimos churn em 80%",
                    description: "Sistema de retenção para FinTech",
                    metric: "80% menos churn",
                    chartData: ["50%", "30%", "15%", "10%", "8%"]
                  },
                  {
                    bgColor: "bg-purple-600",
                    category: "E-commerce • +300% conversão",
                    title: "Triplicámos a conversão em 4 meses",
                    description: "Scripts e ofertas que transformaram um e-commerce",
                    metric: "+300% conversão",
                    chartData: ["2.1%", "3.8%", "5.2%", "6.8%", "8.4%"]
                  },
                  {
                    bgColor: "bg-red-600",
                    category: "Consultoria • €0 → €100k/mês",
                    title: "De zero a €100k/mês em 6 meses",
                    description: "Sistema completo para consultoria B2B",
                    metric: "€100k/mês",
                    chartData: ["€0", "€15k", "€35k", "€65k", "€100k"]
                  }
                ]

                const currentStudy = caseStudies[currentCase]
                const nextCase = (currentCase + 1) % caseStudies.length
                const prevCase = (currentCase - 1 + caseStudies.length) % caseStudies.length

                return (
                  <>
                    Main Carousel Display
                    <div className="relative">
                      Current Case Study
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
                        <div className={`${currentStudy.bgColor} p-8 relative`}>
                          Play Button
                          <div className="absolute top-4 right-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
                            <Play className="w-5 h-5 text-white ml-1" />
                          </div>
                          
                          Category Badge
                          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                            <span className="text-white text-sm font-medium">{currentStudy.category.split(' • ')[0]}</span>
                          </div>
                          
                          Metric Badge
                          <div className="absolute bottom-4 left-4 bg-yellow-400 rounded-full px-3 py-1">
                            <span className="text-gray-900 text-sm font-bold">{currentStudy.metric}</span>
                          </div>
                          
                          Chart Visualization
                          <div className="mt-8 mb-4">
                            <div className="flex items-end justify-center space-x-2 h-20">
                              {currentStudy.chartData.map((value, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div 
                                    className="bg-white/30 rounded-t w-6 mb-1"
                                    style={{ height: `${(index + 1) * 15 + 20}px` }}
                                  ></div>
                                  <span className="text-white text-xs">{value}</span>
                                </div>
                              ))}
                            </div>
                    </div>
                  </div>
                        
                  <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                            "{currentStudy.title}"
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            {currentStudy.description}
                          </p>
                  </div>
                </div>

                      Navigation Arrows
                      <button
                        onClick={() => setCurrentCase(prevCase)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-white" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentCase(nextCase)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700 dark:text-white" />
                      </button>
                    </div>

                    Dots Navigation
                    <div className="flex justify-center mt-8 space-x-2">
                      {caseStudies.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentCase(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            index === currentCase 
                              ? 'bg-purple-600 dark:bg-purple-400' 
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </section> */}

        {/* FAQ Section */}
        <section id="contact" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <div 
                id="faq-badge"
                data-animate
                className={`inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-300 mb-4 transition-all duration-500 delay-1200 ${
                  visibleElements.has('faq-badge') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Perguntas Frequentes
              </div>
              <h2 
                id="faq-title"
                data-animate
                className={`text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-all duration-500 delay-1300 ${
                  visibleElements.has('faq-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Perguntas? Respostas!
              </h2>
              <p 
                id="faq-subtitle"
                data-animate
                className={`text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-all duration-500 delay-1400 ${
                  visibleElements.has('faq-subtitle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Encontra respostas rápidas às perguntas mais comuns sobre a nossa plataforma
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {[
                  {
                    question: "Como funcionam os Agentes IA da Scale Labs?",
                    answer: "Os nossos Agentes IA são alimentados com o conhecimento de 170+ departamentos otimizados. Cada agente tem especialização específica: Scale Expert para crescimento e Sales Analyst para análise de vendas. Trabalham 24/7 para otimizar os teus processos."
                  },
                  {
                    question: "Posso cancelar o meu plano a qualquer momento?",
                    answer: "Sim, podes cancelar o teu plano a qualquer momento sem compromissos. Não há taxas de cancelamento ou períodos de fidelização. O acesso aos serviços termina no final do período de faturação atual."
                  },
                  {
                    question: "Os dados da minha empresa estão seguros?",
                    answer: "Absolutamente. Utilizamos encriptação de nível bancário e cumprimos todas as regulamentações de proteção de dados (GDPR). Os teus dados nunca são partilhados com terceiros e são armazenados em servidores seguros na Europa."
                  },
                  {
                    question: "Quanto tempo demora a ver resultados?",
                    answer: "A maioria dos nossos clientes vê melhorias significativas nas primeiras 2-4 semanas. Para resultados mais profundos e transformação completa dos processos, recomendamos um período de 3-6 meses de utilização consistente."
                  },
                  {
                    question: "Oferecem suporte e formação?",
                    answer: "Sim! Todos os planos incluem suporte por email. O Plano Pro inclui suporte prioritário, e o Plano Enterprise inclui suporte 24/7 e um gestor de conta dedicado. Também oferecemos webinars de formação e documentação completa."
                  },
                  {
                    question: "O que acontece se precisar de mais agents no futuro?",
                    answer: "Com o Plano Enterprise, tens acesso automático a todos os agents futuros sem custos adicionais. Para os planos Base e Pro, podes fazer upgrade a qualquer momento."
                  }
                ].map((faq, index) => (
                  <div 
                    key={index} 
                    id={`faq-card-${index}`}
                    data-animate
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all duration-500 ${
                      visibleElements.has(`faq-card-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${1500 + (index * 80)}ms` }}
                  >
                    <button
                      onClick={() => {
                        setOpenFAQs(prev => 
                          prev.includes(index) 
                            ? prev.filter(i => i !== index)
                            : [...prev, index]
                        )
                      }}
                      className="w-full px-6 py-4 text-left flex items-center justify-between"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                        {faq.question}
                      </h3>
                      <div className="flex-shrink-0">
                        <div className={`transition-transform duration-500 ease-in-out ${openFAQs.includes(index) ? 'rotate-180' : 'rotate-0'}`}>
                          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      openFAQs.includes(index) 
                        ? 'max-h-96 opacity-100' 
                        : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-6 pb-4">
                        <p className={`text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-700 ease-in-out ${
                          openFAQs.includes(index) 
                            ? 'blur-0 filter-none' 
                            : 'blur-sm filter'
                        }`}>
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>

            <div 
              id="faq-contact"
              data-animate
              className={`text-center mt-12 transition-all duration-500 delay-2000 ${
                visibleElements.has('faq-contact') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-center justify-center text-gray-600 dark:text-gray-300">
                <MessageSquare className="w-5 h-5 mr-2" />
                <span>Tens alguma pergunta? <a href="mailto:hello@scalelabs.com" className="text-purple-600 dark:text-purple-400 hover:underline">hello@scalelabs.com</a></span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 
              id="final-cta-title"
              data-animate
              className={`text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-all duration-500 delay-2600 ${
                visibleElements.has('final-cta-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Quer Crescer Como os Top 1%?
            </h2>
            <p 
              id="final-cta-subtitle"
              data-animate
              className={`text-xl text-gray-700 dark:text-white/80 mb-8 max-w-3xl mx-auto transition-all duration-500 delay-2700 ${
                visibleElements.has('final-cta-subtitle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Junta-te aos founders que escolheram sistemas em vez de sorte.
            </p>
            <p 
              id="final-cta-description"
              data-animate
              className={`text-lg text-gray-600 dark:text-white/70 mb-12 transition-all duration-500 delay-2800 ${
                visibleElements.has('final-cta-description') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Early access limitado. Apenas para sérios.
            </p>

            <div 
              id="final-cta-button"
              data-animate
              className={`flex justify-center transition-all duration-500 delay-2900 ${
                visibleElements.has('final-cta-button') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-lg px-8 py-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                  Quero Ter Acesso
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="border-t border-gray-200/20 dark:border-white/10 py-12 px-4 bg-white/80 dark:bg-black/80">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Image
                  src="/images/logo-black.png"
                  alt="Scale Labs"
                  width={150}
                  height={45}
                  className="h-6 w-auto dark:hidden"
                />
                <Image
                  src="/images/logo-white.png"
                  alt="Scale Labs"
                  width={150}
                  height={45}
                  className="h-6 w-auto hidden dark:block"
                />
              </div>
              <div className="text-gray-600 dark:text-white/60 text-sm">
                © 2024 Scale Labs. Todos os direitos reservados.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
