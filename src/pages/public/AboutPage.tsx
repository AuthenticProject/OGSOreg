import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  CheckCircle2,
  Download,
  Laptop,
  Phone,
  ArrowRight,
} from 'lucide-react'
import { websiteContentService } from '../../services/websiteContentService'
import { getWhatsAppLink } from '../../lib/whatsapp'

export const AboutPage: React.FC = () => {
  const content = websiteContentService.getContent()

  const goals = [
    'Meningkatkan kemampuan akademik dan memperluas wawasan santri dalam menguasai berbagai bidang ilmu pengetahuan Agama dan Umum.',
    'Meningkatkan minat dan kecintaan santri terhadap materi pelajaran MAFIKIB (Matematika, Fisika, Kimia, Biologi).',
    'Meningkatkan rasa percaya diri santri dalam mempelajari materi MAFIKIB dan memecahkan tantangan sains.',
    'Mengukur keberhasilan proses belajar-mengajar santri dalam menguasai materi sains dan matematika.',
    'Menjadi wadah resmi bagi santri untuk mengembangkan potensinya secara terarah di bidang sains.',
    'Menjadi ajang berprestasi tingkat nasional yang sehat, sportif, dan berintegritas.',
    'Menanamkan kebiasaan menyelesaikan masalah secara terstruktur (problem solving).',
    'Menyegarkan kembali semangat belajar santri pasca-penilaian dan mempererat ukhuwah antarkampus.',
    'Membentuk kader umat yang mampu mengintegrasikan sains modern dengan nilai-nilai Al-Qur’an dan As-Sunnah sebagai calon penerus pemimpin umat di masa depan.',
  ]

  const technicalRequirements = [
    {
      title: 'Perangkat Utama',
      description: 'Komputer PC atau Laptop berspesifikasi memadai dengan OS Windows atau macOS (bukan tablet/smartphone).',
    },
    {
      title: 'Aplikasi Ujian',
      description: 'Wajib terpasang aplikasi Safe Exam Browser (SEB) resmi untuk menjamin integritas layar pengerjaan.',
    },
    {
      title: 'Pengawasan Zoom',
      description: 'Kamera pengawas ditempatkan di sudut belakang ruangan sehingga seluruh area pengerjaan dan peserta terlihat jelas.',
    },
    {
      title: 'Konektivitas Internet',
      description: 'Jaringan internet stabil dan berkecepatan tinggi selama durasi 90 menit babak penyisihan dan final.',
    },
    {
      title: 'Pembimbing Kontingen',
      description: 'Maksimal 1 orang guru pembimbing resmi yang berwenang mendampingi teknis jika terjadi kendala perangkat.',
    },
    {
      title: 'Posisi Pengerjaan',
      description: 'Posisi duduk seluruh peserta wajib di pojok ruangan dengan posisi menghadap tembok sesuai standar JUKLAK.',
    },
  ]

  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-bold text-[#166534] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#166534]" />
            <span>Petunjuk Pelaksanaan Resmi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0C241B] leading-tight font-sans">
            Tentang Inter-Campus Online Gontor Science Olympiad
          </h1>

          <div className="max-w-2xl mx-auto">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Ajang talenta kompetisi sains nasional santri Kulliyatu-l-Mu’allimin Al-Islamiyah (KMI) Pondok Modern Darussalam Gontor di 20 kampus cabang seluruh Indonesia.
            </p>
          </div>
        </div>

        {/* Official Theme & Trimurti Quote Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0C241B] via-[#0E3527] to-[#0A1E17] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A7F3D0]">
              Tema Resmi Kompetisi 1448 / 2026
            </span>

            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#D5C49A] italic leading-snug">
              “{content.hero.officialTheme}”
            </blockquote>

            <div className="h-px w-24 bg-[#D5C49A]/40 mx-auto" />

            <div className="space-y-3 max-w-3xl mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                Falsafah Pendidikan Trimurti
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Pondok Modern Darussalam Gontor senantiasa menyeimbangkan ilmu pengetahuan umum dan ilmu pengetahuan agama Islam. Sebagaimana yang dicanangkan Trimurti Pendiri Pondok: <strong>100% ilmu agama dan 100% ilmu umum</strong> demi meregenerasi ulama yang intelek, bukan intelek yang sekadar tahu agama.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen JUKLAK Lengkap (PDF)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Sembilan Tujuan Kegiatan dari JUKLAK */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
              Tujuan Penyelenggaraan Kegiatan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Sembilan pilar tujuan utama pelaksanaan Inter-Campus OGSO sebagaimana tercantum dalam dokumen resmi JUKLAK:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {goals.map((goal, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] font-extrabold text-xs flex items-center justify-center">
                    0{idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {goal}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sarana Prasarana & Mekanisme Ujian */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-900/10 shadow-sm space-y-8">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <Laptop className="w-3.5 h-3.5 text-[#166534]" />
              <span>Standar Operasional Prosedur</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
              Sarana, Prasarana & Mekanisme Pengawasan Daring
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pelaksanaan olimpiade diselenggarakan serentak dari masing-masing kampus dengan standar teknis ketat guna menjaga integritas dan keadilan kompetisi:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {technicalRequirements.map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-900/10 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#166534]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <span>Peraturan Ketat Pengerjaan Soal:</span>
            </div>
            <p className="leading-relaxed">
              Selama ujian berlangsung, peserta dilarang menggunakan kalkulator, mengenakan headphone, membuka tab selain SEB, atau berkomunikasi dengan siapapun. Pengerjaan terdiri dari 40 soal isian singkat (durasi 90 menit). Pelanggaran akan berakibat diskualifikasi kontingen.
            </p>
          </div>
        </div>

        {/* Struktur Penanggung Jawab & Kontak Resmi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Penanggung Jawab */}
          <div className="p-8 rounded-3xl bg-white border border-emerald-900/10 shadow-xs space-y-6">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                Kepanitiaan Resmi
              </div>
              <h3 className="text-xl font-extrabold text-[#0C241B]">
                Penanggung Jawab Umum OGSO
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {content.officials.map((person, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{person.name}</span>
                  <span className="text-slate-500 bg-[#F5F8F4] px-2.5 py-1 rounded-md border border-slate-200">
                    {person.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Narahubung Resmi */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0C241B] to-[#14532D] text-white shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">
                Pusat Informasi & Sekretariat
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Narahubung Resmi Panitia Pelaksana
              </h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Untuk pertanyaan terkait verifikasi delegasi, kendala teknis SEB, dan koordinasi kontingen kampus, silakan menghubungi:
              </p>

              <div className="space-y-3 pt-2 text-xs">
                {content.contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1"
                  >
                    <div className="font-bold text-[#A7F3D0]">{contact.name}</div>
                    <div className="text-[11px] text-slate-300">{contact.role}</div>
                    <div className="pt-1">
                      <a
                        href={getWhatsAppLink(contact.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-bold text-white hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#A7F3D0]" />
                        <span>{contact.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-800/40 flex items-center justify-between text-xs">
              <Link
                to="/pendaftaran"
                className="text-[#A7F3D0] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Lihat Panduan Pendaftaran</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/materi/silabus"
                className="text-slate-300 hover:text-white font-semibold"
              >
                Buka Silabus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
