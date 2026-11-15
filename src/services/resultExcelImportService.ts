import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { studentRepository, CANONICAL_INSTITUTION_ID } from './studentRepository'
import { competitionResultService, inferChampionRank, type UpsertResultInput } from './competitionResultService'
import type { Student } from '../types/student'
import type {
  CompetitionResult,
  ResultStatus,
  StudentMatchingResult,
  MatchStatus,
} from '../types/competitionResult'
import { normalizeCampusInput, normalizeAwardInput } from './winnerExcelService'

export interface ParsedSpreadsheetData {
  headers: string[]
  rows: Record<string, any>[]
}

export interface ImportPreviewAnalysis {
  totalRows: number
  matchedCount: number
  ambiguousCount: number
  notFoundCount: number
  duplicateRowsCount: number
  existingResultsUpdatedCount: number
  items: StudentMatchingResult[]
}

/**
 * Normalizes loose status string into official ResultStatus
 */
export function normalizeStatusInput(raw?: unknown): ResultStatus {
  if (!raw) return 'peserta'
  const str = String(raw).trim().toLowerCase()
  if (str.includes('juara') || str.includes('gold') || str.includes('silver') || str.includes('bronze') || str.includes('emas') || str.includes('perak') || str.includes('perunggu')) {
    return 'juara'
  }
  if (str.includes('final') || str.includes('lolos')) {
    return 'finalis'
  }
  return 'peserta'
}

/**
 * Extracts header value case-insensitively using multiple candidate aliases
 */
function getCellByAliases(row: Record<string, any>, aliases: string[]): string {
  const rowKeys = Object.keys(row)
  for (const alias of aliases) {
    const target = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const key of rowKeys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (cleanKey === target || cleanKey.includes(target)) {
        const val = row[key]
        if (val !== undefined && val !== null) {
          return String(val).trim()
        }
      }
    }
  }
  return ''
}

class ResultExcelImportService {
  /**
   * Reads an uploaded Excel or CSV file buffer and returns raw rows.
   */
  public async parseExcelFile(file: File): Promise<ParsedSpreadsheetData> {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheetName]

    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    if (jsonData.length === 0) {
      return { headers: [], rows: [] }
    }

    // Find the header row (first non-empty row)
    let headerRowIndex = 0
    while (headerRowIndex < jsonData.length && (!jsonData[headerRowIndex] || jsonData[headerRowIndex].every((c: any) => !String(c).trim()))) {
      headerRowIndex++
    }

    if (headerRowIndex >= jsonData.length) {
      return { headers: [], rows: [] }
    }

