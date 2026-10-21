import React, { useState, useMemo } from 'react'
import {
  Search,
  BarChart3,
  ArrowUpDown,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import {
  hallOfFameService,
} from '../../services/hallOfFameService'
import type {
  RankingMode,
} from '../../types/hallOfFame'
import type { CompetitionPeriod } from '../../services/participantPeriodService'
import { cn } from '../../lib/utils'

interface HallOfFameStandingsTabProps {
  periods: CompetitionPeriod[]
  selectedPeriodId: string
  onPeriodChange: (periodId: string) => void
  onSelectCampus: (campusSlug: string) => void
}

type SortField =
  | 'rank'
  | 'campus'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'honorable_1'
  | 'honorable_2'
  | 'total_awards'
  | 'total_points'

export const HallOfFameStandingsTab: React.FC<HallOfFameStandingsTabProps> = ({
  periods,
  selectedPeriodId,
  onPeriodChange,
  onSelectCampus,
}) => {
  const [rankingMode, setRankingMode] = useState<RankingMode>('points')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [awardFilter, setAwardFilter] = useState<'all' | 'medals_only' | 'honorable_only'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const isLegacyPeriod = useMemo(() => {
    const p = periods.find((item) => item.id === selectedPeriodId || item.slug === selectedPeriodId)
    return p ? p.year <= 2025 : false
  }, [periods, selectedPeriodId])

  // Compute standings using service
  const standingsResult = useMemo(() => {
    return hallOfFameService.computePeriodStandings(selectedPeriodId, {
      mode: rankingMode,
      level: isLegacyPeriod ? 'all' : levelFilter,
      awardFilter,
      search: searchQuery,
    })
  }, [selectedPeriodId, rankingMode, isLegacyPeriod, levelFilter, awardFilter, searchQuery])

  const { standings, period, hasResults } = standingsResult

  // Client-side sort if user clicks a column header
  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => {
      let valA: number | string = a[sortField]
      let valB: number | string = b[sortField]

      if (typeof valA === 'string') {
        const cmp = (valA as string).localeCompare(valB as string)
        return sortDirection === 'asc' ? cmp : -cmp
      }

      valA = valA as number
      valB = valB as number
      return sortDirection === 'asc' ? valA - valB : valB - valA
    })
  }, [standings, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'rank' || field === 'campus' ? 'asc' : 'desc')
    }
  }

  // Top 5 campuses for horizontal chart comparison
  const topForChart = useMemo(() => {
    const activeScorers = standings.filter((s) => s.total_points > 0 || s.total_awards > 0)
    return activeScorers.slice(0, 6)
  }, [standings])

  const maxPointsForChart = Math.max(1, ...topForChart.map((s) => s.total_points))

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Control Bar & Filter Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Selector Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0C241B]">
              <Calendar className="w-4 h-4 text-[#166534]" />
              <span>Periode OGSO:</span>
            </div>
            <select
              value={selectedPeriodId}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F5F8F4] border border-slate-300 text-[#0C241B] focus:outline-none focus:ring-2 focus:ring-[#166534] shadow-2xs"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.year}) {p.status === 'active' ? '• Periode Aktif' : ''}
                </option>
              ))}
            </select>

            {period && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  hasResults
                    ? 'bg-emerald-100 text-[#166534] border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                )}
              >
                {hasResults ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Hasil Terverifikasi</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Belum Diumumkan</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Ranking Mode Toggle: Points (DEFAULT) vs Medals */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Mode Klasemen:</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setRankingMode('points')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  rankingMode === 'points'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Skor Poin (Default)
              </button>
              <button
                type="button"
                onClick={() => setRankingMode('medals')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  rankingMode === 'medals'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Perolehan Medali
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row: Level, Award Filter & Campus Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          {/* Level Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter Jenjang:
            </label>
            {isLegacyPeriod ? (
              <div
                title="Sistem jenjang baru diterapkan pada OGSO 2026. Periode 2025 dan sebelumnya tidak memiliki pembagian jenjang."
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-500 select-none flex items-center justify-between"
              >
                <span>Tanpa Jenjang</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-bold">Mulai 2026</span>
              </div>
            ) : (
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534]"
              >
                <option value="all">Semua Jenjang (1–5 & Terpadu)</option>
                <option value="Jenjang 1">Jenjang 1</option>
                <option value="Jenjang 2">Jenjang 2</option>
                <option value="Jenjang 3">Jenjang 3</option>
                <option value="Jenjang 4">Jenjang 4</option>
                <option value="Jenjang 5">Jenjang 5</option>
                <option value="Shigor">Shigor (Jenjang 1-2)</option>
                <option value="Kibar">Kibar (Jenjang 3-4)</option>
              </select>
            )}
          </div>

          {/* Award Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Kategori Penghargaan:
            </label>
            <select
              value={awardFilter}
              onChange={(e) => setAwardFilter(e.target.value as 'all' | 'medals_only' | 'honorable_only')}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534]"
            >
              <option value="all">Semua Capaian (Medali & Harapan)</option>
              <option value="medals_only">Hanya Medali (Emas, Perak, Perunggu)</option>
              <option value="honorable_only">Hanya Juara Harapan (1 & 2)</option>
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cari Kontingen Kampus:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: Gontor 1, Putri 3..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Comparative Bar Chart (only when period has winners) */}
      {hasResults && topForChart.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0C241B] uppercase tracking-wider">
                  Visualisasi Perolehan Poin Teratas — {period?.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perbandingan proporsional skor 6 kontingen tertinggi
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#166534] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
              Top 6 Kontingen
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {topForChart.map((s) => {
              const widthPct = Math.max(10, Math.round((s.total_points / maxPointsForChart) * 100))
              const isFirst = s.rank === 1
              const isSecond = s.rank === 2
              const isThird = s.rank === 3

              return (
                <div key={s.campus} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black',
                          isFirst
                            ? 'bg-amber-400 text-[#0C241B]'
                            : isSecond
                            ? 'bg-slate-300 text-slate-800'
                            : isThird
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {s.display_rank}
                      </span>
                      <button
                        onClick={() => onSelectCampus(s.campusSlug)}
                        className="cursor-pointer hover:text-[#166534] hover:underline font-bold text-[#0C241B]"
                      >
                        {s.campus}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {s.total_awards} Juara
                      </span>
                      <span className="font-extrabold text-[#166534] font-mono text-sm">
                        {s.total_points} Poin
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        isFirst
                          ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-[#166534]'
                          : isSecond
                          ? 'bg-gradient-to-r from-slate-400 via-slate-500 to-[#166534]'
                          : isThird
                          ? 'bg-gradient-to-r from-amber-600 to-[#166534]'
                          : 'bg-gradient-to-r from-[#166534] to-[#22C55E]'
                      )}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Official Academic Standings Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#0C241B]">
              Tabel Klasemen Resmi Seluruh Kontingen
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan seluruh 20 kampus resmi Pondok Modern Darussalam Gontor. Kontingen tanpa medali tercatat dengan 0 poin secara definitif.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Total {sortedStandings.length} Kampus
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleSort('rank')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#166534]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('campus')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#166534]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Kampus</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gold')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Juara 1 / Emas (25 Poin)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🥇 Emas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('silver')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Juara 2 / Perak (15 Poin)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🥈 Perak</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('bronze')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Juara 3 / Perunggu (8 Poin)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🥉 Perunggu</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('honorable_1')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Juara Harapan 1 (3 Poin)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Harapan 1</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('honorable_2')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Juara Harapan 2 (1 Poin)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Harapan 2</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_awards')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Total Juara</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_points')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-[#166534]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Skor Poin</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStandings.map((row) => {
                const isZeroAwards = row.total_awards === 0
                const isPodium = row.rank <= 3 && !isZeroAwards

                return (
                  <tr
                    key={row.campus}
                    className={cn(
                      'hover:bg-emerald-50/50 transition-colors group',
                      isPodium && 'bg-emerald-50/25'
                    )}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black shadow-2xs',
                          row.rank === 1 && !isZeroAwards
                            ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-[#0C241B] ring-2 ring-amber-400/40'
                            : row.rank === 2 && !isZeroAwards
                            ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 ring-2 ring-slate-300'
                            : row.rank === 3 && !isZeroAwards
                            ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 ring-2 ring-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {row.display_rank}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectCampus(row.campusSlug)}
                        className="text-left font-bold text-[#0C241B] group-hover:text-[#166534] group-hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{row.campus}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {row.gold > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-black border border-amber-200/80">
                          {row.gold}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {row.silver > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-black border border-slate-200">
                          {row.silver}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {row.bronze > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-black border border-amber-200/60">
                          {row.bronze}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {row.honorable_1 > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded bg-emerald-50 text-[#166534] font-bold">
                          {row.honorable_1}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {row.honorable_2 > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded bg-emerald-50 text-[#166534] font-bold">
                          {row.honorable_2}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {row.total_awards > 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold border border-slate-200">
                          {row.total_awards}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={cn(
                          'text-base font-black font-mono',
                          row.total_points > 0 ? 'text-[#166534]' : 'text-slate-300'
                        )}
                      >
                        {row.total_points}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State / Notice if no results for period */}
        {!hasResults && (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <div className="font-bold text-[#0C241B]">Hasil Belum Diumumkan Untuk Periode Ini</div>
            <p>
              Seluruh kontingen ditampilkan dengan status konfirmasi awal (0 penghargaan) sampai pengumuman juara dipublikasikan resmi oleh panitia.
            </p>
          </div>
        )}
      </div>

      {/* 4. Disclosed Tie-Breaking Rules & Guidance */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-[#0C241B] font-bold">
          <Info className="w-4 h-4 text-[#166534]" />
          <span>Aturan Penentuan Peringkat & Tie-Breaking Resmi</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Urutan penyortiran Mode Poin: (1) Total Skor Poin (Emas: 25 pt, Perak: 15 pt, Perunggu: 8 pt, Harapan 1: 3 pt, Harapan 2: 1 pt) → (2) Jumlah Emas → (3) Jumlah Perak → (4) Jumlah Perunggu → (5) Jumlah Harapan 1 → (6) Jumlah Harapan 2. Apabila seluruh metrik bernilai sama, kontingen berbagi peringkat yang sama (ditandai tanda sama dengan, misal 3=). Nama kampus diurutkan alfabetis murni untuk keterbacaan tampilan, bukan sebagai pemecah seri kompetitif.
        </p>
      </div>
    </div>
  )
}
