import * as XLSX from 'xlsx'
import type { ParsedWorkbookData, SheetDetectionResult } from '../types/excel'

export async function parseExcelWorkbook(file: File): Promise<ParsedWorkbookData> {
  const warnings: string[] = []

  // Basic file checks
  if (file.size === 0) {
    throw new Error('Berkas kosong (0 bytes). Silakan unggah berkas Excel atau CSV yang valid.')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran berkas melebihi batas maksimal 10 MB.')
  }

  let arrayBuffer: ArrayBuffer
  try {
    arrayBuffer = await file.arrayBuffer()
  } catch {
    throw new Error('Gagal membaca berkas dari sistem lokal.')
  }

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      raw: false, // Reads formatted strings to avoid scientific notation on NISN/phones
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Format tidak didukung'
    throw new Error(`Gagal membuka struktur berkas: ${msg}`)
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Berkas tidak memiliki sheet data yang dapat dibaca.')
  }

  const sheets: SheetDetectionResult[] = []
  let participantSheetName: string | null = null
  let teacherSheetName: string | null = null

  // Inspect all sheets
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    if (!sheet) continue

    const rowsJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as unknown as unknown[][]

    const headerRow = (rowsJson[0] || []) as string[]
    const cleanHeaders = headerRow.map((h) => String(h || '').trim()).filter(Boolean)
    const dataRowCount = Math.max(0, rowsJson.length - 1)

    const lowerName = name.toLowerCase().trim()
    let detectedType: SheetDetectionResult['detectedType'] = 'UNKNOWN'

    if (
      lowerName.includes('pendaftaran') ||
      lowerName.includes('peserta') ||
      lowerName.includes('siswa') ||
      lowerName.includes('participant')
    ) {
      detectedType = 'PESERTA'
      if (!participantSheetName) participantSheetName = name
    } else if (lowerName.includes('guru') || lowerName.includes('pembimbing') || lowerName.includes('teacher')) {
      detectedType = 'GURU'
      if (!teacherSheetName) teacherSheetName = name
    } else if (lowerName.includes('petunjuk') || lowerName.includes('panduan') || lowerName.includes('guide')) {
      detectedType = 'PETUNJUK'
    }

    sheets.push({
      sheetName: name,
      detectedType,
      rowCount: dataRowCount,
      headers: cleanHeaders,
    })
  }

  // Fallback if sheets weren't named with keywords: use the first sheet as PESERTA if none detected
  if (!participantSheetName && sheets.length > 0) {
    // Avoid picking Petunjuk or Contoh if another sheet exists
    const candidate = sheets.find(
      (s) => !s.sheetName.toLowerCase().includes('petunjuk') && !s.sheetName.toLowerCase().includes('contoh')
    ) || sheets[0]
    participantSheetName = candidate.sheetName
    candidate.detectedType = 'PESERTA'
    warnings.push(`Menggunakan sheet '${participantSheetName}' untuk data pendaftaran.`)
  }

  // Extract raw rows from Participant sheet
  let rawParticipantRows: Record<string, unknown>[] = []
  if (participantSheetName && workbook.Sheets[participantSheetName]) {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[participantSheetName],
      {
        raw: false, // preserve formatted string representations
        defval: '',
      }
    )

    // Filter out completely blank rows
    rawParticipantRows = rawRows.filter((row) =>
      Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
    )
  }

  // Extract raw rows from Teacher sheet if available
  let rawTeacherRows: Record<string, unknown>[] = []
  if (teacherSheetName && workbook.Sheets[teacherSheetName]) {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[teacherSheetName],
      {
        raw: false,
        defval: '',
      }
    )
    rawTeacherRows = rawRows.filter((row) =>
      Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
    )
  }

  if (rawParticipantRows.length === 0) {
    throw new Error(`Sheet '${participantSheetName || 'PENDAFTARAN'}' kosong atau tidak memiliki baris data.`)
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    sheets,
    participantSheetName,
    teacherSheetName,
    rawParticipantRows,
    rawTeacherRows,
    warnings,
  }
}
