import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Download,
  Eye,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import { materiService, type SyllabusItem } from '../services/materiService'
import type { StudentJenjang } from '../types/student'

const JENJANG_TABS: (StudentJenjang | 'all')[] = [
  'all',
  'Jenjang 1',
  'Jenjang 2',
  'Jenjang 3',
  'Jenjang 4',
  'Jenjang 5',
]

const TAB_LABELS: Record<string, string> = {
  all: 'Semua Jenjang',
  'Jenjang 1': 'Jenjang 1 (Kelas 1 KMI)',
  'Jenjang 2': 'Jenjang 2 (Kelas 2 KMI)',
  'Jenjang 3': 'Jenjang 3 (Kelas 3 KMI & 1 Int)',
  'Jenjang 4': 'Jenjang 4 (Kelas 4 KMI & 3 Int)',
  'Jenjang 5': 'Jenjang 5 (Kelas 5 KMI)',
}

const getSubjectBadgeStyle = (subj: string) => {
  const s = subj.toLowerCase()
  if (s.includes('fisika')) {
    return 'bg-sky-50 text-sky-700 border-sky-200'
  }
  if (s.includes('biologi')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (s.includes('kimia')) {
    return 'bg-amber-50 text-amber-800 border-amber-200'
  }
  if (s.includes('matematika')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export const SilabusPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [syllabuses, setSyllabuses] = useState<SyllabusItem[]>([])
  const [selectedJenjang, setSelectedJenjang] = useState<StudentJenjang | 'all'>('all')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null)
  const [previewItem, setPreviewItem] = useState<SyllabusItem | null>(null)
  const [modalSubjectFilter, setModalSubjectFilter] = useState<string>('all')

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formJenjang, setFormJenjang] = useState<StudentJenjang>('Jenjang 1')
  const [formSubject, setFormSubject] = useState('Matematika & Sains')
  const [formDescription, setFormDescription] = useState('')
  const [formFileName, setFormFileName] = useState('')
  const [formFileSize, setFormFileSize] = useState('1.5 MB')
  const [formPages, setFormPages] = useState<number>(18)
  const [formPublished, setFormPublished] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const loadData = () => {
    // If not super admin, show published only
    const list = materiService.getSyllabuses(!isSuperAdmin)
    setSyllabuses(list)
  }

  useEffect(() => {
    loadData()
  }, [isSuperAdmin])

  const filtered = syllabuses.filter((s) => {
    if (selectedJenjang !== 'all' && s.jenjang !== selectedJenjang) return false
    return true
  })

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormJenjang('Jenjang 1')
    setFormSubject('Matematika & Sains')
    setFormDescription('')
    setFormFileName('Silabus_Resmi_OGSO.pdf')
    setFormFileSize('1.5 MB')
    setFormPages(18)
    setFormPublished(true)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: SyllabusItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormJenjang(item.jenjang)
    setFormSubject(item.subject)
    setFormDescription(item.description)
    setFormFileName(item.file_name)
    setFormFileSize(item.file_size || '1.5 MB')
    setFormPages(item.pages || 18)
    setFormPublished(item.is_published)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Hapus silabus '${title}'?`)) {
      materiService.deleteSyllabus(id)
      loadData()
    }
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setFormError('Judul silabus wajib diisi.')
      return
    }

    materiService.saveSyllabus({
      id: editingItem ? editingItem.id : undefined,
      title: formTitle.trim(),
      jenjang: formJenjang,
      subject: formSubject.trim(),
      description: formDescription.trim(),
      file_url: '/documents/Silabus_OGSO_2026.xlsx',
      file_name: formFileName.trim() || 'Silabus_OGSO_2026.xlsx',
      file_size: formFileSize.trim(),
      pages: Number(formPages),
      is_published: formPublished,
    })

    setIsModalOpen(false)
    loadData()
  }

  const handleDownload = (item: SyllabusItem) => {
    const link = document.createElement('a')
    link.href = item.file_url || '/documents/Silabus_OGSO_2026.xlsx'
    link.download = item.file_name || 'Silabus_OGSO_2026.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreviewOpen = (item: SyllabusItem) => {
    setPreviewItem(item)
    setModalSubjectFilter('all')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Silabus Kompetisi OGSO"
        subtitle="Panduan resmi materi, kisi-kisi kurikulum, dan cakupan pengujian Olimpiade Sains & Matematika untuk seluruh jenjang (Kelas 1–5 KMI)."
        actions={
          isSuperAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
            >
              Upload Silabus Baru
            </Button>
          )
        }
      />

      {/* Modern Jenjang Category Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-border shadow-subtle text-xs">
        {JENJANG_TABS.map((tab) => {
          const isSelected = selectedJenjang === tab
          const count =
            tab === 'all'
              ? syllabuses.length
              : syllabuses.filter((s) => s.jenjang === tab).length

          return (
            <button
              key={tab}
              onClick={() => setSelectedJenjang(tab)}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{TAB_LABELS[tab] || tab}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid of Syllabus Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Belum Ada Silabus"
          description="Silabus untuk jenjang ini belum diterbitkan oleh panitia."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-subtle hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.jenjang}
                    </span>
                    {item.target_kelas && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-maroon/10 text-brand-maroon border border-brand-maroon/20">
                        Kelas: {item.target_kelas}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                    {item.file_size || '14.8 KB'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                    {(item.subjects || item.subject.split(', ')).map((subj) => (
                      <span
                        key={subj}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getSubjectBadgeStyle(subj)}`}
                      >
                        {subj}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.breakdown && item.breakdown.length > 0 && (
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600 font-semibold text-[11px]">
                      <span>Cakupan Materi Resmi:</span>
                      <span className="text-emerald-800 font-bold">
                        {item.breakdown.reduce((acc, curr) => acc + curr.topics.length, 0)} Topik
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {item.breakdown.map((b) => (
                        <span key={b.subject} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 shadow-2xs">
                          {b.subject}: <strong>{b.topics.length}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit Silabus"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewOpen(item)}
                    leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
                  >
                    Pratinjau
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(item)}
                    leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 mr-1" />}
                  >
                    Unduh Excel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewItem.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-emerald-800">Target: {previewItem.target_kelas || previewItem.jenjang}</span>
                    <span>•</span>
                    <span>{previewItem.jenjang}</span>
                    <span>•</span>
                    <span>
                      {previewItem.breakdown
                        ? `${previewItem.breakdown.reduce((acc, curr) => acc + curr.topics.length, 0)} Topik Pengujian`
                        : `${previewItem.subject}`}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 leading-relaxed">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Deskripsi & Ruang Lingkup Materi:
                </p>
                <p>{previewItem.description}</p>
              </div>

              {/* Subject Breakdown Filter Tabs */}
              {previewItem.breakdown && previewItem.breakdown.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Daftar Topik & Materi Per Bidang Studi
                    </h4>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setModalSubjectFilter('all')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          modalSubjectFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Semua
                      </button>
                      {previewItem.breakdown.map((b) => (
                        <button
                          key={b.subject}
                          type="button"
                          onClick={() => setModalSubjectFilter(b.subject)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            modalSubjectFilter === b.subject
                              ? 'bg-emerald-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {b.subject} ({b.topics.length})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Sections */}
                  <div className="space-y-4">
                    {previewItem.breakdown
                      .filter((b) => modalSubjectFilter === 'all' || modalSubjectFilter === b.subject)
                      .map((b) => (
                        <div key={b.subject} className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getSubjectBadgeStyle(b.subject)}`}>
                                {b.subject}
                              </span>
                              <span className="text-xs text-slate-600 font-medium">
                                {b.topics.length} Topik Pembahasan
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Silabus OGSO 2026
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 bg-white">
                            {b.topics.map((t, tIdx) => (
                              <div key={tIdx} className="px-4 py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                                <div className="flex items-start gap-2.5">
                                  <span className="font-mono text-[11px] text-slate-400 w-5 shrink-0 pt-0.5">
                                    #{tIdx + 1}
                                  </span>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-900">{t.title}</p>
                                    {t.focus && (
                                      <p className="text-[11px] text-amber-800 font-medium mt-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                        {t.focus}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 border border-slate-200">
                                  {t.kelas}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Berkas Excel Resmi: <strong>{previewItem.file_name}</strong>
                </span>
                <span>{previewItem.file_size || '14.8 KB'}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 italic">
                * Silabus telah disinkronkan dengan dokumen resmi Silabus OGSO 2026
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewItem(null)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(previewItem)}
                  leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                >
                  Unduh Silabus Excel (.xlsx)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL (Super Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingItem ? 'Edit Dokumen Silabus' : 'Upload Silabus Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Judul Silabus</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Silabus Resmi Olimpiade Sains & Matematika Kelas 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenjang Santri</label>
                  <select
                    value={formJenjang}
                    onChange={(e) => setFormJenjang(e.target.value as StudentJenjang)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Jenjang 1">Jenjang 1 (Kelas 1)</option>
                    <option value="Jenjang 2">Jenjang 2 (Kelas 2)</option>
                    <option value="Jenjang 3">Jenjang 3 (Kelas 1 Int & Kelas 3)</option>
                    <option value="Jenjang 4">Jenjang 4 (Kelas 3 Int & Kelas 4)</option>
                    <option value="Jenjang 5">Jenjang 5 (Kelas 5)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Bidang Pengujian</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Matematika & Sains"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Deskripsi / Ruang Lingkup Materi</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ringkasan materi pokok dan indikator pengujian..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Berkas PDF</label>
                  <input
                    type="text"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    placeholder="Silabus_Kelas_1.pdf"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Ukuran Berkas</label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="1.5 MB"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pub-check"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="pub-check" className="text-xs font-semibold text-slate-700">
                  Publikasikan untuk umum (Dapat diunduh pengunjung tanpa login)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingItem ? 'Simpan Perubahan' : 'Upload Silabus'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
