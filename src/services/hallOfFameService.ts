import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'
import { OFFICIAL_CAMPUS_PROFILES } from '../constants/campusProfiles'
import {
  participantPeriodService,
  type CompetitionPeriod,
} from './participantPeriodService'
import {
  DEFAULT_SCORING_WEIGHTS,
  SCORING_VERSIONS_HISTORY,
  type AwardTier,
  type CampusStandingRecord,
  type AllTimeCampusRecord,
  type CampusAwardCounts,
  type CampusProfileData,
  type HallOfFameOverviewData,
  type HistoricalAggregateRecord,
  type HistoricalImportLog,
  type RankingMode,
  type ScoringWeights,
} from '../types/hallOfFame'
import { cloudSyncService } from './supabase/cloudSyncService'
import { isSupabaseConfigured } from '../lib/supabase'

const HOF_SETTINGS_KEY = 'ogsoreg_hall_of_fame_settings_v1'
const HOF_HISTORICAL_AGGREGATES_KEY = 'ogsoreg_hof_historical_aggregates_v1'

/**
 * Converts a campus name into a clean, URL-friendly slug.
 * e.g. "Gontor 1" -> "gontor-1", "Gontor Putri 3" -> "gontor-putri-3"
 */
export function campusToSlug(campus: string): string {
  return campus
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Resolves a campus slug back to the official StudentKampus string.
 */
export function slugToCampus(slug: string): StudentKampus | string {
  const normalized = slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const opt of KAMPUS_OPTIONS) {
    if (opt.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) {
      return opt
    }
  }
  return slug
}

/**
 * Normalizes an award title or string into an official AwardTier.
 * Strictly ignores participation certificates or preliminary top-10 certificates.
 */
export function classifyAward(awardString?: string | null): AwardTier | null {
  if (!awardString || typeof awardString !== 'string') return null
  const lower = awardString.trim().toLowerCase()

  // Strictly exclude preliminary certificates or participation
  if (
    lower.includes('partisipasi') ||
    lower.includes('peserta') ||
    lower.includes('penyisihan') ||
    lower.includes('top 10 penyisihan') ||
    lower.includes('kehadiran')
  ) {
    return null
  }

  // Juara 1 / Gold / Emas
  if (
    lower === 'juara 1' ||
    lower.startsWith('juara 1') ||
    lower === 'gold' ||
    lower.includes('emas') ||
    lower === 'first place' ||
    lower === '1st place'
  ) {
    return 'gold'
  }

  // Juara 2 / Silver / Perak
  if (
    lower === 'juara 2' ||
    lower.startsWith('juara 2') ||
    lower === 'silver' ||
    lower.includes('perak') ||
    lower === 'second place' ||
    lower === '2nd place'
  ) {
    return 'silver'
  }

  // Juara 3 / Bronze / Perunggu
  if (
    lower === 'juara 3' ||
    lower.startsWith('juara 3') ||
    lower === 'bronze' ||
    lower.includes('perunggu') ||
    lower === 'third place' ||
    lower === '3rd place'
  ) {
    return 'bronze'
  }

  // Juara Harapan 1 / Honorable Mention 1
  if (
    lower.includes('harapan 1') ||
    lower.includes('harapn 1') ||
    lower.includes('honorable mention 1') ||
    lower.includes('hm 1') ||
    lower.includes('hm1')
  ) {
    return 'honorable_1'
  }

  // Juara Harapan 2 / Honorable Mention 2
  if (
    lower.includes('harapan 2') ||
    lower.includes('harapn 2') ||
    lower.includes('honorable mention 2') ||
    lower.includes('hm 2') ||
    lower.includes('hm2')
  ) {
    return 'honorable_2'
  }

  return null
}

/**
 * Calculates total statistical points using configured weights.
 * Default: Gold=25, Silver=15, Bronze=8, HM1=3, HM2=1.
 */
export function calculatePoints(
  awards: CampusAwardCounts,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  return (
    awards.gold * weights.gold +
    awards.silver * weights.silver +
    awards.bronze * weights.bronze +
    awards.honorable_1 * weights.honorable_1 +
    awards.honorable_2 * weights.honorable_2
  )
}

/**
 * Checks if two campus records have equal competitive tie-breaker values.
 */
function areStandingsEqual(
  a: CampusStandingRecord,
  b: CampusStandingRecord,
  mode: RankingMode
): boolean {
  if (mode === 'points') {
    return (
      a.total_points === b.total_points &&
      a.gold === b.gold &&
      a.silver === b.silver &&
      a.bronze === b.bronze &&
      a.honorable_1 === b.honorable_1 &&
      a.honorable_2 === b.honorable_2
    )
  }
  // Medal Mode: strictly based on medals & honorable mentions, not points
  return (
    a.gold === b.gold &&
    a.silver === b.silver &&
    a.bronze === b.bronze &&
    a.honorable_1 === b.honorable_1 &&
    a.honorable_2 === b.honorable_2
  )
}

