/**
 * OGSOreg Phase 7 - Campus Constants and Types
 * Exactly 20 official Gontor campus options.
 */

export const KAMPUS_OPTIONS = [
  'Gontor 1',
  'Gontor 2',
  'Gontor 3',
  'Gontor 4',
  'Gontor 5',
  'Gontor 6',
  'Gontor 7',
  'Gontor 8',
  'Gontor 9',
  'Gontor 10',
  'Gontor 11',
  'Gontor 12',
  'Gontor Putri 1',
  'Gontor Putri 2',
  'Gontor Putri 3',
  'Gontor Putri 4',
  'Gontor Putri 5',
  'Gontor Putri 6',
  'Gontor Putri 7',
  'Gontor Putri 8',
] as const

export type StudentKampus = (typeof KAMPUS_OPTIONS)[number]

/**
 * Checks if a given value is one of the 20 official Gontor campuses.
 */
export function isValidKampus(val: unknown): val is StudentKampus {
  if (typeof val !== 'string') return false
  return KAMPUS_OPTIONS.includes(val.trim() as StudentKampus)
}

/**
 * Checks if a student record is missing campus assignment (legacy / incomplete record).
 */
export function isKampusIncomplete(kampus?: string | null): boolean {
  if (!kampus) return true
  const trimmed = kampus.trim()
  return trimmed === '' || trimmed === 'Belum Diisi' || trimmed === 'Belum Ditentukan'
}
