import React, { useState } from 'react'
import {
  School,
  Trophy,
  Medal,
  Award,
  Calendar,
  Layers,
  MapPin,
  Phone,
  User,
  ArrowLeft,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { KAMPUS_OPTIONS } from '../../types/campus'
import { hallOfFameService, campusToSlug } from '../../services/hallOfFameService'
import type { CampusProfileData } from '../../types/hallOfFame'

interface CampusProfileViewProps {
  campusSlug: string
  onSelectCampus: (slug: string) => void
  onNavigateToStandings: () => void
  onNavigateToAllTime: () => void
}

export const CampusProfileView: React.FC<CampusProfileViewProps> = ({
  campusSlug,
  onSelectCampus,
  onNavigateToStandings,
  onNavigateToAllTime,
}) => {
  const [winnerSearch, setWinnerSearch] = useState('')
  const [winnerLevelFilter, setWinnerLevelFilter] = useState('all')

  const profileData: CampusProfileData | null = hallOfFameService.getCampusProfileData(campusSlug)

  if (!profileData) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <School className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-[#0C241B]">Profil Kampus Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">
          Silakan pilih kontingen kampus yang tersedia dari daftar 20 Kampus Gontor resmi.
        </p>
      </div>
    )
  }

  const {
    campus,
    officialName,
    address,
    pic,
    phone,
    allTimeRank,
    allTimePoints,
    totalAwards,
    totalMedals,
    totalAwardsCount,
    bestPerformance,
    achievementsByLevel,
    achievementsByCategory,
    periodHistory,
    publishedWinners,
  } = profileData

  // Filter published winners
  const filteredWinners = publishedWinners.filter((w) => {
    const isLegacy =
      (w.period_year && w.period_year <= 2025) ||
      (w.period_name && (w.period_name.includes('2025') || w.period_name.includes('2024') || w.period_name.includes('2023')))
    const effectiveJenjang = isLegacy ? undefined : w.jenjang

    if (winnerLevelFilter !== 'all') {
      if (winnerLevelFilter === 'legacy') {
        if (!isLegacy) return false
      } else {
        if (isLegacy) return false
        const lvl = (effectiveJenjang || '').toLowerCase()
        if (!lvl.includes(winnerLevelFilter.toLowerCase())) return false
      }
    }
    if (winnerSearch.trim()) {
      const q = winnerSearch.toLowerCase()
      return (
        w.student_name.toLowerCase().includes(q) ||
        w.award.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.period_name.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Campus Identity Header & Selector */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C241B] via-[#0E3527] to-[#14532D] text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        {/* Decorative Watermark */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Breadcrumb & Switcher */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={onNavigateToStandings}
                className="text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Klasemen Periode</span>
              </button>
              <span className="text-emerald-600">•</span>
              <button
                onClick={onNavigateToAllTime}
                className="text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
              >
                <span>Peringkat All-Time</span>
              </button>
              <span className="text-emerald-600">•</span>
              <span className="text-emerald-200 font-bold">Pilih Kampus:</span>
              <select
                value={campus}
                onChange={(e) => onSelectCampus(campusToSlug(e.target.value))}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-white focus:outline-none focus:ring-1 focus:ring-[#A7F3D0]"
              >
                {KAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-[#0C241B] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white font-sans tracking-tight">
              {officialName}
            </h2>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-emerald-100/80">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D5C49A] shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
                <span>{pic}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
                <span>{phone}</span>
              </div>
            </div>
          </div>

          {/* Key Stat Cards (All-time rank & points) */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-emerald-500/20 text-center min-w-[110px]">
              <div className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
                Peringkat All-Time
              </div>
              <div className="text-3xl font-black text-[#D5C49A] font-mono mt-1">
                #{allTimeRank}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Dari 20 Kampus</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-emerald-500/20 text-center min-w-[110px]">
              <div className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
                Total Poin
              </div>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {allTimePoints}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Akumulasi Skor</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics & Best Performance Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Medals Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Medal className="w-4 h-4 text-[#166534]" />
            <span>Raihan Medali</span>
          </div>
          <div className="text-3xl font-black text-[#0C241B]">{totalMedals}</div>
          <div className="flex items-center gap-3 text-xs font-bold pt-1 border-t border-slate-100 text-slate-700">
            <span className="text-amber-600">🥇 {totalAwards.gold}</span>
            <span className="text-slate-500">🥈 {totalAwards.silver}</span>
            <span className="text-amber-700">🥉 {totalAwards.bronze}</span>
          </div>
        </div>

        {/* Juara Harapan */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-[#166534]" />
            <span>Juara Harapan</span>
          </div>
          <div className="text-3xl font-black text-[#0C241B]">
            {totalAwards.honorable_1 + totalAwards.honorable_2}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold pt-1 border-t border-slate-100 text-slate-600">
            <span>Harapan 1: {totalAwards.honorable_1}</span>
            <span>Harapan 2: {totalAwards.honorable_2}</span>
          </div>
        </div>

        {/* Total Penghargaan */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#166534]" />
            <span>Total Penghargaan</span>
          </div>
          <div className="text-3xl font-black text-[#0C241B]">{totalAwardsCount}</div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            Termasuk Medali & Harapan
          </div>
        </div>

        {/* Best Performance */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D5C49A]" />
            <span>Capaian Terbaik</span>
          </div>
          <div className="text-xl font-black text-[#166534]">
            {bestPerformance ? bestPerformance.period_name : 'Belum Terdata'}
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            {bestPerformance
              ? `Peringkat #${bestPerformance.rank} • ${bestPerformance.points} Poin`
              : 'Menunggu rekapitulasi'}
          </div>
        </div>
      </div>

      {/* 3. Achievements by Level & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Competition Level */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#166534]" />
              <span>Raihan Prestasi Berdasarkan Jenjang</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Sistem Jenjang Mulai 2026
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.keys(achievementsByLevel).length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                Belum ada data prestasi per jenjang (sistem jenjang baru diterapkan mulai OGSO 2026).
              </div>
            ) : (
              Object.entries(achievementsByLevel).map(([lvl, data]) => (
                <div
                  key={lvl}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-bold text-[#0C241B]">{lvl}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600">
                      🥇{data.gold} 🥈{data.silver} 🥉{data.bronze} H1:{data.honorable_1} H2:{data.honorable_2}
                    </span>
                    <span className="font-bold text-[#166534] font-mono">{data.points} Pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By Category */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-[#166534]" />
            <span>Raihan Prestasi Berdasarkan Bidang Studi</span>
          </h3>

          <div className="space-y-2.5">
            {Object.keys(achievementsByCategory).length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                Belum ada data prestasi bidang studi yang dipublikasikan.
              </div>
            ) : (
              Object.entries(achievementsByCategory).map(([cat, data]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-bold text-[#0C241B]">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600">
                      🥇{data.gold} 🥈{data.silver} 🥉{data.bronze}
                    </span>
                    <span className="font-bold text-[#166534] font-mono">{data.points} Pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Historical Period-by-Period Progression Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#166534]" />
          <span>Riwayat Capaian Per Periode Kompetisi</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4 text-center">Peringkat</th>
                <th className="py-3 px-3 text-center">🥇 Emas</th>
                <th className="py-3 px-3 text-center">🥈 Perak</th>
                <th className="py-3 px-3 text-center">🥉 Perunggu</th>
                <th className="py-3 px-3 text-center">Harapan</th>
                <th className="py-3 px-4 text-right">Total Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {periodHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada riwayat periode untuk kontingen ini.
                  </td>
                </tr>
              ) : (
                periodHistory.map((h) => (
                  <tr key={h.period_id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0C241B]">{h.period_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{h.period_year}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-100">
                        #{h.display_rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-600">{h.gold}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-700">{h.silver}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-700">{h.bronze}</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-600">
                      {h.honorable_1 + h.honorable_2}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-[#166534]">
                      {h.points} Pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Published Winners (Sanitized Public Roster) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#166534]" />
              <span>Daftar Santri Berprestasi Terpublikasi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya menampilkan data nama, bidang lomba, dan penghargaan yang telah disahkan untuk publikasi.
            </p>
          </div>

          {/* Winner Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={winnerSearch}
                onChange={(e) => setWinnerSearch(e.target.value)}
                placeholder="Cari santri juara..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#166534]"
              />
            </div>

            <select
              value={winnerLevelFilter}
              onChange={(e) => setWinnerLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F8F4] border border-slate-200 text-slate-800"
            >
              <option value="all">Semua Jenjang</option>
              <option value="Jenjang 1">Jenjang 1</option>
              <option value="Jenjang 2">Jenjang 2</option>
              <option value="Jenjang 3">Jenjang 3</option>
              <option value="Jenjang 4">Jenjang 4</option>
              <option value="Jenjang 5">Jenjang 5</option>
              <option value="legacy">Tanpa Jenjang (Arsip ≤ 2025)</option>
            </select>
          </div>
        </div>

        {/* Winners List / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Nama Santri</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Jenjang</th>
                <th className="py-3 px-4">Bidang Lomba</th>
                <th className="py-3 px-4">Predikat Juara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWinners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada arsip santri juara yang ditemukan untuk kontingen ini.
                  </td>
                </tr>
              ) : (
                filteredWinners.map((w) => {
                  const isLegacy =
                    (w.period_year && w.period_year <= 2025) ||
                    (w.period_name && (w.period_name.includes('2025') || w.period_name.includes('2024') || w.period_name.includes('2023')))
                  const displayJenjang = isLegacy ? '—' : (w.jenjang || '—')
                  return (
                    <tr key={w.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0C241B]">{w.student_name}</td>
                      <td className="py-3 px-4 text-slate-600">{w.period_name}</td>
                      <td className="py-3 px-4 text-slate-600">{displayJenjang}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{w.category}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-[#166534]">
                          <Award className="w-3.5 h-3.5 text-[#D5C49A]" />
                          <span>{w.award}</span>
                        </span>
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
