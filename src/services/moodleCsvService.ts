import type { StagedParticipantRow, MoodleJenjang } from '../types/excel'

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
 */
export function generateMoodleCsv(rows: StagedParticipantRow[]): string {
  const headerLine = MOODLE_CSV_HEADERS.join(',')
  const dataLines = rows.map((r) => {
    // If username/firstname/lastname/email are not directly populated, derive from canonical fields
    const username = r.username || r.nisn || ''
    const firstname = r.firstname || (r.full_name ? r.full_name.split(' ')[0] : '')
    const lastname = r.lastname || (r.full_name ? r.full_name.split(' ').slice(1).join(' ') || firstname : '')
    const email = r.email || r.teacher_email || ''
    const course = r.jenjang || r.grade_level || ''

    return [
      escapeCsvField(username),
      escapeCsvField(firstname),
      escapeCsvField(lastname),
      escapeCsvField(email),
      escapeCsvField(course),
    ].join(',')
  })

  return [headerLine, ...dataLines].join('\r\n')
}

/**
 * Generates Moodle CSV with UTF-8 Byte Order Mark (BOM: \uFEFF)
 * Ensures international and Indonesian characters (accents, UTF-8 symbols)
 * display flawlessly in Microsoft Excel, LibreOffice, and Moodle LMS.
 */
export function generateMoodleCsvWithBom(rows: StagedParticipantRow[]): string {
  const csvBody = generateMoodleCsv(rows)
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
  customFilename?: string
): { filename: string; totalExported: number; byteSize: number } {
  // Only export non-error rows
  const validRows = rows.filter((r) => r._status !== 'ERROR')
  const content = generateMoodleCsvWithBom(validRows)
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
 * Generates confirmed basic Moodle CSV for Students:
 * Columns: username, firstname, lastname, email
 * (Preserves jenjang internally, avoids arbitrary fields in basic Moodle user upload CSV)
 */
export function generateStudentsMoodleCsv(
  students: { username: string; firstname: string; lastname?: string | null; email: string }[]
): string {
  const headers = ['username', 'firstname', 'lastname', 'email']
  const lines = students.map((s) => [
    escapeCsvField(s.username),
    escapeCsvField(s.firstname),
    escapeCsvField(s.lastname || ''),
    escapeCsvField(s.email),
  ].join(','))
  return [headers.join(','), ...lines].join('\r\n')
}

export function generateStudentsMoodleCsvWithBom(
  students: { username: string; firstname: string; lastname?: string | null; email: string }[]
): string {
  return `\uFEFF${generateStudentsMoodleCsv(students)}`
}

export function downloadStudentsMoodleCsv(
  students: { username: string; firstname: string; lastname?: string | null; email: string }[],
  filename?: string
): { filename: string; totalExported: number; byteSize: number } {
  const content = generateStudentsMoodleCsvWithBom(students)
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

