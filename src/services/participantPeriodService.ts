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

const INITIAL_WINNERS: PeriodWinner[] = [
  {
    id: 'win-2026-01',
    period_id: 'period-ogso-2026',
    student_name: 'Nainawa Annabila',
    nisn_username: 'nainawaannabila',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 1',
    award: 'Juara 1',
    category: 'Matematika Terpadu',
    score: 98.5,
    certificate_id: 'cert-win-2026-01',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'win-2026-02',
    period_id: 'period-ogso-2026',
    student_name: 'Nashir Azzuhri',
    nisn_username: 'nashirazzuhri',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 2',
    award: 'Juara 1',
    category: 'Sains Alam',
    score: 96.0,
    certificate_id: 'cert-win-2026-02',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'win-2026-03',
    period_id: 'period-ogso-2026',
    student_name: 'Amanda Nur',
    nisn_username: 'amandanur',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 3',
    award: 'Juara 2',
    category: 'Matematika Terpadu',
    score: 92.0,
    certificate_id: 'cert-win-2026-03',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'win-2026-04',
    period_id: 'period-ogso-2026',
    student_name: 'Lathiif Rahman',
    nisn_username: 'lathiif',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 4',
    award: 'Juara 3',
    category: 'Sains Alam',
    score: 91.5,
    certificate_id: 'cert-win-2026-04',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'win-2026-05',
    period_id: 'period-ogso-2026',
    student_name: 'Alya Nashwa',
    nisn_username: 'alyamuthianashwa',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 5',
    award: 'Juara Harapan 1',
    category: 'Matematika Lanjutan',
    score: 89.0,
    certificate_id: 'cert-win-2026-05',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'win-2026-06',
    period_id: 'period-ogso-2026',
    student_name: 'Ghovva Marshandi',
    nisn_username: 'ghovva',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 5',
    award: 'Juara Harapan 2',
    category: 'Matematika Lanjutan',
    score: 86.5,
    certificate_id: 'cert-win-2026-06',
    created_at: '2026-10-15T08:00:00Z',
  },
  // OGSO 2025 Winners (Legacy format: tanpa jenjang, dropdown kategori lomba berurutan Juara 1 - Juara Harapan 2)
  {
    id: 'win-2025-01',
    period_id: 'period-ogso-2025',
    student_name: 'Fikri Haikal',
    nisn_username: 'fikrihaikal',
    campus: 'Gontor 1',
    award: 'Juara 1',
    category: 'IPA Shigor',
    score: 97.0,
    certificate_id: 'cert-win-2025-01',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-02',
    period_id: 'period-ogso-2025',
    student_name: 'Rayhan Al-Ghifari',
    nisn_username: 'rayhanalghifari',
    campus: 'Gontor 2',
    award: 'Juara 2',
    category: 'IPA Shigor',
    score: 94.0,
    certificate_id: 'cert-win-2025-02',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-03',
    period_id: 'period-ogso-2025',
    student_name: 'Zahra Kamila',
    nisn_username: 'zahrakamila',
    campus: 'Gontor Putri 1',
    award: 'Juara 3',
    category: 'IPA Shigor',
    score: 91.5,
    certificate_id: 'cert-win-2025-03',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-04',
    period_id: 'period-ogso-2025',
    student_name: 'Ahmad Fauzi',
    nisn_username: 'ahmadfauzi',
    campus: 'Gontor 3',
    award: 'Juara Harapan 1',
    category: 'IPA Shigor',
    score: 88.0,
    certificate_id: 'cert-win-2025-04',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-05',
    period_id: 'period-ogso-2025',
    student_name: 'Syifa Az-Zahra',
    nisn_username: 'syifaazzahra',
    campus: 'Gontor Putri 2',
    award: 'Juara Harapan 2',
    category: 'IPA Shigor',
    score: 85.5,
    certificate_id: 'cert-win-2025-05',
    created_at: '2025-10-20T08:00:00Z',
  },
  // MTK Shigor
  {
    id: 'win-2025-06',
    period_id: 'period-ogso-2025',
    student_name: 'M. Rizky Pratama',
    nisn_username: 'rizkypratama',
    campus: 'Gontor 1',
    award: 'Juara 1',
    category: 'MTK Shigor',
    score: 98.0,
    certificate_id: 'cert-win-2025-06',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-07',
    period_id: 'period-ogso-2025',
    student_name: 'Annisa Rahmawati',
    nisn_username: 'annisa',
    campus: 'Gontor Putri 1',
    award: 'Juara 2',
    category: 'MTK Shigor',
    score: 95.0,
    certificate_id: 'cert-win-2025-07',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-08',
    period_id: 'period-ogso-2025',
    student_name: 'Dafa Al-Fatih',
    nisn_username: 'dafaalfatih',
    campus: 'Gontor 2',
    award: 'Juara 3',
    category: 'MTK Shigor',
    score: 92.0,
    certificate_id: 'cert-win-2025-08',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-09',
    period_id: 'period-ogso-2025',
    student_name: 'Nurul Hidayah',
    nisn_username: 'nurulhidayah',
    campus: 'Gontor Putri 2',
    award: 'Juara Harapan 1',
    category: 'MTK Shigor',
    score: 89.0,
    certificate_id: 'cert-win-2025-09',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-10',
    period_id: 'period-ogso-2025',
    student_name: 'Salman Farisi',
    nisn_username: 'salmanfarisi',
    campus: 'Gontor 3',
    award: 'Juara Harapan 2',
    category: 'MTK Shigor',
    score: 87.0,
    certificate_id: 'cert-win-2025-10',
    created_at: '2025-10-20T08:00:00Z',
  },
  // DMS
  {
    id: 'win-2025-11',
    period_id: 'period-ogso-2025',
    student_name: 'Bilal Akbar',
    nisn_username: 'bilalakbar',
    campus: 'Gontor 1',
    award: 'Juara 1',
    category: 'DMS (Darussalam Math and Science)',
    score: 99.0,
    certificate_id: 'cert-win-2025-11',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-12',
    period_id: 'period-ogso-2025',
    student_name: 'Maryam Jameela',
    nisn_username: 'maryamjameela',
    campus: 'Gontor Putri 1',
    award: 'Juara 2',
    category: 'DMS (Darussalam Math and Science)',
    score: 96.0,
    certificate_id: 'cert-win-2025-12',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-13',
    period_id: 'period-ogso-2025',
    student_name: 'Dzaky Mubarak',
    nisn_username: 'dzakymubarak',
    campus: 'Gontor 2',
    award: 'Juara 3',
    category: 'DMS (Darussalam Math and Science)',
    score: 93.5,
    certificate_id: 'cert-win-2025-13',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-14',
    period_id: 'period-ogso-2025',
    student_name: 'Khadijah Al-Kubro',
    nisn_username: 'khadijah',
    campus: 'Gontor Putri 2',
    award: 'Juara Harapan 1',
    category: 'DMS (Darussalam Math and Science)',
    score: 90.0,
    certificate_id: 'cert-win-2025-14',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'win-2025-15',
    period_id: 'period-ogso-2025',
    student_name: 'Tariq Ziyad',
    nisn_username: 'tariqziyad',
    campus: 'Gontor 3',
    award: 'Juara Harapan 2',
    category: 'DMS (Darussalam Math and Science)',
    score: 87.5,
    certificate_id: 'cert-win-2025-15',
    created_at: '2025-10-20T08:00:00Z',
  },
]

