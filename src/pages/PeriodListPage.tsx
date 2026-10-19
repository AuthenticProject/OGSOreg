import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trophy,
  Award,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Archive,
  Edit2,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import {
  participantPeriodService,
  type CompetitionPeriod,
} from '../services/participantPeriodService'

export const PeriodListPage: React.FC = () => {
  const navigate = useNavigate()
  const { isSuperAdmin } = useAuth()

  const [periods, setPeriods] = useState<CompetitionPeriod[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<CompetitionPeriod | null>(null)

  // Form State
  const [formName, setFormName] = useState('')
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear())
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'completed' | 'archived'>('active')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const loadPeriods = () => {
    const list = participantPeriodService.getPeriods()
    setPeriods(list)
  }

  useEffect(() => {
    loadPeriods()
  }, [])

  const handleOpenAdd = () => {
    setEditingPeriod(null)
    setFormName(`OGSO ${new Date().getFullYear() + 1}`)
    setFormYear(new Date().getFullYear() + 1)
    setFormDescription(`Olimpiade Gontor Sains & Matematika ${new Date().getFullYear() + 1}`)
    setFormStatus('active')
    setFormStartDate(`${new Date().getFullYear() + 1}-01-15`)
    setFormEndDate(`${new Date().getFullYear() + 1}-10-30`)
    setFormError(null)
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (p: CompetitionPeriod, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingPeriod(p)
    setFormName(p.name)
    setFormYear(p.year)
    setFormDescription(p.description)
    setFormStatus(p.status)
    setFormStartDate(p.start_date)
    setFormEndDate(p.end_date)
    setFormError(null)
    setIsAddModalOpen(true)
  }

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Yakin ingin menghapus periode '${name}'?`)) {
      participantPeriodService.deletePeriod(id)
      loadPeriods()
    }
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Nama periode wajib diisi.')
      return
    }

    participantPeriodService.savePeriod({
      id: editingPeriod ? editingPeriod.id : undefined,
      name: formName.trim(),
      year: Number(formYear),
      description: formDescription.trim(),
      status: formStatus,
      start_date: formStartDate,
      end_date: formEndDate,
      is_published: true,
    })

    setIsAddModalOpen(false)
    loadPeriods()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participant — Periode Kompetisi"
        subtitle="Pilih periode pelaksanaan Olimpiade Gontor Sains & Matematika untuk melihat Data Juara, Unduh Sertifikat Pemenang, dan Sertifikat Peserta."
        actions={
          isSuperAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
            >
              Tambah Periode Baru
            </Button>
          )
        }
      />

      {/* Grid of Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {periods.map((p) => {
          const isActive = p.status === 'active'
          const isCompleted = p.status === 'completed'

          const winnersCount = participantPeriodService.getWinners(p.id).length
          const certsCount = participantPeriodService.getCertificates(p.id).length

          return (
            <div
              key={p.id}
              onClick={() => navigate(`/participant/periode/${p.id}`)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-subtle hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : isCompleted
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCompleted ? (
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{isActive ? 'Periode Aktif' : isCompleted ? 'Selesai' : 'Arsip'}</span>
                  </span>

                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                    Tahun {p.year}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>{p.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {p.year <= 2025 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Format: Tanpa Jenjang (5 Lomba)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Format: 5 Jenjang (Kelas 1 - 5)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
                    <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Data Juara</span>
                    </p>
                    <p className="text-base font-bold text-amber-950 mt-0.5">
                      {winnersCount} <span className="text-[10px] font-normal">Santri</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                    <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sertifikat</span>
                    </p>
                    <p className="text-base font-bold text-emerald-950 mt-0.5">
                      {certsCount} <span className="text-[10px] font-normal">Berkas</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(p, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit Periode"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(p.id, p.name, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Periode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Buka Detail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ADD / EDIT MODAL (Super Admin Only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPeriod ? 'Edit Periode Kompetisi' : 'Tambah Periode Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Nama Periode</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: OGSO 2027"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tahun</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Deskripsi Periode</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Keterangan pelaksanaan kompetisi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="archived">Arsip</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingPeriod ? 'Simpan Perubahan' : 'Buat Periode'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
