import React from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { PhotoMarqueeGallery } from '../../components/public/PhotoMarqueeGallery'


export const GalleryPage: React.FC = () => {
  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B]">
      {/* Page Hero Header */}
      <section className="relative text-white py-20 lg:py-32 overflow-hidden border-b border-emerald-900/40 min-h-[420px] flex items-center">
        {/* Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/foto/IMG_20251123_201518_980.jpg')" }}
        />
        {/* Dark overlay with emerald tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#0C241B]/70 to-[#0A1E17]/90" />
        {/* Subtle glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-semibold text-[#A7F3D0] backdrop-blur-md">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Dokumentasi Resmi Gontor Science Olympiad</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-xl">
            Galeri Kegiatan &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A7F3D0] via-[#86EFAC] to-[#D5C49A]">
              Kilas Balik Prestasi
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-emerald-100/80 leading-relaxed font-normal drop-shadow">
            Potret kebersamaan santri dari berbagai pondok pesantren di seluruh nusantara. Memadukan kedisiplinan hidup
            pesantren dengan eksplorasi sains modern dan pemikiran kritis MAFIKIB.
          </p>
        </div>
      </section>

      {/* Main Interactive Marquee & Grid Gallery Section */}
      <PhotoMarqueeGallery showSectionHeader={true} variant="light" />

      {/* Call To Action Banner */}
      <section className="py-16 bg-white border-t border-emerald-950/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#0C241B] via-[#0E3527] to-[#0A1E17] text-white p-8 sm:p-12 overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-xs font-semibold text-[#A7F3D0]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Siap Mengukir Sejarah Berikutnya?</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Daftarkan Kontingen Sekolah & Santri Anda Sekarang
              </h3>
              <p className="text-sm text-emerald-200/80 leading-relaxed">
                Jadilah bagian dari generasi saintis muslim yang memimpin kemajuan peradaban. Unduh silabus resmi dan ikuti
                alur pendaftaran kolektif.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/pendaftaran"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-500 text-emerald-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  <span>Alur Pendaftaran</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/materi/silabus"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
                >
                  <span>Unduh Silabus</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
