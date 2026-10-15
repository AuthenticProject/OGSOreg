import React from 'react'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { Button } from '../ui/Button'
import type { CommitProgress, CommitImportResult } from '../../services/supabase/commitPipeline'

interface CommitProgressModalProps {
  isOpen: boolean
  progress: CommitProgress | null
  result: CommitImportResult | null
  error: string | null
  onRetry: () => void
  onClose: () => void
  onNavigateToBatches: () => void
  onNavigateToParticipants: () => void
}

export const CommitProgressModal: React.FC<CommitProgressModalProps> = ({
  isOpen,
  progress,
  result,
  error,
  onRetry,
  onClose,
  onNavigateToBatches,
  onNavigateToParticipants,
}) => {
  if (!isOpen) return null

  const isCompleted = result && result.success
  const isFailed = !!error
  const isProcessing = !isCompleted && !isFailed

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-border space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Icon & Status */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : isFailed
                ? 'bg-rose-100 text-rose-700'
                : 'bg-brand-maroon/10 text-brand-maroon'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isFailed ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Database className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {isCompleted
                ? 'Pendaftaran Berhasil Dikomit!'
                : isFailed
                ? 'Komit ke Database Gagal'
                : 'Sinkronisasi ke Database Supabase'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCompleted
                ? 'Seluruh data staging telah tersimpan secara persisten.'
                : isFailed
                ? 'Terjadi kendala saat memproses entitas batch.'
                : 'Mohon tidak menutup jendela peramban selama proses berlangsung.'}
            </p>
          </div>
        </div>

        {/* Processing State with Animated Progress Bar */}
        {isProcessing && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-maroon" />
                {progress?.operation || 'Menghubungkan ke basis data...'}
              </span>
              <span className="font-mono font-bold text-brand-maroon">
                {progress?.percent || 0}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-brand-maroon transition-all duration-300 ease-out"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>Fase: {progress?.phase || 'Inisialisasi'}</span>
              <span>
                {progress?.current || 0} dari {progress?.total || 0} baris diproses
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {isFailed && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Penyebab Kegagalan:
            </p>
            <p className="leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-rose-200">
              {error}
            </p>
            <p className="text-[11px] text-rose-700">
              Integritas data lokal Anda di staging tetap aman dan belum terhapus.
            </p>
          </div>
        )}

        {/* Success State Details */}
        {isCompleted && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <p className="font-bold">Ringkasan Data Tersimpan:</p>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Total Peserta</p>
                <p className="text-lg font-black text-emerald-800">{result.totalParticipants}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Guru Pembimbing</p>
                <p className="text-lg font-black text-emerald-800">{result.totalTeachers}</p>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 pt-1">
              Batch ID: <span className="font-mono text-emerald-900 font-semibold">{result.batchId}</span>
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-border">
          {isFailed && (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Tutup & Periksa Staging
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onRetry}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
              >
                Coba Lagi
              </Button>
            </>
          )}

          {isCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToBatches}
              >
                Lihat Riwayat Batch
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToParticipants}
                rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}
              >
                Buka Direktori Peserta
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
