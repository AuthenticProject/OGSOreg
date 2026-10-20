import React from 'react'
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
  Info,
} from 'lucide-react'
import type { HallOfFameOverviewData } from '../../types/hallOfFame'
import { cn } from '../../lib/utils'

interface HallOfFameOverviewTabProps {
  overviewData: HallOfFameOverviewData
  onNavigateToStandings: () => void
  onNavigateToAllTime: () => void
  onSelectCampus: (campusSlug: string) => void
}

export const HallOfFameOverviewTab: React.FC<HallOfFameOverviewTabProps> = ({
  overviewData,
  onNavigateToStandings,
  onNavigateToAllTime,
  onSelectCampus,
}) => {
  const {
    latestPeriod,
    totalPublishedPeriods,
    totalParticipatingCampuses,
    totalRecordedAwards,
    topThreeCampuses,
    leadingGoldCampus,
  } = overviewData

  const hasData = latestPeriod && topThreeCampuses.length > 0 && topThreeCampuses.some((c) => c.total_points > 0)

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. Summary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4 text-[#166534]" />
            <span>Periode Terbaru</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
            {latestPeriod ? latestPeriod.name : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {latestPeriod?.year ? `Tahun ${latestPeriod.year}` : 'Belum dipublikasikan'}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <School className="w-4 h-4 text-[#166534]" />
            <span>Kontingen Kampus</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
            {totalParticipatingCampuses}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gontor 1–12 & Putri 1–8
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4 text-[#166534]" />
            <span>Total Penghargaan</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
            {totalRecordedAwards}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Medali & Juara Harapan
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4 text-[#166534]" />
            <span>Arsip Periode</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
            {totalPublishedPeriods}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Periode Terverifikasi
          </div>
        </div>
      </div>

      {/* 2. Top Three Podiums (Point Rankings) */}
      {!hasData ? (
        <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#166534] flex items-center justify-center">
            <Trophy className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-lg font-bold text-[#0C241B]">
            Hasil Resmi Sedang Dalam Proses Rekapitulasi
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Klasemen Hall of Fame hanya menampilkan data juara yang telah resmi diumumkan dan dipublikasikan oleh Panitia Pusat OGSO.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#D5C49A]" />
                <span>Pemuncak Klasemen Poin ({latestPeriod?.name})</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0C241B] mt-2 font-sans">
                Tiga Kontingen Teratas Berdasarkan Skor Poin
              </h2>
            </div>

            <button
              onClick={onNavigateToStandings}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#166534] hover:text-[#0C241B] group cursor-pointer"
            >
              <span>Lihat Klasemen Lengkap Seluruh Kampus</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Podiums Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topThreeCampuses.map((campusRec, idx) => {
              const rank = idx + 1
              const isFirst = rank === 1
              const isSecond = rank === 2

              return (
                <div
                  key={campusRec.campus}
                  onClick={() => onSelectCampus(campusRec.campusSlug)}
                  className={cn(
                    'group relative p-6 sm:p-8 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6',
                    isFirst
                      ? 'bg-gradient-to-b from-[#0C241B] via-[#0E3527] to-[#14532D] text-white shadow-xl hover:-translate-y-1 border-2 border-[#D5C49A]'
                      : 'bg-white text-[#0C241B] border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300'
                  )}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                        isFirst
                          ? 'bg-[#D5C49A] text-[#0C241B] shadow-xs'
                          : isSecond
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-900'
                      )}
                    >
                      <Medal className="w-3.5 h-3.5" />
                      <span>Peringkat #{rank}</span>
                    </span>

                    <span
                      className={cn(
                        'text-xs font-bold',
                        isFirst ? 'text-[#A7F3D0]' : 'text-slate-400'
                      )}
                    >
                      {latestPeriod?.name}
                    </span>
                  </div>

                  {/* Campus Info & Big Points */}
                  <div className="space-y-2">
                    <h3
                      className={cn(
                        'text-xl sm:text-2xl font-black group-hover:underline',
                        isFirst ? 'text-white' : 'text-[#0C241B]'
                      )}
                    >
                      {campusRec.campus}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-4xl font-extrabold',
                          isFirst ? 'text-[#D5C49A]' : 'text-[#166534]'
                        )}
                      >
                        {campusRec.total_points}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold uppercase tracking-wider',
                          isFirst ? 'text-emerald-200' : 'text-slate-500'
                        )}
                      >
                        Poin Total
                      </span>
                    </div>
                  </div>

                  {/* Award Pills Breakdown */}
                  <div
                    className={cn(
                      'pt-4 border-t grid grid-cols-5 gap-1 text-center text-[11px] font-bold',
                      isFirst ? 'border-emerald-800/80 text-emerald-100' : 'border-slate-100 text-slate-700'
                    )}
                  >
                    <div className="p-1 rounded-lg bg-black/10">
                      <div className="text-[10px] text-amber-400 font-bold">🥇</div>
                      <div>{campusRec.gold}</div>
                    </div>
                    <div className="p-1 rounded-lg bg-black/10">
                      <div className="text-[10px] text-slate-400 font-bold">🥈</div>
                      <div>{campusRec.silver}</div>
                    </div>
                    <div className="p-1 rounded-lg bg-black/10">
                      <div className="text-[10px] text-amber-600 font-bold">🥉</div>
                      <div>{campusRec.bronze}</div>
                    </div>
                    <div className="p-1 rounded-lg bg-black/10">
                      <div className="text-[10px] text-emerald-400 font-bold">H1</div>
                      <div>{campusRec.honorable_1}</div>
                    </div>
                    <div className="p-1 rounded-lg bg-black/10">
                      <div className="text-[10px] text-emerald-400 font-bold">H2</div>
                      <div>{campusRec.honorable_2}</div>
                    </div>
                  </div>

                  {/* Footnote Link */}
                  <div
                    className={cn(
                      'flex items-center justify-between text-xs font-semibold pt-2',
                      isFirst ? 'text-[#A7F3D0]' : 'text-[#166534]'
                    )}
                  >
                    <span>Buka Profil Kontingen</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Featured Spotlight & Direct Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leading Gold Campus Spotlight */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              <Medal className="w-3.5 h-3.5 text-amber-600" />
              <span>Perolehan Emas Terbanyak</span>
            </div>
            <h3 className="text-xl font-black text-[#0C241B]">
              {leadingGoldCampus ? leadingGoldCampus.campus : 'Belum Terdata'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {leadingGoldCampus
                ? `Kontingen peraih medali emas terbanyak pada ${latestPeriod?.name} dengan raihan ${leadingGoldCampus.goldCount} Medali Emas.`
                : 'Data perolehan medali emas akan ditampilkan setelah pengumuman resmi.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Sistem Penilaian: Juara 1 (5 Poin)
            </span>
            <button
              onClick={onNavigateToStandings}
              className="text-xs font-bold text-[#166534] hover:underline cursor-pointer"
            >
              Lihat Klasemen Medali →
            </button>
          </div>
        </div>

        {/* All-Time Historical Rankings Gateway */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C241B] to-[#166534] text-white shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-bold text-[#A7F3D0]">
              <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
              <span>Arsip Sepanjang Masa</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Rekapitulasi Prestasi Lintas Periode
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Telusuri akumulasi medali dan statistik performa 20 kampus Pondok Modern Darussalam Gontor sepanjang pelaksanaan OGSO.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-between">
            <span className="text-xs text-emerald-300/80 font-medium">
              Data Resmi Multi-Tahun
            </span>
            <button
              onClick={onNavigateToAllTime}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              <span>Buka All-Time Rankings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Academic Methodology Disclosure */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-[#0C241B]">Catatan Metodologi & Transparansi Akademik</div>
          <p className="leading-relaxed">
            Peringkat Hall of Fame merupakan analitik statistik capaian akademik resmi. Pemeringkatan default menggunakan sistem bobot poin resmi (Juara 1: 5 pt, Juara 2: 4 pt, Juara 3: 3 pt, Harapan 1: 2 pt, Harapan 2: 1 pt). Seluruh kontingen 20 kampus ditampilkan secara komprehensif.
          </p>
        </div>
      </div>
    </div>
  )
}
