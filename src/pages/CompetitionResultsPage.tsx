import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Trophy,
  Download,
  Upload,
  Search,
  CheckCircle,
  Users,
  CheckSquare,
  Edit2,
  RefreshCw,
  Lock,
  Eye,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  participantPeriodService,
  type CompetitionPeriod,
} from '../services/participantPeriodService'
import {
  competitionResultService,
} from '../services/competitionResultService'
import {
  resultExcelExportService,
} from '../services/resultExcelExportService'
import { KAMPUS_OPTIONS } from '../types/campus'
import { STUDENT_JENJANG_OPTIONS } from '../types/student'
import type {
  StudentWithResult,
  ResultStatus,
  ResultStats,
} from '../types/competitionResult'
import { ResultEditModal } from '../components/results/ResultEditModal'
import { BulkResultModal } from '../components/results/BulkResultModal'
import { ResultExcelImportModal } from '../components/results/ResultExcelImportModal'

export const CompetitionResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const urlPeriodId = searchParams.get('periodId')

  const { isSuperAdmin, assignedCampus, appProfile } = useAuth()
  const adminUsername = appProfile?.username || (isSuperAdmin ? 'superadmin' : assignedCampus || 'admin')

  // Available periods
  const [periods, setPeriods] = useState<CompetitionPeriod[]>(() =>
    participantPeriodService.getPeriods()
  )
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    if (urlPeriodId) return urlPeriodId
    const list = participantPeriodService.getPeriods()
    const active = list.find((p) => p.status === 'active')
    return active ? active.id : list[0]?.id || 'period-ogso-2026'
  })

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === selectedPeriodId),
    [periods, selectedPeriodId]
  )

  // Filters
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>(assignedCampus || 'all')
  const [jenjangFilter, setJenjangFilter] = useState<string>('all')
  const [daerahFilter, setDaerahFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ResultStatus>('all')

  // Data states
  const [studentsWithResults, setStudentsWithResults] = useState<StudentWithResult[]>([])
  const [stats, setStats] = useState<ResultStats>({
    totalParticipants: 0,
    totalFinalists: 0,
    totalChampions: 0,
    finalistPercentage: 0,
    championPercentage: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]) // student IDs

  // Modals
  const [editingStudent, setEditingStudent] = useState<StudentWithResult | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Load results whenever period or filters change
  const loadData = async () => {
    if (!selectedPeriodId) return
    setIsLoading(true)
    try {
      const res = await competitionResultService.getStudentsWithResults(
        selectedPeriodId,
        {
          period_id: selectedPeriodId,
          search,
          campus: isSuperAdmin ? campusFilter : assignedCampus || undefined,
          jenjang: jenjangFilter,
          daerah: daerahFilter,
          status: statusFilter,
        },
        isSuperAdmin ? null : assignedCampus
      )
      setStudentsWithResults(res.students)
      setStats(res.stats)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    selectedPeriodId,
    search,
    campusFilter,
    jenjangFilter,
    daerahFilter,
    statusFilter,
    assignedCampus,
    isSuperAdmin,
  ])

  // Listen to cross-system updates
  useEffect(() => {
    const handleUpdate = () => {
      setPeriods(participantPeriodService.getPeriods())
      loadData()
    }
    window.addEventListener('ogsoreg_results_updated', handleUpdate)
    window.addEventListener('ogsoreg_periods_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('ogsoreg_results_updated', handleUpdate)
      window.removeEventListener('ogsoreg_periods_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [selectedPeriodId])

  // Distinct daerah options from students
  const daerahOptions = useMemo(() => {
    const set = new Set<string>()
    studentsWithResults.forEach((s) => {
      const d = (s.student.custom_fields?.daerah as string) || (s.student.custom_fields?.konsulat as string)
      if (d) set.add(d.trim())
    })
    return Array.from(set).sort()
  }, [studentsWithResults])

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // If campus admin, only select eligible students
      const eligible = isSuperAdmin
        ? studentsWithResults.map((s) => s.student.id)
        : studentsWithResults.filter((s) => s.student.kampus === assignedCampus).map((s) => s.student.id)
      setSelectedIds(eligible)
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelect = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const selectedStudentsForBulk = useMemo(() => {
    const idSet = new Set(selectedIds)
    return studentsWithResults.filter((s) => idSet.has(s.student.id))
  }, [studentsWithResults, selectedIds])

  // Excel 3-Sheet Export
  const handleExportExcel = async () => {
    if (!selectedPeriodId) return
    setIsExporting(true)
    try {
      await resultExcelExportService.downloadResultsExcel({
        periodId: selectedPeriodId,
        periodName: selectedPeriod?.name || 'OGSO',
        accessCampus: isSuperAdmin ? null : assignedCampus,
      })
    } catch {
      alert('Gagal mengunduh berkas rekap Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Hasil & Kelulusan Lomba OGSO"
        subtitle="Kelola kualifikasi finalis, penetapan juara, import hasil spreadsheet, dan rekapitulasi multi-sheet per periode."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Periode:</span>
              <select
                value={selectedPeriodId}
                onChange={(e) => {
                  setSelectedPeriodId(e.target.value)
                  setSelectedIds([])
                }}
                className="text-xs font-bold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'active' ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Export 3-Sheet Excel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-white border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-sm"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-emerald-700" />}
              Unduh Rekap Excel (3-Sheet)
            </Button>

            {/* Import Excel Modal — Strictly Super Admin Only */}
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Impor Hasil Excel
              </Button>
            )}
          </div>
        }
      />

      {/* Campus Admin Read-Only Notice Banner */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-900 text-xs font-medium shadow-xs animate-fade-in">
          <Eye className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Mode Hanya Lihat:</strong> Anda masuk sebagai Admin Kampus <strong>{assignedCampus}</strong>. Pengelolaan kelulusan babak final, penetapan juara, dan impor berkas hasil dikelola secara terpusat oleh Super Admin.
          </span>
        </div>
      )}

      {/* DASHBOARD: Result Metrics Cards (Phase 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Peserta */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Peserta Terdaftar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">{stats.totalParticipants}</span>
              <span className="text-xs text-gray-500">santri di {selectedPeriod?.name}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Finalis */}
        <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl pointer-events-none" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Lolos ke Babak Final
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-900">{stats.totalFinalists}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {stats.finalistPercentage}% Finalis
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Termasuk peraih medali & juara</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Juara */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-xl pointer-events-none" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
              Peraih Penghargaan / Juara
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-900">{stats.totalChampions}</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {stats.championPercentage}% Juara
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Juara 1, 2, 3 & Harapan</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <SectionCard className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari santri, username, kampus, atau penghargaan..."
              className="w-full text-xs rounded-xl border border-gray-200 pl-9 pr-4 py-2 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Bulk Action Trigger — Super Admin Only */}
          {isSuperAdmin && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {selectedIds.length} santri dipilih
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Aksi Massal
              </Button>
            </div>
          )}
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 border-t border-gray-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Status Hasil
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs rounded-lg border border-gray-200 py-1.5 px-2 bg-gray-50 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="peserta">Peserta (Belum Lolos)</option>
              <option value="finalis">Lolos Final (Non-Juara)</option>
              <option value="juara">Peraih Juara (Award)</option>
            </select>
          </div>

          {/* Kampus Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Kampus Pondok
            </label>
            <select
              value={isSuperAdmin ? campusFilter : assignedCampus || ''}
              disabled={!isSuperAdmin}
              onChange={(e) => setCampusFilter(e.target.value)}
              className={`w-full text-xs rounded-lg border border-gray-200 py-1.5 px-2 bg-gray-50 focus:bg-white focus:outline-none ${
                !isSuperAdmin ? 'opacity-80 cursor-not-allowed bg-gray-100' : ''
              }`}
            >
              {isSuperAdmin && <option value="all">Semua Kampus</option>}
              {KAMPUS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Jenjang Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Jenjang Lomba
            </label>
            <select
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-200 py-1.5 px-2 bg-gray-50 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Jenjang</option>
              {STUDENT_JENJANG_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Daerah Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Konsulat / Daerah
            </label>
            <select
              value={daerahFilter}
              onChange={(e) => setDaerahFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-200 py-1.5 px-2 bg-gray-50 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Daerah</option>
              {daerahOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* RESULTS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Memuat data hasil peserta...</p>
          </div>
        ) : studentsWithResults.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-6 h-6 text-slate-400" />}
            title="Tidak Ada Data Hasil Ditemukan"
            description="Belum ada santri yang terdaftar atau sesuai dengan filter pencarian di periode ini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                <tr>
                  {isSuperAdmin && (
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          studentsWithResults.length > 0 &&
                          selectedIds.length === studentsWithResults.length
                        }
                        onChange={handleSelectAll}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  <th className="py-3 px-3 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Nama Santri</th>
                  <th className="py-3 px-4">Username / ID</th>
                  <th className="py-3 px-4">Kampus</th>
                  <th className="py-3 px-4">Jenjang</th>
                  <th className="py-3 px-4">Daerah</th>
                  <th className="py-3 px-4 text-center">Status Hasil</th>
                  <th className="py-3 px-4">Penghargaan / Juara</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-center">Aksi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsWithResults.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.student.id)
                  const daerah =
                    (item.student.custom_fields?.daerah as string) ||
                    (item.student.custom_fields?.konsulat as string) ||
                    '-'

                  return (
                    <tr
                      key={item.student.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.student.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}

                      <td className="py-3 px-3 text-center text-gray-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{item.student.full_name}</div>
                        <div className="text-[11px] text-gray-400">{item.student.email}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-gray-600">
                        {item.student.username}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-700">
                          {item.student.kampus || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {item.student.kelas || item.student.jenjang}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-600">{daerah}</td>

                      <td className="py-3 px-4 text-center">
                        {item.status === 'juara' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            Juara
                          </span>
                        ) : item.status === 'finalis' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            Lolos Final
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                            Peserta
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {item.award_category ? (
                          <div>
                            <span className="font-bold text-amber-900 block">
                              {item.award_category}
                            </span>
                            {item.champion_rank && (
                              <span className="text-[10px] font-medium text-amber-700">
                                Peringkat #{item.champion_rank}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        {item.result_notes || <span className="text-gray-300">-</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isSuperAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStudent(item)}
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs font-semibold py-1 px-2 flex items-center gap-1 mx-auto"
                          >
                            <Edit2 className="w-3 h-3" />
                            Kelola
                          </Button>
                        ) : (
                          <span
                            title="Hanya Super Admin yang berwenang mengubah hasil kompetisi"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200"
                          >
                            <Lock className="w-3 h-3 text-gray-400" /> Hanya Lihat
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Single Result Modal — Super Admin Only */}
      {isSuperAdmin && (
        <ResultEditModal
          isOpen={Boolean(editingStudent)}
          onClose={() => setEditingStudent(null)}
          studentWithResult={editingStudent}
          periodId={selectedPeriodId}
          periodName={selectedPeriod?.name || 'OGSO'}
          adminUsername={adminUsername}
          onSaved={loadData}
        />
      )}

      {/* Bulk Update Modal — Super Admin Only */}
      {isSuperAdmin && (
        <BulkResultModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          selectedStudents={selectedStudentsForBulk}
          periodId={selectedPeriodId}
          periodName={selectedPeriod?.name || 'OGSO'}
          adminUsername={adminUsername}
          onSaved={() => {
            setSelectedIds([])
            loadData()
          }}
        />
      )}

      {/* Excel Result Import Modal — Super Admin Only */}
      {isSuperAdmin && (
        <ResultExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          periodId={selectedPeriodId}
          periodName={selectedPeriod?.name || 'OGSO'}
          accessCampus={isSuperAdmin ? null : assignedCampus}
          adminUsername={adminUsername}
          onImportComplete={loadData}
        />
      )}
    </div>
  )
}
