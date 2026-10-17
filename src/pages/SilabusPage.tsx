import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import { materiService, type SyllabusItem } from '../services/materiService'
import type { StudentJenjang } from '../types/student'

const JENJANG_TABS: (StudentJenjang | 'all')[] = [
  'all',
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
]

export const SilabusPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [syllabuses, setSyllabuses] = useState<SyllabusItem[]>([])
  const [selectedJenjang, setSelectedJenjang] = useState<StudentJenjang | 'all'>('all')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null)
  const [previewItem, setPreviewItem] = useState<SyllabusItem | null>(null)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formJenjang, setFormJenjang] = useState<StudentJenjang>('Kelas 1')
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
    setFormJenjang('Kelas 1')
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
      file_url: '#',
      file_name: formFileName.trim() || 'Silabus_OGSO.pdf',
      file_size: formFileSize.trim(),
      pages: Number(formPages),
      is_published: formPublished,
    })

    setIsModalOpen(false)
    loadData()
  }

  const handleDownload = (item: SyllabusItem) => {
    alert(`Mengunduh berkas silabus PDF:\n${item.file_name}\nJenjang: ${item.jenjang}\nUkuran: ${item.file_size || '1.5 MB'}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Silabus Kompetisi OGSO"
        subtitle="Panduan resmi materi, kisi-kisi kurikulum, dan cakupan pengujian Olimpiade Gontor Sains & Matematika untuk seluruh jenjang (Kelas 1–5)."
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
              <span>{tab === 'all' ? 'Semua Jenjang' : tab}</span>
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
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {item.jenjang}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.pages ? `${item.pages} Halaman • ` : ''}
                    {item.file_size}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
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
                    onClick={() => setPreviewItem(item)}
                    leftIcon={<Eye className="w-3.5 h-3.5 mr-1" />}
                  >
                    Pratinjau
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(item)}
                    leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
                  >
                    Unduh PDF
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
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{previewItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {previewItem.jenjang}
                </span>
                <span className="text-xs text-slate-500 font-medium">Bidang: {previewItem.subject}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-900">Deskripsi & Ruang Lingkup Materi:</p>
                <p>{previewItem.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Berkas: <strong>{previewItem.file_name}</strong></span>
                <span>{previewItem.file_size}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewItem(null)}>
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownload(previewItem)}
                leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}
              >
                Unduh Dokumen PDF
              </Button>
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
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="Kelas 5">Kelas 5</option>
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
