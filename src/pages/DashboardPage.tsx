import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  FileSpreadsheet,
  UserPlus,
  Download,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Database,
  Layers,
  Building,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { studentRepository } from '../services/studentRepository'
import { generateRegistrationTemplate } from '../services/excelGenerator'
import { useAuth } from '../context/AuthContext'
import type { Student, StudentStats } from '../types/student'
import { MOODLE_JENJANG_OPTIONS } from '../types/excel'
import { KAMPUS_OPTIONS } from '../types/campus'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { institution } = useAuth()
  const institutionId = institution?.id || 'a0000000-0000-0000-0000-000000000001'

  const [studentStats, setStudentStats] = useState<StudentStats>({
    total: 0,
    localOnly: 0,
    exported: 0,
    synced: 0,
    failed: 0,
    unsynced: 0,
    byJenjang: { 'Jenjang 1': 0, 'Jenjang 2': 0, 'Jenjang 3': 0, 'Jenjang 4': 0, 'Jenjang 5': 0 },
    byKelas: {
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 1 Int': 0,
      'Kelas 3': 0,
      'Kelas 3 Int': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
    },
    bySyncStatus: { local_only: 0, exported: 0, synced: 0, enrolled: 0, failed: 0 },
    bySource: { excel: 0, csv: 0, manual: 0, paste: 0 },
    verifiedMoodleCount: 0,
    unSyncedCount: 0,
  })

  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const stats = await studentRepository.getStats(institutionId)
        setStudentStats(stats)

        const recent = await studentRepository.getStudents({
          institutionId,
          page: 1,
          pageSize: 5,
          sortBy: 'created_at',
          sortOrder: 'desc',
        })
        setRecentStudents(recent.data)
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [institutionId])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Selamat datang di OGSOreg"
        subtitle="Asisten pendaftaran kolektif dan manajemen santri untuk LMS Moodle OGSO."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/students')}
              leftIcon={<Users className="w-4 h-4 mr-1.5" />}
            >
              Siswa Saya
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/imports')}
              leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1.5" />}
            >
              Pendaftaran Kolektif
            </Button>
          </div>
        }
      />

      {/* Metric Cards Grid - LIVE STUDENT DIRECTORY DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Santri"
          value={isLoading ? '...' : studentStats.total.toLocaleString('id-ID')}
          description="Siswa terdaftar di direktori institusi Anda"
          icon={<Users className="w-5 h-5" />}
          variant="maroon"
        />
        <StatCard
          title="Tersimpan di OGSOreg"
          value={isLoading ? '...' : studentStats.total.toLocaleString('id-ID')}
          description="Tersimpan aman di repositori aktif"
          icon={<Database className="w-5 h-5 text-[#22C55E]" />}
          variant="accent"
        />
        <StatCard
          title="Akun Moodle Terverifikasi"
          value={isLoading ? '...' : studentStats.verifiedMoodleCount.toLocaleString('id-ID')}
          description="Akun terkonfirmasi memiliki user ID LMS"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          variant="default"
        />
        <StatCard
          title="Belum Sinkron"
          value={isLoading ? '...' : studentStats.unSyncedCount.toLocaleString('id-ID')}
          description="Data lokal yang belum diekspor ke Moodle"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
          variant="warning"
        />
      </div>

      {/* Total Jenjang 1–5 Distribution Panel */}
      <div className="bg-white p-5 rounded-2xl border border-border shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#166534]" />
            <h3 className="text-sm font-bold text-foreground">
              Total Santri Berdasarkan Jenjang Lomba (Jenjang 1–5)
            </h3>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="text-xs text-[#166534] hover:underline font-semibold flex items-center gap-1"
          >
            Buka Direktori Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {MOODLE_JENJANG_OPTIONS.map((j) => {
            const count = studentStats.byJenjang[j] || 0
            const pct =
              studentStats.total > 0
                ? Math.round((count / studentStats.total) * 100)
                : 0
            const classSublabel: Record<string, string> = {
              'Jenjang 1': 'Kelas 1',
              'Jenjang 2': 'Kelas 2',
              'Jenjang 3': 'Kelas 1 Int & 3',
              'Jenjang 4': 'Kelas 3 Int & 4',
              'Jenjang 5': 'Kelas 5',
            }
            return (
              <div
                key={j}
                onClick={() => navigate('/students')}
                className="p-3.5 rounded-xl border border-border bg-slate-50/60 hover:bg-slate-50 hover:border-[#166534]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{j}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{classSublabel[j] || ''}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="text-xl font-bold text-[#166534]">{count}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Campus Breakdown Panel - LIVE STATS (Phase 7 Requirement 4) */}
      <div className="bg-white p-5 rounded-2xl border border-border shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#166534]" />
            <h3 className="text-sm font-bold text-foreground">
              Distribusi Kampus Gontor
            </h3>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="text-xs text-[#166534] hover:underline font-semibold flex items-center gap-1"
          >
            Lihat Laporan Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {KAMPUS_OPTIONS.slice(0, 8).map((k) => {
            const count = (studentStats.byKampus && studentStats.byKampus[k]) || 0
            return (
              <div
                key={k}
                onClick={() => navigate('/students')}
                className="p-3 rounded-xl border border-border bg-slate-50/60 hover:bg-slate-50 hover:border-[#22C55E]/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <span className="text-xs font-semibold text-slate-700">{k}</span>
                <span className="text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-md">
                  {count} santri
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-[#DCFCE7]/60 via-[#DCFCE7]/30 to-transparent p-5 sm:p-6 rounded-2xl border border-[#BBF7D0] shadow-subtle">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#166534]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#166534]">
            Aksi Cepat
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/imports')}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-border hover:border-[#166534] hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0 group-hover:bg-[#166534] group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-[#166534] transition-colors">
                Pendaftaran Kolektif
              </p>
              <p className="text-xs text-muted-foreground">Upload Excel/CSV massal</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/students')}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-border hover:border-[#166534] hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-[#166534] group-hover:text-white transition-colors">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-[#166534] transition-colors">
                Siswa Saya
              </p>
              <p className="text-xs text-muted-foreground">Direktori santri aktif</p>
            </div>
          </button>

          <button
            onClick={() => generateRegistrationTemplate()}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-border hover:border-[#166534] hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0 group-hover:bg-[#22C55E] group-hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-[#166534] transition-colors">
                Download Template
              </p>
              <p className="text-xs text-muted-foreground">Format resmi .xlsx Kelas 1–5</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/batches')}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-border hover:border-[#166534] hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-[#166534] group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-[#166534] transition-colors">
                Riwayat Batch
              </p>
              <p className="text-xs text-muted-foreground">Log & arsip unggahan</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Students Section */}
      <SectionCard
        title="Santri Terbaru Ditambahkan"
        subtitle="Daftar 5 santri terakhir yang diinput ke dalam repositori institusi Anda"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/students')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}
          >
            Lihat Semua di Siswa Saya
          </Button>
        }
      >
        {recentStudents.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Belum ada santri yang ditambahkan. Gunakan menu Pendaftaran Kolektif untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50/50 text-[11px] font-bold text-muted-foreground uppercase">
                  <th className="py-2.5 px-3">Nama Santri</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Jenjang</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3">Status Sinkron</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{s.username}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {s.jenjang}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[10px] text-slate-600">
                      {s.source}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.sync_status === 'synced' ? (
                        <span className="text-emerald-700 font-medium">✓ Terverifikasi Moodle</span>
                      ) : s.sync_status === 'exported' ? (
                        <span className="text-blue-700 font-medium">Terekspor CSV</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Lokal (Belum Sinkron)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
