import type { StudentJenjang } from '../types/student'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { cloudSyncService } from './supabase/cloudSyncService'

export const LEGACY_LOMBA_OPTIONS = [
  'IPA Shigor',
  'IPA Kibar',
  'MTK Shigor',
  'MTK Kibar',
  'DMS (Darussalam Math and Science)',
] as const

export type LegacyLombaOption = (typeof LEGACY_LOMBA_OPTIONS)[number]

export const AWARD_OPTIONS = [
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Juara Harapan 1',
  'Juara Harapan 2',
] as const

export type AwardOption = (typeof AWARD_OPTIONS)[number]

/**
 * Returns numerical rank order for sorting awards:
 * Juara 1 (1) -> Juara 2 (2) -> Juara 3 (3) -> Juara Harapan 1 (4) -> Juara Harapan 2 (5)
 */
export const getAwardRank = (award?: unknown): number => {
  if (!award || typeof award !== 'string') return 999
  const trimmed = award.trim().toLowerCase()
  if (trimmed === 'juara 1' || trimmed.startsWith('juara 1')) return 1
  if (trimmed === 'juara 2' || trimmed.startsWith('juara 2')) return 2
  if (trimmed === 'juara 3' || trimmed.startsWith('juara 3')) return 3
  if (trimmed.includes('harapan 1') || trimmed.includes('harapn 1')) return 4
  if (trimmed.includes('harapan 2') || trimmed.includes('harapn 2')) return 5
  if (trimmed.includes('emas')) return 1.1
  if (trimmed.includes('perak')) return 2.1
  if (trimmed.includes('perunggu')) return 3.1
  return 100
}

/**
 * Normalizes competition category / lomba names (case-insensitive & variant matching)
 * to prevent duplicates like "Ipa Shigor" vs "ipa shigor" vs "IPA Shigor".
 */
export const normalizeCategoryName = (cat?: string): string => {
  if (!cat || typeof cat !== 'string') return 'Bidang Lainnya'
  const trimmed = cat.trim()
  const lower = trimmed.toLowerCase()

  // Match against standard legacy options case-insensitively
  if (lower === 'ipa shigor' || lower === 'ipa-shigor' || lower.includes('ipa shigor') || lower.includes('ipa_shigor')) {
    return 'IPA Shigor'
  }
  if (lower === 'ipa kibar' || lower === 'ipa-kibar' || lower.includes('ipa kibar') || lower.includes('ipa_kibar')) {
    return 'IPA Kibar'
  }
  if (lower === 'mtk shigor' || lower === 'mtk-shigor' || lower.includes('mtk shigor') || lower.includes('matematika shigor')) {
    return 'MTK Shigor'
  }
  if (lower === 'mtk kibar' || lower === 'mtk-kibar' || lower.includes('mtk kibar') || lower.includes('matematika kibar')) {
    return 'MTK Kibar'
  }
  if (lower === 'dms' || lower.startsWith('dms') || lower.includes('darussalam math and science')) {
    return 'DMS (Darussalam Math and Science)'
  }

  // Exact match with any other standard option case-insensitively
  for (const opt of LEGACY_LOMBA_OPTIONS) {
    if (opt.toLowerCase() === lower) {
      return opt
    }
  }

  return trimmed
}

export interface CompetitionPeriod {
  id: string
  name: string // e.g. "OGSO 2026", "OGSO 2025"
  slug: string
  year: number
  description: string
  status: 'active' | 'completed' | 'archived'
  start_date: string
  end_date: string
  is_published: boolean
  total_winners?: number
  total_participants?: number
  created_at: string
  updated_at: string
}

export interface PeriodWinner {
  id: string
  period_id: string
  student_name: string
  nisn_username: string
  campus: string
  jenjang?: StudentJenjang | string
  award: string // e.g. "Juara 1", "Juara 2", "Juara 3", "Juara Harapan 1", "Juara Harapan 2"
  category: string // e.g. "Matematika", "IPA / Sains", "IPA Shigor", "MTK Kibar"
  score?: number
  certificate_id?: string
  created_at: string
}

