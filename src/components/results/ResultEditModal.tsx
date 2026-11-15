import React, { useState, useEffect } from 'react'
import { X, Trophy, Award, CheckCircle, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  competitionResultService,
  inferChampionRank,
} from '../../services/competitionResultService'
import { STANDARD_AWARD_CATEGORIES, type ResultStatus, type StudentWithResult } from '../../types/competitionResult'

interface ResultEditModalProps {
  isOpen: boolean
  onClose: () => void
  studentWithResult: StudentWithResult | null
  periodId: string
  periodName: string
  adminUsername: string
  onSaved: () => void
}

export const ResultEditModal: React.FC<ResultEditModalProps> = ({
  isOpen,
  onClose,
  studentWithResult,
  periodId,
  periodName,
  adminUsername,
  onSaved,
}) => {
  if (!isOpen || !studentWithResult) return null

  const { student, result } = studentWithResult

  const [status, setStatus] = useState<ResultStatus>(result?.result_status || 'peserta')
  const [awardCategory, setAwardCategory] = useState<string>(result?.award_category || 'Juara 1')
  const [customAward, setCustomAward] = useState<string>('')
  const [championRank, setChampionRank] = useState<number | ''>(
    result?.champion_rank !== undefined && result?.champion_rank !== null ? result.champion_rank : 1
  )
  const [notes, setNotes] = useState<string>(result?.result_notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (result) {
      setStatus(result.result_status)
      if (result.award_category) {
        if ((STANDARD_AWARD_CATEGORIES as readonly string[]).includes(result.award_category)) {
          setAwardCategory(result.award_category)
          setCustomAward('')
        } else {
          setAwardCategory('custom')
          setCustomAward(result.award_category)
        }
      } else {
        setAwardCategory('Juara 1')
        setCustomAward('')
      }
      setChampionRank(result.champion_rank ?? 1)
      setNotes(result.result_notes || '')
    } else {
      setStatus('peserta')
      setAwardCategory('Juara 1')
      setCustomAward('')
      setChampionRank(1)
      setNotes('')
    }
    setError(null)
  }, [result, studentWithResult])

  const handleStatusChange = (newStatus: ResultStatus) => {
    setStatus(newStatus)
    if (newStatus === 'juara') {
      if (!awardCategory || awardCategory === 'custom') {
        setAwardCategory('Juara 1')
      }
      setChampionRank(1)
    }
  }

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

      await competitionResultService.upsertResult({
        id: result?.id,
        student_id: student.id,
        period_id: periodId,
        result_status: status,
        is_finalist: status === 'juara' || status === 'finalis',
        is_champion: status === 'juara',
        champion_rank: finalRank,
        award_category: finalAward,
        result_notes: notes.trim() || null,
        updated_by: adminUsername,
      })

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan hasil lomba')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetResult = async () => {
    if (!result) {
      onClose()
      return
    }
    if (!confirm(`Hapus status hasil untuk santri ${student.full_name}? Status akan kembali menjadi 'Peserta'.`)) {
      return
    }

    setIsSubmitting(true)
    try {
      await competitionResultService.deleteResult(result.id)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Gagal mereset hasil')
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
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Kelola Hasil Lomba</h3>
              <p className="text-xs text-emerald-100 font-medium">Periode: {periodName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student summary banner */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div>
            <span className="font-bold text-gray-800 text-sm block">{student.full_name}</span>
            <span>{student.username} • {student.kampus || 'Kampus tidak diset'} • {student.jenjang}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 text-xs">
            {student.kelas || student.jenjang}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Status Kualifikasi / Hasil
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('peserta')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  status === 'peserta'
                    ? 'border-gray-500 bg-gray-50 text-gray-900 shadow-sm ring-2 ring-gray-400/30'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Peserta</span>
                <span className="text-[10px] text-gray-400 font-normal">Belum Lolos</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('finalis')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  status === 'finalis'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-400/30'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Lolos Final</span>
                <span className="text-[10px] text-blue-500 font-normal">Finalis Babak Akhir</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('juara')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  status === 'juara'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-400/30'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Juara (Award)</span>
                <span className="text-[10px] text-amber-600 font-normal">Pemenang Lomba</span>
              </button>
            </div>
          </div>

          {/* Champion fields (if Juara) */}
          {status === 'juara' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Klasifikasi & Peringkat Juara</span>
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
                    Peringkat Numerik (Urutan)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={championRank}
                    onChange={(e) => setChampionRank(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 py-2 px-2.5 bg-white text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="1, 2, 3..."
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
                    placeholder="Contoh: Best Theory, Harapan 3..."
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
              Catatan Hasil (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan dari dewan juri, keterangan nilai, atau info tambahan..."
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {result ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetResult}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Hasil
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
