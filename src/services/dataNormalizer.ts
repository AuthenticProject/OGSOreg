/**
 * Normalizes string values, usernames, emails, phone numbers, genders, and protects leading zeros in NISN.
 */

export function normalizeString(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim().replace(/\s+/g, ' ')
}

export function normalizeUsername(val: unknown): string {
  if (val === null || val === undefined) return ''
  // Usernames in Moodle typically lowercased without spaces
  return String(val).trim().toLowerCase().replace(/\s+/g, '')
}

export function normalizeEmail(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim().toLowerCase()
}

export function normalizeJenjang(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  // Standardize "1", "kelas 1", "Kelas 1" to "Kelas 1"
  const m = str.match(/^(?:kelas\s*)?([1-5])$/i)
  if (m) {
    return `Kelas ${m[1]}`
  }
  return str
}

export function normalizeKampus(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  if (!str) return ''

  // Canonicalize to official Gontor 1-12 or Gontor Putri 1-8 if casing matches
  const lower = str.toLowerCase()
  // Match Gontor Putri 1-8
  const putriMatch = lower.match(/^gontor\s+putri\s+([1-8])$/i)
  if (putriMatch) {
    return `Gontor Putri ${putriMatch[1]}`
  }
  // Match Gontor 1-12
  const putraMatch = lower.match(/^gontor\s+([1-9]|1[0-2])$/i)
  if (putraMatch) {
    return `Gontor ${putraMatch[1]}`
  }

  // Return original trimmed string so validation engine can report error for unknown campus
  return str
}

export function normalizeNisn(val: unknown): string {
  if (val === null || val === undefined) return ''
  // Ensure string representation so leading zeros are never discarded
  const str = String(val).trim()
  // Remove non-digit characters if any
  return str.replace(/\D/g, '')
}

export function normalizePhone(val: unknown): string {
  if (val === null || val === undefined) return ''
  let phone = String(val).trim().replace(/[\s\-\(\)\.]/g, '')

  // Convert international prefix +62 or 62 to 0
  if (phone.startsWith('+62')) {
    phone = '0' + phone.slice(3)
  } else if (phone.startsWith('62')) {
    phone = '0' + phone.slice(2)
  }

  return phone
}

export function normalizeGender(val: unknown): string {
  if (val === null || val === undefined) return ''
  const clean = String(val).trim().toLowerCase()

  if (['l', 'laki-laki', 'laki laki', 'pria', 'male', 'm'].includes(clean)) {
    return 'L'
  }
  if (['p', 'perempuan', 'wanita', 'female', 'f'].includes(clean)) {
    return 'P'
  }

  // Return original uppercase if unrecognized to let Zod handle the validation error
  return String(val).trim().toUpperCase()
}

export function normalizeGrade(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  // If user entered e.g. "8", "Kelas 8", "VIII"
  return str
}

export function normalizeNpsn(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim().replace(/\D/g, '')
}
