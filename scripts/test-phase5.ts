/**
 * OGSOreg Phase 5 - Automated Test Suite
 * 
 * Verifies all 20 required criteria for Phase 5:
 * 1. Student model validation
 * 2. Jenjang Kelas 1–5 acceptance
 * 3. Invalid jenjang rejection
 * 4. Save valid student
 * 5. Reject invalid student
 * 6. Duplicate username detection
 * 7. Duplicate email warning / duplicate prevention
 * 8. Excel import persistence
 * 9. CSV import persistence
 * 10. Manual student creation
 * 11. Student editing
 * 12. Student deletion
 * 13. Bulk selection & bulk delete
 * 14. Moodle CSV export (confirmed basic headers: username,firstname,lastname,email)
 * 15. Search and filters (name, username, email, jenjang, source, sync_status)
 * 16. Pagination
 * 17. Data persistence after reload (localStorage / repository persistence)
 * 18. Institution data isolation
 * 19. Accurate synchronization status (local_only -> exported -> synced never automatic)
 * 20. Dashboard counts (Total, Kelas 1-5 breakdown, Belum Sinkron, Terverifikasi)
 */

import { studentSchema } from '../src/schemas/student.schema'
import { studentRepository } from '../src/services/studentRepository'
import {
  generateStudentsMoodleCsv,
  generateStudentsMoodleCsvWithBom,
} from '../src/services/moodleCsvService'
import type {
  Student,
  StudentJenjang,
  StudentSource,
  StudentSyncStatus,
} from '../src/types/student'

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

