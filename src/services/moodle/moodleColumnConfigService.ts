import { customFieldService } from '../customFieldService'
import { cloudSyncService } from '../supabase/cloudSyncService'
import type { CustomFieldDefinition } from '../../types/customField'

export interface MoodleColumnConfig {
  id: string
  key: string
  header: string
  sourceLabel: string
  description: string
  is_standard: boolean
  is_required: boolean
  include_in_moodle: boolean
  display_order: number
}

const LOCAL_STORAGE_KEY = 'ogsoreg_moodle_columns_config_v1'

export const DEFAULT_MOODLE_COLUMNS: MoodleColumnConfig[] = [
  {
    id: 'mdl_username',
    key: 'username',
    header: 'username',
    sourceLabel: 'Username Santri',
    description: 'ID login peserta di Moodle LMS',
    is_standard: true,
    is_required: true,
    include_in_moodle: true,
    display_order: 0,
  },
  {
    id: 'mdl_firstname',
    key: 'firstname',
    header: 'firstname',
    sourceLabel: 'Nama Depan',
    description: 'Nama depan santri',
    is_standard: true,
    is_required: true,
    include_in_moodle: true,
    display_order: 1,
  },
  {
    id: 'mdl_lastname',
    key: 'lastname',
    header: 'lastname',
    sourceLabel: 'Nama Belakang',
    description: 'Nama belakang santri',
    is_standard: true,
    is_required: false,
    include_in_moodle: true,
    display_order: 2,
  },
  {
    id: 'mdl_email',
    key: 'email',
    header: 'email',
    sourceLabel: 'Email Santri',
    description: 'Alamat email akun Moodle',
    is_standard: true,
    is_required: true,
    include_in_moodle: true,
    display_order: 3,
  },
  {
    id: 'mdl_course1',
    key: 'course1',
    header: 'course1',
    sourceLabel: 'Kursus Utama (Kategori Lomba)',
    description: 'Moodle shortname kursus utama santri',
    is_standard: true,
    is_required: true,
    include_in_moodle: true,
    display_order: 4,
  },
  {
    id: 'mdl_course2',
    key: 'course2',
    header: 'course2',
    sourceLabel: 'Kursus Sesi (Waktu Ujian)',
    description: 'Moodle shortname sesi simulasi/ujian santri',
    is_standard: true,
    is_required: true,
    include_in_moodle: true,
    display_order: 5,
  },
  {
    id: 'mdl_password',
    key: 'password',
    header: 'password',
    sourceLabel: 'Password Awal Santri',
    description: 'Kata sandi awal akun santri di Moodle LMS',
    is_standard: true,
    is_required: true,
    include_in_moodle: true,
    display_order: 6,
  },
]

type Listener = (columns: MoodleColumnConfig[]) => void

class MoodleColumnConfigService {
  private cache: MoodleColumnConfig[] = []
  private listeners: Set<Listener> = new Set()

  constructor() {
    this.init()
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
          const parsed = JSON.parse(stored) as MoodleColumnConfig[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate standard items are present
            DEFAULT_MOODLE_COLUMNS.forEach((defCol) => {
              if (!parsed.some((c) => c.key === defCol.key)) {
                parsed.push({ ...defCol, display_order: parsed.length })
              }
            })
            parsed.forEach((c, idx) => {
              c.display_order = idx
            })
            this.cache = parsed
            this.syncWithCustomFields()
            return
          }
        }
      } catch {
        // Fallback to default
      }
    }

    this.cache = [...DEFAULT_MOODLE_COLUMNS]
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
    cloudSyncService.saveCloudSetting('moodle_columns_config', this.cache)
    this.notify()
  }

  public syncWithCustomFields() {
    const allCustomFields = customFieldService.getAllFieldsSync()
    const moodleCustomFields = allCustomFields.filter((f: CustomFieldDefinition) => f.include_in_moodle)

    // Remove obsolete custom columns
    const currentCustomKeys = new Set(moodleCustomFields.map((f: CustomFieldDefinition) => f.key))

    this.cache = this.cache.filter((c) => c.is_standard || currentCustomKeys.has(c.key))

    // Add or update custom columns
    moodleCustomFields.forEach((cf: CustomFieldDefinition) => {
      const existing = this.cache.find((c) => c.key === cf.key)
      const headerName = cf.moodle_destination?.trim() || `profile_field_${cf.key}`
      if (existing) {
        existing.sourceLabel = cf.label
        existing.description = cf.validation_rules?.helperText || `Kolom kustom ${cf.label}`
        existing.include_in_moodle = cf.include_in_moodle && cf.is_active
        if (!existing.header) {
          existing.header = headerName
        }
      } else {
        this.cache.push({
          id: `mdl_cf_${cf.id}`,
          key: cf.key,
          header: headerName,
          sourceLabel: cf.label,
          description: cf.validation_rules?.helperText || `Kolom kustom ${cf.label}`,
          is_standard: false,
          is_required: cf.is_required,
          include_in_moodle: cf.is_active,
          display_order: this.cache.length,
        })
      }
    })

    this.cache.forEach((c, idx) => {
      c.display_order = idx
    })

    this.notify()
  }

  public getColumns(): MoodleColumnConfig[] {
    return [...this.cache]
  }

  public getActiveColumns(): MoodleColumnConfig[] {
    return this.cache
      .filter((c) => c.include_in_moodle)
      .sort((a, b) => a.display_order - b.display_order)
  }

  public getActiveHeaders(): string[] {
    return this.getActiveColumns().map((c) => c.header)
  }

  public updateHeader(id: string, newHeader: string): { success: boolean; error?: string } {
    const trimmed = newHeader.trim()
    if (!trimmed) {
      return { success: false, error: 'Nama header kolom tidak boleh kosong.' }
    }
    if (/\s/.test(trimmed)) {
      return { success: false, error: 'Nama header tidak boleh mengandung spasi.' }
    }

    const col = this.cache.find((c) => c.id === id)
    if (!col) {
      return { success: false, error: 'Kolom tidak ditemukan.' }
    }

    // Check duplicate header among active
    const duplicate = this.cache.find(
      (c) => c.id !== id && c.include_in_moodle && c.header.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      return { success: false, error: `Header '${trimmed}' sudah digunakan oleh kolom lain.` }
    }

    col.header = trimmed
    this.persist()
    return { success: true }
  }

  public toggleInclude(id: string): void {
    const col = this.cache.find((c) => c.id === id)
    if (!col) return
    col.include_in_moodle = !col.include_in_moodle
    this.persist()
  }

  public reorderColumns(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.cache.length || toIndex < 0 || toIndex >= this.cache.length) {
      return
    }
    const [moved] = this.cache.splice(fromIndex, 1)
    this.cache.splice(toIndex, 0, moved)
    this.cache.forEach((c, idx) => {
      c.display_order = idx
    })
    this.persist()
  }

  public resetToDefault(): void {
    const customPart = this.cache.filter((c) => !c.is_standard)
    this.cache = [
      ...DEFAULT_MOODLE_COLUMNS.map((d, i) => ({ ...d, display_order: i })),
      ...customPart.map((c, i) => ({ ...c, display_order: DEFAULT_MOODLE_COLUMNS.length + i })),
    ]
    this.persist()
  }
}

export const moodleColumnConfigService = new MoodleColumnConfigService()
