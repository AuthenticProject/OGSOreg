import React, { useState, useEffect } from 'react'
import {
  Archive,
  Download,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  FolderOpen,
  Globe,
  Lock,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  materiService,
  type BankSoalBabak,
  type BankSoalCollection,
  type BankSoalDocument,
} from '../services/materiService'
import type { StudentJenjang } from '../types/student'

const ALLOWED_JENJANG: StudentJenjang[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
]

export const BankSoalPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [activeBabak, setActiveBabak] = useState<BankSoalBabak>('Penyisihan')
  const [collections, setCollections] = useState<BankSoalCollection[]>([])
  const [expandedYearIds, setExpandedYearIds] = useState<Set<string>>(new Set())

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    doc: BankSoalDocument
    collection: BankSoalCollection
  } | null>(null)

  // Super Admin Modals
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false)
  const [colYear, setColYear] = useState<number>(new Date().getFullYear())
  const [colBabak, setColBabak] = useState<BankSoalBabak>('Penyisihan')
  const [colTitle, setColTitle] = useState('')
  const [colDescription, setColDescription] = useState('')
  const [colPublished, setColPublished] = useState(true)

  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [selectedColForDoc, setSelectedColForDoc] = useState<BankSoalCollection | null>(null)
  const [docJenjang, setDocJenjang] = useState<StudentJenjang>('Kelas 1')
  const [docTitle, setDocTitle] = useState('')
  const [docFileName, setDocFileName] = useState('')
  const [docFileSize, setDocFileSize] = useState('1.2 MB')
  const [docPublished, setDocPublished] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const loadData = () => {
    // If not super admin, only published collections & docs
    const list = materiService.getBankSoalCollections(activeBabak, !isSuperAdmin)
    setCollections(list)

    // By default expand the newest year if none expanded yet
    if (list.length > 0 && expandedYearIds.size === 0) {
      setExpandedYearIds(new Set([list[0].id]))
    }
  }

  useEffect(() => {
    loadData()
  }, [activeBabak, isSuperAdmin])

  const toggleExpand = (id: string) => {
    setExpandedYearIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleOpenAddCollection = () => {
    setColYear(new Date().getFullYear())
    setColBabak(activeBabak)
    setColTitle(`Soal ${activeBabak} ${new Date().getFullYear()}`)
    setColDescription(`Naskah resmi soal babak ${activeBabak.toLowerCase()} OGSO ${new Date().getFullYear()}.`)
    setColPublished(true)
    setFormError(null)
    setIsCollectionModalOpen(true)
  }

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!colTitle.trim()) {
      setFormError('Judul koleksi tahun wajib diisi.')
      return
    }

    materiService.saveBankSoalCollection({
      year: Number(colYear),
      babak: colBabak,
      title: colTitle.trim(),
      description: colDescription.trim(),
      is_published: colPublished,
    })

    setIsCollectionModalOpen(false)
    loadData()
  }

  const handleOpenAddDoc = (col: BankSoalCollection) => {
    setSelectedColForDoc(col)
    setDocJenjang('Kelas 1')
    setDocTitle(`Soal ${col.babak} OGSO ${col.year} — Kelas 1`)
    setDocFileName(`Soal_${col.babak}_OGSO_${col.year}_Kelas_1.pdf`)
    setDocFileSize('1.2 MB')
    setDocPublished(true)
    setFormError(null)
    setIsDocModalOpen(true)
  }

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedColForDoc) return
    if (!docTitle.trim() || !docFileName.trim()) {
      setFormError('Judul dan nama file wajib diisi.')
      return
    }

    materiService.addDocumentToCollection(selectedColForDoc.id, {
      jenjang: docJenjang,
      title: docTitle.trim(),
      file_url: '#',
      file_name: docFileName.trim(),
      file_size: docFileSize.trim() || '1.0 MB',
      is_published: docPublished,
      download_count: 0,
    })

    setIsDocModalOpen(false)
    loadData()
  }

  const handleDeleteDoc = (colId: string, docId: string, title: string) => {
    if (window.confirm(`Hapus naskah soal "${title}"?`)) {
      materiService.deleteDocument(colId, docId)
      loadData()
    }
  }

  const handleDeleteCollection = (colId: string, title: string) => {
    if (window.confirm(`Hapus koleksi arsip "${title}" beserta seluruh soal di dalamnya?`)) {
      materiService.deleteCollection(colId)
      loadData()
    }
  }

  const handleDownload = (doc: BankSoalDocument) => {
    // Simulated PDF Download
    const dummyContent = `%PDF-1.4\n%OGSO Bank Soal: ${doc.title}\n1 0 obj\n<< /Title (${doc.title}) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`
    const blob = new Blob([dummyContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.file_name.endsWith('.pdf') ? doc.file_name : `${doc.file_name}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Calculate dynamic summary per collection
  const getCollectionSummary = (col: BankSoalCollection) => {
    const docs = (col.documents || []).filter((d) => (isSuperAdmin ? true : d.is_published))
    const count = docs.length
    if (count === 0) return 'Belum ada soal terunggah'

    // Extract sorted unique classes
    const jenjangOrder = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5']
    const presentJenjang = Array.from(new Set(docs.map((d) => d.jenjang))).sort(
      (a, b) => jenjangOrder.indexOf(a) - jenjangOrder.indexOf(b)
    )

    if (presentJenjang.length === 1) {
      return `${count} soal · ${presentJenjang[0]}`
    }
    const first = presentJenjang[0].replace('Kelas ', '')
    const last = presentJenjang[presentJenjang.length - 1].replace('Kelas ', '')
    return `${count} soal · Kelas ${first}–${last}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Soal OGSO"
        subtitle="Arsip resmi naskah soal kompetisi Olimpiade Gontor Sains & Matematika tahun-tahun sebelumnya. Terbuka untuk umum."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            Akses Publik Bebas
          </span>
        }
        actions={
          isSuperAdmin && (
            <Button
              variant="primary"
              onClick={handleOpenAddCollection}
              className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Koleksi {activeBabak}
            </Button>
          )
        }
      />

      {/* Strict 2 Sections: Soal Babak Penyisihan & Soal Babak Final */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveBabak('Penyisihan')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeBabak === 'Penyisihan'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Soal Babak Penyisihan
          </button>
          <button
            type="button"
            onClick={() => setActiveBabak('Final')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              activeBabak === 'Final'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Soal Babak Final
          </button>
        </div>

        <div className="text-xs text-slate-500 px-3 py-1 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span>Hanya tersedia untuk jenjang <strong>Kelas 1 – 5</strong></span>
        </div>
      </div>

      {/* List of Year Collections (Expandable on the same page) */}
      {collections.length === 0 ? (
        <SectionCard>
          <EmptyState
            title={`Belum Ada Koleksi Soal ${activeBabak}`}
            description={
              isSuperAdmin
                ? `Klik tombol "Tambah Koleksi ${activeBabak}" di atas untuk membuat arsip tahun baru.`
                : `Naskah soal babak ${activeBabak.toLowerCase()} sedang dalam proses persiapan oleh panitia.`
            }
            icon={<Archive className="w-6 h-6 text-slate-400" />}
            action={
              isSuperAdmin ? (
                <Button variant="primary" onClick={handleOpenAddCollection} className="bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Koleksi Tahun Baru
                </Button>
              ) : undefined
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {collections.map((col) => {
            const isExpanded = expandedYearIds.has(col.id)
            const summaryText = getCollectionSummary(col)
            const visibleDocs = (col.documents || []).filter(
              (d) => (isSuperAdmin ? true : d.is_published)
            )

            // Group docs by Kelas 1–5
            const docsByClass: Record<string, BankSoalDocument[]> = {}
            ALLOWED_JENJANG.forEach((cls) => {
              const matched = visibleDocs.filter((d) => d.jenjang === cls)
              if (matched.length > 0) {
                docsByClass[cls] = matched
              }
            })

            return (
              <div
                key={col.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Year Header / Clickable Accordion Banner */}
                <div
                  onClick={() => toggleExpand(col.id)}
                  className={`p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                    isExpanded ? 'bg-emerald-50/50 border-b border-emerald-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs ${
                        isExpanded
                          ? 'bg-emerald-700 text-white ring-4 ring-emerald-100'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {col.year}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                          {col.title}
                        </h3>
                        {!col.is_published && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                          {summaryText}
                        </span>
                        {col.description && (
                          <span className="hidden md:inline text-slate-400">
                            • {col.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <div className="hidden sm:flex items-center gap-1.5 mr-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAddDoc(col)}
                          className="text-xs h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Unggah Soal
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCollection(col.id, col.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Koleksi Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Year Content (Strictly Kelas 1–5 with preview/download) */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50 space-y-4">
                    {Object.keys(docsByClass).length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border border-dashed border-slate-200">
                        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-600">
                          Belum ada naskah soal yang diterbitkan untuk tahun {col.year}.
                        </p>
                        {isSuperAdmin && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenAddDoc(col)}
                            className="mt-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Unggah Naskah Soal Kelas 1–5
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {ALLOWED_JENJANG.map((jenjang) => {
                          const classDocs = docsByClass[jenjang]
                          if (!classDocs || classDocs.length === 0) return null

                          return classDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all group flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    {doc.jenjang}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-400">
                                    {doc.file_size || 'PDF'}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-emerald-700 transition-colors">
                                  {doc.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 truncate">
                                  {doc.file_name}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPreviewDoc({ doc, collection: col })}
                                    className="h-8 px-2.5 text-xs text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-emerald-600" />
                                    Preview
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    className="h-8 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1" />
                                    Download
                                  </Button>
                                </div>

                                {isSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDoc(col.id, doc.id, doc.title)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Hapus naskah soal ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{previewDoc.doc.title}</h3>
                  <p className="text-xs text-slate-500">
                    {previewDoc.collection.title} • {previewDoc.doc.jenjang} • {previewDoc.doc.file_size}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-100 rounded-xl p-8 border border-dashed border-slate-300 text-center space-y-3">
                <FileText className="w-16 h-16 text-emerald-700/60 mx-auto" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-base">
                    Naskah Resmi Kompetisi OGSO
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Dokumen soal babak {previewDoc.collection.babak.toLowerCase()} untuk jenjang {previewDoc.doc.jenjang}.
                    Gunakan berkas ini sebagai bahan pembinaan dan latihan santri.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Format PDF Resmi • Siap Cetak
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Nama Berkas: {previewDoc.doc.file_name}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    OGSO Official Competition Repository
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleDownload(previewDoc.doc)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Unduh PDF
                </Button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button variant="secondary" onClick={() => setPreviewDoc(null)} className="text-xs">
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Modal: Tambah Koleksi Tahun */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-700" />
                Tambah Koleksi Tahun Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsCollectionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Kompetisi
                  </label>
                  <input
                    type="number"
                    min="2015"
                    max="2035"
                    value={colYear}
                    onChange={(e) => {
                      const y = Number(e.target.value)
                      setColYear(y)
                      setColTitle(`Soal ${colBabak} ${y}`)
                    }}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Babak (Strict)
                  </label>
                  <select
                    value={colBabak}
                    onChange={(e) => {
                      const b = e.target.value as BankSoalBabak
                      setColBabak(b)
                      setColTitle(`Soal ${b} ${colYear}`)
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Penyisihan">Penyisihan</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Koleksi
                </label>
                <input
                  type="text"
                  value={colTitle}
                  onChange={(e) => setColTitle(e.target.value)}
                  required
                  placeholder="Contoh: Soal Penyisihan 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={colDescription}
                  onChange={(e) => setColDescription(e.target.value)}
                  placeholder="Keterangan mengenai naskah soal ini..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="colPub"
                  checked={colPublished}
                  onChange={(e) => setColPublished(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="colPub" className="text-xs font-medium text-slate-700">
                  Langsung publikasikan koleksi ini untuk umum
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsCollectionModalOpen(false)}
                >
                  Batal
                </Button>
                <Button variant="primary" type="submit" className="bg-emerald-700">
                  Simpan Koleksi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Modal: Unggah Naskah Soal ke Koleksi */}
      {isDocModalOpen && selectedColForDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                Unggah Soal — {selectedColForDoc.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenjang (Strict: Kelas 1–5 Only)
                </label>
                <select
                  value={docJenjang}
                  onChange={(e) => {
                    const j = e.target.value as StudentJenjang
                    setDocJenjang(j)
                    setDocTitle(`Soal ${selectedColForDoc.babak} OGSO ${selectedColForDoc.year} — ${j}`)
                    setDocFileName(`Soal_${selectedColForDoc.babak}_OGSO_${selectedColForDoc.year}_${j.replace(' ', '_')}.pdf`)
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {ALLOWED_JENJANG.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Naskah Soal
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama File PDF
                  </label>
                  <input
                    type="text"
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ukuran File
                  </label>
                  <input
                    type="text"
                    value={docFileSize}
                    onChange={(e) => setDocFileSize(e.target.value)}
                    placeholder="1.2 MB"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="docPub"
                  checked={docPublished}
                  onChange={(e) => setDocPublished(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="docPub" className="text-xs font-medium text-slate-700">
                  Publikasikan untuk diunduh pengunjung umum
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                >
                  Batal
                </Button>
                <Button variant="primary" type="submit" className="bg-emerald-700">
                  Simpan Soal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
