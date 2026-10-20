import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Download,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  GraduationCap,
  Library,
  Atom,
  Brain,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/feedback/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  materiService,
  type SyllabusItem,
} from '../services/materiService'
import type { StudentJenjang } from '../types/student'
import { cn } from '../lib/utils'

const JENJANG_TABS: StudentJenjang[] = [
  'Jenjang 1',
  'Jenjang 2',
  'Jenjang 3',
  'Jenjang 4',
  'Jenjang 5',
]

const JENJANG_CONFIG: Record<
  StudentJenjang,
  {
    icon: string
    label: string
    subLabel: string
    color: string
    accentBg: string
    borderColor: string
    curriculumNote: string
  }
> = {
  'Jenjang 1': {
    icon: '🎒',
    label: 'Jenjang 1',
    subLabel: 'Kelas 1 KMI',
    color: '#166534',
    accentBg: '#F0FDF4',
    borderColor: '#BBF7D0',
    curriculumNote:
      'Silabus resmi disusun mengikuti kurikulum Kulliyatu-l-Mu’allimin Al-Islamiyah (KMI) Pondok Modern Darussalam Gontor tingkat awal (Kelas 1 KMI), diselaraskan dengan standar silabus Olimpiade Sains Nasional (OSN) tingkat dasar.',
  },
  'Jenjang 2': {
    icon: '📐',
    label: 'Jenjang 2',
    subLabel: 'Kelas 2 KMI',
    color: '#0284C7',
    accentBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    curriculumNote:
      'Silabus resmi mencakup pendalaman mekanika fisika fluida, sistem fisiologi biologi organ manusia, serta aljabar kuadrat dan geometri dalil lingkaran kelas 2 KMI yang disinkronkan dengan silabus OSN IPA-Matematika.',
  },
  'Jenjang 3': {
    icon: '🔬',
    label: 'Jenjang 3',
    subLabel: 'Kelas 3 KMI & 1 Intensif',
    color: '#7C3AED',
    accentBg: '#F5F3FF',
    borderColor: '#DDD6FE',
    curriculumNote:
      'Silabus resmi dirancang untuk santri Kelas 3 KMI & 1 Intensif dengan cakupan kelistrikan, kemagnetan, sistem regulasi tubuh, pewarisan sifat Mendel, dan geometri ruang tiga dimensi berstandar olimpiade nasional.',
  },
  'Jenjang 4': {
    icon: '🧪',
    label: 'Jenjang 4',
    subLabel: 'Kelas 4 KMI & 3 Intensif',
    color: '#D97706',
    accentBg: '#FFFBEB',
    borderColor: '#FDE68A',
    curriculumNote:
      'Silabus materi pengujian tingkat menengah-atas untuk santri Kelas 4 KMI & 3 Intensif berfokus pada kinematika vektor, dinamika Newton, genetika dihibrid, eksponensial kompleks, dan trigonometri analitis.',
  },
  'Jenjang 5': {
    icon: '🏆',
    label: 'Jenjang 5',
    subLabel: 'Kelas 5 KMI',
    color: '#BE123C',
    accentBg: '#FFF1F2',
    borderColor: '#FECDD3',
    curriculumNote:
      'Tingkat kompetisi sains terlengkap di KMI (MAFIKIB: Matematika, Fisika, Kimia, Biologi). Menekankan sejarah sains Islam, stoikiometri mol kimiawi, kalkulus limit, rangkaian Kirchhoff, dan neurobiologi lanjutan.',
  },
}

