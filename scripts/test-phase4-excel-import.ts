import { resultExcelImportService } from '../src/services/resultExcelImportService'
import { competitionResultService } from '../src/services/competitionResultService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'

async function runTest() {
  console.log('=== TEST PHASE 4: EXCEL RESULT IMPORT & MATCHING ENGINE ===\n')

  const periodId = 'period-ogso-2026'

  // Pre-seed mock students in repository
  studentRepository.setRawStore(CANONICAL_INSTITUTION_ID, [
    {
      id: 'std-imp-001',
      username: 'ahmad_fauzan',
      firstname: 'Ahmad',
      lastname: 'Fauzan',
      full_name: 'Ahmad Fauzan',
      email: 'ahmad_fauzan@gontor.ac.id',
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
      custom_fields: {},
    },
    {
      id: 'std-imp-002',
      username: 'budi_santoso',
      firstname: 'Budi',
      lastname: 'Santoso',
      full_name: 'Budi Santoso',
      email: 'budi_santoso@gontor.ac.id',
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
      custom_fields: {},
    },
    {
      id: 'std-imp-003',
      username: 'budi_santoso_g3',
      firstname: 'Budi',
      lastname: 'Santoso',
      full_name: 'Budi Santoso',
      email: 'budi_santoso_g3@gontor.ac.id',
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
      custom_fields: {},
    },
  ])

  // Mock spreadsheet rows to test all 5 matching / analysis conditions:
  // Row 1: Exact Username match -> MATCHED
  // Row 2: Name + Campus match -> MATCHED
  // Row 3: Name only, multiple students (Budi Santoso) -> AMBIGUOUS
  // Row 4: Non-existent student -> NOT_FOUND
  // Row 5: Duplicate of Row 1 in spreadsheet
  const mockRows = [
    {
      'Nama Santri': 'Ahmad Fauzan',
      Username: 'ahmad_fauzan',
      Kampus: 'Gontor 1',
      'Status Hasil': 'Juara',
      'Kategori Juara': 'Juara 1',
      Peringkat: '1',
      Keterangan: 'Nilai sempurna',
    },
    {
      'Nama Santri': 'Budi Santoso',
      Username: '',
      Kampus: 'Gontor 2',
      'Status Hasil': 'Lolos Final',
      'Kategori Juara': '',
      Peringkat: '',
      Keterangan: 'Lolos',
    },
    {
      'Nama Santri': 'Budi Santoso',
      Username: '',
      Kampus: '', // Ambiguous between Gontor 2 and Gontor 3!
      'Status Hasil': 'Lolos Final',
    },
    {
      'Nama Santri': 'Santri Tidak Dikenal',
      Username: 'unknown_user_999',
      Kampus: 'Gontor 1',
      'Status Hasil': 'Peserta',
    },
    {
      'Nama Santri': 'Ahmad Fauzan',
      Username: 'ahmad_fauzan',
      Kampus: 'Gontor 1',
      'Status Hasil': 'Juara 2',
    },
  ]

  console.log('Running matchAndAnalyzeRows...')
  const analysis = resultExcelImportService.matchAndAnalyzeRows(mockRows, periodId)

  console.log('Analysis result:', {
    totalRows: analysis.totalRows,
    matchedCount: analysis.matchedCount,
    ambiguousCount: analysis.ambiguousCount,
    notFoundCount: analysis.notFoundCount,
    duplicateRowsCount: analysis.duplicateRowsCount,
  })

  if (analysis.matchedCount !== 3) {
    throw new Error(`Expected 3 matched rows (Rows 1, 2, and 5), got ${analysis.matchedCount}`)
  }
  if (analysis.ambiguousCount !== 1) {
    throw new Error(`Expected 1 ambiguous row (Row 3), got ${analysis.ambiguousCount}`)
  }
  if (analysis.notFoundCount !== 1) {
    throw new Error(`Expected 1 not found row (Row 4), got ${analysis.notFoundCount}`)
  }
  if (analysis.duplicateRowsCount !== 1) {
    throw new Error(`Expected 1 duplicate row (Row 5), got ${analysis.duplicateRowsCount}`)
  }

  // TEST COMMIT: Commit the matched rows
  console.log('\nTesting atomic commit of matched results...')
  const matchedItems = analysis.items.filter((item) => item.matchStatus === 'MATCHED' && !item.isDuplicateInSpreadsheet)
  const commitRes = await resultExcelImportService.commitImport(periodId, matchedItems, 'superadmin')
  console.log('Commit result:', commitRes)
  if (commitRes.successCount !== 2) {
    throw new Error(`Expected 2 successfully committed rows, got ${commitRes.successCount}`)
  }

  // Verify saved results in competitionResultService
  const f1 = competitionResultService.getResult('std-imp-001', periodId)
  const f2 = competitionResultService.getResult('std-imp-002', periodId)

  console.log('Saved result 1:', {
    student_id: f1?.student_id,
    status: f1?.result_status,
    is_champion: f1?.is_champion,
    is_finalist: f1?.is_finalist,
    rank: f1?.champion_rank,
    award: f1?.award_category,
  })
  console.log('Saved result 2:', {
    student_id: f2?.student_id,
    status: f2?.result_status,
    is_champion: f2?.is_champion,
    is_finalist: f2?.is_finalist,
  })

  if (!f1 || f1.result_status !== 'juara' || !f1.is_finalist || f1.champion_rank !== 1) {
    throw new Error('Test Phase 4 Failed: Student 1 result incorrect')
  }
  if (!f2 || f2.result_status !== 'finalis' || !f2.is_finalist || f2.is_champion) {
    throw new Error('Test Phase 4 Failed: Student 2 result incorrect')
  }

  console.log('\n>>> ALL PHASE 4 TESTS PASSED SUCCESSFULLY! <<<')
}

runTest().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
