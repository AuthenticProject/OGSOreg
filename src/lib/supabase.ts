import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const DEFAULT_SUPABASE_URL = 'https://cuunipngguedqttuutaa.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

// Vite statically replaces import.meta.env.VITE_* during build
const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : ''
const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : ''

export const supabaseUrl =
  envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0 && !envUrl.includes('your-project')
    ? envUrl.trim()
    : DEFAULT_SUPABASE_URL

export const supabaseAnonKey =
  envKey && typeof envKey === 'string' && envKey.trim().length > 0 && !envKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
    ? envKey.trim()
    : DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  )
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
