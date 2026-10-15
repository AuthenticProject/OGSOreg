import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { Competition } from '../../types/database'

export const mockCompetitions: Competition[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    code: 'OLYM-2026-NAS',
    name: 'Olimpiade Sains Nasional Mandiri 2026',
    description: 'Kompetisi sains terpadu jenjang SMP/MTs dan SMA/MA/Pesantren tingkat nasional.',
    registration_open_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    registration_close_at: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    code: 'MATH-SMP-2026',
    name: 'Kejuaraan Matematika Terapan Nusantara',
    description: 'Ajang olimpiade matematika komputasi dan pemecahan masalah logika.',
    registration_open_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    registration_close_at: new Date(Date.now() + 45 * 86400000).toISOString(),
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const competitionRepository = {
  async getOpenCompetitions(): Promise<Competition[]> {
    if (!isSupabaseConfigured()) {
      return mockCompetitions
    }
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .in('status', ['open', 'draft'])
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as Competition[]) || []
  },

  async getActiveCompetitions(): Promise<Competition[]> {
    return this.getOpenCompetitions()
  },

  async getCompetitionById(id: string): Promise<Competition | null> {
    if (!isSupabaseConfigured()) {
      return mockCompetitions.find((c) => c.id === id) || null
    }
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as Competition
  },
}
