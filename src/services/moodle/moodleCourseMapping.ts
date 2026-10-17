import type { StudentJenjang } from '../../types/student'
import { normalizeJenjang } from '../dataNormalizer'

export const MOODLE_COURSE_MAPPING_STORAGE_KEY = 'ogsoreg_moodle_course_mappings_v2'

export interface MoodleCourseMappingConfig {
  jenjangShortnames: Record<StudentJenjang, string>
  simulationShortname: string
  isVerified: boolean // Whether administrator has verified these shortnames against the target Moodle site
  lastUpdated?: string
}

/**
 * Standard default shortname proposals for OGSO Moodle LMS (https://ogso.gontor.ac.id/).
 * Must be verified by administrators before production deployment.
 */
export const DEFAULT_COURSE_MAPPINGS: MoodleCourseMappingConfig = {
  jenjangShortnames: {
    'Jenjang 1': 'ogso_j1',
    'Jenjang 2': 'ogso_j2',
    'Jenjang 3': 'ogso_j3',
    'Jenjang 4': 'ogso_j4',
    'Jenjang 5': 'ogso_j5',
  },
  simulationShortname: 'simulation',
  isVerified: false,
}

/**
 * Retrieves the active course mapping configuration from local storage or returns defaults.
 */
export function getCourseMappingConfig(): MoodleCourseMappingConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_COURSE_MAPPINGS }
  }

  try {
    const raw = window.localStorage.getItem(MOODLE_COURSE_MAPPING_STORAGE_KEY)
    if (!raw) {
      // Check legacy v1 key
      const legacyRaw = window.localStorage.getItem('ogsoreg_moodle_course_mappings_v1')
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw) as any
        const legacyNames = legacyParsed?.jenjangShortnames || {}
        return {
          jenjangShortnames: {
            'Jenjang 1': legacyNames['Jenjang 1'] || legacyNames['Kelas 1'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 1'],
            'Jenjang 2': legacyNames['Jenjang 2'] || legacyNames['Kelas 2'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 2'],
            'Jenjang 3': legacyNames['Jenjang 3'] || legacyNames['Kelas 3'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 3'],
            'Jenjang 4': legacyNames['Jenjang 4'] || legacyNames['Kelas 4'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 4'],
            'Jenjang 5': legacyNames['Jenjang 5'] || legacyNames['Kelas 5'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 5'],
          },
          simulationShortname: legacyParsed.simulationShortname || DEFAULT_COURSE_MAPPINGS.simulationShortname,
          isVerified: legacyParsed.isVerified ?? false,
          lastUpdated: legacyParsed.lastUpdated,
        }
      }
      return { ...DEFAULT_COURSE_MAPPINGS }
    }
    const parsed = JSON.parse(raw) as Partial<MoodleCourseMappingConfig>

    return {
      jenjangShortnames: {
        'Jenjang 1': parsed.jenjangShortnames?.['Jenjang 1'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 1'],
        'Jenjang 2': parsed.jenjangShortnames?.['Jenjang 2'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 2'],
        'Jenjang 3': parsed.jenjangShortnames?.['Jenjang 3'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 3'],
        'Jenjang 4': parsed.jenjangShortnames?.['Jenjang 4'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 4'],
        'Jenjang 5': parsed.jenjangShortnames?.['Jenjang 5'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 5'],
      },
      simulationShortname: parsed.simulationShortname || DEFAULT_COURSE_MAPPINGS.simulationShortname,
      isVerified: parsed.isVerified ?? false,
      lastUpdated: parsed.lastUpdated,
    }
  } catch {
    return { ...DEFAULT_COURSE_MAPPINGS }
  }
}

/**
 * Persists updated course mapping configuration to localStorage.
 */
export function saveCourseMappingConfig(config: MoodleCourseMappingConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  const toSave: MoodleCourseMappingConfig = {
    ...config,
    lastUpdated: new Date().toISOString(),
  }
  window.localStorage.setItem(MOODLE_COURSE_MAPPING_STORAGE_KEY, JSON.stringify(toSave))
}

/**
 * Resets mapping configuration to factory defaults.
 */
export function resetCourseMappingConfig(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.removeItem(MOODLE_COURSE_MAPPING_STORAGE_KEY)
}

/**
 * Resolves the course shortname for a specific Jenjang.
 */
export function getCourseShortnameForJenjang(
  jenjang: string,
  config?: MoodleCourseMappingConfig
): string | null {
  const activeConfig = config || getCourseMappingConfig()
  const normalized = normalizeJenjang(jenjang) as StudentJenjang
  return activeConfig.jenjangShortnames[normalized] || null
}

/**
 * Validates that all jenjang 1-5 and simulation have non-empty shortnames.
 */
export function isCourseMappingComplete(config?: MoodleCourseMappingConfig): boolean {
  const activeConfig = config || getCourseMappingConfig()
  const classes: StudentJenjang[] = ['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5']
  const allJenjangMapped = classes.every((c) => Boolean(activeConfig.jenjangShortnames[c]?.trim()))
  const simulationMapped = Boolean(activeConfig.simulationShortname?.trim())
  return allJenjangMapped && simulationMapped
}

