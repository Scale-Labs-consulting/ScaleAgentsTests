import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug: Check if environment variables are loaded
console.log('🔍 Supabase Config Check:')
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING')
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!')
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
  throw new Error('Missing Supabase environment variables')
}

// Suppress GoTrue client debug messages globally (works in both client and server)
const suppressGoTrueMessages = () => {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  
  console.log = function(...args) {
    const firstArg = args[0]
    if (typeof firstArg === 'string' && (firstArg.includes('GoTrueClient') || firstArg.includes('GoTrue'))) {
      return // Skip GoTrue messages
    }
    originalLog.apply(console, args)
  }
  
  console.warn = function(...args) {
    const firstArg = args[0]
    if (typeof firstArg === 'string' && (firstArg.includes('GoTrueClient') || firstArg.includes('GoTrue'))) {
      return // Skip GoTrue messages
    }
    originalWarn.apply(console, args)
  }
  
  console.error = function(...args) {
    const firstArg = args[0]
    if (typeof firstArg === 'string' && (firstArg.includes('GoTrueClient') || firstArg.includes('GoTrue'))) {
      return // Skip GoTrue messages
    }
    originalError.apply(console, args)
  }
}

// Apply suppression immediately
suppressGoTrueMessages()

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session across browser sessions
    persistSession: true,
    // Auto refresh token before it expires
    autoRefreshToken: true,
    // Detect session in URL (for OAuth flows)
    detectSessionInUrl: true,
    // Storage key for session
    storageKey: 'scaleagents-auth',
    // Storage type (localStorage is more persistent than sessionStorage)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Flow type for better session management
    flowType: 'pkce',
    // Debug mode for development
    debug: false,
  },
  // Increase timeout for better reliability
  global: {
    headers: {
      'X-Client-Info': 'scaleagents-web'
    }
  },
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Test the connection immediately
console.log('🧪 Testing Supabase connection...')
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error)
  } else {
    console.log('✅ Supabase connection test successful')
  }
}).catch(error => {
  console.error('❌ Supabase connection test error:', error)
})

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId as any)
    .single()
  
  if (error) throw error
  return profile
}

// Helper function to create or update user profile
export const upsertUserProfile = async (userId: string, profileData: Partial<Database['public']['Tables']['profiles']['Insert']>) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId as any,
      ...profileData
    } as any)
    .select()
    .single()
  
  if (error) throw error
  return profile
}

// Helper function to check if session is valid
export const isSessionValid = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Handle invalid refresh token error specifically
    if (error && error.message?.includes('Invalid Refresh Token')) {
      console.log('🔄 Invalid refresh token detected, clearing storage...')
      await forceLogout()
      return false
    }
    
    if (error) {
      console.error('Session validation error:', error)
      return false
    }
    
    return !!session
  } catch (error) {
    console.error('Session validation error:', error)
    return false
  }
}

// Helper function to refresh session
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Session refresh error:', error)
    return null
  }
}

// Helper function to clear invalid auth tokens specifically
export const clearInvalidTokens = () => {
  if (typeof window === 'undefined') return
  
  try {
    console.log('🧹 Clearing invalid auth tokens...')
    
    // Clear the main auth storage key
    localStorage.removeItem('scaleagents-auth')
    
    // Clear any Supabase-generated keys (they follow a pattern)
    const supabaseKey = `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`
    localStorage.removeItem(supabaseKey)
    
    // Clear any other auth-related keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('✅ Invalid tokens cleared')
  } catch (error) {
    console.error('❌ Error clearing invalid tokens:', error)
  }
}

// Helper function to force logout and clear all data
export const forceLogout = async () => {
  try {
    console.log('🔄 Force logout initiated...')
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear all localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      console.log('✅ All localStorage cleared')
    }
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      console.log('✅ All sessionStorage cleared')
    }
    
    console.log('✅ Force logout completed')
    return true
  } catch (error) {
    console.error('❌ Force logout error:', error)
    return false
  }
}
