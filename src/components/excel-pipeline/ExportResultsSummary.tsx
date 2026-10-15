import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Download,
  RotateCcw,
  ArrowLeft,
  Info,
  Users,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'
import { useImportStore } from '../../stores/importStore'
import { exportStudentsToMoodleExcel } from '../../services/moodle/moodleExcelExporter'
import type { Student, StudentJenjang } from '../../types/student'

export const ExportResultsSummary: React.FC = () => {
  const navigate = useNavigate()
  const {
    exportResult,
    stagedRows,
    triggerMoodleCsvExport,
    setCurrentStep,
    resetImport,
  } = useImportStore()

  const validCount = stagedRows.filter((r) => r._status !== 'ERROR').length
  const filename = exportResult?.filename || 'moodle_users_export.csv'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Success Celebration Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Langkah 4 • Selesai
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Berkas CSV Moodle Berhasil Digenerate!
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Berkas CSV resmi dengan format UTF-8 (BOM) telah siap. Ikuti panduan unggah di bawah ini untuk memasukkan peserta ke LMS Moodle Anda.
        </p>
      </div>

      {/* Results Summary Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Total Terekspor
          </span>
          <p className="text-2xl font-black text-brand-maroon">
            {exportResult?.totalExported ?? validCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Akun peserta siap unggah</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Header CSV (7 Kolom)
          </span>
          <p className="text-[11px] font-mono font-bold text-slate-800 pt-1 truncate" title="username, firstname, lastname, email, course1, course2, password">
            username, firstname, lastname, email, course1, course2, password
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">100% Sesuai Spesifikasi Moodle LMS</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Encoding Berkas
          </span>
          <p className="text-base font-bold text-slate-800 pt-0.5">
            UTF-8 + BOM
          </p>
          <p className="text-[10px] text-muted-foreground">Bebas distorsi karakter</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Nama Berkas
          </span>
          <p className="text-xs font-mono font-bold text-slate-800 truncate pt-1" title={filename}>
            {filename}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {exportResult?.byteSize ? `${(exportResult.byteSize / 1024).toFixed(1)} KB` : 'Tersimpan lokal'}
          </p>
        </div>
      </div>

      {/* Critical System Notice */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
          <p className="font-bold">
            Pemberitahuan Sistem (Proses Unggah Akun):
          </p>
          <p>
            Proses ekspor CSV ini menyiapkan berkas pengguna yang sepenuhnya kompatibel dengan spesifikasi Moodle. <strong>Akun peserta tidak dibuat secara otomatis di server Moodle</strong> sampai Anda atau administrator sekolah mengunggah berkas CSV ini melalui menu Administrasi Situs Moodle.
          </p>
        </div>
      </div>

      {/* Step-by-Step Moodle Upload Guide */}
      <SectionCard
        title="Petunjuk Unggah ke Moodle LMS (Step-by-Step)"
        subtitle="Panduan resmi untuk administrator situs dalam mengunggah berkas CSV ke Moodle."
      >
        <div className="space-y-4">
          <ol className="relative border-l border-slate-200 ml-4 space-y-6">
            <li className="ml-6">
              <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-maroon text-white rounded-full text-xs font-bold ring-4 ring-white">
                1
              </span>
              <h4 className="text-sm font-bold text-foreground">
                Masuk ke Portal Moodle LMS
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Login ke portal LMS olimpiade menggunakan akun yang memiliki peran <strong>Site Administrator (Administrator Situs)</strong> atau Manajer Akun.
              </p>
            </li>

            <li className="ml-6">
              <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-maroon text-white rounded-full text-xs font-bold ring-4 ring-white">
                2
              </span>
              <h4 className="text-sm font-bold text-foreground">
                Buka Menu Unggah Pengguna Massal
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Navigasikan ke: <strong>Site administration (Administrasi situs)</strong> &rarr; <strong>Users (Pengguna)</strong> &rarr; <strong>Accounts (Akun)</strong> &rarr; <strong>Upload users (Unggah pengguna)</strong>.
              </p>
            </li>

            <li className="ml-6">
              <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-maroon text-white rounded-full text-xs font-bold ring-4 ring-white">
                3
              </span>
              <h4 className="text-sm font-bold text-foreground">
                Pilih Berkas CSV & Konfigurasi Karakter
              </h4>
              <div className="text-xs text-muted-foreground mt-1 space-y-1 bg-slate-50 p-3 rounded-lg border border-border">
                <p>&bull; <strong>File:</strong> Pilih atau seret berkas <code>{filename}</code></p>
                <p>&bull; <strong>CSV delimiter:</strong> Pilih tanda koma <code>,</code></p>
                <p>&bull; <strong>Encoding:</strong> Pilih <code>UTF-8</code></p>
              </div>
            </li>

            <li className="ml-6">
              <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-maroon text-white rounded-full text-xs font-bold ring-4 ring-white">
                4
              </span>
              <h4 className="text-sm font-bold text-foreground">
                Pengaturan Tipe Unggahan (Upload Settings)
              </h4>
              <div className="text-xs text-muted-foreground mt-1 space-y-1 bg-slate-50 p-3 rounded-lg border border-border">
                <p>&bull; <strong>Upload type:</strong> <em>Add new only, skip existing</em> (atau <em>Add new and update existing</em>)</p>
                <p>&bull; <strong>New user password:</strong> <em>Generate password and notify user</em> atau sesuaikan kebijakan autentikasi institusi Anda.</p>
              </div>
            </li>

            <li className="ml-6">
              <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-maroon text-white rounded-full text-xs font-bold ring-4 ring-white">
                5
              </span>
              <h4 className="text-sm font-bold text-foreground">
                Klik 'Upload Users' & Konfirmasi Hasil
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Moodle akan memvalidasi baris CSV dan menampilkan laporan bahwa seluruh akun berhasil dibuat tanpa konflik.
              </p>
            </li>
          </ol>
        </div>

        {/* Action Controls */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(2)}
            leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
          >
            Kembali
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const valid = stagedRows.filter((r) => r._status !== 'ERROR')
                const students: Student[] = valid.map((r, idx) => ({
                  id: r._rowId || `staged-${idx}`,
                  institution_id: 'a0000000-0000-0000-0000-000000000001',
                  username: (r.username || r.nisn || '').trim(),
                  firstname: (r.firstname || (r.full_name ? r.full_name.split(' ')[0] : '')).trim(),
                  lastname: (r.lastname || (r.full_name ? r.full_name.split(' ').slice(1).join(' ') : '')).trim(),
                  full_name: r.full_name || `${r.firstname || ''} ${r.lastname || ''}`.trim(),
                  email: (r.email || r.teacher_email || '').trim(),
                  jenjang: (r.jenjang || 'Kelas 1') as StudentJenjang,
                  source: 'excel' as const,
                  sync_status: 'local_only' as const,
                  created_by: 'system',
                  moodle_user_id: null,
                  last_synced_at: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }))
                exportStudentsToMoodleExcel(students, 'OGSOreg_Moodle_Users.xlsx')
              }}
              leftIcon={<Download className="w-4 h-4 mr-1.5 text-emerald-700" />}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              Unduh Excel (.xlsx)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerMoodleCsvExport(filename)}
              leftIcon={<Download className="w-4 h-4 mr-1.5" />}
            >
              Unduh Ulang CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/students')}
              leftIcon={<Users className="w-4 h-4 mr-1.5 text-brand-maroon" />}
            >
              Buka Siswa Saya
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={resetImport}
              leftIcon={<RotateCcw className="w-4 h-4 mr-1.5" />}
            >
              Mulai Baru
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
