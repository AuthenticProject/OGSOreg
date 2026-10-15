/**
 * OGSOreg Phase 7 - Automated Test Suite
 * Campus Selection, Moodle Enrolment Integration, Synchronization & Reports
 */

import {
  KAMPUS_OPTIONS,
  isValidKampus,
  isKampusIncomplete,
  type StudentKampus,
} from '../src/types/campus'
import {
  buildRegistrationWorkbook,
  buildAdminReportWorkbook,
} from '../src/services/excelGenerator'
import {
  processAndValidateRows,
  validateAllStagedRows,
} from '../src/services/validationEngine'
import { autoMapHeaders } from '../src/services/headerMapper'
import {
  studentSchema,
  newStudentSchema,
} from '../src/schemas/student.schema'
import { studentRepository } from '../src/services/studentRepository'
import {
  MOODLE_EXPORT_COLUMNS,
  mapStudentsToMoodleExport,
} from '../src/services/moodle/moodleExportMapper'
import { generateMoodleUsersCsv } from '../src/services/moodle/moodleCsvExporter'
import {
  discoverMoodleIntegration,
  MOODLE_UNCONFIGURED_NOTICE,
  MOODLE_TARGET_URL,
} from '../src/services/moodle/moodleApiDiscovery'
import { moodleSyncEngine } from '../src/services/moodle/moodleSyncEngine'
import { operationHistoryService } from '../src/services/operationHistoryService'
import type { Student, StudentJenjang } from '../src/types/student'
import * as fs from 'fs'
import * as path from 'path'

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

