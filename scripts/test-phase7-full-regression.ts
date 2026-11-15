import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'
import { competitionResultService } from '../src/services/competitionResultService'
import { resultExcelImportService } from '../src/services/resultExcelImportService'
import { resultExcelExportService } from '../src/services/resultExcelExportService'
import { participantPeriodService } from '../src/services/participantPeriodService'

async function runFullRegression() {
  console.log('===================================================================')
  console.log('OGSOREG FINALIST & CHAMPION MANAGEMENT SYSTEM — FULL REGRESSION TEST')
  console.log('===================================================================\n')

  const uniqueSuffix = Date.now().toString().slice(-5)
  const studentUsername1 = `santri_reg_${uniqueSuffix}_1`
  const studentUsername2 = `santri_reg_${uniqueSuffix}_2`
  const studentEmail1 = `${studentUsername1}@gontor.ac.id`
  const studentEmail2 = `${studentUsername2}@gontor.ac.id`

  // -----------------------------------------------------------------
  // 1. STUDENT REGISTRATION & TOMBSTONE REGRESSION TEST
  // -----------------------------------------------------------------
  console.log('--- TEST 1: Student Registration & Deletion Lifecycle ---')
  const reg1 = await studentRepository.saveStudent({
    username: studentUsername1,
    firstname: 'Zaid',
    lastname: 'Al-Khair',
    full_name: 'Zaid Al-Khair',
    email: studentEmail1,
    jenjang: 'Kelas 1',
    kelas: '1-B',
    kampus: 'Gontor 1',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')

  if (!reg1.success || !reg1.student?.id) {
    throw new Error('Test 1.1 Failed: Could not register student')
  }
  const studentId1 = reg1.student.id
  console.log('Registered student 1:', { id: studentId1, username: studentUsername1 })

  // Delete student 1
  const del1 = await studentRepository.deleteStudent(studentId1, CANONICAL_INSTITUTION_ID)
  if (!del1) {
    throw new Error('Test 1.2 Failed: Could not delete student')
  }
  console.log('Deleted student 1 successfully.')

  // Re-register student 1 with corrected info (verifying deletion fix!)
  const reReg1 = await studentRepository.saveStudent({
    username: studentUsername1,
    firstname: 'Zaid',
    lastname: 'Al-Khair',
    full_name: 'Zaid Al-Khair (Koreksi)',
    email: studentEmail1,
    jenjang: 'Kelas 2',
    kelas: '2-C',
    kampus: 'Gontor 1',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')

  if (!reReg1.success || !reReg1.student?.id) {
    throw new Error('Test 1.3 Failed: Could not re-register deleted student with same identity!')
  }
  const correctedStudentId1 = reReg1.student.id
  console.log('Re-registered student 1 successfully:', { id: correctedStudentId1, name: reReg1.student.full_name })

  // Register student 2 for multi-student tests
  const reg2 = await studentRepository.saveStudent({
    username: studentUsername2,
    firstname: 'Umar',
    lastname: 'Faruq',
    full_name: 'Umar Faruq',
    email: studentEmail2,
    jenjang: 'Kelas 3',
    kelas: '3-A',
    kampus: 'Gontor 2',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')
  const studentId2 = reg2.student!.id
  console.log('Registered student 2:', { id: studentId2, username: studentUsername2 })

  // Verify Active Duplicate Protection: Attempting to register already active student should fail
  const dupCheck = await studentRepository.saveStudent({
    username: studentUsername2,
    firstname: 'Duplicate',
    lastname: 'User',
    full_name: 'Duplicate User',
    email: 'other_email@gontor.ac.id',
    jenjang: 'Kelas 1',
    kelas: '1-A',
    kampus: 'Gontor 1',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')
  if (dupCheck.success) {
    throw new Error('Test 1.4 Failed: Duplicate protection failed to block active username!')
  }
  console.log('Duplicate protection active student check: PASSED (Correctly rejected).')

  // -----------------------------------------------------------------
  // 2. PERIOD-BASED COMPETITION RESULTS & DATA INTEGRITY
  // -----------------------------------------------------------------
  console.log('\n--- TEST 2: Period-Based Competition Results & Data Integrity ---')
  const period2025 = 'period-ogso-2025'
  const period2026 = 'period-ogso-2026'

  // Set student 1 as Finalis in OGSO 2025
  const res2025 = await competitionResultService.upsertResult({
    student_id: correctedStudentId1,
    period_id: period2025,
    result_status: 'finalis',
    result_notes: 'Finalis 2025',
  })
  console.log('Student 1 result in OGSO 2025:', {
    status: res2025.result_status,
    is_finalist: res2025.is_finalist,
    is_champion: res2025.is_champion,
  })

  // Set student 1 as Juara 1 (Gold) in OGSO 2026
  const res2026 = await competitionResultService.upsertResult({
    student_id: correctedStudentId1,
    period_id: period2026,
    result_status: 'juara',
    award_category: 'Gold Medal',
    result_notes: 'Juara 1 Sains 2026',
  })
  console.log('Student 1 result in OGSO 2026:', {
    status: res2026.result_status,
    is_finalist: res2026.is_finalist,
    is_champion: res2026.is_champion,
    rank: res2026.champion_rank,
    award: res2026.award_category,
  })

  // Verify Champion implies Finalist rule
  if (!res2026.is_champion || !res2026.is_finalist || res2026.champion_rank !== 1) {
    throw new Error('Test 2.1 Failed: Champion must automatically be finalist with rank 1')
  }

  // Verify PERIOD ISOLATION: 2025 result must remain untouched
  const check2025 = competitionResultService.getResult(correctedStudentId1, period2025)
  if (check2025?.result_status !== 'finalis' || check2025?.is_champion !== false) {
    throw new Error('Test 2.2 Failed: Period isolation broken! 2025 was overwritten.')
  }
  console.log('Period isolation between 2025 and 2026: VERIFIED.')

  // Set student 2 as Finalis in OGSO 2026
  await competitionResultService.upsertResult({
    student_id: studentId2,
    period_id: period2026,
    result_status: 'finalis',
    result_notes: 'Lolos Final 2026',
  })

  // -----------------------------------------------------------------
  // 3. EXCEL IMPORT & MATCHING CLASSIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- TEST 3: Excel Result Import Matching Engine ---')
  const importRows = [
    {
      'Nama Santri': 'Zaid Al-Khair (Koreksi)',
      Username: studentUsername1,
      Kampus: 'Gontor 1',
      'Status Hasil': 'Juara',
      'Kategori Juara': 'Juara 1',
      Peringkat: '1',
      Keterangan: 'Hasil Terverifikasi',
    },
    {
      'Nama Santri': 'Santri Tidak Ditemukan',
      Username: 'unknown_nisn_0099',
      Kampus: 'Gontor 1',
      'Status Hasil': 'Peserta',
    },
  ]

  const analysis = resultExcelImportService.matchAndAnalyzeRows(importRows, period2026)
  console.log('Import analysis summary:', {
    matched: analysis.matchedCount,
    notFound: analysis.notFoundCount,
    ambiguous: analysis.ambiguousCount,
  })
  if (analysis.matchedCount !== 1 || analysis.notFoundCount !== 1) {
    throw new Error('Test 3.1 Failed: Import matching count incorrect')
  }

  // -----------------------------------------------------------------
  // 4. THREE-SHEET EXCEL EXPORT VALIDATION
  // -----------------------------------------------------------------
  console.log('\n--- TEST 4: Three-Sheet Excel Export Validation ---')
  const { workbook, filename } = await resultExcelExportService.buildWorkbook({
    periodId: period2026,
    periodName: 'OGSO 2026',
  })

  console.log('Export filename:', filename)
  const sheets = workbook.worksheets
  console.log('Worksheet count:', sheets.length)
  console.log('Worksheet names:', sheets.map((s) => s.name))

  if (sheets.length !== 3) {
    throw new Error(`Test 4.1 Failed: Expected 3 sheets, got ${sheets.length}`)
  }
  const sSemua = workbook.getWorksheet('SEMUA PESERTA')
  const sFinal = workbook.getWorksheet('LOLOS FINAL')
  const sJuara = workbook.getWorksheet('JUARA')

  if (!sSemua || !sFinal || !sJuara) {
    throw new Error('Test 4.2 Failed: Worksheets missing required names')
  }

  console.log('Sheet Semua Peserta rowCount:', sSemua.rowCount)
  console.log('Sheet Lolos Final rowCount:', sFinal.rowCount)
  console.log('Sheet Juara rowCount:', sJuara.rowCount)

  // -----------------------------------------------------------------
  // 5. CAMPUS ISOLATION & ACCESS CONTROL VALIDATION
  // -----------------------------------------------------------------
  console.log('\n--- TEST 5: Campus Isolation & Access Control Validation ---')
  // Campus admin for Gontor 1 should only see students from Gontor 1
  const gontor1View = await competitionResultService.getStudentsWithResults(
    period2026,
    { period_id: period2026 },
    'Gontor 1' // Campus Admin restriction
  )
  console.log('Gontor 1 Admin visible students count:', gontor1View.students.length)
  const hasGontor2 = gontor1View.students.some((s) => s.student.kampus === 'Gontor 2')
  if (hasGontor2) {
    throw new Error('Test 5.1 Failed: Campus Admin was able to see students from another campus!')
  }
  console.log('Campus isolation verified: Campus Admin restricted strictly to their assigned campus.')

  console.log('\n===================================================================')
  console.log('>>> ALL REGRESSION AND FEATURE TESTS PASSED WITH 100% SUCCESS! <<<')
  console.log('===================================================================')
}

runFullRegression().catch((err) => {
  console.error('Regression error:', err)
  process.exit(1)
})
