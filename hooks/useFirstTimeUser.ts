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
        
        // Quick check: if user was just created (within last 5 minutes), likely first-time
        const userCreatedAt = new Date(user.created_at)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const isRecentlyCreated = userCreatedAt > fiveMinutesAgo
        
        if (isRecentlyCreated) {
          console.log('🆕 User created recently, likely first-time')
          setIsFirstTime(true)
          setIsLoading(false)
          return
        }
        
        // Check if user has completed their profile - optimized query with timeout
        const queryPromise = supabase
          .from('profiles')
          .select('first_name, last_name, company_name, business_product_service, ideal_customer, problem_solved, business_model')
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
          // Check if profile is complete (core business fields)
          // Also check if user has "skipped" onboarding (has default values)
          const isSkipped = data?.first_name === 'User' && 
                           data?.last_name === 'Skipped' && 
                           data?.business_product_service === 'Skipped onboarding'
          
          const isComplete = data?.first_name && 
                            data?.last_name && 
                            data?.company_name && 
                            data?.business_product_service && 
                            data?.ideal_customer && 
                            data?.problem_solved && 
                            data?.business_model &&
                            !isSkipped // Don't consider skipped profiles as complete
          
          console.log('📋 Profile completeness check:', { 
            hasFirstName: !!data?.first_name,
            hasLastName: !!data?.last_name,
            hasCompanyName: !!data?.company_name,
            hasBusinessProductService: !!data?.business_product_service,
            hasIdealCustomer: !!data?.ideal_customer,
            hasProblemSolved: !!data?.problem_solved,
            hasBusinessModel: !!data?.business_model,
            isSkipped,
            isComplete 
          })
          
          // If user has skipped, they are not first-time (won't see onboarding again)
          // If profile is incomplete and not skipped, they are first-time
          setIsFirstTime(!isComplete && !isSkipped)
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
