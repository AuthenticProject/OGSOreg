import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { DEMO_DEV_INSTITUTION } from '../authService'
import type { Institution } from '../../types/database'

export const institutionRepository = {
  async getInstitutionById(id: string): Promise<Institution | null> {
    if (!isSupabaseConfigured()) {
      return DEMO_DEV_INSTITUTION
    }
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as Institution
  },

  async getAllInstitutions(): Promise<Institution[]> {
    if (!isSupabaseConfigured()) {
      return [DEMO_DEV_INSTITUTION]
    }
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return (data as Institution[]) || []
  },

  async getInstitutions(): Promise<Institution[]> {
    return this.getAllInstitutions()
  },
}