/**
 * Sorts and computes ranks and shared ranks for standings records.
 */
export function rankStandings(
  records: Array<Omit<CampusStandingRecord, 'rank' | 'is_tied' | 'display_rank'>>,
  mode: RankingMode = 'points'
): CampusStandingRecord[] {
  // Sort according to official tie-breaking rules
  const sorted = [...records].sort((a, b) => {
    if (mode === 'points') {
      // 1. Total points
      if (b.total_points !== a.total_points) return b.total_points - a.total_points
      // 2. Gold count
      if (b.gold !== a.gold) return b.gold - a.gold
      // 3. Silver count
      if (b.silver !== a.silver) return b.silver - a.silver
      // 4. Bronze count
      if (b.bronze !== a.bronze) return b.bronze - a.bronze
      // 5. Honorable Mention 1 count
      if (b.honorable_1 !== a.honorable_1) return b.honorable_1 - a.honorable_1
      // 6. Honorable Mention 2 count
      if (b.honorable_2 !== a.honorable_2) return b.honorable_2 - a.honorable_2
      // Deterministic alphabetical order by campus name (not a competitive tie-breaker)
      return a.campus.localeCompare(b.campus)
    } else {
      // Medal Ranking: Gold -> Silver -> Bronze -> HM1 -> HM2 (strictly isolated from points)
      if (b.gold !== a.gold) return b.gold - a.gold
      if (b.silver !== a.silver) return b.silver - a.silver
      if (b.bronze !== a.bronze) return b.bronze - a.bronze
      if (b.honorable_1 !== a.honorable_1) return b.honorable_1 - a.honorable_1
      if (b.honorable_2 !== a.honorable_2) return b.honorable_2 - a.honorable_2
      return a.campus.localeCompare(b.campus)
    }
  })

  // Assign ranks with shared rank detection
  const ranked: CampusStandingRecord[] = []
  let currentRank = 1

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]
    if (i > 0) {
      const prev = sorted[i - 1]
      // Cast for equality comparison
      const dummyPrev = { ...prev, rank: 0, is_tied: false, display_rank: '' }
      const dummyItem = { ...item, rank: 0, is_tied: false, display_rank: '' }
      if (!areStandingsEqual(dummyPrev, dummyItem, mode)) {
        currentRank = i + 1
      }
    }
    ranked.push({
      ...item,
      rank: currentRank,
      is_tied: false,
      display_rank: currentRank.toString(),
    })
  }

  // Second pass: Mark is_tied and format display_rank with '=' if tied
  const rankCountMap = new Map<number, number>()
  for (const r of ranked) {
    rankCountMap.set(r.rank, (rankCountMap.get(r.rank) || 0) + 1)
  }

  return ranked.map((r) => {
    const isTied = (rankCountMap.get(r.rank) || 0) > 1
    return {
      ...r,
      is_tied: isTied,
      display_rank: isTied ? `${r.rank}=` : `${r.rank}`,
    }
  })
}

class HallOfFameService {
  private hasInitializedCloud = false

  constructor() {
    this.initCloudSync()
  }

  private initCloudSync() {
    if (this.hasInitializedCloud || typeof window === 'undefined') return
    this.hasInitializedCloud = true

    setTimeout(() => {
      this.syncFromCloud().catch(() => {})
    }, 300)

    window.addEventListener('focus', () => {
      this.syncFromCloud().catch(() => {})
    })
    window.addEventListener('online', () => {
      this.syncFromCloud().catch(() => {})
    })

    if (isSupabaseConfigured()) {
      cloudSyncService.subscribeCloudSetting('hall_of_fame_settings', (remote) => {
        if (remote) {
          localStorage.setItem(HOF_SETTINGS_KEY, JSON.stringify(remote))
          window.dispatchEvent(new CustomEvent('ogsoreg_hof_settings_updated'))
        }
      })
      cloudSyncService.subscribeCloudSetting('hall_of_fame_historical_aggregates', (remote) => {
        if (remote) {
          localStorage.setItem(HOF_HISTORICAL_AGGREGATES_KEY, JSON.stringify(remote))
          window.dispatchEvent(new CustomEvent('ogsoreg_hof_aggregates_updated'))
        }
      })
    }
  }

