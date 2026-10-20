import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  BookOpen,
  Archive,
  Trophy,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
  Download,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

export const PublicNavbar: React.FC = () => {
  const { appProfile } = useAuth()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [materiDropdownOpen, setMateriDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setMateriDropdownOpen(false)
  }, [location.pathname])

  const isMateriActive = location.pathname.startsWith('/materi')

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 w-full',
        isScrolled
          ? 'bg-[#0C241B]/95 backdrop-blur-md shadow-lg border-b border-emerald-900/40 py-2.5'
          : 'bg-[#0C241B] border-b border-emerald-900/30 py-3.5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center w-10 h-10 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo.png"
                alt="Logo OGSO"
                className="w-10 h-10 object-contain drop-shadow-md"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#A7F3D0] transition-colors">
                  OGSO
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-[#A7F3D0] border border-emerald-500/30">
                  1448 / 2026
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-200/80 tracking-wide line-clamp-1">
                Gontor Science Olympiad
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2" aria-label="Main Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'text-[#A7F3D0] bg-emerald-950/70 border border-emerald-500/30'
                    : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                )
              }
            >
              Beranda
            </NavLink>

            <NavLink
              to="/tentang"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'text-[#A7F3D0] bg-emerald-950/70 border border-emerald-500/30'
                    : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                )
              }
            >
              Tentang OGSO
            </NavLink>

            <NavLink
              to="/pendaftaran"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'text-[#A7F3D0] bg-emerald-950/70 border border-emerald-500/30'
                    : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                )
              }
            >
              Pendaftaran
            </NavLink>

            {/* Materi Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMateriDropdownOpen(true)}
              onMouseLeave={() => setMateriDropdownOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer',
                  isMateriActive
                    ? 'text-[#A7F3D0] bg-emerald-950/70 border border-emerald-500/30'
                    : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                )}
                onClick={() => setMateriDropdownOpen((prev) => !prev)}
                aria-expanded={materiDropdownOpen}
              >
                <span>Materi</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-emerald-400 transition-transform duration-200',
                    materiDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {materiDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#0C241B] border border-emerald-800/70 shadow-2xl p-2.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <NavLink
                    to="/materi/silabus"
                    className={({ isActive }) =>
                      cn(
                        'flex items-start gap-3.5 p-3 rounded-xl text-xs transition-colors',
                        isActive
                          ? 'bg-emerald-900/60 text-[#A7F3D0]'
                          : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                      )
                    }
                  >
                    <BookOpen className="w-5 h-5 text-[#A7F3D0] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm">Silabus Resmi</div>
                      <div className="text-[11px] text-emerald-300/80 leading-snug">
                        Kurikulum & Buku Teks Kelas 1–5 KMI
                      </div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/materi/bank-soal"
                    className={({ isActive }) =>
                      cn(
                        'flex items-start gap-3.5 p-3 rounded-xl text-xs transition-colors mt-1',
                        isActive
                          ? 'bg-emerald-900/60 text-[#A7F3D0]'
                          : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                      )
                    }
                  >
                    <Archive className="w-5 h-5 text-[#A7F3D0] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm">Bank Soal</div>
                      <div className="text-[11px] text-emerald-300/80 leading-snug">
                        Arsip soal penyisihan & final
                      </div>
                    </div>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink
              to="/participant"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'text-[#A7F3D0] bg-emerald-950/70 border border-emerald-500/30'
                    : 'text-emerald-100/90 hover:text-white hover:bg-emerald-900/30'
                )
              }
            >
              <Trophy className="w-4 h-4 text-[#D5C49A]" />
              <span>Participant</span>
            </NavLink>
          </nav>

          {/* Action Button: JUKLAK Download & Admin Login */}
          <div className="hidden sm:flex items-center gap-3.5">
            <a
              href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
              download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#A7F3D0] bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-600/40 hover:border-emerald-500 transition-colors shadow-xs"
              title="Unduh Dokumen Petunjuk Pelaksanaan (JUKLAK) OGSO 2026"
            >
              <Download className="w-3.5 h-3.5 text-[#A7F3D0]" />
              <span>JUKLAK PDF</span>
            </a>

            {appProfile ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#166534] to-[#15803D] hover:from-[#14532D] hover:to-[#166534] border border-emerald-400/30 shadow-md hover:shadow-emerald-900/40 transition-all duration-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#A7F3D0]" />
                <span>Dashboard OGSOreg</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:from-[#86EFAC] hover:to-[#4ADE80] shadow-md hover:shadow-emerald-900/30 transition-all duration-200"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Admin</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {appProfile ? (
              <Link
                to="/dashboard"
                className="p-2 rounded-lg text-white bg-[#166534] hover:bg-[#14532D] border border-emerald-500/30 text-xs font-semibold"
                title="Buka Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 text-[#A7F3D0]" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#A7F3D0] text-[#0C241B]"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/40 border border-emerald-800/50 transition-colors"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 pb-4 border-t border-emerald-900/60 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-900/60 text-[#A7F3D0]'
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                Beranda
              </NavLink>

              <NavLink
                to="/tentang"
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-900/60 text-[#A7F3D0]'
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                Tentang OGSO
              </NavLink>

              <NavLink
                to="/pendaftaran"
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-900/60 text-[#A7F3D0]'
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                Informasi Pendaftaran
              </NavLink>

              <div className="pt-2 pb-1 px-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Materi & Kurikulum
                </span>
              </div>

              <NavLink
                to="/materi/silabus"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold pl-5 transition-colors',
                    isActive
                      ? 'bg-emerald-900/60 text-[#A7F3D0]'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                <BookOpen className="w-4 h-4 text-[#A7F3D0]" />
                <span>Silabus Resmi</span>
              </NavLink>

              <NavLink
                to="/materi/bank-soal"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold pl-5 transition-colors',
                    isActive
                      ? 'bg-emerald-900/60 text-[#A7F3D0]'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                <Archive className="w-4 h-4 text-[#A7F3D0]" />
                <span>Bank Soal Kompetisi</span>
              </NavLink>

              <NavLink
                to="/participant"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-900/60 text-[#A7F3D0]'
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                <Trophy className="w-4 h-4 text-[#D5C49A]" />
                <span>Participant & Periode</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-900/50 text-[#A7F3D0]'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/30'
                  )
                }
              >
                Verifikasi Sertifikat Online
              </NavLink>

              <div className="pt-3 border-t border-emerald-900/60 flex flex-col gap-2">
                <a
                  href="/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                  download="Petunjuk_Pelaksanaan_OGSO_2026.pdf"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#A7F3D0] bg-emerald-950/80 border border-emerald-600/40"
                >
                  <Download className="w-4 h-4 text-[#A7F3D0]" />
                  <span>Unduh JUKLAK 2026 (PDF)</span>
                </a>

                {appProfile ? (
                  <Link
                    to="/dashboard"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-[#166534] border border-emerald-400/30"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Buka Dashboard OGSOreg</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-[#0C241B] bg-[#A7F3D0]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login Admin Kampus</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