export interface PeriodCertificate {
  id: string
  period_id: string
  certificate_number: string // e.g. "CERT/OGSO-2026/WIN/001"
  certificate_type: 'winner' | 'participant'
  recipient_name: string
  nisn_username: string
  campus: string
  jenjang?: StudentJenjang | string
  award_title?: string // e.g. "Juara 1 Bidang Matematika"
  issue_date: string
  is_published: boolean
  is_revoked: boolean
  verification_code: string
  created_at: string
}

const PERIODS_STORAGE_KEY = 'ogsoreg_periods_v5'
const WINNERS_STORAGE_KEY = 'ogsoreg_period_winners_v5'
const CERTIFICATES_STORAGE_KEY = 'ogsoreg_period_certs_v5'
const DELETED_WINNERS_KEY = 'ogsoreg_deleted_winner_ids_v5'
const DELETED_CERTS_KEY = 'ogsoreg_deleted_cert_ids_v5'
const WINNERS_MIGRATED_FLAG = 'ogsoreg_winners_migrated_v5'
const CERTS_MIGRATED_FLAG = 'ogsoreg_certs_migrated_v5'

function getDeletedWinnerIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DELETED_WINNERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {}
  return new Set()
}

function addDeletedWinnerIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedWinnerIds()
    ids.forEach((id) => set.add(id))
    localStorage.setItem(DELETED_WINNERS_KEY, JSON.stringify(Array.from(set)))
  } catch {}
}

function removeDeletedWinnerId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedWinnerIds()
    if (set.has(id)) {
      set.delete(id)
      localStorage.setItem(DELETED_WINNERS_KEY, JSON.stringify(Array.from(set)))
    }
  } catch {}
}

function getDeletedCertIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DELETED_CERTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {}
  return new Set()
}

function addDeletedCertIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedCertIds()
    ids.forEach((id) => set.add(id))
    localStorage.setItem(DELETED_CERTS_KEY, JSON.stringify(Array.from(set)))
  } catch {}
}

// Helper to sort competition periods from newest to oldest:
// 1. Year descending (e.g. 2027 -> 2026 -> 2025 -> 2024)
// 2. start_date descending
// 3. created_at descending
export const sortPeriodsNewestFirst = (periods: CompetitionPeriod[]): CompetitionPeriod[] => {
  return [...periods].sort((a, b) => {
    const yearA = Number(a?.year) || (a?.start_date ? new Date(a.start_date).getFullYear() : 0)
    const yearB = Number(b?.year) || (b?.start_date ? new Date(b.start_date).getFullYear() : 0)
    if (yearA !== yearB) return yearB - yearA

    const dateA = a?.start_date ? new Date(a.start_date).getTime() : 0
    const dateB = b?.start_date ? new Date(b.start_date).getTime() : 0
    if (dateA !== dateB) return dateB - dateA

    const createdA = a?.created_at ? new Date(a.created_at).getTime() : 0
    const createdB = b?.created_at ? new Date(b.created_at).getTime() : 0
    return createdB - createdA
  })
}

/**
 * Checks whether a period belongs to legacy format (year <= 2025).
 * The Jenjang system only applies starting from competition year 2026 onwards.
 */
export function isPeriodLegacyYear(periodId?: string): boolean {
  if (!periodId) return false
  const match = periodId.match(/\b(20\d\d)\b/)
  if (match) {
    return parseInt(match[1], 10) <= 2025
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PERIODS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const found = parsed.find(
            (p) => p && (p.id === periodId || p.slug === periodId || p.name === periodId)
          )
          if (found && found.year) {
            return Number(found.year) <= 2025
          }
        }
      }
    } catch {}
  }
  const init = INITIAL_PERIODS.find(
    (p) => p && (p.id === periodId || p.slug === periodId || p.name === periodId)
  )
  if (init && init.year) {
    return Number(init.year) <= 2025
  }
  return false
}

