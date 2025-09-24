'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function PoliticaPrivacidadePage() {
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
              Política de Privacidade
            </h1>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <div className="flex-1 px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-white/90 leading-relaxed space-y-6">
                  <p>
                    A Scale Labs ("nós", "nós" ou "nosso") opera o website da Scale Labs (o "Serviço"). 
                    Esta Política de Privacidade explica como recolhemos, usamos e divulgamos as informações 
                    recolhidas dos utilizadores do Serviço.
                  </p>
                  
                  <p>
                    Ao aceder ou utilizar o Serviço, o utilizador concorda com os termos desta Política de 
                    Privacidade. Se não concordar com os termos desta Política de Privacidade, não aceda nem 
                    utilize o Serviço.
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Recolha e utilização de informações</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">a. Informações pessoais:</h3>
                      <p>
                        Quando utiliza determinadas funcionalidades do Serviço, como a nossa agenda, podemos 
                        recolher informações pessoais, incluindo, entre outras, o teu nome, endereço de correio 
                        eletrónico e número de telefone. Utilizamos estas informações para prestar os serviços 
                        solicitados, comunicar com o utilizador e disponibilizar informações relevantes sobre 
                        produtos, serviços, novidades e campanhas que possam ser do seu interesse.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">b. Ferramentas de rastreio:</h3>
                      <p>
                        Podemos utilizar ferramentas de rastreio, como o Facebook Pixel e serviços de análise, 
                        para recolher informações sobre a sua utilização do Serviço. Estas informações podem 
                        incluir o teu endereço IP, tipo de browser, sistema operativo, URLs de referência, 
                        páginas visitadas e outros detalhes de utilização. Utilizamos estas informações para 
                        analisar tendências, administrar o Serviço, seguir os movimentos dos utilizadores e 
                        recolher informações demográficas.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Partilha e divulgação de dados</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">a. Fornecedores de serviços terceiros:</h3>
                      <p>
                        Podemos contratar prestadores de serviços terceiros para executar várias funções 
                        relacionadas com o Serviço. Estes prestadores de serviços podem ter acesso às tuas 
                        informações pessoais com o objetivo de desempenharem as suas funções em nosso nome. 
                        No entanto, estão obrigados a não divulgar ou utilizar as informações para qualquer 
                        outro fim.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">b. Requisitos legais:</h3>
                      <p>
                        Podemos divulgar as suas informações pessoais se formos obrigados a fazê-lo por lei 
                        ou em resposta a pedidos válidos de autoridades públicas (por exemplo, um tribunal 
                        ou agência governamental), ou quando acreditamos que a divulgação é necessária para 
                        proteger os nossos direitos, proteger a sua segurança ou a segurança de terceiros, 
                        investigar fraudes ou responder a um pedido governamental.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">c. Transferências de negócios:</h3>
                      <p>
                        No caso de uma fusão, aquisição, reorganização, falência ou outro evento semelhante, 
                        as suas informações podem ser transferidas como parte dos activos.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Cookies e tecnologias semelhantes</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">a.</h3>
                      <p>
                        Utilizamos cookies, web beacons e tecnologias semelhantes para melhorar a sua 
                        experiência no Serviço, melhorar os nossos serviços e analisar o comportamento do 
                        utilizador. Estas tecnologias podem recolher informações como o teu endereço IP, 
                        tipo de browser, sistema operativo e outros detalhes de utilização.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">b.</h3>
                      <p>
                        O utilizador pode configurar o teu browser para recusar todos ou alguns cookies do 
                        browser ou para o alertar quando os cookies estão a ser enviados. No entanto, se 
                        desativar ou recusar cookies, algumas partes do Serviço poderão ficar inacessíveis 
                        ou não funcionar corretamente.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Segurança dos dados</h2>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">a.</h3>
                    <p>
                      Implementamos medidas de segurança razoáveis para proteger as informações pessoais que 
                      recolhemos. No entanto, tenha em atenção que nenhum método de transmissão através da 
                      Internet ou método de armazenamento eletrónico é 100% seguro. Por conseguinte, embora 
                      nos esforcemos por utilizar meios comercialmente aceitáveis para proteger as suas 
                      informações pessoais, não podemos garantir a sua segurança absoluta.
                    </p>
                  </div>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Privacidade das crianças</h2>
                  
                  <p>
                    O Serviço não se destina a ser utilizado por indivíduos com idade inferior a 18 anos. 
                    Não recolhemos intencionalmente informações pessoais de menores de 18 anos. Se for pai 
                    ou tutor e considerar que o seu filho nos forneceu informações pessoais sem o seu 
                    consentimento, contacte-nos para que possamos eliminar as informações.
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Alterações a esta Política de Privacidade</h2>
                  
                  <p>
                    Poderemos atualizar esta Política de Privacidade periodicamente. Notificá-lo-emos de 
                    quaisquer alterações, publicando a nova Política de Privacidade nesta página e actualizando 
                    a data da "Última atualização" no topo. É da responsabilidade do utilizador rever 
                    periodicamente esta Política de Privacidade para verificar se existem alterações.
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Contactar-nos</h2>
                  
                  <p>
                    Se tiver alguma questão ou dúvida sobre esta Política de Privacidade, contacte-nos através 
                    do endereço <a href="mailto:hello@scale-labs.com" className="text-blue-400 hover:text-blue-300 underline">hello@scale-labs.com</a>.
                  </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
