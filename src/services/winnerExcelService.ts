import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { KAMPUS_OPTIONS, isValidKampus } from '../types/campus'
import {
  AWARD_OPTIONS,
  LEGACY_LOMBA_OPTIONS,
  normalizeCategoryName,
  type PeriodWinner,
} from './participantPeriodService'

export interface StagedWinnerRow {
  _id: string
  _status: 'VALID' | 'WARNING' | 'ERROR'
  _errors: Record<string, string>
  student_name: string
  nisn_username: string
  campus: string
  jenjang: string
  category: string
  award: string
  score: string | number
}

export interface WinnerImportStats {
  total: number
  valid: number
  warning: number
  error: number
}

export const JENJANG_OPTIONS = [
  'Jenjang 1',
  'Jenjang 2',
  'Jenjang 3',
  'Jenjang 4',
  'Jenjang 5',
] as const

export const MODERN_LOMBA_OPTIONS = [
  'Matematika Terpadu',
  'IPA / Sains Terpadu',
  'Fisika Terapan',
  'Biologi & Lingkungan',
  'Kimia Sains',
] as const

/**
 * Normalizes campus names from loose user inputs (e.g. 'gontor 1', 'gp 1', 'g1')
 */
export function normalizeCampusInput(input?: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (isValidKampus(trimmed)) return trimmed

  const lower = trimmed.toLowerCase().replace(/[-_]/g, ' ')
  for (const opt of KAMPUS_OPTIONS) {
    if (opt.toLowerCase() === lower) return opt
  }

  // Common shorthand aliases
  if (lower === 'g1' || lower === 'gontor1') return 'Gontor 1'
  if (lower === 'g2' || lower === 'gontor2') return 'Gontor 2'
  if (lower === 'g3' || lower === 'gontor3') return 'Gontor 3'
  if (lower === 'g4' || lower === 'gontor4') return 'Gontor 4'
  if (lower === 'g5' || lower === 'gontor5') return 'Gontor 5'
  if (lower === 'gp1' || lower === 'gontor putri 1' || lower === 'gp 1') return 'Gontor Putri 1'
  if (lower === 'gp2' || lower === 'gontor putri 2' || lower === 'gp 2') return 'Gontor Putri 2'
  if (lower === 'gp3' || lower === 'gontor putri 3' || lower === 'gp 3') return 'Gontor Putri 3'

  return trimmed
}

/**
 * Normalizes award / predikat juara from loose inputs
 */
export function normalizeAwardInput(input?: string): string {
  if (!input) return 'Juara 1'
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  if (lower === '1' || lower === 'juara 1' || lower.includes('emas') || lower === 'pertama') return 'Juara 1'
  if (lower === '2' || lower === 'juara 2' || lower.includes('perak') || lower === 'kedua') return 'Juara 2'
  if (lower === '3' || lower === 'juara 3' || lower.includes('perunggu') || lower === 'ketiga') return 'Juara 3'
  if (lower.includes('harapan 1') || lower.includes('harapn 1')) return 'Juara Harapan 1'
  if (lower.includes('harapan 2') || lower.includes('harapn 2')) return 'Juara Harapan 2'

  for (const opt of AWARD_OPTIONS) {
    if (opt.toLowerCase() === lower) return opt
  }
  return trimmed
}

/**
 * Normalizes jenjang from loose inputs (e.g. '1', 'kelas 1', 'jenjang 1')
 */
export function normalizeJenjangInput(input?: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  if (lower === '1' || lower === 'kelas 1' || lower === 'jenjang 1') return 'Jenjang 1'
  if (lower === '2' || lower === 'kelas 2' || lower === 'jenjang 2') return 'Jenjang 2'
  if (lower === '3' || lower === 'kelas 3' || lower === 'jenjang 3') return 'Jenjang 3'
  if (lower === '4' || lower === 'kelas 4' || lower === 'jenjang 4') return 'Jenjang 4'
  if (lower === '5' || lower === 'kelas 5' || lower === 'jenjang 5') return 'Jenjang 5'

  for (const opt of JENJANG_OPTIONS) {
    if (opt.toLowerCase() === lower) return opt
  }
  return trimmed
}

/**
 * Builds the official Excel template for winners
 */
