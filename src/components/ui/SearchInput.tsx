import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChangeValue?: (val: string) => void
  onClear?: () => void
  className?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeValue,
  onClear,
  className,
  placeholder = 'Cari...',
  ...props
}) => {
  return (
    <div className={cn('relative flex items-center min-w-[220px]', className)}>
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue?.(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-maroon focus:border-brand-maroon transition-all"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChangeValue?.('')
            onClear?.()
          }}
          className="absolute right-2.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          title="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
