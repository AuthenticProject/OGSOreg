import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Trophy,
  Award,
  Sparkles,
  Download,
  Eye,
  Plus,
  Search,
  ArrowLeft,
  X,
  FileCheck,
  QrCode,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  participantPeriodService,
  type CompetitionPeriod,
  type PeriodWinner,
  type PeriodCertificate,
} from '../services/participantPeriodService'
import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'
import type { StudentJenjang } from '../types/student'

export const PeriodDetailPage: React.FC = () => {
  const { periodId } = useParams<{ periodId: string }>()
  const navigate = useNavigate()
  const { isSuperAdmin, assignedCampus } = useAuth()

  const [period, setPeriod] = useState<CompetitionPeriod | null>(null)
  const [activeTab, setActiveTab] = useState<'winners' | 'winner_certs' | 'participant_certs'>('winners')

  // Data states
  const [winners, setWinners] = useState<PeriodWinner[]>([])
  const [winnerCerts, setWinnerCerts] = useState<PeriodCertificate[]>([])
  const [participantCerts, setParticipantCerts] = useState<PeriodCertificate[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>(assignedCampus || 'all')
  const [jenjangFilter, setJenjangFilter] = useState<string>('all')

  // Modals
  const [isAddWinnerModalOpen, setIsAddWinnerModalOpen] = useState(false)
  const [editingWinner, setEditingWinner] = useState<PeriodWinner | null>(null)
  const [previewCert, setPreviewCert] = useState<PeriodCertificate | null>(null)

  // Winner Form
  const [winnerName, setWinnerName] = useState('')
  const [winnerNisn, setWinnerNisn] = useState('')
  const [winnerCampus, setWinnerCampus] = useState(assignedCampus || 'Gontor 1')
  const [winnerJenjang, setWinnerJenjang] = useState<StudentJenjang>('Jenjang 1')
  const [winnerAward, setWinnerAward] = useState('Juara 1')
  const [winnerCategory, setWinnerCategory] = useState('Matematika Terpadu')
  const [winnerScore, setWinnerScore] = useState<number | ''>(95)
  const [winnerFormError, setWinnerFormError] = useState<string | null>(null)

  const loadPeriodData = () => {
    if (!periodId) return
    const p = participantPeriodService.getPeriodById(periodId)
    setPeriod(p)

    const wList = participantPeriodService.getWinners(periodId)
    setWinners(wList)

    const wCerts = participantPeriodService.getCertificates(periodId, 'winner')
    setWinnerCerts(wCerts)

    const pCerts = participantPeriodService.getCertificates(periodId, 'participant')
    setParticipantCerts(pCerts)
  }

  useEffect(() => {
    loadPeriodData()
  }, [periodId])

  if (!period) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Periode Tidak Ditemukan</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/participant/periode')}>
          Kembali ke Daftar Periode
        </Button>
      </div>
    )
  }

  // Filter logic
  const filterList = <T extends { recipient_name?: string; student_name?: string; campus: string; jenjang: string }>(
    list: T[]
  ) => {
    return list.filter((item) => {
      const name = item.recipient_name || item.student_name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
      if (campusFilter !== 'all' && item.campus !== campusFilter) return false
      if (jenjangFilter !== 'all' && item.jenjang !== jenjangFilter) return false
      return true
    })
  }

  const filteredWinners = filterList(winners)
  const filteredWinnerCerts = filterList(winnerCerts)
  const filteredParticipantCerts = filterList(participantCerts)

  // Winner handlers
  const handleOpenAddWinner = () => {
    setEditingWinner(null)
    setWinnerName('')
    setWinnerNisn('')
    setWinnerCampus(assignedCampus || 'Gontor 1')
    setWinnerJenjang('Jenjang 1')
    setWinnerAward('Juara 1')
    setWinnerCategory('Matematika Terpadu')
    setWinnerScore(95)
    setWinnerFormError(null)
    setIsAddWinnerModalOpen(true)
  }

  const handleOpenEditWinner = (w: PeriodWinner) => {
    setEditingWinner(w)
    setWinnerName(w.student_name)
    setWinnerNisn(w.nisn_username)
    setWinnerCampus(w.campus as StudentKampus)
    setWinnerJenjang(w.jenjang)
    setWinnerAward(w.award)
    setWinnerCategory(w.category)
    setWinnerScore(w.score !== undefined ? w.score : '')
    setWinnerFormError(null)
    setIsAddWinnerModalOpen(true)
  }

  const handleDeleteWinner = (id: string, name: string) => {
    if (window.confirm(`Hapus data pemenang '${name}'?`)) {
      participantPeriodService.deleteWinner(id)
      loadPeriodData()
    }
  }

  const handleSaveWinner = (e: React.FormEvent) => {
    e.preventDefault()
    if (!winnerName.trim()) {
      setWinnerFormError('Nama santri pemenang wajib diisi.')
      return
    }

    participantPeriodService.saveWinner({
      id: editingWinner ? editingWinner.id : undefined,
      period_id: period.id,
      student_name: winnerName.trim(),
      nisn_username: winnerNisn.trim() || winnerName.toLowerCase().replace(/\s+/g, ''),
      campus: winnerCampus,
      jenjang: winnerJenjang,
      award: winnerAward,
      category: winnerCategory,
      score: winnerScore !== '' ? Number(winnerScore) : undefined,
    })

    setIsAddWinnerModalOpen(false)
    loadPeriodData()
  }

  // Generate / Download certificate simulation
  const handleDownloadPdf = (cert: PeriodCertificate) => {
    const filename = `Sertifikat_${cert.certificate_type.toUpperCase()}_${cert.recipient_name.replace(/\s+/g, '_')}_${cert.certificate_number.replace(/\//g, '-')}.pdf`
    alert(`Mengunduh berkas resmi PDF:\n${filename}\n\nNomor: ${cert.certificate_number}\nKode Verifikasi: ${cert.verification_code}`)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/participant/periode" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Semua Periode</span>
        </Link>
        <span>/</span>
        <span className="font-bold text-slate-800">{period.name}</span>
      </div>

      <PageHeader
        title={`${period.name} — Detail Periode Kompetisi`}
        subtitle={`Pelaksanaan: ${period.description} (${new Date(period.start_date).getFullYear()})`}
        actions={
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddWinner}
                leftIcon={<Plus className="w-4 h-4 mr-1" />}
              >
                Tambah Data Juara
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Selection: 3 Sections */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('winners')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'winners'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>A. Data Juara ({winners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('winner_certs')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'winner_certs'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>B. Unduh Sertifikat Pemenang ({winnerCerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('participant_certs')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'participant_certs'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>C. Unduh Sertifikat Peserta ({participantCerts.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama santri penerima atau nomor sertifikat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!assignedCampus && (
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Kampus</option>
              {KAMPUS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          <select
            value={jenjangFilter}
            onChange={(e) => setJenjangFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">Semua Jenjang</option>
            <option value="Jenjang 1">Jenjang 1 (Kelas 1)</option>
            <option value="Jenjang 2">Jenjang 2 (Kelas 2)</option>
            <option value="Jenjang 3">Jenjang 3 (Kelas 1 Int & 3)</option>
            <option value="Jenjang 4">Jenjang 4 (Kelas 3 Int & 4)</option>
            <option value="Jenjang 5">Jenjang 5 (Kelas 5)</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION A: DATA JUARA                                    */}
      {/* ======================================================== */}
      {activeTab === 'winners' && (
        <SectionCard
          title={`Daftar Pemenang ${period.name} (${filteredWinners.length} Santri)`}
          subtitle="Daftar resmi santri yang berhasil meraih juara pada babak final Olimpiade Gontor."
        >
          {filteredWinners.length === 0 ? (
            <EmptyState
              title="Belum Ada Data Juara"
              description="Belum ada data santri pemenang untuk kriteria filter ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Santri</th>
                    <th className="py-3 px-3">Kampus</th>
                    <th className="py-3 px-3">Jenjang</th>
                    <th className="py-3 px-3">Penghargaan / Juara</th>
                    <th className="py-3 px-3">Bidang Lomba</th>
                    <th className="py-3 px-3">Nilai</th>
                    {isSuperAdmin && <th className="py-3 px-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWinners.map((w, idx) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{w.student_name}</td>
                      <td className="py-3 px-3 text-slate-600">{w.campus}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                          {w.jenjang}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-900">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/70 border border-amber-300">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          <span>{w.award}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{w.category}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">{w.score ?? '-'}</td>
                      {isSuperAdmin && (
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditWinner(w)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit Data Juara"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWinner(w.id, w.student_name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ======================================================== */}
      {/* SECTION B: UNDUH SERTIFIKAT PEMENANG                     */}
      {/* ======================================================== */}
      {activeTab === 'winner_certs' && (
        <div className="space-y-4">
          {filteredWinnerCerts.length === 0 ? (
            <EmptyState
              title="Belum Ada Sertifikat Pemenang"
              description="Belum ada sertifikat juara yang diterbitkan untuk periode ini."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWinnerCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-400 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Award className="w-3 h-3 text-amber-700" />
                        <span>Sertifikat Pemenang</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{cert.certificate_number}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cert.recipient_name}</h4>
                      <p className="text-xs text-amber-800 font-semibold mt-0.5">{cert.award_title}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <p>
                        Kampus: <strong>{cert.campus}</strong>
                      </p>
                      <p>
                        Jenjang: <strong>{cert.jenjang}</strong>
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">Verifikasi: {cert.verification_code}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCert(cert)}
                      leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
                    >
                      Pratinjau
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadPdf(cert)}
                      leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                      className="bg-amber-700 hover:bg-amber-800 text-white"
                    >
                      Unduh PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION C: UNDUH SERTIFIKAT PESERTA                     */}
      {/* ======================================================== */}
      {activeTab === 'participant_certs' && (
        <div className="space-y-4">
          {filteredParticipantCerts.length === 0 ? (
            <EmptyState
              title="Belum Ada Sertifikat Peserta"
              description="Belum ada sertifikat kepesertaan yang diterbitkan untuk periode ini."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParticipantCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-white border border-emerald-200/80 hover:border-emerald-400 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        <span>Sertifikat Kepesertaan</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{cert.certificate_number}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cert.recipient_name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{cert.award_title}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <p>
                        Kampus: <strong>{cert.campus}</strong>
                      </p>
                      <p>
                        Jenjang: <strong>{cert.jenjang}</strong>
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">Verifikasi: {cert.verification_code}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCert(cert)}
                      leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
                    >
                      Pratinjau
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadPdf(cert)}
                      leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                    >
                      Unduh PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW SERTIFIKAT */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pratinjau Sertifikat Resmi — {previewCert.certificate_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Template Graphic Card */}
            <div className="p-8 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30 text-center space-y-4">
              <div className="border-4 border-double border-amber-600/40 p-6 rounded-2xl bg-white shadow-sm space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-amber-800">
                    Pondok Modern Darussalam Gontor
                  </p>
                  <h2 className="text-xl font-serif font-bold text-slate-900 tracking-wide">
                    SERTIFIKAT PENGHARGAAN
                  </h2>
                  <p className="text-[11px] text-slate-500 font-serif">
                    Nomor: <span className="font-mono">{previewCert.certificate_number}</span>
                  </p>
                </div>

                <div className="py-2">
                  <p className="text-xs text-slate-500">Diberikan secara resmi kepada:</p>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight text-emerald-900 underline decoration-amber-400 underline-offset-4">
                    {previewCert.recipient_name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Kontingen: <strong>{previewCert.campus}</strong> ({previewCert.jenjang})
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 max-w-md mx-auto">
                  <p className="text-xs font-bold text-amber-950">{previewCert.award_title}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Pada perhelatan Olimpiade Gontor Sains & Matematika ({period.name})
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-left">
                    <QrCode className="w-8 h-8 text-slate-700" />
                    <div>
                      <p className="font-bold text-slate-800">QR Validasi</p>
                      <p className="font-mono text-[9px]">{previewCert.verification_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p>Ponorogo, {new Date(previewCert.issue_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    <p className="font-bold text-slate-800">Panitia Pusat OGSO</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Link
                to={`/verify/${previewCert.verification_code}`}
                target="_blank"
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
              >
                <span>Halaman Verifikasi Publik</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPdf(previewCert)}
                leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
              >
                Unduh PDF Resmi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT WINNER (Super Admin Only) */}
      {isAddWinnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingWinner ? 'Edit Data Juara' : 'Tambah Data Pemenang'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWinnerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWinner} className="p-5 space-y-3.5 text-xs">
              {winnerFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {winnerFormError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  value={winnerName}
                  onChange={(e) => setWinnerName(e.target.value)}
                  placeholder="Contoh: Nainawa Annabila"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kampus Kontingen</label>
                  <select
                    value={winnerCampus}
                    onChange={(e) => setWinnerCampus(e.target.value as StudentKampus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {KAMPUS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenjang</label>
                  <select
                    value={winnerJenjang}
                    onChange={(e) => setWinnerJenjang(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Jenjang 1">Jenjang 1 (Kelas 1)</option>
                    <option value="Jenjang 2">Jenjang 2 (Kelas 2)</option>
                    <option value="Jenjang 3">Jenjang 3 (Kelas 1 Int & Kelas 3)</option>
                    <option value="Jenjang 4">Jenjang 4 (Kelas 3 Int & Kelas 4)</option>
                    <option value="Jenjang 5">Jenjang 5 (Kelas 5)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Penghargaan / Juara</label>
                  <input
                    type="text"
                    required
                    value={winnerAward}
                    onChange={(e) => setWinnerAward(e.target.value)}
                    placeholder="Juara 1 / Medali Emas"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nilai Akhir (Opsional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={winnerScore}
                    onChange={(e) => setWinnerScore(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="98.5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bidang Lomba / Kategori</label>
                <input
                  type="text"
                  required
                  value={winnerCategory}
                  onChange={(e) => setWinnerCategory(e.target.value)}
                  placeholder="Matematika Terpadu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddWinnerModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingWinner ? 'Simpan Perubahan' : 'Tambah Pemenang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
