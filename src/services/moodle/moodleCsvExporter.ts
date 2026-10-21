import {
  mapStudentsToMoodleExport,
  type MoodleUserExportRow,
  type MoodleExportOptions,
} from './moodleExportMapper'
import {
  moodleColumnConfigService,
  type MoodleColumnConfig,
} from './moodleColumnConfigService'

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
 * Generates an RFC 4180 CSV string for Moodle Upload Users feature using configured
 * column definitions (supports custom headers, ordering, and included fields).
 */
export function generateMoodleUsersCsv(
  rows: MoodleUserExportRow[],
  customColumnsConfig?: MoodleColumnConfig[]
): string {
  const activeCols = customColumnsConfig || moodleColumnConfigService.getActiveColumns()
  const headerLine = activeCols.map((c) => c.header).join(',')

  const dataLines = rows.map((r) => {
    const rowValues = activeCols.map((col) => {
      // Check standard row properties
      if (col.key in r) {
        return escapeMoodleCsvField((r as any)[col.key])
      }
      // Check custom fields object
      if (r.custom_fields && col.key in r.custom_fields) {
        return escapeMoodleCsvField(r.custom_fields[col.key])
      }
      return ''
    })
    return rowValues.join(',')
  })

  return [headerLine, ...dataLines].join('\r\n')
}

/**
 * Generates CSV string prepended with UTF-8 Byte Order Mark (\uFEFF)
 * for perfect international/Indonesian character handling in Excel and Moodle.
 */
export function generateMoodleUsersCsvWithBom(
  rows: MoodleUserExportRow[],
  customColumnsConfig?: MoodleColumnConfig[]
): string {
  const rawCsv = generateMoodleUsersCsv(rows, customColumnsConfig)
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
 * Downloads Moodle CSV directly from edited rows or edited raw CSV content.
 */
export function downloadMoodleUsersCsvFromRows(
  rows: MoodleUserExportRow[],
  options?: {
    customFilename?: string
    rawCsvContent?: string
    customColumnsConfig?: MoodleColumnConfig[]
  }
): {
  filename: string
  totalExported: number
  byteSize: number
  content: string
} {
  const filename = options?.customFilename || `OGSOreg_Moodle_Users_${new Date().toISOString().slice(0, 10)}.csv`
  const content = options?.rawCsvContent
    ? (options.rawCsvContent.startsWith('\uFEFF') ? options.rawCsvContent : `\uFEFF${options.rawCsvContent}`)
    : generateMoodleUsersCsvWithBom(rows, options?.customColumnsConfig)

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
    totalExported: rows.length,
    byteSize: blob.size,
    content,
  }
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
  return downloadMoodleUsersCsvFromRows(mappingResult.mappedRows, {
    customFilename: opts.customFilename,
  })
}

export const exportStudentsToMoodleCsv = downloadMoodleUsersCsv

