import type { Student } from './student'

export type ResultStatus = 'peserta' | 'finalis' | 'juara'

export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  peserta: 'Peserta',
  finalis: 'Lolos Final',
  juara: 'Juara',
}

export const STANDARD_AWARD_CATEGORIES = [
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Juara Harapan 1',
  'Juara Harapan 2',
  'Gold Medal',
  'Silver Medal',
  'Bronze Medal',
] as const

export interface CompetitionResult {
  id: string
  student_id: string
  period_id: string
  result_status: ResultStatus
  is_finalist: boolean
  is_champion: boolean
  champion_rank?: number | null
  award_category?: string | null
  result_notes?: string | null
  created_at: string
  updated_at: string
  updated_by?: string
}

export interface StudentWithResult {
  student: Student
  result?: CompetitionResult
  status: ResultStatus
  is_finalist: boolean
  is_champion: boolean
  champion_rank: number | null
  award_category: string | null
  result_notes: string | null
}

export type MatchStatus = 'MATCHED' | 'AMBIGUOUS' | 'NOT_FOUND'

export interface StudentMatchingResult {
  rowNumber: number
  rawRow: Record<string, any>
  matchStatus: MatchStatus
  matchedStudent?: Student
  candidateStudents?: Student[]
  proposedResult: {
    result_status: ResultStatus
    is_finalist: boolean
    is_champion: boolean
    champion_rank?: number | null
    award_category?: string | null
    result_notes?: string | null
  }
  existingResult?: CompetitionResult
  diff?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  error?: string
  isDuplicateInSpreadsheet?: boolean
  selectedStudentId?: string // User selection in case of ambiguous resolution
}

export interface ResultFilterParams {
  period_id: string
  search?: string
  campus?: string
  jenjang?: string
  daerah?: string
  status?: 'all' | ResultStatus
}

export interface ResultStats {
  totalParticipants: number
  totalFinalists: number
  totalChampions: number
  finalistPercentage: number
  championPercentage: number
}
