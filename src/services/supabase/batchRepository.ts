import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { RegistrationBatchEntity } from '../../types/database'
import { mockRecentImports } from '../../lib/mockData'

export interface CreateBatchInput {
  competition_id: string
  institution_id: string
  created_by: string
  batch_name: string
  source_filename?: string
  participant_count?: number
  teacher_count?: number
}

const localBatches = new Map<string, RegistrationBatchEntity>()

export const batchRepository = {
  async getBatches(institutionId?: string): Promise<RegistrationBatchEntity[]> {
    if (!isSupabaseConfigured()) {
      const mockList = mockRecentImports.map((b) => ({
        id: b.id,
        competition_id: 'c0000000-0000-0000-0000-000000000001',
        institution_id: institutionId || 'a0000000-0000-0000-0000-000000000001',
        created_by: '00000000-0000-0000-0000-000000000001',
        batch_name: b.batchName,
        source_filename: b.sourceFilename,
        participant_count: b.totalParticipants,
        teacher_count: b.totalTeachers,
        status: (b.status === 'need_review' ? 'processing' : 'completed') as RegistrationBatchEntity['status'],
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }))
      return [...Array.from(localBatches.values()), ...mockList]
    }

    let query = supabase
      .from('registration_batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as RegistrationBatchEntity[]) || []
  },

  async getBatchById(id: string): Promise<RegistrationBatchEntity | null> {
    if (!isSupabaseConfigured()) {
      if (localBatches.has(id)) {
        return localBatches.get(id)!
      }
      const all = await this.getBatches()
      return all.find((b) => b.id === id) || null
    }

    const { data, error } = await supabase
      .from('registration_batches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as RegistrationBatchEntity
  },

  async createBatch(input: CreateBatchInput): Promise<RegistrationBatchEntity> {
    if (!isSupabaseConfigured()) {
      const newBatch: RegistrationBatchEntity = {
        id: `batch-${Date.now()}`,
        competition_id: input.competition_id,
        institution_id: input.institution_id,
        created_by: input.created_by,
        batch_name: input.batch_name,
        source_filename: input.source_filename || null,
        participant_count: input.participant_count || 0,
        teacher_count: input.teacher_count || 0,
        status: 'processing',
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: null,
      }
      localBatches.set(newBatch.id, newBatch)
      return newBatch
    }

    const { data, error } = await supabase
      .from('registration_batches')
      .insert({
        competition_id: input.competition_id,
        institution_id: input.institution_id,
        created_by: input.created_by,
        batch_name: input.batch_name,
        source_filename: input.source_filename || null,
        participant_count: input.participant_count || 0,
        teacher_count: input.teacher_count || 0,
        status: 'processing',
      })
      .select()
      .single()

    if (error) throw error
    return data as RegistrationBatchEntity
  },

  async updateBatchStatus(
    batchId: string,
    status: RegistrationBatchEntity['status'],
    participantCount: number,
    teacherCount: number,
    errorMessage?: string | null
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      const existing = localBatches.get(batchId)
      if (existing) {
        existing.status = status
        existing.participant_count = participantCount
        existing.teacher_count = teacherCount
        existing.error_message = errorMessage || null
        if (status === 'completed') {
          existing.completed_at = new Date().toISOString()
        }
      }
      return
    }

    const updates: Partial<RegistrationBatchEntity> = {
      status,
      participant_count: participantCount,
      teacher_count: teacherCount,
      error_message: errorMessage || null,
    }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    await supabase.from('registration_batches').update(updates).eq('id', batchId)
  },
}
