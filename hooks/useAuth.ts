'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
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
      const { data: { session }, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )
      ])
      
      if (error) {
        console.error('❌ Session error:', error)
        setUser(null)
        setProfile(null)
      } else if (session) {
        console.log('✅ Active session found')
        setUser(session.user)
        
        // Fetch profile in background (don't block initialization)
        fetchProfile(session.user.id).catch(console.error)
      } else {
        console.log('ℹ️ No active session')
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
      setInitialized(true)
      isInitializingRef.current = false
    }
  }, [])

  // Fetch user profile (non-blocking)
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Profile fetch error:', error)
        if (error.code === 'PGRST116') {
          await createProfile(userId)
        }
      } else {
        setProfile(profile)
      }
    } catch (error) {
      console.error('❌ Profile error:', error)
    }
  }, [])

  // Create user profile
  const createProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user?.email || '',
          first_name: user?.user_metadata?.first_name || '',
          last_name: user?.user_metadata?.last_name || ''
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Profile creation error:', error)
      } else {
        setProfile(profile)
      }
    } catch (error) {
      console.error('❌ Profile creation error:', error)
    }
  }, [user])

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
            if (session?.user) {
              fetchProfile(session.user.id).catch(console.error)
            }
            setLoading(false)
            break
            
          case 'SIGNED_OUT':
            setUser(null)
            setProfile(null)
            setLoading(false)
            break
            
          case 'TOKEN_REFRESHED':
            setUser(session?.user ?? null)
            if (session?.user) {
              fetchProfile(session.user.id).catch(console.error)
            }
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
  }, [initializeAuth, fetchProfile])

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (error) throw error
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

  const signOut = async () => {
    try {
      setUser(null)
      setProfile(null)
      
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      return data
    } catch (error) {
      console.error('❌ Profile update error:', error)
      throw error
    }
  }

  return {
    user,
    profile,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}
