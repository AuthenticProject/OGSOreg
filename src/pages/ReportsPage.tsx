import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Building,
  RefreshCw,
  Users,
  Send,
  HelpCircle,
} from 'lucide-react'
import { studentRepository } from '../services/studentRepository'
import { operationHistoryService, type OperationRecord } from '../services/operationHistoryService'
import { exportAdminReportToExcel } from '../services/excelGenerator'
import { KAMPUS_OPTIONS } from '../types/campus'
import { useAuth } from '../context/AuthContext'
import type { Student, StudentStats } from '../types/student'

export const ReportsPage: React.FC = () => {
  const { institution, user } = useAuth()
  const instId = institution?.id || 'a0000000-0000-0000-0000-000000000001'

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [operations, setOperations] = useState<OperationRecord[]>([])
  const [lastExportTime, setLastExportTime] = useState<string | null>(null)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [campusFilter, setCampusFilter] = useState<string>('all')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await studentRepository.getStudents(instId, { pageSize: 5000 })
      setStudents(res.students)
      setStats(res.stats)

      const ops = await operationHistoryService.getOperations(instId)
      setOperations(ops)

      const lastTime = await operationHistoryService.getLastExportOrSyncTime(instId)
      setLastExportTime(lastTime)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [instId])

  const handleDownloadAdminReport = async () => {
    if (!stats) return
    setIsExportingExcel(true)
    try {
      await exportAdminReportToExcel(students, stats)
      // Record operation
      await operationHistoryService.recordOperation({
        institution_id: instId,
        operation_type: 'export_admin_excel',
        operator_email: user?.email || 'admin@gontor.ac.id',
        student_count: students.length,
        campus_distribution: stats.byKampus || {},
        jenjang_distribution: stats.byJenjang || {},
        status: 'success',
        error_count: 0,
        details: 'Unduh laporan administratif pendaftaran santri lengkap (Excel)',
      })
      const ops = await operationHistoryService.getOperations(instId)
      setOperations(ops)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const filteredCampuses = KAMPUS_OPTIONS.filter((k) => {
    if (campusFilter === 'active') {
      return (stats?.byKampus && stats.byKampus[k] > 0)
    }
    if (campusFilter === 'zero') {
      return (!stats?.byKampus || stats.byKampus[k] === 0)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4A0000] via-[#5C0000] to-[#2E0000] rounded-xl p-6 text-white shadow-xl border border-amber-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Laporan Pendaftaran & Sinkronisasi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Laporan Pendaftaran Kolektif
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Ringkasan data santri, distribusi 20 kampus Gontor, status verifikasi Moodle, serta rekam jejak aktivitas operasional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button
            onClick={handleDownloadAdminReport}
            disabled={isExportingExcel || !stats || students.length === 0}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExportingExcel ? 'Menyiapkan...' : 'Unduh Laporan Excel'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Santri</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.total || 0}</div>
          <span className="text-[11px] text-slate-500">Terdaftar di OGSOreg</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Diekspor CSV</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{stats?.exported || 0}</div>
          <span className="text-[11px] text-slate-500">Siap Moodle Upload</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Akun Terverifikasi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats?.synced || 0}</div>
          <span className="text-[11px] text-slate-500">Moodle Akun Aktif</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Enrolment Terverifikasi</span>
            <Send className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600">{stats?.enrolled || 0}</div>
          <span className="text-[11px] text-slate-500">Terenrol di Kursus</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Gagal Sinkronisasi</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{stats?.failed || 0}</div>
          <span className="text-[11px] text-slate-500">Perlu Penanganan</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Belum Pilih Kampus</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.incompleteKampusCount || 0}</div>
          <span className="text-[11px] text-slate-500">Perlu Dilengkapi</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Ekspor Terakhir</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xs font-bold text-slate-700 mt-2 truncate">
            {lastExportTime ? new Date(lastExportTime).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum Ada'}
          </div>
          <span className="text-[11px] text-slate-500">Moodle CSV / Sync</span>
        </div>
      </div>

      {/* Grid: Breakdown per Jenjang & Info Integrasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jenjang Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-700" />
            Distribusi Santri Berdasarkan Jenjang
          </h2>
          <div className="space-y-3">
            {(['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5'] as const).map((j) => {
              const count = stats?.byJenjang[j] || 0
              const total = stats?.total || 1
              const pct = Math.round((count / (total || 1)) * 100)
              return (
                <div key={j} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{j}</span>
                    <span className="text-slate-900 font-bold">{count} santri ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Moodle Status Notice */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                Status Integrasi Moodle LMS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Mode Standar: Upload Users CSV
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 leading-relaxed mb-4">
              <strong>Pemberitahuan Sistem:</strong> Integrasi langsung Moodle belum dikonfigurasi. Gunakan Export CSV Moodle.
              Akun santri dipersiapkan secara tepat untuk fitur <em>Site Administration &gt; Users &gt; Accounts &gt; Upload users</em> pada target <code>https://ogso.gontor.ac.id/</code>.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="font-semibold text-slate-800 mb-1">Struktur Kolom Moodle CSV</div>
                <code className="text-[11px] text-amber-900 bg-amber-100/50 px-1.5 py-0.5 rounded">
                  username,firstname,lastname,email,course1,course2,password
                </code>
                <p className="text-[11px] text-slate-500 mt-1">
                  7 kolom resmi dipertahankan murni tanpa menyisipkan kolom kampus yang tidak terdaftar.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="font-semibold text-slate-800 mb-1">Penyimpanan Kampus di Moodle</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Untuk menyimpan kampus ke Moodle di masa depan, gunakan Custom User Profile Field resmi (<code>profile_field_kampus</code>) setelah dikonfigurasi pada Site Administration Moodle.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target Moodle: <strong>https://ogso.gontor.ac.id/</strong></span>
            <span>Password Default: <code>ogso_2026!</code></span>
          </div>
        </div>
      </div>

      {/* Campus Distribution (Exact 20 Options) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#166534]" />
              Distribusi Santri Berdasarkan 20 Kampus Gontor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sebaran santri terdaftar pada masing-masing kampus putra (Gontor 1–12) dan kampus putri (Gontor Putri 1–8).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Tampilan:</span>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
            >
              <option value="all">Semua 20 Kampus</option>
              <option value="active">Hanya yang Berisi Santri</option>
              <option value="zero">Kampus Tanpa Santri (0)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {filteredCampuses.map((kampusName) => {
            const count = (stats?.byKampus && stats.byKampus[kampusName]) || 0
            const total = stats?.total || 1
            const pct = Math.round((count / (total || 1)) * 100)
            const isPutri = kampusName.includes('Putri')

            return (
              <div
                key={kampusName}
                className={`p-3.5 rounded-lg border transition-all ${
                  count > 0
                    ? isPutri
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-[#DCFCE7]/40 border-[#BBF7D0]'
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{kampusName}</span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      count > 0
                        ? isPutri
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count} santri
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${isPutri ? 'bg-rose-500' : 'bg-[#166534]'}`}
                    style={{ width: `${Math.min(pct * 2, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Operation History / Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              Rekam Jejak Operasional Pendaftaran & Ekspor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan historis waktu, operator, volume santri, distribusi kampus, dan status eksekusi.
            </p>
          </div>
          <span className="text-xs text-slate-400">Total {operations.length} rekaman</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Waktu Operasi</th>
                <th className="py-2.5 px-4">Jenis Operasi</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4 text-center">Jumlah Santri</th>
                <th className="py-2.5 px-4">Distribusi Kampus</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada riwayat aktivitas operasi tercatat.
                  </td>
                </tr>
              ) : (
                operations.map((op) => {
                  const campusSummary = Object.entries(op.campus_distribution || {})
                    .filter(([, c]) => c > 0)
                    .map(([k, c]) => `${k} (${c})`)
                    .slice(0, 3)
                    .join(', ')

                  return (
                    <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {new Date(op.timestamp).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {op.operation_type === 'import_excel' && 'Impor Excel'}
                        {op.operation_type === 'import_csv' && 'Impor CSV'}
                        {op.operation_type === 'export_moodle_csv' && 'Ekspor CSV Moodle'}
                        {op.operation_type === 'export_admin_excel' && 'Ekspor Laporan Excel'}
                        {op.operation_type === 'paste' && 'Tempel Spreadsheet'}
                        {op.operation_type === 'manual_create' && 'Input Manual'}
                        {op.operation_type === 'sync_moodle' && 'Sinkronisasi Moodle'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                        {op.operator_email}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {op.student_count}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] truncate max-w-[240px]">
                        {campusSummary || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            op.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : op.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {op.status === 'success'
                            ? 'Sukses'
                            : op.status === 'partial'
                            ? 'Sebagian'
                            : 'Gagal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {op.error_count}
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
  )
}

export default ReportsPage
