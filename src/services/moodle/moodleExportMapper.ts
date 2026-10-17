import type { Student } from '../../types/student'
import type { StagedParticipantRow } from '../../types/excel'
import {
  getCourseMappingConfig,
  getCourseShortnameForJenjang,
  type MoodleCourseMappingConfig,
} from './moodleCourseMapping'

export const DEFAULT_INITIAL_PASSWORD = 'ogso_2026!'

export const MOODLE_EXCEL_SHEET_NAME = 'MOODLE_USERS'

export const MOODLE_EXPORT_COLUMNS = [
  'username',
  'firstname',
  'lastname',
  'email',
  'course1',
  'course2',
  'password',
] as const

export interface MoodleUserExportRow {
  username: string
  firstname: string
  lastname: string
  email: string
  course1: string
  course2: string
  password: string
  custom_fields?: Record<string, any>
}

export interface MoodleExportIssue {
  row: number
  username: string
  type:
    | 'MISSING_USERNAME'
    | 'INVALID_USERNAME'
    | 'MISSING_FIRSTNAME'
    | 'INVALID_EMAIL'
    | 'UNMAPPED_JENJANG'
    | 'DUPLICATE_USERNAME'
  message: string
}

export interface MoodleExportValidationSummary {
  totalStudents: number
  validStudents: number
  invalidStudents: number
  duplicateUsernames: number
  unmappedClasses: number
  passwordPolicyCompliant: boolean
  passwordPolicyWarning?: string
  issues: MoodleExportIssue[]
  mappedRows: MoodleUserExportRow[]
}

export interface MoodleExportOptions {
  customPassword?: string
  courseMappingConfig?: MoodleCourseMappingConfig
  allowUnverifiedShortnames?: boolean
  sanitizeFormulaInjection?: boolean
}

/**
 * Checks password compliance against standard Moodle strict password policies:
 * At least 8 characters, at least 1 digit, at least 1 lowercase, at least 1 uppercase, at least 1 special character.
 */
export function checkMoodlePasswordPolicy(password: string): {
  compliant: boolean
  warning?: string
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
  minLength: boolean
} {
  const minLength = password.length >= 8
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  const compliant = minLength && hasLowercase && hasUppercase && hasNumber && hasSpecial

  let warning: string | undefined
  if (!hasUppercase) {
    warning =
      "Password default 'ogso_2026!' tidak memiliki huruf besar (A-Z). Sebagian instalasi Moodle mewajibkan minimal satu huruf kapital pada kebijakan password."
  } else if (!minLength) {
    warning = 'Password harus memiliki panjang minimal 8 karakter.'
  } else if (!hasSpecial) {
    warning = 'Password sebaiknya menyertakan minimal satu karakter khusus (misal: !@#$%^&*).'
  }

  return {
    compliant,
    warning,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    minLength,
  }
}

/**
 * Sanitizes user-controlled string to prevent spreadsheet formula injection in CSV/Excel.
 * Values starting with =, +, -, @, or tab are escaped.
 */
