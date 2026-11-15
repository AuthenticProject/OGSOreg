import { resultExcelExportService } from '../src/services/resultExcelExportService'
import { competitionResultService } from '../src/services/competitionResultService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'

async function runTest() {
  console.log('=== TEST PHASE 6: THREE-SHEET EXCEL EXPORT ===\n')

  const periodId = 'period-ogso-2026'

  // Pre-seed 4 mock students
  studentRepository.setRawStore(CANONICAL_INSTITUTION_ID, [
    {
      id: 'std-exp-001',
      username: 'santri_gold',
      firstname: 'Ahmad',
      lastname: 'Fauzan',
      full_name: 'Ahmad Fauzan',
      email: 'gold@gontor.ac.id',
      jenjang: 'Jenjang 1',
      kelas: 'Kelas 1',
      kampus: 'Gontor 1',
      institution_id: CANONICAL_INSTITUTION_ID,
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'manual',
      sync_status: 'synced',
      moodle_user_id: null,
      last_synced_at: null,
      custom_fields: { daerah: 'Jawa Timur' },
    },
    {
      id: 'std-exp-002',
      username: 'santri_silver',
      firstname: 'Budi',
      lastname: 'Santoso',
      full_name: 'Budi Santoso',
      email: 'silver@gontor.ac.id',
      jenjang: 'Jenjang 2',
      kelas: 'Kelas 2',
      kampus: 'Gontor 2',
      institution_id: CANONICAL_INSTITUTION_ID,
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'manual',
      sync_status: 'synced',
      moodle_user_id: null,
      last_synced_at: null,
      custom_fields: { daerah: 'Jawa Barat' },
    },
    {
      id: 'std-exp-003',
      username: 'santri_finalis',
      firstname: 'Chaidir',
      lastname: 'Ali',
      full_name: 'Chaidir Ali',
      email: 'finalis@gontor.ac.id',
      jenjang: 'Jenjang 3',
      kelas: 'Kelas 3',
      kampus: 'Gontor 3',
      institution_id: CANONICAL_INSTITUTION_ID,
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'manual',
      sync_status: 'synced',
      moodle_user_id: null,
      last_synced_at: null,
      custom_fields: { daerah: 'DKI Jakarta' },
    },
    {
      id: 'std-exp-004',
      username: 'santri_peserta',
      firstname: 'Danish',
      lastname: 'Farhan',
      full_name: 'Danish Farhan',
      email: 'peserta@gontor.ac.id',
      jenjang: 'Jenjang 4',
      kelas: 'Kelas 4',
      kampus: 'Gontor 4',
      institution_id: CANONICAL_INSTITUTION_ID,
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'manual',
      sync_status: 'synced',
      moodle_user_id: null,
      last_synced_at: null,
      custom_fields: { daerah: 'Sumatera' },
    },
  ])

  // Setup results:
  // std-exp-001: Juara 1 (Champion)
  // std-exp-002: Juara 2 (Champion)
  // std-exp-003: Finalis (Non-champion finalist)
  // std-exp-004: Peserta (No result / default)
  await competitionResultService.upsertResult({
    student_id: 'std-exp-001',
    period_id: periodId,
    result_status: 'juara',
    award_category: 'Juara 1',
    champion_rank: 1,
    result_notes: 'Juara 1 Sains',
  })
  await competitionResultService.upsertResult({
    student_id: 'std-exp-002',
    period_id: periodId,
    result_status: 'juara',
    award_category: 'Juara 2',
    champion_rank: 2,
    result_notes: 'Juara 2 Sains',
  })
  await competitionResultService.upsertResult({
    student_id: 'std-exp-003',
    period_id: periodId,
    result_status: 'finalis',
    result_notes: 'Lolos Final',
  })

  // Build workbook
  const { workbook, filename } = await resultExcelExportService.buildWorkbook({
    periodId,
    periodName: 'OGSO 2026',
  })

  console.log('Generated filename:', filename)
  if (!filename.includes('OGSO_2026')) {
    throw new Error(`Filename does not include period name: ${filename}`)
  }

  // Verify Worksheets count & names
  const worksheets = workbook.worksheets
  console.log('Worksheet count:', worksheets.length)
  console.log('Worksheet names:', worksheets.map((w) => w.name))

  if (worksheets.length !== 3) {
    throw new Error(`Expected exactly 3 worksheets, got ${worksheets.length}`)
  }

  const sheet1 = workbook.getWorksheet('SEMUA PESERTA')
  const sheet2 = workbook.getWorksheet('LOLOS FINAL')
  const sheet3 = workbook.getWorksheet('JUARA')

  if (!sheet1 || !sheet2 || !sheet3) {
    throw new Error('Worksheets missing expected names')
  }

  // Row counts: exceljs rowCount includes 1 header row
  // Sheet 1 (Semua Peserta): 4 students + 1 header = 5
  // Sheet 2 (Lolos Final): 2 champions + 1 finalist = 3 finalists + 1 header = 4
  // Sheet 3 (Juara): 2 champions + 1 header = 3
  console.log('Sheet 1 rowCount:', sheet1.rowCount)
  console.log('Sheet 2 rowCount:', sheet2.rowCount)
  console.log('Sheet 3 rowCount:', sheet3.rowCount)

  if (sheet1.rowCount !== 5) {
    throw new Error(`Sheet 1 expected 5 rows, got ${sheet1.rowCount}`)
  }
  if (sheet2.rowCount !== 4) {
    throw new Error(`Sheet 2 expected 4 rows, got ${sheet2.rowCount}`)
  }
  if (sheet3.rowCount !== 3) {
    throw new Error(`Sheet 3 expected 3 rows, got ${sheet3.rowCount}`)
  }

  // Verify Sheet 3 sorting: Row 2 should be Juara 1, Row 3 should be Juara 2
  const r2Rank = sheet3.getRow(2).getCell(7).value // rank column
  const r3Rank = sheet3.getRow(3).getCell(7).value
  console.log('Sheet 3 rankings:', r2Rank, r3Rank)
  if (r2Rank !== 1 || r3Rank !== 2) {
    throw new Error('Sheet 3 is not sorted correctly by champion rank')
  }

  console.log('\n>>> ALL PHASE 6 TESTS PASSED SUCCESSFULLY! <<<')
}

runTest().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
