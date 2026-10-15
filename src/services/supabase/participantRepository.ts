import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { ParticipantEntity } from '../../types/database'
import { mockParticipants } from '../../lib/mockData'

export interface ParticipantQueryOptions {
  institutionId?: string
  competitionId?: string
  search?: string
  category?: string
  page?: number
  pageSize?: number
}

export interface ParticipantQueryResult {
  data: ParticipantEntity[]
  total: number
  page: number
  pageSize: number
}

export interface UpsertParticipantInput {
  full_name: string
  nisn: string
  gender: 'L' | 'P' | null
  class_name?: string | null
  category?: string | null
  teacher_id?: string | null
}

export const participantRepository = {
  async getParticipants(
    optionsOrInstId: ParticipantQueryOptions | string = {},
    maybeOptions: ParticipantQueryOptions = {}
  ): Promise<ParticipantQueryResult> {
    const options: ParticipantQueryOptions =
      typeof optionsOrInstId === 'string'
        ? { ...maybeOptions, institutionId: optionsOrInstId }
        : optionsOrInstId

    const {
      institutionId,
      search,
      category,
      page = 1,
      pageSize = 25,
    } = options

    if (!isSupabaseConfigured()) {
      // Return filtered mock data in development mode
      let filtered = mockParticipants.map((p) => ({
        id: p.id,
        institution_id: institutionId || 'a0000000-0000-0000-0000-000000000001',
        full_name: p.fullName,
        nisn: p.nisn,
        gender: p.gender,
        class_name: p.gradeLevel,
        category: p.competitionCategory,
        teacher_id: null,
        created_at: p.createdAt,
        updated_at: p.createdAt,
      }))

      if (search) {
        const term = search.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.full_name.toLowerCase().includes(term) ||
            p.nisn.includes(term) ||
            (p.category && p.category.toLowerCase().includes(term))
        )
      }
      if (category && category !== 'all') {
        filtered = filtered.filter((p) => p.category === category)
      }

      const total = filtered.length
      const start = (page - 1) * pageSize
      const paginated = filtered.slice(start, start + pageSize)

      return {
        data: paginated,
        total,
        page,
        pageSize,
      }
    }

    let query = supabase.from('participants').select('*', { count: 'exact' })

    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,nisn.ilike.%${search}%,class_name.ilike.%${search}%`)
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    query = query.order('created_at', { ascending: false }).range(start, end)

    const { data, count, error } = await query
    if (error) throw error

    return {
      data: (data as ParticipantEntity[]) || [],
      total: count || 0,
      page,
      pageSize,
    }
  },

  async upsertParticipantsChunk(
    institutionId: string,
    participants: UpsertParticipantInput[]
  ): Promise<ParticipantEntity[]> {
    if (!isSupabaseConfigured()) {
      // Local dev simulation
      return participants.map((p, idx) => ({
        id: `local-pt-${Date.now()}-${idx}`,
        institution_id: institutionId,
        full_name: p.full_name,
        nisn: p.nisn,
        gender: p.gender,
        class_name: p.class_name || null,
        category: p.category || null,
        teacher_id: p.teacher_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    }

    const rows = participants.map((p) => ({
      institution_id: institutionId,
      full_name: p.full_name,
      nisn: p.nisn, // Preserves leading zeros as string
      gender: p.gender,
      class_name: p.class_name || null,
      category: p.category || null,
      teacher_id: p.teacher_id || null,
      updated_at: new Date().toISOString(),
    }))

    // Idempotent upsert on unique (institution_id, nisn)
    const { data, error } = await supabase
      .from('participants')
      .upsert(rows, { onConflict: 'institution_id,nisn' })
      .select()

    if (error) throw error
    return (data as ParticipantEntity[]) || []
  },
}