// Initial seed periods for OGSO (OGSO 2026 is upcoming/in-progress, so winners & certs start at 0)
const INITIAL_PERIODS: CompetitionPeriod[] = [
  {
    id: 'period-ogso-2026',
    name: 'OGSO 2026',
    slug: 'ogso-2026',
    year: 2026,
    description: 'Olimpiade Gontor Sains & Matematika Tingkat Seluruh Kampus 2026',
    status: 'active',
    start_date: '2026-01-10',
    end_date: '2026-11-20',
    is_published: true,
    total_winners: 0,
    total_participants: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'period-ogso-2025',
    name: 'OGSO 2025',
    slug: 'ogso-2025',
    year: 2025,
    description: 'Olimpiade Gontor Sains & Matematika 2025 (Arsip Resmi)',
    status: 'completed',
    start_date: '2025-01-15',
    end_date: '2025-10-25',
    is_published: true,
    total_winners: 15,
    total_participants: 120,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-10-30T00:00:00Z',
  },
  {
    id: 'period-ogso-2024',
    name: 'OGSO 2024',
    slug: 'ogso-2024',
    year: 2024,
    description: 'Olimpiade Gontor Sains & Matematika 2024 (Arsip Resmi)',
    status: 'archived',
    start_date: '2024-01-15',
    end_date: '2024-10-28',
    is_published: true,
    total_winners: 12,
    total_participants: 98,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
  },
]

// Names of pre-seeded dummy records that must be purged to respect user-created data
export const DUMMY_STUDENT_NAMES = new Set([
  'bilal akbar',
  'fikri haikal',
  'm. rizky pratama',
  'maryam jameela',
  'rayhan al-ghifari',
  'annisa rahmawati',
  'dzaky mubarak',
  'zahra kamila',
  'dafa al-fatih',
  'khadijah al-kubro',
  'ahmad fauzi',
  'nurul hidayah',
  'tariq ziyad',
  'syifa az-zahra',
  'salman farisi',
  'nainawa annabila',
  'nashir azzuhri',
  'amanda nur',
  'nur amanda',
  'lathiif rahman',
  'alya nashwa',
  'ghovva marshandi',
  'humaira salsabila',
  'farhan ramadhan',
])

export const DUMMY_WINNER_IDS = new Set([
  'win-2026-01', 'win-2026-02', 'win-2026-03', 'win-2026-04', 'win-2026-05', 'win-2026-06',
  'win-2025-01', 'win-2025-02', 'win-2025-03', 'win-2025-04', 'win-2025-05', 'win-2025-06',
  'win-2025-07', 'win-2025-08', 'win-2025-09', 'win-2025-10', 'win-2025-11', 'win-2025-12',
  'win-2025-13', 'win-2025-14', 'win-2025-15',
])

export const DUMMY_CERT_IDS = new Set([
  'cert-part-2026-01',
  'cert-part-2026-02',
  'cert-part-2026-03',
  'cert-win-2026-01',
  'cert-win-2026-02',
  'cert-win-2026-03',
  'cert-win-2026-04',
  'cert-win-2026-05',
])

/**
 * Validates whether a certificate is an invalid or unstarted 2026 dummy participant certificate
 */
export const isInvalidCert = (c: PeriodCertificate | null | undefined): boolean => {
  if (!c) return true
  const id = (c.id || '').toLowerCase()
  const certNum = (c.certificate_number || '').toLowerCase()
  const verCode = (c.verification_code || '').toLowerCase()
  const recName = (c.recipient_name || (c as unknown as { student_name?: string }).student_name || '').trim().toLowerCase()
  const periodId = (c.period_id || '').toLowerCase()

  // 1. Explicitly purged dummy student names
  if (DUMMY_STUDENT_NAMES.has(recName)) return true

  // 2. Explicit dummy certificate IDs or codes
  if (
    DUMMY_CERT_IDS.has(c.id) ||
    id.startsWith('cert-part-2026-') ||
    certNum.includes('2026/part') ||
    verCode.includes('2026-part')
  ) {
    return true
  }

  // 3. Participant certificates for 2026 (competition has not started/finished yet)
  if ((periodId === 'period-ogso-2026' || periodId.includes('2026')) && c.certificate_type === 'participant') {
    return true
  }

  return false
}

