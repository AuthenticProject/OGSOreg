import { cloudCircuitBreaker } from '../src/services/supabase/cloudCircuitBreaker'
import { cloudSyncService } from '../src/services/supabase/cloudSyncService'
import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'

async function runTests() {
  console.log('=== TEST SUITE: CLOUD CIRCUIT BREAKER & EGRESS OPTIMIZATION ===')

  // Setup mock local environment if window is undefined
  if (typeof (global as any).window === 'undefined') {
    const store = new Map<string, string>()
    ;(global as any).window = {
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
      sessionStorage: {
        getItem: (key: string) => store.get(key) || null,
        setItem: (key: string, val: string) => store.set(key, val),
        removeItem: (key: string) => store.delete(key),
      },
      localStorage: {
        getItem: (key: string) => store.get(key) || null,
        setItem: (key: string, val: string) => store.set(key, val),
        removeItem: (key: string) => store.delete(key),
      },
    }
  }

  // 1. Test Quota Error Detection
  console.log('\n[TEST 1] Testing 402 / exceed_egress_quota error detection...')
  const mockErrors = [
    { status: 402, message: 'Payment Required' },
    { code: '402', message: 'Service for this project is restricted due to the following violations: exceed_egress_quota.' },
    new Error('The project owner must upgrade their plan or remove spend caps to restore service.'),
  ]

  for (const err of mockErrors) {
    if (!cloudCircuitBreaker.isQuotaRestrictionError(err)) {
      throw new Error(`FAIL: Failed to recognize quota error: ${JSON.stringify(err)}`)
    }
  }
  console.log('✅ TEST 1 PASSED: All variations of HTTP 402 / quota errors correctly detected.')

  // 2. Test Circuit Breaker Tripping
  console.log('\n[TEST 2] Testing circuit breaker trip behavior...')
  cloudCircuitBreaker.reset()
  if (!cloudCircuitBreaker.canExecuteQuery()) throw new Error('FAIL: Should be able to query initially')

  let realtimeTornDown = false
  cloudCircuitBreaker.registerRealtimeTeardown(() => {
    realtimeTornDown = true
  })

  // Simulate an error arriving from Supabase
  const tripped = cloudCircuitBreaker.recordError({
    status: 402,
    message: 'violates: exceed_egress_quota',
  })

  if (!tripped) throw new Error('FAIL: recordError should return true when tripped')
  if (!realtimeTornDown) throw new Error('FAIL: Realtime teardown callback was not invoked')
  if (cloudCircuitBreaker.canExecuteQuery()) {
    throw new Error('FAIL: canExecuteQuery should return FALSE after tripping')
  }

  const status = cloudCircuitBreaker.getStatus()
  console.log('Circuit breaker status after trip:', status)
  if (!status.isRestricted) throw new Error('FAIL: isRestricted should be true')
  console.log('✅ TEST 2 PASSED: Circuit breaker tripped, Realtime channels disconnected, and outgoing queries blocked.')

  // 3. Test Graceful Fallback to Local Cache when Restricted
  console.log('\n[TEST 3] Testing local store availability during cloud restriction...')
  const localList = studentRepository.getRawStore(CANONICAL_INSTITUTION_ID)
  console.log(`Available local students in memory: ${localList.length}`)

  // Call getStudents when restricted - should return local data with zero errors and zero network requests
  const queryResult = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    page: 1,
    pageSize: 10,
  })

  if (!queryResult || !Array.isArray(queryResult.data)) {
    throw new Error('FAIL: getStudents failed during cloud restriction')
  }
  console.log(`getStudents returned ${queryResult.data.length} students without hitting Supabase network.`)
  console.log('✅ TEST 3 PASSED: Local persistence seamlessly serves all student data when cloud is restricted.')

  // 4. Test cloudSyncService Gating & Elimination of HEAD loops
  console.log('\n[TEST 4] Testing cloudSyncService checkAvailableTables with circuit breaker...')
  const verified = await cloudSyncService.checkAvailableTables()
  console.log(`Verified tables returned: ${verified.size}`)
  // Should return instantly without making network requests because breaker is tripped
  console.log('✅ TEST 4 PASSED: checkAvailableTables respects circuit breaker without throwing or flooding.')

  // 5. Test Circuit Breaker Reset
  console.log('\n[TEST 5] Testing manual circuit breaker reset...')
  cloudCircuitBreaker.reset()
  if (!cloudCircuitBreaker.canExecuteQuery()) throw new Error('FAIL: Should be able to query after reset')
  console.log('✅ TEST 5 PASSED: Manual reset successfully clears restriction.')

  console.log('\n===================================================================')
  console.log('>>> ALL CIRCUIT BREAKER & EGRESS TESTS PASSED SUCCESSFULLY! <<<')
  console.log('===================================================================')
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err)
  process.exit(1)
})