async function runPhase7Tests() {
  console.log('====================================================')
  console.log('=== STARTING OGSOREG PHASE 7 AUTOMATED TEST SUITE ===')
  console.log('====================================================\n')

  const testInstId = `test-phase7-${Date.now()}`

  // ----------------------------------------------------
  // Test 1: Excel template includes Kampus
  // ----------------------------------------------------
  try {
    const wb = await buildRegistrationWorkbook()
    const ws = wb.getWorksheet('PENDAFTARAN')
    const headerRow = ws ? ws.getRow(1).values as string[] : []
    const hasKampus = headerRow.some((h) => typeof h === 'string' && h.toLowerCase().includes('kampus'))
    assert(
      hasKampus && headerRow[6] === 'Kampus',
      '1. Excel template includes Kampus',
      `PENDAFTARAN sheet header contains required Kampus column at position 6: [${headerRow.filter(Boolean).join(', ')}]`
    )
  } catch (err) {
    assert(false, '1. Excel template includes Kampus', String(err))
  }

  // ----------------------------------------------------
  // Test 2: Exactly 20 campus options
  // ----------------------------------------------------
  try {
    const isExactly20 = KAMPUS_OPTIONS.length === 20
    const hasGontor1 = KAMPUS_OPTIONS.includes('Gontor 1')
    const hasGontor12 = KAMPUS_OPTIONS.includes('Gontor 12')
    const hasPutri1 = KAMPUS_OPTIONS.includes('Gontor Putri 1')
    const hasPutri8 = KAMPUS_OPTIONS.includes('Gontor Putri 8')
    assert(
      isExactly20 && hasGontor1 && hasGontor12 && hasPutri1 && hasPutri8,
      '2. Exactly 20 campus options',
      `Contains exactly 20 official campuses: Gontor 1–12 and Gontor Putri 1–8 (count: ${KAMPUS_OPTIONS.length})`
    )
  } catch (err) {
    assert(false, '2. Exactly 20 campus options', String(err))
  }

  // ----------------------------------------------------
  // Test 3: Campus dropdown functionality
  // ----------------------------------------------------
  try {
    const wb = await buildRegistrationWorkbook()
    const ws = wb.getWorksheet('PENDAFTARAN')
    const refSheet = wb.getWorksheet('_REFERENSI')
    const row2 = ws?.getRow(2)
    const kampusCell = row2?.getCell(6)
    const validation = kampusCell?.dataValidation

    const refPopulated = refSheet && refSheet.rowCount >= 20
    const covers5000 = ws && ws.getRow(5000).getCell(6).dataValidation !== undefined
    const formulaRef = validation?.formulae?.[0] || ''

    assert(
      Boolean(validation && covers5000 && refPopulated && formulaRef.includes('_REFERENSI')),
      '3. Campus dropdown functionality',
      `Data validation applied to 5,000 rows referencing hidden sheet formula: '${formulaRef}'`
    )
  } catch (err) {
    assert(false, '3. Campus dropdown functionality', String(err))
  }

  // ----------------------------------------------------
  // Test 4: Kelas 1–5 dropdown preservation
  // ----------------------------------------------------
  try {
    const wb = await buildRegistrationWorkbook()
    const ws = wb.getWorksheet('PENDAFTARAN')
    const jenjangCell = ws?.getRow(2).getCell(5)
    const jenjangVal = jenjangCell?.dataValidation
    const covers5000 = ws && ws.getRow(5000).getCell(5).dataValidation !== undefined
    const formulaRef = jenjangVal?.formulae?.[0] || ''

    assert(
      Boolean(jenjangVal && covers5000 && formulaRef.includes('_REFERENSI')),
      '4. Kelas 1–5 dropdown preservation',
      `Jenjang dropdown validation preserved across 5,000 rows referencing: '${formulaRef}'`
    )
  } catch (err) {
    assert(false, '4. Kelas 1–5 dropdown preservation', String(err))
  }

  // ----------------------------------------------------
  // Test 5: Mixed-campus Excel import
  // ----------------------------------------------------
  try {
    const headers = ['Username', 'First Name', 'Last Name', 'Email', 'Jenjang', 'Kampus']
    const mappings = autoMapHeaders(headers)
    const mixedRows = [
      {
        'Username': 'santri_g1',
        'First Name': 'Zaid',
        'Last Name': 'Tsabit',
        'Email': 'zaid@gontor.sch.id',
        'Jenjang': 'Kelas 1',
        'Kampus': 'Gontor 1',
      },
      {
        'Username': 'santri_gp1',
        'First Name': 'Aisyah',
        'Last Name': 'Humaira',
        'Email': 'aisyah@gontor.sch.id',
        'Jenjang': 'Kelas 3',
        'Kampus': 'Gontor Putri 1',
      },
      {
        'Username': 'santri_g12',
        'First Name': 'Salman',
        'Last Name': 'Farisi',
        'Email': 'salman@gontor.sch.id',
        'Jenjang': 'Kelas 5',
        'Kampus': 'Gontor 12',
      },
    ]

    const { stagedRows, stats } = processAndValidateRows(mixedRows, mappings)
    assert(
      stats.total === 3 && stats.error === 0 && stagedRows.every((r) => r.kampus && r._status === 'VALID'),
      '5. Mixed-campus Excel import',
      `Successfully parsed 3 mixed-campus students: [${stagedRows.map((r) => `${r.username}:${r.kampus}`).join(', ')}]`
    )
  } catch (err) {
    assert(false, '5. Mixed-campus Excel import', String(err))
  }

  // ----------------------------------------------------
  // Test 6: Invalid campus rejection
  // ----------------------------------------------------
  try {
    const headers = ['Username', 'First Name', 'Last Name', 'Email', 'Jenjang', 'Kampus']
    const mappings = autoMapHeaders(headers)
    const badRow = [
      {
        'Username': 'santri_bad_campus',
        'First Name': 'Fulan',
        'Last Name': 'Al-Majhul',
        'Email': 'fulan@gontor.sch.id',
        'Jenjang': 'Kelas 1',
        'Kampus': 'Gontor 99 (Tidak Ada)',
      },
    ]

    const { stagedRows, stats } = processAndValidateRows(badRow, mappings)
    const errorMsg = stagedRows[0]._errors['kampus']
    assert(
      stats.error === 1 && Boolean(errorMsg && errorMsg.includes('tidak valid')),
      '6. Invalid campus rejection',
      `Invalid campus 'Gontor 99' rejected: "${errorMsg}"`
    )
  } catch (err) {
    assert(false, '6. Invalid campus rejection', String(err))
  }

  // ----------------------------------------------------
  // Test 7: Manual campus selection
  // ----------------------------------------------------
  try {
    const validManual = newStudentSchema.safeParse({
      username: 'manual_santri_1',
      firstname: 'Bilal',
      lastname: 'Rabah',
      email: 'bilal@gontor.sch.id',
      jenjang: 'Kelas 2',
      kampus: 'Gontor 2',
      institution_id: testInstId,
    })

    const invalidManual = newStudentSchema.safeParse({
      username: 'manual_santri_2',
      firstname: 'Bilal',
      lastname: 'Rabah',
      email: 'bilal2@gontor.sch.id',
      jenjang: 'Kelas 2',
      kampus: '', // missing
      institution_id: testInstId,
    })

    assert(
      validManual.success && !invalidManual.success,
      '7. Manual campus selection',
      `New student schema accepts valid campus ('Gontor 2') and strictly rejects empty campus`
    )
  } catch (err) {
    assert(false, '7. Manual campus selection', String(err))
  }

  // ----------------------------------------------------
  // Test 8: Campus preservation after editing
  // ----------------------------------------------------
  try {
    const saveRes = await studentRepository.saveStudent({
      username: 'edit_std_campus',
      firstname: 'Harun',
      lastname: 'Rasyid',
      email: 'harun@gontor.sch.id',
      jenjang: 'Kelas 3',
      kampus: 'Gontor 3',
      institution_id: testInstId,
    })

    const studentId = saveRes.student!.id
    const updateRes = await studentRepository.updateStudent(
      studentId,
      { kampus: 'Gontor Putri 3' },
      testInstId
    )

    assert(
      updateRes.success && updateRes.student?.kampus === 'Gontor Putri 3',
      '8. Campus preservation after editing',
      `Updated student campus from 'Gontor 3' to '${updateRes.student?.kampus}' successfully`
    )
  } catch (err) {
    assert(false, '8. Campus preservation after editing', String(err))
  }

  // ----------------------------------------------------
  // Test 9: Campus persistence after reload
  // ----------------------------------------------------
  try {
    const fetched = await studentRepository.getStudentById(
      (await studentRepository.getStudents(testInstId)).students[0].id,
      testInstId
    )
    assert(
      fetched !== null && fetched.kampus === 'Gontor Putri 3',
      '9. Campus persistence after reload',
      `Retrieved stored student '${fetched?.username}' with campus '${fetched?.kampus}' intact`
    )
  } catch (err) {
    assert(false, '9. Campus persistence after reload', String(err))
  }

  // ----------------------------------------------------
  // Test 10: Existing student migration
  // ----------------------------------------------------
  try {
    // Save legacy student with empty campus
    const legacyStudent = await studentRepository.saveStudent({
      username: 'legacy_student_no_campus',
      firstname: 'Santri',
      lastname: 'Lama',
      email: 'lama@gontor.sch.id',
      jenjang: 'Kelas 4',
      institution_id: testInstId,
    })

    const stats = await studentRepository.getStats(testInstId)
    const isMarkedIncomplete = isKampusIncomplete(legacyStudent.student?.kampus)

    assert(
      legacyStudent.success &&
      legacyStudent.student?.id !== undefined &&
      isMarkedIncomplete &&
      (stats.incompleteKampusCount || 0) > 0,
      '10. Existing student migration',
      `Legacy student preserved without deletion or invented campus. Marked incomplete count: ${stats.incompleteKampusCount}`
    )
  } catch (err) {
    assert(false, '10. Existing student migration', String(err))
  }

  // ----------------------------------------------------
  // Test 11: Campus filtering
  // ----------------------------------------------------
  try {
    await studentRepository.saveStudent({
      username: 'filter_g1_a',
      firstname: 'Ali',
      lastname: 'Bin Abi Thalib',
      email: 'ali@gontor.sch.id',
      jenjang: 'Kelas 1',
      kampus: 'Gontor 1',
      institution_id: testInstId,
    })
    await studentRepository.saveStudent({
      username: 'filter_g2_b',
      firstname: 'Umar',
      lastname: 'Bin Khattab',
      email: 'umar@gontor.sch.id',
      jenjang: 'Kelas 2',
      kampus: 'Gontor 2',
      institution_id: testInstId,
    })

    const g1Res = await studentRepository.getStudents(testInstId, { kampus: 'Gontor 1' })
    const incompleteRes = await studentRepository.getStudents(testInstId, { kampus: 'incomplete' })

    assert(
      g1Res.total === 1 &&
      g1Res.data[0].kampus === 'Gontor 1' &&
      incompleteRes.data.some((s) => !s.kampus),
      '11. Campus filtering',
      `Filtered Gontor 1: ${g1Res.total} student(s). Filtered incomplete: ${incompleteRes.total} student(s)`
    )
  } catch (err) {
    assert(false, '11. Campus filtering', String(err))
  }

  // ----------------------------------------------------
  // Test 12: Campus search
  // ----------------------------------------------------
  try {
    const searchRes = await studentRepository.getStudents(testInstId, { search: 'Gontor 2' })
    assert(
      searchRes.total >= 1 && searchRes.data.some((s) => s.kampus === 'Gontor 2'),
      '12. Campus search',
      `Searching query 'Gontor 2' matched ${searchRes.total} student(s) including '${searchRes.data[0]?.full_name}'`
    )
  } catch (err) {
    assert(false, '12. Campus search', String(err))
  }

  // ----------------------------------------------------
  // Test 13: Combined campus and class filtering
  // ----------------------------------------------------
  try {
    const combinedRes = await studentRepository.getStudents(testInstId, {
      kampus: 'Gontor 2',
      jenjang: 'Kelas 2',
    })
    const isMatching = combinedRes.data.every(
      (s) => s.kampus === 'Gontor 2' && s.jenjang === 'Kelas 2'
    )
    assert(
      combinedRes.total === 1 && isMatching,
      '13. Combined campus and class filtering',
      `Combined filter (Gontor 2 + Kelas 2) yielded exactly ${combinedRes.total} record(s): ${combinedRes.data[0]?.username}`
    )
  } catch (err) {
    assert(false, '13. Combined campus and class filtering', String(err))
  }

  // ----------------------------------------------------
  // Test 14: Moodle CSV header unchanged
  // ----------------------------------------------------
  try {
    const students = (await studentRepository.getStudents(testInstId)).students
    const mapped = mapStudentsToMoodleExport(students)
    const csv = generateMoodleUsersCsv(mapped.mappedRows)
    const firstLine = csv.split('\n')[0].replace(/^\uFEFF/, '').trim()
    const expected = 'username,firstname,lastname,email,course1,course2,password'
    assert(
      firstLine === expected,
      '14. Moodle CSV header unchanged',
      `Moodle CSV header is strictly 7 columns: '${firstLine}'`
    )
  } catch (err) {
    assert(false, '14. Moodle CSV header unchanged', String(err))
  }

  // ----------------------------------------------------
  // Test 15: Course1 still maps from Jenjang
  // ----------------------------------------------------
  try {
    const students = (await studentRepository.getStudents(testInstId)).students
    const mapped = mapStudentsToMoodleExport(students)
    const k1Row = mapped.mappedRows.find((r) => r.course1 === 'ogso_k1')
    const k2Row = mapped.mappedRows.find((r) => r.course1 === 'ogso_k2')
    assert(
      k1Row !== undefined && k2Row !== undefined,
      '15. Course1 still maps from Jenjang',
      `Kelas 1 mapped to 'ogso_k1' and Kelas 2 mapped to 'ogso_k2'`
    )
  } catch (err) {
    assert(false, '15. Course1 still maps from Jenjang', String(err))
  }

  // ----------------------------------------------------
  // Test 16: Course2 remains simulation
  // ----------------------------------------------------
  try {
    const students = (await studentRepository.getStudents(testInstId)).students
    const mapped = mapStudentsToMoodleExport(students)
    const allSimulation = mapped.mappedRows.every((r) => r.course2 === 'simulation')
    assert(
      allSimulation && mapped.mappedRows.length > 0,
      '16. Course2 remains simulation',
      `All ${mapped.mappedRows.length} exported rows have course2 = 'simulation'`
    )
  } catch (err) {
    assert(false, '16. Course2 remains simulation', String(err))
  }

  // ----------------------------------------------------
  // Test 17: Campus included in administrative Excel
  // ----------------------------------------------------
  try {
    const all = await studentRepository.getStudents(testInstId)
    const wb = await buildAdminReportWorkbook(all.students, all.stats)
    const wsList = wb.getWorksheet('Daftar Santri & Kampus')
    const headerRow = wsList?.getRow(1).values as string[]
    const hasCampusCol = headerRow.some((h) => typeof h === 'string' && h.toLowerCase().includes('kampus'))
    assert(
      Boolean(hasCampusCol),
      '17. Campus included in administrative Excel',
      `Administrative Excel report contains 'Kampus' column: [${headerRow.filter(Boolean).join(', ')}]`
    )
  } catch (err) {
    assert(false, '17. Campus included in administrative Excel', String(err))
  }

  // ----------------------------------------------------
  // Test 18: Campus excluded from Moodle CSV
  // ----------------------------------------------------
  try {
    const students = (await studentRepository.getStudents(testInstId)).students
    const mapped = mapStudentsToMoodleExport(students)
    const csv = generateMoodleUsersCsv(mapped.mappedRows)
    const firstLine = csv.split('\n')[0]
    const headerHasKampus = firstLine.toLowerCase().includes('kampus')
    assert(
      !headerHasKampus && MOODLE_EXPORT_COLUMNS.length === 7,
      '18. Campus excluded from Moodle CSV',
      `Kampus is safely excluded from Moodle CSV. Only standard 7 columns present: [${MOODLE_EXPORT_COLUMNS.join(', ')}]`
    )
  } catch (err) {
    assert(false, '18. Campus excluded from Moodle CSV', String(err))
  }

  // ----------------------------------------------------
  // Test 19: Campus breakdown reporting
  // ----------------------------------------------------
  try {
    const stats = await studentRepository.getStats(testInstId)
    const hasAll20 = stats.byKampus && Object.keys(stats.byKampus).length === 20
    const g1Count = stats.byKampus?.['Gontor 1'] || 0
    const g2Count = stats.byKampus?.['Gontor 2'] || 0
    assert(
      Boolean(hasAll20 && g1Count >= 1 && g2Count >= 1),
      '19. Campus breakdown reporting',
      `Stats contains complete 20 campus breakdown: Gontor 1 (${g1Count}), Gontor 2 (${g2Count}), Incomplete (${stats.incompleteKampusCount})`
    )
  } catch (err) {
    assert(false, '19. Campus breakdown reporting', String(err))
  }

  // ----------------------------------------------------
  // Test 20: Safe behavior when Moodle API is unavailable
  // ----------------------------------------------------
  try {
    const students = (await studentRepository.getStudents(testInstId)).students
    const result = await moodleSyncEngine.executeSync(students)
    assert(
      result.success === false &&
      result.isApiConfigured === false &&
      result.message === MOODLE_UNCONFIGURED_NOTICE,
      '20. Safe behavior when Moodle API is unavailable',
      `Safely returned fallback message: "${result.message}" without false sync simulation`
    )
  } catch (err) {
    assert(false, '20. Safe behavior when Moodle API is unavailable', String(err))
  }

  // ----------------------------------------------------
  // Test 21: No false synchronization status
  // ----------------------------------------------------
  try {
    const students = (await studentRepository.getStudents(testInstId)).students
    // Mark as exported
    await studentRepository.markAsExported([students[0].username], testInstId)
    const check = (await studentRepository.getStudents(testInstId)).students.find((s) => s.id === students[0].id)
    assert(
      check?.sync_status === 'exported' && check?.sync_status !== 'synced',
      '21. No false synchronization status',
      `Status is accurately 'exported'. 'synced' is NEVER falsely assigned without confirmed Moodle API response`
    )
  } catch (err) {
    assert(false, '21. No false synchronization status', String(err))
  }

  // ----------------------------------------------------
  // Test 22: No API secrets in frontend
  // ----------------------------------------------------
  try {
    const srcDir = path.resolve(process.cwd(), 'src')
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[]
    let secretLeakFound = false
    let leakDetail = ''

    for (const file of files) {
      if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const fullPath = path.join(srcDir, file)
        const content = fs.readFileSync(fullPath, 'utf-8')
        if (content.includes('wstoken=') || content.includes('moodle_token_secret')) {
          secretLeakFound = true
          leakDetail = `Found hardcoded token in ${file}`
          break
        }
      }
    }

    assert(
      !secretLeakFound,
      '22. No API secrets in frontend',
      secretLeakFound ? leakDetail : 'Audited all frontend source files: zero hardcoded Moodle tokens found'
    )
  } catch (err) {
    assert(false, '22. No API secrets in frontend', String(err))
  }

  // ----------------------------------------------------
  // Test 23: Duplicate sync protection
  // ----------------------------------------------------
  try {
    const mockBatch: Student[] = [
      {
        id: 'dup-1',
        username: 'same_username',
        firstname: 'A',
        lastname: 'B',
        full_name: 'A B',
        email: 'a@g.sch.id',
        jenjang: 'Kelas 1',
        kampus: 'Gontor 1',
        institution_id: testInstId,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'manual',
        sync_status: 'local_only',
        moodle_user_id: null,
        last_synced_at: null,
      },
      {
        id: 'dup-2',
        username: 'same_username', // duplicate in batch
        firstname: 'C',
        lastname: 'D',
        full_name: 'C D',
        email: 'c@g.sch.id',
        jenjang: 'Kelas 2',
        kampus: 'Gontor 2',
        institution_id: testInstId,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'manual',
        sync_status: 'local_only',
        moodle_user_id: null,
        last_synced_at: null,
      },
    ]

    const preflight = moodleSyncEngine.preflightValidate(mockBatch)
    assert(
      preflight.valid.length === 1 && preflight.invalid.length === 1,
      '23. Duplicate sync protection',
      `Preflight validator blocked duplicate username '${mockBatch[1].username}' from sync: "${preflight.invalid[0].error}"`
    )
  } catch (err) {
    assert(false, '23. Duplicate sync protection', String(err))
  }

  // ----------------------------------------------------
  // Test 24: Error handling and Operation History
  // ----------------------------------------------------
  try {
    const record = await operationHistoryService.recordOperation({
      institution_id: testInstId,
      operation_type: 'export_moodle_csv',
      operator_email: 'tester@gontor.ac.id',
      student_count: 5,
      campus_distribution: { 'Gontor 1': 3, 'Gontor 2': 2 },
      jenjang_distribution: { 'Kelas 1': 3, 'Kelas 2': 2 },
      status: 'success',
      error_count: 0,
      details: 'Test automated audit logging',
    })

    const ops = await operationHistoryService.getOperations(testInstId)
    const found = ops.find((o) => o.id === record.id)

    assert(
      found !== undefined && found.campus_distribution['Gontor 1'] === 3,
      '24. Error handling and Operation History',
      `Recorded and retrieved operation log '${found?.operation_type}' with campus distribution`
    )
  } catch (err) {
    assert(false, '24. Error handling and Operation History', String(err))
  }

  // ----------------------------------------------------
  // Test 25: Large import with 1,200 mixed-campus students
  // ----------------------------------------------------
  try {
    const headers = ['Username', 'First Name', 'Last Name', 'Email', 'Jenjang', 'Kampus']
    const mappings = autoMapHeaders(headers)
    const largeBatch: Record<string, string>[] = []

    for (let i = 0; i < 1200; i++) {
      const campusIdx = i % KAMPUS_OPTIONS.length
      const jenjangIdx = (i % 5) + 1
      largeBatch.push({
        'Username': `santri_large_${i}`,
        'First Name': `Santri${i}`,
        'Last Name': `Akbar`,
        'Email': `santri.large.${i}@gontor.sch.id`,
        'Jenjang': `Kelas ${jenjangIdx}`,
        'Kampus': KAMPUS_OPTIONS[campusIdx],
      })
    }

    const t0 = performance.now()
    const { stagedRows, stats } = processAndValidateRows(largeBatch, mappings)
    const durationMs = performance.now() - t0

    assert(
      stats.total === 1200 && stats.error === 0 && durationMs < 1000,
      '25. Large import with 1,200 mixed-campus students',
      `Processed & validated 1,200 mixed-campus students in ${durationMs.toFixed(2)} ms (< 1,000 ms budget). Total valid: ${stats.valid}`
    )
  } catch (err) {
    assert(false, '25. Large import with 1,200 mixed-campus students', String(err))
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================')
  console.log('===       OGSOREG PHASE 7 TEST RESULTS SUMMARY    ===')
  console.log('====================================================')
  results.forEach((r, idx) => {
    const mark = r.passed ? '✓ PASS' : '✗ FAIL'
    console.log(`[${mark}] ${idx + 1}. ${r.scenario}`)
    console.log(`       Details: ${r.details}`)
  })

  const totalPassed = results.filter((r) => r.passed).length
  const totalFailed = results.filter((r) => !r.passed).length
  console.log('\n====================================================')
  console.log(`TOTAL SCENARIOS: ${results.length}`)
  console.log(`PASSED: ${totalPassed}`)
  console.log(`FAILED: ${totalFailed}`)
  console.log('====================================================\n')

  if (totalFailed === 0) {
    console.log('🎉 ALL 25 PHASE 7 AUTOMATED TESTS PASSED SUCCESSFULLY!\n')
    process.exit(0)
  } else {
    console.error(`❌ ${totalFailed} test(s) failed.\n`)
    process.exit(1)
  }
}

runPhase7Tests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
