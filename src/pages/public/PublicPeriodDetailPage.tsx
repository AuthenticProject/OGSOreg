import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Trophy,
  Award,
  ArrowLeft,
  Search,
  ShieldCheck,
  Building2,
  Calendar,
  Info,
} from 'lucide-react'
import {
  participantPeriodService,
  getAwardRank,
  type CompetitionPeriod,
  type PeriodWinner,
  type PeriodCertificate,
} from '../../services/participantPeriodService'
import { cn } from '../../lib/utils'

export const PublicPeriodDetailPage: React.FC = () => {
  const { periodId } = useParams<{ periodId: string }>()

  const [period, setPeriod] = useState<CompetitionPeriod | null>(() =>
    periodId ? participantPeriodService.getPeriodById(periodId) : null
  )
  const [winners, setWinners] = useState<PeriodWinner[]>([])
  const [certificates, setCertificates] = useState<PeriodCertificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJenjang, setSelectedJenjang] = useState<string>('all')

  useEffect(() => {
    if (!periodId) return
    const p = participantPeriodService.getPeriodById(periodId)
    setPeriod(p)
    if (p) {
      const wList = participantPeriodService.getWinners(periodId)
      setWinners(wList)
      const certList = participantPeriodService.getCertificates(periodId, 'winner')
      setCertificates(certList)
    }
  }, [periodId])

  // Map certificate by winner recipient_name / id
  const certMap = useMemo(() => {
    const map = new Map<string, PeriodCertificate>()
    certificates.forEach((c) => {
      if (c.recipient_name) map.set(c.recipient_name.toLowerCase().trim(), c)
      if (c.id) map.set(c.id, c)
    })
    return map
  }, [certificates])

  // Filtered and sorted winners (ranked: Juara 1 -> Juara 2 -> Juara 3 -> Harapan 1 -> Harapan 2)
  const sortedAndFilteredWinners = useMemo(() => {
    return winners
      .filter((w) => {
        if (selectedJenjang !== 'all') {
          const matchJenjang = w.jenjang === selectedJenjang || w.category === selectedJenjang
          if (!matchJenjang) return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          return (
            w.student_name.toLowerCase().includes(q) ||
            w.campus.toLowerCase().includes(q) ||
            w.award.toLowerCase().includes(q) ||
            (w.category && w.category.toLowerCase().includes(q))
          )
        }
        return true
      })
      .sort((a, b) => getAwardRank(a.award) - getAwardRank(b.award))
  }, [winners, selectedJenjang, searchQuery])

  const isLegacyPeriod = period
    ? Number(period.year) <= 2025 || (period.name && (period.name.includes('2025') || period.name.includes('2024') || period.name.includes('2023')))
    : false

  // Unique categories / jenjangs present
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    winners.forEach((w) => {
      if (!isLegacyPeriod && w.jenjang) set.add(w.jenjang)
      if (w.category) set.add(w.category)
    })
    return Array.from(set)
  }, [winners, isLegacyPeriod])

  if (!period) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <Trophy className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-[#0C241B]">Periode Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Periode yang Anda cari tidak tersedia atau belum dipublikasikan oleh Panitia Pusat OGSO.
        </p>
        <Link
          to="/participant"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#166534] text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Periode</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            to="/participant"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Periode</span>
          </Link>
        </div>

        {/* Period Banner Header */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-900/10 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#166534] px-3 py-1 rounded-full">
              {period.status === 'active' ? 'Periode Berjalan' : 'Hasil Resmi Terbit'}
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Calendar className="w-4 h-4 text-[#166534]" />
              <span>Tahun Pelaksanaan: {period.year}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
            Daftar Juara & Pemenang {period.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {period.description ||
              `Pengumuman pemenang resmi Inter-Campus Online Gontor Science Olympiad Tahun ${period.year}.`}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, kampus, atau juara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] shadow-xs"
            />
          </div>

          {/* Jenjang Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedJenjang('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                selectedJenjang === 'all'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              Semua Kategori
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedJenjang(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                  selectedJenjang === cat
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Winners List / Table */}
        {sortedAndFilteredWinners.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Pemenang yang Diumumkan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hasil pemenang untuk kategori yang Anda pilih belum dipublikasikan atau masih dalam proses rekapitulasi dewan juri.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedAndFilteredWinners.map((w, idx) => {
              const rank = getAwardRank(w.award)
              const cert = certMap.get(w.student_name.toLowerCase().trim())

              const isFirst = rank === 1 || w.award.toLowerCase().includes('juara 1')
              const isSecond = rank === 2 || w.award.toLowerCase().includes('juara 2')
              const isThird = rank === 3 || w.award.toLowerCase().includes('juara 3')

              return (
                <div
                  key={w.id || idx}
                  className={cn(
                    'p-6 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md',
                    isFirst
                      ? 'border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/40 to-white'
                      : isSecond
                      ? 'border-2 border-slate-300'
                      : isThird
                      ? 'border-2 border-amber-700/40'
                      : 'border-slate-200'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full',
                          isFirst
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isSecond
                            ? 'bg-slate-100 text-slate-800 border border-slate-300'
                            : isThird
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800'
                        )}
                      >
                        {w.award}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-400">
                        {isLegacyPeriod
                          ? (w.category || 'OGSO')
                          : (w.jenjang ? `${w.jenjang} • ${w.category}` : (w.category || 'OGSO'))}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-[#0C241B] line-clamp-1">
                        {w.student_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                        <span className="font-semibold text-slate-800">{w.campus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {cert ? (
                      <Link
                        to={`/verify/${cert.certificate_number || cert.id}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#166534] hover:underline"
                        title="Verifikasi keaslian sertifikat pemenang"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verifikasi Sertifikat</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pemenang Terverifikasi</span>
                      </span>
                    )}

                    <span className="text-[10px] font-semibold text-slate-400">
                      {period.year}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Notice on Participant Certificates */}
        <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-sm text-[#0C241B] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#166534]" />
            <span>Informasi Sertifikat Seluruh Peserta:</span>
          </div>
          <p className="leading-relaxed">
            Sertifikat keikutsertaan untuk seluruh santri yang berpartisipasi pada babak penyisihan didistribusikan secara resmi melalui akun Admin Kampus atau guru pembimbing masing-masing kontingen. Untuk memeriksa keabsahan sertifikat yang telah diterima, silakan gunakan menu{' '}
            <Link to="/verify" className="font-bold text-[#166534] underline">
              Verifikasi Sertifikat
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
