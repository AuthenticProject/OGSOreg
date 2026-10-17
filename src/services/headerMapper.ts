import type { ColumnMappingItem } from '../types/excel'
import { customFieldService } from './customFieldService'
import { templateConfigService } from './templateConfigService'
import type { CustomFieldDefinition } from '../types/customField'

export interface TargetFieldDef {
  key: string
  label: string
  isRequired: boolean
  description: string
  aliases: string[]
}

/**
 * Standard Moodle bulk registration fields (New workflow)
 */
export const MOODLE_TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'username',
    label: 'Username',
    isRequired: true,
    description: 'Username akun Moodle peserta (unik)',
    aliases: [
      'username',
      'user name',
      'username moodle',
      'akun moodle',
      'user moodle',
      'id moodle',
      'id pengguna',
      'id peserta',
      'user',
      'stambuk',
      'no stambuk',
      'no. stambuk',
      'nomor stambuk',
      'stambuk santri',
      'nisn',
      'nis',
    ],
  },
  {
    key: 'firstname',
    label: 'Nama Depan',
    isRequired: true,
    description: 'Nama depan siswa (wajib diisi)',
    aliases: ['nama depan', 'first name', 'firstname', 'nama awal'],
  },
  {
    key: 'lastname',
    label: 'Nama Belakang',
    isRequired: true,
    description: 'Nama belakang / marga siswa (wajib diisi)',
    aliases: ['nama belakang', 'last name', 'lastname', 'nama akhir', 'marga'],
  },
  {
    key: 'email',
    label: 'Email',
    isRequired: true,
    description: 'Alamat email aktif peserta',
    aliases: [
      'email',
      'alamat email',
      'e-mail',
      'surel',
      'email santri',
      'email peserta',
      'email siswa',
      'surel santri',
      'surel peserta',
      'surel siswa',
      'alamat email santri',
      'e-mail santri',
    ],
  },
  {
    key: 'jenjang',
    label: 'Jenjang Lomba (Jenjang 1–5)',
    isRequired: true,
    description: 'Tingkat perlombaan: Jenjang 1, Jenjang 2, Jenjang 3, Jenjang 4, Jenjang 5',
    aliases: [
      'jenjang',
      'jenjang lomba',
      'kategori jenjang',
      'tingkat lomba',
      'level',
      'jenjang peserta',
      'tingkat jenjang',
      'jenjang santri',
    ],
  },
  {
    key: 'kampus',
    label: 'Kampus (Gontor)',
    isRequired: true,
    description: 'Salah satu dari 20 pilihan Kampus Gontor resmi (Gontor 1–12, Gontor Putri 1–8)',
    aliases: [
      'kampus',
      'campus',
      'lokasi kampus',
      'kampus gontor',
      'cabang kampus',
      'kampus cabang',
      'pesantren',
      'pondok cabang',
      'cabang gontor',
    ],
  },
  {
    key: 'kelas',
    label: 'Kelas Santri',
    isRequired: true,
    description: 'Kelas KMI santri: Kelas 1, Kelas 2, Kelas 1 Int, Kelas 3, Kelas 3 Int, Kelas 4, Kelas 5',
    aliases: [
      'kelas',
      'kelas santri',
      'tingkat kelas',
      'kelas kmi',
      'grade',
      'kelas peserta',
      'ruang kelas',
      'kelas/ruang',
    ],
  },
]

/**
 * Legacy fields for Phase 3/4 backward compatibility
 */
