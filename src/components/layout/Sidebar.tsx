import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  Users,
  GraduationCap,
  Building2,
  FileSpreadsheet,
  Download,
  Settings,
  X,
  ShieldCheck,
  Sparkles,
  FileText,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dasbor',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Pendaftaran Kolektif',
    href: '/imports',
    icon: FileSpreadsheet,
    badge: 'Moodle',
  },
  {
    title: 'Siswa Saya',
    href: '/students',
    icon: Users,
    badge: 'Santri',
  },
  {
    title: 'Riwayat',
    href: '/batches',
    icon: Layers,
  },
  {
    title: 'Laporan',
    href: '/reports',
    icon: FileText,
    badge: 'Baru',
  },
  {
    title: 'Export Data',
    href: '/exports',
    icon: Download,
  },
  {
    title: 'Guru Pembimbing',
    href: '/teachers',
    icon: GraduationCap,
  },
  {
    title: 'Sekolah Mitra',
    href: '/schools',
    icon: Building2,
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Settings,
  },
]

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0F3D20] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-[#0B2F19]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 bg-[#0B2F19]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#166534] text-white font-black shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  OGSO<span className="text-[#22C55E]">reg</span>
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                  v4.0
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                Pendaftaran & Moodle LMS
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Tutup navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-white/15 text-white font-semibold shadow-inner'
                      : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#22C55E] rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-transform group-hover:scale-105',
                          isActive ? 'text-[#22C55E]' : 'text-emerald-200/70 group-hover:text-white'
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          isActive
                            ? 'bg-[#22C55E] text-slate-950'
                            : 'bg-white/10 text-emerald-200 group-hover:bg-white/20'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Institutional Account Info Card */}
        <div className="p-3 border-t border-white/10 bg-[#0B2F19]">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
              <p className="text-xs font-semibold text-emerald-100 truncate">
                Panitia OGSO Gontor
              </p>
            </div>
            <p className="text-[11px] text-emerald-300/60 leading-tight">
              Tahun Ajaran 2026/2027 • LMS Moodle
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
