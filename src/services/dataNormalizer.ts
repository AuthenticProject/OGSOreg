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
  // Aggressively strip non-breaking spaces, zero-width characters, and whitespace
  return String(val)
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function normalizeEmail(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val)
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D]/g, '')
    .trim()
    .toLowerCase()
}

export function normalizeJenjang(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D]/g, '')
    .trim()
  if (!str) return ''

  const lower = str.toLowerCase().replace(/[\s\-_]+/g, ' ').trim()

  // Standardize any variation of 1-5 (e.g. "kelas 1", "jenjang 1", "j1", "k1", "1", "tingkat 1") to "Jenjang X"
  const m = lower.match(/^(?:(?:jenjang|kelas|tingkat|level|j|k)\s*)?([1-5])$/i)
  if (m) {
    return `Jenjang ${m[1]}`
  }

  // If contains jenjang 1-5 or kelas 1-5 anywhere in string
  const m2 = lower.match(/(?:jenjang|kelas|tingkat|level|j)\s*([1-5])/i)
  if (m2) {
    return `Jenjang ${m2[1]}`
  }

  // If contains just number 1-5
  const m3 = lower.match(/\b([1-5])\b/)
  if (m3) {
    return `Jenjang ${m3[1]}`
  }

  return str
}

export function normalizeKelas(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D]/g, '')
    .trim()
  if (!str) return ''

  // Standardize delimiters
  const lower = str.toLowerCase().replace(/[\s_]+/g, ' ').trim()

  // 1. Check 1 Intensif with room letter or shorthand
  // Variations: "1 int c", "1-int-c", "1int c", "1intc", "1 intensif c", "1xc", "1 x c", "1xe", "1 x e", "1-x-c", "1 int", "1x"
  const m1Int = lower.match(/^(?:kelas\s*|k\s*)?1\s*-?\s*(?:int|intensif|x)\s*-?\s*([a-z]|shighor|shigor|kibar)?$/i)
  if (m1Int) {
    const letter = m1Int[1]
    if (letter) {
      const room = letter === 'shighor' || letter === 'shigor' ? 'S' : letter === 'kibar' ? 'K' : letter.toUpperCase()
      return `1 int ${room}`
    }
    return '1 int'
  }

  // 2. Check 3 Intensif with room letter or shorthand
  // Variations: "3 int f", "3-int-f", "3int f", "3intf", "3 intensif f", "3xf", "3 x f", "3xe", "3xE", "3 x e", "3-x-e", "3 int", "3x"
  const m3Int = lower.match(/^(?:kelas\s*|k\s*)?3\s*-?\s*(?:int|intensif|x)\s*-?\s*([a-z]|shighor|shigor|kibar)?$/i)
  if (m3Int) {
    const letter = m3Int[1]
    if (letter) {
      const room = letter === 'shighor' || letter === 'shigor' ? 'S' : letter === 'kibar' ? 'K' : letter.toUpperCase()
      return `3 int ${room}`
    }
    return '3 int'
  }

  // 3. Regular class 1-5 with room letter (e.g. "5-b", "5-c", "5c", "5C", "5 C", "4F", "4f", "4 f", "2b", "2 b", "2-b", "5t", "5-t", "5s", "5S", "5-s", "5 shighor")
  const mRoom = lower.match(/^(?:kelas\s*|k\s*)?([1-5])\s*-?\s*([a-z]|shighor|shigor|kibar)$/i)
  if (mRoom) {
    const digit = mRoom[1]
    const letter = mRoom[2]
    const room = letter === 'shighor' || letter === 'shigor' ? 'S' : letter === 'kibar' ? 'K' : letter.toUpperCase()
    return `${digit}-${room}`
  }

  // 4. Regular class without room letter (e.g. "5", "Kelas 5", "k5")
  const mJustDigit = lower.match(/^(?:kelas\s*|k\s*)?([1-5])$/i)
  if (mJustDigit) {
    return `${mJustDigit[1]}`
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
