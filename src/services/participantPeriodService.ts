import type { StudentJenjang } from '../types/student'

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

// Initial seed periods for OGSO
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
    total_winners: 6,
    total_participants: 24,
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
  'lathiif rahman',
  'alya nashwa',
  'ghovva marshandi',
])

export const DUMMY_WINNER_IDS = new Set([
  'win-2026-01', 'win-2026-02', 'win-2026-03', 'win-2026-04', 'win-2026-05', 'win-2026-06',
  'win-2025-01', 'win-2025-02', 'win-2025-03', 'win-2025-04', 'win-2025-05', 'win-2025-06',
  'win-2025-07', 'win-2025-08', 'win-2025-09', 'win-2025-10', 'win-2025-11', 'win-2025-12',
  'win-2025-13', 'win-2025-14', 'win-2025-15',
])

class ParticipantPeriodService {
  // Periods
  getPeriods(): CompetitionPeriod[] {
    if (typeof window === 'undefined') return INITIAL_PERIODS
    try {
      const raw = localStorage.getItem(PERIODS_STORAGE_KEY)
      if (!raw) {
        localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(INITIAL_PERIODS))
        return INITIAL_PERIODS
      }
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default INITIAL_PERIODS are merged if missing
        const existingIds = new Set(parsed.map((p) => p?.id))
        const missing = INITIAL_PERIODS.filter((ip) => !existingIds.has(ip.id))
        if (missing.length > 0) {
          const merged = [...parsed, ...missing]
          localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(merged))
          return merged
        }
        return parsed
      }
      return INITIAL_PERIODS
    } catch {
      return INITIAL_PERIODS
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
        updated_at: now,
      }
      list[existingIdx] = saved
    } else {
      saved = {
        id,
        name: period.name,
        slug,
        year: period.year,
        description: period.description || `Olimpiade Gontor Sains & Matematika ${period.year}`,
        status: period.status || 'active',
        start_date: period.start_date || `${period.year}-01-01`,
        end_date: period.end_date || `${period.year}-12-31`,
        is_published: period.is_published !== undefined ? period.is_published : true,
        created_at: now,
        updated_at: now,
      }
      list.unshift(saved)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(list))
    }
    return saved
  }

  deletePeriod(id: string): boolean {
    const list = this.getPeriods().filter((p) => p && p.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(list))
    }
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
      list = list.filter((w) => w && w.period_id === periodId)
    }

    // Always sort winners in standard order: Juara 1, Juara 2, Juara 3, Juara Harapan 1, Juara Harapan 2
    return [...list].sort((a, b) => {
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

    const existingIdx = list.findIndex((w) => w.id === id)
    let saved: PeriodWinner

    if (existingIdx >= 0) {
      saved = { ...list[existingIdx], ...winner, id }
      list[existingIdx] = saved
    } else {
      saved = {
        ...winner,
        id,
        created_at: now,
      }
      list.unshift(saved)
    }

    // If previously marked deleted, unmark it
    removeDeletedWinnerId(id)

    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    return saved
  }

  deleteWinner(id: string): boolean {
    if (typeof window === 'undefined') return true
    this.ensureWinnersMigrated()
    addDeletedWinnerIds([id])

    const list = this.getWinners().filter((w) => w.id !== id)
    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    return true
  }

  deleteMultipleWinners(ids: string[]): boolean {
    if (typeof window === 'undefined') return true
    this.ensureWinnersMigrated()
    addDeletedWinnerIds(ids)

    const idSet = new Set(ids)
    const list = this.getWinners().filter((w) => !idSet.has(w.id))
    localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
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

    const list = Array.from(combinedMap.values()).filter((c) => {
      if (!c) return false
      const recName = c.recipient_name || (c as unknown as { student_name?: string }).student_name || ''
      if (!recName) return false
      const nameLower = recName.trim().toLowerCase()
      return !DUMMY_STUDENT_NAMES.has(nameLower) && !deletedSet.has(c.id)
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
          list = parsed.filter((c) => c && c.id && !deletedSet.has(c.id))
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
    return list
  }

  getCertificateById(id: string): PeriodCertificate | null {
    const list = this.getCertificates()
    return list.find((c) => c.id === id || c.certificate_number === id || c.verification_code === id) || null
  }

  saveCertificate(cert: Omit<PeriodCertificate, 'id' | 'created_at'> & { id?: string }): PeriodCertificate {
    const list = this.getCertificates()
    const id = cert.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const existingIdx = list.findIndex((c) => c.id === id)
    let saved: PeriodCertificate

    if (existingIdx >= 0) {
      saved = { ...list[existingIdx], ...cert, id }
      list[existingIdx] = saved
    } else {
      saved = {
        ...cert,
        id,
        created_at: now,
      }
      list.unshift(saved)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
    }
    return saved
  }

  deleteCertificate(id: string): boolean {
    if (typeof window === 'undefined') return true
    this.ensureCertsMigrated()
    addDeletedCertIds([id])

    const list = this.getCertificates().filter((c) => c.id !== id)
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
    return true
  }
}

export const participantPeriodService = new ParticipantPeriodService()
