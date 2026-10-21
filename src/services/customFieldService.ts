import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { cloudSyncService } from './supabase/cloudSyncService'
import {
  type CustomFieldDefinition,
  validateMoodleDestinationHeader,
} from '../types/customField'

const LOCAL_STORAGE_KEY = 'ogsoreg_custom_fields_v1'

export const SYSTEM_RESERVED_KEYS = new Set([
  'kelas',
  'jenjang',
  'kampus',
  'username',
  'firstname',
  'lastname',
  'email',
  'full_name',
  'nisn',
  'gender',
  'grade_level',
  'school_name',
  'npsn',
  'competition_category',
  'teacher_name',
  'teacher_phone',
  'teacher_email',
  'no',
])

/**
 * Default sample custom fields if store is completely empty
 * (Demonstrating free-form text input as default, e.g. Daerah, Nomor Induk)
 */
const INITIAL_DEMO_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-daerah-default',
    key: 'daerah',
    label: 'Daerah',
    field_type: 'text',
    is_required: true,
    is_active: true,
    display_order: 1,
    include_in_excel: true,
    include_in_moodle: true,
    moodle_destination: 'profile_field_daerah',
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cf-stambuk-default',
    key: 'stambuk',
    label: 'Stambuk',
    field_type: 'text',
    is_required: true,
    is_active: true,
    display_order: 2,
    include_in_excel: true,
    include_in_moodle: true,
    moodle_destination: 'profile_field_stambuk',
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

type Listener = (fields: CustomFieldDefinition[]) => void

class CustomFieldService {
  private cache: CustomFieldDefinition[] = []
  private listeners: Set<Listener> = new Set()
  private isLoaded = false

