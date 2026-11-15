import React, { useState, useEffect, useMemo } from 'react'
import {
  Award,
  Crown,
  Search,
  School,
  GraduationCap,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { competitionResultService } from '../../services/competitionResultService'
import {
  participantPeriodService,
  type CompetitionPeriod,
} from '../../services/participantPeriodService'
import type { PublicPeriodAnnouncements } from '../../types/competitionResult'
import { cn } from '../../lib/utils'

export const EditorialResultsShowcase: React.FC = () => {
  // Periods
  const [periods, setPeriods] = useState<CompetitionPeriod[]>(() =>
    participantPeriodService.getPeriods()
  )
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const list = participantPeriodService.getPeriods()
    const active = list.find((p) => p.status === 'active' && p.is_published !== false)
    return active ? active.id : list[0]?.id || 'period-ogso-2026'
  })

  // Public Announcements Data
  const [data, setData] = useState<PublicPeriodAnnouncements | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters for Finalists Directory
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('all')
  const [selectedJenjang, setSelectedJenjang] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  // Fetch Public Results safely
  const fetchResults = async (periodId: string) => {
    setIsLoading(true)
    try {
      const res = await competitionResultService.getPublicResults(periodId)
      setData(res)
    } catch (err) {
      console.warn('[EditorialShowcase] Error fetching results:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResults(selectedPeriodId)
  }, [selectedPeriodId])

  // Listen to cross-tab & admin publication events
  useEffect(() => {
    const handleSync = () => {
      setPeriods(participantPeriodService.getPeriods())
      fetchResults(selectedPeriodId)
    }
    window.addEventListener('ogsoreg_results_updated', handleSync)
    window.addEventListener('ogsoreg_periods_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('ogsoreg_results_updated', handleSync)
      window.removeEventListener('ogsoreg_periods_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [selectedPeriodId])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCampus, selectedJenjang])

  // Available Published Periods for Switcher
  const publishedPeriods = useMemo(
    () => periods.filter((p) => p.is_published !== false),
    [periods]
  )

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === selectedPeriodId) || periods[0],
    [periods, selectedPeriodId]
  )

  // Campuses present in current finalists
  const availableCampuses = useMemo(() => {
    if (!data?.finalists) return []
    const set = new Set<string>()
    data.finalists.forEach((f) => {
      if (f.campus) set.add(f.campus)
    })
    return Array.from(set).sort()
  }, [data?.finalists])

  // Jenjang present in current finalists
  const availableJenjang = useMemo(() => {
    if (!data?.finalists) return []
    const set = new Set<string>()
    data.finalists.forEach((f) => {
      if (f.jenjang) set.add(f.jenjang)
    })
    return Array.from(set).sort()
  }, [data?.finalists])

  // Filtered finalists
  const filteredFinalists = useMemo(() => {
    if (!data?.finalists) return []
    return data.finalists.filter((f) => {
      const matchesSearch =
        !searchQuery.trim() ||
        f.student_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      const matchesCampus =
        selectedCampus === 'all' || f.campus.toLowerCase() === selectedCampus.toLowerCase()
      const matchesJenjang =
        selectedJenjang === 'all' || f.jenjang.toLowerCase() === selectedJenjang.toLowerCase()
      return matchesSearch && matchesCampus && matchesJenjang
    })
  }, [data?.finalists, searchQuery, selectedCampus, selectedJenjang])

  // Pagination slice
  const paginatedFinalists = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredFinalists.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredFinalists, currentPage])

  const totalPages = Math.ceil(filteredFinalists.length / ITEMS_PER_PAGE) || 1

  // Champions spotlight (Rank 1 / Gold)
  const spotlightWinners = useMemo(() => {
    if (!data?.champions) return []
    return data.champions.filter(
      (c) =>
        c.champion_rank === 1 ||
        (c.award_category && c.award_category.toLowerCase().includes('juara 1')) ||
        (c.award_category && c.award_category.toLowerCase().includes('gold'))
    )
  }, [data?.champions])

  // Other tiered champions
  const otherChampions = useMemo(() => {
    if (!data?.champions) return []
    return data.champions.filter(
      (c) =>
        c.champion_rank !== 1 &&
        !(c.award_category && c.award_category.toLowerCase().includes('juara 1')) &&
        !(c.award_category && c.award_category.toLowerCase().includes('gold'))
    )
  }, [data?.champions])

  const isPeriodUnpublished =
    !data?.isPublished || (!data?.publishFinalists && !data?.publishChampions)

  return (
    <div
      id="pengumuman-hasil"
      className="relative bg-[#102C25] text-[#F3F0E7] selection:bg-[#C6A45B] selection:text-[#102C25] overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* RESULTS ANNOUNCEMENT HERO (Editorial Prestige Aesthetic)                 */}
      {/* ========================================================================= */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 border-b border-[#C6A45B]/20 overflow-hidden">
        {/* Subtle Ambient Ray & Sacred Star Geometric Watermark */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#C6A45B]/10 via-[#183B2E]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-32 right-10 w-96 h-96 bg-[#DCC78F]/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Geometric Islamic Star Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] pointer-events-none opacity-[0.06] select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="#C6A45B" strokeWidth="0.75">
            <circle cx="100" cy="100" r="95" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="75" />
            <rect x="35" y="35" width="130" height="130" stroke="#C6A45B" />
            <rect x="35" y="35" width="130" height="130" stroke="#C6A45B" transform="rotate(45 100 100)" />
            <circle cx="100" cy="100" r="30" strokeDasharray="2 2" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Eyebrow & Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#183B2E] border border-[#C6A45B]/40 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#C6A45B] animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-[#DCC78F] uppercase font-bold">
                GONTOR SCIENCE OLYMPIAD
              </span>
              <span className="text-xs text-[#C6A45B]/40">•</span>
              <span className="text-[11px] font-sans tracking-wider text-emerald-200/90 font-medium uppercase">
                OFFICIAL RESULTS ANNOUNCEMENT
              </span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-white leading-[1.15]">
              A JOURNEY OF KNOWLEDGE.{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#DCC78F] via-[#C6A45B] to-[#DCC78F]">
                A MOMENT OF EXCELLENCE.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg font-sans text-[#F3F0E7]/80 max-w-2xl mx-auto leading-relaxed">
              Celebrating the dedication, intelligence, and achievements of our participants across all Pondok Cabang.
            </p>

            {/* Dynamic Period Selector */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#DCC78F]/80">
                Pilih Periode Olimpiade:
              </span>
              <div className="inline-flex items-center p-1 rounded-2xl bg-[#183B2E]/90 border border-[#C6A45B]/30 backdrop-blur-md shadow-xl">
                {publishedPeriods.map((p) => {
                  const isSelected = p.id === selectedPeriodId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5',
                        isSelected
                          ? 'bg-[#C6A45B] text-[#102C25] font-bold shadow-md'
                          : 'text-[#F3F0E7]/80 hover:text-white hover:bg-emerald-900/40'
                      )}
                    >
                      {isLoading && isSelected && (
                        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                      )}
                      <span>{p.name}</span>
                      {p.status === 'active' && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-[#102C25]/20 font-mono">
                          Aktif
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE STATISTICS STRIP                                                     */}
      {/* ========================================================================= */}
      {data && !isPeriodUnpublished && (
        <section className="bg-[#183B2E]/60 border-b border-[#C6A45B]/20 py-8 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1 p-4 border-r border-[#C6A45B]/15 last:border-r-0">
                <div className="text-2xl sm:text-4xl font-serif font-bold text-[#DCC78F]">
                  {data.stats.totalRegistered.toLocaleString('id-ID')}
                </div>
                <div className="text-xs font-sans uppercase tracking-wider text-[#F3F0E7]/70 font-medium">
                  Peserta Terdaftar
                </div>
              </div>

              <div className="space-y-1 p-4 border-r border-[#C6A45B]/15 last:border-r-0">
                <div className="text-2xl sm:text-4xl font-serif font-bold text-[#DCC78F]">
                  {data.stats.totalFinalists.toLocaleString('id-ID')}
                </div>
                <div className="text-xs font-sans uppercase tracking-wider text-[#F3F0E7]/70 font-medium">
                  Santri Lolos Final
                </div>
              </div>

              <div className="space-y-1 p-4 border-r border-[#C6A45B]/15 last:border-r-0">
                <div className="text-2xl sm:text-4xl font-serif font-bold text-[#DCC78F]">
                  {data.stats.totalCampuses}
                </div>
                <div className="text-xs font-sans uppercase tracking-wider text-[#F3F0E7]/70 font-medium">
                  Pondok Cabang
                </div>
              </div>

              <div className="space-y-1 p-4">
                <div className="text-2xl sm:text-4xl font-serif font-bold text-[#DCC78F]">
                  {data.stats.totalChampions.toLocaleString('id-ID')}
                </div>
                <div className="text-xs font-sans uppercase tracking-wider text-[#F3F0E7]/70 font-medium">
                  Medalis & Juara
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CASE A: UNPUBLISHED / DRAFT / EVALUATION STATE                             */}
      {/* ========================================================================= */}
      {isPeriodUnpublished && (
        <section className="py-24 sm:py-32 relative text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#183B2E] border border-[#C6A45B]/40 flex items-center justify-center mx-auto text-[#C6A45B] shadow-lg">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#C6A45B]">
                {selectedPeriod?.name || 'OGSO'} • HASIL RESMI
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide">
                THE JOURNEY CONTINUES
              </h2>
            </div>

            <p className="text-sm sm:text-base font-sans text-[#F3F0E7]/80 leading-relaxed">
              Official results will be announced here following the conclusion of evaluation and verification by the academic board.
            </p>

            <div className="inline-block p-4 rounded-2xl bg-[#183B2E]/50 border border-[#C6A45B]/25 text-xs text-[#DCC78F] font-mono">
              Status Periode: Sedang Tahap Seleksi / Penilaian Dewan Juri
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION TWO — HALL OF FAME (02 — THE RECOGNITION)                          */}
      {/* (Placed with high prominence for prestige academic awards)                */}
      {/* ========================================================================= */}
      {data?.publishChampions && data.champions.length > 0 && (
        <section className="py-20 lg:py-28 border-b border-[#C6A45B]/20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Section Editorial Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183B2E] border border-[#C6A45B]/30 text-[#DCC78F] text-xs font-mono uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-[#C6A45B]" />
                <span>02 — THE RECOGNITION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                Hall of Fame.
              </h2>
              <p className="text-sm sm:text-base font-sans text-[#F3F0E7]/80">
                Honoring the highest academic achievements and exceptional scholarship.
              </p>
            </div>

            {/* Supreme Winner Spotlight (Gold Medalists / Juara 1) */}
            {spotlightWinners.length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#DCC78F] font-semibold">
                    ★ JUARA 1 & GOLD MEDALIST SPOTLIGHT ★
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spotlightWinners.map((winner) => (
                    <div
                      key={winner.id}
                      className="relative p-7 rounded-3xl bg-gradient-to-b from-[#183B2E] via-[#102C25] to-[#0A1E17] border-2 border-[#C6A45B] shadow-2xl shadow-[#C6A45B]/15 overflow-hidden group hover:scale-[1.01] transition-transform duration-300"
                    >
                      {/* Top Gold Corner Accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C6A45B]/25 to-transparent rounded-bl-full pointer-events-none" />

                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6A45B] text-[#102C25] text-xs font-bold font-mono tracking-wider">
                            <Crown className="w-3.5 h-3.5 fill-current" />
                            {winner.award_category || 'Juara 1'}
                          </span>
                          <span className="text-xs text-[#DCC78F] font-mono">
                            {winner.jenjang}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white group-hover:text-[#DCC78F] transition-colors leading-tight">
                            {winner.student_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#F3F0E7]/70 mt-1.5">
                            <School className="w-3.5 h-3.5 text-[#C6A45B] shrink-0" />
                            <span>{winner.campus}</span>
                          </div>
                        </div>

                        {winner.category && (
                          <div className="pt-3 border-t border-[#C6A45B]/20 flex items-center justify-between text-xs">
                            <span className="text-[#F3F0E7]/60">Bidang Lomba:</span>
                            <span className="font-semibold text-[#DCC78F]">{winner.category}</span>
                          </div>
                        )}

                        {winner.result_notes && (
                          <p className="text-xs italic text-[#F3F0E7]/70 bg-[#102C25]/80 p-2.5 rounded-xl border border-[#C6A45B]/20">
                            "{winner.result_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Tiered Awardees (Silver, Bronze, Harapan) */}
            {otherChampions.length > 0 && (
              <div className="space-y-6 pt-6">
                <div className="text-center">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#F3F0E7]/70">
                    DAFTAR LENGKAP MEDALIS & PERAIH JUARA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {otherChampions.map((winner) => {
                    const isSilver =
                      winner.champion_rank === 2 ||
                      winner.award_category?.toLowerCase().includes('juara 2') ||
                      winner.award_category?.toLowerCase().includes('silver')
                    const isBronze =
                      winner.champion_rank === 3 ||
                      winner.award_category?.toLowerCase().includes('juara 3') ||
                      winner.award_category?.toLowerCase().includes('bronze')

                    return (
                      <div
                        key={winner.id}
                        className={cn(
                          'p-5 rounded-2xl bg-[#183B2E]/70 border transition-all duration-200 hover:-translate-y-1 space-y-3',
                          isSilver
                            ? 'border-slate-300/40 shadow-lg shadow-slate-400/5'
                            : isBronze
                            ? 'border-amber-600/40 shadow-lg shadow-amber-600/5'
                            : 'border-[#C6A45B]/20'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wide',
                              isSilver
                                ? 'bg-slate-200 text-slate-900'
                                : isBronze
                                ? 'bg-amber-600 text-amber-50'
                                : 'bg-[#102C25] text-[#DCC78F] border border-[#C6A45B]/30'
                            )}
                          >
                            {winner.award_category || `Peringkat #${winner.champion_rank}`}
                          </span>
                          <span className="text-[11px] text-[#F3F0E7]/60 font-mono">
                            {winner.jenjang}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif font-bold text-white text-base leading-snug line-clamp-2">
                            {winner.student_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-[#F3F0E7]/70 mt-1">
                            <School className="w-3 h-3 text-[#C6A45B] shrink-0" />
                            <span className="truncate">{winner.campus}</span>
                          </div>
                        </div>

                        {winner.category && (
                          <div className="pt-2 border-t border-[#C6A45B]/15 text-[11px] flex justify-between text-[#F3F0E7]/70">
                            <span>Bidang:</span>
                            <span className="font-medium text-[#DCC78F]">{winner.category}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION ONE — OFFICIAL FINALISTS (01 — THE SELECTION)                      */}
      {/* ========================================================================= */}
      {data?.publishFinalists && (
        <section className="py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Section Editorial Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183B2E] border border-[#C6A45B]/30 text-[#DCC78F] text-xs font-mono uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-[#C6A45B]" />
                <span>01 — THE SELECTION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                The Finalists.
              </h2>
              <p className="text-sm sm:text-base font-sans text-[#F3F0E7]/80">
                They have earned their place in the final round of the Gontor Science Olympiad.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#183B2E]/80 border border-[#C6A45B]/30 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search by Name */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#C6A45B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama santri finalis atau bidang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#102C25] border border-[#C6A45B]/30 text-white placeholder-[#F3F0E7]/40 text-xs focus:outline-none focus:border-[#C6A45B] transition-colors"
                />
              </div>

              {/* Campus Filter */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="flex items-center gap-2 bg-[#102C25] border border-[#C6A45B]/30 rounded-xl px-3 py-1.5">
                  <School className="w-3.5 h-3.5 text-[#C6A45B]" />
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#102C25] text-white">
                      Semua Kampus ({availableCampuses.length})
                    </option>
                    {availableCampuses.map((c) => (
                      <option key={c} value={c} className="bg-[#102C25] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenjang Filter */}
                <div className="flex items-center gap-2 bg-[#102C25] border border-[#C6A45B]/30 rounded-xl px-3 py-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#C6A45B]" />
                  <select
                    value={selectedJenjang}
                    onChange={(e) => setSelectedJenjang(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#102C25] text-white">
                      Semua Jenjang
                    </option>
                    {availableJenjang.map((j) => (
                      <option key={j} value={j} className="bg-[#102C25] text-white">
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-[#F3F0E7]/70 font-mono">
              <div>
                Menampilkan <span className="font-bold text-[#DCC78F]">{filteredFinalists.length}</span> santri finalis
                {filteredFinalists.length !== data.finalists.length && (
                  <span> (difilter dari total {data.finalists.length})</span>
                )}
              </div>
              <div>Halaman {currentPage} dari {totalPages}</div>
            </div>

            {/* Finalists Grid */}
            {paginatedFinalists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedFinalists.map((finalist) => (
                  <div
                    key={finalist.id}
                    className="p-5 rounded-2xl bg-[#183B2E]/60 border border-[#C6A45B]/25 hover:border-[#C6A45B]/70 transition-all duration-200 hover:-translate-y-1 space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[#DCC78F] text-[11px] font-mono font-bold">
                          <Award className="w-3 h-3 text-[#C6A45B]" />
                          Lolos Final
                        </span>
                        {finalist.is_champion && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C6A45B] text-[#102C25] text-[10px] font-black font-mono">
                            <Crown className="w-3 h-3 fill-current" />
                            {finalist.award_category || 'Peraih Juara'}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-white text-lg tracking-tight leading-snug">
                        {finalist.student_name}
                      </h3>

                      <div className="space-y-1 text-xs text-[#F3F0E7]/70">
                        <div className="flex items-center gap-2">
                          <School className="w-3.5 h-3.5 text-[#C6A45B] shrink-0" />
                          <span className="font-medium text-white">{finalist.campus}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-[#C6A45B]/70 shrink-0" />
                          <span>{finalist.jenjang}</span>
                        </div>
                      </div>
                    </div>

                    {finalist.category && (
                      <div className="pt-2.5 border-t border-[#C6A45B]/15 flex items-center justify-between text-xs text-[#F3F0E7]/80">
                        <span>Bidang:</span>
                        <span className="font-semibold text-[#DCC78F]">{finalist.category}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[#183B2E]/40 border border-[#C6A45B]/20 text-[#F3F0E7]/70 space-y-2">
                <Search className="w-8 h-8 text-[#C6A45B] mx-auto opacity-70" />
                <p className="font-medium">Tidak ada data finalis yang sesuai dengan kriteria pencarian.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCampus('all')
                    setSelectedJenjang('all')
                  }}
                  className="text-xs text-[#DCC78F] underline cursor-pointer mt-1"
                >
                  Reset filter
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-[#183B2E] border border-[#C6A45B]/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-900/40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-8 h-8 rounded-xl text-xs font-mono transition-colors cursor-pointer',
                        currentPage === page
                          ? 'bg-[#C6A45B] text-[#102C25] font-bold'
                          : 'bg-[#183B2E] text-white border border-[#C6A45B]/30 hover:bg-emerald-900/40'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-[#183B2E] border border-[#C6A45B]/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-900/40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
