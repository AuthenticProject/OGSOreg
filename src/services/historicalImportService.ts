import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { KAMPUS_OPTIONS, isValidKampus, type StudentKampus } from '../types/campus'
import {
  normalizeCampusInput,
  normalizeAwardInput,
  normalizeJenjangInput,
} from './winnerExcelService'
import {
  participantPeriodService,
  normalizeCategoryName,
  type PeriodWinner,
  type CompetitionPeriod,
} from './participantPeriodService'
import {
  hallOfFameService,
  classifyAward,
} from './hallOfFameService'
import type {
  HistoricalAggregateRecord,
} from '../types/hallOfFame'

export interface HistoricalStagedRow {
  _id: string
  _status: 'VALID' | 'WARNING' | 'ERROR'
  _errors: Record<string, string>
  mode: 'individual' | 'aggregate'
  // Individual fields
  student_name?: string
  nisn_username?: string
  jenjang?: string
  category?: string
  award?: string
  score?: number | string
  // Common / Aggregate fields
  period_name: string
  year: number
  campus: string
  gold?: number
  silver?: number
  bronze?: number
  honorable_1?: number
  honorable_2?: number
  notes?: string
}

export interface HistoricalImportValidationResult {
  stagedRows: HistoricalStagedRow[]
  stats: {
    total: number
    valid: number
    warning: number
    error: number
    individualCount: number
    aggregateCount: number
  }
}

/**
 * Generates an official Excel template for historical results.
 * Contains 2 clearly documented sheets:
 * 1. "Pemenang Perorangan" (Detail santri juara)
 * 2. "Rekapitulasi Kampus" (Agregat historis arsip lama tanpa nama perorangan)
 */