    const rawHeaders: string[] = jsonData[headerRowIndex].map((h: any) => String(h || '').trim())
    const rows: Record<string, any>[] = []

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.every((c: any) => !String(c).trim())) continue

      const rowObj: Record<string, any> = {}
      rawHeaders.forEach((header, colIdx) => {
        if (header) {
          rowObj[header] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : ''
        }
      })
      rows.push(rowObj)
    }

    return { headers: rawHeaders, rows }
  }

  /**
   * Matches spreadsheet rows against student repository for a given period.
   * Priority:
   * 1. Username / NISN / Stambuk / ID
   * 2. Full Name + Campus
   * 3. Full Name alone (marked ambiguous if multiple matches)
   */
  public matchAndAnalyzeRows(
    rows: Record<string, any>[],
    periodId: string,
    accessCampus?: string | null
  ): ImportPreviewAnalysis {
    const allStudents = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
    const existingResults = competitionResultService.getResultsByPeriod(periodId)
    const existingResultMap = new Map<string, CompetitionResult>()
    existingResults.forEach((r) => existingResultMap.set(r.student_id, r))

    // Index students by username
    const studentByUsername = new Map<string, Student>()
    const studentsByName = new Map<string, Student[]>()

    allStudents.forEach((s) => {
      if (s.username) {
        studentByUsername.set(s.username.toLowerCase().trim(), s)
      }
      if (s.custom_fields?.nisn) {
        studentByUsername.set(String(s.custom_fields.nisn).toLowerCase().trim(), s)
      }
      if (s.custom_fields?.stambuk) {
        studentByUsername.set(String(s.custom_fields.stambuk).toLowerCase().trim(), s)
      }

      const cleanName = s.full_name.toLowerCase().trim()
      if (!studentsByName.has(cleanName)) {
        studentsByName.set(cleanName, [])
      }
      studentsByName.get(cleanName)!.push(s)
    })

    const seenSpreadsheetIdentifiers = new Set<string>()
    const items: StudentMatchingResult[] = []

    let matchedCount = 0
    let ambiguousCount = 0
    let notFoundCount = 0
    let duplicateRowsCount = 0
    let existingResultsUpdatedCount = 0

    rows.forEach((row, idx) => {
      const rowNumber = idx + 2 // 1-based + 1 for header
      const rawName = getCellByAliases(row, ['Nama Santri', 'Nama', 'Full Name', 'Name', 'Peserta'])
      const rawUsername = getCellByAliases(row, ['Username', 'NISN', 'NIS', 'Stambuk', 'ID', 'No Induk'])
      const rawCampus = normalizeCampusInput(getCellByAliases(row, ['Kampus', 'Campus', 'Cabang', 'Pondok']))
      const rawStatus = getCellByAliases(row, ['Status Hasil', 'Status', 'Keterangan Hasil', 'Hasil'])
      const rawAward = getCellByAliases(row, ['Kategori Juara', 'Kategori', 'Award', 'Penghargaan', 'Predikat'])
      const rawRank = getCellByAliases(row, ['Peringkat', 'Rank', 'Juara Ke', 'Urutan'])
      const rawNotes = getCellByAliases(row, ['Keterangan', 'Notes', 'Catatan', 'Keterangan Tambahan'])

      // Check spreadsheet duplicate
      const identifier = rawUsername || `${rawName}_${rawCampus}`.toLowerCase()
      let isDuplicateInSpreadsheet = false
      if (identifier) {
        if (seenSpreadsheetIdentifiers.has(identifier)) {
          isDuplicateInSpreadsheet = true
          duplicateRowsCount++
        } else {
          seenSpreadsheetIdentifiers.add(identifier)
        }
      }

      // Determine matching student
      let matchedStudent: Student | undefined = undefined
      let candidateStudents: Student[] | undefined = undefined
      let matchStatus: MatchStatus = 'NOT_FOUND'

      // Step 4.1: Priority matching by unique identifier (Username / NISN / Stambuk)
      if (rawUsername) {
        const found = studentByUsername.get(rawUsername.toLowerCase().trim())
        if (found) {
          // If Campus Admin, ensure belongs to assignedCampus
          if (!accessCampus || found.kampus === accessCampus) {
            matchedStudent = found
            matchStatus = 'MATCHED'
          }
        }
      }

      // Step 4.2: Fallback to full name + campus
      if (!matchedStudent && rawName) {
        const byName = studentsByName.get(rawName.toLowerCase().trim()) || []
        // Filter by accessCampus if restricted
        const eligible = accessCampus ? byName.filter((s) => s.kampus === accessCampus) : byName

        if (eligible.length === 1) {
          matchedStudent = eligible[0]
          matchStatus = 'MATCHED'
        } else if (eligible.length > 1) {
          // Try refining by campus
          if (rawCampus) {
            const sameCampus = eligible.filter((s) => s.kampus?.toLowerCase() === rawCampus.toLowerCase())
            if (sameCampus.length === 1) {
              matchedStudent = sameCampus[0]
              matchStatus = 'MATCHED'
            } else if (sameCampus.length > 1) {
              candidateStudents = sameCampus
              matchStatus = 'AMBIGUOUS'
            } else {
              candidateStudents = eligible
              matchStatus = 'AMBIGUOUS'
            }
          } else {
            candidateStudents = eligible
            matchStatus = 'AMBIGUOUS'
          }
        }
      }

      if (matchStatus === 'MATCHED') {
        matchedCount++
      } else if (matchStatus === 'AMBIGUOUS') {
        ambiguousCount++
      } else {
        notFoundCount++
      }

      // Propose result
      let result_status: ResultStatus = normalizeStatusInput(rawStatus || rawAward)
      let award_category: string | null = rawAward ? normalizeAwardInput(rawAward) : null
      let champion_rank: number | null = rawRank ? Number(rawRank) || null : null

      if (result_status === 'juara' && !award_category) {
        award_category = 'Juara'
      }
      if (award_category && !champion_rank) {
        champion_rank = inferChampionRank(award_category)
      }

      const is_champion = result_status === 'juara'
      const is_finalist = result_status === 'juara' || result_status === 'finalis'

      const proposedResult = {
        result_status,
        is_finalist,
        is_champion,
        champion_rank,
        award_category,
        result_notes: rawNotes || null,
      }

      // Compare with existing result
      const existingResult = matchedStudent ? existingResultMap.get(matchedStudent.id) : undefined
      const diff: { field: string; oldValue: any; newValue: any }[] = []

      if (existingResult) {
        if (existingResult.result_status !== proposedResult.result_status) {
          diff.push({ field: 'Status', oldValue: existingResult.result_status, newValue: proposedResult.result_status })
        }
        if ((existingResult.award_category || null) !== (proposedResult.award_category || null)) {
          diff.push({ field: 'Kategori Juara', oldValue: existingResult.award_category || '-', newValue: proposedResult.award_category || '-' })
        }
        if ((existingResult.champion_rank || null) !== (proposedResult.champion_rank || null)) {
          diff.push({ field: 'Peringkat', oldValue: existingResult.champion_rank || '-', newValue: proposedResult.champion_rank || '-' })
        }
        if ((existingResult.result_notes || null) !== (proposedResult.result_notes || null)) {
          diff.push({ field: 'Catatan', oldValue: existingResult.result_notes || '-', newValue: proposedResult.result_notes || '-' })
        }
        if (diff.length > 0) {
          existingResultsUpdatedCount++
        }
      }

      items.push({
        rowNumber,
        rawRow: row,
        matchStatus,
        matchedStudent,
        candidateStudents,
        proposedResult,
        existingResult,
        diff: diff.length > 0 ? diff : undefined,
        isDuplicateInSpreadsheet,
      })
    })

    return {
      totalRows: rows.length,
      matchedCount,
      ambiguousCount,
      notFoundCount,
      duplicateRowsCount,
      existingResultsUpdatedCount,
      items,
    }
  }

  /**
   * Commits the verified matching results to the competitionResultService.
   */
  public async commitImport(
    periodId: string,
    items: StudentMatchingResult[],
    adminUsername: string
  ): Promise<{ successCount: number; errors: string[] }> {
    const inputs: UpsertResultInput[] = []
    const errors: string[] = []

    for (const item of items) {
      const studentId = item.matchedStudent?.id || item.selectedStudentId
      if (!studentId) {
        errors.push(`Baris ${item.rowNumber}: Santri tidak ditemukan / belum dipilih.`)
        continue
      }

      inputs.push({
        student_id: studentId,
        period_id: periodId,
        result_status: item.proposedResult.result_status,
        is_finalist: item.proposedResult.is_finalist,
        is_champion: item.proposedResult.is_champion,
        champion_rank: item.proposedResult.champion_rank,
        award_category: item.proposedResult.award_category,
        result_notes: item.proposedResult.result_notes,
        updated_by: adminUsername || 'admin',
      })
    }

    if (inputs.length > 0) {
      const res = await competitionResultService.bulkUpsertResults(inputs)
      return { successCount: res.count, errors }
    }

    return { successCount: 0, errors }
  }

  /**
   * Generates a downloadable standard Excel import template for competition results.
   */
  public async generateImportTemplate(_periodName?: string): Promise<Blob> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'OGSOreg System'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Template Hasil')

    // Columns
    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Santri', key: 'name', width: 28 },
      { header: 'Username', key: 'username', width: 22 },
      { header: 'Kampus', key: 'campus', width: 20 },
      { header: 'Jenjang', key: 'jenjang', width: 14 },
      { header: 'Status Hasil', key: 'status', width: 16 },
      { header: 'Peringkat', key: 'rank', width: 12 },
      { header: 'Kategori Juara', key: 'award', width: 22 },
      { header: 'Keterangan', key: 'notes', width: 30 },
    ]

    // Style Header Row
    const headerRow = sheet.getRow(1)
    headerRow.height = 28
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF166534' }, // Forest Green
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    // Sample data rows
    sheet.addRow({
      no: 1,
      name: 'Muhammad Farhan',
      username: 'farhan_g1',
      campus: 'Gontor 1',
      jenjang: 'Jenjang 1',
      status: 'Juara',
      rank: 1,
      award: 'Juara 1',
      notes: 'Juara 1 Bidang Matematika Terpadu',
    })
    sheet.addRow({
      no: 2,
      name: 'Ahmad Fauzi',
      username: 'ahmad_g2',
      campus: 'Gontor 2',
      jenjang: 'Jenjang 2',
      status: 'Lolos Final',
      rank: '',
      award: '',
      notes: 'Lolos babak penyisihan',
    })
    sheet.addRow({
      no: 3,
      name: 'Rizky Pratama',
      username: 'rizky_g3',
      campus: 'Gontor 3',
      jenjang: 'Jenjang 3',
      status: 'Peserta',
      rank: '',
      award: '',
      notes: 'Peserta babak penyisihan',
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }
}

export const resultExcelImportService = new ResultExcelImportService()
