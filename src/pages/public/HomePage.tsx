import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Download,
  BookOpen,
  Archive,
  Trophy,
  Award,
  Calendar,
  Compass,
  ChevronDown,
  ShieldCheck,
  Atom,
  Binary,
  Microscope,
  FlaskConical,
  Clock,
  HelpCircle,
  LogIn,
  School,
  GraduationCap,
  Columns3,
  CalendarDays,
  Moon,
  FileText,
} from 'lucide-react'
import {
  websiteContentService,
  type WebsiteContentConfig,
} from '../../services/websiteContentService'
import { PhotoMarqueeGallery } from '../../components/public/PhotoMarqueeGallery'
import { cn } from '../../lib/utils'
import { getWhatsAppLink } from '../../lib/whatsapp'

export const HomePage: React.FC = () => {
  const [content, setContent] = useState<WebsiteContentConfig>(() =>
    websiteContentService.getContent()
  )
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [activeTimelineCategory, setActiveTimelineCategory] = useState<string>('all')
  const [timelineViewMode, setTimelineViewMode] = useState<'kanban' | 'calendar'>('kanban')
  const [calendarMonthFilter, setCalendarMonthFilter] = useState<'all' | '10' | '11' | '12'>('all')

  useEffect(() => {
    const handleUpdate = () => {
      setContent(websiteContentService.getContent())
    }
    window.addEventListener('ogsoreg_website_content_updated', handleUpdate)
    return () => window.removeEventListener('ogsoreg_website_content_updated', handleUpdate)
  }, [])

  const filteredTimeline = content.timeline.filter((item) => {
    if (activeTimelineCategory === 'all') return true
    if (activeTimelineCategory === 'penyisihan') return item.category === 'penyisihan'
    if (activeTimelineCategory === 'final') return item.category === 'final'
    if (activeTimelineCategory === 'seremoni')
      return (
        item.category === 'seremoni' ||
        item.category === 'persiapan' ||
        item.category === 'simulasi' ||
        item.category === 'penutupan'
      )
    return true
  })

  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B]">
      {/* ========================================================================= */}
      {/* SECTION 01 — HERO SECTION (Deep Forest Palette with Cinematic Stage & Geometry) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[96vh] bg-[#071510] text-white overflow-hidden flex items-center justify-center py-24 lg:py-32">
        {/* Layer 1: Real Auditorium Stage Photo Ambient Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/foto/IMG_20251123_201518_980.jpg"
            alt=""
            className="w-full h-full object-cover object-center opacity-30 filter saturate-150 contrast-125 mix-blend-luminosity scale-105"
          />
          {/* Multi-layered dark forest vignette for optimal text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C241B]/92 via-[#0A1E17]/85 to-[#071510]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(7,21,16,0.92)_75%)]" />
        </div>

        {/* Layer 2: Luminous Top Celestial God Rays & Emerald-Gold Aurora */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-emerald-400/25 via-emerald-600/10 to-transparent blur-3xl pointer-events-none animate-beam-pulse" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-[radial-gradient(ellipse_at_top,rgba(213,196,154,0.2)_0%,transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-emerald-500/20 via-emerald-800/10 to-transparent blur-3xl pointer-events-none animate-glow-pulse" />
        <div className="absolute top-12 left-10 w-96 h-96 bg-radial from-[#166534]/35 to-transparent blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-radial from-[#A7F3D0]/15 to-transparent blur-3xl pointer-events-none animate-float-reverse" />

        {/* Layer 3: Sacred Islamic 8-Point Star Mandala Rotator (Center-Background Watermark) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] pointer-events-none opacity-15 animate-spin-very-slow hidden md:block">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="#A7F3D0" strokeWidth="0.65">
            <circle cx="100" cy="100" r="96" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="72" />
            <rect x="36" y="36" width="128" height="128" stroke="#A7F3D0" />
            <rect x="36" y="36" width="128" height="128" stroke="#A7F3D0" transform="rotate(45 100 100)" />
            <polygon points="100,6 124,76 194,100 124,124 100,194 76,124 6,100 76,76" stroke="#D5C49A" strokeWidth="0.5" />
            <polygon points="100,16 120,80 184,100 120,120 100,184 80,120 16,100 80,80" stroke="#10B981" strokeWidth="0.5" transform="rotate(22.5 100 100)" />
            <circle cx="100" cy="100" r="46" strokeDasharray="2 4" stroke="#A7F3D0" />
            <circle cx="100" cy="100" r="24" fill="#A7F3D0" fillOpacity="0.06" />
          </svg>
        </div>

        {/* Layer 4: Orbiting Wireframe Scientific Atom Rings */}
        <div className="absolute -right-24 top-1/4 w-[420px] h-[420px] pointer-events-none opacity-20 hidden lg:block">
          <div className="w-full h-full border-2 border-dashed border-[#A7F3D0] rounded-full animate-orbit" />
          <div className="absolute inset-8 border border-emerald-400 rounded-full animate-orbit-reverse" />
          <div className="absolute inset-20 border border-[#D5C49A] rounded-full animate-orbit" />
        </div>

        <div className="absolute -left-24 bottom-16 w-96 h-96 pointer-events-none opacity-15 hidden lg:block">
          <div className="w-full h-full border border-dashed border-[#A7F3D0] rounded-full animate-orbit-reverse" />
          <div className="absolute inset-10 border border-[#166534] rounded-full animate-orbit" />
          <div className="absolute inset-24 border border-emerald-300 rounded-full animate-orbit" />
        </div>

        {/* Layer 5: Cyber-Academic Perspective Floor Grid */}
        <div className="absolute bottom-0 left-0 right-0 h-44 hero-perspective-grid pointer-events-none opacity-35" />

        {/* Layer 6: Floating 3D Glass Badges (Desktop Side Accents) */}
        <div className="hidden 2xl:flex absolute left-10 top-1/3 -translate-y-1/2 items-center gap-3.5 p-3.5 rounded-2xl glass-panel-dark border border-emerald-400/30 shadow-2xl animate-float-slow pointer-events-none backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[#A7F3D0] shadow-inner">
            <Atom className="w-6 h-6 animate-spin-very-slow" />
          </div>
          <div className="text-left pr-2">
            <div className="text-xs font-bold text-white tracking-wide">MAFIKIB Modern</div>
            <div className="text-[10px] text-emerald-300/80">Matematika • Fisika • Kimia • Biologi</div>
          </div>
        </div>

        <div className="hidden 2xl:flex absolute right-10 top-1/3 -translate-y-1/2 items-center gap-3.5 p-3.5 rounded-2xl glass-panel-dark border border-[#D5C49A]/40 shadow-2xl animate-float-reverse pointer-events-none backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[#D5C49A] shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-left pr-2">
            <div className="text-xs font-bold text-white tracking-wide">Ayat-Ayat Kauniyah</div>
            <div className="text-[10px] text-amber-200/80">Integrasi Nilai Qur’ani & Sains</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Official Event Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400/40 text-xs font-semibold tracking-wide text-[#A7F3D0] shadow-lg shadow-emerald-950/60 backdrop-blur-md hover:border-emerald-300 transition-colors">
              <img src="/logo.png" alt="Logo OGSO" className="w-4 h-4 object-contain" />
              <span>{content.competitionInfo.name} {content.competitionInfo.arabicYear}/{content.competitionInfo.masehiYear}</span>
            </div>

            {/* Creative Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans drop-shadow-md">
              Where Knowledge{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A7F3D0] via-[#86EFAC] to-[#D5C49A] drop-shadow-sm">
                Meets Discovery.
              </span>
            </h1>

            {/* Official Indonesian Competition Theme */}
            <div className="max-w-3xl mx-auto">
              <blockquote className="text-base sm:text-xl font-medium text-[#D5C49A] italic px-6 py-3.5 border-y border-emerald-500/30 bg-emerald-950/60 rounded-2xl backdrop-blur-md shadow-2xl">
                “{content.hero.officialTheme}”
              </blockquote>
            </div>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-sm">
              {content.hero.subheadline}
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/pendaftaran"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] via-[#86EFAC] to-[#4ADE80] hover:from-[#86EFAC] hover:to-[#22C55E] shadow-xl shadow-emerald-950/60 hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-300 shimmer-sweep"
              >
                <span>{content.hero.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#tentang"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-emerald-100 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/40 hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md"
              >
                <Compass className="w-4 h-4 text-[#A7F3D0]" />
                <span>{content.hero.secondaryCtaText}</span>
              </a>

              <a
                href={content.hero.officialJuklakUrl}
                download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-xs text-[#D5C49A] bg-emerald-950/50 hover:bg-emerald-900/70 border border-[#D5C49A]/40 hover:border-[#D5C49A]/70 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md"
                title="Unduh Petunjuk Pelaksanaan (JUKLAK) Resmi PDF"
              >
                <Download className="w-4 h-4" />
                <span>Unduh JUKLAK 2026</span>
              </a>
            </div>

            {/* Key Facts Highlights Strip (Elevated Interactive Glass Cards with Rich Icons) */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 max-w-4xl mx-auto">
              <div className="p-4 sm:p-5 rounded-2xl glass-panel-dark border border-emerald-400/20 hover:-translate-y-2 hover:border-[#A7F3D0]/60 hover:shadow-[0_0_25px_rgba(167,243,208,0.2)] transition-all duration-300 shimmer-sweep group cursor-default text-left relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-[#A7F3D0] transition-colors">20</div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <School className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#A7F3D0] uppercase tracking-wider">Kampus Cabang</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">Delegasi se-Indonesia</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl glass-panel-dark border border-amber-400/20 hover:-translate-y-2 hover:border-[#D5C49A]/60 hover:shadow-[0_0_25px_rgba(213,196,154,0.2)] transition-all duration-300 shimmer-sweep group cursor-default text-left relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-[#D5C49A] transition-colors">5</div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-[#D5C49A] border border-amber-500/20">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#D5C49A] uppercase tracking-wider">Jenjang Tingkat</div>
                <div className="text-[10px] text-amber-200/80 mt-0.5">Kelas 1 hingga Kelas 5 KMI</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl glass-panel-dark border border-emerald-400/20 hover:-translate-y-2 hover:border-[#A7F3D0]/60 hover:shadow-[0_0_25px_rgba(167,243,208,0.2)] transition-all duration-300 shimmer-sweep group cursor-default text-left relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-[#A7F3D0] transition-colors">40</div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#A7F3D0] uppercase tracking-wider">Soal Isian</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">Short essay berbasis nalar</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl glass-panel-dark border border-teal-400/20 hover:-translate-y-2 hover:border-[#A7F3D0]/60 hover:shadow-[0_0_25px_rgba(45,212,191,0.2)] transition-all duration-300 shimmer-sweep group cursor-default text-left relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-[#A7F3D0] transition-colors">90</div>
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#A7F3D0] uppercase tracking-wider">Menit Ujian</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">CBT via Safe Exam Browser</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 01.5 — RUNNING TEXT PHOTO GALLERY (Dokumentasi & Kilas Balik)     */}
      {/* ========================================================================= */}
      <PhotoMarqueeGallery variant="light" />

      {/* ========================================================================= */}
      {/* SECTION 02 — ABOUT OGSO (Editorial & Academic Philosophy) */}
      {/* ========================================================================= */}
      <section id="tentang" className="py-20 lg:py-28 bg-[#F5F8F4] border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading & Philosophy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-[#166534]" />
                <span>Tentang Kompetisi</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0C241B] leading-tight">
                Integrasi 100% Ilmu Agama & 100% Ilmu Sains
              </h2>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                <strong>Inter-Campus Online Gontor Science Olympiad (OGSO)</strong> adalah kegiatan edukasi dan ajang talenta sains berbentuk perlombaan daring yang diselenggarakan untuk mengasah kecerdasan, meningkatkan kemampuan akademik, dan memperluas wawasan santri di seluruh kampus Pondok Modern Darussalam Gontor di Indonesia.
              </p>

              <div className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all space-y-3 relative overflow-hidden group">
                <div className="text-xs font-extrabold uppercase tracking-widest text-[#166534] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Falsafah Trimurti Pendiri Pondok</span>
                </div>
                <blockquote className="text-sm italic text-slate-800 leading-relaxed font-medium">
                  “Kegiatan ini adalah wujud nyata menyeimbangkan ilmu pengetahuan umum dan agama, sebagaimana yang dicanangkan Trimurti: 100% ilmu agama dan 100% ilmu umum demi meregenerasi ulama yang intelek, bukan intelek yang sekadar tahu agama.”
                </blockquote>
                <div className="text-xs font-bold text-slate-500 text-right">
                  — Petunjuk Pelaksanaan Resmi OGSO 1448/2026
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/tentang"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#166534] hover:text-[#0C241B] group"
                >
                  <span>Baca Selengkapnya Profil & Tujuan Kegiatan</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Column: 4 Pillars of Excellence (Interactive Hover Cards) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4.5">
              <div className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#166534] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-[#166534] group-hover:text-white transition-all duration-300">
                  <Atom className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Kecerdasan Saintifik</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menumbuhkan kecintaan terhadap sains dan teknologi melalui penalaran logika dan problem-solving yang kokoh.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#166534] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-[#166534] group-hover:text-white transition-all duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Integritas & Kejujuran</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pelaksanaan diawasi secara terpusat dengan Safe Exam Browser dan pemantauan kamera sudut luas via Zoom.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#166534] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-[#166534] group-hover:text-white transition-all duration-300">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Konektivitas 20 Kampus</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menghubungkan 12 kampus putra dan 8 kampus putri dalam wadah kompetisi yang sportif dan penuh ukhuwah.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#166534] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-[#166534] group-hover:text-white transition-all duration-300">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Kurikulum KMI Terpadu</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Materi disusun relevan dengan kurikulum Kulliyatu-l-Mu’allimin Al-Islamiyah dan standar olimpiade nasional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 03 — EXPLORE THE SCIENCES (4 Bidang Studi MAFIKIB) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <span>Bidang Keilmuan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
              Eksplorasi Empat Pilar Sains (MAFIKIB)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Materi olimpiade menguji pemahaman konseptual dan aplikasi analitis santri dalam empat bidang ilmu alam dan eksak.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Matematika */}
            <div className="relative overflow-hidden group p-7 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-950/5 transition-all duration-300 flex flex-col justify-between">
              {/* Background Watermark Icon */}
              <Binary className="absolute -right-5 -top-5 w-32 h-32 text-indigo-500/10 group-hover:text-indigo-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10">
                {/* Header: Icon Box & Badge */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-700 to-[#166534] text-white flex items-center justify-center shadow-md shadow-indigo-900/10 group-hover:scale-105 group-hover:shadow-indigo-600/25 transition-all duration-300 shrink-0">
                    <Binary className="w-7 h-7 text-[#A7F3D0]" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/70 shadow-2xs">
                    Jenjang 1 – 5
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-indigo-900 transition-colors">
                    Matematika
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[64px]">
                    Aljabar, aritmetika, geometri, trigonometri, barisan dan deret, hingga kalkulus limit fungsi dan statistika analitik.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 relative z-10 flex items-center justify-between gap-3">
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 hover:text-indigo-950 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                  Kelas 1–5
                </span>
              </div>
            </div>

            {/* 2. Fisika */}
            <div className="relative overflow-hidden group p-7 rounded-3xl bg-white border border-slate-200 hover:border-sky-400 hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-950/5 transition-all duration-300 flex flex-col justify-between">
              {/* Background Watermark Icon */}
              <Atom className="absolute -right-5 -top-5 w-32 h-32 text-sky-500/10 group-hover:text-sky-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-700 to-[#166534] text-white flex items-center justify-center shadow-md shadow-sky-900/10 group-hover:scale-105 group-hover:shadow-sky-600/25 transition-all duration-300 shrink-0">
                    <Atom className="w-7 h-7 text-[#A7F3D0]" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200/70 shadow-2xs">
                    Jenjang 1 – 5
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-sky-900 transition-colors">
                    Fisika
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[64px]">
                    Pengukuran, mekanika Newton, getaran & gelombang, optika geometri, termodinamika kalor, hingga elektromagnetika modern.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 relative z-10 flex items-center justify-between gap-3">
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 hover:text-sky-950 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                  Kelas 1–5
                </span>
              </div>
            </div>

            {/* 3. Biologi */}
            <div className="relative overflow-hidden group p-7 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col justify-between">
              {/* Background Watermark Icon */}
              <Microscope className="absolute -right-5 -top-5 w-32 h-32 text-emerald-500/10 group-hover:text-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#166534] to-[#0A2E1A] text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:scale-105 group-hover:shadow-emerald-600/25 transition-all duration-300 shrink-0">
                    <Microscope className="w-7 h-7 text-[#A7F3D0]" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 shadow-2xs">
                    Jenjang 1 – 5
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-[#166534] transition-colors">
                    Biologi
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[64px]">
                    Organisasi kehidupan, fisiologi sistem manusia, botani, pewarisan sifat genetika, ekologi ekosistem, dan bioteknologi.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 relative z-10 flex items-center justify-between gap-3">
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534] hover:text-[#0C241B] group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                  Kelas 1–5
                </span>
              </div>
            </div>

            {/* 4. Kimia (Khusus Jenjang 5) */}
            <div className="relative overflow-hidden group p-7 rounded-3xl bg-white border border-amber-300/80 hover:border-amber-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-950/10 transition-all duration-300 flex flex-col justify-between">
              {/* Background Watermark Icon */}
              <FlaskConical className="absolute -right-5 -top-5 w-32 h-32 text-amber-500/10 group-hover:text-amber-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-yellow-600 to-[#166534] text-white flex items-center justify-center shadow-md shadow-amber-900/10 group-hover:scale-105 group-hover:shadow-amber-600/25 transition-all duration-300 shrink-0">
                    <FlaskConical className="w-7 h-7 text-amber-100" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 shadow-2xs">
                    Khusus Jenjang 5
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-amber-900 transition-colors">
                    Kimia
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[64px]">
                    Struktur atom, sistem periodik unsur, tata nama senyawa, persamaan reaksi, konsep mol, dan profil ilmuwan kimia Muslim.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 relative z-10 flex items-center justify-between gap-3">
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Kelas 5 KMI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 04 — COMPETITION CATEGORIES (5 Jenjang Tingkat) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#F5F8F4] border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <span>Struktur Kategori</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
              Lima Jenjang Kompetisi Santri
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Setiap kampus kontingen mendelegasikan tepat <strong>20 peserta</strong> (4 peserta pada masing-masing jenjang) sesuai pemetaan resmi KMI:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4.5">
            {/* Jenjang 1 */}
            <div className="group p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-lg group-hover:bg-[#166534] group-hover:text-white transition-colors">
                    Tingkat 1
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">4 Peserta</span>
                </div>
                <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-[#166534] transition-colors">Jenjang 1</h3>
                <div className="text-xs font-bold text-slate-800 bg-[#F5F8F4] p-3 rounded-xl border border-slate-200/60">
                  Kelas 1 KMI
                </div>
                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Materi Ujian:</div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" /><span>Matematika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" /><span>Fisika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" /><span>Biologi</span></div>
                </div>
              </div>
              <div className="pt-3.5 border-t border-slate-100 mt-4 text-[11px] text-slate-400 font-medium">
                Pondok Modern Darussalam Gontor
              </div>
            </div>

            {/* Jenjang 2 */}
            <div className="group p-6 sm:p-7 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-lg group-hover:bg-[#166534] group-hover:text-white transition-colors">
                    Tingkat 2
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">4 Peserta</span>
                </div>
                <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-[#166534] transition-colors">Jenjang 2</h3>
                <div className="text-xs font-bold text-slate-800 bg-[#F5F8F4] p-3 rounded-xl border border-slate-200/60">
                  Kelas 2 KMI
                </div>
                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Materi Ujian:</div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" /><span>Matematika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" /><span>Fisika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" /><span>Biologi</span></div>
                </div>
              </div>
              <div className="pt-3.5 border-t border-slate-100 mt-4 text-[11px] text-slate-400 font-medium">
                Pondok Modern Darussalam Gontor
              </div>
            </div>

            {/* Jenjang 3 */}
            <div className="group p-6 sm:p-7 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-lg group-hover:bg-[#166534] group-hover:text-white transition-colors">
                    Tingkat 3
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">4 Peserta</span>
                </div>
                <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-[#166534] transition-colors">Jenjang 3</h3>
                <div className="text-xs font-bold text-slate-800 bg-[#F5F8F4] p-3 rounded-xl border border-slate-200/60">
                  Kelas 1 Int & 3 KMI
                </div>
                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Materi Ujian:</div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" /><span>Matematika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" /><span>Fisika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" /><span>Biologi</span></div>
                </div>
              </div>
              <div className="pt-3.5 border-t border-slate-100 mt-4 text-[11px] text-slate-400 font-medium">
                Pondok Modern Darussalam Gontor
              </div>
            </div>

            {/* Jenjang 4 */}
            <div className="group p-6 sm:p-7 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-lg group-hover:bg-[#166534] group-hover:text-white transition-colors">
                    Tingkat 4
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">4 Peserta</span>
                </div>
                <h3 className="text-xl font-bold text-[#0C241B] group-hover:text-[#166534] transition-colors">Jenjang 4</h3>
                <div className="text-xs font-bold text-slate-800 bg-[#F5F8F4] p-3 rounded-xl border border-slate-200/60">
                  Kelas 3 Int & 4 KMI
                </div>
                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Materi Ujian:</div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" /><span>Matematika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" /><span>Fisika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" /><span>Biologi</span></div>
                </div>
              </div>
              <div className="pt-3.5 border-t border-slate-100 mt-4 text-[11px] text-slate-400 font-medium">
                Pondok Modern Darussalam Gontor
              </div>
            </div>

            {/* Jenjang 5 (Special Card with Emerald & Gold Glow) */}
            <div className="group p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-emerald-50/70 via-white to-white border-2 border-[#166534] shadow-md hover:border-emerald-600 hover:-translate-y-2.5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#A7F3D0]/40 to-transparent pointer-events-none rounded-bl-full" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white bg-[#166534] px-3 py-1 rounded-lg shadow-xs group-hover:bg-emerald-700 transition-colors">
                    Tingkat 5
                  </span>
                  <span className="text-[11px] font-bold text-white bg-emerald-800 px-3 py-0.5 rounded-full shadow-xs">4 Peserta</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0C241B]">Jenjang 5</h3>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-block mt-1">
                    Materi Lengkap + Kimia
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-950 bg-emerald-100/70 p-3 rounded-xl border border-emerald-300/80">
                  Kelas 5 KMI
                </div>
                <div className="space-y-2 text-xs text-slate-700 pt-1">
                  <div className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">Materi Terpadu:</div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" /><span>Matematika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" /><span>Fisika</span></div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" /><span>Biologi</span></div>
                  <div className="flex items-center gap-2.5 font-bold text-[#166534]"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /><span>Kimia Khusus</span></div>
                </div>
              </div>
              <div className="pt-3 border-t border-emerald-200 mt-4 text-[10px] text-[#166534] font-bold relative z-10">
                Tingkat Tertinggi KMI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 05 — COMPETITION TIMELINE (Kalender Kanban & Agenda Terjadwal)     */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header with View Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#166534]" />
                <span>Rangkaian Agenda & Alur Kompetisi</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B] tracking-tight">
                Jadwal Tentatif OGSO 2026
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seluruh rangkaian kegiatan dilaksanakan secara daring terkoordinasi antar-kampus
                Pondok Modern Darussalam Gontor di seluruh Indonesia.
              </p>
            </div>

            {/* View Mode Toggle & Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Kanban vs Calendar Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTimelineViewMode('kanban')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    timelineViewMode === 'kanban'
                      ? 'bg-[#166534] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  <span>Mode Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineViewMode('calendar')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    timelineViewMode === 'calendar'
                      ? 'bg-[#166534] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Mode Kalender</span>
                </button>
              </div>

              {/* Category Filter Tabs */}
              {timelineViewMode === 'kanban' ? (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Semua Fase' },
                    { id: 'seremoni', label: 'Persiapan' },
                    { id: 'penyisihan', label: 'Penyisihan' },
                    { id: 'final', label: 'Final' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTimelineCategory(tab.id)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                        activeTimelineCategory === tab.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-[#F5F8F4] text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Semua Bulan' },
                    { id: '10', label: 'Oktober 2026' },
                    { id: '11', label: 'November 2026' },
                    { id: '12', label: 'Desember 2026' },
                  ].map((month) => (
                    <button
                      key={month.id}
                      type="button"
                      onClick={() => setCalendarMonthFilter(month.id as any)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                        calendarMonthFilter === month.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-[#F5F8F4] text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: KANBAN BOARD VIEW                                                 */}
          {/* ========================================================================= */}
          {timelineViewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {[
                {
                  id: 'persiapan',
                  phaseNumber: '01',
                  title: 'Persiapan & Simulasi',
                  subtitle: 'Technical Meeting & SEB',
                  topBar: 'bg-sky-500',
                  headerBg: 'bg-sky-50/70 border-sky-200',
                  headerText: 'text-sky-900',
                  countBadge: 'bg-sky-100 text-sky-800',
                  itemFilter: (item: any) =>
                    (item.category === 'persiapan' || item.category === 'simulasi') &&
                    item.id !== 'pengumuman-penyisihan',
                },
                {
                  id: 'penyisihan',
                  phaseNumber: '02',
                  title: 'Pembukaan & Penyisihan',
                  subtitle: 'Ujian CBT Daring Terpusat',
                  topBar: 'bg-emerald-600',
                  headerBg: 'bg-emerald-50/70 border-emerald-200',
                  headerText: 'text-emerald-900',
                  countBadge: 'bg-emerald-100 text-emerald-800',
                  itemFilter: (item: any) =>
                    item.category === 'seremoni' || item.category === 'penyisihan',
                },
                {
                  id: 'evaluasi',
                  phaseNumber: '03',
                  title: 'Penjurian & Seleksi',
                  subtitle: 'Rekapitulasi Nilai & Finalis',
                  topBar: 'bg-amber-500',
                  headerBg: 'bg-amber-50/70 border-amber-200',
                  headerText: 'text-amber-900',
                  countBadge: 'bg-amber-100 text-amber-800',
                  itemFilter: (item: any) => item.id === 'pengumuman-penyisihan',
                },
                {
                  id: 'final',
                  phaseNumber: '04',
                  title: 'Babak Final & Awarding',
                  subtitle: 'Penentuan Juara & Medali',
                  topBar: 'bg-rose-600',
                  headerBg: 'bg-rose-50/70 border-rose-200',
                  headerText: 'text-rose-900',
                  countBadge: 'bg-rose-100 text-rose-800',
                  itemFilter: (item: any) =>
                    item.category === 'final' || item.category === 'penutupan',
                },
              ].map((column) => {
                const columnItems = filteredTimeline.filter(column.itemFilter)

                return (
                  <div
                    key={column.id}
                    className="flex flex-col rounded-2xl bg-slate-50/80 border border-slate-200 shadow-2xs overflow-hidden"
                  >
                    {/* Top colored accent line */}
                    <div className={cn('h-1.5 w-full', column.topBar)} />

                    {/* Column Header */}
                    <div
                      className={cn(
                        'px-4 py-3.5 border-b border-slate-200/80 flex items-center justify-between',
                        column.headerBg
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Fase {column.phaseNumber}
                          </span>
                        </div>
                        <h3 className={cn('text-sm font-extrabold leading-snug', column.headerText)}>
                          {column.title}
                        </h3>
                        <p className="text-[11px] text-slate-500">{column.subtitle}</p>
                      </div>

                      <span
                        className={cn(
                          'text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs',
                          column.countBadge
                        )}
                      >
                        {columnItems.length}
                      </span>
                    </div>

                    {/* Kanban Card List with generous whitespace */}
                    <div className="p-3.5 space-y-3.5 min-h-[300px]">
                      {columnItems.length > 0 ? (
                        columnItems.map((item) => {
                          const dateParts = item.dateDisplay.split(', ')
                          const dayName = dateParts[0] || 'Hari'
                          const dateStr = dateParts[1] || item.dateDisplay

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all p-4 space-y-3 group"
                            >
                              {/* Top Bar in Card: Category and Tentative status */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                    {item.category}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {dayName}, {dateStr.split(' ')[0]} {dateStr.split(' ')[1]}
                                  </span>
                                </div>
                                {item.isTentative && (
                                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                    Tentatif
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className="font-bold text-sm text-[#0C241B] leading-snug group-hover:text-emerald-800 transition-colors">
                                {item.title}
                              </h4>

                              {/* Target Levels */}
                              {item.levels && (
                                <div className="flex items-start gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                                  <School className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
                                  <span className="leading-snug">{item.levels}</span>
                                </div>
                              )}

                              {/* Date & Time with ample whitespace */}
                              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                  <Calendar className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                                  <span>{item.dateDisplay}</span>
                                </div>

                                {item.hijriDate && (
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-5.5">
                                    <Moon className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{item.hijriDate}</span>
                                  </div>
                                )}

                                {item.time && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600 pl-5.5">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{item.time}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          Tidak ada agenda dalam filter ini.
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: INTERACTIVE CALENDAR MONTH VIEW                                    */}
          {/* ========================================================================= */}
          {timelineViewMode === 'calendar' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTimeline
                  .filter((item) => {
                    if (calendarMonthFilter === 'all') return true
                    if (calendarMonthFilter === '10') return item.dateDisplay.includes('Oktober')
                    if (calendarMonthFilter === '11') return item.dateDisplay.includes('November')
                    if (calendarMonthFilter === '12') return item.dateDisplay.includes('Desember')
                    return true
                  })
                  .map((item) => {
                    const dateParts = item.dateDisplay.split(', ')
                    const dayName = dateParts[0] || 'Hari'
                    const dateStr = dateParts[1] || item.dateDisplay
                    const dayNum = dateStr.split(' ')[0] || ''
                    const monthName = dateStr.split(' ')[1] || ''

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Calendar Date Badge Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-[#166534] border border-emerald-200/80 flex flex-col items-center justify-center shrink-0 shadow-2xs font-black">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-800 leading-none">
                                  {dayName}
                                </span>
                                <span className="text-xl font-extrabold text-[#0C241B] leading-none mt-1">
                                  {dayNum}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-emerald-700 leading-none mt-0.5">
                                  {monthName}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-200">
                                  {item.category}
                                </span>
                                {item.isTentative && (
                                  <span className="ml-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Tentatif
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Agenda Title */}
                          <h4 className="font-extrabold text-base text-[#0C241B] leading-snug">
                            {item.title}
                          </h4>

                          {/* Target Levels */}
                          {item.levels && (
                            <div className="text-xs font-semibold text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                              Sasaran: {item.levels}
                            </div>
                          )}
                        </div>

                        {/* Timing and Hijri Dates */}
                        <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-[#166534]" />
                            <span>{item.time || 'Waktu Fleksibel'}</span>
                          </div>

                          {item.hijriDate && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-5.5">
                              <Moon className="w-3 h-3 text-slate-400" />
                              <span>{item.hijriDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 06 — AWARDS & RECOGNITION (Restrained Gold, Silver, Bronze) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#0C241B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-600/40 text-[#A7F3D0] text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
              <span>Apresiasi & Penghargaan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Apresiasi Prestasi Santri Saintis
            </h2>
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              Penghargaan resmi yang dianugerahkan kepada para finalis berprestasi dan kontingen kampus terbaik pada Babak Final OGSO 1448/2026.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* BARIS 1: PIALA JUARA UMUM KAMPUS (SUPREME HIGHLIGHT) */}
          {/* ========================================================================= */}
          <div className="mb-10 sm:mb-12">
            <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-950/70 via-emerald-950/80 to-amber-950/70 border-2 border-amber-400 shadow-2xl shadow-amber-500/25 overflow-hidden group hover:border-amber-300 hover:shadow-amber-400/35 transition-all duration-300 shimmer-sweep">
              {/* Ambient Glow & Decorative Elements */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-amber-400/25 via-amber-300/10 to-transparent pointer-events-none rounded-bl-full" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 lg:gap-10">
                {/* Left: Trophy Icon & Core Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-5 sm:gap-6 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-amber-950 flex items-center justify-center shadow-xl shadow-amber-500/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-950" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                      Juara Umum
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400/60 text-[#D5C49A] text-xs font-black uppercase tracking-widest shadow-inner">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Penghargaan Tertinggi Kontingen</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                      Piala Juara Umum Kampus
                    </h3>
                    <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed max-w-2xl font-normal">
                      Kampus kontingen dengan perolehan pemenang terbanyak dianugerahi <strong className="text-amber-300 font-bold">Piala Penghargaan Khusus</strong>.
                    </p>
                  </div>
                </div>

                {/* Right: Badge / Key Highlight Pill */}
                <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                  <div className="px-5 py-3.5 rounded-2xl bg-black/40 border border-amber-400/40 text-center space-y-0.5 backdrop-blur-md">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#D5C49A]">Kategori Kontingen</div>
                    <div className="text-sm sm:text-base font-extrabold text-white">Akumulasi Medali Terbanyak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BARIS 2: JUARA 1, 2, 3 (MEDALI EMAS, PERAK, PERUNGGU) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Juara 1 — Emas */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-950/50 via-emerald-950/40 to-black/60 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/10 text-center space-y-5 hover:-translate-y-3 hover:shadow-amber-400/25 transition-all duration-300 shimmer-sweep group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-400/20 to-transparent pointer-events-none rounded-bl-full" />

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-emerald-950 mx-auto flex items-center justify-center font-black shadow-xl shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Trophy className="w-10 h-10 text-amber-950" />
              </div>
              <div className="relative z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D5C49A] px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/40 inline-block">
                  Peringkat I
                </span>
                <h3 className="text-3xl font-black text-white mt-2">Juara 1</h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-400/30 text-xs text-amber-200 space-y-1 relative z-10">
                <div className="font-extrabold text-white text-sm">Medali Emas</div>
                <div className="text-amber-300/80 font-medium">+ Piagam Penghargaan Resmi</div>
              </div>
            </div>

            {/* Juara 2 — Perak */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900/50 via-emerald-950/40 to-black/60 border-2 border-slate-300/80 shadow-2xl shadow-slate-400/10 text-center space-y-5 hover:-translate-y-3 hover:shadow-slate-300/25 transition-all duration-300 shimmer-sweep group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-slate-300/20 to-transparent pointer-events-none rounded-bl-full" />

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-900 mx-auto flex items-center justify-center font-black shadow-xl shadow-slate-400/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Award className="w-10 h-10 text-slate-900" />
              </div>
              <div className="relative z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-400/40 inline-block">
                  Peringkat II
                </span>
                <h3 className="text-3xl font-black text-white mt-2">Juara 2</h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-400/30 text-xs text-slate-200 space-y-1 relative z-10">
                <div className="font-extrabold text-white text-sm">Medali Perak</div>
                <div className="text-slate-300/80 font-medium">+ Piagam Penghargaan Resmi</div>
              </div>
            </div>

            {/* Juara 3 — Perunggu */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-emerald-950/40 to-black/60 border-2 border-amber-600/80 shadow-2xl shadow-amber-700/10 text-center space-y-5 hover:-translate-y-3 hover:shadow-amber-600/25 transition-all duration-300 shimmer-sweep group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-600/20 to-transparent pointer-events-none rounded-bl-full" />

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 mx-auto flex items-center justify-center font-black shadow-xl shadow-amber-800/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Award className="w-10 h-10 text-amber-100" />
              </div>
              <div className="relative z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/40 inline-block">
                  Peringkat III
                </span>
                <h3 className="text-3xl font-black text-white mt-2">Juara 3</h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-600/30 text-xs text-amber-200 space-y-1 relative z-10">
                <div className="font-extrabold text-white text-sm">Medali Perunggu</div>
                <div className="text-amber-300/80 font-medium">+ Piagam Penghargaan Resmi</div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BARIS 3: JUARA HARAPAN 1 & 2 DAN E-CERTIFICATE SELURUH PESERTA */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Juara Harapan 1 & 2 */}
            <div className="p-6 sm:p-7 rounded-3xl glass-panel-dark hover:-translate-y-1.5 hover:border-[#A7F3D0]/50 hover:shadow-xl transition-all duration-300 group border border-emerald-500/20 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[#A7F3D0] text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#A7F3D0] group-hover:rotate-12 transition-transform" />
                    <span>Apresiasi Finalis</span>
                  </div>
                  <span className="text-xs text-emerald-300/70 font-semibold">Babak Final</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Juara Harapan 1 & 2</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Mendapatkan <strong>Medali Akrilik</strong> serta Piagam Penghargaan resmi dari Panitia Pusat OGSO.
                </p>
              </div>
              <div className="pt-3 border-t border-emerald-900/40 flex items-center gap-2 text-xs text-[#A7F3D0] font-medium">
                <Award className="w-4 h-4 text-[#A7F3D0] shrink-0" />
                <span>Medali Akrilik Eksklusif + Piagam Penghargaan</span>
              </div>
            </div>

            {/* E-Certificate Seluruh Peserta */}
            <div className="p-6 sm:p-7 rounded-3xl glass-panel-dark hover:-translate-y-1.5 hover:border-emerald-400/50 hover:shadow-xl transition-all duration-300 group border border-emerald-500/20 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <FileText className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-110 transition-transform" />
                    <span>Seluruh Peserta</span>
                  </div>
                  <span className="text-xs text-emerald-300/70 font-semibold">Semua Babak</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">E-Certificate Seluruh Peserta</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Setiap santri peserta resmi mendapatkan <strong>e-certificate keikutsertaan</strong> yang didistribusikan melalui pembimbing kampus.
                </p>
              </div>
              <div className="pt-3 border-t border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Sertifikat Digital Resmi dengan Verifikasi Keabsahan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 07 — LEARNING RESOURCES (Silabus & Bank Soal Gateway) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#F5F8F4] border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#166534]" />
              <span>Sumber Pembelajaran</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
              Silabus Resmi & Bank Soal Kompetisi
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pelajari silabus pembelajaran Kulliyatu-l-Mu’allimin Al-Islamiyah dan unduh arsip soal latihan untuk mempersiapkan santri kontingen secara optimal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Silabus */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 shimmer-sweep group relative overflow-hidden">
              <BookOpen className="absolute -right-6 -bottom-6 w-44 h-44 text-emerald-600/5 group-hover:text-emerald-600/15 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#166534] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-[#166534] group-hover:text-white transition-all duration-300">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0C241B] group-hover:text-[#166534] transition-colors">Silabus Resmi Jenjang 1–5</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Cakupan kurikulum Matematika, Fisika, Biologi, dan Kimia
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Disusun terstruktur per jenjang kelas santri dengan rincian topik inti per bidang studi. Dilengkapi dokumen silabus resmi format Excel & PDF untuk memudahkan pembimbing kontingen.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[11px] font-semibold bg-[#F5F8F4] text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    Jenjang 1 (Kelas 1)
                  </span>
                  <span className="text-[11px] font-semibold bg-[#F5F8F4] text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    Jenjang 2 (Kelas 2)
                  </span>
                  <span className="text-[11px] font-semibold bg-[#F5F8F4] text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    Jenjang 3 (1 Int & 3)
                  </span>
                  <span className="text-[11px] font-semibold bg-[#F5F8F4] text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    Jenjang 4 (3 Int & 4)
                  </span>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200">
                    Jenjang 5 (Kelas 5 + Kimia)
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-center justify-between relative z-10">
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532D] shadow-md hover:shadow-lg transition-all group"
                >
                  <span>Buka Silabus Interaktif</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="/documents/Silabus_OGSO_2026.xlsx"
                  download="Silabus_OGSO_2026.xlsx"
                  className="text-xs font-bold text-[#166534] hover:underline flex items-center gap-1.5 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unduh XLS</span>
                </a>
              </div>
            </div>

            {/* Card 2: Bank Soal */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:border-amber-500 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 shimmer-sweep group relative overflow-hidden">
              <Archive className="absolute -right-6 -bottom-6 w-44 h-44 text-amber-600/5 group-hover:text-amber-600/15 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-amber-700 group-hover:text-white transition-all duration-300">
                  <Archive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0C241B] group-hover:text-amber-950 transition-colors">Bank Soal Babak Penyisihan & Final</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Koleksi arsip naskah soal latihan tahunan resmi
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kumpulan soal olimpiade terverifikasi dari periode-periode kompetisi sebelumnya. Tersedia untuk Babak Penyisihan dan Babak Final pada masing-masing tingkatan jenjang.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[11px] font-semibold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200">
                    Soal Isian Singkat
                  </span>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200">
                    Babak Penyisihan
                  </span>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200">
                    Babak Final
                  </span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                    Format Dokumen Resmi
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-center justify-between relative z-10">
                <Link
                  to="/materi/bank-soal"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532D] shadow-md hover:shadow-lg transition-all group"
                >
                  <span>Akses Bank Soal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/participant"
                  className="text-xs font-bold text-slate-700 hover:text-[#166534] flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
                  <span>Daftar Pemenang</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 08 — HOW TO REGISTER (Mekanisme Pendaftaran Kolektif) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <span>Alur Administrasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
              Mekanisme Pendaftaran Kolektif Kontingen
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pendaftaran peserta dilakukan <strong>secara eksklusif dan kolektif</strong> oleh Admin Kampus resmi melalui portal administrasi OGSOreg.
            </p>
          </div>

          <div className="relative mb-12">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 border-t-2 border-dashed border-emerald-300 pointer-events-none z-0" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4.5 relative z-10">
              {/* Step 1 */}
              <div className="p-6 rounded-3xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 relative group overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                  01
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Seleksi Internal Kampus</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pimpinan dan pembimbing kampus menyeleksi 20 santri terbaik (tepat 4 santri per jenjang 1 s/d 5).
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-3xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 relative group overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                  02
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Login Admin Kampus</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Admin Kampus login ke portal OGSOreg menggunakan akun resmi terverifikasi kampus masing-masing.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-3xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 relative group overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                  03
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Input / Impor Data</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Admin mengunggah berkas Excel data delegasi atau menginput langsung santri peserta ke sistem.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-3xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 relative group overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                  04
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Validasi & Kirim</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem memvalidasi kecocokan jenjang dan kelas, kuota kampus, lalu Admin mengirimkan pendaftaran.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-6 rounded-3xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 space-y-3.5 relative group overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                  05
                </div>
                <h3 className="font-bold text-base text-[#0C241B] group-hover:text-[#166534] transition-colors">Sinkronisasi Moodle</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Panitia Pusat memverifikasi dan memproses akun CBT Moodle LMS untuk pelaksanaan olimpiade.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice & CTA (Elevated Card) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0C241B] via-[#0E3527] to-[#0A1E17] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl hover:shadow-2xl transition-all duration-300 shimmer-sweep">
            <div className="space-y-2 text-center md:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#A7F3D0]">
                <ShieldCheck className="w-4 h-4 text-[#A7F3D0]" />
                <span>Pemberitahuan Penting untuk Santri & Wali Santri:</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Tidak tersedia formulir pendaftaran perorangan secara publik. Semua santri peserta wajib dikoordinasikan langsung melalui pembimbing/Admin Kampus Pondok Modern Darussalam Gontor di kampus masing-masing.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-bold text-xs text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] via-[#86EFAC] to-[#4ADE80] hover:from-[#86EFAC] hover:to-[#22C55E] shrink-0 shadow-lg shadow-emerald-950/60 hover:-translate-y-0.5 transition-all duration-300"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Admin Kampus</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 09 — FAQ ACCORDION (Verified Official JUKLAK Information) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#F5F8F4] border-b border-emerald-950/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-[#166534]" />
              <span>Tanya Jawab</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-sm text-slate-600">
              Jawaban resmi seputar ketentuan pelaksanaan, teknis olimpiade, dan partisipasi santri.
            </p>
          </div>

          <div className="space-y-3.5">
            {content.faq.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded-2xl bg-white border transition-all duration-300 overflow-hidden',
                    isOpen
                      ? 'border-[#166534] border-l-4 shadow-md bg-emerald-50/15'
                      : 'border-emerald-900/10 shadow-xs hover:border-emerald-400/50 hover:shadow-sm'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className={cn('font-bold text-sm sm:text-base transition-colors', isOpen ? 'text-[#166534]' : 'text-[#0C241B]')}>
                      {item.question}
                    </span>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                        isOpen ? 'rotate-180 bg-[#166534] text-white shadow-sm' : 'bg-[#F5F8F4] text-slate-500'
                      )}
                    >
                      <ChevronDown
                        className={cn('w-4 h-4', isOpen ? 'text-white' : 'text-slate-600')}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5 animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-emerald-950/10 border border-emerald-900/10 text-center space-y-2">
            <div className="text-xs font-bold text-[#166534]">Memiliki pertanyaan lebih lanjut?</div>
            <p className="text-xs text-slate-600">
              Silakan hubungi Narahubung Panitia Pelaksana OGSO 1448/2026 melalui WhatsApp:{' '}
              <a
                href={getWhatsAppLink('6282332914996')}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#166534] underline"
              >
                +62 823-3291-4996 (Ust. Sigap Dwi Aminullah, S.Ag.)
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