export function sanitizeSpreadsheetFormula(val: string): string {
  if (!val) return ''
  const trimmed = String(val).trim()
  if (/^[=\+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`
  }
  return trimmed
}

/**
 * Maps incoming generic student/staged participant rows into Moodle Upload User export format.
 * Generates initial passwords dynamically on-the-fly without persistent storage.
 */
export function mapStudentsToMoodleExport(
  rawStudents: (Student | StagedParticipantRow | Record<string, any>)[],
  options: MoodleExportOptions = {}
): MoodleExportValidationSummary {
  const config = options.courseMappingConfig || getCourseMappingConfig()
  const passwordToUse = options.customPassword || DEFAULT_INITIAL_PASSWORD
  const sanitize = options.sanitizeFormulaInjection !== false

  const pwdPolicy = checkMoodlePasswordPolicy(passwordToUse)

  const issues: MoodleExportIssue[] = []
  const mappedRows: MoodleUserExportRow[] = []

  const seenUsernames = new Set<string>()
  let duplicateCount = 0
  let unmappedClassCount = 0

  rawStudents.forEach((raw, idx) => {
    const rowNum = idx + 1

    // Extract core fields
    const rawUsername =
      raw.username || (raw as any).nisn || (raw as any).user_name || ''
    const rawFirstname =
      raw.firstname ||
      (raw.full_name ? String(raw.full_name).split(' ')[0] : '') ||
      ''
    const rawLastname =
      raw.lastname !== undefined
        ? raw.lastname
        : raw.full_name
        ? String(raw.full_name).split(' ').slice(1).join(' ')
        : ''
    const rawEmail = raw.email || (raw as any).teacher_email || ''
    const rawJenjang = (raw.jenjang || (raw as any).grade_level || '') as string

    // 1. Username validation
    const username = String(rawUsername).trim().toLowerCase()

    if (!username) {
      issues.push({
        row: rowNum,
        username: '(kosong)',
        type: 'MISSING_USERNAME',
        message: 'Username wajib diisi.',
      })
    } else if (/\s/.test(username)) {
      issues.push({
        row: rowNum,
        username,
        type: 'INVALID_USERNAME',
        message: 'Username tidak boleh mengandung spasi.',
      })
    }

    // Duplicate detection within batch
    if (username) {
      if (seenUsernames.has(username)) {
        duplicateCount++
        issues.push({
          row: rowNum,
          username,
          type: 'DUPLICATE_USERNAME',
          message: `Username '${username}' duplikat dalam berkas ekspor.`,
        })
      } else {
        seenUsernames.add(username)
      }
    }

    // 2. Firstname validation
    const firstname = String(rawFirstname).trim()
    if (!firstname) {
      issues.push({
        row: rowNum,
        username: username || `Baris ${rowNum}`,
        type: 'MISSING_FIRSTNAME',
        message: 'Nama depan (firstname) wajib diisi untuk akun Moodle.',
      })
    }

    const lastname = String(rawLastname || '').trim()

    // 3. Email validation
    const email = String(rawEmail).trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      issues.push({
        row: rowNum,
        username: username || `Baris ${rowNum}`,
        type: 'INVALID_EMAIL',
        message: `Format email '${email}' tidak valid.`,
      })
    }

    // 4. Course 1 (Jenjang mapping)
    const course1 = getCourseShortnameForJenjang(rawJenjang, config)
    if (!course1) {
      unmappedClassCount++
      issues.push({
        row: rowNum,
        username: username || `Baris ${rowNum}`,
        type: 'UNMAPPED_JENJANG',
        message: `Jenjang '${rawJenjang}' belum dipetakan ke course shortname Moodle.`,
      })
    }

    // 5. Course 2 (Constant simulation shortname)
    const course2 = config.simulationShortname || 'simulation'

    // Cleaned/Sanitized row
    const finalUsername = sanitize ? sanitizeSpreadsheetFormula(username) : username
    const finalFirstname = sanitize ? sanitizeSpreadsheetFormula(firstname) : firstname
    const finalLastname = sanitize ? sanitizeSpreadsheetFormula(lastname) : lastname
    const finalEmail = sanitize ? sanitizeSpreadsheetFormula(email) : email

    mappedRows.push({
      username: finalUsername,
      firstname: finalFirstname,
      lastname: finalLastname,
      email: finalEmail,
      course1: course1 || '',
      course2,
      password: passwordToUse,
      custom_fields: raw.custom_fields || {},
    })
  })

  const totalStudents = rawStudents.length
  const invalidStudents = new Set(issues.map((i) => i.row)).size
  const validStudents = Math.max(0, totalStudents - invalidStudents)

  return {
    totalStudents,
    validStudents,
    invalidStudents,
    duplicateUsernames: duplicateCount,
    unmappedClasses: unmappedClassCount,
    passwordPolicyCompliant: pwdPolicy.compliant,
    passwordPolicyWarning: pwdPolicy.warning,
    issues,
    mappedRows,
  }
}
