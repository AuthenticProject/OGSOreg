import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile, Institution } from '../types/database'

export interface AuthUserContext {
  id: string
  email: string
  profile: Profile
  institution: Institution | null
}

// Fallback demo institution & profile for local / offline development when Supabase is not yet connected
export const DEMO_DEV_INSTITUTION: Institution = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Pondok Modern Darussalam Gontor Kampus Pusat',
  npsn: '-',
  address: 'Ds. Gontor, Kec. Mlarak, Kab. Ponorogo, Prov. Jawa Timur, 63472',
  phone: '(0352) 311766 / WA: +62 851-7512-1926',
  email: 'sekretariat@gontor.ac.id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const DEMO_DEV_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Ustadz Lukman Hakim, S.E. (Admin Kontingen)',
  role: 'institution',
  institution_id: DEMO_DEV_INSTITUTION.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const authService = {
  async getSession() {
    if (!isSupabaseConfigured()) {
      return null
    }
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUserProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured()) {
      return DEMO_DEV_PROFILE
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      // If profile table doesn't have row yet, fallback to basic profile
      return {
        id: userId,
        full_name: 'Pengguna OGSOreg',
        role: 'institution',
        institution_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    return data as Profile
  },

  async getInstitution(institutionId: string): Promise<Institution | null> {
    if (!isSupabaseConfigured()) {
      return DEMO_DEV_INSTITUTION
    }
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', institutionId)
      .single()
    if (error) return null
    return data as Institution
  },

  async signInWithPassword(email: string, password: string):Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      // Local dev simulation
      if (email && password) {
        return { error: null }
      }
      return { error: new Error('Harap masukkan email dan kata sandi.') }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
  },
}
