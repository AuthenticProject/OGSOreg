import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-lg text-sm',
  {
    variants: {
      variant: {
        primary:
          'bg-[#166534] text-white hover:bg-[#14532D] active:bg-[#052E16] focus-visible:ring-[#22C55E] shadow-sm',
        accent:
          'bg-[#22C55E] text-white font-semibold hover:bg-[#16A34A] focus-visible:ring-[#22C55E] shadow-sm',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400',
        outline:
          'border border-border bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-[#22C55E]',
        greenOutline:
          'border border-[#166534]/30 text-[#166534] bg-white hover:bg-[#DCFCE7]/40 focus-visible:ring-[#22C55E]',
        maroonOutline:
          'border border-[#166534]/30 text-[#166534] bg-white hover:bg-[#DCFCE7]/40 focus-visible:ring-[#22C55E]',
        maroon:
          'bg-[#166534] text-white hover:bg-[#14532D] active:bg-[#052E16] focus-visible:ring-[#22C55E] shadow-sm',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
        danger:
          'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-4 py-2 gap-2',
        lg: 'h-11 px-6 text-base gap-2.5',
        icon: 'h-9 w-9 p-0 flex items-center justify-center',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