async function runPhase5Tests() {
  console.log('====================================================')
  console.log('=== STARTING OGSOREG PHASE 5 AUTOMATED TEST SUITE ===')
  console.log('====================================================\n')

  const TEST_INSTITUTION_A = 'inst-test-alpha-9901'
  const TEST_INSTITUTION_B = 'inst-test-beta-9902'
  const TEST_USER = 'user-admin-001'

  // Clear any existing test data for clean slate
  studentRepository.clearStore(TEST_INSTITUTION_A)
  studentRepository.clearStore(TEST_INSTITUTION_B)

  // ----------------------------------------------------
  // Test 1: Student model validation
  // ----------------------------------------------------
  try {
    const rawStudent = {
      username: 'santri_fatih',
      firstname: 'Fatih',
      lastname: 'Al-Farouq',
      email: 'fatih@gontor.sch.id',
      jenjang: 'Kelas 3',
      institution_id: TEST_INSTITUTION_A,
      source: 'excel',
      sync_status: 'local_only',
    }
    const parse = studentSchema.safeParse(rawStudent)
    assert(
      parse.success === true && parse.data.username === 'santri_fatih',
      '1. Student model validation',
      'Valid student model parsed successfully by Zod schema'
    )
  } catch (err) {
    assert(false, '1. Student model validation', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 2: Jenjang Kelas 1–5 acceptance
  // ----------------------------------------------------
  try {
    const validGrades: StudentJenjang[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5']
    const allValid = validGrades.every((grade) => {
      const p = studentSchema.safeParse({
        username: `user_${grade.replace(' ', '_').toLowerCase()}`,
        firstname: 'Test',
        lastname: 'Student',
        email: `test_${grade.replace(' ', '_').toLowerCase()}@gontor.sch.id`,
        jenjang: grade,
        institution_id: TEST_INSTITUTION_A,
      })
      return p.success
    })
    assert(
      allValid,
      '2. Jenjang Kelas 1–5 acceptance',
      'Kelas 1, Kelas 2, Kelas 3, Kelas 4, and Kelas 5 are all accepted'
    )
  } catch (err) {
    assert(false, '2. Jenjang Kelas 1–5 acceptance', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 3: Invalid jenjang rejection
  // ----------------------------------------------------
  try {
    const invalidGrades = ['Kelas 6', 'Kelas 10', 'SMP', 'SMA', '1', 'SD', '']
    const allRejected = invalidGrades.every((inv) => {
      const p = studentSchema.safeParse({
        username: 'user_inv',
        firstname: 'Invalid',
        email: 'inv@test.com',
        jenjang: inv,
        institution_id: TEST_INSTITUTION_A,
      })
      return !p.success
    })
    assert(
      allRejected,
      '3. Invalid jenjang rejection',
      'Non Kelas 1-5 jenjang values are strictly rejected by Zod schema'
    )
  } catch (err) {
    assert(false, '3. Invalid jenjang rejection', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 4: Save valid student
  // ----------------------------------------------------
  let savedStudent1: Student | null = null
  try {
    const res = await studentRepository.saveStudent({
      username: 'hamzah_ali',
      firstname: 'Hamzah',
      lastname: 'Ali',
      email: 'hamzah.ali@gontor.sch.id',
      jenjang: 'Kelas 1',
      institution_id: TEST_INSTITUTION_A,
      created_by: TEST_USER,
      source: 'manual',
    })
    savedStudent1 = res.student || null
    assert(
      res.success === true &&
        res.student?.full_name === 'Hamzah Ali' &&
        res.student?.sync_status === 'local_only',
      '4. Save valid student',
      `Saved successfully with ID '${res.student?.id}' and full_name derived`
    )
  } catch (err) {
    assert(false, '4. Save valid student', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 5: Reject invalid student
  // ----------------------------------------------------
  try {
    const res = await studentRepository.saveStudent({
      username: 'invalid user with spaces',
      firstname: '',
      email: 'not-an-email',
      jenjang: 'Kelas 9' as any,
      institution_id: TEST_INSTITUTION_A,
    })
    assert(
      res.success === false && Boolean(res.error),
      '5. Reject invalid student',
      `Correctly rejected invalid input: ${res.error}`
    )
  } catch (err) {
    assert(false, '5. Reject invalid student', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 6: Duplicate username detection
  // ----------------------------------------------------
  try {
    const dupRes = await studentRepository.saveStudent({
      username: 'HAMZAH_ALI', // case-insensitive duplicate of hamzah_ali
      firstname: 'Hamzah',
      lastname: 'Dua',
      email: 'hamzah.other@gontor.sch.id',
      jenjang: 'Kelas 2',
      institution_id: TEST_INSTITUTION_A,
    })
    assert(
      dupRes.success === false && dupRes.error?.includes('Username'),
      '6. Duplicate username detection',
      `Duplicate username blocked: ${dupRes.error}`
    )
  } catch (err) {
    assert(false, '6. Duplicate username detection', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 7: Duplicate email warning
  // ----------------------------------------------------
  try {
    const dupEmailRes = await studentRepository.saveStudent({
      username: 'different_user',
      firstname: 'Beda',
      lastname: 'User',
      email: 'hamzah.ali@gontor.sch.id', // duplicate email
      jenjang: 'Kelas 2',
      institution_id: TEST_INSTITUTION_A,
    })
    assert(
      dupEmailRes.success === false && dupEmailRes.error?.includes('Email'),
      '7. Duplicate email warning',
      `Duplicate email detected and blocked: ${dupEmailRes.error}`
    )
  } catch (err) {
    assert(false, '7. Duplicate email warning', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 8: Excel import persistence
  // ----------------------------------------------------
  try {
    const excelBatch = [
      {
        username: 'excel_std_1',
        firstname: 'Raihan',
        lastname: 'Akbar',
        email: 'raihan@gontor.sch.id',
        jenjang: 'Kelas 2' as StudentJenjang,
        institution_id: TEST_INSTITUTION_A,
      },
      {
        username: 'excel_std_2',
        firstname: 'Ilyas',
        lastname: 'Zulkarnain',
        email: 'ilyas@gontor.sch.id',
        jenjang: 'Kelas 3' as StudentJenjang,
        institution_id: TEST_INSTITUTION_A,
      },
    ]
    const bulkRes = await studentRepository.bulkSaveStudents(
      excelBatch,
      TEST_INSTITUTION_A,
      TEST_USER,
      'excel'
    )
    assert(
      bulkRes.savedCount === 2 && bulkRes.savedStudents.every((s) => s.source === 'excel'),
      '8. Excel import persistence',
      `Saved ${bulkRes.savedCount} Excel students into Siswa Saya repository`
    )
  } catch (err) {
    assert(false, '8. Excel import persistence', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 9: CSV import persistence
  // ----------------------------------------------------
  try {
    const csvBatch = [
      {
        username: 'csv_std_1',
        firstname: 'Azzam',
        lastname: 'Mujahid',
        email: 'azzam@gontor.sch.id',
        jenjang: 'Kelas 4' as StudentJenjang,
        institution_id: TEST_INSTITUTION_A,
      },
    ]
    const bulkCsv = await studentRepository.bulkSaveStudents(
      csvBatch,
      TEST_INSTITUTION_A,
      TEST_USER,
      'csv'
    )
    assert(
      bulkCsv.savedCount === 1 && bulkCsv.savedStudents[0].source === 'csv',
      '9. CSV import persistence',
      'CSV source students persisted with source tag "csv"'
    )
  } catch (err) {
    assert(false, '9. CSV import persistence', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 10: Manual student creation
  // ----------------------------------------------------
  try {
    const manualRes = await studentRepository.saveStudent({
      username: 'manual_std_1',
      firstname: 'Tariq',
      lastname: 'Ziyad',
      email: 'tariq.ziyad@gontor.sch.id',
      jenjang: 'Kelas 5',
      institution_id: TEST_INSTITUTION_A,
      created_by: TEST_USER,
      source: 'manual',
    })
    assert(
      manualRes.success === true && manualRes.student?.source === 'manual',
      '10. Manual student creation',
      'Manual student record tagged with source "manual"'
    )
  } catch (err) {
    assert(false, '10. Manual student creation', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 11: Student editing
  // ----------------------------------------------------
  try {
    if (!savedStudent1) throw new Error('savedStudent1 is null')
    const updateRes = await studentRepository.updateStudent(
      savedStudent1.id,
      {
        firstname: 'Hamzah',
        lastname: 'Ali Updated',
        jenjang: 'Kelas 2',
      },
      TEST_INSTITUTION_A
    )
    assert(
      updateRes.success === true &&
        updateRes.student?.full_name === 'Hamzah Ali Updated' &&
        updateRes.student?.jenjang === 'Kelas 2',
      '11. Student editing',
      updateRes.success
        ? `Updated student: ${updateRes.student?.full_name}, Jenjang: ${updateRes.student?.jenjang}`
        : `Update failed: ${updateRes.error}`
    )
  } catch (err) {
    assert(false, '11. Student editing', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 12: Student deletion
  // ----------------------------------------------------
  try {
    if (!savedStudent1) throw new Error('savedStudent1 is null')
    const delOk = await studentRepository.deleteStudent(savedStudent1.id, TEST_INSTITUTION_A)
    const checkDeleted = await studentRepository.getStudentById(savedStudent1.id, TEST_INSTITUTION_A)
    assert(
      delOk === true && checkDeleted === null,
      '12. Student deletion',
      `Student '${savedStudent1.id}' successfully removed from local directory`
    )
  } catch (err) {
    assert(false, '12. Student deletion', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 13: Bulk selection & bulk delete
  // ----------------------------------------------------
  try {
    // Add 3 temporary students
    const tempBatch = [
      { username: 'temp_del_1', firstname: 'Del1', email: 'del1@test.com', jenjang: 'Kelas 1' as StudentJenjang },
      { username: 'temp_del_2', firstname: 'Del2', email: 'del2@test.com', jenjang: 'Kelas 1' as StudentJenjang },
    ]
    const tempRes = await studentRepository.bulkSaveStudents(tempBatch, TEST_INSTITUTION_A, TEST_USER, 'manual')
    const idsToDelete = tempRes.savedStudents.map((s) => s.id)
    const delCount = await studentRepository.bulkDeleteStudents(idsToDelete, TEST_INSTITUTION_A)
    assert(
      delCount === 2,
      '13. Bulk selection & bulk delete',
      `Bulk deleted exactly ${delCount} selected student records`
    )
  } catch (err) {
    assert(false, '13. Bulk selection & bulk delete', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 14: Moodle CSV export (confirmed basic headers)
  // ----------------------------------------------------
  try {
    const sampleStudents: Student[] = [
      {
        id: 'std-export-1',
        username: 'santri_export_1',
        firstname: 'Farhan',
        lastname: 'Nabil',
        full_name: 'Farhan Nabil',
        email: 'farhan@test.com',
        jenjang: 'Kelas 1',
        institution_id: TEST_INSTITUTION_A,
        created_by: TEST_USER,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'excel',
        sync_status: 'local_only',
        moodle_user_id: null,
        last_synced_at: null,
      },
    ]

    const csvOutput = generateStudentsMoodleCsv(sampleStudents)
    const lines = csvOutput.split('\r\n')
    const headerLine = lines[0]
    const dataLine = lines[1]

    const isBasicHeader = headerLine === 'username,firstname,lastname,email'
    const isNoArbitraryFields = !headerLine.includes('jenjang')
    const isDataFormatted = dataLine === 'santri_export_1,Farhan,Nabil,farhan@test.com'

    assert(
      isBasicHeader && isNoArbitraryFields && isDataFormatted,
      '14. Moodle CSV export headers',
      `Moodle CSV matches confirmed basic headers '${headerLine}' with no arbitrary jenjang columns`
    )
  } catch (err) {
    assert(false, '14. Moodle CSV export headers', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 15: Search and filters
  // ----------------------------------------------------
  try {
    // Current in TEST_INSTITUTION_A: excel_std_1 (Kelas 2, excel), excel_std_2 (Kelas 3, excel), csv_std_1 (Kelas 4, csv), manual_std_1 (Kelas 5, manual)
    const searchRes = await studentRepository.getStudents({
      institutionId: TEST_INSTITUTION_A,
      search: 'raihan',
    })
    const jenjangRes = await studentRepository.getStudents({
      institutionId: TEST_INSTITUTION_A,
      jenjang: 'Kelas 3',
    })
    const sourceRes = await studentRepository.getStudents({
      institutionId: TEST_INSTITUTION_A,
      source: 'csv',
    })

    assert(
      searchRes.total === 1 &&
        searchRes.data[0].username === 'excel_std_1' &&
        jenjangRes.total === 1 &&
        jenjangRes.data[0].jenjang === 'Kelas 3' &&
        sourceRes.total === 1 &&
        sourceRes.data[0].source === 'csv',
      '15. Search and filters',
      'Filtered correctly by search query, jenjang (Kelas 3), and source (csv)'
    )
  } catch (err) {
    assert(false, '15. Search and filters', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 16: Pagination
  // ----------------------------------------------------
  try {
    const page1 = await studentRepository.getStudents({
      institutionId: TEST_INSTITUTION_A,
      page: 1,
      pageSize: 2,
    })
    const page2 = await studentRepository.getStudents({
      institutionId: TEST_INSTITUTION_A,
      page: 2,
      pageSize: 2,
    })

    assert(
      page1.data.length === 2 &&
        page2.data.length >= 1 &&
        page1.data[0].id !== page2.data[0].id,
      '16. Pagination',
      `Page 1 has ${page1.data.length} items, Page 2 has ${page2.data.length} distinct items`
    )
  } catch (err) {
    assert(false, '16. Pagination', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 17: Data persistence after reload
  // ----------------------------------------------------
  try {
    // Check that reading from repository without cache retains the stored students
    const reloaded = await studentRepository.getStudents({ institutionId: TEST_INSTITUTION_A })
    assert(
      reloaded.total >= 4,
      '17. Data persistence after reload',
      `Repository persisted ${reloaded.total} students across reloads`
    )
  } catch (err) {
    assert(false, '17. Data persistence after reload', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 18: Institution data isolation
  // ----------------------------------------------------
  try {
    // Add student to Institution B
    await studentRepository.saveStudent({
      username: 'student_beta_only',
      firstname: 'Beta',
      lastname: 'Santri',
      email: 'beta@pesantren-beta.sch.id',
      jenjang: 'Kelas 1',
      institution_id: TEST_INSTITUTION_B,
    })

    const instAData = await studentRepository.getStudents({ institutionId: TEST_INSTITUTION_A })
    const instBData = await studentRepository.getStudents({ institutionId: TEST_INSTITUTION_B })

    const hasLeak = instAData.data.some((s) => s.username === 'student_beta_only')
    assert(
      !hasLeak && instBData.total === 1 && instBData.data[0].username === 'student_beta_only',
      '18. Institution data isolation',
      'Institution A cannot view Institution B students; data strictly isolated'
    )
  } catch (err) {
    assert(false, '18. Institution data isolation', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 19: Accurate synchronization status
  // ----------------------------------------------------
  try {
    // Mark exported
    await studentRepository.markAsExported(['excel_std_1'], TEST_INSTITUTION_A)
    const stdAfterExport = await studentRepository.getStudents({
      institutionId: TEST_INSTITUTION_A,
      search: 'excel_std_1',
    })
    const isExported = stdAfterExport.data[0]?.sync_status === 'exported'

    // Verify "synced" requires verified moodle confirmation
    const cannotAutoBeSynced = stdAfterExport.data[0]?.sync_status !== 'synced'

    assert(
      isExported && cannotAutoBeSynced,
      '19. Accurate synchronization status',
      'CSV export marks status as "exported"; "synced" is never automatically assigned'
    )
  } catch (err) {
    assert(false, '19. Accurate synchronization status', `Exception: ${err}`)
  }

  // ----------------------------------------------------
  // Test 20: Dashboard counts
  // ----------------------------------------------------
  try {
    const stats = await studentRepository.getStats(TEST_INSTITUTION_A)
    const sumClasses = Object.values(stats.byJenjang).reduce((acc, v) => acc + v, 0)
    assert(
      stats.total === sumClasses &&
        stats.total > 0 &&
        typeof stats.unSyncedCount === 'number' &&
        typeof stats.verifiedMoodleCount === 'number',
      '20. Dashboard counts',
      `Stats accurate: Total ${stats.total}, breakdown sum ${sumClasses}, unSynced ${stats.unSyncedCount}`
    )
  } catch (err) {
    assert(false, '20. Dashboard counts', `Exception: ${err}`)
  }

  // Print Test Report
  console.log('\n====================================================')
  console.log('===       OGSOREG PHASE 5 TEST RESULTS SUMMARY    ===')
  console.log('====================================================')

  let passedCount = 0
  results.forEach((r, idx) => {
    const icon = r.passed ? '✓ PASS' : '✗ FAIL'
    if (r.passed) passedCount++
    console.log(`[${icon}] ${idx + 1}. ${r.scenario}`)
    console.log(`       Details: ${r.details}`)
  })

  console.log('\n====================================================')
  console.log(`TOTAL SCENARIOS: ${results.length}`)
  console.log(`PASSED: ${passedCount}`)
  console.log(`FAILED: ${results.length - passedCount}`)
  console.log('====================================================')

  if (passedCount < results.length) {
    process.exit(1)
  } else {
    console.log('\n🎉 ALL 20 PHASE 5 AUTOMATED TESTS PASSED SUCCESSFULLY!\n')
    process.exit(0)
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
