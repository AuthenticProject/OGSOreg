import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/feedback/EmptyState'
import { TableLoadingSkeleton } from '../components/feedback/LoadingSkeleton'
import { ErrorState } from '../components/feedback/ErrorState'
import { participantRepository } from '../services/supabase/participantRepository'
import { useAuth } from '../context/AuthContext'
import type { ParticipantEntity } from '../types/database'

export const ParticipantsPage: React.FC = () => {
  const navigate = useNavigate()
  const { institution } = useAuth()

  const [participants, setParticipants] = useState<ParticipantEntity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchParticipants = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await participantRepository.getParticipants({
        institutionId: institution?.id,
        search: searchTerm,
        category: categoryFilter,
        page: currentPage,
        pageSize,
      })
      setParticipants(res.data)
      setTotalCount(res.total)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat direktori peserta')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [currentPage, categoryFilter, institution?.id])

  // Handle Search submit / debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1)
      fetchParticipants()
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const toggleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(participants.map((p) => p.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Direktori Peserta"
        subtitle="Data peserta terdaftar yang tersimpan secara terstruktur di basis data."
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-maroon/10 text-brand-maroon border border-brand-maroon/20">
            {totalCount} Peserta Terdaftar
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/exports')}
              leftIcon={<Download className="w-4 h-4 mr-1.5" />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/imports')}
              leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1.5" />}
            >
              Import Excel
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-border shadow-subtle">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChangeValue={setSearchTerm}
            placeholder="Cari nama, NISN, atau kelas..."
            className="w-full sm:w-72"
          />

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs sm:text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-maroon"
            >
              <option value="all">Semua Kategori</option>
              <option value="Olimpiade Matematika">Olimpiade Matematika</option>
              <option value="Olimpiade IPA Terpadu">Olimpiade IPA Terpadu</option>
              <option value="Olimpiade Fisika">Olimpiade Fisika</option>
              <option value="Olimpiade Biologi">Olimpiade Biologi</option>
              <option value="Olimpiade Kimia">Olimpiade Kimia</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium bg-brand-maroon/5 px-3 py-1.5 rounded-lg border border-brand-maroon/20 text-brand-maroon">
            <span>{selectedIds.length} dipilih</span>
            <button
              onClick={() => setSelectedIds([])}
              className="underline text-slate-500 hover:text-slate-800"
            >
              Batalkan
            </button>
          </div>
        )}
      </div>

      {/* Content Container */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-border p-4">
          <TableLoadingSkeleton rows={5} columns={8} />
        </div>
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchParticipants} />
      ) : participants.length === 0 ? (
        <EmptyState
          title="Tidak Ada Peserta Ditemukan"
          description="Belum ada data peserta yang tersimpan atau sesuai dengan filter pencarian."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setCurrentPage(1)
              }}
            >
              Reset Filter
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-border text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        participants.length > 0 &&
                        selectedIds.length === participants.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-brand-maroon focus:ring-brand-maroon cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-12 text-center">No</th>
                  <th className="p-3.5">Nama Peserta</th>
                  <th className="p-3.5">NISN</th>
                  <th className="p-3.5">L/P</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Kategori Lomba</th>
                  <th className="p-3.5">Tanggal Daftar</th>
                  <th className="p-3.5 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participants.map((pt, idx) => {
                  const isSelected = selectedIds.includes(pt.id)
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1

                  return (
                    <tr
                      key={pt.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-brand-maroon/[0.03]' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(pt.id)}
                          className="rounded border-slate-300 text-brand-maroon focus:ring-brand-maroon cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 text-center text-muted-foreground font-mono">
                        {itemIndex}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">
                          {pt.full_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          ID: {pt.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {pt.nisn}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {pt.gender || '-'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {pt.class_name || '-'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-brand-maroon">
                          {pt.category || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(pt.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <button
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Detail Peserta"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Server Pagination Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-t border-border bg-slate-50/50 gap-3 text-xs text-muted-foreground">
            <div>
              Menampilkan <strong>{participants.length}</strong> dari <strong>{totalCount}</strong> total peserta
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-border bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800 bg-white border border-border rounded">
                Halaman {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-border bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
