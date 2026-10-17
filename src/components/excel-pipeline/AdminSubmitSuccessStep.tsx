import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Users,
  RotateCcw,
  Download,
  Building2,
  Calendar,
  GraduationCap,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useImportStore } from '../../stores/importStore'
import { exportStudentsToExcel } from '../../services/excelGenerator'
import type { Student, StudentJenjang } from '../../types/student'

interface AdminSubmitSuccessStepProps {
  submitResult: {
    savedCount: number
    duplicatesCount: number
    errorsCount?: number
  } | null
  campusName: string
  institutionId: string
  userId?: string
}

export const AdminSubmitSuccessStep: React.FC<AdminSubmitSuccessStepProps> = ({
  submitResult,
  campusName,
  institutionId,
  userId,
}) => {
  const navigate = useNavigate()
  const { stagedRows, resetImport } = useImportStore()

  const validRows = stagedRows.filter((r) => r._status !== 'ERROR')
  const savedCount = submitResult?.savedCount ?? validRows.length
  const duplicatesCount = submitResult?.duplicatesCount ?? 0

  // Count by jenjang
  const jenjangCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
    }
    validRows.forEach((r) => {
      const j = r.jenjang || 'Kelas 1'
      if (counts[j] !== undefined) {
        counts[j] += 1
      }
    })
    return counts
  }, [validRows])

  // Map to students for optional Excel download
  const submittedStudents: Student[] = React.useMemo(
    () =>
      validRows.map((r, idx) => ({
        id: r._rowId || `sub-${idx}`,
        institution_id: institutionId,
        username: (r.username || r.nisn || '').trim(),
        firstname: (r.firstname || (r.full_name ? r.full_name.split(' ')[0] : '')).trim(),
        lastname: (r.lastname || (r.full_name ? r.full_name.split(' ').slice(1).join(' ') : '')).trim(),
        full_name: r.full_name || `${r.firstname || ''} ${r.lastname || ''}`.trim(),
        email: (r.email || r.teacher_email || '').trim(),
        jenjang: (r.jenjang || 'Kelas 1') as StudentJenjang,
        kampus: (r.kampus || campusName).trim(),
        source: 'excel' as const,
        sync_status: 'local_only' as const,
        created_by: userId || 'campus_admin',
        moodle_user_id: null,
        last_synced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    [validRows, institutionId, campusName, userId]
  )

  const handleDownloadExcelArchive = () => {
    if (submittedStudents.length === 0) return
    const safeCampus = campusName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Pendaftaran_Santri_${safeCampus}_${new Date().toISOString().slice(0, 10)}.xlsx`
    exportStudentsToExcel(submittedStudents, filename)
  }

  const handleRegisterMore = () => {
    resetImport()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Success Card */}
      <div className="bg-gradient-to-br from-[#166534] via-[#14532D] to-[#0F3D20] text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-emerald-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 backdrop-blur-md flex items-center justify-center font-bold shadow-inner shrink-0">
              <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#86EFAC] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 inline-block mb-1">
                Langkah 3 • Pendaftaran Berhasil
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Pendaftaran Santri Berhasil Disubmit!
              </h2>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-emerald-100 self-start sm:self-center">
            <Building2 className="w-4 h-4 text-[#86EFAC]" />
            <span>{campusName}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
          Alhamdulillah, seluruh data santri valid telah tersimpan resmi di direktori kontingen Anda. Data ini siap direkapitulasi oleh Panitia Pusat OGSO Gontor.
        </p>

        {/* Quick action buttons right on hero */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            className="bg-[#22C55E] hover:bg-[#16a34a] text-slate-950 font-bold border-none shadow-md"
            onClick={() => navigate('/students')}
            leftIcon={<Users className="w-4 h-4 mr-1.5 text-slate-950" />}
          >
            Lihat Siswa Saya ({savedCount} Santri)
          </Button>

          <Button
            variant="outline"
            size="md"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold"
            onClick={handleDownloadExcelArchive}
            leftIcon={<Download className="w-4 h-4 mr-1.5" />}
          >
            Unduh Arsip Excel
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="text-emerald-200 hover:text-white hover:bg-white/10 text-xs"
            onClick={handleRegisterMore}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
          >
            Daftarkan Peserta Lain
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Santri Terdaftar
          </span>
          <p className="text-2xl font-black text-[#166534]">{savedCount}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">Tersimpan di direktori</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Duplikat Dilewati
          </span>
          <p className="text-2xl font-black text-slate-700">{duplicatesCount}</p>
          <p className="text-[10px] text-muted-foreground">Tidak disimpan ganda</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Wewenang Kampus
          </span>
          <p className="text-sm font-bold text-slate-800 pt-1 truncate" title={campusName}>
            {campusName}
          </p>
          <p className="text-[10px] text-slate-500">Terisolasi resmi</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Waktu Pendaftaran
          </span>
          <p className="text-xs font-semibold text-slate-800 pt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </p>
          <p className="text-[10px] text-slate-500">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Information Banner for Campus Admin */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold">
            Tugas Pendaftaran Kontingen Selesai!
          </p>
          <p className="text-emerald-800">
            Data peserta santri Anda sudah berhasil disubmit dan tercatat di sistem panitia. Pengelolaan akun LMS Moodle dan ekspor format ujian Moodle akan ditangani langsung oleh <strong>Super Admin / Panitia Pusat</strong>.
          </p>
        </div>
      </div>

      {/* Breakdown per Jenjang */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#166534]" />
          <h3 className="text-sm font-bold text-foreground">
            Rekap Santri per Jenjang Kelas
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(jenjangCounts).map(([jenjang, count]) => (
            <div
              key={jenjang}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-center space-y-1"
            >
              <span className="text-[11px] font-semibold text-slate-600 block">
                {jenjang}
              </span>
              <span className="text-lg font-black text-[#166534]">{count}</span>
              <span className="text-[10px] text-muted-foreground block">Santri</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Table of Submitted Students */}
      {submittedStudents.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-subtle overflow-hidden space-y-0">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Daftar Santri yang Baru Disubmit ({submittedStudents.length})
              </h4>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Menampilkan {Math.min(submittedStudents.length, 10)} dari {submittedStudents.length} peserta
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">No</th>
                  <th className="py-2.5 px-4">Nama Lengkap</th>
                  <th className="py-2.5 px-4">NISN / Username</th>
                  <th className="py-2.5 px-4">Jenjang</th>
                  <th className="py-2.5 px-4">Kampus</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submittedStudents.slice(0, 10).map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{s.full_name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{s.username}</td>
                    <td className="py-2.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.jenjang}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{s.kampus}</td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Tersimpan
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegisterMore}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
        >
          Daftarkan Kontingen Lain / Input Baru
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/students')}
          rightIcon={<Users className="w-4 h-4 ml-1.5" />}
        >
          Buka Halaman Siswa Saya
        </Button>
      </div>
    </div>
  )
}
