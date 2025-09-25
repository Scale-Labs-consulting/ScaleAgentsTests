'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser'

export default function LoadingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isFirstTime } = useFirstTimeUser()

  useEffect(() => {
    // Redirect after a short delay to show the loading animation
    const timer = setTimeout(() => {
      if (user) {
        if (isFirstTime) {
          router.push('/complete-profile')
        } else {
          router.push('/dashboard')
        }
      } else {
        // If no user, redirect back to login
        router.push('/login')
      }
    }, 2000) // 2 second loading animation

    return () => clearTimeout(timer)
  }, [user, isFirstTime, router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
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

      {/* Loading Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-white.png"
            alt="ScaleAgents"
            width={200}
            height={60}
            className="h-16 w-auto mx-auto"
          />
        </div>

        {/* Loading Animation */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">A processar o seu login...</h2>
            <p className="text-white/70 text-lg">
              A redirecionar para o dashboard
            </p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
