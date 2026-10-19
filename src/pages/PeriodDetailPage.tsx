import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Trophy,
  Award,
  Sparkles,
  Download,
  Eye,
  Plus,
  Search,
  ArrowLeft,
  X,
  FileCheck,
  QrCode,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldAlert,
  Layers,
  LayoutGrid,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  participantPeriodService,
  LEGACY_LOMBA_OPTIONS,
  AWARD_OPTIONS,
  getAwardRank,
  type CompetitionPeriod,
  type PeriodWinner,
  type PeriodCertificate,
} from '../services/participantPeriodService'
import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'
import type { StudentJenjang } from '../types/student'

export const PeriodDetailPage: React.FC = () => {
  const { periodId } = useParams<{ periodId: string }>()
  const navigate = useNavigate()
  const { isSuperAdmin, assignedCampus } = useAuth()

  // Lazy initial state so data is ready on first render
  const [period, setPeriod] = useState<CompetitionPeriod | null>(() =>
    periodId ? participantPeriodService.getPeriodById(periodId) : null
  )
  const [activeTab, setActiveTab] = useState<'winners' | 'winner_certs' | 'participant_certs'>('winners')

  // Data states initialized synchronously from service
  const [winners, setWinners] = useState<PeriodWinner[]>(() =>
    periodId ? participantPeriodService.getWinners(periodId) : []
  )
  const [winnerCerts, setWinnerCerts] = useState<PeriodCertificate[]>(() =>
    periodId ? participantPeriodService.getCertificates(periodId, 'winner') : []
  )
  const [participantCerts, setParticipantCerts] = useState<PeriodCertificate[]>(() =>
    periodId ? participantPeriodService.getCertificates(periodId, 'participant') : []
  )

  // Multi-select & view mode for winners
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<string[]>([])
  const [winnerViewMode, setWinnerViewMode] = useState<'by_lomba' | 'flat'>('by_lomba')

  // Determine if period is legacy (<= 2025: belum ada jenjang, kategori dropdown)
  const isLegacyPeriod = period ? period.year <= 2025 : false

  // Filters
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>(assignedCampus || 'all')
  const [jenjangFilter, setJenjangFilter] = useState<string>('all')
  const [lombaFilter, setLombaFilter] = useState<string>('all')
  const [awardFilter, setAwardFilter] = useState<string>('all')

  // Modals
  const [isAddWinnerModalOpen, setIsAddWinnerModalOpen] = useState(false)
  const [editingWinner, setEditingWinner] = useState<PeriodWinner | null>(null)
  const [previewCert, setPreviewCert] = useState<PeriodCertificate | null>(null)

  // Winner Form
  const [winnerName, setWinnerName] = useState('')
  const [winnerNisn, setWinnerNisn] = useState('')
  const [winnerCampus, setWinnerCampus] = useState(assignedCampus || 'Gontor 1')
  const [winnerJenjang, setWinnerJenjang] = useState<StudentJenjang | string>('Jenjang 1')
  const [winnerAward, setWinnerAward] = useState('Juara 1')
  const [winnerCategory, setWinnerCategory] = useState('Matematika Terpadu')
  const [winnerScore, setWinnerScore] = useState<number | ''>(95)
  const [winnerFormError, setWinnerFormError] = useState<string | null>(null)

  const loadPeriodData = () => {
    if (!periodId) return
    const p = participantPeriodService.getPeriodById(periodId)
    setPeriod(p)

    const wList = participantPeriodService.getWinners(periodId)
    setWinners(wList)

    const wCerts = participantPeriodService.getCertificates(periodId, 'winner')
    setWinnerCerts(wCerts)

    const pCerts = participantPeriodService.getCertificates(periodId, 'participant')
    setParticipantCerts(pCerts)
  }

  useEffect(() => {
    loadPeriodData()
  }, [periodId])

  // Filter logic
  const filterList = <
    T extends {
      recipient_name?: string
      student_name?: string
      campus: string
      jenjang?: string
      category?: string
      award_title?: string
      award?: string
    }
  >(
    list: T[]
  ) => {
    return (list || []).filter((item) => {
      if (!item) return false
      const name = item.recipient_name || item.student_name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
      if (campusFilter !== 'all' && item.campus !== campusFilter) return false
      if (!isLegacyPeriod && jenjangFilter !== 'all' && item.jenjang !== jenjangFilter) return false
      if (isLegacyPeriod && lombaFilter !== 'all') {
        const cat = (item.category || item.award_title || '').toLowerCase()
        if (!cat.includes(lombaFilter.toLowerCase())) return false
      }
      if (awardFilter !== 'all') {
        const a = (item.award || item.award_title || '').toLowerCase()
        if (!a.includes(awardFilter.toLowerCase())) return false
      }
      return true
    })
  }

  const filteredWinners = filterList(winners)
  const filteredWinnerCerts = filterList(winnerCerts)
  const filteredParticipantCerts = filterList(participantCerts)

  // Always keep winners sorted by official rank order:
  // Juara 1 -> Juara 2 -> Juara 3 -> Juara Harapan 1 -> Juara Harapan 2
  const sortedWinners = [...filteredWinners].sort((a, b) => {
    const rankA = getAwardRank(a?.award)
    const rankB = getAwardRank(b?.award)
    if (rankA !== rankB) return rankA - rankB
    const catA = (a?.category || a?.jenjang || '').toLowerCase()
    const catB = (b?.category || b?.jenjang || '').toLowerCase()
    if (catA !== catB) return catA.localeCompare(catB)
    return (b?.score ?? 0) - (a?.score ?? 0)
  })

  const sortedWinnerCerts = [...filteredWinnerCerts].sort((a, b) => {
    const rankA = getAwardRank(a?.award_title)
    const rankB = getAwardRank(b?.award_title)
    if (rankA !== rankB) return rankA - rankB
    const nameA = a?.recipient_name || (a as unknown as { student_name?: string })?.student_name || ''
    const nameB = b?.recipient_name || (b as unknown as { student_name?: string })?.student_name || ''
    return nameA.localeCompare(nameB)
  })

  // Group sorted winners by category (Bidang Lomba)
  const groupedWinners = useMemo(() => {
    const groups: Record<string, PeriodWinner[]> = {}

    // In legacy periods (<= 2025), order categories by LEGACY_LOMBA_OPTIONS first
    if (isLegacyPeriod) {
      LEGACY_LOMBA_OPTIONS.forEach((opt) => {
        groups[opt] = []
      })
    }

    (sortedWinners || []).forEach((w) => {
      if (!w) return
      const cat = w.category || 'Bidang Lainnya'
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(w)
    })

    // Filter by lombaFilter if selected
    if (lombaFilter !== 'all') {
      const filteredGroups: Record<string, PeriodWinner[]> = {}
      for (const [key, list] of Object.entries(groups)) {
        if (key.toLowerCase().includes(lombaFilter.toLowerCase())) {
          filteredGroups[key] = list
        }
      }
      return filteredGroups
    }

    // Only keep non-empty groups if not actively searching
    const result: Record<string, PeriodWinner[]> = {}
    for (const [key, list] of Object.entries(groups)) {
      if (list && list.length > 0) {
        result[key] = list
      }
    }

    return Object.keys(result).length > 0 ? result : groups
  }, [sortedWinners, isLegacyPeriod, lombaFilter])

  // Multi-select handlers
  const handleToggleSelectWinner = (id: string) => {
    setSelectedWinnerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleToggleSelectCategory = (catWinners: PeriodWinner[]) => {
    const catIds = (catWinners || []).map((w) => w?.id).filter(Boolean) as string[]
    const allSelected = catIds.length > 0 && catIds.every((id) => selectedWinnerIds.includes(id))
    if (allSelected) {
      setSelectedWinnerIds((prev) => prev.filter((id) => !catIds.includes(id)))
    } else {
      setSelectedWinnerIds((prev) => Array.from(new Set([...prev, ...catIds])))
    }
  }

  const handleToggleSelectAll = () => {
    const allIds = (sortedWinners || []).map((w) => w?.id).filter(Boolean) as string[]
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedWinnerIds.includes(id))
    if (allSelected) {
      setSelectedWinnerIds([])
    } else {
      setSelectedWinnerIds(allIds)
    }
  }

  const handleBulkDeleteWinners = () => {
    if (!isSuperAdmin) {
      alert('Akses Ditolak: Hanya Super Admin yang berwenang menghapus data pemenang.')
      return
    }
    if (selectedWinnerIds.length === 0) return
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus ${selectedWinnerIds.length} data pemenang yang dipilih? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      participantPeriodService.deleteMultipleWinners(selectedWinnerIds)
      setSelectedWinnerIds([])
      loadPeriodData()
    }
  }

  const getAwardBadgeClass = (award?: string) => {
    const norm = (award || '').toLowerCase()
    if (norm.includes('juara 1')) return 'bg-amber-100 text-amber-900 border-amber-300'
    if (norm.includes('juara 2')) return 'bg-slate-100 text-slate-800 border-slate-300'
    if (norm.includes('juara 3')) return 'bg-amber-50 text-amber-800 border-amber-200'
    if (norm.includes('harapan 1') || norm.includes('harapn 1')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    if (norm.includes('harapan 2') || norm.includes('harapn 2')) return 'bg-sky-50 text-sky-800 border-sky-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  // Winner handlers (Restricted strictly to Super Admin)
  const handleOpenAddWinner = () => {
    if (!isSuperAdmin) {
      alert('Akses Ditolak: Hanya Super Admin yang berwenang menambah data pemenang.')
      return
    }
    setEditingWinner(null)
    setWinnerName('')
    setWinnerNisn('')
    setWinnerCampus(assignedCampus || 'Gontor 1')
    setWinnerJenjang(isLegacyPeriod ? '' : 'Jenjang 1')
    setWinnerAward('Juara 1')
    setWinnerCategory(isLegacyPeriod ? 'IPA Shigor' : 'Matematika Terpadu')
    setWinnerScore(95)
    setWinnerFormError(null)
    setIsAddWinnerModalOpen(true)
  }

  const handleOpenEditWinner = (w: PeriodWinner) => {
    if (!isSuperAdmin) {
      alert('Akses Ditolak: Hanya Super Admin yang berwenang mengedit data pemenang.')
      return
    }
    setEditingWinner(w)
    setWinnerName(w.student_name)
    setWinnerNisn(w.nisn_username)
    setWinnerCampus(w.campus as StudentKampus)
    setWinnerJenjang(w.jenjang || '')
    setWinnerAward(w.award)
    setWinnerCategory(w.category)
    setWinnerScore(w.score !== undefined ? w.score : '')
    setWinnerFormError(null)
    setIsAddWinnerModalOpen(true)
  }

  const handleDeleteWinner = (id: string, name: string) => {
    if (!isSuperAdmin) {
      alert('Akses Ditolak: Hanya Super Admin yang berwenang menghapus data pemenang.')
      return
    }
    if (window.confirm(`Hapus data pemenang '${name}'?`)) {
      participantPeriodService.deleteWinner(id)
      setSelectedWinnerIds((prev) => prev.filter((i) => i !== id))
      loadPeriodData()
    }
  }

  const handleSaveWinner = (e: React.FormEvent) => {
    e.preventDefault()
    if (!period) return
    if (!isSuperAdmin) {
      alert('Akses Ditolak: Hanya Super Admin yang berwenang menyimpan data pemenang.')
      return
    }
    if (!winnerName.trim()) {
      setWinnerFormError('Nama santri pemenang wajib diisi.')
      return
    }

    participantPeriodService.saveWinner({
      id: editingWinner ? editingWinner.id : undefined,
      period_id: period.id,
      student_name: winnerName.trim(),
      nisn_username: winnerNisn.trim() || winnerName.toLowerCase().replace(/\s+/g, ''),
      campus: winnerCampus,
      jenjang: isLegacyPeriod ? undefined : (winnerJenjang as StudentJenjang),
      award: winnerAward,
      category: winnerCategory,
      score: winnerScore !== '' ? Number(winnerScore) : undefined,
    })

    setIsAddWinnerModalOpen(false)
    setEditingWinner(null)
    setWinnerFormError(null)
    loadPeriodData()
  }

  // Generate / Download certificate simulation
  const handleDownloadPdf = (cert: PeriodCertificate) => {
    const typeStr = (cert?.certificate_type || 'WINNER').toUpperCase()
    const nameStr = (cert?.recipient_name || 'santri').replace(/\s+/g, '_')
    const numStr = (cert?.certificate_number || 'CERT').replace(/\//g, '-')
    const filename = `Sertifikat_${typeStr}_${nameStr}_${numStr}.pdf`
    alert(`Mengunduh berkas resmi PDF:\n${filename}\n\nNomor: ${cert?.certificate_number || '-'}\nKode Verifikasi: ${cert?.verification_code || '-'}`)
  }

  if (!period) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Periode Tidak Ditemukan</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/participant/periode')}>
          Kembali ke Daftar Periode
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/participant/periode" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Semua Periode</span>
        </Link>
        <span>/</span>
        <span className="font-bold text-slate-800">{period.name}</span>
      </div>

      <PageHeader
        title={`${period.name} — Detail Periode Kompetisi`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>Pelaksanaan: {period.description} ({period.year || (period.start_date ? new Date(period.start_date).getFullYear() : '')})</span>
            {isLegacyPeriod && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Arsip &le; 2025: Format Tanpa Jenjang
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddWinner}
                leftIcon={<Plus className="w-4 h-4 mr-1" />}
              >
                Tambah Data Juara
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Selection: 3 Sections */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('winners')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'winners'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>A. Data Juara ({winners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('winner_certs')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'winner_certs'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>B. Unduh Sertifikat Pemenang ({winnerCerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('participant_certs')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'participant_certs'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>C. Unduh Sertifikat Peserta ({participantCerts.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama santri penerima atau nomor sertifikat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {!assignedCampus && (
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Kampus</option>
              {KAMPUS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          {isLegacyPeriod ? (
            <select
              value={lombaFilter}
              onChange={(e) => setLombaFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="all">Semua Bidang Lomba</option>
              {LEGACY_LOMBA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Jenjang</option>
              <option value="Jenjang 1">Jenjang 1 (Kelas 1)</option>
              <option value="Jenjang 2">Jenjang 2 (Kelas 2)</option>
              <option value="Jenjang 3">Jenjang 3 (Kelas 1 Int & 3)</option>
              <option value="Jenjang 4">Jenjang 4 (Kelas 3 Int & 4)</option>
              <option value="Jenjang 5">Jenjang 5 (Kelas 5)</option>
            </select>
          )}

          {/* Filter Dropdown Juara (Selalu Berurutan) */}
          <select
            value={awardFilter}
            onChange={(e) => setAwardFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
          >
            <option value="all">Semua Juara</option>
            {AWARD_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION A: DATA JUARA                                    */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* SECTION A: DATA JUARA                                    */}
      {/* ======================================================== */}
      {activeTab === 'winners' && (
        <div className="space-y-4">
          {/* Floating / Sticky Bulk Actions Toolbar */}
          {selectedWinnerIds.length > 0 && (
            <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs">
                  {selectedWinnerIds.length}
                </span>
                <span className="font-semibold text-xs">Data Pemenang Dipilih</span>
                <button
                  type="button"
                  onClick={() => setSelectedWinnerIds([])}
                  className="text-[11px] text-slate-300 hover:text-white underline ml-2 cursor-pointer"
                >
                  Batal Pilih
                </button>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold ml-2 cursor-pointer"
                >
                  {sortedWinners.length > 0 && sortedWinners.every((w) => selectedWinnerIds.includes(w.id))
                    ? 'Batal Pilih Semua'
                    : `Pilih Semua (${sortedWinners.length})`}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeleteWinners}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                    className="border-rose-500/50 bg-rose-950/40 text-rose-200 hover:bg-rose-900/60 hover:text-white text-xs"
                  >
                    Hapus ({selectedWinnerIds.length}) Terpilih
                  </Button>
                )}
              </div>
            </div>
          )}          <SectionCard
            title={`Daftar Pemenang ${period.name} (${sortedWinners.length} Santri)`}
            subtitle={
              isLegacyPeriod
                ? 'Daftar resmi santri pemenang kompetisi yang dipisahkan antar Bidang Lomba dan berurutan dari Juara 1 hingga Juara Harapan 2.'
                : 'Daftar resmi santri yang berhasil meraih juara pada babak final Olimpiade Gontor.'
            }
            action={
              sortedWinners.length > 0 ? (
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setWinnerViewMode('by_lomba')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      winnerViewMode === 'by_lomba'
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Pisahkan tabel per Bidang Lomba"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Per Bidang Lomba</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinnerViewMode('flat')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      winnerViewMode === 'flat'
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Semua dalam satu tabel gabungan"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tabel Gabungan</span>
                  </button>
                </div>
              ) : undefined
            }
          >
            {/* Notice Banner: Selain Super Admin tidak bisa mengedit pemenang */}
            {!isSuperAdmin && (
              <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Mode Lihat Saja:</strong> Pengelolaan, penambahan, pengubahan, dan penghapusan data pemenang hanya dapat dilakukan oleh <strong>Super Admin</strong>.
                </span>
              </div>
            )}

            {sortedWinners.length === 0 ? (
              <EmptyState
                title="Belum Ada Data Juara"
                description="Belum ada data santri pemenang untuk kriteria filter ini atau belum ada data yang diinput."
                action={
                  isSuperAdmin && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenAddWinner}
                      leftIcon={<Plus className="w-4 h-4 mr-1" />}
                    >
                      Tambah Data Juara Sekarang
                    </Button>
                  )
                }
              />
            ) : winnerViewMode === 'by_lomba' ? (
              /* VIEW MODE 1: PISAHKAN DATA PEMENANG ANTAR LOMBA */
              <div className="space-y-5">
                {Object.entries(groupedWinners).map(([catName, catWinners]) => {
                  const safeList = Array.isArray(catWinners) ? catWinners.filter((item): item is PeriodWinner => Boolean(item && item.id)) : []
                  const isCatAllSelected =
                    safeList.length > 0 && safeList.every((w) => selectedWinnerIds.includes(w.id))

                  return (
                    <div
                      key={catName}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-3.5"
                    >
                      {/* Lomba Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                            <Trophy className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{catName}</h3>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                                {safeList.length} Pemenang
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Urutan: Juara 1 &rarr; Juara 2 &rarr; Juara 3 &rarr; Juara Harapan 1 &rarr; Juara Harapan 2
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectCategory(safeList)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                          >
                            {isCatAllSelected ? 'Batal Pilih Lomba Ini' : 'Pilih Semua Lomba Ini'}
                          </button>
                        </div>
                      </div>

                      {/* Lomba Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70 font-semibold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 px-3 w-8">
                                <input
                                  type="checkbox"
                                  checked={isCatAllSelected}
                                  onChange={() => handleToggleSelectCategory(safeList)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </th>
                              <th className="py-2.5 px-3 w-10">No</th>
                              <th className="py-2.5 px-3">Nama Santri</th>
                              <th className="py-2.5 px-3">Kampus</th>
                              {!isLegacyPeriod && <th className="py-2.5 px-3">Jenjang</th>}
                              <th className="py-2.5 px-3">Penghargaan / Juara</th>
                              <th className="py-2.5 px-3">Nilai</th>
                              {isSuperAdmin && <th className="py-2.5 px-3 text-right">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {safeList.map((w, idx) => {
                              const isSelected = selectedWinnerIds.includes(w.id)
                              return (
                                <tr
                                  key={w.id}
                                  className={`transition-colors ${
                                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'
                                  }`}
                                >
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectWinner(w.id)}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900">{w.student_name}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{w.campus}</td>
                                  {!isLegacyPeriod && (
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                                        {w.jenjang || '-'}
                                      </span>
                                    </td>
                                  )}
                                  <td className="py-2.5 px-3 font-bold">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] ${getAwardBadgeClass(
                                        w.award
                                      )}`}
                                    >
                                      <Trophy className="w-3 h-3 text-amber-600" />
                                      <span>{w.award}</span>
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                                    {w.score ?? '-'}
                                  </td>
                                  {isSuperAdmin && (
                                    <td className="py-2.5 px-3 text-right space-x-1">
                                      <button
                                        onClick={() => handleOpenEditWinner(w)}
                                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                        title="Edit Data Juara"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteWinner(w.id, w.student_name)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        title="Hapus"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* VIEW MODE 2: TABEL GABUNGAN */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            sortedWinners.length > 0 &&
                            sortedWinners.every((w) => selectedWinnerIds.includes(w.id))
                          }
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-10">No</th>
                      <th className="py-3 px-3">Nama Santri</th>
                      <th className="py-3 px-3">Kampus</th>
                      {!isLegacyPeriod && <th className="py-3 px-3">Jenjang</th>}
                      <th className="py-3 px-3">Penghargaan / Juara</th>
                      <th className="py-3 px-3">Bidang Lomba</th>
                      <th className="py-3 px-3">Nilai</th>
                      {isSuperAdmin && <th className="py-3 px-3 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedWinners
                      .filter((item): item is PeriodWinner => Boolean(item && item.id))
                      .map((w, idx) => {
                      const isSelected = selectedWinnerIds.includes(w.id)
                      return (
                        <tr
                          key={w.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectWinner(w.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{w.student_name}</td>
                          <td className="py-3 px-3 text-slate-600">{w.campus}</td>
                          {!isLegacyPeriod && (
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                                {w.jenjang || '-'}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-3 font-bold">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] ${getAwardBadgeClass(
                                w.award
                              )}`}
                            >
                              <Trophy className="w-3 h-3 text-amber-600" />
                              <span>{w.award}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            <span
                              className={
                                isLegacyPeriod
                                  ? 'px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200 inline-block'
                                  : ''
                              }
                            >
                              {w.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">{w.score ?? '-'}</td>
                          {isSuperAdmin && (
                            <td className="py-3 px-3 text-right space-x-1">
                              <button
                                onClick={() => handleOpenEditWinner(w)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Edit Data Juara"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWinner(w.id, w.student_name)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION B: UNDUH SERTIFIKAT PEMENANG                     */}
      {/* ======================================================== */}
      {activeTab === 'winner_certs' && (
        <div className="space-y-4">
          {sortedWinnerCerts.length === 0 ? (
            <EmptyState
              title="Belum Ada Sertifikat Pemenang"
              description="Belum ada sertifikat juara yang diterbitkan untuk periode ini."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedWinnerCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-400 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Award className="w-3 h-3 text-amber-700" />
                        <span>Sertifikat Pemenang</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{cert.certificate_number}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cert.recipient_name}</h4>
                      <p className="text-xs text-amber-800 font-semibold mt-0.5">{cert.award_title}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <p>
                        Kampus: <strong>{cert.campus}</strong>
                      </p>
                      {!isLegacyPeriod && cert.jenjang && (
                        <p>
                          Jenjang: <strong>{cert.jenjang}</strong>
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-slate-400">Verifikasi: {cert.verification_code}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCert(cert)}
                      leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
                    >
                      Pratinjau
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadPdf(cert)}
                      leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                      className="bg-amber-700 hover:bg-amber-800 text-white"
                    >
                      Unduh PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION C: UNDUH SERTIFIKAT PESERTA                     */}
      {/* ======================================================== */}
      {activeTab === 'participant_certs' && (
        <div className="space-y-4">
          {filteredParticipantCerts.length === 0 ? (
            <EmptyState
              title="Belum Ada Sertifikat Peserta"
              description="Belum ada sertifikat kepesertaan yang diterbitkan untuk periode ini."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParticipantCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-white border border-emerald-200/80 hover:border-emerald-400 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        <span>Sertifikat Kepesertaan</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{cert.certificate_number}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cert.recipient_name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{cert.award_title}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <p>
                        Kampus: <strong>{cert.campus}</strong>
                      </p>
                      {!isLegacyPeriod && cert.jenjang && (
                        <p>
                          Jenjang: <strong>{cert.jenjang}</strong>
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-slate-400">Verifikasi: {cert.verification_code}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCert(cert)}
                      leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
                    >
                      Pratinjau
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadPdf(cert)}
                      leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                    >
                      Unduh PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW SERTIFIKAT */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pratinjau Sertifikat Resmi — {previewCert.certificate_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Template Graphic Card */}
            <div className="p-8 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30 text-center space-y-4">
              <div className="border-4 border-double border-amber-600/40 p-6 rounded-2xl bg-white shadow-sm space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-amber-800">
                    Pondok Modern Darussalam Gontor
                  </p>
                  <h2 className="text-xl font-serif font-bold text-slate-900 tracking-wide">
                    SERTIFIKAT PENGHARGAAN
                  </h2>
                  <p className="text-[11px] text-slate-500 font-serif">
                    Nomor: <span className="font-mono">{previewCert.certificate_number}</span>
                  </p>
                </div>

                <div className="py-2">
                  <p className="text-xs text-slate-500">Diberikan secara resmi kepada:</p>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight text-emerald-900 underline decoration-amber-400 underline-offset-4">
                    {previewCert.recipient_name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Kontingen: <strong>{previewCert.campus}</strong>
                    {!isLegacyPeriod && previewCert.jenjang ? ` (${previewCert.jenjang})` : ''}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 max-w-md mx-auto">
                  <p className="text-xs font-bold text-amber-950">{previewCert.award_title}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Pada perhelatan Olimpiade Gontor Sains & Matematika ({period.name})
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-left">
                    <QrCode className="w-8 h-8 text-slate-700" />
                    <div>
                      <p className="font-bold text-slate-800">QR Validasi</p>
                      <p className="font-mono text-[9px]">{previewCert.verification_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p>Ponorogo, {new Date(previewCert.issue_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    <p className="font-bold text-slate-800">Panitia Pusat OGSO</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Link
                to={`/verify/${previewCert.verification_code}`}
                target="_blank"
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
              >
                <span>Halaman Verifikasi Publik</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPdf(previewCert)}
                leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
              >
                Unduh PDF Resmi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT WINNER (Strictly Super Admin Only) */}
      {isAddWinnerModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingWinner ? 'Edit Data Juara' : 'Tambah Data Pemenang'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWinnerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWinner} className="p-5 space-y-3.5 text-xs">
              {winnerFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {winnerFormError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  value={winnerName}
                  onChange={(e) => setWinnerName(e.target.value)}
                  placeholder="Contoh: Nainawa Annabila"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className={isLegacyPeriod ? 'space-y-1' : 'grid grid-cols-2 gap-3'}>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kampus Kontingen</label>
                  <select
                    value={winnerCampus}
                    onChange={(e) => setWinnerCampus(e.target.value as StudentKampus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {KAMPUS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                {!isLegacyPeriod && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Jenjang</label>
                    <select
                      value={winnerJenjang}
                      onChange={(e) => setWinnerJenjang(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="Jenjang 1">Jenjang 1 (Kelas 1)</option>
                      <option value="Jenjang 2">Jenjang 2 (Kelas 2)</option>
                      <option value="Jenjang 3">Jenjang 3 (Kelas 1 Int & Kelas 3)</option>
                      <option value="Jenjang 4">Jenjang 4 (Kelas 3 Int & Kelas 4)</option>
                      <option value="Jenjang 5">Jenjang 5 (Kelas 5)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Penghargaan / Juara</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Dropdown
                    </span>
                  </label>
                  <select
                    value={winnerAward}
                    onChange={(e) => setWinnerAward(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800"
                  >
                    {AWARD_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {!AWARD_OPTIONS.includes(winnerAward as any) && winnerAward && (
                      <option value={winnerAward}>{winnerAward}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nilai Akhir (Opsional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={winnerScore}
                    onChange={(e) => setWinnerScore(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="98.5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Bidang Lomba</span>
                  {isLegacyPeriod && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Pilihan Dropdown Resmi
                    </span>
                  )}
                </label>
                {isLegacyPeriod ? (
                  <select
                    value={winnerCategory}
                    onChange={(e) => setWinnerCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800"
                  >
                    {LEGACY_LOMBA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {!LEGACY_LOMBA_OPTIONS.includes(winnerCategory as any) && winnerCategory && (
                      <option value={winnerCategory}>{winnerCategory}</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={winnerCategory}
                    onChange={(e) => setWinnerCategory(e.target.value)}
                    placeholder="Matematika Terpadu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddWinnerModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingWinner ? 'Simpan Perubahan' : 'Tambah Pemenang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
