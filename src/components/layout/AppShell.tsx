import React, { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { PublicNavbar } from './PublicNavbar'
import { ForcePasswordChangeModal } from '../auth/ForcePasswordChangeModal'
import { useAuth } from '../../context/AuthContext'

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { appProfile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-500">
        <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isPublicRoute =
    location.pathname.startsWith('/materi') ||
    location.pathname.startsWith('/verify') ||
    location.pathname.startsWith('/sertifikat')

  // If user is not logged in:
  if (!appProfile) {
    // If accessing public educational materials or verification, render Public Shell
    if (isPublicRoute) {
      return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
          <PublicNavbar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Olimpiade Gontor Sains & Matematika (OGSO). Hak Cipta Dilindungi.
          </footer>
        </div>
      )
    }

    // Strictly redirect all other internal pages to /login
    return <Navigate to="/login" replace />
  }

  // Authenticated user session
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Mandatory First-Login Password Change Modal */}
      <ForcePasswordChangeModal />

      {/* Sidebar (Desktop persistent, Mobile off-canvas) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
