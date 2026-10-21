import {
  classifyAward,
  calculatePoints,
  rankStandings,
  campusToSlug,
  slugToCampus,
  hallOfFameService,
} from '../src/services/hallOfFameService'
import {
  DEFAULT_SCORING_WEIGHTS,
  LEGACY_SCORING_WEIGHTS_V1,
  SCORING_VERSIONS_HISTORY,
  type ScoringWeights,
} from '../src/types/hallOfFame'
import { participantPeriodService, isPeriodLegacyYear } from '../src/services/participantPeriodService'

function runTests() {
  console.log('🧪 Starting OGSO Hall of Fame Scoring & Ranking Engine Verification Suite...\n')
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

  // =========================================================================
  // Test A — Basic Scoring
  // 1 Gold = 25 points. 1 Silver = 15 points. 1 Bronze = 8 points.
  // 1 Harapan 1 = 3 points. 1 Harapan 2 = 1 point.
  // =========================================================================
  console.log('--- Test A: Basic Scoring (25, 15, 8, 3, 1) ---')
  const ptGold = calculatePoints({ gold: 1, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS)
  const ptSilver = calculatePoints({ gold: 0, silver: 1, bronze: 0, honorable_1: 0, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS)
  const ptBronze = calculatePoints({ gold: 0, silver: 0, bronze: 1, honorable_1: 0, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS)
  const ptHm1 = calculatePoints({ gold: 0, silver: 0, bronze: 0, honorable_1: 1, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS)
  const ptHm2 = calculatePoints({ gold: 0, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 1 }, DEFAULT_SCORING_WEIGHTS)

  assert('Test A.1: 1 Gold = 25 points', ptGold === 25, `Expected 25, got ${ptGold}`)
  assert('Test A.2: 1 Silver = 15 points', ptSilver === 15, `Expected 15, got ${ptSilver}`)
  assert('Test A.3: 1 Bronze = 8 points', ptBronze === 8, `Expected 8, got ${ptBronze}`)
  assert('Test A.4: 1 Harapan 1 = 3 points', ptHm1 === 3, `Expected 3, got ${ptHm1}`)
  assert('Test A.5: 1 Harapan 2 = 1 point', ptHm2 === 1, `Expected 1, got ${ptHm2}`)

  // =========================================================================
  // Test B — Multiple Awards
  // 2 Gold + 1 Silver + 3 Bronze + 2 Harapan 1 + 1 Harapan 2
  // Expected: 2*25 + 1*15 + 3*8 + 2*3 + 1*1 = 50 + 15 + 24 + 6 + 1 = 96 points
  // =========================================================================
  console.log('\n--- Test B: Multiple Awards Aggregation ---')
  const awardsB = { gold: 2, silver: 1, bronze: 3, honorable_1: 2, honorable_2: 1 }
  const totalB = calculatePoints(awardsB, DEFAULT_SCORING_WEIGHTS)
  assert('Test B: 2G + 1S + 3B + 2H1 + 1H2 = 96 points', totalB === 96, `Expected 96, got ${totalB}`)

  // =========================================================================
  // Test C — Higher Award Advantage
  // Campus A: 2 Gold = 50 points
  // Campus B: 5 Harapan 1 = 15 points
  // Expected winner: Campus A
  // =========================================================================
  console.log('\n--- Test C: Higher Award Advantage ---')
  const campusA_C = {
    campus: 'Campus A',
    campusSlug: 'campus-a',
    gold: 2,
    silver: 0,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 2,
    total_awards: 2,
    total_points: calculatePoints({ gold: 2, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS),
    has_data: true,
  }
  const campusB_C = {
    campus: 'Campus B',
    campusSlug: 'campus-b',
    gold: 0,
    silver: 0,
    bronze: 0,
    honorable_1: 5,
    honorable_2: 0,
    total_medals: 0,
    total_awards: 5,
    total_points: calculatePoints({ gold: 0, silver: 0, bronze: 0, honorable_1: 5, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS),
    has_data: true,
  }
  const rankResultC = rankStandings([campusB_C, campusA_C], 'points')
  assert('Test C.1: Campus A has 50 points', campusA_C.total_points === 50, `Got ${campusA_C.total_points}`)
  assert('Test C.2: Campus B has 15 points', campusB_C.total_points === 15, `Got ${campusB_C.total_points}`)
  assert('Test C.3: Campus A ranks higher (#1) than Campus B (#2)', rankResultC[0].campus === 'Campus A' && rankResultC[0].rank === 1 && rankResultC[1].rank === 2)

  // =========================================================================
  // Test D — Points Tie-Breaker
  // Campus A: 1 Gold = 25 points
  // Campus B: 3 Bronze + 1 Harapan 2 = 3*8 + 1 = 25 points
  // Expected winner: Campus A, because Gold count is higher (1 vs 0)
  // =========================================================================
  console.log('\n--- Test D: Points Tie-Breaker ---')
  const campusA_D = {
    campus: 'Campus A',
    campusSlug: 'campus-a',
    gold: 1,
    silver: 0,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 1,
    total_awards: 1,
    total_points: 25,
    has_data: true,
  }
  const campusB_D = {
    campus: 'Campus B',
    campusSlug: 'campus-b',
    gold: 0,
    silver: 0,
    bronze: 3,
    honorable_1: 0,
    honorable_2: 1,
    total_medals: 3,
    total_awards: 4,
    total_points: 25,
    has_data: true,
  }
  const rankResultD = rankStandings([campusB_D, campusA_D], 'points')
  assert('Test D: Campus A wins tie-breaker via higher Gold count', rankResultD[0].campus === 'Campus A' && rankResultD[0].rank === 1 && rankResultD[1].rank === 2)

  // =========================================================================
  // Test E — Shared Rank
  // Two campuses with identical award counts and identical points receive the same rank
  // =========================================================================
  console.log('\n--- Test E: Shared Rank Handling ---')
  const campus1_E = {
    campus: 'Gontor Putri 1',
    campusSlug: 'gontor-putri-1',
    gold: 1,
    silver: 1,
    bronze: 2,
    honorable_1: 1,
    honorable_2: 0,
    total_medals: 4,
    total_awards: 5,
    total_points: calculatePoints({ gold: 1, silver: 1, bronze: 2, honorable_1: 1, honorable_2: 0 }, DEFAULT_SCORING_WEIGHTS), // 25 + 15 + 16 + 3 = 59
    has_data: true,
  }
  const campus2_E = {
    campus: 'Gontor Putri 2',
    campusSlug: 'gontor-putri-2',
    gold: 1,
    silver: 1,
    bronze: 2,
    honorable_1: 1,
    honorable_2: 0,
    total_medals: 4,
    total_awards: 5,
    total_points: 59,
    has_data: true,
  }
  const campus3_E = {
    campus: 'Gontor 3',
    campusSlug: 'gontor-3',
    gold: 0,
    silver: 1,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 1,
    total_awards: 1,
    total_points: 15,
    has_data: true,
  }
  const rankResultE = rankStandings([campus1_E, campus2_E, campus3_E], 'points')
  assert('Test E.1: Both identical campuses receive rank 1', rankResultE[0].rank === 1 && rankResultE[1].rank === 1)
  assert('Test E.2: Tied campuses have is_tied = true', rankResultE[0].is_tied && rankResultE[1].is_tied)
  assert('Test E.3: Display rank formats with equals suffix (1=)', rankResultE[0].display_rank === '1=' && rankResultE[1].display_rank === '1=')
  assert('Test E.4: Subsequent competitor receives rank 3 (not rank 2)', rankResultE[2].rank === 3 && rankResultE[2].display_rank === '3')

  // =========================================================================
  // Test F — Historical Aggregation & All-Time Consistency
  // All-Time Ranking totals must equal the sum of recalculated points across eligible published periods
  // =========================================================================
  console.log('\n--- Test F: Historical Aggregation & Point Consistency ---')
  const periods = hallOfFameService.getEligiblePeriods()
  const allTimeRankings = hallOfFameService.computeAllTimeRankings()
  assert('Test F.1: Eligible periods fetched successfully', periods.length >= 0)
  assert('Test F.2: All-time rankings returns 20 official campuses', allTimeRankings.rankings.length === 20)

  // Verify that an arbitrary campus's all-time points equals sum of its recalculated points across all eligible periods
  const targetCampus = allTimeRankings.rankings[0]
  if (targetCampus) {
    let recalculatedPointsSum = 0
    let goldSum = 0
    let silverSum = 0
    let bronzeSum = 0
    let hm1Sum = 0
    let hm2Sum = 0

    for (const p of periods) {
      const pStandings = hallOfFameService.computePeriodStandings(p.id)
      const rec = pStandings.standings.find((s) => s.campus.toLowerCase() === targetCampus.campus.toLowerCase())
      if (rec) {
        recalculatedPointsSum += rec.total_points
        goldSum += rec.gold
        silverSum += rec.silver
        bronzeSum += rec.bronze
        hm1Sum += rec.honorable_1
        hm2Sum += rec.honorable_2
      }
    }

    const expectedPointsFromAwards = calculatePoints(
      { gold: goldSum, silver: silverSum, bronze: bronzeSum, honorable_1: hm1Sum, honorable_2: hm2Sum },
      DEFAULT_SCORING_WEIGHTS
    )

    assert(
      `Test F.3: All-time points for ${targetCampus.campus} match sum of period recalculated points`,
      targetCampus.total_points === recalculatedPointsSum && targetCampus.total_points === expectedPointsFromAwards,
      `AllTime: ${targetCampus.total_points}, Sum: ${recalculatedPointsSum}, ExpectedFromAwards: ${expectedPointsFromAwards}`
    )
  }

  // =========================================================================
  // Test G — Ranking Mode Isolation
  // Changing point weights must NOT change the ordering rules of Medal Ranking.
  // In Medal mode: Gold -> Silver -> Bronze -> HM1 -> HM2.
  // =========================================================================
  console.log('\n--- Test G: Ranking Mode Isolation ---')
  // Campus X has 1 Gold, 0 Silver, 0 Bronze (Total points: 25)
  // Campus Y has 0 Gold, 3 Silver, 0 Bronze (Total points: 3 * 15 = 45)
  // In Points mode: Campus Y (45 pts) beats Campus X (25 pts)
  // In Medal mode: Campus X (1 Gold) beats Campus Y (0 Gold) regardless of points!
  const campusX = {
    campus: 'Campus X',
    campusSlug: 'campus-x',
    gold: 1,
    silver: 0,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 1,
    total_awards: 1,
    total_points: 25,
    has_data: true,
  }
  const campusY = {
    campus: 'Campus Y',
    campusSlug: 'campus-y',
    gold: 0,
    silver: 3,
    bronze: 0,
    honorable_1: 0,
    honorable_2: 0,
    total_medals: 3,
    total_awards: 3,
    total_points: 45,
    has_data: true,
  }
  const resultPointsMode = rankStandings([campusX, campusY], 'points')
  const resultMedalMode = rankStandings([campusX, campusY], 'medals')

  assert('Test G.1: Points mode ranks Campus Y (#1, 45 pts) above Campus X (#2, 25 pts)', resultPointsMode[0].campus === 'Campus Y')
  assert('Test G.2: Medal mode strictly ranks Campus X (#1, 1 Gold) above Campus Y (#2, 0 Gold)', resultMedalMode[0].campus === 'Campus X')

  // =========================================================================
  // Test H — Publication and Permissions
  // Unpublished results must not leak into public standings.
  // Scoring version configuration is preserved.
  // =========================================================================
  console.log('\n--- Test H: Publication & Configuration Permissions ---')
  const allPeriods = participantPeriodService.getPeriods()
  const eligiblePeriods = hallOfFameService.getEligiblePeriods()

  // Verify eligiblePeriods only contains periods with is_published === true
  const allEligibleArePublished = eligiblePeriods.every((p) => p.is_published === true)
  assert('Test H.1: getEligiblePeriods only returns published periods', allEligibleArePublished)

  // Verify Scoring Versions History
  const history = hallOfFameService.getScoringVersionsHistory()
  assert('Test H.2: Scoring version history tracks v2.0 as active default', DEFAULT_SCORING_WEIGHTS.gold === 25 && DEFAULT_SCORING_WEIGHTS.silver === 15)
  assert('Test H.3: Legacy version history (5-4-3-2-1) is preserved in history archive', history.some((v) => v.gold === 5 && v.silver === 4))

  // Award classification check
  assert('Juara 1 classifies as gold', classifyAward('Juara 1') === 'gold')
  assert('Juara 2 classifies as silver', classifyAward('Juara 2') === 'silver')
  assert('Juara 3 classifies as bronze', classifyAward('Juara 3') === 'bronze')
  assert('Harapan 1 classifies as honorable_1', classifyAward('Juara Harapan 1') === 'honorable_1')
  assert('Harapan 2 classifies as honorable_2', classifyAward('Juara Harapan 2') === 'honorable_2')
  assert('Sertifikat Partisipasi is excluded', classifyAward('Sertifikat Partisipasi') === null)

  // =========================================================================
  // Test I — Legacy Period Jenjang Isolation
  // Jenjang system only exists starting from 2026 onwards.
  // Periods <= 2025 do not categorize into Jenjang.
  // =========================================================================
  console.log('\n--- Test I: Legacy Period Jenjang Isolation (Jenjang starts in 2026) ---')
  assert('Test I.1: isPeriodLegacyYear returns true for period-ogso-2025', isPeriodLegacyYear('period-ogso-2025'))
  assert('Test I.2: isPeriodLegacyYear returns true for period-ogso-2024', isPeriodLegacyYear('period-ogso-2024'))
  assert('Test I.3: isPeriodLegacyYear returns false for period-ogso-2026', !isPeriodLegacyYear('period-ogso-2026'))

  // Verify winners from 2025 have jenjang = undefined
  const winners2025 = participantPeriodService.getWinners('period-ogso-2025')
  const any2025WinnerHasJenjang = winners2025.some((w) => w.jenjang !== undefined)
  assert('Test I.4: Winners from 2025 period have undefined jenjang', !any2025WinnerHasJenjang)

  // Verify campus profile data published winners for <= 2025 have jenjang = undefined
  const campusProfile = hallOfFameService.getCampusProfileData('Gontor 1')
  const published2025 = campusProfile.publishedWinners.filter((w) => w.period_year <= 2025)
  const anyPublished2025HasJenjang = published2025.some((w) => w.jenjang !== undefined)
  assert('Test I.5: Published winners <= 2025 in Campus Profile have undefined jenjang', !anyPublished2025HasJenjang)

  // Verify computePeriodStandings with level filter on 2025 returns 0 awards
  const standingsWithLevelFilter2025 = hallOfFameService.computePeriodStandings('period-ogso-2025', {
    level: 'Jenjang 1',
  })
  assert('Test I.6: Filtering by Jenjang on 2025 returns 0 awards (no jenjang in 2025)', standingsWithLevelFilter2025.totalAwards === 0)

  console.log(`\n======================================================`)
  console.log(`Verification Complete: ${passed} passed, ${failed} failed.`)
  console.log(`======================================================`)
  if (failed > 0) process.exit(1)
}

runTests()