const INITIAL_CERTIFICATES: PeriodCertificate[] = [
  {
    id: 'cert-win-2026-01',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/WIN-001',
    certificate_type: 'winner',
    recipient_name: 'Nainawa Annabila',
    nisn_username: 'nainawaannabila',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 1',
    award_title: 'Juara 1 — Matematika Terpadu Jenjang 1',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-001-NA',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-win-2026-02',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/WIN-002',
    certificate_type: 'winner',
    recipient_name: 'Nashir Azzuhri',
    nisn_username: 'nashirazzuhri',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 2',
    award_title: 'Juara 1 — Sains Alam Jenjang 2',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-002-NZ',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-win-2026-03',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/WIN-003',
    certificate_type: 'winner',
    recipient_name: 'Amanda Nur',
    nisn_username: 'amandanur',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 3',
    award_title: 'Juara 2 — Matematika Terpadu Jenjang 3',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-003-AN',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-win-2026-04',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/WIN-004',
    certificate_type: 'winner',
    recipient_name: 'Lathiif Rahman',
    nisn_username: 'lathiif',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 4',
    award_title: 'Juara 3 — Sains Alam Jenjang 4',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-004-LR',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-win-2026-05',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/WIN-005',
    certificate_type: 'winner',
    recipient_name: 'Alya Nashwa',
    nisn_username: 'alyamuthianashwa',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 5',
    award_title: 'Juara Harapan 1 — Matematika Lanjutan Jenjang 5',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-005-AN',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-win-2026-06',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/WIN-006',
    certificate_type: 'winner',
    recipient_name: 'Ghovva Marshandi',
    nisn_username: 'ghovva',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 5',
    award_title: 'Juara Harapan 2 — Matematika Lanjutan Jenjang 5',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-006-GM',
    created_at: '2026-10-15T08:00:00Z',
  },
  // Participant certificates 2026
  {
    id: 'cert-part-2026-01',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/PART-001',
    certificate_type: 'participant',
    recipient_name: 'Humaira Salsabila',
    nisn_username: 'humaira',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 2',
    award_title: 'Peserta Resmi Olimpiade Gontor Sains & Matematika 2026',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-PART-001',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-part-2026-02',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/PART-002',
    certificate_type: 'participant',
    recipient_name: 'Farhan Ramadhan',
    nisn_username: 'farhanramadhan',
    campus: 'Gontor 1',
    jenjang: 'Jenjang 1',
    award_title: 'Peserta Resmi Olimpiade Gontor Sains & Matematika 2026',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-PART-002',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'cert-part-2026-03',
    period_id: 'period-ogso-2026',
    certificate_number: 'OGSO/2026/PART-003',
    certificate_type: 'participant',
    recipient_name: 'Nur Amanda',
    nisn_username: 'amandanur1',
    campus: 'Gontor Putri 1',
    jenjang: 'Jenjang 2',
    award_title: 'Peserta Resmi Olimpiade Gontor Sains & Matematika 2026',
    issue_date: '2026-10-17',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2026-PART-003',
    created_at: '2026-10-15T08:00:00Z',
  },
  // OGSO 2025 Certificates (Legacy format: tanpa jenjang)
  {
    id: 'cert-win-2025-01',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-001',
    certificate_type: 'winner',
    recipient_name: 'Fikri Haikal',
    nisn_username: 'fikrihaikal',
    campus: 'Gontor 1',
    award_title: 'Juara 1 — IPA Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-001-FH',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-02',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-002',
    certificate_type: 'winner',
    recipient_name: 'Rayhan Al-Ghifari',
    nisn_username: 'rayhanalghifari',
    campus: 'Gontor 2',
    award_title: 'Juara 2 — IPA Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-002-RG',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-03',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-003',
    certificate_type: 'winner',
    recipient_name: 'Zahra Kamila',
    nisn_username: 'zahrakamila',
    campus: 'Gontor Putri 1',
    award_title: 'Juara 3 — IPA Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-003-ZK',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-04',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-004',
    certificate_type: 'winner',
    recipient_name: 'Ahmad Fauzi',
    nisn_username: 'ahmadfauzi',
    campus: 'Gontor 3',
    award_title: 'Juara Harapan 1 — IPA Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-004-AF',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-05',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-005',
    certificate_type: 'winner',
    recipient_name: 'Syifa Az-Zahra',
    nisn_username: 'syifaazzahra',
    campus: 'Gontor Putri 2',
    award_title: 'Juara Harapan 2 — IPA Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-005-SZ',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-06',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-006',
    certificate_type: 'winner',
    recipient_name: 'M. Rizky Pratama',
    nisn_username: 'rizkypratama',
    campus: 'Gontor 1',
    award_title: 'Juara 1 — MTK Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-006-RP',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-07',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-007',
    certificate_type: 'winner',
    recipient_name: 'Annisa Rahmawati',
    nisn_username: 'annisa',
    campus: 'Gontor Putri 1',
    award_title: 'Juara 2 — MTK Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-007-AR',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-08',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-008',
    certificate_type: 'winner',
    recipient_name: 'Dafa Al-Fatih',
    nisn_username: 'dafaalfatih',
    campus: 'Gontor 2',
    award_title: 'Juara 3 — MTK Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-008-DA',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-09',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-009',
    certificate_type: 'winner',
    recipient_name: 'Nurul Hidayah',
    nisn_username: 'nurulhidayah',
    campus: 'Gontor Putri 2',
    award_title: 'Juara Harapan 1 — MTK Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-009-NH',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-win-2025-10',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/WIN-010',
    certificate_type: 'winner',
    recipient_name: 'Salman Farisi',
    nisn_username: 'salmanfarisi',
    campus: 'Gontor 3',
    award_title: 'Juara Harapan 2 — MTK Shigor',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-010-SF',
    created_at: '2025-10-20T08:00:00Z',
  },
  {
    id: 'cert-part-2025-01',
    period_id: 'period-ogso-2025',
    certificate_number: 'OGSO/2025/PART-001',
    certificate_type: 'participant',
    recipient_name: 'M. Wildan Pratama',
    nisn_username: 'wildanpratama',
    campus: 'Gontor 1',
    award_title: 'Peserta Resmi Olimpiade Gontor Sains & Matematika 2025',
    issue_date: '2025-10-25',
    is_published: true,
    is_revoked: false,
    verification_code: 'OGSO-VER-2025-PART-001',
    created_at: '2025-10-20T08:00:00Z',
  },
]

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
      list = INITIAL_WINNERS
    } else {
      try {
        const raw = localStorage.getItem(WINNERS_STORAGE_KEY)
        if (!raw) {
          localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(INITIAL_WINNERS))
          list = INITIAL_WINNERS
        } else {
          list = JSON.parse(raw)
        }
      } catch {
        list = INITIAL_WINNERS
      }
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

  // Certificates
  getCertificates(periodId?: string, type?: 'winner' | 'participant'): PeriodCertificate[] {
    let list: PeriodCertificate[] = []
    if (typeof window === 'undefined') {
      list = INITIAL_CERTIFICATES
    } else {
      try {
        const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY)
        if (!raw) {
          localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES))
          list = INITIAL_CERTIFICATES
        } else {
          list = JSON.parse(raw)
        }
      } catch {
        list = INITIAL_CERTIFICATES
      }
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
