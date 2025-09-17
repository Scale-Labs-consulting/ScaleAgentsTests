'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import ROICalculator from '@/components/roi-calculator'
import { ArrowRight, Bot, TrendingUp, Users, Zap, MessageSquare, BarChart3, UserCheck, ChevronLeft, ChevronRight, Play, ChevronDown, ChevronUp } from 'lucide-react'

export default function HomePage() {
  const [currentCase, setCurrentCase] = useState(0)
  const [currentTestimonialPage, setCurrentTestimonialPage] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openFAQs, setOpenFAQs] = useState<number[]>([])
  const [isYearly, setIsYearly] = useState(true)
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set())
  const [countedValues, setCountedValues] = useState<Record<string, number>>({})
  const [faqAnimationTriggered, setFaqAnimationTriggered] = useState(false)
  const [videoStates, setVideoStates] = useState<Record<string, { isPlaying: boolean; currentTime: number; duration: number; isMuted: boolean; volume: number; showVolumeSlider: boolean; isDragging: boolean }>>({})
  const [carouselScrollState, setCarouselScrollState] = useState({ canScrollLeft: false, canScrollRight: true })
  const metricsAnimationTriggered = useRef(false)
  const [isClient, setIsClient] = useState(false)

  // Helper function to safely get video element (client-side only)
  const getVideoElement = (videoFile: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    
    const videos = document.querySelectorAll('video');
    return Array.from(videos).find(v => 
      v.querySelector(`source[src*="${videoFile.split('/').pop()}"]`)
    ) || null;
  }

  // Function to update carousel scroll state
  const updateCarouselScrollState = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const carousel = document.querySelector('#testimonials-carousel ul');
    if (carousel) {
      const canScrollLeft = carousel.scrollLeft > 0;
      const canScrollRight = carousel.scrollLeft < (carousel.scrollWidth - carousel.clientWidth);
      setCarouselScrollState({ canScrollLeft, canScrollRight });
      
      // Update current page based on scroll position
      const firstItem = carousel.querySelector('li');
      const itemWidth = firstItem ? firstItem.offsetWidth + 20 : 320;
      const videosPerPage = 4;
      const scrollAmount = itemWidth * videosPerPage;
      const currentPage = Math.round(carousel.scrollLeft / scrollAmount);
      setCurrentTestimonialPage(currentPage);
    }
  }

  // Set client flag for hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add scroll event listener for carousel
  useEffect(() => {
    // Use a more specific selector for the testimonial carousel
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const carousel = document.querySelector('#testimonials-carousel ul');
    if (carousel) {
      carousel.addEventListener('scroll', updateCarouselScrollState);
      updateCarouselScrollState(); // Initial state
      return () => carousel.removeEventListener('scroll', updateCarouselScrollState);
    }
  }, [])

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
            
            // Trigger counting animation for metrics (only once)
            if (entry.target.id === 'hero-metrics' && !metricsAnimationTriggered.current) {
              metricsAnimationTriggered.current = true
              animateCount('revenue', 10, 2000) // €10M+
              animateCount('markets', 40, 2000) // 40+
              animateCount('calls', 1000, 2000) // 1000+
              animateCount('departments', 170, 2000) // 170+
            }
            
            // Trigger FAQ animation sequence when subtitle appears
            if (entry.target.id === 'faq-subtitle' && !faqAnimationTriggered) {
              setFaqAnimationTriggered(true)
              // Wait for subtitle animation to complete, then trigger FAQ cards
              setTimeout(() => {
                for (let i = 0; i < 6; i++) {
                  setTimeout(() => {
                    setVisibleElements(prev => new Set(prev).add(`faq-card-${i}`))
                  }, i * 50)
                }
              }, 600) // Wait 600ms for subtitle animation to complete (500ms duration + 100ms buffer)
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    // Observe all elements with animation classes
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const animatedElements = document.querySelectorAll('[data-animate]')
      animatedElements.forEach(el => observer.observe(el))
    }

    return () => observer.disconnect()
  }, [faqAnimationTriggered])

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
          src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/background-4.jpg"
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
                  src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-black.png"
                  alt="Scale Labs"
                  width={200}
                  height={60}
                  className="h-8 w-auto dark:hidden"
                />
                <Image
                  src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
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
                Depois de termos trabalhado e otimizado mais de 170 departamentos comerciais e mais de 10 Milhoes gerados no último ano, a Scale Labs apresenta todo o nosso conhecimento e frameworks dentro de AI agents.
              </p>
              
              {/* Trust Factor Section */}
              <div 
                id="hero-trust-factor"
                data-animate
                className={`mb-8 transition-all duration-700 delay-250 ${
                  visibleElements.has('hero-trust-factor') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <Image
                    src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/trustFactor.png"
                    alt="Como a Scale Labs Gera €10M+ para Clientes - Descobre o sistema exato por trás de 170+ departamentos otimizados"
                    width={300}
                    height={100}
                    className="w-auto h-auto max-w-xs"
                  />
                  
                  {/* Stars and Trust Factor */}
                  <div className="flex flex-col items-center space-y-1">
                    {/* 5 Stars (4.5/5 rating) */}
                    <div className="flex items-center space-x-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-4 h-4">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-yellow-400">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                      ))}
                      {/* 5th star (4.5/5 rating) */}
                      <div className="w-4 h-4 relative">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-yellow-400">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <div className="absolute inset-0 bg-gray-900 dark:bg-black" style={{clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)'}}></div>
                      </div>
                    </div>
                    
                    {/* Trust Factor Text */}
                    <p className="text-white text-xs font-medium">
                      +160 Negócios Transformados
                    </p>
                  </div>
                </div>
              </div>
              
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
              </div>

              {/* Trusted By Carousel Section */}
              <div 
                id="hero-carousel"
                data-animate
                className={`mb-12 transition-all duration-700 delay-350 ${
                  visibleElements.has('hero-carousel') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="text-center mb-8">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Confiado por negócios líder em Portugal e internacionalmente
                  </h3>
                </div>
                
                {/* Moving Carousel */}
                <div className="relative overflow-hidden">
                  <div className="flex animate-scroll-fast" style={{ width: 'max-content' }}>
                    {/* First set of logos - all in one continuous line */}
                    <div className="flex items-center flex-shrink-0">
                      {[
                        'allin.png', 'ANPG.png', 'Appear.png', 'Bagati.png', 'bateria.png',
                        'Brasfone.png', 'cartola.png', 'CASA DAS MALHAS.png', 'diogo.png', 'FASHION.png',
                        'fluxe.png', 'fullyops.png', 'global energia.png', 'Global International.png', 'Go credito.png',
                        'grandidea.png', 'hookpoint.png', 'hug.png', 'Impacto visual.png', 'induquimica.png',
                        'ivory.png', 'Joyn.png', 'JP.png', 'lugotech.png', 'M nao sei quem é.png',
                        'Magike Evolution.png', 'maria.png', 'mariana.png', 'mobrand.png', 'Motonow.png',
                        'Mush.png', 'nao sei quem é.png', 'narrativa.png', 'NFB.png', 'OPROCESSO.png',
                        'pangera.png', 'PKE AUTOMOTIVE.png', 'Plthora.png', 'portdance.png', 'prifer.png',
                        'Rezult.png', 'sigma code.png', 'Slidelab.png', 'SOU.png', 'sunvia.png',
                        'THC Transportes.png', 'Ti.png', 'tomas lopes.png', 'UNIK.png'
                      ].map((logo, index) => (
                        <div key={`first-${index}`} className="flex items-center justify-center h-16 w-28 flex-shrink-0 mx-4">
                          <Image
                            src={`https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/caseStudies/${encodeURIComponent(logo)}`}
                            alt={logo.replace('.png', '')}
                            width={100}
                            height={50}
                            className="max-h-10 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Second set for seamless loop */}
                    <div className="flex items-center flex-shrink-0">
                      {[
                        'allin.png', 'ANPG.png', 'Appear.png', 'Bagati.png', 'bateria.png',
                        'Brasfone.png', 'cartola.png', 'CASA DAS MALHAS.png', 'diogo.png', 'FASHION.png',
                        'fluxe.png', 'fullyops.png', 'global energia.png', 'Global International.png', 'Go credito.png',
                        'grandidea.png', 'hookpoint.png', 'hug.png', 'Impacto visual.png', 'induquimica.png',
                        'ivory.png', 'Joyn.png', 'JP.png', 'lugotech.png', 'M nao sei quem é.png',
                        'Magike Evolution.png', 'maria.png', 'mariana.png', 'mobrand.png', 'Motonow.png',
                        'Mush.png', 'nao sei quem é.png', 'narrativa.png', 'NFB.png', 'OPROCESSO.png',
                        'pangera.png', 'PKE AUTOMOTIVE.png', 'Plthora.png', 'portdance.png', 'prifer.png',
                        'Rezult.png', 'sigma code.png', 'Slidelab.png', 'SOU.png', 'sunvia.png',
                        'THC Transportes.png', 'Ti.png', 'tomas lopes.png', 'UNIK.png'
                      ].map((logo, index) => (
                        <div key={`second-${index}`} className="flex items-center justify-center h-16 w-28 flex-shrink-0 mx-4">
                          <Image
                            src={`https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/caseStudies/${encodeURIComponent(logo)}`}
                            alt={logo.replace('.png', '')}
                            width={100}
                            height={50}
                            className="max-h-10 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
        <section className="py-24 px-4 min-h-screen">
          <div className="container mx-auto">
            <div className="text-center mb-16">
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
            
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl">
              {[
                {
                  icon: "👥",
                  title: "Equipas Sem Performance Optimizada",
                  description: "Contratar vendedores custa €50k+ por pessoa/ano. Já que o investimento é alto, mais vale garantir que eles performam ao máximo com sistemas e formação adequada.",
                  gradient: "from-purple-600 to-violet-700"
                },
                {
                  icon: "🎯",
                  title: "Investem nos Sítios Errados",
                  description: "Sem dados precisos, os diretores investem em marketing quando o problema é o fecho de negócio, ou em leads quando o problema é a oferta. Desperdiçam recursos no sintoma, não na causa.",
                  gradient: "from-purple-600 to-violet-700"
                },
                {
                  icon: "🛒",
                  title: "Ofertas Que Não Convertem",
                  description: "Scripts genéricos, ofertas não testadas, processos amadores. Como esperas competir contra empresas com sistemas profissionais e dados reais?",
                  gradient: "from-purple-600 to-violet-700"
                },
                {
                  icon: "📊",
                  title: "Falta de Dados Para Optimizar",
                  description: "A maioria dos negócios não analisa as suas reuniões de venda nem têm feedback baseado em dados reais. Como vais melhorar sem saber onde estás a falhar?",
                  gradient: "from-purple-600 to-violet-700"
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
                        Poupe 20%
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
                    /mês
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                    €{isYearly ? '1,392' : '1,668'}/ano
                  </p>
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
                    /mês
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                    €{isYearly ? '2,688' : '3,228'}/ano
                  </p>
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
                    /mês
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/60 mt-1">
                    €{isYearly ? '4,500' : '5,400'}/ano
                  </p>
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

        {/* ROI Calculator Section */}
        <ROICalculator />


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
              <div className="space-y-6">
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
                    className={`w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all duration-500 ${
                      visibleElements.has(`faq-card-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ 
                      minHeight: '80px'
                    }}
                  >
                    <button
                      onClick={() => {
                        setOpenFAQs(prev => 
                          prev.includes(index) 
                            ? prev.filter(i => i !== index)
                            : [...prev, index]
                        )
                      }}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 min-h-[80px]"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4 flex-1">
                        {faq.question}
                      </h3>
                      <div className="flex-shrink-0 ml-4">
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
                      <div className="px-6 pb-5">
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
              className={`text-center mt-12 transition-all duration-500 delay-3000 ${
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

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white dark:text-white">
              TESTEMUNHOS
            </h2>
            <p className="text-xl text-white dark:text-white max-w-3xl mx-auto">
              Deixamos Os Clientes Falar Por Nós
            </p>
          </div>

          <div className="relative max-w-7xl mx-auto">
            {(() => {
              // Testimonial data with actual video files and company links
              const testimonials = [
                {
                  company: "Hook Point",
                  speaker: "José Brizida",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Jos%C3%A9%20Brizida%20-%20Hook%20Point%20-%202025.mp4",
                  website: "https://hookpoint.com/",
                  videoTime: "0:00"
                },
                {
                  company: "Cyberprotech",
                  speaker: "João Pacheco",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Jo%C3%A3o%20Pacheco%20-%20Cyberprotech%20-%202025.mp4",
                  website: "https://cyberprotech.org/",
                  videoTime: "0:00"
                },
                {
                  company: "Sigma Code",
                  speaker: "Carlos Costa",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Carlos%20Costa%20-%20Sigma%20Code%20.mp4",
                  website: "https://youtu.be/M82JIpX4bcE",
                  videoTime: "0:00"
                },
                {
                  company: "Lugotech",
                  speaker: "Pedro Lisboa",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Pedro%20Lisboa%20-%20Lugotech%20-%202025_03_26.mp4",
                  website: "https://lugo.tech/",
                  videoTime: "0:00"
                },
                {
                  company: "Narrativa de Espaços",
                  speaker: "Cheila",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/SCALE%20LABS%20-%20OD%20Testemunho%20Cheila%20-%20(Apex%20Reach).webm",
                  website: "https://narrativadeespacos.com/",
                  videoTime: "0:00"
                },
                {
                  company: "DUPLO NETWORK", 
                  speaker: "Francisco Marta",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Francisco%20Marta%20-%20Duplo%20Network%20-%202025.mp4",
                  website: "https://duplonetwork.com/",
                  videoTime: "0:00"
                },
                {
                  company: "Brasfone",
                  speaker: "Fábio Igor CEO - Grupo Brasfone", 
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20F%C3%A1bio%20Igor%20-%20Brasfone%20-%202025.mp4",
                  website: "https://www.brasfone.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "MoBrand",
                  speaker: "Adriano Prates COO da Mobrand",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Adriano%20Prates%20-%20Mobrand%20-%202025.mp4",
                  website: "https://www.mobrand.com/",
                  videoTime: "0:00"
                },
                {
                  company: "Maria Maia Group",
                  speaker: "Maria Maia",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Maria%20Maia%20-%20Mariamaiagroup%20-%202025.mp4",
                  website: "https://mariamaiabeauty.com/pt",
                  videoTime: "0:00"
                },
                {
                  company: "SlideLab Presentations",
                  speaker: "João Tavares",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Jo%C3%A3o%20Tavares%20-%20SlideLab%20-%202025.mp4",
                  website: "https://slidelabpresentations.com/",
                  videoTime: "0:00"
                },
                {
                  company: "JP Crédito e Seguros",
                  speaker: "João Pereira",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Jo%C3%A3o%20Pereira%20-%20JP%20Cr%C3%A9dito%20e%20Seguros%20-%202025.mp4",
                  website: "https://youtu.be/5dQCmMpb3a8",
                  videoTime: "0:00"
                },
                {
                  company: "PKE Automotive",
                  speaker: "Nuno Zeferino",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Nuno%20Zeferino%20-%20PKE%20-%202025.mp4",
                  website: "https://www.pke.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "Bateria",
                  speaker: "Rita Garcia",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Rita%20Garcia%20-%20Bateria%20-%202025_03_26.mp4",
                  website: "https://www.bateria.com.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "Grand'Ideia",
                  speaker: "Joana Lino",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Joana%20Lino%20-%20Grand_Ideia%20-%202025_07_14.mp4",
                  website: "https://www.grandideia.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "Fluxe Agency",
                  speaker: "Pedro Silva",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Pedro%20Silva%20-%20Fluxe%20-%202025_03_26.mp4",
                  website: "https://www.fluxeagency.com/home",
                  videoTime: "0:00"
                },
                {
                  company: "ETHIC Wellness Boutique",
                  speaker: "Samuel Silva",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Samuel%20Silva%20-%20Ethic%20-%202025_03_26.mp4",
                  website: "https://ethic.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "Joyn",
                  speaker: "Pedro Oliveira",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Pedro%20Oliveira%20-%20Joyn%20-%202025.mp4",
                  website: "https://www.youtube.com/watch?v=XUD_Mb0FjR0",
                  videoTime: "0:00"
                },
                {
                  company: "MotoNow",
                  speaker: "Gustavo Alvez",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Gustavo%20Alvez%20-%20Motonow%20-%202025.mp4",
                  website: "https://youtu.be/_UJNiEGGKSs",
                  videoTime: "0:00"
                },
                {
                  company: "Growth Partner",
                  speaker: "Bruno Pinheiro",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Bruno%20Pinheiro%20-%20Growth%20Partner%20-%202025_03_26.mp4",
                  website: "https://growthpartner.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "Next2B",
                  speaker: "João Martins",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Jo%C3%A3o%20Martins%20-%20Next2B%20-%202025.mov",
                  website: "https://next2b.pt/",
                  videoTime: "0:00"
                },
                {
                  company: "Adency",
                  speaker: "João Mafra",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Jo%C3%A3o%20Mafra%20-%20Adency.mp4",
                  website: "https://adency.io/",
                  videoTime: "0:00"
                },
                {
                  company: "Diário de Um Ambicioso",
                  speaker: "Rui Nogueira",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/TESTEMUNHO%20-%20Rui%20Nogueira%20-%20DDUA.MP4",
                  website: "https://diariodeumambicioso.com/",
                  videoTime: "0:00"
                },
                {
                  company: "Tomás Lopes",
                  speaker: "Tomás Lopes",
                  videoFile: "https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/testemunhos/Scale%20Labs%20-%20Testemunho%20Tomas%20(Apex%20Reach).mp4",
                  website: "https://www.instagram.com/tomaslopes.consultor/",
                  videoTime: "0:00"
                },
              ]

              const totalTestimonials = testimonials.length
              const testimonialsPerPage = 4
              const totalPages = Math.floor(totalTestimonials / testimonialsPerPage)
              
              // Get current page testimonials
              const startIndex = currentTestimonialPage * testimonialsPerPage
              const endIndex = Math.min(startIndex + testimonialsPerPage, totalTestimonials)
              const currentTestimonials = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i)

              return (
                <>
                  {/* Horizontal Scrolling Carousel */}
                  <div id="testimonials-carousel" className="relative overflow-hidden" style={{ padding: '0 44px 36px' }}>
                    <ul 
                      className="flex gap-5 overflow-x-auto scrollbar-hide"
                      style={{ 
                        scrollSnapType: 'x mandatory',
                        scrollBehavior: 'smooth'
                      }}
                    >
                      {testimonials.map((testimonial, index) => (
                        <li 
                          key={index}
                          className="flex-shrink-0"
                          style={{ 
                            width: 'calc(25% - 15px)',
                            scrollSnapAlign: 'start',
                            scrollSnapStop: 'always'
                          }}
                        >
                          <div className="w-full">
                            {/* Company Name with Link */}
                            <a 
                              href={testimonial.website}
                              target="_blank"
                              rel="noopener"
                              className="block mb-2"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-white text-sm font-medium">{testimonial.company}</p>
                                <svg 
                                  width="11" 
                                  height="11" 
                                  viewBox="0 0 11 11" 
                                  className="text-white opacity-60"
                                >
                                  <path 
                                    d="M1 10L10 1M10 1H1M10 1V10" 
                                    stroke="currentColor" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </a>
                            
                            {/* Video Container */}
                            <div 
                              className="relative rounded-lg overflow-hidden border border-gray-300/20 dark:border-gray-600/30"
                              style={{ 
                                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                aspectRatio: '9/16'
                              }}
                            >
                              <video 
                                className="w-full h-full object-cover cursor-pointer"
                                preload="metadata"
                                playsInline
                                muted
                                loop
                                onClick={(e) => {
                                  // Don't trigger play/pause if clicking on controls or any control elements
                                  const target = e.target as Element;
                                  if (target.closest('.video-controls') || 
                                      target.closest('[class*="bg-black/70"]') ||
                                      target.closest('button') ||
                                      target.closest('input') ||
                                      target.closest('[class*="cursor-pointer"]')) {
                                    return;
                                  }
                                  
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const video = e.currentTarget;
                                  if (video.paused) {
                                    video.play();
                                  } else {
                                    video.pause();
                                  }
                                }}
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  display: 'block',
                                  objectFit: 'cover',
                                  backgroundColor: 'rgba(0, 0, 0, 0)',
                                  objectPosition: '50% 50%'
                                }}
                                onLoadedMetadata={(e) => {
                                  const video = e.currentTarget;
                                  console.log('Video metadata loaded:', {
                                    duration: video.duration,
                                    videoFile: testimonial.videoFile
                                  });
                                  setVideoStates(prev => ({
                                    ...prev,
                                    [testimonial.videoFile]: {
                                      isPlaying: false,
                                      currentTime: 0,
                                      duration: video.duration || 0,
                                      isMuted: video.muted,
                                      volume: video.volume || 1,
                                      showVolumeSlider: false,
                                      isDragging: false
                                    }
                                  }));
                                }}
                                onDurationChange={(e) => {
                                  const video = e.currentTarget;
                                  console.log('Duration changed:', video.duration);
                                  setVideoStates(prev => ({
                                    ...prev,
                                    [testimonial.videoFile]: {
                                      ...prev[testimonial.videoFile],
                                      duration: video.duration || 0
                                    }
                                  }));
                                }}
                                onTimeUpdate={(e) => {
                                  const video = e.currentTarget;
                                  // Don't update time while dragging to prevent conflicts
                                  if (videoStates[testimonial.videoFile]?.isDragging) return;
                                  
                                  setVideoStates(prev => ({
                                    ...prev,
                                    [testimonial.videoFile]: {
                                      ...prev[testimonial.videoFile],
                                      currentTime: video.currentTime
                                    }
                                  }));
                                }}
                                onPlay={(e) => {
                                  setVideoStates(prev => ({
                                    ...prev,
                                    [testimonial.videoFile]: {
                                      ...prev[testimonial.videoFile],
                                      isPlaying: true
                                    }
                                  }));
                                }}
                                onPause={(e) => {
                                  setVideoStates(prev => ({
                                    ...prev,
                                    [testimonial.videoFile]: {
                                      ...prev[testimonial.videoFile],
                                      isPlaying: false
                                    }
                                  }));
                                }}
                              >
                                <source src={testimonial.videoFile} type="video/mp4" />
                                <source src={testimonial.videoFile} type="video/webm" />
                                <source src={testimonial.videoFile} type="video/quicktime" />
                                Your browser does not support the video tag.
                              </video>
                              
                              {/* Video Controls */}
                              <div className="video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                                {/* Progress Bar - Full Width */}
                                <div className="mb-3">
                                  <div className="relative">
                                    <div 
                                      className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all duration-200 select-none"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        
                                        const video = getVideoElement(testimonial.videoFile);
                                        if (!video) return;
                                        
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const duration = videoStates[testimonial.videoFile]?.duration || video.duration || 0;
                                        const newTime = (clickX / rect.width) * duration;
                                        video.currentTime = newTime;
                                        
                                        // Update the video state to reflect the new time
                                        setVideoStates(prev => ({
                                          ...prev,
                                          [testimonial.videoFile]: {
                                            ...prev[testimonial.videoFile],
                                            currentTime: newTime
                                          }
                                        }));
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        
                                        const video = getVideoElement(testimonial.videoFile);
                                        if (!video) return;
                                        
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const startX = e.clientX - rect.left;
                                        const duration = videoStates[testimonial.videoFile]?.duration || video.duration || 0;
                                        const startTime = (startX / rect.width) * duration;
                                        
                                        // Set initial position
                                        video.currentTime = startTime;
                                        setVideoStates(prev => ({
                                          ...prev,
                                          [testimonial.videoFile]: {
                                            ...prev[testimonial.videoFile],
                                            currentTime: startTime,
                                            isDragging: true
                                          }
                                        }));
                                        
                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                          moveEvent.preventDefault();
                                          const newX = moveEvent.clientX - rect.left;
                                          const clampedX = Math.max(0, Math.min(rect.width, newX));
                                          const newTime = (clampedX / rect.width) * duration;
                                          
                                          video.currentTime = newTime;
                                          setVideoStates(prev => ({
                                            ...prev,
                                            [testimonial.videoFile]: {
                                              ...prev[testimonial.videoFile],
                                              currentTime: newTime
                                            }
                                          }));
                                        };
                                        
                                        const handleMouseUp = () => {
                                          setVideoStates(prev => ({
                                            ...prev,
                                            [testimonial.videoFile]: {
                                              ...prev[testimonial.videoFile],
                                              isDragging: false
                                            }
                                          }));
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };
                                        
                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                      }}
                                    >
                                      <div 
                                        className="h-full bg-white rounded-full transition-all duration-100"
                                        style={{
                                          width: `${isClient ? (() => {
                                            const currentTime = videoStates[testimonial.videoFile]?.currentTime || 0;
                                            let duration = videoStates[testimonial.videoFile]?.duration || 0;
                                            
                                            // If duration is 0, try to get it from the video element
                                            if (duration === 0) {
                                              const video = getVideoElement(testimonial.videoFile);
                                              if (video && video.duration && !isNaN(video.duration)) {
                                                duration = video.duration;
                                              }
                                            }
                                            
                                            if (duration === 0) return 0;
                                            return Math.min((currentTime / duration) * 100, 100);
                                          })() : 0}%`
                                        }}
                                      />
                                      {/* Draggable Handle */}
                                      <div 
                                        className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-ew-resize"
                                        style={{
                                          left: `${isClient ? (() => {
                                            const currentTime = videoStates[testimonial.videoFile]?.currentTime || 0;
                                            let duration = videoStates[testimonial.videoFile]?.duration || 0;
                                            
                                            if (duration === 0) {
                                              const video = getVideoElement(testimonial.videoFile);
                                              if (video && video.duration && !isNaN(video.duration)) {
                                                duration = video.duration;
                                              }
                                            }
                                            
                                            if (duration === 0) return 0;
                                            return Math.min((currentTime / duration) * 100, 100);
                                          })() : 0}%`,
                                          transform: 'translate(-50%, -50%)'
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Control Buttons Row */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {/* Play/Pause Button */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const video = getVideoElement(testimonial.videoFile);
                                        if (!video) return;
                                        
                                        if (video.paused) {
                                          video.play();
                                        } else {
                                          video.pause();
                                        }
                                      }}
                                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                      {videoStates[testimonial.videoFile]?.isPlaying ? (
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                        </svg>
                                      ) : (
                                        <Play className="w-4 h-4 ml-0.5 text-white" />
                                      )}
                                    </button>
                                    
                                    {/* Time Display */}
                                    <span className="text-white text-sm font-mono">
                                      {isClient ? (() => {
                                        const formatTime = (seconds: number) => {
                                          if (!seconds || isNaN(seconds)) return '0:00';
                                          const mins = Math.floor(seconds / 60);
                                          const secs = Math.floor(seconds % 60);
                                          return `${mins}:${secs.toString().padStart(2, '0')}`;
                                        };
                                        const currentTime = videoStates[testimonial.videoFile]?.currentTime || 0;
                                        const duration = videoStates[testimonial.videoFile]?.duration || 0;
                                        
                                        // If duration is 0 or not available, try to get it from the video element
                                        let actualDuration = duration;
                                        if (duration === 0) {
                                          const video = getVideoElement(testimonial.videoFile);
                                          if (video && video.duration && !isNaN(video.duration)) {
                                            actualDuration = video.duration;
                                          }
                                        }
                                        
                                        return `${formatTime(currentTime)} / ${formatTime(actualDuration)}`;
                                      })() : '0:00 / 0:00'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    {/* Rewind 10s Button */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const video = getVideoElement(testimonial.videoFile);
                                        if (!video) return;
                                        
                                        video.currentTime = Math.max(0, video.currentTime - 10);
                                      }}
                                      className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                      title="Rewind 10s"
                                    >
                                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                                      </svg>
                                    </button>
                                    
                                    {/* Forward 10s Button */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const video = getVideoElement(testimonial.videoFile);
                                        if (!video) return;
                                        
                                        const duration = videoStates[testimonial.videoFile]?.duration || video.duration || 0;
                                        video.currentTime = Math.min(duration, video.currentTime + 10);
                                      }}
                                      className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                      title="Forward 10s"
                                    >
                                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                                      </svg>
                                    </button>
                                    
                                    {/* Volume Button */}
                                    <div 
                                      className="relative"
                                      onMouseEnter={(e) => {
                                        setVideoStates(prev => ({
                                          ...prev,
                                          [testimonial.videoFile]: {
                                            ...prev[testimonial.videoFile],
                                            showVolumeSlider: true
                                          }
                                        }));
                                      }}
                                      onMouseLeave={(e) => {
                                        // Only hide if we're not moving to the volume slider
                                        const relatedTarget = e.relatedTarget as Element;
                                        if (!relatedTarget || !relatedTarget.closest('.volume-slider-container')) {
                                          setTimeout(() => {
                                            setVideoStates(prev => ({
                                              ...prev,
                                              [testimonial.videoFile]: {
                                                ...prev[testimonial.videoFile],
                                                showVolumeSlider: false
                                              }
                                            }));
                                          }, 300);
                                        }
                                      }}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const video = getVideoElement(testimonial.videoFile);
                                          if (!video) return;
                                          
                                          video.muted = !video.muted;
                                          setVideoStates(prev => ({
                                            ...prev,
                                            [testimonial.videoFile]: {
                                              ...prev[testimonial.videoFile],
                                              isMuted: video.muted,
                                              showVolumeSlider: true // Keep slider open after clicking
                                            }
                                          }));
                                        }}
                                        className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                      >
                                      {(() => {
                                        const volume = videoStates[testimonial.videoFile]?.volume || 0;
                                        const isMuted = videoStates[testimonial.videoFile]?.isMuted;
                                        
                                        if (isMuted || volume === 0) {
                                          return (
                                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                            </svg>
                                          );
                                        } else if (volume < 0.5) {
                                          return (
                                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                                            </svg>
                                          );
                                        } else {
                                          return (
                                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                                            </svg>
                                          );
                                        }
                                      })()}
                                    </button>
                                    
                                      {/* Volume Slider */}
                                      {videoStates[testimonial.videoFile]?.showVolumeSlider && (
                                        <div 
                                          className="volume-slider-container absolute bottom-8 right-0 bg-black/90 rounded-lg p-3 min-w-[140px] backdrop-blur-sm"
                                          onMouseEnter={(e) => {
                                            setVideoStates(prev => ({
                                              ...prev,
                                              [testimonial.videoFile]: {
                                                ...prev[testimonial.videoFile],
                                                showVolumeSlider: true
                                              }
                                            }));
                                          }}
                                          onMouseLeave={(e) => {
                                            // Only hide if we're not moving back to the volume button
                                            const relatedTarget = e.relatedTarget as Element;
                                            if (!relatedTarget || !relatedTarget.closest('.relative')) {
                                              setTimeout(() => {
                                                setVideoStates(prev => ({
                                                  ...prev,
                                                  [testimonial.videoFile]: {
                                                    ...prev[testimonial.videoFile],
                                                    showVolumeSlider: false
                                                  }
                                                }));
                                              }, 300);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center space-x-3">
                                          <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={videoStates[testimonial.videoFile]?.volume || 0}
                                            onChange={(e) => {
                                              const video = getVideoElement(testimonial.videoFile);
                                              if (!video) return;
                                              
                                              const newVolume = parseFloat(e.target.value);
                                              video.volume = newVolume;
                                              video.muted = newVolume === 0;
                                              setVideoStates(prev => ({
                                                ...prev,
                                                [testimonial.videoFile]: {
                                                  ...prev[testimonial.videoFile],
                                                  volume: newVolume,
                                                  isMuted: newVolume === 0
                                                }
                                              }));
                                            }}
                                              className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                                            style={{
                                                background: `linear-gradient(to right, #fff 0%, #fff ${(videoStates[testimonial.videoFile]?.volume || 0) * 100}%, rgba(255,255,255,0.3) ${(videoStates[testimonial.videoFile]?.volume || 0) * 100}%, rgba(255,255,255,0.3) 100%)`
                                            }}
                                          />
                                            <span className="text-white text-xs font-mono min-w-[35px]">
                                            {Math.round((videoStates[testimonial.videoFile]?.volume || 0) * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* Navigation Controls */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Left Arrow */}
                      <button 
                        type="button"
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 pointer-events-auto"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '40px',
                          background: carouselScrollState.canScrollLeft ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: carouselScrollState.canScrollLeft ? 'pointer' : 'not-allowed',
                          opacity: carouselScrollState.canScrollLeft ? 1 : 0.3,
                          transition: 'all 0.3s ease'
                        }}
                        disabled={!carouselScrollState.canScrollLeft}
                        onClick={() => {
                          if (!carouselScrollState.canScrollLeft) return;
                          if (typeof window === 'undefined' || typeof document === 'undefined') return;
                          
                          const carousel = document.querySelector('#testimonials-carousel ul');
                          if (carousel) {
                            const currentScroll = carousel.scrollLeft;
                            const firstItem = carousel.querySelector('li');
                            const itemWidth = firstItem ? firstItem.offsetWidth + 20 : 320; // Include gap
                            const scrollAmount = itemWidth * 4; // Scroll by 4 videos
                            const newScroll = Math.max(0, currentScroll - scrollAmount);
                            carousel.scrollTo({ left: newScroll, behavior: 'smooth' });
                            // Update state after scroll
                            setTimeout(updateCarouselScrollState, 300);
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Right Arrow */}
                      <button 
                        type="button"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-auto"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '40px',
                          background: carouselScrollState.canScrollRight ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: carouselScrollState.canScrollRight ? 'pointer' : 'not-allowed',
                          opacity: carouselScrollState.canScrollRight ? 1 : 0.3,
                          transition: 'all 0.3s ease'
                        }}
                        disabled={!carouselScrollState.canScrollRight}
                        onClick={() => {
                          if (!carouselScrollState.canScrollRight) return;
                          if (typeof window === 'undefined' || typeof document === 'undefined') return;
                          
                          const carousel = document.querySelector('#testimonials-carousel ul');
                          if (carousel) {
                            const currentScroll = carousel.scrollLeft;
                            const firstItem = carousel.querySelector('li');
                            const itemWidth = firstItem ? firstItem.offsetWidth + 20 : 320; // Include gap
                            const scrollAmount = itemWidth * 4; // Scroll by 4 videos
                            const maxScroll = carousel.scrollWidth - carousel.clientWidth;
                            const newScroll = Math.min(maxScroll, currentScroll + scrollAmount);
                            carousel.scrollTo({ left: newScroll, behavior: 'smooth' });
                            // Update state after scroll
                            setTimeout(updateCarouselScrollState, 300);
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Pagination Dots */}
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pointer-events-auto"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '50px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          backdropFilter: 'blur(4px)',
                          padding: '8px 12px'
                        }}
                      >
                        {Array.from({ length: totalPages }, (_, index) => (
                          <button
                            key={index}
                            type="button"
                            className="mx-1"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'rgb(255, 255, 255)',
                              border: 'none',
                              cursor: 'pointer',
                              opacity: index === currentTestimonialPage ? 1 : 0.5
                            }}
                            onClick={() => {
                              setCurrentTestimonialPage(index);
                              if (typeof window === 'undefined' || typeof document === 'undefined') return;
                              
                              const carousel = document.querySelector('#testimonials-carousel ul');
                              if (carousel) {
                                const firstItem = carousel.querySelector('li');
                                const itemWidth = firstItem ? firstItem.offsetWidth + 20 : 320; // Include gap
                                const scrollAmount = itemWidth * 4; // Each page shows 4 videos
                                carousel.scrollTo({ left: index * scrollAmount, behavior: 'smooth' });
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 
              id="final-cta-title"
              data-animate
              className={`text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-all duration-500 delay-300 ${
                visibleElements.has('final-cta-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Quer Crescer Como os Top 1%?
            </h2>
            <p 
              id="final-cta-subtitle"
              data-animate
              className={`text-xl text-gray-700 dark:text-white/80 mb-8 max-w-3xl mx-auto transition-all duration-500 delay-400 ${
                visibleElements.has('final-cta-subtitle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Junta-te aos founders que escolheram sistemas em vez de sorte.
            </p>
            <p 
              id="final-cta-description"
              data-animate
              className={`text-lg text-gray-600 dark:text-white/70 mb-12 transition-all duration-500 delay-500 ${
                visibleElements.has('final-cta-description') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Early access limitado. Apenas para sérios.
            </p>

            <div 
              id="final-cta-button"
              data-animate
              className={`flex justify-center transition-all duration-500 delay-600 ${
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
                  src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-black.png"
                  alt="Scale Labs"
                  width={150}
                  height={45}
                  className="h-6 w-auto dark:hidden"
                />
                <Image
                  src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
                  alt="Scale Labs"
                  width={150}
                  height={45}
                  className="h-6 w-auto hidden dark:block"
                />
              </div>
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                <div className="flex space-x-6">
                  <a 
                    href="/privacy-policy" 
                    className="text-gray-600 dark:text-white/60 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors duration-200"
                  >
                    Política de Privacidade
                  </a>
                  <a 
                    href="/terms-conditions" 
                    className="text-gray-600 dark:text-white/60 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors duration-200"
                  >
                    Termos & Condições
                  </a>
                </div>
                <div className="text-gray-600 dark:text-white/60 text-sm">
                  © 2024 Scale Labs. Todos os direitos reservados.
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

    </div>
  )
}
