import React, { useState, useMemo, useEffect } from 'react'
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ShieldAlert,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  FileCode,
  Table as TableIcon,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  mapStudentsToMoodleExport,
  DEFAULT_INITIAL_PASSWORD,
  type MoodleExportValidationSummary,
  type MoodleUserExportRow,
} from '../../services/moodle/moodleExportMapper'
import {
  downloadMoodleUsersCsvFromRows,
  generateMoodleUsersCsv,
} from '../../services/moodle/moodleCsvExporter'
import { downloadMoodleUsersExcelFromRows } from '../../services/moodle/moodleExcelExporter'
import {
  getCourseMappingConfig,
  saveCourseMappingConfig,
  subscribeCourseMappingConfig,
  generateJenjangShortnamesFromPattern,
  type MoodleCourseMappingConfig,
  type StudentJenjang,
} from '../../services/moodle/moodleCourseMapping'
import {
  moodleColumnConfigService,
  type MoodleColumnConfig,
} from '../../services/moodle/moodleColumnConfigService'
import { MoodleCourseMappingModal } from './MoodleCourseMappingModal'
import { studentRepository } from '../../services/studentRepository'
import { useAuth } from '../../context/AuthContext'

export interface MoodleExportModalProps {
  isOpen: boolean
  onClose: () => void
  students: any[]
  institutionId?: string
  sourceTitle?: string
  title?: string
  sourceDescription?: string
  onExportSuccess?: (count: number) => void
  onExportComplete?: (exportedUsernames: string[]) => void
}

