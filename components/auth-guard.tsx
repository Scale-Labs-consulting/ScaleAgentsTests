'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!initialized) return

    if (!user && !loading) {
      setIsRedirecting(true)
      router.push('/login')
    }
  }, [user, loading, initialized, router])

  // Show loading spinner while checking auth
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading spinner while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white/70">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show children if user is authenticated
  if (user) {
    return <>{children}</>
  }

  // Fallback: show loading
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
        <p className="text-white/70">Checking authentication...</p>
      </div>
    </div>
  )
}
