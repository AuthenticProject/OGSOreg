import { competitionResultService } from '../src/services/competitionResultService'
import { participantPeriodService } from '../src/services/participantPeriodService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'

async function runTest() {
  console.log('=== TEST PHASE 2: COMPETITION RESULT DATA MODEL ===\n')

  const studentId1 = 'std-test-result-001'
  const studentId2 = 'std-test-result-002'
  const period2025 = 'period-ogso-2025'
  const period2026 = 'period-ogso-2026'

  // Pre-seed mock students in repository
  studentRepository.setRawStore(CANONICAL_INSTITUTION_ID, [
    {
      id: studentId1,
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
      custom_fields: { daerah: 'Jawa Timur' },
    },
    {
      id: studentId2,
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
      custom_fields: { daerah: 'Jawa Tengah' },
    },
  ])

  // TEST 1: Mark student 1 as Finalist in 2025
  console.log('Test 1: Mark student 1 as Finalist in 2025...')
  const res1 = await competitionResultService.upsertResult({
    student_id: studentId1,
    period_id: period2025,
    result_status: 'finalis',
    result_notes: 'Lolos babak penyisihan regional',
  })
  console.log('Result 1:', {
    id: res1.id,
    period: res1.period_id,
    status: res1.result_status,
    is_finalist: res1.is_finalist,
    is_champion: res1.is_champion,
  })
  if (!res1.is_finalist || res1.is_champion || res1.result_status !== 'finalis') {
    throw new Error('Test 1 Failed: Finalist integrity violated')
  }

  // TEST 2: Mark student 1 as Champion (Juara 1) in 2026
  console.log('\nTest 2: Mark student 1 as Juara 1 in 2026...')
  const res2 = await competitionResultService.upsertResult({
    student_id: studentId1,
    period_id: period2026,
    result_status: 'juara',
    award_category: 'Juara 1',
    result_notes: 'Nilai tertinggi babak final',
  })
  console.log('Result 2:', {
    id: res2.id,
    period: res2.period_id,
    status: res2.result_status,
    is_finalist: res2.is_finalist,
    is_champion: res2.is_champion,
    rank: res2.champion_rank,
    award: res2.award_category,
  })
  if (!res2.is_finalist || !res2.is_champion || res2.champion_rank !== 1) {
    throw new Error('Test 2 Failed: Champion must automatically be finalist with rank 1')
  }

  // TEST 3: Period Isolation — verify student 1 in 2025 is STILL finalist and NOT overwritten by 2026 result
  console.log('\nTest 3: Verify Period Isolation for student 1...')
  const check2025 = competitionResultService.getResult(studentId1, period2025)
  const check2026 = competitionResultService.getResult(studentId1, period2026)
  console.log('2025 Result status:', check2025?.result_status, 'is_champion:', check2025?.is_champion)
  console.log('2026 Result status:', check2026?.result_status, 'is_champion:', check2026?.is_champion)
  if (check2025?.result_status !== 'finalis' || check2025?.is_champion !== false) {
    throw new Error('Test 3 Failed: Period isolation broken! 2025 result was affected by 2026.')
  }
  if (check2026?.result_status !== 'juara' || check2026?.is_champion !== true) {
    throw new Error('Test 3 Failed: 2026 result corrupted.')
  }

  // TEST 4: Uniqueness within the same period (student_id + period_id)
  console.log('\nTest 4: Upserting same student in 2026 updates existing record, no duplicates...')
  const allResults2026_before = competitionResultService.getResultsByPeriod(period2026)
  await competitionResultService.upsertResult({
    student_id: studentId1,
    period_id: period2026,
    result_status: 'juara',
    award_category: 'Juara 2',
    result_notes: 'Koreksi dewan juri',
  })
  const allResults2026_after = competitionResultService.getResultsByPeriod(period2026)
  console.log('Count before:', allResults2026_before.length, 'Count after:', allResults2026_after.length)
  if (allResults2026_before.length !== allResults2026_after.length) {
    throw new Error('Test 4 Failed: Duplicate result created in same period!')
  }
  const updated2026 = competitionResultService.getResult(studentId1, period2026)
  if (updated2026?.award_category !== 'Juara 2' || updated2026?.champion_rank !== 2) {
    throw new Error('Test 4 Failed: Record was not updated properly.')
  }

  // TEST 5: Downgrade from Champion to Peserta ensures finalist status is reset consistently
  console.log('\nTest 5: Downgrade to Peserta...')
  const downgraded = await competitionResultService.upsertResult({
    student_id: studentId1,
    period_id: period2026,
    result_status: 'peserta',
  })
  console.log('Downgraded:', {
    status: downgraded.result_status,
    is_finalist: downgraded.is_finalist,
    is_champion: downgraded.is_champion,
    rank: downgraded.champion_rank,
  })
  if (downgraded.is_finalist !== false || downgraded.is_champion !== false || downgraded.champion_rank !== null) {
    throw new Error('Test 5 Failed: Downgrading to peserta did not reset finalist/champion state consistently.')
  }

  // TEST 6: Test getStudentsWithResults & Stats Calculation
  console.log('\nTest 6: Test joined queries and period stats...')
  // Set student 1 as juara, student 2 as finalis in 2026
  await competitionResultService.upsertResult({
    student_id: studentId1,
    period_id: period2026,
    result_status: 'juara',
    award_category: 'Gold Medal',
  })
  await competitionResultService.upsertResult({
    student_id: studentId2,
    period_id: period2026,
    result_status: 'finalis',
  })

  const { students: joined, stats } = await competitionResultService.getStudentsWithResults(period2026)
  console.log('Joined students count:', joined.length)
  console.log('Stats:', stats)
  if (stats.totalParticipants !== 2 || stats.totalFinalists !== 2 || stats.totalChampions !== 1) {
    throw new Error(`Test 6 Failed: Stats mismatch. Expected 2 participants, 2 finalists, 1 champion. Got: ${JSON.stringify(stats)}`)
  }

  console.log('\n>>> ALL PHASE 2 TESTS PASSED SUCCESSFULLY! <<<')
}

runTest().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