  async syncFromCloud(): Promise<void> {
    if (!isSupabaseConfigured()) return
    try {
      const cloudSettings = await cloudSyncService.getCloudSetting('hall_of_fame_settings', null)
      if (cloudSettings) {
        localStorage.setItem(HOF_SETTINGS_KEY, JSON.stringify(cloudSettings))
        window.dispatchEvent(new CustomEvent('ogsoreg_hof_settings_updated'))
      }

      const cloudAggregates = await cloudSyncService.getCloudSetting('hall_of_fame_historical_aggregates', null)
      if (cloudAggregates && Array.isArray(cloudAggregates)) {
        localStorage.setItem(HOF_HISTORICAL_AGGREGATES_KEY, JSON.stringify(cloudAggregates))
        window.dispatchEvent(new CustomEvent('ogsoreg_hof_aggregates_updated'))
      }
    } catch (err) {
      console.warn('[HallOfFameService] Cloud sync error:', err)
    }
  }

  // -------------------------------------------------------------
  // Settings & Scoring Weights with Version History
  // -------------------------------------------------------------
  getScoringWeights(): ScoringWeights {
    return this.getSettings().scoring_weights
  }

  getScoringVersionsHistory(): ScoringWeights[] {
    return this.getSettings().scoring_versions_history || SCORING_VERSIONS_HISTORY
  }

  saveScoringWeights(weights: ScoringWeights): void {
    if (typeof window === 'undefined') return
    try {
      const existing = this.getSettings()
      const previousWeight = existing.scoring_weights

      // Register previous weight in version history if different version
      const history: ScoringWeights[] = existing.scoring_versions_history
        ? [...existing.scoring_versions_history]
        : [...SCORING_VERSIONS_HISTORY]

      if (previousWeight && previousWeight.version !== weights.version) {
        if (!history.some((h) => h.version === previousWeight.version)) {
          history.push(previousWeight)
        }
      }

      existing.scoring_weights = {
        ...weights,
        updated_at: new Date().toISOString(),
      }
      existing.scoring_versions_history = history

      this.logAudit({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        filename: 'Scoring Weights Config',
        operator: 'Super Admin',
        records_imported: 0,
        period_name: 'Global',
        mode: 'aggregate_campus',
        status: 'success',
        details: `Updated weights: Gold=${weights.gold}, Silver=${weights.silver}, Bronze=${weights.bronze}, HM1=${weights.honorable_1}, HM2=${weights.honorable_2} (${weights.version})`,
      })
      localStorage.setItem(HOF_SETTINGS_KEY, JSON.stringify(existing))
      window.dispatchEvent(new CustomEvent('ogsoreg_hof_settings_updated'))
      cloudSyncService.saveCloudSetting('hall_of_fame_settings', existing)
    } catch {}
  }

  resetScoringWeights(): void {
    this.saveScoringWeights(DEFAULT_SCORING_WEIGHTS)
  }

  private getSettings(): {
    scoring_weights: ScoringWeights
    scoring_versions_history?: ScoringWeights[]
    publication_status: Record<string, boolean>
    import_history: HistoricalImportLog[]
    data_completeness_notes: Record<string, string>
  } {
    const defaultSettings = {
      scoring_weights: DEFAULT_SCORING_WEIGHTS,
      scoring_versions_history: SCORING_VERSIONS_HISTORY,
      publication_status: {},
      import_history: [],
      data_completeness_notes: {},
    }
    if (typeof window === 'undefined') return defaultSettings
    try {
      const raw = localStorage.getItem(HOF_SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        let activeWeights = parsed?.scoring_weights || DEFAULT_SCORING_WEIGHTS
        const history: ScoringWeights[] = parsed?.scoring_versions_history
          ? [...parsed.scoring_versions_history]
          : [...SCORING_VERSIONS_HISTORY]

        // Automatic migration: If stored weights are legacy v1 (gold === 5, silver === 4, etc.)
        if (
          activeWeights.version?.startsWith('v1') ||
          (activeWeights.gold === 5 && activeWeights.silver === 4 && activeWeights.bronze === 3)
        ) {
          if (!history.some((h) => h.version === activeWeights.version || (h.gold === 5 && h.silver === 4))) {
            history.push(activeWeights)
          }
          activeWeights = DEFAULT_SCORING_WEIGHTS
          const updatedSettings = {
            ...defaultSettings,
            ...parsed,
            scoring_weights: activeWeights,
            scoring_versions_history: history,
          }
          localStorage.setItem(HOF_SETTINGS_KEY, JSON.stringify(updatedSettings))
          return updatedSettings
        }

        return {
          ...defaultSettings,
          ...parsed,
          scoring_weights: activeWeights,
          scoring_versions_history: history,
        }
      }
    } catch {}
    return defaultSettings
  }

  getImportHistory(): HistoricalImportLog[] {
    return this.getSettings().import_history || []
  }

  logAudit(log: HistoricalImportLog): void {
    if (typeof window === 'undefined') return
    try {
      const settings = this.getSettings()
      const history = [log, ...(settings.import_history || [])].slice(0, 50)
      settings.import_history = history
      localStorage.setItem(HOF_SETTINGS_KEY, JSON.stringify(settings))
    } catch {}
  }

