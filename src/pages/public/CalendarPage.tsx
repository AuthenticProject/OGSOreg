import React from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ArrowLeft,
  Download,
} from 'lucide-react'
import { MonthlyCalendarView } from '../../components/calendar/MonthlyCalendarView'

export const CalendarPage: React.FC = () => {
  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#166534] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#166534]" />
              <span>Unduh JUKLAK 2026</span>
            </a>
          </div>
        </div>

        {/* Hero Header for Calendar Page */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0C241B] via-[#091D16] to-[#061510] text-white p-6 sm:p-10 overflow-hidden shadow-xl border border-emerald-900/40">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-emerald-500/20 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-radial from-[#A7F3D0]/10 to-transparent blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[#A7F3D0] text-xs font-bold uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5 text-[#A7F3D0]" />
              <span>Kalender Resmi Inter-Campus OGSO 1448/2026</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Jadwal & Agenda Kompetisi
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              Rangkaian timeline pelaksanaan Online Gontor Science Olympiad antarkampus Pondok Modern Darussalam Gontor se-Indonesia, mulai dari Technical Meeting, masa simulasi sistem CBT SEB, babak penyisihan, pengumuman finalis, babak final, hingga penutupan dan awarding.
            </p>
          </div>
        </div>

        {/* Main Google Calendar Monthly View */}
        <section aria-label="Kalender Bulanan OGSO">
          <MonthlyCalendarView />
        </section>
      </div>
    </div>
  )
}
