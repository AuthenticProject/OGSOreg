import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox,
  Users,
  CheckCircle2,
  Eye,
  Search,
  Download,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { TableLoadingSkeleton } from '../components/feedback/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { batchRepository } from '../services/supabase/batchRepository'
import { KAMPUS_OPTIONS } from '../types/campus'
import type { RegistrationBatchEntity } from '../types/database'

export const IncomingRegistrationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isSuperAdmin } = useAuth()

  const [batches, setBatches] = useState<RegistrationBatchEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const batchData = await batchRepository.getBatches()
      setBatches(batchData)
    } catch (err) {
      console.warn('Error loading incoming registrations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Restrict to Super Admin only
  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-lg mx-auto mt-12 space-y-3">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Akses Terbatas</h3>
        <p className="text-sm text-slate-500">
          Halaman Pendaftaran Masuk seluruh kampus hanya dapat diakses oleh Super Admin.
        </p>
        <Button variant="primary" onClick={() => navigate('/dashboard')} className="mt-2 bg-emerald-700 text-white">
          Kembali ke Dasbor
        </Button>
      </div>
    )
  }

  // Filter batches
  const filteredBatches = batches.filter((b) => {
    if (campusFilter !== 'all' && !b.batch_name.toLowerCase().includes(campusFilter.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && b.status !== statusFilter) {
      return false
    }
    if (search) {
      const q = search.toLowerCase()
      const matchName = b.batch_name.toLowerCase().includes(q)
      const matchFile = b.source_filename?.toLowerCase().includes(q)
      if (!matchName && !matchFile) return false
    }
    return true
  })

  // Summary counts
  const totalSubmissions = batches.length
  const totalParticipantsInBatches = batches.reduce((acc, b) => acc + (b.participant_count || 0), 0)
  const totalApproved = batches.filter((b) => b.status === 'completed').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendaftaran Masuk (Incoming Registrations)"
        subtitle="Verifikasi dan rekapitulasi pengajuan pendaftaran santri kolektif dari seluruh 20 Kampus Pondok Modern Gontor."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />}
            >
              Segarkan Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/students')}
              leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
            >
              Buka Siswa Saya
            </Button>
          </div>
        }
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-border shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Berkas Masuk</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{totalSubmissions}</p>
            <p className="text-[11px] text-slate-500 mt-1">Transaksi pengajuan kolektif</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-border shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Santri Teregistrasi</p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{totalParticipantsInBatches}</p>
            <p className="text-[11px] text-slate-500 mt-1">Dari berkas pendaftaran valid</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-border shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Status Pendaftaran</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalApproved} <span className="text-sm font-normal text-slate-500">Tersimpan</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Siap untuk ekspor ke Moodle LMS</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-border shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama berkas, kampus, atau batch ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-slate-700"
          >
            <option value="all">Semua Kampus</option>
            {KAMPUS_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Tersimpan (Completed)</option>
            <option value="processing">Sedang Diproses</option>
            <option value="failed">Gagal</option>
          </select>
        </div>
      </div>

      {/* Batches Table List */}
      {loading ? (
        <div className="bg-white p-6 rounded-xl border border-border shadow-subtle">
          <TableLoadingSkeleton rows={4} columns={5} />
        </div>
      ) : filteredBatches.length === 0 ? (
        <EmptyState
          title="Tidak Ada Pendaftaran Masuk"
          description="Belum ada berkas pendaftaran masuk yang sesuai dengan kriteria filter Anda."
        />
      ) : (
        <div className="space-y-3">
          {filteredBatches.map((batch) => {
            const isCompleted = batch.status === 'completed'
            return (
              <SectionCard key={batch.id} className="hover:border-slate-300 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{batch.batch_name}</span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isCompleted ? 'Resmi Tersimpan' : batch.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                        {batch.source_filename || 'Input Langsung'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{batch.participant_count}</strong> Santri Terdaftar
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(batch.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/students')}
                      leftIcon={<Eye className="w-3.5 h-3.5 mr-1 text-emerald-700" />}
                    >
                      Lihat Santri
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/custom-fields?tab=moodle')}
                      leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                    >
                      Petakan Moodle
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
