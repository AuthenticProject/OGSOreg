import { competitionResultService } from '../src/services/competitionResultService'
import { participantPeriodService } from '../src/services/participantPeriodService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'

async function runTests() {
  console.log('=== STARTING TEST: EDITORIAL RESULTS SHOWCASE ===')

  // Setup mock local environment if window is undefined
  if (typeof (global as any).window === 'undefined') {
    const store = new Map<string, string>()
    ;(global as any).window = {
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }
    ;(global as any).localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    }
  }

  // 1. Create a test student and save into repository
  const testStudent = {
    firstname: 'Ahmad Faiz',
    lastname: 'Al-Faruqi',
    username: 'santri_faiz_secret_nisn',
    email: 'faiz.secret@pondok.id',
    jenjang: 'Jenjang 5',
    kelas: '5-B',
    kampus: 'Gontor 1',
    custom_fields: {
      bidang: 'IPA Shigor',
    },
  }

  const saveRes = await studentRepository.saveStudent(testStudent as any, CANONICAL_INSTITUTION_ID)
  if (!saveRes.success || !saveRes.student) throw new Error(`FAIL: saveStudent failed: ${saveRes.error}`)
  const savedStudent = saveRes.student

  // 2. Setup a test published period
  const testPeriod = participantPeriodService.savePeriod({
    id: 'period-ogso-test-pub',
    name: 'OGSO Test Published 2026',
    year: 2026,
    is_published: true,
    publish_finalists: true,
    publish_champions: true,
  })

  // 3. Assign Result: Champion (Juara 1 / Gold Medal)
  await competitionResultService.upsertResult({
    student_id: savedStudent.id,
    period_id: testPeriod.id,
    result_status: 'juara',
    is_finalist: true,
    is_champion: true,
    champion_rank: 1,
    award_category: 'Juara 1',
    result_notes: 'Prestasi istimewa nilai sempurna',
  })

  // 4. Test Public Sanitation & Zero PII Leakage
  console.log('[TEST 1] Fetching public results for published period...')
  const publicRes = await competitionResultService.getPublicResults(testPeriod.id)
  console.log('Public results meta:', {
    periodName: publicRes.periodName,
    isPublished: publicRes.isPublished,
    publishFinalists: publicRes.publishFinalists,
    publishChampions: publicRes.publishChampions,
    stats: publicRes.stats,
    finalistCount: publicRes.finalists.length,
    championCount: publicRes.champions.length,
  })

  if (!publicRes.isPublished) throw new Error('FAIL: Period should be published')
  if (publicRes.finalists.length === 0) throw new Error('FAIL: Finalists should not be empty')
  if (publicRes.champions.length === 0) throw new Error('FAIL: Champions should not be empty')

  const publicFinalist = publicRes.finalists.find((f) => f.student_name === savedStudent.full_name)
  if (!publicFinalist) throw new Error('FAIL: Student not found in finalists list')

  // Verify Zero PII Leakage
  const rawString = JSON.stringify(publicRes)
  if (rawString.includes('santri_faiz_secret_nisn')) {
    throw new Error('SECURITY VIOLATION: Username leaked in public results!')
  }
  if (rawString.includes('faiz.secret@pondok.id')) {
    throw new Error('SECURITY VIOLATION: Email leaked in public results!')
  }
  if (rawString.includes(savedStudent.id)) {
    throw new Error('SECURITY VIOLATION: Internal student database UUID leaked in public results!')
  }
  console.log('✅ TEST 1 PASSED: Strict PII sanitization verified (zero email/username/internal UUID leaks).')

  // 5. Test Gated Publication: Unpublished Period
  console.log('[TEST 2] Testing unpublished period gating...')
  participantPeriodService.savePeriod({
    id: testPeriod.id,
    name: testPeriod.name,
    year: 2026,
    is_published: false,
  })

  const unpubRes = await competitionResultService.getPublicResults(testPeriod.id)
  if (unpubRes.isPublished) throw new Error('FAIL: unpubRes.isPublished should be false')
  if (unpubRes.finalists.length !== 0) throw new Error('FAIL: finalists should be empty when unpublished')
  if (unpubRes.champions.length !== 0) throw new Error('FAIL: champions should be empty when unpublished')
  console.log('✅ TEST 2 PASSED: Server-side gating safely returns empty arrays for unpublished periods.')

  // 6. Test Selective Publication: Finalists ON, Champions OFF
  console.log('[TEST 3] Testing selective publication (Finalists ON, Champions OFF)...')
  participantPeriodService.savePeriod({
    id: testPeriod.id,
    name: testPeriod.name,
    year: 2026,
    is_published: true,
    publish_finalists: true,
    publish_champions: false,
  })

  const selectiveRes = await competitionResultService.getPublicResults(testPeriod.id)
  if (!selectiveRes.publishFinalists || selectiveRes.finalists.length === 0) {
    throw new Error('FAIL: Finalists should be published')
  }
  if (selectiveRes.publishChampions || selectiveRes.champions.length !== 0) {
    throw new Error('FAIL: Champions should be suppressed when publishChampions is false')
  }
  console.log('✅ TEST 3 PASSED: Selective publication toggling works accurately.')

  // 7. Test Period Isolation
  console.log('[TEST 4] Testing cross-period data isolation...')
  const period2025 = participantPeriodService.savePeriod({
    id: 'period-ogso-test-2025',
    name: 'OGSO Test 2025',
    year: 2025,
    is_published: true,
  })
  const res2025 = await competitionResultService.getPublicResults(period2025.id)
  const leak = res2025.finalists.find((f) => f.student_name === savedStudent.full_name)
  if (leak) {
    throw new Error('FAIL: 2026 student result leaked into 2025 period!')
  }
  console.log('✅ TEST 4 PASSED: Period results are strictly isolated with zero cross-period data contamination.')

  console.log('=== ALL EDITORIAL RESULTS SHOWCASE TESTS PASSED SUCCESSFULLY! ===')
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err)
  process.exit(1)
})
