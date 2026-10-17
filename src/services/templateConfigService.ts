import { customFieldService } from './customFieldService'
import type { CustomFieldType } from '../types/customField'

export interface ExcelTemplateColumnConfig {
  id: string
  key: string
  label: string
  originalLabel: string
  description: string
  is_standard: boolean
  is_required: boolean
  include_in_excel: boolean
  field_type: CustomFieldType
  options?: string[]
  display_order: number
}

const LOCAL_STORAGE_KEY = 'ogsoreg_excel_template_columns_v4'

export const DEFAULT_STANDARD_EXCEL_COLUMNS: ExcelTemplateColumnConfig[] = [
  {
    id: 'std_no',
    key: 'no',
    label: 'No.',
    originalLabel: 'No.',
    description: 'Nomor urut otomatis santri',
    is_standard: true,
    is_required: false,
    include_in_excel: true,
    field_type: 'number',
    display_order: 0,
  },
  {
    id: 'std_username',
    key: 'username',
    label: 'Username Moodle',
    originalLabel: 'Username Moodle',
    description: 'Username unik login Moodle santri',
    is_standard: true,
    is_required: true,
    include_in_excel: true,
    field_type: 'text',
    display_order: 1,
  },
  {
    id: 'std_firstname',
    key: 'firstname',
    label: 'Nama Depan',
    originalLabel: 'Nama Depan',
    description: 'Nama depan santri',
    is_standard: true,
    is_required: true,
    include_in_excel: true,
    field_type: 'text',
    display_order: 2,
  },
  {
    id: 'std_lastname',
    key: 'lastname',
    label: 'Nama Belakang',
    originalLabel: 'Nama Belakang',
    description: 'Nama belakang / keluarga santri',
    is_standard: true,
    is_required: false,
    include_in_excel: true,
    field_type: 'text',
    display_order: 3,
  },
  {
    id: 'std_email',
    key: 'email',
    label: 'Email Santri',
    originalLabel: 'Email Santri',
    description: 'Alamat email aktif untuk notifikasi',
    is_standard: true,
    is_required: true,
    include_in_excel: true,
    field_type: 'email',
    display_order: 4,
  },
  {
    id: 'std_jenjang',
    key: 'jenjang',
    label: 'Jenjang Lomba',
    originalLabel: 'Jenjang Lomba',
    description: 'Pilihan dropdown: Jenjang 1, Jenjang 2, Jenjang 3, Jenjang 4, Jenjang 5',
    is_standard: true,
    is_required: true,
    include_in_excel: true,
    field_type: 'dropdown',
    options: ['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5'],
    display_order: 5,
  },
  {
    id: 'std_kampus',
    key: 'kampus',
    label: 'Kampus Gontor',
    originalLabel: 'Kampus Gontor',
    description: 'Pilihan dropdown: 20 Kampus Resmi Gontor',
    is_standard: true,
    is_required: true,
    include_in_excel: true,
    field_type: 'dropdown',
    display_order: 6,
  },
  {
    id: 'std_kelas',
    key: 'kelas',
    label: 'Kelas Santri',
    originalLabel: 'Kelas Santri',
    description: 'Format penulisan kelas santri: 5-C, 1-B, 2-D, 1-Int-A, 3-S (Tingkat-Huruf)',
    is_standard: true,
    is_required: true,
    include_in_excel: true,
    field_type: 'text',
    display_order: 7,
  },
]

type Listener = (columns: ExcelTemplateColumnConfig[]) => void

class TemplateConfigService {
  private cache: ExcelTemplateColumnConfig[] = []
  private listeners: Set<Listener> = new Set()

