import { create } from 'zustand'
import { parseExcelWorkbook } from '../services/excelParser'
import { autoMapHeaders } from '../services/headerMapper'
import { processAndValidateRows, validateAllStagedRows } from '../services/validationEngine'
import { downloadMoodleCsvFile } from '../services/moodleCsvService'
import {
  normalizeString,
  normalizeUsername,
  normalizeEmail,
  normalizeJenjang,
  normalizeKampus,
  normalizeNisn,
  normalizeGender,
  normalizePhone,
  normalizeNpsn,
} from '../services/dataNormalizer'
import type { ColumnMappingItem, ImportStatistics, ParsedWorkbookData, StagedParticipantRow } from '../types/excel'
import type { Competition } from '../types/database'
import { studentRepository } from '../services/studentRepository'
import type { StudentSource, StudentJenjang } from '../types/student'

export type FilterStatusType = 'ALL' | 'VALID' | 'WARNING' | 'ERROR' | 'DUPLICATE'

export interface ExportResultSummary {
  filename: string
  totalExported: number
  byteSize: number
  timestamp: string
}

interface ImportState {
  currentStep: number
  uploadedFile: { name: string; size: number } | null
  workbookData: ParsedWorkbookData | null
  columnMappings: ColumnMappingItem[]
  stagedRows: StagedParticipantRow[]
  selectedRowIds: string[]
  stats: ImportStatistics
  filterStatus: FilterStatusType
  searchTerm: string
  isParsing: boolean
  parseError: string | null
  selectedCompetition: Competition | null
  exportResult: ExportResultSummary | null
  accessControl: { username?: string; userRole?: string; assignedCampus?: string | null } | null

  // Actions
  setAccessControl: (ctx: { username?: string; userRole?: string; assignedCampus?: string | null } | null) => void
  setCurrentStep: (step: number) => void
  handleFileUpload: (file: File) => Promise<void>
  updateColumnMapping: (excelHeader: string, targetField: string | null) => void
  applyMappings: () => void
  addManualRow: (data?: Partial<StagedParticipantRow>) => void
  handlePasteFromSpreadsheet: (text: string) => { success: boolean; count: number; error?: string }
  updateCell: (rowId: string, field: string, value: string) => void
  deleteSelectedRows: () => void
  deleteSingleRow: (rowId: string) => void
  setSelectedRowIds: (ids: string[]) => void
  toggleSelectRow: (rowId: string) => void
  toggleSelectAll: (allIds: string[]) => void
  setFilterStatus: (filter: FilterStatusType) => void
  setSearchTerm: (term: string) => void
  setSelectedCompetition: (comp: Competition | null) => void
  setStagedRows: (rows: StagedParticipantRow[]) => void
  saveStagedToStudentsDirectory: (
    institutionId: string,
    createdBy?: string
  ) => Promise<{
    savedCount: number
    duplicatesCount: number
    errorsCount: number
    duplicateDetails: string[]
  }>
  triggerMoodleCsvExport: (customFilename?: string, institutionId?: string) => ExportResultSummary
  resetImport: () => void
  reset: () => void
}

const initialStats: ImportStatistics = {
  total: 0,
  valid: 0,
  warning: 0,
  error: 0,
  duplicate: 0,
}

