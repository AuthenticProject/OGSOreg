import React from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { OfficialFinalistsTable } from '../../components/public/OfficialFinalistsTable'
import { ScrollToTopButton } from '../../components/ui/ScrollToTopButton'

export const OfficialFinalistsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#071510] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <PublicNavbar />
      <div className="pt-20 flex-grow">
        <OfficialFinalistsTable showHeader={true} />
      </div>
      <footer className="bg-[#040C09] text-center text-xs text-emerald-300/60 py-6 border-t border-emerald-900/40">
        Daftar finalis resmi Online Gontor Science Olympiad (OGSO) 2026.
      </footer>
      <ScrollToTopButton />
    </div>
  )
}
