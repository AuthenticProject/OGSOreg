import { moodleParticipantSchema, legacyParticipantRowSchema } from '../schemas/participant.schema'
import {
  normalizeString,
  normalizeUsername,
  normalizeEmail,
  normalizeJenjang,
  normalizeKelas,
  normalizeKampus,
  normalizeNisn,
  normalizeGender,
  normalizeGrade,
  normalizeNpsn,
  normalizePhone,
} from './dataNormalizer'
import { isValidKampus } from '../types/campus'
import { isJenjangKelasMatch, getAllowedClassesForJenjang } from '../types/student'
import type { ColumnMappingItem, StagedParticipantRow, ImportStatistics } from '../types/excel'
import { studentRepository } from './studentRepository'
import { customFieldService } from './customFieldService'

/**
 * Transforms raw excel rows according to column mappings and performs
 * Zod validation and duplicate detection across the entire batch.
 */
export function processAndValidateRows(
  rawRows: Record<string, unknown>[],
  mappings: ColumnMappingItem[],
  accessControl?: { userRole?: string; assignedCampus?: string | null }
): { stagedRows: StagedParticipantRow[]; stats: ImportStatistics } {
  // Map targetField -> excelHeader
  const fieldToHeaderMap: Record<string, string> = {}
  mappings.forEach((m) => {
    if (m.targetField) {
      fieldToHeaderMap[m.targetField] = m.excelHeader
    }
  })

  // Detect if Moodle mapping exists
  const hasMoodleMapping = Boolean(
    fieldToHeaderMap['username'] ||
    fieldToHeaderMap['firstname'] ||
    fieldToHeaderMap['lastname'] ||
    fieldToHeaderMap['email'] ||
    fieldToHeaderMap['jenjang'] ||
    fieldToHeaderMap['kelas'] ||
    fieldToHeaderMap['kampus']
  )

  // 1. Initial normalization & entity creation
  const rows: StagedParticipantRow[] = rawRows.map((raw, idx) => {
    const getValue = (key: string) => {
      const header = fieldToHeaderMap[key]
      return header !== undefined ? raw[header] : undefined
    }

    const rawUsername = getValue('username')
    const rawFirstname = getValue('firstname')
    const rawLastname = getValue('lastname')
    const rawEmail = getValue('email')
    const rawJenjang = getValue('jenjang')
    const rawKelas = getValue('kelas')
    const rawKampus = getValue('kampus')

    const rawFullName = getValue('full_name')
    const rawNisn = getValue('nisn')

    const username = rawUsername !== undefined ? normalizeUsername(rawUsername) : undefined
    const firstname = rawFirstname !== undefined ? normalizeString(rawFirstname) : undefined
    const lastname = rawLastname !== undefined ? normalizeString(rawLastname) : undefined
    const email = rawEmail !== undefined ? normalizeEmail(rawEmail) : undefined
    const jenjang = rawJenjang !== undefined ? normalizeJenjang(rawJenjang) : undefined
    const kelas = rawKelas !== undefined ? normalizeKelas(rawKelas) : undefined
    const kampus = rawKampus !== undefined ? normalizeKampus(rawKampus) : undefined

    const full_name = normalizeString(rawFullName) || ([firstname, lastname].filter(Boolean).join(' ').trim())
    const nisn = normalizeNisn(rawNisn)
    const gender = normalizeGender(getValue('gender'))
    const grade_level = normalizeGrade(getValue('grade_level')) || (kelas || jenjang || '')
    const school_name = normalizeString(getValue('school_name'))
    const npsn = normalizeNpsn(getValue('npsn'))
    const competition_category = normalizeString(getValue('competition_category'))
    const teacher_name = normalizeString(getValue('teacher_name'))
    const teacher_phone = normalizePhone(getValue('teacher_phone'))
    const teacher_email = normalizeString(getValue('teacher_email'))

    // Extract dynamic custom field values from mapped columns
    const custom_fields: Record<string, any> = {}
    mappings.forEach((m) => {
      if (m.targetField && m.targetField.startsWith('custom_')) {
        const fieldKey = m.targetField.replace(/^custom_/, '')
        const val = raw[m.excelHeader]
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          custom_fields[fieldKey] = normalizeString(val)
        }
      }
    })

    // Auto-fallback username from stambuk or nisn if missing
    let finalUsername = username
    if (!finalUsername || finalUsername.trim() === '') {
      const stambukCandidate =
        custom_fields['stambuk'] ||
        custom_fields['no_stambuk'] ||
        raw['Stambuk'] ||
        raw['stambuk'] ||
        raw['No. Stambuk'] ||
        raw['No Stambuk'] ||
        raw['no stambuk'] ||
        rawNisn
      if (stambukCandidate) {
        finalUsername = normalizeUsername(stambukCandidate)
      }
    }

    // Auto-fallback email if missing
    let finalEmail = email
    if (!finalEmail || finalEmail.trim() === '') {
      const emailCandidate =
        raw['Email Santri'] ||
        raw['email santri'] ||
        raw['Email'] ||
        raw['email'] ||
        raw['Surel'] ||
        raw['surel']
      if (emailCandidate) {
        finalEmail = normalizeEmail(emailCandidate)
      }
    }

    // Auto-fallback jenjang if missing
    let finalJenjang = jenjang
    if (!finalJenjang || finalJenjang.trim() === '') {
      const jenjangCandidate =
        raw['Jenjang Lomba'] ||
        raw['jenjang lomba'] ||
        raw['Jenjang'] ||
        raw['jenjang']
      if (jenjangCandidate) {
        finalJenjang = normalizeJenjang(jenjangCandidate)
      }
    }

    // Auto-fallback kelas if missing
    let finalKelas = kelas
    if (!finalKelas || finalKelas.trim() === '') {
      const kelasCandidate =
        raw['Kelas Santri'] ||
        raw['kelas santri'] ||
        raw['Kelas'] ||
        raw['kelas'] ||
        custom_fields['kelas']
      if (kelasCandidate) {
        finalKelas = normalizeKelas(kelasCandidate)
      }
    }

    // Auto-fallback kampus if missing
    let finalKampus = kampus
    if (!finalKampus || finalKampus.trim() === '') {
      const kampusCandidate =
        raw['Kampus Gontor'] ||
        raw['kampus gontor'] ||
        raw['Kampus'] ||
        raw['kampus'] ||
        custom_fields['kampus']
      if (kampusCandidate) {
        finalKampus = normalizeKampus(kampusCandidate)
      }
    }

    const normalized: StagedParticipantRow = {
      _rowId: `row-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      _rowIndex: idx + 2, // 1-based index (row 1 is header)
      _status: 'VALID',
      _errors: {},
      _warnings: {},
      _isDuplicate: false,

      // Moodle Bulk Registration fields
      username: hasMoodleMapping ? (finalUsername || '') : finalUsername,
      firstname: hasMoodleMapping ? (firstname || '') : firstname,
      lastname: hasMoodleMapping ? (lastname || '') : lastname,
      email: hasMoodleMapping ? (finalEmail || '') : finalEmail,
      jenjang: hasMoodleMapping ? (finalJenjang || '') : finalJenjang,
      kelas: hasMoodleMapping ? (finalKelas || '') : finalKelas,
      kampus: hasMoodleMapping ? (finalKampus || '') : finalKampus,

      // Canonical data fields (Legacy compatibility)
      no: normalizeString(getValue('no')) || String(idx + 1),
      full_name,
      nisn,
      gender,
      grade_level,
      school_name,
      npsn,
      competition_category,
      teacher_name,
      teacher_phone,
      teacher_email,

      // Dynamic Custom Fields
      custom_fields,
    }

    return normalized
  })

  // 2. Perform global duplicate detection & Zod validation
  return validateAllStagedRows(rows, accessControl)
}

export function validateAllStagedRows(
  rows: StagedParticipantRow[],
  accessControl?: { userRole?: string; assignedCampus?: string | null }
): { stagedRows: StagedParticipantRow[]; stats: ImportStatistics } {
  // Retrieve global registered usernames & emails across all campuses
  const { usernames: registeredUsernames, emails: registeredEmails } =
    studentRepository.getAllRegisteredUsernamesAndEmails()
  const activeCustomFields = customFieldService.getActiveFieldsSync()

  // Track occurrences for intra-batch duplicate detection
  const usernameOccurrences = new Map<string, number[]>()
  const emailOccurrences = new Map<string, number[]>()
  const nisnOccurrences = new Map<string, number[]>()
  const nameSchoolOccurrences = new Map<string, number[]>()

  // Intra-batch all usernames for suggestion collision avoidance
  const intraBatchUsernames = new Set<string>()

  rows.forEach((r, idx) => {
    if (r.username && r.username.trim() !== '') {
      const uKey = r.username.toLowerCase().trim()
      intraBatchUsernames.add(uKey)
      const list = usernameOccurrences.get(uKey) || []
      list.push(idx)
      usernameOccurrences.set(uKey, list)
    }

    if (r.email && r.email.trim() !== '') {
      const eKey = r.email.toLowerCase().trim()
      const list = emailOccurrences.get(eKey) || []
      list.push(idx)
      emailOccurrences.set(eKey, list)
    }

    if (r.nisn && r.nisn.trim() !== '') {
      const list = nisnOccurrences.get(r.nisn) || []
      list.push(idx)
      nisnOccurrences.set(r.nisn, list)
    }

    const nameKey = `${(r.full_name || '').toLowerCase()}|${(r.school_name || '').toLowerCase()}`
    if (r.full_name && r.school_name) {
      const list = nameSchoolOccurrences.get(nameKey) || []
      list.push(idx)
      nameSchoolOccurrences.set(nameKey, list)
    }
  })

  let validCount = 0
  let warningCount = 0
  let errorCount = 0
  let duplicateCount = 0

  const validatedRows = rows.map((r, idx) => {
    const errors: Record<string, string> = {}
    const warnings: Record<string, string> = {}
    let isDuplicate = false
    let duplicateReason = ''
    let usernameSuggestions: string[] | undefined = undefined

    // Determine validation schema based on row field presence
    const isMoodleRow = Boolean(
      r.username !== undefined ||
      r.firstname !== undefined ||
      r.lastname !== undefined ||
      r.email !== undefined ||
      r.jenjang !== undefined ||
      r.kelas !== undefined ||
      r.kampus !== undefined
    )

    if (isMoodleRow) {
      const normJenjang = normalizeJenjang(r.jenjang)
      const normKelas = normalizeKelas(r.kelas)

      // 1. Zod validation for Moodle Registration with Kampus & Kelas
      const result = moodleParticipantSchema.safeParse({
        username: r.username || '',
        firstname: r.firstname || '',
        lastname: r.lastname || '',
        email: r.email || '',
        jenjang: normJenjang || '',
        kelas: normKelas || '',
        kampus: r.kampus || '',
      })

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = String(issue.path[0])
          errors[field] = issue.message
        })
      }

      // Validate Kelas is required
      if (!normKelas || normKelas.trim() === '') {
        errors['kelas'] = 'Kelas santri wajib diisi (contoh: 5-B, 3-C atau untuk intensif: 3 int F, 1 int C).'
      }

      // Enforce strict Jenjang vs Kelas matching
      if (normJenjang && normKelas && normJenjang.trim() !== '' && normKelas.trim() !== '') {
        if (!isJenjangKelasMatch(normJenjang, normKelas)) {
          const allowed = getAllowedClassesForJenjang(normJenjang)
          const errorMsg = `Data tidak valid: ${normJenjang} hanya diperuntukkan bagi santri ${allowed.join(' atau ')} (saat ini diisi: ${normKelas}).`
          errors['jenjang'] = errorMsg
          errors['kelas'] = errorMsg
        }
      }

      // Validate Kampus is required for new rows and must be one of the 20 official campuses
      if (!r.kampus || r.kampus.trim() === '') {
        errors['kampus'] = 'Kampus wajib diisi (pilih salah satu dari 20 Kampus Gontor).'
      } else if (!isValidKampus(r.kampus)) {
        errors['kampus'] = `Kampus '${r.kampus}' tidak valid. Harus salah satu dari 20 pilihan Kampus Gontor resmi.`
      } else if (accessControl?.assignedCampus && r.kampus.trim() !== accessControl.assignedCampus) {
        errors['kampus'] = `Akses Ditolak: Anda hanya berwenang mengimpor data santri untuk ${accessControl.assignedCampus}. Santri dengan kampus '${r.kampus}' ditolak.`
      }

      // 2. Intra-file & Global Duplicate Username Check
      if (r.username && r.username.trim() !== '') {
        const uKey = r.username.toLowerCase().trim()
        const occurrences = usernameOccurrences.get(uKey) || []

        if (occurrences.length > 1) {
          const otherRows = occurrences
            .filter((i) => i !== idx)
            .map((i) => `baris ${rows[i]._rowIndex}`)
          isDuplicate = true
          const msg = `Duplikat Username: Username '${r.username}' ganda dalam berkas (ditemukan pada ${otherRows.join(', ')}).`
          errors['username'] = msg
          duplicateReason = msg
          usernameSuggestions = studentRepository.suggestAvailableUsernames(uKey, intraBatchUsernames)
        } else if (registeredUsernames.has(uKey)) {
          isDuplicate = true
          const msg = `Duplikat Username: Username '${r.username}' sudah terdaftar di sistem OGSOreg.`
          errors['username'] = msg
          duplicateReason = msg
          usernameSuggestions = studentRepository.suggestAvailableUsernames(uKey, intraBatchUsernames)
        }
      }

      // 3. Intra-file & Global Duplicate Email Check
      if (r.email && r.email.trim() !== '') {
        const eKey = r.email.toLowerCase().trim()
        const occurrences = emailOccurrences.get(eKey) || []

        if (occurrences.length > 1) {
          const otherRows = occurrences
            .filter((i) => i !== idx)
            .map((i) => `baris ${rows[i]._rowIndex}`)
          isDuplicate = true
          const msg = `Duplikat Email: Email '${r.email}' ganda dalam berkas (ditemukan pada ${otherRows.join(', ')}).`
          errors['email'] = msg
          if (!duplicateReason) duplicateReason = msg
        } else if (registeredEmails.has(eKey)) {
          isDuplicate = true
          const msg = `Duplikat Email: Email '${r.email}' sudah terdaftar di sistem OGSOreg. Harap gunakan alamat email yang berbeda dan aktif.`
          errors['email'] = msg
          if (!duplicateReason) duplicateReason = msg
        }
      }
    } else {
      // Legacy schema validation for Phase 3/4 backward compatibility
      const result = legacyParticipantRowSchema.safeParse({
        full_name: r.full_name || '',
        nisn: r.nisn || '',
        gender: r.gender || '',
        grade_level: r.grade_level || '',
        school_name: r.school_name || '',
        npsn: r.npsn || undefined,
        competition_category: r.competition_category || '',
        teacher_name: r.teacher_name || '',
        teacher_phone: r.teacher_phone || undefined,
        teacher_email: r.teacher_email || undefined,
      })

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = String(issue.path[0])
          errors[field] = issue.message
        })
      }

      // Warnings for optional but recommended fields
      if (!r.teacher_phone) {
        warnings['teacher_phone'] = 'No. HP guru belum dicantumkan.'
      }
      if (!r.npsn) {
        warnings['npsn'] = 'NPSN sekolah kosong.'
      }

      // Intra-file Duplicate NISN check
      if (r.nisn && (nisnOccurrences.get(r.nisn)?.length || 0) > 1) {
        const otherIndices = (nisnOccurrences.get(r.nisn) || [])
          .filter((i) => i !== idx)
          .map((i) => `baris ${rows[i]._rowIndex}`)
        isDuplicate = true
        duplicateReason = `Duplikat NISN: NISN sama ditemukan pada ${otherIndices.join(', ')}.`
        errors['nisn'] = duplicateReason
      }

      // Duplicate Name + School combination check
      const nameKey = `${(r.full_name || '').toLowerCase()}|${(r.school_name || '').toLowerCase()}`
      if ((nameSchoolOccurrences.get(nameKey)?.length || 0) > 1) {
        warnings['full_name'] = 'Nama siswa dan sekolah serupa terdeteksi di baris lain.'
      }
    }

    // 4. Validate dynamic custom fields
    if (activeCustomFields.length > 0) {
      const rowCustomFields = r.custom_fields || {}
      activeCustomFields.forEach((field) => {
        const val = rowCustomFields[field.key]
        const strVal = val !== undefined && val !== null ? String(val).trim() : ''

        if (field.is_required && !strVal) {
          errors[`custom_${field.key}`] = `${field.label} wajib diisi.`
        } else if (strVal) {
          if (field.field_type === 'number') {
            if (isNaN(Number(strVal))) {
              errors[`custom_${field.key}`] = `${field.label} harus berupa angka valid.`
            }
          } else if (field.field_type === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
              errors[`custom_${field.key}`] = `Format email pada ${field.label} tidak valid.`
            }
          } else if (field.field_type === 'dropdown') {
            if (field.options && field.options.length > 0) {
              const matched = field.options.some(
                (opt) => opt.toLowerCase().trim() === strVal.toLowerCase()
              )
              if (!matched) {
                errors[`custom_${field.key}`] = `${field.label} harus salah satu pilihan: ${field.options.join(', ')}.`
              }
            }
          }
        }
      })
    }

    if (isDuplicate) {
      duplicateCount++
    }

    // Calculate row status
    let status: StagedParticipantRow['_status'] = 'VALID'
    if (Object.keys(errors).length > 0 || isDuplicate) {
      status = 'ERROR'
      errorCount++
    } else if (Object.keys(warnings).length > 0) {
      status = 'WARNING'
      warningCount++
    } else {
      validCount++
    }

    return {
      ...r,
      _status: status,
      _errors: errors,
      _warnings: warnings,
      _isDuplicate: isDuplicate,
      _duplicateReason: duplicateReason,
      _usernameSuggestions: usernameSuggestions,
    }
  })

  return {
    stagedRows: validatedRows,
    stats: {
      total: validatedRows.length,
      valid: validCount,
      warning: warningCount,
      error: errorCount,
      duplicate: duplicateCount,
    },
  }
}
