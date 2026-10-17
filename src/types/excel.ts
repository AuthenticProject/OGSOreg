export type RowValidationStatus = 'VALID' | 'WARNING' | 'ERROR'

export interface FieldError {
  field: string
  message: string
  isWarning?: boolean
}

export type MoodleJenjang = 'Jenjang 1' | 'Jenjang 2' | 'Jenjang 3' | 'Jenjang 4' | 'Jenjang 5'
export type MoodleKelas = 'Kelas 1' | 'Kelas 2' | 'Kelas 1 Int' | 'Kelas 3' | 'Kelas 3 Int' | 'Kelas 4' | 'Kelas 5'

export const MOODLE_JENJANG_OPTIONS: MoodleJenjang[] = [
  'Jenjang 1',
  'Jenjang 2',
  'Jenjang 3',
  'Jenjang 4',
  'Jenjang 5',
]

export const MOODLE_KELAS_OPTIONS: MoodleKelas[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 1 Int',
  'Kelas 3',
  'Kelas 3 Int',
  'Kelas 4',
  'Kelas 5',
]

export interface StagedParticipantRow {
  _rowId: string
  _rowIndex: number // original 1-based Excel row number
  _status: RowValidationStatus
  _errors: Record<string, string> // field -> error message
  _warnings: Record<string, string> // field -> warning message
  _isDuplicate?: boolean
  _duplicateReason?: string
  _usernameSuggestions?: string[]
  custom_fields?: Record<string, any>

  // Moodle Bulk Registration fields (New workflow)
  username?: string
  firstname?: string
  lastname?: string
  email?: string
  jenjang?: string // 'Jenjang 1' | 'Jenjang 2' | 'Jenjang 3' | 'Jenjang 4' | 'Jenjang 5'
  kelas?: string // 'Kelas 1' | 'Kelas 2' | 'Kelas 1 Int' | 'Kelas 3' | 'Kelas 3 Int' | 'Kelas 4' | 'Kelas 5'
  kampus?: string // Gontor 1 - 12, Gontor Putri 1 - 8
  _source?: string
  source?: string

  // Canonical data fields (Legacy Phase 3/4 backward compatibility)
  no?: string
  full_name?: string
  nisn?: string
  gender?: string // 'L' | 'P'
  grade_level?: string
  school_name?: string
  npsn?: string
  competition_category?: string
  teacher_name?: string
  teacher_phone?: string
  teacher_email?: string
}

export interface StagedTeacherRow {
  _rowId: string
  _rowIndex: number
  _status: RowValidationStatus
  _errors: Record<string, string>
  _warnings: Record<string, string>

  no?: string
  full_name: string
  gender: string
  nip_nik?: string
  phone: string
  email?: string
  school_name: string
}

export interface ColumnMappingItem {
  excelHeader: string
  targetField: string | null
  confidence: 'exact' | 'alias' | 'manual' | 'unmapped'
  isRequired: boolean
  sampleValue?: string
}

export interface SheetDetectionResult {
  sheetName: string
  detectedType: 'PESERTA' | 'GURU' | 'PETUNJUK' | 'UNKNOWN'
  rowCount: number
  headers: string[]
}

export interface ParsedWorkbookData {
  fileName: string
  fileSize: number
  sheets: SheetDetectionResult[]
  participantSheetName: string | null
  teacherSheetName: string | null
  rawParticipantRows: Record<string, unknown>[]
  rawTeacherRows: Record<string, unknown>[]
  warnings: string[]
}

export interface ImportStatistics {
  total: number
  valid: number
  warning: number
  error: number
  duplicate: number
}