export const LEGACY_PARTICIPANT_TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'no',
    label: 'No',
    isRequired: false,
    description: 'Nomor urut peserta',
    aliases: ['no', 'nomor', 'no.', 'no urut'],
  },
  {
    key: 'full_name',
    label: 'Nama Lengkap Peserta',
    isRequired: true,
    description: 'Nama lengkap siswa peserta lomba',
    aliases: ['nama lengkap', 'nama peserta', 'nama', 'nama siswa', 'peserta'],
  },
  {
    key: 'nisn',
    label: 'NISN (10 Digit)',
    isRequired: true,
    description: 'Nomor Induk Siswa Nasional (10 angka)',
    aliases: ['nisn', 'no nisn', 'nomor nisn', 'nisn siswa'],
  },
  {
    key: 'gender',
    label: 'Jenis Kelamin (L/P)',
    isRequired: true,
    description: 'Kode jenis kelamin L atau P',
    aliases: ['jenis kelamin', 'jk', 'gender', 'l/p', 'jenis kelamin (l/p)'],
  },
  {
    key: 'grade_level',
    label: 'Kelas / Jenjang',
    isRequired: true,
    description: 'Tingkat kelas siswa (contoh: 7, 8, 9, 10)',
    aliases: ['kelas', 'tingkat', 'grade', 'kelas/jenjang'],
  },
  {
    key: 'school_name',
    label: 'Asal Sekolah',
    isRequired: true,
    description: 'Nama sekolah, madrasah, atau pesantren',
    aliases: ['asal sekolah', 'sekolah', 'nama sekolah', 'nama madrasah', 'pesantren', 'institusi'],
  },
  {
    key: 'npsn',
    label: 'NPSN Sekolah',
    isRequired: false,
    description: 'Nomor Pokok Sekolah Nasional (8 digit)',
    aliases: ['npsn', 'no npsn', 'nomor npsn'],
  },
  {
    key: 'competition_category',
    label: 'Kategori Lomba',
    isRequired: true,
    description: 'Mata pelajaran / bidang kompetisi yang diikuti',
    aliases: ['kategori', 'kategori lomba', 'bidang', 'mata pelajaran', 'cabang lomba', 'mapel'],
  },
  {
    key: 'teacher_name',
    label: 'Nama Guru Pembimbing',
    isRequired: true,
    description: 'Nama lengkap guru atau pendamping siswa',
    aliases: ['nama guru pembimbing', 'guru pembimbing', 'nama pembimbing', 'pembimbing', 'guru pendamping', 'nama guru'],
  },
  {
    key: 'teacher_phone',
    label: 'No. HP Guru',
    isRequired: false,
    description: 'Nomor WhatsApp atau kontak guru',
    aliases: ['no hp guru', 'no hp pembimbing', 'telepon guru', 'wa guru', 'no telepon guru'],
  },
  {
    key: 'teacher_email',
    label: 'Email Guru',
    isRequired: false,
    description: 'Alamat email aktif guru pembimbing',
    aliases: ['email guru', 'email pembimbing', 'alamat email guru'],
  },
]

/**
 * Union target fields for mapping inspection
 */
export const PARTICIPANT_TARGET_FIELDS: TargetFieldDef[] = [
  ...MOODLE_TARGET_FIELDS,
  ...LEGACY_PARTICIPANT_TARGET_FIELDS.filter((f) => !MOODLE_TARGET_FIELDS.some((m) => m.key === f.key)),
]

/**
 * Converts dynamic custom field definitions into TargetFieldDef objects
 */
export function getCustomTargetFields(customFields?: CustomFieldDefinition[]): TargetFieldDef[] {
  const fields = customFields || customFieldService.getActiveFieldsSync()
  return fields.map((f) => {
    const extraAliases: string[] = []
    const lowerKey = f.key.toLowerCase()
    const lowerLabel = f.label.toLowerCase()

    if (lowerKey.includes('stambuk') || lowerLabel.includes('stambuk')) {
      extraAliases.push('stambuk', 'no stambuk', 'no. stambuk', 'nomor stambuk', 'no.stambuk', 'stambuk santri', 'stbk')
    }
    if (lowerKey.includes('daerah') || lowerLabel.includes('daerah') || lowerKey.includes('konsulat') || lowerLabel.includes('konsulat')) {
      extraAliases.push('daerah', 'asal daerah', 'daerah asal', 'konsulat', 'asal konsulat', 'konsulat ponorogo', 'konsulat/daerah')
    }
    if (lowerKey.includes('induk') || lowerLabel.includes('induk')) {
      extraAliases.push('nomor induk', 'no induk', 'no. induk', 'nomor induk santri', 'nis')
    }

    return {
      key: `custom_${f.key}`,
      label: f.label,
      isRequired: f.is_required,
      description: `Bidang Kustom: ${f.label} (${f.field_type})`,
      aliases: [
        lowerLabel,
        lowerKey,
        `custom_${lowerKey}`,
        lowerLabel.replace(/[^a-z0-9]/g, ''),
        lowerKey.replace(/[^a-z0-9]/g, ''),
        ...extraAliases,
      ],
    }
  })
}

export function getAllParticipantTargetFields(customFields?: CustomFieldDefinition[]): TargetFieldDef[] {
  const dynamic = getCustomTargetFields(customFields)
  const templateCols = templateConfigService.getColumns()

  const standardUpdated = PARTICIPANT_TARGET_FIELDS.map((field) => {
    const matchedCol = templateCols.find((col) => col.key === field.key)
    if (matchedCol && matchedCol.label) {
      const customAlias = matchedCol.label.toLowerCase().trim()
      const aliases = field.aliases.includes(customAlias)
        ? field.aliases
        : [...field.aliases, customAlias]
      return {
        ...field,
        label: matchedCol.label,
        isRequired: matchedCol.is_required,
        aliases,
      }
    }
    return field
  })

  return [...standardUpdated, ...dynamic]
}

