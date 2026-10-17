export type CustomFieldType = 'text' | 'number' | 'date' | 'email' | 'dropdown' | 'checkbox'

export interface CustomFieldValidationRules {
  min?: number
  max?: number
  pattern?: string
  options?: string[] // List of choices for dropdown
  placeholder?: string
  helperText?: string
}

export interface CustomFieldDefinition {
  id: string
  key: string // Unique snake_case identifier (e.g., 'daerah', 'nomor_induk')
  label: string // Display name (e.g., 'Daerah', 'Nomor Induk')
  field_type: CustomFieldType // default 'text'
  is_required: boolean
  is_active: boolean
  display_order: number
  options?: string[] // choices for dropdown
  validation_rules?: CustomFieldValidationRules
  include_in_excel: boolean
  include_in_moodle: boolean
  moodle_destination?: string // e.g. 'profile_field_daerah'
  version: number
  created_at: string
  updated_at: string
}

export const CUSTOM_FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Teks Bebas (Free-form Text)', description: 'Teks satu baris standar (default)' },
  { value: 'number', label: 'Angka (Number)', description: 'Nilai numerik (misal: nomor induk, angka)' },
  { value: 'date', label: 'Tanggal (Date)', description: 'Pemilih tanggal (YYYY-MM-DD)' },
  { value: 'email', label: 'Email Tambahan', description: 'Format email alternatif atau kontak' },
  { value: 'dropdown', label: 'Pilihan (Dropdown)', description: 'Pilihan dari daftar yang ditentukan Super Admin' },
  { value: 'checkbox', label: 'Centang (Checkbox/Ya-Tidak)', description: 'Nilai benar/salah (boolean)' },
]

/**
 * Valid standard Moodle user profile fields
 */
export const STANDARD_MOODLE_FIELDS = [
  'idnumber',
  'institution',
  'department',
  'city',
  'country',
  'phone1',
  'phone2',
  'address',
  'description',
] as const

/**
 * Validates Moodle CSV destination header.
 * Must be either a supported standard Moodle field or follow 'profile_field_<shortname>'
 */
export function validateMoodleDestinationHeader(header?: string | null): {
  valid: boolean
  error?: string
} {
  if (!header || !header.trim()) {
    return { valid: false, error: 'Destination header Moodle tidak boleh kosong jika ekspor diaktifkan.' }
  }

  const clean = header.trim().toLowerCase()

  // Standard Moodle columns
  if ((STANDARD_MOODLE_FIELDS as readonly string[]).includes(clean)) {
    return { valid: true }
  }

  // Custom profile fields in Moodle must be profile_field_<shortname>
  // Shortname must contain only lowercase alphanumeric characters and underscores
  const customProfileFieldRegex = /^profile_field_[a-z0-9_]{1,30}$/
  if (customProfileFieldRegex.test(clean)) {
    return { valid: true }
  }

  return {
    valid: false,
    error: `Header Moodle '${header}' tidak valid. Harus berupa 'profile_field_<nama>' (contoh: profile_field_daerah) atau kolom standar Moodle (${STANDARD_MOODLE_FIELDS.join(', ')}).`,
  }
}
