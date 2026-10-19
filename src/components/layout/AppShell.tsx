import React, { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ForcePasswordChangeModal } from '../auth/ForcePasswordChangeModal'
import { useAuth } from '../../context/AuthContext'

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { appProfile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-500">
        <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If user is not logged in, redirect strictly to /login
  if (!appProfile) {
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
