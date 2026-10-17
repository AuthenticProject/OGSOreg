import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Plus,
  Search,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useImportStore } from '../../stores/importStore'
import { MOODLE_JENJANG_OPTIONS, type StagedParticipantRow } from '../../types/excel'
import { KAMPUS_OPTIONS } from '../../types/campus'
import { customFieldService } from '../../services/customFieldService'
import type { CustomFieldDefinition } from '../../types/customField'

// Editable Cell for Text Fields
interface EditableCellProps {
  row: StagedParticipantRow
  field: string
  value: string
  onSave: (rowId: string, field: string, value: string) => void
  placeholder?: string
  widthClass?: string
}

const EditableCell: React.FC<EditableCellProps> = ({
  row,
  field,
  value,
  onSave,
  placeholder = '-',
  widthClass = 'min-w-[120px]',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value || '')

  const errorMessage = row._errors[field]
  const warningMessage = row._warnings[field]
  const hasError = !!errorMessage
  const hasWarning = !!warningMessage && !hasError

  const handleBlur = () => {
    setIsEditing(false)
    if (tempValue !== (value || '')) {
      onSave(row._rowId, String(field), tempValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setTempValue(value || '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1 text-xs rounded border bg-white focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-rose-400 focus:ring-rose-500'
            : hasWarning
            ? 'border-amber-400 focus:ring-amber-500'
            : 'border-brand-maroon focus:ring-brand-maroon'
        }`}
      />
    )
  }

  return (
    <div
      onClick={() => {
        setTempValue(value || '')
        setIsEditing(true)
      }}
      title={errorMessage || warningMessage || 'Klik untuk mengedit data ini'}
      className={`group relative flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-all ${widthClass} ${
        hasError
          ? 'bg-rose-50 text-rose-950 border border-rose-300 hover:bg-rose-100/80 font-medium'
          : hasWarning
          ? 'bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100/80'
          : 'hover:bg-slate-100 text-slate-800'
      }`}
    >
      <span className="truncate">
        {value ? value : <span className="text-slate-400 italic">{placeholder}</span>}
      </span>

      {hasError ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1.5" />
      ) : hasWarning ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1.5" />
      ) : null}

      {(hasError || hasWarning) && (
        <div className="absolute left-0 bottom-full mb-1 z-30 hidden group-hover:block max-w-xs p-2 text-[11px] rounded bg-slate-900 text-white shadow-lg pointer-events-none whitespace-normal leading-tight">
          <p className="font-semibold text-rose-300">{hasError ? 'Error:' : 'Peringatan:'}</p>
          <p>{errorMessage || warningMessage}</p>
        </div>
      )}
    </div>
  )
}

// Editable Dropdown Cell specifically for Jenjang and Kampus
interface EditableDropdownCellProps {
  row: StagedParticipantRow
  field: string
  value: string
  options: readonly string[]
  onSave: (rowId: string, field: string, value: string) => void
  placeholder?: string
  widthClass?: string
}

const EditableDropdownCell: React.FC<EditableDropdownCellProps> = ({
  row,
  field,
  value,
  options,
  onSave,
  placeholder,
  widthClass = 'min-w-[120px]',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const errorMessage = row._errors[field]
  const hasError = !!errorMessage

  if (isEditing) {
    return (
      <select
        autoFocus
        value={value || ''}
        onChange={(e) => {
          onSave(row._rowId, String(field), e.target.value)
          setIsEditing(false)
        }}
        onBlur={() => setIsEditing(false)}
        className="w-full px-2 py-1 text-xs rounded border border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white"
      >
        <option value="" disabled>-- {placeholder || 'Pilih Opsi'} --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      title={errorMessage || `Klik untuk memilih ${String(field)}`}
      className={`group relative flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-all ${widthClass} ${
        hasError
          ? 'bg-rose-50 text-rose-950 border border-rose-300 font-medium'
          : 'hover:bg-slate-100 text-slate-800'
      }`}
    >
      <span className="truncate font-medium">
        {value ? value : <span className="text-slate-400 italic">{placeholder || '- Pilih -'}</span>}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 ml-1" />

      {hasError && (
        <div className="absolute left-0 bottom-full mb-1 z-30 hidden group-hover:block max-w-xs p-2 text-[11px] rounded bg-slate-900 text-white shadow-lg pointer-events-none whitespace-normal leading-tight">
          <p className="font-semibold text-rose-300">Error:</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  )
}

export const StagedDataGrid: React.FC = () => {
  const {
    stagedRows,
    filterStatus,
    searchTerm,
    updateCell,
    applyUsernameSuggestion,
    deleteSelectedRows,
    deleteSingleRow,
    selectedRowIds,
    toggleSelectRow,
    toggleSelectAll,
    addManualRow,
  } = useImportStore()

  const [activeCustomFields, setActiveCustomFields] = useState<CustomFieldDefinition[]>(() =>
    customFieldService.getActiveFieldsSync()
  )

  React.useEffect(() => {
    return customFieldService.subscribe((fields) => {
      setActiveCustomFields(
        fields.filter((f) => f.is_active).sort((a, b) => a.display_order - b.display_order)
      )
    })
  }, [])

  const [pageSize, setPageSize] = useState(25)

  // Filter & Search data
  const filteredData = useMemo(() => {
    return stagedRows.filter((row) => {
      // 1. Status Filter
      if (filterStatus === 'VALID' && row._status !== 'VALID') return false
      if (filterStatus === 'WARNING' && row._status !== 'WARNING') return false
      if (filterStatus === 'ERROR' && row._status !== 'ERROR') return false
      if (filterStatus === 'DUPLICATE' && !row._isDuplicate) return false

      // 2. Search Term Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchUsername = (row.username || '').toLowerCase().includes(query)
        const matchFirstname = (row.firstname || '').toLowerCase().includes(query)
        const matchLastname = (row.lastname || '').toLowerCase().includes(query)
        const matchEmail = (row.email || '').toLowerCase().includes(query)
        const matchJenjang = (row.jenjang || '').toLowerCase().includes(query)
        const matchFullName = (row.full_name || '').toLowerCase().includes(query)
        const matchNisn = (row.nisn || '').toLowerCase().includes(query)

        return (
          matchUsername ||
          matchFirstname ||
          matchLastname ||
          matchEmail ||
          matchJenjang ||
          matchFullName ||
          matchNisn
        )
      }

      return true
    })
  }, [stagedRows, filterStatus, searchTerm])

  const allFilteredIds = useMemo(() => filteredData.map((r) => r._rowId), [filteredData])
  const isAllSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedRowIds.includes(id))

  // Columns definition
  const columns = useMemo<ColumnDef<StagedParticipantRow>[]>(() => {
    return [
      {
        id: 'select',
        header: () => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => toggleSelectAll(allFilteredIds)}
              className="w-4 h-4 rounded border-slate-300 text-brand-maroon focus:ring-brand-maroon cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedRowIds.includes(row.original._rowId)}
              onChange={() => toggleSelectRow(row.original._rowId)}
              className="w-4 h-4 rounded border-slate-300 text-brand-maroon focus:ring-brand-maroon cursor-pointer"
            />
          </div>
        ),
        size: 40,
      },
      {
        accessorKey: '_rowIndex',
        header: 'No',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            #{row.original._rowIndex}
          </span>
        ),
        size: 50,
      },
      {
        accessorKey: '_status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original._status
          const isDup = row.original._isDuplicate

          if (isDup) {
            return (
              <span
                title={row.original._duplicateReason}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200"
              >
                <Copy className="w-3 h-3 text-purple-600" />
                Duplikat
              </span>
            )
          }

          if (status === 'VALID') {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Valid
              </span>
            )
          }

          if (status === 'WARNING') {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Cek
              </span>
            )
          }

          return (
            <span
              title={Object.values(row.original._errors).join('\n')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
            >
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Error
            </span>
          )
        },
        size: 90,
      },
      {
        accessorKey: 'username',
        header: 'Username *',
        cell: ({ row }) => {
          const suggestions = row.original._usernameSuggestions
          const hasError = !!row.original._errors['username']
          return (
            <div className="space-y-1">
              <EditableCell
                row={row.original}
                field="username"
                value={row.original.username || row.original.nisn || ''}
                onSave={updateCell}
                placeholder="Username..."
                widthClass="min-w-[140px] font-mono text-xs"
              />
              {hasError && suggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                  <span className="text-slate-500 font-medium">Saran:</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        applyUsernameSuggestion(row.original._rowId, sug)
                      }}
                      className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-mono font-bold border border-emerald-300 transition-colors shadow-2xs"
                      title={`Klik untuk memakai saran: ${sug}`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'firstname',
        header: 'Nama Depan *',
        cell: ({ row }) => (
          <EditableCell
            row={row.original}
            field="firstname"
            value={row.original.firstname || (row.original.full_name ? row.original.full_name.split(' ')[0] : '')}
            onSave={updateCell}
            placeholder="Nama Depan..."
            widthClass="min-w-[140px]"
          />
        ),
      },
      {
        accessorKey: 'lastname',
        header: 'Nama Belakang *',
        cell: ({ row }) => (
          <EditableCell
            row={row.original}
            field="lastname"
            value={row.original.lastname || (row.original.full_name ? row.original.full_name.split(' ').slice(1).join(' ') || row.original.full_name : '')}
            onSave={updateCell}
            placeholder="Nama Belakang..."
            widthClass="min-w-[140px]"
          />
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email *',
        cell: ({ row }) => (
          <EditableCell
            row={row.original}
            field="email"
            value={row.original.email || row.original.teacher_email || ''}
            onSave={updateCell}
            placeholder="user@domain.com"
            widthClass="min-w-[180px] font-mono"
          />
        ),
      },
      {
        accessorKey: 'jenjang',
        header: 'Jenjang *',
        cell: ({ row }) => (
          <EditableDropdownCell
            row={row.original}
            field="jenjang"
            value={row.original.jenjang || row.original.grade_level || 'Kelas 1'}
            options={MOODLE_JENJANG_OPTIONS}
            onSave={updateCell}
            placeholder="Pilih Jenjang"
            widthClass="min-w-[120px]"
          />
        ),
      },
      {
        accessorKey: 'kampus',
        header: 'Kampus *',
        cell: ({ row }) => (
          <EditableDropdownCell
            row={row.original}
            field="kampus"
            value={row.original.kampus || ''}
            options={KAMPUS_OPTIONS}
            onSave={updateCell}
            placeholder="Pilih Kampus"
            widthClass="min-w-[150px]"
          />
        ),
      },
      // Dynamic Custom Fields Columns (Configured by Super Admin)
      ...activeCustomFields.map((cf) => ({
        id: `custom_${cf.key}`,
        header: `${cf.label}${cf.is_required ? ' *' : ''}`,
        cell: ({ row }: { row: { original: StagedParticipantRow } }) => {
          const fieldKey = `custom_${cf.key}`
          const val = row.original.custom_fields?.[cf.key] ?? ''
          if (cf.field_type === 'dropdown' && cf.options && cf.options.length > 0) {
            return (
              <EditableDropdownCell
                row={row.original}
                field={fieldKey}
                value={String(val)}
                options={cf.options}
                onSave={updateCell}
                placeholder={`Pilih ${cf.label}`}
                widthClass="min-w-[130px]"
              />
            )
          }
          return (
            <EditableCell
              row={row.original}
              field={fieldKey}
              value={String(val)}
              onSave={updateCell}
              placeholder={`${cf.label}...`}
              widthClass="min-w-[130px]"
            />
          )
        },
      })),
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={() => deleteSingleRow(row.original._rowId)}
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Hapus baris ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ),
        size: 50,
      },
    ]
  }, [
    isAllSelected,
    selectedRowIds,
    allFilteredIds,
    updateCell,
    applyUsernameSuggestion,
    activeCustomFields,
    deleteSingleRow,
    toggleSelectAll,
    toggleSelectRow,
  ])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  return (
    <div className="bg-white rounded-2xl border border-border shadow-subtle flex flex-col overflow-hidden">
      {/* Top Action Toolbar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addManualRow({ jenjang: 'Kelas 1' })}
            leftIcon={<Plus className="w-4 h-4 mr-1" />}
          >
            Tambah Peserta
          </Button>

          {selectedRowIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={deleteSelectedRows}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              leftIcon={<Trash2 className="w-4 h-4 mr-1" />}
            >
              Hapus Terpilih ({selectedRowIds.length})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Menampilkan <strong>{filteredData.length}</strong> dari <strong>{stagedRows.length}</strong> peserta
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              const val = Number(e.target.value)
              setPageSize(val)
              table.setPageSize(val)
            }}
            className="px-2.5 py-1 text-xs rounded-lg border border-border bg-white text-slate-700 focus:outline-none"
          >
            <option value={10}>10 per hal</option>
            <option value={25}>25 per hal</option>
            <option value={50}>50 per hal</option>
            <option value={100}>100 per hal</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-slate-50/90">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3.5 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    row.original._status === 'ERROR'
                      ? 'bg-rose-50/25'
                      : row.original._status === 'WARNING'
                      ? 'bg-amber-50/20'
                      : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-2.5 text-xs text-slate-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold">Tidak ada peserta yang cocok</p>
                    <p className="text-xs">Ubah kata kunci pencarian atau filter status Anda.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {table.getPageCount() > 1 && (
        <div className="p-3 border-t border-border flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-muted-foreground">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-border bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-border bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