const getSubjectBadgeStyle = (subj: string) => {
  const s = subj.toLowerCase()
  if (s.includes('fisika')) {
    return {
      badge: 'bg-sky-50 text-sky-800 border-sky-200',
      headerBg: 'bg-gradient-to-r from-sky-50 to-blue-50/60',
      headerText: 'text-sky-900',
      dotColor: 'bg-sky-500',
      iconEmoji: '⚡',
    }
  }
  if (s.includes('biologi')) {
    return {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      headerBg: 'bg-gradient-to-r from-emerald-50 to-teal-50/60',
      headerText: 'text-emerald-900',
      dotColor: 'bg-emerald-600',
      iconEmoji: '🌿',
    }
  }
  if (s.includes('kimia')) {
    return {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      headerBg: 'bg-gradient-to-r from-amber-50 to-orange-50/60',
      headerText: 'text-amber-900',
      dotColor: 'bg-amber-500',
      iconEmoji: '🧪',
    }
  }
  if (s.includes('matematika')) {
    return {
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      headerBg: 'bg-gradient-to-r from-indigo-50 to-purple-50/60',
      headerText: 'text-indigo-900',
      dotColor: 'bg-indigo-600',
      iconEmoji: '📐',
    }
  }
  return {
    badge: 'bg-slate-50 text-slate-800 border-slate-200',
    headerBg: 'bg-slate-50',
    headerText: 'text-slate-900',
    dotColor: 'bg-slate-500',
    iconEmoji: '📚',
  }
}

