import ExcelJS from 'exceljs'
import {
  MOODLE_EXPORT_COLUMNS,
  MOODLE_EXCEL_SHEET_NAME,
  mapStudentsToMoodleExport,
  type MoodleUserExportRow,
  type MoodleExportOptions,
} from './moodleExportMapper'

/**
 * Builds an ExcelJS Workbook adhering strictly to the 7-column Moodle User schema.
 * Sheet Name: MOODLE_USERS
 */
export async function buildMoodleUsersWorkbook(
  rows: MoodleUserExportRow[]
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'OGSOreg LMS Moodle Portal'
  workbook.lastModifiedBy = 'OGSOreg'
  workbook.created = new Date()

  const ws = workbook.addWorksheet(MOODLE_EXCEL_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Exactly 7 columns in designated sequence
  ws.columns = [
    { header: 'username', key: 'username', width: 22 },
    { header: 'firstname', key: 'firstname', width: 22 },
    { header: 'lastname', key: 'lastname', width: 22 },
    { header: 'email', key: 'email', width: 34 },
    { header: 'course1', key: 'course1', width: 20 },
    { header: 'course2', key: 'course2', width: 20 },
    { header: 'password', key: 'password', width: 20 },
  ]

  // Style Header Row: Brand Green (#166534), White Text, Bold
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF166534' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 26

  // Populate data rows ensuring text-only format without formula execution
  rows.forEach((r) => {
    const row = ws.addRow({
      username: r.username,
      firstname: r.firstname,
      lastname: r.lastname,
      email: r.email,
      course1: r.course1,
      course2: r.course2,
      password: r.password,
    })

    row.height = 20
    row.alignment = { vertical: 'middle' }

    // Format all cells explicitly as text (@) to prevent formula interpretation
    for (let c = 1; c <= MO_COLUMNS_COUNT; c++) {
      const cell = row.getCell(c)
      cell.numFmt = '@'
    }
  })

  return workbook
}

const MO_COLUMNS_COUNT = MOODLE_EXPORT_COLUMNS.length

/**
 * Generates ArrayBuffer for Excel file download.
 */
export async function generateMoodleUsersExcelBuffer(
  rows: MoodleUserExportRow[]
): Promise<ArrayBuffer> {
  const workbook = await buildMoodleUsersWorkbook(rows)
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}

/**
 * Triggers browser download of the Moodle Excel file.
 */
export async function downloadMoodleUsersExcel(
  students: any[],
  options?: string | (MoodleExportOptions & { customFilename?: string })
): Promise<{
  filename: string
  totalExported: number
  byteSize: number
}> {
  const opts: MoodleExportOptions & { customFilename?: string } =
    typeof options === 'string' ? { customFilename: options } : options || {}
  const mappingResult = mapStudentsToMoodleExport(students, opts)
  const buffer = await generateMoodleUsersExcelBuffer(mappingResult.mappedRows)
  const filename = opts.customFilename || 'OGSOreg_Moodle_Users.xlsx'

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

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
  }
}

export const exportStudentsToMoodleExcel = downloadMoodleUsersExcel
