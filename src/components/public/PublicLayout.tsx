import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8F4] text-[#0C241B] font-sans antialiased selection:bg-[#166534] selection:text-white">
      <PublicNavbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
