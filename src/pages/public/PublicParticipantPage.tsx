import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  Award,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react'
import {
  participantPeriodService,
  type CompetitionPeriod,
} from '../../services/participantPeriodService'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

export const PublicParticipantPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [periods, setPeriods] = useState<CompetitionPeriod[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // If not super admin, show published periods only
    const all = participantPeriodService.getPeriods()
    const visible = isSuperAdmin ? all : all.filter((p) => p.is_published)
    setPeriods(visible)
  }, [isSuperAdmin])

  const filteredPeriods = periods.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.year.toString().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  })

  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-bold text-[#166534] uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
            <span>Arsip & Hasil Kompetisi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0C241B] leading-tight font-sans">
            Periode Kompetisi & Pengumuman Pemenang
          </h1>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium max-w-2xl mx-auto">
            Informasi resmi periode pelaksanaan Inter-Campus OGSO, arsip hasil perlombaan yang telah dipublikasikan, serta layanan verifikasi sertifikat digital.
          </p>
        </div>

        {/* Certificate Verification Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C241B] via-[#0E3527] to-[#14532D] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-[#A7F3D0]">
              <ShieldCheck className="w-5 h-5 text-[#A7F3D0]" />
              <span>Verifikasi Keaslian Sertifikat Digital OGSO</span>
            </div>
            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
              Setiap e-certificate pemenang dan peserta dilengkapi nomor sertifikat unik dan kode QR. Anda dapat memverifikasi validitas sertifikat secara online melalui portal verifikasi resmi.
            </p>
          </div>

          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] shrink-0 shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cek Validitas Sertifikat</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari periode olimpiade (contoh: 2026, 2025)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] shadow-xs"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Menampilkan {filteredPeriods.length} periode kompetisi resmi
          </div>
        </div>

        {/* Periods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeriods.map((period) => {
            const isActive = period.status === 'active'
            const isCompleted = period.status === 'completed'

            return (
              <div
                key={period.id}
                className={cn(
                  'p-6 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between space-y-6',
                  isActive
                    ? 'border-2 border-[#166534] shadow-md hover:shadow-lg'
                    : 'border-slate-200 shadow-xs hover:border-slate-400'
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full',
                        isActive
                          ? 'bg-emerald-100 text-[#166534] border border-emerald-200'
                          : isCompleted
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {isActive
                        ? 'Periode Aktif'
                        : isCompleted
                        ? 'Selesai & Diumumkan'
                        : 'Arsip'}
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      Tahun {period.year}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-[#0C241B]">
                      {period.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {period.description || `Olimpiade Gontor Sains & Matematika Tahun ${period.year}`}
                    </p>
                  </div>

                  {/* Highlights */}
                  {(() => {
                    const actualWinnersCount = participantPeriodService.getWinners(period.id).length
                    return (
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#F5F8F4] border border-slate-100">
                          <div className="text-[10px] text-slate-500">Juara Diumumkan</div>
                          <div className="text-sm font-bold text-[#166534]">
                            {actualWinnersCount} Pemenang
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#F5F8F4] border border-slate-100">
                          <div className="text-[10px] text-slate-500">Status Publikasi</div>
                          <div className="text-xs font-bold text-slate-800">
                            {period.is_published ? 'Resmi Terbit' : 'Draf Internal'}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/participant/${period.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532D] shadow-xs transition-colors"
                  >
                    <span>Lihat Hasil & Pemenang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {period.year}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Certificate Delivery Guidelines */}
        <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-sm text-[#0C241B] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#166534]" />
            <span>Mekanisme Distribusi Sertifikat Resmi:</span>
          </div>
          <p className="leading-relaxed">
            Sertifikat penghargaan juara dan medali finalis diserahkan saat Upacara Penutupan (Award Ceremonial) atau dikirimkan ke pimpinan kampus masing-masing. Adapun e-certificate seluruh santri peserta didistribusikan secara resmi melalui akun Admin Kampus / Pembimbing Kontingen untuk menjaga privasi dan ketertiban administrasi santri.
          </p>
        </div>
      </div>
    </div>
  )
}
