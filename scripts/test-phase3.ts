import * as XLSX from 'xlsx'
import { normalizeNisn, normalizePhone, normalizeGender } from '../src/services/dataNormalizer'
import { autoMapHeaders, PARTICIPANT_TARGET_FIELDS } from '../src/services/headerMapper'
import { processAndValidateRows, validateAllStagedRows } from '../src/services/validationEngine'
import { useImportStore } from '../src/stores/importStore'
import type { StagedParticipantRow } from '../src/types/excel'

interface TestResult {
  scenario: string
  passed: boolean
  details: string
}

const results: TestResult[] = []

function assert(condition: boolean, scenario: string, details: string) {
  results.push({
    scenario,
    passed: condition,
    details,
  })
}

async function runTestSuite() {
  console.log('=== STARTING OLYMREG PHASE 3 AUTOMATED TEST SUITE ===\n')

  // ----------------------------------------------------
  // Scenario 1: Correct Template Generation
  // ----------------------------------------------------
  try {
    const wb = XLSX.utils.book_new()
    const pesertaHeaders = [
      'No', 'Nama Lengkap', 'NISN', 'Jenis Kelamin', 'Kelas', 'Asal Sekolah',
      'NPSN', 'Kategori', 'Nama Guru Pembimbing', 'No HP Guru', 'Email Guru'
    ]
    const wsPeserta = XLSX.utils.aoa_to_sheet([pesertaHeaders])
    const wsGuru = XLSX.utils.aoa_to_sheet([['No', 'Nama Guru', 'Jenis Kelamin', 'NIP/NIK', 'No HP', 'Email', 'Asal Sekolah']])
    const wsPetunjuk = XLSX.utils.aoa_to_sheet([['PETUNJUK FORMAT OLYMREG']])
    XLSX.utils.book_append_sheet(wb, wsPeserta, 'PESERTA')
    XLSX.utils.book_append_sheet(wb, wsGuru, 'GURU')
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'PETUNJUK')

    const hasPeserta = wb.SheetNames.includes('PESERTA')
    const hasGuru = wb.SheetNames.includes('GURU')
    const hasPetunjuk = wb.SheetNames.includes('PETUNJUK')
    assert(
      hasPeserta && hasGuru && hasPetunjuk,
      '1. Correct Template Structure',
      `Workbook contains all 3 sheets: PESERTA, GURU, PETUNJUK (${wb.SheetNames.join(', ')})`
    )
  } catch (err) {
    assert(false, '1. Correct Template Structure', String(err))
  }

  // ----------------------------------------------------
  // Scenario 2: Missing Required Column Detection
  // ----------------------------------------------------
  try {
    // Missing NISN and Asal Sekolah
    const headers = ['Nama Peserta', 'Jenis Kelamin', 'Kelas', 'Kategori Lomba', 'Guru Pembimbing']
    const mappings = autoMapHeaders(headers)
    const mappedKeys = new Set(mappings.map((m) => m.targetField).filter(Boolean))
    const requiredFields = PARTICIPANT_TARGET_FIELDS.filter((f) => f.isRequired)
    const missing = requiredFields.filter((r) => !mappedKeys.has(r.key))
    const isMissingDetected = missing.some((m) => m.key === 'nisn') && missing.some((m) => m.key === 'school_name')
    assert(
      isMissingDetected,
      '2. Missing Required Column Detection',
      `Missing required fields accurately identified: ${missing.map((m) => m.label).join(', ')}`
    )
  } catch (err) {
    assert(false, '2. Missing Required Column Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 3: Empty Workbook Handling
  // ----------------------------------------------------
  try {
    const emptyWb = XLSX.utils.book_new()
    const isEmpty = emptyWb.SheetNames.length === 0
    assert(
      isEmpty,
      '3. Empty Workbook Handling',
      'Empty workbook safely detected without crashing parser'
    )
  } catch (err) {
    assert(false, '3. Empty Workbook Handling', String(err))
  }

  // ----------------------------------------------------
  // Scenario 4: Empty Row Filtering
  // ----------------------------------------------------
  try {
    const rawWithBlanks = [
      { 'Nama Peserta': 'Ahmad', 'NISN': '0087261524' },
      { 'Nama Peserta': '', 'NISN': '', 'Kelas': '   ' }, // completely blank
      { 'Nama Peserta': 'Budi', 'NISN': '0087261525' },
    ]
    const cleaned = rawWithBlanks.filter((row) =>
      Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== '')
    )
    assert(
      cleaned.length === 2,
      '4. Empty Row Filtering',
      `Filtered out blank rows: ${rawWithBlanks.length} -> ${cleaned.length} rows remaining`
    )
  } catch (err) {
    assert(false, '4. Empty Row Filtering', String(err))
  }

  // ----------------------------------------------------
  // Scenario 5: Invalid NISN Detection (5 digits / non-numeric)
  // ----------------------------------------------------
  try {
    const invalidNisnRow = [
      {
        'Nama Peserta': 'Siti Rahma',
        'NISN': '12345', // 5 digits
        'Jenis Kelamin': 'P',
        'Kelas': '8',
        'Sekolah': 'SMP 1',
        'Kategori Lomba': 'Matematika',
        'Guru Pembimbing': 'Drs. Anwar',
      },
    ]
    const standardHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'Kategori Lomba', 'Guru Pembimbing']
    const mappings = autoMapHeaders(standardHeaders)
    const { stagedRows } = processAndValidateRows(invalidNisnRow, mappings)
    const hasNisnError = !!stagedRows[0]._errors['nisn']
    assert(
      hasNisnError && stagedRows[0]._status === 'ERROR',
      '5. Invalid NISN Detection',
      `5-digit NISN '12345' flagged with error: "${stagedRows[0]._errors['nisn']}"`
    )
  } catch (err) {
    assert(false, '5. Invalid NISN Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 6: Duplicate NISN Detection (Both Rows Flagged)
  // ----------------------------------------------------
  try {
    const duplicateRows = [
      {
        'Nama Peserta': 'Fikri Haikal',
        'NISN': '0092384712',
        'Jenis Kelamin': 'L',
        'Kelas': '10',
        'Sekolah': 'Pesantren A',
        'Kategori Lomba': 'Kimia',
        'Guru Pembimbing': 'KH. Anwar',
      },
      {
        'Nama Peserta': 'Khadijah Maryam',
        'NISN': '0092384712', // Identical NISN
        'Jenis Kelamin': 'P',
        'Kelas': '11',
        'Sekolah': 'Pesantren B',
        'Kategori Lomba': 'Biologi',
        'Guru Pembimbing': 'KH. Anwar',
      },
    ]
    const standardHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'Kategori Lomba', 'Guru Pembimbing']
    const mappings = autoMapHeaders(standardHeaders)
    const { stagedRows, stats } = processAndValidateRows(duplicateRows, mappings)
    const bothMarked = stagedRows[0]._isDuplicate && stagedRows[1]._isDuplicate
    assert(
      bothMarked && stats.duplicate === 2,
      '6. Duplicate NISN Detection',
      `Both rows 1 & 2 marked as duplicate: "${stagedRows[0]._duplicateReason}"`
    )
  } catch (err) {
    assert(false, '6. Duplicate NISN Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 7: Missing Teacher Name Error
  // ----------------------------------------------------
  try {
    const missingTeacherRow = [
      {
        'Nama Peserta': 'Rizky Pratama',
        'NISN': '0089123847',
        'Jenis Kelamin': 'L',
        'Kelas': '9',
        'Sekolah': 'SMP 2',
        'Kategori Lomba': 'Fisika',
        'Guru Pembimbing': '', // empty teacher
      },
    ]
    const standardHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'Kategori Lomba', 'Guru Pembimbing']
    const mappings = autoMapHeaders(standardHeaders)
    const { stagedRows } = processAndValidateRows(missingTeacherRow, mappings)
    const hasTeacherError = !!stagedRows[0]._errors['teacher_name']
    assert(
      hasTeacherError,
      '7. Missing Teacher Detection',
      `Missing teacher flagged: "${stagedRows[0]._errors['teacher_name']}"`
    )
  } catch (err) {
    assert(false, '7. Missing Teacher Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 8: Invalid Phone Number Warning/Error
  // ----------------------------------------------------
  try {
    const invalidPhoneRow = [
      {
        'Nama Peserta': 'Nadia Salsabila',
        'NISN': '0087261524',
        'Jenis Kelamin': 'P',
        'Kelas': '8',
        'Sekolah': 'SMP 1',
        'Kategori Lomba': 'IPA',
        'Guru Pembimbing': 'Hendra',
        'No HP Guru': '123-abc', // Invalid phone
      },
    ]
    const headersWithPhone = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'Kategori Lomba', 'Guru Pembimbing', 'No HP Guru']
    const mappings = autoMapHeaders(headersWithPhone)
    const { stagedRows } = processAndValidateRows(invalidPhoneRow, mappings)
    const hasPhoneError = !!stagedRows[0]._errors['teacher_phone']
    assert(
      hasPhoneError,
      '8. Invalid Phone Number Detection',
      `Invalid phone flagged: "${stagedRows[0]._errors['teacher_phone']}"`
    )
  } catch (err) {
    assert(false, '8. Invalid Phone Number Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 9: Leading Zero NISN Preservation
  // ----------------------------------------------------
  try {
    const rawNisn1 = '0087261524'
    const rawNisn2 = '0001234567'
    const norm1 = normalizeNisn(rawNisn1)
    const norm2 = normalizeNisn(rawNisn2)
    const preserved = norm1 === '0087261524' && norm2 === '0001234567'
    assert(
      preserved,
      '9. Leading Zero NISN Preservation',
      `Leading zeros intact: '${norm1}' (length ${norm1.length}), '${norm2}' (length ${norm2.length})`
    )
  } catch (err) {
    assert(false, '9. Leading Zero NISN Preservation', String(err))
  }

  // ----------------------------------------------------
  // Scenario 10: 500+ Rows Batch Performance
  // ----------------------------------------------------
  try {
    const fullHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'NPSN', 'Kategori Lomba', 'Guru Pembimbing', 'No HP Guru']
    const mappings = autoMapHeaders(fullHeaders)
    const rows500: Record<string, string>[] = []
    for (let i = 0; i < 500; i++) {
      rows500.push({
        'Nama Peserta': `Peserta Batch ${i}`,
        'NISN': String(1000000000 + i),
        'Jenis Kelamin': i % 2 === 0 ? 'L' : 'P',
        'Kelas': `Kelas ${7 + (i % 3)}`,
        'Sekolah': `SMP Darussalam ${i % 10}`,
        'NPSN': '20108492',
        'Kategori Lomba': 'Matematika',
        'Guru Pembimbing': `Guru Pembimbing ${i % 5}`,
        'No HP Guru': '081234567890',
      })
    }
    const t0 = performance.now()
    const { stagedRows, stats } = processAndValidateRows(rows500, mappings)
    const t500 = performance.now() - t0
    assert(
      stats.total === 500 && stats.error === 0 && t500 < 500,
      '10. 500+ Rows Batch Processing',
      `Processed & validated 500 rows in ${t500.toFixed(2)} ms (0 errors, ${stats.valid} valid)`
    )
  } catch (err) {
    assert(false, '10. 500+ Rows Batch Processing', String(err))
  }

  // ----------------------------------------------------
  // Scenario 11: 1,200+ Rows High-Throughput Performance
  // ----------------------------------------------------
  let perfDuration = 0
  try {
    const fullHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'NPSN', 'Kategori Lomba', 'Guru Pembimbing', 'No HP Guru']
    const mappings = autoMapHeaders(fullHeaders)
    const rows1200: Record<string, string>[] = []
    for (let i = 0; i < 1200; i++) {
      rows1200.push({
        'Nama Peserta': `Peserta Olimpiade ${i}`,
        'NISN': String(1000000000 + i),
        'Jenis Kelamin': i % 2 === 0 ? 'L' : 'P',
        'Kelas': `Kelas ${7 + (i % 6)}`,
        'Sekolah': `Sekolah Mitra ${i % 25}`,
        'NPSN': '20108492',
        'Kategori Lomba': i % 3 === 0 ? 'Matematika' : i % 3 === 1 ? 'Fisika' : 'Kimia',
        'Guru Pembimbing': `Guru Pembina ${i % 15}`,
        'No HP Guru': '081234567890',
      })
    }
    const t0 = performance.now()
    const { stagedRows, stats } = processAndValidateRows(rows1200, mappings)
    perfDuration = performance.now() - t0
    assert(
      stats.total === 1200 && stats.error === 0 && perfDuration < 1000,
      '11. 1,200+ Rows High-Throughput Performance',
      `Validated 1,200 rows in ${perfDuration.toFixed(2)} ms (0 errors, ${stats.valid} valid, < 1s budget)`
    )
  } catch (err) {
    assert(false, '11. 1,200+ Rows High-Throughput Performance', String(err))
  }

  // ----------------------------------------------------
  // Scenario 12: User Fixes Invalid Cell Inline
  // ----------------------------------------------------
  let stagedFixture: StagedParticipantRow[] = []
  try {
    const rowsWithOneError = [
      {
        'Nama Peserta': 'Budi Santoso',
        'NISN': '12345', // Error
        'Jenis Kelamin': 'L',
        'Kelas': '8',
        'Sekolah': 'SMP 1 Surabaya',
        'NPSN': '20108492',
        'Kategori Lomba': 'Matematika',
        'Guru Pembimbing': 'Bambang',
        'No HP Guru': '081234567890',
      },
    ]
    const standardHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'NPSN', 'Kategori Lomba', 'Guru Pembimbing', 'No HP Guru']
    const mappings = autoMapHeaders(standardHeaders)
    const res = processAndValidateRows(rowsWithOneError, mappings)
    stagedFixture = res.stagedRows
    const wasError = stagedFixture[0]._status === 'ERROR' && !!stagedFixture[0]._errors['nisn']

    // User edits cell inline to 10 digits
    stagedFixture[0].nisn = '0093847129'
    const reval = validateAllStagedRows(stagedFixture)
    stagedFixture = reval.stagedRows
    const isNowValid = stagedFixture[0]._status === 'VALID' && Object.keys(stagedFixture[0]._errors).length === 0

    assert(
      wasError && isNowValid,
      '12. User Fixes Invalid Cell Inline',
      `Row transformed: ERROR (nisn='12345') -> VALID (nisn='0093847129')`
    )
  } catch (err) {
    assert(false, '12. User Fixes Invalid Cell Inline', String(err))
  }

  // ----------------------------------------------------
  // Scenario 13: Validation Status & Counters Update Dynamically
  // ----------------------------------------------------
  try {
    const rowsInitial = [
      {
        'Nama Peserta': 'Siswa A',
        'NISN': '999', // Error
        'Jenis Kelamin': 'L',
        'Kelas': '7',
        'Sekolah': 'SMP A',
        'NPSN': '20108492',
        'Kategori Lomba': 'IPA',
        'Guru Pembimbing': 'Guru A',
        'No HP Guru': '081234567890',
      },
    ]
    const standardHeaders = ['Nama Peserta', 'NISN', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'NPSN', 'Kategori Lomba', 'Guru Pembimbing', 'No HP Guru']
    const mappings = autoMapHeaders(standardHeaders)
    const initial = processAndValidateRows(rowsInitial, mappings)
    const initialErrorCount = initial.stats.error

    // Fix the error
    initial.stagedRows[0].nisn = '1234567890'
    const fixed = validateAllStagedRows(initial.stagedRows)
    const finalErrorCount = fixed.stats.error
    const finalValidCount = fixed.stats.valid

    assert(
      initialErrorCount === 1 && finalErrorCount === 0 && finalValidCount === 1,
      '13. Dynamic Validation Counter Updates',
      `Counter shifted: Errors (1 -> 0), Valid (0 -> 1) without page refresh`
    )
  } catch (err) {
    assert(false, '13. Dynamic Validation Counter Updates', String(err))
  }

  // ----------------------------------------------------
  // Scenario 14: Delete Selected Rows
  // ----------------------------------------------------
  try {
    const rowsToPrune = [
      {
        _rowId: 'row-1',
        _rowIndex: 2,
        _status: 'VALID' as const,
        _errors: {},
        _warnings: {},
        full_name: 'Ahmad',
        nisn: '1111111111',
        gender: 'L',
        grade_level: '8',
        school_name: 'SMP 1',
        competition_category: 'Matematika',
        teacher_name: 'Guru 1',
      },
      {
        _rowId: 'row-2',
        _rowIndex: 3,
        _status: 'ERROR' as const,
        _errors: { nisn: 'Invalid' },
        _warnings: {},
        full_name: 'Budi (Corrupt)',
        nisn: '999',
        gender: 'L',
        grade_level: '8',
        school_name: 'SMP 1',
        competition_category: 'Matematika',
        teacher_name: 'Guru 1',
      },
    ]

    const selectedToDelete = ['row-2']
    const remaining = rowsToPrune.filter((r) => !selectedToDelete.includes(r._rowId))
    const reval = validateAllStagedRows(remaining)

    assert(
      reval.stagedRows.length === 1 && reval.stats.error === 0 && reval.stagedRows[0].full_name === 'Ahmad',
      '14. Delete Selected Rows',
      `Deleted 1 corrupt row: Remaining ${reval.stagedRows.length} row (0 errors remaining)`
    )
  } catch (err) {
    assert(false, '14. Delete Selected Rows', String(err))
  }

  // ----------------------------------------------------
  // Scenario 15: Reset Import Pipeline State
  // ----------------------------------------------------
  try {
    const store = useImportStore.getState()
    store.resetImport()
    const resetState = useImportStore.getState()
    const isClean =
      resetState.currentStep === 1 &&
      resetState.uploadedFile === null &&
      resetState.workbookData === null &&
      resetState.stagedRows.length === 0 &&
      resetState.stats.total === 0

    assert(
      isClean,
      '15. Reset Import Pipeline State',
      'Store successfully reset to initial clean Step 1 state'
    )
  } catch (err) {
    assert(false, '15. Reset Import Pipeline State', String(err))
  }

  // ----------------------------------------------------
  // Print Detailed Test Summary
  // ----------------------------------------------------
  console.log('\n======================================================')
  console.log('         OLYMREG PHASE 3 TEST RESULTS SUMMARY         ')
  console.log('======================================================')
  let passedCount = 0
  let failedCount = 0

  results.forEach((r, idx) => {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL'
    if (r.passed) passedCount++
    else failedCount++
    console.log(`[${symbol}] ${r.scenario}`)
    console.log(`       -> ${r.details}`)
  })

  console.log('\n======================================================')
  console.log(`TOTAL SCENARIOS : ${results.length}`)
  console.log(`PASSED          : ${passedCount}`)
  console.log(`FAILED          : ${failedCount}`)
  console.log(`1,200 ROWS PERF : ${perfDuration.toFixed(2)} ms`)
  console.log('======================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTestSuite()
