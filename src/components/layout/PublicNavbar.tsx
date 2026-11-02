import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BookOpen,
  Archive,
  ShieldCheck,
  LogIn,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

export const PublicNavbar: React.FC = () => {
  const { appProfile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { title: 'Silabus', href: '/materi/silabus', icon: BookOpen },
    { title: 'Bank Soal', href: '/materi/bank-soal', icon: Archive },
    { title: 'Verifikasi Sertifikat', href: '/verify', icon: ShieldCheck },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/materi/silabus" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 shrink-0">
            <img src="/logo.png" alt="Logo OGSOreg" className="w-9 h-9 object-contain drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                OGSO<span className="text-[#166534]">reg</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Materi & Arsip
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Olimpiade Gontor Sains & Matematika
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )
                }
              >
                <Icon className="w-4 h-4 text-emerald-600" />
                <span>{link.title}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          {appProfile ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Buka Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Masuk / Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {appProfile ? (
            <Link
              to="/dashboard"
              className="p-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="p-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Login
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  )
                }
              >
                <Icon className="w-4 h-4 text-emerald-600" />
                <span>{link.title}</span>
              </NavLink>
            )
          })}
        </div>
      )}
    </header>
  )
}
