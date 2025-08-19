import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, TrendingUp, Users, Zap, MessageSquare, BarChart3, UserCheck } from 'lucide-react'

export default function HomePage() {
  const agents = [
    {
      id: 'scale-expert',
      name: 'Scale Expert',
      description: 'AI-powered scaling strategies and business growth optimization',
      icon: TrendingUp,
      features: ['Growth Analysis', 'Market Expansion', 'Resource Planning', 'Performance Metrics'],
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'sales-analyst',
      name: 'Sales Analyst',
      description: 'Advanced sales analytics and revenue optimization insights',
      icon: BarChart3,
      features: ['Sales Forecasting', 'Pipeline Analysis', 'Revenue Optimization', 'Market Intelligence'],
      color: 'from-violet-500 to-purple-600'
    },
    {
      id: 'hr-talent',
      name: 'HR Talent',
      description: 'Intelligent talent acquisition and human resources management',
      icon: UserCheck,
      features: ['Talent Sourcing', 'Performance Analysis', 'Team Optimization', 'Culture Insights'],
      color: 'from-purple-600 to-indigo-600'
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
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#agents" className="text-white/80 hover:text-white transition-colors">
                  AI Agents
                </a>
                <a href="#features" className="text-white/80 hover:text-white transition-colors">
                  Features
                </a>
                <a href="#contact" className="text-white/80 hover:text-white transition-colors">
                  Contact
                </a>
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-4xl mx-auto">
              <Badge variant="outline" className="mb-6 border-purple-500 text-purple-400">
                <Bot className="w-4 h-4 mr-2" />
                AI-Powered Business Intelligence
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-violet-400 bg-clip-text text-transparent">
                Scale Your Business with AI Agents
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
                Harness the power of three specialized AI agents to optimize your scaling strategies, 
                analyze sales performance, and manage talent acquisition with unprecedented precision.
              </p>
              <div className="flex justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AI Agents Section */}
        <section id="agents" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Meet Your AI Agents
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Three specialized AI agents designed to transform different aspects of your business operations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {agents.map((agent, index) => {
                const IconComponent = agent.icon
                return (
                  <Card key={agent.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl text-white mb-2">{agent.name}</CardTitle>
                      <CardDescription className="text-white/70 text-base">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {agent.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${agent.color}`} />
                            <span className="text-white/80">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full mt-6 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20"
                        variant="outline"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with {agent.name}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose ScaleLabs?
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Advanced AI technology meets business intelligence to deliver unprecedented insights and automation
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Get instant insights and recommendations powered by advanced AI algorithms'
                },
                {
                  icon: Bot,
                  title: 'AI-Powered',
                  description: 'Cutting-edge machine learning models trained on industry best practices'
                },
                {
                  icon: TrendingUp,
                  title: 'Scalable Growth',
                  description: 'Solutions that grow with your business from startup to enterprise'
                },
                {
                  icon: BarChart3,
                  title: 'Data-Driven',
                  description: 'Make informed decisions based on comprehensive analytics and insights'
                },
                {
                  icon: Users,
                  title: 'Team Collaboration',
                  description: 'Seamless integration with your existing workflows and team processes'
                },
                {
                  icon: MessageSquare,
                  title: '24/7 Support',
                  description: 'Round-the-clock AI assistance whenever you need guidance or insights'
                }
              ].map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div key={index} className="text-center group">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-violet-500/30 transition-all duration-300">
                      <IconComponent className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/70">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Scale with AI?
              </h2>
              <p className="text-xl text-white/80 mb-8">
                Join thousands of businesses already using ScaleLabs AI agents to optimize their operations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Image
                  src="/images/logo-white.png"
                  alt="ScaleLabs"
                  width={150}
                  height={45}
                  className="h-6 w-auto"
                />
              </div>
              <div className="text-white/60 text-sm">
                © 2024 ScaleLabs. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
