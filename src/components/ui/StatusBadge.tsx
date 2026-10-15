import React from 'react'
import { CheckCircle2, Clock, AlertTriangle, FileEdit } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { RegistrationStatus } from '../../types'

interface StatusBadgeProps {
  status: RegistrationStatus
  className?: string
  showIcon?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const configs: Record<
    RegistrationStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    completed: {
      label: 'Selesai',
      bg: 'bg-emerald-50 text-emerald-800',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    verified: {
      label: 'Terverifikasi',
      bg: 'bg-emerald-50 text-emerald-800',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    pending: {
      label: 'Diproses',
      bg: 'bg-amber-50 text-amber-800',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    need_review: {
      label: 'Perlu Periksa',
      bg: 'bg-rose-50 text-rose-800',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
    },
    draft: {
      label: 'Draft',
      bg: 'bg-slate-50 text-slate-700',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: <FileEdit className="w-3.5 h-3.5 text-slate-500" />,
    },
  }

  const current = configs[status] || configs.draft

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        current.bg,
        current.border,
        className
      )}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  )
}