  // -------------------------------------------------------------
  // Historical Aggregates (e.g. older years without student records)
  // -------------------------------------------------------------
  getHistoricalAggregates(periodId?: string): HistoricalAggregateRecord[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(HOF_HISTORICAL_AGGREGATES_KEY)
      if (raw) {
        const list: HistoricalAggregateRecord[] = JSON.parse(raw)
        if (Array.isArray(list)) {
          if (periodId) {
            return list.filter((r) => r.period_id === periodId)
          }
          return list
        }
      }
    } catch {}
    return []
  }

  saveHistoricalAggregates(records: HistoricalAggregateRecord[]): void {
    if (typeof window === 'undefined') return
    try {
      const existing = this.getHistoricalAggregates()
      const newMap = new Map<string, HistoricalAggregateRecord>()
      // Key by period_id + campus to avoid duplicate entries
      existing.forEach((r) => newMap.set(`${r.period_id}_${r.campus}`, r))
      records.forEach((r) => newMap.set(`${r.period_id}_${r.campus}`, r))
      const combined = Array.from(newMap.values())
      localStorage.setItem(HOF_HISTORICAL_AGGREGATES_KEY, JSON.stringify(combined))
      window.dispatchEvent(new CustomEvent('ogsoreg_hof_aggregates_updated'))
      cloudSyncService.saveCloudSetting('hall_of_fame_historical_aggregates', combined)
    } catch {}
  }

  // -------------------------------------------------------------
  // Published Periods Resolution
  // -------------------------------------------------------------
  getEligiblePeriods(options?: { requireWinners?: boolean }): CompetitionPeriod[] {
    const all = participantPeriodService.getPeriods()
    // A period is eligible for public Hall of Fame if is_published is true
    const published = all.filter((p) => p && p.is_published)
    if (options?.requireWinners) {
      return published.filter((p) => {
        if (typeof p.total_winners === 'number' && p.total_winners > 0) return true
        const canonical = participantPeriodService.getWinners(p.id)
        if (canonical.length > 0) return true
        const aggregates = this.getHistoricalAggregates(p.id)
        return aggregates.length > 0
      })
    }
    return published
  }

  // -------------------------------------------------------------
  // Campus Standings for a specific period
  // -------------------------------------------------------------
  computePeriodStandings(
    periodId: string,
    options: {
      mode?: RankingMode
      level?: string
      awardFilter?: 'all' | 'medals_only' | 'honorable_only'
      search?: string
    } = {}
  ): {
    standings: CampusStandingRecord[]
    totalCampuses: number
    totalAwards: number
    totalMedals: number
    period: CompetitionPeriod | null
    isPublished: boolean
    hasResults: boolean
  } {
    const mode = options.mode || 'points'
    const weights = this.getScoringWeights()
    const period = participantPeriodService.getPeriodById(periodId)

    if (!period) {
      return {
        standings: [],
        totalCampuses: 0,
        totalAwards: 0,
        totalMedals: 0,
        period: null,
        isPublished: false,
        hasResults: false,
      }
    }

    // 1. Fetch individual canonical winners for this period
    const canonicalWinners = participantPeriodService.getWinners(period.id)

    // 2. Fetch aggregate historical records if any
    const historicalAggregates = this.getHistoricalAggregates(period.id)

    const nameMatch = period.name ? period.name.match(/\b(20\d\d)\b/) : null
    const effectivePeriodYear = nameMatch ? parseInt(nameMatch[1], 10) : Number(period.year)
    const isPeriodLegacy =
      effectivePeriodYear <= 2025 ||
      (period.name && (period.name.includes('2025') || period.name.includes('2024') || period.name.includes('2023'))) ||
      (period.id && (period.id.includes('2025') || period.id.includes('2024') || period.id.includes('2023')))

    // Filter canonical winners by level if requested
    let filteredWinners = canonicalWinners
    if (options.level && options.level !== 'all') {
      if (isPeriodLegacy) {
        // Sistem jenjang belum ada pada periode 2025 dan sebelumnya (baru mulai 2026)
        filteredWinners = []
      } else {
        filteredWinners = filteredWinners.filter((w) => {
          const lvl = (w.jenjang || '').toLowerCase()
          const cat = (w.category || '').toLowerCase()
          const target = options.level!.toLowerCase()
          return lvl.includes(target) || cat.includes(target)
        })
      }
    }

    // Check if period has recorded results
    const hasResults = canonicalWinners.length > 0 || historicalAggregates.length > 0

    // Initialize counts for all 20 official campuses
    const campusMap = new Map<string, CampusAwardCounts>()
    KAMPUS_OPTIONS.forEach((campus) => {
      campusMap.set(campus, {
        gold: 0,
        silver: 0,
        bronze: 0,
        honorable_1: 0,
        honorable_2: 0,
      })
    })

    // Process canonical winners
    for (const w of filteredWinners) {
      if (!w.campus) continue
      const campusKey = w.campus.trim()
      if (!campusMap.has(campusKey)) {
        campusMap.set(campusKey, { gold: 0, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 0 })
      }
      const tier = classifyAward(w.award)
      if (tier) {
        campusMap.get(campusKey)![tier]++
      }
    }

    // If no canonical individual winners exist, apply aggregate records (prevent double counting)
    if (canonicalWinners.length === 0 && historicalAggregates.length > 0) {
      for (const agg of historicalAggregates) {
        if (!agg.campus) continue
        const campusKey = agg.campus.trim()
        if (!campusMap.has(campusKey)) {
          campusMap.set(campusKey, { gold: 0, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 0 })
        }
        const current = campusMap.get(campusKey)!
        current.gold += agg.gold || 0
        current.silver += agg.silver || 0
        current.bronze += agg.bronze || 0
        current.honorable_1 += agg.honorable_1 || 0
        current.honorable_2 += agg.honorable_2 || 0
      }
    }

    // Transform map to unranked records
    const rawRecords: Array<Omit<CampusStandingRecord, 'rank' | 'is_tied' | 'display_rank'>> = []
    let periodTotalAwards = 0
    let periodTotalMedals = 0

    campusMap.forEach((awards, campus) => {
      const totalMedals = awards.gold + awards.silver + awards.bronze
      const totalAwards = totalMedals + awards.honorable_1 + awards.honorable_2

      periodTotalAwards += totalAwards
      periodTotalMedals += totalMedals

      // Apply awardFilter if requested
      let effectiveAwards = { ...awards }
      if (options.awardFilter === 'medals_only') {
        effectiveAwards.honorable_1 = 0
        effectiveAwards.honorable_2 = 0
      } else if (options.awardFilter === 'honorable_only') {
        effectiveAwards.gold = 0
        effectiveAwards.silver = 0
        effectiveAwards.bronze = 0
      }

      rawRecords.push({
        campus,
        campusSlug: campusToSlug(campus),
        gold: effectiveAwards.gold,
        silver: effectiveAwards.silver,
        bronze: effectiveAwards.bronze,
        honorable_1: effectiveAwards.honorable_1,
        honorable_2: effectiveAwards.honorable_2,
        total_medals: effectiveAwards.gold + effectiveAwards.silver + effectiveAwards.bronze,
        total_awards:
          effectiveAwards.gold +
          effectiveAwards.silver +
          effectiveAwards.bronze +
          effectiveAwards.honorable_1 +
          effectiveAwards.honorable_2,
        total_points: calculatePoints(effectiveAwards, weights),
        has_data: hasResults,
        period_id: period.id,
        period_year: period.year,
      })
    })

    // Rank records according to chosen mode
    let ranked = rankStandings(rawRecords, mode)

    // Apply search query if given
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase()
      ranked = ranked.filter((r) => r.campus.toLowerCase().includes(q))
    }

    return {
      standings: ranked,
      totalCampuses: campusMap.size,
      totalAwards: periodTotalAwards,
      totalMedals: periodTotalMedals,
      period,
      isPublished: period.is_published,
      hasResults,
    }
  }

  // -------------------------------------------------------------
  // All-Time Rankings across all eligible periods
  // -------------------------------------------------------------
  computeAllTimeRankings(options: { mode?: RankingMode; search?: string } = {}): {
    rankings: AllTimeCampusRecord[]
    periodRange: string
    totalPeriods: number
    scoringWeights: ScoringWeights
    hasPublishedData: boolean
  } {
    const mode = options.mode || 'points'
    const weights = this.getScoringWeights()
    const eligiblePeriods = this.getEligiblePeriods()

    if (eligiblePeriods.length === 0) {
      return {
        rankings: [],
        periodRange: 'Belum ada data',
        totalPeriods: 0,
        scoringWeights: weights,
        hasPublishedData: false,
      }
    }

    // Determine period coverage string (e.g. "Berdasarkan arsip resmi OGSO 2024–2026")
    const years = eligiblePeriods.map((p) => p.year).sort((a, b) => a - b)
    const minYear = years[0]
    const maxYear = years[years.length - 1]
    const periodRange =
      minYear === maxYear
        ? `Berdasarkan arsip resmi OGSO tahun ${minYear}`
        : `Berdasarkan rekapitulasi data resmi OGSO tahun ${minYear}–${maxYear}`

    // Track aggregation per campus
    const aggMap = new Map<
      string,
      {
        awards: CampusAwardCounts
        periodsPresent: Set<string>
        bestRank: number
        bestPeriod: string
      }
    >()

    KAMPUS_OPTIONS.forEach((campus) => {
      aggMap.set(campus, {
        awards: { gold: 0, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 0 },
        periodsPresent: new Set<string>(),
        bestRank: 999,
        bestPeriod: '-',
      })
    })

    let anyResultsFound = false

    // Aggregate each eligible period's verified standings
    for (const period of eligiblePeriods) {
      const periodResult = this.computePeriodStandings(period.id, { mode: 'points' })
      if (!periodResult.hasResults) continue

      anyResultsFound = true
      for (const standing of periodResult.standings) {
        if (!aggMap.has(standing.campus)) {
          aggMap.set(standing.campus, {
            awards: { gold: 0, silver: 0, bronze: 0, honorable_1: 0, honorable_2: 0 },
            periodsPresent: new Set<string>(),
            bestRank: 999,
            bestPeriod: '-',
          })
        }
        const data = aggMap.get(standing.campus)!

        // If campus scored at least 1 award in this period, record participation
        if (standing.total_awards > 0) {
          data.periodsPresent.add(period.id)
          if (standing.rank < data.bestRank) {
            data.bestRank = standing.rank
            data.bestPeriod = period.name
          }
        }

        data.awards.gold += standing.gold
        data.awards.silver += standing.silver
        data.awards.bronze += standing.bronze
        data.awards.honorable_1 += standing.honorable_1
        data.awards.honorable_2 += standing.honorable_2
      }
    }

    const rawRecords: Array<Omit<CampusStandingRecord, 'rank' | 'is_tied' | 'display_rank'>> = []
    const metaMap = new Map<string, { periods_participated: number; best_rank: number; best_period_name: string }>()

    aggMap.forEach((val, campus) => {
      const totalPoints = calculatePoints(val.awards, weights)
      const totalMedals = val.awards.gold + val.awards.silver + val.awards.bronze
      const totalAwards = totalMedals + val.awards.honorable_1 + val.awards.honorable_2

      rawRecords.push({
        campus,
        campusSlug: campusToSlug(campus),
        gold: val.awards.gold,
        silver: val.awards.silver,
        bronze: val.awards.bronze,
        honorable_1: val.awards.honorable_1,
        honorable_2: val.awards.honorable_2,
        total_medals: totalMedals,
        total_awards: totalAwards,
        total_points: totalPoints,
        has_data: anyResultsFound,
      })

      metaMap.set(campus, {
        periods_participated: val.periodsPresent.size,
        best_rank: val.bestRank === 999 ? 0 : val.bestRank,
        best_period_name: val.bestPeriod,
      })
    })

    const ranked = rankStandings(rawRecords, mode)

    let allTimeRecords: AllTimeCampusRecord[] = ranked.map((r) => {
      const meta = metaMap.get(r.campus) || {
        periods_participated: 0,
        best_rank: 0,
        best_period_name: '-',
      }
      return {
        ...r,
        periods_participated: meta.periods_participated,
        best_rank: meta.best_rank,
        best_period_name: meta.best_period_name,
        total_golds: r.gold,
      }
    })

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase()
      allTimeRecords = allTimeRecords.filter((r) => r.campus.toLowerCase().includes(q))
    }

    return {
      rankings: allTimeRecords,
      periodRange,
      totalPeriods: eligiblePeriods.length,
      scoringWeights: weights,
      hasPublishedData: anyResultsFound,
    }
  }

  // -------------------------------------------------------------
  // Historical Trends across periods for selected campuses
  // -------------------------------------------------------------
  computeHistoricalTrends(
    selectedCampuses: string[],
    levelFilter?: string
  ): {
    periods: Array<{ id: string; name: string; year: number }>
    series: Array<{
      campus: string
      data: Array<{
        periodId: string
        periodName: string
        year: number
        points: number
        gold: number
        silver: number
        bronze: number
        hm1: number
        hm2: number
        totalAwards: number
        rank: number
      }>
    }>
  } {
    // Sort periods chronologically (oldest to newest) for trends
    // CRITICAL: Filter out any periods where winner data is 0 (as explicitly requested by user)
    const allEligible = [...this.getEligiblePeriods()].sort((a, b) => a.year - b.year)

    const periods = allEligible.filter((p) => {
      const canonical = participantPeriodService.getWinners(p.id)
      const aggregates = this.getHistoricalAggregates(p.id)
      const totalAggAwards = aggregates.reduce(
        (sum, a) => sum + a.gold + a.silver + a.bronze + a.honorable_1 + a.honorable_2,
        0
      )
      const totalWinners =
        typeof p.total_winners === 'number' && p.total_winners > 0
          ? p.total_winners
          : canonical.length + totalAggAwards

      if (totalWinners === 0) return false

      if (levelFilter && levelFilter !== 'all') {
        const result = this.computePeriodStandings(p.id, { level: levelFilter, mode: 'points' })
        return result.totalAwards > 0
      }

      return true
    })

    const series = selectedCampuses.map((campus) => {
      const data = periods.map((p) => {
        const result = this.computePeriodStandings(p.id, { level: levelFilter, mode: 'points' })
        const rec = result.standings.find((s) => s.campus.toLowerCase() === campus.toLowerCase())
        return {
          periodId: p.id,
          periodName: p.name,
          year: p.year,
          points: rec ? rec.total_points : 0,
          gold: rec ? rec.gold : 0,
          silver: rec ? rec.silver : 0,
          bronze: rec ? rec.bronze : 0,
          hm1: rec ? rec.honorable_1 : 0,
          hm2: rec ? rec.honorable_2 : 0,
          totalAwards: rec ? rec.total_awards : 0,
          rank: rec ? rec.rank : 0,
        }
      })
      return { campus, data }
    })

    return {
      periods: periods.map((p) => ({ id: p.id, name: p.name, year: p.year })),
      series,
    }
  }

  // -------------------------------------------------------------
  // Campus Profile Data
  // -------------------------------------------------------------
  getCampusProfileData(slugOrName: string): CampusProfileData | null {
    const campusName = slugToCampus(slugOrName)
    const campusSlug = campusToSlug(campusName)
    const weights = this.getScoringWeights()

    const officialProfile = OFFICIAL_CAMPUS_PROFILES[campusName as StudentKampus] || {
      campusKey: campusName as StudentKampus,
      officialName: `Pondok Modern Darussalam Gontor (${campusName})`,
      address: 'Pondok Modern Darussalam Gontor',
      pic: 'Pengasuh Kampus',
      phone: 'Sekretariat Pusat',
    }

    const allPeriods = this.getEligiblePeriods()
    const periodHistory: CampusProfileData['periodHistory'] = []

    const totalAwards: CampusAwardCounts = {
      gold: 0,
      silver: 0,
      bronze: 0,
      honorable_1: 0,
      honorable_2: 0,
    }

    const achievementsByLevel: CampusProfileData['achievementsByLevel'] = {}
    const achievementsByCategory: CampusProfileData['achievementsByCategory'] = {}
    const publishedWinners: CampusProfileData['publishedWinners'] = []

    let bestPerformance: CampusProfileData['bestPerformance'] = null

    // Iterate through all periods to collect history and published winners
    for (const p of allPeriods) {
      const pYearMatch = p.name ? p.name.match(/\b(20\d\d)\b/) : null
      const effectiveYear = pYearMatch ? parseInt(pYearMatch[1], 10) : Number(p.year)
      const isLegacyPeriod =
        effectiveYear <= 2025 ||
        (p.name && (p.name.includes('2025') || p.name.includes('2024') || p.name.includes('2023'))) ||
        (p.id && (p.id.includes('2025') || p.id.includes('2024') || p.id.includes('2023')))

      const standingsResult = this.computePeriodStandings(p.id, { mode: 'points' })
      const rec = standingsResult.standings.find(
        (s) => s.campus.toLowerCase() === campusName.toLowerCase()
      )

      if (rec) {
        periodHistory.push({
          period_id: p.id,
          period_name: p.name,
          period_year: effectiveYear,
          rank: rec.rank,
          is_tied: rec.is_tied,
          display_rank: rec.display_rank,
          points: rec.total_points,
          gold: rec.gold,
          silver: rec.silver,
          bronze: rec.bronze,
          honorable_1: rec.honorable_1,
          honorable_2: rec.honorable_2,
          total_awards: rec.total_awards,
        })

        totalAwards.gold += rec.gold
        totalAwards.silver += rec.silver
        totalAwards.bronze += rec.bronze
        totalAwards.honorable_1 += rec.honorable_1
        totalAwards.honorable_2 += rec.honorable_2

        if (
          rec.total_points > 0 &&
          (!bestPerformance ||
            rec.total_points > bestPerformance.points ||
            (rec.total_points === bestPerformance.points && rec.rank < bestPerformance.rank))
        ) {
          bestPerformance = {
            period_name: p.name,
            year: effectiveYear,
            rank: rec.rank,
            points: rec.total_points,
            medals: rec.total_medals,
          }
        }
      }

      // Collect individual winners for this campus in this period
      const winners = participantPeriodService.getWinners(p.id)
      for (const w of winners) {
        if (w.campus && w.campus.trim().toLowerCase() === campusName.toLowerCase()) {
          const tier = classifyAward(w.award)
          if (!tier) continue

          // Jenjang breakdown only exists starting from 2026 onwards (periods <= 2025 do not have Jenjang)
          if (!isLegacyPeriod && effectiveYear >= 2026 && w.jenjang) {
            const levelKey = w.jenjang
            if (!achievementsByLevel[levelKey]) {
              achievementsByLevel[levelKey] = {
                gold: 0,
                silver: 0,
                bronze: 0,
                honorable_1: 0,
                honorable_2: 0,
                points: 0,
              }
            }
            achievementsByLevel[levelKey][tier]++
            achievementsByLevel[levelKey].points += weights[tier]
          }

          const catKey = w.category || 'Bidang Lainnya'
          if (!achievementsByCategory[catKey]) {
            achievementsByCategory[catKey] = {
              gold: 0,
              silver: 0,
              bronze: 0,
              honorable_1: 0,
              honorable_2: 0,
              points: 0,
            }
          }
          achievementsByCategory[catKey][tier]++
          achievementsByCategory[catKey].points += weights[tier]

          publishedWinners.push({
            id: w.id,
            student_name: w.student_name,
            award: w.award,
            category: w.category,
            jenjang: isLegacyPeriod ? undefined : w.jenjang,
            period_id: p.id,
            period_name: p.name,
            period_year: effectiveYear,
          })
        }
      }
    }

    // Sort winners: newest period first, then rank
    publishedWinners.sort((a, b) => b.period_year - a.period_year)

    // Compute all-time ranking among all campuses
    const allTimeResult = this.computeAllTimeRankings()
    const allTimeRecord = allTimeResult.rankings.find(
      (r) => r.campus.toLowerCase() === campusName.toLowerCase()
    )

    const totalMedals = totalAwards.gold + totalAwards.silver + totalAwards.bronze
    const totalAwardsCount = totalMedals + totalAwards.honorable_1 + totalAwards.honorable_2
    const allTimePoints = calculatePoints(totalAwards, weights)

    return {
      campus: campusName,
      campusSlug,
      officialName: officialProfile.officialName,
      address: officialProfile.address,
      pic: officialProfile.pic,
      phone: officialProfile.phone,
      allTimeRank: allTimeRecord ? allTimeRecord.rank : 999,
      allTimePoints,
      totalAwards,
      totalMedals,
      totalAwardsCount,
      bestPerformance,
      achievementsByLevel,
      achievementsByCategory,
      periodHistory: periodHistory.sort((a, b) => b.period_year - a.period_year),
      publishedWinners,
    }
  }

  // -------------------------------------------------------------
  // Hall of Fame Overview
  // -------------------------------------------------------------
  getHallOfFameOverview(): HallOfFameOverviewData {
    const eligiblePeriods = this.getEligiblePeriods()
    const latestPeriod = eligiblePeriods.length > 0 ? eligiblePeriods[0] : null

    if (!latestPeriod) {
      return {
        latestPeriod: null,
        totalPublishedPeriods: 0,
        totalParticipatingCampuses: KAMPUS_OPTIONS.length,
        totalRecordedAwards: 0,
        topThreeCampuses: [],
        leadingGoldCampus: null,
        rankingMode: 'points',
        archivePeriodCoverage: 'Belum ada periode yang dipublikasikan.',
      }
    }

    // Prefer the latest period that has verified winners for the podium & spotlight
    // If none has winners yet, fallback to the latest published period
    const periodWithWinners = eligiblePeriods.find((p) => {
      const canonical = participantPeriodService.getWinners(p.id)
      const aggregates = this.getHistoricalAggregates(p.id)
      const totalAggAwards = aggregates.reduce(
        (sum, a) => sum + a.gold + a.silver + a.bronze + a.honorable_1 + a.honorable_2,
        0
      )
      const tw = typeof p.total_winners === 'number' && p.total_winners > 0
        ? p.total_winners
        : canonical.length + totalAggAwards
      return tw > 0
    })

    const displayPeriod = periodWithWinners || latestPeriod
    const allTime = this.computeAllTimeRankings()

    // Default podium to All-Time rankings (Secara Keseluruhan)
    const topThreeCampuses = allTime.rankings.slice(0, 3)

    // Leading gold medal campus across all periods (Secara Keseluruhan)
    let leadingGoldCampus: { campus: string; goldCount: number; totalPoints: number } | null = null
    const goldSorted = [...allTime.rankings].sort((a, b) => b.gold - a.gold || b.total_points - a.total_points)
    if (goldSorted.length > 0 && (goldSorted[0].gold > 0 || goldSorted[0].total_points > 0)) {
      leadingGoldCampus = {
        campus: goldSorted[0].campus,
        goldCount: goldSorted[0].gold,
        totalPoints: goldSorted[0].total_points,
      }
    }

    const totalRecordedAwards = allTime.rankings.reduce((sum, r) => sum + r.total_awards, 0)

    return {
      latestPeriod: displayPeriod,
      totalPublishedPeriods: eligiblePeriods.length,
      totalParticipatingCampuses: KAMPUS_OPTIONS.length,
      totalRecordedAwards,
      topThreeCampuses,
      leadingGoldCampus,
      rankingMode: 'points',
      archivePeriodCoverage: allTime.periodRange,
    }
  }
}

export const hallOfFameService = new HallOfFameService()
