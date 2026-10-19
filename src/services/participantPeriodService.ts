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
export const getAwardRank = (award?: string): number => {
  if (!award) return 999
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

const PERIODS_STORAGE_KEY = 'ogsoreg_periods_v4'
const WINNERS_STORAGE_KEY = 'ogsoreg_period_winners_v4'
const CERTIFICATES_STORAGE_KEY = 'ogsoreg_period_certs_v4'

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
      return JSON.parse(raw)
    } catch {
      return INITIAL_PERIODS
    }
  }

  getPeriodById(id: string): CompetitionPeriod | null {
    const list = this.getPeriods()
    return list.find((p) => p.id === id || p.slug === id) || null
  }

  savePeriod(period: Partial<CompetitionPeriod> & { name: string; year: number }): CompetitionPeriod {
    const list = this.getPeriods()
    const id = period.id || `period-ogso-${period.year}-${Date.now().toString(36)}`
    const slug = period.slug || `ogso-${period.year}`
    const now = new Date().toISOString()

    const existingIdx = list.findIndex((p) => p.id === id)
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
    const list = this.getPeriods().filter((p) => p.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }

  // Winners
  getWinners(periodId?: string): PeriodWinner[] {
    let list: PeriodWinner[] = []
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const activeRaw = localStorage.getItem(WINNERS_STORAGE_KEY)
      const combinedMap = new Map<string, PeriodWinner>()

      // 1. Recover from active storage key
      if (activeRaw) {
        try {
          const parsed = JSON.parse(activeRaw)
          if (Array.isArray(parsed)) {
            parsed.forEach((w) => {
              if (w && w.id) combinedMap.set(w.id, w)
            })
          }
        } catch {}
      }

      // 2. Scan previous storage keys to restore user's manual inputs
      const PREVIOUS_KEYS = [
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
                if (item && item.id && !combinedMap.has(item.id)) {
                  combinedMap.set(item.id, item)
                }
              }
            }
          } catch {}
        }
      }

      // 3. Purge dummy data: remove items that match dummy student names & dummy seed IDs
      list = Array.from(combinedMap.values()).filter((w) => {
        if (!w || !w.student_name) return false
        const nameLower = w.student_name.trim().toLowerCase()
        const isDummy =
          DUMMY_STUDENT_NAMES.has(nameLower) &&
          (DUMMY_WINNER_IDS.has(w.id) || w.id.startsWith('win-2025-') || w.id.startsWith('win-2026-'))
        return !isDummy
      })

      // Sync cleaned user data back into current storage key
      localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    } catch {
      list = []
    }

    if (periodId) {
      list = list.filter((w) => w.period_id === periodId)
    }

    // Always sort winners in standard order: Juara 1, Juara 2, Juara 3, Juara Harapan 1, Juara Harapan 2
    return [...list].sort((a, b) => {
      const rankA = getAwardRank(a.award)
      const rankB = getAwardRank(b.award)
      if (rankA !== rankB) return rankA - rankB
      const catA = (a.category || a.jenjang || '').toLowerCase()
      const catB = (b.category || b.jenjang || '').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (b.score ?? 0) - (a.score ?? 0)
    })
  }

  saveWinner(winner: Omit<PeriodWinner, 'id' | 'created_at'> & { id?: string }): PeriodWinner {
    const list = this.getWinners()
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

    if (typeof window !== 'undefined') {
      localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    }
    return saved
  }

  deleteWinner(id: string): boolean {
    const list = this.getWinners().filter((w) => w.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }

  deleteMultipleWinners(ids: string[]): boolean {
    const idSet = new Set(ids)
    const list = this.getWinners().filter((w) => !idSet.has(w.id))
    if (typeof window !== 'undefined') {
      localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }

  // Certificates
  getCertificates(periodId?: string, type?: 'winner' | 'participant'): PeriodCertificate[] {
    let list: PeriodCertificate[] = []
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const activeRaw = localStorage.getItem(CERTIFICATES_STORAGE_KEY)
      const combinedMap = new Map<string, PeriodCertificate>()

      if (activeRaw) {
        try {
          const parsed = JSON.parse(activeRaw)
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              if (c && c.id) combinedMap.set(c.id, c)
            })
          }
        } catch {}
      }

      const PREV_CERT_KEYS = [
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
                if (item && item.id && !combinedMap.has(item.id)) {
                  combinedMap.set(item.id, item)
                }
              }
            }
          } catch {}
        }
      }

      // Purge dummy certs whose recipient matches dummy student names
      list = Array.from(combinedMap.values()).filter((c) => {
        if (!c || !c.recipient_name) return false
        const nameLower = c.recipient_name.trim().toLowerCase()
        return !DUMMY_STUDENT_NAMES.has(nameLower)
      })

      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
    } catch {
      list = []
    }

    if (periodId) {
      list = list.filter((c) => c.period_id === periodId)
    }
    if (type) {
      list = list.filter((c) => c.certificate_type === type)
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
    const list = this.getCertificates().filter((c) => c.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }
}

export const participantPeriodService = new ParticipantPeriodService()
