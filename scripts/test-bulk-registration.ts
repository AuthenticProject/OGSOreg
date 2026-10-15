/**
 * OGSOreg Bulk Registration Test Suite
 * 
 * Tests the 12 required criteria:
 * 1. Excel template generation
 * 2. Jenjang dropdown options
 * 3. Kelas 1–5 validation
 * 4. Mixed-class imports
 * 5. Invalid class rejection
 * 6. Duplicate usernames
 * 7. Duplicate emails
 * 8. Inline editing
 * 9. Moodle CSV header compatibility
 * 10. CSV UTF-8 encoding
 * 11. Existing Phase 3 regression
 * 12. Production build
 */

import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { execSync } from 'child_process'
import {
  generateRegistrationTemplateBuffer,
  buildRegistrationWorkbook,
} from '../src/services/excelGenerator'
import {
  MOODLE_CSV_HEADERS,
  generateMoodleCsv,
  generateMoodleCsvWithBom,
  getJenjangCourseMappingSummary,
} from '../src/services/moodleCsvService'
import { autoMapHeaders } from '../src/services/headerMapper'
import { processAndValidateRows, validateAllStagedRows } from '../src/services/validationEngine'
import { useImportStore } from '../src/stores/importStore'
import { MOODLE_JENJANG_OPTIONS, type StagedParticipantRow } from '../src/types/excel'

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
  console.log('====================================================================')
  console.log('=== STARTING OGSOREG BULK REGISTRATION AUTOMATED TEST SUITE ===')
  console.log('====================================================================\n')

  // ----------------------------------------------------
  // Scenario 1: Excel Template Generation
  // ----------------------------------------------------
  try {
    const buffer = await generateRegistrationTemplateBuffer()
    const readWb = new ExcelJS.Workbook()
    await readWb.xlsx.load(buffer as any)

    const sheetNames = readWb.worksheets.map((s) => s.name)
    const hasPendaftaran = sheetNames.includes('PENDAFTARAN')
    const hasContoh = sheetNames.includes('Contoh')
    const hasPetunjuk = sheetNames.includes('Petunjuk')

    const pSheet = readWb.getWorksheet('PENDAFTARAN')!
    const headers = [
      pSheet.getCell('A1').value,
      pSheet.getCell('B1').value,
      pSheet.getCell('C1').value,
      pSheet.getCell('D1').value,
      pSheet.getCell('E1').value,
    ]

    const expectedHeaders = ['Username', 'Nama Depan', 'Nama Belakang', 'Email', 'Jenjang']
    const headersMatch = expectedHeaders.every((h, i) => headers[i] === h)

    const contohSheet = readWb.getWorksheet('Contoh')!
    const sampleRowCount = contohSheet.rowCount - 1 // minus header

    const pass = hasPendaftaran && hasContoh && hasPetunjuk && headersMatch && sampleRowCount >= 5
    assert(
      pass,
      '1. Excel Template Generation',
      `Workbook contains sheets [${sheetNames.join(', ')}] with columns [${headers.join(', ')}] and ${sampleRowCount} sample rows in Contoh sheet`
    )
  } catch (err) {
    assert(false, '1. Excel Template Generation', String(err))
  }

  // ----------------------------------------------------
  // Scenario 2: Jenjang Dropdown Options
  // ----------------------------------------------------
  try {
    const workbook = await buildRegistrationWorkbook()
    const ws = workbook.getWorksheet('PENDAFTARAN')!
    const cellE2 = ws.getCell('E2')
    const cellE10 = ws.getCell('E10')

    const hasValidationE2 = cellE2.dataValidation?.type === 'list'
    const hasValidationE10 = cellE10.dataValidation?.type === 'list'

    const formulae = cellE2.dataValidation?.formulae || []
    const formulaStr = formulae[0] || ''
    const expectedFormula = `"${MOODLE_JENJANG_OPTIONS.join(',')}"`
    const isFormulaExact = formulaStr === expectedFormula

    const pass = hasValidationE2 && hasValidationE10 && isFormulaExact
    assert(
      pass,
      '2. Jenjang Dropdown Options',
      `Column E has list validation with exact formula ${formulaStr} matching: ${MOODLE_JENJANG_OPTIONS.join(', ')}`
    )
  } catch (err) {
    assert(false, '2. Jenjang Dropdown Options', String(err))
  }

  // ----------------------------------------------------
  // Scenario 3: Kelas 1–5 Validation
  // ----------------------------------------------------
  try {
    const testClasses = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5']
    const rawRows = testClasses.map((kelas, idx) => ({
      'Username': `peserta0${idx + 1}`,
      'Nama Depan': `Siswa${idx + 1}`,
      'Nama Belakang': 'Gadjah',
      'Email': `siswa${idx + 1}@sekolah.sch.id`,
      'Jenjang': kelas,
    }))

    const headers = ['Username', 'Nama Depan', 'Nama Belakang', 'Email', 'Jenjang']
    const mappings = autoMapHeaders(headers)
    const { stagedRows, stats } = processAndValidateRows(rawRows, mappings)

    const allValid = stagedRows.every((r) => r._status === 'VALID' && Object.keys(r._errors).length === 0)
    assert(
      allValid && stats.valid === 5 && stats.error === 0,
      '3. Kelas 1–5 Individual Validation',
      `All 5 classes (Kelas 1 - Kelas 5) successfully validated as VALID (0 errors)`
    )
  } catch (err) {
    assert(false, '3. Kelas 1–5 Individual Validation', String(err))
  }

  // ----------------------------------------------------
  // Scenario 4: Mixed-Class Imports
  // ----------------------------------------------------
  try {
    const mixedRows = [
      { 'Username': 'budi01', 'Nama Depan': 'Budi', 'Nama Belakang': 'Santoso', 'Email': 'budi@sekolah.sch.id', 'Jenjang': 'Kelas 1' },
      { 'Username': 'siti02', 'Nama Depan': 'Siti', 'Nama Belakang': 'Rahma', 'Email': 'siti@sekolah.sch.id', 'Jenjang': 'Kelas 3' },
      { 'Username': 'andi03', 'Nama Depan': 'Andi', 'Nama Belakang': 'Wijaya', 'Email': 'andi@sekolah.sch.id', 'Jenjang': 'Kelas 5' },
      { 'Username': 'dewi04', 'Nama Depan': 'Dewi', 'Nama Belakang': 'Lestari', 'Email': 'dewi@sekolah.sch.id', 'Jenjang': 'Kelas 2' },
      { 'Username': 'rizky05', 'Nama Depan': 'Rizky', 'Nama Belakang': 'Pratama', 'Email': 'rizky@sekolah.sch.id', 'Jenjang': 'Kelas 4' },
    ]

    const mappings = autoMapHeaders(['Username', 'Nama Depan', 'Nama Belakang', 'Email', 'Jenjang'])
    const { stagedRows, stats } = processAndValidateRows(mixedRows, mappings)

    const classesPresent = new Set(stagedRows.map((r) => r.jenjang))
    const all5Present = classesPresent.size === 5
    const allValid = stats.valid === 5 && stats.error === 0

    assert(
      all5Present && allValid,
      '4. Mixed-Class Imports',
      `Successfully accepted mixed classes [${Array.from(classesPresent).join(', ')}] in a single import with 0 errors`
    )
  } catch (err) {
    assert(false, '4. Mixed-Class Imports', String(err))
  }

  // ----------------------------------------------------
  // Scenario 5: Invalid Class Rejection
  // ----------------------------------------------------
  try {
    const invalidRows = [
      { 'Username': 'user_inv1', 'Nama Depan': 'Anang', 'Nama Belakang': 'Hermansyah', 'Email': 'anang@inv.com', 'Jenjang': 'Kelas 6' },
      { 'Username': 'user_inv2', 'Nama Depan': 'Ashanty', 'Nama Belakang': 'Siddik', 'Email': 'ashanty@inv.com', 'Jenjang': 'Kelas 10' },
      { 'Username': 'user_inv3', 'Nama Depan': 'Aurel', 'Nama Belakang': 'Hermansyah', 'Email': 'aurel@inv.com', 'Jenjang': 'Tingkat SMA' },
    ]

    const mappings = autoMapHeaders(['Username', 'Nama Depan', 'Nama Belakang', 'Email', 'Jenjang'])
    const { stagedRows, stats } = processAndValidateRows(invalidRows, mappings)

    const allRejected = stagedRows.every(
      (r) => r._status === 'ERROR' && r._errors['jenjang'] && r._errors['jenjang'].includes('Jenjang harus salah satu dari')
    )

    assert(
      allRejected && stats.error === 3,
      '5. Invalid Class Rejection',
      `Invalid classes ('Kelas 6', 'Kelas 10', 'Tingkat SMA') strictly rejected: "${stagedRows[0]._errors['jenjang']}"`
    )
  } catch (err) {
    assert(false, '5. Invalid Class Rejection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 6: Duplicate Usernames Detection
  // ----------------------------------------------------
  try {
    const duplicateUsernameRows = [
      { 'Username': 'faiz_ghifari', 'Nama Depan': 'Faiz', 'Nama Belakang': 'Al-Ghifari', 'Email': 'faiz1@sekolah.sch.id', 'Jenjang': 'Kelas 1' },
      { 'Username': 'FAIZ_GHIFARI', 'Nama Depan': 'Faiz', 'Nama Belakang': 'Pratama', 'Email': 'faiz2@sekolah.sch.id', 'Jenjang': 'Kelas 2' }, // Case-insensitive duplicate
      { 'Username': 'unique_user', 'Nama Depan': 'Unique', 'Nama Belakang': 'Student', 'Email': 'unique@sekolah.sch.id', 'Jenjang': 'Kelas 3' },
    ]

    const mappings = autoMapHeaders(['Username', 'Nama Depan', 'Nama Belakang', 'Email', 'Jenjang'])
    const { stagedRows, stats } = processAndValidateRows(duplicateUsernameRows, mappings)

    const row1Flagged = stagedRows[0]._isDuplicate && stagedRows[0]._errors['username']?.includes('Duplikat Username')
    const row2Flagged = stagedRows[1]._isDuplicate && stagedRows[1]._errors['username']?.includes('Duplikat Username')
    const row3Clean = !stagedRows[2]._isDuplicate && stagedRows[2]._status === 'VALID'

    assert(
      row1Flagged && row2Flagged && row3Clean && stats.duplicate === 2,
      '6. Duplicate Usernames Detection',
      `Both rows 1 & 2 flagged with duplicate username error: "${stagedRows[0]._errors['username']}"`
    )
  } catch (err) {
    assert(false, '6. Duplicate Usernames Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 7: Duplicate Emails Detection
  // ----------------------------------------------------
  try {
    const duplicateEmailRows = [
      { 'Username': 'andi01', 'Nama Depan': 'Andi', 'Nama Belakang': 'Wijaya', 'Email': 'kembar@sekolah.sch.id', 'Jenjang': 'Kelas 1' },
      { 'Username': 'budi02', 'Nama Depan': 'Budi', 'Nama Belakang': 'Santoso', 'Email': 'KEMBAR@sekolah.sch.id', 'Jenjang': 'Kelas 2' }, // Same email, different case
      { 'Username': 'cici03', 'Nama Depan': 'Cici', 'Nama Belakang': 'Paramida', 'Email': 'cici@sekolah.sch.id', 'Jenjang': 'Kelas 3' },
    ]

    const mappings = autoMapHeaders(['Username', 'Nama Depan', 'Nama Belakang', 'Email', 'Jenjang'])
    const { stagedRows, stats } = processAndValidateRows(duplicateEmailRows, mappings)

    const row1EmailDup = stagedRows[0]._isDuplicate && stagedRows[0]._errors['email']?.includes('Duplikat Email')
    const row2EmailDup = stagedRows[1]._isDuplicate && stagedRows[1]._errors['email']?.includes('Duplikat Email')
    const row3Clean = !stagedRows[2]._isDuplicate && stagedRows[2]._status === 'VALID'

    assert(
      row1EmailDup && row2EmailDup && row3Clean && stats.duplicate === 2,
      '7. Duplicate Emails Detection',
      `Both rows with 'kembar@sekolah.sch.id' marked as duplicate email: "${stagedRows[0]._errors['email']}"`
    )
  } catch (err) {
    assert(false, '7. Duplicate Emails Detection', String(err))
  }

  // ----------------------------------------------------
  // Scenario 8: Inline Editing of Invalid Records
  // ----------------------------------------------------
  try {
    const store = useImportStore.getState()
    store.resetImport()

    // Add a single invalid row
    store.addManualRow({
      username: 'budi santoso', // Invalid space
      firstname: 'Budi',
      lastname: 'Santoso',
      email: 'not-an-email', // Invalid email
      jenjang: 'Kelas 99', // Invalid jenjang
    })

    const initialRows = useImportStore.getState().stagedRows
    const targetRow = initialRows[0]
    const initialErrors = { ...targetRow._errors }

    // Step 1: Fix username
    store.updateCell(targetRow._rowId, 'username', 'budi_santoso')
    // Step 2: Fix email
    store.updateCell(targetRow._rowId, 'email', 'budi.santoso@sekolah.sch.id')
    // Step 3: Fix jenjang
    store.updateCell(targetRow._rowId, 'jenjang', 'Kelas 3')

    const updatedRow = useImportStore.getState().stagedRows[0]
    const currentStats = useImportStore.getState().stats

    const pass =
      Object.keys(initialErrors).length >= 2 &&
      updatedRow._status === 'VALID' &&
      Object.keys(updatedRow._errors).length === 0 &&
      currentStats.valid === 1 &&
      currentStats.error === 0

    assert(
      pass,
      '8. Inline Editing of Invalid Records',
      `Row transformed: ERROR (username='budi santoso', email='not-an-email') -> VALID (username='budi_santoso', email='budi.santoso@sekolah.sch.id', jenjang='Kelas 3')`
    )
  } catch (err) {
    assert(false, '8. Inline Editing of Invalid Records', String(err))
  }

  // ----------------------------------------------------
  // Scenario 9: Moodle CSV Header Compatibility
  // ----------------------------------------------------
  try {
    const mockStagedRows: StagedParticipantRow[] = [
      {
        _rowId: 'row-1',
        _rowIndex: 2,
        _status: 'VALID',
        _errors: {},
        _warnings: {},
        username: 'ahmad_faiz',
        firstname: 'Ahmad',
        lastname: 'Faiz',
        email: 'ahmad.faiz@sekolah.sch.id',
        jenjang: 'Kelas 1',
      },
      {
        _rowId: 'row-2',
        _rowIndex: 3,
        _status: 'VALID',
        _errors: {},
        _warnings: {},
        username: 'siti_rahma',
        firstname: 'Siti',
        lastname: 'Rahma',
        email: 'siti.rahma@sekolah.sch.id',
        jenjang: 'Kelas 2',
      },
    ]

    const csvOutput = generateMoodleCsv(mockStagedRows)
    const lines = csvOutput.split(/\r?\n/)
    const headerLine = lines[0]

    const expectedHeader = 'username,firstname,lastname,email,course'
    const isHeaderExact = headerLine === expectedHeader
    const row1HasCourse = lines[1] === 'ahmad_faiz,Ahmad,Faiz,ahmad.faiz@sekolah.sch.id,Kelas 1'
    const row2HasCourse = lines[2] === 'siti_rahma,Siti,Rahma,siti.rahma@sekolah.sch.id,Kelas 2'

    // Verify Jenjang is preserved in staging course mapping summary
    const courseSummaries = getJenjangCourseMappingSummary(mockStagedRows)
    const k1Summary = courseSummaries.find((c) => c.jenjang === 'Kelas 1')
    const k2Summary = courseSummaries.find((c) => c.jenjang === 'Kelas 2')
    const courseMappingWorks = k1Summary?.participantCount === 1 && k2Summary?.participantCount === 1

    const pass = isHeaderExact && row1HasCourse && row2HasCourse && courseMappingWorks
    assert(
      pass,
      '9. Moodle CSV Header Compatibility',
      `Header matches confirmed Moodle format '${expectedHeader}', Jenjang successfully mapped as 'course' ('Kelas 1', 'Kelas 2') in exported data`
    )
  } catch (err) {
    assert(false, '9. Moodle CSV Header Compatibility', String(err))
  }

  // ----------------------------------------------------
  // Scenario 10: CSV UTF-8 BOM Encoding
  // ----------------------------------------------------
  try {
    const mockSpecialCharRows: StagedParticipantRow[] = [
      {
        _rowId: 'row-1',
        _rowIndex: 2,
        _status: 'VALID',
        _errors: {},
        _warnings: {},
        username: 'faiz_syarif',
        firstname: 'Fa’iz', // Curly apostrophe
        lastname: 'Syarîf', // Circumflex
        email: 'faiz.syarif@sekolah.sch.id',
        jenjang: 'Kelas 1',
      },
    ]

    const csvWithBom = generateMoodleCsvWithBom(mockSpecialCharRows)
    const hasBom = csvWithBom.startsWith('\uFEFF')
    const containsAccents = csvWithBom.includes('Fa’iz') && csvWithBom.includes('Syarîf')

    assert(
      hasBom && containsAccents,
      '10. CSV UTF-8 BOM Encoding',
      `CSV output starts with UTF-8 BOM character (\\uFEFF) and accurately preserves special characters 'Fa’iz', 'Syarîf'`
    )
  } catch (err) {
    assert(false, '10. CSV UTF-8 BOM Encoding', String(err))
  }

  // ----------------------------------------------------
  // Scenario 11: Existing Phase 3 Regression
  // ----------------------------------------------------
  try {
    const output = execSync('cmd.exe /c npx -y tsx scripts/test-phase3.ts', {
      encoding: 'utf8',
    })
    const passed15 = output.includes('TOTAL SCENARIOS : 15') && output.includes('PASSED          : 15') && output.includes('FAILED          : 0')
    assert(
      passed15,
      '11. Existing Phase 3 Regression',
      'All 15 legacy Phase 3 scenarios passed with 0 failures'
    )
  } catch (err) {
    assert(false, '11. Existing Phase 3 Regression', String(err))
  }

  // ----------------------------------------------------
  // Scenario 12: Production Build
  // ----------------------------------------------------
  try {
    const buildOutput = execSync('cmd.exe /c npm run build', {
      encoding: 'utf8',
    })
    const buildSuccess = buildOutput.includes('built in') || buildOutput.includes('dist/index.html')
    assert(
      buildSuccess,
      '12. Production Build',
      'tsc -b && vite build completed successfully with 0 errors'
    )
  } catch (err) {
    assert(false, '12. Production Build', String(err))
  }

  // ----------------------------------------------------
  // Summary Reporting
  // ----------------------------------------------------
  console.log('\n======================================================')
  console.log('       OGSOREG BULK REGISTRATION TEST RESULTS         ')
  console.log('======================================================')

  let passedCount = 0
  let failedCount = 0

  results.forEach((r) => {
    const symbol = r.passed ? '[✓ PASS]' : '[✗ FAIL]'
    console.log(`${symbol} ${r.scenario}`)
    console.log(`       -> ${r.details}`)
    if (r.passed) passedCount++
    else failedCount++
  })

  console.log('\n======================================================')
  console.log(`TOTAL SCENARIOS : ${results.length}`)
  console.log(`PASSED          : ${passedCount}`)
  console.log(`FAILED          : ${failedCount}`)
  console.log('======================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
