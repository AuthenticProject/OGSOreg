import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  LogIn,
  Download,
  Building2,
  ShieldAlert,
} from 'lucide-react'
import { KAMPUS_OPTIONS } from '../../types/campus'

export const RegistrationInfoPage: React.FC = () => {

  const registrationSteps = [
    {
      step: '01',
      title: 'Seleksi Internal Kontingen Kampus',
      desc: 'Pimpinan dan Bagian Pengajaran di masing-masing kampus PMDG menyeleksi 20 santri terbaik yang terdiri dari tepat 4 peserta untuk setiap jenjang 1 hingga 5.',
    },
    {
      step: '02',
      title: 'Autentikasi Akun Admin Kampus',
      desc: 'Admin Kampus yang telah terdaftar resmi login ke portal administrasi OGSOreg menggunakan kredensial akun kampus yang diterbitkan Panitia Pusat.',
    },
    {
      step: '03',
      title: 'Pengisian Data / Unggah Format Excel',
      desc: 'Admin menginput data delegasi santri (NISN/Username, Nama Lengkap, Email, Jenjang Lomba, Kelas Asal) secara manual atau menggunakan impor Excel.',
    },
    {
      step: '04',
      title: 'Validasi Otomatis & Pengiriman Berkas',
      desc: 'Sistem OGSOreg memvalidasi kesesuaian jenjang dengan kelas santri, kuota 4 peserta per jenjang, dan integritas data sebelum berkas dikirimkan secara resmi.',
    },
    {
      step: '05',
      title: 'Sinkronisasi Moodle LMS Panitia Pusat',
      desc: 'Super Admin Panitia Pusat memverifikasi pendaftaran masuk, menerbitkan akun CBT, dan memetakan course olimpiade di server LMS Moodle resmi.',
    },
  ]

  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-bold text-[#166534] uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[#166534]" />
            <span>Ketentuan & Prosedur Pendaftaran</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0C241B] leading-tight font-sans">
            Informasi Pendaftaran Kolektif Kontingen
          </h1>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium max-w-2xl mx-auto">
            Pendaftaran peserta Inter-Campus Online Gontor Science Olympiad (OGSO) dilakukan secara terpadu oleh Admin Kampus resmi di 20 kampus Pondok Modern Darussalam Gontor.
          </p>
        </div>

        {/* Warning / Strict Notice: No Public Self-Registration */}
        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border-2 border-amber-300/80 text-amber-950 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Pemberitahuan Resmi: Tidak Ada Pendaftaran Mandiri Perorangan</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Seluruh peserta OGSO 2026 merupakan delegasi terpilih yang didaftarkan langsung oleh Admin Kampus/Pembimbing Kontingen. <strong>Santri dan wali santri tidak perlu mendaftar secara mandiri</strong>. Tidak tersedia formulir pendaftaran terbuka untuk umum maupun fitur cek status pendaftaran mandiri.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532D] shadow-md shrink-0 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Admin Kampus</span>
          </Link>
        </div>

        {/* 5-Step Process Timeline Cards */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
              Alur Pelaksanaan Pendaftaran Kolektif
            </h2>
            <p className="text-xs text-slate-600">
              Lima tahapan terstruktur bagi Admin Kampus dalam mendaftarkan kontingen resmi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {registrationSteps.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#166534] font-black text-sm flex items-center justify-center">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-base text-[#0C241B] leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ketentuan Kuota Delegasi Peserta (4 per jenjang x 5 jenjang = 20 peserta) */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-900/10 shadow-sm space-y-8">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-[#166534]" />
              <span>Alokasi Resmi Kontingen</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C241B]">
              Alokasi 20 Peserta per Kampus Kontingen
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Berdasarkan JUKLAK Bab Ketentuan Peserta, setiap kampus kontingen mendelegasikan tepat 20 orang siswa/siswi dengan rincian 4 peserta pada setiap jenjang kelas lomba:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F8F4] border border-emerald-900/10 space-y-1.5 text-center">
              <div className="text-xs font-bold text-[#166534]">Jenjang 1</div>
              <div className="text-xs font-semibold text-slate-800">Kelas 1 KMI</div>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100 py-0.5 rounded">
                4 Santri Peserta
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F4] border border-emerald-900/10 space-y-1.5 text-center">
              <div className="text-xs font-bold text-[#166534]">Jenjang 2</div>
              <div className="text-xs font-semibold text-slate-800">Kelas 2 KMI</div>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100 py-0.5 rounded">
                4 Santri Peserta
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F4] border border-emerald-900/10 space-y-1.5 text-center">
              <div className="text-xs font-bold text-[#166534]">Jenjang 3</div>
              <div className="text-xs font-semibold text-slate-800">Kelas 1 Int & 3 KMI</div>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100 py-0.5 rounded">
                4 Santri Peserta
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F4] border border-emerald-900/10 space-y-1.5 text-center">
              <div className="text-xs font-bold text-[#166534]">Jenjang 4</div>
              <div className="text-xs font-semibold text-slate-800">Kelas 3 Int & 4 KMI</div>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100 py-0.5 rounded">
                4 Santri Peserta
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F4] border-2 border-[#166534] space-y-1.5 text-center bg-white shadow-xs">
              <div className="text-xs font-bold text-[#166534]">Jenjang 5</div>
              <div className="text-xs font-semibold text-slate-800">Kelas 5 KMI</div>
              <div className="text-[11px] font-bold text-white bg-[#166534] py-0.5 rounded">
                4 Santri Peserta
              </div>
            </div>
          </div>
        </div>

        {/* 20 Kampus Kontingen Peserta Resmi */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-900/10 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
              Kontingen Resmi
            </div>
            <h3 className="text-2xl font-extrabold text-[#0C241B]">
              20 Kampus Cabang Pondok Modern Darussalam Gontor
            </h3>
            <p className="text-xs text-slate-600">
              Daftar 12 kampus putra dan 8 kampus putri yang terdaftar secara resmi pada OGSOreg:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {KAMPUS_OPTIONS.map((k) => (
              <div
                key={k}
                className="p-3 rounded-xl bg-[#F5F8F4] border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                <span className="truncate">{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner: Admin Portal Access & Documents */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0C241B] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">
              Portal Pendaftaran Resmi
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Siap Mendaftarkan Delegasi Kampus?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Admin Kampus dapat langsung masuk ke dashboard OGSOreg untuk mengimpor berkas Excel atau mendaftarkan santri peserta.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] shadow-md transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Admin OGSOreg</span>
            </Link>

            <a
              href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
              download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-xs text-emerald-100 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 transition-colors"
            >
              <Download className="w-4 h-4 text-[#A7F3D0]" />
              <span>Unduh JUKLAK PDF</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
