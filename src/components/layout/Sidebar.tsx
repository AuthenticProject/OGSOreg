import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Layers,
  Sliders,
  FileCode,
  Inbox,
  Calendar,
  BookOpen,
  Archive,
  UserCog,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  X,
  Award,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface SubMenuItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  superAdminOnly?: boolean
}

interface MenuSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  subItems: SubMenuItem[]
  superAdminOnly?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isSuperAdmin, appProfile } = useAuth()
  const location = useLocation()

  // Track expanded state for the 4 expandable menus
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    pendaftaran: true,
    participant: true,
    materi: false,
    pengaturan: false,
  })

  // Auto-expand menu section matching the current URL
  useEffect(() => {
    const path = location.pathname

    if (
      path.startsWith('/pendaftaran') ||
      path === '/imports' ||
      path === '/students' ||
      path === '/batches' ||
      path === '/custom-fields' ||
      path === '/reports' ||
      path === '/exports'
    ) {
      setExpanded((prev) => ({ ...prev, pendaftaran: true }))
    } else if (path.startsWith('/participant')) {
      setExpanded((prev) => ({ ...prev, participant: true }))
    } else if (path.startsWith('/materi')) {
      setExpanded((prev) => ({ ...prev, materi: true }))
    } else if (
      path.startsWith('/pengaturan') ||
      path === '/users' ||
      path === '/settings'
    ) {
      setExpanded((prev) => ({ ...prev, pengaturan: true }))
    }
  }, [location.pathname, location.search])

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Define the Approved 4 Expandable Main Menus
  const menuSections: MenuSection[] = [
    {
      id: 'pendaftaran',
      title: 'PENDAFTARAN',
      icon: FileSpreadsheet,
      subItems: [
        {
          title: 'Pendaftaran Kolektif',
          href: '/imports',
          icon: FileSpreadsheet,
        },
        {
          title: 'Pendaftaran Masuk',
          href: '/pendaftaran/masuk',
          icon: Inbox,
          badge: 'Super Admin',
          superAdminOnly: true,
        },
        {
          title: 'Siswa Saya',
          href: '/students',
          icon: Users,
          badge: 'Santri',
        },
        {
          title: 'Riwayat Pendaftaran',
          href: '/batches',
          icon: Layers,
        },
        {
          title: 'Pengaturan Kolom',
          href: '/custom-fields?tab=excel',
          icon: Sliders,
          badge: 'Super Admin',
          superAdminOnly: true,
        },
        {
          title: 'Mapping CSV Moodle',
          href: '/custom-fields?tab=moodle',
          icon: FileCode,
          badge: 'Super Admin',
          superAdminOnly: true,
        },
      ],
    },
    {
      id: 'participant',
      title: 'PARTICIPANT',
      icon: Award,
      subItems: [
        {
          title: 'Periode',
          href: '/participant/periode',
          icon: Calendar,
        },
      ],
    },
    {
      id: 'materi',
      title: 'MATERI',
      icon: BookOpen,
      subItems: [
        {
          title: 'Silabus',
          href: '/materi/silabus',
          icon: BookOpen,
        },
        {
          title: 'Bank Soal',
          href: '/materi/bank-soal',
          icon: Archive,
        },
      ],
    },
    {
      id: 'pengaturan',
      title: 'PENGATURAN',
      icon: Settings,
      subItems: [
        {
          title: 'Manajemen Pengguna',
          href: '/users',
          icon: UserCog,
          badge: 'Super Admin',
          superAdminOnly: true,
        },
        {
          title: 'Pengaturan Akun',
          href: '/pengaturan/akun',
          icon: UserCheck,
        },
        {
          title: 'Pengaturan Umum',
          href: '/settings',
          icon: Settings,
          badge: 'Super Admin',
          superAdminOnly: true,
        },
      ],
    },
  ]

  const isRouteActive = (href: string) => {
    const [pathPart, queryPart] = href.split('?')
    if (queryPart) {
      return (
        location.pathname === pathPart &&
        location.search.includes(queryPart)
      )
    }
    return location.pathname === pathPart || (pathPart !== '/dashboard' && location.pathname.startsWith(pathPart + '/'))
  }

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
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 bg-[#0B2F19] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 shrink-0">
              <img src="/logo.png" alt="Logo OGSOreg" className="w-9 h-9 object-contain drop-shadow-sm" />
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

        {/* Scrollable Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 custom-scrollbar">
          {/* STANDALONE: DASHBOARD */}
          <div>
            <NavLink
              to="/dashboard"
              onClick={() => {
                if (window.innerWidth < 1024) onClose()
              }}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[#22C55E]/20 text-white shadow-inner border border-[#22C55E]/30'
                    : 'text-emerald-100/85 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#22C55E] rounded-r-full" />
                    )}
                    <LayoutDashboard
                      className={cn(
                        'w-4 h-4 transition-transform group-hover:scale-105',
                        isActive ? 'text-[#22C55E]' : 'text-emerald-200/70 group-hover:text-white'
                      )}
                    />
                    <span>DASHBOARD</span>
                  </div>
                </>
              )}
            </NavLink>
          </div>

          <div className="h-px bg-white/10 my-2" />

          {/* 4 EXPANDABLE MAIN MENUS */}
          {menuSections.map((section) => {
            const visibleSubItems = section.subItems.filter(
              (item) => !item.superAdminOnly || isSuperAdmin
            )

            if (visibleSubItems.length === 0) return null

            const isExpanded = expanded[section.id]
            const SectionIcon = section.icon
            const hasActiveChild = visibleSubItems.some((sub) => isRouteActive(sub.href))

            return (
              <div key={section.id} className="space-y-1">
                {/* Expandable Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors select-none text-left',
                    hasActiveChild
                      ? 'text-[#22C55E]'
                      : 'text-emerald-300/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5 opacity-80" />
                    <span>{section.title}</span>
                  </div>
                  <div className="text-emerald-300/60">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {/* Submenu Items List */}
                {isExpanded && (
                  <div className="pl-3 ml-2 border-l border-white/10 space-y-0.5 pt-0.5">
                    {visibleSubItems.map((sub) => {
                      const SubIcon = sub.icon
                      const active = isRouteActive(sub.href)

                      return (
                        <NavLink
                          key={sub.href}
                          to={sub.href}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose()
                          }}
                          className={cn(
                            'group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                            active
                              ? 'bg-white/15 text-white font-semibold shadow-inner'
                              : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {active && (
                              <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#22C55E] rounded-r-full" />
                            )}
                            <SubIcon
                              className={cn(
                                'w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105',
                                active
                                  ? 'text-[#22C55E]'
                                  : 'text-emerald-300/60 group-hover:text-white'
                              )}
                            />
                            <span className="truncate">{sub.title}</span>
                          </div>

                          {sub.badge && (
                            <span
                              className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1',
                                active
                                  ? 'bg-[#22C55E] text-slate-950'
                                  : 'bg-white/10 text-emerald-200 group-hover:bg-white/20'
                              )}
                            >
                              {sub.badge}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Quick Link to Public Website */}
        <div className="px-3 pt-2 pb-2 shrink-0">
          <NavLink
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/20 text-xs font-semibold text-emerald-200 hover:text-white transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#A7F3D0] group-hover:rotate-12 transition-transform" />
              <span>Lihat Website Publik</span>
            </div>
            <ExternalLink className="w-3 h-3 text-emerald-400/70 group-hover:text-white" />
          </NavLink>
        </div>

        {/* Institutional Account Info Card */}
        <div className="p-3 border-t border-white/10 bg-[#0B2F19] shrink-0">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
              <p className="text-xs font-semibold text-emerald-100 truncate">
                {appProfile?.display_name || 'Panitia OGSO'}
              </p>
            </div>
            <p className="text-[11px] text-emerald-300/70 leading-tight">
              {isSuperAdmin
                ? 'Hak Akses: Seluruh 20 Kampus'
                : `Kontingen: ${appProfile?.campus_id || 'Kampus'}`}
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
