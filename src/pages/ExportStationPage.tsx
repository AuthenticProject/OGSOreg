import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ExternalLink,
  Settings,
  HelpCircle,
  AlertTriangle,
  GraduationCap,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { studentRepository } from '../services/studentRepository'
import {
  moodleColumnConfigService,
  type MoodleColumnConfig,
} from '../services/moodle/moodleColumnConfigService'
import {
  getCourseMappingConfig,
  type MoodleCourseMappingConfig,
} from '../services/moodle/moodleCourseMapping'
import { downloadMoodleUsersCsv } from '../services/moodle/moodleCsvExporter'
import { downloadMoodleUsersExcel } from '../services/moodle/moodleExcelExporter'
import { Navigate, Link } from 'react-router-dom'
import { exportStudentsToExcel } from '../services/excelGenerator'
import { MoodleExportModal } from '../components/moodle/MoodleExportModal'
import { MoodleCourseMappingModal } from '../components/moodle/MoodleCourseMappingModal'
import { useAuth } from '../context/AuthContext'
import type { Student, StudentStats } from '../types/student'
import { MOODLE_JENJANG_OPTIONS } from '../types/excel'

export const ExportStationPage: React.FC = () => {
  const { institution, isSuperAdmin } = useAuth()

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const institutionId = institution?.id || 'a0000000-0000-0000-0000-000000000001'

  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [courseConfig, setCourseConfig] = useState<MoodleCourseMappingConfig>(getCourseMappingConfig())
  const [moodleColumns, setMoodleColumns] = useState<MoodleColumnConfig[]>(
    moodleColumnConfigService.getActiveColumns()
  )
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMoodleColumns(moodleColumnConfigService.getActiveColumns())
    const unsubCols = moodleColumnConfigService.subscribe((cols: MoodleColumnConfig[]) => {
      setMoodleColumns(cols.filter((c) => c.include_in_moodle))
    })

    return () => {
      unsubCols()
    }
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await studentRepository.getStudents({
        institutionId,
        page: 1,
        pageSize: 5000,
      })
      setStudents(res.data)
      const st = await studentRepository.getStats(institutionId)
      setStats(st)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [institutionId])

  const handleDownloadCsv = () => {
    if (students.length === 0) return
    const filename = `OGSOreg_Moodle_Users_${new Date().toISOString().slice(0, 10)}.csv`
    downloadMoodleUsersCsv(students, {
      courseMappingConfig: courseConfig,
      customFilename: filename,
    })
    studentRepository.markAsExported(students.map((s) => s.username), institutionId)
    setFeedback(`Berkas Moodle CSV '${filename}' berhasil diunduh (${students.length} santri).`)
    loadData()
  }

  const handleDownloadMoodleExcel = async () => {
    if (students.length === 0) return
    const filename = `OGSOreg_Moodle_Users_${new Date().toISOString().slice(0, 10)}.xlsx`
    await downloadMoodleUsersExcel(students, {
      courseMappingConfig: courseConfig,
      customFilename: filename,
    })
    setFeedback(`Berkas Moodle Excel '${filename}' (Sheet MOODLE_USERS) berhasil diunduh.`)
  }

  const handleDownloadInternalExcel = async () => {
    if (students.length === 0) return
    exportStudentsToExcel(students, `Data_Siswa_OGSOreg_${Date.now()}.xlsx`)
    setFeedback(`Arsip lengkap internal Excel (${students.length} santri) berhasil diunduh.`)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Moodle Export Station"
        subtitle="Hasilkan berkas resmi Moodle LMS (Upload users) dalam format CSV dan Excel dengan pemetaan course otomatis."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/custom-fields?tab=moodle"
              className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
              title="Atur kolom apa saja yang diekspor ke berkas CSV Moodle"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              <span>Atur Kolom CSV Moodle ({moodleColumns.length})</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMappingModalOpen(true)}
              leftIcon={<Settings className="w-4 h-4 mr-1.5" />}
            >
              Konfigurasi Shortname
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              disabled={students.length === 0}
              leftIcon={<Eye className="w-4 h-4 mr-1.5" />}
            >
              Pratinjau & Edit Isi CSV
            </Button>
          </div>
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-subtle animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950">
            &times;
          </button>
        </div>
      )}

      {/* Target Portal Banner */}
      <div className="bg-gradient-to-r from-[#DCFCE7]/60 via-[#DCFCE7]/30 to-transparent p-5 rounded-2xl border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo OGSO" className="w-11 h-11 object-contain drop-shadow-sm" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Portal Target: LMS Moodle OGSO
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              URL:{' '}
              <a
                href="https://ogso.gontor.ac.id/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#166534] font-mono inline-flex items-center gap-1 font-bold"
              >
                https://ogso.gontor.ac.id/ <ExternalLink className="w-3 h-3" />
              </a>{' '}
              &bull; Format: <strong>Kolom & Isi Dapat Disesuaikan Penuh</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {courseConfig.isVerified ? (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Shortname Terverifikasi
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Shortname Belum Diverifikasi
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Santri di Direktori"
          value={isLoading ? '...' : (stats?.total || 0).toLocaleString('id-ID')}
          description="Seluruh santri di institusi Anda"
          icon={<Users className="w-5 h-5" />}
          variant="maroon"
        />
        <StatCard
          title="Siap Ekspor ke Moodle"
          value={isLoading ? '...' : students.length.toLocaleString('id-ID')}
          description={`${moodleColumns.length} kolom aktif & isi dapat diedit`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          variant="accent"
        />
        <StatCard
          title="Terekspor CSV"
          value={isLoading ? '...' : (stats?.exported || 0).toLocaleString('id-ID')}
          description="Sudah pernah diunduh format CSV"
          icon={<Download className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Belum Sinkron"
          value={isLoading ? '...' : (stats?.unSyncedCount || 0).toLocaleString('id-ID')}
          description="Santri lokal belum diekspor"
          icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
          variant="warning"
        />
      </div>

      {/* Active Moodle CSV Columns Summary Card */}
      <div className="p-5 rounded-2xl bg-white border border-border shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Susunan Kolom Berkas Ekspor Moodle CSV ({moodleColumns.length} Kolom Aktif)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kolom, urutan, dan penamaan header dapat diubah di Superadmin. Isi data setiap sel juga dapat diedit sebelum diunduh.
              </p>
            </div>
          </div>

          <Link
            to="/custom-fields?tab=moodle"
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <span>Ubah / Atur Kolom CSV Moodle</span>
          </Link>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto select-all">
          {moodleColumns.map((col) => col.header).join(',')}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Urutan Kolom Aktif:</span>
          {moodleColumns.map((col, idx) => (
            <span
              key={col.id}
              className={`px-2 py-0.5 rounded-md border font-mono text-[11px] ${
                col.is_standard
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
              title={`${col.sourceLabel} (${col.key})`}
            >
              <span className="text-[10px] text-slate-400 mr-1 font-sans">#{idx + 1}</span>
              {col.header}
            </span>
          ))}
        </div>
      </div>

      {/* Course Mapping Quick View Card */}
      <div className="p-5 rounded-2xl bg-white border border-border shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#166534]" />
            <h3 className="text-sm font-bold text-foreground">
              Pemetaan Otomatis: Jenjang Santri &rarr; Course Moodle
            </h3>
          </div>
          <button
            onClick={() => setIsMappingModalOpen(true)}
            className="text-xs font-semibold text-[#166534] hover:underline flex items-center gap-1"
          >
            Ubah Pemetaan <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs font-mono">
          {MOODLE_JENJANG_OPTIONS.map((j) => (
            <div key={j} className="p-3 rounded-xl border border-border bg-slate-50/70 space-y-1">
              <span className="text-[10px] uppercase font-sans font-bold text-muted-foreground">{j} (course1)</span>
              <p className="font-bold text-[#166534] text-xs truncate">
                {courseConfig.jenjangShortnames[j] || '(belum diisi)'}
              </p>
            </div>
          ))}
          <div className="p-3 rounded-xl border border-border bg-slate-50/70 space-y-1">
            <span className="text-[10px] uppercase font-sans font-bold text-muted-foreground">Simulasi (course2)</span>
            <p className="font-bold text-slate-800 text-xs truncate">
              {courseConfig.simulationShortname}
            </p>
          </div>
        </div>
      </div>

      {/* Three Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Official Moodle CSV */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-subtle hover:shadow-card hover:border-[#166534]/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Moodle Users CSV (.csv)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#166534] text-white">
                  Resmi LMS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Berkas CSV Moodle standar RFC 4180 dengan UTF-8 BOM. Kolom dan isi data (username, nama, email, course, password, kolom kustom) dapat diedit bebas sebelum diunduh.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 font-mono text-[11px]">
              <div className="flex items-center gap-2 font-sans text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kolom aktif: {moodleColumns.map((c) => c.header).slice(0, 4).join(', ')}{moodleColumns.length > 4 ? ` +${moodleColumns.length - 4} kolom` : ''}</span>
              </div>
              <div className="flex items-center gap-2 font-sans text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Isi data dapat diedit per sel &amp; via raw editor CSV</span>
              </div>
              <div className="flex items-center gap-2 font-sans text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Password default <code>ogso_2026!</code> dapat disesuaikan</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <Button
              variant="primary"
              className="w-full text-xs"
              onClick={() => setIsExportModalOpen(true)}
              disabled={students.length === 0}
              leftIcon={<Eye className="w-4 h-4 mr-1.5" />}
            >
              Pratinjau &amp; Edit Isi CSV ({students.length})
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={handleDownloadCsv}
              disabled={students.length === 0}
              leftIcon={<Download className="w-4 h-4 mr-1.5" />}
            >
              Unduh CSV Langsung
            </Button>
          </div>
        </div>

        {/* Card 2: Moodle Users Excel */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-subtle hover:shadow-card hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Moodle Users Excel (.xlsx)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Review
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Workbook Excel rapi dengan sheet <code>MOODLE_USERS</code> berisi 7 kolom identik untuk pengecekan dan administrasi manual.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Sheet name: <code>MOODLE_USERS</code></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Header bernuansa hijau resmi OGSOreg</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bebas risiko eksekusi formula spreadsheet</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              variant="outline"
              className="w-full text-xs border-emerald-600/30 text-emerald-800 hover:bg-emerald-50"
              onClick={handleDownloadMoodleExcel}
              disabled={students.length === 0}
              leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-700" />}
            >
              Download Moodle Excel (.xlsx)
            </Button>
          </div>
        </div>

        {/* Card 3: Internal Archive Excel */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Arsip Lengkap Santri (.xlsx)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  Internal
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Daftar lengkap seluruh catatan santri di repositori (termasuk sumber input, ID Moodle, dan timestamp).
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Data lengkap direktori Siswa Saya</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Kolom status verifikasi Moodle LMS</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={handleDownloadInternalExcel}
              disabled={students.length === 0}
              leftIcon={<Download className="w-4 h-4 mr-1.5 text-slate-600" />}
            >
              Download Arsip Lengkap
            </Button>
          </div>
        </div>
      </div>

      {/* Moodle Import Instructions Accordion */}
      <div className="border border-border rounded-2xl bg-white shadow-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[#166534]" />
            <div>
              <h4 className="font-bold text-sm text-foreground">
                Petunjuk Mengunggah Berkas ke Moodle LMS (Upload Users)
              </h4>
              <p className="text-xs text-muted-foreground">
                Panduan praktis langkah demi langkah untuk Administrator di portal ogso.gontor.ac.id
              </p>
            </div>
          </div>
          {showInstructions ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {showInstructions && (
          <div className="p-6 pt-2 space-y-4 text-xs text-slate-700 border-t border-border bg-slate-50/40">
            <ol className="list-decimal pl-5 space-y-2.5 leading-relaxed">
              <li>
                Buka portal resmi OGSO Moodle di{' '}
                <a
                  href="https://ogso.gontor.ac.id/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-[#166534]"
                >
                  https://ogso.gontor.ac.id/
                </a>{' '}
                dan masuk dengan akun Administrator.
              </li>
              <li>
                Akses menu <strong>Site administration</strong> &rarr; pilih tab <strong>Users</strong> &rarr; klik{' '}
                <strong>Upload users</strong> pada kelompok <em>Accounts</em>.
              </li>
              <li>
                Tarik atau unggah berkas CSV hasil ekspor OGSOreg (<code>OGSOreg_Moodle_Users.csv</code>).
              </li>
              <li>
                Pastikan pilihan format berkas:{' '}
                <strong>CSV delimiter</strong> diatur ke <code>Comma (,)</code> dan{' '}
                <strong>Encoding</strong> diatur ke <code>UTF-8</code>.
              </li>
              <li>
                Klik tombol <strong>Upload users</strong> untuk melihat tabel pratinjau verifikasi Moodle.
              </li>
              <li>
                Pada bagian opsi pendaftaran:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <strong>Upload type:</strong> <em>Add new only, skip existing users</em> (atau sesuai kebutuhan institusi).
                  </li>
                  <li>
                    <strong>New user password:</strong> <em>Field required in file</em> (akan otomatis membaca kolom password <code>ogso_2026!</code>).
                  </li>
                  <li>
                    <strong>Force password change:</strong> Disarankan pilih <em>All</em> agar santri mengganti password mereka sendiri saat pertama kali login.
                  </li>
                </ul>
              </li>
              <li>
                Tekan <strong>Upload users</strong> di bagian bawah halaman untuk menyelesaikan proses. Moodle akan otomatis mendaftarkan santri ke <code>course1</code> (sesuai jenjang kelas) dan <code>course2</code> (simulasi).
              </li>
            </ol>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs">
              <strong>Pemberitahuan Hak Akses & Integritas:</strong> Mengunduh berkas CSV di halaman ini tidak otomatis membuat akun santri di Moodle. Pembuatan akun secara resmi hanya terjadi saat Administrator menuntaskan proses unggah di portal LMS Moodle OGSO.
            </div>
          </div>
        )}
      </div>

      {/* Export Preview Modal */}
      <MoodleExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={students}
        institutionId={institutionId}
        sourceTitle="Seluruh Santri Direktori"
        onExportSuccess={() => loadData()}
      />

      {/* Course Mapping Configuration Modal */}
      <MoodleCourseMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        onSaved={(newCfg) => setCourseConfig(newCfg)}
      />
    </div>
  )
}
