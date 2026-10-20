import {
  classifyAward,
  calculatePoints,
  rankStandings,
  campusToSlug,
  slugToCampus,
} from '../src/services/hallOfFameService'
import { DEFAULT_SCORING_WEIGHTS, type CampusStandingRecord } from '../src/types/hallOfFame'

function runTests() {
  console.log('🧪 Starting OGSO Hall of Fame Ranking Engine Verification...\n')
  let passed = 0
  let failed = 0

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name} ${detail ? `(${detail})` : ''}`)
      failed++
    }
  }

  // Test 1: Award Classification & Exclusions
  assert('Juara 1 is gold', classifyAward('Juara 1') === 'gold')
  assert('Juara 2 is silver', classifyAward('Juara 2') === 'silver')
  assert('Juara 3 is bronze', classifyAward('Juara 3') === 'bronze')
  assert('Juara Harapan 1 is honorable_1', classifyAward('Juara Harapan 1') === 'honorable_1')
  assert('Juara Harapan 2 is honorable_2', classifyAward('Juara Harapan 2') === 'honorable_2')
  assert('Medali Emas is gold', classifyAward('Medali Emas') === 'gold')
  assert('Partisipasi is excluded', classifyAward('Sertifikat Partisipasi') === null)
  assert('Top 10 Penyisihan is excluded', classifyAward('Top 10 Penyisihan') === null)
  assert('Peserta is excluded', classifyAward('Peserta') === null)

  // Test 2: Formula & Points Calculation (5, 4, 3, 2, 1)
  const sampleAwards = { gold: 2, silver: 1, bronze: 3, honorable_1: 1, honorable_2: 4 }
  // 2*5 + 1*4 + 3*3 + 1*2 + 4*1 = 10 + 4 + 9 + 2 + 4 = 29
  const points = calculatePoints(sampleAwards, DEFAULT_SCORING_WEIGHTS)
  assert('Points calculate correctly with weights 5,4,3,2,1', points === 29, `Got: ${points}`)

  // Test 3: Tie-Breaking in Points Mode
  // Campus A: 10 pts (2 gold)
  // Campus B: 10 pts (1 gold, 1 silver, 1 hm1 -> 5 + 4 + 2 = 11 pts? No let's construct exact tie)
  // Campus A: gold: 1, silver: 1, bronze: 0, hm1: 0, hm2: 1 -> 5 + 4 + 1 = 10 pts
  // Campus B: gold: 1, silver: 0, bronze: 1, hm1: 1, hm2: 0 -> 5 + 3 + 2 = 10 pts
  // Both have 10 points. Gold is equal (1). Next tie-breaker is Silver: Campus A has 1 silver, Campus B has 0 silver.
  // So Campus A MUST rank ahead of Campus B!
  const campusA = {
    campus: 'Gontor 1',
    campusSlug: 'gontor-1',
    gold: 1,
    silver: 1,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 1,
    total_medals: 2,
    total_awards: 3,
    total_points: 10,
    has_data: true,
  }
  const campusB = {
    campus: 'Gontor 2',
    campusSlug: 'gontor-2',
    gold: 1,
    silver: 0,
    bronze: 1,
    honorable_1: 1,
    honorable_2: 0,
    total_medals: 2,
    total_awards: 3,
    total_points: 10,
    has_data: true,
  }
  const rankedPoints = rankStandings([campusB, campusA], 'points')
  assert('Silver tie-breaker resolves correctly when points & gold are tied', rankedPoints[0].campus === 'Gontor 1' && rankedPoints[0].rank === 1 && rankedPoints[1].rank === 2)

  // Test 4: Shared Rank Detection
  // Campus C and Campus D have identical stats
  const campusC = {
    campus: 'Gontor Putri 1',
    campusSlug: 'gontor-putri-1',
    gold: 2,
    silver: 1,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 3,
    total_awards: 3,
    total_points: 14,
    has_data: true,
  }
  const campusD = {
    campus: 'Gontor Putri 2',
    campusSlug: 'gontor-putri-2',
    gold: 2,
    silver: 1,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 3,
    total_awards: 3,
    total_points: 14,
    has_data: true,
  }
  const campusE = {
    campus: 'Gontor 3',
    campusSlug: 'gontor-3',
    gold: 1,
    silver: 0,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 1,
    total_awards: 1,
    total_points: 5,
    has_data: true,
  }
  const tiedResult = rankStandings([campusC, campusD, campusE], 'points')
  assert('Identical records share rank 1', tiedResult[0].rank === 1 && tiedResult[1].rank === 1 && tiedResult[0].is_tied && tiedResult[1].is_tied)
  assert('Display rank has equals suffix (1=)', tiedResult[0].display_rank === '1=' && tiedResult[1].display_rank === '1=')
  assert('Subsequent competitor receives rank 3 (not rank 2)', tiedResult[2].rank === 3 && tiedResult[2].display_rank === '3')

  // Test 5: Slug conversion
  assert('campusToSlug converts properly', campusToSlug('Gontor Putri 3') === 'gontor-putri-3')
  assert('slugToCampus resolves back to original', slugToCampus('gontor-putri-3') === 'Gontor Putri 3')

  console.log(`\nResults: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

runTests()
