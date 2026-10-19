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
} from 'lucide-react'
import {
  websiteContentService,
  type WebsiteContentConfig,
} from '../../services/websiteContentService'
import { cn } from '../../lib/utils'

export const HomePage: React.FC = () => {
  const [content, setContent] = useState<WebsiteContentConfig>(() =>
    websiteContentService.getContent()
  )
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [activeTimelineCategory, setActiveTimelineCategory] = useState<string>('all')

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
      {/* SECTION 01 — HERO SECTION (Deep Forest Palette with Scientific Geometry) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] bg-gradient-to-b from-[#0C241B] via-[#0D2D22] to-[#0A1E17] text-white overflow-hidden flex items-center justify-center py-20 lg:py-28">
        {/* Background Subtle Scientific Particles & Geometry SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="scientific-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="#A7F3D0" />
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#166534" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#scientific-grid)" />
          </svg>
        </div>

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial from-emerald-600/15 via-emerald-800/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-radial from-[#166534]/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Official Event Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-semibold tracking-wide text-[#A7F3D0] shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#A7F3D0]" />
              <span>{content.competitionInfo.name} {content.competitionInfo.arabicYear}/{content.competitionInfo.masehiYear}</span>
            </div>

            {/* Creative Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
              Where Knowledge{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A7F3D0] via-[#86EFAC] to-[#D5C49A]">
                Meets Discovery.
              </span>
            </h1>

            {/* Official Indonesian Competition Theme */}
            <div className="max-w-3xl mx-auto">
              <blockquote className="text-base sm:text-xl font-medium text-[#D5C49A] italic px-4 py-2 border-y border-emerald-800/40 bg-emerald-950/40 rounded-xl backdrop-blur-xs">
                “{content.hero.officialTheme}”
              </blockquote>
            </div>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto font-normal leading-relaxed">
              {content.hero.subheadline}
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/pendaftaran"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all duration-200"
              >
                <span>{content.hero.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#tentang"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-emerald-100 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-500 transition-colors"
              >
                <Compass className="w-4 h-4 text-[#A7F3D0]" />
                <span>{content.hero.secondaryCtaText}</span>
              </a>

              <a
                href={content.hero.officialJuklakUrl}
                download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-xs text-[#D5C49A] bg-emerald-950/40 hover:bg-emerald-900/40 border border-[#D5C49A]/30 hover:border-[#D5C49A]/60 transition-colors"
                title="Unduh Petunjuk Pelaksanaan (JUKLAK) Resmi PDF"
              >
                <Download className="w-4 h-4" />
                <span>Unduh JUKLAK 2026</span>
              </a>
            </div>

            {/* Key Facts Highlights Strip */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/40 backdrop-blur-xs text-left">
                <div className="text-2xl font-black text-white">20</div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] uppercase tracking-wider">Kampus Cabang</div>
                <div className="text-[10px] text-emerald-300/70">Delegasi se-Indonesia</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/40 backdrop-blur-xs text-left">
                <div className="text-2xl font-black text-white">5</div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] uppercase tracking-wider">Jenjang Tingkat</div>
                <div className="text-[10px] text-emerald-300/70">Kelas 1 hingga Kelas 5 KMI</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/40 backdrop-blur-xs text-left">
                <div className="text-2xl font-black text-white">40</div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] uppercase tracking-wider">Soal Isian</div>
                <div className="text-[10px] text-emerald-300/70">Short essay berbasis nalar</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/40 backdrop-blur-xs text-left">
                <div className="text-2xl font-black text-white">90</div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] uppercase tracking-wider">Menit Ujian</div>
                <div className="text-[10px] text-emerald-300/70">CBT via Save Exam Browser</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

              <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-xs space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                  Falsafah Trimurti Pendiri Pondok
                </div>
                <p className="text-sm italic text-slate-800 leading-relaxed">
                  “Kegiatan ini adalah wujud nyata menyeimbangkan ilmu pengetahuan umum dan agama, sebagaimana yang dicanangkan Trimurti: 100% ilmu agama dan 100% ilmu umum demi meregenerasi ulama yang intelek, bukan intelek yang sekadar tahu agama.”
                </p>
                <div className="text-xs font-semibold text-slate-500 text-right">
                  — Petunjuk Pelaksanaan Resmi OGSO 1448/2026
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/tentang"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#166534] hover:text-[#0C241B] group"
                >
                  <span>Baca Selengkapnya Profil & Tujuan Kegiatan</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Column: 4 Pillars of Excellence */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                  <Atom className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B]">Kecerdasan Saintifik</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menumbuhkan kecintaan terhadap sains dan teknologi melalui penalaran logika dan problem-solving yang kokoh.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B]">Integritas & Kejujuran</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pelaksanaan diawasi secara terpusat dengan Save Exam Browser dan pemantauan kamera sudut luas via Zoom.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B]">Konektivitas 20 Kampus</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menghubungkan 12 kampus putra dan 8 kampus putri dalam wadah kompetisi yang sportif dan penuh ukhuwah.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#0C241B]">Kurikulum KMI Terpadu</h3>
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
            <div className="group p-6 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#166534] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Binary className="w-6 h-6 text-[#A7F3D0]" />
                </div>
                <h3 className="text-xl font-bold text-[#0C241B]">Matematika</h3>
                <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Jenjang 1 – 5
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aljabar, aritmetika, geometri, trigonometri, barisan dan deret, hingga kalkulus limit fungsi dan statistika analitik.
                </p>
              </div>
              <div className="pt-4 border-t border-emerald-950/10 mt-6">
                <Link
                  to="/materi/silabus"
                  className="text-xs font-bold text-[#166534] hover:text-[#0C241B] flex items-center gap-1 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </Link>
              </div>
            </div>

            {/* 2. Fisika */}
            <div className="group p-6 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#166534] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Atom className="w-6 h-6 text-[#A7F3D0]" />
                </div>
                <h3 className="text-xl font-bold text-[#0C241B]">Fisika</h3>
                <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Jenjang 1 – 5
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pengukuran, mekanika Newton, getaran & gelombang, optika geometri, termodinamika kalor, hingga elektromagnetika modern.
                </p>
              </div>
              <div className="pt-4 border-t border-emerald-950/10 mt-6">
                <Link
                  to="/materi/silabus"
                  className="text-xs font-bold text-[#166534] hover:text-[#0C241B] flex items-center gap-1 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </Link>
              </div>
            </div>

            {/* 3. Biologi */}
            <div className="group p-6 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#166534] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Microscope className="w-6 h-6 text-[#A7F3D0]" />
                </div>
                <h3 className="text-xl font-bold text-[#0C241B]">Biologi</h3>
                <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Jenjang 1 – 5
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Organisasi kehidupan, fisiologi sistem manusia, botani, pewarisan sifat genetika, ekologi ekosistem, dan bioteknologi.
                </p>
              </div>
              <div className="pt-4 border-t border-emerald-950/10 mt-6">
                <Link
                  to="/materi/silabus"
                  className="text-xs font-bold text-[#166534] hover:text-[#0C241B] flex items-center gap-1 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </Link>
              </div>
            </div>

            {/* 4. Kimia (Special Badge: Jenjang 5 Only) */}
            <div className="group p-6 rounded-2xl bg-[#F5F8F4] border-2 border-[#D5C49A]/60 hover:border-[#D5C49A] hover:shadow-lg transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                  Khusus Jenjang 5
                </span>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#166534] to-[#0C241B] text-[#D5C49A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FlaskConical className="w-6 h-6 text-[#D5C49A]" />
                </div>
                <h3 className="text-xl font-bold text-[#0C241B]">Kimia</h3>
                <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Kelas 5 KMI
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Struktur atom, sistem periodik unsur, tata nama senyawa, persamaan reaksi, konsep mol, dan profil ilmuwan kimia Muslim.
                </p>
              </div>
              <div className="pt-4 border-t border-emerald-950/10 mt-6">
                <Link
                  to="/materi/silabus"
                  className="text-xs font-bold text-[#166534] hover:text-[#0C241B] flex items-center gap-1 group-hover:underline"
                >
                  <span>Lihat Silabus</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </Link>
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Jenjang 1 */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Tingkat 1
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">4 Peserta</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C241B]">Jenjang 1</h3>
                <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                  Kelas 1 KMI
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-800">Materi Ujian:</div>
                  <div>&bull; Matematika</div>
                  <div>&bull; Fisika</div>
                  <div>&bull; Biologi</div>
                </div>
              </div>
            </div>

            {/* Jenjang 2 */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Tingkat 2
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">4 Peserta</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C241B]">Jenjang 2</h3>
                <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                  Kelas 2 KMI
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-800">Materi Ujian:</div>
                  <div>&bull; Matematika</div>
                  <div>&bull; Fisika</div>
                  <div>&bull; Biologi</div>
                </div>
              </div>
            </div>

            {/* Jenjang 3 */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Tingkat 3
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">4 Peserta</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C241B]">Jenjang 3</h3>
                <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                  Kelas 1 Int & 3 KMI
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-800">Materi Ujian:</div>
                  <div>&bull; Matematika</div>
                  <div>&bull; Fisika</div>
                  <div>&bull; Biologi</div>
                </div>
              </div>
            </div>

            {/* Jenjang 4 */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Tingkat 4
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">4 Peserta</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C241B]">Jenjang 4</h3>
                <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                  Kelas 3 Int & 4 KMI
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-800">Materi Ujian:</div>
                  <div>&bull; Matematika</div>
                  <div>&bull; Fisika</div>
                  <div>&bull; Biologi</div>
                </div>
              </div>
            </div>

            {/* Jenjang 5 */}
            <div className="p-5 rounded-2xl bg-white border-2 border-[#166534] shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white bg-[#166534] px-2 py-0.5 rounded">
                    Tingkat 5
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">4 Peserta</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C241B]">Jenjang 5</h3>
                <div className="text-xs font-semibold text-emerald-950 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  Kelas 5 KMI
                </div>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="font-semibold text-emerald-900">Materi Lengkap:</div>
                  <div>&bull; Matematika</div>
                  <div>&bull; Fisika</div>
                  <div>&bull; Biologi</div>
                  <div className="font-bold text-[#166534]">&bull; Kimia</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 05 — COMPETITION TIMELINE (Data-Driven Official Tentative Dates) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#166534]" />
                <span>Rangkaian Agenda</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C241B]">
                Jadwal Tentatif OGSO 2026
              </h2>
              <p className="text-sm text-slate-600">
                Seluruh rangkaian kegiatan dilaksanakan secara daring terkoordinasi antar-kampus Pondok Modern Darussalam Gontor.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Semua Agenda' },
                { id: 'seremoni', label: 'Persiapan & Pembukaan' },
                { id: 'penyisihan', label: 'Babak Penyisihan' },
                { id: 'final', label: 'Babak Final' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTimelineCategory(tab.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    activeTimelineCategory === tab.id
                      ? 'bg-[#166534] text-white shadow-xs'
                      : 'bg-[#F5F8F4] text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTimeline.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 hover:border-emerald-600/40 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-[#166534]">
                      {item.category}
                    </span>
                    {item.isTentative && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Tentatif
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#0C241B] leading-snug">
                    {item.title}
                  </h3>

                  {item.levels && (
                    <div className="text-xs font-semibold text-emerald-800">
                      Sasaran: {item.levels}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-emerald-950/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-[#166534]" />
                    <span>{item.dateDisplay}</span>
                  </div>
                  {item.hijriDate && (
                    <div className="text-[11px] text-slate-500 pl-5">
                      {item.hijriDate}
                    </div>
                  )}
                  {item.time && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 pl-5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Juara 1 — Emas */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 via-emerald-950/30 to-emerald-950/50 border border-amber-500/40 shadow-lg text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-emerald-950 mx-auto flex items-center justify-center font-black shadow-md">
                <Trophy className="w-8 h-8 text-amber-950" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#D5C49A]">
                  Peringkat I
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Juara 1</h3>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                <div className="font-bold text-white">Medali Emas</div>
                <div>+ Piagam Penghargaan Resmi</div>
              </div>
            </div>

            {/* Juara 2 — Perak */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/40 via-emerald-950/30 to-emerald-950/50 border border-slate-400/40 shadow-lg text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 mx-auto flex items-center justify-center font-black shadow-md">
                <Award className="w-8 h-8 text-slate-800" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                  Peringkat II
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Juara 2</h3>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-slate-400/20 text-xs text-slate-200 space-y-1">
                <div className="font-bold text-white">Medali Perak</div>
                <div>+ Piagam Penghargaan Resmi</div>
              </div>
            </div>

            {/* Juara 3 — Perunggu */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-900/30 via-emerald-950/30 to-emerald-950/50 border border-amber-700/40 shadow-lg text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 mx-auto flex items-center justify-center font-black shadow-md">
                <Award className="w-8 h-8 text-amber-100" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                  Peringkat III
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Juara 3</h3>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-amber-700/20 text-xs text-amber-200 space-y-1">
                <div className="font-bold text-white">Medali Perunggu</div>
                <div>+ Piagam Penghargaan Resmi</div>
              </div>
            </div>
          </div>

          {/* Special Mentions & Campus Trophy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-xs space-y-2">
              <div className="font-bold text-sm text-[#A7F3D0]">Juara Harapan 1 & 2</div>
              <p className="text-slate-300 leading-relaxed">
                Mendapatkan <strong>Medali Akrilik</strong> serta Piagam Penghargaan resmi dari Panitia Pusat OGSO.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-xs space-y-2">
              <div className="font-bold text-sm text-[#D5C49A]">Piala Juara Umum Kampus</div>
              <p className="text-slate-300 leading-relaxed">
                Kampus kontingen dengan perolehan pemenang terbanyak dianugerahi <strong>Piala Penghargaan Khusus</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-xs space-y-2">
              <div className="font-bold text-sm text-emerald-300">E-Certificate Seluruh Peserta</div>
              <p className="text-slate-300 leading-relaxed">
                Setiap peserta resmi mendapatkan <strong>e-certificate keikutsertaan</strong> yang didistribusikan melalui pembimbing kampus.
              </p>
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
            <div className="p-8 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#166534] flex items-center justify-center">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0C241B]">Silabus Resmi Jenjang 1–5</h3>
                  <p className="text-xs text-slate-500 mt-1">
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

              <div className="pt-4 border-t border-emerald-950/10 flex items-center justify-between">
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532D] shadow-sm transition-colors"
                >
                  <span>Buka Silabus Interaktif</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="/documents/Silabus_OGSO_2026.xlsx"
                  download="Silabus_OGSO_2026.xlsx"
                  className="text-xs font-semibold text-[#166534] hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh XLS</span>
                </a>
              </div>
            </div>

            {/* Card 2: Bank Soal */}
            <div className="p-8 rounded-3xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Archive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0C241B]">Bank Soal Babak Penyisihan & Final</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Koleksi arsip soal latihan tahunan resmi
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

              <div className="pt-4 border-t border-emerald-950/10 flex items-center justify-between">
                <Link
                  to="/materi/bank-soal"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532D] shadow-sm transition-colors"
                >
                  <span>Akses Bank Soal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/participant"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative mb-12">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-sm text-[#0C241B]">Seleksi Internal Kampus</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pimpinan dan pembimbing kampus menyeleksi 20 santri terbaik (tepat 4 santri per jenjang 1 s/d 5).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-sm text-[#0C241B]">Login Admin Kampus</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admin Kampus login ke portal OGSOreg menggunakan akun resmi terverifikasi kampus masing-masing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-sm text-[#0C241B]">Input / Impor Data</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admin mengunggah berkas Excel data delegasi atau menginput langsung santri peserta ke sistem.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h3 className="font-bold text-sm text-[#0C241B]">Validasi & Kirim</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem memvalidasi kecocokan jenjang dan kelas, kuota kampus, lalu Admin mengirimkan pendaftaran.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white font-bold text-xs flex items-center justify-center">
                5
              </div>
              <h3 className="font-bold text-sm text-[#0C241B]">Sinkronisasi Moodle</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Panitia Pusat memverifikasi dan memproses akun CBT Moodle LMS untuk pelaksanaan olimpiade.
              </p>
            </div>
          </div>

          {/* Important Notice & CTA */}
          <div className="p-6 rounded-2xl bg-[#0C241B] text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-sm font-bold text-[#A7F3D0]">
                Pemberitahuan Penting untuk Santri & Wali Santri:
              </div>
              <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
                Tidak tersedia formulir pendaftaran perorangan secara publik. Semua santri peserta wajib dikoordinasikan langsung melalui pembimbing/Admin Kampus Pondok Modern Darussalam Gontor di kampus masing-masing.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] shrink-0 shadow-md transition-all"
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

          <div className="space-y-3">
            {content.faq.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-emerald-900/10 shadow-xs overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-sm sm:text-base text-[#0C241B]">
                      {item.question}
                    </span>
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full bg-[#F5F8F4] flex items-center justify-center shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180 bg-emerald-100'
                      )}
                    >
                      <ChevronDown
                        className={cn('w-4 h-4 text-slate-500', isOpen && 'text-[#166534]')}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-150">
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
                href="https://wa.me/6282332914996"
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
