import { isSupabaseConfigured } from '../lib/supabase'
import { cloudSyncService } from './supabase/cloudSyncService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from './studentRepository'
import { participantPeriodService, type PeriodWinner } from './participantPeriodService'
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
      // 1. Fetch deleted IDs
      const cloudDeleted = await cloudSyncService.getCloudSetting<string[]>('deleted_result_ids', [])
      if (Array.isArray(cloudDeleted) && cloudDeleted.length > 0) {
        cloudDeleted.forEach((id) => this.deletedResultIds.add(id))
      }

      // 2. Fetch results from app_settings
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
      await cloudSyncService.saveCloudSetting('competition_results', list)
      await cloudSyncService.saveCloudSetting('deleted_result_ids', Array.from(this.deletedResultIds))
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

    // Backward-compat cleanup
    try {
      const allWinners = participantPeriodService.getWinners(existing.period_id)
      const matchingWinner = allWinners.find((w) => w.id === `win-${existing.id}` || w.nisn_username === existing.student_id)
      if (matchingWinner) {
        participantPeriodService.deleteWinner(matchingWinner.id)
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
   * Keeps existing PeriodWinner (Hall of Fame & Certificate) in sync when champions are updated.
   */
  private async syncWinnerBackwardCompat(result: CompetitionResult): Promise<void> {
    try {
      const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
      const student = allStudents.find((s) => s.id === result.student_id)
      if (!student) return

      const winnerId = `win-${result.id}`

      if (result.is_champion && result.award_category) {
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
      } else {
        // If no longer a champion, remove from legacy winners
        const winners = participantPeriodService.getWinners(result.period_id)
        const match = winners.find((w) => w.id === winnerId || w.nisn_username === student.username)
        if (match) {
          await participantPeriodService.deleteWinner(match.id)
        }
      }
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
