import {
  MOODLE_EXPORT_COLUMNS,
  mapStudentsToMoodleExport,
  type MoodleUserExportRow,
  type MoodleExportOptions,
} from './moodleExportMapper'

/**
 * Escapes a single value according to RFC 4180 CSV specification.
 */
export function escapeMoodleCsvField(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generates an RFC 4180 CSV string for Moodle Upload Users feature with exact 7 columns.
 */
export function generateMoodleUsersCsv(rows: MoodleUserExportRow[]): string {
  const headerLine = MOODLE_EXPORT_COLUMNS.join(',')
  const dataLines = rows.map((r) =>
    [
      escapeMoodleCsvField(r.username),
      escapeMoodleCsvField(r.firstname),
      escapeMoodleCsvField(r.lastname),
      escapeMoodleCsvField(r.email),
      escapeMoodleCsvField(r.course1),
      escapeMoodleCsvField(r.course2),
      escapeMoodleCsvField(r.password),
    ].join(',')
  )

  return [headerLine, ...dataLines].join('\r\n')
}

/**
 * Generates CSV string prepended with UTF-8 Byte Order Mark (\uFEFF)
 * for perfect international/Indonesian character handling in Excel and Moodle.
 */
export function generateMoodleUsersCsvWithBom(rows: MoodleUserExportRow[]): string {
  const rawCsv = generateMoodleUsersCsv(rows)
  return `\uFEFF${rawCsv}`
}

/**
 * Generates the full CSV content string with BOM from a list of students.
 */
export function generateMoodleUsersCsvContent(
  students: any[],
  options?: MoodleExportOptions
): string {
  const mappingResult = mapStudentsToMoodleExport(students, options)
  return generateMoodleUsersCsvWithBom(mappingResult.mappedRows)
}

/**
 * Triggers browser download of the Moodle CSV file.
 */
export function downloadMoodleUsersCsv(
  students: any[],
  options?: string | (MoodleExportOptions & { customFilename?: string })
): {
  filename: string
  totalExported: number
  byteSize: number
  content: string
} {
  const opts: MoodleExportOptions & { customFilename?: string } =
    typeof options === 'string' ? { customFilename: options } : options || {}
  const mappingResult = mapStudentsToMoodleExport(students, opts)
  const content = generateMoodleUsersCsvWithBom(mappingResult.mappedRows)
  const filename = opts.customFilename || 'OGSOreg_Moodle_Users.csv'

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    filename,
    totalExported: mappingResult.mappedRows.length,
    byteSize: blob.size,
    content,
  }
}

export const exportStudentsToMoodleCsv = downloadMoodleUsersCsv
