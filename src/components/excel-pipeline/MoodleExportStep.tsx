import React, { useState } from 'react'
import {
  FileText,
  Download,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Info,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'
import { useImportStore } from '../../stores/importStore'
import { getJenjangCourseMappingSummary } from '../../services/moodleCsvService'
import { MOODLE_EXPORT_COLUMNS } from '../../services/moodle/moodleExportMapper'
import { exportStudentsToMoodleCsv } from '../../services/moodle/moodleCsvExporter'
import { exportStudentsToMoodleExcel } from '../../services/moodle/moodleExcelExporter'
import { MoodleExportModal } from '../moodle/MoodleExportModal'
import type { Student, StudentJenjang } from '../../types/student'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const MoodleExportStep: React.FC = () => {
  const navigate = useNavigate()
  const { institution, user } = useAuth()
  const institutionId = institution?.id || 'a0000000-0000-0000-0000-000000000001'

  const {
    stagedRows,
    stats,
    setCurrentStep,
    saveStagedToStudentsDirectory,
    triggerMoodleCsvExport,
  } = useImportStore()

  const [filename, setFilename] = useState(
    `moodle_users_export_${new Date().toISOString().slice(0, 10)}.csv`
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
  } | null>(null)

  const [isMoodleModalOpen, setIsMoodleModalOpen] = useState(false)
  const hasErrors = stats.error > 0 || stats.duplicate > 0
  const validRows = stagedRows.filter((r) => r._status !== 'ERROR')
  const courseSummaries = getJenjangCourseMappingSummary(stagedRows)

  const stagedStudents: Student[] = React.useMemo(
    () =>
      validRows.map((r, idx) => ({
        id: r._rowId || `staged-${idx}`,
        institution_id: institutionId,
        username: (r.username || r.nisn || '').trim(),
        firstname: (r.firstname || (r.full_name ? r.full_name.split(' ')[0] : '')).trim(),
        lastname: (r.lastname || (r.full_name ? r.full_name.split(' ').slice(1).join(' ') : '')).trim(),
        full_name: r.full_name || `${r.firstname || ''} ${r.lastname || ''}`.trim(),
        email: (r.email || r.teacher_email || '').trim(),
        jenjang: (r.jenjang || 'Kelas 1') as StudentJenjang,
        source: 'excel' as const,
        sync_status: 'local_only' as const,
        created_by: user?.id || 'system',
        moodle_user_id: null,
        last_synced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    [validRows, institutionId, user?.id]
  )

  const handleSaveToDirectory = async () => {
    setIsSaving(true)
    setSaveFeedback(null)
    try {
      const res = await saveStagedToStudentsDirectory(institutionId, user?.id)
      if (res.savedCount > 0) {
        setSaveFeedback({
          type: 'success',
          text: `Berhasil menyimpan ${res.savedCount} santri ke 'Siswa Saya'.${
            res.duplicatesCount > 0 ? ` (${res.duplicatesCount} baris duplikat dilewati)` : ''
          }`,
        })
      } else if (res.duplicatesCount > 0) {
        setSaveFeedback({
          type: 'warning',
          text: `Semua data (${res.duplicatesCount} santri) sudah pernah tersimpan sebelumnya.`,
        })
      } else {
        setSaveFeedback({
          type: 'warning',
          text: 'Tidak ada data valid yang dapat disimpan.',
        })
      }
    } catch (err: unknown) {
      setSaveFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan ke Siswa Saya.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    // Also ensure saved to directory
    try {
      await saveStagedToStudentsDirectory(institutionId, user?.id)
    } catch {
      // Continue export even if storage warning
    }
    // Phase 6 export
    exportStudentsToMoodleCsv(stagedStudents, filename)
    triggerMoodleCsvExport(filename, institutionId)
  }

  const handleExportMoodleExcelDirect = async () => {
    try {
      await saveStagedToStudentsDirectory(institutionId, user?.id)
    } catch {}
    await exportStudentsToMoodleExcel(stagedStudents, 'OGSOreg_Moodle_Users.xlsx')
  }


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionCard
        title="Langkah 3: Konfigurasi & Generate CSV Moodle"
        subtitle="Hasilkan berkas CSV standar Moodle LMS resmi dengan header terverifikasi untuk proses unggah pengguna massal."
      >
        {/* Safety Gate Alert */}
        {hasErrors ? (
          <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">
                  Perhatian: Ditemukan {stats.error + stats.duplicate} Baris Bermasalah
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Terdapat baris error atau duplikat pada tabel pratinjau. Anda disarankan memperbaiki data terlebih dahulu di Langkah 2 agar akun pengguna Moodle berhasil dibuat tanpa penolakan sistem.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
              className="border-amber-400 bg-white hover:bg-amber-100/50 shrink-0"
            >
              Kembali ke Edit Data
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Data 100% Bersih & Tervalidasi</h4>
                <p className="text-xs text-emerald-800">
                  Semua {validRows.length} peserta telah lolos verifikasi format, bebas duplikasi, dan siap diekspor ke Moodle.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Siap Generate
            </span>
          </div>
        )}

        {/* Moodle CSV Header Compliance Box */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-gold" />
              <h4 className="text-sm font-bold tracking-wide">
                Header CSV Resmi Moodle LMS
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              RFC 4180 Compliant
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs flex items-center gap-2 text-slate-300 overflow-x-auto">
            {MOODLE_EXPORT_COLUMNS.map((h, i) => (
              <span key={h} className="inline-flex items-center">
                <span className="text-emerald-400 font-bold">{h}</span>
                {i < MOODLE_EXPORT_COLUMNS.length - 1 && <span className="text-slate-500 mr-2">,</span>}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Format 7 kolom resmi Moodle: <strong>course1</strong> otomatis diisi shortname Jenjang (Kelas 1–5), <strong>course2</strong> bernilai <code>simulation</code> untuk seluruh siswa, dan <strong>password</strong> dibuat otomatis (default <code>ogso_2026!</code>).
            </p>
          </div>
        </div>

        {/* Jenjang Breakdown & Course Mapping Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-brand-maroon" />
              Distribusi Jenjang & Pemetaan Kursus (Staging)
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Total {stagedRows.length} peserta staged
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {courseSummaries.map((cs) => (
              <div
                key={cs.jenjang}
                className="p-3.5 rounded-xl border border-border bg-slate-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{cs.jenjang}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-maroon/10 text-brand-maroon">
                    {cs.participantCount} siswa
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  <p className="truncate font-mono">{cs.suggestedCourseShortname}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Alert for Siswa Saya Persistence */}
        {saveFeedback && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 border ${
              saveFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : saveFeedback.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {saveFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span className="text-xs font-medium">{saveFeedback.text}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/students')}
              leftIcon={<Users className="w-3.5 h-3.5 mr-1" />}
              className="bg-white text-xs border-current hover:bg-slate-50 shrink-0"
            >
              Buka Siswa Saya
            </Button>
          </div>
        )}

        {/* Export Configuration and Trigger */}
        <div className="p-5 rounded-2xl border border-border bg-slate-50/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama File Ekspor CSV
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
              >
                Kembali
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToDirectory}
                disabled={validRows.length === 0 || isSaving}
                leftIcon={<Users className="w-4 h-4 mr-1.5 text-[#166534]" />}
                className="border-[#166534]/30 text-[#166534] hover:bg-[#DCFCE7]/40"
              >
                {isSaving ? 'Menyimpan...' : `Simpan ke Siswa Saya (${validRows.length})`}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMoodleExcelDirect}
                disabled={validRows.length === 0}
                leftIcon={<Download className="w-4 h-4 mr-1.5 text-emerald-700" />}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                Ekspor Moodle Excel (.xlsx)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMoodleModalOpen(true)}
                disabled={validRows.length === 0}
                leftIcon={<FileText className="w-4 h-4 mr-1.5 text-[#166534]" />}
                className="border-[#166534]/40 text-[#166534] hover:bg-[#DCFCE7]/40 font-bold"
              >
                Preview Ekspor (7 Kolom)
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                disabled={validRows.length === 0}
                leftIcon={<Download className="w-4 h-4 mr-1.5" />}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
              >
                Export CSV Moodle ({validRows.length})
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* PHASE 6 MOODLE EXPORT MODAL */}
      <MoodleExportModal
        isOpen={isMoodleModalOpen}
        onClose={() => setIsMoodleModalOpen(false)}
        students={stagedStudents}
        title="Pratinjau & Konfigurasi Ekspor Moodle LMS (7 Kolom)"
        sourceDescription="Registrasi Kolektif (Staging Wizard)"
        onExportComplete={async (_exportedUsernames: string[]) => {
          setIsMoodleModalOpen(false)
          try {
            await saveStagedToStudentsDirectory(institutionId, user?.id)
          } catch {}
          triggerMoodleCsvExport(filename, institutionId)
        }}
      />
    </div>
  )
}
