import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { cloudSyncService } from './supabase/cloudSyncService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from './studentRepository'
import { participantPeriodService, getAwardRank, type PeriodWinner } from './participantPeriodService'
import type {
  CompetitionResult,
  ResultStatus,
  StudentWithResult,
  ResultFilterParams,
  ResultStats,
} from '../types/competitionResult'

const STORAGE_KEY = 'ogsoreg_competition_results_v1'
const DELETED_RESULTS_KEY = 'ogsoreg_deleted_result_ids_v1'

export interface UpsertResultInput {
  id?: string
  student_id: string
  period_id: string
  result_status: ResultStatus
  is_finalist?: boolean
  is_champion?: boolean
  champion_rank?: number | null
  award_category?: string | null
  result_notes?: string | null
  updated_by?: string
}

export function inferChampionRank(awardCategory?: string | null): number | null {
  if (!awardCategory) return null
  const clean = awardCategory.toLowerCase().trim()
  if (clean === 'juara 1' || clean.includes('juara 1') || clean.includes('emas') || clean.includes('gold')) return 1
  if (clean === 'juara 2' || clean.includes('juara 2') || clean.includes('perak') || clean.includes('silver')) return 2
  if (clean === 'juara 3' || clean.includes('juara 3') || clean.includes('perunggu') || clean.includes('bronze')) return 3
  if (clean.includes('harapan 1')) return 4
  if (clean.includes('harapan 2')) return 5
  return null
}

class CompetitionResultService {
  private inMemoryResults: Map<string, CompetitionResult> = new Map() // key: result.id
  private deletedResultIds: Set<string> = new Set()
  private isCloudSyncing = false
  private hasInitializedCloud = false

  constructor() {
    this.initLocalStorage()
    this.initCloudSync()
  }

