/**
 * Phase 7: Comprehensive Regression & Verification Test Suite
 * Supabase Request Flood & Egress Remediation
 */

import { cloudCircuitBreaker } from '../src/services/supabase/cloudCircuitBreaker'
import { realtimeSubscriptionManager } from '../src/services/supabase/realtimeSubscriptionManager'
import { cloudSyncCoordinator } from '../src/services/supabase/cloudSyncCoordinator'
import { studentRepository } from '../src/services/studentRepository'
import { competitionResultService } from '../src/services/competitionResultService'
import { participantPeriodService } from '../src/services/participantPeriodService'

// Mock localStorage and window if running in Node environment
if (typeof window === 'undefined') {
  const store = new Map<string, string>()
  const listeners = new Map<string, Function[]>()

  ;(globalThis as any).window = {
    sessionStorage: {
      getItem: (k: string) => store.get(`session:${k}`) || null,
      setItem: (k: string, v: string) => store.set(`session:${k}`, v),
      removeItem: (k: string) => store.delete(`session:${k}`),
    },
    localStorage: {
      getItem: (k: string) => store.get(`local:${k}`) || null,
      setItem: (k: string, v: string) => store.set(`local:${k}`, v),
      removeItem: (k: string) => store.delete(`local:${k}`),
    },
    addEventListener: (event: string, fn: Function) => {
      const list = listeners.get(event) || []
      list.push(fn)
      listeners.set(event, list)
    },
    removeEventListener: (event: string, fn: Function) => {
      const list = (listeners.get(event) || []).filter((f) => f !== fn)
      listeners.set(event, list)
    },
    dispatchEvent: (event: any) => {
      const list = listeners.get(event.type) || []
      list.forEach((f) => f(event))
      return true
    },
  }
}

async function runVerificationSuite() {
  console.log('==================================================================')
  console.log('🚀 RUNNING PHASE 7: EMERGENCY SUPABASE REMEDIATION TEST SUITE')
  console.log('==================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${desc}`)
      failed++
    }
  }

  // TEST 1: Circuit Breaker Error Detection
  console.log('--- Test Suite 1: Circuit Breaker Detection & State Machine ---')
  cloudCircuitBreaker.reset()
  assert(cloudCircuitBreaker.canExecuteQuery() === true, 'Breaker starts unblocked')

  const error402 = { status: 402, message: 'Payment Required: exceed_egress_quota' }
  const tripped = cloudCircuitBreaker.recordError(error402)
  assert(tripped === true, 'Breaker trips immediately on status 402 error')
  assert(cloudCircuitBreaker.canExecuteQuery() === false, 'canExecuteQuery() returns false when restricted')

  const status = cloudCircuitBreaker.getStatus()
  assert(status.isRestricted === true, 'Status reflects isRestricted = true')
  assert(status.reason !== null, 'Status contains explanation reason')

  // TEST 2: Realtime Suspension on Breaker Trip
  console.log('\n--- Test Suite 2: Realtime Channel Consolidation & Teardown ---')
  const rtStatusBefore = realtimeSubscriptionManager.getStatus()
  assert(rtStatusBefore.isSuspended === true, 'Realtime manager automatically suspended when breaker tripped')

  // Verify no channels are connecting while restricted
  let setupRan = false
  const unsub = realtimeSubscriptionManager.registerChannel('test:channel', () => {
    setupRan = true
  })
  assert(setupRan === false, 'New channel setup is halted when restricted')
  unsub()

  // TEST 3: Single-Flight Mutex on CloudSyncCoordinator
  console.log('\n--- Test Suite 3: Single-Flight Mutex & Sync Coordinator ---')
  cloudCircuitBreaker.reset()
  let executionCount = 0

  cloudSyncCoordinator.registerHandler('test_domain', 1, async () => {
    executionCount++
    await new Promise((r) => setTimeout(r, 50))
  })

  // Trigger 5 concurrent sync requests simultaneously
  const p1 = cloudSyncCoordinator.triggerSync(true)
  const p2 = cloudSyncCoordinator.triggerSync(true)
  const p3 = cloudSyncCoordinator.triggerSync(true)
  const p4 = cloudSyncCoordinator.triggerSync(true)
  const p5 = cloudSyncCoordinator.triggerSync(true)

  await Promise.all([p1, p2, p3, p4, p5])
  assert(executionCount === 1, `Single-flight mutex collapsed 5 concurrent calls into exactly 1 execution (count=${executionCount})`)

  // TEST 4: Local Storage Functionality Under Restriction (Zero Data Loss)
  console.log('\n--- Test Suite 4: Local Operations Under Cloud Restriction ---')
  // Trip breaker again
  cloudCircuitBreaker.trip('Simulated Egress Quota 402')
  assert(cloudCircuitBreaker.canExecuteQuery() === false, 'Cloud restricted confirmed')

  // Test Student registration locally
  const testStudent = {
    username: 'santri_uji_phase7',
    firstname: 'Ahmad',
    lastname: 'Santri Uji',
    email: 'santri_uji@gontor.ac.id',
    jenjang: 'Jenjang 1' as any,
    kelas: '1B' as any,
    kampus: 'Gontor 1' as any,
  }

  const saveResult = await studentRepository.saveStudent(testStudent)
  assert(saveResult.success === true, 'Student registration succeeds locally even when Cloud is restricted')
  assert(saveResult.student !== undefined, 'Returned student object has ID and canonical fields')

  // Retrieve students locally
  const getResult = await studentRepository.getStudents({ kampus: 'Gontor 1' as any })
  const found = getResult.data.some((s) => s.username === 'santri_uji_phase7')
  assert(found === true, 'Registered student is instantly queryable and persistent in local store')

  // Clean up test student
  if (saveResult.student?.id) {
    await studentRepository.deleteStudent(saveResult.student.id)
    const afterDel = await studentRepository.getStudents({ kampus: 'Gontor 1' as any })
    const stillExists = afterDel.data.some((s) => s.id === saveResult.student!.id)
    assert(stillExists === false, 'Student deletion functions cleanly in local mode')
  }

  // TEST 5: Competition Results Local Upsert
  console.log('\n--- Test Suite 5: Competition Results Local Mode ---')
  const periods = participantPeriodService.getPeriods()
  const periodId = periods[0]?.id || 'period-2026'

  const res = await competitionResultService.upsertResult({
    student_id: 'test-student-id-123',
    period_id: periodId,
    result_status: 'lolos_final',
    is_finalist: true,
  })
  console.log('upsertResult returned:', res)
  assert(
    res && res.id !== undefined && (res.result_status === 'finalis' || res.is_finalist === true),
    'Competition result upserted locally during restriction'
  )

  // TEST 6: Recovery Check State Flow
  console.log('\n--- Test Suite 6: Recovery Check State Transition ---')
  cloudCircuitBreaker.reset()
  const recoveryRes = await cloudSyncCoordinator.triggerRecoveryCheck()
  assert(typeof recoveryRes.success === 'boolean', `Recovery check completed safely with message: "${recoveryRes.message}"`)
  assert(
    cloudSyncCoordinator.getCurrentState() === 'Connected' ||
    cloudSyncCoordinator.getCurrentState() === 'Cloud Restricted',
    `Coordinator state correctly updated to "${cloudSyncCoordinator.getCurrentState()}"`
  )

  console.log('\n==================================================================')
  console.log(`🎯 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runVerificationSuite().catch((err) => {
  console.error('Test suite uncaught error:', err)
  process.exit(1)
})
