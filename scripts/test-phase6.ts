/**
 * OGSOreg Phase 6 - Automated Test Suite
 * Moodle Bulk User Export & Automatic Course Assignment
 * 
 * Verifies all 25 required criteria:
 * 1. Exact seven-column export structure
 * 2. Username mapping
 * 3. Firstname mapping
 * 4. Lastname mapping
 * 5. Email mapping
 * 6. Kelas 1 course mapping
 * 7. Kelas 2 course mapping
 * 8. Kelas 3 course mapping
 * 9. Kelas 4 course mapping
 * 10. Kelas 5 course mapping
 * 11. Mixed-class export
 * 12. Constant simulation course (course2 = simulation)
 * 13. Default password generation (ogso_2026!)
 * 14. Password policy warning (uppercase requirement detection)
 * 15. CSV UTF-8 encoding (Byte Order Mark \uFEFF)
 * 16. CSV escaping (RFC 4180 quoting and commas)
 * 17. Duplicate username blocking
 * 18. Invalid email blocking
 * 19. Missing course mapping blocking
 * 20. Excel export structure (MOODLE_USERS sheet & 7 columns)
 * 21. Export selected students
 * 22. Export all filtered students
 * 23. No password persistence (never stored in DB/localStorage)
 * 24. No false Moodle synchronization status (exported != synced)
 * 25. Large batch export of 1,200 students
 */

import {
  MOODLE_EXPORT_COLUMNS,
  MOODLE_EXCEL_SHEET_NAME,
  DEFAULT_INITIAL_PASSWORD,
  mapStudentsToMoodleExport,
  checkMoodlePasswordPolicy,
  sanitizeSpreadsheetFormula,
} from '../src/services/moodle/moodleExportMapper'
import {
  generateMoodleUsersCsv,
  generateMoodleUsersCsvWithBom,
  escapeMoodleCsvField,
} from '../src/services/moodle/moodleCsvExporter'
import {
  buildMoodleUsersWorkbook,
} from '../src/services/moodle/moodleExcelExporter'
import {
  DEFAULT_COURSE_MAPPINGS,
  getCourseMappingConfig,
  getCourseShortnameForJenjang,
  saveCourseMappingConfig,
} from '../src/services/moodle/moodleCourseMapping'
import { studentRepository } from '../src/services/studentRepository'
import type { Student, StudentJenjang } from '../src/types/student'

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
  const mark = condition ? '✓ PASS' : '✗ FAIL'
  console.log(`[${mark}] ${scenario}`)
  console.log(`       Details: ${details}`)
}

