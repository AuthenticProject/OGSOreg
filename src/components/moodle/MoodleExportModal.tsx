import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
  AlertTriangle,
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
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  mapStudentsToMoodleExport,
  DEFAULT_INITIAL_PASSWORD,
  MOODLE_EXPORT_COLUMNS,
  type MoodleExportValidationSummary,
} from '../../services/moodle/moodleExportMapper'
import { downloadMoodleUsersCsv } from '../../services/moodle/moodleCsvExporter'
import { downloadMoodleUsersExcel } from '../../services/moodle/moodleExcelExporter'
import {
  getCourseMappingConfig,
  type MoodleCourseMappingConfig,
} from '../../services/moodle/moodleCourseMapping'
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
  const [password, setPassword] = useState(DEFAULT_INITIAL_PASSWORD)
  const [showPasswordText, setShowPasswordText] = useState(false)
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false)
  const [courseConfig, setCourseConfig] = useState<MoodleCourseMappingConfig>(
    getCourseMappingConfig()
  )
  const [showInstructions, setShowInstructions] = useState(false)
  const [exportFeedback, setExportFeedback] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Map & Validate data
  const summary: MoodleExportValidationSummary = useMemo(() => {
    return mapStudentsToMoodleExport(students, {
      customPassword: password,
      courseMappingConfig: courseConfig,
    })
  }, [students, password, courseConfig])

  // Campus Isolation Validation
  const unauthorizedCrossCampusCount = useMemo(() => {
    if (isSuperAdmin || !assignedCampus) return 0
    return students.filter((s) => s.kampus && s.kampus !== assignedCampus).length
  }, [students, isSuperAdmin, assignedCampus])

  if (!isOpen) return null

  const hasBlockingErrors =
    summary.invalidStudents > 0 ||
    summary.duplicateUsernames > 0 ||
    summary.unmappedClasses > 0 ||
    unauthorizedCrossCampusCount > 0

  const handleDownloadCsv = () => {
    if (unauthorizedCrossCampusCount > 0) {
      alert(`Akses Ditolak: Anda hanya diizinkan mengekspor data santri dari kampus ${assignedCampus}.`)
      return
    }
    setIsDownloading(true)
    try {
      const filename = `OGSOreg_Moodle_Users_${new Date().toISOString().slice(0, 10)}.csv`
      downloadMoodleUsersCsv(students, {
        customPassword: password,
        courseMappingConfig: courseConfig,
        customFilename: filename,
      })

      // Mark exported in studentRepository (status: exported, NOT synced)
      const usernames = summary.mappedRows.map((r) => r.username)
      studentRepository.markAsExported(usernames, institutionId)

      setExportFeedback(`Berkas Moodle CSV '${filename}' berhasil diunduh! (${summary.mappedRows.length} santri)`)
      if (onExportSuccess) onExportSuccess(summary.mappedRows.length)
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
      await downloadMoodleUsersExcel(students, {
        customPassword: password,
        courseMappingConfig: courseConfig,
        customFilename: filename,
      })

      setExportFeedback(`Berkas Moodle Excel '${filename}' berhasil diunduh untuk arsip/administrasi!`)
    } finally {
      setIsDownloading(false)
    }
  }

  const displaySource = sourceTitle || sourceDescription || 'Siswa Terpilih'

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-4xl w-full border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-maroon text-white flex items-center justify-center shadow-subtle">
                <FileSpreadsheet className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {title || 'Moodle Bulk User Export & Course Assignment'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sumber: <strong>{displaySource}</strong> ({students.length} santri) &bull; Target:{' '}
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
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
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
                  className="text-emerald-700 hover:text-emerald-950"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl border border-border bg-slate-50/70">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Santri</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{summary.totalStudents}</p>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Siap Ekspor (Valid)</span>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">{summary.validStudents}</p>
              </div>
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/60">
                <span className="text-[10px] font-bold uppercase text-rose-800">Data Invalid</span>
                <p className="text-lg font-bold text-rose-700 mt-0.5">{summary.invalidStudents}</p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                <span className="text-[10px] font-bold uppercase text-amber-800">Duplikat Username</span>
                <p className="text-lg font-bold text-amber-700 mt-0.5">{summary.duplicateUsernames}</p>
              </div>
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/60">
                <span className="text-[10px] font-bold uppercase text-purple-800">Kelas Belum Terpetakan</span>
                <p className="text-lg font-bold text-purple-700 mt-0.5">{summary.unmappedClasses}</p>
              </div>
            </div>

            {/* Course Mapping Warning / Status Banner */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                courseConfig.isVerified
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {courseConfig.isVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs">
                    {courseConfig.isVerified
                      ? 'Pemetaan Course Moodle Telah Terverifikasi'
                      : 'Perhatian: Pemetaan Course Moodle Belum Diverifikasi'}
                  </h4>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    Course 1: <code>ogso_k1</code> s/d <code>ogso_k5</code> &bull; Course 2:{' '}
                    <code>{courseConfig.simulationShortname}</code>. Pastikan shortname kursus ini benar-benar ada di Moodle LMS OGSO.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMappingModalOpen(true)}
                leftIcon={<Settings className="w-3.5 h-3.5 mr-1" />}
                className="bg-white text-xs shrink-0 self-start sm:self-center border-current hover:bg-slate-50"
              >
                Konfigurasi Shortname
              </Button>
            </div>

            {/* Password Configuration & Security Policy Warning */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Password Awal Santri (Default Initial Password)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Password dibangkitkan <strong>hanya saat ekspor</strong> dan tidak disimpan ke basis data manapun demi keamanan.
                  </p>
                </div>

                <div className="relative flex items-center max-w-xs w-full sm:w-60">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 pr-8 text-xs font-mono rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                    title={showPasswordText ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password Policy Alert if missing uppercase */}
              {summary.passwordPolicyWarning && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Peringatan Kebijakan Password:</strong> {summary.passwordPolicyWarning} Rekomendasi: Aktifkan opsi{' '}
                    <em>"Force password change: All"</em> pada pengaturan Upload users Moodle agar santri langsung membuat password baru saat login pertama.
                  </p>
                </div>
              )}
            </div>

            {/* Validation Issues Alert (Blocking error gates) */}
            {hasBlockingErrors && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Ditemukan {summary.issues.length} Masalah Data yang Menghambat Ekspor Resmi</span>
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-rose-200/60 text-[11px] font-mono pr-2">
                  {summary.issues.map((iss, i) => (
                    <div key={i} className="py-1 flex items-center justify-between gap-2">
                      <span>
                        [Baris {iss.row}] @{iss.username}: {iss.message}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 uppercase font-sans font-bold">
                        {iss.type}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-rose-800 font-sans mt-1">
                  Mohon perbaiki data yang bermasalah pada tabel Siswa Saya sebelum melakukan ekspor produksi.
                </p>
              </div>
            )}

            {/* Data Preview Table (Exactly 7 Columns) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Pratinjau Format 7 Kolom Moodle (Menampilkan {Math.min(10, summary.mappedRows.length)} dari {summary.mappedRows.length} santri)
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  username,firstname,lastname,email,course1,course2,password
                </span>
              </div>

              <div className="border border-border rounded-xl overflow-x-auto bg-white shadow-subtle">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-900 text-white font-mono text-[11px]">
                      {MOODLE_EXPORT_COLUMNS.map((col) => (
                        <th key={col} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {summary.mappedRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-brand-maroon font-bold whitespace-nowrap">
                          {row.username}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">{row.firstname}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{row.lastname || '-'}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-600">{row.email}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            {row.course1 || '(unmapped)'}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {row.course2}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                          {showPasswordText ? row.password : '••••••••'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Moodle Import Instructions Accordion */}
            <div className="border border-border rounded-xl bg-slate-50/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
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
                          <em>All</em> agar santri mengganti password mereka sendiri.
                        </li>
                      </ul>
                    </li>
                    <li>
                      Klik <strong>Upload users</strong> pada akhir halaman untuk memproses pembuatan akun dan pendaftaran otomatis ke kursus (enrolment).
                    </li>
                  </ol>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-normal mt-2">
                    <strong>Pemberitahuan Status Sinkronisasi:</strong> Mengunduh berkas CSV ini <u>TIDAK</u> langsung membuat akun di Moodle secara otomatis. Sistem menandai status santri sebagai <em>"Terekspor CSV"</em>. Status <em>"Terverifikasi Moodle"</em> hanya akan disematkan setelah Moodle memverifikasi ID pengguna.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-border bg-slate-50">
            <div className="text-xs text-muted-foreground">
              Total <strong>{summary.validStudents}</strong> santri siap diekspor.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Tutup
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={isDownloading || students.length === 0}
                leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-700" />}
              >
                Download Moodle Excel (.xlsx)
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadCsv}
                disabled={isDownloading || students.length === 0 || hasBlockingErrors}
                leftIcon={<Download className="w-4 h-4 mr-1" />}
              >
                {hasBlockingErrors ? 'Download Moodle CSV (Ada Error)' : 'Download Moodle CSV (.csv)'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Mapping Modal */}
      <MoodleCourseMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        onSaved={(newCfg) => setCourseConfig(newCfg)}
      />
    </>
  )
}
