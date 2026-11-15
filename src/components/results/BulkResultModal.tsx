import React, { useState } from 'react'
import { X, CheckSquare, Award, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  competitionResultService,
  inferChampionRank,
  type UpsertResultInput,
} from '../../services/competitionResultService'
import { STANDARD_AWARD_CATEGORIES, type ResultStatus, type StudentWithResult } from '../../types/competitionResult'

interface BulkResultModalProps {
  isOpen: boolean
  onClose: () => void
  selectedStudents: StudentWithResult[]
  periodId: string
  periodName: string
  adminUsername: string
  onSaved: () => void
}

export const BulkResultModal: React.FC<BulkResultModalProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  periodId,
  periodName,
  adminUsername,
  onSaved,
}) => {
  if (!isOpen || selectedStudents.length === 0) return null

  const [status, setStatus] = useState<ResultStatus>('finalis')
  const [awardCategory, setAwardCategory] = useState<string>('Juara 1')
  const [customAward, setCustomAward] = useState<string>('')
  const [championRank, setChampionRank] = useState<number | ''>(1)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAwardCategoryChange = (cat: string) => {
    setAwardCategory(cat)
    if (cat !== 'custom') {
      const rank = inferChampionRank(cat)
      if (rank !== null) {
        setChampionRank(rank)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const finalAward = status === 'juara' ? (awardCategory === 'custom' ? customAward.trim() : awardCategory) : null
      const finalRank = status === 'juara' ? (championRank !== '' ? Number(championRank) : inferChampionRank(finalAward)) : null

      const inputs: UpsertResultInput[] = selectedStudents.map((s) => ({
        id: s.result?.id,
        student_id: s.student.id,
        period_id: periodId,
        result_status: status,
        is_finalist: status === 'juara' || status === 'finalis',
        is_champion: status === 'juara',
        champion_rank: finalRank,
        award_category: finalAward,
        result_notes: notes.trim() || s.result_notes || null,
        updated_by: adminUsername,
      }))

      await competitionResultService.bulkUpsertResults(inputs)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Gagal melakukan pembaruan massal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-green-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Pembaruan Hasil Massal</h3>
              <p className="text-xs text-emerald-100 font-medium">
                {selectedStudents.length} santri terpilih • Periode {periodName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected students pill list preview */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase">Santri yang Dipilih:</p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedStudents.map((s) => (
              <span
                key={s.student.id}
                className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-xs text-gray-700 font-medium"
              >
                {s.student.full_name} ({s.student.kampus || 'Kampus -'})
              </span>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Choice */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Pilih Tindakan Massal
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('finalis')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  status === 'finalis'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-400/30'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Lolos Final</span>
                <span className="text-[10px] text-blue-500 font-normal">Tandai Finalis</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('juara')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  status === 'juara'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-400/30'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Tetapkan Juara</span>
                <span className="text-[10px] text-amber-600 font-normal">Beri Predikat</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('peserta')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  status === 'peserta'
                    ? 'border-gray-500 bg-gray-50 text-gray-900 shadow-sm ring-2 ring-gray-400/30'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Reset Peserta</span>
                <span className="text-[10px] text-gray-400 font-normal">Hapus Status</span>
              </button>
            </div>
          </div>

          {/* If Juara */}
          {status === 'juara' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Kategori Juara untuk Semua yang Dipilih</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Kategori Penghargaan
                  </label>
                  <select
                    value={awardCategory}
                    onChange={(e) => handleAwardCategoryChange(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 py-2 px-2.5 bg-white text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {STANDARD_AWARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom">Kategori Kustom...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Peringkat Numerik
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={championRank}
                    onChange={(e) => setChampionRank(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 py-2 px-2.5 bg-white text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {awardCategory === 'custom' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Nama Kategori Kustom
                  </label>
                  <input
                    type="text"
                    value={customAward}
                    onChange={(e) => setCustomAward(e.target.value)}
                    placeholder="Contoh: Juara Harapan 3..."
                    className="w-full text-xs rounded-lg border border-gray-300 py-2 px-2.5 bg-white text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan yang akan disematkan ke semua santri terpilih..."
              className="w-full text-xs rounded-lg border border-gray-300 py-2 px-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Memperbarui...' : `Terapkan ke ${selectedStudents.length} Santri`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