export const useImportStore = create<ImportState>((set, get) => ({
  currentStep: 1,
  uploadedFile: null,
  workbookData: null,
  columnMappings: [],
  stagedRows: [],
  selectedRowIds: [],
  stats: initialStats,
  filterStatus: 'ALL',
  searchTerm: '',
  isParsing: false,
  parseError: null,
  selectedCompetition: null,
  exportResult: null,
  accessControl: null,

  setAccessControl: (ctx) => {
    const prev = get().accessControl
    // If campus or user changed, reset all import registration state from the beginning!
    if (prev && (prev.assignedCampus !== ctx?.assignedCampus || prev.username !== ctx?.username)) {
      get().resetImport()
    }
    set({ accessControl: ctx })
  },
  setCurrentStep: (step: number) => set({ currentStep: step }),

  handleFileUpload: async (file: File) => {
    set({
      isParsing: true,
      parseError: null,
      uploadedFile: { name: file.name, size: file.size },
    })

    try {
      const parsed = await parseExcelWorkbook(file)
      // Extract headers from detected participant sheet
      const detectedSheet = parsed.sheets.find(
        (s) => s.sheetName === parsed.participantSheetName
      )
      const headers = detectedSheet ? detectedSheet.headers : []

      const mappings = autoMapHeaders(headers, parsed.rawParticipantRows)

      // Directly process and validate rows into staging
      const { stagedRows, stats } = processAndValidateRows(
        parsed.rawParticipantRows,
        mappings
      )

      set({
        workbookData: parsed,
        columnMappings: mappings,
        stagedRows,
        stats,
        isParsing: false,
        currentStep: 2, // Advance directly to Review & Validate
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memproses berkas Excel atau CSV.'
      set({
        isParsing: false,
        parseError: message,
      })
    }
  },

  updateColumnMapping: (excelHeader: string, targetField: string | null) => {
    const { columnMappings } = get()
    const updated = columnMappings.map((m) => {
      if (m.excelHeader === excelHeader) {
        return {
          ...m,
          targetField,
          confidence: 'manual' as const,
        }
      }
      if (targetField && m.targetField === targetField) {
        return {
          ...m,
          targetField: null,
          confidence: 'unmapped' as const,
        }
      }
      return m
    })
    set({ columnMappings: updated })
  },

  applyMappings: () => {
    const { workbookData, columnMappings } = get()
    if (!workbookData || !workbookData.rawParticipantRows.length) return

    const { stagedRows, stats } = processAndValidateRows(
      workbookData.rawParticipantRows,
      columnMappings,
      get().accessControl || undefined
    )

    set({
      stagedRows,
      stats,
      currentStep: 2, // Advance to Review & Validate
    })
  },

  addManualRow: (customData?: Partial<StagedParticipantRow>) => {
    const { stagedRows, accessControl } = get()
    const newIndex = stagedRows.length + 1
    const newRow: StagedParticipantRow = {
      _rowId: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      _rowIndex: newIndex + 1,
      _status: 'ERROR',
      _errors: {},
      _warnings: {},
      _isDuplicate: false,

      username: customData?.username || '',
      firstname: customData?.firstname || '',
      lastname: customData?.lastname || '',
      email: customData?.email || '',
      jenjang: customData?.jenjang || 'Kelas 1',
      kampus: customData?.kampus || accessControl?.assignedCampus || '',

      no: String(newIndex),
      full_name: [customData?.firstname, customData?.lastname].filter(Boolean).join(' '),
      nisn: customData?.nisn || '',
      gender: customData?.gender || 'L',
      grade_level: customData?.jenjang || 'Kelas 1',
      school_name: customData?.school_name || '',
      competition_category: customData?.competition_category || '',
      teacher_name: customData?.teacher_name || '',
    }

    const updated = [...stagedRows, newRow]
    const { stagedRows: validatedRows, stats } = validateAllStagedRows(
      updated,
      get().accessControl || undefined
    )

    set({
      stagedRows: validatedRows,
      stats,
      currentStep: 2, // Move to preview if added from step 1
    })
  },

  handlePasteFromSpreadsheet: (rawText: string) => {
    if (!rawText || !rawText.trim()) {
      return { success: false, count: 0, error: 'Teks tempelan kosong.' }
    }

    try {
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)

      if (lines.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris data yang terdeteksi.' }
      }

      // Check if delimiter is tab or comma or semicolon
      const firstLine = lines[0]
      const delimiter = firstLine.includes('\t')
        ? '\t'
        : firstLine.includes(';')
        ? ';'
        : ','

      const firstCols = firstLine.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''))
      const firstColStr = firstCols.join(' ').toLowerCase()

      const hasHeader =
        firstColStr.includes('user') ||
        firstColStr.includes('nama') ||
        firstColStr.includes('email') ||
        firstColStr.includes('jenjang') ||
        firstColStr.includes('kelas')

      const dataLines = hasHeader ? lines.slice(1) : lines

      if (dataLines.length === 0) {
        return { success: false, count: 0, error: 'Hanya header yang terdeteksi, tidak ada baris data.' }
      }

      const { stagedRows } = get()
      const newRows: StagedParticipantRow[] = dataLines.map((line, idx) => {
        const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''))
        const username = normalizeUsername(cols[0] || '')
        const firstname = normalizeString(cols[1] || '')
        const lastname = normalizeString(cols[2] || '')
        const email = normalizeEmail(cols[3] || '')
        const jenjang = normalizeJenjang(cols[4] || 'Kelas 1')
        const kampus = normalizeKampus(cols[5] || '')

        const rowNum = stagedRows.length + idx + 2
        return {
          _rowId: `paste-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          _rowIndex: rowNum,
          _status: 'VALID',
          _errors: {},
          _warnings: {},
          _isDuplicate: false,

          username,
          firstname,
          lastname,
          email,
          jenjang,
          kampus,

          no: String(stagedRows.length + idx + 1),
          full_name: `${firstname} ${lastname}`.trim(),
          nisn: username,
          gender: 'L',
          grade_level: jenjang,
          school_name: '',
          competition_category: '',
          teacher_name: '',
        }
      })

      const combined = [...stagedRows, ...newRows]
      const { stagedRows: validatedRows, stats } = validateAllStagedRows(combined, get().accessControl || undefined)

      set({
        stagedRows: validatedRows,
        stats,
        currentStep: 2, // Advance to review
        uploadedFile: { name: `Tempelan Spreadsheet (${newRows.length} peserta)`, size: rawText.length },
      })

      return { success: true, count: newRows.length }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses data tempelan.'
      return { success: false, count: 0, error: msg }
    }
  },

  updateCell: (rowId: string, field: string, rawValue: string) => {
    const { stagedRows } = get()

    // Normalize value according to field rules
    let cleanVal = normalizeString(rawValue)
    if (field === 'username') cleanVal = normalizeUsername(rawValue)
    else if (field === 'email') cleanVal = normalizeEmail(rawValue)
    else if (field === 'jenjang') cleanVal = normalizeJenjang(rawValue)
    else if (field === 'kampus') cleanVal = normalizeKampus(rawValue)
    else if (field === 'nisn') cleanVal = normalizeNisn(rawValue)
    else if (field === 'gender') cleanVal = normalizeGender(rawValue)
    else if (field === 'teacher_phone') cleanVal = normalizePhone(rawValue)
    else if (field === 'npsn') cleanVal = normalizeNpsn(rawValue)

    const updatedRows = stagedRows.map((row) => {
      if (row._rowId === rowId) {
        const updated = {
          ...row,
          [field]: cleanVal,
        }
        // Sync full_name if firstname or lastname is modified
        if (field === 'firstname' || field === 'lastname') {
          const fn = field === 'firstname' ? cleanVal : (row.firstname || '')
          const ln = field === 'lastname' ? cleanVal : (row.lastname || '')
          updated.full_name = [fn, ln].filter(Boolean).join(' ')
        }
        return updated
      }
      return row
    })

    // Re-validate the entire batch so duplicate states update immediately
    const { stagedRows: validatedRows, stats } = validateAllStagedRows(updatedRows, get().accessControl || undefined)

    set({
      stagedRows: validatedRows,
      stats,
    })
  },

  deleteSelectedRows: () => {
    const { stagedRows, selectedRowIds } = get()
    const remaining = stagedRows.filter((r) => !selectedRowIds.includes(r._rowId))
    const { stagedRows: validatedRows, stats } = validateAllStagedRows(remaining, get().accessControl || undefined)

    set({
      stagedRows: validatedRows,
      stats,
      selectedRowIds: [],
    })
  },

  deleteSingleRow: (rowId: string) => {
    const { stagedRows, selectedRowIds } = get()
    const remaining = stagedRows.filter((r) => r._rowId !== rowId)
    const { stagedRows: validatedRows, stats } = validateAllStagedRows(remaining, get().accessControl || undefined)

    set({
      stagedRows: validatedRows,
      stats,
      selectedRowIds: selectedRowIds.filter((id) => id !== rowId),
    })
  },

  setSelectedRowIds: (ids: string[]) => set({ selectedRowIds: ids }),

  toggleSelectRow: (rowId: string) => {
    const { selectedRowIds } = get()
    if (selectedRowIds.includes(rowId)) {
      set({ selectedRowIds: selectedRowIds.filter((id) => id !== rowId) })
    } else {
      set({ selectedRowIds: [...selectedRowIds, rowId] })
    }
  },

  toggleSelectAll: (allIds: string[]) => {
    const { selectedRowIds } = get()
    if (selectedRowIds.length === allIds.length) {
      set({ selectedRowIds: [] })
    } else {
      set({ selectedRowIds: allIds })
    }
  },

  setFilterStatus: (filter: FilterStatusType) => set({ filterStatus: filter }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  setSelectedCompetition: (comp: Competition | null) => set({ selectedCompetition: comp }),
  setStagedRows: (rows: StagedParticipantRow[]) => {
    const { stagedRows: validatedRows, stats } = validateAllStagedRows(rows, get().accessControl || undefined)
    set({ stagedRows: validatedRows, stats })
  },

  saveStagedToStudentsDirectory: async (institutionId: string, createdBy?: string) => {
    const { stagedRows, uploadedFile, accessControl } = get()
    const validRows = stagedRows.filter((r) => r._status !== 'ERROR')

    // Determine primary source
    let source: StudentSource = 'excel'
    if (uploadedFile?.name.toLowerCase().endsWith('.csv')) {
      source = 'csv'
    } else if (stagedRows.some((r) => r.source === 'PASTE')) {
      source = 'paste'
    } else if (stagedRows.some((r) => r.source === 'MANUAL')) {
      source = 'manual'
    }

    const records = validRows.map((r) => ({
      username: (r.username || r.nisn || '').trim(),
      firstname: (r.firstname || (r.full_name ? r.full_name.split(' ')[0] : '')).trim(),
      lastname: (r.lastname || (r.full_name ? r.full_name.split(' ').slice(1).join(' ') : '')).trim(),
      email: (r.email || r.teacher_email || '').trim(),
      jenjang: (r.jenjang || 'Kelas 1') as StudentJenjang,
      kampus: (r.kampus || '').trim(),
      institution_id: institutionId,
    }))

    const result = await studentRepository.bulkSaveStudents(
      records,
      institutionId,
      createdBy || 'system',
      source,
      accessControl || undefined
    )

    return {
      savedCount: result.savedCount,
      duplicatesCount: result.duplicatesCount,
      errorsCount: result.errorsCount,
      duplicateDetails: result.duplicateDetails,
    }
  },

  triggerMoodleCsvExport: (customFilename?: string, institutionId?: string) => {
    const { stagedRows } = get()
    const result = downloadMoodleCsvFile(stagedRows, customFilename)
    const summary: ExportResultSummary = {
      filename: result.filename,
      totalExported: result.totalExported,
      byteSize: result.byteSize,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }

    // Auto mark exported in Siswa Saya if institutionId is provided
    if (institutionId) {
      const validUsernames = stagedRows
        .filter((r) => r._status !== 'ERROR')
        .map((r) => (r.username || r.nisn || '').trim())
        .filter(Boolean)
      studentRepository.markAsExported(validUsernames, institutionId)
    }

    set({
      exportResult: summary,
      currentStep: 4, // Advance to Results & Upload Instructions step
    })

    return summary
  },

  resetImport: () => {
    set({
      currentStep: 1,
      uploadedFile: null,
      workbookData: null,
      columnMappings: [],
      stagedRows: [],
      selectedRowIds: [],
      stats: initialStats,
      filterStatus: 'ALL',
      searchTerm: '',
      isParsing: false,
      parseError: null,
      selectedCompetition: null,
      exportResult: null,
    })
  },

  reset: () => {
    get().resetImport()
  },
}))
