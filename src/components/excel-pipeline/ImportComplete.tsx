import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  Database,
  Lock,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'
import { CompetitionSelector } from './CompetitionSelector'
import { CommitProgressModal } from './CommitProgressModal'
import { useImportStore } from '../../stores/importStore'
import { useAuth } from '../../context/AuthContext'
import {
  executeCommitImport,
  type CommitProgress,
  type CommitImportResult,
} from '../../services/supabase/commitPipeline'
import type { Competition } from '../../types/database'

export const ImportComplete: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, institution } = useAuth()
  const {
    stats,
    workbookData,
    stagedRows,
    selectedCompetition,
    setSelectedCompetition,
    setCurrentStep,
    resetImport,
  } = useImportStore()

  // Commit Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [progress, setProgress] = useState<CommitProgress | null>(null)
  const [result, setResult] = useState<CommitImportResult | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  const hasErrors = stats.error > 0 || stats.duplicate > 0
  const hasWarningsOnly = !hasErrors && stats.warning > 0
  const canCommit = !hasErrors && !!selectedCompetition && stagedRows.length > 0

  const handleStartCommit = async () => {
    if (!canCommit || !selectedCompetition) return

    setModalOpen(true)
    setProgress(null)
    setResult(null)
    setCommitError(null)

    const institutionId =
      institution?.id || profile?.institution_id || 'a0000000-0000-0000-0000-000000000001'
    const userId = user?.id || profile?.id || '00000000-0000-0000-0000-000000000001'

    try {
      const res = await executeCommitImport({
        competitionId: selectedCompetition.id,
        institutionId,
        userId,
        batchName: `Kontingen ${institution?.name || 'Sekolah'} - ${selectedCompetition.name}`,
        sourceFilename: workbookData?.fileName,
        stagedRows,
        chunkSize: 100,
        onProgress: setProgress,
      })

      setResult(res)
    } catch (err: unknown) {
      setCommitError(err instanceof Error ? err.message : 'Gagal menyimpan ke database')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionCard
        title="Langkah 5: Verifikasi Akhir & Komit ke Database"
        subtitle="Pilih kompetisi sasaran, periksa gerbang keamanan data, dan commit pendaftaran massal ke Supabase."
      >
        {/* Banner State */}
        {hasErrors ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  Gerbang Keamanan Aktif: Data Belum Dapat Disimpan
                </h3>
                <p className="text-xs text-rose-800">
                  Terdapat {stats.error + stats.duplicate} baris data dengan kesalahan format atau duplikasi NISN.
                  Data invalid <strong>tidak diperbolehkan masuk ke database</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCurrentStep(4)}
                leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
              >
                Kembali ke Review & Perbaiki Data Grid
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>Integritas Data Terverifikasi</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                    Siap Dikomit
                  </span>
                </h3>
                <p className="text-xs text-emerald-800">
                  Seluruh {stats.valid + stats.warning} baris peserta telah tervalidasi dan siap untuk disinkronkan ke basis data Supabase.
                </p>
              </div>
            </div>

            {hasWarningsOnly && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Catatan:</strong> Terdapat {stats.warning} baris memiliki peringatan kolom sekunder. Anda tetap dapat melanjutkan komit.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Competition Selection Section */}
        <div className="pt-4 border-t border-border">
          <CompetitionSelector
            selectedCompetitionId={selectedCompetition?.id || null}
            onSelectCompetition={(comp: Competition) => setSelectedCompetition(comp)}
          />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Data</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground">Baris peserta</p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
            <p className="text-xs text-emerald-700 uppercase font-semibold">Valid</p>
            <p className="text-2xl font-black text-emerald-700">{stats.valid}</p>
            <p className="text-[11px] text-emerald-600">Sesuai Zod</p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
            <p className="text-xs text-amber-700 uppercase font-semibold">Peringatan</p>
            <p className="text-2xl font-black text-amber-700">{stats.warning}</p>
            <p className="text-[11px] text-amber-600">Kolom sekunder</p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
            <p className="text-xs text-rose-700 uppercase font-semibold">Error / Duplikat</p>
            <p className="text-2xl font-black text-rose-700">{stats.error + stats.duplicate}</p>
            <p className="text-[11px] text-rose-600">Wajib 0</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border mt-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(4)}
              leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
            >
              Kembali ke Data Grid
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetImport}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
            >
              Reset Impor
            </Button>
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={!canCommit}
            onClick={handleStartCommit}
            leftIcon={
              canCommit ? (
                <Database className="w-4 h-4 mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2 text-slate-300" />
              )
            }
          >
            {hasErrors
              ? 'Perbaiki Error Sebelum Komit'
              : !selectedCompetition
              ? 'Pilih Kompetisi Terlebih Dahulu'
              : `Finalisasi & Simpan ke Database (${stagedRows.length} Peserta)`}
          </Button>
        </div>
      </SectionCard>

      {/* Progress & Result Modal */}
      <CommitProgressModal
        isOpen={modalOpen}
        progress={progress}
        result={result}
        error={commitError}
        onRetry={handleStartCommit}
        onClose={() => setModalOpen(false)}
        onNavigateToBatches={() => {
          setModalOpen(false)
          resetImport()
          navigate('/batches')
        }}
        onNavigateToParticipants={() => {
          setModalOpen(false)
          resetImport()
          navigate('/students')
        }}
      />
    </div>
  )
}