  constructor() {
    this.init()
    // Subscribe to customFieldService changes
    if (typeof window !== 'undefined') {
      customFieldService.subscribe(() => {
        this.syncWithCustomFields()
      })
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener([...this.cache])
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    const copy = [...this.cache]
    this.listeners.forEach((l) => l(copy))
  }

  private init() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as ExcelTemplateColumnConfig[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure std_kelas exists in cached columns
            const hasKelas = parsed.some((c) => c.key === 'kelas')
            if (!hasKelas) {
              const defaultKelas = DEFAULT_STANDARD_EXCEL_COLUMNS.find((c) => c.key === 'kelas')!
              parsed.splice(5, 0, defaultKelas)
            }
            // Ensure jenjang options are updated to Jenjang 1-5
            const jenjangCol = parsed.find((c) => c.key === 'jenjang')
            if (jenjangCol) {
              jenjangCol.options = ['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5']
              jenjangCol.label = jenjangCol.label || 'Jenjang Lomba'
            }
            parsed.forEach((c, idx) => {
              c.display_order = idx
            })
            this.cache = parsed
            this.syncWithCustomFields()
            return
          }
        }
      } catch {
        // Fallback
      }
    }

    // Default initialization
    this.cache = [...DEFAULT_STANDARD_EXCEL_COLUMNS]
    this.syncWithCustomFields()
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.cache))
      } catch {
        // Quota
      }
    }
    this.notify()
  }

  /**
   * Merges custom fields from customFieldService into unified template columns list
   */
  public syncWithCustomFields() {
    const customFields = customFieldService.getActiveFieldsSync()
    const customFieldIds = new Set(customFields.map((cf) => cf.id))

    // 1. Keep existing cached columns that are either standard or still exist in custom fields
    const updated: ExcelTemplateColumnConfig[] = []
    const processedIds = new Set<string>()

    for (const col of this.cache) {
      if (col.is_standard) {
        updated.push(col)
        processedIds.add(col.id)
      } else if (customFieldIds.has(col.id)) {
        const cf = customFields.find((f) => f.id === col.id)
        if (cf) {
          updated.push({
            ...col,
            key: cf.key,
            label: col.label || cf.label,
            originalLabel: cf.label,
            field_type: cf.field_type,
            options: cf.options,
            include_in_excel: cf.include_in_excel,
            is_required: cf.is_required,
            description: cf.field_type === 'dropdown' 
              ? `Dropdown (${cf.options?.length || 0} pilihan)` 
              : cf.validation_rules?.placeholder || 'Input bebas',
          })
          processedIds.add(col.id)
        }
      }
    }

    // 2. Add any new custom fields that are not yet in template columns list
    customFields.forEach((cf) => {
      if (!processedIds.has(cf.id)) {
        updated.push({
          id: cf.id,
          key: cf.key,
          label: cf.label,
          originalLabel: cf.label,
          description: cf.field_type === 'dropdown'
            ? `Dropdown (${cf.options?.length || 0} pilihan)`
            : cf.validation_rules?.placeholder || 'Input bebas',
          is_standard: false,
          is_required: cf.is_required,
          include_in_excel: cf.include_in_excel,
          field_type: cf.field_type,
          options: cf.options,
          display_order: updated.length,
        })
      }
    })

    // Re-index display_order
    updated.forEach((col, idx) => {
      col.display_order = idx
    })

    this.cache = updated
    this.persist()
  }

  public getColumns(): ExcelTemplateColumnConfig[] {
    return [...this.cache]
  }

  public getActiveExcelColumnsSync(): ExcelTemplateColumnConfig[] {
    return this.cache.filter((col) => col.include_in_excel)
  }

  public async updateColumn(id: string, updates: Partial<ExcelTemplateColumnConfig>): Promise<void> {
    const idx = this.cache.findIndex((col) => col.id === id)
    if (idx === -1) return

    const current = this.cache[idx]
    const nextCol = { ...current, ...updates }
    this.cache[idx] = nextCol

    // If it's a custom field, sync updates back to customFieldService
    if (!current.is_standard) {
      const customFields = await customFieldService.getCustomFields()
      const cf = customFields.find((f) => f.id === id)
      if (cf) {
        await customFieldService.saveCustomField({
          ...cf,
          label: updates.label !== undefined ? updates.label : cf.label,
          include_in_excel: updates.include_in_excel !== undefined ? updates.include_in_excel : cf.include_in_excel,
          is_required: updates.is_required !== undefined ? updates.is_required : cf.is_required,
        })
      }
    }

    this.persist()
  }

  public async reorderColumns(idsInOrder: string[]): Promise<void> {
    const map = new Map(this.cache.map((col) => [col.id, col]))
    const reordered: ExcelTemplateColumnConfig[] = []

    idsInOrder.forEach((id, idx) => {
      const item = map.get(id)
      if (item) {
        reordered.push({ ...item, display_order: idx })
        map.delete(id)
      }
    })

    // Any remaining items
    map.forEach((item) => {
      reordered.push({ ...item, display_order: reordered.length })
    })

    this.cache = reordered
    this.persist()
  }

  public resetToDefault(): void {
    // Keep custom fields, reset standard columns to default names and front positions
    const customCols = this.cache.filter((c) => !c.is_standard)
    const resetCols = DEFAULT_STANDARD_EXCEL_COLUMNS.map((std, idx) => ({
      ...std,
      display_order: idx,
    }))

    customCols.forEach((c, idx) => {
      resetCols.push({
        ...c,
        display_order: resetCols.length + idx,
      })
    })

    this.cache = resetCols
    this.persist()
  }
}

export const templateConfigService = new TemplateConfigService()
