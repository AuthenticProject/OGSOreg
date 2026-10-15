import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Layers,
} from 'lucide-react'
import { SearchInput } from '../ui/SearchInput'
import { useImportStore, type FilterStatusType } from '../../stores/importStore'

export const ValidationSummary: React.FC = () => {
  const { stats, filterStatus, setFilterStatus, searchTerm, setSearchTerm } =
    useImportStore()

  const filterTabs: {
    key: FilterStatusType
    label: string
    count: number
    icon: React.ReactNode
    badgeClass: string
    activeClass: string
  }[] = [
    {
      key: 'ALL',
      label: 'Semua Data',
      count: stats.total,
      icon: <Layers className="w-3.5 h-3.5" />,
      badgeClass: 'bg-slate-100 text-slate-700',
      activeClass: 'bg-slate-900 text-white',
    },
    {
      key: 'VALID',
      label: 'Valid',
      count: stats.valid,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      activeClass: 'bg-emerald-700 text-white',
    },
    {
      key: 'WARNING',
      label: 'Peringatan',
      count: stats.warning,
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      activeClass: 'bg-amber-600 text-white',
    },
    {
      key: 'ERROR',
      label: 'Error',
      count: stats.error,
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      activeClass: 'bg-rose-700 text-white',
    },
    {
      key: 'DUPLICATE',
      label: 'Duplikat',
      count: stats.duplicate,
      icon: <Copy className="w-3.5 h-3.5 text-purple-600" />,
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      activeClass: 'bg-purple-700 text-white',
    },
  ]

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-border shadow-subtle space-y-4">
      {/* Top Filter Buttons & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const isActive = filterStatus === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? tab.activeClass + ' border-transparent shadow-sm'
                    : 'bg-white border-border text-slate-700 hover:bg-slate-50'
                }`}
              >
                {!isActive && tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeClass
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <SearchInput
          value={searchTerm}
          onChangeValue={setSearchTerm}
          placeholder="Cari username, nama, email, jenjang..."
          className="w-full lg:w-72"
        />
      </div>
    </div>
  )
}