export function cleanHeaderString(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

export function detectHeaderSchema(headers: string[]): 'MOODLE' | 'LEGACY' {
  const cleaned = headers.map(cleanHeaderString)
  const isMoodle = cleaned.some((h) =>
    [
      'username',
      'nama depan',
      'firstname',
      'nama belakang',
      'lastname',
      'email',
      'username moodle',
      'email santri',
      'jenjang lomba',
      'kelas santri',
      'kampus gontor',
    ].includes(h)
  )
  const isLegacy = cleaned.some((h) =>
    ['nisn', 'asal sekolah', 'sekolah', 'guru pembimbing', 'kategori lomba'].includes(h)
  )

  if (isMoodle && !isLegacy) return 'MOODLE'
  if (isLegacy && !isMoodle) return 'LEGACY'
  return isMoodle ? 'MOODLE' : 'LEGACY'
}

export function autoMapHeaders(
  excelHeaders: string[],
  sampleRows?: Record<string, unknown>[],
  customFields?: CustomFieldDefinition[]
): ColumnMappingItem[] {
  const usedTargetKeys = new Set<string>()
  const schema = detectHeaderSchema(excelHeaders)
  const allFieldDefs = getAllParticipantTargetFields(customFields)
  const targetFieldDefs =
    schema === 'MOODLE'
      ? allFieldDefs
      : [
          ...LEGACY_PARTICIPANT_TARGET_FIELDS,
          ...allFieldDefs.filter((f) => !LEGACY_PARTICIPANT_TARGET_FIELDS.some((l) => l.key === f.key)),
        ]

  return excelHeaders.map((rawHeader) => {
    const cleaned = cleanHeaderString(rawHeader)
    let matchedField: TargetFieldDef | null = null
    let confidence: 'exact' | 'alias' | 'unmapped' = 'unmapped'

    // 1. Try exact match against label or key
    matchedField = targetFieldDefs.find(
      (f) =>
        !usedTargetKeys.has(f.key) &&
        (cleanHeaderString(f.label) === cleaned || cleanHeaderString(f.key) === cleaned)
    ) || null

    if (matchedField) {
      confidence = 'exact'
    } else {
      // 2. Try aliases
      matchedField = targetFieldDefs.find(
        (f) =>
          !usedTargetKeys.has(f.key) &&
          f.aliases.some((alias) => cleanHeaderString(alias) === cleaned)
      ) || null

      if (matchedField) {
        confidence = 'alias'
      } else {
        // 3. Fallback: Keyword inclusion for essential Moodle fields
        if (!usedTargetKeys.has('email') && (cleaned.includes('email') || cleaned.includes('surel'))) {
          matchedField = targetFieldDefs.find((f) => f.key === 'email') || null
        } else if (
          !usedTargetKeys.has('username') &&
          (cleaned.includes('username') || cleaned.includes('user moodle') || cleaned.includes('akun moodle') || cleaned.includes('user id'))
        ) {
          matchedField = targetFieldDefs.find((f) => f.key === 'username') || null
        } else if (!usedTargetKeys.has('jenjang') && (cleaned.includes('jenjang') || cleaned.includes('tingkat lomba'))) {
          matchedField = targetFieldDefs.find((f) => f.key === 'jenjang') || null
        } else if (!usedTargetKeys.has('kelas') && cleaned.includes('kelas')) {
          matchedField = targetFieldDefs.find((f) => f.key === 'kelas') || null
        } else if (!usedTargetKeys.has('kampus') && (cleaned.includes('kampus') || cleaned.includes('cabang'))) {
          matchedField = targetFieldDefs.find((f) => f.key === 'kampus') || null
        } else if (cleaned.includes('stambuk')) {
          matchedField = targetFieldDefs.find((f) => !usedTargetKeys.has(f.key) && (f.key.includes('stambuk') || f.label.toLowerCase().includes('stambuk'))) || null
        } else if (cleaned.includes('daerah') || cleaned.includes('konsulat')) {
          matchedField = targetFieldDefs.find((f) => !usedTargetKeys.has(f.key) && (f.key.includes('daerah') || f.label.toLowerCase().includes('daerah') || f.label.toLowerCase().includes('konsulat'))) || null
        }

        if (matchedField) {
          confidence = 'alias'
        }
      }
    }

    if (matchedField) {
      usedTargetKeys.add(matchedField.key)
    }

    // Grab sample value if available
    let sampleValue = ''
    if (sampleRows && sampleRows.length > 0) {
      const firstVal = sampleRows[0][rawHeader]
      if (firstVal !== undefined && firstVal !== null) {
        sampleValue = String(firstVal).slice(0, 30)
      }
    }

    return {
      excelHeader: rawHeader,
      targetField: matchedField ? matchedField.key : null,
      confidence,
      isRequired: matchedField ? matchedField.isRequired : false,
      sampleValue,
    }
  })
}
