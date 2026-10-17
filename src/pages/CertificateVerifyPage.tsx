import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  Building2,
  Calendar,
  GraduationCap,
  FileCheck2,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import {
  participantPeriodService,
  type PeriodCertificate,
} from '../services/participantPeriodService'

export const CertificateVerifyPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId?: string }>()
  const [queryCode, setQueryCode] = useState(certificateId || '')
  const [certificate, setCertificate] = useState<PeriodCertificate | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const verifyCertificate = (code: string) => {
    if (!code.trim()) {
      setCertificate(null)
      setHasSearched(false)
      return
    }

    const found = participantPeriodService.getCertificateById(code.trim())
    setCertificate(found)
    setHasSearched(true)
  }

  useEffect(() => {
    if (certificateId) {
      setQueryCode(certificateId)
      verifyCertificate(certificateId)
    }
  }, [certificateId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    verifyCertificate(queryCode)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 mb-2">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verifikasi Sertifikat Resmi OGSO
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Layanan verifikasi keaslian E-Sertifikat Pemenang & Peserta Olimpiade Gontor Sains dan Matematika.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="Masukkan Nomor Sertifikat atau Kode Verifikasi..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border-0 focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shrink-0"
          >
            Verifikasi
          </Button>
        </form>

        {/* Verification Result */}
        {hasSearched && (
          <div className="animate-in fade-in duration-200">
            {certificate && !certificate.is_revoked ? (
              <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden">
                {/* Status Banner */}
                <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-emerald-200" />
                    <div>
                      <h2 className="font-bold text-lg leading-tight">SERTIFIKAT VALID & RESMI</h2>
                      <p className="text-xs text-emerald-100">
                        Tercatat sah dalam pangkalan data resmi Panitia OGSO Pusat.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                    Terverifikasi
                  </span>
                </div>

                {/* Details */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-5 text-center sm:text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {certificate.certificate_type === 'winner' ? 'Sertifikat Pemenang' : 'Sertifikat Peserta'}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-3">
                      {certificate.recipient_name}
                    </h3>
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      {certificate.award_title}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                      <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500">Nomor Sertifikat</div>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">
                          {certificate.certificate_number}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500">Kontingen Kampus</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {certificate.campus}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500">Jenjang Kompetisi</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {certificate.jenjang}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500">Tanggal Terbit</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {new Date(certificate.issue_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">Kode Unik Verifikasi:</span>{' '}
                      <span className="font-mono font-bold">{certificate.verification_code}</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-red-300 shadow-xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    Sertifikat Tidak Ditemukan atau Tidak Valid
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Kode verifikasi atau nomor sertifikat <strong>"{queryCode}"</strong> tidak terdaftar dalam pangkalan data resmi OGSO atau telah dicabut.
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Pastikan Anda memasukkan kode verifikasi lengkap sesuai yang tertera pada lembar sertifikat atau QR Code.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Aplikasi OGSOreg
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 mt-8">
        &copy; {new Date().getFullYear()} Panitia Pusat Olimpiade Gontor Sains & Matematika (OGSO). Hak Cipta Dilindungi.
      </footer>
    </div>
  )
}
