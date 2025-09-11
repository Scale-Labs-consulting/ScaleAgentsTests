import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

export function useFirstTimeUser() {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) {
        setIsFirstTime(null)
        setIsLoading(false)
        return
      }

      try {
        console.log('🔍 Checking if user is first-time...')
        
        // Check if user has completed their profile - optimized query with timeout
        const queryPromise = supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000) // Reduced to 3 seconds
        )
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

        if (error && error.code === 'PGRST116') {
          // No profile found, this is a first-time user
          console.log('🆕 No profile found, user is first-time')
          setIsFirstTime(true)
        } else if (error) {
          console.error('❌ Error checking profile:', error)
          // If there's an error, assume user is not first-time to avoid blocking them
          setIsFirstTime(false)
        } else {
          // Check if onboarding is completed using the dedicated field
          const isOnboardingCompleted = data?.onboarding_completed === true
          
          console.log('📋 Onboarding completion check:', { 
            onboarding_completed: data?.onboarding_completed,
            onboarding_completed_type: typeof data?.onboarding_completed,
            isOnboardingCompleted,
            willBeFirstTime: !isOnboardingCompleted
          })
          
          // User is first-time if onboarding is not completed
          setIsFirstTime(!isOnboardingCompleted)
        }
      } catch (error) {
        console.error('Error checking first-time user:', error)
        setIsFirstTime(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkFirstTimeUser()
  }, [user])

  return { isFirstTime, isLoading }
}
