import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  Award,
  Upload,
  Settings2,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Save,
  RotateCcw,
  History,
  Layers,
  School,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { HistoricalImportModal } from '../components/hall-of-fame/HistoricalImportModal'
import {
  hallOfFameService,
} from '../services/hallOfFameService'
import {
  participantPeriodService,
  type CompetitionPeriod,
} from '../services/participantPeriodService'
import type {
  ScoringWeights,
  HistoricalImportLog,
} from '../types/hallOfFame'
import { cn } from '../lib/utils'

export const HallOfFameManagementPage: React.FC = () => {
  const { isSuperAdmin, assignedCampus } = useAuth()

  const [periods, setPeriods] = useState<CompetitionPeriod[]>([])
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(() =>
    hallOfFameService.getScoringWeights()
  )
  const [weightsForm, setWeightsForm] = useState<ScoringWeights>(() =>
    hallOfFameService.getScoringWeights()
  )
  const [weightsSaved, setWeightsSaved] = useState(false)
  const [importHistory, setImportHistory] = useState<HistoricalImportLog[]>([])
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Load periods & logs
  const loadData = () => {
    const pList = participantPeriodService.getPeriods()
    setPeriods(pList)
    setImportHistory(hallOfFameService.getImportHistory())
    const curWeights = hallOfFameService.getScoringWeights()
    setScoringWeights(curWeights)
    setWeightsForm(curWeights)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Save Scoring Weights
  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    hallOfFameService.saveScoringWeights(weightsForm)
    setScoringWeights(weightsForm)
    setWeightsSaved(true)
    setTimeout(() => setWeightsSaved(false), 3000)
    loadData()
  }

  // Handle Reset Scoring Weights
  const handleResetWeights = () => {
    if (!isSuperAdmin) return
    if (confirm('Kembalikan bobot skor ke standar resmi OGSO (5, 4, 3, 2, 1)?')) {
      hallOfFameService.resetScoringWeights()
      loadData()
    }
  }

  // Toggle Period Publication
  const handleTogglePublication = (period: CompetitionPeriod) => {
    if (!isSuperAdmin) return
    participantPeriodService.savePeriod({
      ...period,
      is_published: !period.is_published,
    })
    loadData()
  }

  const overview = hallOfFameService.getHallOfFameOverview()

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C241B] via-[#0E3527] to-[#14532D] text-white shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-xs font-bold text-[#A7F3D0]">
            <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
            <span>Manajemen Hall of Fame & Statistik Prestasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Konfigurasi & Pengarsipan Hall of Fame
          </h1>
          <p className="text-xs text-emerald-100/80 max-w-xl leading-relaxed">
            Pengelolaan bobot skor analitik, impor data historis dari Excel, kendali publikasi klasemen antar-kampus, dan log audit verifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/hall-of-fame"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-xs"
          >
            <span>Lihat Portal Publik</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {isSuperAdmin && (
            <Button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] text-[#0C241B] hover:opacity-90 font-bold text-xs rounded-xl shadow-md"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              <span>Impor Arsip Excel</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Campus Admin Notice (Role Boundary Enforcement) */}
      {!isSuperAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Akses Admin Kampus ({assignedCampus || 'Kontingen'})</div>
            <p className="leading-relaxed text-amber-800">
              Sebagai Admin Kampus, Anda dapat memantau perolehan medali dan peringkat kontingen Anda. Perubahan bobot skor, publikasi klasemen, dan impor arsip historis dikelola terpusat oleh Panitia Pusat (Super Admin) untuk menjamin validitas dan kepatuhan JUKLAK resmi.
            </p>
          </div>
        </div>
      )}

      {/* 3. Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#166534]" />
            <span>Periode Terdata</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {overview.totalPublishedPeriods}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Periode Terverifikasi</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <School className="w-4 h-4 text-[#166534]" />
            <span>Total Kontingen</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {overview.totalParticipatingCampuses}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">20 Kampus Pondok Gontor</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#166534]" />
            <span>Total Penghargaan</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0C241B]">
            {overview.totalRecordedAwards}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Medali & Juara Harapan</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#166534]" />
            <span>Versi Bobot Skor</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#166534] truncate">
            {scoringWeights.version.split(' ')[0]}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Emas: {scoringWeights.gold}pt • Perak: {scoringWeights.silver}pt
          </div>
        </div>
      </div>

      {/* 4. Scoring Configuration (Super Admin) & Period Publication Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Weights Management */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#166534]" />
              <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider">
                Konfigurasi Bobot Penilaian
              </h3>
            </div>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleResetWeights}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                title="Reset bobot ke standar resmi 5, 4, 3, 2, 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveWeights} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  🥇 Emas
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!isSuperAdmin}
                  value={weightsForm.gold}
                  onChange={(e) =>
                    setWeightsForm({ ...weightsForm, gold: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl text-center font-mono font-bold text-sm bg-[#F5F8F4] border border-slate-200 text-[#0C241B] focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  🥈 Perak
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!isSuperAdmin}
                  value={weightsForm.silver}
                  onChange={(e) =>
                    setWeightsForm({ ...weightsForm, silver: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl text-center font-mono font-bold text-sm bg-[#F5F8F4] border border-slate-200 text-[#0C241B] focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  🥉 Perunggu
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!isSuperAdmin}
                  value={weightsForm.bronze}
                  onChange={(e) =>
                    setWeightsForm({ ...weightsForm, bronze: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl text-center font-mono font-bold text-sm bg-[#F5F8F4] border border-slate-200 text-[#0C241B] focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Harapan 1
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!isSuperAdmin}
                  value={weightsForm.honorable_1}
                  onChange={(e) =>
                    setWeightsForm({ ...weightsForm, honorable_1: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl text-center font-mono font-bold text-sm bg-[#F5F8F4] border border-slate-200 text-[#0C241B] focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Harapan 2
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!isSuperAdmin}
                  value={weightsForm.honorable_2}
                  onChange={(e) =>
                    setWeightsForm({ ...weightsForm, honorable_2: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl text-center font-mono font-bold text-sm bg-[#F5F8F4] border border-slate-200 text-[#0C241B] focus:ring-2 focus:ring-[#166534]"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              Formula kalkulasi: <code>total_points = gold*{weightsForm.gold} + silver*{weightsForm.silver} + bronze*{weightsForm.bronze} + h1*{weightsForm.honorable_1} + h2*{weightsForm.honorable_2}</code>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center justify-between pt-2">
                {weightsSaved ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bobot skor berhasil diperbarui</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Standar default resmi: 5, 4, 3, 2, 1
                  </span>
                )}

                <Button
                  type="submit"
                  className="bg-[#166534] hover:bg-[#0C241B] text-white text-xs font-bold rounded-xl"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Simpan Perubahan Bobot</span>
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Period Publication Controls */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#166534]" />
              <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider">
                Status Publikasi Periode Kompetisi
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {periods.filter((p) => p.is_published).length} Dipublikasikan
            </span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <div className="font-bold text-[#0C241B] flex items-center gap-2">
                    <span>{period.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({period.year})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {period.total_winners || 0} Santri Juara • Status: {period.status}
                  </div>
                </div>

                {isSuperAdmin ? (
                  <button
                    onClick={() => handleTogglePublication(period)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      period.is_published
                        ? 'bg-emerald-100 text-[#166534] hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    )}
                  >
                    {period.is_published ? 'Dipublikasikan' : 'Draft (Internal)'}
                  </button>
                ) : (
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-bold',
                      period.is_published
                        ? 'bg-emerald-100 text-[#166534]'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {period.is_published ? 'Publik' : 'Draft'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Import & Audit History Log */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#166534]" />
            <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider">
              Log Audit & Riwayat Impor Arsip Historis
            </h3>
          </div>
          <span className="text-xs text-slate-500">{importHistory.length} Riwayat Tercatat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Nama Berkas</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Cakupan Periode</th>
                <th className="py-2.5 px-3">Baris Terimpor</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {importHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat impor data historis yang tercatat.
                  </td>
                </tr>
              ) : (
                importHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {new Date(item.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#0C241B]">{item.filename}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.operator}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.period_name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#166534]">
                      {item.records_imported}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                      {item.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Import Modal */}
      {isImportModalOpen && (
        <HistoricalImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