export const SilabusPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [syllabuses, setSyllabuses] = useState<SyllabusItem[]>([])
  const [selectedJenjang, setSelectedJenjang] = useState<StudentJenjang>('Jenjang 1')
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all')

  // Modals for admin upload/edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formJenjang, setFormJenjang] = useState<StudentJenjang>('Jenjang 1')
  const [formSubject, setFormSubject] = useState('Matematika & Sains')
  const [formDescription, setFormDescription] = useState('')
  const [formFileName, setFormFileName] = useState('')
  const [formFileSize, setFormFileSize] = useState('14.8 KB')
  const [formPages, setFormPages] = useState<number>(18)
  const [formPublished, setFormPublished] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const loadData = () => {
    const list = materiService.getSyllabuses(!isSuperAdmin)
    setSyllabuses(list)
  }

  useEffect(() => {
    loadData()
  }, [isSuperAdmin])

  const activeSyllabus = syllabuses.find((s) => s.jenjang === selectedJenjang)
  const config = JENJANG_CONFIG[selectedJenjang]

  const availableSubjects: string[] = activeSyllabus?.breakdown
    ? activeSyllabus.breakdown.map((b) => b.subject)
    : activeSyllabus?.subjects || ['Fisika', 'Biologi', 'Matematika']

  const filteredBreakdown = activeSyllabus?.breakdown?.filter((b) => {
    if (activeSubjectFilter === 'all') return true
    return b.subject.toLowerCase() === activeSubjectFilter.toLowerCase()
  })

  const totalTopics =
    activeSyllabus?.breakdown?.reduce((acc, curr) => acc + curr.topics.length, 0) || 0

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormJenjang(selectedJenjang)
    setFormSubject('Matematika & Sains')
    setFormDescription('')
    setFormFileName('Silabus_OGSO_2026.xlsx')
    setFormFileSize('14.8 KB')
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
    setFormFileSize(item.file_size || '14.8 KB')
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

  const handleDownload = (item?: SyllabusItem) => {
    const link = document.createElement('a')
    link.href = item?.file_url || '/documents/Silabus_OGSO_2026.xlsx'
    link.download = item?.file_name || 'Silabus_OGSO_2026.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-12 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION — INPIRED BY EMC COMPETZY MATERI                          */}
      {/* ========================================================================= */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 sm:-mt-12 px-6 sm:px-10 lg:px-12 pt-12 pb-14 bg-gradient-to-b from-[#0C241B]/5 via-emerald-50/20 to-white border-b border-emerald-950/10 overflow-hidden">
        {/* Subtle background coordinate grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(22, 101, 52, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(22, 101, 52, 0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient glow orb */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-500">
            <Link to="/" className="hover:text-emerald-700 transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-emerald-800">Materi & Silabus</span>
          </div>

          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Silabus & Panduan Materi Resmi OGSO 2026
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0C241B] tracking-tight leading-tight">
            <span className="text-emerald-700">Silabus & Materi</span> Lomba OGSO 2026
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            Pelajari kurikulum resmi per jenjang (Kelas 1–5 KMI), keterangan buku teks yang
            digunakan dari Darussalam Press & referensi nasional, serta kisi-kisi topik pengujian
            untuk persiapan terbaik delegasi santri Pondok Modern Darussalam Gontor.
          </p>

          {/* Action CTAs with generous whitespace */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="/documents/Silabus_OGSO_2026.xlsx"
              download="Silabus_OGSO_2026.xlsx"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-white font-bold text-xs sm:text-sm tracking-wide bg-[#166534] hover:bg-[#14532D] shadow-sm hover:shadow-md transition-all"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Unduh Silabus Resmi (.xlsx)</span>
            </a>

            <a
              href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border-2 border-emerald-800/20 bg-white hover:bg-emerald-50/50 text-[#166534] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Unduh JUKLAK Petunjuk Teknis (.pdf)</span>
            </a>

            <Link
              to="/materi/bank-soal"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-slate-700 hover:text-emerald-800 font-semibold text-xs sm:text-sm tracking-wide hover:bg-slate-100 transition-colors"
            >
              <span>Bank Soal & Arsip Latihan</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                leftIcon={<Plus className="w-4 h-4 mr-2" />}
                className="ml-auto"
              >
                Upload Silabus Baru
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STICKY JENJANG TABS (EMC COMPETZY STYLE)                               */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-xs -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 overflow-x-auto no-scrollbar py-1">
          {JENJANG_TABS.map((tab) => {
            const itemConfig = JENJANG_CONFIG[tab]
            const isSelected = selectedJenjang === tab

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setSelectedJenjang(tab)
                  setActiveSubjectFilter('all')
                }}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'bg-[#166534] text-white shadow-sm ring-2 ring-emerald-600/30 ring-offset-1'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                )}
              >
                <span className="text-base">{itemConfig.icon}</span>
                <span>{itemConfig.label}</span>
                <span
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-md',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {itemConfig.subLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE JENJANG BANNER & OVERVIEW                                       */}
      {/* ========================================================================= */}
      {activeSyllabus ? (
        <div className="space-y-10">
          {/* Header Card with Accent Colors */}
          <div
            className="rounded-2xl p-6 sm:p-8 border shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{
              backgroundColor: config.accentBg,
              borderColor: config.borderColor,
            }}
          >
            <div className="flex items-start sm:items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xs shrink-0"
                style={{ backgroundColor: config.color, color: '#ffffff' }}
              >
                {config.icon}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {activeSyllabus.title}
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                    Target: {activeSyllabus.target_kelas || config.subLabel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {config.curriculumNote}
                </p>
              </div>
            </div>

            {/* Quick Metrics & Excel Download */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500 font-medium">Cakupan Topik</div>
                <div className="text-lg font-bold text-slate-900">{totalTopics} Materi Ujian</div>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(activeSyllabus)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 text-slate-800 text-xs font-bold shadow-xs hover:shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Unduh Excel</span>
              </button>

              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => handleOpenEdit(activeSyllabus)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    title="Edit Silabus"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(activeSyllabus.id, activeSyllabus.title)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. KETERANGAN BUKU YANG DIGUNAKAN (NEW FEATURE REQUESTED BY USER)         */}
          {/* ========================================================================= */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Library className="w-4 h-4 text-emerald-700" />
                  <span>Sumber Belajar & Literatur Resmi</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0C241B]">
                  Keterangan Buku Referensi yang Digunakan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                  Seluruh materi dan kisi-kisi soal OGSO 2026 bersumber langsung dari buku teks resmi
                  Kulliyatu-l-Mu’allimin Al-Islamiyah (KMI) terbitan Darussalam Press serta buku
                  pendamping berstandar olimpiade nasional.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Kurikulum KMI Terverifikasi
                </span>
              </div>
            </div>

            {/* Grid of Book Reference Cards with Generous Whitespace */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeSyllabus.book_references && activeSyllabus.book_references.length > 0 ? (
                activeSyllabus.book_references.map((book, idx) => {
                  const isWajib = book.type === 'wajib'
                  const subjStyle = getSubjectBadgeStyle(book.subject)

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md',
                        isWajib
                          ? 'bg-white border-emerald-900/15 hover:border-emerald-600/50 ring-1 ring-emerald-500/10'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="space-y-3.5">
                        {/* Type & Subject Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border',
                              isWajib
                                ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/80'
                                : 'bg-sky-100/80 text-sky-900 border-sky-300/80'
                            )}
                          >
                            {isWajib ? '📖 Buku Teks Wajib KMI' : '📘 Referensi Pengayaan OSN'}
                          </span>

                          <span
                            className={cn(
                              'text-[11px] font-semibold px-2.5 py-0.5 rounded-md border',
                              subjStyle.badge
                            )}
                          >
                            {subjStyle.iconEmoji} {book.subject}
                          </span>
                        </div>

                        {/* Book Title */}
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                            {book.title}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{book.authorOrPublisher}</span>
                          </p>
                        </div>

                        {/* Chapters / Scope Coverage */}
                        {book.chaptersOrCoverage && (
                          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">
                              Cakupan Bab & Fokus:
                            </span>
                            <p className="leading-relaxed">{book.chaptersOrCoverage}</p>
                          </div>
                        )}

                        {/* Description */}
                        {book.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {book.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>{book.editionOrYear || 'Edisi Resmi KMI'}</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Standar Pengujian
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Keterangan buku referensi sedang disinkronkan oleh panitia.
                </div>
              )}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. TOPIC CARDS GRID (EXACT EMC COMPETZY GRID STYLE)                       */}
          {/* ========================================================================= */}
          <section className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Atom className="w-4 h-4 text-emerald-700" />
                  <span>Struktur Materi & Kisi-Kisi Ujian</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0C241B]">
                  Kisi-Kisi Soal per Bidang Studi
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Daftar bab dan kompetensi materi yang akan diujikan dalam babak penyisihan dan final.
                </p>
              </div>

              {/* Subject Filter Sub-tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubjectFilter('all')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    activeSubjectFilter === 'all'
                      ? 'bg-[#166534] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Semua Bidang ({totalTopics})
                </button>
                {availableSubjects.map((subj) => {
                  const isCurActive = activeSubjectFilter.toLowerCase() === subj.toLowerCase()
                  const subjCount =
                    activeSyllabus.breakdown?.find(
                      (b) => b.subject.toLowerCase() === subj.toLowerCase()
                    )?.topics.length || 0

                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setActiveSubjectFilter(subj)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
                        isCurActive
                          ? 'bg-[#166534] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      <span>{subj}</span>
                      <span className="opacity-75 text-[10px]">({subjCount})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Grid of Subject Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBreakdown && filteredBreakdown.length > 0 ? (
                filteredBreakdown.map((subjGroup) => {
                  const style = getSubjectBadgeStyle(subjGroup.subject)

                  return (
                    <div
                      key={subjGroup.subject}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Banner */}
                        <div
                          className={cn(
                            'px-5 py-4 border-b border-slate-100 flex items-center justify-between',
                            style.headerBg
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{style.iconEmoji}</span>
                            <h4 className={cn('font-extrabold text-base', style.headerText)}>
                              {subjGroup.subject}
                            </h4>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/80 border border-slate-200 text-slate-700 shadow-2xs">
                            {subjGroup.topics.length} Topik
                          </span>
                        </div>

                        {/* Topic List Items with generous breathing space */}
                        <div className="p-5 flex flex-col gap-3">
                          {subjGroup.topics.map((topic, tIdx) => (
                            <div
                              key={tIdx}
                              className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full mt-2 shrink-0 ring-4 ring-slate-100',
                                  style.dotColor
                                )}
                              />
                              <div className="space-y-0.5 flex-1">
                                <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                  {topic.title}
                                </div>
                                {(topic.focus || topic.kelas) && (
                                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    {topic.kelas && (
                                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                        Kelas {topic.kelas}
                                      </span>
                                    )}
                                    {topic.focus && (
                                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                                        {topic.focus}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Standar Pengujian Soal Isian & CBT</span>
                        <span className="font-semibold text-emerald-800">
                          {config.subLabel}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Tidak ada topik untuk bidang studi yang dipilih.
                </div>
              )}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 6. STRATEGI BELAJAR UNTUK SANTRI (INSPIRED BY EMC TIPS PERSIAPAN)        */}
          {/* ========================================================================= */}
          <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-slate-50 to-white border border-slate-200 shadow-xs space-y-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Brain className="w-4 h-4 text-emerald-700" />
                <span>Tips & Panduan Peserta</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
                Strategi Belajar & Persiapan Olimpiade Sains
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Soal OGSO 2026 dirancang menantang, berorientasi logika ilmiah tingkat tinggi (HOTS),
                dan menguji ketepatan isian. Berikut strategi belajar yang direkomendasikan bagi santri
                dan guru pembimbing kontingen.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  emoji: '📚',
                  title: 'Kuasai Konsep Buku Teks KMI',
                  desc: 'Soal OGSO berakar kuat pada diktat resmi KMI Darussalam Press. Pastikan memahami mengapa rumus bekerja secara mendasar, bukan sekadar hafalan mekanis.',
                },
                {
                  emoji: '⏱️',
                  title: 'Latih Manajemen Waktu 90 Menit',
                  desc: 'Total durasi ujian 90 menit untuk 40–50 soal isian singkat (rata-rata 1.8–2 menit per soal). Latih santri untuk memilah soal yang paling cepat diselesaikan terlebih dahulu.',
                },
                {
                  emoji: '🧠',
                  title: 'Pelajari Arsip Bank Soal Tahun Lalu',
                  desc: 'Naskah soal penyisihan dan final tahun-tahun sebelumnya dapat diunduh gratis pada menu Bank Soal untuk mengenal ragam tipe soal dan pola pengujian.',
                },
                {
                  emoji: '✍️',
                  title: 'Biasakan Mengerjakan Soal Isian Singkat',
                  desc: 'Seluruh soal disajikan dalam bentuk isian singkat tanpa opsi pilihan ganda. Ketelitian menghitung angka akhir dan satuan sangat menentukan poin penilaian.',
                },
                {
                  emoji: '🔍',
                  title: 'Cermat Membaca Soal & Satuan Fisika',
                  desc: 'Perhatikan konversi satuan (misalnya gram ke kg, cm ke meter) dan pembulatan angka desimal yang diminta pada instruksi soal CBT.',
                },
                {
                  emoji: '💻',
                  title: 'Ikuti Simulasi Safe Exam Browser (SEB)',
                  desc: 'Manfaatkan masa simulasi CBT terpadu antar-kampus (31 Okt – 3 Nov 2026) untuk memastikan perangkat lab komputer dan akun peserta tidak mengalami kendala teknis.',
                },
              ].map((tip, tIdx) => (
                <div
                  key={tIdx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <span className="text-3xl block">{tip.emoji}</span>
                  <h4 className="font-bold text-base text-slate-900 leading-snug">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 7. BOTTOM CALLOUT / DOWNLOAD DOKUMEN RESMI                                */}
          {/* ========================================================================= */}
          <div className="rounded-2xl p-6 sm:p-8 bg-[#0C241B] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Dokumen Resmi Panitia
              </span>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                Unduh Seluruh Dokumen Silabus & Petunjuk Teknis
              </h4>
              <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl">
                File Excel mencakup seluruh jenjang 1 hingga 5 lengkap dengan rincian topik per bidang
                studi dan daftar buku referensi Darussalam Press.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              <a
                href="/documents/Silabus_OGSO_2026.xlsx"
                download="Silabus_OGSO_2026.xlsx"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0C241B] font-extrabold text-xs tracking-wide transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Silabus (.xlsx)</span>
              </a>

              <Link
                to="/materi/bank-soal"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-white font-bold text-xs tracking-wide transition-all"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Buka Bank Soal</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Silabus Belum Ditemukan"
          description="Silabus untuk jenjang ini belum diterbitkan atau sedang dalam penyusunan oleh panitia."
        />
      )}

      {/* ========================================================================= */}
      {/* ADMIN EDIT / ADD MODAL                                                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Dokumen Silabus' : 'Upload Silabus Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Judul Silabus</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Silabus Resmi OGSO 2026 Jenjang 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Jenjang</label>
                  <select
                    value={formJenjang}
                    onChange={(e) => setFormJenjang(e.target.value as StudentJenjang)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  >
                    {JENJANG_TABS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Bidang Studi</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Fisika, Biologi, Matematika"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Penjelasan ringkas cakupan materi silabus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="formPublished"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="formPublished" className="text-xs font-semibold text-slate-700">
                  Publikasikan silabus ini ke santri dan publik
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
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
