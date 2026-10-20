import React, { useState, useMemo } from 'react'
import {
  Trophy,
  Search,
  ArrowUpDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { hallOfFameService } from '../../services/hallOfFameService'
import type { RankingMode } from '../../types/hallOfFame'
import { cn } from '../../lib/utils'

interface HallOfFameAllTimeTabProps {
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
  | 'periods_participated'

export const HallOfFameAllTimeTab: React.FC<HallOfFameAllTimeTabProps> = ({
  onSelectCampus,
}) => {
  const [rankingMode, setRankingMode] = useState<RankingMode>('points')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const allTimeResult = useMemo(() => {
    return hallOfFameService.computeAllTimeRankings({
      mode: rankingMode,
      search: searchQuery,
    })
  }, [rankingMode, searchQuery])

  const { rankings, periodRange, totalPeriods, scoringWeights } = allTimeResult

  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
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
  }, [rankings, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'rank' || field === 'campus' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner & Data Coverage Badge */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-[11px] font-bold text-[#166534] uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
              <span>{periodRange}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0C241B]">
              Klasemen Akumulasi Sepanjang Masa (All-Time Rankings)
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Agregasi capaian seluruh 20 kontingen kampus Pondok Modern Darussalam Gontor pada seluruh periode kompetisi resmi yang telah dipublikasikan.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Search Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kampus..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534]"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Mencakup {totalPeriods} Periode Kompetisi Resmi
          </div>
        </div>
      </div>

      {/* 2. All-Time Standings Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
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
                  onClick={() => handleSort('periods_participated')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Jumlah periode mencatatkan medali"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Periode Aktif</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gold')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Total Medali Emas Sepanjang Masa"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🥇 Emas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('silver')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Total Medali Perak Sepanjang Masa"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🥈 Perak</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('bronze')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                  title="Total Medali Perunggu Sepanjang Masa"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🥉 Perunggu</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('honorable_1')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Harapan 1</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('honorable_2')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#166534]"
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
                    <span>Total Penghargaan</span>
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
              {sortedRankings.map((row) => {
                const isZeroAwards = row.total_awards === 0
                const isPodium = row.rank <= 3 && !isZeroAwards

                return (
                  <tr
                    key={row.campus}
                    className={cn(
                      'hover:bg-emerald-50/40 transition-colors group',
                      isPodium && 'bg-emerald-50/20'
                    )}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold',
                          row.rank === 1 && !isZeroAwards
                            ? 'bg-[#D5C49A] text-[#0C241B] shadow-2xs font-extrabold'
                            : row.rank === 2 && !isZeroAwards
                            ? 'bg-slate-200 text-slate-800'
                            : row.rank === 3 && !isZeroAwards
                            ? 'bg-amber-100 text-amber-900'
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

                    <td className="py-3.5 px-3 text-center text-slate-600 font-semibold font-mono">
                      {row.periods_participated > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100">
                          {row.periods_participated} Periode
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {row.gold > 0 ? (
                        <span className="font-extrabold text-amber-600">{row.gold}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {row.silver > 0 ? (
                        <span className="font-extrabold text-slate-700">{row.silver}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {row.bronze > 0 ? (
                        <span className="font-extrabold text-amber-700">{row.bronze}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {row.honorable_1 > 0 ? row.honorable_1 : <span className="text-slate-300">0</span>}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {row.honorable_2 > 0 ? row.honorable_2 : <span className="text-slate-300">0</span>}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {row.total_awards > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {row.total_awards}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={cn(
                          'text-sm font-extrabold font-mono',
                          row.total_points > 0 ? 'text-[#166534]' : 'text-slate-400'
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
      </div>

      {/* 3. Disclosed Scoring Methodology & Version Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0C241B] text-sm">
          <ShieldCheck className="w-5 h-5 text-[#166534]" />
          <span>Transparansi Standar Pembobotan Skor All-Time</span>
        </div>

        <p className="leading-relaxed">
          Untuk menjaga konsistensi perbandingan antar-tahun, standar bobot nilai Hall of Fame diterapkan secara seragam pada seluruh data arsip historis yang telah diotorisasi. Konfigurasi skor tersimpan dalam versi terkontrol:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center font-bold text-slate-800">
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] text-amber-600">🥇 Juara 1 (Emas)</div>
            <div className="text-lg font-mono font-black text-[#0C241B]">{scoringWeights.gold} Poin</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] text-slate-500">🥈 Juara 2 (Perak)</div>
            <div className="text-lg font-mono font-black text-[#0C241B]">{scoringWeights.silver} Poin</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] text-amber-700">🥉 Juara 3 (Perunggu)</div>
            <div className="text-lg font-mono font-black text-[#0C241B]">{scoringWeights.bronze} Poin</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] text-emerald-700">Harapan 1</div>
            <div className="text-lg font-mono font-black text-[#0C241B]">{scoringWeights.honorable_1} Poin</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] text-emerald-700">Harapan 2</div>
            <div className="text-lg font-mono font-black text-[#0C241B]">{scoringWeights.honorable_2} Poin</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1">
          Versi Pembobotan: {scoringWeights.version} • Terakhir Diperbarui: {new Date(scoringWeights.updated_at).toLocaleDateString('id-ID')}
        </div>
      </div>
    </div>
  )
}
