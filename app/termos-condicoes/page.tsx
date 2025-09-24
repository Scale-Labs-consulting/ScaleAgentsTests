'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function TermosCondicoesPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
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
                <Link href="/">
                  <Image
                    src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-black.png"
                    alt="Scale Labs"
                    width={200}
                    height={60}
                    className="h-8 w-auto dark:hidden cursor-pointer"
                  />
                </Link>
                <Link href="/">
                  <Image
                    src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
                    alt="Scale Labs"
                    width={200}
                    height={60}
                    className="h-8 w-auto hidden dark:block cursor-pointer"
                  />
                </Link>
              </div>
              
              {/* Centered Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="/#agents" className={`transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white' 
                    : 'text-white/80 hover:text-white'
                }`}>
                  Agentes IA
                </a>
                <a href="/#pricing" className={`transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white' 
                    : 'text-white/80 hover:text-white'
                }`}>
                  Preços
                </a>
                <a href="/#contact" className={`transition-colors duration-300 ${
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

        {/* Page Title Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Termos & Condições
            </h1>
          </div>
        </section>

        {/* Terms & Conditions Content */}
        <div className="flex-1 px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-white/90 leading-relaxed space-y-4">
              <p>Lê atentamente estes Termos e Condições ("Termos") antes de utilizar o website da Scale Labs (o "Serviço") operado pela Scale Labs ("nós" ou "nosso").</p>
              
              <p>Ao aceder ou utilizar o Serviço, o utilizador concorda em ficar vinculado a estes Termos. Se o utilizador não concordar com qualquer parte dos termos, não poderá aceder ao Serviço.</p>
              
              <p>1. Generalidades</p>
              
              <p>a. A Scale Labs é uma empresa de consultoria de alcance e crescimento B2B que fornece serviços e recursos a empresas que procuram expandir o seu alcance e alcançar o crescimento.</p>
              
              <p>b. Estes Termos aplicam-se a todos os utilizadores do Serviço, incluindo, mas não se limitando a visitantes, clientes e quaisquer outros utilizadores que acedam ou utilizem o Serviço.</p>
              
              <p>c. Ao aceder ou utilizar o Serviço, o utilizador declara e garante que tem pelo menos 18 anos de idade e que tem capacidade legal para celebrar estes Termos.</p>
              
              <p>2. Propriedade intelectual</p>
              
              <p>a. O Serviço e o seu conteúdo original, características e funcionalidades são e continuarão a ser propriedade exclusiva da Scale Labs e dos seus licenciantes. O Serviço é protegido por direitos autorais, marcas registradas e outras leis. As nossas marcas registadas e imagem comercial não podem ser usadas em conexão com qualquer produto ou serviço sem o consentimento prévio por escrito da Scale Labs.</p>
              
              <p>b. O utilizador não pode modificar, reproduzir, distribuir, criar trabalhos derivados, exibir ou executar publicamente, ou de qualquer forma explorar qualquer conteúdo, software, materiais ou serviços disponíveis no ou através do Serviço, exceto se expressamente permitido pelo Scale Labs.</p>
              
              <p>3. Contas de Utilizador</p>
              
              <p>a. Para aceder a certas características do Serviço, o utilizador deve ter uma conta de utilizador. O utilizador é responsável por manter a confidencialidade da sua conta e palavra-passe e por restringir o acesso ao seu computador ou dispositivo móvel. O utilizador concorda em aceitar a responsabilidade por todas as actividades que ocorram na sua conta ou palavra-passe.</p>
              
              <p>b. O utilizador concorda em fornecer informações precisas, atuais e completas durante o processo de registro e em atualizar tais informações para mantê-las precisas, atuais e completas. O Scale Labs reserva-se o direito de suspender ou encerrar sua conta se qualquer informação fornecida for imprecisa, falsa ou enganosa.</p>
              
              <p>c. O utilizador é o único responsável por todas as actividades que ocorram na sua conta, e concorda em notificar imediatamente a Scale Labs de qualquer utilização não autorizada da sua conta ou qualquer outra violação de segurança.</p>
              
              <p>4. Serviços</p>
              
              <p>a. O Scale Labs oferece vários serviços, incluindo, mas não se limitando a campanhas de divulgação, consultoria de crescimento, pesquisa de mercado e desenvolvimento de conteúdo. Os detalhes e termos específicos desses serviços serão descritos em acordos ou contratos separados entre a Scale Labs e o cliente.</p>
              
              <p>b. A Scale Labs se reserva o direito de modificar, suspender ou descontinuar qualquer aspeto do Serviço a qualquer momento sem aviso prévio.</p>
              
              <p>5. Taxas e Pagamentos</p>
              
              <p>a. Alguns serviços prestados pelo Scale Labs podem exigir o pagamento de taxas. As taxas aplicáveis e os termos de pagamento serão acordados entre a Scale Labs e o cliente em um acordo ou contrato separado.</p>
              
              <p>b. Salvo indicação em contrário, todas as taxas são cotadas e pagas na moeda especificada pelo Scale Labs. O cliente é responsável por todos os impostos e taxas aplicáveis associados aos serviços prestados.</p>
              
              <p>6. Limitação de responsabilidade</p>
              
              <p>a. O Serviço é fornecido "no estado em que se encontra" e "conforme disponível". O Scale Labs não garante que o Serviço será ininterrupto, livre de erros ou seguro.</p>
              
              <p>b. Em nenhum caso o Scale Labs, seus diretores, executivos, funcionários ou agentes serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes de ou em conexão com o uso do Serviço ou a incapacidade de usar o Serviço, mesmo se avisados da possibilidade de tais danos.</p>
              
              <p>7. Indemnização</p>
              
              <p>O utilizador concorda em defender, indemnizar e isentar de responsabilidade a Scale Labs e as suas afiliadas, responsáveis, diretores, funcionários e agentes de e contra todas e quaisquer reclamações, danos, obrigações</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