export async function buildHistoricalImportWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Panitia Pusat OGSOreg — Hall of Fame'
  wb.created = new Date()

  // 0. Reference Sheet (Hidden)
  const wsRef = wb.addWorksheet('_REFERENSI', { state: 'hidden' })
  KAMPUS_OPTIONS.forEach((k, idx) => {
    wsRef.getRow(idx + 1).getCell(1).value = k
  })
  ;['Juara 1 (Emas)', 'Juara 2 (Perak)', 'Juara 3 (Perunggu)', 'Juara Harapan 1', 'Juara Harapan 2'].forEach(
    (a, idx) => {
      wsRef.getRow(idx + 1).getCell(2).value = a
    }
  )

  // Header styles
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C241B' }, // Deep Forest
  }
  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  }

  // -------------------------------------------------------------
  // Sheet 1: Pemenang Perorangan
  // -------------------------------------------------------------
  const wsIndiv = wb.addWorksheet('Pemenang Perorangan')
  wsIndiv.views = [{ showGridLines: true }]

  wsIndiv.columns = [
    { header: 'Tahun / Periode', key: 'period', width: 16 },
    { header: 'Nama Lengkap Santri', key: 'student_name', width: 28 },
    { header: 'NISN / Stambuk (Opsional)', key: 'nisn', width: 20 },
    { header: 'Kampus Gontor', key: 'campus', width: 22 },
    { header: 'Jenjang (1–5)', key: 'jenjang', width: 16 },
    { header: 'Bidang Lomba', key: 'category', width: 24 },
    { header: 'Predikat Juara', key: 'award', width: 20 },
    { header: 'Nilai Akhir', key: 'score', width: 14 },
  ]

  const indivHeader = wsIndiv.getRow(1)
  indivHeader.height = 28
  indivHeader.eachCell((cell) => {
    cell.fill = headerFill
    cell.font = headerFont
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // Sample Rows
  wsIndiv.addRow([2025, 'Ahmad Fauzi', '0082123451', 'Gontor 1', 'Jenjang 1', 'IPA Shigor', 'Juara 1', 96.5])
  wsIndiv.addRow([2025, 'Budi Santoso', '0082123452', 'Gontor 2', 'Jenjang 2', 'MTK Shigor', 'Juara 2', 92.0])
  wsIndiv.addRow([2024, 'Fatimah Az-Zahra', '0082123453', 'Gontor Putri 1', 'Jenjang 3', 'IPA Kibar', 'Juara 1', 98.0])

  // -------------------------------------------------------------
  // Sheet 2: Rekapitulasi Kampus (Aggregate)
  // -------------------------------------------------------------
  const wsAgg = wb.addWorksheet('Rekapitulasi Kampus (Agregat)')
  wsAgg.views = [{ showGridLines: true }]

  wsAgg.columns = [
    { header: 'Tahun / Periode', key: 'period', width: 16 },
    { header: 'Kampus Gontor', key: 'campus', width: 24 },
    { header: 'Emas (Juara 1)', key: 'gold', width: 16 },
    { header: 'Perak (Juara 2)', key: 'silver', width: 16 },
    { header: 'Perunggu (Juara 3)', key: 'bronze', width: 18 },
    { header: 'Harapan 1', key: 'hm1', width: 14 },
    { header: 'Harapan 2', key: 'hm2', width: 14 },
    { header: 'Catatan Arsip', key: 'notes', width: 32 },
  ]

  const aggHeader = wsAgg.getRow(1)
  aggHeader.height = 28
  aggHeader.eachCell((cell) => {
    cell.fill = headerFill
    cell.font = headerFont
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // Sample aggregate rows
  wsAgg.addRow([2023, 'Gontor 1', 3, 2, 1, 1, 0, 'Rekapitulasi Arsip Panitia Pusat 2023'])
  wsAgg.addRow([2023, 'Gontor 3', 2, 1, 3, 0, 1, 'Rekapitulasi Arsip Panitia Pusat 2023'])
  wsAgg.addRow([2023, 'Gontor Putri 1', 4, 1, 2, 1, 1, 'Rekapitulasi Arsip Panitia Pusat 2023'])

  return wb
}

/**
 * Downloads the historical import Excel template in the browser.
 */
export async function downloadHistoricalImportTemplate(): Promise<void> {
  const wb = await buildHistoricalImportWorkbook()
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Template_Import_Historis_Hall_of_Fame_OGSO.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parses an uploaded Excel file for historical data.
 * Checks both individual winners and aggregate sheets.
 */
export async function parseHistoricalExcelFile(file: File): Promise<HistoricalStagedRow[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const stagedRows: HistoricalStagedRow[] = []

  // Check all sheet names
  for (const sheetName of wb.SheetNames) {
    if (sheetName.startsWith('_')) continue // skip hidden ref

    const ws = wb.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
    if (rawData.length <= 1) continue

    const headerRow = (rawData[0] || []).map((c) => String(c || '').trim().toLowerCase())

    // Detect if this sheet is Aggregate or Individual
    const isAggSheet =
      sheetName.toLowerCase().includes('rekap') ||
      sheetName.toLowerCase().includes('agregat') ||
      (headerRow.some((h) => h.includes('emas') || h.includes('gold')) &&
        headerRow.some((h) => h.includes('perak') || h.includes('silver')))

    if (isAggSheet) {
      // Find col indices
      const colPeriod = headerRow.findIndex((h) => h.includes('tahun') || h.includes('periode'))
      const colCampus = headerRow.findIndex((h) => h.includes('kampus') || h.includes('kontingen'))
      const colGold = headerRow.findIndex((h) => h.includes('emas') || h.includes('juara 1') || h.includes('gold'))
      const colSilver = headerRow.findIndex((h) => h.includes('perak') || h.includes('juara 2') || h.includes('silver'))
      const colBronze = headerRow.findIndex((h) => h.includes('perunggu') || h.includes('juara 3') || h.includes('bronze'))
      const colHm1 = headerRow.findIndex((h) => h.includes('harapan 1') || h.includes('hm 1'))
      const colHm2 = headerRow.findIndex((h) => h.includes('harapan 2') || h.includes('hm 2'))
      const colNotes = headerRow.findIndex((h) => h.includes('catatan') || h.includes('notes'))

      for (let r = 1; r < rawData.length; r++) {
        const row = rawData[r]
        if (!row || row.length === 0 || !row.some((cell) => cell !== undefined && cell !== '')) continue

        const periodVal = colPeriod >= 0 ? String(row[colPeriod] || '').trim() : ''
        const campusVal = colCampus >= 0 ? String(row[colCampus] || '').trim() : ''
        const yearMatch = periodVal.match(/\b(20\d\d)\b/)
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

        const gold = colGold >= 0 ? Math.max(0, parseInt(String(row[colGold] || '0'), 10) || 0) : 0
        const silver = colSilver >= 0 ? Math.max(0, parseInt(String(row[colSilver] || '0'), 10) || 0) : 0
        const bronze = colBronze >= 0 ? Math.max(0, parseInt(String(row[colBronze] || '0'), 10) || 0) : 0
        const hm1 = colHm1 >= 0 ? Math.max(0, parseInt(String(row[colHm1] || '0'), 10) || 0) : 0
        const hm2 = colHm2 >= 0 ? Math.max(0, parseInt(String(row[colHm2] || '0'), 10) || 0) : 0
        const notes = colNotes >= 0 ? String(row[colNotes] || '').trim() : ''

        stagedRows.push({
          _id: `staged-agg-${r}-${Date.now().toString(36)}`,
          _status: 'VALID',
          _errors: {},
          mode: 'aggregate',
          period_name: periodVal || `OGSO ${year}`,
          year,
          campus: normalizeCampusInput(campusVal),
          gold,
          silver,
          bronze,
          honorable_1: hm1,
          honorable_2: hm2,
          notes,
        })
      }
    } else {
      // Individual Sheet
      const colPeriod = headerRow.findIndex((h) => h.includes('tahun') || h.includes('periode'))
      const colName = headerRow.findIndex((h) => h.includes('nama') || h.includes('santri'))
      const colNisn = headerRow.findIndex((h) => h.includes('nisn') || h.includes('stambuk') || h.includes('username'))
      const colCampus = headerRow.findIndex((h) => h.includes('kampus'))
      const colJenjang = headerRow.findIndex((h) => h.includes('jenjang') || h.includes('kelas'))
      const colCat = headerRow.findIndex((h) => h.includes('bidang') || h.includes('lomba') || h.includes('mata'))
      const colAward = headerRow.findIndex((h) => h.includes('juara') || h.includes('predikat') || h.includes('award'))
      const colScore = headerRow.findIndex((h) => h.includes('nilai') || h.includes('score'))

      for (let r = 1; r < rawData.length; r++) {
        const row = rawData[r]
        if (!row || row.length === 0 || !row.some((cell) => cell !== undefined && cell !== '')) continue

        const periodVal = colPeriod >= 0 ? String(row[colPeriod] || '').trim() : ''
        const nameVal = colName >= 0 ? String(row[colName] || '').trim() : ''
        const nisnVal = colNisn >= 0 ? String(row[colNisn] || '').trim() : ''
        const campusVal = colCampus >= 0 ? String(row[colCampus] || '').trim() : ''
        const jenjangVal = colJenjang >= 0 ? String(row[colJenjang] || '').trim() : ''
        const catVal = colCat >= 0 ? String(row[colCat] || '').trim() : ''
        const awardVal = colAward >= 0 ? String(row[colAward] || '').trim() : ''
        const scoreVal = colScore >= 0 ? row[colScore] : ''

        const yearMatch = periodVal.match(/\b(20\d\d)\b/)
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

        stagedRows.push({
          _id: `staged-ind-${r}-${Date.now().toString(36)}`,
          _status: 'VALID',
          _errors: {},
          mode: 'individual',
          period_name: periodVal || `OGSO ${year}`,
          year,
          student_name: nameVal,
          nisn_username: nisnVal,
          campus: normalizeCampusInput(campusVal),
          jenjang: normalizeJenjangInput(jenjangVal),
          category: normalizeCategoryName(catVal),
          award: normalizeAwardInput(awardVal),
          score: scoreVal !== undefined && scoreVal !== '' ? Number(scoreVal) : undefined,
        })
      }
    }
  }

  return stagedRows
}

/**
 * Validates staged rows for errors, missing fields, or unrecognized campus names.
 */
export function validateHistoricalRows(
  rows: HistoricalStagedRow[]
): HistoricalImportValidationResult {
  let validCount = 0
  let warningCount = 0
  let errorCount = 0
  let individualCount = 0
  let aggregateCount = 0

  const validated: HistoricalStagedRow[] = rows.map((row) => {
    const errors: Record<string, string> = {}
    let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID'

    if (row.mode === 'individual') {
      individualCount++
      if (!row.student_name || row.student_name.trim().length < 2) {
        errors.student_name = 'Nama santri wajib diisi (minimal 2 karakter).'
        status = 'ERROR'
      }

      if (!row.campus || !isValidKampus(row.campus)) {
        errors.campus = `Kampus '${row.campus || ''}' tidak dikenali. Pilih salah satu dari 20 Kampus Gontor resmi.`
        status = 'ERROR'
      }

      if (!row.award) {
        errors.award = 'Predikat juara wajib diisi.'
        status = 'ERROR'
      } else {
        const tier = classifyAward(row.award)
        if (!tier) {
          errors.award = `Predikat '${row.award}' bukan penghargaan medali atau harapan yang sah.`
          status = 'ERROR'
        }
      }

      if (!row.category) {
        errors.category = 'Bidang lomba belum terisi.'
        if (status !== 'ERROR') status = 'WARNING'
      }
    } else {
      aggregateCount++
      if (!row.campus || !isValidKampus(row.campus)) {
        errors.campus = `Kampus '${row.campus || ''}' tidak dikenali. Pilih salah satu dari 20 Kampus Gontor resmi.`
        status = 'ERROR'
      }

      const totalAwards =
        (row.gold || 0) +
        (row.silver || 0) +
        (row.bronze || 0) +
        (row.honorable_1 || 0) +
        (row.honorable_2 || 0)

      if (totalAwards === 0) {
        errors.awards = 'Total raihan medali / penghargaan pada baris ini adalah 0.'
        if (status !== 'ERROR') status = 'WARNING'
      }
    }

    if (status === 'ERROR') errorCount++
    else if (status === 'WARNING') warningCount++
    else validCount++

    return {
      ...row,
      _status: status,
      _errors: errors,
    }
  })

  return {
    stagedRows: validated,
    stats: {
      total: validated.length,
      valid: validCount,
      warning: warningCount,
      error: errorCount,
      individualCount,
      aggregateCount,
    },
  }
}

/**
 * Commits the validated historical import rows into database / storage.
 * Resolves or creates periods if necessary, and logs the audit event.
 */
export async function commitHistoricalImport(
  rows: HistoricalStagedRow[],
  filename: string,
  operatorName: string = 'Super Admin'
): Promise<{ success: boolean; importedCount: number; periodNames: string[] }> {
  // Only import valid or warning rows (skip hard errors)
  const rowsToImport = rows.filter((r) => r._status !== 'ERROR')
  if (rowsToImport.length === 0) {
    return { success: false, importedCount: 0, periodNames: [] }
  }

  const existingPeriods = participantPeriodService.getPeriods()
  const periodMap = new Map<string, CompetitionPeriod>()
  existingPeriods.forEach((p) => {
    periodMap.set(p.name.toLowerCase(), p)
    periodMap.set(p.year.toString(), p)
    periodMap.set(p.id, p)
  })

  const affectedPeriods = new Set<string>()
  const newIndividualWinners: Array<Omit<PeriodWinner, 'id' | 'created_at'>> = []
  const newAggregates: HistoricalAggregateRecord[] = []

  // Ensure periods exist or create them
  for (const row of rowsToImport) {
    let periodKey = row.period_name.toLowerCase()
    let period = periodMap.get(periodKey) || periodMap.get(row.year.toString())

    if (!period) {
      // Auto-create period for this historical year
      period = participantPeriodService.savePeriod({
        name: row.period_name || `OGSO ${row.year}`,
        year: row.year,
        description: `Arsip Historis Olimpiade Gontor Sains & Matematika ${row.year}`,
        status: row.year >= 2026 ? 'active' : 'completed',
        is_published: true, // published for Hall of Fame
        start_date: `${row.year}-01-10`,
        end_date: `${row.year}-11-20`,
      })
      periodMap.set(period.name.toLowerCase(), period)
      periodMap.set(period.year.toString(), period)
      periodMap.set(period.id, period)
    }

    affectedPeriods.add(period.name)

    if (row.mode === 'individual') {
      newIndividualWinners.push({
        period_id: period.id,
        student_name: row.student_name!,
        nisn_username: row.nisn_username || `STB-${Math.floor(100000 + Math.random() * 900000)}`,
        campus: row.campus,
        jenjang: row.jenjang,
        award: row.award!,
        category: row.category || 'Bidang Terpadu',
        score: typeof row.score === 'number' ? row.score : undefined,
      })
    } else {
      newAggregates.push({
        id: `agg-${period.id}-${campusToSlug(row.campus)}-${Date.now().toString(36)}`,
        period_id: period.id,
        period_year: period.year,
        period_name: period.name,
        campus: row.campus as StudentKampus,
        gold: row.gold || 0,
        silver: row.silver || 0,
        bronze: row.bronze || 0,
        honorable_1: row.honorable_1 || 0,
        honorable_2: row.honorable_2 || 0,
        source: 'imported_aggregate',
        notes: row.notes,
        created_at: new Date().toISOString(),
      })
    }
  }

  // Save individual winners
  for (const win of newIndividualWinners) {
    participantPeriodService.saveWinner(win)
  }

  // Save aggregate records
  if (newAggregates.length > 0) {
    hallOfFameService.saveHistoricalAggregates(newAggregates)
  }

  // Log Audit
  const periodNamesList = Array.from(affectedPeriods)
  hallOfFameService.logAudit({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    filename,
    operator: operatorName,
    records_imported: rowsToImport.length,
    period_name: periodNamesList.join(', '),
    mode: newIndividualWinners.length > 0 ? 'individual_winners' : 'aggregate_campus',
    status: 'success',
    details: `Berhasil mengimpor ${newIndividualWinners.length} data santri perorangan dan ${newAggregates.length} rekapitulasi agregat kampus ke dalam Hall of Fame.`,
  })

  return {
    success: true,
    importedCount: rowsToImport.length,
    periodNames: periodNamesList,
  }
}

function campusToSlug(campus: string): string {
  return campus.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
