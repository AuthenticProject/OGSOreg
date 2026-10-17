import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  GraduationCap,
  ArrowUpDown,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Database,
  Building,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/feedback/EmptyState'
import { TableLoadingSkeleton } from '../components/feedback/LoadingSkeleton'
import { ErrorState } from '../components/feedback/ErrorState'
import { studentRepository } from '../services/studentRepository'
import { exportStudentsToExcel } from '../services/excelGenerator'
import { MoodleExportModal } from '../components/moodle/MoodleExportModal'
import { studentSchema, newStudentSchema } from '../schemas/student.schema'
import { KAMPUS_OPTIONS } from '../types/campus'
import { useAuth } from '../context/AuthContext'
import type {
  Student,
  StudentJenjang,
  StudentSource,
  StudentSyncStatus,
  StudentStats,
} from '../types/student'
import { MOODLE_JENJANG_OPTIONS } from '../types/excel'

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate()
  const { institution, user, isSuperAdmin, assignedCampus } = useAuth()
  const institutionId = institution?.id || 'a0000000-0000-0000-0000-000000000001'

  // State
  const [students, setStudents] = useState<Student[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    localOnly: 0,
    exported: 0,
    synced: 0,
    enrolled: 0,
    failed: 0,
    unsynced: 0,
    byJenjang: { 'Kelas 1': 0, 'Kelas 2': 0, 'Kelas 3': 0, 'Kelas 4': 0, 'Kelas 5': 0 },
    bySyncStatus: { local_only: 0, exported: 0, synced: 0, enrolled: 0, failed: 0 },
    bySource: { excel: 0, csv: 0, manual: 0, paste: 0 },
    verifiedMoodleCount: 0,
    unSyncedCount: 0,
  })

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [jenjangFilter, setJenjangFilter] = useState<StudentJenjang | 'all'>('all')
  const [kampusFilter, setKampusFilter] = useState<string>('all')
  const [syncStatusFilter, setSyncStatusFilter] = useState<StudentSyncStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<StudentSource | 'all'>('all')
  const [sortBy] = useState<'name' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Async States
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // Modals
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isMoodleExportModalOpen, setIsMoodleExportModalOpen] = useState(false)
  const [moodleExportStudents, setMoodleExportStudents] = useState<Student[]>([])
  const [moodleExportTitle, setMoodleExportTitle] = useState('Ekspor Pengguna Moodle (Bulk User Upload)')

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    jenjang: 'Kelas 1' as StudentJenjang,
    kampus: 'Gontor 1',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Directory Data
  const loadStudents = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const effectiveKampus = !isSuperAdmin && assignedCampus ? assignedCampus : kampusFilter
      const res = await studentRepository.getStudents({
        institutionId,
        search,
        jenjang: jenjangFilter,
        kampus: effectiveKampus,
        assignedCampus: !isSuperAdmin ? assignedCampus : undefined,
        sync_status: syncStatusFilter,
        source: sourceFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      })
      setStudents(res.data)
      setTotalCount(res.total)

      const s = await studentRepository.getStats(
        institutionId,
        !isSuperAdmin ? assignedCampus : undefined
      )
      setStats(s)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat data santri.')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset page and selection when account/campus switches
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
  }, [assignedCampus])

  useEffect(() => {
    loadStudents()
  }, [
    assignedCampus,
    isSuperAdmin,
    institutionId,
    jenjangFilter,
    kampusFilter,
    syncStatusFilter,
    sourceFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  ])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      loadStudents()
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Clear selections if students change
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => students.some((s) => s.id === id)))
  }, [students])

  // Select All on Page
  const isAllOnPageSelected =
    students.length > 0 && students.every((s) => selectedIds.includes(s.id))

  const toggleSelectAll = () => {
    if (isAllOnPageSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(students.map((s) => s.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      username: '',
      firstname: '',
      lastname: '',
      email: '',
      jenjang: 'Kelas 1',
      kampus: !isSuperAdmin && assignedCampus ? assignedCampus : 'Gontor 1',
    })
    setFormErrors({})
    setIsAddModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      username: student.username,
      firstname: student.firstname,
      lastname: student.lastname || '',
      email: student.email,
      jenjang: student.jenjang,
      kampus: student.kampus || (!isSuperAdmin && assignedCampus ? assignedCampus : ''),
    })
    setFormErrors({})
  }

  // Submit Add Student
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const targetKampus = !isSuperAdmin && assignedCampus ? assignedCampus : formData.kampus

    const validation = newStudentSchema.safeParse({
      ...formData,
      kampus: targetKampus,
      institution_id: institutionId,
      created_by: user?.id || 'system',
      source: 'manual',
      sync_status: 'local_only',
    })

    if (!validation.success) {
      const errMap: Record<string, string> = {}
      validation.error.issues.forEach((err) => {
        const field = err.path[0]?.toString() || 'global'
        errMap[field] = err.message
      })
      setFormErrors(errMap)
      return
    }

    setIsSubmitting(true)
    const res = await studentRepository.saveStudent(
      {
        ...formData,
        kampus: targetKampus,
        institution_id: institutionId,
        created_by: user?.id || 'system',
        source: 'manual',
        sync_status: 'local_only',
      },
      institutionId,
      user?.id,
      { userRole: isSuperAdmin ? 'super_admin' : 'campus_admin', assignedCampus }
    )
    setIsSubmitting(false)

    if (!res.success) {
      setFormErrors({ global: res.error || 'Gagal menyimpan santri.' })
      return
    }

    setIsAddModalOpen(false)
    setActionFeedback(`Santri '${res.student?.full_name}' berhasil ditambahkan ke Siswa Saya.`)
    setTimeout(() => setActionFeedback(null), 4000)
    loadStudents()
  }

  // Submit Edit Student
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    setFormErrors({})

    const targetKampus = !isSuperAdmin && assignedCampus ? assignedCampus : formData.kampus

    const validation = studentSchema.safeParse({
      ...formData,
      kampus: targetKampus,
      institution_id: institutionId,
      source: editingStudent.source,
      sync_status: editingStudent.sync_status,
      moodle_user_id: editingStudent.moodle_user_id,
      last_synced_at: editingStudent.last_synced_at,
    })

    if (!validation.success) {
      const errMap: Record<string, string> = {}
      validation.error.issues.forEach((err) => {
        const field = err.path[0]?.toString() || 'global'
        errMap[field] = err.message
      })
      setFormErrors(errMap)
      return
    }

    setIsSubmitting(true)
    const res = await studentRepository.updateStudent(
      editingStudent.id,
      { ...formData, kampus: targetKampus },
      institutionId,
      { userRole: isSuperAdmin ? 'super_admin' : 'campus_admin', assignedCampus }
    )
    setIsSubmitting(false)

    if (!res.success) {
      setFormErrors({ global: res.error || 'Gagal memperbarui santri.' })
      return
    }

    setEditingStudent(null)
    setActionFeedback(`Data santri '${res.student?.full_name}' berhasil diperbarui.`)
    setTimeout(() => setActionFeedback(null), 4000)
    loadStudents()
  }

  // Confirm Single Delete
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return
    setIsSubmitting(true)
    const ok = await studentRepository.deleteStudent(deletingStudent.id, institutionId, {
      userRole: isSuperAdmin ? 'super_admin' : 'campus_admin',
      assignedCampus,
    })
    setIsSubmitting(false)
    setDeletingStudent(null)
    if (ok) {
      setActionFeedback(`Santri '${deletingStudent.full_name}' telah dihapus dari direktori lokal.`)
    } else {
      setActionFeedback(`Akses Ditolak: Anda tidak memiliki wewenang menghapus santri dari kampus lain.`)
    }
    setTimeout(() => setActionFeedback(null), 4000)
    loadStudents()
  }

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setIsSubmitting(true)
    const count = await studentRepository.bulkDeleteStudents(selectedIds, institutionId, {
      userRole: isSuperAdmin ? 'super_admin' : 'campus_admin',
      assignedCampus,
    })
    setIsSubmitting(false)
    setIsBulkDeleteModalOpen(false)
    setSelectedIds([])
    setActionFeedback(`${count} santri terpilih telah dihapus dari direktori lokal.`)
    setTimeout(() => setActionFeedback(null), 4000)
    loadStudents()
  }

  // Phase 6 Moodle Export Handlers
  const handleOpenExportSelected = () => {
    const selected = students.filter((s) => selectedIds.includes(s.id))
    if (selected.length === 0) return
    setMoodleExportStudents(selected)
    setMoodleExportTitle(`Ekspor Pengguna Moodle (${selected.length} Santri Terpilih)`)
    setIsMoodleExportModalOpen(true)
  }

  const handleOpenExportFiltered = async () => {
    setIsLoading(true)
    try {
      const effectiveKampus = !isSuperAdmin && assignedCampus ? assignedCampus : kampusFilter
      const res = await studentRepository.getStudents({
        institutionId,
        search,
        jenjang: jenjangFilter,
        kampus: effectiveKampus,
        sync_status: syncStatusFilter,
        source: sourceFilter,
        sortBy,
        sortOrder,
        page: 1,
        pageSize: 10000,
        accessControl: {
          userRole: isSuperAdmin ? 'super_admin' : 'campus_admin',
          assignedCampus,
        },
      })
      setMoodleExportStudents(res.data)
      const hasFilter =
        jenjangFilter !== 'all' ||
        kampusFilter !== 'all' ||
        syncStatusFilter !== 'all' ||
        sourceFilter !== 'all' ||
        search.trim() !== ''
      setMoodleExportTitle(
        hasFilter
          ? `Ekspor Pengguna Moodle (${res.total} Santri Hasil Filter)`
          : `Ekspor Pengguna Moodle (Seluruh ${res.total} Santri)`
      )
      setIsMoodleExportModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenExportSingle = (student: Student) => {
    setMoodleExportStudents([student])
    setMoodleExportTitle(`Ekspor Pengguna Moodle (${student.full_name})`)
    setIsMoodleExportModalOpen(true)
  }

  const handleMoodleExportComplete = async (exportedUsernames: string[]) => {
    await studentRepository.markAsExported(exportedUsernames, institutionId)
    setActionFeedback(
      `${exportedUsernames.length} santri berhasil diekspor untuk Moodle LMS (status diperbarui menjadi Terekspor CSV).`
    )
    setTimeout(() => setActionFeedback(null), 5000)
    loadStudents()
  }

  // Legacy quick CSV export for backward compatibility
  const handleExportSelectedMoodle = () => {
    handleOpenExportSelected()
  }

  // Export All to Excel
  const handleExportAllExcel = async () => {
    const all = await studentRepository.getStudents({
      institutionId,
      page: 1,
      pageSize: 5000,
    })
    exportStudentsToExcel(all.data, `Data_Siswa_OGSOreg_${Date.now()}.xlsx`)
    setActionFeedback(`Seluruh data santri (${all.total}) berhasil diekspor ke file Excel.`)
    setTimeout(() => setActionFeedback(null), 4000)
  }

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <button
            onClick={toggleSelectAll}
            className="flex items-center justify-center p-1 text-slate-500 hover:text-foreground"
            title="Pilih Semua di Halaman Ini"
          >
            {isAllOnPageSelected ? (
              <CheckSquare className="w-4 h-4 text-brand-maroon" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => toggleSelectOne(row.original.id)}
            className="flex items-center justify-center p-1 text-slate-500 hover:text-foreground"
          >
            {selectedIds.includes(row.original.id) ? (
              <CheckSquare className="w-4 h-4 text-brand-maroon" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
          </button>
        ),
      },
      {
        id: 'index',
        header: 'No.',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {(currentPage - 1) * pageSize + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Nama Santri',
        cell: ({ row }) => {
          const s = row.original
          const initials = s.firstname ? s.firstname.slice(0, 2).toUpperCase() : 'ST'
          return (
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <div className="w-7 h-7 rounded-full bg-brand-maroon/10 text-brand-maroon font-bold text-xs flex items-center justify-center shrink-0 border border-brand-maroon/20">
                {initials}
              </div>
              <div>
                <button
                  onClick={() => setDetailStudent(s)}
                  className="text-xs font-semibold text-slate-900 hover:text-brand-maroon text-left transition-colors"
                >
                  {s.full_name}
                </button>
                <p className="text-[11px] text-muted-foreground">{s.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
            {row.original.username}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 truncate max-w-[200px] block">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: 'jenjang',
        header: 'Jenjang',
        cell: ({ row }) => {
          const j = row.original.jenjang
          const colors: Record<StudentJenjang, string> = {
            'Kelas 1': 'bg-blue-50 text-blue-700 border-blue-200',
            'Kelas 2': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Kelas 3': 'bg-amber-50 text-amber-700 border-amber-200',
            'Kelas 4': 'bg-purple-50 text-purple-700 border-purple-200',
            'Kelas 5': 'bg-rose-50 text-rose-700 border-rose-200',
          }
          return (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                colors[j] || 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {j}
            </span>
          )
        },
      },
      {
        accessorKey: 'kampus',
        header: 'Kampus',
        cell: ({ row }) => {
          const k = row.original.kampus
          if (!k || k.trim() === '') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Belum Diisi
              </span>
            )
          }
          const isPutri = k.includes('Putri')
          return (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isPutri
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {k}
            </span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Tanggal Input',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Sumber',
        cell: ({ row }) => {
          const src = row.original.source
          const labels: Record<StudentSource, string> = {
            excel: 'EXCEL',
            csv: 'CSV',
            manual: 'MANUAL',
            paste: 'TEMPEL',
          }
          return (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {labels[src] || src.toUpperCase()}
            </span>
          )
        },
      },
      {
        accessorKey: 'sync_status',
        header: 'Status Moodle',
        cell: ({ row }) => {
          const status = row.original.sync_status
          if (status === 'synced') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Terverifikasi Moodle
              </span>
            )
          }
          if (status === 'exported') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Download className="w-3 h-3 text-blue-600" />
                Terekspor CSV
              </span>
            )
          }
          if (status === 'failed') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Gagal
              </span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Lokal (Belum Sinkron)
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDetailStudent(s)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-brand-maroon transition-colors"
                title="Lihat Detail Santri"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => openEditModal(s)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-amber-700 transition-colors"
                title="Edit Data Santri"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => handleOpenExportSingle(s)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                  title="Ekspor ke Format Moodle (7 Kolom)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setDeletingStudent(s)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-rose-600 transition-colors"
                title="Hapus dari Direktori Lokal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        },
      },
    ],
    [selectedIds, students, currentPage, pageSize, isAllOnPageSelected]
  )

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Siswa Saya"
        subtitle="Kelola data santri yang telah Anda input."
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            {stats.total} Santri Tersimpan
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExportFiltered}
                leftIcon={<Download className="w-4 h-4 mr-1.5 text-[#166534]" />}
                className="border-[#166534]/30 text-[#166534] hover:bg-[#DCFCE7]/40 font-semibold"
              >
                Ekspor Moodle
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllExcel}
              leftIcon={<Download className="w-4 h-4 mr-1.5 text-emerald-700" />}
            >
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/imports')}
              leftIcon={<FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#166534]" />}
            >
              Import Siswa
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              leftIcon={<UserPlus className="w-4 h-4 mr-1.5" />}
            >
              Tambah Siswa
            </Button>
          </div>
        }
      />

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Santri"
          value={stats.total.toLocaleString('id-ID')}
          description="Seluruh santri terdaftar di institusi Anda"
          icon={<Users className="w-5 h-5" />}
          variant="maroon"
        />
        <StatCard
          title="Tersimpan di OGSOreg"
          value={stats.total.toLocaleString('id-ID')}
          description="Data tersimpan dalam repositori aktif"
          icon={<Database className="w-5 h-5 text-[#22C55E]" />}
          variant="accent"
        />
        <StatCard
          title="Akun Moodle Terverifikasi"
          value={stats.verifiedMoodleCount.toLocaleString('id-ID')}
          description="Sudah memiliki konfirmasi user ID LMS"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          variant="default"
        />
        <StatCard
          title="Belum Sinkron"
          value={stats.unSyncedCount.toLocaleString('id-ID')}
          description="Santri lokal belum diekspor ke Moodle"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
          variant="warning"
        />
      </div>

      {/* 3. Class Breakdown Pills */}
      <div className="p-4 rounded-xl bg-white border border-border shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-brand-maroon" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Distribusi Jenjang Kelas:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MOODLE_JENJANG_OPTIONS.map((j) => (
            <button
              key={j}
              onClick={() => {
                setJenjangFilter(jenjangFilter === j ? 'all' : j)
                setCurrentPage(1)
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                jenjangFilter === j
                  ? 'bg-brand-maroon text-white border-brand-maroon font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {j}: <strong>{stats.byJenjang[j] || 0}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* 3b. Campus Breakdown Pills */}
      <div className="p-4 rounded-xl bg-white border border-border shadow-subtle space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Distribusi 20 Kampus Gontor:
            </span>
          </div>
          {stats.incompleteKampusCount !== undefined && stats.incompleteKampusCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {stats.incompleteKampusCount} santri belum memilih kampus
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
          {KAMPUS_OPTIONS.map((k) => {
            const count = (stats.byKampus && stats.byKampus[k]) || 0
            const isSelected = kampusFilter === k
            return (
              <button
                key={k}
                onClick={() => {
                  setKampusFilter(kampusFilter === k ? 'all' : k)
                  setCurrentPage(1)
                }}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-700 font-bold'
                    : count > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {k}: <strong>{count}</strong>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Filter & Search Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-border shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama, username, kampus, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-maroon transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Jenjang */}
            <select
              value={jenjangFilter}
              onChange={(e) => {
                setJenjangFilter(e.target.value as StudentJenjang | 'all')
                setCurrentPage(1)
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-maroon"
            >
              <option value="all">Semua Jenjang</option>
              {MOODLE_JENJANG_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>

            {/* Filter Kampus */}
            {isSuperAdmin ? (
              <select
                value={kampusFilter}
                onChange={(e) => {
                  setKampusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">Semua Kampus (20)</option>
                <option value="incomplete">⚠️ Belum Diisi (Incomplete)</option>
                <optgroup label="Kampus Putra (Gontor 1–12)">
                  {KAMPUS_OPTIONS.filter((k) => !k.includes('Putri')).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kampus Putri (Gontor Putri 1–8)">
                  {KAMPUS_OPTIONS.filter((k) => k.includes('Putri')).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </optgroup>
              </select>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kampus: {assignedCampus || 'Ditentukan'} (Terkunci)</span>
              </div>
            )}

            {/* Filter Sync Status */}
            <select
              value={syncStatusFilter}
              onChange={(e) => {
                setSyncStatusFilter(e.target.value as StudentSyncStatus | 'all')
                setCurrentPage(1)
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-maroon"
            >
              <option value="all">Semua Status Moodle</option>
              <option value="local_only">Belum Sinkron (Lokal)</option>
              <option value="exported">Terekspor CSV</option>
              <option value="synced">Terverifikasi Moodle</option>
              <option value="failed">Gagal</option>
            </select>

            {/* Filter Source */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value as StudentSource | 'all')
                setCurrentPage(1)
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-maroon"
            >
              <option value="all">Semua Sumber Input</option>
              <option value="excel">Excel Import</option>
              <option value="csv">CSV Import</option>
              <option value="manual">Manual Input</option>
              <option value="paste">Tempel Spreadsheet</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-lg border border-border bg-white hover:bg-slate-50 text-slate-700"
              title="Balik Urutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar when items selected */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-[#DCFCE7]/40 border border-[#BBF7D0] flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#166534] text-white font-bold text-xs flex items-center justify-center">
                {selectedIds.length}
              </span>
              <span className="text-xs font-semibold text-[#166534]">
                santri terpilih untuk tindakan massal
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelectedMoodle}
                  leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                >
                  Ekspor CSV Moodle ({selectedIds.length})
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 mr-1" />}
              >
                Hapus Terpilih
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Main Student Table */}
      <div className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableLoadingSkeleton rows={6} columns={9} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadStudents} />
        ) : students.length === 0 ? (
          <EmptyState
            title="Belum Ada Data Santri"
            description="Mulai tambahkan santri melalui import Excel/CSV, tempel tabel, atau entri formulir manual."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={openAddModal}
                leftIcon={<UserPlus className="w-4 h-4 mr-1.5" />}
              >
                Tambah Santri Pertama
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-border bg-slate-50/75 text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="py-3 px-3.5 whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedIds.includes(row.original.id) ? 'bg-brand-maroon/5' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2.5 px-3.5 whitespace-nowrap align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Pagination Footer */}
        {students.length > 0 && (
          <div className="p-3.5 border-t border-border bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Menampilkan{' '}
              <strong>{(currentPage - 1) * pageSize + 1}</strong> –{' '}
              <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> dari{' '}
              <strong>{totalCount}</strong> santri
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft className="w-4 h-4 mr-1" />}
              >
                Sebelumnya
              </Button>

              <span className="font-semibold px-2">
                Halaman {currentPage} dari {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight className="w-4 h-4 ml-1" />}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. MODALS & DRAWERS                                      */}
      {/* ======================================================== */}

      {/* DETAIL MODAL / DRAWER */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-maroon text-white font-bold flex items-center justify-center text-xs">
                  {detailStudent.firstname.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Detail Data Santri</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    ID: {detailStudent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Important local notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Pemberitahuan Sinkronisasi:</strong> Data santri yang tersimpan di OGSOreg tidak otomatis memiliki akun aktif di Moodle LMS. Akun resmi baru terbuat setelah berkas CSV diunggah ke Moodle LMS OGSO Gontor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Nama Lengkap
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">{detailStudent.full_name}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Username Moodle
                  </span>
                  <p className="font-mono font-semibold text-brand-maroon mt-0.5">
                    {detailStudent.username}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Email Aktif
                  </span>
                  <p className="font-medium text-slate-800 mt-0.5">{detailStudent.email}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Jenjang Santri
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailStudent.jenjang}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Kampus Gontor
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {detailStudent.kampus || 'Belum Diisi'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Sumber Entri
                  </span>
                  <p className="font-mono font-semibold text-slate-700 mt-0.5 uppercase">
                    {detailStudent.source}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Status Sinkronisasi
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {detailStudent.sync_status === 'synced'
                      ? '✓ Terverifikasi Moodle'
                      : detailStudent.sync_status === 'exported'
                      ? 'Terekspor CSV'
                      : 'Lokal (Belum Sinkron)'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Moodle User ID
                  </span>
                  <p className="font-mono text-slate-700 mt-0.5">
                    {detailStudent.moodle_user_id || 'Belum diverifikasi'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Tanggal Entri
                  </span>
                  <p className="text-slate-700 mt-0.5">
                    {new Date(detailStudent.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = detailStudent
                  setDetailStudent(null)
                  handleOpenExportSingle(target)
                }}
                leftIcon={<Download className="w-3.5 h-3.5 mr-1 text-brand-maroon" />}
                className="border-brand-maroon/30 text-brand-maroon hover:bg-brand-maroon/5 font-semibold"
              >
                Ekspor Moodle (7 Kolom)
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = detailStudent
                    setDetailStudent(null)
                    openEditModal(target)
                  }}
                  leftIcon={<Edit className="w-3.5 h-3.5 mr-1" />}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDetailStudent(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <h3 className="text-sm font-bold text-foreground">Tambah Santri Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div className="p-5 space-y-3.5 text-xs">
                {formErrors.global && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {formErrors.global}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username Moodle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: ahmad_faiz"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                  />
                  {formErrors.username && (
                    <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.username}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Depan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmad"
                      value={formData.firstname}
                      onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    />
                    {formErrors.firstname && (
                      <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.firstname}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Belakang</label>
                    <input
                      type="text"
                      placeholder="Faiz"
                      value={formData.lastname}
                      onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ahmad.faiz@pesantren.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                  />
                  {formErrors.email && (
                    <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jenjang Santri <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.jenjang}
                      onChange={(e) =>
                        setFormData({ ...formData, jenjang: e.target.value as StudentJenjang })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    >
                      {MOODLE_JENJANG_OPTIONS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kampus Gontor <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.kampus}
                      onChange={(e) => setFormData({ ...formData, kampus: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    >
                      <option value="" disabled>Pilih Kampus (20 Pilihan)</option>
                      <optgroup label="Kampus Putra (1–12)">
                        {KAMPUS_OPTIONS.filter((k) => !k.includes('Putri')).map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Kampus Putri (1–8)">
                        {KAMPUS_OPTIONS.filter((k) => k.includes('Putri')).map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </optgroup>
                    </select>
                    {formErrors.kampus && (
                      <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.kampus}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-slate-50">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Santri'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <h3 className="text-sm font-bold text-foreground">Edit Data Santri</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-5 space-y-3.5 text-xs">
                {formErrors.global && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {formErrors.global}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username Moodle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                  />
                  {formErrors.username && (
                    <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.username}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Depan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstname}
                      onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Belakang</label>
                    <input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                  />
                  {formErrors.email && (
                    <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jenjang Santri <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.jenjang}
                      onChange={(e) =>
                        setFormData({ ...formData, jenjang: e.target.value as StudentJenjang })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    >
                      {MOODLE_JENJANG_OPTIONS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kampus Gontor
                    </label>
                    <select
                      value={formData.kampus}
                      onChange={(e) => setFormData({ ...formData, kampus: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                    >
                      <option value="">Pilih Kampus (20 Pilihan)</option>
                      <optgroup label="Kampus Putra (1–12)">
                        {KAMPUS_OPTIONS.filter((k) => !k.includes('Putri')).map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Kampus Putri (1–8)">
                        {KAMPUS_OPTIONS.filter((k) => k.includes('Putri')).map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-slate-50">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setEditingStudent(null)}
                >
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Santri'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Hapus Santri '{deletingStudent.full_name}'?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tindakan ini akan menghapus catatan santri dari repositori lokal OGSOreg.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-normal">
                <strong>Catatan Keamanan LMS:</strong> Menghapus santri di OGSOreg <u>TIDAK</u> akan menghapus akun yang telah dibuat di server LMS Moodle OGSO Gontor.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingStudent(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data Lokal'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Hapus {selectedIds.length} Santri Terpilih?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda akan menghapus {selectedIds.length} santri yang dipilih dari direktori lokal OGSOreg.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-normal">
                <strong>Catatan Keamanan LMS:</strong> Menghapus catatan lokal ini <u>TIDAK</u> menghapus akun pengguna yang telah terdaftar di Moodle LMS OGSO Gontor.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleteModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmBulkDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menghapus...' : `Ya, Hapus ${selectedIds.length} Santri`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 6 MOODLE BULK USER EXPORT MODAL */}
      <MoodleExportModal
        isOpen={isMoodleExportModalOpen}
        onClose={() => setIsMoodleExportModalOpen(false)}
        students={moodleExportStudents}
        title={moodleExportTitle}
        sourceDescription="Direktori Siswa Saya"
        onExportComplete={handleMoodleExportComplete}
      />
    </div>
  )
}
