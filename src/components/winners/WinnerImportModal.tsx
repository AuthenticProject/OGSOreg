import React, { useState, useId, useRef } from 'react'
import {
  X,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Sparkles,
  Info,
  Check,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  downloadWinnerTemplate,
  parseWinnerExcelFile,
  validateWinnerRows,
  type StagedWinnerRow,
  type WinnerImportStats,
  JENJANG_OPTIONS,
} from '../../services/winnerExcelService'
import {
  participantPeriodService,
  AWARD_OPTIONS,
  type CompetitionPeriod,
  type PeriodWinner,
} from '../../services/participantPeriodService'
import { KAMPUS_OPTIONS, type StudentKampus } from '../../types/campus'
import type { StudentJenjang } from '../../types/student'

interface WinnerImportModalProps {
  isOpen: boolean
  onClose: () => void
  period: CompetitionPeriod
  existingWinners: PeriodWinner[]
  onSuccess: () => void
}

export const WinnerImportModal: React.FC<WinnerImportModalProps> = ({
  isOpen,
  onClose,
  period,
  existingWinners,
  onSuccess,
}) => {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLegacy = period ? period.year <= 2025 : false

  // Step state: 1 = Upload & Template, 2 = Validate & Edit, 3 = Complete
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // Staged data
  const [stagedRows, setStagedRows] = useState<StagedWinnerRow[]>([])
  const [stats, setStats] = useState<WinnerImportStats>({
    total: 0,
    valid: 0,
    warning: 0,
    error: 0,
  })

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState<'all' | 'error' | 'valid'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Saving state
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  if (!isOpen) return null

  // Re-run validation on rows
  const applyValidation = (rows: StagedWinnerRow[]) => {
    const { stagedRows: validated, stats: newStats } = validateWinnerRows(
      rows,
      existingWinners,
      isLegacy
    )
    setStagedRows(validated)
    setStats(newStats)
  }

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      await downloadWinnerTemplate(period.name, isLegacy)
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const processFile = async (file: File) => {
    setUploadError(null)
    setIsParsing(true)
    try {
      setFileName(file.name)
      const parsed = await parseWinnerExcelFile(file)
      if (parsed.length === 0) {
        setUploadError('Tidak ada baris data pemenang yang dapat dibaca dalam berkas.')
        return
      }
      applyValidation(parsed)
      setStep(2)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gagal membaca berkas Excel.')
    } finally {
      setIsParsing(false)
    }
  }

  // Use pre-made demo sample rows
  const handleUseSampleData = () => {
    setFileName('Data_Contoh_Juara.xlsx')
    const sample: StagedWinnerRow[] = [
      {
        _id: `sample-1`,
        _status: 'VALID',
        _errors: {},
        student_name: 'Zaid bin Tsabit',
        nisn_username: '008291021',
        campus: 'Gontor 1',
        jenjang: isLegacy ? '' : 'Jenjang 1',
        category: isLegacy ? 'IPA Shigor' : 'Matematika Terpadu',
        award: 'Juara 1',
        score: 98,
      },
      {
        _id: `sample-2`,
        _status: 'VALID',
        _errors: {},
        student_name: 'Maryam Al-Khansaa',
        nisn_username: '008291022',
        campus: 'Gontor Putri 1',
        jenjang: isLegacy ? '' : 'Jenjang 2',
        category: isLegacy ? 'MTK Kibar' : 'IPA / Sains Terpadu',
        award: 'Juara 2',
        score: 93.5,
      },
      {
        _id: `sample-3`,
        _status: 'VALID',
        _errors: {},
        student_name: 'Umar Al-Faruq',
        nisn_username: '008291023',
        campus: 'Gontor 2',
        jenjang: isLegacy ? '' : 'Jenjang 3',
        category: isLegacy ? 'IPA Kibar' : 'Fisika Terapan',
        award: 'Juara 3',
        score: 89,
      },
    ]
    applyValidation(sample)
    setStep(2)
  }

  // Update a single cell in stagedRows
  const handleCellChange = (
    id: string,
    field: keyof Omit<StagedWinnerRow, '_id' | '_status' | '_errors'>,
    value: string | number
  ) => {
    const updated = stagedRows.map((row) => {
      if (row._id !== id) return row
      return {
        ...row,
        [field]: value,
      }
    })
    applyValidation(updated)
  }

  // Delete a staged row
  const handleDeleteRow = (id: string) => {
    const updated = stagedRows.filter((r) => r._id !== id)
    applyValidation(updated)
  }

  // Add a manual blank row
  const handleAddManualRow = () => {
    const newRow: StagedWinnerRow = {
      _id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      _status: 'ERROR',
      _errors: { student_name: 'Nama santri wajib diisi' },
      student_name: '',
      nisn_username: '',
      campus: 'Gontor 1',
      jenjang: isLegacy ? '' : 'Jenjang 1',
      category: isLegacy ? 'IPA Shigor' : 'Matematika Terpadu',
      award: 'Juara 1',
      score: 95,
    }
    applyValidation([newRow, ...stagedRows])
  }

  // Final submit to participantPeriodService
  const handleConfirmSubmit = () => {
    const validRows = stagedRows.filter((r) => r._status !== 'ERROR')
    if (validRows.length === 0) return

    setIsSaving(true)
    try {
      validRows.forEach((row) => {
        participantPeriodService.saveWinner({
          period_id: period.id,
          student_name: row.student_name.trim(),
          nisn_username: row.nisn_username.trim() || row.student_name.toLowerCase().replace(/\s+/g, ''),
          campus: row.campus as StudentKampus,
          jenjang: isLegacy ? undefined : (row.jenjang as StudentJenjang),
          award: row.award,
          category: row.category,
          score: row.score !== '' ? Number(row.score) : undefined,
        })
      })

      setSavedCount(validRows.length)
      setStep(3)
      onSuccess()
    } finally {
      setIsSaving(false)
    }
  }

  // Filtered rows for data table
  const displayedRows = stagedRows.filter((row) => {
    if (activeFilter === 'error' && row._status === 'VALID') return false
    if (activeFilter === 'valid' && row._status === 'ERROR') return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      row.student_name.toLowerCase().includes(q) ||
      row.campus.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q) ||
      row.award.toLowerCase().includes(q)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Impor Data Juara via Excel
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {period.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah berkas spreadsheet (.xlsx/.xls/.csv) untuk memasukkan daftar pemenang secara massal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-6">
            <span
              className={`flex items-center gap-2 ${
                step === 1 ? 'text-emerald-700 font-bold' : step > 1 ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 1
                    ? 'bg-emerald-600 text-white'
                    : step > 1
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </span>
              <span>Template & Unggah Berkas</span>
            </span>

            <span className="text-slate-300">&rarr;</span>

            <span
              className={`flex items-center gap-2 ${
                step === 2 ? 'text-emerald-700 font-bold' : step > 2 ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 2
                    ? 'bg-emerald-600 text-white'
                    : step > 2
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </span>
              <span>Validasi & Edit Data</span>
            </span>

            <span className="text-slate-300">&rarr;</span>

            <span
              className={`flex items-center gap-2 ${
                step === 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </span>
              <span>Selesai</span>
            </span>
          </div>

          {fileName && step === 2 && (
            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {fileName}
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: UPLOAD & TEMPLATE */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Template Download Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-emerald-950">
                      Unduh Template Resmi Excel Juara
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      .XLSX Format
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-xl">
                    Dilengkapi validasi dropdown untuk <strong>20 Kampus Gontor</strong> dan predikat juara (Juara 1 s/d Harapan 2) agar penulisan seragam dan bebas kesalahan.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  leftIcon={<Download className="w-4 h-4 mr-1.5" />}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
                >
                  {isDownloadingTemplate ? 'Menyiapkan...' : 'Unduh Template Excel'}
                </Button>
              </div>

              {/* Drag and Drop Zone */}
              <div className="space-y-3">
                <label
                  htmlFor={fileInputId}
                  className="relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl bg-slate-50/60 hover:bg-emerald-50/30 transition-all cursor-pointer group text-center space-y-3"
                >
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="sr-only"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-800">
                      {isParsing
                        ? 'Sedang membaca data berkas Excel...'
                        : 'Klik untuk memilih berkas, atau seret & jatuhkan berkas ke sini'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Mendukung format Microsoft Excel (.xlsx, .xls) atau CSV (Maksimal 10 MB)
                    </p>
                  </div>
                </label>

                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Quick Sample / Testing Option */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Ingin mencoba fitur validasi & edit terlebih dahulu?</span>
                </span>
                <button
                  type="button"
                  onClick={handleUseSampleData}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gunakan Data Contoh (3 Santri)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATE & EDIT DATA */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Data Terbaca
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-0.5">
                    {stats.total} <span className="text-xs font-normal text-slate-500">Baris</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Data Valid (Siap Simpan)</span>
                  </div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    {stats.valid} <span className="text-xs font-normal text-emerald-700">Santri</span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    stats.error > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className={`w-3 h-3 ${stats.error > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>Perlu Perbaikan</span>
                  </div>
                  <div className="text-xl font-black mt-0.5">
                    {stats.error} <span className="text-xs font-normal">Baris</span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search & Add Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({stats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('error')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeFilter === 'error'
                        ? 'bg-rose-100 text-rose-900 shadow-xs'
                        : 'text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    Perlu Perbaikan ({stats.error})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('valid')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeFilter === 'valid'
                        ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Valid ({stats.valid})
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari santri / kampus..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualRow}
                    leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
                  >
                    Tambah Baris
                  </Button>
                </div>
              </div>

              {/* Editable Data Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-[46vh] overflow-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100/80 sticky top-0 z-10 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Nama Santri *</th>
                        <th className="py-2.5 px-3 min-w-[130px]">NISN / Username</th>
                        <th className="py-2.5 px-3 min-w-[150px]">Kampus *</th>
                        {!isLegacy && <th className="py-2.5 px-3 min-w-[120px]">Jenjang *</th>}
                        <th className="py-2.5 px-3 min-w-[160px]">Kategori Lomba *</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Predikat Juara *</th>
                        <th className="py-2.5 px-3 w-20 text-center">Nilai</th>
                        <th className="py-2.5 px-3 w-24 text-center">Status</th>
                        <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            Tidak ada data pemenang yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((row, idx) => {
                          const hasErr = row._status === 'ERROR'
                          const errStudent = row._errors.student_name
                          const errCampus = row._errors.campus
                          const errJenjang = row._errors.jenjang

                          return (
                            <tr
                              key={row._id}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                hasErr ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>

                              {/* Nama Santri */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.student_name}
                                  onChange={(e) =>
                                    handleCellChange(row._id, 'student_name', e.target.value)
                                  }
                                  className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                    errStudent
                                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                                      : 'border-slate-200 bg-white text-slate-800'
                                  }`}
                                  placeholder="Nama santri..."
                                />
                                {errStudent && (
                                  <span className="text-[10px] text-rose-600 block mt-0.5">
                                    {errStudent}
                                  </span>
                                )}
                              </td>

                              {/* NISN / Username */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.nisn_username}
                                  onChange={(e) =>
                                    handleCellChange(row._id, 'nisn_username', e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                                  placeholder="Opsional..."
                                />
                              </td>

                              {/* Kampus */}
                              <td className="py-2 px-3">
                                <select
                                  value={row.campus}
                                  onChange={(e) =>
                                    handleCellChange(row._id, 'campus', e.target.value)
                                  }
                                  className={`w-full px-2 py-1.5 rounded-lg border text-xs bg-white ${
                                    errCampus
                                      ? 'border-rose-400 text-rose-900'
                                      : 'border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <option value="">Pilih Kampus...</option>
                                  {KAMPUS_OPTIONS.map((k) => (
                                    <option key={k} value={k}>
                                      {k}
                                    </option>
                                  ))}
                                </select>
                                {errCampus && (
                                  <span className="text-[10px] text-rose-600 block mt-0.5">
                                    {errCampus}
                                  </span>
                                )}
                              </td>

                              {/* Jenjang (if non-legacy) */}
                              {!isLegacy && (
                                <td className="py-2 px-3">
                                  <select
                                    value={row.jenjang}
                                    onChange={(e) =>
                                      handleCellChange(row._id, 'jenjang', e.target.value)
                                    }
                                    className={`w-full px-2 py-1.5 rounded-lg border text-xs bg-white ${
                                      errJenjang
                                        ? 'border-rose-400 text-rose-900'
                                        : 'border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <option value="">Pilih Jenjang...</option>
                                    {JENJANG_OPTIONS.map((j) => (
                                      <option key={j} value={j}>
                                        {j}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              )}

                              {/* Kategori Lomba */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.category}
                                  onChange={(e) =>
                                    handleCellChange(row._id, 'category', e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                                  placeholder="Bidang lomba..."
                                />
                              </td>

                              {/* Predikat Juara */}
                              <td className="py-2 px-3">
                                <select
                                  value={row.award}
                                  onChange={(e) =>
                                    handleCellChange(row._id, 'award', e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-amber-900"
                                >
                                  {AWARD_OPTIONS.map((a) => (
                                    <option key={a} value={a}>
                                      {a}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Nilai */}
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={row.score}
                                  onChange={(e) =>
                                    handleCellChange(row._id, 'score', e.target.value)
                                  }
                                  className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-center"
                                  placeholder="95"
                                />
                              </td>

                              {/* Status Badge */}
                              <td className="py-2 px-3 text-center">
                                {row._status === 'VALID' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Valid</span>
                                  </span>
                                ) : row._status === 'WARNING' ? (
                                  <span
                                    title={row._errors.duplicate}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 cursor-help"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Duplikat</span>
                                  </span>
                                ) : (
                                  <span
                                    title={Object.values(row._errors).join(', ')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 cursor-help"
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>Error</span>
                                  </span>
                                )}
                              </td>

                              {/* Aksi */}
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(row._id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Hapus baris ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="py-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  Impor Data Juara Berhasil!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sebanyak <strong>{savedCount} santri pemenang</strong> telah berhasil disimpan secara resmi ke dalam periode <strong>{period.name}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-left space-y-1.5">
                <div className="flex items-center justify-between font-semibold">
                  <span>Periode Kompetisi:</span>
                  <span>{period.name}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Pemenang Ditambahkan:</span>
                  <span>{savedCount} Santri</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Sertifikat Pemenang:</span>
                  <span>Otomatis Tersinkronisasi</span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={onClose}
                className="w-full bg-[#166534] hover:bg-[#14532D] text-white font-bold"
              >
                Selesai & Lihat Data Juara
              </Button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step !== 3 && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            {step === 2 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5 mr-1" />}
              >
                Ganti Berkas
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Batal
              </Button>

              {step === 2 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmSubmit}
                  disabled={isSaving || stats.valid === 0}
                  leftIcon={<Check className="w-4 h-4 mr-1.5" />}
                  className="bg-[#166534] hover:bg-[#14532D] text-white font-bold shadow-xs"
                >
                  {isSaving
                    ? 'Menyimpan...'
                    : `Simpan ${stats.valid} Data Juara ke ${period.name}`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
