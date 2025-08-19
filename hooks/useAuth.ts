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

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (isInitializingRef.current) return
    isInitializingRef.current = true

    try {
      console.log('🔐 Initializing auth state...')
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth initialization timeout')), 30000) // 30 second timeout
      })
      
      const authPromise = (async () => {
        console.log('🔄 Starting auth initialization...')
        
        // Get current session
        console.log('🔄 Getting current session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('🔄 Session result:', { hasSession: !!session, hasError: !!sessionError })
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          // Try to refresh the session
          console.log('🔄 Attempting session refresh...')
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          console.log('🔄 Refresh result:', { hasSession: !!refreshedSession, hasError: !!refreshError })
          
          if (refreshError) {
            console.error('❌ Refresh error:', refreshError)
          } else if (refreshedSession) {
            console.log('✅ Session refreshed')
            setUser(refreshedSession.user)
            // Fetch profile after setting user
            console.log('🔄 Fetching profile for refreshed session...')
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', refreshedSession.user.id)
                .single()

              if (error) {
                console.error('❌ Profile fetch error:', error)
                if (error.code === 'PGRST116') {
                  console.log('📝 Creating missing profile...')
                  await createProfile(refreshedSession.user.id)
                }
              } else {
                console.log('✅ Profile loaded')
                setProfile(profile)
              }
            } catch (error) {
              console.error('❌ Profile error:', error)
            }
          }
        } else if (session) {
          console.log('✅ Active session found:', session.user.email)
          setUser(session.user)
          // Fetch profile after setting user
          console.log('🔄 Fetching profile for existing session...')
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('❌ Profile fetch error:', error)
              if (error.code === 'PGRST116') {
                console.log('📝 Creating missing profile...')
                await createProfile(session.user.id)
              }
            } else {
              console.log('✅ Profile loaded')
              setProfile(profile)
            }
          } catch (error) {
            console.error('❌ Profile error:', error)
          }
        } else {
          console.log('ℹ️ No active session')
        }
        
        console.log('✅ Auth initialization completed successfully')
      })()
      
      try {
        await Promise.race([authPromise, timeoutPromise])
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.message === 'Auth initialization timeout') {
          console.warn('⚠️ Auth initialization timed out, continuing with current state...')
          // Don't throw the error, just continue
        } else {
          throw timeoutError
        }
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error)
      // Force initialization to complete even on error
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
      setInitialized(true)
      isInitializingRef.current = false
    }
  }, [])

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('👤 Fetching profile for:', userId)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Profile fetch error:', error)
        if (error.code === 'PGRST116') {
          console.log('📝 Creating missing profile...')
          await createProfile(userId)
        }
      } else {
        console.log('✅ Profile loaded')
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
        console.log('✅ Profile created')
        setProfile(profile)
      }
    } catch (error) {
      console.error('❌ Profile creation error:', error)
    }
  }, [user])

  // Set up auth state listener
  useEffect(() => {
    // Clean up previous listener
    if (authListenerRef.current?.subscription) {
      authListenerRef.current.subscription.unsubscribe()
      authListenerRef.current = null
    }

    console.log('🔄 Setting up auth listener...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in')
            setUser(session?.user ?? null)
            if (session?.user) {
              // Fetch profile inline to avoid circular dependency
              try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single()

                if (error) {
                  console.error('❌ Profile fetch error:', error)
                  if (error.code === 'PGRST116') {
                    console.log('📝 Creating missing profile...')
                    await createProfile(session.user.id)
                  }
                } else {
                  console.log('✅ Profile loaded')
                  setProfile(profile)
                }
              } catch (error) {
                console.error('❌ Profile error:', error)
              }
            }
            setLoading(false)
            break
            
          case 'SIGNED_OUT':
            console.log('🚪 User signed out')
            setUser(null)
            setProfile(null)
            setLoading(false)
            break
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed')
            setUser(session?.user ?? null)
            if (session?.user) {
              // Fetch profile inline to avoid circular dependency
              try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single()

                if (error) {
                  console.error('❌ Profile fetch error:', error)
                  if (error.code === 'PGRST116') {
                    console.log('📝 Creating missing profile...')
                    await createProfile(session.user.id)
                  }
                } else {
                  console.log('✅ Profile loaded')
                  setProfile(profile)
                }
              } catch (error) {
                console.error('❌ Profile error:', error)
              }
            }
            break
            
          case 'USER_UPDATED':
            console.log('👤 User updated')
            setUser(session?.user ?? null)
            break
        }
      }
    )

    // Store the subscription for cleanup
    authListenerRef.current = { subscription }

    // Initialize auth state
    initializeAuth()

    return () => {
      if (authListenerRef.current?.subscription) {
        authListenerRef.current.subscription.unsubscribe()
        authListenerRef.current = null
      }
    }
  }, [initializeAuth])

  // Handle navigation when auth state changes
  useEffect(() => {
    if (!initialized) return

    const currentPath = window.location.pathname
    const publicPaths = ['/login', '/register', '/']
    
    if (!user && !publicPaths.includes(currentPath)) {
      console.log('🚪 Redirecting to login - no user')
      router.push('/login')
    } else if (user && publicPaths.includes(currentPath) && currentPath !== '/') {
      console.log('🏠 Redirecting to dashboard - user logged in')
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
      console.log('🔐 Attempting sign in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }
      
      console.log('✅ Sign in successful')
      return data
    } catch (error) {
      console.error('❌ Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...')
      console.log('🔍 Current user before signOut:', user?.email)
      
      // Clear state immediately
      setUser(null)
      setProfile(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      console.log('🔍 Supabase signOut result:', { error: error?.message || 'No error' })
      
      if (error) {
        console.error('❌ Supabase signOut error:', error)
        // Continue with logout even if Supabase fails
      }
      
      // Clear localStorage manually to ensure logout
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('scaleagents-auth')
          console.log('✅ localStorage cleared')
        } catch (e) {
          console.log('⚠️ Could not clear localStorage:', e)
        }
      }
      
      console.log('✅ Logout completed, redirecting to login...')
      router.push('/login')
      console.log('✅ Redirect initiated')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Force redirect even if there's an error
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

  // Reset auth state (useful for debugging)
  const resetAuth = useCallback(() => {
    console.log('🔄 Resetting auth state...')
    setUser(null)
    setProfile(null)
    setLoading(false)
    setInitialized(true)
    isInitializingRef.current = false
  }, [])

  return {
    user,
    profile,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetAuth,
  }
}
