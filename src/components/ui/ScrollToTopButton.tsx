import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ScrollToTopButtonProps {
  threshold?: number
  className?: string
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  threshold = 350,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke awal halaman"
      title="Kembali ke Awal Halaman"
      className={cn(
        'fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl transition-all duration-500 cursor-pointer flex items-center justify-center group select-none shadow-2xl backdrop-blur-md',
        'bg-gradient-to-tr from-[#071510]/95 via-[#0C241B]/95 to-[#166534]/95 text-[#A7F3D0] border-2 border-emerald-400/50 hover:border-[#D5C49A] hover:shadow-emerald-500/40 hover:scale-110 active:scale-95',
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none',
        className
      )}
    >
      {/* Subtle pulse ring on idle hover */}
      <span className="absolute -inset-1 rounded-2xl bg-emerald-400/20 blur-sm group-hover:bg-[#D5C49A]/30 transition-all pointer-events-none" />

      <ArrowUp className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-white" />

      {/* Floating text badge on hover (desktop) */}
      <span className="sr-only">Kembali ke Atas</span>
    </button>
  )
}
