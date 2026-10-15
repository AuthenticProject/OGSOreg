import React from 'react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  variant?: 'default' | 'accent' | 'warning' | 'maroon'
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-card border-border hover:border-slate-300',
    accent: 'bg-card border-[#22C55E]/40 hover:border-[#22C55E] shadow-card',
    warning: 'bg-card border-amber-200 hover:border-amber-300 shadow-card',
    maroon: 'bg-card border-[#166534]/20 hover:border-[#166534]/50 shadow-card',
  }

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-700',
    accent: 'bg-[#DCFCE7] text-[#166534]',
    warning: 'bg-amber-100 text-amber-800',
    maroon: 'bg-[#DCFCE7] text-[#166534]',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 shadow-subtle transition-all duration-200',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className={cn('p-2.5 rounded-lg flex items-center justify-center', iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