class ParticipantPeriodService {
  private isCloudSyncing = false
  private hasInitializedCloud = false

  constructor() {
    this.initCloudSync()
  }

  private initCloudSync() {
    if (this.hasInitializedCloud || typeof window === 'undefined') return
    this.hasInitializedCloud = true

    setTimeout(() => {
      this.syncFromCloud().catch(() => {})
    }, 200)

    window.addEventListener('focus', () => {
      this.syncFromCloud().catch(() => {})
    })
    window.addEventListener('online', () => {
      this.syncFromCloud().catch(() => {})
    })

    if (isSupabaseConfigured()) {
      try {
        supabase
          .channel('realtime:periods_winners')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_periods' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_winners' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_certificates' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .subscribe()

        cloudSyncService.subscribeCloudSetting('competition_periods', () => {
          this.syncFromCloud().catch(() => {})
        })
        cloudSyncService.subscribeCloudSetting('competition_winners', () => {
          this.syncFromCloud().catch(() => {})
        })
        cloudSyncService.subscribeCloudSetting('competition_certificates', () => {
          this.syncFromCloud().catch(() => {})
        })
      } catch {
        // Ignore
      }
    }
  }

  async syncFromCloud(): Promise<void> {
    if (!isSupabaseConfigured() || this.isCloudSyncing) return
    this.isCloudSyncing = true
    try {
      // 1. Periods Sync
      const cloudPeriods = await cloudSyncService.getCloudSetting<CompetitionPeriod[] | null>('competition_periods', null)
      if (cloudPeriods && Array.isArray(cloudPeriods) && cloudPeriods.length > 0) {
        const sorted = sortPeriodsNewestFirst(cloudPeriods)
        localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(sorted))
        window.dispatchEvent(new CustomEvent('ogsoreg_periods_updated'))
      }

      // 2. Winners Sync
      const cloudWinners = await cloudSyncService.getCloudSetting<PeriodWinner[] | null>('competition_winners', null)
      if (cloudWinners && Array.isArray(cloudWinners) && cloudWinners.length > 0) {
        localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(cloudWinners))
        window.dispatchEvent(new CustomEvent('ogsoreg_winners_updated'))
      }

