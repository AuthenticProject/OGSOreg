import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

interface ScrollRevealProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade'
  delay?: number // in ms
  duration?: number // in ms
  className?: string
  once?: boolean
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  className = '',
  once = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If browser doesn't support IntersectionObserver, show directly
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (once && domRef.current) {
              observer.unobserve(domRef.current)
            }
          } else if (!once) {
            setIsVisible(false)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    const currentRef = domRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [once])

  const getTransitionStyle = () => {
    if (isVisible) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100'
    }

    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-10 scale-[0.98]'
      case 'down':
        return 'opacity-0 -translate-y-10 scale-[0.98]'
      case 'left':
        return 'opacity-0 translate-x-12'
      case 'right':
        return 'opacity-0 -translate-x-12'
      case 'zoom':
        return 'opacity-0 scale-90'
      case 'fade':
      default:
        return 'opacity-0'
    }
  }

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={cn(
        'transition-all ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity]',
        getTransitionStyle(),
        className
      )}
    >
      {children}
    </div>
  )
}
