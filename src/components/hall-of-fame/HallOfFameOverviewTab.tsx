import React, { useState, useMemo } from 'react'
import {
  Trophy,
  Award,
  Medal,
  ArrowRight,
  School,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  Crown,
} from 'lucide-react'
import type { HallOfFameOverviewData } from '../../types/hallOfFame'
import type { CompetitionPeriod } from '../../services/participantPeriodService'
import { hallOfFameService } from '../../services/hallOfFameService'

interface HallOfFameOverviewTabProps {
  overviewData: HallOfFameOverviewData
  periods?: CompetitionPeriod[]
  onNavigateToStandings: () => void
  onNavigateToAllTime: () => void
  onSelectCampus: (campusSlug: string) => void
}

export const HallOfFameOverviewTab: React.FC<HallOfFameOverviewTabProps> = ({
  overviewData,
  periods,
  onNavigateToStandings,
  onNavigateToAllTime,
  onSelectCampus,
}) => {
  const {
    latestPeriod,
    totalPublishedPeriods,
    totalParticipatingCampuses,
    totalRecordedAwards,
    leadingGoldCampus,
  } = overviewData

  const [podiumScope, setPodiumScope] = useState<string>('all-time')

  const availablePeriods = useMemo(() => {
    if (periods && periods.length > 0) return periods
    return hallOfFameService.getEligiblePeriods()
  }, [periods])

  const { podiumCampuses, podiumTitle, podiumSubtitle, isAllTime } = useMemo(() => {
    if (podiumScope === 'all-time') {
      const allTime = hallOfFameService.computeAllTimeRankings()
      return {
        podiumCampuses: allTime.rankings.slice(0, 3),
        podiumTitle: 'Secara Keseluruhan (Sepanjang Masa)',
        podiumSubtitle: allTime.periodRange ? `Akumulasi Seluruh Periode Resmi (${allTime.periodRange})` : 'Akumulasi Seluruh Periode Resmi',
        isAllTime: true,
      }
    }

    const period = availablePeriods.find((p) => p.id === podiumScope)
    const standings = hallOfFameService.computePeriodStandings(podiumScope, { mode: 'points' })
    const periodName = period ? period.name : 'Periode Terpilih'
    return {
      podiumCampuses: standings.standings.slice(0, 3),
      podiumTitle: periodName,
      podiumSubtitle: period?.year ? `Hasil Resmi Tahun ${period.year}` : 'Hasil Periode Resmi',
      isAllTime: false,
    }
  }, [podiumScope, availablePeriods])

  const hasData =
    podiumCampuses.length > 0 &&
    podiumCampuses.some((c) => c.total_points > 0 || c.total_awards > 0)

  // Reorder for Olympic Podium on desktop: [2nd, 1st, 3rd]
  const firstPlace = podiumCampuses[0]
  const secondPlace = podiumCampuses[1]
  const thirdPlace = podiumCampuses[2]

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* 1. Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Periode Terverifikasi</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {latestPeriod ? latestPeriod.name : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{latestPeriod?.year ? `Tahun ${latestPeriod.year}` : 'Belum dipublikasikan'}</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center group-hover:scale-110 transition-transform">
              <School className="w-4 h-4" />
            </div>
            <span>Kontingen Kampus</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {totalParticipatingCampuses}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Gontor 1–12 & Putri 1–8
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <span>Total Penghargaan</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {totalRecordedAwards}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Medali & Juara Harapan
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span>Arsip Periode</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {totalPublishedPeriods}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Periode Resmi Tersimpan
          </div>
        </div>
      </div>

      {/* 2. Top Three Podiums (True Olympic Championship Podium Layout) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Podium Juara — {podiumTitle}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0C241B] mt-2 tracking-tight">
              Tiga Kontingen Pemuncak Klasemen Poin
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {podiumSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Period Selector Dropdown */}
            <div className="relative inline-flex items-center w-full sm:w-auto">
              <label htmlFor="podium-period-select" className="sr-only">
                Pilih Periode Podium
              </label>
              <select
                id="podium-period-select"
                value={podiumScope}
                onChange={(e) => setPodiumScope(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-9 pr-9 py-2.5 text-xs font-bold rounded-2xl bg-white border-2 border-emerald-600/30 hover:border-emerald-600 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm text-[#0C241B] cursor-pointer transition-all"
              >
                <option value="all-time">🏆 Secara Keseluruhan (Sepanjang Masa)</option>
                {availablePeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    📅 {p.name} {p.year ? `(${p.year})` : ''}
                  </option>
                ))}
              </select>
              <Trophy className="w-4 h-4 text-amber-500 absolute left-3 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>

            <button
              onClick={isAllTime ? onNavigateToAllTime : onNavigateToStandings}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-xs font-bold text-[#166534] hover:bg-emerald-100 hover:text-[#0C241B] transition-all cursor-pointer group border border-emerald-200/80 shadow-2xs whitespace-nowrap"
            >
              <span>{isAllTime ? 'Lihat Rekap Sepanjang Masa' : 'Lihat Klasemen Lengkap'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {!hasData ? (
          <div className="p-12 sm:p-16 rounded-3xl bg-white border border-dashed border-emerald-300/80 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center">
              <Trophy className="w-8 h-8 opacity-75" />
            </div>
            <h3 className="text-lg font-bold text-[#0C241B]">
              Hasil {podiumTitle} Belum Memiliki Pemenang Terverifikasi
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Klasemen dan podium untuk periode ini belum memiliki data pemenang yang tercatat. Silakan pilih &ldquo;Secara Keseluruhan&rdquo; atau periode resmi lainnya.
            </p>
          </div>
        ) : (
          /* Olympic 3D-Style Podium Layout */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            {/* 2nd Place Podium (Left on Desktop, Silver) */}
            {secondPlace && (
              <div
                onClick={() => onSelectCampus(secondPlace.campusSlug)}
                className="order-2 md:order-1 group relative p-6 sm:p-7 rounded-3xl bg-white text-[#0C241B] border-2 border-slate-200/90 shadow-md hover:shadow-xl hover:border-slate-400 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 md:min-h-[380px]"
              >
                {/* Silver Medal Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-200 text-slate-800 shadow-2xs">
                    <Medal className="w-3.5 h-3.5 text-slate-600" />
                    <span>Peringkat #2</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    🥈 Runner-Up
                  </span>
                </div>

                {/* Campus & Points */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black group-hover:text-[#166534] group-hover:underline transition-colors">
                    {secondPlace.campus}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-800 font-mono">
                      {secondPlace.total_points}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Poin Total
                    </span>
                  </div>
                </div>

                {/* Awards Breakdown */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-5 gap-1.5 text-center text-xs font-bold">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60">
                    <div className="text-amber-600 font-extrabold text-[11px]">🥇</div>
                    <div className="text-slate-800 mt-0.5">{secondPlace.gold}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                    <div className="text-slate-700 font-extrabold text-[11px]">🥈</div>
                    <div className="text-slate-800 mt-0.5">{secondPlace.silver}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/40">
                    <div className="text-amber-700 font-extrabold text-[11px]">🥉</div>
                    <div className="text-slate-800 mt-0.5">{secondPlace.bronze}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[#166534] text-[10px] font-bold">H1</div>
                    <div className="text-slate-800 mt-0.5">{secondPlace.honorable_1}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[#166534] text-[10px] font-bold">H2</div>
                    <div className="text-slate-800 mt-0.5">{secondPlace.honorable_2}</div>
                  </div>
                </div>

                {/* Footnote Link */}
                <div className="flex items-center justify-between text-xs font-bold text-[#166534] pt-2">
                  <span>Lihat Profil Kontingen</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )}

            {/* 1st Place Podium (Center on Desktop, Gold, Crowned & Elevated) */}
            {firstPlace && (
              <div
                onClick={() => onSelectCampus(firstPlace.campusSlug)}
                className="order-1 md:order-2 group relative p-7 sm:p-8 rounded-3xl bg-gradient-to-b from-[#071C14] via-[#0E3527] to-[#14532D] text-white border-2 border-amber-400 shadow-2xl shadow-amber-900/30 hover:shadow-amber-800/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 md:min-h-[420px] ring-4 ring-amber-400/20"
              >
                {/* Crown Header Glow */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#0C241B] shadow-md">
                    <Crown className="w-4 h-4 text-[#0C241B] fill-[#0C241B]" />
                    <span>Juara Umum #1</span>
                  </span>

                  <span className="text-xs font-black text-amber-300 flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-full border border-amber-400/30">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Gold Champion</span>
                  </span>
                </div>

                {/* Campus & Huge Points */}
                <div className="space-y-2">
                  <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                    {isAllTime ? 'Peringkat 1 Nasional Sepanjang Masa' : 'Peringkat 1 Nasional OGSO'}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-200 transition-colors">
                    {firstPlace.campus}
                  </h3>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-5xl font-black text-amber-300 font-mono tracking-tight">
                      {firstPlace.total_points}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                      Poin Total
                    </span>
                  </div>
                </div>

                {/* Awards Breakdown in Gold Theme */}
                <div className="pt-4 border-t border-emerald-700/60 grid grid-cols-5 gap-1.5 text-center text-xs font-bold">
                  <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
                    <div className="text-amber-300 font-black text-[11px]">🥇</div>
                    <div className="text-white mt-0.5">{firstPlace.gold}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-slate-200">
                    <div className="text-slate-200 font-black text-[11px]">🥈</div>
                    <div className="text-white mt-0.5">{firstPlace.silver}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <div className="text-amber-400 font-black text-[11px]">🥉</div>
                    <div className="text-white mt-0.5">{firstPlace.bronze}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    <div className="text-emerald-300 text-[10px] font-bold">H1</div>
                    <div className="text-white mt-0.5">{firstPlace.honorable_1}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    <div className="text-emerald-300 text-[10px] font-bold">H2</div>
                    <div className="text-white mt-0.5">{firstPlace.honorable_2}</div>
                  </div>
                </div>

                {/* Footnote Link */}
                <div className="flex items-center justify-between text-xs font-black text-amber-300 pt-2 border-t border-emerald-800/80">
                  <span>Lihat Profil Juara Umum</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )}

            {/* 3rd Place Podium (Right on Desktop, Bronze) */}
            {thirdPlace && (
              <div
                onClick={() => onSelectCampus(thirdPlace.campusSlug)}
                className="order-3 md:order-3 group relative p-6 sm:p-7 rounded-3xl bg-white text-[#0C241B] border-2 border-amber-200/90 shadow-md hover:shadow-xl hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 md:min-h-[360px]"
              >
                {/* Bronze Medal Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 shadow-2xs">
                    <Medal className="w-3.5 h-3.5 text-amber-700" />
                    <span>Peringkat #3</span>
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    🥉 Perunggu
                  </span>
                </div>

                {/* Campus & Points */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black group-hover:text-[#166534] group-hover:underline transition-colors">
                    {thirdPlace.campus}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-800 font-mono">
                      {thirdPlace.total_points}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Poin Total
                    </span>
                  </div>
                </div>

                {/* Awards Breakdown */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-5 gap-1.5 text-center text-xs font-bold">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60">
                    <div className="text-amber-600 font-extrabold text-[11px]">🥇</div>
                    <div className="text-slate-800 mt-0.5">{thirdPlace.gold}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                    <div className="text-slate-700 font-extrabold text-[11px]">🥈</div>
                    <div className="text-slate-800 mt-0.5">{thirdPlace.silver}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300">
                    <div className="text-amber-800 font-extrabold text-[11px]">🥉</div>
                    <div className="text-slate-800 mt-0.5">{thirdPlace.bronze}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[#166534] text-[10px] font-bold">H1</div>
                    <div className="text-slate-800 mt-0.5">{thirdPlace.honorable_1}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[#166534] text-[10px] font-bold">H2</div>
                    <div className="text-slate-800 mt-0.5">{thirdPlace.honorable_2}</div>
                  </div>
                </div>

                {/* Footnote Link */}
                <div className="flex items-center justify-between text-xs font-bold text-[#166534] pt-2">
                  <span>Lihat Profil Kontingen</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Featured Spotlight & Direct Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leading Gold Campus Spotlight */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-5 hover:border-amber-300 transition-all">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              <Medal className="w-3.5 h-3.5 text-amber-600" />
              <span>Raja Emas (Sepanjang Masa)</span>
            </div>
            <h3 className="text-2xl font-black text-[#0C241B]">
              {leadingGoldCampus ? leadingGoldCampus.campus : 'Belum Terdata'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {leadingGoldCampus
                ? `Kontingen peraih medali emas terbanyak secara keseluruhan dengan raihan ${leadingGoldCampus.goldCount} Medali Emas dan total ${leadingGoldCampus.totalPoints} poin kompetisi.`
                : 'Data perolehan medali emas akan ditampilkan setelah pengumuman resmi.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Bobot Juara 1: 25 Poin Resmi
            </span>
            <button
              onClick={onNavigateToStandings}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#166534] hover:underline cursor-pointer"
            >
              <span>Buka Klasemen Medali</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* All-Time Historical Rankings Gateway */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C241B] via-[#0E3527] to-[#14532D] text-white shadow-xl flex flex-col justify-between space-y-5 border border-emerald-800/60">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-bold text-[#A7F3D0]">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Arsip Sepanjang Masa</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              Rekapitulasi Prestasi Lintas Periode
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Telusuri akumulasi medali dan statistik performa 20 kampus Pondok Modern Darussalam Gontor sepanjang pelaksanaan OGSO secara komprehensif.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-between">
            <span className="text-xs text-emerald-300/90 font-medium">
              Data Resmi Multi-Tahun
            </span>
            <button
              onClick={onNavigateToAllTime}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-[#0C241B] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-105 transition-all cursor-pointer shadow-md"
            >
              <span>Buka All-Time Rankings</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#0C241B]" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Academic Methodology Disclosure */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 text-slate-700 text-xs flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="font-bold text-[#0C241B] text-sm">
            Catatan Metodologi & Transparansi Akademik
          </div>
          <p className="leading-relaxed text-slate-600 text-xs">
            Peringkat Hall of Fame merupakan analitik statistik capaian akademik resmi. Pemeringkatan default menggunakan sistem bobot poin resmi (Juara 1: 25 pt, Juara 2: 15 pt, Juara 3: 8 pt, Harapan 1: 3 pt, Harapan 2: 1 pt). Seluruh kontingen 20 kampus ditampilkan secara komprehensif. Periode yang belum memiliki data pemenang terverifikasi tidak dimasukkan ke dalam grafik historis.
          </p>
        </div>
      </div>
    </div>
  )
}