export async function buildWinnerWorkbook(
  _periodName: string = 'OGSO',
  isLegacy: boolean = false
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Panitia Pusat OGSOreg'
  workbook.created = new Date()

  // 1. Sheet Referensi (Hidden)
  const wsRef = workbook.addWorksheet('_REFERENSI', { state: 'hidden' })
  KAMPUS_OPTIONS.forEach((k, idx) => {
    wsRef.getRow(idx + 1).getCell(1).value = k
  })
  AWARD_OPTIONS.forEach((a, idx) => {
    wsRef.getRow(idx + 1).getCell(2).value = a
  })
  JENJANG_OPTIONS.forEach((j, idx) => {
    wsRef.getRow(idx + 1).getCell(3).value = j
  })
  const categoryList = isLegacy ? LEGACY_LOMBA_OPTIONS : MODERN_LOMBA_OPTIONS
  categoryList.forEach((c, idx) => {
    wsRef.getRow(idx + 1).getCell(4).value = c
  })

  // 2. Sheet Data Juara
  const ws = workbook.addWorksheet('DATA JUARA', {
    views: [{ showGridLines: true }],
  })

  const headers = [
    'No',
    'Nama Santri (Wajib)',
    'NISN / Username (Opsional)',
    'Kampus (Wajib)',
    isLegacy ? 'Jenjang (Opsional)' : 'Jenjang (Wajib)',
    'Kategori Lomba (Wajib)',
    'Predikat Juara (Wajib)',
    'Nilai / Skor (Opsional)',
  ]

  const headerRow = ws.addRow(headers)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '166534' }, // OGSO Dark Green
    }
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFF' },
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    }
    cell.border = {
      top: { style: 'thin', color: { argb: '0E3F20' } },
      left: { style: 'thin', color: { argb: '0E3F20' } },
      bottom: { style: 'medium', color: { argb: '0E3F20' } },
      right: { style: 'thin', color: { argb: '0E3F20' } },
    }
  })

  // Column widths
  ws.columns = [
    { width: 6 },
    { width: 28 },
    { width: 20 },
    { width: 22 },
    { width: 18 },
    { width: 26 },
    { width: 20 },
    { width: 16 },
  ]

  // Add 3 sample data rows
  const sampleRows = isLegacy
    ? [
        [1, 'Ahmad Fauzi', '0082123451', 'Gontor 1', '', 'MTK Kibar', 'Juara 1', 97.5],
        [2, 'Fathimah Az-Zahra', '0082123452', 'Gontor Putri 1', '', 'IPA Kibar', 'Juara 2', 92.0],
        [3, 'Muhammad Rayhan', '0082123453', 'Gontor 2', '', 'IPA Shigor', 'Juara 3', 88.5],
      ]
    : [
        [1, 'Ahmad Fauzi', '0082123451', 'Gontor 1', 'Jenjang 1', 'Matematika Terpadu', 'Juara 1', 97.5],
        [2, 'Fathimah Az-Zahra', '0082123452', 'Gontor Putri 1', 'Jenjang 2', 'IPA / Sains Terpadu', 'Juara 2', 92.0],
        [3, 'Muhammad Rayhan', '0082123453', 'Gontor 2', 'Jenjang 3', 'Matematika Terpadu', 'Juara 3', 88.5],
      ]

  sampleRows.forEach((rowValues) => {
    const row = ws.addRow(rowValues)
    row.height = 22
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 10 }
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 || colNum === 5 || colNum === 7 || colNum === 8 ? 'center' : 'left',
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      }
    })
  })

  // Apply dropdown data validation to rows 2 to 100
  for (let r = 2; r <= 100; r++) {
    // Col D: Kampus
    ws.getCell(`D${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_REFERENSI!$A$1:$A$${KAMPUS_OPTIONS.length}`],
      showErrorMessage: true,
      errorTitle: 'Kampus Tidak Valid',
      error: 'Pilih salah satu dari 20 Kampus Gontor resmi.',
    }

    // Col E: Jenjang
    ws.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_REFERENSI!$C$1:$C$${JENJANG_OPTIONS.length}`],
    }

    // Col G: Predikat Juara
    ws.getCell(`G${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_REFERENSI!$B$1:$B$${AWARD_OPTIONS.length}`],
      showErrorMessage: true,
      errorTitle: 'Predikat Juara Tidak Valid',
      error: 'Pilih antara Juara 1, Juara 2, Juara 3, Juara Harapan 1, atau Juara Harapan 2.',
    }
  }

  return workbook
}

/**
 * Downloads the winner template file directly to the user's browser
 */
export async function downloadWinnerTemplate(
  periodName: string = 'OGSO',
  isLegacy: boolean = false
): Promise<void> {
  const workbook = await buildWinnerWorkbook(periodName, isLegacy)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const cleanName = periodName.replace(/[^a-zA-Z0-9_-]/g, '_')
  a.download = `Template_Import_Juara_${cleanName}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parses an uploaded Excel or CSV file into staged winner rows
 */
export async function parseWinnerExcelFile(file: File): Promise<StagedWinnerRow[]> {
  if (file.size === 0) {
    throw new Error('Berkas kosong (0 bytes). Silakan unggah berkas Excel atau CSV yang valid.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran berkas melebihi batas maksimal 10 MB.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    raw: false,
  })

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Berkas tidak memiliki sheet data.')
  }

  // Find the most appropriate sheet (prefer 'DATA JUARA', 'JUARA', 'PEMENANG', or first sheet)
  let sheetName = workbook.SheetNames[0]
  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase()
    if (lower.includes('juara') || lower.includes('pemenang') || lower.includes('winner')) {
      sheetName = name
      break
    }
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('Lembar data tidak ditemukan.')
  }

  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  })

  if (!jsonRows || jsonRows.length === 0) {
    throw new Error('Tidak ada data yang ditemukan di sheet tersebut.')
  }

  // Helper to find header key by fuzzy matching
  const findValue = (row: Record<string, unknown>, patterns: string[]): string => {
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase().trim()
      for (const p of patterns) {
        if (lowerKey === p || lowerKey.includes(p)) {
          return String(row[key] ?? '').trim()
        }
      }
    }
    return ''
  }

  const staged: StagedWinnerRow[] = []

  jsonRows.forEach((row, idx) => {
    const student_name = findValue(row, ['nama santri', 'nama lengkap', 'nama siswa', 'nama', 'student', 'peserta'])
    const nisn_username = findValue(row, ['nisn', 'username', 'nis', 'no induk', 'id'])
    const campus = findValue(row, ['kampus', 'cabang', 'pondok', 'campus', 'pesantren'])
    const jenjang = findValue(row, ['jenjang', 'kelas', 'tingkat', 'level'])
    const category = findValue(row, ['kategori lomba', 'kategori', 'lomba', 'bidang', 'mapel', 'subject'])
    const award = findValue(row, ['predikat juara', 'predikat', 'juara', 'peringkat', 'award', 'rank'])
    const scoreRaw = findValue(row, ['nilai / skor', 'nilai', 'skor', 'score', 'poin'])

    // Skip empty filler rows
    if (!student_name && !campus && !award && !category) {
      return
    }

    staged.push({
      _id: `staged-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      _status: 'VALID',
      _errors: {},
      student_name,
      nisn_username,
      campus: normalizeCampusInput(campus),
      jenjang: normalizeJenjangInput(jenjang),
      category: normalizeCategoryName(category),
      award: normalizeAwardInput(award),
      score: scoreRaw !== '' ? Number(scoreRaw) || scoreRaw : '',
    })
  })

  return staged
}

/**
 * Validates staged winner rows against business rules & existing database winners
 */
export function validateWinnerRows(
  rows: StagedWinnerRow[],
  existingWinners: PeriodWinner[] = [],
  isLegacy: boolean = false
): { stagedRows: StagedWinnerRow[]; stats: WinnerImportStats } {
  let validCount = 0
  let warningCount = 0
  let errorCount = 0

  const nameCategorySet = new Set<string>()

  const stagedRows = rows.map((row) => {
    const errors: Record<string, string> = {}
    let status: StagedWinnerRow['_status'] = 'VALID'

    // 1. Nama Santri (Required)
    if (!row.student_name.trim()) {
      errors.student_name = 'Nama santri wajib diisi.'
      status = 'ERROR'
    }

    // 2. Kampus (Required and must be valid)
    const normCampus = normalizeCampusInput(row.campus)
    if (!normCampus) {
      errors.campus = 'Kampus wajib dipilih.'
      status = 'ERROR'
    } else if (!isValidKampus(normCampus)) {
      errors.campus = `Kampus '${normCampus}' tidak dikenali. Pilih salah satu dari 20 Kampus Gontor.`
      status = 'ERROR'
    }

    // 3. Jenjang (Required for non-legacy)
    if (!isLegacy && !row.jenjang.trim()) {
      errors.jenjang = 'Jenjang wajib diisi untuk periode ini.'
      status = 'ERROR'
    }

    // 4. Predikat Juara (Required)
    const normAward = normalizeAwardInput(row.award)
    if (!normAward) {
      errors.award = 'Predikat juara wajib diisi.'
      status = 'ERROR'
    }

    // 5. Kategori Lomba (Required)
    if (!row.category.trim()) {
      errors.category = 'Kategori lomba wajib diisi.'
      status = 'ERROR'
    }

    // 6. Nilai (Optional, but if filled must be numeric 0 - 100)
    if (row.score !== '' && row.score !== undefined && row.score !== null) {
      const num = Number(row.score)
      if (isNaN(num) || num < 0 || num > 100) {
        errors.score = 'Nilai harus berupa angka antara 0 s.d 100.'
        if (status !== 'ERROR') status = 'ERROR'
      }
    }

    // 7. Duplicate check within file
    const dedupeKey = `${row.student_name.toLowerCase().trim()}_${row.category.toLowerCase().trim()}`
    if (nameCategorySet.has(dedupeKey)) {
      if (status !== 'ERROR') {
        errors.duplicate = 'Santri ini tercatat lebih dari satu kali pada kategori lomba yang sama dalam berkas ini.'
        status = 'WARNING'
      }
    } else {
      nameCategorySet.add(dedupeKey)
    }

    // 8. Duplicate check with existing database winners
    const alreadyInDb = existingWinners.some(
      (ew) =>
        ew.student_name.toLowerCase().trim() === row.student_name.toLowerCase().trim() &&
        ew.category.toLowerCase().trim() === row.category.toLowerCase().trim()
    )
    if (alreadyInDb && status === 'VALID') {
      errors.duplicate = 'Santri ini sudah tercatat sebagai pemenang pada kategori ini di database.'
      status = 'WARNING'
    }

    if (status === 'VALID') validCount++
    else if (status === 'WARNING') warningCount++
    else errorCount++

    return {
      ...row,
      campus: normCampus,
      award: normAward,
      _status: status,
      _errors: errors,
    }
  })

  return {
    stagedRows,
    stats: {
      total: stagedRows.length,
      valid: validCount,
      warning: warningCount,
      error: errorCount,
    },
  }
}