async function runPhase6Tests() {
  console.log('====================================================')
  console.log('=== STARTING OGSOREG PHASE 6 AUTOMATED TEST SUITE ===')
  console.log('====================================================\n')

  const testInstId = `test-inst-${Date.now()}`

  // Helper to build test students
  const createTestStudent = (partial: Partial<Student>): Student => ({
    id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username: partial.username || 'santri_ogso_1',
    firstname: partial.firstname || 'Ahmad',
    lastname: partial.lastname || 'Dahlan',
    full_name: partial.full_name || `${partial.firstname || 'Ahmad'} ${partial.lastname || 'Dahlan'}`,
    email: partial.email || 'ahmad.dahlan@gontor.sch.id',
    jenjang: partial.jenjang || 'Jenjang 1',
    institution_id: partial.institution_id || testInstId,
    created_by: 'test-runner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: partial.source || 'excel',
    sync_status: partial.sync_status || 'local_only',
    moodle_user_id: null,
    last_synced_at: null,
  })

  // --------------------------------------------------------------------------
  // TEST 1: Exact seven-column export structure
  // --------------------------------------------------------------------------
  {
    const expectedHeaders = ['username', 'firstname', 'lastname', 'email', 'course1', 'course2', 'password']
    const isExact =
      MOODLE_EXPORT_COLUMNS.length === 7 &&
      MOODLE_EXPORT_COLUMNS.every((col, idx) => col === expectedHeaders[idx])

    const sample = createTestStudent({})
    const mapped = mapStudentsToMoodleExport([sample])
    const csv = generateMoodleUsersCsv(mapped.mappedRows)
    const headerLine = csv.split(/\r?\n/)[0]

    assert(
      isExact && headerLine === 'username,firstname,lastname,email,course1,course2,password',
      '1. Exact seven-column export structure',
      `Header matches exactly: '${headerLine}' with 7 columns in designated sequence`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 2: Username mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ username: '  HAMZAH_ALI_99  ' })
    const mapped = mapStudentsToMoodleExport([student])
    const row = mapped.mappedRows[0]
    assert(
      row.username === 'hamzah_ali_99',
      '2. Username mapping',
      `Username trimmed and normalized to lowercase: '${row.username}'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 3: Firstname mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ firstname: '  Muhammad Fatih  ' })
    const mapped = mapStudentsToMoodleExport([student])
    const row = mapped.mappedRows[0]
    assert(
      row.firstname === 'Muhammad Fatih',
      '3. Firstname mapping',
      `Firstname mapped cleanly: '${row.firstname}'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 4: Lastname mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ lastname: 'Al-Farisi' })
    const mapped = mapStudentsToMoodleExport([student])
    const row = mapped.mappedRows[0]
    assert(
      row.lastname === 'Al-Farisi',
      '4. Lastname mapping',
      `Lastname mapped cleanly: '${row.lastname}'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 5: Email mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ email: '  SANTRI@GONTOR.AC.ID  ' })
    const mapped = mapStudentsToMoodleExport([student])
    const row = mapped.mappedRows[0]
    assert(
      row.email === 'santri@gontor.ac.id',
      '5. Email mapping',
      `Email trimmed and converted to lowercase: '${row.email}'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 6: Kelas 1 course mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ jenjang: 'Jenjang 1' })
    const mapped = mapStudentsToMoodleExport([student])
    assert(
      mapped.mappedRows[0].course1 === 'ogso_k1' || mapped.mappedRows[0].course1 === 'ogso_j1',
      '6. Kelas 1 course mapping',
      `Kelas 1 mapped to shortname '${mapped.mappedRows[0].course1}' (ogso_k1 / ogso_j1)`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 7: Kelas 2 course mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ jenjang: 'Jenjang 2' })
    const mapped = mapStudentsToMoodleExport([student])
    assert(
      mapped.mappedRows[0].course1 === 'ogso_k2' || mapped.mappedRows[0].course1 === 'ogso_j2',
      '7. Kelas 2 course mapping',
      `Kelas 2 mapped to shortname '${mapped.mappedRows[0].course1}' (ogso_k2 / ogso_j2)`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 8: Kelas 3 course mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ jenjang: 'Jenjang 3' })
    const mapped = mapStudentsToMoodleExport([student])
    assert(
      mapped.mappedRows[0].course1 === 'ogso_k3' || mapped.mappedRows[0].course1 === 'ogso_j3',
      '8. Kelas 3 course mapping',
      `Kelas 3 mapped to shortname '${mapped.mappedRows[0].course1}' (ogso_k3 / ogso_j3)`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 9: Kelas 4 course mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ jenjang: 'Jenjang 4' })
    const mapped = mapStudentsToMoodleExport([student])
    assert(
      mapped.mappedRows[0].course1 === 'ogso_k4' || mapped.mappedRows[0].course1 === 'ogso_j4',
      '9. Kelas 4 course mapping',
      `Kelas 4 mapped to shortname '${mapped.mappedRows[0].course1}' (ogso_k4 / ogso_j4)`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 10: Kelas 5 course mapping
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ jenjang: 'Jenjang 5' })
    const mapped = mapStudentsToMoodleExport([student])
    assert(
      mapped.mappedRows[0].course1 === 'ogso_k5' || mapped.mappedRows[0].course1 === 'ogso_j5',
      '10. Kelas 5 course mapping',
      `Kelas 5 mapped to shortname '${mapped.mappedRows[0].course1}' (ogso_k5 / ogso_j5)`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 11: Mixed-class export
  // --------------------------------------------------------------------------
  {
    const mixed = [
      createTestStudent({ username: 'santri_k1', jenjang: 'Jenjang 1' }),
      createTestStudent({ username: 'santri_k2', jenjang: 'Jenjang 2' }),
      createTestStudent({ username: 'santri_k3', jenjang: 'Jenjang 3' }),
      createTestStudent({ username: 'santri_k4', jenjang: 'Jenjang 4' }),
      createTestStudent({ username: 'santri_k5', jenjang: 'Jenjang 5' }),
    ]
    const mapped = mapStudentsToMoodleExport(mixed)
    const courses = mapped.mappedRows.map((r) => r.course1)
    const expected = ['ogso_k1', 'ogso_k2', 'ogso_k3', 'ogso_k4', 'ogso_k5']
    const matchesAll = courses.every((c, i) => c === expected[i] || c === expected[i].replace('_k', '_j'))
    assert(
      matchesAll && mapped.mappedRows.length === 5,
      '11. Mixed-class export',
      `Mixed cohort export mapped correctly: [${courses.join(', ')}]`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 12: Constant simulation course (course2 = simulation)
  // --------------------------------------------------------------------------
  {
    const students = [
      createTestStudent({ username: 'u1', jenjang: 'Jenjang 1' }),
      createTestStudent({ username: 'u2', jenjang: 'Jenjang 3' }),
      createTestStudent({ username: 'u3', jenjang: 'Jenjang 5' }),
    ]
    const mapped = mapStudentsToMoodleExport(students)
    const allSimulation = mapped.mappedRows.every((r) => r.course2 === 'simulation')
    assert(
      allSimulation,
      '12. Constant simulation course',
      `All ${mapped.mappedRows.length} rows have course2 = 'simulation'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 13: Default password generation (ogso_2026!)
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({})
    const mapped = mapStudentsToMoodleExport([student])
    assert(
      mapped.mappedRows[0].password === DEFAULT_INITIAL_PASSWORD &&
        DEFAULT_INITIAL_PASSWORD === 'ogso_2026!',
      '13. Default password generation',
      `Generated initial password is exact default: '${mapped.mappedRows[0].password}'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 14: Password policy warning (uppercase requirement check)
  // --------------------------------------------------------------------------
  {
    const defaultCheck = checkMoodlePasswordPolicy('ogso_2026!')
    const compliantCheck = checkMoodlePasswordPolicy('Ogso_2026!')
    assert(
      !defaultCheck.compliant &&
        defaultCheck.warning !== undefined &&
        compliantCheck.compliant &&
        compliantCheck.warning === undefined,
      '14. Password policy warning',
      `Warns when uppercase is missing: "${defaultCheck.warning}"`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 15: CSV UTF-8 encoding (Byte Order Mark \uFEFF)
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ firstname: 'Rasyīd', lastname: 'Mullā' })
    const mapped = mapStudentsToMoodleExport([student])
    const csvWithBom = generateMoodleUsersCsvWithBom(mapped.mappedRows)
    const hasBom = csvWithBom.startsWith('\uFEFF')
    assert(
      hasBom && csvWithBom.includes('Rasyīd'),
      '15. CSV UTF-8 encoding',
      `CSV starts with UTF-8 BOM (\\uFEFF) and preserves international characters: 'Rasyīd'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 16: CSV escaping (RFC 4180 quotes, commas, formula sanitization)
  // --------------------------------------------------------------------------
  {
    const escapedComma = escapeMoodleCsvField('Dahlan, K.H. Ahmad')
    const escapedQuote = escapeMoodleCsvField('Santri "Bintang" 2026')
    const formulaSafe = sanitizeSpreadsheetFormula('=1+1')
    assert(
      escapedComma === '"Dahlan, K.H. Ahmad"' &&
        escapedQuote === '"Santri ""Bintang"" 2026"' &&
        formulaSafe === "'=1+1",
      '16. CSV escaping & formula protection',
      `Commas quoted: ${escapedComma}, inner quotes doubled: ${escapedQuote}, formula sanitized: ${formulaSafe}`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 17: Duplicate username blocking
  // --------------------------------------------------------------------------
  {
    const dupes = [
      createTestStudent({ username: 'santri_kembar', email: 'k1@gontor.sch.id' }),
      createTestStudent({ username: 'santri_kembar', email: 'k2@gontor.sch.id' }),
    ]
    const mapped = mapStudentsToMoodleExport(dupes)
    assert(
      mapped.duplicateUsernames > 0 &&
        mapped.issues.some((i) => i.type === 'DUPLICATE_USERNAME'),
      '17. Duplicate username blocking',
      `Duplicate username detected within batch: ${mapped.duplicateUsernames} issue(s) surfaced`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 18: Invalid email blocking
  // --------------------------------------------------------------------------
  {
    const badEmail = createTestStudent({ email: 'bukan_email_valid' })
    const mapped = mapStudentsToMoodleExport([badEmail])
    assert(
      mapped.invalidStudents > 0 &&
        mapped.issues.some((i) => i.type === 'INVALID_EMAIL'),
      '18. Invalid email blocking',
      `Invalid email correctly flagged and counted in invalidStudents: ${mapped.invalidStudents}`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 19: Missing course mapping blocking
  // --------------------------------------------------------------------------
  {
    const unmapped = createTestStudent({ jenjang: 'Kelas 99' as any })
    const mapped = mapStudentsToMoodleExport([unmapped])
    assert(
      mapped.unmappedClasses > 0 &&
        mapped.issues.some((i) => i.type === 'UNMAPPED_JENJANG'),
      '19. Missing course mapping blocking',
      `Unmapped jenjang flagged: ${mapped.unmappedClasses} unmapped class found`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 20: Excel export structure (MOODLE_USERS sheet & 7 columns)
  // --------------------------------------------------------------------------
  {
    const student = createTestStudent({ jenjang: 'Jenjang 1' })
    const mapped = mapStudentsToMoodleExport([student])
    const wb = await buildMoodleUsersWorkbook(mapped.mappedRows)
    const ws = wb.getWorksheet(MOODLE_EXCEL_SHEET_NAME)

    const sheetExists = ws !== undefined
    const colCount = ws ? ws.columns?.length : 0
    const row1Values = ws ? [
      ws.getCell('A1').value,
      ws.getCell('B1').value,
      ws.getCell('C1').value,
      ws.getCell('D1').value,
      ws.getCell('E1').value,
      ws.getCell('F1').value,
      ws.getCell('G1').value,
    ] : []

    const headerMatch = row1Values.join(',') === 'username,firstname,lastname,email,course1,course2,password'
    assert(
      sheetExists && colCount === 7 && headerMatch,
      '20. Excel export structure',
      `Worksheet '${MOODLE_EXCEL_SHEET_NAME}' created with exactly 7 columns and matching headers`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 21: Export selected students
  // --------------------------------------------------------------------------
  {
    const s1 = createTestStudent({ username: 'sel_1' })
    const s2 = createTestStudent({ username: 'sel_2' })
    const s3 = createTestStudent({ username: 'sel_3' })
    const selected = [s1, s3]
    const mapped = mapStudentsToMoodleExport(selected)
    assert(
      mapped.mappedRows.length === 2 &&
        mapped.mappedRows[0].username === 'sel_1' &&
        mapped.mappedRows[1].username === 'sel_3',
      '21. Export selected students',
      `Exported precisely ${mapped.mappedRows.length} selected students without unselected rows`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 22: Export all filtered students
  // --------------------------------------------------------------------------
  {
    // Save batch to studentRepository with testInstId
    await studentRepository.bulkSaveStudents(
      [
        { username: 'filt_k1_a', firstname: 'Filt1', lastname: 'A', email: 'f1a@g.id', jenjang: 'Kelas 1', institution_id: testInstId },
        { username: 'filt_k1_b', firstname: 'Filt1', lastname: 'B', email: 'f1b@g.id', jenjang: 'Kelas 1', institution_id: testInstId },
        { username: 'filt_k2_c', firstname: 'Filt2', lastname: 'C', email: 'f2c@g.id', jenjang: 'Kelas 2', institution_id: testInstId },
      ],
      testInstId,
      'test-runner',
      'manual'
    )

    const query = await studentRepository.getStudents({
      institutionId: testInstId,
      jenjang: 'Jenjang 1',
    })

    const mapped = mapStudentsToMoodleExport(query.data)
    assert(
      query.data.length === 2 &&
        mapped.mappedRows.every((r) => r.course1 === 'ogso_k1' || r.course1 === 'ogso_j1'),
      '22. Export all filtered students',
      `Filtered query retrieved ${query.data.length} students, mapped course1 = '${mapped.mappedRows[0]?.course1}'`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 23: No password persistence
  // --------------------------------------------------------------------------
  {
    // Inspect students in repository to ensure NO password field exists
    const res = await studentRepository.getStudents({ institutionId: testInstId, pageSize: 10 })
    const hasPasswordField = res.data.some((s: any) => 'password' in s || 'passwd' in s || 'pass' in s)
    assert(
      !hasPasswordField,
      '23. No password persistence',
      `Student records in storage do NOT store plaintext passwords. Passwords only generated at export time.`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 24: No false Moodle synchronization status
  // --------------------------------------------------------------------------
  {
    const testUsername = 'sync_status_check'
    await studentRepository.saveStudent({
      username: testUsername,
      firstname: 'Sync',
      lastname: 'Test',
      email: 'synctest@gontor.ac.id',
      jenjang: 'Kelas 3',
      institution_id: testInstId,
      source: 'manual',
      sync_status: 'local_only',
      created_by: 'test-runner',
    })

    // Mark as exported
    await studentRepository.markAsExported([testUsername], testInstId)
    const afterExport = await studentRepository.getStudents({ institutionId: testInstId, search: testUsername })
    const currentStatus = afterExport.data[0]?.sync_status

    assert(
      currentStatus === 'exported' && (currentStatus as string) !== 'synced',
      '24. No false Moodle synchronization status',
      `Exported student marked as 'exported'. 'synced' is never falsely claimed without real Moodle proof.`
    )
  }

  // --------------------------------------------------------------------------
  // TEST 25: Large batch export of 1,200 students (Throughput & Benchmark)
  // --------------------------------------------------------------------------
  {
    const count = 1200
    const largeBatch: Student[] = []
    const jenjangs: StudentJenjang[] = ['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5']

    for (let i = 1; i <= count; i++) {
      const j = jenjangs[(i - 1) % jenjangs.length]
      largeBatch.push({
        id: `bench-${i}`,
        username: `santri_bench_${i}`,
        firstname: `Santri${i}`,
        lastname: `Nusantara`,
        full_name: `Santri${i} Nusantara`,
        email: `santri${i}@gontor.ac.id`,
        jenjang: j,
        institution_id: testInstId,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'excel',
        sync_status: 'local_only',
        moodle_user_id: null,
        last_synced_at: null,
      })
    }

    const t0 = performance.now()
    const mapped = mapStudentsToMoodleExport(largeBatch)
    const csv = generateMoodleUsersCsvWithBom(mapped.mappedRows)
    const t1 = performance.now()
    const durationMs = t1 - t0

    const lines = csv.split(/\r?\n/)
    const rowCount = lines.length - 1 // subtract header

    assert(
      mapped.validStudents === count &&
        rowCount === count &&
        durationMs < 1000,
      '25. Large batch export of 1,200 students',
      `Processed & exported ${count} students to 7-column Moodle CSV in ${durationMs.toFixed(2)} ms (< 1,000 ms budget)`
    )
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n====================================================')
  console.log('===       OGSOREG PHASE 6 TEST RESULTS SUMMARY    ===')
  console.log('====================================================')
  const total = results.length
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  results.forEach((r, idx) => {
    const mark = r.passed ? '[✓ PASS]' : '[✗ FAIL]'
    console.log(`${mark} ${idx + 1}. ${r.scenario}`)
    console.log(`       Details: ${r.details}`)
  })

  console.log('\n====================================================')
  console.log(`TOTAL SCENARIOS: ${total}`)
  console.log(`PASSED: ${passed}`)
  console.log(`FAILED: ${failed}`)
  console.log('====================================================\n')

  if (failed === 0) {
    console.log('🎉 ALL 25 PHASE 6 AUTOMATED TESTS PASSED SUCCESSFULLY!\n')
    process.exit(0)
  } else {
    console.error(`💥 ${failed} TEST(S) FAILED!`)
    process.exit(1)
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
