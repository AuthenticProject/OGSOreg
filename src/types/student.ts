export type StudentJenjang = 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'Kelas 4' | 'Kelas 5'
export type StudentSource = 'excel' | 'csv' | 'manual' | 'paste'
export type StudentSyncStatus = 'local_only' | 'exported' | 'synced' | 'enrolled' | 'failed'

export const STUDENT_JENJANG_OPTIONS: StudentJenjang[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
]

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
  byKampus?: Record<string, number>
  incompleteKampusCount?: number
  bySyncStatus: Record<StudentSyncStatus, number>
  bySource: Record<StudentSource, number>
}

export interface StudentFilterParams {
  searchTerm?: string
  search?: string
  jenjang?: StudentJenjang | 'all' | 'ALL'
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
