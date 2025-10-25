// Simple Supabase client setup for authentication
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton Supabase client instance to maintain consistent session across components
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// Client-side Supabase client
export const createClient = () => {
  // Only create client on client-side to avoid SSR issues
  if (typeof window === 'undefined') {
    // Return a dummy client on server-side (won't be used for auth)
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  }

  // Create singleton client on client-side
  if (!supabaseInstance) {
    console.log('🔧 Creating new Supabase client instance');
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'ecoroute-auth-token',
        flowType: 'pkce',
      }
    })
  }
  return supabaseInstance
}

// Auth helper functions
export const getUser = async () => {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

export const signOut = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
  
  return { success: true }
}

export const signIn = async (email: string, password: string) => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message || 'Sign in failed')
  }
  
  return data
}

export const signUp = async (email: string, password: string, metadata?: any) => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  
  if (error) {
    throw new Error(error.message || 'Sign up failed')
  }
  
  return data
}

export const signInWithGoogle = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  
  if (error) {
    throw new Error(error.message || 'Google sign in failed')
  }
  
  return data
}

export const signInWithGithub = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  
  if (error) {
    throw new Error(error.message || 'GitHub sign in failed')
  }
  
  return data
}

export const resetPassword = async (email: string) => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/dashboard/auth/reset-password`,
  })
  
  if (error) {
    throw new Error(error.message || 'Password reset failed')
  }
  
  return data
}

// Auth types
export type AuthError = {
  message: string
  status?: number
}

export type SignInData = {
  email: string
  password: string
}

export type SignUpData = {
  email: string
  password: string
  firstName?: string
  lastName?: string
}