  private initLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const rawDeleted = window.localStorage.getItem(DELETED_RESULTS_KEY)
      if (rawDeleted) {
        const parsed = JSON.parse(rawDeleted)
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => this.deletedResultIds.add(id))
        }
      }

      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          parsed.forEach((r: CompetitionResult) => {
            if (r && r.id && !this.deletedResultIds.has(r.id)) {
              this.inMemoryResults.set(r.id, r)
            }
          })
        }
      }
    } catch {
      // Ignore
    }
  }

  private persistLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const active = Array.from(this.inMemoryResults.values())
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(active))
      window.localStorage.setItem(DELETED_RESULTS_KEY, JSON.stringify(Array.from(this.deletedResultIds)))
    } catch {
      // Ignore
    }
  }

  private initCloudSync() {
    if (this.hasInitializedCloud || typeof window === 'undefined') return
    this.hasInitializedCloud = true

    setTimeout(() => {
      this.syncFromCloud().catch(() => {})
    }, 250)

    window.addEventListener('focus', () => {
      this.syncFromCloud().catch(() => {})
    })
    window.addEventListener('online', () => {
      this.syncFromCloud().catch(() => {})
    })

    if (isSupabaseConfigured()) {
      try {
        supabase
          .channel('realtime:competition_results')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_results' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_winners' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .subscribe()

        cloudSyncService.subscribeCloudSetting('competition_results', () => {
          this.syncFromCloud().catch(() => {})
        })
      } catch {
        // Ignore
      }
    }
  }

  public async syncFromCloud(): Promise<void> {
    if (!isSupabaseConfigured() || this.isCloudSyncing) return
    this.isCloudSyncing = true
    try {
      // 1. Fetch deleted IDs from cloud setting
      try {
        const cloudDeleted = await cloudSyncService.getCloudSetting<string[]>('deleted_result_ids', [])
        if (Array.isArray(cloudDeleted) && cloudDeleted.length > 0) {
          cloudDeleted.forEach((id) => this.deletedResultIds.add(id))
        }
      } catch {}

      // 2. Fetch directly from Supabase 'competition_results' table
      try {
        const { data: dbResults, error: dbErr } = await supabase.from('competition_results').select('*')
        if (!dbErr && Array.isArray(dbResults) && dbResults.length > 0) {
          dbResults.forEach((r: any) => {
            if (r && r.id && !this.deletedResultIds.has(r.id)) {
              const existing = this.inMemoryResults.get(r.id)
              if (!existing || new Date(r.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
                this.inMemoryResults.set(r.id, r as CompetitionResult)
              }
            }
          })
        }
      } catch {}

      // 3. Fetch from Supabase 'competition_winners' (syncs winners AND finalists across devices)
      try {
        const allWinners = participantPeriodService.getWinners()
        const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
        const studentByUsername = new Map<string, string>()
        allStudents.forEach((s) => {
          if (s.username) studentByUsername.set(s.username.toLowerCase().trim(), s.id)
        })

        allWinners.forEach((w) => {
          const studentId = w.nisn_username && studentByUsername.get(w.nisn_username.toLowerCase().trim())
          if (!studentId || !w.period_id) return

          const isFinalistOnly = (w.award || '').trim().toLowerCase() === 'lolos final'
          const resultStatus: ResultStatus = isFinalistOnly ? 'finalis' : 'juara'
          const isChampion = !isFinalistOnly
          const isFinalist = true
          const rank = isChampion ? getAwardRank(w.award) : null
          const awardCategory = isChampion ? w.award : null

          const resId = `res-${w.period_id}-${studentId}`
          if (!this.deletedResultIds.has(resId)) {
            const existing = this.getResult(studentId, w.period_id)
            if (!existing) {
              this.inMemoryResults.set(resId, {
                id: resId,
                student_id: studentId,
                period_id: w.period_id,
                result_status: resultStatus,
                is_finalist: isFinalist,
                is_champion: isChampion,
                champion_rank: rank !== 100 && rank !== 999 ? rank : inferChampionRank(awardCategory),
                award_category: awardCategory,
                result_notes: null,
                created_at: w.created_at || new Date().toISOString(),
                updated_at: w.created_at || new Date().toISOString(),
                updated_by: 'cloud-sync',
              })
            }
          }
        })
      } catch {}

      // 4. Fetch results from student custom_fields (synced via Supabase students table)
      try {
        const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
        allStudents.forEach((s) => {
          const crMap = s.custom_fields?.competition_results
          if (crMap && typeof crMap === 'object') {
            Object.entries(crMap).forEach(([pId, r]: [string, any]) => {
              if (r && pId && !this.deletedResultIds.has(r.id)) {
                const existing = this.getResult(s.id, pId)
                if (!existing) {
                  this.inMemoryResults.set(r.id || `res-${pId}-${s.id}`, {
                    id: r.id || `res-${pId}-${s.id}`,
                    student_id: s.id,
                    period_id: pId,
                    result_status: r.result_status || (r.is_champion ? 'juara' : r.is_finalist ? 'finalis' : 'peserta'),
                    is_finalist: Boolean(r.is_finalist),
                    is_champion: Boolean(r.is_champion),
                    champion_rank: r.champion_rank ?? null,
                    award_category: r.award_category ?? null,
                    result_notes: r.result_notes ?? null,
                    created_at: r.updated_at || new Date().toISOString(),
                    updated_at: r.updated_at || new Date().toISOString(),
                    updated_by: r.updated_by || 'cloud-sync',
                  })
                }
              }
            })
          }
        })
      } catch {}

      // 5. Fetch results from app_settings
      try {
        const cloudResults = await cloudSyncService.getCloudSetting<CompetitionResult[] | null>('competition_results', null)
        if (cloudResults && Array.isArray(cloudResults)) {
          cloudResults.forEach((r) => {
            if (r && r.id && !this.deletedResultIds.has(r.id)) {
              const existing = this.inMemoryResults.get(r.id)
              if (!existing || new Date(r.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
                this.inMemoryResults.set(r.id, r)
              }
            }
          })
        }
      } catch {}

      this.persistLocalStorage()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ogsoreg_results_updated'))
      }
    } catch {
      // Fallback
    } finally {
      this.isCloudSyncing = false
    }
  }

  private async uploadToCloud(): Promise<void> {
    const list = Array.from(this.inMemoryResults.values())
    try {
      // 1. Save to app_settings key
      await cloudSyncService.saveCloudSetting('competition_results', list)
      await cloudSyncService.saveCloudSetting('deleted_result_ids', Array.from(this.deletedResultIds))

      // 2. Direct upsert to Supabase 'competition_results' table
      if (isSupabaseConfigured() && list.length > 0) {
        const rows = list.map((r) => ({
          id: r.id,
          student_id: r.student_id,
          period_id: r.period_id,
          result_status: r.result_status,
          is_finalist: r.is_finalist,
          is_champion: r.is_champion,
          champion_rank: r.champion_rank ?? null,
          award_category: r.award_category ?? null,
          result_notes: r.result_notes ?? null,
          updated_by: r.updated_by || 'admin',
          updated_at: r.updated_at || new Date().toISOString(),
        }))

        // Upsert in chunks of 50
        for (let i = 0; i < rows.length; i += 50) {
          const chunk = rows.slice(i, i + 50)
          supabase.from('competition_results').upsert(chunk).then(() => {})
        }
      }

      // 3. Direct delete of purged records in Supabase
      if (isSupabaseConfigured() && this.deletedResultIds.size > 0) {
        supabase.from('competition_results').delete().in('id', Array.from(this.deletedResultIds)).then(() => {})
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Returns all results stored in the system.
   */
  public getAllResults(): CompetitionResult[] {
    return Array.from(this.inMemoryResults.values()).filter((r) => !this.deletedResultIds.has(r.id))
  }

  /**
   * Returns results strictly belonging to the specified period.
   */
  public getResultsByPeriod(periodId: string): CompetitionResult[] {
    if (!periodId) return []
    return this.getAllResults().filter((r) => r.period_id === periodId)
  }

  /**
   * Returns the result record for a specific student in a specific period.
   */
  public getResult(studentId: string, periodId: string): CompetitionResult | undefined {
    if (!studentId || !periodId) return undefined
    return this.getAllResults().find((r) => r.student_id === studentId && r.period_id === periodId)
  }

  /**
   * Normalizes and validates integrity rules for a result input.
   * Integrity Rules:
   * 1. If result_status === 'juara' or is_champion === true, then is_finalist MUST be true.
   * 2. If result_status === 'finalis', is_finalist = true, is_champion = false, champion_rank = null, award_category = null.
   * 3. If result_status === 'peserta', is_finalist = false, is_champion = false, champion_rank = null, award_category = null.
   */
  public normalizeResultData(input: UpsertResultInput): {
    result_status: ResultStatus
    is_finalist: boolean
    is_champion: boolean
    champion_rank: number | null
    award_category: string | null
    result_notes: string | null
  } {
    let result_status: ResultStatus = input.result_status || 'peserta'
    let is_champion = input.is_champion ?? false
    let is_finalist = input.is_finalist ?? false
    let award_category = input.award_category?.trim() || null
    let champion_rank = input.champion_rank !== undefined ? input.champion_rank : null
    let result_notes = input.result_notes?.trim() || null

    if (result_status === 'juara' || is_champion || award_category) {
      result_status = 'juara'
      is_champion = true
      is_finalist = true // Champion automatically qualifies as finalist!
      if (!champion_rank && award_category) {
        champion_rank = inferChampionRank(award_category)
      }
    } else if (result_status === 'finalis' || is_finalist) {
      result_status = 'finalis'
      is_finalist = true
      is_champion = false
      champion_rank = null
      award_category = null
    } else {
      result_status = 'peserta'
      is_finalist = false
      is_champion = false
      champion_rank = null
      award_category = null
    }

    return {
      result_status,
      is_finalist,
      is_champion,
      champion_rank,
      award_category,
      result_notes,
    }
  }

  /**
   * Inserts or updates a student competition result for a period.
   * Enforces uniqueness on (student_id, period_id).
   */
  public async upsertResult(input: UpsertResultInput): Promise<CompetitionResult> {
    if (!input.student_id) throw new Error('student_id is required')
    if (!input.period_id) throw new Error('period_id is required')

    const normalized = this.normalizeResultData(input)
    const existing = this.getResult(input.student_id, input.period_id)
    const now = new Date().toISOString()

    const resultId = existing?.id || input.id || `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const record: CompetitionResult = {
      id: resultId,
      student_id: input.student_id,
      period_id: input.period_id,
      result_status: normalized.result_status,
      is_finalist: normalized.is_finalist,
      is_champion: normalized.is_champion,
      champion_rank: normalized.champion_rank,
      award_category: normalized.award_category,
      result_notes: normalized.result_notes,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      updated_by: input.updated_by || 'admin',
    }

    this.inMemoryResults.set(resultId, record)
    this.deletedResultIds.delete(resultId)
    this.persistLocalStorage()
    this.uploadToCloud().catch(() => {})

    // Backward-compatibility synchronization:
    // Sync to participantPeriodService winners for Hall of Fame and Certificates
    this.syncWinnerBackwardCompat(record).catch(() => {})

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ogsoreg_results_updated'))
    }

    return record
  }

  /**
   * Bulk upserts results within a period (e.g. from Excel import or bulk actions).
   * Operates atomically in memory and persists synchronously to localStorage.
   */
  public async bulkUpsertResults(inputs: UpsertResultInput[]): Promise<{ count: number; results: CompetitionResult[] }> {
    const results: CompetitionResult[] = []
    for (const input of inputs) {
      if (!input.student_id || !input.period_id) continue
      const normalized = this.normalizeResultData(input)
      const existing = this.getResult(input.student_id, input.period_id)
      const now = new Date().toISOString()

      const resultId = existing?.id || input.id || `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      const record: CompetitionResult = {
        id: resultId,
        student_id: input.student_id,
        period_id: input.period_id,
        result_status: normalized.result_status,
        is_finalist: normalized.is_finalist,
        is_champion: normalized.is_champion,
        champion_rank: normalized.champion_rank,
        award_category: normalized.award_category,
        result_notes: normalized.result_notes,
        created_at: existing ? existing.created_at : now,
        updated_at: now,
        updated_by: input.updated_by || 'admin',
      }

      this.inMemoryResults.set(resultId, record)
      this.deletedResultIds.delete(resultId)
      results.push(record)

      this.syncWinnerBackwardCompat(record).catch(() => {})
    }

    this.persistLocalStorage()
    this.uploadToCloud().catch(() => {})

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ogsoreg_results_updated'))
    }

    return { count: results.length, results }
  }

  /**
   * Deletes a result record. Reverts student's result in that period to unassigned/peserta.
   */
  public async deleteResult(resultId: string): Promise<boolean> {
    const existing = this.inMemoryResults.get(resultId)
    if (!existing) return false

    this.inMemoryResults.delete(resultId)
    this.deletedResultIds.add(resultId)
    this.persistLocalStorage()
    this.uploadToCloud().catch(() => {})

    // Backward-compat cleanup from competition_winners & student custom_fields
    try {
      const allWinners = participantPeriodService.getWinners(existing.period_id)
      const toDelete = allWinners.filter(
        (w) =>
          w.id === `win-${existing.id}` ||
          w.id === `finalist-${existing.id}` ||
          w.nisn_username === existing.student_id
      )
      toDelete.forEach((w) => participantPeriodService.deleteWinner(w.id))

      const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
      const student = allStudents.find((s) => s.id === existing.student_id)
      if (student && student.custom_fields?.competition_results) {
        const nextResults = { ...student.custom_fields.competition_results }
        delete nextResults[existing.period_id]
        studentRepository
          .updateStudent(
            student.id,
            { custom_fields: { ...student.custom_fields, competition_results: nextResults } },
            CANONICAL_INSTITUTION_ID
          )
          .catch(() => {})
      }
    } catch {
      // Ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ogsoreg_results_updated'))
    }

    return true
  }

  /**
   * Backward-compatibility helper:
   * Keeps existing PeriodWinner (Hall of Fame & Certificate) in sync when champions and finalists are updated.
   * Also syncs into student's custom_fields in the primary students table.
   */
  private async syncWinnerBackwardCompat(result: CompetitionResult): Promise<void> {
    try {
      const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
      const student = allStudents.find((s) => s.id === result.student_id)
      if (!student) return

      const winnerId = `win-${result.id}`
      const finalistId = `finalist-${result.id}`

      if (result.is_champion && result.award_category) {
        // 1. Save Champion to competition_winners table
        const winnerPayload: PeriodWinner = {
          id: winnerId,
          period_id: result.period_id,
          student_name: student.full_name,
          nisn_username: student.username,
          campus: student.kampus || 'Gontor 1',
          jenjang: student.jenjang,
          award: result.award_category,
          category: (student.custom_fields?.bidang as string) || (student.custom_fields?.lomba as string) || 'Umum',
          created_at: result.updated_at,
        }
        await participantPeriodService.saveWinner(winnerPayload)

        // Remove any old finalist placeholder
        const winners = participantPeriodService.getWinners(result.period_id)
        const oldFinalist = winners.find((w) => w.id === finalistId)
        if (oldFinalist) {
          participantPeriodService.deleteWinner(oldFinalist.id)
        }
      } else if (result.is_finalist) {
        // 2. Save Finalist to competition_winners table
        const finalistPayload: PeriodWinner = {
          id: finalistId,
          period_id: result.period_id,
          student_name: student.full_name,
          nisn_username: student.username,
          campus: student.kampus || 'Gontor 1',
          jenjang: student.jenjang,
          award: 'Lolos Final',
          category: (student.custom_fields?.bidang as string) || (student.custom_fields?.lomba as string) || 'Umum',
          created_at: result.updated_at,
        }
        await participantPeriodService.saveWinner(finalistPayload)

        // Remove any old champion entry
        const winners = participantPeriodService.getWinners(result.period_id)
        const oldWinner = winners.find((w) => w.id === winnerId)
        if (oldWinner) {
          participantPeriodService.deleteWinner(oldWinner.id)
        }
      } else {
        // 3. Peserta: Remove both champion and finalist entries
        const winners = participantPeriodService.getWinners(result.period_id)
        const toDelete = winners.filter(
          (w) => w.id === winnerId || w.id === finalistId || w.nisn_username === student.username
        )
        toDelete.forEach((w) => participantPeriodService.deleteWinner(w.id))
      }

      // 4. Save into student's custom_fields in primary students table
      const updatedCustom = {
        ...(student.custom_fields || {}),
        competition_results: {
          ...(student.custom_fields?.competition_results || {}),
          [result.period_id]: {
            id: result.id,
            result_status: result.result_status,
            is_finalist: result.is_finalist,
            is_champion: result.is_champion,
            champion_rank: result.champion_rank,
            award_category: result.award_category,
            result_notes: result.result_notes,
            updated_at: result.updated_at,
          },
        },
      }
      studentRepository
        .updateStudent(student.id, { custom_fields: updatedCustom }, CANONICAL_INSTITUTION_ID)
        .catch(() => {})
    } catch {
      // Non-blocking
    }
  }

  /**
   * Joins registered students with their competition result in a given period.
   * Returns array of StudentWithResult and period statistics.
   */
  public async getStudentsWithResults(
    periodId: string,
    params: ResultFilterParams = { period_id: periodId },
    accessCampus?: string | null
  ): Promise<{ students: StudentWithResult[]; stats: ResultStats }> {
    const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
    const periodResults = this.getResultsByPeriod(periodId)
    const resultMap = new Map<string, CompetitionResult>()
    periodResults.forEach((r) => resultMap.set(r.student_id, r))

    // Join students with results
    let joined: StudentWithResult[] = allStudents.map((student) => {
      const res = resultMap.get(student.id)
      return {
        student,
        result: res,
        status: res?.result_status || 'peserta',
        is_finalist: res ? res.is_finalist : false,
        is_champion: res ? res.is_champion : false,
        champion_rank: res?.champion_rank ?? null,
        award_category: res?.award_category ?? null,
        result_notes: res?.result_notes ?? null,
      }
    })

    // Strict campus isolation if Campus Admin
    if (accessCampus) {
      joined = joined.filter((s) => s.student.kampus === accessCampus)
    } else if (params.campus && params.campus !== 'all') {
      joined = joined.filter((s) => s.student.kampus === params.campus)
    }

    // Filter by Jenjang
    if (params.jenjang && params.jenjang !== 'all') {
      joined = joined.filter((s) => s.student.jenjang === params.jenjang)
    }

    // Filter by Daerah
    if (params.daerah && params.daerah !== 'all') {
      joined = joined.filter((s) => {
        const d = (s.student.custom_fields?.daerah as string) || (s.student.custom_fields?.konsulat as string) || ''
        return d.toLowerCase() === params.daerah?.toLowerCase()
      })
    }

    // Filter by search query (name, username, email, campus, notes)
    if (params.search && params.search.trim()) {
      const query = params.search.toLowerCase().trim()
      joined = joined.filter(
        (s) =>
          s.student.full_name.toLowerCase().includes(query) ||
          s.student.username.toLowerCase().includes(query) ||
          s.student.email.toLowerCase().includes(query) ||
          (s.student.kampus && s.student.kampus.toLowerCase().includes(query)) ||
          (s.result_notes && s.result_notes.toLowerCase().includes(query)) ||
          (s.award_category && s.award_category.toLowerCase().includes(query))
      )
    }

    // Calculate base statistics across the campus/demographic scope for this period
    const totalParticipants = joined.length
    const totalFinalists = joined.filter((s) => s.is_finalist).length
    const totalChampions = joined.filter((s) => s.is_champion).length
    const finalistPercentage = totalParticipants > 0 ? Math.round((totalFinalists / totalParticipants) * 1000) / 10 : 0
    const championPercentage = totalParticipants > 0 ? Math.round((totalChampions / totalParticipants) * 1000) / 10 : 0

    // Filter by status if specified
    if (params.status && params.status !== 'all') {
      if (params.status === 'juara') {
        joined = joined.filter((s) => s.is_champion)
      } else if (params.status === 'finalis') {
        joined = joined.filter((s) => s.is_finalist && !s.is_champion)
      } else if (params.status === 'peserta') {
        joined = joined.filter((s) => !s.is_finalist && !s.is_champion)
      }
    }

    return {
      students: joined,
      stats: {
        totalParticipants,
        totalFinalists,
        totalChampions,
        finalistPercentage,
        championPercentage,
      },
    }
  }
}

export const competitionResultService = new CompetitionResultService()
