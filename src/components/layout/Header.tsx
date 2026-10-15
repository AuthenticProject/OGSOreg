import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, HelpCircle, User, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  onToggleSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const { profile, institution, isConfigured, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-border shadow-subtle">
      {/* Left: Mobile Toggle & Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          aria-label="Buka menu samping"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            {isConfigured ? 'Supabase Backend Terhubung' : 'Mode Offline / Preview'}
          </span>
        </div>
      </div>

      {/* Right: Quick Tools & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Bantuan & Petunjuk Format"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Account Capsule */}
        <div className="flex items-center gap-2.5 pl-1 py-1 pr-2 rounded-full border border-border bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden md:block text-left text-xs pr-1">
            <p className="font-semibold text-slate-900 leading-tight">
              {profile?.full_name ? profile.full_name.split(' ')[0] : 'Admin'}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
              {institution?.name || 'SMA Darussalam'}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Keluar / Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