  constructor() {
    this.initFromLocalStorage()
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.cache)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.cache]))
  }

  private initFromLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as CustomFieldDefinition[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cache = parsed
              .filter(
                (f) =>
                  !SYSTEM_RESERVED_KEYS.has(f.key.toLowerCase().trim()) &&
                  !SYSTEM_RESERVED_KEYS.has(f.label.toLowerCase().trim())
              )
              .map((f) => {
                if (f.key === 'nomor_induk') {
                  return { ...f, key: 'stambuk', label: 'Stambuk', moodle_destination: 'profile_field_stambuk' }
                }
                if (f.key === 'daerah' && f.label === 'Daerah / Asal Konsulat') {
                  return { ...f, label: 'Daerah' }
                }
                return f
              })
            return
          }
        }
      } catch {
        // Fallback
      }
    }
    this.cache = [...INITIAL_DEMO_FIELDS]
    this.persistLocalStorage()
  }

  private persistLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.cache))
      } catch {
        // Ignore quota
      }
    }
    cloudSyncService.saveCloudSetting('custom_field_definitions', this.cache)
  }

  /**
   * Fetches all custom field definitions, syncing Supabase with local fallback
   */
  public async getCustomFields(forceRefresh = false): Promise<CustomFieldDefinition[]> {
    if (this.isLoaded && !forceRefresh) {
      return [...this.cache]
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('custom_field_definitions')
          .select('*')
          .order('display_order', { ascending: true })

        if (!error && data && Array.isArray(data)) {
          if (data.length > 0) {
            this.cache = data.map((d) => ({
              ...d,
              options: Array.isArray(d.options) ? d.options : [],
              validation_rules: d.validation_rules || {},
            }))
            this.persistLocalStorage()
            this.isLoaded = true
            this.notify()
            return [...this.cache]
          } else if (this.cache.length > 0) {
            // Seed Supabase with initial fields
            for (const field of this.cache) {
              await supabase.from('custom_field_definitions').insert({
                key: field.key,
                label: field.label,
                field_type: field.field_type,
                is_required: field.is_required,
                is_active: field.is_active,
                display_order: field.display_order,
                options: field.options || [],
                validation_rules: field.validation_rules || {},
                include_in_excel: field.include_in_excel,
                include_in_moodle: field.include_in_moodle,
                moodle_destination: field.moodle_destination,
                version: field.version || 1,
              })
            }
          }
        }
      } catch {
        // Fall back gracefully to cache / local storage
      }
    }

    this.isLoaded = true
    this.notify()
    return [...this.cache]
  }

  /**
   * Returns active custom fields only, sorted by display_order, excluding system reserved keys
   */
  public async getActiveCustomFields(): Promise<CustomFieldDefinition[]> {
    const all = await this.getCustomFields()
    return all
      .filter(
        (f) =>
          f.is_active &&
          !SYSTEM_RESERVED_KEYS.has(f.key.toLowerCase().trim()) &&
          !SYSTEM_RESERVED_KEYS.has(f.label.toLowerCase().trim())
      )
      .sort((a, b) => a.display_order - b.display_order)
  }

  /**
   * Synchronous quick accessor for active custom fields, excluding system reserved keys
   */
  public getActiveFieldsSync(): CustomFieldDefinition[] {
    return this.cache
      .filter(
        (f) =>
          f.is_active &&
          !SYSTEM_RESERVED_KEYS.has(f.key.toLowerCase().trim()) &&
          !SYSTEM_RESERVED_KEYS.has(f.label.toLowerCase().trim())
      )
      .sort((a, b) => a.display_order - b.display_order)
  }

  /**
   * Creates or updates a custom field definition
   */
  public async saveCustomField(
    input: Partial<CustomFieldDefinition>
  ): Promise<{ success: boolean; field?: CustomFieldDefinition; error?: string }> {
    const label = (input.label || '').trim()
    if (!label) {
      return { success: false, error: 'Nama / Label bidang wajib diisi.' }
    }

    // Auto-generate key if not given
    let rawKey = input.key || label.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
    rawKey = rawKey.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
    if (!rawKey) {
      rawKey = `field_${Date.now()}`
    }

    // Check duplicate key among other fields
    const isDuplicateKey = this.cache.some(
      (f) => f.id !== input.id && f.key.toLowerCase() === rawKey
    )
    if (isDuplicateKey) {
      return {
        success: false,
        error: `Internal key '${rawKey}' sudah digunakan oleh bidang lain. Harap gunakan key unik.`,
      }
    }

    // Check Moodle destination validation if include_in_moodle is ON
    if (input.include_in_moodle) {
      const moodleVal = validateMoodleDestinationHeader(input.moodle_destination)
      if (!moodleVal.valid) {
        return { success: false, error: moodleVal.error }
      }
    }

    const now = new Date().toISOString()
    const existingIndex = this.cache.findIndex((f) => f.id === input.id)
    const currentOrder = input.display_order !== undefined
      ? input.display_order
      : existingIndex >= 0
      ? this.cache[existingIndex].display_order
      : this.cache.length + 1

    const fieldData: CustomFieldDefinition = {
      id: input.id || `cf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key: rawKey,
      label,
      field_type: input.field_type || 'text',
      is_required: Boolean(input.is_required),
      is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
      display_order: currentOrder,
      options: Array.isArray(input.options) ? input.options : [],
      validation_rules: input.validation_rules || {},
      include_in_excel: input.include_in_excel !== undefined ? Boolean(input.include_in_excel) : true,
      include_in_moodle: Boolean(input.include_in_moodle),
      moodle_destination: input.include_in_moodle ? (input.moodle_destination || '').trim() : undefined,
      version: (existingIndex >= 0 ? (this.cache[existingIndex].version || 1) + 1 : 1),
      created_at: existingIndex >= 0 ? this.cache[existingIndex].created_at : now,
      updated_at: now,
    }

    // Save to Supabase Cloud if available
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          key: fieldData.key,
          label: fieldData.label,
          field_type: fieldData.field_type,
          is_required: fieldData.is_required,
          is_active: fieldData.is_active,
          display_order: fieldData.display_order,
          options: fieldData.options,
          validation_rules: fieldData.validation_rules,
          include_in_excel: fieldData.include_in_excel,
          include_in_moodle: fieldData.include_in_moodle,
          moodle_destination: fieldData.moodle_destination || null,
          version: fieldData.version,
          updated_at: fieldData.updated_at,
        }

        if (input.id && !input.id.startsWith('cf-')) {
          await supabase.from('custom_field_definitions').update(payload).eq('id', input.id)
        } else {
          const { data: inserted } = await supabase
            .from('custom_field_definitions')
            .upsert(payload, { onConflict: 'key' })
            .select()
            .single()
          if (inserted?.id) {
            fieldData.id = inserted.id
          }
        }
      } catch {
        // Fall back to local
      }
    }

    // Update Cache & Local Persistence
    if (existingIndex >= 0) {
      this.cache[existingIndex] = fieldData
    } else {
      this.cache.push(fieldData)
    }

    this.cache.sort((a, b) => a.display_order - b.display_order)
    this.persistLocalStorage()
    this.notify()

    return { success: true, field: fieldData }
  }

  /**
   * Toggles active / inactive status of a field
   */
  public async toggleFieldActive(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const field = this.cache.find((f) => f.id === id)
    if (!field) {
      return { success: false, error: 'Bidang tidak ditemukan.' }
    }
    return this.saveCustomField({ ...field, is_active: isActive })
  }

  /**
   * Deletes a custom field definition
   */
  public async deleteCustomField(id: string): Promise<boolean> {
    const target = this.cache.find((f) => f.id === id)
    if (!target) return false

    if (isSupabaseConfigured() && !id.startsWith('cf-')) {
      try {
        await supabase.from('custom_field_definitions').delete().eq('id', id)
      } catch {
        // Local fallback
      }
    }

    this.cache = this.cache.filter((f) => f.id !== id)
    this.persistLocalStorage()
    this.notify()
    return true
  }

  /**
   * Reorders custom fields
   */
  public async reorderCustomFields(fieldIds: string[]): Promise<void> {
    const orderMap = new Map<string, number>()
    fieldIds.forEach((id, idx) => {
      orderMap.set(id, idx + 1)
    })

    this.cache = this.cache.map((f) => {
      if (orderMap.has(f.id)) {
        return { ...f, display_order: orderMap.get(f.id)! }
      }
      return f
    })

    this.cache.sort((a, b) => a.display_order - b.display_order)
    this.persistLocalStorage()
    this.notify()

    if (isSupabaseConfigured()) {
      try {
        for (const f of this.cache) {
          if (!f.id.startsWith('cf-')) {
            await supabase
              .from('custom_field_definitions')
              .update({ display_order: f.display_order })
              .eq('id', f.id)
          }
        }
      } catch {
        // Ignore
      }
    }
  }
}

export const customFieldService = new CustomFieldService()
