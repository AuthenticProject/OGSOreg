import type { StudentJenjang } from '../../types/student'
export type { StudentJenjang }
import { normalizeJenjang } from '../dataNormalizer'
import { cloudSyncService } from '../supabase/cloudSyncService'

export const MOODLE_COURSE_MAPPING_STORAGE_KEY = 'ogsoreg_moodle_course_mappings_v2'

export interface MoodleCourseMappingConfig {
  defaultPassword?: string
  jenjangShortnames: Record<StudentJenjang, string>
  simulationShortname: string
  isVerified: boolean // Whether administrator has verified these shortnames against the target Moodle site
  lastUpdated?: string
}

/**
 * Standard default template proposals for OGSO Moodle LMS (https://ogso.gontor.ac.id/).
 * Can be freely edited by administrators to any custom password, jenjang output, or course2.
 */
export const DEFAULT_COURSE_MAPPINGS: MoodleCourseMappingConfig = {
  defaultPassword: 'ogso_2026!',
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

const listeners = new Set<(config: MoodleCourseMappingConfig) => void>()

export function subscribeCourseMappingConfig(callback: (config: MoodleCourseMappingConfig) => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function notifyCourseMappingListeners(config: MoodleCourseMappingConfig) {
  listeners.forEach((fn) => {
    try {
      fn(config)
    } catch {
      // Ignore listener error
    }
  })
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
          defaultPassword: legacyParsed.defaultPassword || DEFAULT_COURSE_MAPPINGS.defaultPassword,
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
      defaultPassword: parsed.defaultPassword || DEFAULT_COURSE_MAPPINGS.defaultPassword,
      jenjangShortnames: {
        'Jenjang 1': parsed.jenjangShortnames?.['Jenjang 1'] ?? DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 1'],
        'Jenjang 2': parsed.jenjangShortnames?.['Jenjang 2'] ?? DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 2'],
        'Jenjang 3': parsed.jenjangShortnames?.['Jenjang 3'] ?? DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 3'],
        'Jenjang 4': parsed.jenjangShortnames?.['Jenjang 4'] ?? DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 4'],
        'Jenjang 5': parsed.jenjangShortnames?.['Jenjang 5'] ?? DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Jenjang 5'],
      },
      simulationShortname: parsed.simulationShortname !== undefined ? parsed.simulationShortname : DEFAULT_COURSE_MAPPINGS.simulationShortname,
      isVerified: parsed.isVerified ?? false,
      lastUpdated: parsed.lastUpdated,
    }
  } catch {
    return { ...DEFAULT_COURSE_MAPPINGS }
  }
}

/**
 * Persists updated course mapping configuration to localStorage & cloud.
 */
export function saveCourseMappingConfig(config: MoodleCourseMappingConfig): void {
  const toSave: MoodleCourseMappingConfig = {
    ...config,
    defaultPassword: config.defaultPassword?.trim() || DEFAULT_COURSE_MAPPINGS.defaultPassword,
    lastUpdated: new Date().toISOString(),
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(MOODLE_COURSE_MAPPING_STORAGE_KEY, JSON.stringify(toSave))
  }
  cloudSyncService.saveCloudSetting('moodle_course_mappings', toSave)
  notifyCourseMappingListeners(toSave)
}

/**
 * Resets mapping configuration to factory defaults.
 */
export function resetCourseMappingConfig(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(MOODLE_COURSE_MAPPING_STORAGE_KEY)
  }
  cloudSyncService.saveCloudSetting('moodle_course_mappings', DEFAULT_COURSE_MAPPINGS)
  notifyCourseMappingListeners(DEFAULT_COURSE_MAPPINGS)
}

/**
 * Quick helper to apply a prefix or pattern to all jenjang outputs.
 * E.g., 'JENJANG' -> 'JENJANG 1', 'JENJANG 2', etc.
 * E.g., 'ogso_j{n}' -> 'ogso_j1', 'ogso_j2', etc.
 */
export function generateJenjangShortnamesFromPattern(
  patternOrPrefix: string
): Record<StudentJenjang, string> {
  const clean = patternOrPrefix.trim()
  const classes: StudentJenjang[] = ['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5']
  const result = {} as Record<StudentJenjang, string>

  classes.forEach((c, idx) => {
    const num = idx + 1
    if (clean.includes('{n}')) {
      result[c] = clean.replace(/{n}/g, String(num))
    } else if (clean.endsWith('_') || clean.endsWith('-')) {
      result[c] = `${clean}${num}`
    } else if (/[a-zA-Z0-9]$/.test(clean) && !clean.includes(' ')) {
      // E.g. 'JENJANG' -> 'JENJANG 1' (or if 'ogso_j' -> 'ogso_j1')
      if (clean.toLowerCase().endsWith('j') || clean.toLowerCase().endsWith('k')) {
        result[c] = `${clean}${num}`
      } else {
        result[c] = `${clean} ${num}`
      }
    } else {
      result[c] = `${clean} ${num}`
    }
  })

  return result
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

