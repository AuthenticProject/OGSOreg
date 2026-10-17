export type StudentJenjang = 'Jenjang 1' | 'Jenjang 2' | 'Jenjang 3' | 'Jenjang 4' | 'Jenjang 5'
export type StudentKelas = 'Kelas 1' | 'Kelas 2' | 'Kelas 1 Int' | 'Kelas 3' | 'Kelas 3 Int' | 'Kelas 4' | 'Kelas 5'
export type StudentSource = 'excel' | 'csv' | 'manual' | 'paste'
export type StudentSyncStatus = 'local_only' | 'exported' | 'synced' | 'enrolled' | 'failed'

export const STUDENT_JENJANG_OPTIONS: StudentJenjang[] = [
  'Jenjang 1',
  'Jenjang 2',
  'Jenjang 3',
  'Jenjang 4',
  'Jenjang 5',
]

export const STUDENT_KELAS_OPTIONS: StudentKelas[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 1 Int',
  'Kelas 3',
  'Kelas 3 Int',
  'Kelas 4',
  'Kelas 5',
]

/**
 * Pemetaan resmi Jenjang Lomba OGSO ke Kelas Santri:
 * - Jenjang 1 = Kelas 1
 * - Jenjang 2 = Kelas 2
 * - Jenjang 3 = Kelas 1 Int dan Kelas 3
 * - Jenjang 4 = Kelas 3 Int dan Kelas 4
 * - Jenjang 5 = Kelas 5
 */
export const JENJANG_TO_KELAS_MAP: Record<StudentJenjang, StudentKelas[]> = {
  'Jenjang 1': ['Kelas 1'],
  'Jenjang 2': ['Kelas 2'],
  'Jenjang 3': ['Kelas 1 Int', 'Kelas 3'],
  'Jenjang 4': ['Kelas 3 Int', 'Kelas 4'],
  'Jenjang 5': ['Kelas 5'],
}

export const KELAS_TO_JENJANG_MAP: Record<StudentKelas, StudentJenjang> = {
  'Kelas 1': 'Jenjang 1',
  'Kelas 2': 'Jenjang 2',
  'Kelas 1 Int': 'Jenjang 3',
  'Kelas 3': 'Jenjang 3',
  'Kelas 3 Int': 'Jenjang 4',
  'Kelas 4': 'Jenjang 4',
  'Kelas 5': 'Jenjang 5',
}

export function getAllowedClassesForJenjang(jenjang: string): StudentKelas[] {
  const key = jenjang as StudentJenjang
  return JENJANG_TO_KELAS_MAP[key] || []
}

/**
 * Mengekstrak tingkat kelas dasar (Kelas 1 - Kelas 5, Kelas 1 Int, Kelas 3 Int)
 * dari format penulisan kelas santri (misal: 5-C -> Kelas 5, 5-S -> Kelas 5, 1-B -> Kelas 1, 1-Int-C -> Kelas 1 Int).
 */
export function extractGradeLevelFromKelas(kelas: string): StudentKelas | null {
  if (!kelas) return null
  const clean = kelas.trim().toLowerCase()

  // 1. Cek 1 Intensif (contoh: 1-int-c, 1-int, 1 int c, 1 intensif)
  if (clean.includes('1-int') || clean.includes('1 int') || clean.includes('1int') || clean.includes('1 intensif')) {
    return 'Kelas 1 Int'
  }
  // 2. Cek 3 Intensif (contoh: 3-int-c, 3-int, 3 int c, 3 intensif)
  if (clean.includes('3-int') || clean.includes('3 int') || clean.includes('3int') || clean.includes('3 intensif')) {
    return 'Kelas 3 Int'
  }
  // 3. Cek digit 1-5 (contoh: 5-c, 5-s, kelas 5, 5)
  const m = clean.match(/^(?:kelas\s*)?([1-5])/i)
  if (m) {
    return `Kelas ${m[1]}` as StudentKelas
  }
  return null
}

export function isValidKelasFormat(val: string): boolean {
  if (!val) return false
  const clean = val.trim()
  return (
    /^(?:[1-5]-[A-Z]|(?:1|3)-Int(?:-[A-Z])?|Kelas\s*[1-5](?:\s*Int)?|[1-5])$/i.test(clean) ||
    /^(?:kelas\s*)?(?:[1-5]\s*-?\s*[a-z]|[1-5])$/i.test(clean)
  )
}

export function getExpectedJenjangForKelas(kelas: string): StudentJenjang | null {
  const baseGrade = extractGradeLevelFromKelas(kelas)
  if (!baseGrade) return null
  return KELAS_TO_JENJANG_MAP[baseGrade] || null
}

export function isJenjangKelasMatch(jenjang: string, kelas: string): boolean {
  if (!jenjang || !kelas) return false
  const baseGrade = extractGradeLevelFromKelas(kelas)
  if (!baseGrade) return false
  const allowed = getAllowedClassesForJenjang(jenjang)
  return allowed.includes(baseGrade)
}

export const STUDENT_SOURCE_OPTIONS: { value: StudentSource; label: string }[] = [
  { value: 'excel', label: 'Excel Import' },
  { value: 'csv', label: 'CSV Import' },
  { value: 'manual', label: 'Input Manual' },
  { value: 'paste', label: 'Tempel Spreadsheet' },
]

export const STUDENT_SYNC_STATUS_OPTIONS: { value: StudentSyncStatus; label: string }[] = [
  { value: 'local_only', label: 'Tersimpan di OGSOreg' },
  { value: 'exported', label: 'CSV Diekspor' },
  { value: 'synced', label: 'Akun Moodle Terverifikasi' },
  { value: 'enrolled', label: 'Enrolment Terverifikasi' },
  { value: 'failed', label: 'Gagal Sinkronisasi' },
]

export interface Student {
  id: string
  username: string
  firstname: string
  lastname: string
  full_name: string
  email: string
  jenjang: StudentJenjang
  kelas?: StudentKelas
  kampus?: string
  institution_id: string
  created_by: string
  created_at: string
  updated_at: string
  source: StudentSource
  sync_status: StudentSyncStatus
  moodle_user_id: string | null
  last_synced_at: string | null
  custom_fields?: Record<string, any>
}

export interface StudentStats {
  total: number
  localOnly: number
  exported: number
  synced: number
  enrolled?: number
  failed: number
  unsynced: number // localOnly + exported + failed
  verifiedMoodleCount: number
  verifiedEnrolmentCount?: number
  unSyncedCount: number
  byJenjang: Record<StudentJenjang, number>
  byKelas?: Record<StudentKelas, number>
  byKampus?: Record<string, number>
  incompleteKampusCount?: number
  bySyncStatus: Record<StudentSyncStatus, number>
  bySource: Record<StudentSource, number>
}

export interface StudentFilterParams {
  searchTerm?: string
  search?: string
  jenjang?: StudentJenjang | 'all' | 'ALL'
  kelas?: StudentKelas | 'all' | 'ALL'
  kampus?: string | 'all' | 'ALL'
  sync_status?: StudentSyncStatus | 'all' | 'ALL'
  syncStatus?: StudentSyncStatus | 'all' | 'ALL'
  source?: StudentSource | 'ALL' | 'all'
  sortBy?: 'name' | 'date' | 'created_at'
  sortDirection?: 'asc' | 'desc'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  assignedCampus?: string | null
  accessControl?: { userRole?: string; assignedCampus?: string | null }
}
