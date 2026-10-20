import React from 'react'
import { Trophy, TrendingUp, Medal, School, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

export type HallOfFameTab = 'overview' | 'standings' | 'trends' | 'all-time' | 'profiles'

interface HallOfFameHeaderProps {
  activeTab: HallOfFameTab
  onTabChange: (tab: HallOfFameTab) => void
  selectedCampusName?: string
}

export const HallOfFameHeader: React.FC<HallOfFameHeaderProps> = ({
  activeTab,
  onTabChange,
  selectedCampusName,
}) => {
  const tabs: Array<{ id: HallOfFameTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Ringkasan Eksekutif', icon: Sparkles },
    { id: 'standings', label: 'Klasemen Per Periode', icon: Trophy },
    { id: 'trends', label: 'Tren Historis', icon: TrendingUp },
    { id: 'all-time', label: 'Peringkat Sepanjang Masa', icon: Medal },
    {
      id: 'profiles',
      label: selectedCampusName ? `Profil: ${selectedCampusName}` : 'Profil Kampus',
      icon: School,
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C241B] via-[#0E3527] to-[#14532D] text-white shadow-xl border border-emerald-800/40">
      {/* Subtle Scientific Geometry & Islamic Star Watermarks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <svg viewBox="0 0 800 400" className="w-full h-full" fill="none" stroke="#A7F3D0" strokeWidth="0.75">
          <circle cx="700" cy="80" r="140" strokeDasharray="4 6" />
          <circle cx="700" cy="80" r="100" />
          <rect x="630" y="10" width="140" height="140" />
          <rect x="630" y="10" width="140" height="140" transform="rotate(45 700 80)" />
          <circle cx="100" cy="350" r="180" strokeDasharray="3 5" />
          <path d="M 0,200 Q 200,100 400,200 T 800,200" stroke="#D5C49A" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#D5C49A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header Content */}
      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-xs font-semibold text-[#A7F3D0] backdrop-blur-md">
          <Trophy className="w-3.5 h-3.5 text-[#D5C49A]" />
          <span>Arsip Prestasi & Peringkat Resmi Antar-Kampus</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-sans leading-tight">
          OGSO Hall of Fame
        </h1>

        <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal max-w-2xl mx-auto">
          Pusat analitik capaian sains dan statistik peringkat historis resmi Pondok Modern Darussalam Gontor lintas periode dan jenjang kompetisi.
        </p>

        {/* Tab Navigation Pill Bar */}
        <div className="pt-6 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-black/35 backdrop-blur-md border border-emerald-500/20 max-w-full gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-[#166534] text-white shadow-md border border-emerald-400/30'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#D5C49A]' : 'text-emerald-300')} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