      // 3. Certificates Sync
      const cloudCerts = await cloudSyncService.getCloudSetting<PeriodCertificate[] | null>('competition_certificates', null)
      if (cloudCerts && Array.isArray(cloudCerts) && cloudCerts.length > 0) {
        localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(cloudCerts))
        window.dispatchEvent(new CustomEvent('ogsoreg_certificates_updated'))
      }
    } catch (err) {
      console.warn('[ParticipantPeriodService] Cloud sync error:', err)
    } finally {
      this.isCloudSyncing = false
    }
  }

  // Periods: Guaranteed to always sort newest to oldest
  getPeriods(): CompetitionPeriod[] {
    if (typeof window === 'undefined') return sortPeriodsNewestFirst(INITIAL_PERIODS)
    try {
      const raw = localStorage.getItem(PERIODS_STORAGE_KEY)
      let list: CompetitionPeriod[]
      if (!raw) {
        list = sortPeriodsNewestFirst(INITIAL_PERIODS)
      } else {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default INITIAL_PERIODS are merged if missing
          const existingIds = new Set(parsed.map((p) => p?.id))
          const missing = INITIAL_PERIODS.filter((ip) => !existingIds.has(ip.id))
          const combined = missing.length > 0 ? [...parsed, ...missing] : parsed
          list = sortPeriodsNewestFirst(combined)
        } else {
          list = sortPeriodsNewestFirst(INITIAL_PERIODS)
        }
      }

      // Always dynamically calculate and sync total_winners from actual winners in storage
      const allWinners = this.getWinners()
      const synced = list.map((p) => {
        const pWinners = allWinners.filter((w) => {
          if (!w || !w.period_id) return false
          if (w.period_id === p.id || (p.slug && w.period_id === p.slug)) return true
          if (p.id.startsWith('period-') && w.period_id === p.id.replace('period-', '')) return true
          return false
        })
        return {
          ...p,
          total_winners: pWinners.length,
        }
      })

      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(synced))
      return synced
    } catch {
      return sortPeriodsNewestFirst(INITIAL_PERIODS)
    }
  }

  getPeriodById(id: string): CompetitionPeriod | null {
    const list = this.getPeriods()
    if (!Array.isArray(list)) return null
    return list.find((p) => p && (p.id === id || p.slug === id)) || null
  }

  savePeriod(period: Partial<CompetitionPeriod> & { name: string; year: number }): CompetitionPeriod {
    const list = this.getPeriods()
    const id = period.id || `period-ogso-${period.year}-${Date.now().toString(36)}`
    const slug = period.slug || `ogso-${period.year}`
    const now = new Date().toISOString()

    const existingIdx = list.findIndex((p) => p && p.id === id)
    let saved: CompetitionPeriod

    if (existingIdx >= 0) {
      saved = {
        ...list[existingIdx],
        ...period,
        id,
        slug,
        year: Number(period.year),
        updated_at: now,
      }
      list[existingIdx] = saved
    } else {
      saved = {
        id,
        name: period.name,
        slug,
        year: Number(period.year),
        description: period.description || `Olimpiade Gontor Sains & Matematika ${period.year}`,
        status: period.status || 'active',
        start_date: period.start_date || `${period.year}-01-01`,
        end_date: period.end_date || `${period.year}-12-31`,
        is_published: period.is_published !== undefined ? period.is_published : true,
        created_at: now,
        updated_at: now,
      }
      list.push(saved)
    }

    // Always sort newest to oldest when saving any period
    const sorted = sortPeriodsNewestFirst(list)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(sorted))
      window.dispatchEvent(new CustomEvent('ogsoreg_periods_updated'))
    }

    // Persist to Cloud
    cloudSyncService.saveCloudSetting('competition_periods', sorted)
    return saved
  }

  deletePeriod(id: string): boolean {
    const list = this.getPeriods().filter((p) => p && p.id !== id)
    const sorted = sortPeriodsNewestFirst(list)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(sorted))
      window.dispatchEvent(new CustomEvent('ogsoreg_periods_updated'))
    }

    // Persist to Cloud
    cloudSyncService.saveCloudSetting('competition_periods', sorted)
    return true
  }

  // One-time migration for winners
  private ensureWinnersMigrated(): void {
    if (typeof window === 'undefined') return
    const isMigrated = localStorage.getItem(WINNERS_MIGRATED_FLAG) === 'true'
    if (isMigrated) return

    const combinedMap = new Map<string, PeriodWinner>()
    const deletedSet = getDeletedWinnerIds()
    const PREVIOUS_KEYS = [
      'ogsoreg_period_winners_v5',
      'ogsoreg_period_winners_v4',
      'ogsoreg_period_winners_v3',
      'ogsoreg_period_winners_v2',
      'ogsoreg_period_winners_v1',
      'ogsoreg_period_winners',
    ]

    for (const key of PREVIOUS_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.id && !combinedMap.has(item.id) && !deletedSet.has(item.id)) {
                combinedMap.set(item.id, item)
              }
            }
          }
        } catch {}
      }
    }

    const list = Array.from(combinedMap.values()).filter((w) => {
      if (!w || !w.student_name) return false
      const nameLower = (w.student_name || '').trim().toLowerCase()
      const isDummy =
        DUMMY_STUDENT_NAMES.has(nameLower) &&
        (DUMMY_WINNER_IDS.has(w.id) || w.id.startsWith('win-2025-') || w.id.startsWith('win-2026-'))
      return !isDummy && !deletedSet.has(w.id)
    })

    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    localStorage.setItem(WINNERS_MIGRATED_FLAG, 'true')
  }

  // Winners
  getWinners(periodId?: string): PeriodWinner[] {
    if (typeof window === 'undefined') {
      return []
    }
    this.ensureWinnersMigrated()

    const deletedSet = getDeletedWinnerIds()
    let list: PeriodWinner[] = []

    try {
      const raw = localStorage.getItem(WINNERS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          list = parsed.filter((w) => w && w.id && !deletedSet.has(w.id))
        }
      }
    } catch {
      list = []
    }

    if (periodId) {
      list = list.filter((w) => {
        if (!w || !w.period_id) return false
        if (w.period_id === periodId) return true
        if (periodId.startsWith('period-') && w.period_id === periodId.replace('period-', '')) return true
        if (!periodId.startsWith('period-') && w.period_id === `period-${periodId}`) return true
        return false
      })
    }

    const normalized = list.map((w) => {
      const isLegacy = isPeriodLegacyYear(w.period_id)
      return {
        ...w,
        jenjang: isLegacy ? undefined : w.jenjang,
        category: normalizeCategoryName(w.category),
      }
    })

    // Always sort winners in standard order: Juara 1, Juara 2, Juara 3, Juara Harapan 1, Juara Harapan 2
    return [...normalized].sort((a, b) => {
      const rankA = getAwardRank(a?.award)
      const rankB = getAwardRank(b?.award)
      if (rankA !== rankB) return rankA - rankB
      const catA = (a?.category || a?.jenjang || '').toLowerCase()
      const catB = (b?.category || b?.jenjang || '').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (b?.score ?? 0) - (a?.score ?? 0)
    })
  }

  saveWinner(winner: Omit<PeriodWinner, 'id' | 'created_at'> & { id?: string }): PeriodWinner {
    if (typeof window === 'undefined') {
      return { ...winner, id: winner.id || 'tmp', created_at: new Date().toISOString() } as PeriodWinner
    }
    this.ensureWinnersMigrated()

    const list = this.getWinners() // gets all winners across all periods
    const id = winner.id || `win-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()
    const normalizedCategory = normalizeCategoryName(winner.category)
    const isLegacy = isPeriodLegacyYear(winner.period_id)
    const sanitizedJenjang = isLegacy ? undefined : winner.jenjang

    const existingIdx = list.findIndex((w) => w.id === id)
    let saved: PeriodWinner

    if (existingIdx >= 0) {
      saved = {
        ...list[existingIdx],
        ...winner,
        id,
        category: normalizedCategory,
        jenjang: sanitizedJenjang,
      }
      list[existingIdx] = saved
    } else {
      saved = {
        ...winner,
        id,
        category: normalizedCategory,
        jenjang: sanitizedJenjang,
        created_at: now,
      }
      list.unshift(saved)
    }

    // If previously marked deleted, unmark it
    removeDeletedWinnerId(id)

    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ogsoreg_winners_updated'))
    }
    cloudSyncService.saveCloudSetting('competition_winners', list)
    return saved
  }

  deleteWinner(id: string): boolean {
    if (typeof window === 'undefined') return true
    this.ensureWinnersMigrated()
    addDeletedWinnerIds([id])

    const list = this.getWinners().filter((w) => w.id !== id)
    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('ogsoreg_winners_updated'))
    cloudSyncService.saveCloudSetting('competition_winners', list)
    return true
  }

  deleteMultipleWinners(ids: string[]): boolean {
    if (typeof window === 'undefined') return true
    this.ensureWinnersMigrated()
    addDeletedWinnerIds(ids)

    const idSet = new Set(ids)
    const list = this.getWinners().filter((w) => !idSet.has(w.id))
    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('ogsoreg_winners_updated'))
    cloudSyncService.saveCloudSetting('competition_winners', list)
    return true
  }

  // One-time migration for certificates
  private ensureCertsMigrated(): void {
    if (typeof window === 'undefined') return
    const isMigrated = localStorage.getItem(CERTS_MIGRATED_FLAG) === 'true'
    if (isMigrated) return

    const combinedMap = new Map<string, PeriodCertificate>()
    const deletedSet = getDeletedCertIds()
    const PREV_CERT_KEYS = [
      'ogsoreg_period_certs_v5',
      'ogsoreg_period_certs_v4',
      'ogsoreg_period_certs_v3',
      'ogsoreg_period_certs_v2',
      'ogsoreg_period_certs_v1',
    ]

    for (const key of PREV_CERT_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.id && !combinedMap.has(item.id) && !deletedSet.has(item.id)) {
                combinedMap.set(item.id, item)
              }
            }
          }
        } catch {}
      }
    }

    addDeletedCertIds([
      'cert-part-2026-01',
      'cert-part-2026-02',
      'cert-part-2026-03',
    ])

    const list = Array.from(combinedMap.values()).filter((c) => {
      if (!c) return false
      return !isInvalidCert(c) && !deletedSet.has(c.id)
    })

    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
    localStorage.setItem(CERTS_MIGRATED_FLAG, 'true')
  }

  // Certificates
  getCertificates(periodId?: string, type?: 'winner' | 'participant'): PeriodCertificate[] {
    if (typeof window === 'undefined') {
      return []
    }
    this.ensureCertsMigrated()

    const deletedSet = getDeletedCertIds()
    let list: PeriodCertificate[] = []

    try {
      const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const originalLen = parsed.length
          list = parsed.filter((c) => c && c.id && !deletedSet.has(c.id) && !isInvalidCert(c))
          // Auto-persist pruned list if any invalid or unstarted 2026 participant certs were present
          if (list.length !== originalLen) {
            localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
          }
        }
      }
    } catch {
      list = []
    }

    if (periodId) {
      list = list.filter((c) => c && c.period_id === periodId)
    }
    if (type) {
      list = list.filter((c) => c && c.certificate_type === type)
    }

    return list.map((c) => {
      const isLegacy = isPeriodLegacyYear(c.period_id)
      return {
        ...c,
        jenjang: isLegacy ? undefined : c.jenjang,
      }
    })
  }

  getCertificateById(id: string): PeriodCertificate | null {
    const list = this.getCertificates()
    return list.find((c) => c.id === id || c.certificate_number === id || c.verification_code === id) || null
  }

  saveCertificate(cert: Omit<PeriodCertificate, 'id' | 'created_at'> & { id?: string }): PeriodCertificate {
    const list = this.getCertificates()
    const id = cert.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()
    const isLegacy = isPeriodLegacyYear(cert.period_id)
    const sanitizedJenjang = isLegacy ? undefined : cert.jenjang

    const existingIdx = list.findIndex((c) => c.id === id)
    let saved: PeriodCertificate

    if (existingIdx >= 0) {
      saved = {
        ...list[existingIdx],
        ...cert,
        id,
        jenjang: sanitizedJenjang,
      }
      list[existingIdx] = saved
    } else {
      saved = {
        ...cert,
        id,
        jenjang: sanitizedJenjang,
        created_at: now,
      }
      list.unshift(saved)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('ogsoreg_certificates_updated'))
    }
    cloudSyncService.saveCloudSetting('competition_certificates', list)
    return saved
  }

  deleteCertificate(id: string): boolean {
    if (typeof window === 'undefined') return true
    this.ensureCertsMigrated()
    addDeletedCertIds([id])

    const list = this.getCertificates().filter((c) => c.id !== id)
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('ogsoreg_certificates_updated'))
    cloudSyncService.saveCloudSetting('competition_certificates', list)
    return true
  }
}

export const participantPeriodService = new ParticipantPeriodService()
