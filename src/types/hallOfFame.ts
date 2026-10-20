import type { StudentKampus } from './campus'
import type { CompetitionPeriod, PeriodWinner } from '../services/participantPeriodService'

export type AwardTier = 'gold' | 'silver' | 'bronze' | 'honorable_1' | 'honorable_2'

export type RankingMode = 'points' | 'medals'

export interface ScoringWeights {
  version: string
  gold: number
  silver: number
  bronze: number
  honorable_1: number
  honorable_2: number
  updated_at: string
  notes?: string
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  version: 'v1.0 (Official OGSO Standard)',
  gold: 5,
  silver: 4,
  bronze: 3,
  honorable_1: 2,
  honorable_2: 1,
  updated_at: '2026-01-01T00:00:00Z',
  notes: 'Standar resmi pembobotan prestasi olimpiade sains Gontor (SK Panitia Pusat OGSO).',
}

export interface CampusAwardCounts {
  gold: number
  silver: number
  bronze: number
  honorable_1: number
  honorable_2: number
}

export interface CampusStandingRecord {
  campus: StudentKampus | string
  campusSlug: string
  rank: number
  is_tied: boolean
  display_rank: string // e.g. "1", "3=", etc.
  gold: number
  silver: number
  bronze: number
  honorable_1: number
  honorable_2: number
  total_medals: number // gold + silver + bronze
  total_awards: number // gold + silver + bronze + hm1 + hm2
  total_points: number
  has_data: boolean // true if results are confirmed (including confirmed 0 awards)
  period_id?: string
  period_year?: number
}

export interface AllTimeCampusRecord extends CampusStandingRecord {
  periods_participated: number
  best_rank: number
  best_period_name?: string
  total_golds: number
}

export interface HistoricalAggregateRecord {
  id: string
  period_id: string
  period_year: number
  period_name: string
  campus: StudentKampus | string
  jenjang?: string
  category?: string
  gold: number
  silver: number
  bronze: number
  honorable_1: number
  honorable_2: number
  source: 'imported_aggregate' | 'manual_archive'
  notes?: string
  created_at: string
}

export interface HistoricalImportLog {
  id: string
  timestamp: string
  filename: string
  operator: string
  records_imported: number
  period_name: string
  mode: 'individual_winners' | 'aggregate_campus'
  status: 'success' | 'warning' | 'failed'
  details?: string
}

export interface HallOfFameSettings {
  scoring_weights: ScoringWeights
  publication_status: Record<string, boolean> // period_id -> is_hall_of_fame_published
  import_history: HistoricalImportLog[]
  data_completeness_notes: Record<string, string>
}

export interface CampusProfileAchievement {
  period_id: string
  period_name: string
  period_year: number
  rank: number
  is_tied: boolean
  display_rank: string
  points: number
  gold: number
  silver: number
  bronze: number
  honorable_1: number
  honorable_2: number
  total_awards: number
}

export interface CampusProfileData {
  campus: StudentKampus | string
  campusSlug: string
  officialName: string
  address: string
  pic: string
  phone: string
  allTimeRank: number
  allTimePoints: number
  totalAwards: CampusAwardCounts
  totalMedals: number
  totalAwardsCount: number
  bestPerformance: {
    period_name: string
    year: number
    rank: number
    points: number
    medals: number
  } | null
  achievementsByLevel: Record<
    string,
    {
      gold: number
      silver: number
      bronze: number
      honorable_1: number
      honorable_2: number
      points: number
    }
  >
  achievementsByCategory: Record<
    string,
    {
      gold: number
      silver: number
      bronze: number
      honorable_1: number
      honorable_2: number
      points: number
    }
  >
  periodHistory: CampusProfileAchievement[]
  publishedWinners: Array<
    Pick<PeriodWinner, 'id' | 'student_name' | 'award' | 'category' | 'jenjang'> & {
      period_id: string
      period_name: string
      period_year: number
    }
  >
}

export interface HallOfFameOverviewData {
  latestPeriod: CompetitionPeriod | null
  totalPublishedPeriods: number
  totalParticipatingCampuses: number
  totalRecordedAwards: number
  topThreeCampuses: CampusStandingRecord[]
  leadingGoldCampus: {
    campus: string
    goldCount: number
    totalPoints: number
  } | null
  rankingMode: RankingMode
  archivePeriodCoverage: string
}
