'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Simple session check on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('🌐 Session provider: User session found')
        } else {
          console.log('🌐 Session provider: No active session')
        }
      } catch (error) {
        console.error('❌ Session provider error:', error)
      }
    }

    checkSession()
  }, [])

  return <>{children}</>
}
