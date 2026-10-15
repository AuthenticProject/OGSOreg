import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  Calendar,
  Users,
  GraduationCap,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { TableLoadingSkeleton } from '../components/feedback/LoadingSkeleton'
import { batchRepository } from '../services/supabase/batchRepository'
import { useAuth } from '../context/AuthContext'
import type { RegistrationBatchEntity } from '../types/database'

export const BatchesPage: React.FC = () => {
  const navigate = useNavigate()
  const { institution } = useAuth()
  const [batches, setBatches] = useState<RegistrationBatchEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    batchRepository
      .getBatches(institution?.id)
      .then((data) => {
        setBatches(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat riwayat batch')
        setLoading(false)
      })
  }, [institution?.id])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Batch Pendaftaran"
        subtitle="Daftar transaksi impor berkas pendaftaran kontingen yang tersimpan di basis data."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/imports')}
            leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
          >
            Import Batch Baru
          </Button>
        }
      />

      {loading ? (
        <div className="bg-white p-6 rounded-xl border border-border">
          <TableLoadingSkeleton rows={4} columns={6} />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      ) : batches.length === 0 ? (
        <EmptyState
          title="Belum Ada Batch Pendaftaran"
          description="Anda belum mengunggah dan mengomit berkas pendaftaran kontingen ke basis data."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/imports')}
              leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1.5" />}
            >
              Mulai Import Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {batches.map((b) => {
            const isCompleted = b.status === 'completed'
            const isFailed = b.status === 'failed'

            return (
              <SectionCard key={b.id} className="hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-foreground">
                        {b.batch_name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isFailed
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isFailed ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{b.status.toUpperCase()}</span>
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Berkas: <span className="font-mono text-slate-800">{b.source_filename || 'Unggahan Manual'}</span> •
                      Batch ID: <span className="font-mono text-slate-500">{b.id}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-600 pt-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{b.participant_count}</strong> Peserta
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{b.teacher_count}</strong> Guru
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(b.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/students')}
                      leftIcon={<Eye className="w-3.5 h-3.5 mr-1.5" />}
                    >
                      Buka Siswa Saya
                    </Button>
                  </div>
                </div>
              </SectionCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
