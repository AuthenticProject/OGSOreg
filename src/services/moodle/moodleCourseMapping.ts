import type { StudentJenjang } from '../../types/student'

export const MOODLE_COURSE_MAPPING_STORAGE_KEY = 'ogsoreg_moodle_course_mappings_v1'

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
    'Kelas 1': 'ogso_k1',
    'Kelas 2': 'ogso_k2',
    'Kelas 3': 'ogso_k3',
    'Kelas 4': 'ogso_k4',
    'Kelas 5': 'ogso_k5',
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
    if (!raw) return { ...DEFAULT_COURSE_MAPPINGS }
    const parsed = JSON.parse(raw) as Partial<MoodleCourseMappingConfig>

    return {
      jenjangShortnames: {
        'Kelas 1': parsed.jenjangShortnames?.['Kelas 1'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Kelas 1'],
        'Kelas 2': parsed.jenjangShortnames?.['Kelas 2'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Kelas 2'],
        'Kelas 3': parsed.jenjangShortnames?.['Kelas 3'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Kelas 3'],
        'Kelas 4': parsed.jenjangShortnames?.['Kelas 4'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Kelas 4'],
        'Kelas 5': parsed.jenjangShortnames?.['Kelas 5'] || DEFAULT_COURSE_MAPPINGS.jenjangShortnames['Kelas 5'],
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
  const key = jenjang as StudentJenjang
  return activeConfig.jenjangShortnames[key] || null
}

/**
 * Validates that all classes 1-5 and simulation have non-empty shortnames.
 */
export function isCourseMappingComplete(config?: MoodleCourseMappingConfig): boolean {
  const activeConfig = config || getCourseMappingConfig()
  const classes: StudentJenjang[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5']
  const allJenjangMapped = classes.every((c) => Boolean(activeConfig.jenjangShortnames[c]?.trim()))
  const simulationMapped = Boolean(activeConfig.simulationShortname?.trim())
  return allJenjangMapped && simulationMapped
}
