import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Phone,
  MapPin,
  Download,
  BookOpen,
  Archive,
  Trophy,
  LogIn,
  ChevronRight,
} from 'lucide-react'

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0C241B] text-slate-300 border-t border-emerald-900/50 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-emerald-900/40">
          {/* Column 1: Identity & Theme (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group inline-block">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#166534] via-[#15803D] to-[#22C55E] text-white font-black shadow-md border border-emerald-400/30">
                <Sparkles className="w-5 h-5 text-[#A7F3D0]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#A7F3D0] transition-colors">
                  OGSO
                </span>
                <span className="text-xs font-semibold text-emerald-300">
                  Inter-Campus Online Gontor Science Olympiad
                </span>
              </div>
            </Link>

            <p className="text-xs italic text-[#D5C49A] font-medium leading-relaxed bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-800/40">
              “Dengan Ilmu Al-Qur’an dan Ilmu Sains, Santri Saintis Siap Membangun Peradaban Islam”
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Ajang kompetisi sains terpadu santri Kulliyatu-l-Mu’allimin Al-Islamiyah (KMI) antar-kampus Pondok Modern Darussalam Gontor di seluruh Indonesia, mewujudkan cita-cita Trimurti mencetak ulama yang intelek dan saintis yang berakhlak karimah.
            </p>

            <div className="pt-2">
              <a
                href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] transition-all duration-200 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen JUKLAK 2026 (PDF)</span>
              </a>
            </div>
          </div>

          {/* Column 2: Navigasi Utama */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Beranda</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/tentang"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tentang OGSO</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/pendaftaran"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Informasi Pendaftaran</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/participant"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Participant & Periode</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/verify"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verifikasi Sertifikat</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Sumber Belajar & Materi */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">
              Materi & Silabus
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/materi/silabus"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Silabus Jenjang 1–5</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/materi/bank-soal"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bank Soal Penyisihan</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/materi/bank-soal"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bank Soal Babak Final</span>
                </Link>
              </li>
              <li>
                <a
                  href="/documents/Silabus_OGSO_2026.xlsx"
                  download="Silabus_OGSO_2026.xlsx"
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-emerald-300"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh Silabus (Excel)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Narahubung & Kesekretariatan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">
              Sekretariat & Kontak
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  Kantor Laboratorium KMI, Pondok Modern Darussalam Gontor, Ponorogo, Jawa Timur
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-400">Ketua Panitia OGSO:</div>
                  <a
                    href="https://wa.me/6282332914996"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#A7F3D0] hover:underline"
                  >
                    +62 823-3291-4996 (Ust. Sigap Dwi Aminullah)
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-400">Admin Lab KMI:</div>
                  <a
                    href="https://wa.me/6285232601097"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#A7F3D0] hover:underline"
                  >
                    +62 852-3260-1097
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-200 bg-emerald-950 hover:bg-emerald-900/60 border border-emerald-700/50 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#A7F3D0]" />
                <span>Portal Admin OGSOreg</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {currentYear} Inter-Campus Online Gontor Science Olympiad (OGSO). Pondok Modern Darussalam Gontor. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/tentang" className="hover:text-emerald-300 transition-colors">
              Pedoman Pelaksanaan
            </Link>
            <span>&bull;</span>
            <Link to="/materi/silabus" className="hover:text-emerald-300 transition-colors">
              Kurikulum MAFIKIB
            </Link>
            <span>&bull;</span>
            <Link to="/login" className="hover:text-emerald-300 transition-colors">
              Login Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
