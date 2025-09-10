'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'


export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const authListenerRef = useRef<{ subscription: any } | null>(null)
  const isInitializingRef = useRef(false)

  // Simplified auth initialization
  const initializeAuth = useCallback(async () => {
    if (isInitializingRef.current) return
    isInitializingRef.current = true

    try {
      console.log('🔐 Initializing auth state...')
      
      // Quick session check with timeout
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )
      ])
      
      if ('error' in result && result.error) {
        console.error('❌ Session error:', result.error)
        setUser(null)
      } else if ('data' in result && result.data?.session) {
        console.log('✅ Active session found')
        setUser(result.data.session.user)
      } else {
        console.log('ℹ️ No active session')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error)
      setUser(null)
    } finally {
      setLoading(false)
      setInitialized(true)
      isInitializingRef.current = false
    }
  }, [])

  // Set up auth state listener
  useEffect(() => {
    if (authListenerRef.current?.subscription) {
      authListenerRef.current.subscription.unsubscribe()
      authListenerRef.current = null
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event)
        
        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null)
            setLoading(false)
            break
            
          case 'SIGNED_OUT':
            setUser(null)
            setLoading(false)
            break
            
          case 'TOKEN_REFRESHED':
            setUser(session?.user ?? null)
            break
            
          case 'USER_UPDATED':
            setUser(session?.user ?? null)
            break
        }
      }
    )

    authListenerRef.current = { subscription }
    initializeAuth()

    return () => {
      if (authListenerRef.current?.subscription) {
        authListenerRef.current.subscription.unsubscribe()
        authListenerRef.current = null
      }
    }
  }, [initializeAuth])

  // Simplified navigation handling
  useEffect(() => {
    if (!initialized) return

    const currentPath = window.location.pathname
    const publicPaths = ['/login', '/register', '/']
    
    if (!user && !publicPaths.includes(currentPath)) {
      router.push('/login')
    } else if (user && publicPaths.includes(currentPath) && currentPath !== '/') {
      router.push('/dashboard')
    }
  }, [user, initialized, router])

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      console.log('🚀 Starting signup for:', email, 'with name:', firstName, lastName)
      
      // Create display name from first and last name
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || ''
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: displayName,
          }
        }
      })

      if (error) throw error
      
      console.log('✅ Signup successful, user created with display name:', displayName)
      return data
    } catch (error) {
      console.error('❌ Sign up error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Sign in error:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google OAuth sign-in...')
      console.log('📍 Current origin:', window.location.origin)
      console.log('🔗 Redirect URL:', `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        }
      })

      if (error) {
        console.error('❌ Supabase OAuth error:', error)
        throw error
      }
      
      console.log('✅ Google OAuth initiated successfully')
      console.log('📊 OAuth data:', data)
      return data
    } catch (error) {
      console.error('❌ Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
      }
      
      router.push('/login')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      router.push('/login')
    }
  }

  return {
    user,
    loading,
    initialized,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }
}
