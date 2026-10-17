import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { RegistrationBatchEntity } from '../../types/database'
import { studentRepository, CANONICAL_INSTITUTION_ID } from '../studentRepository'

export interface CreateBatchInput {
  competition_id: string
  institution_id: string
  created_by: string
  batch_name: string
  source_filename?: string
  participant_count?: number
  teacher_count?: number
}

const BATCHES_LOCAL_STORAGE_KEY = 'ogsoreg_registration_batches_v1'

function getLocalBatchesMap(): Map<string, RegistrationBatchEntity> {
  const map = new Map<string, RegistrationBatchEntity>()
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(BATCHES_LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as RegistrationBatchEntity[]
        parsed.forEach((b) => {
          if (b && b.id) map.set(b.id, b)
        })
      }
    } catch {
      // Ignore parse error
    }
  }
  return map
}

function saveLocalBatchesMap(batches: RegistrationBatchEntity[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(BATCHES_LOCAL_STORAGE_KEY, JSON.stringify(batches))
    } catch {
      // Ignore quota error
    }
  }
}

export const batchRepository = {
  async getBatches(institutionId?: string, assignedCampus?: string | null): Promise<RegistrationBatchEntity[]> {
    const localMap = getLocalBatchesMap()

    // 1. Try fetching from Supabase if configured, without throwing if table doesn't exist
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('registration_batches')
          .select('*')
          .order('created_at', { ascending: false })

        if (institutionId) {
          query = query.eq('institution_id', institutionId)
        }

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          data.forEach((b) => localMap.set(b.id, b as RegistrationBatchEntity))
        }
      } catch (err) {
        // Table may not exist yet or connection issue: silently fallback to local persistence
        console.warn('Supabase registration_batches query failed, using local persistence:', err)
      }
    }

    // 2. If no batches exist yet, synthesize an initial batch from registered students in the directory
    if (localMap.size === 0) {
      try {
        const students = studentRepository.getRawStore(institutionId || CANONICAL_INSTITUTION_ID)
        const relevantStudents = assignedCampus
          ? students.filter((s) => s.kampus === assignedCampus)
          : students

        if (relevantStudents.length > 0) {
          const autoBatch: RegistrationBatchEntity = {
            id: `batch-${Date.now()}-auto`,
            competition_id: 'c0000000-0000-0000-0000-000000000001',
            institution_id: institutionId || CANONICAL_INSTITUTION_ID,
            created_by: 'system',
            batch_name: assignedCampus
              ? `Pendaftaran Santri — ${assignedCampus}`
              : 'Pendaftaran Kolektif Santri',
            source_filename: 'Pendaftaran Kolektif',
            participant_count: relevantStudents.length,
            teacher_count: 0,
            status: 'completed',
            error_message: null,
            created_at: relevantStudents[0]?.created_at || new Date().toISOString(),
            completed_at: relevantStudents[0]?.created_at || new Date().toISOString(),
          }
          localMap.set(autoBatch.id, autoBatch)
          saveLocalBatchesMap(Array.from(localMap.values()))
        }
      } catch {
        // Ignore fallback error
      }
    }

    const list = Array.from(localMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return list
  },

  async getBatchById(id: string): Promise<RegistrationBatchEntity | null> {
    const localMap = getLocalBatchesMap()
    if (localMap.has(id)) {
      return localMap.get(id)!
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('registration_batches')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          return data as RegistrationBatchEntity
        }
      } catch {
        // Fallback
      }
    }

    const all = await this.getBatches()
    return all.find((b) => b.id === id) || null
  },

  async createBatch(input: CreateBatchInput): Promise<RegistrationBatchEntity> {
    const newBatch: RegistrationBatchEntity = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      competition_id: input.competition_id,
      institution_id: input.institution_id,
      created_by: input.created_by,
      batch_name: input.batch_name,
      source_filename: input.source_filename || null,
      participant_count: input.participant_count || 0,
      teacher_count: input.teacher_count || 0,
      status: 'completed',
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    // Save to local persistence immediately
    const localMap = getLocalBatchesMap()
    localMap.set(newBatch.id, newBatch)
    saveLocalBatchesMap(Array.from(localMap.values()))

    if (isSupabaseConfigured()) {
      try {
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
            status: 'completed',
          })
          .select()
          .single()

        if (!error && data) {
          localMap.set(data.id, data as RegistrationBatchEntity)
          saveLocalBatchesMap(Array.from(localMap.values()))
          return data as RegistrationBatchEntity
        }
      } catch {
        // Table not ready in cloud: local copy is preserved
      }
    }

    return newBatch
  },

  async updateBatchStatus(
    batchId: string,
    status: RegistrationBatchEntity['status'],
    participantCount: number,
    teacherCount: number,
    errorMessage?: string | null
  ): Promise<void> {
    const localMap = getLocalBatchesMap()
    const existing = localMap.get(batchId)
    if (existing) {
      existing.status = status
      existing.participant_count = participantCount
      existing.teacher_count = teacherCount
      existing.error_message = errorMessage || null
      if (status === 'completed') {
        existing.completed_at = new Date().toISOString()
      }
      localMap.set(batchId, existing)
      saveLocalBatchesMap(Array.from(localMap.values()))
    }

    if (isSupabaseConfigured()) {
      try {
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
      } catch {
        // Silent
      }
    }
  },
}