export const MoodleExportModal: React.FC<MoodleExportModalProps> = ({
  isOpen,
  onClose,
  students,
  institutionId = 'a0000000-0000-0000-0000-000000000001',
  sourceTitle,
  title,
  sourceDescription,
  onExportSuccess,
  onExportComplete,
}) => {
  const { isSuperAdmin, assignedCampus } = useAuth()
  const initialCfg = useMemo(() => getCourseMappingConfig(), [])
  const [courseConfig, setCourseConfig] = useState<MoodleCourseMappingConfig>(initialCfg)
  const [password, setPassword] = useState(initialCfg.defaultPassword || DEFAULT_INITIAL_PASSWORD)
  const [simulationCourse, setSimulationCourse] = useState(
    initialCfg.simulationShortname || 'simulation'
  )
  const [showPasswordText, setShowPasswordText] = useState(false)
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [exportFeedback, setExportFeedback] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Super Admin Full Content Editing States
  const [editableRows, setEditableRows] = useState<MoodleUserExportRow[]>([])
  const [hasManualEdits, setHasManualEdits] = useState(false)
  const [previewTab, setPreviewTab] = useState<'table' | 'raw'>('table')
  const [rawCsvText, setRawCsvText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState<number | 'all'>(25)
  const [activeColumns, setActiveColumns] = useState<MoodleColumnConfig[]>([])

  useEffect(() => {
    const unsubCols = moodleColumnConfigService.subscribe((cols) => {
      setActiveColumns(cols.filter((c) => c.include_in_moodle))
    })
    const unsubCourse = subscribeCourseMappingConfig((cfg) => {
      setCourseConfig(cfg)
      if (cfg.defaultPassword) setPassword(cfg.defaultPassword)
      if (cfg.simulationShortname) setSimulationCourse(cfg.simulationShortname)
    })
    return () => {
      unsubCols()
      unsubCourse()
    }
  }, [])

  // Map base summary from raw students
  const baseSummary: MoodleExportValidationSummary = useMemo(() => {
    return mapStudentsToMoodleExport(students, {
      customPassword: password,
      courseMappingConfig: courseConfig,
    })
  }, [students, password, courseConfig])

  // Sync initial rows when modal opens or base students changes
  useEffect(() => {
    if (!hasManualEdits) {
      setEditableRows(baseSummary.mappedRows)
      setRawCsvText(generateMoodleUsersCsv(baseSummary.mappedRows))
    }
  }, [baseSummary.mappedRows, hasManualEdits])

  // Campus Isolation Validation
  const unauthorizedCrossCampusCount = useMemo(() => {
    if (isSuperAdmin || !assignedCampus) return 0
    return students.filter((s) => s.kampus && s.kampus !== assignedCampus).length
  }, [students, isSuperAdmin, assignedCampus])

  if (!isOpen) return null

  const hasBlockingErrors =
    baseSummary.invalidStudents > 0 ||
    baseSummary.duplicateUsernames > 0 ||
    baseSummary.unmappedClasses > 0 ||
    unauthorizedCrossCampusCount > 0

  // Cell editing handler
  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    setHasManualEdits(true)
    setEditableRows((prev) => {
      const next = [...prev]
      const row = { ...next[rowIndex] }
      if (['username', 'firstname', 'lastname', 'email', 'course1', 'course2', 'password'].includes(field)) {
        ;(row as any)[field] = value
      } else {
        row.custom_fields = {
          ...row.custom_fields,
          [field]: value,
        }
      }
      next[rowIndex] = row
      setRawCsvText(generateMoodleUsersCsv(next))
      return next
    })
  }

  // Add new row manually
  const handleAddRow = () => {
    setHasManualEdits(true)
    const newRow: MoodleUserExportRow = {
      username: `user_${Date.now().toString().slice(-4)}`,
      firstname: 'Santri',
      lastname: '',
      email: `santri${Date.now().toString().slice(-4)}@gontor.ac.id`,
      course1: courseConfig.jenjangShortnames['Jenjang 1'] || 'ogso_k1',
      course2: courseConfig.simulationShortname || 'simulation',
      password: password,
      custom_fields: {},
    }
    setEditableRows((prev) => {
      const next = [newRow, ...prev]
      setRawCsvText(generateMoodleUsersCsv(next))
      return next
    })
    setExportFeedback('Baris pengguna baru berhasil ditambahkan di posisi paling atas.')
  }

  // Delete row
  const handleDeleteRow = (index: number) => {
    setHasManualEdits(true)
    setEditableRows((prev) => {
      const next = prev.filter((_, i) => i !== index)
      setRawCsvText(generateMoodleUsersCsv(next))
      return next
    })
  }

  // Reset to default mapped rows
  const handleResetToDefault = () => {
    setEditableRows(baseSummary.mappedRows)
    setRawCsvText(generateMoodleUsersCsv(baseSummary.mappedRows))
    setHasManualEdits(false)
    setExportFeedback('Seluruh isi baris data dikembalikan ke hasil pemetaan bawaan sistem.')
  }

  // Apply all template values (Password, Course 1 / Jenjang, Course 2) to all rows
  const handleApplyTemplateValues = (
    newPassword?: string,
    newSimulation?: string,
    newShortnames?: Record<StudentJenjang, string>
  ) => {
    const pwdToUse = (newPassword ?? password).trim() || DEFAULT_INITIAL_PASSWORD
    const simToUse = (newSimulation ?? simulationCourse).trim() || 'simulation'
    const shortnamesToUse = newShortnames ?? courseConfig.jenjangShortnames

    const updatedCfg: MoodleCourseMappingConfig = {
      ...courseConfig,
      defaultPassword: pwdToUse,
      simulationShortname: simToUse,
      jenjangShortnames: shortnamesToUse,
      isVerified: true,
      lastUpdated: new Date().toISOString(),
    }

    saveCourseMappingConfig(updatedCfg)
    setCourseConfig(updatedCfg)
    if (newPassword !== undefined) setPassword(pwdToUse)
    if (newSimulation !== undefined) setSimulationCourse(simToUse)

    const remapped = mapStudentsToMoodleExport(students, {
      customPassword: pwdToUse,
      courseMappingConfig: updatedCfg,
    })

    setEditableRows(remapped.mappedRows)
    setRawCsvText(generateMoodleUsersCsv(remapped.mappedRows))
    setHasManualEdits(true)
    setExportFeedback(
      `Template nilai (Password: "${pwdToUse}", Course 2: "${simToUse}") berhasil diterapkan ke seluruh ${remapped.mappedRows.length} baris CSV!`
    )
  }

  // Batch apply password to all rows
  const handleApplyPasswordToAll = () => {
    handleApplyTemplateValues(password, simulationCourse)
  }

  // Batch apply Jenjang preset
  const handleApplyJenjangPreset = (pattern: string) => {
    const generated = generateJenjangShortnamesFromPattern(pattern)
    handleApplyTemplateValues(password, simulationCourse, generated)
  }

  // Raw CSV sync back to table
  const handleApplyRawCsvToTable = () => {
    try {
      const lines = rawCsvText.split(/\r?\n/).filter((l) => l.trim() !== '')
      if (lines.length < 2) {
        alert('Teks CSV harus memiliki baris header dan minimal satu baris data.')
        return
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))
      const parsedRows: MoodleUserExportRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''))
        const r: MoodleUserExportRow = {
          username: parts[headers.indexOf('username')] ?? parts[0] ?? '',
          firstname: parts[headers.indexOf('firstname')] ?? parts[1] ?? '',
          lastname: parts[headers.indexOf('lastname')] ?? parts[2] ?? '',
          email: parts[headers.indexOf('email')] ?? parts[3] ?? '',
          course1: parts[headers.indexOf('course1')] ?? parts[4] ?? '',
          course2: parts[headers.indexOf('course2')] ?? parts[5] ?? '',
          password: parts[headers.indexOf('password')] ?? parts[6] ?? password,
          custom_fields: {},
        }
        headers.forEach((h, hIdx) => {
          if (!['username', 'firstname', 'lastname', 'email', 'course1', 'course2', 'password'].includes(h)) {
            r.custom_fields![h] = parts[hIdx] ?? ''
          }
        })
        parsedRows.push(r)
      }

      setEditableRows(parsedRows)
      setHasManualEdits(true)
      setPreviewTab('table')
      setExportFeedback(`Berhasil menyinkronkan ${parsedRows.length} baris dari editor teks CSV ke tabel data.`)
    } catch (err: any) {
      alert(`Gagal mem-parsing teks CSV: ${err.message}`)
    }
  }

  // Filtered rows for search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return editableRows
    const q = searchQuery.toLowerCase().trim()
    return editableRows.filter(
      (r) =>
        r.username.toLowerCase().includes(q) ||
        r.firstname.toLowerCase().includes(q) ||
        r.lastname.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.course1.toLowerCase().includes(q)
    )
  }, [editableRows, searchQuery])

  // Displayed rows with pagination
  const displayedRows = useMemo(() => {
    if (rowsPerPage === 'all') return filteredRows
    const start = (page - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredRows.length / rowsPerPage)

  const handleDownloadCsv = () => {
    if (unauthorizedCrossCampusCount > 0) {
      alert(`Akses Ditolak: Anda hanya diizinkan mengekspor data santri dari kampus ${assignedCampus}.`)
      return
    }
    setIsDownloading(true)
    try {
      const filename = `OGSOreg_Moodle_Users_${new Date().toISOString().slice(0, 10)}.csv`
      downloadMoodleUsersCsvFromRows(editableRows, {
        customFilename: filename,
        rawCsvContent: previewTab === 'raw' ? rawCsvText : undefined,
      })

      // Mark exported in studentRepository (status: exported, NOT synced)
      const usernames = editableRows.map((r) => r.username)
      studentRepository.markAsExported(usernames, institutionId)

      setExportFeedback(
        `Berkas Moodle CSV '${filename}' berhasil diunduh! (${editableRows.length} pengguna siap unggah ke Moodle)`
      )
      if (onExportSuccess) onExportSuccess(editableRows.length)
      if (onExportComplete) onExportComplete(usernames)
      setShowInstructions(true)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (unauthorizedCrossCampusCount > 0) {
      alert(`Akses Ditolak: Anda hanya diizinkan mengekspor data santri dari kampus ${assignedCampus}.`)
      return
    }
    setIsDownloading(true)
    try {
      const filename = `OGSOreg_Moodle_Users_${new Date().toISOString().slice(0, 10)}.xlsx`
      await downloadMoodleUsersExcelFromRows(editableRows, filename)

      setExportFeedback(
        `Berkas Moodle Excel '${filename}' berhasil diunduh untuk arsip/administrasi! (${editableRows.length} pengguna)`
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const displaySource = sourceTitle || sourceDescription || 'Siswa Terpilih'

  // Columns to show in table
  const columnsToShow =
    activeColumns.length > 0
      ? activeColumns
      : [
          { id: '1', key: 'username', header: 'username', sourceLabel: 'Username' },
          { id: '2', key: 'firstname', header: 'firstname', sourceLabel: 'Nama Depan' },
          { id: '3', key: 'lastname', header: 'lastname', sourceLabel: 'Nama Belakang' },
          { id: '4', key: 'email', header: 'email', sourceLabel: 'Email' },
          { id: '5', key: 'course1', header: 'course1', sourceLabel: 'Course 1' },
          { id: '6', key: 'course2', header: 'course2', sourceLabel: 'Course 2' },
          { id: '7', key: 'password', header: 'password', sourceLabel: 'Password' },
        ]

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-5xl w-full border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-maroon text-white flex items-center justify-center shadow-subtle">
                <FileSpreadsheet className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {title || 'Moodle Bulk User Export & Course Assignment'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Editable Content
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sumber: <strong>{displaySource}</strong> ({editableRows.length} santri) &bull; Target:{' '}
                  <a
                    href="https://ogso.gontor.ac.id/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-brand-maroon font-mono inline-flex items-center gap-0.5"
                  >
                    ogso.gontor.ac.id <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
            {/* Feedback alert */}
            {exportFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{exportFeedback}</span>
                </div>
                <button
                  onClick={() => setExportFeedback(null)}
                  className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl border border-border bg-slate-50/70">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Pengguna</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{editableRows.length}</p>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Status Edit</span>
                <p className="text-xs font-bold text-emerald-800 mt-1 flex items-center gap-1">
                  {hasManualEdits ? (
                    <span className="text-amber-800">✏️ Ada Perubahan Manual</span>
                  ) : (
                    <span>✓ Sesuai Database</span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60">
                <span className="text-[10px] font-bold uppercase text-blue-800">Kolom CSV Aktif</span>
                <p className="text-lg font-bold text-blue-700 mt-0.5">{columnsToShow.length} Kolom</p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                <span className="text-[10px] font-bold uppercase text-amber-800">Password Awal</span>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">{password}</p>
              </div>
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/60">
                <span className="text-[10px] font-bold uppercase text-purple-800">Course Simulasi</span>
                <p className="text-xs font-mono font-bold text-purple-800 mt-1 truncate">
                  {simulationCourse}
                </p>
              </div>
            </div>

            {/* Template & Default Values Configurator Strip */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/80 space-y-3.5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Konfigurasi Template Nilai CSV Moodle (Editable Content)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Ubah password awal, format jenjang (Course 1), atau Course 2 lalu terapkan massal ke seluruh baris.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMappingModalOpen(true)}
                    leftIcon={<Settings className="w-3.5 h-3.5 mr-1 text-slate-600" />}
                    className="bg-white text-xs border-border hover:bg-slate-50 cursor-pointer h-7"
                    title="Buka dialog pengaturan pemetaan detail per jenjang"
                  >
                    Kustom Per-Jenjang
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApplyTemplateValues()}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5 mr-1" />}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs cursor-pointer font-bold h-7 shadow-xs"
                    title="Terapkan password, jenjang, dan course 2 ke seluruh baris tabel"
                  >
                    Terapkan ke Seluruh Baris
                  </Button>
                </div>
              </div>

              {/* 3 Config Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Password Awal */}
                <div className="p-3 bg-white rounded-lg border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Password Awal Santri</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(DEFAULT_INITIAL_PASSWORD)
                        handleApplyTemplateValues(DEFAULT_INITIAL_PASSWORD, simulationCourse)
                      }}
                      className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                      title="Reset ke ogso_2026!"
                    >
                      Reset Bawaan
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. Santri2026*"
                      className="w-full px-2.5 py-1.5 pr-8 text-xs font-mono rounded border border-border focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPasswordText ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground truncate">
                      Isi kolom <code>password</code>
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyPasswordToAll}
                      className="text-[10px] text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Terapkan &rarr;
                    </button>
                  </div>
                </div>

                {/* 2. Format Output Jenjang (Course 1) */}
                <div className="p-3 bg-white rounded-lg border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Format Jenjang (Course 1)</span>
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[110px]" title={courseConfig.jenjangShortnames['Jenjang 1']}>
                      J1: {courseConfig.jenjangShortnames['Jenjang 1']}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyJenjangPreset('JENJANG')}
                      className="px-2 py-1 rounded text-[10px] font-mono font-medium border border-border bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors cursor-pointer"
                      title="Ubah format seluruh jenjang menjadi: JENJANG 1, JENJANG 2, dst."
                    >
                      JENJANG 1..5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyJenjangPreset('JENJANG_')}
                      className="px-2 py-1 rounded text-[10px] font-mono font-medium border border-border bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors cursor-pointer"
                      title="Ubah format seluruh jenjang menjadi: JENJANG_1, JENJANG_2, dst."
                    >
                      JENJANG_1..5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyJenjangPreset('ogso_j')}
                      className="px-2 py-1 rounded text-[10px] font-mono font-medium border border-border bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors cursor-pointer"
                      title="Ubah format seluruh jenjang menjadi: ogso_j1, ogso_j2, dst."
                    >
                      ogso_j1..j5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyJenjangPreset('ogso_k')}
                      className="px-2 py-1 rounded text-[10px] font-mono font-medium border border-border bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors cursor-pointer"
                      title="Ubah format seluruh jenjang menjadi: ogso_k1, ogso_k2, dst."
                    >
                      ogso_k1..k5
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Klik preset di atas untuk langsung ganti.
                  </p>
                </div>

                {/* 3. Course 2 Default */}
                <div className="p-3 bg-white rounded-lg border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Course 2 (Simulasi / Sesi)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSimulationCourse('simulation')
                        handleApplyTemplateValues(password, 'simulation')
                      }}
                      className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                      title="Reset ke simulation"
                    >
                      Reset Bawaan
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={simulationCourse}
                      onChange={(e) => setSimulationCourse(e.target.value)}
                      placeholder="e.g. simulation atau simulasi_2026"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-border focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyTemplateValues(password, simulationCourse)}
                      className="h-8 px-2 text-[10px] bg-white whitespace-nowrap cursor-pointer shrink-0"
                    >
                      Terapkan
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                    <span className="text-muted-foreground text-[9px]">Pilihan:</span>
                    {['simulation', 'simulasi_2026', 'sesi_1', 'ujian_ogso'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setSimulationCourse(val)
                          handleApplyTemplateValues(password, val)
                        }}
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition-colors ${
                          simulationCourse === val
                            ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-border hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {baseSummary.passwordPolicyWarning && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Peringatan Kebijakan Password:</strong> {baseSummary.passwordPolicyWarning}
                  </p>
                </div>
              )}
            </div>

            {/* Validation Issues Alert */}
            {hasBlockingErrors && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Ditemukan {baseSummary.issues.length} Catatan Validasi pada Data Sumber</span>
                </div>
                <div className="max-h-24 overflow-y-auto divide-y divide-rose-200/60 text-[11px] font-mono pr-2">
                  {baseSummary.issues.slice(0, 5).map((iss, i) => (
                    <div key={i} className="py-1 flex items-center justify-between gap-2">
                      <span>
                        [Baris {iss.row}] @{iss.username}: {iss.message}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 uppercase font-sans font-bold">
                        {iss.type}
                      </span>
                    </div>
                  ))}
                  {baseSummary.issues.length > 5 && (
                    <p className="py-1 text-slate-600 italic">...dan {baseSummary.issues.length - 5} isu lainnya.</p>
                  )}
                </div>
                <p className="text-[11px] text-rose-800 font-sans mt-0.5">
                  Tips: Anda dapat memperbaiki nilai yang salah secara langsung pada tabel editor di bawah sebelum mengunduh berkas CSV.
                </p>
              </div>
            )}

            {/* SUPERADMIN FULL CONTENT EDITING INTERFACE */}
            <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden space-y-3 p-4">
              {/* Top View Selector & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('table')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      previewTab === 'table'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Tabel Editor Data ({editableRows.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRawCsvText(generateMoodleUsersCsv(editableRows))
                      setPreviewTab('raw')
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      previewTab === 'raw'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Editor Teks CSV Langsung</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {previewTab === 'table' && (
                    <>
                      {/* Search bar */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setPage(1)
                          }}
                          placeholder="Cari santri..."
                          className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36 sm:w-44"
                        />
                      </div>

                      {/* Add row button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddRow}
                        leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
                        className="text-xs bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                      >
                        + Tambah Baris
                      </Button>
                    </>
                  )}

                  {hasManualEdits && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetToDefault}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-600" />}
                      className="text-xs text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                      title="Kembalikan semua baris ke pemetaan asli"
                    >
                      Reset Bawaan
                    </Button>
                  )}
                </div>
              </div>

              {/* TAB 1: INTERACTIVE TABLE EDITOR */}
              {previewTab === 'table' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Ketik langsung pada kolom mana pun untuk mengubah isi data sebelum diekspor ke CSV/Excel.
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Tampilkan:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
                          setRowsPerPage(val)
                          setPage(1)
                        }}
                        className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white font-medium"
                      >
                        <option value={10}>10 baris</option>
                        <option value={25}>25 baris</option>
                        <option value={50}>50 baris</option>
                        <option value="all">Semua ({filteredRows.length})</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-xs max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-800 bg-slate-900 text-white font-mono text-[11px]">
                          <th className="py-2.5 px-2 text-center w-10">#</th>
                          {columnsToShow.map((col) => (
                            <th key={col.id} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              <div>
                                <span className="text-emerald-400">{col.header}</span>
                                <span className="block text-[9px] text-slate-400 font-sans font-normal">
                                  {col.sourceLabel}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td colSpan={columnsToShow.length + 2} className="py-8 text-center text-slate-400 font-sans">
                              Tidak ada data santri yang cocok dengan pencarian.
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map((row, idx) => {
                            const realIndex =
                              rowsPerPage === 'all'
                                ? idx
                                : (page - 1) * (typeof rowsPerPage === 'number' ? rowsPerPage : 25) + idx

                            return (
                              <tr key={realIndex} className="hover:bg-emerald-50/30 transition-colors group">
                                <td className="py-1.5 px-2 text-center text-slate-400 font-sans text-[10px]">
                                  {realIndex + 1}
                                </td>

                                {/* Username */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={row.username}
                                    onChange={(e) => handleCellChange(realIndex, 'username', e.target.value)}
                                    className="px-2 py-1 border border-slate-200 rounded font-bold text-brand-maroon bg-white focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none w-32 sm:w-36"
                                  />
                                </td>

                                {/* Firstname */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={row.firstname}
                                    onChange={(e) => handleCellChange(realIndex, 'firstname', e.target.value)}
                                    className="px-2 py-1 border border-slate-200 rounded text-slate-800 bg-white focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none w-32 sm:w-36"
                                  />
                                </td>

                                {/* Lastname */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={row.lastname || ''}
                                    onChange={(e) => handleCellChange(realIndex, 'lastname', e.target.value)}
                                    placeholder="-"
                                    className="px-2 py-1 border border-slate-200 rounded text-slate-800 bg-white focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none w-28 sm:w-32"
                                  />
                                </td>

                                {/* Email */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={row.email}
                                    onChange={(e) => handleCellChange(realIndex, 'email', e.target.value)}
                                    className="px-2 py-1 border border-slate-200 rounded text-slate-700 bg-white focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none w-44 sm:w-52"
                                  />
                                </td>

                                {/* Course 1 */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={row.course1}
                                    onChange={(e) => handleCellChange(realIndex, 'course1', e.target.value)}
                                    list="moodle-course1-suggestions"
                                    placeholder="ogso_k1"
                                    className="px-2 py-1 border border-blue-300 rounded font-bold text-blue-700 bg-blue-50/50 focus:bg-white focus:border-emerald-500 focus:outline-none w-24 sm:w-28"
                                  />
                                </td>

                                {/* Course 2 */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={row.course2}
                                    onChange={(e) => handleCellChange(realIndex, 'course2', e.target.value)}
                                    list="moodle-course2-suggestions"
                                    placeholder="simulation"
                                    className="px-2 py-1 border border-slate-200 rounded text-slate-700 bg-white focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none w-24 sm:w-28"
                                  />
                                </td>

                                {/* Password */}
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <input
                                    type={showPasswordText ? 'text' : 'password'}
                                    value={row.password}
                                    onChange={(e) => handleCellChange(realIndex, 'password', e.target.value)}
                                    className="px-2 py-1 border border-slate-200 rounded font-mono text-slate-700 bg-white focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none w-24 sm:w-28"
                                  />
                                </td>

                                {/* Custom Columns */}
                                {columnsToShow.slice(7).map((customCol) => (
                                  <td key={customCol.id} className="py-1.5 px-2 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={row.custom_fields?.[customCol.key] ?? ''}
                                      onChange={(e) => handleCellChange(realIndex, customCol.key, e.target.value)}
                                      className="px-2 py-1 border border-purple-200 rounded text-purple-900 bg-purple-50/30 focus:bg-white focus:border-purple-500 focus:outline-none w-28 sm:w-32"
                                    />
                                  </td>
                                ))}

                                {/* Actions */}
                                <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(realIndex)}
                                    className="p-1 rounded hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                    title="Hapus baris ini dari ekspor"
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

                  {/* Course Datalist suggestions */}
                  <datalist id="moodle-course1-suggestions">
                    <option value="ogso_k1">Jenjang 1 (ogso_k1)</option>
                    <option value="ogso_k2">Jenjang 2 (ogso_k2)</option>
                    <option value="ogso_k3">Jenjang 3 (ogso_k3)</option>
                    <option value="ogso_k4">Jenjang 4 (ogso_k4)</option>
                    <option value="ogso_k5">Jenjang 5 (ogso_k5)</option>
                  </datalist>
                  <datalist id="moodle-course2-suggestions">
                    <option value="simulation">Sesi Simulasi (simulation)</option>
                    <option value="sesi_1">Sesi 1 (sesi_1)</option>
                    <option value="sesi_2">Sesi 2 (sesi_2)</option>
                  </datalist>

                  {/* Pagination footer */}
                  {rowsPerPage !== 'all' && totalPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Menampilkan {(page - 1) * rowsPerPage + 1} -{' '}
                        {Math.min(page * rowsPerPage, filteredRows.length)} dari {filteredRows.length} pengguna
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                          className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          Sebelumnya
                        </button>
                        <span className="px-2 font-bold text-slate-700">
                          {page} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                          className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RAW CSV TEXT EDITOR */}
              {previewTab === 'raw' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      Anda dapat mengedit baris CSV langsung dalam format teks mentah. Perubahan akan diterapkan saat mengunduh berkas.
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleApplyRawCsvToTable}
                      leftIcon={<Check className="w-3.5 h-3.5 mr-1" />}
                      className="text-xs cursor-pointer"
                    >
                      Terapkan Perubahan CSV ke Tabel
                    </Button>
                  </div>

                  <div className="relative border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                    <textarea
                      value={rawCsvText}
                      onChange={(e) => {
                        setRawCsvText(e.target.value)
                        setHasManualEdits(true)
                      }}
                      rows={14}
                      className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-y select-text"
                      spellCheck={false}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Karakter total: {rawCsvText.length.toLocaleString('id-ID')} &bull; Baris: {rawCsvText.split('\n').length} baris
                  </p>
                </div>
              )}
            </div>

            {/* Moodle Import Instructions Accordion */}
            <div className="border border-border rounded-xl bg-slate-50/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-maroon" />
                  <span className="font-bold text-xs text-foreground">
                    Petunjuk Langkah Demi Langkah Unggah ke Moodle LMS (Upload users)
                  </span>
                </div>
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showInstructions && (
                <div className="p-4 pt-0 space-y-3 text-[11px] text-slate-700 border-t border-border/60 bg-white">
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed pt-2">
                    <li>
                      Masuk ke portal Moodle resmi di{' '}
                      <a
                        href="https://ogso.gontor.ac.id/"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-brand-maroon"
                      >
                        https://ogso.gontor.ac.id/
                      </a>{' '}
                      dengan akun Administrator LMS Anda.
                    </li>
                    <li>
                      Buka menu <strong>Site administration</strong> &rarr; tab <strong>Users</strong> &rarr; pilih{' '}
                      <strong>Upload users</strong> (di bawah kelompok <em>Accounts</em>).
                    </li>
                    <li>
                      Unggah berkas CSV yang diunduh dari OGSOreg (<code>OGSOreg_Moodle_Users.csv</code>).
                    </li>
                    <li>
                      Pastikan pengaturan format: <strong>CSV delimiter</strong> dipilih <code>Comma (,)</code> dan{' '}
                      <strong>Encoding</strong> dipilih <code>UTF-8</code>.
                    </li>
                    <li>
                      Klik <strong>Upload users</strong> untuk melihat tinjauan (preview) akun di Moodle.
                    </li>
                    <li>
                      Pada bagian pengaturan lanjutan (<em>Default values & settings</em>):
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>
                          <strong>Upload type:</strong> <em>Add new only, skip existing users</em> (atau sesuai kebutuhan).
                        </li>
                        <li>
                          <strong>Force password change:</strong> Disarankan pilih <em>Users with weak password</em> atau{' '}
                          <em>All</em> agar santri langsung membuat password baru saat login pertama.
                        </li>
                      </ul>
                    </li>
                    <li>
                      Klik <strong>Upload users</strong> pada akhir halaman untuk memproses pembuatan akun dan pendaftaran otomatis ke kursus (enrolment).
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-border bg-slate-50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Siap ekspor:</span>
              <strong className="text-slate-900 font-mono">{editableRows.length} akun</strong>
              {hasManualEdits && (
                <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                  (Telah Diedit Manual)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                Tutup
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={isDownloading || editableRows.length === 0}
                leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-700" />}
                className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer"
                title="Unduh format tabel Excel untuk arsip verifikasi"
              >
                Unduh Excel (.xlsx)
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadCsv}
                disabled={isDownloading || editableRows.length === 0}
                leftIcon={<Download className="w-4 h-4 mr-1 text-brand-gold" />}
                className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-md hover:brightness-105 cursor-pointer font-bold"
              >
                {isDownloading ? 'Memproses Ekspor...' : `Unduh CSV Moodle (${editableRows.length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Mapping Configuration Sub-modal */}
      <MoodleCourseMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => {
          setIsMappingModalOpen(false)
          setCourseConfig(getCourseMappingConfig())
        }}
        onSaved={(newCfg: MoodleCourseMappingConfig) => {
          setCourseConfig(newCfg)
          setExportFeedback('Konfigurasi shortname course berhasil disimpan dan diterapkan.')
        }}
      />
    </>
  )
}
