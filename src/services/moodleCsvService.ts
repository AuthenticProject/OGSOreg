import type { StagedParticipantRow, MoodleJenjang } from '../types/excel'
import { customFieldService } from './customFieldService'
import type { CustomFieldDefinition } from '../types/customField'

/**
 * Standard Moodle User Upload CSV Headers.
 * Columns: username, firstname, lastname, email, course (mapped from Jenjang).
 */
export const MOODLE_CSV_HEADERS = [
  'username',
  'firstname',
  'lastname',
  'email',
  'course',
] as const

/**
 * Escapes a field according to RFC 4180 CSV specifications.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generates RFC 4180 compliant CSV string for Moodle User Upload.
 * Kolom 'course' otomatis diisi dari Jenjang peserta (misal: Kelas 1, Kelas 2, dst).
 * Dynamically appends any custom fields configured by Super Admin where include_in_moodle is ON.
 */
export function generateMoodleCsv(
  rows: StagedParticipantRow[],
  customFields?: CustomFieldDefinition[],
  includeCustomFields = true
): string {
  const activeMoodleFields = includeCustomFields
    ? (customFields || customFieldService.getActiveFieldsSync()).filter(
        (f) => f.include_in_moodle && f.moodle_destination && f.moodle_destination.trim() !== ''
      )
    : []

  const headerColumns = [
    ...MOODLE_CSV_HEADERS,
    ...activeMoodleFields.map((f) => f.moodle_destination!.trim()),
  ]
  const headerLine = headerColumns.join(',')

  const dataLines = rows.map((r) => {
    // If username/firstname/lastname/email are not directly populated, derive from canonical fields
    const username = r.username || r.nisn || ''
    const firstname = r.firstname || (r.full_name ? r.full_name.split(' ')[0] : '')
    const lastname = r.lastname || (r.full_name ? r.full_name.split(' ').slice(1).join(' ') || firstname : '')
    const email = r.email || r.teacher_email || ''
    const course = r.jenjang || r.grade_level || ''

    const values = [
      escapeCsvField(username),
      escapeCsvField(firstname),
      escapeCsvField(lastname),
      escapeCsvField(email),
      escapeCsvField(course),
    ]

    activeMoodleFields.forEach((f) => {
      const val = r.custom_fields?.[f.key] ?? ''
      values.push(escapeCsvField(val))
    })

    return values.join(',')
  })

  return [headerLine, ...dataLines].join('\r\n')
}

/**
 * Generates Moodle CSV with UTF-8 Byte Order Mark (BOM: \uFEFF)
 * Ensures international and Indonesian characters (accents, UTF-8 symbols)
 * display flawlessly in Microsoft Excel, LibreOffice, and Moodle LMS.
 */
export function generateMoodleCsvWithBom(
  rows: StagedParticipantRow[],
  customFields?: CustomFieldDefinition[],
  includeCustomFields = true
): string {
  const csvBody = generateMoodleCsv(rows, customFields, includeCustomFields)
  return `\uFEFF${csvBody}`
}

export interface CourseMappingSummary {
  jenjang: MoodleJenjang
  participantCount: number
  suggestedCourseShortname: string
  suggestedCourseFullName: string
}

/**
 * Summarizes staged participants by Jenjang for automated course enrollment mapping.
 */
export function getJenjangCourseMappingSummary(rows: StagedParticipantRow[]): CourseMappingSummary[] {
  const jenjangCounts = new Map<MoodleJenjang, number>([
    ['Kelas 1', 0],
    ['Kelas 2', 0],
    ['Kelas 3', 0],
    ['Kelas 4', 0],
    ['Kelas 5', 0],
  ])

  rows.forEach((r) => {
    const j = (r.jenjang || r.grade_level) as MoodleJenjang
    if (jenjangCounts.has(j)) {
      jenjangCounts.set(j, (jenjangCounts.get(j) || 0) + 1)
    }
  })

  const results: CourseMappingSummary[] = []
  jenjangCounts.forEach((count, jenjang) => {
    const gradeNum = jenjang.replace('Kelas ', '')
    results.push({
      jenjang,
      participantCount: count,
      suggestedCourseShortname: `OGSO-K${gradeNum}`,
      suggestedCourseFullName: `Olimpiade Sains Gadjah Mada - ${jenjang}`,
    })
  })

  return results
}

/**
 * Triggers browser download of the Moodle-compatible CSV file.
 */
export function downloadMoodleCsvFile(
  rows: StagedParticipantRow[],
  customFilename?: string,
  customFields?: CustomFieldDefinition[]
): { filename: string; totalExported: number; byteSize: number } {
  // Only export non-error rows
  const validRows = rows.filter((r) => r._status !== 'ERROR')
  const content = generateMoodleCsvWithBom(validRows, customFields, true)
  const filename = customFilename || `moodle_users_kolektif_${new Date().toISOString().slice(0, 10)}.csv`

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return {
    filename,
    totalExported: validRows.length,
    byteSize: blob.size,
  }
}

/**
 * Generates confirmed Moodle CSV for Students:
 * Columns: username, firstname, lastname, email, plus any active custom fields mapped to Moodle.
 */
export function generateStudentsMoodleCsv(
  students: {
    username: string
    firstname: string
    lastname?: string | null
    email: string
    custom_fields?: Record<string, any>
  }[],
  customFields?: CustomFieldDefinition[],
  includeCustomFields = true
): string {
  const activeMoodleFields = includeCustomFields
    ? (customFields || customFieldService.getActiveFieldsSync()).filter(
        (f) => f.include_in_moodle && f.moodle_destination && f.moodle_destination.trim() !== ''
      )
    : []

  const headers = [
    'username',
    'firstname',
    'lastname',
    'email',
    ...activeMoodleFields.map((f) => f.moodle_destination!.trim()),
  ]

  const lines = students.map((s) => {
    const row = [
      escapeCsvField(s.username),
      escapeCsvField(s.firstname),
      escapeCsvField(s.lastname || ''),
      escapeCsvField(s.email),
    ]

    activeMoodleFields.forEach((f) => {
      const val = s.custom_fields?.[f.key] ?? ''
      row.push(escapeCsvField(val))
    })

    return row.join(',')
  })

  return [headers.join(','), ...lines].join('\r\n')
}

export function generateStudentsMoodleCsvWithBom(
  students: {
    username: string
    firstname: string
    lastname?: string | null
    email: string
    custom_fields?: Record<string, any>
  }[],
  customFields?: CustomFieldDefinition[],
  includeCustomFields = true
): string {
  return `\uFEFF${generateStudentsMoodleCsv(students, customFields, includeCustomFields)}`
}

export function downloadStudentsMoodleCsv(
  students: {
    username: string
    firstname: string
    lastname?: string | null
    email: string
    custom_fields?: Record<string, any>
  }[],
  filename?: string,
  customFields?: CustomFieldDefinition[]
): { filename: string; totalExported: number; byteSize: number } {
  const content = generateStudentsMoodleCsvWithBom(students, customFields, true)
  const finalFilename = filename || `moodle_siswa_${new Date().toISOString().slice(0, 10)}.csv`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = finalFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  return {
    filename: finalFilename,
    totalExported: students.length,
    byteSize: blob.size,
  }
}
